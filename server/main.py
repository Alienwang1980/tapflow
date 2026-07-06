"""
Smart Touch Panel — FastAPI WebSocket server.
iPad opens browser → WebSocket → this server → CGEvent → Mac input.
"""
import json
import logging
import os
import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

import os as _os
if _os.path.dirname(__file__) not in __import__('sys').path:
    __import__('sys').path.insert(0, _os.path.dirname(__file__))

from connection_manager import manager  # noqa: E402
from input_engine import press_key, type_text, is_accessibility_enabled, HAVE_QUARTZ  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
logger = logging.getLogger("stp.main")

app = FastAPI(title="Smart Touch Panel")

CLIENT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "client")
os.makedirs(CLIENT_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=CLIENT_DIR), name="static")


# ── Default profile (Phase 1 MVP) ──
DEFAULT_PROFILE = {
    "name": "Default",
    "pages": [
        {
            "id": "main",
            "label": "Main",
            "keys": [
                # Row 1 — Navigation
                {"id": "k1", "label": "←", "action": "key", "value": "LEFT", "color": "#444"},
                {"id": "k2", "label": "↓", "action": "key", "value": "DOWN", "color": "#444"},
                {"id": "k3", "label": "→", "action": "key", "value": "RIGHT", "color": "#444"},
                {"id": "k4", "label": "↑", "action": "key", "value": "UP", "color": "#444"},
                # Row 2
                {"id": "k5", "label": "Tab", "action": "key", "value": "TAB", "color": "#555"},
                {"id": "k6", "label": "Space", "action": "key", "value": "SPACE", "color": "#3a7ca5"},
                {"id": "k7", "label": "Enter", "action": "key", "value": "RETURN", "color": "#3a7ca5"},
                {"id": "k8", "label": "Esc", "action": "key", "value": "ESCAPE", "color": "#8b3a3a"},
                # Row 3 — Modifiers
                {"id": "k9", "label": "⌘", "action": "key", "value": "COMMAND", "color": "#666"},
                {"id": "k10", "label": "⌥", "action": "key", "value": "OPTION", "color": "#666"},
                {"id": "k11", "label": "⌃", "action": "key", "value": "CONTROL", "color": "#666"},
                {"id": "k12", "label": "⇧", "action": "key", "value": "SHIFT", "color": "#666"},
                # Row 4 — Delete
                {"id": "k13", "label": "⌫", "action": "key", "value": "DELETE", "color": "#8b3a3a"},
            ],
        },
        {
            "id": "media",
            "label": "Media",
            "keys": [
                {"id": "m1", "label": "⏮", "action": "key", "value": "F7", "color": "#555"},
                {"id": "m2", "label": "▶", "action": "key", "value": "F8", "color": "#3a7ca5"},
                {"id": "m3", "label": "⏭", "action": "key", "value": "F9", "color": "#555"},
                {"id": "m4", "label": "🔇", "action": "key", "value": "F10", "color": "#555"},
                {"id": "m5", "label": "🔉", "action": "key", "value": "F11", "color": "#555"},
                {"id": "m6", "label": "🔊", "action": "key", "value": "F12", "color": "#555"},
            ],
        },
    ],
}


def handle_key_action(action: dict) -> str:
    """Execute a key action. Returns status string."""
    action_type = action.get("type", "press")
    key = action.get("key", "")

    if not key:
        return "no_key"

    try:
        if action_type == "press":
            press_key(key)
            return "ok"
        elif action_type == "text":
            type_text(key)
            return "ok"
        else:
            logger.warning(f"Unknown action type: {action_type}")
            return "unknown_type"
    except ValueError as e:
        logger.warning(f"Key parse error: {e}")
        return "bad_key"


@app.get("/")
async def root():
    index_path = os.path.join(CLIENT_DIR, "index.html")
    with open(index_path, "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": "quartz" if HAVE_QUARTZ else "simulate",
        "accessibility": is_accessibility_enabled(),
        "clients": manager.count,
    }


@app.get("/api/profile")
async def get_profile():
    return DEFAULT_PROFILE


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    client_id = str(uuid.uuid4())[:8]
    await manager.connect(client_id, websocket)

    try:
        # Send profile on connect
        await manager.send_to(client_id, {
            "type": "profile",
            "profile": DEFAULT_PROFILE,
        })

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")

            if msg_type == "key":
                # Multi-touch key event: {type:"key", keys:[{type,key}, ...]}
                keys = data.get("keys", [])
                if not keys and "key" in data:
                    keys = [{"type": data.get("action", "press"), "key": data["key"]}]

                results = []
                for k in keys:
                    result = handle_key_action(k)
                    results.append(result)

                await manager.send_to(client_id, {
                    "type": "ack",
                    "results": results,
                })

            elif msg_type == "ping":
                await manager.send_to(client_id, {"type": "pong"})

            else:
                logger.debug(f"Unknown msg type from {client_id}: {msg_type}")

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WS error {client_id}: {e}")
        manager.disconnect(client_id)


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="info")


if __name__ == "__main__":
    main()
