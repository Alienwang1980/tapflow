"""py2app setup for Tapflow macOS menu bar app."""
from pathlib import Path
from setuptools import setup

client_dir = Path("client")
# client 根下所有静态资源(html + svg 图标 + 未来任何类型),排除隐藏文件。
# 此前只 glob *.html,漏掉 2026-07 新增的 svg 图标 → 打包后 /static/*.svg 404,
# 音量/麦克风回退老款手绘图标。改为全量打包以杜绝同类遗漏。
client_files = [
    (str(client_dir), [str(f) for f in client_dir.glob("*") if f.is_file() and not f.name.startswith(".") and not f.name.endswith(".template")]),
    (str(client_dir / "fonts"), [str(f) for f in (client_dir / "fonts").glob("*") if f.is_file()]),
    (str(client_dir / "thumbnails"), [str(f) for f in (client_dir / "thumbnails").glob("*") if f.is_file()]),
]

# Bundled default profiles (Keyboard + vibe), available for import in the editor.
default_profile_dir = Path("Default_Profile")
default_profile_files = [(str(default_profile_dir), [str(f) for f in default_profile_dir.glob("*.json")])]

# SwitchAudioSource(arm64,仅链系统框架):音源列表/切换依赖它。
# 运行时由 _ensure_switch_audio_source() 从 Resources/bin 拷到 App Support,
# 新 Mac 免手动安装。
bin_files = [("bin", ["bin/SwitchAudioSource"])]

APP = ["server/tray_app.py"]
icons_dir = Path("icons")
icons_files = [
    ("icons", ["icons/stp_menubar_icon.png"]),
]

DATA_FILES = client_files + default_profile_files + bin_files + icons_files

OPTIONS = {
    "argv_emulation": False,
    "packages": [
        "fastapi", "uvicorn", "starlette", "pydantic", "pydantic_core", "anyio",
        "click", "h11", "websockets",
        "multipart", "python_multipart",
        "annotated_types", "annotated_doc", "typing_inspection",
        "zeroconf", "ifaddr",
        "pystray", "PIL",
        "Quartz", "Foundation", "AppKit", "ApplicationServices", "CoreFoundation",
        "AVFoundation",
        "objc",
    ],
    "includes": [
        "connection_manager", "input_engine", "profile_manager",
        "window_watcher", "editor_app", "ax_bridge",
        "system_control", "balance_poller", "widget_extension",
        # Route modules (2026-08-11: extracted from tray_app run_server closure)
        "state",
        "routes_system", "routes_profile", "routes_mic",
        "routes_audio", "routes_volume", "routes_window",
        "routes_thumbnail", "routes_dock", "routes_menu",
        "routes_layout", "routes_app_icon",
        "typing_extensions", "six",
        "PyObjCTools.MachSignals", "PyObjCTools.AppHelper",
        "logging", "json", "uuid", "asyncio", "threading", "webbrowser",
    ],
    "excludes": [
        "tkinter", "PyQt5", "PySide2", "wx", "test", "unittest",
    ],
    "plist": {
        "CFBundleName": "Tapflow",
        "CFBundleDisplayName": "Tapflow",
        "CFBundleIdentifier": "com.tapflow.app",
        "CFBundleVersion": "1.0.0",
        "CFBundleShortVersionString": "1.0.0",
        "NSHighResolutionCapable": True,
        "LSUIElement": True,
        "NSAppleEventsUsageDescription": "Tapflow needs Accessibility access to simulate keyboard input.",
        "NSMicrophoneUsageDescription": "Tapflow needs Microphone access to show input audio levels.",
        "NSScreenCaptureUsageDescription": "Tapflow needs Screen Recording access to show window titles and thumbnails across all Spaces.",
    },
    # site_packages=True 会把构建机 venv 的绝对路径(/Volumes/WD_BLACK/...)烧进
    # __boot__.py → launchd 拉起时 opendir 外置卷挂死(实测,2026-07-15)。
    # 所有依赖已通过 packages/includes 完整打入 bundle,必须 False。
    "site_packages": False,
    "strip": False,
    "iconfile": "icons/AppIcon.icns",
}

setup(
    name="Tapflow",
    version="1.0.0",
    app=APP,
    data_files=DATA_FILES,
    options={"py2app": OPTIONS},
    setup_requires=["py2app"],
)

# Re-sign bundled python binary with app identifier AND persistent code sign identity.
# py2app includes a standalone python whose Info.plist has identifier
# org.python.python. TCC attributes screen recording requests to this
# identifier, not the app bundle → the app never appears in the Screen
# Recording privacy pane and permission prompts fail silently.
# Re-signing with --identifier com.tapflow.app fixes this.
# Adhoc signing (--sign -) changes on every build, breaking TCC persistence.
# Apple Developer identity is persistent → TCC permissions survive rebuilds.
import subprocess as _sp
# Developer ID (distribution) identity + hardened runtime + notarization → app
# passes Gatekeeper on any Mac. Apple Development certs are always spctl-rejected.
DEV_CERT = "Developer ID Application: wang xinlei (7F246MKBN2)"
ENTITLEMENTS = Path("entitlements.plist")
SIGN_COMMON = ["--force", "--options", "runtime", "--entitlements", str(ENTITLEMENTS)]
python_bin = Path("dist/Tapflow.app/Contents/MacOS/python")
if python_bin.exists():
    _sp.run(["codesign"] + SIGN_COMMON + ["--sign", DEV_CERT, "--identifier", "com.tapflow.app", str(python_bin)], check=False)
    print("✓ Re-signed bundled python with Developer ID identity (hardened runtime)")
# Also re-sign main executable with same identity
main_bin = Path("dist/Tapflow.app/Contents/MacOS/Tapflow")
if main_bin.exists():
    _sp.run(["codesign"] + SIGN_COMMON + ["--deep", "--sign", DEV_CERT, str(Path("dist/Tapflow.app"))], check=False)
    print("✓ Re-signed app bundle with Developer ID identity (hardened runtime)")
