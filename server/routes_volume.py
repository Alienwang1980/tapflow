"""Volume control routes — output volume get/set, mute toggle.
DeepSeek balance lives in main.py (profile+key_id proxy, masks the key)."""

import logging

from fastapi import APIRouter

from osa_run import osa

_logger = logging.getLogger("stp.widgets")


def create_router(state):
    """Create APIRouter with volume + balance routes. No external function dependencies."""

    router = APIRouter()

    @router.get("/api/system/volume")
    def sys_vol():
        r = osa("get volume settings")
        res = {"output_volume": 75, "input_volume": 50, "output_muted": False}
        for part in r.stdout.strip().split(","):
            p = part.strip()
            try:
                if "output volume" in p:
                    v = p.split(":")[1].strip()
                    if v != "missing value":
                        res["output_volume"] = int(v)
                elif "input volume" in p:
                    v = p.split(":")[1].strip()
                    if v != "missing value":
                        res["input_volume"] = int(v)
                elif "output muted" in p:
                    pass
            except:
                pass
        res["output_muted"] = state.output_muted
        return res

    @router.post("/api/system/volume")
    async def sys_vol_set(body: dict):
        v = max(0, min(100, int(body.get("value", 75))))
        osa(f"set volume output volume {v}")
        return {"status": "ok"}

    @router.post("/api/system/mute")
    async def sys_mute():
        state.output_muted = not state.output_muted
        osa(f"set volume output muted {str(state.output_muted).lower()}")
        return {"muted": state.output_muted}

    return router
