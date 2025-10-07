# 🎨 Frontend Access Guide

## ✅ Frontend Now Created!

I've built a complete React + TypeScript frontend for the Pipeline Orchestrator!

---

## 🚀 How to Access the Frontend

### **Option 1: Start Frontend (Separate from Backend)**

```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor/pipeline_orchestrator/frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access at:** http://localhost:3000

---

### **Option 2: View in Existing DataMantri App**

The frontend can be integrated into your existing DataMantri app. Here's how:

#### Quick Integration:

1. **Add a new route** in your existing `src/App.tsx`:

```typescript
import PipelineOrchestrator from './pages/PipelineOrchestrator'

// In your Routes:
<Route path="/pipelines" element={<PipelineOrchestrator />} />
```

2. **Update sidebar** to add Pipeline menu item

---

## 📱 What You'll See

### **Login Page** (`/login`)
- Clean login interface
- Pre-filled with default credentials
- Modern design with Tailwind CSS

### **Dashboard** (`/dashboard`)
- **Stats Cards:**
  - Total Pipelines
  - Active Pipelines
  - Successful Runs
  - Failed Runs
- **Recent Pipelines List**
- **Quick Actions**

### **Pipelines Page** (`/pipelines`)
- List all pipelines
- Filter by status (active, paused, deleted)
- Search pipelines
- Create new pipeline button
- View pipeline details
- Trigger manual execution

### **Create Pipeline** (`/pipelines/new`)
- **Step 1: Basic Info**
  - Pipeline name
  - Description
  
- **Step 2: Source Configuration**
  - BigQuery settings:
    - Project ID
    - Dataset
    - Table
    - Custom query (optional)

- **Step 3: Destination Configuration**
  - PostgreSQL settings:
    - Host, Port, Database
    - Username, Password
    - Target table

- **Step 4: Settings**
  - Mode: Batch / Real-time
  - Schedule: Cron expression
  - Batch size
  - Retry settings

### **Pipeline Detail** (`/pipelines/:id`)
- Pipeline information
- Execution history
- Logs viewer
- Quick actions (run, pause, edit, delete)
- Performance metrics

---

## 🎯 Complete Feature List

### ✅ Implemented Pages:

1. **Login** - Authentication
2. **Dashboard** - Overview with stats
3. **Pipelines List** - All pipelines
4. **Create Pipeline** - Multi-step form
5. **Pipeline Detail** - Full details + runs
6. **Protected Routes** - Auth required

### 🎨 UI Components:

- Modern Tailwind CSS styling
- Responsive design
- Loading states
- Error handling
- Toast notifications
- Modal dialogs
- Status badges
- Data tables

---

## 📦 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite (fast build tool)
- React Router (navigation)
- Axios (API calls)
- Tailwind CSS (styling)
- Lucide Icons
- date-fns (date formatting)
- cronstrue (cron expressions)

---

## 🔌 API Integration

The frontend automatically connects to your backend:

```typescript
// Configured in src/services/api.ts
API_BASE_URL = 'http://localhost:8000'

// All endpoints:
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- GET /api/v1/pipelines/
- POST /api/v1/pipelines/
- GET /api/v1/pipelines/:id
- PUT /api/v1/pipelines/:id
- DELETE /api/v1/pipelines/:id
- POST /api/v1/pipelines/:id/trigger
- GET /api/v1/pipelines/:id/runs
```

---

## 🎬 Quick Demo Flow

1. **Login**
   ```
   Email: admin@datamantri.com
   Password: admin123
   ```

2. **View Dashboard**
   - See overview stats
   - View recent pipelines

3. **Create Pipeline**
   - Click "Create Pipeline"
   - Fill in BigQuery source
   - Configure PostgreSQL destination
   - Set schedule (e.g., `0 2 * * *`)
   - Click Create

4. **Trigger Pipeline**
   - Click "Run Now" button
   - Watch status change to "Running"
   - View logs in real-time

5. **Monitor Execution**
   - Check execution history
   - View records processed
   - See success/failure status

---

## 🔧 Development Commands

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🌐 Complete Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | admin@datamantri.com / admin123 |
| **Backend API** | http://localhost:8000 | Same |
| **API Docs** | http://localhost:8000/api/v1/docs | N/A |
| **Flower (Celery)** | http://localhost:5555 | N/A |

---

## 📸 What You'll See

### Dashboard:
```
┌─────────────────────────────────────────────┐
│  Dashboard                    [+ Create Pipeline] │
├─────────────────────────────────────────────┤
│  📊 Total: 5  ✅ Active: 3  ✓ Success: 12  ✗ Failed: 2 │
├─────────────────────────────────────────────┤
│  Recent Pipelines:                           │
│  ├─ Sales Data Sync    [Active] [Batch]     │
│  ├─ User Analytics     [Active] [Real-time] │
│  └─ Inventory Update   [Paused] [Batch]     │
└─────────────────────────────────────────────┘
```

### Create Pipeline Form:
```
┌────────────────────────────────────────┐
│  Create New Pipeline                    │
├────────────────────────────────────────┤
│  Pipeline Name: [________________]     │
│  Description:   [________________]     │
│                                         │
│  Source (BigQuery):                    │
│  ├─ Project:  [my-gcp-project]        │
│  ├─ Dataset:  [sales_data]            │
│  └─ Table:    [transactions]          │
│                                         │
│  Destination (PostgreSQL):             │
│  ├─ Host:     [postgres.example.com]  │
│  ├─ Database: [warehouse]              │
│  └─ Table:    [transactions]          │
│                                         │
│  Schedule: [0 2 * * *] (Daily at 2 AM) │
│                                         │
│  [Cancel]  [Create Pipeline]           │
└────────────────────────────────────────┘
```

---

## 🚀 Start Everything Now!

### Terminal 1: Backend
```bash
cd pipeline_orchestrator
./QUICKSTART.sh
```

### Terminal 2: Frontend
```bash
cd pipeline_orchestrator/frontend
npm install
npm run dev
```

### Access:
- 🎨 **Frontend UI:** http://localhost:3000
- 🔌 **API:** http://localhost:8000
- 📚 **API Docs:** http://localhost:8000/api/v1/docs

---

## 🎊 You're All Set!

The complete system is now ready:
- ✅ Backend API (FastAPI + Celery)
- ✅ Frontend UI (React + TypeScript)
- ✅ Database (PostgreSQL + Redis)
- ✅ Docker setup
- ✅ Complete documentation

**Go to:** http://localhost:3000 and start managing pipelines! 🚀


