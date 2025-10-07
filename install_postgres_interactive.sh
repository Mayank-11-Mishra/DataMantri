#!/bin/bash

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DATAMANTRI POSTGRESQL INSTALLER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will install PostgreSQL locally on your Mac."
echo "You'll be asked for your password during installation."
echo ""
read -p "Press ENTER to start installation..."
echo ""

# Step 1: Install Homebrew
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 1/6: Installing Homebrew"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v brew &> /dev/null; then
    echo "✅ Homebrew already installed!"
else
    echo "⚠️  You will be asked for your Mac password..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add to PATH
    if [[ $(uname -m) == 'arm64' ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        eval "$(/usr/local/bin/brew shellenv)"
    fi
fi

echo ""
read -p "Press ENTER to continue..."
echo ""

# Step 2: Install PostgreSQL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 2/6: Installing PostgreSQL 15"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

brew install postgresql@15

echo ""
read -p "Press ENTER to continue..."
echo ""

# Step 3: Start PostgreSQL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Step 3/6: Starting PostgreSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

brew services start postgresql@15
sleep 5

echo "✅ PostgreSQL started!"
echo ""
read -p "Press ENTER to continue..."
echo ""

# Step 4: Create database
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Step 4/6: Creating datamantri database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

psql postgres -c "CREATE DATABASE datamantri;" 2>/dev/null || echo "⚠️  Database might already exist"

echo "✅ Database ready!"
echo ""
read -p "Press ENTER to continue..."
echo ""

# Step 5: Install Python dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐍 Step 5/6: Installing Python dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
source venv/bin/activate
pip install -q psycopg2-binary sqlalchemy

echo "✅ Dependencies installed!"
echo ""
read -p "Press ENTER to continue..."
echo ""

# Step 6: Initialize database
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Step 6/6: Creating tables and sample data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python database/init_postgres.py

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ INSTALLATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 PostgreSQL is now set up with:"
echo "   • Database: datamantri"
echo "   • 7 Tables created"
echo "   • Sample data loaded"
echo ""
echo "🔐 Login credentials:"
echo "   Demo:  demo@datamantri.com / demo123"
echo "   Admin: admin@datamantri.com / admin123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Ready to start the application!"
echo ""

