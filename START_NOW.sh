#!/bin/bash

echo "🚀 DataMantri Quick Start"
echo "========================="
echo ""

cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

# Step 1: Fix database
echo "📝 Step 1: Fixing database schema..."
if [ -f "instance/zoho_uploader.db" ]; then
    sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database column added"
    else
        echo "ℹ️  Column already exists (OK)"
    fi
else
    echo "ℹ️  Database will be created on first run"
fi
echo ""

# Step 2: Kill old processes
echo "🔄 Step 2: Cleaning up old processes..."
pkill -9 -f app_simple 2>/dev/null
sleep 1
echo "✅ Cleanup complete"
echo ""

# Step 3: Start backend on port 5001
echo "🎯 Step 3: Starting backend on port 5001..."
echo "================================================"
echo ""
python3 app_simple.py

