"""AX API bridge via ctypes — no pyobjc needed."""
import ctypes, ctypes.util

_as = ctypes.cdll.LoadLibrary('/System/Library/Frameworks/ApplicationServices.framework/ApplicationServices')
_cf = ctypes.cdll.LoadLibrary(ctypes.util.find_library('CoreFoundation'))

_as.AXUIElementCreateApplication.argtypes = [ctypes.c_int32]
_as.AXUIElementCreateApplication.restype = ctypes.c_void_p
_as.AXUIElementCopyAttributeValue.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.POINTER(ctypes.c_void_p)]
_as.AXUIElementCopyAttributeValue.restype = ctypes.c_int32

_cf.CFStringCreateWithCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int32]
_cf.CFStringCreateWithCString.restype = ctypes.c_void_p
_cf.CFStringGetCString.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int32, ctypes.c_int32]
_cf.CFStringGetCString.restype = ctypes.c_bool
_cf.CFRelease.argtypes = [ctypes.c_void_p]
_cf.CFArrayGetCount.argtypes = [ctypes.c_void_p]
_cf.CFArrayGetCount.restype = ctypes.c_int32
_cf.CFArrayGetValueAtIndex.argtypes = [ctypes.c_void_p, ctypes.c_int32]
_cf.CFArrayGetValueAtIndex.restype = ctypes.c_void_p

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
