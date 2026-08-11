"""Volume control routes — output volume get/set, mute toggle, DeepSeek balance."""

import json
import logging
import subprocess
import urllib.request

from fastapi import APIRouter, HTTPException

_logger = logging.getLogger("stp.widgets")


def create_router(state):
    """Create APIRouter with volume + balance routes. No external function dependencies."""

    router = APIRouter()

    @router.get("/api/system/volume")
    def sys_vol():
        r = subprocess.run(["osascript", "-e", "get volume settings"],
                           capture_output=True, encoding='utf-8')
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
        subprocess.run(["osascript", "-e", f"set volume output volume {v}"])
        return {"status": "ok"}

    @router.post("/api/system/mute")
    async def sys_mute():
        state.output_muted = not state.output_muted
        subprocess.run(["osascript", "-e",
                        f"set volume output muted {str(state.output_muted).lower()}"])
        return {"muted": state.output_muted}

    @router.get("/api/deepseek/balance")
    def get_balance(api_key: str = ""):
        _logger.info(f"Balance API called, key={api_key[:12] if api_key else 'NONE'}...")
        if not api_key:
            raise HTTPException(400, "Missing api_key")
        try:
            req = urllib.request.Request(
                "https://api.deepseek.com/user/balance",
                headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"})
            body = urllib.request.urlopen(req, timeout=10).read()
            result = json.loads(body)
            _logger.info(f"Balance API success: {result}")
            return result
        except Exception as e:
            _logger.error(f"Balance API failed: {e}")
            raise HTTPException(500, str(e))

    return router
