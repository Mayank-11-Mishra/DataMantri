"""Pipeline management endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.pipeline import Pipeline
from app.models.pipeline_run import PipelineRun
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class PipelineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: str
    source_config: dict
    destination_type: str
    destination_config: dict
    mode: str = "batch"
    schedule: Optional[str] = None
    batch_size: dict = {"size": 10000}


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schedule: Optional[str] = None
    status: Optional[str] = None


class PipelineResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    source_type: str
    destination_type: str
    mode: str
    schedule: Optional[str]
    status: str
    last_run_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PipelineRunResponse(BaseModel):
    id: str
    pipeline_id: str
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    records_processed: int
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[PipelineResponse])
async def list_pipelines(
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all pipelines"""
    query = db.query(Pipeline).filter(Pipeline.is_active == True)
    
    if status:
        query = query.filter(Pipeline.status == status)
    
    pipelines = query.all()
    return pipelines


@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get pipeline by ID"""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline


@router.post("/", response_model=PipelineResponse)
async def create_pipeline(
    pipeline: PipelineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new pipeline"""
    # Check if pipeline name already exists
    existing = db.query(Pipeline).filter(Pipeline.name == pipeline.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Pipeline name already exists")
    
    db_pipeline = Pipeline(
        **pipeline.dict(),
        created_by=current_user.id,
        status="active"
    )
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    
    return db_pipeline


@router.put("/{pipeline_id}", response_model=PipelineResponse)
async def update_pipeline(
    pipeline_id: str,
    pipeline_update: PipelineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update pipeline"""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    for field, value in pipeline_update.dict(exclude_unset=True).items():
        setattr(pipeline, field, value)
    
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.delete("/{pipeline_id}")
async def delete_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete pipeline (soft delete)"""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline.is_active = False
    pipeline.status = "deleted"
    db.commit()
    
    return {"message": "Pipeline deleted successfully"}


@router.post("/{pipeline_id}/trigger")
async def trigger_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Manually trigger pipeline execution"""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    if pipeline.status != "active":
        raise HTTPException(status_code=400, detail="Pipeline is not active")
    
    try:
        from app.tasks.pipeline_tasks import execute_pipeline
        task = execute_pipeline.delay(str(pipeline_id))
        
        return {
            "task_id": task.id,
            "status": "triggered",
            "message": "Pipeline execution started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger pipeline: {str(e)}")


@router.get("/{pipeline_id}/runs", response_model=List[PipelineRunResponse])
async def get_pipeline_runs(
    pipeline_id: str,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get pipeline execution history"""
    runs = db.query(PipelineRun).filter(
        PipelineRun.pipeline_id == pipeline_id
    ).order_by(PipelineRun.start_time.desc()).limit(limit).all()
    
    return runs


@router.get("/runs/{run_id}", response_model=PipelineRunResponse)
async def get_run_details(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get run details"""
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
