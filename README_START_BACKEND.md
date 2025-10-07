# ✅ HOW TO START THE BACKEND (Definitive Guide)

## 🚨 THE PROBLEM:

Your terminal shows the backend is trying to use port **5000**, but the code is set to port **5001**.

This means you're running **cached/old code**. We need to clear the cache!

---

## 🎯 THE SOLUTION (Run This ONE Command):

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor" && chmod +x FRESH_START.sh && ./FRESH_START.sh
```

This will:
1. ✅ Kill all Python processes
2. ✅ Clear Python cache (`.pyc` files)
3. ✅ Verify port setting
4. ✅ Fix database
5. ✅ Start fresh backend

---

## ✅ SUCCESS = You See This:

```
5. Starting backend (FRESH, NO CACHE)...
========================================

🚀 Backend will start on PORT 5001
📋 Keep this terminal open!

========================================

 * Serving Flask app 'app_simple'
 * Debug mode: on
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001     ← PORT 5001!
 * Running on http://10.x.x.x:5001
```

**KEY:** You MUST see `http://127.0.0.1:5001` (port 5001, NOT 5000!)

---

## ❌ FAILURE = You See This:

```
Address already in use
Port 5000 is in use by another program
```

**If you see this, it means:**
1. AirPlay Receiver is still running on port 5000
2. OR another process is blocking the port

**Solution:**
1. Disable AirPlay Receiver in System Preferences → Sharing
2. Run: `lsof -ti:5000 | xargs kill -9`
3. Try the script again

---

## 🧪 After Backend Starts:

**Keep the backend terminal open!**

Then in a **NEW terminal**:

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
npm run dev
```

Then:
1. **Open:** http://localhost:8080
2. **Click "Demo Login"**
3. **Should work!** ✅

---

## 🔍 Why Port 5000 vs 5001?

- **Port 5000:** Blocked by macOS AirPlay Receiver
- **Port 5001:** Free and available!

We changed the code to use 5001, but the old cached version was still trying 5000.

---

## 📋 What If Port 5001 Is Also Blocked?

Check what's using it:
```bash
lsof -ti:5001
```

If something appears, kill it:
```bash
lsof -ti:5001 | xargs kill -9
```

Then run `./FRESH_START.sh` again.

---

## 💡 Alternative: Use Port 5002

If both 5000 and 5001 are blocked, use port 5002:

### Edit app_simple.py (line 2174):
Change:
```python
port = int(os.getenv('PORT', 5001))
```

To:
```python
port = int(os.getenv('PORT', 5002))
```

### Edit vite.config.ts (lines 13, 20, 27, 34):
Change all:
```typescript
target: 'http://localhost:5001',
```

To:
```typescript
target: 'http://localhost:5002',
```

Then run `./FRESH_START.sh` again.

---

## 🎯 Bottom Line:

**Just run:**
```bash
./FRESH_START.sh
```

**And look for:**
```
* Running on http://127.0.0.1:5001
```

That's it! If you see that, everything will work! 🚀

