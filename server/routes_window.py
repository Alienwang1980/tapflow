"""Window management routes — switcher, focus, close, fullscreen, arrange, tile (10 routes)."""

import logging
import threading
import time

from fastapi import APIRouter, HTTPException, Request

from osa_run import osa

# ── Window Arrange (native macOS tiling via AX menu press) ──
# Synthetic key events can't trigger WindowServer system shortcuts on
# macOS 26 (verified 2026-08-15), and osascript is a poison pill — so
# tiling goes through window_tile.py, which presses the Window menu's
# tile items via AX (same native path the old System Events click used,
# with the WindowServer animation).


def create_router(state):
    """Create APIRouter with window management routes. No external function dependencies."""

    router = APIRouter()

    # ── Window Switcher (AX Bridge) ──

    @router.get("/api/system/current-app-windows")
    def sys_cur_wins():
        try:
            import AppKit
            a = AppKit.NSWorkspace.sharedWorkspace().frontmostApplication()
            pid = a.processIdentifier()
            name = a.localizedName() or "?"
            from ax_bridge import get_app_items, _clean_title
            bundle_id = a.bundleIdentifier() or ""
            items = get_app_items(pid, bundle_id)
            for it in items:
                it["title"] = _clean_title(it["title"], name)
            count = len(items)
            focused_idx = next((i for i, it in enumerate(items) if it["is_focused"]), -1)
            return {"name": name, "pid": pid, "bundle_id": bundle_id,
                    "count": count, "items": items, "focused_index": focused_idx}
        except Exception as e:
            return {"name": "?", "pid": 0, "count": 0, "items": [],
                    "focused_index": -1, "error": str(e)}

    # ── all-windows snapshot cache ──
    # get_all_app_windows can take 10s+ (per-app AX timeouts + browser
    # AppleScript). The endpoint returns the last snapshot instantly;
    # ONE background daemon thread refreshes it at most every 2s, so slow
    # scans never pile up on the anyio pool and starve the other modules.
    _win_cache = {"data": None, "ts": 0.0, "refreshing": False,
                  "lock": threading.Lock()}

    def _scan_windows():
        from ax_bridge import get_all_app_windows
        data = get_all_app_windows()
        logging.getLogger("stp.ax").info(
            f"[ALLWIN] {len(data.get('apps', []))} apps, "
            f"focused={data.get('focused_global_idx', -1)}")
        return data

    def _refresh_worker():
        try:
            data = _scan_windows()
            with _win_cache["lock"]:
                _win_cache["data"] = data
                _win_cache["ts"] = time.time()
        except Exception:
            logging.getLogger("stp.ax").exception("[ALLWIN] background refresh failed")
        finally:
            _win_cache["refreshing"] = False

    def _maybe_refresh():
        with _win_cache["lock"]:
            stale = (time.time() - _win_cache["ts"]) > 2.0
            if not stale or _win_cache["refreshing"]:
                return
            _win_cache["refreshing"] = True
        threading.Thread(target=_refresh_worker, daemon=True).start()

    @router.get("/api/system/all-windows")
    def sys_all_wins():
        with _win_cache["lock"]:
            cached = _win_cache["data"]
        if cached is None:
            # First call ever: populate synchronously so the panel isn't empty
            try:
                data = _scan_windows()
            except Exception as e:
                return {"apps": [], "focused_app_idx": -1,
                        "focused_global_idx": -1, "error": str(e)}
            with _win_cache["lock"]:
                _win_cache["data"] = data
                _win_cache["ts"] = time.time()
            return data
        _maybe_refresh()
        return cached

    @router.post("/api/system/focus-window")
    async def sys_focus_win(req: Request):
        try:
            body = await req.json()
            pid = body.get("pid", 0)
            bundle_id = body.get("bundle_id", "")
            item = {"window_index": body.get("window_index", 0),
                    "tab_index": body.get("tab_index"),
                    "type": body.get("type", "window"),
                    "title": body.get("title", ""),
                    "_source": body.get("_source", "")}
            from ax_bridge import focus_item
            flog = logging.getLogger("stp.ax")
            flog.info(f"[FOCUS] type={item['type']} title={item.get('title','')[:40]} bundle={bundle_id}")
            result = focus_item(pid, item, bundle_id)
            flog.info(f"[FOCUS] result={result}")
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Window Shortcuts (keyboard only, no osascript) ──

    @router.post("/api/system/window/close")
    async def win_close(req: Request):
        body = await req.json()
        pid = body.get("pid", 0)
        bundle_id = body.get("bundle_id", "")
        item = {"window_index": body.get("window_index", 0),
                "tab_index": body.get("tab_index"),
                "type": body.get("type", "window"),
                "title": body.get("title", ""),
                "_source": body.get("_source", "")}
        from ax_bridge import close_window
        return close_window(pid, item, bundle_id)

    @router.post("/api/system/window/fullscreen")
    async def win_fullscreen():
        from input_engine import press_key
        press_key("ctrl+cmd+f")
        return {"status": "ok"}

    @router.post("/api/system/window/minimize")
    async def win_minimize():
        from input_engine import press_key
        press_key("cmd+m")
        return {"status": "ok"}

    @router.post("/api/system/window/mission-control")
    async def win_mission_control():
        from input_engine import press_key
        press_key("ctrl+up")
        return {"status": "ok"}

    @router.post("/api/system/window/show-desktop")
    async def win_show_desktop():
        from input_engine import press_key
        press_key("f11")
        return {"status": "ok"}

    # ── TEMPORARY DEBUG (remove after menu-title verification) ──

    @router.get("/api/system/ax-menu-dump")
    def ax_menu_dump():
        import AppKit
        from ax_bridge import _cf, _cfstr, _get_attr, _as, _pystr
        a = AppKit.NSWorkspace.sharedWorkspace().frontmostApplication()
        pid = a.processIdentifier()
        name = a.localizedName() or "?"
        app_elem = _as.AXUIElementCreateApplication(pid)

        def children(el):
            ch = _get_attr(el, "AXChildren")
            out = []
            if ch:
                n = _cf.CFArrayGetCount(ch)
                for j in range(n):
                    out.append(_cf.CFArrayGetValueAtIndex(ch, j))
            return out

        def walk(el, depth):
            # Submenu contents are lazily populated — AXShowMenu each menu
            # item (no-op error on leaves) then re-read to force them open.
            items = []
            for c in children(el):
                t = _pystr(_get_attr(c, "AXTitle"))
                r = _pystr(_get_attr(c, "AXRole"))
                if r == "AXMenuItem" and depth < 1:
                    _as.AXUIElementPerformAction(c, _cfstr("AXShowMenu"))
                sub = []
                for cc in children(c):
                    if _pystr(_get_attr(cc, "AXRole")) == "AXMenu":
                        sub = walk(cc, depth + 1)
                items.append({"title": t, "role": r, "children": sub})
            return items

        bar = _get_attr(app_elem, "AXMenuBar")
        if not bar:
            return {"app": name, "pid": pid, "error": "no AXMenuBar"}
        return {"app": name, "pid": pid, "menus": walk(bar, 0)}

    @router.get("/api/system/ax-press")
    def ax_press(title: str = ""):
        """TEMPORARY DEBUG: press the first menu item whose title contains
        `title` (walking the frontmost app's menu bar, opening submenus)."""
        import AppKit
        from ax_bridge import _cf, _cfstr, _get_attr, _as, _pystr
        a = AppKit.NSWorkspace.sharedWorkspace().frontmostApplication()
        pid = a.processIdentifier()
        app_elem = _as.AXUIElementCreateApplication(pid)

        def children(el):
            ch = _get_attr(el, "AXChildren")
            out = []
            if ch:
                n = _cf.CFArrayGetCount(ch)
                for j in range(n):
                    out.append(_cf.CFArrayGetValueAtIndex(ch, j))
            return out

        def find_and_press(el, depth):
            for c in children(el):
                t = _pystr(_get_attr(c, "AXTitle"))
                if _pystr(_get_attr(c, "AXRole")) == "AXMenuItem" and depth < 2:
                    _as.AXUIElementPerformAction(c, _cfstr("AXShowMenu"))
                if t and title in t:
                    err = _as.AXUIElementPerformAction(c, _cfstr("AXPress"))
                    return {"pressed": t, "err": err}
                r = find_and_press(c, depth + 1)
                if r:
                    return r
            return None

        bar = _get_attr(app_elem, "AXMenuBar")
        if not bar:
            return {"error": "no AXMenuBar"}
        r = find_and_press(bar, 0)
        return r or {"pressed": None, "error": "not found"}

    @router.get("/api/system/ax-set-frame")
    def ax_set_frame(x: float = 0, y: float = 0, w: float = 0, h: float = 0):
        """TEMPORARY DEBUG: set the focused window's AXPosition/AXSize."""
        from window_tile import (_focused_window, _set_attr,
                                 _make_point, _make_size)
        win = _focused_window()
        if not win:
            return {"error": "no focused window"}
        ok1, e1 = _set_attr(win, "AXPosition", _make_point(x, y))
        ok2, e2 = _set_attr(win, "AXSize", _make_size(w, h))
        return {"position_ok": ok1, "size_ok": ok2, "errs": [e1, e2]}

    # ── Window Arrange (native macOS tiling via AX frame) ──

    @router.post("/api/system/window/arrange")
    async def sys_arrange(body: dict):
        action = body.get("action", "")
        from window_tile import apply as tile_apply
        ok, err = tile_apply(action)
        if ok:
            return {"success": True, "action": action}
        return {"success": False, "action": action, "error": err}

    # ── Window Tile ──

    @router.post("/api/system/window/tile")
    async def sys_tile(body: dict):
        """Tile the frontmost window. Only allowlisted layouts.
        Uses osascript with fixed templates — no user input interpolation."""
        layout = str(body.get("layout", "")).strip()
        if layout not in ("left-right", "top-bottom", "2x2"):
            raise HTTPException(400, f"Unknown layout: {layout}")
        # Get frontmost app name via System Events
        r = osa('tell app "System Events" to set frontApp to name of first process whose frontmost is true\n'
                'return frontApp')
        n = r.stdout.strip()
        if not n:
            return {"status": "error", "message": "No frontmost window found"}
        tile_script = (
            f'tell app "System Events" to tell process "{n}"\n'
            f'set sz to get size of front window\n'
        )
        if layout == "left-right":
            tile_script += "set position of front window to {0, 30}\nset size of front window to {item 1 of sz / 2, item 2 of sz}\n"
        elif layout == "top-bottom":
            tile_script += "set position of front window to {0, 30}\nset size of front window to {item 1 of sz, item 2 of sz / 2}\n"
        else:
            tile_script += "set position of front window to {0, 30}\nset size of front window to {item 1 of sz / 2, item 2 of sz / 2}\n"
        tile_script += "end tell"
        osa(tile_script)
        return {"status": "ok", "layout": layout}

    return router
