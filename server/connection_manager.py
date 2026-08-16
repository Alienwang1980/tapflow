"""WebSocket connection manager for Tapflow."""
import logging
import time
from fastapi import WebSocket

logger = logging.getLogger("stp.connection")


class ConnectionManager:
    """Manage all WebSocket client connections."""

    MAX_CONNECTIONS = 16
    STALE_TIMEOUT = 60.0  # evict silent clients when full (panel pings every 15s)

    def __init__(self):
        self.active: dict[str, WebSocket] = {}  # client_id -> websocket
        self.last_active: dict[str, float] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        if len(self.active) >= self.MAX_CONNECTIONS:
            now = time.time()
            stale = [
                cid for cid in self.active
                if now - self.last_active.get(cid, now) > self.STALE_TIMEOUT
            ]
            for cid in stale:
                try:
                    await self.active[cid].close(code=4001, reason="stale_evicted")
                except Exception:
                    pass
                self.disconnect(cid)
            if len(self.active) >= self.MAX_CONNECTIONS:
                await websocket.close(code=4000, reason="max_connections")
                logger.warning(f"Connection rejected (max {self.MAX_CONNECTIONS}): {client_id}")
                return False
        await websocket.accept()
        self.active[client_id] = websocket
        self.last_active[client_id] = time.time()
        logger.info(f"Client connected: {client_id} (total: {len(self.active)})")
        return True

    def touch(self, client_id: str):
        if client_id in self.active:
            self.last_active[client_id] = time.time()

    def disconnect(self, client_id: str):
        if client_id in self.active:
            del self.active[client_id]
        self.last_active.pop(client_id, None)
        logger.info(f"Client disconnected: {client_id} (total: {len(self.active)})")

    async def send_to(self, client_id: str, message: dict):
        if client_id in self.active:
            try:
                await self.active[client_id].send_json(message)
            except Exception as e:
                logger.warning(f"Send to {client_id} failed: {e}")
                self.disconnect(client_id)

    async def broadcast(self, message: dict):
        # Copy items to avoid dict-changed-during-iteration when disconnect runs mid-broadcast
        dead = []
        snapshot = list(self.active.items())
        for cid, ws in snapshot:
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
