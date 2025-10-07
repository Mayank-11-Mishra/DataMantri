# DataMantri Pipeline Orchestrator

A production-ready data pipeline orchestration system for moving data between BigQuery and PostgreSQL.

## ✅ Complete System Built

### Components Included:
- ✅ FastAPI Backend with REST API
- ✅ PostgreSQL for metadata storage
- ✅ Redis for task queue
- ✅ Celery for async task execution
- ✅ BigQuery → PostgreSQL data transfer
- ✅ Scheduling support (cron)
- ✅ Docker setup for easy deployment
- ✅ Authentication & user management
- ✅ Pipeline monitoring and logging

---

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

```bash
cd pipeline_orchestrator

# Start all services
docker-compose up -d

# Initialize database and create admin user
docker-compose exec backend python init_db.py

# View logs
docker-compose logs -f backend
```

**Access Points:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs
- Flower (Celery Monitoring): http://localhost:5555

### Option 2: Local Development

#### 1. Start PostgreSQL
```bash
docker run --name pipeline-postgres \
  -e POSTGRES_USER=pipeline_user \
  -e POSTGRES_PASSWORD=pipeline_pass \
  -e POSTGRES_DB=pipeline_db \
  -p 5432:5432 -d postgres:15
```

#### 2. Start Redis
```bash
docker run --name pipeline-redis -p 6379:6379 -d redis:7
```

#### 3. Setup Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start FastAPI server
python main.py
```

#### 4. Start Celery Worker (New Terminal)
```bash
cd backend
source venv/bin/activate
celery -A app.tasks.celery_app worker --loglevel=info
```

#### 5. Start Celery Beat (New Terminal) - Optional
```bash
cd backend
source venv/bin/activate
celery -A app.tasks.celery_app beat --loglevel=info
```

---

## 📚 API Usage

### 1. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@datamantri.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJh...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin@datamantri.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

### 2. Create Pipeline
```bash
curl -X POST http://localhost:8000/api/v1/pipelines/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BQ to Postgres Pipeline",
    "description": "Transfer data from BigQuery to PostgreSQL",
    "source_type": "bigquery",
    "source_config": {
      "project_id": "your-gcp-project",
      "project": "your-project",
      "dataset": "your_dataset",
      "table": "your_table"
    },
    "destination_type": "postgres",
    "destination_config": {
      "host": "localhost",
      "port": 5432,
      "database": "target_db",
      "user": "postgres",
      "password": "password",
      "table": "target_table"
    },
    "mode": "batch",
    "schedule": "0 2 * * *",
    "batch_size": {"size": 10000}
  }'
```

### 3. List Pipelines
```bash
curl -X GET http://localhost:8000/api/v1/pipelines/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Trigger Pipeline Execution
```bash
curl -X POST http://localhost:8000/api/v1/pipelines/{pipeline_id}/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get Pipeline Runs
```bash
curl -X GET http://localhost:8000/api/v1/pipelines/{pipeline_id}/runs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=postgresql://pipeline_user:pipeline_pass@localhost:5432/pipeline_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Google Cloud (for BigQuery)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=your-project-id

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS
BACKEND_CORS_ORIGINS=http://localhost:8080,http://localhost:3000
```

### Google Cloud Setup

1. Create a service account in GCP
2. Grant BigQuery permissions
3. Download JSON key file
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path

---

## 📊 Database Schema

### pipelines
```sql
CREATE TABLE pipelines (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL,
    source_config JSON NOT NULL,
    destination_type VARCHAR(50) NOT NULL,
    destination_config JSON NOT NULL,
    mode VARCHAR(50) NOT NULL DEFAULT 'batch',
    schedule VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    batch_size JSON DEFAULT '{"size": 10000}',
    retry_config JSON DEFAULT '{"max_retries": 3, "retry_delay": 60}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_run_at TIMESTAMP
);
```

### pipeline_runs
```sql
CREATE TABLE pipeline_runs (
    id UUID PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP,
    records_processed BIGINT DEFAULT 0,
    records_failed BIGINT DEFAULT 0,
    bytes_processed BIGINT DEFAULT 0,
    log TEXT,
    error_message TEXT,
    triggered_by VARCHAR(50) DEFAULT 'schedule',
    celery_task_id VARCHAR(255)
);
```

---

## 🎯 Features

### ✅ Implemented

1. **Data Transfer**
   - BigQuery → PostgreSQL
   - Batch processing with configurable batch size
   - Automatic retry on failure

2. **Pipeline Management**
   - Create, update, delete pipelines
   - Manual trigger execution
   - Schedule with cron expressions
   - Pipeline status tracking

3. **Monitoring**
   - Execution history
   - Success/failure tracking
   - Logs and error messages
   - Records processed count

4. **Security**
   - JWT-based authentication
   - Role-based access control
   - Password hashing

5. **Infrastructure**
   - Docker setup
   - Async task execution with Celery
   - Redis for task queue
   - PostgreSQL for metadata

### 🚧 To Add (Future Enhancements)

1. **Frontend Dashboard**
   - React UI for pipeline management
   - Real-time monitoring with WebSockets
   - Cron builder UI component

2. **Additional Data Sources**
   - MySQL support
   - MongoDB support
   - S3/GCS file support

3. **Advanced Features**
   - Data transformation rules
   - Incremental syncing
   - Data validation
   - Alerting & notifications

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
psql postgresql://pipeline_user:pipeline_pass@localhost:5432/pipeline_db
```

### Celery Not Starting
```bash
# Check Redis is running
redis-cli ping

# View Celery logs
celery -A app.tasks.celery_app worker --loglevel=debug
```

### BigQuery Authentication Error
```bash
# Verify service account file exists
ls -la $GOOGLE_APPLICATION_CREDENTIALS

# Test GCP access
gcloud auth application-default print-access-token
```

---

## 📝 Development

### Run Tests
```bash
pytest tests/
```

### Format Code
```bash
black app/
isort app/
```

### Type Checking
```bash
mypy app/
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License

---

## 🆘 Support

For issues and questions:
- Check the documentation above
- Review API docs at http://localhost:8000/api/v1/docs
- Monitor Celery tasks at http://localhost:5555

---

## 🎉 Congratulations!

You now have a fully functional data pipeline orchestrator. Start by:
1. Creating your first pipeline
2. Triggering a manual execution
3. Monitoring the results

Happy orchestrating! 🚀


