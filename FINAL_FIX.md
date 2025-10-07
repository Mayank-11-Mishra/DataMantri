# 🚨 FINAL FIX - Copy These Exact Commands

## ⚠️ CRITICAL: You MUST run these commands in order!

---

## Step 1: Open Terminal and Run THIS:

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
```

---

## Step 2: Kill EVERYTHING:

```bash
sudo pkill -9 python
sudo pkill -9 python3
sudo lsof -ti:5000 | xargs sudo kill -9
sudo lsof -ti:5001 | xargs sudo kill -9
```

**You'll be asked for your password - enter it!**

---

## Step 3: Wait 5 Seconds:

```bash
sleep 5
```

---

## Step 4: Fix Database:

```bash
sqlite3 instance/zoho_uploader.db "ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36);" 2>/dev/null
sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';" 2>/dev/null
sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;" 2>/dev/null  
sqlite3 instance/zoho_uploader.db "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;" 2>/dev/null
echo "Database fixed!"
```

---

## Step 5: Start Backend:

```bash
python3 app_simple.py
```

**YOU MUST SEE THIS:**
```
* Running on http://127.0.0.1:5001
```

**If you see "Address already in use" - STOP and tell me!**

**Keep this terminal open!**

---

## Step 6: Open NEW Terminal for Frontend:

In a **BRAND NEW terminal window**:

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
npm run dev
```

---

## Step 7: Test:

1. **Go to:** http://localhost:8080
2. **Click "Demo Login"**
3. **Should work!** ✅

---

## 🔍 What Port is Backend Using?

Look at your backend terminal. You MUST see ONE of these:

✅ **GOOD:** `* Running on http://127.0.0.1:5001`
❌ **BAD:** `Address already in use`
❌ **BAD:** `* Running on http://127.0.0.1:5000`

If you see the BAD ones, the backend didn't start correctly.

---

## 💡 Alternative: Use a Different Port (5002)

If port 5001 is also blocked, let's use 5002:

### In backend terminal (Ctrl+C to stop if running):
```bash
PORT=5002 python3 app_simple.py
```

### Then update vite config:
```bash
sed -i '' 's/localhost:5001/localhost:5002/g' vite.config.ts
```

### Restart frontend:
```bash
pkill -9 -f vite
npm run dev
```

---

## 📞 Report Back

After Step 5, tell me EXACTLY what you see in the terminal. Copy the ENTIRE output, especially the line that says:

```
* Running on http://127.0.0.1:????
```

What port number is there? **5000**, **5001**, or something else?

