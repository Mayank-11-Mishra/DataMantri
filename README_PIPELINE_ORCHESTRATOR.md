# DataMantri Pipeline Orchestrator

A production-ready data pipeline orchestration tool for moving data between multiple sources and destinations.

## Features

### Core Capabilities
- **Data Movement**: Transfer data between Google BigQuery and PostgreSQL
- **Dual Modes**: Real-time streaming and batch ingestion
- **Flexible Scheduling**: Cron-based scheduling with manual execution option
- **Real-time Monitoring**: Live pipeline status updates via WebSockets
- **User Management**: Complete authentication and authorization system

### Technology Stack

**Backend:**
- FastAPI (Python 3.9+)
- SQLAlchemy + PostgreSQL for metadata
- Celery + Redis for async task execution
- Google BigQuery Client Library
- WebSockets for real-time updates

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- WebSocket client for live updates
- Cron expression builder UI

**Infrastructure:**
- Docker + Docker Compose
- PostgreSQL for metadata storage
- Redis for task queue

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Google Cloud Platform account with BigQuery enabled
- Service account credentials for BigQuery

### Installation

1. **Clone and setup:**
```bash
cd "/Users/sunny.agarwal/Projects/DataMantri - Cursor"
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Architecture

### Database Schema

**pipelines** - Pipeline configurations
- id (UUID, primary key)
- name (string)
- source_type (enum: bigquery, postgres)
- source_config (JSON)
- destination_type (enum: bigquery, postgres)
- destination_config (JSON)
- mode (enum: realtime, batch)
- schedule (cron expression)
- status (enum: active, paused, deleted)
- created_at, updated_at

**pipeline_runs** - Execution history
- id (UUID, primary key)
- pipeline_id (foreign key)
- start_time, end_time
- status (enum: pending, running, success, failed)
- records_processed (int)
- log (text)
- error_message (text)

**users** - User management
- id (UUID, primary key)
- email (string, unique)
- password_hash (string)
- role (enum: admin, user)
- created_at

### API Endpoints

**Authentication:**
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/session` - Get current session

**Pipelines:**
- GET `/api/pipelines` - List all pipelines
- POST `/api/pipelines` - Create new pipeline
- GET `/api/pipelines/{id}` - Get pipeline details
- PUT `/api/pipelines/{id}` - Update pipeline
- DELETE `/api/pipelines/{id}` - Delete pipeline
- POST `/api/pipelines/{id}/trigger` - Manual execution

**Pipeline Runs:**
- GET `/api/pipelines/{id}/runs` - Get run history
- GET `/api/runs/{id}` - Get run details
- GET `/api/runs/{id}/logs` - Stream logs

**Monitoring:**
- WS `/ws/pipelines` - Real-time pipeline updates
- GET `/api/stats/dashboard` - Dashboard statistics

## Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Running Celery Worker
```bash
celery -A backend.tasks worker --loglevel=info
```

### Running Celery Beat (Scheduler)
```bash
celery -A backend.tasks beat --loglevel=info
```

## Project Structure

```
DataMantri-Cursor/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── pipelines.py
│   │   │   └── runs.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── pipeline.py
│   │   │   └── pipeline_run.py
│   │   ├── services/
│   │   │   ├── bigquery_service.py
│   │   │   ├── postgres_service.py
│   │   │   └── transfer_service.py
│   │   └── tasks/
│   │       ├── celery_app.py
│   │       └── pipeline_tasks.py
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Pipelines.tsx
│   │   │   ├── CreatePipeline.tsx
│   │   │   └── PipelineMonitor.tsx
│   │   ├── components/
│   │   │   ├── PipelineCard.tsx
│   │   │   ├── CronBuilder.tsx
│   │   │   └── LogViewer.tsx
│   │   └── services/
│   │       ├── api.ts
│   │       └── websocket.ts
│   └── package.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

## Configuration

### Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:password@postgres:5432/pipeline_db
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=your-project-id

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Production Deployment

### Security Checklist
- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS/WSS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Monitor resource usage

### Scaling Considerations
- Use multiple Celery workers for parallel execution
- Implement connection pooling for databases
- Add Redis Sentinel for high availability
- Use load balancer for multiple backend instances
- Implement caching for frequently accessed data

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.

