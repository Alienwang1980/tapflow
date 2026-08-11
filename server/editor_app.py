"""Open the Tapflow editor in the default browser."""
import logging
import time
import urllib.request
import webbrowser

logger = logging.getLogger("stp.editor")

EDITOR_URL = "http://localhost:8082/editor"


def open_editor():
    """Open the editor in the default browser. Quick health check to ensure
    uvicorn is ready before the browser connects (avoids 'can't connect')."""
    # Single quick probe — server is already running, just needs a moment.
    for _ in range(3):
        try:
            urllib.request.urlopen("http://127.0.0.1:8082/health", timeout=0.3)
            break
        except Exception:
            time.sleep(0.3)

    try:
        webbrowser.open(EDITOR_URL)
        logger.info(f"Editor opened: {EDITOR_URL}")
    except Exception as e:
        logger.error(f"Failed to open editor: {e}")
