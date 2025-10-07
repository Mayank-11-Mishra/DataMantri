# 🚀 Install PostgreSQL on macOS - Step by Step Guide

Complete guide to install PostgreSQL locally on your Mac for DataMantri.

---

## 📋 **Option 1: Quick Install with Homebrew (Recommended)**

### **Step 1: Install Homebrew (if not installed)**

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Note:** Follow the on-screen instructions. You may need to add Homebrew to your PATH.

---

### **Step 2: Install PostgreSQL**

```bash
brew install postgresql@15
```

---

### **Step 3: Start PostgreSQL**

```bash
brew services start postgresql@15
```

---

### **Step 4: Verify Installation**

```bash
psql --version
# Should show: psql (PostgreSQL) 15.x

pg_isready
# Should show: accepting connections
```

---

### **Step 5: Create DataMantri Database**

```bash
# Connect to default database
psql postgres

# Inside psql, run:
CREATE DATABASE datamantri;

# Exit psql
\q
```

---

### **Step 6: Initialize DataMantri Tables**

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

# Install Python dependencies
source venv/bin/activate
pip install -r requirements.txt

# Run initialization script
python database/init_postgres.py
# Type 'yes' when prompted
```

---

## 📋 **Option 2: Use Postgres.app (Alternative)**

### **Step 1: Download Postgres.app**

Visit: https://postgresapp.com/

Download and install the latest version.

---

### **Step 2: Start Postgres.app**

1. Open Postgres.app from Applications
2. Click "Initialize" to create a new server
3. Server will start automatically

---

### **Step 3: Add psql to PATH**

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
```

Reload:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

---

### **Step 4: Follow Steps 5-6 from Option 1**

---

## 🔧 **Automated Setup Script**

We've created an automated script for you!

### **Run the setup script:**

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
chmod +x setup_database.sh
./setup_database.sh
```

This script will:
- ✅ Check if PostgreSQL is installed
- ✅ Start PostgreSQL if needed
- ✅ Create database
- ✅ Install Python dependencies
- ✅ Initialize all tables
- ✅ Add sample data

---

## ⚡ **Quick Commands Summary**

```bash
# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
psql postgres -c "CREATE DATABASE datamantri;"

# Initialize DataMantri
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
source venv/bin/activate
pip install -r requirements.txt
python database/init_postgres.py
```

---

## 🧪 **Verify Everything Works**

```bash
# 1. Check PostgreSQL is running
pg_isready

# 2. Connect to database
psql datamantri

# 3. List tables (inside psql)
\dt

# You should see:
# - users
# - data_sources
# - data_marts
# - pipelines
# - pipeline_runs
# - dashboards
# - queries

# 4. Check users (inside psql)
SELECT email, role FROM users;

# You should see:
# - demo@datamantri.com
# - admin@datamantri.com

# 5. Exit
\q

# 6. Start DataMantri
python app_simple.py

# 7. Visit http://localhost:8080
# 8. Login with: demo@datamantri.com / demo123
```

---

## 🛠️ **Troubleshooting**

### **Issue: Homebrew command not found after install**

**Solution:** Add Homebrew to PATH

For Apple Silicon (M1/M2):
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs:
```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

---

### **Issue: PostgreSQL won't start**

**Check status:**
```bash
brew services list | grep postgres
```

**Restart:**
```bash
brew services restart postgresql@15
```

**Check logs:**
```bash
tail -f /opt/homebrew/var/log/postgresql@15.log  # Apple Silicon
# or
tail -f /usr/local/var/log/postgresql@15.log      # Intel
```

---

### **Issue: Database already exists**

```bash
# Drop and recreate
psql postgres -c "DROP DATABASE IF EXISTS datamantri;"
psql postgres -c "CREATE DATABASE datamantri;"
```

---

### **Issue: Permission denied**

```bash
# Fix permissions
sudo chown -R $(whoami) /opt/homebrew/var/postgresql@15  # Apple Silicon
# or
sudo chown -R $(whoami) /usr/local/var/postgresql@15     # Intel
```

---

## 📚 **PostgreSQL Management Commands**

### **Service Management:**

```bash
# Start PostgreSQL
brew services start postgresql@15

# Stop PostgreSQL
brew services stop postgresql@15

# Restart PostgreSQL
brew services restart postgresql@15

# Check status
brew services list | grep postgres
```

### **Database Commands:**

```bash
# Connect to database
psql datamantri

# Connect as specific user
psql -U postgres datamantri

# List all databases
psql -l

# Run SQL file
psql datamantri < backup.sql
```

### **Backup & Restore:**

```bash
# Backup
pg_dump datamantri > datamantri_backup.sql

# Restore
psql datamantri < datamantri_backup.sql

# Compressed backup
pg_dump datamantri | gzip > datamantri_backup.sql.gz

# Restore compressed
gunzip -c datamantri_backup.sql.gz | psql datamantri
```

---

## 🔐 **Default Configuration**

After installation, PostgreSQL will be configured with:

- **Host:** localhost
- **Port:** 5432
- **User:** Your macOS username
- **Password:** None (trust authentication for local connections)
- **Database:** postgres (default)

---

## ✅ **What You'll Get**

After complete setup:

### **Database Structure:**
- 7 tables (users, data_sources, data_marts, pipelines, pipeline_runs, dashboards, queries)
- Proper relationships and foreign keys
- UUID primary keys
- Timestamps (created_at, updated_at)

### **Sample Data:**
- 2 Users (demo & admin)
- 3 Data Sources (PostgreSQL, MySQL, MongoDB)
- 2 Data Marts (User Analytics, Sales Summary)
- 2 Pipelines (User Sync, Order ETL)
- 1 Dashboard (Main Analytics)

### **Login Credentials:**
- **Demo:** demo@datamantri.com / demo123
- **Admin:** admin@datamantri.com / admin123

---

## 🎯 **Next Steps After Installation**

1. **Start the backend:**
   ```bash
   python app_simple.py
   ```

2. **Start the frontend (in another terminal):**
   ```bash
   npm run dev
   ```

3. **Visit:**
   ```
   http://localhost:8080
   ```

4. **Login with:**
   ```
   demo@datamantri.com / demo123
   ```

5. **Test features:**
   - Data Management → Data Sources
   - Create new data source
   - View schemas
   - Create pipelines

---

## 🆘 **Need Help?**

If you encounter any issues:

1. Check PostgreSQL status: `pg_isready`
2. View logs: `brew services list`
3. Check database exists: `psql -l | grep datamantri`
4. Verify tables: `psql datamantri -c "\dt"`

---

## 🎉 **Success Checklist**

- [ ] Homebrew installed
- [ ] PostgreSQL installed
- [ ] PostgreSQL service running
- [ ] Database `datamantri` created
- [ ] All 7 tables created
- [ ] Sample data loaded
- [ ] Demo user can login
- [ ] Application starts successfully
- [ ] Can access http://localhost:8080

---

**Ready to install?**

Run this one command:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && brew install postgresql@15 && brew services start postgresql@15
```

Then follow steps 5-6 to initialize the database!

