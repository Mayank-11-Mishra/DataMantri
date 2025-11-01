#!/bin/bash

echo "🚀 Starting DataMantri - Complete Stack"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start Backend
echo "📦 Starting Backend..."
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

python app_simple.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID) on http://localhost:5001"
echo ""

# Wait for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend..."
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID) on http://localhost:8082"
echo ""

echo "========================================"
echo "✅ DataMantri is running!"
echo ""
echo "Frontend: http://localhost:8082"
echo "Backend:  http://localhost:5001"
echo ""
echo "Login:"
echo "  Email:    admin@datamantri.com"
echo "  Password: admin123"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================"
echo ""

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Keep script running
wait

