#!/bin/bash

# Script to run backend, frontend, and model services in separate konsole terminals

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${GREEN}Starting ReviewLens AI services in separate konsole windows...${NC}"

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

# Check if konsole is available
if ! command -v konsole &> /dev/null; then
    echo -e "${RED}konsole not found. Please install konsole or use another terminal emulator.${NC}"
    exit 1
fi

# Run Backend (FastAPI/Uvicorn) with virtual environment in konsole
echo -e "${YELLOW}Starting Backend in konsole...${NC}"
konsole --title "ReviewLens Backend" -e bash -c "cd '$BACKEND_DIR' && source .venv/bin/activate && echo 'Backend starting...' && uvicorn main:app --host 0.0.0.0 --port 8000 --reload; echo 'Backend stopped. Press Enter to close...'; read" &

# Run Frontend (Next.js) in konsole
echo -e "${YELLOW}Starting Frontend in konsole...${NC}"
konsole --title "ReviewLens Frontend" -e bash -c "cd '$FRONTEND_DIR' && echo 'Frontend starting...' && npm run dev; echo 'Frontend stopped. Press Enter to close...'; read" &

echo -e "${GREEN}Konsole commands have been issued!${NC}"
echo -e "${YELLOW}Check for new konsole windows for Backend and Frontend.${NC}"
echo -e "${YELLOW}Backend should be available at http://localhost:8000${NC}"
echo -e "${YELLOW}Frontend should be available at http://localhost:3000${NC}"
echo -e "${YELLOW}Note: Model files are loaded by the backend on startup${NC}"
echo -e "${YELLOW}To stop services, close the konsole windows or press Ctrl+C in each.${NC}"