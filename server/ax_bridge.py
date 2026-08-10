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
            r = subprocess.run(["osascript", "-e", as_code], capture_output=True, encoding='utf-8', timeout=3)
            if r.returncode == 0 and r.stdout.strip():
                titles = [t.strip() for t in r.stdout.strip().split(", ") if t.strip()]
                # Get URLs
                urls = []
                if bundle_id in _TAB_URL_AS:
                    url_as = _TAB_URL_AS[bundle_id].format(w=wi)
                    try:
                        r3 = subprocess.run(["osascript", "-e", url_as], capture_output=True, encoding='utf-8', timeout=3)
                        if r3.returncode == 0 and r3.stdout.strip():
                            urls = [u.strip() for u in r3.stdout.strip().split(", ") if u.strip()]
                    except: pass
                # Get active tab index
                active_as = as_code.replace(f"get title of every tab of window {wi}",
                                            f"get active tab index of window {wi}")
                active_idx = 0
                try:
                    r2 = subprocess.run(["osascript", "-e", active_as], capture_output=True, encoding='utf-8', timeout=2)
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
        # Skip minimized windows
        if _cfbool(_get_attr(win, "AXMinimized")):
            continue
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
            if bundle_id == "com.apple.finder" and (not title or title == "(untitled)" or title == "最近使用"):
                continue
            # Skip windows with no title (fullscreen/minimized artifacts)
            if not title:
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

import logging as _ax_logging
_ax_log = _ax_logging.getLogger("stp.ax")


def _has_screen_capture() -> bool:
    """Check Screen Recording permission by verifying kCGWindowName is available
    for regular app windows (kCGWindowLayer 0) from other processes."""
    import os as _os7
    try:
        from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionAll, kCGNullWindowID
        my_pid = _os7.getpid()
        window_list = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID)
        if not window_list:
            return False
        for w in window_list:
            if w.get('kCGWindowLayer', -1) == 0:
                pid = w.get('kCGWindowOwnerPID', -1)
                name = w.get('kCGWindowName', None)
                if pid != my_pid and name is not None and len(str(name).strip()) > 0:
                    return True
        return False
    except Exception:
        return False


# Ghost new-tab page titles that Chrome/Safari/Edge show when no page is loaded
_GHOST_TAB_TITLES = {"new tab", "newtab", "新标签页", "新しいタブ", "nouvel onglet", "neuer tab", "nova guia",
                     "nueva pestaña", "incognito tab", "incognito new tab"}


def _resolve_cg_window_id(pid, title):
    """Find CG window_id for (pid, title). Exact title match first, then substring.
    Falls back to the frontmost app's first onscreen window when pid is frontmost.
    Returns 0 when unresolvable."""
    from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionAll, kCGNullWindowID
    target = (title or "").strip().lower()
    if not target:
        return 0
    wl = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID) or []
    cands = []  # [(title_lower, window_id)]
    for w in wl:
        if w.get('kCGWindowLayer', -1) != 0 or w.get('kCGWindowOwnerPID', -1) != pid:
            continue
        t = str(w.get('kCGWindowName') or '').strip()
        if t:
            cands.append((t.lower(), w.get('kCGWindowNumber', 0)))
    for t, wid in cands:
        if t == target:
            return wid
    for t, wid in cands:
        if target in t or t in target:
            return wid
    # Fallback: find ANY onscreen window for the target PID.
    # On macOS ≥26, CGWindowList reports nil kCGWindowName for ALL apps,
    # so title matching never matches — we must fall through to PID-only lookup.
    def _is_meaningful(win):
        """Window is not a menu-bar proxy or invisible artifact."""
        b = win.get('kCGWindowBounds', {})
        bh, bw = b.get('Height', 0), b.get('Width', 0)
        return not (bh <= 30 and bw >= 1920) and not (bh <= 1 or bw <= 1)

    # 1) On-screen windows only (most likely to be the right one)
    onscreen = CGWindowListCopyWindowInfo(1, kCGNullWindowID) or []
    for w in onscreen:
        if w.get('kCGWindowLayer', -1) == 0 and w.get('kCGWindowOwnerPID', -1) == pid and _is_meaningful(w):
            return w.get('kCGWindowNumber', 0)

    # 2) Any Space (e.g. minimized / fullscreen apps)
    for w in wl:
        if w.get('kCGWindowLayer', -1) == 0 and w.get('kCGWindowOwnerPID', -1) == pid and _is_meaningful(w):
            return w.get('kCGWindowNumber', 0)

    return 0


def _cgimage_to_jpeg(img, max_w):
    """Scale a CGImage down to max_w and encode as JPEG bytes. None on failure."""
    from Quartz import CGImageGetWidth, CGImageGetHeight
    from Cocoa import NSImage, NSBitmapImageRep
    from AppKit import NSBitmapImageFileTypeJPEG, NSImageCompressionFactor
    w, h = CGImageGetWidth(img), CGImageGetHeight(img)
    if w < 2 or h < 2:
        return None
    scale = min(1.0, float(max_w) / float(w))
    tw, th = max(1, int(w * scale)), max(1, int(h * scale))
    rep = NSBitmapImageRep.alloc().initWithCGImage_(img)
    if not rep:
        return None
    src = NSImage.alloc().initWithSize_((float(w), float(h)))
    src.addRepresentation_(rep)
    out = NSImage.alloc().initWithSize_((float(tw), float(th)))
    out.lockFocus()
    src.drawInRect_fromRect_operation_fraction_(
        ((0.0, 0.0), (float(tw), float(th))), ((0.0, 0.0), (float(w), float(h))), 2, 1.0)
    out.unlockFocus()
    tiff = out.TIFFRepresentation()
    if not tiff:
        return None
    rep2 = NSBitmapImageRep.imageRepWithData_(tiff)
    if not rep2:
        return None
    data = rep2.representationUsingType_properties_(NSBitmapImageFileTypeJPEG, {NSImageCompressionFactor: 0.65})
    return bytes(data) if data else None


def capture_window_thumbnail(pid, title, max_w=256):
    """Capture a window screenshot as JPEG bytes scaled to max_w. None on failure.
    Requires Screen Recording permission (kCGWindowName visibility)."""
    if not _has_screen_capture():
        return None
    try:
        from Quartz import (CGWindowListCreateImage, CGRectNull,
                            kCGWindowListOptionIncludingWindow, kCGWindowImageBoundsIgnoreFraming)
        wid = _resolve_cg_window_id(pid, title)
        if not wid:
            _ax_log.info(f"[THUMB] no CG window for pid={pid} title={str(title)[:40]!r}")
            return None
        img = CGWindowListCreateImage(CGRectNull, kCGWindowListOptionIncludingWindow,
                                      wid, kCGWindowImageBoundsIgnoreFraming)
        if img is None:
            _ax_log.info(f"[THUMB] CGWindowListCreateImage returned None for wid={wid}")
            return None
        return _cgimage_to_jpeg(img, max_w)
    except Exception as e:
        _ax_log.info(f"[THUMB] capture failed pid={pid}: {e}")
        return None


def _as_tabs_for_app(bundle_id, window_count):
    """Fetch tabs via AppleScript for all windows of a browser app.
    Works cross-Space (unlike AX). Returns list of tab items or None on failure.
    window_index is 0-based matching AppleScript window numbering (1-based).
    Tries up to window_count + 2 extra windows in case CG undercounts."""
    try:
        all_items = []
        max_wi = window_count + 3  # try a few extra in case CG undercounts
        for wi in range(max_wi):
            as_w = wi + 1  # AppleScript uses 1-based window numbers
            as_code = f'tell app "{_browser_name(bundle_id)}" to get title of every tab of window {as_w}'
            r = subprocess.run(["osascript", "-e", as_code], capture_output=True, encoding='utf-8', timeout=3)
            if r.returncode != 0 or not r.stdout.strip():
                break  # window out of range → stop
            titles = [t.strip() for t in r.stdout.strip().split(", ") if t.strip()]
            if not titles:
                continue
            # Get URLs
            urls = []
            if bundle_id in _TAB_URL_AS:
                url_as = _TAB_URL_AS[bundle_id].format(w=as_w)
                try:
                    r3 = subprocess.run(["osascript", "-e", url_as], capture_output=True, encoding='utf-8', timeout=3)
                    if r3.returncode == 0 and r3.stdout.strip():
                        urls = [u.strip() for u in r3.stdout.strip().split(", ") if u.strip()]
                except: pass
            # Get active tab index
            active_as = f'tell app "{_browser_name(bundle_id)}" to get active tab index of window {as_w}'
            active_idx = 0
            try:
                r2 = subprocess.run(["osascript", "-e", active_as], capture_output=True, encoding='utf-8', timeout=2)
                if r2.returncode == 0:
                    active_idx = int(r2.stdout.strip()) - 1
            except: pass
            for ti, t in enumerate(titles):
                # Filter ghost new-tab pages that aren't the active tab
                if t.strip().lower() in _GHOST_TAB_TITLES and ti != active_idx:
                    continue
                icon_url = _favicon_url(urls[ti]) if ti < len(urls) else ""
                all_items.append({
                    "title": t, "type": "tab", "is_focused": (ti == active_idx),
                    "item_index": len(all_items), "window_index": wi, "tab_index": ti,
                    "icon_url": icon_url, "icon": "", "_source": "cg",
                })
        return all_items if all_items else None
    except Exception:
        return None


def _browser_name(bundle_id):
    """Extract browser name from bundle ID for AppleScript."""
    m = {
        "com.google.Chrome": "Google Chrome",
        "com.apple.Safari": "Safari",
        "com.microsoft.edgemac": "Microsoft Edge",
        "com.brave.Browser": "Brave Browser",
        "com.operasoftware.Opera": "Opera",
        "com.vivaldi.Vivaldi": "Vivaldi",
    }
    return m.get(bundle_id, bundle_id)


def get_all_app_windows():
    """Return windows from all running user apps, grouped by app.
    Primary: AX API (rich data: tabs, focus).
    When Screen Recording permission is granted, CGWindowList supplements
    windows from other Spaces (fullscreen apps) that AX can't see.
    Returns {apps: [{name, bundle_id, pid, icon, windows: [...]}], focused_app_idx, focused_global_idx}"""
    import AppKit

    # If Screen Recording is granted, pre-build CG window lookup for cross-Space fallback
    has_sc = _has_screen_capture()
    cg_by_pid = {}  # {pid: [{title, owner, window_id, bounds}]}
    onscreen_ids = set()  # window IDs visible on current Space
    if has_sc:
        try:
            from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionAll, kCGNullWindowID
            # All windows (across all Spaces)
            cg_all = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID)
            # On-screen only (current Space)
            cg_onscreen = CGWindowListCopyWindowInfo(1, kCGNullWindowID)  # kCGWindowListOptionOnScreenOnly=1
            if cg_onscreen:
                for w in cg_onscreen:
                    if w.get('kCGWindowLayer', -1) == 0:
                        wid = w.get('kCGWindowNumber', 0)
                        if wid:
                            onscreen_ids.add(wid)
            if cg_all:
                for w in cg_all:
                    pid_w = w.get('kCGWindowOwnerPID', -1)
                    layer = w.get('kCGWindowLayer', -1)
                    cg_title = w.get('kCGWindowName', None)
                    owner = w.get('kCGWindowOwnerName', '')
                    if layer != 0 or not owner:
                        continue
                    # Some apps (System Settings, Catalyst/SwiftUI) have windows
                    # with nil kCGWindowName. Use owner name as fallback title.
                    # Filter menu-bar proxies (height ≤ 30 spanning full width)
                    # and invisible artifacts (≤ 1×1 px).
                    has_title = bool(cg_title and str(cg_title).strip())
                    if not has_title:
                        bounds = w.get('kCGWindowBounds', {})
                        bh = bounds.get('Height', 0)
                        bw = bounds.get('Width', 0)
                        if bh <= 30 and bw >= 1920:
                            continue  # menu bar proxy, skip
                        if bh <= 1 or bw <= 1:
                            continue  # invisible artifact (Chrome 1×1 tracker, 0×0 render)
                        display_title = owner
                    else:
                        display_title = str(cg_title).strip()
                    wid = w.get('kCGWindowNumber', 0)
                    cg_by_pid.setdefault(pid_w, []).append({
                        "title": display_title,
                        "owner": owner,
                        "window_id": wid,
                        "bounds": w.get('kCGWindowBounds', {}),
                        "onscreen": wid in onscreen_ids,
                    })
                for pid_w in cg_by_pid:
                    cg_by_pid[pid_w].sort(key=lambda x: x["title"].lower())
        except Exception:
            has_sc = False

    workspace = AppKit.NSWorkspace.sharedWorkspace()
    try:
        front_pid = workspace.frontmostApplication().processIdentifier()
    except:
        front_pid = -1

    result = []
    for app in workspace.runningApplications():
        try:
            pid = app.processIdentifier()
            name = app.localizedName() or "?"
            bundle_id = app.bundleIdentifier() or ""
            if not bundle_id:
                continue
            if app.activationPolicy() != 0:
                continue
        except:
            continue

        items = get_app_items(pid, bundle_id)
        ax_count = len(items)
        # For browser apps: if AX returns empty, retry — AX tree may be
        # updating after a Space switch or AppleScript tab selection.
        if bundle_id in _TAB_AS_MAP and ax_count == 0:
            import time as _retry_time
            for _retry_i in range(3):
                _retry_time.sleep(0.2)
                items = get_app_items(pid, bundle_id)
                ax_count = len(items)
                if ax_count > 0:
                    _ax_log.info(f"[RETRY] {name}: AX returned {ax_count} items on retry {_retry_i+1}")
                    break
        if bundle_id in _TAB_AS_MAP:
            item_types = [it.get("type") for it in items]
            _ax_log.info(f"[TRACE] {name}: AX items={ax_count} types={item_types}")

        # Dedup: when browser is fullscreen, AX may report the same window
        # via multiple AX elements. If two windows have identical tab sets,
        # they're the same window — keep only the first.
        if bundle_id in _TAB_AS_MAP and len(items) > 0:
            tab_wins = {}
            for it in items:
                wi = it.get("window_index", -1)
                if wi >= 0 and it.get("type") == "tab":
                    tab_wins.setdefault(wi, []).append(it["title"])
            if len(tab_wins) > 1:
                seen_sigs = {}
                dup_wins = set()
                for wi, titles in tab_wins.items():
                    sig = tuple(sorted(titles))
                    if sig in seen_sigs:
                        dup_wins.add(wi)
                    else:
                        seen_sigs[sig] = wi
                if dup_wins:
                    items = [it for it in items if it.get("window_index") not in dup_wins]
                    _ax_log.info(f"[DEDUP] {name}: removed {len(dup_wins)} duplicate AX windows")

        # CG supplement: only used when AX returned NOTHING for this app.
        # macOS ≥26 reports nil kCGWindowName for all CG windows, so CG
        # fallback titles (owner name) never match AX real titles → dedup
        # breaks and every app shows duplicate entries (one AX + one CG).
        # Rule: AX wins. CG only fills in for apps AX can't see at all.
        if has_sc and pid in cg_by_pid and ax_count == 0:
            existing_titles = {it["title"].strip().lower() for it in items}
            new_cnt = 0
            for cg_win in cg_by_pid[pid]:
                cg_title = cg_win["title"]
                if cg_title.strip().lower() in _GHOST_TAB_TITLES:
                    continue
                if cg_title == "最近使用":
                    continue
                if cg_title.strip().lower() in existing_titles:
                    continue
                items.append({
                    "title": cg_title,
                    "type": "window",
                    "is_focused": False,
                    "item_index": len(items),
                    "window_index": -1,  # sentinel: resolve in focus_item via title search
                    "window_id": cg_win.get("window_id", 0),
                    "tab_index": None,
                    "icon_url": "",
                    "icon": "folder" if bundle_id == "com.apple.finder" else "",
                    "_source": "cg",
                })
                existing_titles.add(cg_title.strip().lower())
                new_cnt += 1
            if new_cnt > 0:
                _ax_log.info(f"[MERGE] {name}: +{new_cnt} CG windows offscreen (AX had {ax_count})")

        # Re-sort, de-duplicate, and re-index
        if items:
            # For browser apps: if tabs are expanded (inner view), suppress
            # ALL window-type entries (outer view). The inner tabs already
            # represent the app; any outer window entry would be a duplicate
            # of the active tab exposed as the window title.
            if bundle_id in _TAB_AS_MAP:
                has_tabs = any(it.get("type") == "tab" for it in items)
                if has_tabs:
                    before = len(items)
                    items = [it for it in items if it.get("type") != "window"]
                    dropped = before - len(items)
                    if dropped > 0:
                        _ax_log.info(f"[DEDUP] {name}: suppressed {dropped} outer window(s) (inner tabs present)")
            items.sort(key=lambda it: it["title"].lower())
            for i, it in enumerate(items):
                it["item_index"] = i

        if ax_count == 0 and len(items) > 0:
            cg_count = len(cg_by_pid.get(pid, []))
            _ax_log.info(f"[WINDOWS] {name}: AX=0 CG={cg_count} CGused={len(items)}")

        if not items:
            if bundle_id in _TAB_AS_MAP:
                cg_info = len(cg_by_pid.get(pid, []))
                _ax_log.info(f"[TRACE] {name}: FINAL empty — skipped! ax_count={ax_count} cg_avail={cg_info} has_sc={has_sc}")
            continue

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

    # Stable alphabetical sort
    result.sort(key=lambda a: a["name"].lower())

    # Assign global indices and find focused items
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

    _ax_log.info(f"[WINDOWS] Summary: {len(result)} apps, {global_idx} items, has_sc={has_sc}")
    return {"apps": result, "focused_app_idx": focused_app_idx, "focused_global_idx": focused_global_idx}

def _find_window_by_title(windows_val, title, bundle_id=""):
    """Search AX windows for one whose title (after cleanup) matches the given title.
    Returns (window_index, window_element) or (-1, None)."""
    count = _cf.CFArrayGetCount(windows_val)
    target = title.lower().strip()
    for i in range(count):
        w = _cf.CFArrayGetValueAtIndex(windows_val, i)
        if not w: continue
        ax_title = (_pystr(_get_attr(w, "AXTitle")) or "").lower().strip()
        if ax_title and (ax_title == target or target in ax_title or ax_title in target):
            return i, w
    return -1, None


def focus_item(pid, item, bundle_id=""):
    """Focus a window or tab item. item = {window_index, tab_index, type, title, _source}.
    CG-sourced items (_source="cg"): just activate the app to switch Spaces.
    AX-sourced items: focus specific window/tab via Accessibility API."""
    is_cg = item.get("_source") == "cg"
    item_title = item.get("title", "")

    # Activate the app (bring to front + switch spaces)
    if bundle_id:
        # For CG items (fullscreen/other-Space windows): temporarily minimize
        # desktop windows to force macOS to switch to the fullscreen Space.
        # macOS naturally switches to another Space when the current one has
        # no visible windows of the target app.
        minimized_wins = []
        if is_cg:
            try:
                elem = _as.AXUIElementCreateApplication(pid)
                wv = _get_attr(elem, "AXWindows")
                if wv:
                    cnt = _cf.CFArrayGetCount(wv)
                    for i in range(cnt):
                        w = _cf.CFArrayGetValueAtIndex(wv, i)
                        if w and not _cfbool(_get_attr(w, "AXMinimized")):
                            # Minimize to dock
                            k_min = _cfstr("AXMinimize")
                            _as.AXUIElementPerformAction(w, k_min)
                            _cf.CFRelease(k_min)
                            minimized_wins.append(i)
                    _cf.CFRelease(wv)
            except: pass

        try:
            subprocess.run(["open", "-b", bundle_id], capture_output=True, timeout=3)
        except: pass
        try:
            import AppKit
            ns_app = AppKit.NSRunningApplication.runningApplicationWithProcessIdentifier_(pid)
            if ns_app:
                ns_app.unhide()
                ns_app.activateWithOptions_(1 | 2)
        except: pass

        # Restore minimized desktop windows
        if minimized_wins:
            import time as _time2
            _time2.sleep(0.3)
            try:
                elem2 = _as.AXUIElementCreateApplication(pid)
                wv2 = _get_attr(elem2, "AXWindows")
                if wv2:
                    cnt2 = _cf.CFArrayGetCount(wv2)
                    for i in range(cnt2):
                        w = _cf.CFArrayGetValueAtIndex(wv2, i)
                        if w and _cfbool(_get_attr(w, "AXMinimized")):
                            # Un-minimize by raising
                            k_u = _cfstr("AXRaise")
                            _as.AXUIElementPerformAction(w, k_u)
                            _cf.CFRelease(k_u)
                    _cf.CFRelease(wv2)
            except: pass
            # Fallback: unhide the app (restores minimized windows on some macOS versions)
            try:
                import AppKit as _ak2
                ns2 = _ak2.NSRunningApplication.runningApplicationWithProcessIdentifier_(pid)
                if ns2:
                    ns2.unhide()
            except: pass

    # CG items: activation is sufficient. Don't try AX window-level focus.
    if is_cg:
        return {"success": True, "title": item_title or "(fullscreen)", "_source": "cg"}

    # AX items: normal window/tab focus flow
    elem = _as.AXUIElementCreateApplication(pid)
    if not elem: return {"success": False, "error": "no app element"}

    windows_val = _get_attr(elem, "AXWindows")
    if not windows_val: return {"success": False, "error": "no windows"}

    wi = item.get("window_index", 0)
    win = None

    # Title search for the right window
    if item_title:
        found_wi, found_win = _find_window_by_title(windows_val, item_title, bundle_id)
        if found_wi >= 0:
            wi = found_wi
            win = found_win

    # Fallback: use window_index directly
    if win is None:
        count = _cf.CFArrayGetCount(windows_val)
        if wi < 0 or wi >= count:
            _cf.CFRelease(windows_val)
            return {"success": False, "error": f"window index {wi} out of range ({count} windows)"}
        win = _cf.CFArrayGetValueAtIndex(windows_val, wi)

    if not win:
        _cf.CFRelease(windows_val)
        return {"success": False, "error": "null window element"}

    # Focus and raise the window
    k_focused = _cfstr("AXFocusedWindow")
    _as.AXUIElementSetAttributeValue(elem, k_focused, win)
    _cf.CFRelease(k_focused)

    k_raise = _cfstr("AXRaise")
    _as.AXUIElementPerformAction(win, k_raise)
    _cf.CFRelease(k_raise)

    title = "(untitled)"

    # Tab selection (for non-CG items only)
    if item.get("type") == "tab" and item.get("tab_index") is not None:
        ti = item["tab_index"]
        # AppleScript path for known browsers
        if bundle_id and bundle_id in _AS_TAB_FOCUS:
            as_code = _AS_TAB_FOCUS[bundle_id].format(w=wi + 1, t=ti + 1)
            try:
                r = subprocess.run(["osascript", "-e", as_code], capture_output=True, encoding='utf-8', timeout=3)
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


def close_window(pid, item, bundle_id=""):
    """Close a specific window via AX API or CGEvent fallback.
    item = {window_index, tab_index, type, title, _source}
    For AX-sourced windows: use AXCloseButton or AXRaise+Cmd+W.
    For CG-sourced windows: focus app first, then Cmd+W."""
    is_cg = item.get("_source") == "cg"
    window_index = item.get("window_index", 0)
    item_title = item.get("title", "")
    _ax_log.info(f"[CLOSE] pid={pid} title={item_title[:40]!r} cg={is_cg} wi={window_index}")

    if is_cg:
        # CG-sourced windows (other Spaces): focus app first, then Cmd+W
        focus_item(pid, item, bundle_id)
        import time
        time.sleep(0.4)
        from input_engine import press_key
        press_key("cmd+w")
        _ax_log.info(f"[CLOSE] CG fallback: focus + Cmd+W")
        return {"success": True, "method": "cg_focus_cmdw"}

    # AX-sourced: close directly via AX API
    elem = _as.AXUIElementCreateApplication(pid)
    if not elem:
        return {"success": False, "error": "no app element"}

    windows_val = _get_attr(elem, "AXWindows")
    if not windows_val:
        return {"success": False, "error": "no windows"}

    try:
        # Find the window by title (more reliable than index)
        win = None
        if item_title:
            found_wi, found_win = _find_window_by_title(windows_val, item_title, bundle_id)
            if found_wi >= 0:
                win = found_win
                window_index = found_wi

        if win is None:
            count = _cf.CFArrayGetCount(windows_val)
            if window_index < 0 or window_index >= count:
                return {"success": False, "error": f"window_index {window_index} out of range [0,{count})"}
            win = _cf.CFArrayGetValueAtIndex(windows_val, window_index)

        if not win:
            return {"success": False, "error": "window element null"}

        # Method 1: Press the close button directly via AX
        close_btn = _get_attr(win, "AXCloseButton")
        if close_btn:
            err = _as.AXUIElementPerformAction(close_btn, _cfstr("AXPress"))
            _cf.CFRelease(close_btn)
            if err == 0:
                _ax_log.info(f"[CLOSE] AXCloseButton success")
                return {"success": True, "method": "ax_close_button"}
            _ax_log.info(f"[CLOSE] AXCloseButton failed err={err}, falling back")

        # Method 2: Raise window + Cmd+W
        _as.AXUIElementPerformAction(win, _cfstr("AXRaise"))
        import time
        time.sleep(0.15)
        from input_engine import press_key
        press_key("cmd+w")
        _ax_log.info(f"[CLOSE] AXRaise + Cmd+W fallback")
        return {"success": True, "method": "ax_raise_cmdw"}
    finally:
        _cf.CFRelease(windows_val)


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
