#!/bin/bash

# DataMantri PostgreSQL One-Command Installer for macOS
# This script will install everything needed for DataMantri

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DATAMANTRI POSTGRESQL INSTALLER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will install:"
echo "  • Homebrew (if not installed)"
echo "  • PostgreSQL 15"
echo "  • Python dependencies"
echo "  • DataMantri database & tables"
echo ""
read -p "Continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Installation cancelled."
    exit 0
fi

# Step 1: Check/Install Homebrew
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 1: Homebrew"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v brew &> /dev/null; then
    echo "✅ Homebrew is already installed"
    brew --version
else
    echo "📥 Installing Homebrew..."
    echo "⚠️  You may be asked for your password"
    echo ""
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zprofile
        source ~/.zprofile
    fi
    
    echo "✅ Homebrew installed successfully"
fi

# Step 2: Install PostgreSQL
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐘 Step 2: PostgreSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is already installed"
    psql --version
else
    echo "📥 Installing PostgreSQL 15..."
    echo "This may take a few minutes..."
    brew install postgresql@15
    echo "✅ PostgreSQL installed successfully"
fi

# Step 3: Start PostgreSQL
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "▶️  Step 3: Starting PostgreSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

brew services start postgresql@15
sleep 5  # Wait for PostgreSQL to start

if pg_isready &> /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  Starting PostgreSQL..."
    brew services restart postgresql@15
    sleep 5
fi

# Step 4: Create Database
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Step 4: Creating Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if database exists
DB_EXISTS=$(psql postgres -tAc "SELECT 1 FROM pg_database WHERE datname='datamantri'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  Database 'datamantri' already exists"
    read -p "Drop and recreate? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Dropping database..."
        psql postgres -c "DROP DATABASE IF EXISTS datamantri;" 2>/dev/null || true
        echo "Creating database..."
        psql postgres -c "CREATE DATABASE datamantri;" 2>/dev/null
        echo "✅ Database recreated"
    else
        echo "Keeping existing database"
    fi
else
    echo "Creating database 'datamantri'..."
    psql postgres -c "CREATE DATABASE datamantri;" 2>/dev/null
    echo "✅ Database created"
fi

# Step 5: Install Python Dependencies
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐍 Step 5: Python Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo "✅ Dependencies installed"

# Step 6: Initialize Database
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Step 6: Initializing Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "yes" | python database/init_postgres.py

# Success!
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ INSTALLATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 PostgreSQL Setup:"
echo "   • Host: localhost"
echo "   • Port: 5432"
echo "   • Database: datamantri"
echo "   • Status: Running ✅"
echo ""
echo "📦 Database Contents:"
echo "   • 2 Users"
echo "   • 3 Data Sources"
echo "   • 2 Data Marts"
echo "   • 2 Pipelines"
echo "   • 1 Dashboard"
echo ""
echo "🔐 Login Credentials:"
echo "   Demo:  demo@datamantri.com / demo123"
echo "   Admin: admin@datamantri.com / admin123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Start the backend:"
echo "   python app_simple.py"
echo ""
echo "2. In another terminal, start the frontend:"
echo "   npm run dev"
echo ""
echo "3. Visit:"
echo "   http://localhost:8080"
echo ""
echo "4. Login with:"
echo "   demo@datamantri.com / demo123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Enjoy DataMantri!"

