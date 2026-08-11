"""Window thumbnail route — JPEG capture with server-side cache."""

import time as _tt

from fastapi import APIRouter
from fastapi.responses import Response, JSONResponse

_THUMB_TTL = 60.0
_THUMB_PRUNE_AGE = 600.0


def create_router(state):
    """Create APIRouter with window-thumbnail route. Uses state.thumb_cache."""

    router = APIRouter()

    @router.get("/api/system/window-thumbnail")
    def sys_win_thumb(pid: int = 0, title: str = "", refresh: int = 0):
        # def (not async): capture blocks on CGWindowList — runs in thread pool
        if not pid or not title.strip():
            return JSONResponse({"error": "missing pid/title"}, status_code=400)
        key = (pid, title.strip().lower())
        now = _tt.time()
        hit = state.thumb_cache.get(key)
        if hit and not refresh and now - hit[1] < _THUMB_TTL:
            return Response(content=hit[0], media_type="image/jpeg")
        from ax_bridge import capture_window_thumbnail
        data = capture_window_thumbnail(pid, title)
        if not data:
            if hit:  # stale beats nothing (window may be on another Space now)
                return Response(content=hit[0], media_type="image/jpeg")
            return JSONResponse({"error": "capture failed"}, status_code=404)
        state.thumb_cache[key] = (data, now)
        for k in [k for k, v in state.thumb_cache.items() if now - v[1] > _THUMB_PRUNE_AGE]:
            state.thumb_cache.pop(k, None)
        return Response(content=data, media_type="image/jpeg")

    return router
