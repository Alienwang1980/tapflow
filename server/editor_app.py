"""Open the Smart Touch Panel editor in a native macOS window via pywebview."""
import webview
import logging

logger = logging.getLogger("stp.editor")

WINDOW_TITLE = "Smart Touch Panel — Editor"
EDITOR_URL = "http://localhost:8082/editor"
WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 800


def open_editor():
    """Open the editor window. Safe to call from any thread."""
    try:
        webview.create_window(
            WINDOW_TITLE,
            EDITOR_URL,
            width=WINDOW_WIDTH,
            height=WINDOW_HEIGHT,
            min_size=(800, 500),
            text_select=True,
        )
        logger.info("Editor window opened")
    except Exception as e:
        logger.error(f"Failed to open editor window: {e}")
        # Fallback: open in browser
        import webbrowser
        webbrowser.open(EDITOR_URL)
        logger.info("Fallback: opened editor in browser")
