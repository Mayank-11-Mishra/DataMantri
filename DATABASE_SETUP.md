# 🗄️ DataMantri PostgreSQL Database Setup Guide

Complete guide to set up and configure PostgreSQL database for DataMantri.

---

## 📋 **Prerequisites**

### **1. Install PostgreSQL**

#### **macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### **Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **Windows:**
Download and install from: https://www.postgresql.org/download/windows/

---

## 🚀 **Quick Setup (5 Minutes)**

### **Step 1: Create Database**

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE datamantri;

# Create user (optional, if not using default postgres user)
CREATE USER datamantri_user WITH ENCRYPTED PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE datamantri TO datamantri_user;

# Exit
\q
```

### **Step 2: Configure Environment**

Create `.env` file in project root:

```bash
# Copy example and edit
cp .env.example .env
```

Edit `.env`:
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=datamantri
DB_SCHEMA=public
```

### **Step 3: Install Python Dependencies**

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install/upgrade dependencies
pip install -r requirements.txt
```

### **Step 4: Initialize Database**

```bash
# Run initialization script
python database/init_postgres.py
```

Type `yes` when prompted to create all tables and seed data.

### **Step 5: Start Application**

```bash
python app_simple.py
```

---

## 📊 **Database Schema**

### **Tables Created:**

1. **users** - User authentication and profiles
2. **data_sources** - Database connections
3. **data_marts** - Analytics data marts
4. **pipelines** - ETL pipelines
5. **pipeline_runs** - Pipeline execution history
6. **dashboards** - User dashboards
7. **queries** - Saved SQL queries

---

## 🔐 **Default Credentials**

After initialization, you'll have:

### **Demo User:**
- **Email:** demo@datamantri.com
- **Password:** demo123
- **Role:** SUPER_ADMIN

### **Admin User:**
- **Email:** admin@datamantri.com
- **Password:** admin123
- **Role:** ADMIN

---

## 📊 **Sample Data Included:**

### **3 Data Sources:**
1. PostgreSQL Production (localhost:5432)
2. MySQL Analytics (localhost:3306)
3. MongoDB Logs (localhost:27017)

### **2 Data Marts:**
1. User Analytics (daily at 2 AM)
2. Sales Summary (daily at midnight)

### **2 Pipelines:**
1. User Data Sync (hourly)
2. Order ETL Pipeline (every 6 hours)

### **1 Dashboard:**
1. Main Analytics Dashboard

---

## 🔧 **Advanced Configuration**

### **Connection Pooling:**

Edit `.env`:
```env
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
```

### **SSL Configuration:**

```env
DB_SSL_MODE=require
DB_SSL_CERT=/path/to/client-cert.pem
DB_SSL_KEY=/path/to/client-key.pem
DB_SSL_CA=/path/to/ca-cert.pem
```

### **Query Timeout:**

```env
DB_QUERY_TIMEOUT=300  # seconds
DB_ECHO_SQL=true  # Enable SQL logging
```

---

## 🛠️ **Database Management**

### **Connect to Database:**

```bash
psql -h localhost -U postgres -d datamantri
```

### **Useful PostgreSQL Commands:**

```sql
-- List all tables
\dt

-- Describe table structure
\d users

-- Show all databases
\l

-- Show all users
\du

-- Check database size
SELECT pg_size_pretty(pg_database_size('datamantri'));

-- Check table sizes
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
```

### **Backup Database:**

```bash
# Full backup
pg_dump -h localhost -U postgres datamantri > datamantri_backup.sql

# Compressed backup
pg_dump -h localhost -U postgres datamantri | gzip > datamantri_backup.sql.gz
```

### **Restore Database:**

```bash
# From SQL file
psql -h localhost -U postgres datamantri < datamantri_backup.sql

# From compressed file
gunzip -c datamantri_backup.sql.gz | psql -h localhost -U postgres datamantri
```

---

## 🔍 **Troubleshooting**

### **Issue 1: Cannot connect to PostgreSQL**

**Check if PostgreSQL is running:**
```bash
# macOS/Linux
ps aux | grep postgres

# Or check service status
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

**Start PostgreSQL:**
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

---

### **Issue 2: Authentication failed**

**Edit PostgreSQL config:**
```bash
# Find pg_hba.conf
psql -U postgres -c "SHOW hba_file"

# Edit the file
sudo nano /path/to/pg_hba.conf

# Change method to 'md5' or 'trust' for local connections:
# local   all   postgres   md5
# host    all   all   127.0.0.1/32   md5

# Restart PostgreSQL
sudo systemctl restart postgresql  # Linux
brew services restart postgresql@15  # macOS
```

---

### **Issue 3: Database does not exist**

**Create database manually:**
```bash
psql -U postgres -c "CREATE DATABASE datamantri;"
```

---

### **Issue 4: Permission denied**

**Grant privileges:**
```bash
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE datamantri TO postgres;"
psql -U postgres -d datamantri -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;"
psql -U postgres -d datamantri -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;"
```

---

### **Issue 5: Port already in use**

**Find process using port 5432:**
```bash
lsof -i :5432
```

**Kill process or change port:**
```bash
# Kill process
kill -9 <PID>

# Or change PostgreSQL port in postgresql.conf
```

---

## 🔄 **Migration from SQLite**

If you have existing SQLite database:

### **Step 1: Export data from SQLite**

```python
# export_sqlite.py
import sqlite3
import json

conn = sqlite3.connect('instance/zoho_uploader.db')
cursor = conn.cursor()

# Export users
cursor.execute("SELECT * FROM users")
users = cursor.fetchall()
with open('users.json', 'w') as f:
    json.dump(users, f)

# Repeat for other tables...
conn.close()
```

### **Step 2: Import to PostgreSQL**

```python
# import_to_postgres.py
import json
from app_simple import app
from database.models import db, User

with app.app_context():
    with open('users.json', 'r') as f:
        users = json.load(f)
    
    for user_data in users:
        user = User(**user_data)
        db.session.add(user)
    
    db.session.commit()
```

---

## 📈 **Performance Optimization**

### **Create Indexes:**

```sql
-- Index on frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_data_sources_type ON data_sources(connection_type);
CREATE INDEX idx_pipelines_status ON pipelines(status);
CREATE INDEX idx_pipeline_runs_pipeline_id ON pipeline_runs(pipeline_id);
CREATE INDEX idx_pipeline_runs_started_at ON pipeline_runs(started_at DESC);
```

### **Analyze Tables:**

```sql
-- Update statistics
ANALYZE users;
ANALYZE data_sources;
ANALYZE pipelines;
ANALYZE pipeline_runs;
```

### **Vacuum:**

```sql
-- Clean up and optimize
VACUUM ANALYZE;
```

---

## 🔐 **Security Best Practices**

### **1. Use Environment Variables**
Never commit database credentials to git.

### **2. Use Strong Passwords**
```bash
# Generate strong password
openssl rand -base64 32
```

### **3. Encrypt Sensitive Data**
Store passwords and API keys encrypted in database.

### **4. Regular Backups**
Set up automated daily backups:
```bash
# Add to crontab
0 2 * * * pg_dump -h localhost -U postgres datamantri | gzip > /backups/datamantri_$(date +\%Y\%m\%d).sql.gz
```

### **5. Limit Database Permissions**
Create separate users with limited permissions for different services.

---

## 🧪 **Testing Database Connection**

### **Python Script:**

```python
# test_db.py
from database.config import test_connection, health_check

# Test basic connection
if test_connection():
    print("✅ Database connection successful!")
else:
    print("❌ Database connection failed!")

# Health check
health = health_check()
print(f"\nHealth Check:")
print(f"Status: {health['status']}")
print(f"Database: {health['database']}")
print(f"Tables Found: {health.get('tables_found', 'N/A')}")
```

### **Run Test:**

```bash
python test_db.py
```

---

## 📚 **Database Models Reference**

### **User Model:**
```python
User(
    email='user@example.com',
    password='hashed_password',
    name='User Name',
    role='ADMIN',  # SUPER_ADMIN, ADMIN, EDITOR, VIEWER
    is_admin=True,
    is_active=True
)
```

### **DataSource Model:**
```python
DataSource(
    name='My Database',
    connection_type='postgresql',  # postgresql, mysql, mongodb, bigquery
    host='localhost',
    port=5432,
    database='mydb',
    username='user',
    password='pass',
    status='connected'
)
```

### **Pipeline Model:**
```python
Pipeline(
    name='ETL Pipeline',
    pipeline_type='sql',  # simple, sql, custom
    source_id='source-uuid',
    destination_id='dest-uuid',
    source_table='users',
    destination_table='users_copy',
    schedule='0 * * * *',  # Hourly
    status='active'
)
```

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] PostgreSQL service is running
- [ ] Database `datamantri` exists
- [ ] All 7 tables are created
- [ ] Demo user can login
- [ ] Sample data is loaded
- [ ] Application starts without errors
- [ ] Can connect to data sources
- [ ] Can view dashboards
- [ ] Pipelines are created

---

## 🆘 **Support**

If you encounter issues:

1. Check logs: `tail -f backend-schema-fixed.log`
2. Verify PostgreSQL status: `systemctl status postgresql`
3. Test connection: `python test_db.py`
4. Check database config: `cat .env`

---

## 🎉 **Success!**

Once setup is complete, you should see:

```
✅ DATABASE INITIALIZED SUCCESSFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
   • Users: 2
   • Data Sources: 3
   • Data Marts: 2
   • Pipelines: 2
   • Dashboards: 1

🔐 Login Credentials:
   • Demo: demo@datamantri.com / demo123
   • Admin: admin@datamantri.com / admin123

🌐 Start the application:
   python app_simple.py
```

**Your DataMantri database is now ready!** 🚀

Visit: http://localhost:8080

