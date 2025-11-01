# 🔧 DataMantri Backend

Flask-based REST API for DataMantri dashboard platform with AI-powered analytics.

---

## 🚀 Quick Start

### **Prerequisites:**
- Python 3.9+
- pip
- PostgreSQL (optional, SQLite by default)

### **Installation:**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### **Development:**
```bash
python app_simple.py
```
Backend will start on **http://localhost:5001**

---

## 📁 Project Structure

```
backend/
├── app_simple.py            # Main Flask application
├── alert_system.py          # Alert management system
├── code_analyzer.py         # Code analysis utilities
├── requirements.txt         # Python dependencies
│
├── instance/                # Database directory
│   └── dataviz.db          # SQLite database
│
├── uploads/                 # File uploads directory
├── database/                # Database migrations/scripts
│
├── venv/                    # Virtual environment (gitignored)
├── .env                     # Environment variables (gitignored)
└── README.md                # This file
```

---

## 🛠️ Tech Stack

- **Framework:** Flask 3.0+
- **Database:** SQLAlchemy ORM
- **Authentication:** Flask-Login + JWT
- **CORS:** Flask-CORS
- **AI:** Claude AI (Anthropic) / OpenAI GPT-4
- **Database Support:** PostgreSQL, MySQL, SQL Server, SQLite
- **Data Processing:** Pandas
- **Scheduling:** APScheduler

---

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file in the backend directory:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-change-in-production
FLASK_ENV=development

# Database Configuration
DB_TYPE=sqlite
SQLITE_PATH=/path/to/instance/dataviz.db

# Or PostgreSQL:
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your-password
# DB_NAME=datamantri
# DB_SCHEMA=public

# AI Configuration (Optional)
ANTHROPIC_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key

# Email Configuration (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# CORS Configuration
FRONTEND_URL=http://localhost:8082
CORS_ORIGINS=http://localhost:8082,http://localhost:5173
```

---

## 📊 Database Models

### **Core Models:**
- **User** - User accounts and authentication
- **Organization** - Multi-tenant organizations
- **DataSource** - Database connections
- **Dashboard** - Dashboard metadata
- **DashboardFolder** - Folder organization
- **DataMart** - Virtual tables/views
- **Alert** - Alert configurations
- **CustomTheme** - Custom themes
- **ChartTemplate** - Chart templates
- **LayoutTemplate** - Layout templates

### **Database Initialization:**
```python
# Automatic on first run
# Creates all tables and default data
```

---

## 🔑 Key Features

### **1. Dashboard Generation**
- **AI-Powered:** Claude/GPT-4 based generation
- **Mock Generation:** Fallback for no API key
- **Smart Insights:** Automatic data analysis

### **2. Data Source Management**
- Multiple database connections
- Connection pooling
- Schema introspection
- Real-time query execution

### **3. AI Insights**
- Statistical analysis
- Trend detection
- Anomaly detection
- Top/bottom performers
- Positive/negative indicators

### **4. Alert System**
- Threshold-based alerts
- Scheduled checks
- Email notifications
- WhatsApp integration (optional)

### **5. Custom Templates**
- Custom themes
- Chart templates
- Layout templates
- Reusable across dashboards

---

## 🔌 API Endpoints

### **Authentication:**
```
POST   /login              - User login
POST   /register           - User registration
POST   /logout             - User logout
GET    /api/session        - Check session
```

### **Dashboards:**
```
GET    /api/dashboards                    - List all dashboards
GET    /api/dashboards/<id>               - Get dashboard
POST   /api/dashboards                    - Create dashboard
PUT    /api/dashboards/<id>               - Update dashboard
DELETE /api/dashboards/<id>               - Delete dashboard
POST   /api/generate-dashboard            - AI generate dashboard
```

### **Data Sources:**
```
GET    /api/data-sources                  - List data sources
POST   /api/data-sources                  - Create data source
PUT    /api/data-sources/<id>             - Update data source
DELETE /api/data-sources/<id>             - Delete data source
POST   /api/data-sources/test             - Test connection
GET    /api/data-sources/<id>/tables      - Get tables
GET    /api/data-sources/<id>/schema      - Get schema
```

### **Queries:**
```
POST   /api/run-query                     - Execute SQL query
POST   /api/validate-query                - Validate SQL
```

### **Folders:**
```
GET    /api/folders                       - List folders
POST   /api/folders                       - Create folder
PUT    /api/folders/<id>                  - Update folder
DELETE /api/folders/<id>                  - Delete folder
PUT    /api/dashboards/<id>/move          - Move to folder
```

### **Templates:**
```
GET    /api/custom-themes                 - List themes
POST   /api/custom-themes                 - Create theme
GET    /api/chart-templates               - List chart templates
POST   /api/chart-templates               - Create template
GET    /api/layout-templates              - List layouts
POST   /api/layout-templates              - Create layout
```

### **Alerts:**
```
GET    /api/alerts                        - List alerts
POST   /api/alerts                        - Create alert
PUT    /api/alerts/<id>                   - Update alert
DELETE /api/alerts/<id>                   - Delete alert
```

---

## 🤖 AI Integration

### **Claude AI (Recommended):**
```python
import anthropic

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": prompt}]
)
```

### **OpenAI (Fallback):**
```python
import openai

openai.api_key = os.getenv('OPENAI_API_KEY')
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
)
```

### **Mock Generation:**
If no API key is provided, the system uses intelligent mock generation based on:
- Table schema analysis
- Column type detection
- Relationship inference
- Statistical patterns

---

## 🔒 Security

### **Authentication:**
- Session-based authentication
- Password hashing (bcrypt)
- JWT tokens for API access
- CSRF protection

### **Database:**
- SQL injection prevention (parameterized queries)
- Connection pooling
- Prepared statements
- Input validation

### **CORS:**
```python
CORS(app, 
     supports_credentials=True,
     origins=[
         'http://localhost:8082',
         'http://localhost:5173'
     ])
```

---

## 📊 Performance

### **Optimizations:**
- Connection pooling
- Query result caching
- Foreign key caching
- Lazy loading
- Pagination

### **Monitoring:**
```python
# Built-in performance monitoring
@app.before_request
def log_request():
    logger.info(f"Request: {request.method} {request.path}")
```

---

## 🚢 Deployment

### **Heroku:**
```bash
# Create Procfile
echo "web: python app_simple.py" > Procfile

# Deploy
heroku create datamantri-api
git push heroku main
```

### **AWS EC2:**
```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv nginx

# Setup app
cd /var/www/datamantri
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app_simple:app
```

### **Docker:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "app_simple.py"]
```

---

## 🧪 Testing

### **Manual Testing:**
```bash
# Test connection
curl http://localhost:5001/api/session

# Test login
curl -X POST http://localhost:5001/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **Database Reset:**
```bash
rm instance/dataviz.db
python app_simple.py  # Will recreate database
```

---

## 🐛 Troubleshooting

### **Port Already in Use:**
```bash
lsof -ti:5001 | xargs kill -9
python app_simple.py
```

### **Database Locked:**
```bash
# SQLite only - restart backend
rm instance/dataviz.db.lock
```

### **Import Errors:**
```bash
pip install -r requirements.txt --upgrade
```

### **CORS Errors:**
Check `.env` file has correct `CORS_ORIGINS`

---

## 📚 Documentation

- [Main Project README](../README.md)
- [Frontend README](../frontend/README.md)
- [API Documentation](../docs/API_DOCUMENTATION.md)
- [Database Schema](../docs/DATABASE_SCHEMA.md)

---

## 🔧 Development Tips

### **Enable Debug Mode:**
```python
app.run(debug=True, port=5001)
```

### **View Logs:**
```bash
tail -f backend.log
```

### **Database Inspection:**
```bash
sqlite3 instance/dataviz.db
# .tables
# .schema dashboards
# SELECT * FROM users;
```

---

## 📦 Dependencies

Key packages:
- `Flask` - Web framework
- `SQLAlchemy` - ORM
- `Flask-Login` - Authentication
- `Flask-CORS` - CORS handling
- `anthropic` - Claude AI
- `openai` - OpenAI GPT
- `pandas` - Data processing
- `psycopg2` - PostgreSQL driver
- `pymysql` - MySQL driver

Full list in `requirements.txt`

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Update documentation
5. Submit a pull request

---

## 📄 License

Proprietary - DataMantri

---

## 🆘 Support

For issues or questions:
- Email: support@datamantri.com
- Docs: [Documentation](../docs/)

---

**Built with ❤️ by the DataMantri Team**

