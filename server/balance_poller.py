"""Deepseek API balance polling → WebSocket broadcast."""
import json, logging, asyncio

logger = logging.getLogger(__name__)

# Read API key from Claude settings
import os, re
_settings_path = os.path.expanduser("~/.claude/settings.json")
DEEPSEEK_API_KEY = ""
try:
    with open(_settings_path) as f:
        _m = re.search(r'"ANTHROPIC_AUTH_TOKEN"\s*:\s*"([^"]+)"', f.read())
        if _m:
            DEEPSEEK_API_KEY = _m.group(1)
except Exception:
    pass

class BalancePoller:
    def __init__(self):
        self.running = False
        self._task = None

    async def start(self, broadcast_fn):
        self.running = True
        self._broadcast_fn = broadcast_fn
        await self._poll()
        self._task = asyncio.create_task(self._run())

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            self._task = None

    async def _run(self):
        while self.running:
            await asyncio.sleep(30)
            await self._poll()

    async def _poll(self):
        if not DEEPSEEK_API_KEY:
            logger.warning("No Deepseek API key found")
            return
        try:
            import urllib.request
            req = urllib.request.Request(
                "https://api.deepseek.com/user/balance",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Accept": "application/json",
                },
            )
            body = await asyncio.get_event_loop().run_in_executor(
                None, lambda: urllib.request.urlopen(req, timeout=10).read()
            )
            data = json.loads(body)
            await self._broadcast_fn({"type": "balance_update", "data": data})
            logger.info(f"Balance: {data}")
        except Exception as e:
            logger.error(f"Balance poll error: {e}")

balance_poller = BalancePoller()
