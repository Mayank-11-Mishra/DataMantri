# 🏗️ DataMantri Restructure Plan

## Current Issues:
- ❌ 102 log files cluttering root directory
- ❌ 248 markdown documentation files in root
- ❌ Frontend and backend code mixed together
- ❌ Hard to deploy separately
- ❌ Difficult to maintain

---

## 📁 New Structure:

```
DataMantri/
│
├── 📂 frontend/                     ← Frontend Application
│   ├── src/
│   ├── public/
│   ├── node_modules/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── .env.example
│   └── README.md
│
├── 📂 backend/                      ← Backend Application
│   ├── app_simple.py
│   ├── alert_system.py
│   ├── code_analyzer.py
│   ├── requirements.txt
│   ├── instance/
│   │   └── dataviz.db
│   ├── uploads/
│   ├── venv/
│   ├── .env.example
│   └── README.md
│
├── 📂 docs/                         ← Documentation (keep useful ones)
│   ├── SETUP_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── FEATURE_DOCUMENTATION.md
│
├── 📂 archive/                      ← Old logs and MD files
│   ├── logs/
│   └── old-docs/
│
├── 📂 pipeline_backend/             ← Pipeline Module
├── 📂 pipeline_orchestrator/        ← Orchestrator Module
├── 📂 datamantri-website/           ← Marketing Website
├── 📂 DataMantriMobile/             ← Mobile App
│
├── README.md                        ← Main project README
└── .gitignore                       ← Updated gitignore

```

---

## 🗑️ Files to Delete/Archive:

### **1. Log Files (102 files) - DELETE**
```
backend_*.log
frontend_*.log
website_*.log
product-*.log
```

### **2. Temporary/Debug Files - DELETE**
```
cookies.txt
fix_*.py (temporary scripts)
deduplicate_templates.py
add_datamart_source_column.py
```

### **3. Old Documentation (248 files) - ARCHIVE most**
Keep only:
- Main README.md
- COMPLETE_BUILD_GUIDE.md
- API_DOCUMENTATION.md
- DEPLOYMENT guides
- Feature documentation (consolidated)

Archive rest to `archive/old-docs/`

### **4. Duplicate/Old Files**
```
app.py (keep app_simple.py)
run.py (not needed)
Multiple fix scripts
```

---

## ✅ Files to Keep:

### **Frontend:**
- src/
- public/
- package.json, package-lock.json
- vite.config.ts
- tsconfig files
- tailwind configs
- components.json
- index.html

### **Backend:**
- app_simple.py (main backend)
- alert_system.py
- code_analyzer.py
- requirements.txt
- instance/ (database)
- uploads/

### **Documentation:**
- Main README.md
- Setup guides
- API documentation
- Deployment guides

---

## 🚀 Migration Steps:

1. ✅ Create new directory structure
2. ✅ Move frontend files
3. ✅ Move backend files
4. ✅ Archive logs and old docs
5. ✅ Update configuration files
6. ✅ Create new README files
7. ✅ Test both frontend and backend
8. ✅ Clean up root directory

---

## 📝 Configuration Updates Needed:

### **Frontend (vite.config.ts):**
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5001',  // Still works
    ...
  }
}
```

### **Backend (.env):**
```
FRONTEND_URL=http://localhost:8082
CORS_ORIGINS=http://localhost:8082,http://localhost:5173
```

### **Deployment:**
- Frontend: Deploy to Vercel/Netlify
- Backend: Deploy to Heroku/AWS/DigitalOcean
- Database: PostgreSQL (production)

---

## 🎯 Benefits:

✅ **Cleaner Structure**
✅ **Easier to Navigate**
✅ **Separate Deployment**
✅ **Better Version Control**
✅ **Faster Development**
✅ **Professional Organization**

---

**Ready to proceed?**

