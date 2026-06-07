#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/service.pids"

if [ -f "$PID_FILE" ]; then
    read -r BACKEND_PID FRONTEND_PID < "$PID_FILE"
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || echo "Backend process not found"
    echo "Stopping frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || echo "Frontend process not found"
    rm -f "$PID_FILE"
    echo "Services stopped."
else
    echo "No PID file found. Services may not be running."
fi
