#!/bin/bash

# DataMantri Pipeline Orchestrator - Quick Start Script

echo "=================================================="
echo "DataMantri Pipeline Orchestrator - Quick Start"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Start services
echo "Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Initialize database
echo ""
echo "Initializing database and creating admin user..."
docker-compose exec -T backend python init_db.py

echo ""
echo -e "${GREEN}=================================================="
echo "✅ DataMantri Pipeline Orchestrator is running!"
echo "==================================================${NC}"
echo ""
echo "🌐 Access Points:"
echo "  • API:           http://localhost:8000"
echo "  • API Docs:      http://localhost:8000/api/v1/docs"
echo "  • Flower (Monitoring): http://localhost:5555"
echo ""
echo "🔐 Default Login:"
echo "  • Email:    admin@datamantri.com"
echo "  • Password: admin123"
echo ""
echo "📚 Quick Commands:"
echo "  • View logs:     docker-compose logs -f backend"
echo "  • Stop services: docker-compose down"
echo "  • Restart:       docker-compose restart"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to configure your Google Cloud credentials!${NC}"
echo "  Set GOOGLE_APPLICATION_CREDENTIALS in backend/.env"
echo ""


