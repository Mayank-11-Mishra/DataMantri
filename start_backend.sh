#!/bin/bash

echo "🚀 Starting DataMantri Backend..."
echo ""

cd "$(dirname "$0")/backend"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo "✅ Virtual environment activated"
echo "✅ Starting Flask server on port 5001..."
echo ""

python app_simple.py

