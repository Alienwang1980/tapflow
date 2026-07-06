#!/bin/bash
# Smart Touch Panel — keep-alive daemon (headless, for cron @reboot)
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$DIR/logs/keep_alive.log"
PIDFILE="$DIR/logs/stp.pid"
PORT=8082

mkdir -p "$DIR/logs"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

log "keep_alive started (PID $$)"

while true; do
    if ! lsof -ti:$PORT > /dev/null 2>&1; then
        log "Port $PORT dead, restarting..."
        cd "$DIR"
        source server/venv/bin/activate
        nohup python3 server/main.py >> "$DIR/logs/server.log" 2>&1 &
        echo $! > "$PIDFILE"
        log "Started PID $(cat "$PIDFILE")"
    fi
    sleep 10
done
