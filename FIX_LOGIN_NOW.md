# 🚀 Fix Login Issue - Complete Guide

## 🎯 Run This ONE Command:

Open a **NEW terminal window** and run:

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor" && chmod +x COMPLETE_RESTART.sh && ./COMPLETE_RESTART.sh
```

---

## ✅ What You Should See:

```
Step 1: Checking ports...
Port 5000:
  [some process or "Nothing running"]
Port 5001:
  Nothing running

Step 2: Killing all processes...
  ✅ Killed port 5000
  ✅ Killed app_simple processes

Step 3: Fixing database...
  ✅ Database column added
  ✅ User table columns checked

Step 4: Verifying configuration...
  Port setting: port = int(os.getenv('PORT', 5001))
  ✅ Backend configured for port 5001

Step 5: Starting backend...
=====================================
Backend output below:
=====================================

 * Serving Flask app 'app_simple'
 * Debug mode: on
INFO:root:Starting DataMantri API...
INFO:root:Seeding database with demo data sources...
INFO:root:Fixing 0 data marts without source IDs...
INFO:root:Successfully fixed 0 data marts
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001      ← MUST SEE PORT 5001!
 * Running on http://10.x.x.x:5001
```

**✅ SUCCESS INDICATOR:** You see `Running on http://127.0.0.1:5001`

**❌ FAILURE INDICATOR:** You see "Address already in use" or port 5000

---

## 🧪 Then Test Login:

**Keep the backend terminal open!**

1. **Open NEW terminal for frontend:**
   ```bash
   cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
   npm run dev
   ```

2. **Open browser:** http://localhost:8080

3. **Login with:**
   - Email: `demo@datamantri.com`
   - Password: `demo123`

4. **Should work!** ✅

---

## 🐛 If Still Failing:

### Check 1: Is backend really running on port 5001?

In the backend terminal, you MUST see:
```
* Running on http://127.0.0.1:5001
```

NOT:
```
❌ Address already in use
❌ Port 5000 is in use
```

### Check 2: Is frontend proxying to port 5001?

Check `vite.config.ts` file - line 13 should say:
```typescript
target: 'http://localhost:5001',  ✅
```

NOT:
```typescript
target: 'http://localhost:5000',  ❌
```

### Check 3: Did you restart frontend after changing vite.config.ts?

You MUST restart the frontend (npm run dev) after changing vite.config.ts!

---

## 🔍 Diagnostic Commands:

### See what's using port 5000:
```bash
lsof -ti:5000 | xargs ps -p
```

### Kill whatever's on port 5000:
```bash
lsof -ti:5000 | xargs kill -9
```

### See what's using port 5001:
```bash
lsof -ti:5001 | xargs ps -p
```

### Check backend is actually running:
```bash
curl http://localhost:5001/api/session
# Should return: {"message":"Not authenticated","status":"error"}
# NOT: "Connection refused"
```

### Test login directly:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@datamantri.com","password":"demo123"}'
# Should return: {"status":"success",...}
```

---

## 📋 Checklist:

- [ ] Backend shows "Running on http://127.0.0.1:5001"
- [ ] Frontend shows "Local: http://localhost:8080/"
- [ ] `vite.config.ts` has `target: 'http://localhost:5001'`
- [ ] Browser can load http://localhost:8080
- [ ] Login form appears
- [ ] Entering demo credentials works

---

## 💡 Common Issues:

### Issue: "Address already in use"
**Solution:** Disable AirPlay Receiver in System Preferences → Sharing

### Issue: "Connection refused"
**Solution:** Backend isn't running. Run `./COMPLETE_RESTART.sh`

### Issue: "500 Internal Server Error on login"
**Solution:** Database schema issue. The restart script fixes this.

### Issue: "Nothing in SQL Editor dropdown"
**Solution:** 
1. Backend must be running on port 5001
2. Frontend must be proxying to port 5001
3. Both must be restarted after config changes

---

## 🎉 Success Looks Like:

1. ✅ Backend terminal: `Running on http://127.0.0.1:5001`
2. ✅ Frontend terminal: `Local: http://localhost:8080/`
3. ✅ Browser: Login page loads
4. ✅ Login works with demo credentials
5. ✅ SQL Editor shows 4 data sources in dropdown
6. ✅ Can execute queries

---

## 📞 Need Help?

After running `./COMPLETE_RESTART.sh`, copy and share:

1. **The entire output from the backend terminal**
2. **Any error messages from the browser console (F12)**
3. **What URL the browser is trying to access (Network tab in F12)**

This will help me debug the exact issue!

