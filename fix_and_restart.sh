#!/bin/bash

echo "🔧 Data Mart Source ID Migration & Restart"
echo "=========================================="
echo ""

# Step 1: Add column if needed
echo "Step 1: Adding data_source_id column to data_marts table..."
python3 add_datamart_source_column.py

if [ $? -eq 0 ]; then
    echo "✅ Column migration complete"
else
    echo "⚠️  Column migration had issues (might already exist)"
fi

echo ""

# Step 2: Kill existing backend
echo "Step 2: Stopping existing backend..."
pkill -9 -f app_simple
sleep 2
echo "✅ Backend stopped"
echo ""

# Step 3: Start backend
echo "Step 3: Starting backend (will fix data marts on startup)..."
python3 app_simple.py &
sleep 3
echo "✅ Backend started"
echo ""

echo "=========================================="
echo "🎉 All done! Check the logs above for:"
echo "   - 'Fixing X data marts without source IDs...'"
echo "   - 'Successfully fixed X data marts'"
echo ""
echo "Now try your query in the SQL Editor!"
echo "=========================================="

