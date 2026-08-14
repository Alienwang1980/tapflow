"""Native NSColorPanel bridge — editor color picking with the real macOS panel.

Safari's <input type=color> opens NSColorPanel but auto-dismisses it on every
selection. This module instead opens the panel directly from the Mac app (which
runs an AppKit run loop on the main thread), streams color changes to the editor
over WebSocket, and closes only when the user closes the panel manually — the
same behavior as in native apps (TextEdit etc.).

Threading: all panel/binding mutation happens on the AppKit main thread
(dispatched via NSOperationQueue.mainQueue). Color changes are pushed back to
the uvicorn event loop via asyncio.run_coroutine_threadsafe.
"""
import asyncio
import logging

from AppKit import (
    NSApp,
    NSColor,
    NSColorPanel,
    NSColorSpace,
    NSWindowWillCloseNotification,
)
from Foundation import NSNotificationCenter, NSOperationQueue, NSObject

from connection_manager import manager

logger = logging.getLogger("stp.color_panel")

# Which WS client owns the shared NSColorPanel right now.
# Accessed from the AppKit main thread only.
_binding = {"cid": None, "loop": None}

_panel = None      # NSColorPanel singleton — created on first open
_delegate = None   # NSObject target for continuous color action + close notification


def _on_main(fn):
    """Run fn on the AppKit main thread (fire-and-forget, never crash main)."""
    def _run():
        try:
            fn()
        except Exception:
            logger.exception("color panel: main-thread dispatch failed")

    NSOperationQueue.mainQueue().addOperationWithBlock_(_run)


def _nscolor_to_hex(color):
    """Convert an NSColor (any space) to #rrggbb sRGB. None if unconvertible."""
    c = color.colorUsingColorSpace_(NSColorSpace.sRGBColorSpace())
    if c is None:
        return None
    r, g, b, _a = c.getRed_green_blue_alpha_(None, None, None, None)
    if r is None or g is None or b is None:
        return None

    def _ch(v):
        return max(0, min(255, round(v * 255)))

    return "#{:02x}{:02x}{:02x}".format(_ch(r), _ch(g), _ch(b))


def _hex_to_nscolor(hexstr):
    h = hexstr.lstrip("#")
    return NSColor.colorWithSRGBRed_green_blue_alpha_(
        int(h[0:2], 16) / 255.0, int(h[2:4], 16) / 255.0, int(h[4:6], 16) / 255.0, 1.0
    )


def _send(cid, loop, msg):
    """Send a WS message to cid from the AppKit main thread (fire-and-forget)."""
    try:
        asyncio.run_coroutine_threadsafe(manager.send_to(cid, msg), loop)
    except RuntimeError:
        logger.warning(f"color panel: uvicorn loop closed, dropped {msg['type']}")


class _PanelDelegate(NSObject):
    def colorChanged_(self, sender):
        """Continuous color action — fires on every panel color change."""
        if not _binding["cid"]:
            return
        hexv = _nscolor_to_hex(sender.color())
        if hexv:
            _send(_binding["cid"], _binding["loop"], {"type": "color-change", "color": hexv})

    def panelWillClose_(self, notif):
        """User closed the panel manually — commit on the editor side."""
        cid, loop = _binding["cid"], _binding["loop"]
        _binding["cid"] = None
        _binding["loop"] = None
        if cid:
            _send(cid, loop, {"type": "color-close"})


def _open_main(cid, loop, color_hex):
    """Main thread: (re)bind the panel to cid and bring it to front."""
    global _panel, _delegate

    prev, prev_loop = _binding["cid"], _binding["loop"]
    if prev and prev != cid:
        # Panel was owned by another editor — commit there first.
        _binding["cid"] = None
        _binding["loop"] = None
        _send(prev, prev_loop, {"type": "color-close"})

    _binding["cid"] = cid
    _binding["loop"] = loop

    if _panel is None:
        _panel = NSColorPanel.sharedColorPanel()
        _panel.setContinuous_(True)
        _panel.setShowsAlpha_(False)
        _delegate = _PanelDelegate.alloc().init()
        _panel.setTarget_(_delegate)
        _panel.setAction_("colorChanged:")
        NSNotificationCenter.defaultCenter().addObserver_selector_name_object_(
            _delegate, "panelWillClose:", NSWindowWillCloseNotification, _panel
        )

    _panel.setColor_(_hex_to_nscolor(color_hex))
    _panel.makeKeyAndOrderFront_(None)
    NSApp.activateIgnoringOtherApps_(True)
    logger.info(f"color panel opened for {cid}: {color_hex}")


def _close_main(cid):
    """Main thread: close the panel if cid owns it. Stale requests are no-ops."""
    if _binding["cid"] != cid:
        return
    _binding["cid"] = None
    _binding["loop"] = None
    if _panel is not None:
        _panel.orderOut_(None)
    logger.info(f"color panel closed (owner {cid})")


# ── Public API (callable from the uvicorn WS thread) ──

def request_open(cid, loop, color_hex):
    """Open the panel bound to cid, starting from color_hex (validated #rrggbb)."""
    _on_main(lambda: _open_main(cid, loop, color_hex))


def request_close(cid):
    """Editor-initiated close (swatch toggled off / target switched)."""
    _on_main(lambda: _close_main(cid))


def release(cid):
    """Client disconnected — close the panel if it owns it."""
    request_close(cid)
