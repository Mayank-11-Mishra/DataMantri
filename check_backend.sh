#!/bin/bash

echo "🔍 Backend Diagnostic"
echo "===================="
echo ""

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:5001/api/session > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 5001"
    PORT=5001
elif curl -s http://localhost:5000/api/session > /dev/null 2>&1; then
    echo "   ⚠️  Backend is running on port 5000 (should be 5001!)"
    PORT=5000
else
    echo "   ❌ Backend is NOT running"
    exit 1
fi
echo ""

# Test login
echo "2. Testing login endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:$PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@datamantri.com","password":"demo123"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "   HTTP Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Login works!"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "   ❌ Login returns 500 error"
    echo "   This means backend code has a bug"
    echo ""
    echo "   SOLUTION: Backend needs to be restarted with the fixed code"
else
    echo "   ⚠️  Unexpected response: $HTTP_CODE"
fi
echo ""

echo "3. Recommended action:"
if [ "$PORT" = "5000" ]; then
    echo "   Backend is on wrong port (5000 instead of 5001)"
    echo "   Run: ./COMPLETE_RESTART.sh"
elif [ "$HTTP_CODE" = "500" ]; then
    echo "   Backend has old code with bugs"
    echo "   Run: ./COMPLETE_RESTART.sh"
else
    echo "   Everything looks good!"
fi

