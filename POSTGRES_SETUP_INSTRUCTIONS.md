# 🗄️ PostgreSQL Local Setup - Ready to Install

## ⚠️ IMPORTANT: I Cannot Run These Commands (Require Password)

The installation requires **administrator password** which I cannot provide through Cursor. You need to run these commands in your own Terminal.

---

## 🚀 OPTION 1: ONE-LINE INSTALL (EASIEST)

**Open a NEW Terminal window** (outside Cursor) and run:

```bash
/tmp/install_datamantri_postgres.sh
```

This will:
- Install Homebrew (you'll enter password)
- Install PostgreSQL 15
- Start PostgreSQL service
- Create datamantri database
- Install Python dependencies
- Create all tables
- Add sample data

**Time:** ~10 minutes

---

## 🛠️ OPTION 2: COPY-PASTE ALL COMMANDS

**Open a NEW Terminal window** and copy-paste this entire block:

```bash
# Install Homebrew (you'll enter password here)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH (for M1/M2 Mac)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15
sleep 5

# Create database
psql postgres -c "CREATE DATABASE datamantri;"

# Setup DataMantri
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
source venv/bin/activate
pip install -r requirements.txt
echo "yes" | python database/init_postgres.py

# Start the application
python app_simple.py
```

---

## 🎯 WHAT YOU'LL GET

After installation:

✅ **PostgreSQL 15** running on `localhost:5432`

✅ **7 Tables created:**
   - `users`
   - `data_sources`
   - `data_marts`
   - `pipelines`
   - `pipeline_runs`
   - `dashboards`
   - `queries`

✅ **Sample Data:**
   - 2 Users (demo & admin)
   - 3 Data Sources (PostgreSQL, MySQL, MongoDB)
   - 2 Data Marts
   - 2 Pipelines
   - 1 Dashboard

✅ **Login Credentials:**
   - Demo: `demo@datamantri.com` / `demo123`
   - Admin: `admin@datamantri.com` / `admin123`

---

## 🌐 AFTER INSTALLATION

### Start the Application:

**Terminal 1 (Backend):**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
source venv/bin/activate
python app_simple.py
```

**Terminal 2 (Frontend):**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
npm run dev
```

### Visit:
```
http://localhost:8080
```

### Login:
```
Email: demo@datamantri.com
Password: demo123
```

---

## 🔍 VERIFY INSTALLATION

After running the commands, check:

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Check database exists
psql postgres -c "\l" | grep datamantri

# Check tables exist
psql datamantri -c "\dt"
```

You should see all 7 tables listed.

---

## 🆘 TROUBLESHOOTING

### "brew: command not found" after installing:
```bash
# For M1/M2 Mac:
eval "$(/opt/homebrew/bin/brew shellenv)"

# For Intel Mac:
eval "$(/usr/local/bin/brew shellenv)"
```

### "psql: command not found":
```bash
brew services restart postgresql@15
sleep 5
```

### "permission denied":
You need administrator access. Contact your IT department.

### "database already exists":
That's fine! Just continue with the remaining commands.

### "table already exists":
The script will show this but continue. It's okay.

---

## 📊 DATABASE CONNECTION DETAILS

Once installed, use these details in your application:

```
Host: localhost
Port: 5432
Database: datamantri
User: sunny.agarwal (your Mac username)
Password: (none - uses system auth)
```

---

## ✅ READY TO START?

**Step 1:** Open a NEW Terminal window (outside Cursor)

**Step 2:** Copy-paste one of the installation options above

**Step 3:** Enter your password when prompted

**Step 4:** Wait ~10 minutes

**Step 5:** Start the application!

---

## 📚 Additional Documentation

- **Detailed Guide:** `INSTALL_POSTGRESQL_MACOS.md`
- **Quick Reference:** `RUN_THIS_TO_INSTALL.md`
- **Database Models:** `database/models.py`
- **Init Script:** `database/init_postgres.py`

---

## 🎉 WHAT'S NEXT?

After PostgreSQL is set up:
1. ✅ Real database instead of mock data
2. ✅ Persistent data storage
3. ✅ Real data pipelines
4. ✅ Production-ready setup
5. 🚀 Deploy to Netlify/Vercel

---

**Questions? Check the detailed guide or run the commands above!** 🚀

