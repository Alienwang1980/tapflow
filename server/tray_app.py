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

from fastapi import Request
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


def _can_create_event_tap() -> bool:
    """Definitive accessibility check using CGEventTapCreate.
    More reliable than AXIsProcessTrusted() which has known stale-cache bugs on macOS 13+."""
    try:
        from Quartz import (
            CGEventTapCreate, kCGHIDEventTap, kCGHeadInsertEventTap,
            kCGEventTapOptionDefault, CGEventMaskBit, kCGEventLeftMouseDown
        )
        tap = CGEventTapCreate(
            kCGHIDEventTap, kCGHeadInsertEventTap,
            kCGEventTapOptionDefault,
            CGEventMaskBit(kCGEventLeftMouseDown),
            lambda proxy, type, event, refcon: event,
            None,
        )
        if tap is not None:
            from CoreFoundation import CFMachPortInvalidate
            CFMachPortInvalidate(tap)
            return True
        return False
    except Exception:
        return False


def check_accessibility() -> bool:
    """Check accessibility permission (silent, no system prompt)."""
    return _can_create_event_tap()


def request_accessibility_permission():
    """Open System Settings → Privacy → Accessibility.
    Always opens the pane — no conditional checks."""
    import subprocess as _sp4
    _sp4.run(["open", "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"])
    logger.info("Opened System Settings → Accessibility")


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
        import urllib.request, logging as _log2
        _log2.getLogger("stp.widgets").info(f"Balance API called, key={api_key[:12] if api_key else 'NONE'}...")
        if not api_key:
            from fastapi import HTTPException; raise HTTPException(400, "Missing api_key")
        try:
            req = urllib.request.Request(
                "https://api.deepseek.com/user/balance",
                headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"})
            body = urllib.request.urlopen(req, timeout=10).read()
            result = _json.loads(body)
            _log2.getLogger("stp.widgets").info(f"Balance API success: {result}")
            return result
        except Exception as e:
            _log2.getLogger("stp.widgets").error(f"Balance API failed: {e}")
            from fastapi import HTTPException; raise HTTPException(500, str(e))
    
    # ── System Control routes ──
    import subprocess as _sc
    _state = {"muted": False, "mic_pre": None}

    @app.get("/api/system/volume")
    async def _sys_vol():
        r = _sc.run(["osascript", "-e", "get volume settings"], capture_output=True, text=True)
        res = {"output_volume": 75, "input_volume": 50, "output_muted": False}
        for part in r.stdout.strip().split(","):
            p = part.strip()
            try:
                if "output volume" in p:
                    v = p.split(":")[1].strip()
                    if v != "missing value": res["output_volume"] = int(v)
                elif "input volume" in p:
                    v = p.split(":")[1].strip()
                    if v != "missing value": res["input_volume"] = int(v)
                elif "output muted" in p:
                    pass
            except: pass
        res["output_muted"] = _state["muted"]; return res

    @app.post("/api/system/volume")
    async def _sys_vol_set(body: dict):
        v = max(0, min(100, int(body.get("value", 75))))
        _sc.run(["osascript", "-e", f"set volume output volume {v}"])
        return {"status": "ok"}

    @app.post("/api/system/mute")
    async def _sys_mute():
        _state["muted"] = not _state["muted"]
        _sc.run(["osascript", "-e", f"set volume output muted {str(_state['muted']).lower()}"])
        return {"muted": _state["muted"]}

    @app.post("/api/system/mic-mute")
    async def _sys_mic_mute():
        r = _sc.run(["osascript", "-e", "get volume settings"], capture_output=True, text=True)
        cur_vol = 50
        for part in r.stdout.strip().split(","):
            if "input volume" in part:
                cur_vol = int(part.split(":")[1].strip())
                break
        if cur_vol > 0:
            _state["mic_pre"] = cur_vol
            _sc.run(["osascript", "-e", "set volume input volume 0"])
            _state["mic_muted"] = True
        else:
            restore = _state.get("mic_pre", 50)
            _sc.run(["osascript", "-e", f"set volume input volume {restore}"])
            _state["mic_muted"] = False
        return {"muted": _state.get("mic_muted", False)}
    # ── Accessibility & Mic Permission endpoints ──
    @app.get("/api/system/accessibility")
    async def _sys_acc_status():
        return {"granted": check_accessibility()}

    @app.post("/api/system/accessibility")
    async def _sys_acc_request():
        """Open System Settings → Privacy → Accessibility."""
        request_accessibility_permission()
        return {"granted": check_accessibility()}

    @app.get("/api/system/mic-permission")
    async def _sys_mic_status():
        try:
            from AVFoundation import AVCaptureDevice, AVMediaTypeAudio
            s = AVCaptureDevice.authorizationStatusForMediaType_(AVMediaTypeAudio)
            return {"status": s, "label": {0:"NotDetermined",1:"Denied",2:"Restricted",3:"Authorized"}.get(s)}
        except Exception:
            return {"status": -1, "label": "error"}

    @app.post("/api/system/mic-permission")
    async def _sys_mic_request():
        """Open System Settings → Privacy → Microphone."""
        request_mic_permission()
        try:
            from AVFoundation import AVCaptureDevice, AVMediaTypeAudio
            s = AVCaptureDevice.authorizationStatusForMediaType_(AVMediaTypeAudio)
            return {"status": s}
        except Exception:
            return {"status": -1}

    # ── Mic Level Sampler (AVAudioRecorder — zero external process, built-in metering) ──
    _mic_level = 0.0
    _mic_sampling = False
    _mic_recorder = None
    _mic_monitor_enabled = False

    def _start_mic_sampler():
        nonlocal _mic_sampling, _mic_recorder
        if _mic_sampling:
            return
        _mic_sampling = True
        import threading as _th, logging as _log, tempfile, os as _os2
        _logger = _log.getLogger("stp.mic")

        # Create AVAudioRecorder with a dummy file — we never read it,
        # we only use the built-in averagePowerForChannel: metering.
        from AVFoundation import (
            AVAudioRecorder, NSURL,
        )

        _tmp = tempfile.NamedTemporaryFile(suffix=".m4a", delete=False)
        _tmp.close()
        _dummy_path = _tmp.name
        _url = NSURL.fileURLWithPath_(_dummy_path)

        _settings = {
            "AVFormatIDKey": 1633772320,  # kAudioFormatMPEG4AAC
            "AVSampleRateKey": 22050.0,
            "AVNumberOfChannelsKey": 1,
        }
        _recorder, _err = AVAudioRecorder.alloc().initWithURL_settings_error_(
            _url, _settings, None)

        if _recorder is None:
            _logger.error(f"AVAudioRecorder init failed: {_err}")
            _os2.unlink(_dummy_path)
            _mic_sampling = False
            return

        _mic_recorder = _recorder
        _recorder.setMeteringEnabled_(True)
        _recorder.record()

        def _sample():
            nonlocal _mic_level
            import time as _time3
            while _mic_sampling:
                try:
                    _recorder.updateMeters()
                    db = _recorder.averagePowerForChannel_(0)
                    _mic_level = max(0.0, min(1.0, (db + 50.0) / 50.0))
                    _time3.sleep(0.2)
                except Exception as _e:
                    _logger.error(f"Mic sampler error: {_e}")
                    _time3.sleep(0.5)
        _th.Thread(target=_sample, daemon=True).start()
        _logger.info("Mic sampler started (AVAudioRecorder)")

    def _stop_mic_sampler():
        nonlocal _mic_sampling, _mic_recorder
        _mic_sampling = False
        if _mic_recorder:
            try:
                _mic_recorder.stop()
            except Exception:
                pass
            _mic_recorder = None
        _logger.info("Mic sampler stopped")

    @app.get("/api/system/mic-monitor")
    async def _sys_mic_monitor_get():
        nonlocal _mic_monitor_enabled
        return {"enabled": _mic_monitor_enabled}

    @app.post("/api/system/mic-monitor")
    async def _sys_mic_monitor_set(body: dict):
        nonlocal _mic_monitor_enabled
        enabled = body.get("enabled", False)
        _mic_monitor_enabled = enabled
        if enabled:
            _start_mic_sampler()
        else:
            _stop_mic_sampler()
        return {"enabled": _mic_monitor_enabled}

    @app.get("/api/system/mic-level")
    async def _sys_mic_level():
        nonlocal _mic_sampling, _mic_monitor_enabled
        if not _mic_monitor_enabled:
            return {"level": 0.0}
        if not _mic_sampling:
            _start_mic_sampler()
        return {"level": round(_mic_level, 4)}

    @app.get("/api/system/audio-devices")
    async def _sys_adev():
        sw = os.path.expanduser("~/Library/Application Support/Smart Touch Panel/bin/SwitchAudioSource")
        if not os.path.exists(sw): return []
        env = {"LANG":"C","PATH":os.environ.get("PATH","")}
        devs = []
        for dtype, dlabel in [("output","output"),("input","input")]:
            cur_r = _sc.run([sw, "-c", "-t", dtype], capture_output=True, encoding="utf-8", env=env)
            cur_name = cur_r.stdout.strip()
            r2 = _sc.run([sw, "-a", "-t", dtype], capture_output=True, encoding="utf-8", env=env)
            for line in r2.stdout.strip().splitlines():
                ls = line.strip()
                if not ls: continue
                devs.append({"name": ls, "type": dlabel, "current": ls == cur_name})
        return devs

    @app.post("/api/system/audio-output")
    async def _sys_aout(body: dict):
        sw = os.path.expanduser("~/Library/Application Support/Smart Touch Panel/bin/SwitchAudioSource")
        if os.path.exists(sw):
            _sc.run([sw, "-t", "output", "-s", body.get("name", "")])
        return {"status": "ok"}

    @app.post("/api/system/audio-input")
    async def _sys_ain(body: dict):
        sw = os.path.expanduser("~/Library/Application Support/Smart Touch Panel/bin/SwitchAudioSource")
        if os.path.exists(sw):
            _sc.run([sw, "-t", "input", "-s", body.get("name", "")])
        return {"status": "ok"}

    def _cycle_audio_device(dtype: str):
        """Cycle to the next audio device of the given type. Returns status + new name."""
        sw = os.path.expanduser("~/Library/Application Support/Smart Touch Panel/bin/SwitchAudioSource")
        if not os.path.exists(sw):
            return {"status": "error", "reason": "SwitchAudioSource not found"}
        env = {"LANG":"C","PATH":os.environ.get("PATH","")}
        cur_r = _sc.run([sw, "-c", "-t", dtype], capture_output=True, encoding="utf-8", env=env)
        cur_name = cur_r.stdout.strip()
        r = _sc.run([sw, "-a", "-t", dtype], capture_output=True, encoding="utf-8", env=env)
        names = []
        for line in r.stdout.strip().splitlines():
            ls = line.strip()
            if not ls: continue
            names.append(ls)
        if not names: return {"status": "error", "reason": "no devices"}
        try: cur_idx = names.index(cur_name)
        except ValueError: cur_idx = 0
        next_name = names[(cur_idx + 1) % len(names)]
        _sc.run([sw, "-t", dtype, "-s", next_name])
        return {"status": "ok", "current": next_name}

    @app.post("/api/system/audio-input/cycle")
    async def _sys_ain_cycle():
        return _cycle_audio_device("input")

    @app.post("/api/system/audio-output/cycle")
    async def _sys_aout_cycle():
        return _cycle_audio_device("output")
    @app.get("/api/system/current-app")
    async def _sys_cur_app():
        try:
            import AppKit
            a = AppKit.NSWorkspace.sharedWorkspace().frontmostApplication()
            return {"name": a.localizedName() or "?", "bundle_id": a.bundleIdentifier() or ""}
        except: return {"name": "?", "bundle_id": ""}

    # ── Window Switcher (AX Bridge) ──

    @app.get("/api/system/current-app-windows")
    async def _sys_cur_wins():
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
            # Check which item is focused
            focused_idx = next((i for i, it in enumerate(items) if it["is_focused"]), -1)
            return {"name": name, "pid": pid, "count": count, "items": items, "focused_index": focused_idx}
        except Exception as e:
            return {"name": "?", "pid": 0, "count": 0, "items": [], "focused_index": -1, "error": str(e)}

    @app.post("/api/system/focus-window")
    async def _sys_focus_win(req: Request):
        try:
            body = await req.json()
            pid = body.get("pid", 0)
            bundle_id = body.get("bundle_id", "")
            item = {"window_index": body.get("window_index", 0), "tab_index": body.get("tab_index"), "type": body.get("type", "window"), "title": body.get("title", "")}
            from ax_bridge import focus_item
            result = focus_item(pid, item, bundle_id)
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Window Shortcuts (keyboard only, no osascript) ──

    @app.post("/api/system/window/fullscreen")
    async def _wf(): from input_engine import press_key; press_key("ctrl+cmd+f"); return {"status":"ok"}

    @app.post("/api/system/window/minimize")
    async def _wm(): from input_engine import press_key; press_key("cmd+m"); return {"status":"ok"}

    @app.post("/api/system/window/mission-control")
    async def _wmc(): from input_engine import press_key; press_key("ctrl+up"); return {"status":"ok"}

    @app.post("/api/system/window/show-desktop")
    async def _wsd(): from input_engine import press_key; press_key("f11"); return {"status":"ok"}

    
    # ── Dock Panel ──

    @app.get("/api/system/dock-items")
    async def _sys_dock():
        import plistlib as _pl, os as _os2
        dock_plist = _os2.path.expanduser("~/Library/Preferences/com.apple.dock.plist")
        items = []
        try:
            with open(dock_plist, "rb") as f:
                dock = _pl.load(f)
            # Get running app bundle paths
            _running_paths = set()
            try:
                from Cocoa import NSWorkspace as _NSW2
                for _ra in _NSW2.sharedWorkspace().runningApplications():
                    _rurl = _ra.bundleURL()
                    if _rurl:
                        _rp = str(_rurl.path() or "").lower().rstrip("/")
                        if _rp: _running_paths.add(_rp)
            except Exception:
                pass
            def _check_running(bundle_path):
                _p = bundle_path.replace("file://","").replace("%20"," ").rstrip("/").lower()
                return any(_p in rp or rp.endswith(_p) for rp in _running_paths)
            def _make_item(label, url):
                _path = url.replace("file://", "").replace("%20"," ").rstrip("/")
                _bundle = url.rstrip("/").split("/")[-1].replace("%20"," ").replace(".app","")
                return {"name": label, "path": _path, "bundle": _bundle, "running": _check_running(url)}
            # 1. Finder (always in Dock, not in plist)
            finder_url = "file:///System/Library/CoreServices/Finder.app/"
            items.append(_make_item("Finder", finder_url))
            # 2. Pinned apps (persistent-apps)
            for app in dock.get("persistent-apps", []):
                td = app.get("tile-data", {})
                fd = td.get("file-data", {})
                url = fd.get("_CFURLString", "")
                label = td.get("file-label", url.split("/")[-1].replace("%20"," ").replace(".app",""))
                items.append(_make_item(label, url))
            # 3. Recent apps (running but not pinned)
            for app in dock.get("recent-apps", []):
                td = app.get("tile-data", {})
                fd = td.get("file-data", {})
                url = fd.get("_CFURLString", "")
                label = td.get("file-label", url.split("/")[-1].replace("%20"," ").replace(".app",""))
                # Skip if already in the list (check by bundle)
                _b = url.rstrip("/").split("/")[-1].replace("%20"," ").replace(".app","")
                if not any(it["bundle"] == _b for it in items):
                    items.append(_make_item(label, url))
        except: pass
        return items

    @app.post("/api/system/launch-app")
    async def _sys_launch(body: dict):
        import subprocess as _sp
        path = body.get("path", "")
        if path:
            _sp.run(["open", path])
        return {"status": "ok"}

    @app.post("/api/system/quit-app")
    async def _sys_quit(body: dict):
        import subprocess as _sp
        name = body.get("name", "")
        if name:
            _sp.run(["osascript", "-e", f'quit app "{name}"'])
        return {"status": "ok"}

    
    # ── Dynamic Menu ──

    @app.get("/api/system/current-menus")
    async def _sys_menus():
        import sys as _sys, os as _os; _sys.path.insert(0, _os.environ.get("RESOURCEPATH", _os.path.dirname(_os.path.abspath(__file__)))); from ax_bridge import get_current_app_info, get_all_menus
        name, pid = get_current_app_info()
        menus = get_all_menus(pid)
        return {"app": name, "menus": menus}

    @app.post("/api/system/execute-shortcut")
    async def _sys_exec(body: dict):
        from input_engine import press_key
        keys = body.get("keys", "")
        if keys: press_key(keys)
        return {"status": "ok"}

    
    # ── Window Tile + Layout Presets ──
    import json as _json, os as _os3
    _LAYOUT_DIR = _os3.path.expanduser("~/Library/Application Support/Smart Touch Panel/layouts")
    _os3.makedirs(_LAYOUT_DIR, exist_ok=True)

    @app.post("/api/system/window/tile")
    async def _sys_tile(body: dict):
        layout = body.get("layout", "2x2")
        n = _front_name()
        # Use osascript to tile the frontmost window
        _sc.run(["osascript", "-e", f'tell app "System Events" to tell process "{n}"',
                 "-e", "set sz to get size of front window",
                 "-e", f'if "{layout}" is "left-right" then',
                 "-e", "set position of front window to {0, 30}",
                 "-e", "set size of front window to {item 1 of sz / 2, item 2 of sz}",
                 "-e", "end if"])
        return {"status": "ok"}

    @app.get("/api/system/layouts")
    async def _sys_layouts():
        layouts = []
        for f in sorted(_os3.listdir(_LAYOUT_DIR)):
            if f.endswith(".json"):
                try:
                    with open(_os3.path.join(_LAYOUT_DIR, f)) as fh:
                        data = _json.load(fh)
                        layouts.append({"name": data.get("name", f[:-5]), "timestamp": data.get("timestamp", 0)})
                except: pass
        return layouts

    @app.post("/api/system/layouts")
    async def _sys_save_layout(body: dict):
        name = body.get("name", "layout")
        # Collect all window positions
        import AppKit as _ak
        ws = _ak.NSWorkspace.sharedWorkspace()
        apps = ws.runningApplications()
        snapshot = {"name": name, "timestamp": __import__("time").time(), "apps": []}
        for app in apps:
            if not app.bundleIdentifier(): continue
            snapshot["apps"].append({
                "name": app.localizedName() or "?",
                "bundle_id": app.bundleIdentifier() or "",
            })
        path = _os3.path.join(_LAYOUT_DIR, name.replace("/", "_") + ".json")
        with open(path, "w") as fh: _json.dump(snapshot, fh)
        return {"status": "saved", "name": name}

    @app.post("/api/system/layouts/apply")
    async def _sys_apply_layout(body: dict):
        name = body.get("name", "")
        path = _os3.path.join(_LAYOUT_DIR, name.replace("/", "_") + ".json")
        if not _os3.path.exists(path): return {"error": "not found"}
        try:
            with open(path) as fh: data = _json.load(fh)
            for app in data.get("apps", []):
                _sc.run(["open", "-a", app["name"]])
        except: pass
        return {"status": "ok"}

    
    # ── App Icon ──

    @app.get("/api/system/app-icon")
    async def _sys_icon(name: str = ""):
        import os as _os4
        if not name: return {"error": "missing name"}
        cache_dir = _os4.path.expanduser("~/Library/Application Support/Smart Touch Panel/icon_cache")
        _os4.makedirs(cache_dir, exist_ok=True)
        cp = _os4.path.join(cache_dir, name.replace("/","_") + ".png")
        if _os4.path.exists(cp):
            from fastapi.responses import FileResponse
            return FileResponse(cp, media_type="image/png")
        # Find app bundle
        ap = None
        for b in ["/Applications","/System/Applications","/System/Applications/Utilities","/System/Library/CoreServices","/System/Volumes/Preboot/Cryptexes/App/System/Applications"]:
            t = _os4.path.join(b, name+".app")
            if _os4.path.exists(t): ap = t; break
        if ap:
            ic = None
            for fn in ["AppIcon.icns","ApplicationIcon.icns","app.icns","icon.icns", name+".icns"]:
                t = _os4.path.join(ap,"Contents/Resources",fn)
                if _os4.path.exists(t): ic = t; break
            if ic:
                _sc.run(["sips","-s","format","png",ic,"--out",cp,"-Z","64"], capture_output=True)
                if _os4.path.exists(cp):
                    from fastapi.responses import FileResponse
                    return FileResponse(cp, media_type="image/png")
            # Fallback: use NSWorkspace for apps with Assets.car (no .icns)
            try:
                from Cocoa import NSWorkspace as _NSW, NSImage as _NSI, NSBitmapImageRep as _NSB
                _icon = _NSW.sharedWorkspace().iconForFile_(ap)
                if _icon:
                    _sz = (64.0, 64.0)
                    _new = _NSI.alloc().initWithSize_(_sz)
                    _new.lockFocus()
                    _src = _icon.size()
                    _icon.drawInRect_fromRect_operation_fraction_(
                        ((0.0, 0.0), _sz), ((0.0, 0.0), _src), 2, 1.0)
                    _new.unlockFocus()
                    _tiff = _new.TIFFRepresentation()
                    if _tiff:
                        _bm = _NSB.imageRepWithData_(_tiff)
                        if _bm:
                            _png = _bm.representationUsingType_properties_(4, None)
                            _png.writeToFile_atomically_(cp, True)
                            if _os4.path.exists(cp):
                                from fastapi.responses import FileResponse
                                return FileResponse(cp, media_type="image/png")
            except Exception:
                pass
        return {"error": "icon not found"}

    _logger.info("Widget routes registered")
    
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


def request_mic_permission():
    """Open System Settings → Privacy → Microphone.
    Simple and reliable — no polling, no dialogs, just opens the right pane."""
    import subprocess as _sp4
    _sp4.run(["open", "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"])
    logger.info("Opened System Settings → Microphone")

def run_tray():
    """Create and run the system tray icon."""
    ip = get_local_ip()
    url = f"http://{ip}:8082"

    menu = pystray.Menu(
        pystray.MenuItem("✏️ Open Editor", on_open_editor, default=True),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("🔐 Permissions", pystray.Menu(
            pystray.MenuItem("🎤 Request Microphone", lambda icon, item: request_mic_permission()),
            pystray.MenuItem("⌨️ Request Accessibility", lambda icon, item: request_accessibility_permission()),
        )),
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

    logger.info(f"Server URL: {url}")
    icon.run()


def main():
    # Start FastAPI in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    logger.info("Server starting on port 8082...")
    import time as _time2; _time2.sleep(2)

    # Startup check: if accessibility not granted, trigger system dialog + open Settings
    try:
        if not check_accessibility():
            # Show the system prompt first
            from HIServices import AXIsProcessTrustedWithOptions
            from ApplicationServices import kAXTrustedCheckOptionPrompt
            AXIsProcessTrustedWithOptions({kAXTrustedCheckOptionPrompt: True})
            logger.info("Accessibility not granted — opening System Settings")
            import subprocess as _sp6
            _sp6.run(["open", "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"])
        else:
            logger.info("Accessibility permission: ✅")
    except Exception: pass

    # Run tray icon on main thread (blocks on NSApp run loop)
    run_tray()


if __name__ == "__main__":
    main()
