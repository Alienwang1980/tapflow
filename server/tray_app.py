"""
Smart Touch Panel — macOS system tray app.
Menu bar icon + FastAPI server + QR code + accessibility check.
"""
import logging
import os
import socket
import threading

import pystray
from PIL import Image, ImageDraw

from main import app
from editor_app import open_editor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
logger = logging.getLogger("stp.tray")

TITLE = "Smart Touch Panel"
TOOLTIP = "Smart Touch Panel — Touch Input Server"


def get_local_ip() -> str:
    """Get the primary LAN IP."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("192.168.2.1", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def check_accessibility() -> bool:
    """Check Accessibility permission (silent — no system prompt)."""
    try:
        from ApplicationServices import AXIsProcessTrusted
        return AXIsProcessTrusted()
    except ImportError:
        return False


def create_icon_image(size=64):
    """Generate a simple icon: blue circle with 'STP' text."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = 4
    draw.ellipse([margin, margin, size - margin, size - margin],
                 fill=(22, 33, 62, 255), outline=(233, 69, 96, 255), width=3)
    # Draw a simple touch indicator: concentric circles
    cx, cy = size // 2, size // 2
    draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(233, 69, 96, 200))
    return img


def run_server():
    """Run FastAPI server in background thread."""
    import uvicorn, os
    cert_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "certs")
    cert_file = os.path.join(cert_dir, "cert.pem")
    key_file = os.path.join(cert_dir, "key.pem")
    if os.path.exists(cert_file) and os.path.exists(key_file):
        uvicorn.run(app, host="0.0.0.0", port=8082, log_level="warning",
                    ssl_keyfile=key_file, ssl_certfile=cert_file)
    else:
        uvicorn.run(app, host="0.0.0.0", port=8082, log_level="warning")


def on_show_qr(icon, item):
    """Print QR code URL to console."""
    ip = get_local_ip()
    url = f"http://{ip}:8082"
    print(f"\n{'='*50}")
    print(f"  Smart Touch Panel")
    print(f"  Open in iPad browser: {url}")
    print(f"{'='*50}\n")
    os.system(f"open {url}")  # Open in default browser


def on_open_editor(icon, item):
    """Open the keyboard layout editor in a native window."""
    import threading
    threading.Thread(target=open_editor, daemon=True).start()


def on_show_health(icon, item):
    """Show server health."""
    import urllib.request, json
    try:
        resp = urllib.request.urlopen("http://localhost:8082/health", timeout=2)
        data = json.loads(resp.read())
        print(f"\n  Status: {data.get('status')}")
        print(f"  Clients: {data.get('clients')}")
        print(f"  Accessibility: {data.get('accessibility')}")
        print(f"  Engine: {data.get('engine')}\n")
    except Exception as e:
        print(f"\n  Server not reachable: {e}\n")


def on_quit(icon, item):
    """Quit the app."""
    icon.stop()


def run_tray():
    """Create and run the system tray icon."""
    ip = get_local_ip()
    url = f"http://{ip}:8082"

    menu = pystray.Menu(
        pystray.MenuItem("✏️ Open Editor", on_open_editor, default=True),
        pystray.MenuItem(f"🔗 {url}", on_show_qr),
        pystray.MenuItem("📋 Health", on_show_health),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("❌ Quit", on_quit),
    )

    icon = pystray.Icon(
        "smart-touch-panel",
        create_icon_image(),
        TOOLTIP,
        menu,
    )

    # Check accessibility on start
    acc_ok = check_accessibility()
    if acc_ok:
        logger.info("Accessibility permission: ✅")
    else:
        logger.warning("Accessibility permission: ❌ — check System Settings")

    logger.info(f"Server URL: {url}")
    icon.run()


def main():
    # Start FastAPI in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    logger.info("Server starting on port 8082...")

    # Run tray icon on main thread
    run_tray()


if __name__ == "__main__":
    main()
