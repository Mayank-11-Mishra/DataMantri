# 🚀 How to Start the Backend Properly

## The Issue:
- `/api/data-sources` works ✅ (200 OK)
- `/api/data-marts` fails ❌ (500 ERROR) - missing `data_source_id` column

---

## ✅ Solution - Run These 3 Commands:

Open your terminal and copy-paste these commands **one by one**:

### 1️⃣ Fix the Database
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor" && python3 fix_database.py
```

**Expected output:**
```
🔧 Fixing database schema...
✅ Successfully added 'data_source_id' column!
✅ Database schema is ready!
```

---

### 2️⃣ Kill Process on Port 5000
```bash
sudo lsof -ti:5000 | xargs sudo kill -9
```

**OR** disable AirPlay Receiver:
- System Preferences → Sharing → Uncheck "AirPlay Receiver"

---

### 3️⃣ Start the Backend
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor" && pkill -9 -f app_simple && sleep 2 && python3 app_simple.py
```

**Keep this terminal open!**

**You should see:**
```
✅ * Serving Flask app 'app_simple'
✅ * Debug mode: on
✅ INFO:root:Fixing X data marts without source IDs...
✅ INFO:root:Successfully fixed X data marts
✅ * Running on http://127.0.0.1:5000
```

---

## 🧪 Test It Works:

1. **Refresh browser:** http://localhost:8080
2. **Go to:** Data Management Suite → SQL Editor
3. **Check dropdown** - Should now show:
   ```
   📊 PostgreSQL Production (postgresql)
   📊 MySQL Analytics (mysql)
   📊 MongoDB Logs (mongodb)
   📊 oneapp (postgresql)
   🎯 [Any Data Marts] (Data Mart)
   ```

4. **Select a database and test query:**
   ```sql
   SELECT 1 as test
   ```

---

## 🔍 If Still Not Working:

### Check Backend Logs:
In the terminal where you ran `python3 app_simple.py`, look for errors.

### Common Errors:

**"Port 5000 is in use"**
```bash
# Kill it
sudo lsof -ti:5000 | xargs sudo kill -9
```

**"500 Error on /api/data-marts"**
```bash
# Check if column was added
sqlite3 instance/zoho_uploader.db "PRAGMA table_info(data_marts);"

# Should show data_source_id in the list
# If not, add it manually:
sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);"
```

**"No data marts table"**
```bash
# Delete and recreate database
rm instance/zoho_uploader.db
python3 app_simple.py
```

---

## ✅ Success Indicators:

When everything is working:

1. **Terminal shows:**
   ```
   INFO:root:Successfully fixed X data marts
   * Running on http://127.0.0.1:5000
   ```

2. **Browser Network tab (F12):**
   ```
   GET /api/data-sources → 200 OK ✅
   GET /api/data-marts → 200 OK ✅
   ```

3. **SQL Editor dropdown:** Shows all data sources + data marts ✅

---

## 🎯 Quick Commands Summary:

```bash
# 1. Fix database
python3 fix_database.py

# 2. Kill port 5000
sudo lsof -ti:5000 | xargs sudo kill -9

# 3. Start backend
pkill -9 -f app_simple && sleep 2 && python3 app_simple.py
```

Then refresh browser and check SQL Editor!

---

Let me know what happens after running these commands! 🚀

