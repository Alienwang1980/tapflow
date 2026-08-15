"""IME engine — read/switch macOS keyboard input sources via the Carbon TIS API.

Implemented with ctypes against the system Carbon/CoreFoundation frameworks so
the frozen py2app bundle needs no extra binaries and no accessibility permission
(TIS is a public API; TISSelectInputSource does not require AX trust).
"""

import ctypes
import logging
import threading
from ctypes import c_bool, c_int, c_long, c_void_p

logger = logging.getLogger("stp.tray")

KCF_STRING_ENCODING_UTF8 = 0x08000100

_carbon = None
_cf = None
_load_lock = threading.Lock()


def _load():
    """Load frameworks and bind all ctypes signatures exactly once."""
    global _carbon, _cf
    if _carbon is not None:
        return _carbon, _cf
    with _load_lock:
        if _carbon is not None:
            return _carbon, _cf
        try:
            carbon = ctypes.cdll.LoadLibrary(
                "/System/Library/Frameworks/Carbon.framework/Carbon")
            cf = ctypes.cdll.LoadLibrary(
                "/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation")
        except OSError as e:
            logger.error("IME engine: failed to load Carbon/CoreFoundation: %s", e)
            return None, None

        carbon.TISCreateInputSourceList.argtypes = [c_void_p, c_bool]
        carbon.TISCreateInputSourceList.restype = c_void_p
        carbon.TISCopyCurrentKeyboardInputSource.argtypes = []
        carbon.TISCopyCurrentKeyboardInputSource.restype = c_void_p
        carbon.TISGetInputSourceProperty.argtypes = [c_void_p, c_void_p]
        carbon.TISGetInputSourceProperty.restype = c_void_p
        carbon.TISSelectInputSource.argtypes = [c_void_p]
        carbon.TISSelectInputSource.restype = c_int

        cf.CFArrayGetCount.argtypes = [c_void_p]
        cf.CFArrayGetCount.restype = c_long
        cf.CFArrayGetValueAtIndex.argtypes = [c_void_p, c_long]
        cf.CFArrayGetValueAtIndex.restype = c_void_p
        cf.CFStringGetLength.argtypes = [c_void_p]
        cf.CFStringGetLength.restype = c_long
        cf.CFStringGetCString.argtypes = [c_void_p, ctypes.c_char_p, c_long, ctypes.c_uint32]
        cf.CFStringGetCString.restype = c_bool
        cf.CFGetTypeID.argtypes = [c_void_p]
        cf.CFGetTypeID.restype = c_void_p
        cf.CFBooleanGetTypeID.restype = c_void_p
        cf.CFBooleanGetValue.argtypes = [c_void_p]
        cf.CFBooleanGetValue.restype = c_bool
        cf.CFRelease.argtypes = [c_void_p]
        cf.CFRelease.restype = None

        _carbon, _cf = carbon, cf
        return carbon, cf


def _sym(symbol):
    """Resolve an exported CFString constant from Carbon as a raw pointer int."""
    return c_void_p.in_dll(_carbon, symbol).value


def _prop(src_ref, symbol):
    carbon, _ = _load()
    if carbon is None:
        return None
    return carbon.TISGetInputSourceProperty(src_ref, _sym(symbol))


def _cfstr_to_py(ptr):
    """Convert a CFStringRef to Python str, or None on failure."""
    if not ptr:
        return None
    _, cf = _load()
    length = cf.CFStringGetLength(ptr)
    buf = ctypes.create_string_buffer(length * 4 + 1)
    if not cf.CFStringGetCString(ptr, buf, len(buf), KCF_STRING_ENCODING_UTF8):
        return None
    return buf.value.decode("utf-8")


def _cfbool(ptr):
    """Convert a CFBooleanRef to Python bool, or None if not a boolean."""
    if not ptr:
        return None
    _, cf = _load()
    if cf.CFGetTypeID(ptr) != cf.CFBooleanGetTypeID():
        return None
    return bool(cf.CFBooleanGetValue(ptr))


_gui_probe_done = False
_gui_running = False
_gui_probe_lock = threading.Lock()


def _probe_gui():
    """Detect whether an NSApplication run loop is active in this process.

    In a GUI app bundle (pystray runs NSApplication on the main thread),
    HIToolbox's TSM layer asserts every TIS call happens on the main queue —
    calling TISGetInputSourceProperty from a thread-pool thread crashes the
    whole process with SIGTRAP (_dispatch_assert_queue_fail, observed
    2026-08-15 in the py2app bundle). Plain CLI processes (dev server) have no
    NSApplication and no assertion, so TIS can be called directly.
    """
    global _gui_probe_done, _gui_running
    if _gui_probe_done:
        return _gui_running
    with _gui_probe_lock:
        if not _gui_probe_done:
            try:
                from AppKit import NSApplication
                _gui_running = bool(NSApplication.sharedApplication().isRunning())
            except Exception as e:  # noqa: BLE001 — probe must never kill IME
                logger.warning("IME engine: GUI probe failed, assuming CLI: %s", e)
                _gui_running = False
            _gui_probe_done = True
    return _gui_running


def _call_on_main(fn):
    """Run fn on the main thread when a GUI run loop is active, else inline.

    dispatch via NSOperationQueue.mainQueue, which the NSApplication run loop
    drains. Guarded by isMainThread so callers already on the main thread
    (e.g. cycle() calling select()) never self-deadlock.
    """
    if not _probe_gui():
        return fn()
    from Foundation import NSThread
    if NSThread.isMainThread():
        return fn()
    from Foundation import NSOperationQueue
    result = {}
    done = threading.Event()

    def block():
        try:
            result["v"] = fn()
        except Exception as e:  # noqa: BLE001 — re-raised on the caller thread
            result["e"] = e
        finally:
            done.set()

    NSOperationQueue.mainQueue().addOperationWithBlock_(block)
    if not done.wait(5):
        raise RuntimeError("IME engine: main-thread dispatch timed out")
    if "e" in result:
        raise result["e"]
    return result.get("v")


def _iter_keyboard_sources():
    """Yield raw TISInputSourceRef for all keyboard input sources."""
    carbon, cf = _load()
    if carbon is None:
        return
    arr = carbon.TISCreateInputSourceList(None, False)
    if not arr:
        return
    try:
        cat_ref = _sym("kTISCategoryKeyboardInputSource")
        for i in range(cf.CFArrayGetCount(arr)):
            src = cf.CFArrayGetValueAtIndex(arr, i)
            cat = carbon.TISGetInputSourceProperty(src, _sym("kTISPropertyInputSourceCategory"))
            if cat and cat_ref and cat == cat_ref:
                yield src
    finally:
        cf.CFRelease(arr)


def _source_info(src_ref):
    """Extract {id, name} from a raw source ref."""
    name = _cfstr_to_py(_prop(src_ref, "kTISPropertyLocalizedName"))
    sid = _cfstr_to_py(_prop(src_ref, "kTISPropertyInputSourceID"))
    if not sid:
        return None
    return {"id": sid, "name": name or sid}


def list_selectable():
    """Return enabled, selectable keyboard input sources as [{id, name}]."""
    return _call_on_main(_list_selectable)


def _list_selectable():
    sources = []
    for src in _iter_keyboard_sources():
        if not _cfbool(_prop(src, "kTISPropertyInputSourceIsSelectCapable")):
            continue
        if not _cfbool(_prop(src, "kTISPropertyInputSourceIsEnabled")):
            continue
        info = _source_info(src)
        if info:
            sources.append(info)
    return sources


def current():
    """Return the current keyboard input source as {id, name}, or None."""
    return _call_on_main(_current)


def _current():
    carbon, cf = _load()
    if carbon is None:
        return None
    cur = carbon.TISCopyCurrentKeyboardInputSource()
    if not cur:
        return None
    try:
        return _source_info(cur)
    finally:
        cf.CFRelease(cur)


def select(source_id):
    """Select a keyboard input source by id. Returns True on success."""
    return _call_on_main(lambda: _select(source_id))


def _select(source_id):
    """Select by id. Must call TISSelectInputSource while the
    TISCreateInputSourceList array is still alive — CFRelease'ing it first
    leaves the source ref dangling (crash)."""
    carbon, _ = _load()
    if carbon is None:
        return False
    for src in _iter_keyboard_sources():
        if _cfstr_to_py(_prop(src, "kTISPropertyInputSourceID")) == source_id:
            return carbon.TISSelectInputSource(src) == 0
    logger.warning("IME engine: unknown input source id: %s", source_id)
    return False


def cycle():
    """Switch to the next enabled input source. Returns the new {id, name}."""
    return _call_on_main(_cycle)


def _cycle():
    sources = list_selectable()
    if not sources:
        logger.warning("IME engine: no selectable input sources")
        return None
    cur = current()
    ids = [s["id"] for s in sources]
    if cur and cur["id"] in ids:
        nxt = sources[(ids.index(cur["id"]) + 1) % len(sources)]
    else:
        nxt = sources[0]
    if select(nxt["id"]):
        return nxt
    return None
