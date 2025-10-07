# 🔍 Getting Real Data Instead of Mock Data

## Current Situation

You're seeing **mock/dummy data** for:
- ✅ **Slow Queries** 
- ✅ **Access Logs**

This is **expected behavior** because these features require specific PostgreSQL extensions and configuration.

---

## Why You're Seeing Mock Data

### 1. Slow Queries
**Requires**: PostgreSQL's `pg_stat_statements` extension

**Current Status**: The backend now tries to:
1. Auto-enable the extension: `CREATE EXTENSION IF NOT EXISTS pg_stat_statements`
2. Query real slow queries from the database
3. Fall back to mock data if extension is not available

**Why Mock Data?**
- Extension not enabled in PostgreSQL
- No slow queries recorded yet (database needs to run queries first)
- Insufficient permissions to create extension

### 2. Access Logs
**Requires**: Real database activity or audit log system

**Current Status**: The backend now tries to:
1. Query `pg_stat_activity` for recent database activity
2. Parse queries to determine action types
3. Fall back to mock data if no activity found

**Why Mock Data?**
- Database is newly created (no activity history)
- No recent queries to the database
- Connection issues

---

## ✅ What's Been Fixed

### Enhanced Backend Logic

**File**: `app_simple.py`

#### Slow Queries Endpoint
```python
# Now automatically tries to enable pg_stat_statements
conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_stat_statements"))

# Better logging
logger.info(f"Found {len(queries)} real slow queries")
logger.warning(f"pg_stat_statements not available: {e}. Returning mock data")
```

#### Access Logs Endpoint
```python
# Now queries real PostgreSQL activity
SELECT 
    usename, datname, state, query, 
    backend_start, query_start, state_change
FROM pg_stat_activity
WHERE datname = :database

# Intelligently determines action types (INSERT, UPDATE, SELECT, etc.)
# Falls back to mock data if no activity found
```

---

## 🚀 How to Get Real Data

### Option 1: Enable pg_stat_statements (Recommended)

#### Step 1: Check if Extension Exists
```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database

# Check if extension is available
SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';
```

#### Step 2: Enable the Extension
```sql
-- As superuser or database owner
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify it's enabled
SELECT * FROM pg_stat_statements LIMIT 5;
```

#### Step 3: Configure PostgreSQL
Add to `postgresql.conf`:
```conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
```

Then restart PostgreSQL:
```bash
# On Mac with Homebrew
brew services restart postgresql

# On Linux
sudo systemctl restart postgresql
```

### Option 2: Generate Activity for Access Logs

#### Run Some Queries
```sql
-- Open SQL Editor in Data Management Suite
-- Run any queries against your database

SELECT * FROM your_table LIMIT 10;
SELECT COUNT(*) FROM your_table;
INSERT INTO your_table VALUES (...);
UPDATE your_table SET column = value WHERE id = 1;
```

After running queries:
1. Refresh the Performance page
2. Click "Access Logs"
3. You'll see REAL activity!

### Option 3: Check Backend Logs

The backend now logs why it's using mock data:

```bash
# Watch logs in real-time
tail -f /Users/sunny.agarwal/Projects/DataMantri\ -\ Cursor/backend_output.log
```

Look for messages like:
- ✅ `Found 5 real slow queries for PostgreSQL Production`
- ✅ `Found 15 real access logs for PostgreSQL Production`
- ⚠️ `pg_stat_statements not available: <reason>. Returning mock data`
- ⚠️ `No activity found for PostgreSQL Production, returning mock data`

---

## 📊 Testing the Fix

### Test 1: Check Slow Queries

1. **Refresh browser** (Cmd+Shift+R on Mac)
2. **Log in** again
3. Go to **Performance → Data Sources**
4. Click **"Slow Queries"** on your PostgreSQL data source
5. **Check backend logs** to see:
   ```
   INFO:__main__:pg_stat_statements extension enabled for PostgreSQL Production
   INFO:__main__:Found 3 real slow queries for PostgreSQL Production
   ```

### Test 2: Check Access Logs

1. **Run some queries** in SQL Editor first:
   ```sql
   SELECT * FROM aggregated_data_today;
   SELECT COUNT(*) FROM pmi_digital_sales;
   ```
2. Go to **Performance → Data Sources**
3. Click **"Access Logs"**
4. **Check backend logs** to see:
   ```
   INFO:__main__:Found 12 real access logs for PostgreSQL Production
   ```

---

## 🔧 Troubleshooting

### Issue: "Could not enable pg_stat_statements"

**Solution 1**: Enable as superuser
```bash
psql -U postgres
CREATE EXTENSION pg_stat_statements;
```

**Solution 2**: Add to `postgresql.conf` and restart
```conf
shared_preload_libraries = 'pg_stat_statements'
```

### Issue: "No slow queries found"

**Possible Reasons**:
- ✅ **Good news**: Your database is fast! No queries are slow (>1000ms)
- Run some complex queries to generate slow query data:
  ```sql
  SELECT * FROM large_table ORDER BY random() LIMIT 100000;
  SELECT COUNT(*) FROM large_table JOIN other_table;
  ```

### Issue: "No activity found"

**Solution**: Generate activity
1. Go to **SQL Editor**
2. Run multiple queries
3. Refresh **Performance** page
4. Real logs should appear!

---

## 📝 Summary

### What Changed

| Feature | Before | After |
|---------|--------|-------|
| **Slow Queries** | Always mock data | Tries real data first, falls back to mock |
| **Access Logs** | Always mock data | Queries pg_stat_activity, falls back to mock |
| **Logging** | Silent failures | Clear logs explaining why mock data is used |
| **Extension Setup** | Manual only | Auto-attempts to enable pg_stat_statements |

### Current Behavior

```
User Request → Try Real Data → Found? → Return Real Data
                              ↓ No
                      Try Alternative Source
                              ↓ No
                      Return Mock Data + Log Warning
```

### Expected Results

After running the application and performing database operations:
- ✅ **Slow Queries**: Will show REAL slow queries once pg_stat_statements is enabled
- ✅ **Access Logs**: Will show REAL recent activity from pg_stat_activity
- ✅ **Mock Data**: Only used as fallback with clear logging

---

## 🎯 Quick Start

**Want to see real data immediately?**

### 5-Minute Setup

1. **Enable pg_stat_statements**
   ```bash
   psql -U postgres -d your_database
   CREATE EXTENSION pg_stat_statements;
   \q
   ```

2. **Run some queries**
   ```sql
   -- In SQL Editor
   SELECT * FROM aggregated_data_today LIMIT 1000;
   SELECT COUNT(*) FROM pmi_digital_sales;
   ```

3. **Restart backend**
   ```bash
   # Backend will auto-restart, or manually:
   pkill -9 -f app_simple.py
   cd /Users/sunny.agarwal/Projects/DataMantri\ -\ Cursor
   python app_simple.py > backend_output.log 2>&1 &
   ```

4. **Refresh Performance page**
   - Hard refresh: Cmd+Shift+R
   - Check "Slow Queries" and "Access Logs"
   - Monitor backend logs for confirmation

---

## 🆘 Need Help?

Check the backend logs:
```bash
tail -f /Users/sunny.agarwal/Projects/DataMantri\ -\ Cursor/backend_output.log
```

Look for these log messages:
- ✅ `pg_stat_statements extension enabled`
- ✅ `Found N real slow queries`
- ✅ `Found N real access logs`
- ⚠️ `Returning mock data` (explains why)

---

**Backend Updated**: ✅  
**Real Data Logic**: ✅  
**Better Logging**: ✅  
**Fallback to Mock**: ✅  

The system is now much smarter about fetching real data and will tell you exactly why it's using mock data if it can't get real data! 🎉

