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


# ── 端口配置(可在任意机器上修改)──────────────────────────────
# 优先级: 环境变量 STP_PORT > config.json 的 "port" > 默认 8082。
# config.json 路径: ~/Library/Application Support/Smart Touch Panel/config.json
import json as _json_cfg

def _config_dir() -> str:
    d = os.path.expanduser("~/Library/Application Support/Smart Touch Panel")
    try:
        os.makedirs(d, exist_ok=True)
    except Exception:
        pass
    return d

def _config_path() -> str:
    return os.path.join(_config_dir(), "config.json")

def _resolve_port() -> int:
    """端口解析,范围 1-65535,任何异常都回退默认 8082。"""
    default = 8082
    env = os.environ.get("STP_PORT")
    if env:
        try:
            p = int(env)
            if 1 <= p <= 65535:
                return p
        except (ValueError, TypeError):
            logger.warning("STP_PORT=%r 无效,忽略", env)
    try:
        cp = _config_path()
        if os.path.exists(cp):
            with open(cp, "r", encoding="utf-8") as f:
                p = int(_json_cfg.load(f).get("port", default))
                if 1 <= p <= 65535:
                    return p
                logger.warning("config.json port=%s 越界,用默认 %d", p, default)
    except Exception as e:
        logger.warning("读取 config.json 失败(%s),用默认端口", e)
    return default

def _ensure_config(port: int) -> None:
    """首次运行写一份默认 config.json,方便用户直接编辑端口。"""
    try:
        cp = _config_path()
        if not os.path.exists(cp):
            with open(cp, "w", encoding="utf-8") as f:
                _json_cfg.dump(
                    {"port": port,
                     "_comment": "改端口后重启 Smart Touch Panel 生效(范围 1-65535)。也可用环境变量 STP_PORT 覆盖。"},
                    f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning("写默认 config.json 失败: %s", e)

PORT = _resolve_port()
# 同步 mDNS 广播端口
try:
    import main as _main_mod
    _main_mod.mdns_info["port"] = PORT
except Exception:
    pass


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


def check_screen_capture() -> bool:
    """Check Screen Recording permission (silent).
    Returns True if kCGWindowName is available for regular app windows (layer 0) from other processes."""
    import os as _os5
    try:
        from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionAll, kCGNullWindowID
        my_pid = _os5.getpid()
        window_list = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID)
        if not window_list:
            return False
        for w in window_list:
            # kCGWindowLayer 0 = normal app windows (not Dock/System)
            if w.get('kCGWindowLayer', -1) == 0:
                pid = w.get('kCGWindowOwnerPID', -1)
                name = w.get('kCGWindowName', None)
                if pid != my_pid and name is not None and len(str(name).strip()) > 0:
                    return True
        return False
    except Exception:
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
    def _get_balance(api_key: str = ""):
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
    def _sys_vol():
        r = _sc.run(["osascript", "-e", "get volume settings"], capture_output=True, encoding='utf-8')
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
        r = _sc.run(["osascript", "-e", "get volume settings"], capture_output=True, encoding='utf-8')
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

    @app.post("/api/system/mic-volume")
    async def _sys_mic_vol_set(body: dict):
        v = max(0, min(100, int(body.get("value", 50))))
        _sc.run(["osascript", "-e", f"set volume input volume {v}"])
        _state["mic_muted"] = (v == 0)
        if v > 0:
            _state["mic_pre"] = v
        return {"status": "ok", "input_volume": v, "muted": v == 0}
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

    # ── Screen Recording Permission endpoints ──
    @app.get("/api/system/screen-capture")
    def _sys_sc_status():
        import os as _os8
        granted = check_screen_capture()
        diag = {}
        try:
            from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionAll, kCGNullWindowID
            my_pid = _os8.getpid()
            wl = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID)
            total, layer0, with_name = len(wl) if wl else 0, 0, 0
            samples = []
            if wl:
                for w in wl:
                    if w.get('kCGWindowLayer', -1) == 0:
                        layer0 += 1
                        n = w.get('kCGWindowName', None)
                        if n is not None and len(str(n).strip()) > 0:
                            with_name += 1
                        pid_w = w.get('kCGWindowOwnerPID', -1)
                        if pid_w != my_pid and len(samples) < 3:
                            samples.append({"owner": w.get('kCGWindowOwnerName',''), "has_name": n is not None and len(str(n).strip())>0, "keys": list(w.keys())[:12]})
            diag = {"total_windows": total, "layer0_windows": layer0, "with_name": with_name, "my_pid": my_pid, "samples": samples}
        except Exception as e:
            diag = {"error": str(e)}
        return {"granted": granted, "diag": diag}

    @app.post("/api/system/screen-capture")
    async def _sys_sc_request():
        """Open System Settings → Privacy → Screen Recording."""
        request_screen_capture_permission()
        return {"granted": check_screen_capture()}

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

    def _ensure_switch_audio_source() -> str | None:
        """Ensure SwitchAudioSource binary is installed in App Support.
        On first run (or when missing), copies from bundle Resources/bin.
        Returns the binary path or None if unavailable."""
        import shutil as _sh11
        dst = os.path.expanduser("~/Library/Application Support/Smart Touch Panel/bin/SwitchAudioSource")
        if os.path.isfile(dst) and os.access(dst, os.X_OK):
            return dst
        src = None
        if _is_frozen():
            bundle = os.path.dirname(os.path.dirname(sys.executable))  # Contents
            candidate = os.path.join(bundle, "Resources", "bin", "SwitchAudioSource")
            if os.path.isfile(candidate):
                src = candidate
        else:
            for cand in [os.path.join(os.path.dirname(__file__), "..", "bin", "SwitchAudioSource"),
                         "/opt/homebrew/bin/SwitchAudioSource",
                         "/usr/local/bin/SwitchAudioSource"]:
                if os.path.isfile(cand):
                    src = cand
                    break
        if not src:
            return None
        try:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            _sh11.copy2(src, dst)
            os.chmod(dst, 0o755)
            logger.info("SwitchAudioSource installed: %s -> %s", src, dst)
            return dst
        except Exception as e:
            logger.warning("SwitchAudioSource install failed: %s", e)
            return src  # fallback: use from bundle/project tree

    @app.get("/api/system/audio-devices")
    def _sys_adev():
        sw = _ensure_switch_audio_source()
        if not sw: return []
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
        sw = _ensure_switch_audio_source()
        if not sw:
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
    def _sys_cur_app():
        try:
            import AppKit
            a = AppKit.NSWorkspace.sharedWorkspace().frontmostApplication()
            return {"name": a.localizedName() or "?", "bundle_id": a.bundleIdentifier() or ""}
        except: return {"name": "?", "bundle_id": ""}

    # ── Window Switcher (AX Bridge) ──

    @app.get("/api/system/current-app-windows")
    def _sys_cur_wins():
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
            return {"name": name, "pid": pid, "bundle_id": bundle_id, "count": count, "items": items, "focused_index": focused_idx}
        except Exception as e:
            return {"name": "?", "pid": 0, "count": 0, "items": [], "focused_index": -1, "error": str(e)}

    @app.get("/api/system/all-windows")
    def _sys_all_wins():
        try:
            from ax_bridge import get_all_app_windows
            result = get_all_app_windows()
            import logging
            logging.getLogger("stp.ax").info(f"[ALLWIN] {len(result.get('apps',[]))} apps, focused={result.get('focused_global_idx',-1)}")
            return result
        except Exception as e:
            return {"apps": [], "focused_app_idx": -1, "focused_global_idx": -1, "error": str(e)}

    @app.post("/api/system/focus-window")
    async def _sys_focus_win(req: Request):
        try:
            body = await req.json()
            pid = body.get("pid", 0)
            bundle_id = body.get("bundle_id", "")
            item = {"window_index": body.get("window_index", 0), "tab_index": body.get("tab_index"), "type": body.get("type", "window"), "title": body.get("title", ""), "_source": body.get("_source", "")}
            from ax_bridge import focus_item
            import logging
            _flog = logging.getLogger("stp.ax")
            _flog.info(f"[FOCUS] type={item['type']} title={item.get('title','')[:40]} bundle={bundle_id}")
            result = focus_item(pid, item, bundle_id)
            _flog.info(f"[FOCUS] result={result}")
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Window Thumbnail (JPEG capture, server-side cache) ──
    _thumb_cache = {}  # {(pid, title_lower): (jpeg_bytes, ts)}
    _THUMB_TTL = 60.0
    _THUMB_PRUNE_AGE = 600.0

    @app.get("/api/system/window-thumbnail")
    def _sys_win_thumb(pid: int = 0, title: str = "", refresh: int = 0):
        # def (not async): capture blocks on CGWindowList — runs in thread pool
        import time as _tt
        from fastapi.responses import Response as _Resp, JSONResponse as _JResp
        if not pid or not title.strip():
            return _JResp({"error": "missing pid/title"}, status_code=400)
        key = (pid, title.strip().lower())
        now = _tt.time()
        hit = _thumb_cache.get(key)
        if hit and not refresh and now - hit[1] < _THUMB_TTL:
            return _Resp(content=hit[0], media_type="image/jpeg")
        from ax_bridge import capture_window_thumbnail
        data = capture_window_thumbnail(pid, title)
        if not data:
            if hit:  # stale beats nothing (window may be on another Space now)
                return _Resp(content=hit[0], media_type="image/jpeg")
            return _JResp({"error": "capture failed"}, status_code=404)
        _thumb_cache[key] = (data, now)
        for k in [k for k, v in _thumb_cache.items() if now - v[1] > _THUMB_PRUNE_AGE]:
            _thumb_cache.pop(k, None)
        return _Resp(content=data, media_type="image/jpeg")

    # ── Window Shortcuts (keyboard only, no osascript) ──

    @app.post("/api/system/window/fullscreen")
    async def _wf(): from input_engine import press_key; press_key("ctrl+cmd+f"); return {"status":"ok"}

    @app.post("/api/system/window/minimize")
    async def _wm(): from input_engine import press_key; press_key("cmd+m"); return {"status":"ok"}

    @app.post("/api/system/window/mission-control")
    async def _wmc(): from input_engine import press_key; press_key("ctrl+up"); return {"status":"ok"}

    @app.post("/api/system/window/show-desktop")
    async def _wsd(): from input_engine import press_key; press_key("f11"); return {"status":"ok"}

    # ── Window Arrange (native macOS tiling via System Events menu click) ──
    # ponytail: 菜单项按中文名匹配(mini 系统为中文);系统语言改英文需加名称映射表。
    # 作用于「当前最前窗口」,用 frontmost process 免去取 app 名(无注入),已实测可靠。
    _WIN_MENU = "窗口"
    _MR_SUB = "移动与调整大小"   # Move & Resize 子菜单
    _FS_SUB = "全屏幕平铺"        # Full-Screen Tile 子菜单
    _ARRANGE_MAP = {
        "left":    (_MR_SUB, "左侧"),
        "right":   (_MR_SUB, "右侧"),
        "top":     (_MR_SUB, "顶部"),
        "bottom":  (_MR_SUB, "底部"),
        "fill":    (None, "填充"),
        "restore": (_MR_SUB, "恢复上一个大小"),
        "fs-left":  (_FS_SUB, "屏幕左侧"),
        "fs-right": (_FS_SUB, "屏幕右侧"),
    }

    def _menu_ref(submenu, item):
        base = f'menu 1 of menu bar item "{_WIN_MENU}" of menu bar 1'
        if submenu:
            return f'menu item "{item}" of menu 1 of menu item "{submenu}" of {base}'
        return f'menu item "{item}" of {base}'

    def _run_osa(lines):
        try:
            r = _sc.run(["osascript", "-e", "\n".join(lines)],
                        capture_output=True, text=True,
                        encoding="utf-8", errors="replace", timeout=5)
        except Exception as e:
            return False, str(e)[:200]
        if r.returncode != 0:
            return False, (r.stderr or "").strip()[:200]
        return True, r.stdout.strip()

    @app.post("/api/system/window/arrange")
    async def _sys_arrange(body: dict):
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
        return {"success": ok, "action": action, "result": out} if ok else {"success": False, "error": out}


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
    def _sys_menus():
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
    def _sys_icon(name: str = ""):
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
        if not ap:
            # 固定目录没命中(如 ~/Applications、DMG 直启等)→ 问 LaunchServices
            try:
                from Cocoa import NSWorkspace as _NSW0
                p = _NSW0.sharedWorkspace().fullPathForApplication_(name)
                if p and _os4.path.exists(p): ap = str(p)
            except Exception:
                pass
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
        from fastapi import HTTPException as _HTTPExc4
        raise _HTTPExc4(404, f"icon not found: {name}")

    _logger.info("Widget routes registered")
    
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")


def on_show_qr(icon, item):
    """Print QR code URL to console."""
    ip = get_local_ip()
    url = f"http://{ip}:{PORT}"
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
        resp = urllib.request.urlopen(f"http://localhost:{PORT}/health", timeout=2)
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


def request_screen_capture_permission():
    """Trigger Screen Recording permission prompt + open System Settings as fallback."""
    import subprocess as _sp5
    # Step 1: Trigger the system TCC permission dialog by capturing the display
    try:
        from Quartz import CGDisplayCreateImage, CGMainDisplayID
        img = CGDisplayCreateImage(CGMainDisplayID())
        logger.info("Screen capture attempt completed")
    except Exception:
        pass
    # Step 2: Also open System Settings in case user dismissed the dialog
    _sp5.run(["open", "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"])
    logger.info("Opened System Settings → Screen Recording")


# ── Settings panel (native NSPanel: 权限状态 + 端口修改) ──
# pystray darwin 菜单回调在 AppKit 主线程直接调用(pystray/_darwin.py:268),
# 所以这里可以直接建窗口,无需跨线程 dispatch。
_SETTINGS = {"panel": None, "delegate": None, "timer": None,
             "rows": {}, "port_field": None, "err_label": None,
             "mic_granted": False}


def _mic_granted() -> bool:
    """authorizationStatus 进程内有滞后(实测),requestAccess 回调结果作补充真值。"""
    try:
        from AVFoundation import AVCaptureDevice, AVMediaTypeAudio
        if AVCaptureDevice.authorizationStatusForMediaType_(AVMediaTypeAudio) == 3:
            return True
    except Exception:
        pass
    return _SETTINGS["mic_granted"]


def _perm_checks():
    return {
        "screen": ("🖥️ 屏幕录制", check_screen_capture),
        "ax": ("⌨️ 辅助功能", check_accessibility),
        "mic": ("🎤 麦克风", _mic_granted),
    }


def _refresh_settings_rows():
    for key, (_, check) in _perm_checks().items():
        row = _SETTINGS["rows"].get(key)
        if not row:
            continue
        granted = False
        try:
            granted = bool(check())
        except Exception:
            pass
        row["ok"].setHidden_(not granted)
        row["btn"].setHidden_(granted)


def _update_save_btn():
    btn, field = _SETTINGS.get("save_btn"), _SETTINGS.get("port_field")
    if btn is None or field is None:
        return
    raw = str(field.stringValue()).strip()
    btn.setEnabled_(raw != str(PORT) and raw != "")


def _save_port_and_restart():
    import json as _json9
    field, err = _SETTINGS["port_field"], _SETTINGS["err_label"]
    raw = str(field.stringValue()).strip()
    try:
        port = int(raw)
        if not (1 <= port <= 65535):
            raise ValueError
    except ValueError:
        err.setStringValue_(f"无效端口: {raw}(需 1-65535)")
        err.setHidden_(False)
        return
    if port == PORT:
        err.setStringValue_("端口未变化")
        err.setHidden_(False)
        return
    try:
        with open(_config_path(), "w", encoding="utf-8") as f:
            _json9.dump({"port": port,
                         "_comment": "改端口后重启 Smart Touch Panel 生效(范围 1-65535)。也可用环境变量 STP_PORT 覆盖。"},
                        f, ensure_ascii=False, indent=2)
    except Exception as e:
        err.setStringValue_(f"写入失败: {e}")
        err.setHidden_(False)
        return
    logger.info("Port changed %d -> %d, exiting for launchd respawn", PORT, port)
    # 非零退出 → launchd KeepAlive(SuccessfulExit=false)自动拉起,新端口生效
    os._exit(1)


try:
    from Foundation import NSObject as _NSObject9

    class _StpSettingsDelegate(_NSObject9):
        def grantScreen_(self, sender):
            request_screen_capture_permission()

        def grantAx_(self, sender):
            request_accessibility_permission()

        def grantMic_(self, sender):
            try:
                from AVFoundation import AVCaptureDevice, AVMediaTypeAudio

                def _cb(granted):
                    _SETTINGS["mic_granted"] = bool(granted)

                # 麦克风支持原生授权弹窗,比开系统设置顺;回调结果是权威真值
                AVCaptureDevice.requestAccessForMediaType_completionHandler_(AVMediaTypeAudio, _cb)
            except Exception:
                request_mic_permission()

        def savePort_(self, sender):
            _save_port_and_restart()

        def controlTextDidChange_(self, note):
            # 端口输入变化 → 只有和当前端口不同时才点亮"保存并重启"
            _update_save_btn()

        def refresh_(self, timer):
            _refresh_settings_rows()
            _update_save_btn()

        def windowWillClose_(self, note):
            t = _SETTINGS["timer"]
            if t is not None:
                t.invalidate()
            _SETTINGS.update({"panel": None, "timer": None, "rows": {},
                              "port_field": None, "err_label": None, "save_btn": None})
except Exception:  # 源码模式无 AppKit 时不致命
    _StpSettingsDelegate = None


def open_settings_panel():
    """⚙️ 设置:权限状态(2s 自动刷新)+ 端口修改(保存后 exit(1) 由 launchd 拉起)。"""
    import AppKit
    from Foundation import NSMakeRect, NSTimer

    if _SETTINGS["panel"] is not None:
        _SETTINGS["panel"].makeKeyAndOrderFront_(None)
        AppKit.NSApp.activateIgnoringOtherApps_(True)
        return

    W, ROW_H = 380, 30
    panel = AppKit.NSPanel.alloc().initWithContentRect_styleMask_backing_defer_(
        NSMakeRect(0, 0, W, 316),
        AppKit.NSWindowStyleMaskTitled | AppKit.NSWindowStyleMaskClosable,
        AppKit.NSBackingStoreBuffered, False)
    panel.setTitle_("Smart Touch Panel 设置")
    panel.setLevel_(AppKit.NSFloatingWindowLevel)
    panel.setReleasedWhenClosed_(False)
    # NSPanel 默认 app 失活即隐藏 —— 点"去授权"跳系统设置时窗口会消失,必须关掉
    panel.setHidesOnDeactivate_(False)
    content = panel.contentView()

    if _SETTINGS["delegate"] is None:
        _SETTINGS["delegate"] = _StpSettingsDelegate.alloc().init()
    dele = _SETTINGS["delegate"]
    panel.setDelegate_(dele)

    def _label(text, x, y, w, size=13, color=None, bold=False):
        f = AppKit.NSTextField.alloc().initWithFrame_(NSMakeRect(x, y, w, 20))
        f.setStringValue_(text)
        f.setBezeled_(False); f.setDrawsBackground_(False)
        f.setEditable_(False); f.setSelectable_(False)
        font = AppKit.NSFont.boldSystemFontOfSize_(size) if bold else AppKit.NSFont.systemFontOfSize_(size)
        f.setFont_(font)
        if color is not None:
            f.setTextColor_(color)
        content.addSubview_(f)
        return f

    def _button(title, x, y, w, action):
        b = AppKit.NSButton.alloc().initWithFrame_(NSMakeRect(x, y, w, 24))
        b.setTitle_(title)
        b.setBezelStyle_(AppKit.NSBezelStyleRounded)
        b.setTarget_(dele)
        b.setAction_(action)
        content.addSubview_(b)
        return b

    y = 280
    _label("权限", 20, y, 100, bold=True)
    y -= 20
    dim = AppKit.NSColor.secondaryLabelColor()
    _label("为保证窗口截图、按键注入、麦克风电平正常工作,需要以下系统授权:", 20, y, W - 40, size=11, color=dim)
    actions = {"screen": "grantScreen:", "ax": "grantAx:", "mic": "grantMic:"}
    green = AppKit.NSColor.systemGreenColor()
    for key, (name, _) in _perm_checks().items():
        y -= ROW_H
        _label(name, 28, y + 2, 150)
        ok = _label("✓ 已授权", W - 110, y + 2, 90, color=green)
        btn = _button("去授权", W - 110, y, 90, actions[key])
        _SETTINGS["rows"][key] = {"ok": ok, "btn": btn}

    y -= 42
    _label("端口", 20, y, 100, bold=True)
    y -= 20
    _label(f"当前 {PORT}。如与其他服务端口冲突可按需修改,保存后自动重启生效。", 20, y, W - 40, size=11, color=dim)
    y -= ROW_H
    pf = AppKit.NSTextField.alloc().initWithFrame_(NSMakeRect(28, y, 100, 24))
    pf.setStringValue_(str(PORT))
    pf.setDelegate_(dele)   # controlTextDidChange → 按钮亮/灰
    content.addSubview_(pf)
    _SETTINGS["port_field"] = pf
    save_btn = _button("保存并重启", W - 130, y, 110, "savePort:")
    save_btn.setEnabled_(False)  # 端口未更改时置灰
    _SETTINGS["save_btn"] = save_btn
    y -= 24
    err = _label("", 28, y, W - 48, size=11, color=AppKit.NSColor.systemRedColor())
    err.setHidden_(True)
    _SETTINGS["err_label"] = err

    _refresh_settings_rows()
    _SETTINGS["timer"] = NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats_(
        2.0, dele, "refresh:", None, True)

    _SETTINGS["panel"] = panel
    panel.center()
    panel.makeKeyAndOrderFront_(None)
    AppKit.NSApp.activateIgnoringOtherApps_(True)  # LSUIElement app 需显式激活才能到前台


def run_tray():
    """Create and run the system tray icon."""
    ip = get_local_ip()
    url = f"http://{ip}:{PORT}"

    menu = pystray.Menu(
        pystray.MenuItem("✏️ Open Editor", on_open_editor, default=True),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("⚙️ 设置", lambda icon, item: open_settings_panel()),
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


AGENT_LABEL = "com.smarttouch.panel"
AGENT_PLIST_PATH = os.path.expanduser(f"~/Library/LaunchAgents/{AGENT_LABEL}.plist")


def _is_frozen() -> bool:
    """True when running from the py2app bundle (not source mode)."""
    import sys as _sys9
    return bool(getattr(_sys9, "frozen", None))


def _port_in_use(port: int) -> bool:
    """Bind test: True if another process already holds the port."""
    import socket as _sock9
    s = _sock9.socket(_sock9.AF_INET, _sock9.SOCK_STREAM)
    try:
        s.setsockopt(_sock9.SOL_SOCKET, _sock9.SO_REUSEADDR, 1)
        s.bind(("0.0.0.0", port))
        return False
    except OSError:
        return True
    finally:
        s.close()


def register_launch_agent(apply_now: bool = False) -> str:
    """Self-install a classic LaunchAgent plist pointing at this bundle's executable.
    开机自启 + 崩溃自动重启(KeepAlive SuccessfulExit=false),无 cron 无 FDA。
    不用 SMAppService:macOS 26 上对 adhoc 签名/外置卷二进制 LWCR 校验失败(0x3),
    BundleProgram 相对路径也解析失败(0x6f) —— 均为实测。
    apply_now=False: 只写 plist(下次登录生效),避免 bootout 杀掉自己;
    apply_now=True(STP_REGISTER_ONLY 模式): bootout+bootstrap 立即生效。
    Bundle mode only."""
    if not _is_frozen():
        return "skipped (source mode)"
    try:
        import plistlib, subprocess as _sp9
        from Foundation import NSBundle
        exe = str(NSBundle.mainBundle().executablePath())
        agent = {
            "Label": AGENT_LABEL,
            "Program": exe,
            "RunAtLoad": True,
            "KeepAlive": {"SuccessfulExit": False},
            "ThrottleInterval": 10,
            "StandardOutPath": "/tmp/stp_agent.log",
            "StandardErrPath": "/tmp/stp_agent.log",
            "ProcessType": "Interactive",
        }
        new_data = plistlib.dumps(agent)
        try:
            with open(AGENT_PLIST_PATH, "rb") as f:
                unchanged = f.read() == new_data
        except FileNotFoundError:
            unchanged = False
        if not unchanged:
            os.makedirs(os.path.dirname(AGENT_PLIST_PATH), exist_ok=True)
            with open(AGENT_PLIST_PATH, "wb") as f:
                f.write(new_data)
        if not apply_now:
            return "already installed" if unchanged else f"plist written ({exe}), effective next login"
        uid = os.getuid()
        _sp9.run(["launchctl", "bootout", f"gui/{uid}/{AGENT_LABEL}"],
                 capture_output=True, timeout=10)
        r = _sp9.run(["launchctl", "bootstrap", f"gui/{uid}", AGENT_PLIST_PATH],
                     capture_output=True, text=True, timeout=10)
        if r.returncode != 0:
            return f"plist installed; bootstrap failed rc={r.returncode}: {r.stderr.strip()[:80]}"
        return f"installed + bootstrapped ({exe})"
    except Exception as e:
        return f"error: {e}"


def main():
    # Register-only mode: used once after (re)build to install the LaunchAgent,
    # then launchd starts the real instance with the app's own TCC attribution.
    import os as _os9
    if _os9.environ.get("STP_REGISTER_ONLY"):
        result = register_launch_agent(apply_now=True)
        print(f"launch agent: {result}")
        return

    # Single-instance guard: agent + manual launch must not fight over the port.
    # 崩溃后 launchd 秒级重启,旧 socket 可能未释放 → 必须重试而非瞬时判定,
    # 否则新实例 exit 0,KeepAlive={SuccessfulExit:false} 不再拉起(实测踩坑)。
    # 15s 内端口一直被占 → 真有另一个实例在跑 → 干净退出(launchd 不重启)。
    import time as _time9
    for _try9 in range(15):
        if not _port_in_use(PORT):
            break
        _time9.sleep(1)
    else:
        logger.info(f"Port {PORT} still in use after 15s — another instance is running, exiting")
        return

    _ensure_config(PORT)
    # Start FastAPI in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    logger.info(f"Server starting on port {PORT}...")
    import time as _time2; _time2.sleep(2)

    # Self-register as launchd agent (KeepAlive) — idempotent, bundle mode only
    logger.info(f"Launch agent: {register_launch_agent()}")

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
