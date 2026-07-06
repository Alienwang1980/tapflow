"""py2app setup for Smart Touch Panel macOS app."""
import sys
from setuptools import setup

APP = ["server/tray_app.py"]
DATA_FILES = [
    ("client", ["client/index.html"]),
    ("server/profiles", []),
]
OPTIONS = {
    "argv_emulation": False,
    "packages": [
        "fastapi", "uvicorn", "starlette", "pydantic",
        "websockets", "pystray", "PIL",
        "zeroconf", "ifaddr",
        "Quartz", "Foundation", "AppKit", "ApplicationServices",
    ],
    "includes": [
        "connection_manager", "input_engine", "profile_manager",
        "window_watcher",
    ],
    "excludes": [],
    "plist": {
        "CFBundleName": "Smart Touch Panel",
        "CFBundleDisplayName": "Smart Touch Panel",
        "CFBundleIdentifier": "com.smarttouch.panel",
        "CFBundleVersion": "1.0.0",
        "CFBundleShortVersionString": "1.0.0",
        "NSHighResolutionCapable": True,
        "LSUIElement": True,  # Menu bar only, no dock icon
        "NSAppleEventsUsageDescription": "Smart Touch Panel needs Accessibility access to simulate keyboard input.",
    },
}

setup(
    name="SmartTouchPanel",
    version="1.0.0",
    app=APP,
    data_files=DATA_FILES,
    options={"py2app": OPTIONS},
    setup_requires=["py2app"],
)
