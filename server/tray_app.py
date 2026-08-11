"""Tapflow — macOS menu bar app. Tap points flow across your panel."""
import io
import logging
import os
import socket
import threading

import pystray
from PIL import Image, ImageDraw
import qrcode

from fastapi import Request
from main import app
from editor_app import open_editor

# ── NSApp 延迟到 main() 端口检测之后创建 ──
# 模块级 import 时创建 NSApp 有副作用:即使 main() 检测到端口冲突立即退出,
# NSApplication.sharedApplication() 也已向 WindowServer 注册,可能短暂出现第二个
# 菜单栏图标。改为延迟初始化,重复实例不会触发任何 Cocoa 事件。
_appkit_ready = False
def _ensure_appkit_accessory():
    """Create NSApp with Accessory policy — call ONLY after port guard passes."""
    global _appkit_ready
    if _appkit_ready:
        return
    try:
        from AppKit import NSApplication, NSApplicationActivationPolicyAccessory
        NSApplication.sharedApplication().setActivationPolicy_(NSApplicationActivationPolicyAccessory)
        _appkit_ready = True
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
logger = logging.getLogger("stp.tray")

TITLE = "Tapflow"
TOOLTIP = "Tapflow — Tap points, flowing keys"


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
        config = _json_cfg.loads(open(cp, "r", encoding="utf-8").read()) if os.path.exists(cp) else {}
        changed = False
        if "port" not in config:
            config["port"] = port
            changed = True
        if changed or not os.path.exists(cp):
            config["_comment"] = "改端口后重启 Tapflow 生效(范围 1-65535)。也可用环境变量 STP_PORT 覆盖。"
            with open(cp, "w", encoding="utf-8") as f:
                _json_cfg.dump(config, f, ensure_ascii=False, indent=2)
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


def _icon_path(name="stp_menubar_icon.png"):
    """Locate generated icon inside py2app bundle or source tree."""
    if _is_frozen():
        bundle = os.path.dirname(os.path.dirname(sys.executable))  # Contents/
        return os.path.join(bundle, "Resources", "icons", name)
    # Source mode: icons/ at project root
    return os.path.join(os.path.dirname(os.path.dirname(__file__)), "icons", name)


def create_icon_image(size=64):
    """Load generated dot-grid menu bar icon. Fallback to blue circle if missing."""
    path = _icon_path()
    if os.path.exists(path):
        try:
            img = Image.open(path)
            if img.size != (size, size):
                img = img.resize((size, size), Image.LANCZOS)
            return img
        except Exception:
            pass
    # Fallback (source mode, icons/ not yet generated)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = 4
    draw.ellipse([margin, margin, size - margin, size - margin],
                 fill=(22, 33, 62, 255), outline=(233, 69, 96, 255), width=3)
    cx, cy = size // 2, size // 2
    draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(233, 69, 96, 200))
    return img


def run_server():
    """Run FastAPI server in background thread."""
    import uvicorn, os as _os, re as _re, logging as _logging
    from profile_manager import profile_manager as _pm
    from state import ServerState
    _logger = _logging.getLogger("stp.widgets")

    # Shared mutable state — replaces nonlocal variables as modules are migrated
    state = ServerState()

    # Restore persisted active profile into state
    _profile_state_file = _os.path.join(_os.path.expanduser("~/Library/Application Support/Smart Touch Panel"), "active_profile.txt")
    try:
        if _os.path.exists(_profile_state_file):
            with open(_profile_state_file) as _f:
                _saved = _f.read().strip()
                if _saved and _pm.get_profile(_saved):
                    state.current_profile = _saved
                    _logger.info(f"Restored active profile: {state.current_profile}")
    except Exception: pass

    # ── Profile Routes (injected) ──
    from routes_profile import create_router as _profile_router
    app.include_router(_profile_router(state, _pm))

    # ── Volume + Balance Routes (injected) ──
    from routes_volume import create_router as _volume_router
    app.include_router(_volume_router(state))

    # ── System Routes (injected) ──
    from routes_system import create_router as _system_router
    app.include_router(_system_router(state, check_accessibility, check_screen_capture,
                                      request_accessibility_permission, request_screen_capture_permission))

    # ── Mic Routes (injected) ──
    from routes_mic import create_router as _mic_router
    app.include_router(_mic_router(state, request_mic_permission))

    # ── Audio Device Routes (injected) ──
    from routes_audio import create_router as _audio_router
    app.include_router(_audio_router(state, _is_frozen))

    # ── Window + Thumbnail Routes (injected) ──
    from routes_window import create_router as _window_router
    app.include_router(_window_router(state))
    from routes_thumbnail import create_router as _thumbnail_router
    app.include_router(_thumbnail_router(state))

    # ── Dock Panel (injected) ──
    from routes_dock import create_router as _dock_router
    app.include_router(_dock_router(state))

    # ── Dynamic Menu (injected) ──
    from routes_menu import create_router as _menu_router
    app.include_router(_menu_router(state))

    # ── Layout Presets (injected) ──
    from routes_layout import create_router as _layout_router
    app.include_router(_layout_router(state))

    # ── App Icon (injected) ──
    from routes_app_icon import create_router as _app_icon_router
    app.include_router(_app_icon_router(state))

    _logger.info("Widget routes registered")

    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")


def on_show_qr(icon, item):
    """Print QR code URL to console."""
    import subprocess as _sp_open
    ip = get_local_ip()
    url = f"http://{ip}:{PORT}/"
    print(f"\n{'='*50}")
    print(f"  Tapflow")
    print(f"  Open in iPad browser: {url}")
    print(f"{'='*50}\n")
    _sp_open.run(["open", url])  # Open in default browser (safe arg list, no shell)


# ── Dashboard NSPanel state ──
_DASH = {"panel": None, "delegate": None}


def on_open_dashboard(icon, item):
    """Tray menu callback → open the iPad web panel in browser."""
    import subprocess as _sp_open
    ip = get_local_ip()
    url = f"http://{ip}:{PORT}/"
    _sp_open.run(["open", url])  # Safe arg list, no shell


def on_open_editor(icon, item):
    """Tray menu callback → open the editor panel."""
    import threading
    threading.Thread(target=open_editor, daemon=True).start()


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
                         "_comment": "改端口后重启 Tapflow 生效(范围 1-65535)。也可用环境变量 STP_PORT 覆盖。"},
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
    class _StpDashboardDelegate(_NSObject9):
        def openEditor_(self, sender):
            import subprocess as _sp_op
            ip = get_local_ip()
            _sp_op.run(["open", f"http://{ip}:{PORT}/editor"])

        def openPanel_(self, sender):
            import subprocess as _sp_op
            ip = get_local_ip()
            url = f"http://{ip}:{PORT}/"
            _sp_op.run(["open", url])  # Safe arg list, no shell

        def toggleAutoStart_(self, sender):
            _set_auto_show_dashboard(sender.state() == 1)

        def windowWillClose_(self, note):
            _DASH["panel"] = None
            _DASH["delegate"] = None

except Exception:  # 源码模式无 AppKit 时不致命
    _StpSettingsDelegate = None
    _StpDashboardDelegate = None


def open_settings_panel():
    """⚙️ 设置:权限状态(2s 自动刷新)+ 端口修改(保存后 exit(1) 由 launchd 拉起)。"""
    import AppKit
    from AppKit import NSBezelStyleRounded
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
    panel.setTitle_("Tapflow 设置")
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
        b.setBezelStyle_(NSBezelStyleRounded)
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


# ── QR code helpers ──

def _pil_to_nsimage(pil_img):
    """Convert PIL Image to NSImage for NSPanel display."""
    from AppKit import NSImage
    from Foundation import NSData
    buf = io.BytesIO()
    pil_img.save(buf, 'PNG')
    data = NSData.dataWithBytes_length_(buf.getvalue(), len(buf.getvalue()))
    return NSImage.alloc().initWithData_(data)

def _qr_nsimage(url, size=160):
    """Generate QR code NSImage for a URL. Pure PIL+qrcode, no network."""
    qr = qrcode.QRCode(box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white').convert('RGBA')
    img = img.resize((size, size), Image.LANCZOS)
    return _pil_to_nsimage(img)

# ── Dashboard / Startup preferences ──

def _auto_show_dashboard():
    """Return whether dashboard should auto-open on startup (default True)."""
    try:
        if os.path.exists(_config_path()):
            with open(_config_path(), "r", encoding="utf-8") as f:
                return _json_cfg.loads(f.read()).get("auto_show_dashboard", True)
    except Exception as e:
        logger.warning("读取 auto_show_dashboard 失败: %s", e)
    return True

def _set_auto_show_dashboard(enabled):
    try:
        cp = _config_path()
        cfg = {}
        if os.path.exists(cp):
            with open(cp, "r", encoding="utf-8") as f:
                cfg = _json_cfg.loads(f.read())
        cfg["auto_show_dashboard"] = bool(enabled)
        with open(cp, "w", encoding="utf-8") as f:
            _json_cfg.dump(cfg, f, indent=2)
        logger.info("auto_show_dashboard set to %s", bool(enabled))
    except Exception as e:
        logger.warning("写入 auto_show_dashboard 失败: %s", e)

# ── Dashboard window (CleanMyMac‑style graphical main interface) ──

def open_dashboard():
    """🏠 Start: Smart Panel card (QR + button) + Editor card (button only)."""
    import AppKit
    from Foundation import NSMakeRect

    if _DASH["panel"] is not None:
        _DASH["panel"].makeKeyAndOrderFront_(None)
        AppKit.NSApp.activateIgnoringOtherApps_(True)
        return

    if _StpDashboardDelegate is None:
        return  # AppKit not available (source mode w/o framework)

    ip = get_local_ip()
    panel_url = f"http://{ip}:{PORT}/"

    W, H = 480, 460
    screen = AppKit.NSScreen.mainScreen()
    sf = screen.visibleFrame()
    x = int((sf.size.width - W) / 2 + sf.origin.x)
    y = int((sf.size.height - H) / 2 + sf.origin.y)

    panel = AppKit.NSPanel.alloc().initWithContentRect_styleMask_backing_defer_(
        NSMakeRect(x, y, W, H),
        AppKit.NSWindowStyleMaskTitled | AppKit.NSWindowStyleMaskClosable,
        AppKit.NSBackingStoreBuffered, False,
    )
    panel.setTitle_("Tapflow")
    panel.setLevel_(AppKit.NSFloatingWindowLevel)
    panel.setReleasedWhenClosed_(False)
    panel.setHidesOnDeactivate_(False)

    dele = _StpDashboardDelegate.alloc().init()
    panel.setDelegate_(dele)
    _DASH["delegate"] = dele

    from AppKit import NSColor as NC

    content = panel.contentView()
    content.setWantsLayer_(True)
    content.layer().setBackgroundColor_(
        NC.colorWithRed_green_blue_alpha_(0.082, 0.071, 0.063, 1.0).CGColor())

    def _label(text, x, y, w, h=20, size=13, color=None, bold=False, align=0):
        from AppKit import NSTextField, NSFont
        f = NSTextField.alloc().initWithFrame_(NSMakeRect(x, y, w, h))
        f.setStringValue_(text)
        f.setBezeled_(False); f.setDrawsBackground_(False)
        f.setEditable_(False); f.setSelectable_(False)
        fn = NSFont.boldSystemFontOfSize_(size) if bold else NSFont.systemFontOfSize_(size)
        f.setFont_(fn)
        f.setAlignment_(align)
        if color is not None:
            f.setTextColor_(color)
        content.addSubview_(f)
        return f

    def _btn(title, bx, by, bw, bh, action, is_primary=False):
        """Standard Cocoa button with built-in hover/click feedback."""
        from AppKit import NSButton, NSBezelStyleRounded
        b = NSButton.alloc().initWithFrame_(NSMakeRect(bx, by, bw, bh))
        b.setTitle_(title)
        b.setBezelStyle_(NSBezelStyleRounded)
        b.setTarget_(dele)
        b.setAction_(action)
        b.setWantsLayer_(True)
        if is_primary:
            b.setKeyEquivalent_("\r")  # Enter key triggers primary action
        content.addSubview_(b)
        return b

    # ── Top section: Smart Panel with QR ──
    top_y = H - 210
    _label("📱 Smart Panel", 0, top_y + 150, W, 24, size=16,
           color=NC.colorWithRed_green_blue_alpha_(0.95, 0.92, 0.89, 1.0), bold=True, align=1)
    _label("Scan QR code from iPad", 0, top_y + 127, W, 16, size=11,
           color=NC.colorWithRed_green_blue_alpha_(0.45, 0.40, 0.37, 1.0), align=1)

    # QR code
    qr_size = 120
    qr_x = (W - qr_size) // 2
    qr_y = top_y + 2
    try:
        from AppKit import NSImageView
        qr_img = _qr_nsimage(panel_url, qr_size)
        qr_view = NSImageView.alloc().initWithFrame_(NSMakeRect(qr_x, qr_y, qr_size, qr_size))
        qr_view.setImage_(qr_img)
        qr_view.setImageScaling_(2)
        content.addSubview_(qr_view)
    except Exception:
        pass

    _label(panel_url, qr_x - 20, qr_y - 18, qr_size + 40, 14, size=9,
           color=NC.colorWithRed_green_blue_alpha_(0.35, 0.30, 0.27, 1.0), align=1)

    # Open Smart Panel button
    btn_w = 180
    _btn("Open Smart Panel", (W - btn_w) // 2, qr_y - 42, btn_w, 30, "openPanel:", is_primary=True)

    # ── Divider ──
    div_y = qr_y - 80
    from AppKit import NSBox
    div = NSBox.alloc().initWithFrame_(NSMakeRect(30, div_y, W - 60, 1))
    div.setBoxType_(2)  # NSBoxSeparator
    content.addSubview_(div)

    # ── Bottom section: Editor (no QR) ──
    edit_y = div_y - 100
    _label("🎛️ Panel Editor", 0, edit_y + 70, W, 22, size=14,
           color=NC.colorWithRed_green_blue_alpha_(0.95, 0.92, 0.89, 1.0), bold=True, align=1)
    _label("Design custom touch panels", 0, edit_y + 50, W, 14, size=10,
           color=NC.colorWithRed_green_blue_alpha_(0.45, 0.40, 0.37, 1.0), align=1)

    _btn("Open Panel Editor", (W - btn_w) // 2, edit_y + 10, btn_w, 30, "openEditor:")

    # ── Bottom: auto-start checkbox (default checked) ──
    from AppKit import NSButton, NSButtonTypeSwitch
    chk = NSButton.alloc().initWithFrame_(NSMakeRect(20, 20, W - 40, 22))
    chk.setButtonType_(NSButtonTypeSwitch)
    chk.setTitle_("下次自动打开此窗口")
    auto_show = _auto_show_dashboard()
    chk.setState_(1 if auto_show else 0)
    chk.setTarget_(dele)
    chk.setAction_("toggleAutoStart:")
    content.addSubview_(chk)

    # ── Bottom IP bar ──
    _label(f"{ip}:{PORT}", 0, 42, W, 16, size=10,
           color=NC.colorWithRed_green_blue_alpha_(0.35, 0.30, 0.27, 1.0), align=1)

    panel.center()
    panel.makeKeyAndOrderFront_(None)
    AppKit.NSApp.activateIgnoringOtherApps_(True)
    _DASH["panel"] = panel


def run_tray():
    """Create and run the system tray icon."""
    ip = get_local_ip()
    url = f"http://{ip}:{PORT}"

    menu = pystray.Menu(
        pystray.MenuItem("🚀 Start", lambda icon, item: open_dashboard(), default=True),
        pystray.MenuItem("⚙️ 设置", lambda icon, item: open_settings_panel()),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("退出", on_quit),
    )

    icon = pystray.Icon(
        "tapflow",
        create_icon_image(),
        TOOLTIP,
        menu,
    )

    logger.info(f"Server URL: {url}")
    icon.run()


AGENT_LABEL = "com.tapflow.app"
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

    # ── Single-instance guard (PID file) ──
    # PID 文件在 /tmp,避免 py2app 下 expanduser 路径不一致问题。
    # crash 后 launchd 秒级重启,旧 socket 可能未释放 → 额外重试 15s 等待释放。
    import time as _time9, atexit as _atexit
    _pid_file = "/tmp/stp.pid"
    _duplicate = False
    try:
        if os.path.exists(_pid_file):
            with open(_pid_file) as _f:
                _old_pid = int(_f.read().strip())
            try:
                os.kill(_old_pid, 0)  # 信号 0 只检查进程是否存在
                logger.info(f"PID file {_pid_file} → pid {_old_pid} alive, duplicate, exiting")
                _duplicate = True
            except OSError:
                logger.info(f"PID file {_pid_file} → pid {_old_pid} stale, removing")
                os.unlink(_pid_file)
    except (ValueError, FileNotFoundError):
        pass
    if _duplicate:
        return
    # Write PID file BEFORE port check,so crash-restart within 15s window can still detect
    try:
        with open(_pid_file, "w") as _f:
            _f.write(str(os.getpid()))
        logger.info(f"PID file written: {_pid_file} → {os.getpid()}")
    except Exception as _e:
        logger.warning(f"Failed to write PID file: {_e}")
    # Cleanup on exit
    def _cleanup_pid():
        try:
            if os.path.exists(_pid_file):
                os.unlink(_pid_file)
        except Exception:
            pass
    _atexit.register(_cleanup_pid)
    for _try9 in range(15):
        if not _port_in_use(PORT):
            break
        _time9.sleep(1)
    else:
        logger.info(f"Port {PORT} still in use after 15s — another instance is running, exiting")
        return

    # ── 端口检测通过,确认是唯一实例后才创建 NSApp ──
    # 必须在 run_server / run_tray 之前,避免 pystray 或其他 Cocoa 调用时
    # NSApp 还未设为 Accessory 模式。
    _ensure_appkit_accessory()

    _ensure_config(PORT)
    # Start FastAPI in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    logger.info(f"Server starting on port {PORT}...")
    import time as _time2; _time2.sleep(2)

    # Self-register as launchd agent (KeepAlive) — idempotent, bundle mode only
    logger.info(f"Launch agent: {register_launch_agent()}")

    # Auto-open dashboard on startup (unless user checked "下次不自动打开")
    try:
        if _auto_show_dashboard():
            open_dashboard()
            logger.info("Auto-opened dashboard")
    except Exception:
        pass

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
