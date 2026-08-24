"""DeepSeek API pricing — official price tables (CNY + USD) + peak/off-peak period.

Sources (fetched periodically; table structure verified 2026-08-24):
  CNY: https://api-docs.deepseek.com/zh-cn/quick_start/pricing  ("0.05元")
  USD: https://api-docs.deepseek.com/quick_start/pricing          ("$0.007")
Both tables are official — no external FX source needed. The implied
CNY/USD exchange rate is derived from the two official tables (out-price
ratio). Last known tables are cached to
~/Library/Application Support/Tapflow/deepseek_pricing.json so a fetch
failure never blanks the panel.
"""

import json
import logging
import os
import re
import threading
import time
import urllib.request

logger = logging.getLogger("stp.pricing")

PRICING_URLS = {
    "CNY": "https://api-docs.deepseek.com/zh-cn/quick_start/pricing",
    "USD": "https://api-docs.deepseek.com/quick_start/pricing",
}
CACHE_PATH = os.path.expanduser(
    "~/Library/Application Support/Tapflow/deepseek_pricing.json")
REFRESH_INTERVAL = 6 * 3600
FETCH_TIMEOUT = 20
_USER_AGENT = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
               "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# Prices per 1M tokens, verified from the official pages on 2026-08-24.
# {currency: {model: {"off_peak"|"peak": {"hit"|"miss"|"out": float}}}}
DEFAULT_TABLES = {
    "CNY": {
        "deepseek-v4-pro": {
            "off_peak": {"hit": 0.15, "miss": 4.5, "out": 13.5},
            "peak": {"hit": 0.30, "miss": 9.0, "out": 27.0},
        },
        "deepseek-v4-flash": {
            "off_peak": {"hit": 0.05, "miss": 1.5, "out": 4.5},
            "peak": {"hit": 0.10, "miss": 3.0, "out": 9.0},
        },
        "deepseek-v4-flash-vision-exp": {
            "off_peak": {"hit": 0.05, "miss": 1.5, "out": 4.5},
            "peak": {"hit": 0.10, "miss": 3.0, "out": 9.0},
        },
    },
    "USD": {
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
    },
}

# Peak hours: 01:00-04:00 and 06:00-10:00 UTC, Monday through Friday
# (all other hours are off-peak). Windows are [start, end) hours UTC.
# The Chinese page states it as Beijing time Mon-Fri 9-12 / 14-18 — identical.
_PEAK_WINDOWS = ((1, 4), (6, 10))

_HEADER_RE = re.compile(r"<tr[^>]*>(?:(?!</tr>).)*?(?:MODEL|模型)(?:(?!</tr>).)*?</tr>",
                        re.S | re.I)
_ROW_RE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S)
_CELL_RE = re.compile(r"<t[hd][^>]*>(.*?)</t[hd]>", re.S | re.I)
_TAG_RE = re.compile(r"<[^>]+>")

_lock = threading.Lock()
_tables = None  # lazy: None until first load, then never None
_as_of = 0.0
_thread = None


def parse_table(html):
    """Parse one official pricing page into
    (prices, currency) where prices =
    {model: {"off_peak"|"peak": {"hit"|"miss"|"out": float}}}
    and currency is 'CNY' (元 values) or 'USD' ($ values).
    Returns (None, None) when the structure does not match."""
    hm = _HEADER_RE.search(html)
    if not hm:
        return None, None
    model_names = [m.lower()
                   for m in re.findall(r"deepseek-v4-[\w-]+", hm.group(0))]
    if len(model_names) < 2:
        return None, None
    prices = {m: {"off_peak": {}, "peak": {}} for m in model_names}
    kind = None  # carries across rows: the PEAK row repeats only the values
    currency = None
    for row in _ROW_RE.findall(html):
        cells = [_TAG_RE.sub("", c).strip() for c in _CELL_RE.findall(row)]
        if not cells:
            continue
        joined = " ".join(cells).upper()
        if "OUTPUT" in joined or "输出" in joined:
            kind = "out"
        elif "CACHE HIT" in joined or "缓存命中" in joined:
            kind = "hit"
        elif "CACHE MISS" in joined or "缓存未命中" in joined:
            kind = "miss"
        if kind is None:
            continue
        if "OFF" in joined or "空闲" in joined:
            period = "off_peak"
        elif "PEAK" in joined or "高峰" in joined:
            period = "peak"
        else:
            continue
        values = []
        for c in cells:
            m = re.match(r"(\d+(?:\.\d+)?)元", c)
            if m:
                values.append((float(m.group(1)), "CNY"))
                continue
            m = re.match(r"\$(\d+(?:\.\d+)?)", c)
            if m:
                values.append((float(m.group(1)), "USD"))
        if len(values) != len(model_names):
            return None, None
        cur = values[0][1]
        if currency is None:
            currency = cur
        if currency != cur or any(v[1] != cur for v in values):
            return None, None  # mixed currencies = broken page
        for i, (v, _) in enumerate(values):
            prices[model_names[i]][period][kind] = v
    for m in model_names:
        for p in ("off_peak", "peak"):
            if sorted(prices[m][p]) != ["hit", "miss", "out"]:
                return None, None
    return prices, currency


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
    """Read the cached tables; corrupt/missing/legacy cache → built-in defaults."""
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        tables = data.get("tables")
        if isinstance(tables, dict) and all(
                c in tables for c in ("CNY", "USD")):
            return tables, float(data.get("as_of") or 0)
    except Exception:
        pass
    return {c: dict(t) for c, t in DEFAULT_TABLES.items()}, 0.0


def _save_cache(tables):
    try:
        os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
        tmp = CACHE_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"tables": tables, "as_of": time.time()}, f)
        os.replace(tmp, CACHE_PATH)
    except Exception as e:
        logger.warning("Pricing cache save failed: %s", e)


def get_tables():
    """Current tables {currency: {model: ...}} (cache-backed, defaults as floor).
    Never None."""
    global _tables, _as_of
    with _lock:
        if _tables is None:
            _tables, _as_of = _load_cache()
        return {c: dict(t) for c, t in _tables.items()}


def refresh():
    """Fetch both official pages and adopt any parsed tables.
    Returns True when a new table was adopted (False = unchanged or failed)."""
    global _tables, _as_of
    fetched = {}
    for cur, url in PRICING_URLS.items():
        try:
            req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
            html = urllib.request.urlopen(req, timeout=FETCH_TIMEOUT).read().decode("utf-8", "replace")
            prices, parsed_cur = parse_table(html)
            if prices and parsed_cur == cur:
                fetched[cur] = prices
            else:
                logger.warning("Pricing page %s parse failed — keeping cached table", cur)
        except Exception as e:
            logger.warning("Pricing fetch failed (%s): %s", cur, e)
    if not fetched:
        return False
    with _lock:
        # 注意: _lock 不可重入,不能在此调用 get_tables();_load_cache 纯读、无锁。
        # 内存未初始化时以磁盘缓存为对比基线(而非默认表),否则磁盘旧缓存
        # 与官方表无差异时漏检变化。
        if _tables is None:
            merged, _ = _load_cache()
        else:
            merged = {c: dict(t) for c, t in _tables.items()}
        changed = False
        for cur, prices in fetched.items():
            if prices != merged.get(cur):
                merged[cur] = prices
                changed = True
        _tables = merged
        _as_of = time.time()
        if changed or not os.path.exists(CACHE_PATH):
            _save_cache(merged)
            if changed:
                logger.info("Pricing tables updated (from official pages)")
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


def exchange_rate(tables=None):
    """Implied CNY-per-USD rate from the two official tables (pro out-price ratio)."""
    tables = tables or get_tables()
    try:
        cny = tables["CNY"]["deepseek-v4-pro"]["peak"]["out"]
        usd = tables["USD"]["deepseek-v4-pro"]["peak"]["out"]
        if usd > 0:
            return cny / usd
    except Exception:
        pass
    return 0.0


def snapshot():
    """Everything a client needs: period, tables, implied rate, freshness."""
    tables = get_tables()
    return {"period": current_period(), "tables": tables,
            "rate": round(exchange_rate(tables), 4), "as_of": _as_of}
