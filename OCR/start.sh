#!/bin/sh
cd "$(dirname "$0")"
PORT=8765
( sleep 1; (command -v xdg-open >/dev/null && xdg-open "http://localhost:$PORT/doc-rebuilder.html") || open "http://localhost:$PORT/doc-rebuilder.html" ) >/dev/null 2>&1 &
exec python3 -m http.server $PORT --bind 127.0.0.1
