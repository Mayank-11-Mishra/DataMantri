#!/bin/bash

echo "🔄 Restarting Backend..."
echo "======================="
echo ""

cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

# Kill old backend
echo "Stopping old backend..."
pkill -9 -f app_simple 2>/dev/null
sleep 2
echo "✅ Stopped"
echo ""

# Start new backend
echo "Starting backend on port 5001..."
echo "================================================"
echo ""
python3 app_simple.py

