# Complete Implementation Guide: DataMantri Pipeline Orchestrator

## Important Note

Building a complete Airflow-like orchestration system is a **major enterprise project** that typically takes weeks-to-months with a team. Given your current codebase state (simple login system), I recommend the following approach:

## Recommended Approach

### Option 1: Use Existing Open Source (Recommended)
**Instead of building from scratch, leverage battle-tested solutions:**

1. **Apache Airflow** - Full-featured orchestration
   - Already has BigQuery → PostgreSQL operators
   - Built-in scheduler, UI, monitoring
   - Production-ready with extensive documentation

2. **Prefect** - Modern alternative to Airflow
   - Python-native, easier to use
   - Better for custom data workflows
   - Good monitoring and debugging

3. **Dagster** - Data-aware orchestration
   - Great for data pipelines
   - Type-safe, testable
   - Modern architecture

**Integration Path:**
```bash
# Install Airflow
pip install apache-airflow
pip install apache-airflow-providers-google
pip install apache-airflow-providers-postgres

# Or Prefect
pip install prefect prefect-gcp prefect-sqlalchemy
```

### Option 2: Simplified Custom Solution

If you must build custom, start **incrementally**:

#### Phase 1: Core Data Transfer (Week 1)
1. Simple FastAPI backend with:
   - One endpoint: `/api/transfer` (BigQuery → Postgres)
   - Basic authentication
   - No scheduling yet

2. Create transfer script:
```python
# backend/transfer.py
from google.cloud import bigquery
import psycopg2
import pandas as pd

def transfer_bigquery_to_postgres(
    bq_query: str,
    pg_conn_str: str,
    pg_table: str
):
    # Query BigQuery
    client = bigquery.Client()
    df = client.query(bq_query).to_dataframe()
    
    # Insert to Postgres
    engine = create_engine(pg_conn_str)
    df.to_sql(pg_table, engine, if_exists='append', index=False)
    
    return len(df)
```

#### Phase 2: Add Scheduling (Week 2)
1. Add APScheduler (simpler than Celery):
```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(
    func=run_pipeline,
    trigger='cron',
    hour=2,
    id='my_pipeline'
)
scheduler.start()
```

#### Phase 3: Add UI (Week 3)
1. Simple React dashboard
2. List pipelines, create new ones
3. View logs

#### Phase 4: Add Real-time (Week 4)
1. WebSocket for live updates
2. Celery for background tasks

---

## If You Decide to Build From Scratch

Here's the complete architecture:

### Project Structure

```
DataMantri-Cursor/
├── pipeline_orchestrator/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py          # Authentication endpoints
│   │   │   │   ├── pipelines.py     # Pipeline CRUD
│   │   │   │   ├── runs.py          # Run management
│   │   │   │   └── websocket.py     # Real-time updates
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py        # Settings
│   │   │   │   ├── database.py      # DB connection
│   │   │   │   └── security.py      # Auth logic
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py
│   │   │   │   ├── pipeline.py
│   │   │   │   └── pipeline_run.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py          # Pydantic schemas
│   │   │   │   ├── pipeline.py
│   │   │   │   └── pipeline_run.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── bigquery.py      # BigQuery connector
│   │   │   │   ├── postgres.py      # Postgres connector
│   │   │   │   └── transfer.py      # Data transfer logic
│   │   │   └── tasks/
│   │   │       ├── __init__.py
│   │   │       ├── celery_app.py    # Celery setup
│   │   │       ├── pipeline_tasks.py # Celery tasks
│   │   │       └── scheduler.py     # Cron scheduler
│   │   ├── main.py                  # FastAPI app
│   │   ├── requirements.txt
│   │   └── alembic/                 # DB migrations
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Pipelines.tsx
│   │   │   │   ├── CreatePipeline.tsx
│   │   │   │   └── Monitor.tsx
│   │   │   ├── components/
│   │   │   │   ├── PipelineCard.tsx
│   │   │   │   ├── CronBuilder.tsx
│   │   │   │   ├── LogViewer.tsx
│   │   │   │   └── StatusBadge.tsx
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   └── websocket.ts
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── tailwind.config.js
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
└── .env
```

### Critical Components to Build

#### 1. Database Models (SQLAlchemy)

```python
# app/models/pipeline.py
from sqlalchemy import Column, String, JSON, Enum, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base

class Pipeline(Base):
    __tablename__ = "pipelines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    source_type = Column(String, nullable=False)  # 'bigquery'
    source_config = Column(JSON, nullable=False)  # {project, dataset, table}
    destination_type = Column(String, nullable=False)  # 'postgres'
    destination_config = Column(JSON, nullable=False)  # {host, db, table}
    mode = Column(String, nullable=False)  # 'batch' or 'realtime'
    schedule = Column(String, nullable=True)  # cron expression
    status = Column(String, default='active')  # 'active', 'paused', 'deleted'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
```

#### 2. FastAPI Endpoints

```python
# app/api/pipelines.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.pipeline import Pipeline
from app.schemas.pipeline import PipelineCreate, PipelineResponse

router = APIRouter()

@router.post("/", response_model=PipelineResponse)
async def create_pipeline(
    pipeline: PipelineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Create pipeline
    db_pipeline = Pipeline(**pipeline.dict(), created_by=current_user.id)
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    
    # Register with scheduler
    from app.tasks.scheduler import schedule_pipeline
    schedule_pipeline(db_pipeline.id, db_pipeline.schedule)
    
    return db_pipeline

@router.get("/", response_model=List[PipelineResponse])
async def list_pipelines(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return db.query(Pipeline).all()

@router.post("/{pipeline_id}/trigger")
async def trigger_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from app.tasks.pipeline_tasks import execute_pipeline
    task = execute_pipeline.delay(pipeline_id)
    return {"task_id": task.id, "status": "triggered"}
```

#### 3. Data Transfer Service

```python
# app/services/transfer.py
from google.cloud import bigquery
from sqlalchemy import create_engine
import pandas as pd

class TransferService:
    def __init__(self):
        self.bq_client = bigquery.Client()
    
    def transfer_bigquery_to_postgres(
        self,
        bq_project: str,
        bq_dataset: str,
        bq_table: str,
        pg_conn_str: str,
        pg_table: str,
        batch_size: int = 10000
    ):
        # Query BigQuery
        query = f"""
            SELECT * FROM `{bq_project}.{bq_dataset}.{bq_table}`
        """
        
        # Stream data in batches
        query_job = self.bq_client.query(query)
        
        engine = create_engine(pg_conn_str)
        total_rows = 0
        
        for batch in self._batch_iterator(query_job, batch_size):
            df = pd.DataFrame(batch)
            df.to_sql(pg_table, engine, if_exists='append', index=False)
            total_rows += len(df)
        
        return total_rows
    
    def _batch_iterator(self, query_job, batch_size):
        rows = []
        for row in query_job:
            rows.append(dict(row))
            if len(rows) >= batch_size:
                yield rows
                rows = []
        if rows:
            yield rows
```

#### 4. Celery Tasks

```python
# app/tasks/pipeline_tasks.py
from celery import Celery
from app.core.config import settings
from app.services.transfer import TransferService

celery_app = Celery(
    "pipeline_orchestrator",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

@celery_app.task
def execute_pipeline(pipeline_id: str):
    # Get pipeline from DB
    # Execute transfer
    # Log results
    transfer_service = TransferService()
    # ... implementation
    return {"status": "success", "records": 1000}
```

#### 5. React Components

```typescript
// frontend/src/components/PipelineCard.tsx
import React from 'react';

interface Pipeline {
  id: string;
  name: string;
  source_type: string;
  destination_type: string;
  mode: string;
  schedule: string;
  status: string;
}

export const PipelineCard: React.FC<{pipeline: Pipeline}> = ({ pipeline }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold">{pipeline.name}</h3>
      <div className="mt-2 text-sm text-gray-600">
        <span className="badge">{pipeline.source_type}</span> → 
        <span className="badge">{pipeline.destination_type}</span>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <span className={`status-badge ${pipeline.status}`}>
          {pipeline.status}
        </span>
        <button className="btn-primary">Run Now</button>
      </div>
    </div>
  );
};
```

---

## My Recommendation

**Given your current setup (basic Flask login app), I strongly recommend:**

### Best Path Forward:

1. **Use Apache Airflow or Prefect** for orchestration (battle-tested, production-ready)
2. **Build a custom UI** on top if needed (React dashboard that calls Airflow API)
3. Focus your development effort on:
   - Custom business logic
   - Data transformations
   - Monitoring dashboards
   - User experience

### Quick Setup with Airflow:

```bash
# Install
pip install apache-airflow[google,postgres]

# Initialize
airflow db init

# Create DAG
# dags/bigquery_to_postgres.py
from airflow import DAG
from airflow.providers.google.cloud.transfers.bigquery_to_postgres import BigQueryToPostgresOperator
from datetime import datetime

with DAG(
    'bq_to_postgres',
    start_date=datetime(2024, 1, 1),
    schedule='@daily'
) as dag:
    transfer = BigQueryToPostgresOperator(
        task_id='transfer_data',
        source_project_dataset_table='project.dataset.table',
        target_table_name='destination_table',
        postgres_conn_id='postgres_default'
    )
```

This gives you 90% of what you need with 10% of the effort!

---

## Next Steps

Would you like me to:
1. **Set up Airflow integration** with your current codebase?
2. **Build a simplified custom solution** (start with Phase 1)?
3. **Continue with full custom implementation** (requires significant time)?

Please let me know which approach you'd prefer!


