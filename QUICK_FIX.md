# 🚨 QUICK FIX - 500 Error on Create Data Mart

## The Problem:
The database table `data_marts` doesn't have the new `data_source_id` column yet, causing a 500 error when creating data marts.

---

## ✅ Quick Fix (Run These Commands):

Open your terminal and run:

### Step 1: Add the Missing Column
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);"
```

**Expected Output:**
```
(No output means success!)
```

If you get "duplicate column name", that's fine - it means the column already exists.

---

### Step 2: Kill Process on Port 5000
```bash
# Kill AirPlay Receiver or any process using port 5000
lsof -ti:5000 | xargs kill -9
```

**OR disable AirPlay Receiver:**
1. Open **System Preferences**
2. Go to **Sharing**
3. **Uncheck** "AirPlay Receiver"

---

### Step 3: Restart Backend
```bash
# Make sure you're in the project directory
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"

# Kill any existing Flask processes
pkill -9 -f app_simple

# Wait a moment
sleep 2

# Start the backend
python3 app_simple.py
```

**Expected Output:**
```
 * Serving Flask app 'app_simple'
 * Debug mode: on
INFO:root:Starting DataMantri API...
INFO:root:Seeding database with demo data sources...
INFO:root:Fixing 1 data marts without source IDs...
INFO:root:Assigning default source 'oneapp_dev' to data mart 'PMI_Digital_sales'
INFO:root:Successfully fixed 1 data marts
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://10.x.x.x:5000
```

Keep this terminal window open!

---

## 🧪 Test It Works:

1. **Go to browser:** `http://localhost:8080`
2. **Go to:** Data Management Suite → Data Marts
3. **Click:** "Create Data Mart"
4. **Fill in form and click "Create"**

**Expected:** ✅ Data mart created successfully!

---

## 🔍 If Still Getting 500 Error:

### Check Backend Logs:
In the terminal where `python3 app_simple.py` is running, you should see error messages.

Look for errors like:
```
ERROR:root:Failed to create data mart: (sqlite3.OperationalError) no such column: data_source_id
```

### If You See "no such column: data_source_id":

The column wasn't added. Try again:

```bash
# Check current columns
sqlite3 instance/zoho_uploader.db "PRAGMA table_info(data_marts);"

# Should show:
# 0|id|VARCHAR(36)|0||1
# 1|name|VARCHAR(255)|1||0
# 2|description|TEXT|0||0
# 3|data_source_id|VARCHAR(36)|0||0  ← This should be here!
# 4|definition|JSON|0||0
# 5|status|VARCHAR(50)|0||0
# ...

# If data_source_id is missing, add it:
sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);"
```

---

## 🎯 Alternative: Fresh Start (If Nothing Works)

If all else fails, reset the database:

```bash
# CAUTION: This will delete all your data!
rm instance/zoho_uploader.db

# Restart backend (will recreate database with correct schema)
pkill -9 -f app_simple
sleep 2
python3 app_simple.py
```

The backend will automatically:
1. Create a fresh database with all columns ✅
2. Seed demo data sources ✅
3. Start clean ✅

---

## ✅ Success Indicators:

When everything is working, you should see:

1. **Backend logs:**
   ```
   INFO:root:Successfully fixed 1 data marts
   * Running on http://127.0.0.1:5000
   ```

2. **Browser console (F12):**
   ```javascript
   POST http://localhost:8080/api/data-marts 201 (CREATED)
   ```

3. **Data Mart appears in list!** ✅

---

## 📞 Still Having Issues?

Share the error from the terminal where `python3 app_simple.py` is running, and I'll help you fix it!

