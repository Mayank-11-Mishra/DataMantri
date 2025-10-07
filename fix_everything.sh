#!/bin/bash

echo "🔧 DataMantri Complete Fix Script"
echo "=================================="
echo ""

# Step 1: Kill process on port 5000
echo "Step 1: Killing process on port 5000..."
sudo lsof -ti:5000 | xargs sudo kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Port 5000 freed"
else
    echo "⚠️  No process found on port 5000 (might already be free)"
fi
echo ""

# Step 2: Kill any old Flask processes
echo "Step 2: Killing old Flask processes..."
pkill -9 -f app_simple 2>/dev/null
sleep 1
echo "✅ Old processes killed"
echo ""

# Step 3: Fix database
echo "Step 3: Adding data_source_id column to database..."
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

if [ -f "instance/zoho_uploader.db" ]; then
    sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Column added successfully"
    else
        echo "ℹ️  Column might already exist (that's OK)"
    fi
else
    echo "ℹ️  Database doesn't exist yet (will be created)"
fi
echo ""

# Step 4: Start backend
echo "Step 4: Starting backend..."
echo "=================================="
python3 app_simple.py

