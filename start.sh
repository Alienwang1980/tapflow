#!/bin/bash
# Tapflow — start with menu bar icon (GUI mode)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
source server/venv/bin/activate
exec python3 server/tray_app.py
