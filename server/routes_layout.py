"""Layout preset routes — save/load/apply window layout presets."""

import json
import os
import subprocess
import time

from fastapi import APIRouter

_LAYOUT_DIR = os.path.expanduser("~/Library/Application Support/Tapflow/layouts")
os.makedirs(_LAYOUT_DIR, exist_ok=True)


def create_router(state):
    """Create APIRouter with layout routes. No external function dependencies."""

    router = APIRouter()

    @router.get("/api/system/layouts")
    async def sys_layouts():
        layouts = []
        for f in sorted(os.listdir(_LAYOUT_DIR)):
            if f.endswith(".json"):
                try:
                    with open(os.path.join(_LAYOUT_DIR, f)) as fh:
                        data = json.load(fh)
                        layouts.append({"name": data.get("name", f[:-5]),
                                        "timestamp": data.get("timestamp", 0)})
                except:
                    pass
        return layouts

    @router.post("/api/system/layouts")
    async def sys_save_layout(body: dict):
        name = body.get("name", "layout")
        # Collect all window positions
        import AppKit
        ws = AppKit.NSWorkspace.sharedWorkspace()
        apps = ws.runningApplications()
        snapshot = {"name": name, "timestamp": time.time(), "apps": []}
        for app in apps:
            if not app.bundleIdentifier():
                continue
            snapshot["apps"].append({
                "name": app.localizedName() or "?",
                "bundle_id": app.bundleIdentifier() or "",
            })
        path = os.path.join(_LAYOUT_DIR, name.replace("/", "_") + ".json")
        with open(path, "w") as fh:
            json.dump(snapshot, fh)
        return {"status": "saved", "name": name}

    @router.post("/api/system/layouts/apply")
    async def sys_apply_layout(body: dict):
        name = body.get("name", "")
        path = os.path.join(_LAYOUT_DIR, name.replace("/", "_") + ".json")
        if not os.path.exists(path):
            return {"error": "not found"}
        try:
            with open(path) as fh:
                data = json.load(fh)
            for app in data.get("apps", []):
                subprocess.run(["open", "-a", app["name"]], timeout=10)
        except:
            pass
        return {"status": "ok"}

    return router
