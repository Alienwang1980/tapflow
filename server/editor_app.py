"""Open the Smart Touch Panel editor in the default browser."""
import logging
import time
import urllib.request
import webbrowser

logger = logging.getLogger("stp.editor")

EDITOR_URL = "http://localhost:8082/editor"


def open_editor():
    """Open the editor in the default browser. Waits for server if not ready."""
    # Wait for server to be reachable before opening browser (max 5s).
    # Without this, browser may open before uvicorn is listening → "can't connect".
    for i in range(10):
        try:
            urllib.request.urlopen("http://127.0.0.1:8082/health", timeout=0.5)
            break
        except Exception:
            time.sleep(0.5)
    else:
        logger.warning("Server not reachable after 5s, opening editor anyway")

    try:
        webbrowser.open(EDITOR_URL)
        logger.info(f"Editor opened: {EDITOR_URL}")
    except Exception as e:
        logger.error(f"Failed to open editor: {e}")
