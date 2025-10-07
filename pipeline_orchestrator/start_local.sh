#!/bin/bash

echo "🚀 Starting Pipeline Orchestrator (Local Setup - No Docker)"
echo "================================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists psql; then
    echo -e "${RED}✗ PostgreSQL not found${NC}"
    echo "Install with: brew install postgresql@14"
    exit 1
fi

if ! command_exists redis-cli; then
    echo -e "${RED}✗ Redis not found${NC}"
    echo "Install with: brew install redis"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"

# Check and start PostgreSQL
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if ! pg_isready > /dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    brew services start postgresql@14
    sleep 3
    
    if ! pg_isready > /dev/null 2>&1; then
        echo -e "${RED}✗ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Check and start Redis
echo -e "${BLUE}Checking Redis...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis..."
    brew services start redis
    sleep 2
    
    if ! redis-cli ping > /dev/null 2>&1; then
        echo -e "${RED}✗ Failed to start Redis${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Redis is running${NC}"

# Create database if doesn't exist
echo -e "${BLUE}Setting up database...${NC}"
if ! psql -lqt | cut -d \| -f 1 | grep -qw datamantri_pipelines; then
    echo "Creating database..."
    createdb datamantri_pipelines
fi
echo -e "${GREEN}✓ Database ready${NC}"

# Copy .env file
echo -e "${BLUE}Setting up configuration...${NC}"
if [ ! -f backend/.env ]; then
    cp backend/.env.local backend/.env
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Initialize database
echo -e "${BLUE}Initializing database schema...${NC}"
cd backend
python init_db.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${YELLOW}⚠ Database might already be initialized${NC}"
fi
cd ..

echo ""
echo "================================================================"
echo -e "${GREEN}✅ All services are ready!${NC}"
echo "================================================================"
echo ""
echo -e "${YELLOW}Now start the following in SEPARATE terminals:${NC}"
echo ""
echo -e "${BLUE}Terminal 1 - Backend API:${NC}"
echo '  cd "'$(pwd)'/backend" && uvicorn main:app --reload --host 0.0.0.0 --port 8000'
echo ""
echo -e "${BLUE}Terminal 2 - Celery Worker:${NC}"
echo '  cd "'$(pwd)'/backend" && celery -A app.tasks.celery_app worker --loglevel=info'
echo ""
echo -e "${BLUE}Terminal 3 - Celery Beat:${NC}"
echo '  cd "'$(pwd)'/backend" && celery -A app.tasks.celery_app beat --loglevel=info'
echo ""
echo -e "${BLUE}Terminal 4 - Frontend:${NC}"
echo '  cd "'$(pwd)'/frontend" && npm run dev'
echo ""
echo "================================================================"
echo -e "${GREEN}Access Points:${NC}"
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8000"
echo "  API Docs:  http://localhost:8000/api/v1/docs"
echo ""
echo -e "${GREEN}Login Credentials:${NC}"
echo "  Email:     admin@datamantri.com"
echo "  Password:  admin123"
echo "================================================================"
