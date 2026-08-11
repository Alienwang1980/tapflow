"""Dock panel routes — Dock items, launch app, quit app."""

import os
import plistlib
import subprocess

from fastapi import APIRouter


def create_router(state):
    """Create APIRouter with dock routes. No external function dependencies."""

    router = APIRouter()

    @router.get("/api/system/dock-items")
    async def sys_dock():
        dock_plist = os.path.expanduser("~/Library/Preferences/com.apple.dock.plist")
        items = []
        try:
            with open(dock_plist, "rb") as f:
                dock = plistlib.load(f)
            # Collect running regular GUI apps only (filter out background helpers/daemons)
            # activationPolicy 0=Regular (visible Dock app), 1=Accessory (menu bar/helper), 2=Prohibited
            _running_ids = set()   # bundle identifiers for precise match
            _running_paths = set() # exact bundle paths (fallback)
            try:
                from Cocoa import NSWorkspace
                for ra in NSWorkspace.sharedWorkspace().runningApplications():
                    if ra.activationPolicy() != 0:  # only Regular GUI apps
                        continue
                    bid = ra.bundleIdentifier()
                    if bid:
                        _running_ids.add(str(bid))
                    rurl = ra.bundleURL()
                    if rurl:
                        rp = str(rurl.path() or "").lower().rstrip("/")
                        if rp:
                            _running_paths.add(rp)
            except Exception:
                pass

            def _check_running(bundle_id, bundle_path):
                # Primary: exact bundle identifier match
                if bundle_id and bundle_id in _running_ids:
                    return True
                # Fallback: exact path match
                p = bundle_path.replace("file://", "").replace("%20", " ").rstrip("/").lower()
                return p in _running_paths

            def _make_item(label, url, bundle_id=None):
                _path = url.replace("file://", "").replace("%20", " ").rstrip("/")
                _bundle = url.rstrip("/").split("/")[-1].replace("%20", " ").replace(".app", "")
                return {"name": label, "path": _path, "bundle": _bundle,
                        "running": _check_running(bundle_id, url)}

            # 1. Finder (always in Dock, not in plist)
            finder_url = "file:///System/Library/CoreServices/Finder.app/"
            items.append(_make_item("Finder", finder_url, "com.apple.finder"))
            # 2. Pinned apps (persistent-apps)
            for app in dock.get("persistent-apps", []):
                td = app.get("tile-data", {})
                fd = td.get("file-data", {})
                url = fd.get("_CFURLString", "")
                label = td.get("file-label", url.split("/")[-1].replace("%20", " ").replace(".app", ""))
                bid = td.get("bundle-identifier", None)
                items.append(_make_item(label, url, bid))
            # 3. Recent apps (running but not pinned)
            for app in dock.get("recent-apps", []):
                td = app.get("tile-data", {})
                fd = td.get("file-data", {})
                url = fd.get("_CFURLString", "")
                label = td.get("file-label", url.split("/")[-1].replace("%20", " ").replace(".app", ""))
                bid = td.get("bundle-identifier", None)
                # Skip if already in the list (check by bundle)
                b = url.rstrip("/").split("/")[-1].replace("%20", " ").replace(".app", "")
                if not any(it["bundle"] == b for it in items):
                    items.append(_make_item(label, url, bid))
        except:
            pass
        return items

    @router.post("/api/system/launch-app")
    async def sys_launch(body: dict):
        path = body.get("path", "")
        if path:
            subprocess.run(["open", path])
        return {"status": "ok"}

    @router.post("/api/system/quit-app")
    async def sys_quit(body: dict):
        """Quit an app by exact process name. Uses pkill -x (safe arg list, no shell)."""
        name = str(body.get("name", "")).strip()
        if name:
            subprocess.run(["pkill", "-x", name])
        return {"status": "ok"}

    return router
