"""Native window tiling via AX frame manipulation — no osascript, no shortcuts.

Replaces the old System Events menu-click arrange path. Two hard findings
(2026-08-15, macOS 26): synthetic keyboard events cannot trigger
WindowServer system shortcuts (tiling ⌃⌥←→↑↓, app switcher — only
app-level shortcuts like cmd+s respond), and osascript is a poison pill
(?E zombies, SIGKILL-immune). So tiling sets the focused window's
AXPosition/AXSize directly. Requires Accessibility permission — Tapflow
holds it (verified: kTCCServiceAccessibility in system TCC.db).
"""

import ctypes
import struct

import AppKit

from ax_bridge import _cf, _cfstr, _get_attr, _as

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

_ACTIONS = ("left", "right", "top", "bottom", "fill", "restore")


def apply(action):
    """Tile the focused window. Returns (ok, error_message)."""
    if action not in _ACTIONS:
        return False, f"unknown action: {action}"
    win = _focused_window()
    if not win:
        return False, "no focused window (AX)"
    pos_v = _get_attr(win, "AXPosition")
    size_v = _get_attr(win, "AXSize")
    if not pos_v or not size_v:
        return False, "window does not expose AXPosition/AXSize"
    pos = _read_value(pos_v, _kAXValueTypeCGPoint)
    size = _read_value(size_v, _kAXValueTypeCGSize)
    if not pos or not size:
        return False, "failed to read window frame"
    vx, vy, vw, vh = _visible_frame()
    pid = _frontmost_pid()
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
