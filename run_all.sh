#!/bin/bash

# Script to run backend, frontend, and model services in separate terminals

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to detect available terminal emulator
detect_terminal() {
    if command -v gnome-terminal &> /dev/null; then
        echo "gnome-terminal"
    elif command -v konsole &> /dev/null; then
        echo "konsole"
    elif command -v xterm &> /dev/null; then
        echo "xterm"
    elif command -v mate-terminal &> /dev/null; then
        echo "mate-terminal"
    elif command -v terminator &> /dev/null; then
        echo "terminator"
    else
        echo ""
    fi
}

# Function to run command in new terminal window
run_in_terminal() {
    local title="$1"
    local cmd="$2"
    local term=$(detect_terminal)

    if [ -z "$term" ]; then
        echo -e "${YELLOW}No graphical terminal found. Running '$cmd' in background.${NC}"
        eval "$cmd &"
        return
    fi

    case "$term" in
        "gnome-terminal")
            gnome-terminal --title="$title" -- bash -c "$cmd; exec bash"
            ;;
        "konsole")
            konsole --title "$title" -e bash -c "$cmd; exec bash"
            ;;
        "xterm")
            xterm -title "$title" -e bash -c "$cmd; exec bash"
            ;;
        "mate-terminal")
            mate-terminal --title="$title" -- bash -c "$cmd; exec bash"
            ;;
        "terminator")
            terminator --title="$title" -e bash -c "$cmd; exec bash"
            ;;
        *)
            echo -e "${YELLOW}Unsupported terminal: $term. Running '$cmd' in background.${NC}"
            eval "$cmd &"
            ;;
    esac
}

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

# Run Backend (FastAPI/Uvicorn)
echo -e "${YELLOW}Starting Backend...${NC}"
run_in_terminal "ReviewLens Backend" "cd '$BACKEND_DIR' && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# Run Frontend (Next.js)
echo -e "${YELLOW}Starting Frontend...${NC}"
run_in_terminal "ReviewLens Frontend" "cd '$FRONTEND_DIR' && npm run dev"

# Note: Model files are loaded by the backend on startup, so no separate process needed for models

echo -e "${GREEN}All services have been started!${NC}"
echo -e "${YELLOW}Backend should be available at http://localhost:8000${NC}"
echo -e "${YELLOW}Frontend should be available at http://localhost:3000${NC}"
echo -e "${YELLOW}Check the terminal windows for logs and output.${NC}"