#!/bin/bash

echo "🎨 Starting DataMantri Frontend..."
echo ""

cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Node modules not found!"
    echo "Installing dependencies..."
    npm install
fi

echo "✅ Dependencies installed"
echo "✅ Starting Vite dev server on port 8082..."
echo ""

npm run dev

