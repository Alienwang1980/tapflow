#!/usr/bin/env python3
"""Notarize a zip via Apple's Notary REST API — bypasses notarytool.

Why: notarytool 1.1.1 (Xcode 26.4.1) crashes with SIGBUS (Bus error: 10)
in CFStringValidateFormat during upload of multi-MB files (15/15 repro on
a 46MB zip, 2026-08-13). The REST API (App Store Connect API key JWT +
S3 SigV4 PUT) is the documented alternative.

Usage:
    python3 tools/notarize.py \\
        --zip dist/Tapflow.zip \\
        --key-id BX9CBX28UR \\
        --issuer <issuer-uuid> \\
        --p8 ~/Desktop/AuthKey_XXXX.p8

Exits 0 when notarization is Accepted. The .p8 must never be committed
to git (keep it outside the repo, e.g. ~/Desktop or ~/.private).
"""
import argparse
import base64
import hashlib
import hmac
import json
import subprocess
import sys
import time
import urllib.request
import urllib.error

API_HOST = "https://appstoreconnect.apple.com"
NOTARY_PREFIX = "/notary/v2/submissions"
REGION_GUESS = "us-west-2"


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def der_to_raw(sig: bytes) -> bytes:
    """OpenSSL 3 emits DER-encoded ECDSA sigs (70-72B); JWT needs raw r||s (64B)."""
    if sig[0] != 0x30:
        return sig  # already raw (LibreSSL-style)
    i = 2
    assert sig[i] == 0x02, "unexpected DER structure"
    rlen = sig[i + 1]; i += 2
    r = sig[i:i + rlen].lstrip(b"\x00"); i += rlen
    assert sig[i] == 0x02, "unexpected DER structure"
    slen = sig[i + 1]; i += 2
    s = sig[i:i + slen].lstrip(b"\x00")
    assert len(r) <= 32 and len(s) <= 32, "curve key is not P-256"
    return r.rjust(32, b"\x00") + s.rjust(32, b"\x00")


def make_jwt(key_id: str, issuer: str, p8_path: str) -> str:
    """Mint an ES256 App Store Connect JWT. Fresh per call (exp 10 min)."""
    header = b64url(json.dumps({"alg": "ES256", "kid": key_id, "typ": "JWT"}, separators=(",", ":")).encode())
    now = int(time.time())
    claims = b64url(json.dumps(
        {"iss": issuer, "iat": now, "exp": now + 600, "aud": "appstoreconnect-v1"},
        separators=(",", ":"),
    ).encode())
    signing_input = f"{header}.{claims}".encode()
    sig = subprocess.run(
        ["openssl", "dgst", "-sha256", "-binary", "-sign", p8_path],
        input=signing_input, capture_output=True, check=True,
    ).stdout
    return f"{header}.{claims}.{b64url(der_to_raw(sig))}"


def api_request(path: str, jwt: str, body: dict | None = None) -> dict:
    """POST/GET against the Notary API. Raises RuntimeError with server text."""
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        API_HOST + path, data=data,
        headers={
            "Authorization": f"Bearer {jwt}",
            "Content-Type": "application/json",
        },
        method="POST" if body is not None else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"API {path} -> HTTP {e.code}: {e.read().decode()[:500]}") from e


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def sigv4_headers(access_key: str, secret: str, token: str, region: str,
                  bucket: str, obj: str, payload_hash: str) -> dict:
    """AWS SigV4 signed headers for an S3 PUT object with temp credentials."""
    now = time.gmtime()
    amz_date = time.strftime("%Y%m%dT%H%M%SZ", now)
    date_stamp = time.strftime("%Y%m%d", now)
    host = f"{bucket}.s3.{region}.amazonaws.com"
    canonical_uri = "/" + obj
    canonical_headers = (
        f"host:{host}\n"
        f"x-amz-content-sha256:{payload_hash}\n"
        f"x-amz-date:{amz_date}\n"
        f"x-amz-security-token:{token}\n"
    )
    signed_headers = "host;x-amz-content-sha256;x-amz-date;x-amz-security-token"
    canonical_request = "\n".join([
        "PUT", canonical_uri, "",
        canonical_headers, signed_headers, payload_hash,
    ])
    scope = f"{date_stamp}/{region}/s3/aws4_request"
    string_to_sign = "\n".join([
        "AWS4-HMAC-SHA256", amz_date, scope,
        hashlib.sha256(canonical_request.encode()).hexdigest(),
    ])
    k_date = hmac.new(f"AWS4{secret}".encode(), date_stamp.encode(), hashlib.sha256).digest()
    k_region = hmac.new(k_date, region.encode(), hashlib.sha256).digest()
    k_service = hmac.new(k_region, b"s3", hashlib.sha256).digest()
    k_signing = hmac.new(k_service, b"aws4_request", hashlib.sha256).digest()
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()
    authorization = (
        f"AWS4-HMAC-SHA256 Credential={access_key}/{scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    return {
        "host": host,
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date,
        "x-amz-security-token": token,
        "Authorization": authorization,
    }


def s3_put(attrs: dict, zip_path: str) -> None:
    """Upload to Apple's S3 bucket via curl (binds en0 — en1 hangs on large
    uploads, same as the GitHub upload issue). Auto-corrects region from the
    x-amz-bucket-region response header."""
    import re
    from pathlib import Path
    payload_hash = sha256_file(zip_path)
    region = REGION_GUESS
    last_err = ""
    for attempt in range(4):
        h = sigv4_headers(
            attrs["awsAccessKeyId"], attrs["awsSecretAccessKey"],
            attrs["awsSessionToken"], region,
            attrs["bucket"], attrs["object"], payload_hash,
        )
        url = f"https://{h['host']}/{attrs['object']}"
        cmd = ["curl", "-sS", "--interface", "en0", "-X", "PUT",
               "-H", f"x-amz-content-sha256: {h['x-amz-content-sha256']}",
               "-H", f"x-amz-date: {h['x-amz-date']}",
               "-H", f"x-amz-security-token: {h['x-amz-security-token']}",
               "-H", f"Authorization: {h['Authorization']}",
               "-H", "Content-Type: application/octet-stream",
               "--data-binary", f"@{zip_path}",
               "-D", "/tmp/s3_headers.txt", "-o", "/tmp/s3_body.txt", url]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode == 0:
            print(f"S3 upload OK ({h['host']})")
            return
        hdr_text = Path("/tmp/s3_headers.txt").read_text() if Path("/tmp/s3_headers.txt").exists() else ""
        real = re.search(r"x-amz-bucket-region:\s*(\S+)", hdr_text, re.IGNORECASE)
        last_err = r.stderr.strip()[:200] or Path("/tmp/s3_body.txt").read_text()[:200]
        print(f"S3 attempt {attempt + 1} rc={r.returncode}: {last_err}")
        if real and real.group(1) != region:
            print(f"S3 region corrected: {region} -> {real.group(1)}")
            region = real.group(1)
        time.sleep(2)
    raise RuntimeError(f"S3 PUT failed: {last_err}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--zip", required=True, help="zip to notarize")
    ap.add_argument("--key-id", required=True)
    ap.add_argument("--issuer", required=True)
    ap.add_argument("--p8", required=True, help="path to AuthKey .p8 (never commit)")
    ap.add_argument("--poll", type=int, default=240, help="max status polls, 20s apart (default 240 = 80 min)")
    args = ap.parse_args()

    zip_name = args.zip.rsplit("/", 1)[-1]
    print(f"SHA-256 of {zip_name} ...")
    digest = sha256_file(args.zip)
    print(digest)

    jwt = make_jwt(args.key_id, args.issuer, args.p8)
    resp = api_request(NOTARY_PREFIX, jwt, {
        "submissionName": zip_name,
        "sha256": digest,
    })
    sub_id = resp["data"]["id"]
    attrs = resp["data"]["attributes"]
    print(f"Submission created: {sub_id}")

    s3_put(attrs, args.zip)

    status = "In Progress"
    for i in range(args.poll):
        time.sleep(20)
        resp = api_request(f"{NOTARY_PREFIX}/{sub_id}", make_jwt(args.key_id, args.issuer, args.p8))
        status = resp["data"]["attributes"]["status"]
        print(f"poll {i+1}: {status}")
        if status != "In Progress":
            break

    if status == "Accepted":
        resp = api_request(f"{NOTARY_PREFIX}/{sub_id}/logs", make_jwt(args.key_id, args.issuer, args.p8))
        log_url = resp["data"]["attributes"].get("developerLogUrl")
        print(f"NOTARIZED: {status}")
        if log_url:
            print(f"log: {log_url}")
        return 0

    print(f"NOTARIZATION FAILED: {status}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
