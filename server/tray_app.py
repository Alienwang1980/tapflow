"""
Smart Touch Panel — macOS system tray app.
Menu bar icon + FastAPI server + QR code + accessibility check.
"""
import logging
import os
import socket
import threading

import pystray
from PIL import Image, ImageDraw

from main import app
from editor_app import open_editor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
logger = logging.getLogger("stp.tray")

TITLE = "Smart Touch Panel"
TOOLTIP = "Smart Touch Panel — Touch Input Server"


def get_local_ip() -> str:
    """Get the primary LAN IP."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("192.168.2.1", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def check_accessibility() -> bool:
    """Check Accessibility permission (silent — no system prompt)."""
    try:
        from ApplicationServices import AXIsProcessTrusted
        return AXIsProcessTrusted()
    except ImportError:
        return False


def create_icon_image(size=64):
    """Generate a simple icon: blue circle with 'STP' text."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = 4
    draw.ellipse([margin, margin, size - margin, size - margin],
                 fill=(22, 33, 62, 255), outline=(233, 69, 96, 255), width=3)
    # Draw a simple touch indicator: concentric circles
    cx, cy = size // 2, size // 2
    draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(233, 69, 96, 200))
    return img


def run_server():
    """Run FastAPI server in background thread."""
    import uvicorn, json as _json, os as _os, re as _re, logging as _logging
    from profile_manager import profile_manager as _pm
    from connection_manager import manager as _mgr
    _logger = _logging.getLogger("stp.widgets")
    _current_profile = "Default.json"
    # Load persisted active profile
    _profile_state_file = _os.path.join(_os.path.expanduser("~/Library/Application Support/Smart Touch Panel"), "active_profile.txt")
    try:
        if _os.path.exists(_profile_state_file):
            with open(_profile_state_file) as _f:
                _saved = _f.read().strip()
                if _saved and _pm.get_profile(_saved):
                    _current_profile = _saved
                    _logger.info(f"Restored active profile: {_current_profile}")
    except Exception: pass
    
    
    @app.get("/api/test-ws-override")
    async def _test_ws():
        return {"ws_override": True, "active": _current_profile}

    @app.get("/api/active-profile")
    async def _get_active_profile():
        nonlocal _current_profile
        p = _pm.get_profile(_current_profile)
        if p: return {"profile": p, "filename": _current_profile}
        from fastapi import HTTPException; raise HTTPException(404, "No active profile")
    
    @app.post("/api/active-profile")
    async def _set_active_profile(body: dict):
        nonlocal _current_profile
        _current_profile = body.get("filename", "Default.json")
        try:
            with open(_profile_state_file, "w") as _f:
                _f.write(_current_profile)
        except Exception: pass
        return {"active": _current_profile}
    
    @app.get("/api/deepseek/balance")
    async def _get_balance(api_key: str = ""):
        import urllib.request
        if not api_key:
            from fastapi import HTTPException; raise HTTPException(400, "Missing api_key")
        try:
            req = urllib.request.Request(
                "https://api.deepseek.com/user/balance",
                headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"})
            body = urllib.request.urlopen(req, timeout=10).read()
            return _json.loads(body)
        except Exception as e:
            from fastapi import HTTPException; raise HTTPException(500, str(e))
    
    _logger.info("Widget routes registered")
        
    # Override WS connect to send active profile
    from fastapi import WebSocket as _WS, WebSocketDisconnect as _WSD
    import uuid as _uuid
    
    @app.websocket("/ws")
    async def _ws_override(websocket: _WS):
        nonlocal _current_profile
        cid = str(_uuid.uuid4())[:8]
        await _mgr.connect(cid, websocket)
        p = _pm.get_profile(_current_profile)
        if not p and _pm.list_profiles():
            _current_profile = _pm.list_profiles()[0]["filename"]
            p = _pm.get_profile(_current_profile)
        if p:
            await _mgr.send_to(cid, {"type": "profile", "profile": p, "filename": _current_profile})
        try:
            while True:
                data = await websocket.receive_json()
                mt = data.get("type", "")
                if mt == "touchpad":
                    from input_engine import move_mouse, scroll_mouse, click_mouse, mouse_down, mouse_up
                    action = data.get("action", "move")
                    if action == "move": move_mouse(float(data.get("dx",0)), float(data.get("dy",0)), drag=data.get("drag",False))
                    elif action == "scroll": scroll_mouse(float(data.get("dx",0)), float(data.get("dy",0)))
                    elif action == "click": click_mouse(data.get("button","left"))
                    elif action == "mousedown": mouse_down(data.get("button","left"))
                    elif action == "mouseup": mouse_up(data.get("button","left"))
                    await _mgr.send_to(cid, {"type": "ack", "action": "touchpad"})
                elif mt == "key":
                    keys = data.get("keys", [])
                    if not keys and "key" in data: keys = [{"type": data.get("action","press"), "key": data["key"]}]
                    from main import handle_key_action
                    results = [handle_key_action(k) for k in keys]
                    await _mgr.send_to(cid, {"type": "ack", "results": results})
                elif mt == "profile_saved":
                    fn = data.get("filename", "Default.json")
                    _current_profile = fn
                    try:
                        with open(_profile_state_file, "w") as _f: _f.write(_current_profile)
                    except Exception: pass
                    from main import broadcast_profile_update
                    await broadcast_profile_update(fn)
                    await _mgr.send_to(cid, {"type": "ack", "action": "profile_saved", "filename": fn})
                elif mt == "ping":
                    await _mgr.send_to(cid, {"type": "pong"})
        except _WSD:
            _mgr.disconnect(cid)
        except Exception:
            _mgr.disconnect(cid)
    
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="warning")


def on_show_qr(icon, item):
    """Print QR code URL to console."""
    ip = get_local_ip()
    url = f"http://{ip}:8082"
    print(f"\n{'='*50}")
    print(f"  Smart Touch Panel")
    print(f"  Open in iPad browser: {url}")
    print(f"{'='*50}\n")
    os.system(f"open {url}")  # Open in default browser


def on_open_editor(icon, item):
    """Open the keyboard layout editor in a native window."""
    import threading
    threading.Thread(target=open_editor, daemon=True).start()


def on_show_health(icon, item):
    """Show server health."""
    import urllib.request, json
    try:
        resp = urllib.request.urlopen("http://localhost:8082/health", timeout=2)
        data = json.loads(resp.read())
        print(f"\n  Status: {data.get('status')}")
        print(f"  Clients: {data.get('clients')}")
        print(f"  Accessibility: {data.get('accessibility')}")
        print(f"  Engine: {data.get('engine')}\n")
    except Exception as e:
        print(f"\n  Server not reachable: {e}\n")


def on_quit(icon, item):
    """Quit the app."""
    icon.stop()


def run_tray():
    """Create and run the system tray icon."""
    ip = get_local_ip()
    url = f"http://{ip}:8082"

    menu = pystray.Menu(
        pystray.MenuItem("✏️ Open Editor", on_open_editor, default=True),
        pystray.MenuItem(f"🔗 {url}", on_show_qr),
        pystray.MenuItem("📋 Health", on_show_health),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("❌ Quit", on_quit),
    )

    icon = pystray.Icon(
        "smart-touch-panel",
        create_icon_image(),
        TOOLTIP,
        menu,
    )

    # Check accessibility on start
    acc_ok = check_accessibility()
    if acc_ok:
        logger.info("Accessibility permission: ✅")
    else:
        logger.warning("Accessibility permission: ❌ — check System Settings")

    logger.info(f"Server URL: {url}")
    icon.run()


def main():
    # Start FastAPI in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    logger.info("Server starting on port 8082...")

    # Run tray icon on main thread
    run_tray()


if __name__ == "__main__":
    main()
