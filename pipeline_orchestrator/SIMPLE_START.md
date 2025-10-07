# 🚀 Simple Start (SQLite - No External Dependencies)

Ultra-simple setup using SQLite and in-memory task queue. **No PostgreSQL or Redis required!**

---

## ⚡ Quick Start

### **Step 1: Setup Environment**

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator"

# Copy SQLite configuration
cp backend/.env.sqlite backend/.env
```

### **Step 2: Initialize Database**

```bash
cd backend
python init_db.py
```

### **Step 3: Start Services** (3 separate terminals)

**Terminal 1: Backend API**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2: Celery Worker**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/backend"
python -m celery -A app.tasks.celery_app worker --loglevel=info --pool=solo
```

**Terminal 3: Frontend**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/frontend"
npm run dev
```

---

## 🌐 Access

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/v1/docs

**Login:**
- Email: `admin@datamantri.com`
- Password: `admin123`

---

## ⚠️ Limitations of Simple Setup

This setup uses:
- **SQLite** instead of PostgreSQL (good for development, not for production)
- **In-memory broker** instead of Redis (tasks won't persist across restarts)
- **No Celery Beat** (scheduled tasks won't work automatically)

**Good for:**
- ✅ Development & testing
- ✅ Learning the system
- ✅ Demo purposes
- ✅ Manual pipeline execution

**Not good for:**
- ❌ Production use
- ❌ Automatic scheduled execution
- ❌ High concurrency
- ❌ Distributed systems

---

## 🔄 Upgrade to Full Setup Later

When ready, switch to PostgreSQL + Redis:

1. Install Homebrew:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install services:
   ```bash
   brew install postgresql@14 redis
   brew services start postgresql@14 redis
   ```

3. Update `.env` file with PostgreSQL connection

---

## 📁 Database Files

SQLite will create these files in the `backend/` directory:
- `datamantri_pipelines.db` - Main database
- `celery_results.db` - Task results

To reset:
```bash
cd backend
rm *.db
python init_db.py
```

---

## ✅ Advantages

- ✅ No external dependencies
- ✅ Works out of the box
- ✅ Perfect for development
- ✅ Easy to reset
- ✅ Fast setup

---

## 🎯 You're Ready!

The simple setup is perfect for getting started. You can still:
- Create pipelines
- Execute them manually
- View execution history
- Test BigQuery → PostgreSQL transfers
- Use the full UI

**Start now:** Just run the 3 terminal commands above!


