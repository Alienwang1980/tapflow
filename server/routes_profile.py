"""Profile management routes — active profile get/set, WS override test."""

import os

from fastapi import APIRouter, HTTPException

_PROFILE_STATE_FILE = os.path.join(
    os.path.expanduser("~/Library/Application Support/Tapflow"),
    "active_profile.txt")


def create_router(state, profile_manager):
    """Create APIRouter with profile routes. profile_manager injected to avoid import coupling."""

    router = APIRouter()

    @router.get("/api/test-ws-override")
    async def test_ws():
        return {"ws_override": True, "active": state.current_profile}

    @router.get("/api/active-profile")
    async def get_active_profile():
        p = profile_manager.get_profile(state.current_profile)
        if p:
            return {"profile": p, "filename": state.current_profile}
        raise HTTPException(404, "No active profile")

    @router.post("/api/active-profile")
    async def set_active_profile(body: dict):
        state.current_profile = body.get("filename", "Default.json")
        try:
            with open(_PROFILE_STATE_FILE, "w") as f:
                f.write(state.current_profile)
        except Exception:
            pass
        return {"active": state.current_profile}

    return router
