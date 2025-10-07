#!/bin/bash

# DataMantri Database Setup Script
# Automates PostgreSQL setup for DataMantri

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  DATAMANTRI DATABASE SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if PostgreSQL is installed
echo "📋 Checking prerequisites..."
if ! command -v psql &> /dev/null
then
    echo "❌ PostgreSQL not found!"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  macOS:   brew install postgresql@15"
    echo "  Ubuntu:  sudo apt install postgresql"
    echo ""
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null
then
    echo "⚠️  PostgreSQL is not running"
    echo ""
    echo "Starting PostgreSQL..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@15
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start postgresql
    fi
    sleep 3
fi

if pg_isready &> /dev/null
then
    echo "✅ PostgreSQL is running"
else
    echo "❌ Could not start PostgreSQL"
    echo "Please start it manually and run this script again"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Creating Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if database exists
DB_EXISTS=$(psql postgres -tAc "SELECT 1 FROM pg_database WHERE datname='datamantri'" 2>/dev/null)

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  Database 'datamantri' already exists"
    read -p "Drop and recreate? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]
    then
        echo "Dropping database..."
        psql postgres -c "DROP DATABASE IF EXISTS datamantri;" 2>/dev/null
        echo "Creating database..."
        psql postgres -c "CREATE DATABASE datamantri;" 2>/dev/null
        echo "✅ Database recreated"
    else
        echo "Keeping existing database"
    fi
else
    echo "Creating database..."
    psql postgres -c "CREATE DATABASE datamantri;" 2>/dev/null
    echo "✅ Database created"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Installing Python Dependencies"
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

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Initializing Database Tables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run initialization script
python database/init_postgres.py

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Start the application:"
echo "   python app_simple.py"
echo ""
echo "🌐 Then visit:"
echo "   http://localhost:8080"
echo ""
echo "🔐 Login with:"
echo "   demo@datamantri.com / demo123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

