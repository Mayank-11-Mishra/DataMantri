#!/bin/bash

echo "📦 Installing Pipeline Orchestrator Dependencies (Local Setup)"
echo "=============================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Homebrew
if ! command_exists brew; then
    echo -e "${YELLOW}Homebrew not found. Installing...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✓ Homebrew installed${NC}"
fi

# Install PostgreSQL
echo -e "${BLUE}Installing PostgreSQL...${NC}"
if ! command_exists psql; then
    brew install postgresql@14
    brew services start postgresql@14
    echo -e "${GREEN}✓ PostgreSQL installed and started${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL already installed${NC}"
    if ! brew services list | grep postgresql@14 | grep started > /dev/null; then
        brew services start postgresql@14
        echo -e "${GREEN}✓ PostgreSQL started${NC}"
    fi
fi

# Install Redis
echo -e "${BLUE}Installing Redis...${NC}"
if ! command_exists redis-cli; then
    brew install redis
    brew services start redis
    echo -e "${GREEN}✓ Redis installed and started${NC}"
else
    echo -e "${GREEN}✓ Redis already installed${NC}"
    if ! brew services list | grep redis | grep started > /dev/null; then
        brew services start redis
        echo -e "${GREEN}✓ Redis started${NC}"
    fi
fi

# Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Created virtual environment${NC}"
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"
deactivate

# Install Node dependencies
echo -e "${BLUE}Installing Node.js dependencies...${NC}"
cd ../frontend
npm install
echo -e "${GREEN}✓ Node.js dependencies installed${NC}"

cd ..

echo ""
echo "=============================================================="
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "=============================================================="
echo ""
echo "Next steps:"
echo "1. Run: ./start_local.sh"
echo "2. Follow the instructions to start all services"
echo "3. Access http://localhost:3000"
echo ""
