"""Pipeline run model"""
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base


class PipelineRun(Base):
    """Pipeline execution history model"""
    __tablename__ = "pipeline_runs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("pipelines.id"), nullable=False, index=True)
    
    # Execution details
    status = Column(String(50), nullable=False, default="pending")  # pending, running, success, failed, cancelled
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime)
    
    # Statistics
    records_processed = Column(BigInteger, default=0)
    records_failed = Column(BigInteger, default=0)
    bytes_processed = Column(BigInteger, default=0)
    
    # Logs and errors
    log = Column(Text)
    error_message = Column(Text)
    
    # Execution metadata
    triggered_by = Column(String(50), default="schedule")  # schedule, manual, api
    celery_task_id = Column(String(255))
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="runs")
    
    def __repr__(self):
        return f"<PipelineRun {self.id} - {self.status}>"
    
    @property
    def duration_seconds(self):
        """Calculate run duration in seconds"""
        if self.end_time and self.start_time:
            return (self.end_time - self.start_time).total_seconds()
        return None


