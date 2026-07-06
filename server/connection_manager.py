"""WebSocket connection manager for Smart Touch Panel."""
import logging
from fastapi import WebSocket

logger = logging.getLogger("stp.connection")


class ConnectionManager:
    """Manage all WebSocket client connections."""

    def __init__(self):
        self.active: dict[str, WebSocket] = {}  # client_id -> websocket

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active[client_id] = websocket
        logger.info(f"Client connected: {client_id} (total: {len(self.active)})")

    def disconnect(self, client_id: str):
        if client_id in self.active:
            del self.active[client_id]
        logger.info(f"Client disconnected: {client_id} (total: {len(self.active)})")

    async def send_to(self, client_id: str, message: dict):
        if client_id in self.active:
            try:
                await self.active[client_id].send_json(message)
            except Exception as e:
                logger.warning(f"Send to {client_id} failed: {e}")
                self.disconnect(client_id)

    async def broadcast(self, message: dict):
        dead = []
        for cid, ws in self.active.items():
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(cid)
        for cid in dead:
            self.disconnect(cid)

    @property
    def count(self) -> int:
        return len(self.active)


manager = ConnectionManager()
