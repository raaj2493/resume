#!/bin/sh
set -e

# Start private Python AI engine on localhost:8001
(cd /app/01-AI-HIREME && uvicorn http_adapter:app --host 127.0.0.1 --port 8001 --log-level warning) &
PY_PID=$!

# Wait until Python adapter is ready (up to 15s)
i=0
while [ $i -lt 30 ]; do
  if python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/internal/health')" >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 0.5
done

# Trap termination to clean up Python child
trap 'kill $PY_PID 2>/dev/null || true' TERM INT

# Start public Go API server (uses $PORT from Render)
exec /app/server
