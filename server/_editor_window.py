"""Standalone pywebview window — runs in its own process."""
import webview

def main():
    window = webview.create_window(
        "Smart Touch Panel — Editor",
        "http://localhost:8082/editor",
        width=1200,
        height=800,
        min_size=(800, 500),
        text_select=True,
    )
    webview.start()

if __name__ == "__main__":
    main()
