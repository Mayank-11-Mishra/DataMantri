# 📊 DataMantri

**Transform Data Into Decisions** - AI-Powered Dashboard Builder & Analytics Platform

---

## 🚀 Quick Start

### **Option 1: Run Both (Recommended)**
```bash
# Terminal 1 - Backend
cd backend
python app_simple.py

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Access: **http://localhost:8082**

### **Option 2: Use Startup Scripts**
```bash
# Start everything
./start_all.sh

# Or individually
./start_backend.sh
./start_frontend.sh
```

---

## 📁 Project Structure

```
DataMantri/
│
├── 📂 frontend/                     ← React + TypeScript Frontend
│   ├── src/                         ← Source code
│   ├── public/                      ← Static assets
│   ├── package.json                 ← Dependencies
│   └── README.md                    ← Frontend docs
│
├── 📂 backend/                      ← Flask + Python Backend
│   ├── app_simple.py                ← Main app
│   ├── requirements.txt             ← Dependencies
│   ├── instance/dataviz.db          ← Database
│   └── README.md                    ← Backend docs
│
├── 📂 docs/                         ← Documentation
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── FEATURE_DOCUMENTATION.md
│
├── 📂 archive/                      ← Old files (can be deleted)
│   ├── logs/                        ← Old log files
│   └── old-docs/                    ← Old documentation
│
├── 📂 pipeline_backend/             ← Pipeline Module
├── 📂 pipeline_orchestrator/        ← Orchestrator Module
├── 📂 datamantri-website/           ← Marketing Website
├── 📂 DataMantriMobile/             ← Mobile App (React Native)
│
├── README.md                        ← This file
├── .gitignore                       ← Git ignore rules
└── RESTRUCTURE_PLAN.md              ← Restructure details
```

---

## ✨ Key Features

### **1. 🤖 AI Dashboard Builder**
- Generate dashboards using natural language
- Powered by Claude AI 4.5 Sonnet
- Automatic chart type selection
- Smart data insights

### **2. 🎨 Visual Dashboard Builder**
- Drag-and-drop interface
- Pre-built layouts
- 10+ chart types
- Real-time preview

### **3. 💾 Data Management Suite**
- Connect multiple databases (PostgreSQL, MySQL, SQL Server)
- Create data marts
- Schema explorer
- Data profiling

### **4. 🧠 AI Insights**
- Automatic data analysis
- Trend detection
- Anomaly detection
- Top/bottom performers
- Positive/negative indicators

### **5. 📁 Folder Organization**
- Hierarchical dashboard organization
- Color-coded folders
- Drag-and-drop management
- Access control per folder

### **6. 🔔 Alert System**
- Threshold-based alerts
- Scheduled notifications
- Email/WhatsApp delivery
- Custom alert rules

### **7. 🎨 Customization**
- Custom themes
- Chart templates
- Layout templates
- Reusable components

---

## 🛠️ Tech Stack

### **Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS + shadcn-ui
- Recharts + D3.js
- React Router

### **Backend:**
- Flask 3.0 + Python 3.9+
- SQLAlchemy ORM
- PostgreSQL / MySQL / SQLite
- Claude AI / OpenAI
- Pandas

---

## 📋 Prerequisites

### **Frontend:**
- Node.js 18+
- npm or yarn

### **Backend:**
- Python 3.9+
- pip
- SQLite (included) or PostgreSQL

---

## 🚀 Installation

### **1. Clone Repository**
```bash
git clone <repository-url>
cd DataMantri
```

### **2. Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your settings

# Start backend
python app_simple.py
```

Backend runs on **http://localhost:5001**

### **3. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on **http://localhost:8082**

---

## 🔐 Default Login

```
Email:    admin@datamantri.com
Password: admin123
```

Or create a new account at `/register`

---

## 🌐 Deployment

### **Frontend (Vercel/Netlify)**
```bash
cd frontend
npm run build
# Upload dist/ folder
```

### **Backend (Heroku/AWS)**
```bash
cd backend
# See backend/README.md for deployment guides
```

---

## 📚 Documentation

- **[Frontend README](frontend/README.md)** - Frontend setup and development
- **[Backend README](backend/README.md)** - Backend API and deployment
- **[Complete Build Guide](COMPLETE_BUILD_GUIDE.md)** - Detailed setup instructions
- **[API Documentation](docs/API_DOCUMENTATION.md)** - API endpoints and usage
- **[Marketing PPT](DATAMANTRI_MARKETING_PPT.md)** - Marketing presentation content

---

## 🗂️ Module Overview

### **Core Application:**
- **frontend/** - Main dashboard UI
- **backend/** - REST API server

### **Additional Modules:**
- **pipeline_backend/** - Data pipeline processing
- **pipeline_orchestrator/** - Pipeline orchestration
- **datamantri-website/** - Marketing website
- **DataMantriMobile/** - Mobile app (React Native)

### **Archive:**
- **archive/logs/** - Old log files (102 files)
- **archive/old-docs/** - Old documentation (246+ files)

*Archive folder can be safely deleted after reviewing*

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
# Kill backend (port 5001)
lsof -ti:5001 | xargs kill -9

# Kill frontend (port 8082)
lsof -ti:8082 | xargs kill -9
```

### **Database Issues**
```bash
cd backend
rm instance/dataviz.db
python app_simple.py  # Will recreate
```

### **Frontend Build Errors**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Backend Import Errors**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

---

## 🔧 Configuration

### **Backend (.env)**
```env
SECRET_KEY=your-secret-key
FLASK_ENV=development
DB_TYPE=sqlite
ANTHROPIC_API_KEY=your-api-key  # Optional
OPENAI_API_KEY=your-api-key     # Optional
```

### **Frontend (vite.config.ts)**
```typescript
server: {
  port: 8082,
  proxy: {
    '/api': 'http://localhost:5001'
  }
}
```

---

## 🎯 Development Workflow

### **1. Start Backend**
```bash
cd backend
source venv/bin/activate
python app_simple.py
```

### **2. Start Frontend**
```bash
cd frontend
npm run dev
```

### **3. Make Changes**
- Frontend: Hot reload enabled
- Backend: Restart after changes

### **4. Test**
- Open http://localhost:8082
- Login with default credentials
- Test your features

---

## 📊 Project Stats

- **Frontend Files:** 18 pages, 50+ components
- **Backend Endpoints:** 50+ API routes
- **Database Models:** 15+ models
- **Chart Types:** 10+ (KPI, Line, Bar, Pie, Area, Table, etc.)
- **Data Sources:** PostgreSQL, MySQL, SQL Server, SQLite
- **AI Models:** Claude 4.5 Sonnet, GPT-4

---

## 🗑️ Cleanup

The project has been reorganized! Old files are in `archive/`:

```bash
# Review archive (optional)
ls -la archive/logs/      # 102 log files
ls -la archive/old-docs/  # 246 markdown files

# Delete archive (after review)
rm -rf archive/
```

---

## 🚢 Production Checklist

- [ ] Set strong `SECRET_KEY` in backend/.env
- [ ] Use PostgreSQL (not SQLite) for production
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure email SMTP
- [ ] Set up monitoring
- [ ] Enable backups
- [ ] Configure CDN for frontend
- [ ] Set up CI/CD pipeline
- [ ] Enable error tracking (Sentry)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

Proprietary - DataMantri  
© 2024 DataMantri. All rights reserved.

---

## 🆘 Support

- **Email:** support@datamantri.com
- **Documentation:** See `/docs` folder
- **Issues:** Create a GitHub issue

---

## 🎉 What's New

### **v2.0 - Project Restructure**
- ✅ Separated frontend and backend
- ✅ Cleaned up 102 log files
- ✅ Archived 246+ documentation files
- ✅ Created comprehensive READMEs
- ✅ Improved project organization

### **Recent Features**
- ✅ AI Insights with positive/negative indicators
- ✅ Folder-based dashboard organization
- ✅ Chart type editing
- ✅ Enhanced UI/UX
- ✅ 3-column AI insights layout
- ✅ Smart trend detection

---

**Built with ❤️ by the DataMantri Team**

🌟 **Star us on GitHub!**
