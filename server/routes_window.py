"""Window management routes — switcher, focus, close, fullscreen, arrange, tile (10 routes)."""

import logging
import threading
import time

from fastapi import APIRouter, HTTPException, Request

from osa_run import osa

# ── Window Arrange constants (Chinese macOS menu names) ──
# ponytail: 菜单项按中文名匹配(mini 系统为中文);系统语言改英文需加名称映射表。
_WIN_MENU = "窗口"
_MR_SUB = "移动与调整大小"   # Move & Resize 子菜单
_FS_SUB = "全屏幕平铺"        # Full-Screen Tile 子菜单
_ARRANGE_MAP = {
    "left":     (_MR_SUB, "左侧"),
    "right":    (_MR_SUB, "右侧"),
    "top":      (_MR_SUB, "顶部"),
    "bottom":   (_MR_SUB, "底部"),
    "fill":     (None, "填充"),
    "restore":  (_MR_SUB, "恢复上一个大小"),
    "fs-left":  (_FS_SUB, "屏幕左侧"),
    "fs-right": (_FS_SUB, "屏幕右侧"),
}


def _menu_ref(submenu, item):
    base = f'menu 1 of menu bar item "{_WIN_MENU}" of menu bar 1'
    if submenu:
        return f'menu item "{item}" of menu 1 of menu item "{submenu}" of {base}'
    return f'menu item "{item}" of {base}'


def _run_osa(lines):
    r = osa("\n".join(lines))
    if r.returncode != 0:
        return False, (r.stderr or "").strip()[:200]
    return True, r.stdout.strip()


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

    # ── Window Arrange (native macOS tiling via System Events menu click) ──

    @router.post("/api/system/window/arrange")
    async def sys_arrange(body: dict):
        action = body.get("action", "")
        if action not in _ARRANGE_MAP:
            return {"success": False, "error": f"unknown action: {action}"}
        submenu, item = _ARRANGE_MAP[action]
        lines = [
            'tell application "System Events"',
            'tell (first process whose frontmost is true)',
            f'click {_menu_ref(submenu, item)}',
            'end tell',
            'end tell',
        ]
        ok, out = _run_osa(lines)
        return ({"success": ok, "action": action, "result": out} if ok
                else {"success": False, "error": out})

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
