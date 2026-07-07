"""Open the Smart Touch Panel editor in the default browser."""
import logging
import webbrowser

logger = logging.getLogger("stp.editor")

EDITOR_URL = "http://localhost:8082/editor"


def open_editor():
    """Open the editor in the default web browser."""
    try:
        webbrowser.open(EDITOR_URL)
        logger.info(f"Editor opened in browser: {EDITOR_URL}")
    except Exception as e:
        logger.error(f"Failed to open editor: {e}")
