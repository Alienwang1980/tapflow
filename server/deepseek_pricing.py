"""DeepSeek API pricing — official price table fetch + peak/off-peak period.

Source: https://api-docs.deepseek.com/quick_start/pricing (fetched periodically;
page table structure verified 2026-08-24). Last known table is cached to
~/Library/Application Support/Tapflow/deepseek_pricing.json so a fetch failure
never blanks the panel.
"""

import json
import logging
import os
import re
import threading
import time
import urllib.request

logger = logging.getLogger("stp.pricing")

PRICING_URL = "https://api-docs.deepseek.com/quick_start/pricing"
CACHE_PATH = os.path.expanduser(
    "~/Library/Application Support/Tapflow/deepseek_pricing.json")
REFRESH_INTERVAL = 6 * 3600
FETCH_TIMEOUT = 20
_USER_AGENT = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
               "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# Prices in USD per 1M tokens, verified from the official page on 2026-08-24.
# {model: {"off_peak"|"peak": {"hit"|"miss"|"out": float}}}
DEFAULT_PRICES = {
    "deepseek-v4-pro": {
        "off_peak": {"hit": 0.022, "miss": 0.66, "out": 1.98},
        "peak": {"hit": 0.044, "miss": 1.32, "out": 3.96},
    },
    "deepseek-v4-flash": {
        "off_peak": {"hit": 0.007, "miss": 0.22, "out": 0.66},
        "peak": {"hit": 0.014, "miss": 0.44, "out": 1.32},
    },
    "deepseek-v4-flash-vision-exp": {
        "off_peak": {"hit": 0.007, "miss": 0.22, "out": 0.66},
        "peak": {"hit": 0.014, "miss": 0.44, "out": 1.32},
    },
}

# Peak hours: 01:00-04:00 and 06:00-10:00 UTC, Monday through Friday
# (all other hours are off-peak). Windows are [start, end) hours UTC.
_PEAK_WINDOWS = ((1, 4), (6, 10))

_HEADER_RE = re.compile(r"<tr[^>]*>(?:(?!</tr>).)*?MODEL(?:(?!</tr>).)*?</tr>",
                        re.S | re.I)
_ROW_RE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S)
_CELL_RE = re.compile(r"<t[hd][^>]*>(.*?)</t[hd]>", re.S | re.I)
_TAG_RE = re.compile(r"<[^>]+>")

_lock = threading.Lock()
_prices = None  # lazy: None until first load, then never None
_as_of = 0.0
_thread = None


def parse_table(html):
    """Parse the official pricing page HTML into
    {model: {"off_peak"|"peak": {"hit"|"miss"|"out": float}}}.
    Returns None when the structure does not match (page redesigned)."""
    hm = _HEADER_RE.search(html)
    if not hm:
        return None
    model_names = [m.lower()
                   for m in re.findall(r"deepseek-v4-[\w-]+", hm.group(0))]
    if len(model_names) < 2:
        return None
    prices = {m: {"off_peak": {}, "peak": {}} for m in model_names}
    kind = None  # carries across rows: the PEAK row repeats only the values
    for row in _ROW_RE.findall(html):
        cells = [_TAG_RE.sub("", c).strip() for c in _CELL_RE.findall(row)]
        if not cells:
            continue
        joined = " ".join(cells).upper()
        if "OUTPUT TOKENS" in joined:
            kind = "out"
        elif "INPUT TOKENS" in joined and "CACHE HIT" in joined:
            kind = "hit"
        elif "INPUT TOKENS" in joined and "CACHE MISS" in joined:
            kind = "miss"
        if kind is None or "PEAK" not in joined:
            continue
        period = "off_peak" if "OFF-PEAK" in joined else "peak"
        values = []
        for c in cells:
            m = re.match(r"\$(\d+(?:\.\d+)?)", c)
            if m:
                values.append(float(m.group(1)))
        if len(values) != len(model_names):
            return None
        for i, v in enumerate(values):
            prices[model_names[i]][period][kind] = v
    for m in model_names:
        for p in ("off_peak", "peak"):
            if sorted(prices[m][p]) != ["hit", "miss", "out"]:
                return None
    return prices


def current_period(t=None):
    """Return 'peak' or 'off_peak' for the given UTC time (time.struct_time);
    None → now."""
    t = t or time.gmtime()
    if t.tm_wday < 5:  # 0=Mon .. 4=Fri; weekends are always off-peak
        hour = t.tm_hour
        for start, end in _PEAK_WINDOWS:
            if start <= hour < end:
                return "peak"
    return "off_peak"


def _load_cache():
    """Read the cached table; corrupt/missing cache → built-in defaults."""
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        prices = data.get("prices")
        if isinstance(prices, dict) and prices:
            return prices, float(data.get("as_of") or 0)
    except Exception:
        pass
    return dict(DEFAULT_PRICES), 0.0


def _save_cache(prices):
    try:
        os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
        tmp = CACHE_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"prices": prices, "as_of": time.time()}, f)
        os.replace(tmp, CACHE_PATH)
    except Exception as e:
        logger.warning("Pricing cache save failed: %s", e)


def get_prices():
    """Current price table (cache-backed, built-in defaults as floor). Never None."""
    global _prices, _as_of
    with _lock:
        if _prices is None:
            _prices, _as_of = _load_cache()
        return dict(_prices)


def refresh():
    """Fetch the official page and adopt the parsed table when it changed.
    Returns True when a new table was adopted (False = unchanged or failed)."""
    global _prices, _as_of
    try:
        req = urllib.request.Request(PRICING_URL, headers={"User-Agent": _USER_AGENT})
        html = urllib.request.urlopen(req, timeout=FETCH_TIMEOUT).read().decode("utf-8", "replace")
        parsed = parse_table(html)
    except Exception as e:
        logger.warning("Pricing fetch failed: %s", e)
        return False
    if not parsed:
        logger.warning("Pricing page parse failed — keeping current table")
        return False
    with _lock:
        changed = parsed != _prices  # first refresh (_prices None) also counts
        _prices = parsed
        _as_of = time.time()
        if changed or not os.path.exists(CACHE_PATH):
            _save_cache(parsed)
            if changed:
                logger.info("Pricing table updated (from official page)")
    return bool(changed)


def _loop():
    refresh()
    while True:
        time.sleep(REFRESH_INTERVAL)
        refresh()


def start():
    """Start the background refresh loop (idempotent; called once at startup)."""
    global _thread
    with _lock:
        if _thread and _thread.is_alive():
            return
        _thread = threading.Thread(target=_loop, daemon=True, name="ds-pricing")
        _thread.start()


def snapshot():
    """Everything a client needs: current period + table + freshness epoch."""
    return {"period": current_period(), "prices": get_prices(), "as_of": _as_of}
