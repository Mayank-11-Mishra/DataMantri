#!/bin/bash

echo "🔧 DataMantri Complete Restart & Fix"
echo "====================================="
echo ""

cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

# Step 1: Show what's running on port 5000 and 5001
echo "Step 1: Checking ports..."
echo "Port 5000:"
lsof -ti:5000 | xargs ps -p 2>/dev/null || echo "  Nothing running"
echo ""
echo "Port 5001:"
lsof -ti:5001 | xargs ps -p 2>/dev/null || echo "  Nothing running"
echo ""

# Step 2: Kill everything
echo "Step 2: Killing all processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null && echo "  ✅ Killed port 5000"
lsof -ti:5001 | xargs kill -9 2>/dev/null && echo "  ✅ Killed port 5001"
pkill -9 -f app_simple 2>/dev/null && echo "  ✅ Killed app_simple processes"
sleep 2
echo ""

# Step 3: Fix database
echo "Step 3: Fixing database..."
if [ -f "instance/zoho_uploader.db" ]; then
    sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "  ✅ Database column added"
    else
        echo "  ℹ️  Column already exists (OK)"
    fi
    
    # Also add missing user columns
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';" 2>/dev/null
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;" 2>/dev/null
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;" 2>/dev/null
    echo "  ✅ User table columns checked"
else
    echo "  ℹ️  Database will be created on first run"
fi
echo ""

# Step 4: Verify port setting in code
echo "Step 4: Verifying configuration..."
PORT_LINE=$(grep "port = int(os.getenv" app_simple.py | head -1)
echo "  Port setting: $PORT_LINE"
if echo "$PORT_LINE" | grep -q "5001"; then
    echo "  ✅ Backend configured for port 5001"
else
    echo "  ⚠️  WARNING: Backend might still use port 5000"
fi
echo ""

# Step 5: Start backend
echo "Step 5: Starting backend..."
echo "====================================="
echo "Backend output below:"
echo "====================================="
echo ""
python3 app_simple.py

echo ""
echo "====================================="
echo "Backend stopped or failed to start"
echo "====================================="

