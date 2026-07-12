"""AX API bridge via ctypes — no pyobjc needed."""
import ctypes, ctypes.util, subprocess

# Apps where we can get tabs via AppleScript
_TAB_AS_MAP = {
    "com.google.Chrome": 'tell app "Google Chrome" to get title of every tab of every window',
    "com.apple.Safari": 'tell app "Safari" to get name of every tab of every window',
    "com.microsoft.edgemac": 'tell app "Microsoft Edge" to get title of every tab of every window',
    "com.brave.Browser": 'tell app "Brave Browser" to get title of every tab of every window',
    "com.operasoftware.Opera": 'tell app "Opera" to get title of every tab of every window',
    "com.vivaldi.Vivaldi": 'tell app "Vivaldi" to get title of every tab of every window',
}

# AppleScript for getting tab URLs (separate from titles to avoid comma-in-title issues)
_TAB_URL_AS = {
    "com.google.Chrome": 'tell app "Google Chrome" to get URL of every tab of window {w}',
    "com.apple.Safari": 'tell app "Safari" to get URL of every tab of window {w}',
    "com.microsoft.edgemac": 'tell app "Microsoft Edge" to get URL of every tab of window {w}',
    "com.brave.Browser": 'tell app "Brave Browser" to get URL of every tab of window {w}',
    "com.operasoftware.Opera": 'tell app "Opera" to get URL of every tab of window {w}',
    "com.vivaldi.Vivaldi": 'tell app "Vivaldi" to get URL of every tab of window {w}',
}

# AppleScript for focusing a specific tab in a specific window
_AS_TAB_FOCUS = {
    "com.google.Chrome": 'tell app "Google Chrome" to set active tab index of window {w} to {t}',
    "com.microsoft.edgemac": 'tell app "Microsoft Edge" to set active tab index of window {w} to {t}',
    "com.brave.Browser": 'tell app "Brave Browser" to set active tab index of window {w} to {t}',
    "com.operasoftware.Opera": 'tell app "Opera" to set active tab index of window {w} to {t}',
    "com.vivaldi.Vivaldi": 'tell app "Vivaldi" to set active tab index of window {w} to {t}',
    "com.apple.Safari": 'tell app "Safari" to set current tab of window {w} to tab {t} of window {w}',
}

def _favicon_url(url):
    """Extract domain from URL and return Google favicon service URL."""
    if not url: return ""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc
        if domain:
            return f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
    except: pass
    return ""

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

def _clean_title(title, app_name):
    """Strip app name suffix like ' - Google Chrome' or ' — Safari'."""
    if not title or not app_name: return title or "(untitled)"
    # Try common separators
    for sep in [" — ", " - ", " – ", " – "]:
        if sep + app_name in title:
            return title[:title.rindex(sep + app_name)]
        if app_name + sep in title:
            return title[title.index(app_name + sep) + len(app_name + sep):]
    # Also try at the end
    for sep in [" — ", " - "]:
        parts = title.rsplit(sep, 1)
        if len(parts) == 2 and app_name.lower() in parts[1].lower():
            return parts[0]
    return title

def _list_tabs_in_window(bundle_id, win_elem, window_index):
    """Try to get tabs for a window. Uses AppleScript for known browsers, AX for others.
    Returns list of {title, is_focused, tab_index, icon_url}."""
    # AppleScript path for known browsers
    if bundle_id in _TAB_AS_MAP:
        as_code = _TAB_AS_MAP[bundle_id]
        wi = window_index + 1
        # Build title script for specific window
        if "every tab of every window" in as_code:
            as_code = as_code.replace("every tab of every window", f"every tab of window {wi}")
        try:
            r = subprocess.run(["osascript", "-e", as_code], capture_output=True, text=True, timeout=3)
            if r.returncode == 0 and r.stdout.strip():
                titles = [t.strip() for t in r.stdout.strip().split(", ") if t.strip()]
                # Get URLs
                urls = []
                if bundle_id in _TAB_URL_AS:
                    url_as = _TAB_URL_AS[bundle_id].format(w=wi)
                    try:
                        r3 = subprocess.run(["osascript", "-e", url_as], capture_output=True, text=True, timeout=3)
                        if r3.returncode == 0 and r3.stdout.strip():
                            urls = [u.strip() for u in r3.stdout.strip().split(", ") if u.strip()]
                    except: pass
                # Get active tab index
                active_as = as_code.replace(f"get title of every tab of window {wi}",
                                            f"get active tab index of window {wi}")
                active_idx = 0
                try:
                    r2 = subprocess.run(["osascript", "-e", active_as], capture_output=True, text=True, timeout=2)
                    if r2.returncode == 0:
                        active_idx = int(r2.stdout.strip()) - 1
                except: pass
                result = []
                for i, t in enumerate(titles):
                    icon_url = _favicon_url(urls[i]) if i < len(urls) else ""
                    result.append({
                        "title": t, "is_focused": (i == active_idx), "tab_index": i,
                        "icon_url": icon_url,
                    })
                return result
        except: pass
        return None

    # AX path for AXTabs (non-browser apps with tab controls)
    tabs_val = _get_attr(win_elem, "AXTabs")
    if tabs_val:
        count = _cf.CFArrayGetCount(tabs_val)
        if count > 0:
            tabs = []
            for i in range(count):
                tab = _cf.CFArrayGetValueAtIndex(tabs_val, i)
                if not tab: continue
                title = _pystr(_get_attr(tab, "AXTitle"))
                is_focused = _cfbool(_get_attr(tab, "AXFocused"))
                if not is_focused:
                    is_focused = _cfbool(_get_attr(tab, "AXSelected"))
                if title and title.strip():
                    tabs.append({"title": title.strip(), "is_focused": is_focused, "tab_index": i, "icon_url": ""})
            _cf.CFRelease(tabs_val)
            if tabs: return tabs
        else:
            _cf.CFRelease(tabs_val)

    # AX path for AXTabGroup (Finder, etc. — tab bar in AXChildren, not a direct attribute)
    win_children = _get_attr(win_elem, "AXChildren")
    if win_children:
        wc = _cf.CFArrayGetCount(win_children)
        tab_group = None
        for ci in range(wc):
            c = _cf.CFArrayGetValueAtIndex(win_children, ci)
            if c and _pystr(_get_attr(c, "AXRole")) == "AXTabGroup":
                tab_group = c
                break
        if tab_group:
            tab_children = _get_attr(tab_group, "AXChildren")
            _cf.CFRelease(win_children)
            if tab_children:
                tc = _cf.CFArrayGetCount(tab_children)
                tabs = []
                tab_idx = 0
                for i in range(tc):
                    child = _cf.CFArrayGetValueAtIndex(tab_children, i)
                    if not child: continue
                    role = _pystr(_get_attr(child, "AXRole"))
                    subrole = _pystr(_get_attr(child, "AXSubrole"))
                    if role != "AXRadioButton" or subrole != "AXTabButton":
                        continue
                    title = _pystr(_get_attr(child, "AXTitle"))
                    if not title or not title.strip():
                        continue
                    # Check focused via AXValue (1 = selected for radio buttons) or AXFocused
                    is_focused = _cfbool(_get_attr(child, "AXFocused"))
                    if not is_focused:
                        val = _get_attr(child, "AXValue")
                        is_focused = _cfbool(val) if val else False
                    tabs.append({"title": title.strip(), "is_focused": is_focused, "tab_index": tab_idx,
                        "icon_url": "", "icon": "folder" if bundle_id == "com.apple.finder" else ""})
                    tab_idx += 1
                _cf.CFRelease(tab_children)
                if tabs: return tabs
        else:
            _cf.CFRelease(win_children)

    return None

def get_app_items(pid, bundle_id=""):
    """Return flat list of {title, type, is_focused, item_index, window_index, tab_index}.
    Windows with tabs are expanded into individual tab items.
    Windows without tabs become single items."""
    elem = _as.AXUIElementCreateApplication(pid)
    if not elem: return []

    windows_val = _get_attr(elem, "AXWindows")
    if not windows_val: return []

    win_count = _cf.CFArrayGetCount(windows_val)
    items = []
    item_idx = 0

    for wi in range(win_count):
        win = _cf.CFArrayGetValueAtIndex(windows_val, wi)
        if not win: continue
        win_title = _pystr(_get_attr(win, "AXTitle"))
        win_focused = _cfbool(_get_attr(win, "AXFocused")) or _cfbool(_get_attr(win, "AXMain"))
        # Check for tabs first
        tabs = _list_tabs_in_window(bundle_id, win, wi)
        if tabs and len(tabs) > 0:
            for t in tabs:
                items.append({
                    "title": t["title"],
                    "type": "tab",
                    "is_focused": t["is_focused"] and win_focused,
                    "item_index": item_idx,
                    "window_index": wi,
                    "tab_index": t["tab_index"],
                    "icon_url": t.get("icon_url", ""),
                    "icon": t.get("icon", ""),
                })
                item_idx += 1
        else:
            # No tabs — list the window itself
            # Skip Finder's system-level windows (desktop, etc.)
            title = win_title or ""
            if bundle_id == "com.apple.finder" and (not title or title == "(untitled)"):
                continue
            icon = "folder" if bundle_id == "com.apple.finder" else ""
            items.append({
                "title": title or "(untitled)",
                "type": "window",
                "is_focused": win_focused,
                "item_index": item_idx,
                "window_index": wi,
                "tab_index": None,
                "icon_url": "",
                "icon": icon,
            })
            item_idx += 1

    _cf.CFRelease(windows_val)
    # Stable sort by title — AXWindows returns z-order which changes with focus
    items.sort(key=lambda it: it["title"].lower())
    for i, it in enumerate(items):
        it["item_index"] = i
    return items

def get_all_app_windows():
    """Return windows from all running user apps, grouped by app.
    Returns {apps: [{name, bundle_id, pid, icon, windows: [...]}], focused_app_idx, focused_global_idx}"""
    import AppKit
    workspace = AppKit.NSWorkspace.sharedWorkspace()
    running = workspace.runningApplications()
    # Only the frontmost app can have a truly focused window
    try:
        front_pid = workspace.frontmostApplication().processIdentifier()
    except:
        front_pid = -1
    result = []

    for app in running:
        try:
            pid = app.processIdentifier()
            name = app.localizedName() or "?"
            bundle_id = app.bundleIdentifier() or ""
            if not bundle_id:
                continue
            # Skip menu bar accessories and background daemons
            policy = app.activationPolicy()
            if policy != 0:  # NSApplicationActivationPolicyRegular only
                continue
        except:
            continue

        items = get_app_items(pid, bundle_id)
        if not items:
            continue

        # Only the frontmost app can have focused windows
        is_frontmost = (pid == front_pid)
        if not is_frontmost:
            for it in items:
                it["is_focused"] = False

        result.append({
            "name": name,
            "bundle_id": bundle_id,
            "pid": pid,
            "windows": items,
        })

    # Stable alphabetical sort — prevents layout jumping when focus changes
    result.sort(key=lambda a: a["name"].lower())

    # Assign global indices and find focused items AFTER sorting
    focused_app_idx = -1
    focused_global_idx = -1
    global_idx = 0
    for ai, app_data in enumerate(result):
        for it in app_data["windows"]:
            if it["is_focused"]:
                if focused_app_idx < 0:
                    focused_app_idx = ai
                if focused_global_idx < 0:
                    focused_global_idx = global_idx
            it["global_index"] = global_idx
            global_idx += 1

    return {"apps": result, "focused_app_idx": focused_app_idx, "focused_global_idx": focused_global_idx}

def focus_item(pid, item, bundle_id=""):
    """Focus a window or tab item. item = {window_index, tab_index, type}.
    For browser tabs, uses AppleScript to switch tabs (AX is unreliable for browser tabs)."""
    # Activate the app first (bring to front) — use open -b for reliability
    if bundle_id:
        try:
            subprocess.run(["open", "-b", bundle_id], capture_output=True, timeout=3)
        except: pass

    elem = _as.AXUIElementCreateApplication(pid)
    if not elem: return {"success": False, "error": "no app element"}

    windows_val = _get_attr(elem, "AXWindows")
    if not windows_val: return {"success": False, "error": "no windows"}

    wi = item.get("window_index", 0)
    count = _cf.CFArrayGetCount(windows_val)
    if wi >= count:
        _cf.CFRelease(windows_val)
        return {"success": False, "error": f"window index {wi} out of range"}

    win = _cf.CFArrayGetValueAtIndex(windows_val, wi)
    if not win:
        _cf.CFRelease(windows_val)
        return {"success": False, "error": "null window element"}

    # First, focus the parent window
    k_focused = _cfstr("AXFocusedWindow")
    _as.AXUIElementSetAttributeValue(elem, k_focused, win)
    _cf.CFRelease(k_focused)

    k_raise = _cfstr("AXRaise")
    _as.AXUIElementPerformAction(win, k_raise)
    _cf.CFRelease(k_raise)

    title = "(untitled)"

    # If it's a tab, select it via AppleScript (preferred for browsers) or AXPress fallback
    if item.get("type") == "tab" and item.get("tab_index") is not None:
        ti = item["tab_index"]
        # AppleScript path for known browsers (tab index is 0-based, AS is 1-based)
        if bundle_id and bundle_id in _AS_TAB_FOCUS:
            as_code = _AS_TAB_FOCUS[bundle_id].format(w=wi + 1, t=ti + 1)
            try:
                r = subprocess.run(["osascript", "-e", as_code], capture_output=True, text=True, timeout=3)
                if r.returncode == 0:
                    title = item.get("title", "(untitled)")
                    _cf.CFRelease(windows_val)
                    return {"success": True, "title": title}
            except: pass

        # AXPress fallback for non-browser apps
        tabs_val = _get_attr(win, "AXTabs")
        if tabs_val:
            tc = _cf.CFArrayGetCount(tabs_val)
            if ti < tc:
                tab = _cf.CFArrayGetValueAtIndex(tabs_val, ti)
                if tab:
                    title = _pystr(_get_attr(tab, "AXTitle")) or "(untitled)"
                    k_press = _cfstr("AXPress")
                    _as.AXUIElementPerformAction(tab, k_press)
                    _cf.CFRelease(k_press)
            _cf.CFRelease(tabs_val)
            _cf.CFRelease(windows_val)
            return {"success": True, "title": title}

        # AXTabGroup fallback (Finder tabs — AXRadioButton[AXTabButton] in tab bar children)
        win_children = _get_attr(win, "AXChildren")
        if win_children:
            wc = _cf.CFArrayGetCount(win_children)
            for ci in range(wc):
                c = _cf.CFArrayGetValueAtIndex(win_children, ci)
                if c and _pystr(_get_attr(c, "AXRole")) == "AXTabGroup":
                    tab_children = _get_attr(c, "AXChildren")
                    if tab_children:
                        tc = _cf.CFArrayGetCount(tab_children)
                        found_idx = 0
                        for tci in range(tc):
                            tc_child = _cf.CFArrayGetValueAtIndex(tab_children, tci)
                            if not tc_child: continue
                            if _pystr(_get_attr(tc_child, "AXSubrole")) != "AXTabButton": continue
                            if found_idx == ti:
                                title = _pystr(_get_attr(tc_child, "AXTitle")) or "(untitled)"
                                k_press = _cfstr("AXPress")
                                _as.AXUIElementPerformAction(tc_child, k_press)
                                _cf.CFRelease(k_press)
                                _cf.CFRelease(tab_children)
                                _cf.CFRelease(win_children)
                                _cf.CFRelease(windows_val)
                                return {"success": True, "title": title}
                            found_idx += 1
                        _cf.CFRelease(tab_children)
                    break
            _cf.CFRelease(win_children)

        title = item.get("title", "(untitled)")
    else:
        title = _pystr(_get_attr(win, "AXTitle")) or "(untitled)"

    _cf.CFRelease(windows_val)
    return {"success": True, "title": title}

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
