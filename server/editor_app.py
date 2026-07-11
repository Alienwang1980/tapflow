"""Open the Smart Touch Panel editor in the default browser."""
import logging
import webbrowser

logger = logging.getLogger("stp.editor")

EDITOR_URL = "http://localhost:8082/editor"


def open_editor():
    """Open the editor in Safari (uses macOS native color picker)."""
    try:
        webbrowser.get('safari').open(EDITOR_URL)
        logger.info(f"Editor opened in Safari: {EDITOR_URL}")
    except Exception as e:
        logger.error(f"Failed to open editor: {e}")
