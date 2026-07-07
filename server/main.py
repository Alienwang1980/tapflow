"""Smart Touch Panel — FastAPI WebSocket server with profile CRUD, window watcher, and mDNS."""
import json
import logging
import os
import socket
import sys
import uuid
import asyncio
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

# Ensure server directory on path
_server_dir = os.path.dirname(os.path.abspath(__file__))
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from connection_manager import manager
from input_engine import press_key, type_text, is_accessibility_enabled, HAVE_QUARTZ
from profile_manager import profile_manager as profiles

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
logger = logging.getLogger("stp.main")

app = FastAPI(title="Smart Touch Panel")

CLIENT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "client")
os.makedirs(CLIENT_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=CLIENT_DIR), name="static")

# ── mDNS state ──
mdns_info = {"enabled": False, "service_name": "Smart Touch Panel", "port": 8082, "addresses": []}
HAVE_ZEROCONF = False
try:
    from zeroconf import ServiceInfo, Zeroconf
    HAVE_ZEROCONF = True
except ImportError:
    logger.warning("zeroconf not installed — mDNS disabled")

_zeroconf_instance = None



async def broadcast_profile_update(filename: str):
    """Load profile from disk and broadcast to all WebSocket clients."""
    p = profiles.get_profile(filename)
    if p:
        await manager.broadcast({
            "type": "profile_update",
            "profile": p,
            "filename": filename,
        })
        logger.info(f"Broadcast profile update: {filename} to {manager.count} clients")


def get_local_ips():
    """Return list of local non-loopback IPs."""
    ips = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET, socket.SOCK_STREAM):
            ip = info[4][0]
            if not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass
    return ips


def start_mdns():
    """Advertise this server via mDNS (Bonjour)."""
    import socket
    global _zeroconf_instance
    if not HAVE_ZEROCONF:
        return False
    try:
        _zeroconf_instance = Zeroconf()
        addresses = [socket.inet_aton(ip) for ip in get_local_ips()]
        if not addresses:
            logger.warning("mDNS: no local addresses found")
            return False
        service = ServiceInfo(
            type_="_http._tcp.local.",
            name=f"{mdns_info['service_name']}._http._tcp.local.",
            addresses=addresses,
            port=mdns_info["port"],
            properties={"path": "/", "version": "1.0"},
        )
        _zeroconf_instance.register_service(service)
        mdns_info["enabled"] = True
        mdns_info["addresses"] = get_local_ips()
        logger.info(f"mDNS registered: {mdns_info['service_name']} on port {mdns_info['port']}")
        return True
    except Exception as e:
        logger.warning(f"mDNS failed: {e}")
        return False


def stop_mdns():
    global _zeroconf_instance
    if _zeroconf_instance:
        try:
            _zeroconf_instance.close()
        except Exception:
            pass
        _zeroconf_instance = None
    mdns_info["enabled"] = False


# ── Window watcher ──
window_watcher = None
HAVE_WINDOW_WATCHER = False
try:
    from window_watcher import WindowWatcher
    HAVE_WINDOW_WATCHER = True
except ImportError as e:
    logger.warning(f"window_watcher not available: {e}")


def on_app_changed(bundle_id: str, app_name: str):
    """Callback when foreground app changes — broadcasts auto-switch."""
    match = profiles.match_app_to_page(bundle_id, app_name)
    if match:
        logger.info(f"App switch: {app_name} ({bundle_id}) → page '{match['page']}'")
        try:
            loop = asyncio.get_event_loop()
            loop.call_soon_threadsafe(
                lambda: asyncio.ensure_future(
                    manager.broadcast({
                        "type": "profile_switch",
                        "page": match["page"],
                        "app": app_name,
                    })
                )
            )
        except Exception as e:
            logger.warning(f"Broadcast error: {e}")


def start_window_watcher():
    global window_watcher
    if not HAVE_WINDOW_WATCHER:
        return False
    try:
        window_watcher = WindowWatcher(callback=on_app_changed)
        window_watcher.start()
        logger.info("Window watcher started")
        return True
    except Exception as e:
        logger.warning(f"Window watcher start failed: {e}")
        return False


def stop_window_watcher():
    global window_watcher
    if window_watcher:
        window_watcher.stop()
        window_watcher = None


# ── Key handling ──

def handle_key_action(action: dict) -> str:
    action_type = action.get("type", "press")
    key = action.get("key", "")
    if not key:
        return "no_key"
    try:
        if action_type in ("press", "key"):
            press_key(key)
            return "ok"
        elif action_type == "text":
            type_text(key)
            return "ok"
        elif action_type == "down":
            from input_engine import press_key_down
            press_key_down(key)
            return "ok_down"
        elif action_type == "up":
            from input_engine import release_key
            release_key(key)
            return "ok_up"
        else:
            logger.warning(f"Unknown action type: {action_type}")
            return "unknown_type"
    except ValueError as e:
        logger.warning(f"Key parse error: {e}")
        return "bad_key"


# ── Routes ──

@app.get("/")
async def root():
    index_path = os.path.join(CLIENT_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path) as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Smart Touch Panel</h1><p>Client files missing.</p>")



@app.get("/editor")
async def editor():
    """Serve the editor page for the Mac native app."""
    editor_path = os.path.join(CLIENT_DIR, "editor.html")
    if os.path.exists(editor_path):
        with open(editor_path) as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Editor not found</h1>", status_code=404)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": "quartz" if HAVE_QUARTZ else "simulate",
        "accessibility": is_accessibility_enabled(),
        "clients": manager.count,
        "mdns": mdns_info,
        "window_watcher": window_watcher is not None,
        "local_ips": get_local_ips(),
    }


# ── Profile REST API ──

@app.get("/api/profiles")
async def list_profiles():
    return {"profiles": profiles.list_profiles()}


@app.get("/api/profiles/{filename:path}")
async def get_profile(filename: str):
    p = profiles.get_profile(filename)
    if p is None:
        raise HTTPException(404, f"Profile not found: {filename}")
    return p


@app.post("/api/profiles")
async def save_profile(body: dict):
    if not body:
        raise HTTPException(400, "Empty body")
    filename = profiles.save_profile(body)
    return {"status": "saved", "filename": filename}


@app.delete("/api/profiles/{filename:path}")
async def delete_profile(filename: str):
    ok = profiles.delete_profile(filename)
    if not ok:
        raise HTTPException(404, f"Profile not found: {filename}")
    return {"status": "deleted", "filename": filename}


# ── WebSocket ──

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    client_id = str(uuid.uuid4())[:8]
    await manager.connect(client_id, websocket)
    # Send default profile on connect
    default = profiles.get_profile("Default.json") or profiles.get_profile(
        profiles.list_profiles()[0]["filename"] if profiles.list_profiles() else None
    )
    if default:
        await manager.send_to(client_id, {"type": "profile", "profile": default, "filename": "Default.json"})
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")
            if msg_type == "key":
                keys = data.get("keys", [])
                if not keys and "key" in data:
                    keys = [{"type": data.get("action", "press"), "key": data["key"]}]
                results = [handle_key_action(k) for k in keys]
                await manager.send_to(client_id, {"type": "ack", "results": results})
            elif msg_type == "profile_saved":
                # Editor saved a profile — broadcast to all clients
                fn = data.get("filename", "Default.json")
                await broadcast_profile_update(fn)
                await manager.send_to(client_id, {"type": "ack", "action": "profile_saved", "filename": fn})
            elif msg_type == "ping":
                await manager.send_to(client_id, {"type": "pong"})
            else:
                logger.debug(f"Unknown msg type from {client_id}: {msg_type}")
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WS error {client_id}: {e}")
        manager.disconnect(client_id)


# ── Lifecycle ──

@app.on_event("startup")
async def startup():
    start_mdns()
    start_window_watcher()


@app.on_event("shutdown")
async def shutdown():
    stop_mdns()
    stop_window_watcher()


def main(host="0.0.0.0", port=8082):
    import uvicorn
    uvicorn.run(app, host=host, port=port, log_level="info", reload=False)


if __name__ == "__main__":
    main()
