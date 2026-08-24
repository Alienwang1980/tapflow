"""Tapflow — FastAPI WebSocket server with profile CRUD, window watcher, and mDNS."""
import json
import logging
import os
import socket
import sys
import uuid
import asyncio
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

# Ensure server directory on path
_server_dir = os.path.dirname(os.path.abspath(__file__))
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from connection_manager import manager
from input_engine import press_key, press_key_down, release_key, _post_key_event, type_text, is_accessibility_enabled, HAVE_QUARTZ
from profile_manager import profile_manager as profiles, _safe_path
from deepseek_pricing import snapshot as pricing_snapshot, start as pricing_start
from today_spent import today_spent

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
logger = logging.getLogger("stp.main")

app = FastAPI(title="Tapflow")

# Bundle-aware resource path
def _get_resource_dir() -> str:
    """Get the resource directory. Works in both dev and py2app bundle."""
    if getattr(sys, 'frozen', False):
        # py2app: Resources dir is ../Resources relative to executable
        return os.path.join(os.path.dirname(sys.executable), "..", "Resources")
    else:
        return os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

RESOURCE_DIR = _get_resource_dir()
CLIENT_DIR = os.path.join(RESOURCE_DIR, "client")
UPLOAD_DIR = os.path.join(os.path.expanduser("~/Library/Application Support/Tapflow"), "uploads")

def _trackpad_scaling() -> float:
    """系统触控板跟踪速度(com.apple.trackpad.scaling, 0.0–3.0),实时读。
    键不存在(用户从未动过滑条)→ 1.0 保持基线手感。"""
    try:
        from CoreFoundation import CFPreferencesCopyAppValue, kCFPreferencesAnyApplication
        v = CFPreferencesCopyAppValue("com.apple.trackpad.scaling", kCFPreferencesAnyApplication)
        if v is None:
            return 1.0
        f = float(v)
        if f != f or abs(f) == float("inf"):
            return 1.0
        return max(0.25, min(3.0, f))
    except Exception:
        return 1.0

def _natural_scroll() -> bool:
    """系统"自然滚动"(com.apple.swipescrolldirection),实时读;键不存在 → False(传统)。"""
    try:
        from CoreFoundation import CFPreferencesCopyAppValue, kCFPreferencesAnyApplication
        v = CFPreferencesCopyAppValue("com.apple.swipescrolldirection", kCFPreferencesAnyApplication)
        return bool(v)
    except Exception:
        return False

# ── 全局字体(统一字体,2026-08-16)──
# "" = 系统默认(-apple-system)。存 config.json 的 fontFamily 键;tray_app 设置面板修改后
# 调 set_font_family() → 持久化 + WS 广播,面板/编辑器实时生效,无需重启。
FONT_FAMILY = ""
_server_loop = None  # 服务线程的 event loop,由 startup 钩子捕获

def _cfg_path() -> str:
    return os.path.join(os.path.expanduser("~/Library/Application Support/Tapflow"), "config.json")

def load_font_family() -> None:
    """启动时从 config.json 读 fontFamily(失败/缺省 → 系统默认)。"""
    global FONT_FAMILY
    try:
        with open(_cfg_path(), "r", encoding="utf-8") as f:
            cfg = json.load(f)
        FONT_FAMILY = str(cfg.get("fontFamily") or "")
    except Exception:
        FONT_FAMILY = ""

def set_font_family(name: str) -> None:
    """tray_app 设置面板调用:内存 + config.json 持久化 + WS 广播(任意线程安全)。"""
    global FONT_FAMILY
    FONT_FAMILY = str(name or "")
    try:
        cfg = {}
        try:
            with open(_cfg_path(), "r", encoding="utf-8") as f:
                cfg = json.load(f)
        except Exception:
            pass
        cfg["fontFamily"] = FONT_FAMILY
        with open(_cfg_path(), "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning("写 config.json fontFamily 失败: %s", e)
    if _server_loop is not None and _server_loop.is_running():
        try:
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "settings", "fontFamily": FONT_FAMILY}),
                _server_loop)
        except Exception:
            pass

load_font_family()
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, check_dir=False), name="uploads")
app.mount("/static", StaticFiles(directory=CLIENT_DIR, check_dir=False), name="static")

# ── mDNS state ──
mdns_info = {"enabled": False, "service_name": "Tapflow", "port": 8082, "addresses": []}
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
    # "+" combo: split into individual keys
    #   Has regular key → CGEventSetFlags (reliable, like original)
    #   Modifier-only   → simple split with delay (avoids stuck modifiers)
    if '+' in key:
        import time
        from input_engine import _MOD_NAMES, _MOD_FLAGS, KEYCODE_MAP as _KCM
        parts = [p.strip() for p in key.upper().split('+')]
        mods = [p for p in parts if p in _MOD_NAMES]
        keys = [p for p in parts if p not in _MOD_NAMES]
        if action_type == "down":
            if keys:
                flags = 0
                for mod in mods:
                    flags |= _MOD_FLAGS.get(mod, 0)
                    press_key_down(mod)
                    time.sleep(0.02)
                for k in keys:
                    kc = _KCM.get(k)
                    if kc:
                        _post_key_event(kc, True, flags)
                    time.sleep(0.02)
            else:
                # Release all modifiers first to clear any stuck state
                from input_engine import _MOD_NAMES as _MN2
                for mn in ['LCOMMAND','RCOMMAND','LSHIFT','RSHIFT','LCONTROL','RCONTROL','LOPTION','ROPTION','FN']:
                    try: release_key(mn)
                    except: pass
                time.sleep(0.03)
                for p in parts:
                    press_key_down(p)
                    time.sleep(0.02)
            return "ok_down"
        elif action_type == "up":
            if keys:
                for k in reversed(keys):
                    kc = _KCM.get(k)
                    if kc:
                        _post_key_event(kc, False, 0)
                    time.sleep(0.02)
                for mod in reversed(mods):
                    release_key(mod)
                    time.sleep(0.02)
            else:
                for p in reversed(parts):
                    release_key(p)
                    time.sleep(0.02)
            return "ok_up"
        else:
            press_key(key)
            return "ok"
    try:
        if action_type in ("press", "key"):
            logger.info(f"KEY_EVENT press: {key}")
            press_key(key)
            return "ok"
        elif action_type == "text":
            type_text(key)
            return "ok"
        elif action_type == "down":
            logger.info(f"KEY_EVENT down: {key}")
            press_key_down(key)
            return "ok_down"
        elif action_type == "up":
            logger.info(f"KEY_EVENT up: {key}")
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
        with open(index_path, encoding='utf-8') as f:
            from fastapi.responses import HTMLResponse as HR
            return HR(content=f.read(), headers={"Cache-Control":"no-cache, no-store, must-revalidate"})
    return HTMLResponse("<h1>Tapflow</h1><p>Client files missing.</p>")



@app.get("/editor")
async def editor():
    """Serve the editor page for the Mac native app."""
    editor_path = os.path.join(CLIENT_DIR, "editor.html")
    if os.path.exists(editor_path):
        with open(editor_path, encoding='utf-8') as f:
            from fastapi.responses import HTMLResponse as HR
            return HR(content=f.read(), headers={"Cache-Control":"no-cache, no-store, must-revalidate"})
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


@app.get("/api/config")
async def api_config():
    """面板/编辑器启动时拉取全局配置(统一字体)。"""
    return {"fontFamily": FONT_FAMILY}


# ── Profile REST API ──



@app.post("/api/upload")
async def upload_image(file: UploadFile):
    """Upload an image file (max 5MB)."""
    import uuid as _uuid
    import os as _os
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files allowed")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(413, "File too large (max 5MB)")
    _os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = _os.path.splitext(file.filename or "img.png")[1] or ".png"
    fname = _uuid.uuid4().hex + ext
    with open(_os.path.join(UPLOAD_DIR, fname), "wb") as f:
        f.write(contents)
    return {"path": f"uploads/{fname}"}

@app.get("/api/default-template")
async def default_template():
    """Return the 89-key default keyboard template."""
    from profile_manager import _load_default_template
    return _load_default_template()

@app.get("/api/bundled-profiles")
async def list_bundled_profiles():
    """List default profiles shipped inside the app bundle (available for import)."""
    return {"profiles": profiles.list_bundled()}

@app.post("/api/bundled-profiles/{filename}")
async def import_bundled_profile(filename: str):
    """Import a bundled default profile into the user's profiles directory."""
    saved = profiles.import_bundled(filename)
    if not saved:
        raise HTTPException(404, f"Bundled profile not found: {filename}")
    return {"status": "imported", "filename": saved}

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
    # DEBUG: log active-app closeSound
    for p in body.get("pages", []):
        for k in p.get("keys", []):
            if k.get("action") == "active-app":
                logger.info(f"SAVE DEBUG active-app: sound={k.get('sound')!r} closeSound={k.get('closeSound')!r}")
    forced_name = body.pop("_filename", None)
    filename = profiles.save_profile(body, forced_name)
    await broadcast_profile_update(filename)
    return {"status": "saved", "filename": filename}



@app.post("/api/profiles/import")
async def import_profile(body: dict):
    """Import an exported profile JSON. Auto-renames on any name conflict."""
    if not isinstance(body, dict) or not body:
        raise HTTPException(400, "Body must be a profile JSON object")
    if not isinstance(body.get("pages"), list):
        raise HTTPException(400, "Not a valid profile: missing 'pages' list")
    filename = profiles.import_profile(body)
    p = profiles.get_profile(filename)
    return {"status": "imported", "filename": filename,
            "profileName": p.get("profileName") if p else filename}


@app.patch("/api/profiles/{filename:path}")
async def update_profile_meta(filename: str, body: dict):
    """Update profile name without renaming the file."""
    path = _safe_path(profiles.dir, filename)
    if not path.exists():
        raise HTTPException(404, f"Profile not found: {filename}")
    profile = json.loads(path.read_text(encoding='utf-8'))
    if "profileName" in body:
        profile["profileName"] = body["profileName"]
    path.write_text(json.dumps(profile, indent=2, ensure_ascii=False), encoding='utf-8')
    return {"status": "updated", "filename": filename, "profileName": profile["profileName"]}

@app.put("/api/profiles/{filename:path}/rename")
async def rename_profile(filename: str, body: dict):
    """Rename a profile file."""
    new_name = body.get("newName", "").strip()
    if not new_name:
        raise HTTPException(400, "newName required")
    import os as _os
    old_path = _safe_path(profiles.dir, filename)
    if not old_path.exists():
        raise HTTPException(404, f"Profile not found: {filename}")
    new_filename = new_name + ".json" if not new_name.endswith(".json") else new_name
    new_path = _safe_path(profiles.dir, new_filename)
    if new_path.exists() and new_path != old_path:
        raise HTTPException(409, f"Profile already exists: {new_filename}")
    _os.rename(str(old_path), str(new_path))
    return {"status": "renamed", "filename": new_filename}

@app.delete("/api/profiles/{filename:path}")
async def delete_profile(filename: str):
    ok = profiles.delete_profile(filename)
    if not ok:
        raise HTTPException(404, f"Profile not found: {filename}")
    return {"status": "deleted", "filename": filename}



# ── Deepseek Balance ──

@app.get("/api/deepseek/balance")
async def get_deepseek_balance(profile: str = "", key_id: str = ""):
    """Query Deepseek balance. Server reads API key from profile, never exposes it."""
    import urllib.request, urllib.error
    if not profile or not key_id:
        raise HTTPException(400, "Missing profile or key_id parameter")
    api_key = profiles.get_key_api_key(profile, key_id)
    if not api_key:
        raise HTTPException(400, "No API key configured for this balance key")
    try:
        req = urllib.request.Request(
            "https://api.deepseek.com/user/balance",
            headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
        )
        body = urllib.request.urlopen(req, timeout=10).read()
        data = json.loads(body)
        # Attach current pricing period/table + today's spend (midnight-snapshot ledger)
        bi = (data.get("balance_infos") or [{}])[0]
        total = float(bi.get("total_balance") or 0)
        data["pricing"] = pricing_snapshot()
        data["today_spent"] = today_spent(profile, key_id, total)
        return data
    except urllib.error.HTTPError as e:
        # 401 = the API key itself was rejected — not a network problem
        if e.code == 401:
            raise HTTPException(400, "Invalid API key (DeepSeek rejected it)")
        raise HTTPException(502, f"DeepSeek API error {e.code}")
    except Exception as e:
        raise HTTPException(500, str(e))


@app.put("/api/profiles/{filename}/keys/{key_id}/api-key")
async def set_key_api_key(filename: str, key_id: str, body: dict):
    """Set API key for a balance key. The actual value is never returned to clients."""
    api_key = (body.get("apiKey") or "").strip()
    if not api_key:
        raise HTTPException(400, "apiKey is required")
    if not profiles.set_key_api_key(filename, key_id, api_key):
        raise HTTPException(404, "Key not found")
    return {"status": "ok"}

# ── WebSocket ──

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    client_id = str(uuid.uuid4())[:8]
    if not await manager.connect(client_id, websocket):
        return
    # Send default profile on connect
    default = profiles.get_profile("Default.json") or profiles.get_profile(
        profiles.list_profiles()[0]["filename"] if profiles.list_profiles() else None
    )
    if default:
        await manager.send_to(client_id, {"type": "profile", "profile": default, "filename": "Default.json"})
    try:
        while True:
            data = await websocket.receive_json()
            manager.touch(client_id)
            msg_type = data.get("type", "")
            if msg_type == "touchpad":
                action = data.get("action", "move")
                from input_engine import move_mouse, scroll_mouse, click_mouse, mouse_down, mouse_up
                # Clamp dx/dy to sane ranges; reject NaN/Inf
                def _safe_float(v, default=0.0, limit=2000.0):
                    try:
                        f = float(v)
                        if f != f or f == float('inf') or f == float('-inf'):
                            return default
                        return max(-limit, min(limit, f))
                    except (ValueError, TypeError):
                        return default
                btn_whitelist = {"left", "right", "middle"}
                def _safe_btn(b):
                    return b if b in btn_whitelist else "left"
                if action == "move":
                    dx = _safe_float(data.get("dx", 0))
                    dy = _safe_float(data.get("dy", 0))
                    is_drag = data.get("drag", False)
                    s = _trackpad_scaling()  # 跟随系统触控板跟踪速度
                    move_mouse(dx * s, dy * s, drag=is_drag)
                elif action == "scroll":
                    dx = _safe_float(data.get("dx", 0), limit=500.0)
                    dy = _safe_float(data.get("dy", 0), limit=500.0)
                    if _natural_scroll():  # 系统"自然滚动"开启时翻转方向
                        dy = -dy
                    scroll_mouse(dx, dy)
                elif action == "click":
                    click_mouse(_safe_btn(data.get("button", "left")))
                elif action == "mousedown":
                    mouse_down(_safe_btn(data.get("button", "left")))
                elif action == "mouseup":
                    mouse_up(_safe_btn(data.get("button", "left")))
                await manager.send_to(client_id, {"type": "ack", "action": "touchpad"})
            elif msg_type == "key":
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
            elif msg_type == "open-color-panel":
                import re as _re_cp
                color = data.get("color", "")
                if not _re_cp.fullmatch(r"#[0-9a-fA-F]{6}", color):
                    await manager.send_to(client_id, {"type": "color-error", "message": "invalid color"})
                else:
                    from color_panel import request_open
                    request_open(client_id, asyncio.get_running_loop(), color)
            elif msg_type == "close-color-panel":
                from color_panel import request_close
                request_close(client_id)
            else:
                logger.debug(f"Unknown msg type from {client_id}: {msg_type}")
    except WebSocketDisconnect:
        from color_panel import release
        release(client_id)
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WS error {client_id}: {e}")
        manager.disconnect(client_id)


# ── Lifecycle ──

@app.on_event("startup")
async def startup():
    global _server_loop
    _server_loop = asyncio.get_running_loop()
    start_mdns()
    start_window_watcher()
    pricing_start()


@app.on_event("shutdown")
async def shutdown():
    stop_mdns()
    stop_window_watcher()


def main(host="0.0.0.0", port=8082):
    import uvicorn
    uvicorn.run(app, host=host, port=port, log_level="info", reload=False)


if __name__ == "__main__":
    main()
