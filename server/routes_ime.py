"""IME routes — read current input method, cycle or select a keyboard input source."""

import logging

from fastapi import APIRouter

from ime_engine import current, cycle, list_selectable, select

logger = logging.getLogger("stp.tray")


def create_router(state):
    """Create APIRouter with IME routes.

    All handlers are `def` (not `async def`) — the TIS calls are synchronous
    ctypes, FastAPI runs them in the threadpool so the event loop stays free.
    """

    router = APIRouter()

    @router.get("/api/system/ime/status")
    def ime_status():
        try:
            return {"current": current(), "list": list_selectable()}
        except Exception as e:
            logger.warning("IME status failed: %s", e)
            return {"current": None, "list": []}

    @router.post("/api/system/ime/cycle")
    def ime_cycle():
        try:
            nxt = cycle()
        except Exception as e:
            logger.warning("IME cycle failed: %s", e)
            return {"status": "error", "reason": str(e)}
        if nxt is None:
            return {"status": "error", "reason": "no selectable input sources"}
        return {"status": "ok", "current": nxt}

    @router.post("/api/system/ime/select")
    def ime_select(body: dict):
        sid = body.get("id", "")
        if not sid:
            return {"status": "error", "reason": "missing id"}
        try:
            ok = select(sid)
        except Exception as e:
            logger.warning("IME select failed: %s", e)
            return {"status": "error", "reason": str(e)}
        if not ok:
            return {"status": "error", "reason": f"unknown input source: {sid}"}
        return {"status": "ok"}

    return router
