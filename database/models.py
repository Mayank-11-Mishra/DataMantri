"""
DataMantri Database Models
Complete data architecture for PostgreSQL
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """User model for authentication and authorization"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100))
    role = db.Column(db.String(50), default='VIEWER')  # SUPER_ADMIN, ADMIN, EDITOR, VIEWER
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    organization_name = db.Column(db.String(255))
    organization_logo_url = db.Column(db.String(500))
    must_reset_password = db.Column(db.Boolean, default=False)
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    data_sources = db.relationship('DataSource', backref='creator', lazy='dynamic', cascade='all, delete-orphan')
    data_marts = db.relationship('DataMart', backref='creator', lazy='dynamic', cascade='all, delete-orphan')
    pipelines = db.relationship('Pipeline', backref='creator', lazy='dynamic', cascade='all, delete-orphan')
    dashboards = db.relationship('Dashboard', backref='creator', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'is_admin': self.is_admin,
            'is_active': self.is_active,
            'organization_name': self.organization_name,
            'organization_logo_url': self.organization_logo_url,
            'must_reset_password': self.must_reset_password,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DataSource(db.Model):
    """Data source connections"""
    __tablename__ = 'data_sources'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    connection_type = db.Column(db.String(50), nullable=False)  # postgresql, mysql, mongodb, bigquery
    host = db.Column(db.String(255))
    port = db.Column(db.Integer)
    database = db.Column(db.String(255))
    username = db.Column(db.String(255))
    password = db.Column(db.String(255))  # Should be encrypted in production
    connection_string = db.Column(db.Text)  # For custom connection strings
    status = db.Column(db.String(50), default='connected')  # connected, disconnected, error
    last_sync = db.Column(db.DateTime)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    data_marts = db.relationship('DataMart', backref='source', lazy='dynamic')
    pipelines_source = db.relationship('Pipeline', foreign_keys='Pipeline.source_id', backref='source_connection', lazy='dynamic')
    pipelines_destination = db.relationship('Pipeline', foreign_keys='Pipeline.destination_id', backref='destination_connection', lazy='dynamic')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'connection_type': self.connection_type,
            'host': self.host,
            'port': self.port,
            'database': self.database,
            'username': self.username,
            'status': self.status,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class DataMart(db.Model):
    """Data marts for analytics"""
    __tablename__ = 'data_marts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    source_id = db.Column(db.String(36), db.ForeignKey('data_sources.id'))
    query = db.Column(db.Text)  # SQL query for data mart
    schedule = db.Column(db.String(100))  # Cron expression
    status = db.Column(db.String(50), default='ready')  # ready, running, error
    last_run = db.Column(db.DateTime)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'source_id': self.source_id,
            'query': self.query,
            'schedule': self.schedule,
            'status': self.status,
            'last_run': self.last_run.isoformat() if self.last_run else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Pipeline(db.Model):
    """Data pipelines for ETL operations"""
    __tablename__ = 'pipelines'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    pipeline_type = db.Column(db.String(50), default='simple')  # simple, sql, custom
    source_id = db.Column(db.String(36), db.ForeignKey('data_sources.id'))
    destination_id = db.Column(db.String(36), db.ForeignKey('data_sources.id'))
    source_table = db.Column(db.String(255))
    destination_table = db.Column(db.String(255))
    transformation_sql = db.Column(db.Text)  # SQL for transformation
    schedule = db.Column(db.String(100))  # Cron expression
    status = db.Column(db.String(50), default='active')  # active, paused, error
    last_run = db.Column(db.DateTime)
    next_run = db.Column(db.DateTime)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    runs = db.relationship('PipelineRun', backref='pipeline', lazy='dynamic', cascade='all, delete-orphan', order_by='PipelineRun.started_at.desc()')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'pipeline_type': self.pipeline_type,
            'source_id': self.source_id,
            'destination_id': self.destination_id,
            'source_table': self.source_table,
            'destination_table': self.destination_table,
            'transformation_sql': self.transformation_sql,
            'schedule': self.schedule,
            'status': self.status,
            'last_run': self.last_run.isoformat() if self.last_run else None,
            'next_run': self.next_run.isoformat() if self.next_run else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class PipelineRun(db.Model):
    """Pipeline execution history"""
    __tablename__ = 'pipeline_runs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pipeline_id = db.Column(db.String(36), db.ForeignKey('pipelines.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # success, failed, running
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    duration_seconds = db.Column(db.Integer)
    records_processed = db.Column(db.Integer, default=0)
    records_failed = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text)
    logs = db.Column(db.Text)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration_seconds': self.duration_seconds,
            'records_processed': self.records_processed,
            'records_failed': self.records_failed,
            'error_message': self.error_message
        }

class Dashboard(db.Model):
    """User dashboards"""
    __tablename__ = 'dashboards'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    config = db.Column(db.JSON)  # Dashboard configuration (charts, layout, etc.)
    is_public = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'config': self.config,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Query(db.Model):
    """Saved queries"""
    __tablename__ = 'queries'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    sql = db.Column(db.Text, nullable=False)
    data_source_id = db.Column(db.String(36), db.ForeignKey('data_sources.id'))
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    data_source = db.relationship('DataSource', backref='queries')
    user = db.relationship('User', backref='queries')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'sql': self.sql,
            'data_source_id': self.data_source_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

