"""AX API bridge via ctypes — no pyobjc needed."""
import ctypes, ctypes.util

_as = ctypes.cdll.LoadLibrary('/System/Library/Frameworks/ApplicationServices.framework/ApplicationServices')
_cf = ctypes.cdll.LoadLibrary(ctypes.util.find_library('CoreFoundation'))

# ── AX functions ──
_as.AXUIElementCreateApplication.argtypes = [ctypes.c_int32]
_as.AXUIElementCreateApplication.restype = ctypes.c_void_p
_as.AXUIElementCopyAttributeValue.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.POINTER(ctypes.c_void_p)]
_as.AXUIElementCopyAttributeValue.restype = ctypes.c_int32
_as.AXUIElementPerformAction.argtypes = [ctypes.c_void_p, ctypes.c_void_p]
_as.AXUIElementPerformAction.restype = ctypes.c_int32
_as.AXUIElementSetAttributeValue.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p]
_as.AXUIElementSetAttributeValue.restype = ctypes.c_int32

# ── CF functions ──
_cf.CFStringCreateWithCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int32]
_cf.CFStringCreateWithCString.restype = ctypes.c_void_p
_cf.CFStringGetCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int32, ctypes.c_int32]
_cf.CFStringGetCString.restype = ctypes.c_bool
_cf.CFRelease.argtypes = [ctypes.c_void_p]
_cf.CFArrayGetCount.argtypes = [ctypes.c_void_p]
_cf.CFArrayGetCount.restype = ctypes.c_int32
_cf.CFArrayGetValueAtIndex.argtypes = [ctypes.c_void_p, ctypes.c_int32]
_cf.CFArrayGetValueAtIndex.restype = ctypes.c_void_p
_cf.CFBooleanGetValue.argtypes = [ctypes.c_void_p]
_cf.CFBooleanGetValue.restype = ctypes.c_bool
_cf.CFGetTypeID.argtypes = [ctypes.c_void_p]
_cf.CFGetTypeID.restype = ctypes.c_ulong
_cf.CFNumberGetValue.argtypes = [ctypes.c_void_p, ctypes.c_int32, ctypes.c_void_p]
_cf.CFNumberGetValue.restype = ctypes.c_bool

def _cfstr(s):
    return _cf.CFStringCreateWithCString(None, s.encode('utf-8'), 0x08000100)

def _pystr(cf_val):
    if not cf_val: return ""
    buf = ctypes.create_string_buffer(1024)
    if _cf.CFStringGetCString(cf_val, buf, 1024, 0x08000100):
        return buf.value.decode('utf-8')
    return ""

def _get_attr(elem, attr_name):
    k = _cfstr(attr_name)
    result = ctypes.c_void_p()
    err = _as.AXUIElementCopyAttributeValue(elem, k, ctypes.byref(result))
    _cf.CFRelease(k)
    if err != 0 or not result.value: return None
    return result.value

_kCFNumberIntType = 9  # kCFNumberSInt32Type

def _cfbool(cf_val):
    """Extract Python bool from CFBoolean."""
    if not cf_val: return False
    return _cf.CFBooleanGetValue(cf_val)

def get_app_windows(pid):
    """Return [{title, is_main, is_focused, index}] for all windows of app pid."""
    elem = _as.AXUIElementCreateApplication(pid)
    if not elem: return []

    windows_val = _get_attr(elem, "AXWindows")
    if not windows_val: return []

    count = _cf.CFArrayGetCount(windows_val)
    windows = []
    for i in range(count):
        win = _cf.CFArrayGetValueAtIndex(windows_val, i)
        if not win: continue
        title = _pystr(_get_attr(win, "AXTitle"))
        is_main = _cfbool(_get_attr(win, "AXMain"))
        is_focused = _cfbool(_get_attr(win, "AXFocused"))
        # Try to get window role for filtering (exclude menu bar items etc)
        role = _pystr(_get_attr(win, "AXRole"))
        if role not in ("AXWindow", "AXStandardWindow", ""):
            # Only include actual windows
            if role and "Window" not in role:
                continue
        windows.append({
            "title": title or "(untitled)",
            "is_main": is_main,
            "is_focused": is_focused,
            "index": i,
        })

    _cf.CFRelease(windows_val)
    return windows

def focus_window(pid, window_idx):
    """Bring window at index to front. Returns {success, title}."""
    elem = _as.AXUIElementCreateApplication(pid)
    if not elem: return {"success": False, "error": "no app element"}

    windows_val = _get_attr(elem, "AXWindows")
    if not windows_val: return {"success": False, "error": "no windows"}

    count = _cf.CFArrayGetCount(windows_val)
    if window_idx < 0 or window_idx >= count:
        _cf.CFRelease(windows_val)
        return {"success": False, "error": f"index {window_idx} out of range (0-{count-1})"}

    win = _cf.CFArrayGetValueAtIndex(windows_val, window_idx)
    if not win:
        _cf.CFRelease(windows_val)
        return {"success": False, "error": "null window element"}

    title = _pystr(_get_attr(win, "AXTitle")) or "(untitled)"

    # Strategy: set AXFocusedWindow on app + AXRaise on window
    k_focused = _cfstr("AXFocusedWindow")
    err1 = _as.AXUIElementSetAttributeValue(elem, k_focused, win)
    _cf.CFRelease(k_focused)

    k_raise = _cfstr("AXRaise")
    err2 = _as.AXUIElementPerformAction(win, k_raise)
    _cf.CFRelease(k_raise)

    _cf.CFRelease(windows_val)

    ok = (err1 == 0)
    return {"success": ok, "title": title, "set_focused": err1, "raise": err2}

def get_current_app_info():
    import AppKit
    a = AppKit.NSWorkspace.sharedWorkspace().frontmostApplication()
    return a.localizedName(), a.processIdentifier()

def get_menu_items(menu_elem):
    children = _get_attr(menu_elem, "AXChildren")
    if not children: return []
    count = _cf.CFArrayGetCount(children)
    items = []
    for i in range(count):
        child = _cf.CFArrayGetValueAtIndex(children, i)
        if not child: continue
        title = _pystr(_get_attr(child, "AXTitle"))
        cmd = _pystr(_get_attr(child, "AXMenuItemCmdChar"))
        if title.strip():
            items.append({"title": title.strip(), "shortcut": cmd or None})
    _cf.CFRelease(children)
    return items

def get_all_menus(pid):
    elem = _as.AXUIElementCreateApplication(pid)
    if not elem: return []
    menu_bar = _get_attr(elem, "AXMenuBar")
    if not menu_bar: return []
    
    bar_items = _get_attr(menu_bar, "AXChildren")
    if not bar_items: return []
    count = _cf.CFArrayGetCount(bar_items)
    
    menus = []
    for i in range(count):
        bar_item = _cf.CFArrayGetValueAtIndex(bar_items, i)
        if not bar_item: continue
        title = _pystr(_get_attr(bar_item, "AXTitle"))
        if not title: continue
        sub_children = _get_attr(bar_item, "AXChildren")
        if sub_children and _cf.CFArrayGetCount(sub_children) > 0:
            menu_child = _cf.CFArrayGetValueAtIndex(sub_children, 0)
            if menu_child:
                items = get_menu_items(menu_child)
                if items:
                    menus.append({"menu": title, "items": items})
        if sub_children: _cf.CFRelease(sub_children)
    
    _cf.CFRelease(bar_items)
    return menus
