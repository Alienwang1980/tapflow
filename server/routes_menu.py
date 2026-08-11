"""Dynamic menu routes — current app menus + shortcut execution."""

import os
import sys

from fastapi import APIRouter


def create_router(state):
    """Create APIRouter with menu routes. No external function dependencies."""

    router = APIRouter()

    @router.get("/api/system/current-menus")
    def sys_menus():
        sys.path.insert(0, os.environ.get("RESOURCEPATH", os.path.dirname(os.path.abspath(__file__))))
        from ax_bridge import get_current_app_info, get_all_menus
        name, pid = get_current_app_info()
        menus = get_all_menus(pid)
        return {"app": name, "menus": menus}

    @router.post("/api/system/execute-shortcut")
    async def sys_exec(body: dict):
        from input_engine import press_key
        keys = body.get("keys", "")
        if keys:
            press_key(keys)
        return {"status": "ok"}

    return router
