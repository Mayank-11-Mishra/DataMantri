#!/bin/bash

echo "🧹 DataMantri Fresh Start (Clears Cache)"
echo "========================================"
echo ""

cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

# Step 1: Kill everything
echo "1. Killing all processes..."
pkill -9 python 2>/dev/null
pkill -9 python3 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null
sleep 3
echo "   ✅ All killed"
echo ""

# Step 2: Clear Python cache
echo "2. Clearing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
echo "   ✅ Cache cleared"
echo ""

# Step 3: Verify port setting
echo "3. Verifying app_simple.py port setting..."
ACTUAL_PORT=$(grep -A 1 "# Run the Flask development server" app_simple.py | grep "port = int" | grep -o "5[0-9][0-9][0-9]" | head -1)
if [ "$ACTUAL_PORT" = "5001" ]; then
    echo "   ✅ Port is set to 5001 in code"
else
    echo "   ⚠️  WARNING: Port shows as $ACTUAL_PORT"
fi
echo ""

# Step 4: Fix database
echo "4. Fixing database schema..."
if [ -f "instance/zoho_uploader.db" ]; then
    sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);" 2>/dev/null
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';" 2>/dev/null
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;" 2>/dev/null
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;" 2>/dev/null
    echo "   ✅ Database fixed"
else
    echo "   ℹ️  Database will be created"
fi
echo ""

# Step 5: Start backend
echo "5. Starting backend (FRESH, NO CACHE)..."
echo "========================================"
echo ""
echo "🚀 Backend will start on PORT 5001"
echo "📋 Keep this terminal open!"
echo ""
echo "========================================"
echo ""

# Run with explicit Python path to avoid any aliasing
/usr/bin/python3 app_simple.py

echo ""
echo "========================================"
echo "Backend stopped"
echo "========================================"

