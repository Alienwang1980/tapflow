"""Widget extension routes — loaded after app creation."""
import json, os, re, logging
from fastapi import HTTPException
logger = logging.getLogger("stp.widgets")

def setup_routes(app, profiles, manager):
    """Add widget routes to the FastAPI app."""
    
    _current_profile = "Default.json"
    
    @app.get("/api/active-profile")
    async def get_active_profile():
        nonlocal _current_profile
        p = profiles.get_profile(_current_profile)
        if p:
            return {"profile": p, "filename": _current_profile}
        raise HTTPException(404, "No active profile")
    
    @app.post("/api/active-profile")
    async def set_active_profile(body: dict):
        nonlocal _current_profile
        _current_profile = body.get("filename", "Default.json")
        return {"active": _current_profile}
    
    @app.get("/api/deepseek/balance")
    async def get_deepseek_balance(api_key: str = ""):
        import urllib.request
        if not api_key:
            raise HTTPException(400, "Missing api_key parameter")
        try:
            req = urllib.request.Request(
                "https://api.deepseek.com/user/balance",
                headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
            )
            body = urllib.request.urlopen(req, timeout=10).read()
            return json.loads(body)
        except Exception as e:
            raise HTTPException(500, str(e))

    @app.post("/api/system/toggle-fullscreen")
    async def toggle_fullscreen():
        from .system_control import toggle_fullscreen as _tfs
        _tfs()
        return {"ok": True}

    logger.info("Widget routes registered")
