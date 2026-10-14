#!/bin/bash
# Double-click on macOS (or run ./start.command) to serve the lab and open it in your browser.
cd "$(dirname "$0")"
PORT=8765
echo "DGX Spark Cluster Lab running at http://localhost:$PORT  (press Ctrl+C to stop)"
( sleep 1; open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null ) &
python3 -m http.server $PORT --bind 127.0.0.1
