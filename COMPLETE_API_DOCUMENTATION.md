# 📚 DataMantri - Complete API Documentation & Access Guide

## 🌐 **Application URLs**

### **Main Application:**
- **Frontend URL:** http://localhost:8082
- **Backend API:** http://localhost:5001
- **Status:** Ready to Start

### **Pipeline Orchestrator (Optional):**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000

---

## 🔐 **Login Credentials**

### **Default User Accounts:**

#### **Demo User** (Recommended for Testing)
```
Email:    demo@datamantri.com
Password: demo123
Role:     SUPER_ADMIN
Access:   Full access to all features
```

#### **Admin User**
```
Email:    admin@datamantri.com
Password: admin123
Role:     ADMIN
Access:   Administrative privileges
```

---

## 🚀 **Quick Start**

### **1. Start Backend (Flask)**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Master"
python app_simple.py
```
Backend will run on: http://localhost:5001

### **2. Start Frontend (React)**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Master"
npm run dev
```
Frontend will run on: http://localhost:8082

### **3. Access Application**
Open browser: http://localhost:8082

### **4. Login**
Use: `demo@datamantri.com` / `demo123`

---

## 🔌 **Complete API Reference (93 Endpoints)**

### **1. Authentication APIs (4 endpoints)**

#### **POST /api/auth/login**
User login with email and password
```json
Request:
{
  "email": "demo@datamantri.com",
  "password": "demo123"
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "demo@datamantri.com",
    "name": "Demo User",
    "role": "SUPER_ADMIN",
    "organization_name": "DataMantri Demo"
  },
  "message": "Login successful"
}
```

#### **POST /api/auth/demo-login**
Quick demo login (no credentials required)
```json
Response:
{
  "user": { ... },
  "message": "Demo login successful"
}
```

#### **GET /api/session**
Get current user session
```json
Response:
{
  "authenticated": true,
  "user": { ... }
}
```

#### **POST /logout**
User logout
```json
Response:
{
  "message": "Logged out successfully"
}
```

---

### **2. Data Sources APIs (10 endpoints)**

#### **GET /api/data-sources**
List all data sources for current user's organization
```json
Response:
[
  {
    "id": "uuid",
    "name": "Production DB",
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "mydb",
    "status": "active",
    "created_at": "2025-10-23T..."
  }
]
```

#### **POST /api/data-sources**
Create new data source
```json
Request:
{
  "name": "My Database",
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "username": "user",
  "password": "pass"
}

Response: 201 Created
{
  "data_source": { ... },
  "message": "Data source created"
}
```

#### **GET /api/data-sources/<source_id>**
Get specific data source details

#### **PUT /api/data-sources/<source_id>**
Update data source configuration

#### **DELETE /api/data-sources/<source_id>**
Delete data source

#### **POST /api/data-sources/test**
Test database connection before saving

#### **GET /api/data-sources/<source_id>/schema**
Get complete database schema (tables, columns, relationships)

#### **GET /api/data-sources/<source_id>/tables**
List all tables in database

#### **GET /api/data-sources/<source_id>/tables/<table_name>/columns**
Get columns for a specific table

#### **GET /api/data-sources/<source_id>/table/<table_name>/browse**
Browse table data with pagination

---

### **3. Data Marts APIs (4 endpoints)**

#### **GET /api/data-marts**
List all data marts
```json
Response:
[
  {
    "id": 1,
    "name": "Sales Analytics",
    "description": "Daily sales aggregation",
    "query": "SELECT ...",
    "schedule": "0 2 * * *",
    "status": "active",
    "last_run_at": "2025-10-23T..."
  }
]
```

#### **POST /api/data-marts**
Create new data mart
```json
Request:
{
  "name": "Customer Insights",
  "description": "Customer behavior analysis",
  "query": "SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id",
  "schedule": "0 3 * * *",
  "data_source_id": "uuid"
}
```

#### **GET /api/data-marts/<mart_id>**
Get data mart details

#### **PUT /api/data-marts/<mart_id>**
Update data mart

#### **DELETE /api/data-marts/<mart_id>**
Delete data mart

#### **POST /api/data-marts/execute-query**
Execute data mart query
```json
Request:
{
  "mart_id": 1
}

Response:
{
  "rows": [...],
  "row_count": 1234,
  "execution_time": "0.5s"
}
```

---

### **4. Dashboard APIs (5 endpoints)**

#### **POST /api/generate-dashboard**
AI-powered dashboard generation
```json
Request:
{
  "dataSourceId": "uuid",
  "table": "sales_data",
  "userPrompt": "Create a dashboard showing sales trends and top products",
  "selectedColumns": ["date", "product", "revenue"],
  "mode": "sql"
}

Response:
{
  "spec": {
    "title": "Sales Analysis Dashboard",
    "charts": [...],
    "theme": "modern",
    "layout": [...]
  }
}
```

#### **POST /api/save-dashboard**
Save dashboard configuration
```json
Request:
{
  "title": "My Dashboard",
  "description": "Sales overview",
  "spec": {
    "theme": "modern",
    "dataSourceId": "uuid",
    "charts": [
      {
        "id": "chart-1",
        "type": "bar",
        "title": "Sales by Product",
        "query": "SELECT product, SUM(revenue) FROM sales GROUP BY product",
        "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
      }
    ]
  }
}

Response:
{
  "dashboard_id": "uuid",
  "message": "Dashboard saved"
}
```

#### **GET /api/get-dashboards**
List all dashboards for current user

#### **GET /api/dashboards/<dashboard_id>**
Get specific dashboard

#### **DELETE /api/delete-dashboard/<dashboard_id>**
Delete dashboard

---

### **5. Query Execution API (1 endpoint)**

#### **POST /api/run-query**
Execute SQL query on data source
```json
Request:
{
  "query": "SELECT * FROM customers LIMIT 10",
  "dataSourceId": "uuid"
}

Response:
{
  "rows": [
    { "id": 1, "name": "John", "email": "john@example.com" },
    { "id": 2, "name": "Jane", "email": "jane@example.com" }
  ],
  "columns": ["id", "name", "email"],
  "row_count": 2,
  "execution_time": "0.2s"
}
```

---

### **6. Pipeline APIs (6 endpoints)**

#### **GET /api/pipelines**
List all pipelines

#### **POST /api/pipelines**
Create new pipeline
```json
Request:
{
  "name": "Sales ETL",
  "description": "Daily sales data sync",
  "source_id": "source-uuid",
  "source_table": "raw_sales",
  "destination_id": "dest-uuid",
  "destination_table": "processed_sales",
  "mode": "batch",
  "schedule": "0 0 * * *"
}
```

#### **GET /api/pipelines/<pipeline_id>**
Get pipeline details with run history

#### **PUT /api/pipelines/<pipeline_id>**
Update pipeline

#### **DELETE /api/pipelines/<pipeline_id>**
Delete pipeline

#### **POST /api/pipelines/<pipeline_id>/trigger**
Manually trigger pipeline execution

---

### **7. Performance Monitoring APIs (5 endpoints)**

#### **GET /api/performance/data-sources**
Get metrics for all data sources
```json
Response:
[
  {
    "id": "uuid",
    "name": "Production DB",
    "total_queries": 1234,
    "avg_response_time": "0.5s",
    "error_rate": "0.5%",
    "active_connections": 5
  }
]
```

#### **GET /api/performance/data-sources/<source_id>/active-queries**
Get currently executing queries

#### **GET /api/performance/data-sources/<source_id>/slow-queries**
Get slow query log

#### **GET /api/performance/pipelines**
Get pipeline performance metrics

#### **GET /api/performance/application**
Get overall application metrics

---

### **8. Database Management APIs (7 endpoints)**

#### **GET /api/database/server-stats**
PostgreSQL server statistics

#### **GET /api/database/processes**
Active database processes

#### **GET /api/database/slow-queries**
Slow query log from database

#### **POST /api/database/process/<process_id>/kill**
Kill a specific database process

#### **POST /api/database/optimize**
Run database optimization

#### **GET /api/database/<db_name>/schema**
Get database schema

#### **GET /api/database/relationships**
Get table relationships (foreign keys)

---

### **9. Scheduler APIs (8 endpoints)**

#### **GET /api/schedulers**
List all schedulers

#### **POST /api/schedulers**
Create new scheduler
```json
Request:
{
  "name": "Daily Report",
  "schedule": "0 9 * * *",
  "type": "dashboard",
  "config": {
    "dashboard_id": "uuid",
    "recipients": ["user@example.com"]
  }
}
```

#### **GET /api/schedulers/<scheduler_id>**
Get scheduler details

#### **PUT /api/schedulers/<scheduler_id>**
Update scheduler

#### **DELETE /api/schedulers/<scheduler_id>**
Delete scheduler

#### **POST /api/schedulers/<scheduler_id>/toggle**
Enable/disable scheduler

#### **POST /api/schedulers/<scheduler_id>/test**
Test run scheduler

#### **GET /api/schedulers/stats**
Scheduler statistics

---

### **10. Alert APIs (7 endpoints)**

#### **GET /api/alerts**
List all alerts

#### **POST /api/alerts**
Create new alert
```json
Request:
{
  "name": "High Error Rate",
  "type": "threshold",
  "data_source_id": "uuid",
  "query": "SELECT COUNT(*) FROM errors WHERE created_at > NOW() - INTERVAL '1 hour'",
  "condition": "value > 100",
  "notification_channels": ["email", "slack"]
}
```

#### **GET /api/alerts/<alert_id>**
Get alert details

#### **PUT /api/alerts/<alert_id>**
Update alert

#### **DELETE /api/alerts/<alert_id>**
Delete alert

#### **POST /api/alerts/<alert_id>/test**
Test alert

#### **GET /api/alerts/history**
Alert history

---

### **11. Upload Configuration APIs (7 endpoints)**

#### **GET /api/upload-configurations**
List file upload configurations

#### **POST /api/upload-configurations**
Create upload configuration for CSV/Excel

#### **GET /api/upload-configurations/<config_id>**
Get configuration details

#### **PUT /api/upload-configurations/<config_id>**
Update configuration

#### **DELETE /api/upload-configurations/<config_id>**
Delete configuration

#### **POST /api/upload-configurations/<config_id>/sample**
Upload sample file for testing

#### **POST /api/upload-configurations/<config_id>/upload**
Upload and process file

#### **GET /api/upload-history**
File upload history

---

### **12. Access Management APIs (8 endpoints)**

#### **GET /api/organizations**
List organizations

#### **POST /api/organizations**
Create new organization

#### **GET /api/organizations/<org_id>**
Get organization details

#### **PUT /api/organizations/<org_id>**
Update organization

#### **DELETE /api/organizations/<org_id>**
Delete organization

#### **GET /api/users**
List users in organization

#### **POST /api/users**
Create new user

#### **PATCH /api/users/<user_id>/status**
Update user status

#### **GET /api/roles**
List available roles

#### **GET /api/permissions**
List permissions

#### **POST /api/access-policies**
Create access policy

---

### **13. Themes & Charts Library APIs (9 endpoints)**

#### **GET /api/custom-themes**
List custom themes
```json
Response:
[
  {
    "id": 1,
    "name": "Corporate Blue",
    "colors": ["#1e3a8a", "#3b82f6", "#60a5fa"],
    "font_family": "Inter",
    "border_radius": "8px"
  }
]
```

#### **POST /api/themes**
Create custom theme

#### **GET /api/themes/<theme_id>**
Get theme details

#### **DELETE /api/custom-themes/<theme_id>**
Delete theme

#### **GET /api/chart-templates**
List chart templates (10 default types)
```json
Response:
[
  {
    "id": 1,
    "name": "Sales Trend",
    "chart_type": "line",
    "category": "trends",
    "query_template": "SELECT date, SUM(revenue) FROM sales GROUP BY date"
  }
]
```

#### **POST /api/chart-templates**
Create chart template

#### **DELETE /api/chart-templates/<template_id>**
Delete chart template

#### **GET /api/layout-templates**
List layout templates
```json
Response:
[
  {
    "id": 1,
    "name": "KPI Dashboard",
    "layout_type": "kpi-focused",
    "grid_config": [...]
  }
]
```

#### **POST /api/layout-templates**
Create layout template

#### **DELETE /api/layout-templates/<template_id>**
Delete layout template

---

### **14. Code Importer APIs (4 endpoints)**

#### **POST /api/import/analyze**
Analyze Python/R code for conversion

#### **POST /api/import/convert/<template_id>**
Convert code to DataMantri dashboard

#### **GET /api/import/templates**
List imported templates

#### **GET /api/import/templates/<template_id>**
Get template details

#### **DELETE /api/import/templates/<template_id>**
Delete template

---

### **15. Insights API (1 endpoint)**

#### **POST /api/generate-insights**
AI-powered data insights generation
```json
Request:
{
  "dataSourceId": "uuid",
  "table": "sales_data",
  "columns": ["date", "product", "revenue"]
}

Response:
{
  "insights": [
    "Revenue increased 25% in Q3",
    "Top product: Widget A with $123,456 revenue",
    "Seasonal trend detected in sales"
  ]
}
```

---

## 📊 **Chart Types Available**

DataMantri supports 10+ chart types:

1. **Bar Chart** - Compare categories
2. **Line Chart** - Show trends over time
3. **Pie Chart** - Show proportions
4. **Area Chart** - Cumulative trends
5. **Scatter Plot** - Correlation analysis
6. **KPI Card** - Single metric display
7. **Table** - Detailed data grid
8. **Heatmap** - 2D intensity visualization
9. **Funnel Chart** - Conversion analysis
10. **Gauge Chart** - Progress indicators

---

## 🎨 **Dashboard Builder Modes**

### **1. SQL Dashboard Builder**
- Write custom SQL queries
- Full control over data selection
- Advanced filtering

### **2. Visual Dashboard Builder**
- Drag-and-drop interface
- Pre-built chart templates
- Layout templates
- Theme customization

### **3. Dashboard Builder V2** (NEW)
- Modern 5-step wizard
- Data source selection
- Chart template library
- Layout templates
- Theme presets
- Quick creation workflow

### **4. AI Dashboard Builder**
- Natural language prompts
- Automatic chart generation
- Intelligent insights
- Smart recommendations

---

## 🔄 **Data Flow**

```
User → Frontend (React) → Backend API (Flask) → Database (PostgreSQL)
                                              ↓
                                         Data Sources
                                     (MySQL, PostgreSQL, etc.)
```

---

## 🛡️ **Security Features**

1. **Session-based Authentication**
   - Secure cookie-based sessions
   - Auto-logout on inactivity

2. **Role-Based Access Control (RBAC)**
   - SUPER_ADMIN: Full access
   - ADMIN: Administrative functions
   - USER: Basic access

3. **Organization Isolation**
   - Multi-tenant architecture
   - Data isolation per organization

4. **SQL Injection Protection**
   - Parameterized queries
   - Input validation

5. **Password Security**
   - Hashed passwords (bcrypt)
   - Password reset functionality

---

## 📈 **Performance Features**

1. **Connection Pooling**
   - Efficient database connections
   - Reduced latency

2. **Query Caching**
   - Cached query results
   - Faster dashboard loading

3. **Lazy Loading**
   - On-demand data fetching
   - Improved initial load time

4. **Pagination**
   - Large dataset handling
   - Better performance

---

## 🧪 **Testing APIs**

### **Using cURL:**

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@datamantri.com","password":"demo123"}' \
  -c cookies.txt

# List Data Sources (with session)
curl -X GET http://localhost:5001/api/data-sources \
  -b cookies.txt

# Run Query
curl -X POST http://localhost:5001/api/run-query \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "query":"SELECT * FROM customers LIMIT 5",
    "dataSourceId":"your-uuid-here"
  }'
```

### **Using Postman:**

1. Import base URL: `http://localhost:5001`
2. Create login request to `/api/auth/login`
3. Save session cookie
4. Use cookie for subsequent requests

---

## 🚨 **Common Issues & Solutions**

### **Issue: Backend not starting**
```bash
# Check if port 5001 is in use
lsof -ti:5001

# Kill process if needed
lsof -ti:5001 | xargs kill -9

# Restart
python app_simple.py
```

### **Issue: Frontend not starting**
```bash
# Check if port 8082 is in use
lsof -ti:8082

# Kill process
lsof -ti:8082 | xargs kill -9

# Restart
npm run dev
```

### **Issue: Can't login**
- Check backend is running on port 5001
- Use correct credentials: `demo@datamantri.com` / `demo123`
- Clear browser cookies and try again

### **Issue: No data sources showing**
- Login as demo or admin user
- These accounts have pre-configured data sources
- Or create new data source from UI

---

## 📦 **Database Schema**

### **Core Tables:**
1. `users` - User accounts
2. `data_sources` - Database connections
3. `data_marts` - Scheduled queries
4. `pipelines` - ETL pipelines
5. `pipeline_runs` - Execution history
6. `dashboards` - User dashboards
7. `schedulers` - Scheduled tasks
8. `upload_configurations` - File upload configs
9. `chart_templates` - Chart library
10. `layout_templates` - Layout library
11. `custom_themes` - Theme library
12. `alerts` - Alert configurations
13. `alert_history` - Alert logs
14. `organizations` - Tenant organizations
15. `roles` - User roles
16. `permissions` - Role permissions

---

## 🎯 **Feature Highlights**

### **✅ Implemented Features:**
- ✅ Multi-source data connection
- ✅ SQL query editor with syntax highlighting
- ✅ Visual dashboard builder
- ✅ AI-powered dashboard generation
- ✅ 10+ chart types
- ✅ Theme customization
- ✅ Layout templates
- ✅ Chart library
- ✅ Real-time query execution
- ✅ Performance monitoring
- ✅ Pipeline orchestration
- ✅ Alert management
- ✅ Scheduler system
- ✅ File upload (CSV/Excel)
- ✅ Code importer (Python/R)
- ✅ Access management
- ✅ Multi-tenancy

---

## 📞 **Support & Resources**

### **Getting Started:**
1. Start backend: `python app_simple.py`
2. Start frontend: `npm run dev`
3. Open: http://localhost:8082
4. Login: `demo@datamantri.com` / `demo123`

### **Documentation Files:**
- `README.md` - Project overview
- `DATABASE_SETUP.md` - Database configuration
- `CODE_REVIEW_COMPLETE.md` - Code review
- `API_DOCUMENTATION.md` - This file

### **Quick Commands:**
```bash
# Full restart
./COMPLETE_RESTART.sh

# Backend only
./RESTART_BACKEND.sh

# Kill and restart
./KILL_AND_RESTART.sh
```

---

## 🎉 **You're All Set!**

**Access URL:** http://localhost:8082

**Login:**
- Email: `demo@datamantri.com`
- Password: `demo123`

**Explore Features:**
1. 🔌 Connect Data Sources
2. 📊 Create Dashboards
3. 🤖 Try AI Dashboard Builder
4. 📈 Monitor Performance
5. ⚡ Set up Pipelines

**Happy Data Exploring! 🚀**

---

*Last Updated: October 23, 2025*
*Version: 2.0*






