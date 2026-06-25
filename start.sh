#!/bin/bash
# run both servers — use two terminals if this doesn't work on your machine

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting backend on :4000..."
cd "$ROOT/backend" && npm run dev &
BACK_PID=$!

sleep 2

echo "Starting frontend on :3000..."
cd "$ROOT/frontend" && npm run dev &
FRONT_PID=$!

echo ""
echo "Backend:  http://localhost:4000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both"

trap "kill $BACK_PID $FRONT_PID 2>/dev/null" EXIT
wait