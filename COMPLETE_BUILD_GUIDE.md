# Complete Pipeline Orchestrator Build Guide

## ✅ Status: Foundation Created

I've created the core foundation of your pipeline orchestration system. Here's what's been built and what remains.

---

## 📁 Created Structure

```
pipeline_orchestrator/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py ✅
│   │   │   ├── database.py ✅
│   │   │   └── security.py ✅
│   │   ├── models/
│   │   │   ├── user.py ✅
│   │   │   ├── pipeline.py ✅
│   │   │   └── pipeline_run.py ✅
│   │   ├── api/ (needs completion)
│   │   ├── schemas/ (needs creation)
│   │   ├── services/ (needs creation)
│   │   └── tasks/ (needs creation)
│   ├── main.py (needs creation)
│   └── requirements.txt ✅
└── frontend/ (needs creation)
```

---

## 🚀 Quick Start Commands

### 1. Install Backend Dependencies

```bash
cd /Users/sunny.agarwal/Projects/DataMantri\ -\ Cursor/pipeline_orchestrator/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Setup PostgreSQL Database

```bash
# Using Docker (recommended)
docker run --name pipeline-postgres \
  -e POSTGRES_USER=pipeline_user \
  -e POSTGRES_PASSWORD=pipeline_pass \
  -e POSTGRES_DB=pipeline_db \
  -p 5432:5432 \
  -d postgres:15

# Or install PostgreSQL locally and create database
createdb pipeline_db
```

### 3. Setup Redis

```bash
# Using Docker
docker run --name pipeline-redis -p 6379:6379 -d redis:7

# Or install Redis locally
brew install redis
redis-server
```

### 4. Initialize Database

```python
# Create init_db.py
from app.core.database import init_db
from app.core.security import get_password_hash
from app.models.user import User
from app.core.database import SessionLocal
import uuid

init_db()

# Create admin user
db = SessionLocal()
admin = User(
    id=uuid.uuid4(),
    email="admin@datamantri.com",
    password_hash=get_password_hash("admin123"),
    full_name="Admin User",
    role="admin",
    is_active=True
)
db.add(admin)
db.commit()
print("Admin user created: admin@datamantri.com / admin123")
```

---

## 📝 Remaining Files to Create

### Backend API Endpoints

**File: `backend/app/api/__init__.py`**
```python
"""API routes"""
```

**File: `backend/app/api/auth.py`**
```python
"""Authentication endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    get_current_active_user
)
from app.models.user import User
from pydantic import BaseModel, EmailStr

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token}

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role
    }
```

**File: `backend/app/api/pipelines.py`**
```python
"""Pipeline management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.pipeline import Pipeline
from pydantic import BaseModel
import uuid

router = APIRouter()

class PipelineCreate(BaseModel):
    name: str
    description: str | None = None
    source_type: str
    source_config: dict
    destination_type: str
    destination_config: dict
    mode: str = "batch"
    schedule: str | None = None

class PipelineResponse(BaseModel):
    id: str
    name: str
    status: str
    mode: str
    schedule: str | None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[PipelineResponse])
async def list_pipelines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    pipelines = db.query(Pipeline).filter(Pipeline.is_active == True).all()
    return pipelines

@router.post("/", response_model=PipelineResponse)
async def create_pipeline(
    pipeline: PipelineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_pipeline = Pipeline(
        **pipeline.dict(),
        created_by=current_user.id
    )
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    
    # Schedule pipeline if cron is provided
    if pipeline.schedule:
        from app.tasks.scheduler import schedule_pipeline
        schedule_pipeline(str(db_pipeline.id), pipeline.schedule)
    
    return db_pipeline

@router.post("/{pipeline_id}/trigger")
async def trigger_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    from app.tasks.pipeline_tasks import execute_pipeline
    task = execute_pipeline.delay(str(pipeline_id))
    
    return {"task_id": task.id, "status": "triggered"}

@router.delete("/{pipeline_id}")
async def delete_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline.is_active = False
    pipeline.status = "deleted"
    db.commit()
    
    return {"message": "Pipeline deleted successfully"}
```

### Data Transfer Services

**File: `backend/app/services/bigquery_service.py`**
```python
"""BigQuery data service"""
from google.cloud import bigquery
from typing import Generator, Dict, Any
import pandas as pd

class BigQueryService:
    def __init__(self, project_id: str = None):
        self.client = bigquery.Client(project=project_id)
    
    def query_data(self, query: str, batch_size: int = 10000) -> Generator[pd.DataFrame, None, None]:
        """Query BigQuery and return data in batches"""
        query_job = self.client.query(query)
        
        rows_buffer = []
        for row in query_job:
            rows_buffer.append(dict(row))
            
            if len(rows_buffer) >= batch_size:
                yield pd.DataFrame(rows_buffer)
                rows_buffer = []
        
        if rows_buffer:
            yield pd.DataFrame(rows_buffer)
    
    def get_table_data(
        self,
        project: str,
        dataset: str,
        table: str,
        batch_size: int = 10000
    ) -> Generator[pd.DataFrame, None, None]:
        """Get all data from a BigQuery table"""
        query = f"SELECT * FROM `{project}.{dataset}.{table}`"
        return self.query_data(query, batch_size)
```

**File: `backend/app/services/postgres_service.py`**
```python
"""PostgreSQL data service"""
from sqlalchemy import create_engine, text
import pandas as pd

class PostgresService:
    def __init__(self, connection_string: str):
        self.engine = create_engine(connection_string)
    
    def insert_dataframe(
        self,
        df: pd.DataFrame,
        table_name: str,
        if_exists: str = 'append'
    ) -> int:
        """Insert DataFrame into PostgreSQL table"""
        df.to_sql(
            table_name,
            self.engine,
            if_exists=if_exists,
            index=False,
            method='multi',
            chunksize=1000
        )
        return len(df)
    
    def execute_query(self, query: str):
        """Execute a query"""
        with self.engine.connect() as conn:
            return conn.execute(text(query))
```

**File: `backend/app/services/transfer_service.py`**
```python
"""Data transfer orchestration service"""
from .bigquery_service import BigQueryService
from .postgres_service import PostgresService
import logging

logger = logging.getLogger(__name__)

class TransferService:
    def __init__(self):
        self.bq_service = None
        self.pg_service = None
    
    def transfer_bigquery_to_postgres(
        self,
        bq_config: dict,
        pg_config: dict,
        batch_size: int = 10000
    ) -> dict:
        """Transfer data from BigQuery to PostgreSQL"""
        # Initialize services
        self.bq_service = BigQueryService(project_id=bq_config.get('project_id'))
        
        pg_conn_str = f"postgresql://{pg_config['user']}:{pg_config['password']}@{pg_config['host']}:{pg_config['port']}/{pg_config['database']}"
        self.pg_service = PostgresService(pg_conn_str)
        
        total_records = 0
        total_batches = 0
        
        # Get data from BigQuery
        for batch_df in self.bq_service.get_table_data(
            project=bq_config['project'],
            dataset=bq_config['dataset'],
            table=bq_config['table'],
            batch_size=batch_size
        ):
            # Insert into PostgreSQL
            records = self.pg_service.insert_dataframe(
                batch_df,
                pg_config['table']
            )
            
            total_records += records
            total_batches += 1
            logger.info(f"Transferred batch {total_batches}: {records} records")
        
        return {
            "total_records": total_records,
            "total_batches": total_batches,
            "status": "success"
        }
```

### Celery Tasks

**File: `backend/app/tasks/celery_app.py`**
```python
"""Celery configuration"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "pipeline_orchestrator",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
```

**File: `backend/app/tasks/pipeline_tasks.py`**
```python
"""Pipeline execution tasks"""
from .celery_app import celery_app
from app.core.database import SessionLocal
from app.models.pipeline import Pipeline
from app.models.pipeline_run import PipelineRun
from app.services.transfer_service import TransferService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def execute_pipeline(pipeline_id: str):
    """Execute a pipeline"""
    db = SessionLocal()
    
    try:
        # Get pipeline
        pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if not pipeline:
            return {"error": "Pipeline not found"}
        
        # Create run record
        run = PipelineRun(
            pipeline_id=pipeline_id,
            status="running",
            start_time=datetime.utcnow(),
            triggered_by="manual"
        )
        db.add(run)
        db.commit()
        
        # Execute transfer
        transfer_service = TransferService()
        result = transfer_service.transfer_bigquery_to_postgres(
            bq_config=pipeline.source_config,
            pg_config=pipeline.destination_config,
            batch_size=pipeline.batch_size.get('size', 10000)
        )
        
        # Update run
        run.status = "success"
        run.end_time = datetime.utcnow()
        run.records_processed = result['total_records']
        run.log = f"Successfully transferred {result['total_records']} records"
        
        # Update pipeline
        pipeline.last_run_at = datetime.utcnow()
        
        db.commit()
        
        return result
        
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        
        if run:
            run.status = "failed"
            run.end_time = datetime.utcnow()
            run.error_message = str(e)
            db.commit()
        
        raise
    
    finally:
        db.close()
```

### Main FastAPI Application

**File: `backend/main.py`**
```python
"""FastAPI application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api import auth, pipelines

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(pipelines.router, prefix=f"{settings.API_V1_PREFIX}/pipelines", tags=["pipelines"])

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()

@app.get("/")
async def root():
    return {"message": "DataMantri Pipeline Orchestrator API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 🎯 Next Steps

### 1. Complete Backend Setup

```bash
cd pipeline_orchestrator/backend
source venv/bin/activate

# Create the remaining files listed above
# Then run:
python main.py
```

### 2. Start Celery Worker

```bash
# In a new terminal
cd pipeline_orchestrator/backend
source venv/bin/activate
celery -A app.tasks.celery_app worker --loglevel=info
```

### 3. Create Frontend (React)

I can create the complete frontend with:
- Dashboard page
- Pipeline creation form
- Monitoring page
- Cron builder component

Would you like me to:
1. Create the complete frontend now?
2. Create Docker setup files?
3. Add WebSocket support for real-time updates?

Let me know and I'll continue building!


