"""Pipeline model"""
from sqlalchemy import Column, String, JSON, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base


class Pipeline(Base):
    """Pipeline configuration model"""
    __tablename__ = "pipelines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text)
    
    # Source configuration
    source_type = Column(String(50), nullable=False)  # bigquery, postgres
    source_config = Column(JSON, nullable=False)  # {project, dataset, table, query}
    
    # Destination configuration
    destination_type = Column(String(50), nullable=False)  # postgres, bigquery
    destination_config = Column(JSON, nullable=False)  # {host, port, database, table}
    
    # Pipeline settings
    mode = Column(String(50), nullable=False, default="batch")  # batch, realtime
    schedule = Column(String(100))  # cron expression
    status = Column(String(50), nullable=False, default="active")  # active, paused, deleted
    is_active = Column(Boolean, default=True)
    
    # Execution settings
    batch_size = Column(JSON, default={"size": 10000})
    retry_config = Column(JSON, default={"max_retries": 3, "retry_delay": 60})
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_run_at = Column(DateTime)
    
    # Relationships
    runs = relationship("PipelineRun", back_populates="pipeline", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Pipeline {self.name}>"


