"""Native window tiling via AX frame manipulation — no osascript, no shortcuts.

Replaces the old System Events menu-click arrange path. Hard findings
(2026-08-15, macOS 26): synthetic keyboard events cannot trigger
WindowServer system shortcuts (tiling ⌃⌥←→↑↓, app switcher — only
app-level shortcuts like cmd+s respond), and osascript is a poison pill
(?E zombies, SIGKILL-immune). So left/right/fill press the app's own
Window-menu tile item via AX — the native path the old menu click used,
with the WindowServer animation — and fall back to direct
AXPosition/AXSize when no menu item matches. Requires Accessibility
permission — Tapflow holds it (verified: kTCCServiceAccessibility in
system TCC.db).
"""

import ctypes
import struct

import AppKit

from ax_bridge import _cf, _cfstr, _get_attr, _as, _pystr

# AXValueType (verified against the local macOS 26 SDK's AXValue.h)
_kAXValueTypeCGPoint = 1
_kAXValueTypeCGSize = 2

_as.AXValueCreate.argtypes = [ctypes.c_uint32, ctypes.c_void_p]
_as.AXValueCreate.restype = ctypes.c_void_p
_as.AXValueGetValue.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_void_p]
_as.AXValueGetValue.restype = ctypes.c_bool
# Not declared in ax_bridge — without restype, ctypes truncates the 64-bit
# pointer to 32 bits and every later AX call on it segfaults (seen 2026-08-15).
_as.AXUIElementCreateSystemWide.argtypes = []
_as.AXUIElementCreateSystemWide.restype = ctypes.c_void_p


def _make_point(x, y):
    buf = ctypes.create_string_buffer(struct.pack("dd", float(x), float(y)))
    return _as.AXValueCreate(_kAXValueTypeCGPoint, buf)


def _make_size(w, h):
    buf = ctypes.create_string_buffer(struct.pack("dd", float(w), float(h)))
    return _as.AXValueCreate(_kAXValueTypeCGSize, buf)


def _read_value(ax_val, type_id):
    """Unpack an AXValue (CGPoint/CGSize) into a (a, b) float tuple."""
    if not ax_val:
        return None
    buf = ctypes.create_string_buffer(16)
    if _as.AXValueGetValue(ax_val, type_id, buf):
        return struct.unpack("dd", buf.raw[:16])
    return None


def _set_attr(elem, name, cf_val):
    """Returns (ok, ax_error_code)."""
    err = _as.AXUIElementSetAttributeValue(elem, _cfstr(name), cf_val)
    return err == 0, err


# ── Native menu path (system animation) ──
# Pressing the Window menu's tile item runs the app's own tiling action —
# the WindowServer path with the native animation. This is exactly what the
# old System Events menu click did (窗口 → 移动与调整大小 → 左侧/右侧/...),
# just without osascript. Chinese titles verified against the live menu bar
# (2026-08-15, macOS 26, via a temporary /api/system/ax-menu-dump endpoint).
_WINDOW_MENU_NAMES = ("window", "窗口", "視窗")
_MR_SUB = ("move & resize", "移动与调整大小", "移動與調整大小")
_FS_SUB = ("full-screen tile", "全屏幕平铺", "全螢幕平鋪")
# action -> (submenu keyword names or None for top-level, item keyword groups)
_TILE_MENU_ITEMS = {
    "left":     (_MR_SUB, (("左侧",), ("left",))),
    "right":    (_MR_SUB, (("右侧",), ("right",))),
    "top":      (_MR_SUB, (("顶部",), ("top",))),
    "bottom":   (_MR_SUB, (("底部",), ("bottom",))),
    "fill":     (None, (("填充",), ("fill",))),
    "restore":  (_MR_SUB, (("恢复上一个大小",), ("restore",))),
    "fs-left":  (_FS_SUB, (("屏幕左侧",), ("left",))),
    "fs-right": (_FS_SUB, (("屏幕右侧",), ("right",))),
}


def _children_of(el):
    """AXChildren of el as a list of AX elements."""
    out = []
    ch = _get_attr(el, "AXChildren")
    if ch:
        n = _cf.CFArrayGetCount(ch)
        for i in range(n):
            out.append(_cf.CFArrayGetValueAtIndex(ch, i))
    return out


def _window_menu(app_elem):
    """The Window menu's AXMenu element, or None."""
    bar = _get_attr(app_elem, "AXMenuBar")
    if not bar:
        return None
    for mi in _children_of(bar):
        t = _pystr(_get_attr(mi, "AXTitle")).strip().lower()
        if any(nm in t for nm in _WINDOW_MENU_NAMES):
            for sub in _children_of(mi):
                if _pystr(_get_attr(sub, "AXRole")) == "AXMenu":
                    return sub
    return None


def _open_submenu(menu_elem, submenu_names):
    """Find the submenu item by name, AXShowMenu it (contents load lazily),
    return its AXMenu element or None."""
    for it in _children_of(menu_elem):
        if _pystr(_get_attr(it, "AXRole")) != "AXMenuItem":
            continue
        t = _pystr(_get_attr(it, "AXTitle")).strip().lower()
        if any(nm in t for nm in submenu_names):
            _as.AXUIElementPerformAction(it, _cfstr("AXShowMenu"))
            for sub in _children_of(it):
                if _pystr(_get_attr(sub, "AXRole")) == "AXMenu":
                    return sub
    return None


def _menu_press_tile(pid, action):
    """Press the frontmost app's Window-menu tile item. True if pressed;
    False means no matching item (caller falls back to frame setting)."""
    menu = _window_menu(_as.AXUIElementCreateApplication(pid))
    if not menu:
        return False
    submenu_names, item_groups = _TILE_MENU_ITEMS[action]
    target = menu
    if submenu_names:
        target = _open_submenu(menu, submenu_names)
        if not target:
            return False
    for it in _children_of(target):
        t = _pystr(_get_attr(it, "AXTitle")).strip().lower()
        if any(all(kw in t for kw in grp) for grp in item_groups):
            return _as.AXUIElementPerformAction(it, _cfstr("AXPress")) == 0
    return False


def _capture_last(pid, win):
    """Record the pre-tiling frame once per pid, for restore."""
    if pid in _LAST:
        return
    pos = _read_value(_get_attr(win, "AXPosition"), _kAXValueTypeCGPoint)
    size = _read_value(_get_attr(win, "AXSize"), _kAXValueTypeCGSize)
    if pos and size:
        _LAST[pid] = (pos[0], pos[1], size[0], size[1])


def _visible_frame():
    """Main screen area outside menu bar and dock, in Quartz global coords
    (origin top-left of the main screen, y down)."""
    s = AppKit.NSScreen.mainScreen()
    if s is None:
        return (0, 0, 1440, 900)
    full = s.frame()          # AppKit coords, origin bottom-left
    vis = s.visibleFrame()
    x = int(vis.origin.x)
    w = int(vis.size.width)
    h = int(vis.size.height)
    # AppKit y is from the bottom; Quartz y is from the top.
    y = int(full.size.height - (vis.origin.y + vis.size.height))
    return (x, y, w, h)


def _focused_window():
    """The frontmost app's focused window; falls back to its main window."""
    app = _as.AXUIElementCreateApplication(_frontmost_pid())
    win = _get_attr(app, "AXFocusedWindow")
    if win:
        return win
    # System-wide AXFocusedWindow is unreliable on macOS 26; the app's
    # AXMainWindow is the next best target.
    win = _get_attr(app, "AXMainWindow")
    if win:
        return win
    # Last resort: the first window in the list.
    wins = _get_attr(app, "AXWindows")
    if wins:
        n = _cf.CFArrayGetCount(wins)
        if n > 0:
            return _cf.CFArrayGetValueAtIndex(wins, 0)
    return None


def _frontmost_pid():
    a = AppKit.NSWorkspace.sharedWorkspace().frontmostApplication()
    return a.processIdentifier()


# pid -> (x, y, w, h) frame captured before the first tile, for restore
_LAST = {}

_ACTIONS = ("left", "right", "top", "bottom", "fill", "restore", "fs-left", "fs-right")


def apply(action):
    """Tile the focused window. Returns (ok, error_message)."""
    if action not in _ACTIONS:
        return False, f"unknown action: {action}"
    win = _focused_window()
    if not win:
        return False, "no focused window (AX)"
    pid = _frontmost_pid()
    # Native path first: press the Window menu's tile item — the app tiles
    # through WindowServer, so the system animation plays (what the old
    # System Events menu click did). Fall back to frame setting below when
    # no menu item matches. Full-screen tiles have no frame equivalent.
    if action in _TILE_MENU_ITEMS:
        _capture_last(pid, win)
        if _menu_press_tile(pid, action):
            return True, ""
        if action in ("fs-left", "fs-right"):
            return False, "no matching menu item (AX)"
    pos_v = _get_attr(win, "AXPosition")
    size_v = _get_attr(win, "AXSize")
    if not pos_v or not size_v:
        return False, "window does not expose AXPosition/AXSize"
    pos = _read_value(pos_v, _kAXValueTypeCGPoint)
    size = _read_value(size_v, _kAXValueTypeCGSize)
    if not pos or not size:
        return False, "failed to read window frame"
    vx, vy, vw, vh = _visible_frame()
    if action == "restore":
        if pid not in _LAST:
            return False, "no previous frame to restore"
        x, y, w, h = _LAST.pop(pid)
    else:
        # Capture the pre-tiling frame only once — consecutive tiles
        # (left → fill) must keep the ORIGINAL frame for restore.
        if pid not in _LAST:
            _LAST[pid] = (pos[0], pos[1], size[0], size[1])
        if action == "fill":
            x, y, w, h = vx, vy, vw, vh
        elif action == "left":
            x, y, w, h = vx, vy, vw // 2, vh
        elif action == "right":
            x, y, w, h = vx + vw // 2, vy, vw - vw // 2, vh
        elif action == "top":
            x, y, w, h = vx, vy, vw, vh // 2
        else:  # bottom
            x, y, w, h = vx, vy + vh // 2, vw, vh - vh // 2
    ok, err = _set_attr(win, "AXPosition", _make_point(x, y))
    if not ok:
        return False, f"AXPosition set failed (AX error {err})"
    ok, err = _set_attr(win, "AXSize", _make_size(w, h))
    if not ok:
        return False, f"AXSize set failed (AX error {err})"
    return True, ""
