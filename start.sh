#!/bin/bash
# Smart Touch Panel — start script
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

source server/venv/bin/activate
exec python3 server/main.py
