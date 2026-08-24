"""Per-day DeepSeek spend ledger — midnight-snapshot based.

DeepSeek has no per-day usage API, so today's spend is derived from balance
deltas: spend = (balance snapshot at local midnight) - (current balance).
The snapshot resets at local midnight, or whenever the balance grows
(top-up), so spend never goes negative.
"""

import json
import logging
import os
import threading
import time

logger = logging.getLogger("stp.spend")

SNAPSHOT_PATH = os.path.expanduser(
    "~/Library/Application Support/Tapflow/balance_snapshots.json")

_LOCK = threading.Lock()


def _read():
    try:
        with open(SNAPSHOT_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _write(snaps):
    try:
        os.makedirs(os.path.dirname(SNAPSHOT_PATH), exist_ok=True)
        tmp = SNAPSHOT_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(snaps, f)
        os.replace(tmp, SNAPSHOT_PATH)
    except Exception as e:
        logger.warning("Balance snapshot save failed: %s", e)


def today_spent(profile, key_id, total, now_epoch=None):
    """Spend today in the balance currency. total = current total_balance.

    Returns 0.0 on the first call of a day (or after a top-up), else
    snapshot - current total."""
    now = now_epoch if now_epoch is not None else time.time()
    today = time.strftime("%Y-%m-%d", time.localtime(now))
    with _LOCK:
        snaps = _read()
        key = f"{profile}|{key_id}"
        snap = snaps.get(key)
        if not snap or snap.get("date") != today \
                or float(snap.get("total") or 0) < total:
            snaps[key] = {"date": today, "total": total}
            _write(snaps)
            return 0.0
        return round(float(snap["total"]) - total, 4)
