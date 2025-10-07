# 🔍 Database Credentials Search Results

## Summary

I searched across all 4 DataMantri folders in your system and **FOUND** the credentials for `Oneapp_dev`!

---

## 🎯 **FOUND: Oneapp_dev Database**

### Location
**Folder:** `DataMantri - Cursor 10.59.43 AM`  
**Database File:** `instance/dataviz.db`  
**Data Source ID:** `ca24e2a2-6f54-4fcc-94fd-85df7678a6d1`

### Connection Details

| Property | Value |
|----------|-------|
| **Name** | Oneapp_dev |
| **Type** | PostgreSQL |
| **Host** | 10.19.9.9 |
| **Port** | 15445 |
| **Database** | oneapp |
| **Username** | postgres |
| **Password** | Izm_0mc]M?Li^]ER |

### Full Connection String
```
postgresql://postgres:Izm_0mc]M?Li^]ER@10.19.9.9:15445/oneapp
```

### Connection URL (with encoded password)
```python
from urllib.parse import quote_plus
password = "Izm_0mc]M?Li^]ER"
password_encoded = quote_plus(password)
connection_url = f"postgresql://postgres:{password_encoded}@10.19.9.9:15445/oneapp"
```

---

## ❌ **NOT FOUND: datamantridb**

The `datamantridb` database was **not found** in any of the 4 DataMantri folders:
- DataMantri - Cursor
- DataMantri - Cursor 10.59.43 AM
- DataMantri - Cursor 11.56.19 AM
- DataMantri - Master

---

## 📂 All DataMantri Folders Checked

### 1. **DataMantri - Cursor**
- ✅ .env file present (uses SQLite)
- ✅ Database: `instance/dataviz.db`
- 🔢 3 data sources configured:
  - PostgreSQL Production (prod_db)
  - MySQL Analytics (analytics_db)
  - MongoDB Logs (logs_db)

### 2. **DataMantri - Cursor 10.59.43 AM** ⭐
- ⚠️ No .env file
- ✅ Database: `instance/dataviz.db`
- 🔢 5 data sources configured:
  - PostgreSQL Production (prod_db)
  - MySQL Analytics (analytics_db)
  - MongoDB Logs (logs_db)
  - Demo SQLite Database
  - **Oneapp_dev** 🎯 ← **FOUND HERE!**

### 3. **DataMantri - Cursor 11.56.19 AM**
- ⚠️ No .env file
- ✅ Database: `instance/dataviz.db`
- 🔢 3 data sources configured:
  - PostgreSQL Production (prod_db)
  - MySQL Analytics (analytics_db)
  - MongoDB Logs (logs_db)

### 4. **DataMantri - Master** (Current workspace)
- ✅ .env file present (uses SQLite)
- ✅ Database: `instance/dataviz.db`
- 🔢 3 data sources configured:
  - PostgreSQL Production (prod_db)
  - MySQL Analytics (analytics_db)
  - MongoDB Logs (logs_db)

---

## 🚀 How to Restore Oneapp_dev to Current Project

If you want to add the Oneapp_dev connection to your current "DataMantri - Master" project:

### Option 1: Copy the entire database
```bash
# Backup current database
cp "/Users/sunny.agarwal/Projects/DataMantri - Master/instance/dataviz.db" \
   "/Users/sunny.agarwal/Projects/DataMantri - Master/instance/dataviz.db.backup"

# Copy database from backup folder (this will overwrite!)
cp "/Users/sunny.agarwal/Projects/DataMantri - Cursor 10.59.43 AM/instance/dataviz.db" \
   "/Users/sunny.agarwal/Projects/DataMantri - Master/instance/dataviz.db"
```

### Option 2: Add just the Oneapp_dev data source via SQL
```bash
sqlite3 "/Users/sunny.agarwal/Projects/DataMantri - Master/instance/dataviz.db"
```

Then run:
```sql
INSERT INTO data_sources (
    id, name, connection_type, host, port, database, username, password, 
    created_by, created_at, updated_at
) VALUES (
    'ca24e2a2-6f54-4fcc-94fd-85df7678a6d1',
    'Oneapp_dev',
    'postgresql',
    '10.19.9.9',
    15445,
    'oneapp',
    'postgres',
    'Izm_0mc]M?Li^]ER',
    'demo',
    datetime('now'),
    datetime('now')
);
```

### Option 3: Add via the UI
1. Start your DataMantri application
2. Go to Data Sources
3. Click "Add Data Source"
4. Enter the connection details from above

---

## 📝 Notes

- The backup folders (`10.59.43 AM` and `11.56.19 AM`) have special Unicode characters in their names (narrow no-break space `\u202f`)
- The password for Oneapp_dev contains special characters: `Izm_0mc]M?Li^]ER`
- The database name is `oneapp` not `Oneapp_dev` (the data source is named `Oneapp_dev`)
- No evidence of `datamantridb` was found in any folder

---

## 🔒 Security Reminder

This file contains sensitive credentials. Please:
- ✅ Keep this file secure
- ✅ Don't commit it to version control
- ✅ Consider changing passwords if they've been exposed
- ✅ Delete this file after noting the credentials

---

**Generated:** $(date)  
**Search completed across:** 4 DataMantri folders  
**Total data sources found:** 14  
**Oneapp_dev instances:** 1 (in backup folder)


