# 🚀 Quick Start Guide - Local Setup (No Docker)

This guide helps you run the Pipeline Orchestrator locally without Docker.

---

## ⚡ Super Quick Start

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator"

# 1. Install everything
./INSTALL_LOCAL.sh

# 2. Setup and start services
./start_local.sh

# 3. Follow the terminal instructions to start all services
```

---

## 📋 What Gets Installed

- **PostgreSQL 14** - Database for storing pipeline metadata
- **Redis** - Task queue and caching
- **Python packages** - FastAPI, Celery, SQLAlchemy, etc.
- **Node packages** - React, TypeScript, Tailwind CSS, etc.

---

## 🎬 Step-by-Step

### **Step 1: Install Dependencies**

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator"
./INSTALL_LOCAL.sh
```

This will:
- ✅ Install PostgreSQL (if not installed)
- ✅ Install Redis (if not installed)
- ✅ Install Python dependencies in virtual environment
- ✅ Install Node.js dependencies

**Time:** ~5-10 minutes

---

### **Step 2: Initialize Services**

```bash
./start_local.sh
```

This will:
- ✅ Start PostgreSQL service
- ✅ Start Redis service
- ✅ Create database `datamantri_pipelines`
- ✅ Initialize database schema
- ✅ Create admin user

**Output:**
```
🚀 Starting Pipeline Orchestrator (Local Setup - No Docker)
================================================================
✓ All prerequisites installed
✓ PostgreSQL is running
✓ Redis is running
✓ Database ready
✓ Database initialized
✅ All services are ready!
```

---

### **Step 3: Start Application Services** (4 terminals)

After running `start_local.sh`, you'll see commands to run. Open 4 terminal windows:

**Terminal 1: Backend API**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2: Celery Worker**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"
celery -A app.tasks.celery_app worker --loglevel=info
```

**Terminal 3: Celery Beat**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"
celery -A app.tasks.celery_app beat --loglevel=info
```

**Terminal 4: Frontend**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/frontend"
npm run dev
```

---

### **Step 4: Access Application**

Open your browser:
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/v1/docs

**Login:**
- Email: `admin@datamantri.com`
- Password: `admin123`

---

## 🛑 Stopping Services

### **Stop Application Services**
Press `Ctrl+C` in each terminal window

### **Stop Background Services**
```bash
# Stop PostgreSQL
brew services stop postgresql@14

# Stop Redis
brew services stop redis
```

### **Restart Background Services**
```bash
# Restart PostgreSQL
brew services restart postgresql@14

# Restart Redis
brew services restart redis
```

---

## 🔄 Daily Usage

After initial installation, to start working:

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator"

# 1. Start background services (if not already running)
brew services start postgresql@14 redis

# 2. Start application services in 4 terminals
# (Use the commands from Step 3 above)
```

---

## 🐛 Common Issues

### **"psql: command not found"**
```bash
# Add PostgreSQL to PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### **"Cannot connect to database"**
```bash
# Start PostgreSQL
brew services start postgresql@14

# Wait 3 seconds, then test
pg_isready
```

### **"Redis connection refused"**
```bash
# Start Redis
brew services start redis

# Wait 2 seconds, then test
redis-cli ping
# Should return: PONG
```

### **"Port 8000 already in use"**
```bash
# Find and kill process
lsof -i :8000
kill -9 <PID>
```

### **"Module not found" errors**
```bash
# Reinstall Python dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📊 Database Management

### **Access Database**
```bash
psql datamantri_pipelines
```

### **View Tables**
```sql
\dt
```

### **View Data**
```sql
SELECT * FROM users;
SELECT * FROM pipelines;
SELECT * FROM pipeline_runs;
```

### **Exit**
```sql
\q
```

### **Reset Database**
```bash
dropdb datamantri_pipelines
createdb datamantri_pipelines
cd backend
python init_db.py
```

---

## 🎯 Architecture

```
┌─────────────────────────────────────────────┐
│           Your Browser (Port 3000)          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│     React Frontend (Vite Dev Server)        │
│            http://localhost:3000            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│        FastAPI Backend (Uvicorn)            │
│            http://localhost:8000            │
└──────┬──────────────────────┬───────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐      ┌─────────────────┐
│ PostgreSQL  │      │  Celery Worker  │
│  (Port      │      │  + Celery Beat  │
│   5432)     │      │                 │
└─────────────┘      └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │     Redis       │
                     │  (Port 6379)    │
                     └─────────────────┘
```

---

## ✅ Checklist

- [ ] Homebrew installed
- [ ] PostgreSQL installed and running
- [ ] Redis installed and running
- [ ] Python dependencies installed
- [ ] Node dependencies installed
- [ ] Database initialized
- [ ] Backend API running (port 8000)
- [ ] Celery worker running
- [ ] Celery beat running
- [ ] Frontend running (port 3000)
- [ ] Can access http://localhost:3000
- [ ] Can login successfully

---

## 🎊 You're Ready!

Once all services are running, you have a complete data pipeline orchestration system!

- ✅ Create pipelines
- ✅ Schedule executions
- ✅ Monitor in real-time
- ✅ View execution history
- ✅ Manage data transfers

**Happy pipeline building!** 🚀


