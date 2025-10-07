#!/bin/bash

echo "🔥 KILLING ALL OLD BACKENDS"
echo "=========================="
echo ""

cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

# Kill EVERYTHING Python
echo "Killing all Python processes..."
pkill -9 python 2>/dev/null
pkill -9 python3 2>/dev/null
sleep 1

# Kill everything on ports 5000 and 5001
echo "Killing processes on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 1

echo "Killing processes on port 5001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
sleep 2

echo "✅ All killed!"
echo ""
echo "Waiting 3 seconds..."
sleep 3
echo ""

# Fix database
echo "📝 Fixing database..."
if [ -f "instance/zoho_uploader.db" ]; then
    sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);" 2>/dev/null
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';" 2>/dev/null
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;" 2>/dev/null
    sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;" 2>/dev/null
    echo "✅ Database fixed"
else
    echo "ℹ️  Database will be created"
fi
echo ""

echo "🚀 STARTING NEW BACKEND"
echo "======================"
echo ""
echo "Backend will start on PORT 5001"
echo "Keep this terminal open!"
echo ""
echo "========================================"
python3 app_simple.py

