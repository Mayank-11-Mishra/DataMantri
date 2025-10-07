# 🚀 Local Setup (No Docker Required)

Complete setup guide for running the Pipeline Orchestrator locally on macOS without Docker.

---

## 📋 Prerequisites Installation

### **1. Install Homebrew** (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### **2. Install PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb datamantri_pipelines

# Test connection
psql datamantri_pipelines
# Type \q to quit
```

### **3. Install Redis**
```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Test connection
redis-cli ping
# Should return: PONG
```

### **4. Install Python Dependencies**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### **5. Install Node.js Dependencies**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/frontend"

npm install
```

---

## ⚙️ Configuration

### **Backend Configuration** (`.env` file)

Create `.env` file in `backend/` directory:

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"

cat > .env << 'EOF'
# Database (local PostgreSQL)
DATABASE_URL=postgresql+psycopg2://$(whoami)@localhost:5432/datamantri_pipelines

# JWT Settings
SECRET_KEY=local-dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Celery (local Redis)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Google Cloud (optional - set if using BigQuery)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account.json
BIGQUERY_PROJECT_ID=your-gcp-project-id
EOF
```

---

## 🎬 Starting the System

### **Option 1: Automated Start (Recommended)**

Create a startup script:

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator"

cat > start_local.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Pipeline Orchestrator (Local Setup)"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if ! pg_isready > /dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    brew services start postgresql@14
    sleep 2
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Check if Redis is running
echo -e "${BLUE}Checking Redis...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis..."
    brew services start redis
    sleep 2
fi
echo -e "${GREEN}✓ Redis is running${NC}"

# Initialize database
echo -e "${BLUE}Initializing database...${NC}"
cd backend
python init_db.py
cd ..
echo -e "${GREEN}✓ Database initialized${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}✓ All services ready!${NC}"
echo ""
echo "Now start the following in separate terminals:"
echo ""
echo "Terminal 1 - Backend API:"
echo "  cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "Terminal 2 - Celery Worker:"
echo "  cd backend && celery -A app.tasks.celery_app worker --loglevel=info"
echo ""
echo "Terminal 3 - Celery Beat:"
echo "  cd backend && celery -A app.tasks.celery_app beat --loglevel=info"
echo ""
echo "Terminal 4 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Access frontend at: http://localhost:3000"
echo "Access API docs at: http://localhost:8000/api/v1/docs"
echo ""
EOF

chmod +x start_local.sh
./start_local.sh
```

### **Option 2: Manual Start** (4 separate terminals)

**Terminal 1: Backend API**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"

# Activate virtual environment if using one
source venv/bin/activate

# Start FastAPI
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2: Celery Worker**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"

# Activate virtual environment if using one
source venv/bin/activate

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info
```

**Terminal 3: Celery Beat (Scheduler)**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"

# Activate virtual environment if using one
source venv/bin/activate

# Start Celery beat
celery -A app.tasks.celery_app beat --loglevel=info
```

**Terminal 4: Frontend**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/frontend"

# Start React dev server
npm run dev
```

---

## 🌐 Access Points

| Service | URL | Status |
|---------|-----|--------|
| **Frontend UI** | http://localhost:3000 | ✅ Running |
| **Backend API** | http://localhost:8000 | ✅ Running |
| **API Docs** | http://localhost:8000/api/v1/docs | ✅ Running |
| **PostgreSQL** | localhost:5432 | ✅ Local |
| **Redis** | localhost:6379 | ✅ Local |

**Login Credentials:**
- Email: `admin@datamantri.com`
- Password: `admin123`

---

## 🛠️ Management Commands

### **PostgreSQL**
```bash
# Start PostgreSQL
brew services start postgresql@14

# Stop PostgreSQL
brew services stop postgresql@14

# Restart PostgreSQL
brew services restart postgresql@14

# Connect to database
psql datamantri_pipelines

# View all databases
psql -l
```

### **Redis**
```bash
# Start Redis
brew services start redis

# Stop Redis
brew services stop redis

# Test Redis
redis-cli ping

# View Redis data
redis-cli
> KEYS *
> GET key_name
```

### **Database Reset**
```bash
cd backend

# Drop and recreate database
dropdb datamantri_pipelines
createdb datamantri_pipelines

# Reinitialize
python init_db.py
```

---

## 🐛 Troubleshooting

### **"psql: command not found"**
```bash
# Add PostgreSQL to PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### **"Cannot connect to PostgreSQL"**
```bash
# Check if running
brew services list | grep postgresql

# If not running
brew services start postgresql@14

# Check logs
tail -f /opt/homebrew/var/log/postgresql@14.log
```

### **"Redis connection refused"**
```bash
# Check if running
brew services list | grep redis

# If not running
brew services start redis

# Test connection
redis-cli ping
```

### **"Port 8000 already in use"**
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

### **"Port 3000 already in use"**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 🔄 Starting Services on System Boot

To automatically start PostgreSQL and Redis on system boot:

```bash
# Enable auto-start
brew services start postgresql@14
brew services start redis

# Disable auto-start
brew services stop postgresql@14
brew services stop redis
```

---

## 📊 Database Management

### **View Data**
```bash
psql datamantri_pipelines

-- View all tables
\dt

-- View users
SELECT * FROM users;

-- View pipelines
SELECT * FROM pipelines;

-- View runs
SELECT * FROM pipeline_runs;

-- Exit
\q
```

### **Backup Database**
```bash
# Backup
pg_dump datamantri_pipelines > backup.sql

# Restore
psql datamantri_pipelines < backup.sql
```

---

## 🚀 Quick Start Summary

```bash
# 1. Install services
brew install postgresql@14 redis
brew services start postgresql@14 redis

# 2. Create database
createdb datamantri_pipelines

# 3. Install Python dependencies
cd backend
pip install -r requirements.txt
python init_db.py

# 4. Install Node dependencies
cd ../frontend
npm install

# 5. Start services (4 terminals)
# Terminal 1: cd backend && uvicorn main:app --reload
# Terminal 2: cd backend && celery -A app.tasks.celery_app worker
# Terminal 3: cd backend && celery -A app.tasks.celery_app beat
# Terminal 4: cd frontend && npm run dev

# 6. Access
# http://localhost:3000
```

---

## ✅ Benefits of Local Setup

- ✅ No Docker required
- ✅ Faster startup times
- ✅ Better for development
- ✅ Easier to debug
- ✅ Native performance
- ✅ Uses system services
- ✅ Persistent data by default

---

## 📝 Notes

- **PostgreSQL data location**: `/opt/homebrew/var/postgresql@14/`
- **Redis data location**: `/opt/homebrew/var/db/redis/`
- **Logs**: Check `brew services list` for log locations

---

## 🎯 Next Steps

1. ✅ Install PostgreSQL and Redis
2. ✅ Configure environment variables
3. ✅ Initialize database
4. ✅ Start all services
5. ✅ Access http://localhost:3000
6. ✅ Login and create your first pipeline!

**You're ready to go!** 🚀


