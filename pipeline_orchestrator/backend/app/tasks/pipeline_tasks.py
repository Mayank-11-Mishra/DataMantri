"""Pipeline execution tasks"""
from .celery_app import celery_app
from app.core.database import SessionLocal
from app.models.pipeline import Pipeline
from app.models.pipeline_run import PipelineRun
from app.services.transfer_service import TransferService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def execute_pipeline(self, pipeline_id: str):
    """Execute a data pipeline"""
    db = SessionLocal()
    run = None
    
    try:
        logger.info(f"Executing pipeline {pipeline_id}")
        
        # Get pipeline
        pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if not pipeline:
            logger.error(f"Pipeline {pipeline_id} not found")
            return {"error": "Pipeline not found"}
        
        # Create run record
        run = PipelineRun(
            pipeline_id=pipeline_id,
            status="running",
            start_time=datetime.utcnow(),
            triggered_by="celery",
            celery_task_id=self.request.id
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        
        # Execute data transfer
        transfer_service = TransferService()
        
        if pipeline.source_type == "bigquery" and pipeline.destination_type == "postgres":
            result = transfer_service.transfer_bigquery_to_postgres(
                bq_config=pipeline.source_config,
                pg_config=pipeline.destination_config,
                batch_size=pipeline.batch_size.get('size', 10000)
            )
        else:
            raise ValueError(f"Unsupported transfer: {pipeline.source_type} -> {pipeline.destination_type}")
        
        # Update run record
        run.status = "success" if result['status'] == "success" else "failed"
        run.end_time = datetime.utcnow()
        run.records_processed = result.get('total_records', 0)
        run.records_failed = result.get('failed_records', 0)
        run.log = f"Transferred {result.get('total_records', 0)} records in {result.get('total_batches', 0)} batches"
        
        if result['status'] == "failed":
            run.error_message = result.get('error', 'Unknown error')
        
        # Update pipeline last run
        pipeline.last_run_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Pipeline {pipeline_id} completed: {run.status}")
        return result
        
    except Exception as e:
        logger.error(f"Pipeline {pipeline_id} execution failed: {e}")
        
        if run:
            run.status = "failed"
            run.end_time = datetime.utcnow()
            run.error_message = str(e)
            db.commit()
        
        # Retry logic
        raise self.retry(exc=e, countdown=60)
    
    finally:
        db.close()


@celery_app.task
def cleanup_old_runs(days_to_keep: int = 30):
    """Clean up old pipeline runs"""
    from datetime import timedelta
    
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        deleted = db.query(PipelineRun).filter(
            PipelineRun.start_time < cutoff_date,
            PipelineRun.status.in_(["success", "failed"])
        ).delete()
        
        db.commit()
        logger.info(f"Cleaned up {deleted} old pipeline runs")
        
        return {"deleted": deleted}
    finally:
        db.close()


