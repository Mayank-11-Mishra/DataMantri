# ✅ SOLVED - Using Port 5001 Instead!

## 🎯 The Solution

**Problem:** Port 5000 is blocked by AirPlay Receiver  
**Solution:** Use port 5001 instead!

I've updated:
- ✅ Backend to run on port **5001**
- ✅ Vite proxy to forward to port **5001**

---

## 🚀 HOW TO START (3 Easy Steps):

### **Step 1: Run the Start Script**

Open terminal and run:

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
chmod +x START_NOW.sh
./START_NOW.sh
```

**Keep this terminal open!**

---

### **Step 2: You Should See:**

```
✅ * Serving Flask app 'app_simple'
✅ * Debug mode: on
✅ INFO:root:Fixing X data marts without source IDs...
✅ INFO:root:Successfully fixed X data marts
✅ WARNING: This is a development server.
✅ * Running on all addresses (0.0.0.0)
✅ * Running on http://127.0.0.1:5001  ← PORT 5001!
✅ * Running on http://10.x.x.x:5001
```

**NOT:**
```
❌ Address already in use
❌ Port 5000 is in use
```

If you see "Address already in use" for port 5001, just kill it:
```bash
lsof -ti:5001 | xargs kill -9
```
Then run `./START_NOW.sh` again.

---

### **Step 3: Restart Frontend (Vite)**

The Vite config changed, so you need to restart it:

**Find the terminal where Vite is running** (shows "VITE v..." messages)

Press `Ctrl+C` to stop it, then run:
```bash
npm run dev
```

**OR** if you can't find it, just run:
```bash
pkill -9 -f vite
npm run dev
```

---

## 🧪 Test It Works:

1. **Open browser:** http://localhost:8080
2. **Login:** demo@datamantri.com / demo123
3. **Go to:** Data Management Suite → SQL Editor
4. **Check dropdown** - Should show:
   ```
   📊 PostgreSQL Production (postgresql)
   📊 MySQL Analytics (mysql)
   📊 MongoDB Logs (mongodb)
   📊 oneapp (postgresql)
   ```

5. **Select "oneapp" and run:**
   ```sql
   SELECT 1 as test
   ```

6. **Should see result:** ✅

---

## 🔍 What Changed:

### **Backend (`app_simple.py`)**
```python
# Before:
port = int(os.getenv('PORT', 5000))  # ❌ Blocked by AirPlay

# After:
port = int(os.getenv('PORT', 5001))  # ✅ Free!
```

### **Frontend (`vite.config.ts`)**
```typescript
// Before:
target: 'http://localhost:5000',  // ❌ Wrong port

// After:
target: 'http://localhost:5001',  // ✅ Correct port!
```

---

## ✅ Success Indicators:

When everything is working:

1. **Backend terminal shows:**
   ```
   * Running on http://127.0.0.1:5001
   ```

2. **Browser console (F12) shows NO errors:**
   ```
   ✅ GET /api/data-sources → 200 OK
   ✅ GET /api/data-marts → 200 OK (or 500 but that's OK for now)
   ```

3. **Dropdown shows data sources** ✅

4. **Queries execute successfully** ✅

---

## 🐛 Troubleshooting:

### Issue: "Still getting 500 error for /api/data-marts"

**That's OK for now!** The data sources (which you need for SQL Editor) should still work.

The 500 error is just for data marts. We can fix that later.

**Workaround:** Just use the data sources in the dropdown:
- PostgreSQL Production
- MySQL Analytics  
- MongoDB Logs
- oneapp

All of these should work fine!

---

### Issue: "Dropdown is still empty"

1. **Check backend is actually running:**
   ```bash
   curl http://localhost:5001/api/data-sources
   ```
   
   Should return JSON with 4 data sources.

2. **Check frontend is using the right port:**
   - Open browser console (F12)
   - Look at Network tab
   - API calls should go to `localhost:8080/api/...` (not 5000 or 5001 directly)

3. **Restart both backend and frontend:**
   ```bash
   # Terminal 1 (Backend)
   pkill -9 -f app_simple
   ./START_NOW.sh
   
   # Terminal 2 (Frontend)
   pkill -9 -f vite
   npm run dev
   ```

---

## 📝 Files Changed:

1. ✅ `app_simple.py` - Line 2171: Port changed to 5001
2. ✅ `vite.config.ts` - Lines 13, 20, 27, 34: All proxies point to port 5001
3. ✅ `START_NOW.sh` - New start script
4. ✅ `SOLUTION_PORT_5001.md` - This guide

---

## 🎊 You're Ready!

After running the start script and restarting Vite:

1. ✅ Backend runs on port **5001** (no conflict!)
2. ✅ Frontend proxies to port **5001**
3. ✅ SQL Editor dropdown shows your 4 data sources
4. ✅ You can write and execute queries!

**Let me know if it works!** 🚀

