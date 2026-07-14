"""py2app setup for Smart Touch Panel macOS menu bar app."""
import sys
from pathlib import Path
from setuptools import setup

client_dir = Path("client")
# client 根下所有静态资源(html + svg 图标 + 未来任何类型),排除隐藏文件。
# 此前只 glob *.html,漏掉 2026-07 新增的 svg 图标 → 打包后 /static/*.svg 404,
# 音量/麦克风回退老款手绘图标。改为全量打包以杜绝同类遗漏。
client_files = [
    (str(client_dir), [str(f) for f in client_dir.glob("*") if f.is_file() and not f.name.startswith(".") and not f.name.endswith(".template")]),
    (str(client_dir / "fonts"), [str(f) for f in (client_dir / "fonts").glob("*") if f.is_file()]),
]

profiles_dir = Path("server/profiles")
profile_files = [(str(profiles_dir), [str(f) for f in profiles_dir.glob("*.json")])]

APP = ["server/tray_app.py"]
DATA_FILES = client_files + profile_files

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
        "typing_extensions", "six",
        "PyObjCTools.MachSignals", "PyObjCTools.AppHelper",
        "logging", "json", "uuid", "asyncio", "threading", "webbrowser",
    ],
    "excludes": [
        "tkinter", "PyQt5", "PySide2", "wx", "test", "unittest",
    ],
    "plist": {
        "CFBundleName": "Smart Touch Panel",
        "CFBundleDisplayName": "Smart Touch Panel",
        "CFBundleIdentifier": "com.smarttouch.panel",
        "CFBundleVersion": "1.0.0",
        "CFBundleShortVersionString": "1.0.0",
        "NSHighResolutionCapable": True,
        "LSUIElement": True,
        "NSAppleEventsUsageDescription": "Smart Touch Panel needs Accessibility access to simulate keyboard input.",
        "NSMicrophoneUsageDescription": "Smart Touch Panel needs Microphone access to show input audio levels.",
        "NSScreenCaptureUsageDescription": "Smart Touch Panel needs Screen Recording access to show window titles and thumbnails across all Spaces.",
    },
    "site_packages": True,
    "strip": False,
}

setup(
    name="SmartTouchPanel",
    version="1.0.0",
    app=APP,
    data_files=DATA_FILES,
    options={"py2app": OPTIONS},
    setup_requires=["py2app"],
)
