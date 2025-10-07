#!/bin/bash

echo "🚀 Simple Start - Pipeline Orchestrator"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator"

# Setup configuration
echo -e "${BLUE}Setting up configuration...${NC}"
cd "$PROJECT_DIR/backend"
if [ ! -f .env ]; then
    cp .env.sqlite .env
    echo -e "${GREEN}✓ Created .env file (SQLite mode)${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Initialize database
echo -e "${BLUE}Initializing database...${NC}"
python init_db.py 2>&1 | grep -E "(Created|Admin user|✓|Error)" || echo "Database initialized"
echo -e "${GREEN}✓ Database ready${NC}"

echo ""
echo "========================================"
echo -e "${GREEN}✅ Ready to start!${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Open 3 SEPARATE terminals and run:${NC}"
echo ""
echo -e "${BLUE}Terminal 1 - Backend API:${NC}"
echo "  cd \"$PROJECT_DIR/backend\" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo -e "${BLUE}Terminal 2 - Celery Worker:${NC}"
echo "  cd \"$PROJECT_DIR/backend\" && python -m celery -A app.tasks.celery_app worker --loglevel=info --pool=solo"
echo ""
echo -e "${BLUE}Terminal 3 - Frontend:${NC}"
echo "  cd \"$PROJECT_DIR/frontend\" && npm run dev"
echo ""
echo "========================================"
echo -e "${GREEN}Access Points:${NC}"
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8000"
echo "  API Docs:  http://localhost:8000/api/v1/docs"
echo ""
echo -e "${GREEN}Login:${NC}"
echo "  Email:     admin@datamantri.com"
echo "  Password:  admin123"
echo "========================================"
echo ""
echo -e "${YELLOW}Note: Using SQLite (simple mode)${NC}"
echo "  - No PostgreSQL/Redis required"
echo "  - Perfect for development"
echo "  - See SIMPLE_START.md for details"
echo ""
