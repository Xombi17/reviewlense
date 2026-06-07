#!/bin/bash

# Script to run backend, frontend, and model services

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${GREEN}Starting ReviewLens AI services...${NC}"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

# Check if backend virtual environment exists
VENV_DIR="$BACKEND_DIR/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${RED}Virtual environment not found: $VENV_DIR${NC}"
    exit 1
fi

# Create logs directory
LOGS_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOGS_DIR"

# Run Backend (FastAPI/Uvicorn) with virtual environment in background
echo -e "${YELLOW}Starting Backend...${NC}"
cd "$BACKEND_DIR"
source .venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > "$LOGS_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${YELLOW}Backend started with PID: $BACKEND_PID${NC}"
deactivate

# Run Frontend (Next.js) in background
echo -e "${YELLOW}Starting Frontend...${NC}"
cd "$FRONTEND_DIR"
nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${YELLOW}Frontend started with PID: $FRONTEND_PID${NC}"

# Save PIDs to a file for easy cleanup
echo "$BACKEND_PID $FRONTEND_PID" > "$PROJECT_DIR/service.pids"

echo -e "${GREEN}All services started in background!${NC}"
echo -e "${YELLOW}Backend should be available at http://localhost:8000${NC}"
echo -e "${YELLOW}Frontend should be available at http://localhost:3000${NC}"
echo -e "${YELLOW}Logs are stored in: $LOGS_DIR${NC}"
echo -e "${YELLOW}To stop services, run: ./stop_services.sh${NC}"

# Create stop script
cat > "$PROJECT_DIR/stop_services.sh" << EOF
#!/bin/bash
PROJECT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="\$PROJECT_DIR/service.pids"

if [ -f "\$PID_FILE" ]; then
    read -r BACKEND_PID FRONTEND_PID < "\$PID_FILE"
    echo "Stopping backend (PID: \$BACKEND_PID)..."
    kill \$BACKEND_PID 2>/dev/null || echo "Backend process not found"
    echo "Stopping frontend (PID: \$FRONTEND_PID)..."
    kill \$FRONTEND_PID 2>/dev/null || echo "Frontend process not found"
    rm -f "\$PID_FILE"
    echo "Services stopped."
else
    echo "No PID file found. Services may not be running."
fi
EOF

chmod +x "$PROJECT_DIR/stop_services.sh"

echo -e "${YELLOW}A stop script has been created: stop_services.sh${NC}"