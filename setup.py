"""py2app setup for Smart Touch Panel macOS menu bar app."""
import sys
from pathlib import Path
from setuptools import setup

client_dir = Path("client")
client_files = [(str(client_dir), [str(f) for f in client_dir.glob("*.html")])]

profiles_dir = Path("server/profiles")
profile_files = [(str(profiles_dir), [str(f) for f in profiles_dir.glob("*.json")])]

APP = ["server/tray_app.py"]
DATA_FILES = client_files + profile_files

OPTIONS = {
    "argv_emulation": False,
    "packages": [
        "fastapi", "uvicorn", "starlette", "pydantic", "anyio",
        "pystray", "PIL",
        "Quartz", "Foundation", "AppKit", "ApplicationServices", "CoreFoundation",
        "objc",
    ],
    "includes": [
        "connection_manager", "input_engine", "profile_manager",
        "window_watcher", "editor_app",
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
