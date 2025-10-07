from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, date, time as dt_time, timedelta, timezone
from decimal import Decimal
import logging
import os
import uuid
import sys
import hashlib
import time
import json
import math
from functools import wraps
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

# Create Flask app
app = Flask(__name__, static_folder='dist', static_url_path='')
app.config['SECRET_KEY'] = os.urandom(24)

# Use the configuration from database/config.py
from database.config import config as db_config
app.config['SQLALCHEMY_DATABASE_URI'] = db_config.get_database_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure CORS to allow credentials
CORS(app, supports_credentials=True, origins=['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8082', 'http://127.0.0.1:8082'])

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@datamantri.com')

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'status': 'error', 'message': 'Authentication required'}), 401

class DemoUser(UserMixin):
    def __init__(self):
        self.id = 'demo'
        self.email = os.getenv('DEMO_EMAIL', 'demo@datamantri.com')
        self.role = 'ADMIN'
        self._is_active = True

    @property
    def is_active(self):
        return self._is_active

    @property
    def is_admin(self):
        return True

    @property
    def must_reset_password(self):
        return False

@login_manager.user_loader
def load_user(user_id):
    # Load user from database (including demo user)
    try:
        return User.query.get(str(user_id))
    except Exception as e:
        logger.error(f"load_user failed: {e}")
        return None

def _password_matches(stored_hash: str, provided_password: str) -> bool:
    """Support both Werkzeug hashes and plaintext (dev fallback)."""
    try:
        if stored_hash and (stored_hash.startswith('pbkdf2:') or stored_hash.startswith('scrypt:')):
            return check_password_hash(stored_hash, provided_password)
        # Fallback: treat as plaintext
        return stored_hash == provided_password
    except Exception:
        return False

# Simple User model - only what's needed for login
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)  # UUID as string
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    avatar_url = db.Column(db.String(500))
    timezone = db.Column(db.String(50), default='UTC')
    
    # Access Management
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    role = db.Column(db.String(50), default='USER')  # Legacy role field (kept for backward compatibility)
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)  # Legacy admin flag
    
    # Metadata
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(36))  # User ID who created this user
    updated_by = db.Column(db.String(36))  # User ID who last updated this user

# DataSource model for persistent storage
class DataSource(db.Model):
    """Data source connections - persistent storage"""
    __tablename__ = 'data_sources'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    connection_type = db.Column(db.String(50), nullable=False)
    host = db.Column(db.String(255))
    port = db.Column(db.Integer)
    database = db.Column(db.String(255))
    username = db.Column(db.String(255))
    password = db.Column(db.String(255))
    connection_string = db.Column(db.Text)
    status = db.Column(db.String(50), default='connected')
    last_sync = db.Column(db.DateTime)
    
    # Access Management
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    created_by = db.Column(db.String(36))  # User ID who created this
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
            'last_sync': self.last_sync.isoformat() + 'Z' if self.last_sync else None,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

# DataMart model for persistent storage
class DataMart(db.Model):
    """Data marts - persistent storage"""
    __tablename__ = 'data_marts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    data_source_id = db.Column(db.String(36))  # Link to data source
    definition = db.Column(db.JSON)  # Store as JSON
    status = db.Column(db.String(50), default='ready')
    
    # Access Management
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    created_by = db.Column(db.String(36))  # User ID who created this
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'data_source_id': self.data_source_id,
            'definition': self.definition or {},
            'status': self.status,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

# Dashboard model for AI-generated dashboards
class Dashboard(db.Model):
    """AI-generated dashboards - persistent storage"""
    __tablename__ = 'dashboards'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36))  # Link to user (optional for demo)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    spec = db.Column(db.JSON, nullable=False)  # Full dashboard JSON specification
    
    # Access Management
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    created_by = db.Column(db.String(36))  # User ID who created this
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'spec': self.spec or {},
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

class Scheduler(db.Model):
    """Scheduler for automated dashboard reports"""
    __tablename__ = 'schedulers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36))  # Link to user
    name = db.Column(db.String(200), nullable=False)
    dashboard_id = db.Column(db.String(36), db.ForeignKey('dashboards.id'), nullable=False)
    
    # Delivery settings
    delivery_method = db.Column(db.String(50), nullable=False)  # email, whatsapp, slack
    recipients_email = db.Column(db.Text)  # Comma-separated emails
    recipients_mobile = db.Column(db.Text)  # Comma-separated mobile numbers
    subject = db.Column(db.String(300))
    message = db.Column(db.Text)
    
    # Schedule settings
    frequency = db.Column(db.String(50), nullable=False)  # daily, weekly, monthly, custom
    schedule_time = db.Column(db.String(10))  # HH:MM format
    day_of_week = db.Column(db.Integer)  # 0-6 for weekly (0=Monday)
    day_of_month = db.Column(db.Integer)  # 1-31 for monthly
    custom_cron = db.Column(db.String(100))  # Custom cron expression
    timezone = db.Column(db.String(50), default='UTC')
    
    # Delivery format
    format_pdf = db.Column(db.Boolean, default=True)
    format_excel = db.Column(db.Boolean, default=False)
    format_inline = db.Column(db.Boolean, default=False)
    
    # Status
    status = db.Column(db.String(50), default='active')  # active, paused, error
    last_run = db.Column(db.DateTime)
    next_run = db.Column(db.DateTime)
    last_status = db.Column(db.String(50))  # success, failed
    last_error = db.Column(db.Text)
    
    # Access Management
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    created_by = db.Column(db.String(36))  # User ID who created this
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'dashboard_id': self.dashboard_id,
            'delivery_method': self.delivery_method,
            'recipients_email': self.recipients_email,
            'recipients_mobile': self.recipients_mobile,
            'subject': self.subject,
            'message': self.message,
            'frequency': self.frequency,
            'schedule_time': self.schedule_time,
            'day_of_week': self.day_of_week,
            'day_of_month': self.day_of_month,
            'custom_cron': self.custom_cron,
            'timezone': self.timezone,
            'format_pdf': self.format_pdf,
            'format_excel': self.format_excel,
            'format_inline': self.format_inline,
            'status': self.status,
            'last_run': self.last_run.isoformat() + 'Z' if self.last_run else None,
            'next_run': self.next_run.isoformat() + 'Z' if self.next_run else None,
            'last_status': self.last_status,
            'last_error': self.last_error,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

# Pipeline model for data pipelines
class Pipeline(db.Model):
    """Data pipelines - persistent storage"""
    __tablename__ = 'pipelines'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False, unique=True)
    description = db.Column(db.Text)
    source_id = db.Column(db.String(36))  # Reference to data_sources
    source_table = db.Column(db.String(255))
    destination_id = db.Column(db.String(36))  # Reference to data_sources
    destination_table = db.Column(db.String(255))
    mode = db.Column(db.String(50), default='batch')  # batch or realtime
    schedule = db.Column(db.String(100))  # Cron expression
    status = db.Column(db.String(50), default='inactive')  # active, inactive, running, failed
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_run_at = db.Column(db.DateTime)
    
    # Access Management
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'source_id': self.source_id,
            'source_table': self.source_table,
            'destination_id': self.destination_id,
            'destination_table': self.destination_table,
            'mode': self.mode,
            'schedule': self.schedule,
            'status': self.status,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'last_run_at': self.last_run_at.isoformat() + 'Z' if self.last_run_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

# Pipeline run history
class PipelineRun(db.Model):
    """Pipeline run history - persistent storage"""
    __tablename__ = 'pipeline_runs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pipeline_id = db.Column(db.String(36), db.ForeignKey('pipelines.id'), nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, running, success, failed
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    records_processed = db.Column(db.Integer, default=0)
    records_failed = db.Column(db.Integer, default=0)
    log = db.Column(db.Text)
    error_message = db.Column(db.Text)
    triggered_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'pipeline_id': self.pipeline_id,
            'status': self.status,
            'start_time': self.start_time.isoformat() + 'Z' if self.start_time else None,
            'end_time': self.end_time.isoformat() + 'Z' if self.end_time else None,
            'records_processed': self.records_processed,
            'records_failed': self.records_failed,
            'log': self.log,
            'error_message': self.error_message
        }

# Alert Management System Models
class Alert(db.Model):
    """Alert definitions for monitoring data sources, pipelines, queries, dashboards, and SLAs"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Alert condition
    condition_type = db.Column(db.String(50), nullable=False)  # 'datasource_failure', 'pipeline_failure', 'query_slow', 'dashboard_failure', 'sla_breach'
    condition_config = db.Column(db.JSON, default=dict)  # Threshold values, target IDs, etc.
    
    # Notification channels
    channels = db.Column(db.JSON, default=list)  # ['email', 'slack', 'teams', 'whatsapp']
    recipients = db.Column(db.JSON, default=dict)  # {'email': ['...'], 'slack': 'webhook_url', ...}
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    last_triggered_at = db.Column(db.DateTime)
    trigger_count = db.Column(db.Integer, default=0)
    
    # Metadata
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'condition_type': self.condition_type,
            'condition_config': self.condition_config or {},
            'channels': self.channels or [],
            'recipients': self.recipients or {},
            'is_active': self.is_active,
            'last_triggered_at': self.last_triggered_at.isoformat() + 'Z' if self.last_triggered_at else None,
            'trigger_count': self.trigger_count or 0,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

class AlertHistory(db.Model):
    """History of alert triggers"""
    __tablename__ = 'alert_history'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id = db.Column(db.String(36), db.ForeignKey('alerts.id'), nullable=False)
    
    # Trigger details
    triggered_at = db.Column(db.DateTime, default=datetime.utcnow)
    condition_met = db.Column(db.JSON)  # Details of what triggered the alert
    severity = db.Column(db.String(20), default='warning')  # 'info', 'warning', 'critical'
    
    # Notification status
    notifications_sent = db.Column(db.JSON, default=dict)  # {'email': True, 'slack': False, ...}
    notification_errors = db.Column(db.JSON, default=dict)  # Error messages if any
    
    # Resolution
    resolved_at = db.Column(db.DateTime)
    resolved_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    resolution_notes = db.Column(db.Text)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'alert_id': self.alert_id,
            'triggered_at': self.triggered_at.isoformat() + 'Z' if self.triggered_at else None,
            'condition_met': self.condition_met or {},
            'severity': self.severity,
            'notifications_sent': self.notifications_sent or {},
            'notification_errors': self.notification_errors or {},
            'resolved_at': self.resolved_at.isoformat() + 'Z' if self.resolved_at else None,
            'resolved_by': self.resolved_by,
            'resolution_notes': self.resolution_notes
        }

class UploadConfiguration(db.Model):
    """Upload configuration for file uploads"""
    __tablename__ = 'upload_configurations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36))  # Link to user
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # File settings
    file_format = db.Column(db.String(50), nullable=False)  # csv, excel, json
    file_encoding = db.Column(db.String(50), default='utf-8')
    delimiter = db.Column(db.String(10), default=',')  # For CSV
    has_header = db.Column(db.Boolean, default=True)
    
    # Destination settings
    data_source_id = db.Column(db.String(36), db.ForeignKey('data_sources.id'), nullable=False)
    table_name = db.Column(db.String(255), nullable=False)
    upload_mode = db.Column(db.String(50), default='append')  # append, replace, upsert
    
    # Validation rules (JSON)
    validation_rules = db.Column(db.JSON, default=dict)  # Column validations, data type checks, etc.
    # Example: {"column_name": {"type": "string", "required": true, "min_length": 1, "max_length": 100}}
    
    # Transformation rules (JSON)
    transformation_rules = db.Column(db.JSON, default=dict)  # Column mappings, transformations
    # Example: {"source_column": "target_column", "rename": {"old": "new"}, "defaults": {"column": "value"}}
    
    # Conditions (JSON)
    conditions = db.Column(db.JSON, default=dict)  # Upload conditions like max file size, allowed extensions
    # Example: {"max_file_size_mb": 50, "allowed_extensions": ["csv", "xlsx"], "skip_rows": 0}
    
    # Sample file
    sample_file_name = db.Column(db.String(500))
    sample_file_path = db.Column(db.String(1000))
    sample_file_size = db.Column(db.Integer)
    
    # Status
    status = db.Column(db.String(50), default='active')  # active, inactive
    is_active = db.Column(db.Boolean, default=True)
    
    # Upload statistics
    total_uploads = db.Column(db.Integer, default=0)
    last_upload_at = db.Column(db.DateTime)
    
    # Access Management
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    created_by = db.Column(db.String(36))  # User ID who created this
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'file_format': self.file_format,
            'file_encoding': self.file_encoding,
            'delimiter': self.delimiter,
            'has_header': self.has_header,
            'data_source_id': self.data_source_id,
            'table_name': self.table_name,
            'upload_mode': self.upload_mode,
            'validation_rules': self.validation_rules,
            'transformation_rules': self.transformation_rules,
            'conditions': self.conditions,
            'sample_file_name': self.sample_file_name,
            'sample_file_path': self.sample_file_path,
            'sample_file_size': self.sample_file_size,
            'status': self.status,
            'is_active': self.is_active,
            'total_uploads': self.total_uploads,
            'last_upload_at': self.last_upload_at.isoformat() + 'Z' if self.last_upload_at else None,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'created_by': self.created_by
        }

class UploadHistory(db.Model):
    """Upload history tracking"""
    __tablename__ = 'upload_history'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    configuration_id = db.Column(db.String(36), db.ForeignKey('upload_configurations.id'))
    user_id = db.Column(db.String(36))
    
    # File details
    file_name = db.Column(db.String(500))
    file_size = db.Column(db.Integer)
    file_path = db.Column(db.String(1000))
    
    # Processing details
    status = db.Column(db.String(50), default='processing')  # processing, success, failed, partial
    records_total = db.Column(db.Integer, default=0)
    records_processed = db.Column(db.Integer, default=0)
    records_success = db.Column(db.Integer, default=0)
    records_failed = db.Column(db.Integer, default=0)
    
    # Error tracking
    error_message = db.Column(db.Text)
    error_details = db.Column(db.JSON)
    
    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'configuration_id': self.configuration_id,
            'user_id': self.user_id,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'status': self.status,
            'records_total': self.records_total,
            'records_processed': self.records_processed,
            'records_success': self.records_success,
            'records_failed': self.records_failed,
            'error_message': self.error_message,
            'error_details': self.error_details,
            'started_at': self.started_at.isoformat() + 'Z' if self.started_at else None,
            'completed_at': self.completed_at.isoformat() + 'Z' if self.completed_at else None
        }

# =============================================
# ACCESS MANAGEMENT MODELS (Multi-Tenant RBAC)
# =============================================

class Organization(db.Model):
    """Organizations (Client Companies) - Multi-tenant support"""
    __tablename__ = 'organizations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)  # URL-friendly identifier
    domain = db.Column(db.String(255))  # Email domain for auto-assignment (e.g., "datamantri.com")
    
    # Branding
    logo_url = db.Column(db.String(500))
    theme_config = db.Column(db.JSON)  # Custom theme colors, etc.
    
    # Plan & Limits
    plan_type = db.Column(db.String(50), default='free')  # free, professional, enterprise
    max_users = db.Column(db.Integer, default=10)
    max_data_sources = db.Column(db.Integer, default=5)
    max_dashboards = db.Column(db.Integer, default=20)
    features = db.Column(db.JSON, default=dict)  # Feature flags: {"ai_dashboard": true, "pipelines": true}
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_trial = db.Column(db.Boolean, default=False)
    trial_ends_at = db.Column(db.DateTime)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(36))  # DataMantri super admin who created it
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'domain': self.domain,
            'logo_url': self.logo_url,
            'theme_config': self.theme_config,
            'plan_type': self.plan_type,
            'max_users': self.max_users,
            'max_data_sources': self.max_data_sources,
            'max_dashboards': self.max_dashboards,
            'features': self.features,
            'is_active': self.is_active,
            'is_trial': self.is_trial,
            'trial_ends_at': self.trial_ends_at.isoformat() + 'Z' if self.trial_ends_at else None,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'created_by': self.created_by
        }

class Role(db.Model):
    """Roles for RBAC - System-level and Organization-level"""
    __tablename__ = 'roles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)  # super_admin, org_admin, developer, viewer
    display_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Scope
    level = db.Column(db.String(50), nullable=False)  # 'platform' or 'organization'
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=True)
    
    # System roles cannot be deleted or modified
    is_system = db.Column(db.Boolean, default=False)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'level': self.level,
            'organization_id': self.organization_id,
            'is_system': self.is_system,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

class Permission(db.Model):
    """Granular permissions for RBAC"""
    __tablename__ = 'permissions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resource = db.Column(db.String(100), nullable=False)  # datasources, datamarts, dashboards, etc.
    action = db.Column(db.String(50), nullable=False)  # create, read, update, delete, manage
    code = db.Column(db.String(200), unique=True, nullable=False)  # datasources.create, dashboards.read
    description = db.Column(db.Text)
    category = db.Column(db.String(100))  # data_management, analytics, admin, system
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'resource': self.resource,
            'action': self.action,
            'code': self.code,
            'description': self.description,
            'category': self.category,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None
        }

class RolePermission(db.Model):
    """Many-to-many mapping between Roles and Permissions"""
    __tablename__ = 'role_permissions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    role_id = db.Column(db.String(36), db.ForeignKey('roles.id'), nullable=False)
    permission_id = db.Column(db.String(36), db.ForeignKey('permissions.id'), nullable=False)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'role_id': self.role_id,
            'permission_id': self.permission_id,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None
        }

class UserRole(db.Model):
    """Many-to-many mapping between Users and Roles (with organization context)"""
    __tablename__ = 'user_roles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    role_id = db.Column(db.String(36), db.ForeignKey('roles.id'), nullable=False)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False)
    
    # Audit
    granted_by = db.Column(db.String(36))  # User ID who assigned this role
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role_id': self.role_id,
            'organization_id': self.organization_id,
            'granted_by': self.granted_by,
            'granted_at': self.granted_at.isoformat() + 'Z' if self.granted_at else None
        }

class DataAccessPolicy(db.Model):
    """Row-level security policies for fine-grained data access control"""
    __tablename__ = 'data_access_policies'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Target (either user or role)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    role_id = db.Column(db.String(36), db.ForeignKey('roles.id'), nullable=True)
    
    # Resource
    resource_type = db.Column(db.String(50), nullable=False)  # data_source, data_mart, dashboard
    resource_id = db.Column(db.String(36), nullable=False)
    
    # Access level
    access_level = db.Column(db.String(50), nullable=False)  # full, read_only, restricted
    
    # Conditions for row-level filtering (JSON)
    conditions = db.Column(db.JSON)  # e.g., {"region": "North", "department": "Sales"}
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(36))
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role_id': self.role_id,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'access_level': self.access_level,
            'conditions': self.conditions,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'created_by': self.created_by
        }

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================
# EMAIL HELPER FUNCTIONS
# =====================

def send_email(to_emails, subject, body_html, body_text=None, attachments=None):
    """
    Send an email via SMTP
    
    Args:
        to_emails: List of email addresses or comma-separated string
        subject: Email subject
        body_html: HTML body content
        body_text: Plain text body (optional)
        attachments: List of dicts with 'filename' and 'data' keys (optional)
    
    Returns:
        tuple: (success: bool, error_message: str or None)
    """
    try:
        # Check if email is configured
        if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
            logger.warning("Email not configured. Skipping email send.")
            return False, "Email not configured. Please set MAIL_USERNAME and MAIL_PASSWORD environment variables."
        
        # Parse recipients
        if isinstance(to_emails, str):
            recipients = [email.strip() for email in to_emails.split(',')]
        else:
            recipients = to_emails
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = app.config['MAIL_DEFAULT_SENDER']
        msg['To'] = ', '.join(recipients)
        
        # Add body parts
        if body_text:
            part1 = MIMEText(body_text, 'plain')
            msg.attach(part1)
        
        if body_html:
            part2 = MIMEText(body_html, 'html')
            msg.attach(part2)
        
        # Add attachments if any
        if attachments:
            for attachment in attachments:
                part = MIMEApplication(attachment['data'])
                part.add_header('Content-Disposition', 'attachment', filename=attachment['filename'])
                msg.attach(part)
        
        # Send email
        with smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT']) as server:
            if app.config['MAIL_USE_TLS']:
                server.starttls()
            server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {recipients}")
        return True, None
        
    except smtplib.SMTPAuthenticationError as e:
        error_msg = "Email authentication failed. Please check MAIL_USERNAME and MAIL_PASSWORD."
        logger.error(f"SMTP Authentication Error: {e}")
        return False, error_msg
    except smtplib.SMTPException as e:
        error_msg = f"Failed to send email: {str(e)}"
        logger.error(f"SMTP Error: {e}")
        return False, error_msg
    except Exception as e:
        error_msg = f"Unexpected error sending email: {str(e)}"
        logger.error(f"Email Error: {e}")
        return False, error_msg

# Simple in-memory cache for schema data
SCHEMA_CACHE = {}
CACHE_TTL = 300  # 5 minutes

def get_cached_schema(cache_key):
    """Get schema from cache if available and not expired"""
    if cache_key in SCHEMA_CACHE:
        cached_data, timestamp = SCHEMA_CACHE[cache_key]
        if time.time() - timestamp < CACHE_TTL:
            logger.info(f"✅ Cache HIT for {cache_key} (age: {int(time.time() - timestamp)}s)")
            return cached_data
        else:
            logger.info(f"❌ Cache EXPIRED for {cache_key}")
            del SCHEMA_CACHE[cache_key]
    return None

def set_cached_schema(cache_key, data):
    """Store schema in cache"""
    SCHEMA_CACHE[cache_key] = (data, time.time())
    logger.info(f"💾 Cached schema for {cache_key}")

# ==============================================
# ACCESS MANAGEMENT HELPER FUNCTIONS & SEED DATA
# ==============================================

# Cache for user permissions (to avoid repeated DB queries)
USER_PERMISSIONS_CACHE = {}
PERMISSION_CACHE_TTL = 60  # 1 minute

def get_user_permissions(user_id):
    """Get all permissions for a user (cached)"""
    cache_key = f"permissions_{user_id}"
    
    # Check cache
    if cache_key in USER_PERMISSIONS_CACHE:
        cached_data, timestamp = USER_PERMISSIONS_CACHE[cache_key]
        if time.time() - timestamp < PERMISSION_CACHE_TTL:
            return cached_data
        else:
            del USER_PERMISSIONS_CACHE[cache_key]
    
    # Fetch from database
    permissions = set()
    
    # Get user's roles and their permissions
    user_roles = UserRole.query.filter_by(user_id=user_id).all()
    for user_role in user_roles:
        role_perms = RolePermission.query.filter_by(role_id=user_role.role_id).all()
        for role_perm in role_perms:
            permission = Permission.query.get(role_perm.permission_id)
            if permission:
                permissions.add(permission.code)
    
    # Cache the result
    USER_PERMISSIONS_CACHE[cache_key] = (permissions, time.time())
    return permissions

def clear_user_permissions_cache(user_id=None):
    """Clear permission cache for a specific user or all users"""
    if user_id:
        cache_key = f"permissions_{user_id}"
        if cache_key in USER_PERMISSIONS_CACHE:
            del USER_PERMISSIONS_CACHE[cache_key]
    else:
        USER_PERMISSIONS_CACHE.clear()

def has_permission(user_id, permission_code):
    """Check if user has a specific permission"""
    permissions = get_user_permissions(user_id)
    return permission_code in permissions

def require_permission(permission_code):
    """Decorator to check if current user has a specific permission"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
            
            # Super admin (demo user) has all permissions
            if str(current_user.id) == 'demo':
                return f(*args, **kwargs)
            
            # Check if user has the required permission
            if not has_permission(str(current_user.id), permission_code):
                return jsonify({
                    'status': 'error',
                    'message': f'Permission denied. Required permission: {permission_code}'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(role_names):
    """Decorator to check if current user has any of the specified roles"""
    if isinstance(role_names, str):
        role_names = [role_names]
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
            
            # Super admin (demo user) has all roles
            if str(current_user.id) == 'demo':
                return f(*args, **kwargs)
            
            # Get user's roles
            user_roles = UserRole.query.filter_by(user_id=str(current_user.id)).all()
            user_role_names = set()
            for user_role in user_roles:
                role = Role.query.get(user_role.role_id)
                if role:
                    user_role_names.add(role.name)
            
            # Check if user has any of the required roles
            if not any(role_name in user_role_names for role_name in role_names):
                return jsonify({
                    'status': 'error',
                    'message': f'Access denied. Required role(s): {", ".join(role_names)}'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_user_organization_id():
    """Get the organization ID for the current user"""
    if not current_user.is_authenticated:
        return None
    
    # Demo user has no specific organization (can see all)
    if str(current_user.id) == 'demo':
        return None
    
    # Get from user's organization_id
    if hasattr(current_user, 'organization_id'):
        return current_user.organization_id
    
    return None

def filter_by_organization(query, model):
    """Filter query by current user's organization (multi-tenant isolation)"""
    org_id = get_user_organization_id()
    
    # Super admin (demo user) can see all organizations
    if org_id is None and str(current_user.id) == 'demo':
        return query
    
    # Filter by organization
    if hasattr(model, 'organization_id'):
        return query.filter_by(organization_id=org_id)
    
    return query

def seed_default_data():
    """Seed database with default organizations, roles, and permissions"""
    try:
        logger.info("🌱 Seeding default access management data...")
        
        # 1. Create default DataMantri organization
        default_org = Organization.query.filter_by(slug='datamantri').first()
        if not default_org:
            default_org = Organization(
                id=str(uuid.uuid4()),
                name='DataMantri',
                slug='datamantri',
                domain='datamantri.com',
                plan_type='enterprise',
                max_users=999,
                max_data_sources=999,
                max_dashboards=999,
                features={'all': True},
                is_active=True
            )
            db.session.add(default_org)
            logger.info("✅ Created default organization: DataMantri")
        
        # 2. Create default permissions
        default_permissions = [
            # Platform management (Super Admin only)
            {'resource': 'platform', 'action': 'manage', 'code': 'platform.manage', 'description': 'Full platform access', 'category': 'system'},
            {'resource': 'organizations', 'action': 'create', 'code': 'organizations.create', 'description': 'Create new organizations', 'category': 'system'},
            {'resource': 'organizations', 'action': 'read', 'code': 'organizations.read', 'description': 'View organizations', 'category': 'system'},
            {'resource': 'organizations', 'action': 'update', 'code': 'organizations.update', 'description': 'Update organizations', 'category': 'system'},
            {'resource': 'organizations', 'action': 'delete', 'code': 'organizations.delete', 'description': 'Delete organizations', 'category': 'system'},
            
            # Organization management (Org Admin)
            {'resource': 'organization', 'action': 'manage', 'code': 'organization.manage', 'description': 'Manage own organization', 'category': 'admin'},
            {'resource': 'users', 'action': 'manage', 'code': 'users.manage', 'description': 'Manage users in organization', 'category': 'admin'},
            {'resource': 'roles', 'action': 'manage', 'code': 'roles.manage', 'description': 'Manage roles in organization', 'category': 'admin'},
            
            # Data Sources
            {'resource': 'datasources', 'action': 'create', 'code': 'datasources.create', 'description': 'Create data sources', 'category': 'data_management'},
            {'resource': 'datasources', 'action': 'read', 'code': 'datasources.read', 'description': 'View data sources', 'category': 'data_management'},
            {'resource': 'datasources', 'action': 'update', 'code': 'datasources.update', 'description': 'Update data sources', 'category': 'data_management'},
            {'resource': 'datasources', 'action': 'delete', 'code': 'datasources.delete', 'description': 'Delete data sources', 'category': 'data_management'},
            
            # Data Marts
            {'resource': 'datamarts', 'action': 'create', 'code': 'datamarts.create', 'description': 'Create data marts', 'category': 'data_management'},
            {'resource': 'datamarts', 'action': 'read', 'code': 'datamarts.read', 'description': 'View data marts', 'category': 'data_management'},
            {'resource': 'datamarts', 'action': 'update', 'code': 'datamarts.update', 'description': 'Update data marts', 'category': 'data_management'},
            {'resource': 'datamarts', 'action': 'delete', 'code': 'datamarts.delete', 'description': 'Delete data marts', 'category': 'data_management'},
            
            # Dashboards
            {'resource': 'dashboards', 'action': 'create', 'code': 'dashboards.create', 'description': 'Create dashboards', 'category': 'analytics'},
            {'resource': 'dashboards', 'action': 'read', 'code': 'dashboards.read', 'description': 'View dashboards', 'category': 'analytics'},
            {'resource': 'dashboards', 'action': 'update', 'code': 'dashboards.update', 'description': 'Update dashboards', 'category': 'analytics'},
            {'resource': 'dashboards', 'action': 'delete', 'code': 'dashboards.delete', 'description': 'Delete dashboards', 'category': 'analytics'},
            
            # Upload Configurations
            {'resource': 'upload_configs', 'action': 'create', 'code': 'upload_configs.create', 'description': 'Create upload configurations', 'category': 'data_management'},
            {'resource': 'upload_configs', 'action': 'read', 'code': 'upload_configs.read', 'description': 'View upload configurations', 'category': 'data_management'},
            {'resource': 'upload_configs', 'action': 'update', 'code': 'upload_configs.update', 'description': 'Update upload configurations', 'category': 'data_management'},
            {'resource': 'upload_configs', 'action': 'delete', 'code': 'upload_configs.delete', 'description': 'Delete upload configurations', 'category': 'data_management'},
            
            # Schedulers
            {'resource': 'schedulers', 'action': 'create', 'code': 'schedulers.create', 'description': 'Create schedulers', 'category': 'analytics'},
            {'resource': 'schedulers', 'action': 'read', 'code': 'schedulers.read', 'description': 'View schedulers', 'category': 'analytics'},
            {'resource': 'schedulers', 'action': 'update', 'code': 'schedulers.update', 'description': 'Update schedulers', 'category': 'analytics'},
            {'resource': 'schedulers', 'action': 'delete', 'code': 'schedulers.delete', 'description': 'Delete schedulers', 'category': 'analytics'},
        ]
        
        permission_map = {}
        for perm_data in default_permissions:
            perm = Permission.query.filter_by(code=perm_data['code']).first()
            if not perm:
                perm = Permission(
                    id=str(uuid.uuid4()),
                    **perm_data
                )
                db.session.add(perm)
            permission_map[perm_data['code']] = perm
        
        db.session.flush()  # Flush to get IDs
        logger.info(f"✅ Created/verified {len(default_permissions)} permissions")
        
        # 3. Create default roles
        default_roles = [
            {
                'name': 'super_admin',
                'display_name': 'Super Admin',
                'description': 'DataMantri platform administrator with full access',
                'level': 'platform',
                'organization_id': None,
                'is_system': True,
                'permissions': ['platform.manage'] + [p['code'] for p in default_permissions]  # All permissions
            },
            {
                'name': 'org_admin',
                'display_name': 'Organization Admin',
                'description': 'Organization administrator with full access to their organization',
                'level': 'organization',
                'organization_id': None,  # Template role, will be copied per org
                'is_system': True,
                'permissions': [
                    'organization.manage', 'users.manage', 'roles.manage',
                    'datasources.create', 'datasources.read', 'datasources.update', 'datasources.delete',
                    'datamarts.create', 'datamarts.read', 'datamarts.update', 'datamarts.delete',
                    'dashboards.create', 'dashboards.read', 'dashboards.update', 'dashboards.delete',
                    'upload_configs.create', 'upload_configs.read', 'upload_configs.update', 'upload_configs.delete',
                    'schedulers.create', 'schedulers.read', 'schedulers.update', 'schedulers.delete'
                ]
            },
            {
                'name': 'developer',
                'display_name': 'Developer/Creator',
                'description': 'Can create and manage data sources, marts, dashboards',
                'level': 'organization',
                'organization_id': None,
                'is_system': True,
                'permissions': [
                    'datasources.create', 'datasources.read', 'datasources.update', 'datasources.delete',
                    'datamarts.create', 'datamarts.read', 'datamarts.update', 'datamarts.delete',
                    'dashboards.create', 'dashboards.read', 'dashboards.update', 'dashboards.delete',
                    'upload_configs.create', 'upload_configs.read', 'upload_configs.update', 'upload_configs.delete',
                    'schedulers.create', 'schedulers.read', 'schedulers.update', 'schedulers.delete'
                ]
            },
            {
                'name': 'viewer',
                'display_name': 'Viewer/Analyst',
                'description': 'Read-only access to dashboards and reports',
                'level': 'organization',
                'organization_id': None,
                'is_system': True,
                'permissions': [
                    'dashboards.read',
                    'datamarts.read',
                    'datasources.read',
                    'schedulers.read'
                ]
            }
        ]
        
        for role_data in default_roles:
            permissions = role_data.pop('permissions')
            role = Role.query.filter_by(name=role_data['name'], level=role_data['level']).first()
            
            if not role:
                role = Role(id=str(uuid.uuid4()), **role_data)
                db.session.add(role)
                db.session.flush()
                
                # Assign permissions to role
                for perm_code in permissions:
                    if perm_code in permission_map:
                        role_perm = RolePermission(
                            id=str(uuid.uuid4()),
                            role_id=role.id,
                            permission_id=permission_map[perm_code].id
                        )
                        db.session.add(role_perm)
                
                logger.info(f"✅ Created role: {role.display_name} with {len(permissions)} permissions")
        
        # 4. Create demo super admin user
        demo_user = User.query.filter_by(email='demo@datamantri.com').first()
        if not demo_user:
            from werkzeug.security import generate_password_hash
            demo_user = User(
                id='demo',
                email='demo@datamantri.com',
                password_hash=generate_password_hash('demo123'),
                first_name='Demo',
                last_name='User',
                role='SUPER_ADMIN',
                is_active=True,
                is_admin=True,
                organization_id=default_org.id
            )
            db.session.add(demo_user)
            logger.info("✅ Created demo super admin user")
        
        db.session.commit()
        logger.info("🎉 Access management seed data completed!")
        
    except Exception as e:
        logger.exception(f"Failed to seed access management data: {e}")
        db.session.rollback()

def migrate_existing_data_to_organizations():
    """Migrate existing data to default organization"""
    try:
        logger.info("🔄 Migrating existing data to organizations...")
        
        # Get or create default organization
        default_org = Organization.query.filter_by(slug='datamantri').first()
        if not default_org:
            logger.error("Default organization not found! Run seed_default_data() first.")
            return
        
        # Migrate users
        users_updated = 0
        for user in User.query.filter_by(organization_id=None).all():
            user.organization_id = default_org.id
            users_updated += 1
        
        # Migrate data sources
        sources_updated = 0
        for source in DataSource.query.filter_by(organization_id=None).all():
            source.organization_id = default_org.id
            sources_updated += 1
        
        # Migrate data marts
        marts_updated = 0
        for mart in DataMart.query.filter_by(organization_id=None).all():
            mart.organization_id = default_org.id
            marts_updated += 1
        
        # Migrate dashboards
        dashboards_updated = 0
        for dashboard in Dashboard.query.filter_by(organization_id=None).all():
            dashboard.organization_id = default_org.id
            dashboards_updated += 1
        
        # Migrate schedulers
        schedulers_updated = 0
        for scheduler in Scheduler.query.filter_by(organization_id=None).all():
            scheduler.organization_id = default_org.id
            schedulers_updated += 1
        
        # Migrate upload configurations
        configs_updated = 0
        for config in UploadConfiguration.query.filter_by(organization_id=None).all():
            config.organization_id = default_org.id
            configs_updated += 1
        
        db.session.commit()
        logger.info(f"✅ Migration complete: {users_updated} users, {sources_updated} sources, {marts_updated} marts, {dashboards_updated} dashboards, {schedulers_updated} schedulers, {configs_updated} configs")
        
    except Exception as e:
        logger.exception(f"Failed to migrate data: {e}")
        db.session.rollback()

# Routes
@app.route('/api/auth/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json(silent=True) or {}
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'status': 'error', 'message': 'Email and password required'}), 400
        
        logger.info(f"/api/auth/login attempt for {email}")

        # Check for demo credentials first
        # Load user from database (including demo user)
        user = User.query.filter_by(email=email).first()
        if not user:
            logger.info(f"Login user not found: {email}")
        else:
            logger.info(f"Login user found: active={getattr(user, 'is_active', None)}")
        if user and user.is_active and _password_matches(user.password_hash, password):
            login_user(user, remember=True)
            # Update last login, but don't fail login if column missing in DB
            try:
                user.last_login_at = datetime.utcnow()
                db.session.commit()
            except Exception as commit_err:
                logger.error(f"Login commit failed (non-fatal): {commit_err}")
                db.session.rollback()
            
            # Get organization name
            org_name = None
            if user.organization_id:
                org = Organization.query.get(user.organization_id)
                if org:
                    org_name = org.name
            
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'is_admin': user.is_admin,
                    'organization_name': org_name,
                    'must_reset_password': getattr(user, 'must_reset_password', False)
                },
                'must_reset_password': getattr(user, 'must_reset_password', False)
            })
        else:
            logger.error(f"Login failed for {email}")
            return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401
    except Exception as e:
        logger.exception(f"/api/auth/login failed: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/demo-login', methods=['POST'])
def demo_login():
    try:
        demo_user = DemoUser()
        login_user(demo_user, remember=True)
        return jsonify({'status': 'success', 'message': 'Demo login successful'})
    except Exception as e:
        logger.exception(f"/api/auth/demo-login failed: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/session', methods=['GET'])
def get_session():
    try:
        if not current_user.is_authenticated:
            return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
        
        # Get organization name from database
        org_name = None
        if hasattr(current_user, 'organization_id') and current_user.organization_id:
            org = Organization.query.get(current_user.organization_id)
            if org:
                org_name = org.name
        
        return jsonify({
            'status': 'success',
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'role': getattr(current_user, 'role', 'ADMIN'),
                'is_admin': getattr(current_user, 'is_admin', True),
                'organization_name': org_name,
                'organization_logo_url': getattr(current_user, 'organization_logo_url', None),
                'must_reset_password': getattr(current_user, 'must_reset_password', False)
            }
        })
    except Exception as e:
        logger.exception(f"/api/session failed: {e}")
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'status': 'success', 'message': 'Logout successful.'})

# Data Sources API - Using real database
@app.route('/api/data-sources', methods=['GET', 'POST'])
@login_required
def data_sources():
    if request.method == 'GET':
        # Get all data sources from database
        sources = DataSource.query.all()
        return jsonify([source.to_dict() for source in sources])
    
    elif request.method == 'POST':
        try:
            data = request.json
            
            # Handle both flat and nested connection_params formats
            connection_params = data.get('connection_params', {})
            if connection_params:
                # Frontend sends nested format
                host = connection_params.get('host', 'localhost')
                port = connection_params.get('port', 5432)
                database = connection_params.get('database', 'database')
                username = connection_params.get('user') or connection_params.get('username')
                password = connection_params.get('password')
            else:
                # Legacy flat format
                host = data.get('host', 'localhost')
                port = data.get('port', 5432)
                database = data.get('database', 'database')
                username = data.get('username')
                password = data.get('password')
            
            # Map 'postgres' to 'postgresql' for connection_type
            conn_type = data.get('type') or data.get('connection_type', 'postgresql')
            if conn_type == 'postgres':
                conn_type = 'postgresql'
            
            new_source = DataSource(
                id=str(uuid.uuid4()),
                name=data.get('name', 'New Data Source'),
                connection_type=conn_type,
                host=host,
                port=port,
                database=database,
                username=username,
                password=password,
                status='connected'
            )
            db.session.add(new_source)
            db.session.commit()
            logger.info(f"Created data source: {new_source.name} (ID: {new_source.id}) - {host}:{port}/{database}")
            return jsonify(new_source.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create data source: {e}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/data-sources/<source_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def data_source(source_id):
    source = DataSource.query.get(source_id)
    
    if request.method == 'GET':
        if source:
            return jsonify(source.to_dict())
        return jsonify({'error': 'Data source not found'}), 404
    
    elif request.method == 'PUT':
        if source:
            try:
                data = request.json
                
                # Handle both flat and nested connection_params formats
                connection_params = data.get('connection_params', {})
                if connection_params:
                    # Frontend sends nested format
                    host = connection_params.get('host', source.host)
                    port = connection_params.get('port', source.port)
                    database = connection_params.get('database', source.database)
                    username = connection_params.get('user') or connection_params.get('username', source.username)
                    password = connection_params.get('password')
                else:
                    # Legacy flat format
                    host = data.get('host', source.host)
                    port = data.get('port', source.port)
                    database = data.get('database', source.database)
                    username = data.get('username', source.username)
                    password = data.get('password')
                
                # Update fields
                source.name = data.get('name', source.name)
                
                # Map 'postgres' to 'postgresql'
                conn_type = data.get('type') or data.get('connection_type', source.connection_type)
                if conn_type == 'postgres':
                    conn_type = 'postgresql'
                source.connection_type = conn_type
                
                source.host = host
                source.port = port
                source.database = database
                source.username = username
                if password:
                    source.password = password
                source.updated_at = datetime.utcnow()
                db.session.commit()
                logger.info(f"Updated data source: {source.name} (ID: {source.id}) - {host}:{port}/{database}")
                return jsonify(source.to_dict())
            except Exception as e:
                db.session.rollback()
                logger.error(f"Failed to update data source: {e}")
                return jsonify({'error': str(e)}), 500
        return jsonify({'error': 'Data source not found'}), 404
    
    elif request.method == 'DELETE':
        if source:
            try:
                db.session.delete(source)
                db.session.commit()
                logger.info(f"Deleted data source: {source.name} (ID: {source.id})")
                return jsonify({'status': 'success', 'message': 'Data source deleted'})
            except Exception as e:
                db.session.rollback()
                logger.error(f"Failed to delete data source: {e}")
                return jsonify({'error': str(e)}), 500
        return jsonify({'error': 'Data source not found'}), 404

def fetch_real_database_schema(data_source):
    """Fetch real schema from actual database connection"""
    from sqlalchemy import create_engine, inspect, text
    from urllib.parse import quote_plus
    
    try:
        # Build connection URL based on data source type
        connection_type = data_source.connection_type.lower()
        host = data_source.host or 'localhost'
        port = data_source.port
        database = data_source.database
        username = data_source.username or ''
        password = data_source.password or ''
        
        if connection_type == 'postgresql':
            password_encoded = quote_plus(password) if password else ''
            # Add gssencmode=disable to avoid GSSAPI authentication issues
            conn_url = f"postgresql://{username}:{password_encoded}@{host}:{port}/{database}?gssencmode=disable"
        elif connection_type == 'mysql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"mysql+pymysql://{username}:{password_encoded}@{host}:{port}/{database}"
        elif connection_type == 'sqlite':
            conn_url = f"sqlite:///{database}"
        else:
            raise ValueError(f"Unsupported database type: {connection_type}")
        
        logger.info(f"Connecting to {connection_type} database at {host}:{port}/{database}")
        
        # Create engine and inspector
        engine = create_engine(conn_url, pool_pre_ping=True, connect_args={'connect_timeout': 10})
        inspector = inspect(engine)
        
        # Get all tables
        table_names = inspector.get_table_names()
        logger.info(f"Found {len(table_names)} tables in {data_source.name}")
        
        schema_data = {}
        
        for table_name in table_names:
            # Get columns for this table
            columns = inspector.get_columns(table_name)
            primary_keys = inspector.get_pk_constraint(table_name).get('constrained_columns', [])
            
            # Format columns
            formatted_columns = []
            for col in columns:
                formatted_col = {
                    'name': col['name'],
                    'type': str(col['type']),
                    'nullable': col['nullable'],
                    'key': 'PRI' if col['name'] in primary_keys else '',
                    'default': str(col['default']) if col.get('default') is not None else None
                }
                formatted_columns.append(formatted_col)
            
            # Skip row count for performance - can be fetched on-demand later
            schema_data[table_name] = {
                'columns': formatted_columns,
                'metadata': {
                    'row_count': None,  # Skip for performance - load on-demand
                    'column_count': len(formatted_columns),
                    'size': 'N/A'
                }
            }
        
        engine.dispose()
        return {'status': 'success', 'schema': schema_data}
        
    except Exception as e:
        logger.exception(f"Failed to fetch real schema: {e}")
        return {'status': 'error', 'message': f'Failed to connect to database: {str(e)}'}

@app.route('/api/data-sources/<source_id>/schema', methods=['GET'])
def data_source_schema(source_id):
    """Fetch REAL schema from the actual database connection with CACHING"""
    try:
        # Get the data source from database
        data_source = DataSource.query.get(source_id)
        
        if not data_source:
            return jsonify({'status': 'error', 'message': 'Data source not found'}), 404
        
        # Check cache first
        cache_key = f"schema_{source_id}"
        cached_result = get_cached_schema(cache_key)
        if cached_result:
            return jsonify(cached_result)
        
        logger.info(f"Fetching REAL schema for data source: {data_source.name} ({data_source.connection_type})")
        start_time = time.time()
        
        # Fetch real schema from the actual database
        result = fetch_real_database_schema(data_source)
        
        elapsed = time.time() - start_time
        
        if result['status'] == 'success':
            logger.info(f"✅ Successfully fetched schema with {len(result['schema'])} tables in {elapsed:.2f}s")
            # Cache the result
            set_cached_schema(cache_key, result)
            return jsonify(result)
        else:
            logger.error(f"Schema fetch failed: {result.get('message')}")
            return jsonify(result), 500
            
    except Exception as e:
        logger.exception(f"Schema fetch error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/data-sources/<source_id>/tables', methods=['GET'])
def data_source_tables(source_id):
    """Fetch REAL table names from the actual database"""
    try:
        # Get the data source from database
        data_source = DataSource.query.get(source_id)
        
        if not data_source:
            return jsonify({'status': 'error', 'message': 'Data source not found'}), 404
        
        # Use the same connection logic but only fetch table names
        from sqlalchemy import create_engine, inspect
        from urllib.parse import quote_plus
        
        connection_type = data_source.connection_type.lower()
        host = data_source.host or 'localhost'
        port = data_source.port
        database = data_source.database
        username = data_source.username or ''
        password = data_source.password or ''
        
        if connection_type == 'postgresql':
            password_encoded = quote_plus(password) if password else ''
            # Add gssencmode=disable to avoid GSSAPI authentication issues
            conn_url = f"postgresql://{username}:{password_encoded}@{host}:{port}/{database}?gssencmode=disable"
        elif connection_type == 'mysql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"mysql+pymysql://{username}:{password_encoded}@{host}:{port}/{database}"
        elif connection_type == 'sqlite':
            conn_url = f"sqlite:///{database}"
        else:
            raise ValueError(f"Unsupported database type: {connection_type}")
        
        engine = create_engine(conn_url, pool_pre_ping=True, connect_args={'connect_timeout': 10})
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        engine.dispose()
        
        logger.info(f"Fetched {len(table_names)} tables from {data_source.name}")
        
        return jsonify({
            'status': 'success',
            'tables': table_names
        })
    except Exception as e:
        logger.exception(f"Tables fetch failed: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/data-sources/<source_id>/tables/<table_name>/columns', methods=['GET'])
def data_source_table_columns(source_id, table_name):
    """Fetch column names for a specific table"""
    try:
        # Get the data source from database
        data_source = DataSource.query.get(source_id)
        
        if not data_source:
            return jsonify({'status': 'error', 'message': 'Data source not found'}), 404
        
        from sqlalchemy import create_engine, inspect
        from urllib.parse import quote_plus
        
        connection_type = data_source.connection_type.lower()
        host = data_source.host or 'localhost'
        port = data_source.port
        database = data_source.database
        username = data_source.username or ''
        password = data_source.password or ''
        
        if connection_type == 'postgresql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"postgresql://{username}:{password_encoded}@{host}:{port}/{database}?gssencmode=disable"
        elif connection_type == 'mysql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"mysql+pymysql://{username}:{password_encoded}@{host}:{port}/{database}"
        elif connection_type == 'sqlite':
            conn_url = f"sqlite:///{database}"
        else:
            raise ValueError(f"Unsupported database type: {connection_type}")
        
        engine = create_engine(conn_url, pool_pre_ping=True, connect_args={'connect_timeout': 10})
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        column_names = [col['name'] for col in columns]
        engine.dispose()
        
        logger.info(f"Fetched {len(column_names)} columns from table {table_name}")
        
        return jsonify({
            'status': 'success',
            'columns': column_names
        })
            
    except Exception as e:
        logger.exception(f"Error fetching columns: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/data-sources/<source_id>/table/<table_name>/browse', methods=['GET'])
def browse_table_data(source_id, table_name):
    """Browse table data with pagination and search"""
    try:
        data_source = DataSource.query.get(source_id)
        if not data_source:
            return jsonify({'status': 'error', 'message': 'Data source not found'}), 404
        
        # Get pagination parameters
        limit = int(request.args.get('limit', 25))
        offset = int(request.args.get('offset', 0))
        search = request.args.get('search', '')
        
        from sqlalchemy import create_engine, text
        from urllib.parse import quote_plus
        
        # Build connection URL
        connection_type = data_source.connection_type.lower()
        host = data_source.host or 'localhost'
        port = data_source.port
        database = data_source.database
        username = data_source.username or ''
        password = data_source.password or ''
        
        if connection_type == 'postgresql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"postgresql://{username}:{password_encoded}@{host}:{port}/{database}?gssencmode=disable"
        elif connection_type == 'mysql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"mysql+pymysql://{username}:{password_encoded}@{host}:{port}/{database}"
        elif connection_type == 'sqlite':
            conn_url = f"sqlite:///{database}"
        else:
            raise ValueError(f"Unsupported database type: {connection_type}")
        
        engine = create_engine(conn_url, pool_pre_ping=True, connect_args={'connect_timeout': 10})
        
        with engine.connect() as conn:
            # Get total count
            count_query = text(f'SELECT COUNT(*) FROM "{table_name}"')
            total = conn.execute(count_query).scalar()
            
            # Get data with pagination
            if search:
                # Simple search across all columns (this is basic, can be enhanced)
                data_query = text(f'SELECT * FROM "{table_name}" WHERE CAST("{table_name}" AS TEXT) LIKE :search LIMIT :limit OFFSET :offset')
                result = conn.execute(data_query, {'search': f'%{search}%', 'limit': limit, 'offset': offset})
            else:
                data_query = text(f'SELECT * FROM "{table_name}" LIMIT :limit OFFSET :offset')
                result = conn.execute(data_query, {'limit': limit, 'offset': offset})
            
            # Convert to list of dicts
            columns = result.keys()
            data = [dict(zip(columns, row)) for row in result]
            
            # Convert any datetime/date objects to strings
            for row in data:
                for key, value in row.items():
                    if isinstance(value, (datetime, )):
                        row[key] = str(value)
        
        engine.dispose()
        
        return jsonify({
            'status': 'success',
            'data': data,
            'total': total,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        logger.exception(f"Failed to browse table data: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/data-sources/<source_id>/table/<table_name>/indexes', methods=['GET'])
def get_table_indexes(source_id, table_name):
    """Get indexes for a specific table"""
    try:
        data_source = DataSource.query.get(source_id)
        if not data_source:
            return jsonify({'status': 'error', 'message': 'Data source not found'}), 404
        
        from sqlalchemy import create_engine, inspect
        from urllib.parse import quote_plus
        
        # Build connection URL
        connection_type = data_source.connection_type.lower()
        host = data_source.host or 'localhost'
        port = data_source.port
        database = data_source.database
        username = data_source.username or ''
        password = data_source.password or ''
        
        if connection_type == 'postgresql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"postgresql://{username}:{password_encoded}@{host}:{port}/{database}?gssencmode=disable"
        elif connection_type == 'mysql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"mysql+pymysql://{username}:{password_encoded}@{host}:{port}/{database}"
        elif connection_type == 'sqlite':
            conn_url = f"sqlite:///{database}"
        else:
            raise ValueError(f"Unsupported database type: {connection_type}")
        
        engine = create_engine(conn_url, pool_pre_ping=True, connect_args={'connect_timeout': 10})
        inspector = inspect(engine)
        
        # Get indexes
        indexes = inspector.get_indexes(table_name)
        
        # Format indexes (ensure columns is always an array)
        formatted_indexes = []
        for idx in indexes:
            formatted_indexes.append({
                'name': idx.get('name', 'unnamed'),
                'columns': idx.get('column_names', []),
                'unique': idx.get('unique', False),
                'type': 'BTREE'  # Default, can be enhanced
            })
        
        engine.dispose()
        
        return jsonify({
            'status': 'success',
            'indexes': formatted_indexes
        })
        
    except Exception as e:
        logger.exception(f"Failed to fetch indexes: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/data-sources/<source_id>/table/<table_name>/foreign-keys', methods=['GET'])
def get_table_foreign_keys(source_id, table_name):
    """Get foreign keys for a specific table"""
    try:
        data_source = DataSource.query.get(source_id)
        if not data_source:
            return jsonify({'status': 'error', 'message': 'Data source not found'}), 404
        
        from sqlalchemy import create_engine, inspect
        from urllib.parse import quote_plus
        
        # Build connection URL
        connection_type = data_source.connection_type.lower()
        host = data_source.host or 'localhost'
        port = data_source.port
        database = data_source.database
        username = data_source.username or ''
        password = data_source.password or ''
        
        if connection_type == 'postgresql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"postgresql://{username}:{password_encoded}@{host}:{port}/{database}?gssencmode=disable"
        elif connection_type == 'mysql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"mysql+pymysql://{username}:{password_encoded}@{host}:{port}/{database}"
        elif connection_type == 'sqlite':
            conn_url = f"sqlite:///{database}"
        else:
            raise ValueError(f"Unsupported database type: {connection_type}")
        
        engine = create_engine(conn_url, pool_pre_ping=True, connect_args={'connect_timeout': 10})
        inspector = inspect(engine)
        
        # Get foreign keys
        foreign_keys = inspector.get_foreign_keys(table_name)
        
        # Format foreign keys (use camelCase for frontend consistency)
        formatted_fks = []
        for fk in foreign_keys:
            formatted_fks.append({
                'name': fk.get('name', 'N/A'),
                'columns': fk['constrained_columns'] if fk.get('constrained_columns') else [],
                'referencedTable': fk.get('referred_table', ''),
                'referencedColumns': fk.get('referred_columns', []),
                'onDelete': fk.get('options', {}).get('ondelete', 'NO ACTION'),
                'onUpdate': fk.get('options', {}).get('onupdate', 'NO ACTION')
            })
        
        engine.dispose()
        
        return jsonify({
            'status': 'success',
            'foreign_keys': formatted_fks
        })
        
    except Exception as e:
        logger.exception(f"Failed to fetch foreign keys: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/data-sources/test', methods=['POST'])
@login_required
def test_data_source():
    """Test a data source connection without saving it"""
    try:
        data = request.json
        
        # Handle both flat and nested connection_params formats
        connection_params = data.get('connection_params', {})
        if connection_params:
            # Frontend sends nested format
            host = connection_params.get('host', 'localhost')
            port = connection_params.get('port', 5432)
            database = connection_params.get('database', 'database')
            username = connection_params.get('user') or connection_params.get('username')
            password = connection_params.get('password', '')
        else:
            # Legacy flat format
            host = data.get('host', 'localhost')
            port = data.get('port', 5432)
            database = data.get('database', 'database')
            username = data.get('username')
            password = data.get('password', '')
        
        conn_type = data.get('type') or data.get('connection_type', 'postgresql')
        if conn_type == 'postgres':
            conn_type = 'postgresql'
        
        # Try actual connection test
        from sqlalchemy import create_engine
        from urllib.parse import quote_plus
        
        if conn_type == 'postgresql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"postgresql://{username}:{password_encoded}@{host}:{port}/{database}?gssencmode=disable"
        elif conn_type == 'mysql':
            password_encoded = quote_plus(password) if password else ''
            conn_url = f"mysql+pymysql://{username}:{password_encoded}@{host}:{port}/{database}"
        else:
            # For unsupported types, just return success
            return jsonify({
                'status': 'success',
                'message': 'Connection test not implemented for this database type',
                'details': {'host': host, 'database': database, 'connection_type': conn_type}
            })
        
        # Test the connection
        engine = create_engine(conn_url, connect_args={'connect_timeout': 5})
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        
        logger.info(f"✅ Connection test successful: {host}:{port}/{database}")
        return jsonify({
            'status': 'success',
            'message': 'Connection successful!',
            'details': {'host': host, 'port': port, 'database': database, 'connection_type': conn_type}
        })
        
    except Exception as e:
        logger.error(f"❌ Connection test failed: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Connection failed: {str(e)}'
        }), 400

def rewrite_datamart_query(query, data_source_id):
    """
    Rewrite SQL query to replace data mart references with their underlying definitions.
    For example:
        SELECT * FROM PMI_Digital_sales LIMIT 100
    Becomes:
        SELECT * FROM (SELECT * FROM aggregated_data UNION SELECT * FROM aggregated_data_today) AS PMI_Digital_sales LIMIT 100
    """
    try:
        # Get all data marts for this data source
        data_marts = DataMart.query.filter_by(data_source_id=data_source_id).all()
        
        if not data_marts:
            return query  # No data marts to rewrite
        
        import re
        modified_query = query
        
        for mart in data_marts:
            mart_name = mart.name
            definition = mart.definition
            
            if not definition or not isinstance(definition, dict):
                continue
            
            # Check if this data mart is referenced in the query (case-insensitive)
            # Match patterns like: FROM mart_name, JOIN mart_name, INTO mart_name
            pattern = r'\b' + re.escape(mart_name) + r'\b'
            
            if not re.search(pattern, query, re.IGNORECASE):
                continue  # This data mart is not used in the query
            
            logger.info(f"🔄 Rewriting query - found data mart reference: {mart_name}")
            
            # Build the underlying query from the data mart definition
            tables = definition.get('tables', [])
            unions = definition.get('unions', [])
            
            if unions:
                # This is a UNION-based data mart
                union_queries = []
                for table in tables:
                    # Get columns for this table if specified
                    table_columns = definition.get('columns', {}).get(table, [])
                    
                    if table_columns:
                        cols = ', '.join(table_columns)
                        union_queries.append(f"SELECT {cols} FROM {table}")
                    else:
                        union_queries.append(f"SELECT * FROM {table}")
                
                # Join with UNION (or UNION ALL based on definition)
                underlying_query = ' UNION '.join(union_queries)
                
            elif len(tables) > 1:
                # Multiple tables but no explicit union - treat as UNION
                union_queries = [f"SELECT * FROM {table}" for table in tables]
                underlying_query = ' UNION '.join(union_queries)
            
            elif len(tables) == 1:
                # Single table - just use it directly
                underlying_query = f"SELECT * FROM {tables[0]}"
            
            else:
                logger.warning(f"Data mart {mart_name} has no tables defined")
                continue
            
            # Replace the data mart name with a subquery
            # Pattern: FROM mart_name -> FROM (underlying_query) AS mart_name
            replacement = f"FROM ({underlying_query}) AS {mart_name}"
            modified_query = re.sub(
                r'\bFROM\s+' + re.escape(mart_name) + r'\b',
                replacement,
                modified_query,
                flags=re.IGNORECASE
            )
            
            # Also handle JOIN cases
            replacement = f"JOIN ({underlying_query}) AS {mart_name}"
            modified_query = re.sub(
                r'\bJOIN\s+' + re.escape(mart_name) + r'\b',
                replacement,
                modified_query,
                flags=re.IGNORECASE
            )
            
            logger.info(f"✅ Rewrote query - replaced {mart_name} with underlying UNION")
        
        if modified_query != query:
            logger.info(f"📝 Original query: {query}")
            logger.info(f"📝 Rewritten query: {modified_query}")
        
        return modified_query
        
    except Exception as e:
        logger.error(f"Failed to rewrite data mart query: {e}")
        return query  # Return original query if rewriting fails

@app.route('/api/data-marts/execute-query', methods=['POST'])
@login_required
def execute_query():
    """Execute SQL query against a data source"""
    try:
        data = request.json
        query = data.get('query', '')
        data_source_id = data.get('data_source_id')
        
        if not query:
            return jsonify({'status': 'error', 'error': 'Query is required'}), 400
            
        if not data_source_id:
            return jsonify({'status': 'error', 'error': 'Data source ID is required'}), 400
        
        # Check if query references any data marts and rewrite if needed
        query = rewrite_datamart_query(query, data_source_id)
        
        # Get data source
        source = DataSource.query.get(data_source_id)
        if not source:
            return jsonify({'status': 'error', 'error': 'Data source not found'}), 404
        
        # Build connection string
        if source.connection_type == 'postgresql':
            conn_str = f"postgresql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
        elif source.connection_type == 'mysql':
            conn_str = f"mysql+pymysql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}"
        elif source.connection_type == 'sqlite':
            conn_str = f"sqlite:///{source.database}"
        else:
            return jsonify({'status': 'error', 'error': f'Unsupported database type: {source.connection_type}'}), 400
        
        # Execute query
        start_time = time.time()
        engine = create_engine(conn_str)
        
        try:
            with engine.connect() as conn:
                result = conn.execute(text(query))
                
                # Get columns
                columns = list(result.keys()) if result.returns_rows else []
                
                # Get rows and convert to JSON-serializable format
                rows = []
                if result.returns_rows:
                    for row in result:
                        # Convert row to list, handling datetime objects and special values
                        row_list = []
                        for value in row:
                            # Handle None/NULL
                            if value is None:
                                row_list.append(None)
                            # Handle datetime types
                            elif isinstance(value, datetime):
                                row_list.append(value.isoformat())
                            elif isinstance(value, (date, dt_time)):
                                row_list.append(str(value))
                            # Handle Decimal
                            elif isinstance(value, Decimal):
                                # Check for NaN/Inf in Decimal
                                if value.is_nan():
                                    row_list.append(None)
                                elif value.is_infinite():
                                    row_list.append(None)
                                else:
                                    row_list.append(float(value))
                            # Handle float (check for NaN/Inf)
                            elif isinstance(value, float):
                                if math.isnan(value) or math.isinf(value):
                                    row_list.append(None)
                                else:
                                    row_list.append(value)
                            # Handle everything else
                            else:
                                row_list.append(value)
                        rows.append(row_list)
                
                execution_time = time.time() - start_time
                
                return jsonify({
                    'status': 'success',
                    'columns': columns,
                    'rows': rows,
                    'rowCount': len(rows),
                    'executionTime': round(execution_time, 3)
                })
                
        except SQLAlchemyError as e:
            logger.error(f"Query execution error: {e}")
            return jsonify({
                'status': 'error',
                'error': str(e)
            }), 400
        finally:
            engine.dispose()
            
    except Exception as e:
        logger.error(f"Execute query error: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

# Data Marts API - Using real database
@app.route('/api/data-marts', methods=['GET', 'POST'])
@login_required
def data_marts():
    if request.method == 'GET':
        # Get all data marts from database
        marts = DataMart.query.all()
        return jsonify([mart.to_dict() for mart in marts])
    
    elif request.method == 'POST':
        try:
            data = request.json
            definition = data.get('definition', {})
            
            # Extract data_source_id from definition or top-level
            data_source_id = data.get('data_source_id') or data.get('dataSourceId')
            if not data_source_id and isinstance(definition, dict):
                data_source_id = definition.get('dataSourceId') or definition.get('data_source_id')
            
            new_mart = DataMart(
                id=str(uuid.uuid4()),
                name=data.get('name', 'New Data Mart'),
                description=data.get('description', ''),
                data_source_id=data_source_id,
                definition=definition,
                status='ready'
            )
            db.session.add(new_mart)
            db.session.commit()
            logger.info(f"Created data mart: {new_mart.name} (ID: {new_mart.id}, Source: {data_source_id})")
            return jsonify(new_mart.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create data mart: {e}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/data-marts/<mart_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def data_mart(mart_id):
    mart = DataMart.query.get(mart_id)
    
    if request.method == 'GET':
        if mart:
            return jsonify(mart.to_dict())
        return jsonify({'error': 'Data mart not found'}), 404
    
    elif request.method == 'PUT':
        if mart:
            try:
                data = request.json
                mart.name = data.get('name', mart.name)
                mart.description = data.get('description', mart.description)
                mart.definition = data.get('definition', mart.definition)
                
                # Update data_source_id if provided
                if 'data_source_id' in data or 'dataSourceId' in data:
                    mart.data_source_id = data.get('data_source_id') or data.get('dataSourceId')
                
                mart.updated_at = datetime.utcnow()
                db.session.commit()
                logger.info(f"Updated data mart: {mart.name} (ID: {mart.id})")
                return jsonify(mart.to_dict())
            except Exception as e:
                db.session.rollback()
                logger.error(f"Failed to update data mart: {e}")
                return jsonify({'error': str(e)}), 500
        return jsonify({'error': 'Data mart not found'}), 404
    
    elif request.method == 'DELETE':
        if mart:
            try:
                db.session.delete(mart)
                db.session.commit()
                logger.info(f"Deleted data mart: {mart.name} (ID: {mart.id})")
                return jsonify({'status': 'success', 'message': 'Data mart deleted'})
            except Exception as e:
                db.session.rollback()
                logger.error(f"Failed to delete data mart: {e}")
                return jsonify({'error': str(e)}), 500
        return jsonify({'error': 'Data mart not found'}), 404

# Database Performance & Monitoring APIs
@app.route('/api/database/server-stats', methods=['GET'])
@login_required
def database_server_stats():
    return jsonify({
        'status': 'success',
        'data': {
            'connections': {
                'active': 15,
                'idle': 8,
                'total': 23,
                'max': 100
            },
            'memory': {
                'used': '512 MB',
                'free': '1536 MB',
                'total': '2048 MB',
                'usage_percent': 25
            },
            'cpu': {
                'usage_percent': 35,
                'cores': 4
            },
            'disk': {
                'used': '8.2 GB',
                'free': '41.8 GB',
                'total': '50 GB',
                'usage_percent': 16
            },
            'queries': {
                'queries_per_second': 120,
                'slow_queries': 3,
                'transactions_per_second': 85
            },
            'uptime': '15 days, 8 hours',
            'version': 'PostgreSQL 15.3'
        }
    })

@app.route('/api/database/processes', methods=['GET'])
@login_required
def database_processes():
    return jsonify({
        'status': 'success',
        'data': [
            {
                'id': '1001',
                'user': 'app_user',
                'database': 'prod_db',
                'query': 'SELECT * FROM users WHERE status = \'active\'',
                'state': 'active',
                'duration': '0.2s',
                'wait_event': None
            },
            {
                'id': '1002',
                'user': 'analytics_user',
                'database': 'analytics_db',
                'query': 'SELECT date, SUM(amount) FROM transactions GROUP BY date',
                'state': 'active',
                'duration': '2.5s',
                'wait_event': None
            },
            {
                'id': '1003',
                'user': 'app_user',
                'database': 'prod_db',
                'query': 'IDLE',
                'state': 'idle',
                'duration': '15.0s',
                'wait_event': 'ClientRead'
            }
        ]
    })

@app.route('/api/database/slow-queries', methods=['GET'])
@login_required
def database_slow_queries():
    return jsonify({
        'status': 'success',
        'data': [
            {
                'id': 'sq_001',
                'query': 'SELECT o.*, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.created_at > \'2024-01-01\'',
                'database': 'prod_db',
                'user': 'app_user',
                'avg_duration': '5.2s',
                'executions': 45,
                'last_execution': '2024-10-02T10:30:00Z'
            },
            {
                'id': 'sq_002',
                'query': 'SELECT * FROM products WHERE category IN (SELECT id FROM categories WHERE parent_id IS NULL)',
                'database': 'prod_db',
                'user': 'app_user',
                'avg_duration': '3.8s',
                'executions': 120,
                'last_execution': '2024-10-02T11:15:00Z'
            }
        ]
    })

@app.route('/api/database/process/<process_id>/kill', methods=['POST'])
@login_required
def kill_database_process(process_id):
    return jsonify({
        'status': 'success',
        'message': f'Process {process_id} terminated successfully'
    })

@app.route('/api/database/optimize', methods=['POST'])
@login_required
def optimize_database():
    return jsonify({
        'status': 'success',
        'message': 'Database optimization completed',
        'details': {
            'tables_optimized': 12,
            'indexes_rebuilt': 8,
            'space_reclaimed': '256 MB',
            'duration': '45s'
        }
    })

@app.route('/api/database/<db_name>/schema', methods=['GET'])
def database_schema(db_name):
    """Get real schema for a specific database for autocomplete"""
    try:
        # Check cache first
        cache_key = f"schema:{db_name}"
        cached_schema = get_cached_schema(cache_key)
        if cached_schema:
            logger.info(f"Returning cached schema for {db_name}")
            return jsonify({
                'status': 'success',
                'database': db_name,
                'schema': cached_schema
            })
        
        # Find data source by name
        source = DataSource.query.filter_by(name=db_name).first()
        
        if not source:
            # Check if it's a data mart
            data_mart = DataMart.query.filter_by(name=db_name).first()
            if data_mart:
                # Get the underlying data source for the data mart
                # Try the data_source_id column first (newly added), then fall back to definition
                source_id = data_mart.data_source_id
                if not source_id and isinstance(data_mart.definition, dict):
                    source_id = data_mart.definition.get('dataSourceId')
                
                if source_id:
                    source = DataSource.query.get(source_id)
                    logger.info(f"Found data mart {db_name}, using data source {source.name if source else 'NOT FOUND'}")
        
        if not source:
            logger.warning(f"Database {db_name} not found")
            return jsonify({'error': 'Database not found', 'status': 'error'}), 404
        
        # Fetch real schema using existing function
        schema_response = fetch_real_database_schema(source)
        schema_data = schema_response.get('schema', {})
        
        # Cache the schema
        set_cached_schema(cache_key, schema_data)
        
        logger.info(f"Successfully fetched schema for {db_name} with {len(schema_data)} tables")
        
        return jsonify({
            'status': 'success',
            'database': db_name,
            'schema': schema_data
        })
        
    except Exception as e:
        logger.error(f"Failed to fetch schema for {db_name}: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/database/relationships', methods=['GET'])
@login_required
def database_relationships():
    """Get foreign key relationships"""
    return jsonify({
        'status': 'success',
        'relationships': [
            {
                'from_table': 'orders',
                'from_column': 'user_id',
                'to_table': 'users',
                'to_column': 'id',
                'constraint_name': 'fk_orders_users'
            },
            {
                'from_table': 'transactions',
                'from_column': 'order_id',
                'to_table': 'orders',
                'to_column': 'id',
                'constraint_name': 'fk_transactions_orders'
            }
        ]
    })

# ==========================================
# PIPELINE MANAGEMENT APIS
# ==========================================

@app.route('/api/pipelines', methods=['GET'])
@login_required
def get_pipelines():
    """Get all pipelines"""
    try:
        pipelines = Pipeline.query.all()
        return jsonify([p.to_dict() for p in pipelines])
    except Exception as e:
        logger.error(f"Error fetching pipelines: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pipelines', methods=['POST'])
@login_required
def create_pipeline():
    """Create a new pipeline"""
    try:
        data = request.get_json()
        
        # Check if pipeline name already exists
        existing = Pipeline.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Pipeline name already exists'}), 400
        
        pipeline = Pipeline(
            name=data['name'],
            description=data.get('description'),
            source_id=data.get('source_id'),
            source_table=data.get('source_table'),
            destination_id=data.get('destination_id'),
            destination_table=data.get('destination_table'),
            mode=data.get('mode', 'batch'),
            schedule=data.get('schedule'),
            created_by=current_user.id,
            organization_id=current_user.organization_id
        )
        db.session.add(pipeline)
        db.session.commit()
        
        logger.info(f"Pipeline created successfully: {pipeline.name}")
        return jsonify(pipeline.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating pipeline: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pipelines/<pipeline_id>', methods=['GET'])
@login_required
def get_pipeline(pipeline_id):
    """Get pipeline details"""
    try:
        pipeline = Pipeline.query.get_or_404(pipeline_id)
        runs = PipelineRun.query.filter_by(pipeline_id=pipeline_id).order_by(PipelineRun.start_time.desc()).limit(10).all()
        
        result = pipeline.to_dict()
        result['runs'] = [r.to_dict() for r in runs]
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error fetching pipeline: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pipelines/<pipeline_id>', methods=['PUT'])
@login_required
def update_pipeline(pipeline_id):
    """Update pipeline"""
    try:
        pipeline = Pipeline.query.get_or_404(pipeline_id)
        data = request.get_json()
        
        if 'name' in data:
            # Check if name already exists (excluding current pipeline)
            existing = Pipeline.query.filter(Pipeline.name == data['name'], Pipeline.id != pipeline_id).first()
            if existing:
                return jsonify({'error': 'Pipeline name already exists'}), 400
            pipeline.name = data['name']
        
        if 'description' in data:
            pipeline.description = data['description']
        if 'source_id' in data:
            pipeline.source_id = data['source_id']
        if 'source_table' in data:
            pipeline.source_table = data['source_table']
        if 'destination_id' in data:
            pipeline.destination_id = data['destination_id']
        if 'destination_table' in data:
            pipeline.destination_table = data['destination_table']
        if 'mode' in data:
            pipeline.mode = data['mode']
        if 'schedule' in data:
            pipeline.schedule = data['schedule']
        if 'status' in data:
            pipeline.status = data['status']
        
        db.session.commit()
        logger.info(f"Pipeline updated successfully: {pipeline.name}")
        return jsonify(pipeline.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating pipeline: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pipelines/<pipeline_id>', methods=['DELETE'])
@login_required
def delete_pipeline(pipeline_id):
    """Delete pipeline"""
    try:
        pipeline = Pipeline.query.get_or_404(pipeline_id)
        # Delete associated runs first
        PipelineRun.query.filter_by(pipeline_id=pipeline_id).delete()
        db.session.delete(pipeline)
        db.session.commit()
        logger.info(f"Pipeline deleted successfully: {pipeline.name}")
        return jsonify({'message': 'Pipeline deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting pipeline: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pipelines/<pipeline_id>/trigger', methods=['POST'])
@login_required
def trigger_pipeline(pipeline_id):
    """Manually trigger a pipeline execution"""
    try:
        pipeline = Pipeline.query.get_or_404(pipeline_id)
        
        # Validate pipeline configuration
        validation_errors = []
        if not pipeline.source_id:
            validation_errors.append("Source data source not configured")
        if not pipeline.destination_id:
            validation_errors.append("Destination data source not configured")
        if not pipeline.source_table:
            validation_errors.append("Source table not specified")
        if not pipeline.destination_table:
            validation_errors.append("Destination table not specified")
        
        if validation_errors:
            error_msg = "Pipeline configuration incomplete: " + "; ".join(validation_errors)
            logger.warning(f"Pipeline {pipeline_id} validation failed: {error_msg}")
            return jsonify({
                'error': error_msg,
                'validation_errors': validation_errors
            }), 400
        
        # Create a new run record
        run = PipelineRun(
            pipeline_id=pipeline_id,
            status='running',
            start_time=datetime.utcnow(),
            triggered_by=current_user.id
        )
        db.session.add(run)
        db.session.commit()
        
        logger.info(f"Pipeline triggered successfully: {pipeline.name} (run_id: {run.id})")
        
        # Execute pipeline in background (simulated for now)
        try:
            # Get source and destination connections
            source = DataSource.query.get(pipeline.source_id)
            destination = DataSource.query.get(pipeline.destination_id)
            
            if not source or not destination:
                raise Exception(f"Data source not found: source={pipeline.source_id}, dest={pipeline.destination_id}")
            
            # Build transformation SQL based on mode
            if pipeline.mode == 'incremental' and pipeline.transformation_sql:
                query = pipeline.transformation_sql
            elif pipeline.mode == 'upsert':
                # For upsert, we need to handle conflicts
                query = f"SELECT * FROM {pipeline.source_table}"
            else:
                # Full refresh
                query = f"SELECT * FROM {pipeline.source_table}"
            
            logger.info(f"Executing pipeline {pipeline.name}: {source.name}.{pipeline.source_table} -> {destination.name}.{pipeline.destination_table}")
            
            # Simulate successful execution (replace with actual execution later)
            from sqlalchemy import create_engine, text
            from urllib.parse import quote_plus
            
            # Build connection strings
            if source.connection_type == 'postgresql':
                source_password = quote_plus(source.password) if source.password else ''
                source_url = f"postgresql://{source.username}:{source_password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
            else:
                raise Exception(f"Unsupported source type: {source.connection_type}")
            
            if destination.connection_type == 'postgresql':
                dest_password = quote_plus(destination.password) if destination.password else ''
                dest_url = f"postgresql://{destination.username}:{dest_password}@{destination.host}:{destination.port}/{destination.database}?gssencmode=disable"
            else:
                raise Exception(f"Unsupported destination type: {destination.connection_type}")
            
            # Execute the data transfer
            source_engine = create_engine(source_url, connect_args={'connect_timeout': 10})
            dest_engine = create_engine(dest_url, connect_args={'connect_timeout': 10})
            
            with source_engine.connect() as source_conn:
                # Fetch data from source
                result = source_conn.execute(text(query))
                rows = result.fetchall()
                records_processed = len(rows)
                
                if records_processed > 0:
                    # Insert into destination
                    with dest_engine.connect() as dest_conn:
                        # For simplicity, using pandas for the transfer
                        import pandas as pd
                        df = pd.DataFrame(rows, columns=result.keys())
                        
                        if pipeline.mode == 'full_refresh':
                            # Truncate and load
                            dest_conn.execute(text(f"TRUNCATE TABLE {pipeline.destination_table}"))
                        
                        # Load data
                        df.to_sql(pipeline.destination_table, dest_conn, if_exists='append', index=False)
                        dest_conn.commit()
                        
                        logger.info(f"Successfully transferred {records_processed} records")
                else:
                    logger.warning(f"No records found in source table {pipeline.source_table}")
            
            # Update run record with success
            run.status = 'success'
            run.end_time = datetime.utcnow()
            run.records_processed = records_processed
            run.log = f"Successfully transferred {records_processed} records from {source.name}.{pipeline.source_table} to {destination.name}.{pipeline.destination_table}"
            
            # Update pipeline last run
            pipeline.last_run_at = datetime.utcnow()
            pipeline.status = 'active'
            
        except Exception as exec_error:
            # Update run record with failure
            run.status = 'failed'
            run.end_time = datetime.utcnow()
            run.error_message = str(exec_error)
            run.log = f"Pipeline execution failed: {str(exec_error)}"
            logger.error(f"Pipeline execution failed: {exec_error}")
            
        db.session.commit()
        
        return jsonify({
            'message': 'Pipeline executed' if run.status == 'success' else 'Pipeline execution failed',
            'run_id': run.id,
            'status': run.status,
            'records_processed': run.records_processed or 0,
            'error_message': run.error_message
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error triggering pipeline: {e}")
        return jsonify({'error': str(e)}), 500

# ==========================================
# ALERT MANAGEMENT APIS
# ==========================================

@app.route('/api/alerts', methods=['GET'])
@login_required
def get_alerts():
    """Get all alerts"""
    try:
        alerts = Alert.query.filter_by(organization_id=current_user.organization_id).all()
        return jsonify([a.to_dict() for a in alerts])
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts', methods=['POST'])
@login_required
def create_alert():
    """Create a new alert"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Alert name is required'}), 400
        if not data.get('condition_type'):
            return jsonify({'error': 'Condition type is required'}), 400
        
        # Check if alert name already exists
        existing = Alert.query.filter_by(
            name=data['name'],
            organization_id=current_user.organization_id
        ).first()
        if existing:
            return jsonify({'error': 'Alert name already exists'}), 400
        
        alert = Alert(
            name=data['name'],
            description=data.get('description'),
            condition_type=data['condition_type'],
            condition_config=data.get('condition_config', {}),
            channels=data.get('channels', []),
            recipients=data.get('recipients', {}),
            is_active=data.get('is_active', True),
            created_by=current_user.id,
            organization_id=current_user.organization_id
        )
        
        db.session.add(alert)
        db.session.commit()
        
        logger.info(f"Alert created: {alert.name} by {current_user.email}")
        return jsonify(alert.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating alert: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/<alert_id>', methods=['GET'])
@login_required
def get_alert(alert_id):
    """Get alert details with history"""
    try:
        alert = Alert.query.get_or_404(alert_id)
        
        # Check access
        if alert.organization_id != current_user.organization_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get alert history
        history = AlertHistory.query.filter_by(alert_id=alert_id).order_by(
            AlertHistory.triggered_at.desc()
        ).limit(50).all()
        
        result = alert.to_dict()
        result['history'] = [h.to_dict() for h in history]
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error fetching alert: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/<alert_id>', methods=['PUT'])
@login_required
def update_alert(alert_id):
    """Update alert"""
    try:
        alert = Alert.query.get_or_404(alert_id)
        
        # Check access
        if alert.organization_id != current_user.organization_id:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            # Check if name already exists (excluding current alert)
            existing = Alert.query.filter(
                Alert.name == data['name'],
                Alert.id != alert_id,
                Alert.organization_id == current_user.organization_id
            ).first()
            if existing:
                return jsonify({'error': 'Alert name already exists'}), 400
            alert.name = data['name']
        
        if 'description' in data:
            alert.description = data['description']
        if 'condition_type' in data:
            alert.condition_type = data['condition_type']
        if 'condition_config' in data:
            alert.condition_config = data['condition_config']
        if 'channels' in data:
            alert.channels = data['channels']
        if 'recipients' in data:
            alert.recipients = data['recipients']
        if 'is_active' in data:
            alert.is_active = data['is_active']
        
        alert.updated_at = datetime.utcnow()
        
        db.session.commit()
        logger.info(f"Alert updated: {alert.name} by {current_user.email}")
        return jsonify(alert.to_dict())
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating alert: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/<alert_id>', methods=['DELETE'])
@login_required
def delete_alert(alert_id):
    """Delete alert"""
    try:
        alert = Alert.query.get_or_404(alert_id)
        
        # Check access
        if alert.organization_id != current_user.organization_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Delete associated history
        AlertHistory.query.filter_by(alert_id=alert_id).delete()
        
        db.session.delete(alert)
        db.session.commit()
        
        logger.info(f"Alert deleted: {alert.name} by {current_user.email}")
        return jsonify({'message': 'Alert deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting alert: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/<alert_id>/test', methods=['POST'])
@login_required
def test_alert(alert_id):
    """Test alert by sending a test notification"""
    try:
        alert = Alert.query.get_or_404(alert_id)
        
        # Check access
        if alert.organization_id != current_user.organization_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Import notification service
        from alert_system import NotificationService
        
        notif_service = NotificationService()
        
        # Create test alert data
        test_data = {
            'severity': 'info',
            'details': {
                'message': 'This is a test alert',
                'triggered_by': current_user.email,
                'time': datetime.utcnow().isoformat()
            }
        }
        
        # Send notification
        results = notif_service.send_notification(alert.to_dict(), test_data)
        
        return jsonify({
            'message': 'Test alert sent',
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error testing alert: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/history', methods=['GET'])
@login_required
def get_alert_history():
    """Get recent alert history across all alerts"""
    try:
        # Get all alerts for this organization
        alert_ids = [a.id for a in Alert.query.filter_by(
            organization_id=current_user.organization_id
        ).all()]
        
        # Get recent history
        history = AlertHistory.query.filter(
            AlertHistory.alert_id.in_(alert_ids)
        ).order_by(
            AlertHistory.triggered_at.desc()
        ).limit(100).all()
        
        return jsonify([h.to_dict() for h in history])
        
    except Exception as e:
        logger.error(f"Error fetching alert history: {e}")
        return jsonify({'error': str(e)}), 500

# ==========================================
# PERFORMANCE MONITORING APIS
# ==========================================

@app.route('/api/performance/data-sources', methods=['GET'])
@login_required
def performance_data_sources():
    """Get real-time health metrics for all data sources"""
    try:
        # Get all data sources from database
        sources = DataSource.query.all()
        data_marts = DataMart.query.all()
        
        health_data = []
        
        # Process data sources
        for source in sources:
            try:
                # Try to connect and get real metrics
                if source.connection_type == 'postgresql':
                    conn_str = f"postgresql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
                elif source.connection_type == 'mysql':
                    conn_str = f"mysql+pymysql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}"
                else:
                    # Unsupported type, use mock data
                    continue
                
                engine = create_engine(conn_str, pool_pre_ping=True)
                
                # Get real metrics from database
                with engine.connect() as conn:
                    # PostgreSQL specific queries
                    if source.connection_type == 'postgresql':
                        # Get database stats
                        stats_query = text("""
                            SELECT 
                                (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
                                (SELECT count(*) FROM pg_stat_activity) as total_connections,
                                (SELECT pg_database_size(current_database())) as database_size,
                                (SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time()))) as uptime_seconds
                        """)
                        stats = conn.execute(stats_query).fetchone()
                        
                        # Calculate metrics
                        uptime_seconds = int(stats[3]) if stats[3] else 0
                        active_conn = stats[0] if stats[0] else 0
                        total_conn = stats[1] if stats[1] else 0
                        
                        health_data.append({
                            'id': source.id,
                            'name': source.name,
                            'type': source.connection_type,
                            'status': 'healthy',
                            'uptime': format_uptime(uptime_seconds),
                            'uptimeSeconds': uptime_seconds,
                            'responseTime': 45,  # Mock for now
                            'avgResponseTime': 124,
                            'minResponseTime': 45,
                            'maxResponseTime': 340,
                            'connections': active_conn,
                            'errors': 0,
                            'lastChecked': datetime.utcnow().isoformat() + 'Z',
                            'metrics': {
                                'cpu': 35,  # Mock
                                'memory': 42,  # Mock
                                'disk': 55,  # Mock
                                'queries': active_conn
                            }
                        })
                    else:
                        # MySQL or other databases - use simplified metrics
                        health_data.append({
                            'id': source.id,
                            'name': source.name,
                            'type': source.connection_type,
                            'status': 'healthy',
                            'uptime': '15d 8h 30m',
                            'uptimeSeconds': 1324800,
                            'responseTime': 45,
                            'avgResponseTime': 124,
                            'minResponseTime': 45,
                            'maxResponseTime': 340,
                            'connections': 8,
                            'errors': 0,
                            'lastChecked': datetime.utcnow().isoformat() + 'Z',
                            'metrics': {
                                'cpu': 28,
                                'memory': 38,
                                'disk': 48,
                                'queries': 8
                            }
                        })
                
                engine.dispose()
                
            except Exception as e:
                logger.error(f"Failed to get metrics for {source.name}: {e}")
                # Return degraded status with mock data
                health_data.append({
                    'id': source.id,
                    'name': source.name,
                    'type': source.connection_type,
                    'status': 'degraded',
                    'uptime': 'N/A',
                    'uptimeSeconds': 0,
                    'responseTime': 0,
                    'avgResponseTime': 0,
                    'minResponseTime': 0,
                    'maxResponseTime': 0,
                    'connections': 0,
                    'errors': 1,
                    'lastChecked': datetime.utcnow().isoformat() + 'Z',
                    'metrics': {
                        'cpu': 0,
                        'memory': 0,
                        'disk': 0,
                        'queries': 0
                    }
                })
        
        # Add data marts as additional "data sources"
        for mart in data_marts:
            health_data.append({
                'id': mart.id,
                'name': mart.name,
                'type': 'datamart',
                'status': 'healthy',
                'uptime': '10d 5h 15m',
                'uptimeSeconds': 882900,
                'responseTime': 32,
                'avgResponseTime': 98,
                'minResponseTime': 28,
                'maxResponseTime': 215,
                'connections': 5,
                'errors': 0,
                'lastChecked': datetime.utcnow().isoformat() + 'Z',
                'metrics': {
                    'cpu': 15,
                    'memory': 25,
                    'disk': 35,
                    'queries': 5
                }
            })
        
        return jsonify({
            'status': 'success',
            'data': health_data
        })
        
    except Exception as e:
        logger.error(f"Performance data sources error: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

def format_uptime(seconds):
    """Format uptime seconds into human-readable string"""
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    return f"{days}d {hours}h {minutes}m"

@app.route('/api/performance/data-sources/<source_id>/active-queries', methods=['GET'])
@login_required
def performance_active_queries(source_id):
    """Get currently executing queries for a data source"""
    try:
        source = DataSource.query.get(source_id)
        
        # If not found as data source, check if it's a data mart
        if not source:
            data_mart = DataMart.query.get(source_id)
            if data_mart and data_mart.data_source_id:
                source = DataSource.query.get(data_mart.data_source_id)
                logger.info(f"Found data mart {data_mart.name}, using underlying source {source.name if source else 'N/A'}")
        
        # If still not found, return mock data
        if not source:
            logger.warning(f"Source {source_id} not found, returning mock data")
            return jsonify({
                'status': 'success',
                'data': generate_mock_active_queries('Unknown Database')
            })
        
        # Try to get real active queries
        if source.connection_type == 'postgresql':
            conn_str = f"postgresql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
            engine = create_engine(conn_str, pool_pre_ping=True)
            
            with engine.connect() as conn:
                query = text("""
                    SELECT 
                        pid as query_id,
                        datname as database,
                        usename as user,
                        query,
                        EXTRACT(EPOCH FROM (now() - query_start)) * 1000 as duration_ms,
                        state,
                        query_start as timestamp
                    FROM pg_stat_activity
                    WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
                    ORDER BY query_start DESC
                    LIMIT 20
                """)
                
                result = conn.execute(query)
                queries = []
                
                for row in result:
                    queries.append({
                        'queryId': str(row[0]),
                        'database': row[1],
                        'user': row[2],
                        'query': row[3][:500],  # Limit query length
                        'duration': int(row[4]) if row[4] else 0,
                        'state': row[5],
                        'timestamp': row[6].isoformat() if row[6] else datetime.utcnow().isoformat()
                    })
                
                engine.dispose()
                
                return jsonify({
                    'status': 'success',
                    'data': queries
                })
        
        # Fallback to mock data for other databases or if query fails
        return jsonify({
            'status': 'success',
            'data': generate_mock_active_queries(source.name)
        })
        
    except Exception as e:
        logger.error(f"Active queries error: {e}")
        # Return mock data on error
        source = DataSource.query.get(source_id)
        return jsonify({
            'status': 'success',
            'data': generate_mock_active_queries(source.name if source else 'database')
        })

def generate_mock_active_queries(db_name):
    """Generate mock active queries"""
    import random
    queries = []
    sample_queries = [
        'SELECT * FROM users WHERE status = "active" AND created_at > NOW() - INTERVAL 30 DAY',
        'UPDATE orders SET status = "shipped" WHERE id = 12345 AND payment_status = "completed"',
        'SELECT COUNT(*) as total_sales, SUM(amount) as revenue FROM transactions WHERE date > "2024-01-01"',
        'INSERT INTO logs (message, level, timestamp) VALUES ("user login", "info", NOW())',
        'DELETE FROM temp_data WHERE created_at < NOW() - INTERVAL 7 DAY AND processed = true'
    ]
    users = ['admin', 'app_user', 'analyst', 'service_account', 'etl_job']
    states = ['executing', 'sending data', 'waiting for lock', 'copying to tmp table']
    
    for i in range(random.randint(5, 15)):
        queries.append({
            'queryId': f"q_{i:04d}",
            'database': db_name,
            'user': random.choice(users),
            'query': random.choice(sample_queries),
            'duration': random.randint(100, 5000),
            'state': random.choice(states),
            'timestamp': (datetime.utcnow() - timedelta(seconds=random.randint(0, 300))).isoformat() + 'Z'
        })
    
    return queries

@app.route('/api/performance/data-sources/<source_id>/slow-queries', methods=['GET'])
@login_required
def performance_slow_queries(source_id):
    """Get slow queries with optimization recommendations"""
    try:
        source = DataSource.query.get(source_id)
        
        # If not found as data source, check if it's a data mart
        if not source:
            data_mart = DataMart.query.get(source_id)
            if data_mart and data_mart.data_source_id:
                source = DataSource.query.get(data_mart.data_source_id)
                logger.info(f"Found data mart {data_mart.name}, using underlying source {source.name if source else 'N/A'}")
        
        # If still not found, return mock data
        if not source:
            logger.warning(f"Source {source_id} not found, returning mock data")
            return jsonify({
                'status': 'success',
                'data': generate_mock_slow_queries()
            })
        
        # Try to get real slow queries from PostgreSQL
        if source.connection_type == 'postgresql':
            conn_str = f"postgresql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
            engine = create_engine(conn_str, pool_pre_ping=True)
            
            with engine.connect() as conn:
                # Try to enable pg_stat_statements if not already enabled
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_stat_statements"))
                    conn.commit()
                    logger.info(f"pg_stat_statements extension enabled for {source.name}")
                except Exception as e:
                    logger.warning(f"Could not enable pg_stat_statements: {e}")
                
                # Check if pg_stat_statements extension is available
                try:
                    query = text("""
                        SELECT 
                            query,
                            calls,
                            mean_exec_time,
                            total_exec_time,
                            rows
                        FROM pg_stat_statements
                        WHERE mean_exec_time > 1000
                        ORDER BY mean_exec_time DESC
                        LIMIT 10
                    """)
                    
                    result = conn.execute(query)
                    queries = []
                    
                    for idx, row in enumerate(result):
                        query_text = row[0][:500]
                        
                        # Generate recommendations based on query patterns
                        recommendation = None
                        optimization = None
                        
                        if 'WHERE' not in query_text.upper():
                            recommendation = "Query lacks WHERE clause - may scan entire table"
                            optimization = "Add WHERE clause to filter results"
                        elif 'LIKE' in query_text.upper() and query_text.find("LIKE '%") > -1:
                            recommendation = "Query uses leading wildcard in LIKE - cannot use index"
                            optimization = "Restructure query to avoid leading wildcard or use full-text search"
                        elif 'SELECT *' in query_text.upper():
                            recommendation = "Query uses SELECT * - fetches unnecessary columns"
                            optimization = "Specify only needed columns in SELECT clause"
                        else:
                            recommendation = "Consider adding index on frequently queried columns"
                            optimization = "Analyze EXPLAIN output and create appropriate indexes"
                        
                        queries.append({
                            'queryId': f"slow_{idx:03d}",
                            'query': query_text,
                            'executionTime': int(row[2]),
                            'rowsScanned': int(row[4]) if row[4] else 0,
                            'recommendation': recommendation,
                            'optimization': optimization
                        })
                    
                    engine.dispose()
                    
                    if queries:
                        logger.info(f"Found {len(queries)} real slow queries for {source.name}")
                        return jsonify({
                            'status': 'success',
                            'data': queries
                        })
                    else:
                        logger.info(f"No slow queries found in pg_stat_statements for {source.name}, returning mock data")
                except Exception as e:
                    # pg_stat_statements not available
                    logger.warning(f"pg_stat_statements not available for {source.name}: {e}. Returning mock data")
                    pass
        
        # Fallback to mock data
        return jsonify({
            'status': 'success',
            'data': generate_mock_slow_queries()
        })
        
    except Exception as e:
        logger.error(f"Slow queries error: {e}")
        return jsonify({
            'status': 'success',
            'data': generate_mock_slow_queries()
        })

def generate_mock_slow_queries():
    """Generate mock slow queries with recommendations"""
    queries = [
        {
            'queryId': 'slow_001',
            'query': 'SELECT * FROM large_table WHERE unindexed_column = "specific_value" ORDER BY created_at DESC',
            'executionTime': 8450,
            'rowsScanned': 2500000,
            'recommendation': 'Missing index on unindexed_column causing full table scan',
            'optimization': 'CREATE INDEX idx_unindexed_column ON large_table(unindexed_column)'
        },
        {
            'queryId': 'slow_002',
            'query': 'SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id WHERE c.email LIKE "%@gmail.com"',
            'executionTime': 6200,
            'rowsScanned': 1800000,
            'recommendation': 'Leading wildcard in LIKE prevents index usage',
            'optimization': 'Use full-text search or restructure query: WHERE c.email LIKE "user@gmail.com"'
        },
        {
            'queryId': 'slow_003',
            'query': 'SELECT * FROM products WHERE category IN (SELECT id FROM categories WHERE parent_id IS NULL)',
            'executionTime': 5800,
            'rowsScanned': 950000,
            'recommendation': 'Subquery executed for each row - inefficient',
            'optimization': 'SELECT p.* FROM products p JOIN categories c ON p.category = c.id WHERE c.parent_id IS NULL'
        },
        {
            'queryId': 'slow_004',
            'query': 'SELECT COUNT(*) FROM transactions t JOIN users u ON t.user_id = u.id WHERE u.status = "active"',
            'executionTime': 4500,
            'rowsScanned': 1200000,
            'recommendation': 'COUNT(*) on large JOIN without index',
            'optimization': 'CREATE INDEX idx_users_status ON users(status); Consider denormalization'
        },
        {
            'queryId': 'slow_005',
            'query': 'SELECT DISTINCT product_name FROM order_items WHERE created_at > "2024-01-01" ORDER BY product_name',
            'executionTime': 3900,
            'rowsScanned': 850000,
            'recommendation': 'DISTINCT with ORDER BY causes sort operation on large dataset',
            'optimization': 'CREATE INDEX idx_order_items_product_created ON order_items(product_name, created_at)'
        }
    ]
    return queries

@app.route('/api/performance/data-sources/<source_id>/access-logs', methods=['GET'])
@login_required
def performance_access_logs(source_id):
    """Get access logs for a data source"""
    try:
        source = DataSource.query.get(source_id)
        
        # If not found as data source, check if it's a data mart
        if not source:
            data_mart = DataMart.query.get(source_id)
            if data_mart and data_mart.data_source_id:
                source = DataSource.query.get(data_mart.data_source_id)
                logger.info(f"Found data mart {data_mart.name}, using underlying source {source.name if source else 'N/A'}")
        
        # If still not found, return empty logs
        if not source:
            logger.warning(f"Source {source_id} not found, returning empty logs")
            return jsonify({
                'status': 'success',
                'data': []
            })
        
        # Try to get real access logs from PostgreSQL
        if source.connection_type == 'postgresql':
            try:
                conn_str = f"postgresql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
                engine = create_engine(conn_str, pool_pre_ping=True)
                
                with engine.connect() as conn:
                    # Query recent activity from pg_stat_activity
                    query = text("""
                        SELECT 
                            usename as user,
                            datname as database,
                            state,
                            query,
                            backend_start,
                            query_start,
                            state_change,
                            wait_event_type,
                            wait_event
                        FROM pg_stat_activity
                        WHERE datname = :database
                        AND state IS NOT NULL
                        ORDER BY query_start DESC
                        LIMIT 50
                    """)
                    
                    result = conn.execute(query, {'database': source.database})
                    logs = []
                    
                    for row in result:
                        query_text = row[3] if row[3] else 'Unknown'
                        
                        # Determine action type from query
                        action = 'QUERY_EXECUTION'
                        if query_text.upper().startswith('SELECT'):
                            action = 'QUERY_EXECUTION'
                        elif query_text.upper().startswith('INSERT'):
                            action = 'DATA_INSERT'
                        elif query_text.upper().startswith('UPDATE'):
                            action = 'USER_UPDATE'
                        elif query_text.upper().startswith('DELETE'):
                            action = 'DATA_DELETE'
                        elif query_text.upper().startswith('CREATE TABLE'):
                            action = 'TABLE_CREATE'
                        elif query_text.upper().startswith('CREATE INDEX'):
                            action = 'INDEX_CREATE'
                        elif query_text.upper().startswith('CREATE VIEW'):
                            action = 'VIEW_CREATE'
                        elif 'pg_stat_activity' in query_text:
                            action = 'MONITORING'
                        
                        # Calculate duration if available
                        duration = 0
                        if row[5] and row[6]:  # query_start and state_change
                            duration = int((row[6] - row[5]).total_seconds() * 1000)
                        
                        # Determine status
                        state = row[2]
                        status = 'success' if state in ['idle', 'idle in transaction'] else 'running'
                        if state == 'idle in transaction (aborted)':
                            status = 'failed'
                        
                        logs.append({
                            'timestamp': row[5].isoformat() + 'Z' if row[5] else datetime.utcnow().isoformat() + 'Z',
                            'user': row[0],
                            'action': action,
                            'status': status,
                            'duration': max(50, duration),
                            'query': query_text[:100] + '...' if len(query_text) > 100 else query_text
                        })
                    
                    engine.dispose()
                    
                    if logs:
                        logger.info(f"Found {len(logs)} real access logs for {source.name}")
                        return jsonify({
                            'status': 'success',
                            'data': logs
                        })
                    else:
                        logger.info(f"No activity found for {source.name}, returning mock data")
            except Exception as e:
                logger.warning(f"Could not fetch real access logs for {source.name}: {e}. Returning mock data")
        
        # Fallback to mock access logs
        import random
        logs = []
        users = ['admin', 'john.doe', 'jane.smith', 'service_bot', 'analyst', 'etl_job']
        actions = ['LOGIN', 'QUERY_EXECUTION', 'TABLE_CREATE', 'DATA_INSERT', 'USER_UPDATE', 
                   'SCHEMA_CHANGE', 'INDEX_CREATE', 'VIEW_CREATE', 'BACKUP_STARTED']
        
        logger.info(f"Returning mock access logs for {source.name if source else 'unknown source'}")
        
        for i in range(30):
            logs.append({
                'timestamp': (datetime.utcnow() - timedelta(minutes=i*10)).isoformat() + 'Z',
                'user': random.choice(users),
                'action': random.choice(actions),
                'status': 'success' if random.random() > 0.1 else 'failed',
                'duration': random.randint(50, 2500)
            })
        
        return jsonify({
            'status': 'success',
            'data': logs
        })
        
    except Exception as e:
        logger.error(f"Access logs error: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/performance/pipelines', methods=['GET'])
@login_required
def performance_pipelines():
    """Get pipeline status and metrics - Shows actual pipelines from pipelines table"""
    try:
        # Get all pipelines from the pipelines table
        pipelines_data = Pipeline.query.all()
        
        result_pipelines = []
        
        for pipeline in pipelines_data:
            # Get source and destination names
            # Convert string IDs to proper format
            source_id_str = str(pipeline.source_id) if pipeline.source_id else None
            dest_id_str = str(pipeline.destination_id) if pipeline.destination_id else None
            
            source = DataSource.query.filter_by(id=source_id_str).first() if source_id_str else None
            dest = DataSource.query.filter_by(id=dest_id_str).first() if dest_id_str else None
            
            # Build source and destination names
            if source:
                source_name = f"{source.name} → {pipeline.source_table}"
            elif pipeline.source_table:
                source_name = f"Table: {pipeline.source_table}"
            else:
                source_name = "Not configured"
            
            if dest:
                dest_name = f"{dest.name} → {pipeline.destination_table}"
            elif pipeline.destination_table:
                dest_name = f"Table: {pipeline.destination_table}"
            else:
                dest_name = "Not configured"
            
            # Get pipeline runs
            pipeline_runs = PipelineRun.query.filter_by(pipeline_id=pipeline.id).order_by(PipelineRun.start_time.desc()).limit(20).all()
            
            # Calculate metrics from runs
            if pipeline_runs:
                latest_run = pipeline_runs[0]
                
                # Determine status from latest run
                if latest_run.status == 'success':
                    status = 'success'
                elif latest_run.status == 'running':
                    status = 'warning'
                elif latest_run.status in ['failed', 'error']:
                    status = 'error'
                else:
                    status = 'warning'
                
                # Calculate success rate
                total_runs = len(pipeline_runs)
                successful_runs = len([r for r in pipeline_runs if r.status == 'success'])
                success_rate = (successful_runs / total_runs * 100) if total_runs > 0 else 0
                
                # Calculate duration
                if latest_run.end_time and latest_run.start_time:
                    duration = int((latest_run.end_time - latest_run.start_time).total_seconds())
                else:
                    duration = 0
                
                last_run = latest_run.start_time.isoformat() + 'Z' if latest_run.start_time else None
                rows_processed = latest_run.records_processed or 0
                error_count = latest_run.records_failed or 0
                
            else:
                # No runs yet
                status = 'success' if pipeline.status == 'active' else 'warning'
                success_rate = 100
                duration = 0
                last_run = 'Never'
                rows_processed = 0
                error_count = 0
            
            # Build runs array
            runs = []
            for run in pipeline_runs:
                run_duration = 0
                if run.end_time and run.start_time:
                    run_duration = int((run.end_time - run.start_time).total_seconds())
                
                # Map status
                if run.status == 'success':
                    run_status = 'success'
                elif run.status in ['failed', 'error']:
                    run_status = 'error'
                else:
                    run_status = 'warning'
                
                runs.append({
                    'runId': run.id,
                    'timestamp': run.start_time.isoformat() + 'Z' if run.start_time else datetime.utcnow().isoformat() + 'Z',
                    'startTime': run.start_time.isoformat() + 'Z' if run.start_time else None,
                    'endTime': run.end_time.isoformat() + 'Z' if run.end_time else None,
                    'status': run_status,
                    'duration': run_duration,
                    'rows': run.records_processed or 0,
                    'errorCount': run.records_failed or 0,
                    'triggeredBy': 'Manual'  # Can be enhanced later
                })
            
            # Build logs array from error messages
            logs = []
            for run in pipeline_runs[:5]:  # Last 5 runs
                if run.error_message:
                    logs.append({
                        'timestamp': run.start_time.isoformat() + 'Z' if run.start_time else datetime.utcnow().isoformat() + 'Z',
                        'level': 'error' if run.status in ['failed', 'error'] else 'warning',
                        'message': 'Pipeline execution failed' if run.status in ['failed', 'error'] else 'Pipeline completed with warnings',
                        'details': run.error_message,
                        'source': pipeline.name
                    })
                elif run.log:
                    logs.append({
                        'timestamp': run.start_time.isoformat() + 'Z' if run.start_time else datetime.utcnow().isoformat() + 'Z',
                        'level': 'info',
                        'message': 'Pipeline completed successfully',
                        'details': run.log,
                        'source': pipeline.name
                    })
            
            result_pipelines.append({
                'id': pipeline.id,
                'name': pipeline.name,
                'source': source_name,
                'destination': dest_name,
                'status': status,
                'lastRun': last_run,
                'duration': duration,
                'rowsProcessed': rows_processed,
                'errorCount': error_count,
                'successRate': round(success_rate, 1),
                'runs': runs,
                'logs': logs
            })
        
        logger.info(f"Returning {len(result_pipelines)} pipelines for performance view")
        
        return jsonify({
            'status': 'success',
            'data': result_pipelines
        })
        
    except Exception as e:
        logger.error(f"Performance pipelines error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/performance/application', methods=['GET'])
@login_required
def performance_application():
    """Get application performance metrics"""
    try:
        import random
        
        # Generate mock application metrics
        logs = []
        log_levels = ['info', 'warning', 'error', 'critical']
        log_sources = ['api', 'database', 'auth', 'scheduler', 'worker']
        log_messages = [
            'User authentication successful',
            'Database connection established',
            'Query execution completed',
            'Dashboard generated successfully',
            'Data source connection tested',
            'Slow query detected - optimization recommended',
            'Failed to connect to database',
            'Invalid credentials provided',
            'Memory usage threshold exceeded',
            'API request rate limit reached'
        ]
        
        for i in range(100):
            level = random.choices(log_levels, weights=[0.7, 0.2, 0.08, 0.02])[0]
            logs.append({
                'timestamp': (datetime.utcnow() - timedelta(minutes=i*5)).isoformat() + 'Z',
                'level': level,
                'message': random.choice(log_messages),
                'details': f'Additional details for log entry {i}' if random.random() > 0.5 else None,
                'source': random.choice(log_sources)
            })
        
        metrics = {
            'uptime': '45d 12h 30m',
            'requests': 2847592,
            'errors': 142,
            'avgResponseTime': 245,
            'cpu': random.randint(20, 60),
            'memory': random.randint(35, 70),
            'activeUsers': random.randint(15, 45),
            'logs': logs
        }
        
        return jsonify({
            'status': 'success',
            'data': metrics
        })
        
    except Exception as e:
        logger.error(f"Performance application error: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

# ==========================================
# END PERFORMANCE MONITORING APIS
# ==========================================

# ==========================================
# AI DASHBOARD BUILDER APIS
# ==========================================

@app.route('/api/generate-dashboard', methods=['POST'])
@login_required
def generate_dashboard():
    """Generate dashboard specification using AI"""
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Get available options for AI context
        available_charts = data.get('availableCharts', [])
        chart_descriptions = data.get('chartDescriptions', {})
        available_themes = data.get('availableThemes', [])
        available_features = data.get('availableFeatures', [])
        
        # Get data selection
        data_mode = data.get('dataMode', 'datasource')
        data_source_id = data.get('dataSourceId')
        table_name = data.get('tableName')
        data_mart_id = data.get('dataMartId')
        
        # Get schema context based on selection
        if data_mode == 'datasource' and data_source_id and table_name:
            schema_context = get_table_schema_context(data_source_id, table_name)
        elif data_mode == 'datamart' and data_mart_id:
            schema_context = get_datamart_schema_context(data_mart_id)
        else:
            schema_context = get_schema_context()
        
        # Try to use OpenAI if available, otherwise use mock generation
        try:
            import openai
            openai_api_key = os.getenv('OPENAI_API_KEY')
            
            if openai_api_key:
                openai.api_key = openai_api_key
                
                system_prompt = f"""You are an expert dashboard builder AI. Generate a comprehensive dashboard JSON specification based on user prompts.

Available chart types: {', '.join(available_charts[:20])}
Available themes: {', '.join(available_themes[:10])}
Available features: {', '.join(available_features[:10])}

Database schema available:
{json.dumps(schema_context, indent=2)}

Return ONLY valid JSON in this exact format:
{{
  "title": "Dashboard Title",
  "description": "Brief description",
  "theme": "theme_name",
  "filters": [
    {{"name": "filter_name", "type": "dropdown|dateRange|text", "options": ["opt1", "opt2"], "default": "value", "label": "Label"}}
  ],
  "charts": [
    {{
      "id": "chart1",
      "type": "bar|line|pie|table|kpi",
      "title": "Chart Title",
      "query": "SELECT column FROM table WHERE condition",
      "x": "x_column",
      "y": "y_column",
      "features": ["drilldown", "exportCSV"]
    }}
  ]
}}

Guidelines:
- Use realistic SQL queries based on schema
- Include 3-5 charts minimum
- Add appropriate filters
- Use @filter_name in queries for parameterization
- Include at least one KPI chart if metrics are mentioned
- Include drilldown for detailed exploration
"""
                
                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2000
                )
                
                spec_text = response.choices[0].message.content
                # Clean up markdown code blocks if present
                spec_text = spec_text.replace('```json', '').replace('```', '').strip()
                spec = json.loads(spec_text)
                
                logger.info(f"Generated dashboard using OpenAI: {spec.get('title')}")
                return jsonify({'spec': spec})
                
        except ImportError:
            logger.warning("OpenAI not installed, using mock generation")
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}, using mock generation")
        
        # Check if this is an improvement request
        is_improvement = data.get('isImprovement', False)
        previous_dashboard = data.get('previousDashboard')
        
        if is_improvement and previous_dashboard:
            logger.info(f"Handling incremental improvement request: {prompt[:100]}...")
            spec = handle_incremental_improvement(prompt, previous_dashboard, schema_context, data_source_id, table_name)
        else:
            # Mock generation as fallback
            logger.info(f"Using mock generation with schema context: {schema_context}")
            spec = generate_mock_dashboard(prompt, schema_context, data_source_id, table_name)
        
        return jsonify({'spec': spec})
        
    except Exception as e:
        logger.error(f"Dashboard generation error: {e}")
        return jsonify({'error': str(e)}), 500

def get_schema_context():
    """Get schema context from connected data sources for AI"""
    try:
        sources = DataSource.query.limit(3).all()  # Limit to prevent too much context
        context = []
        
        for source in sources:
            context.append({
                'name': source.name,
                'type': source.connection_type,
                'tables': ['users', 'orders', 'products', 'sales', 'customers', 'transactions']  # Mock for now
            })
        
        return context
    except Exception as e:
        logger.error(f"Failed to get schema context: {e}")
        return []

def get_table_schema_context(data_source_id, table_name):
    """Get schema context for a specific table"""
    try:
        source = DataSource.query.get(data_source_id)
        if not source:
            return {'error': 'Data source not found'}
        
        # Try to get real schema from cache or database
        cache_key = f"schema_{data_source_id}_{table_name}"
        if cache_key in SCHEMA_CACHE:
            cached = SCHEMA_CACHE[cache_key]
            if time.time() - cached['timestamp'] < CACHE_TTL:
                return cached['data']
        
        # Fetch real schema if data source is properly configured
        if source.host and source.database:
            try:
                schema_data = fetch_real_table_schema(source, table_name)
                context = {
                    'dataSource': source.name,
                    'type': source.connection_type,
                    'table': table_name,
                    'columns': schema_data.get('columns', []),
                    'sampleData': schema_data.get('sampleData', [])
                }
                # Cache it
                SCHEMA_CACHE[cache_key] = {'data': context, 'timestamp': time.time()}
                return context
            except Exception as e:
                logger.error(f"Failed to fetch real schema: {e}")
        
        # Fallback to mock schema
        return {
            'dataSource': source.name,
            'type': source.connection_type,
            'table': table_name,
            'columns': [
                {'name': 'id', 'type': 'integer', 'nullable': False},
                {'name': 'name', 'type': 'varchar', 'nullable': True},
                {'name': 'value', 'type': 'numeric', 'nullable': True},
                {'name': 'date', 'type': 'timestamp', 'nullable': True},
                {'name': 'category', 'type': 'varchar', 'nullable': True}
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get table schema context: {e}")
        return {'error': str(e)}

def get_datamart_schema_context(data_mart_id):
    """Get schema context for a data mart"""
    try:
        data_mart = DataMart.query.get(data_mart_id)
        if not data_mart:
            return {'error': 'Data mart not found'}
        
        return {
            'dataMart': data_mart.name,
            'description': data_mart.description,
            'definition': data_mart.definition,
            'tables': data_mart.definition.get('tables', []) if data_mart.definition else []
        }
    except Exception as e:
        logger.error(f"Failed to get data mart schema context: {e}")
        return {'error': str(e)}

def fetch_real_table_schema(source, table_name):
    """Fetch real schema and sample data from a specific table"""
    try:
        # Build connection string
        if source.connection_type == 'postgresql':
            conn_str = f"postgresql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
        elif source.connection_type == 'mysql':
            conn_str = f"mysql+pymysql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}"
        else:
            raise Exception(f"Unsupported database type: {source.connection_type}")
        
        engine = create_engine(conn_str)
        inspector = inspect(engine)
        
        # Get columns
        columns = []
        for col in inspector.get_columns(table_name):
            columns.append({
                'name': col['name'],
                'type': str(col['type']),
                'nullable': col.get('nullable', True)
            })
        
        # Get sample data (first 5 rows)
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 5"))
            sample_data = [dict(row._mapping) for row in result]
        
        engine.dispose()
        
        return {
            'columns': columns,
            'sampleData': sample_data
        }
    except Exception as e:
        logger.error(f"Failed to fetch real table schema: {e}")
        raise

def handle_incremental_improvement(prompt, previous_dashboard, schema_context, data_source_id=None, table_name=None):
    """Handle incremental dashboard improvements based on chat requests"""
    
    prompt_lower = prompt.lower()
    logger.info(f"=== INCREMENTAL IMPROVEMENT ===")
    logger.info(f"User request: {prompt}")
    
    # Extract the actual user request from the combined prompt
    if 'USER REQUEST:' in prompt:
        user_request = prompt.split('USER REQUEST:')[1].split('Current Dashboard:')[0].strip()
        prompt_lower = user_request.lower()
        logger.info(f"Extracted user request: {user_request}")
    else:
        user_request = prompt
    
    # Make a copy of the previous dashboard
    import copy
    new_spec = copy.deepcopy(previous_dashboard)
    
    # Get table info
    if not table_name and isinstance(schema_context, dict):
        table_name = schema_context.get('table', 'data')
    if not table_name:
        table_name = 'data'
    
    # Extract columns from schema
    columns = []
    if isinstance(schema_context, dict):
        columns = schema_context.get('columns', [])
    column_names = [col['name'] for col in columns] if columns else []
    
    logger.info(f"Available columns: {column_names}")
    
    # Detect intent and make changes
    changes_made = []
    
    # 1. ADD CHART requests
    if any(word in prompt_lower for word in ['add', 'create', 'new']) and any(word in prompt_lower for word in ['chart', 'graph', 'bar', 'pie', 'line']):
        logger.info("Detected: ADD CHART request")
        
        # Detect chart type
        chart_type = 'bar'
        if 'pie' in prompt_lower:
            chart_type = 'pie'
        elif 'line' in prompt_lower:
            chart_type = 'line'
        elif 'bar' in prompt_lower or 'column' in prompt_lower:
            chart_type = 'bar'
        
        # Detect which column to use
        category_col = None
        numeric_col = None
        
        # Look for specific columns mentioned in request
        for col in column_names:
            if col.lower() in prompt_lower:
                if any(x in col.lower() for x in ['sales', 'revenue', 'amount', 'value', 'total', 'quantity']):
                    numeric_col = col
                elif any(x in col.lower() for x in ['product', 'category', 'region', 'family', 'brand', 'site', 'cluster']):
                    category_col = col
        
        # If no specific column found, use smart defaults
        if not numeric_col:
            numeric_cols = [c for c in column_names if any(x in c.lower() for x in ['sales', 'revenue', 'amount', 'value', 'total', 'quantity'])]
            numeric_col = numeric_cols[0] if numeric_cols else (column_names[0] if column_names else 'value')
        
        if not category_col:
            category_cols = [c for c in column_names if any(x in c.lower() for x in ['product', 'category', 'region', 'family', 'brand', 'site', 'cluster'])]
            category_col = category_cols[0] if category_cols else (column_names[1] if len(column_names) > 1 else 'category')
        
        # Create new chart
        chart_id = f"chart{len(new_spec['charts']) + 1}"
        
        if chart_type == 'pie':
            new_chart = {
                'id': chart_id,
                'type': 'pie',
                'title': f'🥧 {numeric_col.replace("_", " ").title()} by {category_col.replace("_", " ").title()}',
                'query': f'SELECT {category_col}, SUM({numeric_col}) as value FROM {table_name} GROUP BY {category_col} ORDER BY SUM({numeric_col}) DESC LIMIT 10',
                'dataSourceId': data_source_id if data_source_id else 'default',
                'x': category_col,
                'y': 'value',
                'features': ['exportCSV']
            }
        elif chart_type == 'line':
            date_cols = [c for c in column_names if any(x in c.lower() for x in ['date', 'time', 'created', 'updated'])]
            date_col = date_cols[0] if date_cols else 'date'
            new_chart = {
                'id': chart_id,
                'type': 'line',
                'title': f'📈 {numeric_col.replace("_", " ").title()} Trend Over Time',
                'query': f'SELECT {date_col}, SUM({numeric_col}) as {numeric_col} FROM {table_name} GROUP BY {date_col} ORDER BY {date_col} LIMIT 30',
                'dataSourceId': data_source_id if data_source_id else 'default',
                'x': date_col,
                'y': numeric_col,
                'features': ['exportCSV']
            }
        else:  # bar
            new_chart = {
                'id': chart_id,
                'type': 'bar',
                'title': f'📊 {numeric_col.replace("_", " ").title()} by {category_col.replace("_", " ").title()}',
                'query': f'SELECT {category_col}, SUM({numeric_col}) as value FROM {table_name} GROUP BY {category_col} ORDER BY SUM({numeric_col}) DESC LIMIT 10',
                'dataSourceId': data_source_id if data_source_id else 'default',
                'x': category_col,
                'y': 'value',
                'features': ['exportCSV']
            }
        
        new_spec['charts'].append(new_chart)
        changes_made.append(f"Added {chart_type} chart for {category_col}")
        logger.info(f"Added new {chart_type} chart: {new_chart['title']}")
    
    # 2. CHANGE THEME requests
    elif any(word in prompt_lower for word in ['change', 'switch', 'use']) and any(word in prompt_lower for word in ['theme', 'color', 'style']):
        logger.info("Detected: CHANGE THEME request")
        
        # Detect theme
        new_theme = None
        if 'ocean' in prompt_lower or 'blue' in prompt_lower:
            new_theme = 'ocean'
        elif 'dark' in prompt_lower:
            new_theme = 'dark'
        elif 'forest' in prompt_lower or 'green' in prompt_lower:
            new_theme = 'forest'
        elif 'sunset' in prompt_lower or 'orange' in prompt_lower:
            new_theme = 'sunset'
        elif 'royal' in prompt_lower or 'purple' in prompt_lower:
            new_theme = 'royal'
        elif 'minimal' in prompt_lower or 'simple' in prompt_lower:
            new_theme = 'minimal'
        elif 'corporate' in prompt_lower:
            new_theme = 'corporate'
        else:
            # No specific theme mentioned, pick a different one from current
            current_theme = new_spec.get('theme', 'default')
            available_themes = ['ocean', 'dark', 'forest', 'sunset', 'royal', 'minimal']
            # Remove current theme from options
            other_themes = [t for t in available_themes if t != current_theme]
            # Pick the first different theme (ocean if current is default)
            new_theme = other_themes[0] if other_themes else 'ocean'
            logger.info(f"No specific theme requested, changing from {current_theme} to {new_theme}")
        
        # Only make change if theme is actually different
        if new_theme != new_spec.get('theme', 'default'):
            new_spec['theme'] = new_theme
            changes_made.append(f"Changed theme to {new_theme}")
            logger.info(f"Changed theme to: {new_theme}")
        else:
            logger.info(f"Theme is already {new_theme}, no change needed")
    
    # 3. MODIFY DATA (top 5, top 10, etc.)
    elif any(word in prompt_lower for word in ['top', 'show', 'limit', 'only']):
        logger.info("Detected: MODIFY DATA request")
        
        # Extract number
        import re
        numbers = re.findall(r'\d+', user_request)
        if numbers:
            limit = int(numbers[0])
            logger.info(f"Found limit: {limit}")
            
            # Update all bar/pie charts to use the new limit
            for chart in new_spec['charts']:
                if chart.get('type') in ['bar', 'pie']:
                    # Update LIMIT in query
                    if 'LIMIT' in chart.get('query', ''):
                        chart['query'] = re.sub(r'LIMIT \d+', f'LIMIT {limit}', chart['query'])
                    else:
                        chart['query'] = chart.get('query', '') + f' LIMIT {limit}'
                    logger.info(f"Updated chart {chart['id']} to show top {limit}")
            
            changes_made.append(f"Updated charts to show top {limit}")
    
    # 4. ADD FILTERS
    elif any(word in prompt_lower for word in ['add', 'create']) and 'filter' in prompt_lower:
        logger.info("Detected: ADD FILTER request")
        
        # Detect which column to filter by
        category_cols = [c for c in column_names if any(x in c.lower() for x in ['product', 'category', 'region', 'family', 'brand', 'site', 'cluster'])]
        
        # Look for specific column in request
        filter_col = None
        for col in category_cols:
            if col.lower() in prompt_lower:
                filter_col = col
                break
        
        if not filter_col and category_cols:
            filter_col = category_cols[0]
        
        if filter_col:
            # Add filter to dashboard
            if 'filters' not in new_spec:
                new_spec['filters'] = []
            
            new_spec['filters'].append({
                'name': filter_col,
                'type': 'dropdown',
                'options': ['All', 'Option 1', 'Option 2'],
                'default': 'All',
                'label': filter_col.replace('_', ' ').title()
            })
            changes_made.append(f"Added filter for {filter_col}")
            logger.info(f"Added filter for: {filter_col}")
    
    # 5. REARRANGE CHARTS / CHANGE LAYOUT
    elif any(word in prompt_lower for word in ['rearrange', 'reorder', 'placement', 'layout', 'organize']):
        logger.info("Detected: REARRANGE CHARTS request")
        
        # Smart rearrangement logic
        charts = new_spec['charts']
        
        # Separate charts by type
        kpi_charts = [c for c in charts if c.get('type') == 'kpi']
        line_charts = [c for c in charts if c.get('type') == 'line']
        bar_charts = [c for c in charts if c.get('type') == 'bar']
        pie_charts = [c for c in charts if c.get('type') == 'pie']
        table_charts = [c for c in charts if c.get('type') == 'table']
        other_charts = [c for c in charts if c.get('type') not in ['kpi', 'line', 'bar', 'pie', 'table']]
        
        # Lovable-style arrangement:
        # 1. KPIs at the top (row 1)
        # 2. Line charts (trends) (row 2)
        # 3. Bar/Pie charts (comparisons) (row 3+)
        # 4. Tables at the bottom (full width)
        
        rearranged = []
        rearranged.extend(kpi_charts)  # KPIs first
        rearranged.extend(line_charts)  # Trends second
        rearranged.extend(bar_charts)  # Bar charts third
        rearranged.extend(pie_charts)  # Pie charts fourth
        rearranged.extend(other_charts)  # Other charts
        rearranged.extend(table_charts)  # Tables last (full width)
        
        new_spec['charts'] = rearranged
        changes_made.append(f"Rearranged {len(charts)} charts for better layout")
        logger.info(f"Rearranged charts: {len(kpi_charts)} KPIs, {len(line_charts)} lines, {len(bar_charts)} bars, {len(pie_charts)} pies, {len(table_charts)} tables")
    
    # If no changes detected, regenerate from scratch
    if not changes_made:
        logger.warning("No specific changes detected, regenerating dashboard")
        return generate_mock_dashboard(prompt, schema_context, data_source_id, table_name)
    
    logger.info(f"Changes made: {changes_made}")
    return new_spec

def generate_mock_dashboard(prompt, schema_context, data_source_id=None, table_name_param=None):
    """Generate mock dashboard when AI is not available"""
    # Analyze prompt for keywords
    prompt_lower = prompt.lower()
    
    # Log data source ID
    logger.info(f"=== DASHBOARD GENERATION ===")
    logger.info(f"Data Source ID: {data_source_id if data_source_id else 'default (mock)'}")
    logger.info(f"Table Name Param: {table_name_param}")
    
    # Get table name - prioritize parameter, then schema context, then default
    table_name = 'sales'  # Default
    columns = []
    
    # Extract columns from schema context first (always)
    if isinstance(schema_context, dict):
        columns = schema_context.get('columns', [])
        logger.info(f"Extracted {len(columns)} columns from schema context")
    
    # Then determine table name
    if table_name_param:
        table_name = table_name_param
        logger.info(f"Using table name from parameter: {table_name}")
    elif isinstance(schema_context, dict):
        if 'table' in schema_context:
            table_name = schema_context['table']
            logger.info(f"Using table name from schema context: {table_name}")
        elif 'dataMart' in schema_context:
            table_name = schema_context.get('dataMart', 'sales')
            logger.info(f"Using data mart name: {table_name}")
    
    logger.info(f"Generating dashboard for table: {table_name} on data source: {data_source_id if data_source_id else 'default'}")
    
    # Extract column names from schema
    column_names = [col['name'] for col in columns] if columns else []
    logger.info(f"Available columns: {column_names}")
    
    # Intelligently find ALL numeric, date, and category columns
    numeric_cols = [c for c in column_names if any(x in c.lower() for x in ['sales', 'revenue', 'amount', 'value', 'total', 'price', 'cost', 'quantity', 'margin', 'target', 'discount'])]
    date_cols = [c for c in column_names if any(x in c.lower() for x in ['date', 'time', 'created', 'updated', 'day', 'month', 'year'])]
    category_cols = [c for c in column_names if any(x in c.lower() for x in ['product', 'category', 'name', 'type', 'region', 'family', 'brand', 'site', 'cluster'])]
    
    # Select primary columns (prefer the first match or most relevant based on prompt)
    numeric_col = numeric_cols[0] if numeric_cols else (column_names[0] if column_names else 'value')
    date_col = date_cols[0] if date_cols else 'date'
    category_col = category_cols[0] if category_cols else 'category'
    
    # Look for specific columns mentioned in prompt
    for col in column_names:
        if col.lower() in prompt_lower:
            if any(x in col.lower() for x in ['sales', 'revenue', 'amount', 'total', 'margin']):
                numeric_col = col
            elif any(x in col.lower() for x in ['region', 'family', 'brand', 'site']):
                category_col = col
    
    logger.info(f"Smart selection - numeric: {numeric_col}, date: {date_col}, category: {category_col}")
    logger.info(f"All numeric columns: {numeric_cols}")
    logger.info(f"All category columns: {category_cols}")
    
    # Determine chart types based on keywords and data
    charts = []
    chart_id = 1
    
    # Always add primary KPI for main numeric column
    kpi_title = f'Total {numeric_col.replace("_", " ").title()}'
    if any(x in numeric_col.lower() for x in ['sales', 'revenue']):
        kpi_title = f'💰 {kpi_title}'
    elif any(x in numeric_col.lower() for x in ['quantity', 'count']):
        kpi_title = f'📦 {kpi_title}'
    elif any(x in numeric_col.lower() for x in ['margin', 'profit']):
        kpi_title = f'💵 {kpi_title}'
    
    charts.append({
        'id': f'chart{chart_id}',
        'type': 'kpi',
        'title': kpi_title,
        'query': f'SELECT SUM({numeric_col}) as value FROM {table_name}',
        'dataSourceId': data_source_id if data_source_id else 'default',
        'x': 'label',
        'y': 'value',
        'features': []
    })
    chart_id += 1
    
    # Add more KPIs for other important numeric columns (max 3 total KPIs)
    for extra_col in (numeric_cols[1:3] if len(numeric_cols) > 1 else []):
        if extra_col != numeric_col:
            extra_kpi_title = f'Total {extra_col.replace("_", " ").title()}'
            if any(x in extra_col.lower() for x in ['target']):
                extra_kpi_title = f'🎯 {extra_kpi_title}'
            elif any(x in extra_col.lower() for x in ['quantity', 'count']):
                extra_kpi_title = f'📦 {extra_kpi_title}'
            elif any(x in extra_col.lower() for x in ['margin', 'profit']):
                extra_kpi_title = f'💵 {extra_kpi_title}'
            
            charts.append({
                'id': f'chart{chart_id}',
                'type': 'kpi',
                'title': extra_kpi_title,
                'query': f'SELECT SUM({extra_col}) as value FROM {table_name}',
                'dataSourceId': data_source_id if data_source_id else 'default',
                'x': 'label',
                'y': 'value',
                'features': []
            })
            chart_id += 1
    
    # Add time series if time-related
    if any(word in prompt_lower for word in ['month', 'day', 'time', 'trend', 'over', 'daily', 'weekly', 'show']):
        # Use simple query without filters for now
        charts.append({
            'id': f'chart{chart_id}',
            'type': 'line',
            'title': f'📈 {numeric_col.replace("_", " ").title()} Trend Over Time',
            'query': f'SELECT {date_col}, SUM({numeric_col}) as {numeric_col} FROM {table_name} GROUP BY {date_col} ORDER BY {date_col} LIMIT 30',
            'dataSourceId': data_source_id if data_source_id else 'default',
            'x': date_col,
            'y': numeric_col,
            'features': ['exportCSV']
        })
        chart_id += 1
    
    # Add bar charts for categorical breakdowns
    # Check which categories are mentioned in prompt
    mentioned_cats = [cat for cat in category_cols if cat.lower() in prompt_lower]
    cats_to_use = mentioned_cats if mentioned_cats else [category_col]
    
    # Add up to 2 category breakdowns
    for idx, cat in enumerate(cats_to_use[:2]):
        bar_icon = '📊' if idx == 0 else '📉'
        charts.append({
            'id': f'chart{chart_id}',
            'type': 'bar',
            'title': f'{bar_icon} {numeric_col.replace("_", " ").title()} by {cat.replace("_", " ").title()}',
            'query': f'SELECT {cat}, SUM({numeric_col}) as value FROM {table_name} GROUP BY {cat} ORDER BY SUM({numeric_col}) DESC LIMIT 10',
            'dataSourceId': data_source_id if data_source_id else 'default',
            'x': cat,
            'y': 'value',
            'features': ['exportCSV']
        })
        chart_id += 1
    
    # Add table for detailed data
    limit_clause = f'ORDER BY {date_col} DESC LIMIT 100' if date_col in column_names else 'LIMIT 100'
    charts.append({
        'id': f'chart{chart_id}',
        'type': 'table',
        'title': '📋 Detailed Data Table',
        'query': f'SELECT * FROM {table_name} {limit_clause}',
        'dataSourceId': data_source_id if data_source_id else 'default',
        'features': ['exportCSV']
    })
    
    # Generate dynamic filters based on actual data
    filters = []
    
    # Check which category columns to use as filters (up to 2-3 filters)
    potential_filter_cols = []
    
    # Priority for filters: region, family, brand, site, cluster, etc.
    filter_priority = ['region', 'family', 'brand', 'site', 'cluster', 'category', 'type', 'status']
    
    # Check which columns exist and are mentioned in prompt or are high-priority
    for priority_word in filter_priority:
        for cat_col in category_cols:
            if priority_word in cat_col.lower() and cat_col not in potential_filter_cols:
                # Check if mentioned in prompt or is a high-priority column
                if priority_word in prompt_lower or priority_word in ['region', 'family', 'brand']:
                    potential_filter_cols.append(cat_col)
                    break
    
    # If no filters found from priority, add first 2 category columns
    if not potential_filter_cols and category_cols:
        potential_filter_cols = category_cols[:2]
    
    # Generate filters with actual data values
    for filter_col in potential_filter_cols[:2]:  # Max 2 dropdown filters
        try:
            # Try to fetch unique values from the database
            if data_source_id and isinstance(schema_context, dict):
                source = DataSource.query.get(data_source_id)
                if source and source.host and source.database:
                    # Build connection and fetch unique values
                    if source.connection_type == 'postgresql':
                        conn_str = f"postgresql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
                    elif source.connection_type == 'mysql':
                        conn_str = f"mysql+pymysql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}"
                    else:
                        continue
                    
                    engine = create_engine(conn_str)
                    with engine.connect() as conn:
                        # Get distinct values, limit to 20 for dropdown
                        query = text(f"SELECT DISTINCT {filter_col} FROM {table_name} WHERE {filter_col} IS NOT NULL LIMIT 20")
                        result = conn.execute(query)
                        unique_values = [str(row[0]) for row in result if row[0]]
                        
                        if unique_values:
                            filters.append({
                                'name': filter_col,
                                'type': 'dropdown',
                                'options': unique_values,
                                'default': unique_values[0] if unique_values else '',
                                'label': filter_col.replace('_', ' ').title()
                            })
                            logger.info(f"Generated filter for {filter_col} with {len(unique_values)} options")
                    
                    engine.dispose()
        except Exception as e:
            logger.error(f"Failed to fetch filter values for {filter_col}: {e}")
            # Fallback to no filter for this column
            continue
    
    # Add date filter if date column exists and mentioned
    if date_col in column_names and any(word in prompt_lower for word in ['month', 'day', 'time', 'date', 'period', 'trend']):
        filters.append({
            'name': f'{date_col}_range',
            'type': 'dateRange',
            'default': '',
            'label': f'{date_col.replace("_", " ").title()}'
        })
    
    logger.info(f"Generated {len(filters)} dynamic filters: {[f['name'] for f in filters]}")
    
    # Determine theme
    theme = 'default'
    if 'dark' in prompt_lower:
        theme = 'dark'
    elif 'corporate' in prompt_lower:
        theme = 'corporate'
    
    logger.info(f"Generated {len(charts)} charts for dashboard")
    
    return {
        'title': f'{table_name.title()} Dashboard',
        'description': f'Analytics dashboard for {table_name} table - {prompt[:100]}',
        'theme': theme,
        'filters': filters,
        'charts': charts,
        'lastRefreshed': datetime.utcnow().isoformat() + 'Z',
        'metadata': {
            'dataSourceId': data_source_id if data_source_id else 'default',
            'table': table_name,
            'columns': column_names,
            'generatedWith': 'smart_mock' if columns else 'generic_mock',
            'chartCount': len(charts)
        }
    }

@app.route('/api/run-query', methods=['POST'])
@login_required
def run_query():
    """Execute SQL query against data source"""
    try:
        data = request.json
        query = data.get('query', '')
        data_source_id = data.get('dataSourceId', 'default')
        
        logger.info(f"🔍 /api/run-query - dataSourceId: {data_source_id}")
        logger.info(f"📝 Query: {query[:200]}...")
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        # For demo mode, return mock data
        if data_source_id == 'default':
            logger.warning(f"⚠️ Using MOCK data for query (dataSourceId='default')")
            # Generate mock data based on query
            mock_rows = generate_mock_query_results(query)
            return jsonify({'rows': mock_rows})
        
        # Check if query references any data marts and rewrite if needed
        query = rewrite_datamart_query(query, data_source_id)
        
        # Get data source
        source = DataSource.query.get(data_source_id)
        if not source:
            logger.error(f"❌ Data source not found: {data_source_id}")
            return jsonify({'error': 'Data source not found'}), 404
        
        logger.info(f"✅ Using real data source: {source.name} ({source.connection_type})")
        
        # Build connection string
        if source.connection_type == 'postgresql':
            conn_str = f"postgresql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}?gssencmode=disable"
        elif source.connection_type == 'mysql':
            conn_str = f"mysql+pymysql://{source.username}:{source.password}@{source.host}:{source.port}/{source.database}"
        else:
            return jsonify({'error': f'Unsupported data source type: {source.connection_type}'}), 400
        
        # Execute query safely
        engine = create_engine(conn_str)
        try:
            with engine.connect() as conn:
                result = conn.execute(text(query))
                
                # Convert rows to JSON-serializable format
                rows = []
                for row in result:
                    row_dict = {}
                    for key, value in row._mapping.items():
                        # Handle None/NULL
                        if value is None:
                            row_dict[key] = None
                        # Handle datetime types
                        elif isinstance(value, datetime):
                            row_dict[key] = value.isoformat()
                        elif isinstance(value, (date, dt_time)):
                            row_dict[key] = str(value)
                        # Handle Decimal
                        elif isinstance(value, Decimal):
                            if value.is_nan() or value.is_infinite():
                                row_dict[key] = None
                            else:
                                row_dict[key] = float(value)
                        # Handle float (check for NaN/Inf)
                        elif isinstance(value, float):
                            if math.isnan(value) or math.isinf(value):
                                row_dict[key] = None
                            else:
                                row_dict[key] = value
                        else:
                            row_dict[key] = value
                    rows.append(row_dict)
                
                logger.info(f"✅ Query executed successfully. Returned {len(rows)} rows")
                if rows:
                    logger.info(f"📊 Sample row: {rows[0]}")
                
                return jsonify({'rows': rows})
        except SQLAlchemyError as e:
            logger.error(f"❌ Query execution error: {e}")
            return jsonify({'error': str(e)}), 500
        finally:
            engine.dispose()
            
    except Exception as e:
        logger.error(f"Run query error: {e}")
        return jsonify({'error': str(e)}), 500

def generate_mock_query_results(query):
    """Generate mock data for query results"""
    query_lower = query.lower()
    
    # KPI query
    if 'sum(' in query_lower and 'change' in query_lower:
        return [{'revenue': 1250000, 'change': 25.5}]
    
    # Time series query
    if 'group by date' in query_lower or 'group by month' in query_lower:
        import random
        from datetime import datetime, timedelta
        base_date = datetime.now() - timedelta(days=180)
        return [
            {'date': (base_date + timedelta(days=i*30)).strftime('%Y-%m-%d'), 
             'revenue': random.randint(50000, 150000)}
            for i in range(6)
        ]
    
    # Category query (products, regions, etc.)
    if 'group by' in query_lower and 'order by' in query_lower and 'limit' in query_lower:
        import random
        categories = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E', 
                     'Product F', 'Product G', 'Product H', 'Product I', 'Product J']
        return [
            {'product': cat, 'revenue': random.randint(10000, 100000)}
            for cat in categories
        ]
    
    # Detailed table query
    if 'select' in query_lower and 'from' in query_lower and 'limit' in query_lower:
        import random
        from datetime import datetime, timedelta
        base_date = datetime.now()
        return [
            {
                'date': (base_date - timedelta(days=i)).strftime('%Y-%m-%d'),
                'product': f'Product {chr(65 + (i % 10))}',
                'customer': f'Customer {i+1}',
                'revenue': random.randint(1000, 10000),
                'region': random.choice(['US', 'EU', 'APAC'])
            }
            for i in range(min(50, 100))
        ]
    
    # Default
    return [{'value': 'No data', 'count': 0}]

@app.route('/api/save-dashboard', methods=['POST'])
@login_required
def save_dashboard():
    """Save or update dashboard to database"""
    try:
        data = request.json
        title = data.get('title', '')
        description = data.get('description', '')
        spec = data.get('spec', {})
        dashboard_id = data.get('dashboardId')  # Check if updating existing dashboard
        
        if not title or not spec:
            return jsonify({'error': 'Title and spec are required'}), 400
        
        # Get user ID (use 'demo' for demo user)
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        if dashboard_id:
            # Update existing dashboard
            dashboard = Dashboard.query.filter_by(id=dashboard_id, user_id=user_id).first()
            
            if not dashboard:
                return jsonify({'error': 'Dashboard not found or access denied'}), 404
            
            dashboard.title = title
            dashboard.description = description
            dashboard.spec = spec
            dashboard.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"Dashboard updated: {dashboard.id} - {title}")
            message = 'Dashboard updated successfully'
        else:
            # Create new dashboard
            dashboard = Dashboard(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=title,
                description=description,
                spec=spec
            )
            
            db.session.add(dashboard)
            logger.info(f"Dashboard created: {dashboard.id} - {title}")
            message = 'Dashboard saved successfully'
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': message,
            'dashboard': dashboard.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Save dashboard error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-dashboards', methods=['GET'])
@login_required
def get_dashboards():
    """Get all dashboards for current user"""
    try:
        # Get user ID (use 'demo' for demo user)
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        dashboards = Dashboard.query.filter_by(user_id=user_id).order_by(Dashboard.created_at.desc()).all()
        
        return jsonify({
            'status': 'success',
            'dashboards': [d.to_dict() for d in dashboards]
        })
        
    except Exception as e:
        logger.error(f"Get dashboards error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboards/<dashboard_id>', methods=['GET'])
@login_required
def get_dashboard(dashboard_id):
    """Get a specific dashboard by ID"""
    try:
        # Get user ID
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        dashboard = Dashboard.query.filter_by(id=dashboard_id, user_id=user_id).first()
        
        if not dashboard:
            return jsonify({'error': 'Dashboard not found'}), 404
        
        return jsonify(dashboard.to_dict())
        
    except Exception as e:
        logger.error(f"Get dashboard error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-dashboard/<dashboard_id>', methods=['DELETE'])
@login_required
def delete_dashboard(dashboard_id):
    """Delete a dashboard"""
    try:
        dashboard = Dashboard.query.get(dashboard_id)
        
        if not dashboard:
            return jsonify({'error': 'Dashboard not found'}), 404
        
        # Check ownership
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        if dashboard.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(dashboard)
        db.session.commit()
        
        logger.info(f"Dashboard deleted: {dashboard_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Dashboard deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Delete dashboard error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =====================
# SCHEDULER API ENDPOINTS
# =====================

@app.route('/api/schedulers', methods=['GET'])
@login_required
def get_schedulers():
    """Get all schedulers for current user"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        schedulers = Scheduler.query.filter_by(user_id=user_id).order_by(Scheduler.created_at.desc()).all()
        
        # Enrich with dashboard info
        result = []
        for scheduler in schedulers:
            scheduler_dict = scheduler.to_dict()
            dashboard = Dashboard.query.get(scheduler.dashboard_id)
            if dashboard:
                scheduler_dict['dashboard_name'] = dashboard.title
            result.append(scheduler_dict)
        
        return jsonify({
            'status': 'success',
            'schedulers': result
        })
        
    except Exception as e:
        logger.error(f"Get schedulers error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedulers', methods=['POST'])
@login_required
def create_scheduler():
    """Create a new scheduler"""
    try:
        data = request.json
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        # Validate required fields
        required_fields = ['name', 'dashboard_id', 'delivery_method', 'frequency']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Calculate next run time based on frequency
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        schedule_time = data.get('schedule_time', '09:00')
        hour, minute = map(int, schedule_time.split(':'))
        
        if data['frequency'] == 'daily':
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_run < now:
                next_run += timedelta(days=1)
        elif data['frequency'] == 'weekly':
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            days_ahead = (data.get('day_of_week', 0) - now.weekday()) % 7
            if days_ahead == 0 and next_run < now:
                days_ahead = 7
            next_run += timedelta(days=days_ahead)
        elif data['frequency'] == 'monthly':
            day_of_month = data.get('day_of_month', 1)
            next_run = now.replace(day=day_of_month, hour=hour, minute=minute, second=0, microsecond=0)
            if next_run < now:
                # Move to next month
                if now.month == 12:
                    next_run = next_run.replace(year=now.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=now.month + 1)
        else:
            next_run = None
        
        scheduler = Scheduler(
            user_id=user_id,
            name=data['name'],
            dashboard_id=data['dashboard_id'],
            delivery_method=data['delivery_method'],
            recipients_email=data.get('recipients_email', ''),
            recipients_mobile=data.get('recipients_mobile', ''),
            subject=data.get('subject', ''),
            message=data.get('message', ''),
            frequency=data['frequency'],
            schedule_time=schedule_time,
            day_of_week=data.get('day_of_week'),
            day_of_month=data.get('day_of_month'),
            custom_cron=data.get('custom_cron'),
            timezone=data.get('timezone', 'UTC'),
            format_pdf=data.get('format_pdf', True),
            format_excel=data.get('format_excel', False),
            format_inline=data.get('format_inline', False),
            status='active',
            next_run=next_run
        )
        
        db.session.add(scheduler)
        db.session.commit()
        
        logger.info(f"Scheduler created: {scheduler.id} - {scheduler.name}")
        
        return jsonify({
            'status': 'success',
            'message': 'Scheduler created successfully',
            'scheduler': scheduler.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Create scheduler error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedulers/<scheduler_id>', methods=['GET'])
@login_required
def get_scheduler(scheduler_id):
    """Get a specific scheduler"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        scheduler = Scheduler.query.filter_by(id=scheduler_id, user_id=user_id).first()
        
        if not scheduler:
            return jsonify({'error': 'Scheduler not found'}), 404
        
        return jsonify(scheduler.to_dict())
        
    except Exception as e:
        logger.error(f"Get scheduler error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedulers/<scheduler_id>', methods=['PUT'])
@login_required
def update_scheduler(scheduler_id):
    """Update a scheduler"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        scheduler = Scheduler.query.filter_by(id=scheduler_id, user_id=user_id).first()
        
        if not scheduler:
            return jsonify({'error': 'Scheduler not found'}), 404
        
        data = request.json
        
        # Update fields
        updatable_fields = [
            'name', 'dashboard_id', 'delivery_method', 'recipients_email', 'recipients_mobile',
            'subject', 'message', 'frequency', 'schedule_time', 'day_of_week', 'day_of_month',
            'custom_cron', 'timezone', 'format_pdf', 'format_excel', 'format_inline', 'status'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(scheduler, field, data[field])
        
        scheduler.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Scheduler updated: {scheduler_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Scheduler updated successfully',
            'scheduler': scheduler.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Update scheduler error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedulers/<scheduler_id>', methods=['DELETE'])
@login_required
def delete_scheduler(scheduler_id):
    """Delete a scheduler"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        scheduler = Scheduler.query.filter_by(id=scheduler_id, user_id=user_id).first()
        
        if not scheduler:
            return jsonify({'error': 'Scheduler not found'}), 404
        
        db.session.delete(scheduler)
        db.session.commit()
        
        logger.info(f"Scheduler deleted: {scheduler_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Scheduler deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Delete scheduler error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedulers/<scheduler_id>/toggle', methods=['POST'])
@login_required
def toggle_scheduler(scheduler_id):
    """Toggle scheduler status (active/paused)"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        scheduler = Scheduler.query.filter_by(id=scheduler_id, user_id=user_id).first()
        
        if not scheduler:
            return jsonify({'error': 'Scheduler not found'}), 404
        
        # Toggle status
        scheduler.status = 'paused' if scheduler.status == 'active' else 'active'
        scheduler.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Scheduler toggled: {scheduler_id} -> {scheduler.status}")
        
        return jsonify({
            'status': 'success',
            'message': f'Scheduler {scheduler.status}',
            'scheduler': scheduler.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Toggle scheduler error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedulers/<scheduler_id>/test', methods=['POST'])
@login_required
def test_scheduler(scheduler_id):
    """Test a scheduler by sending a test report"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        scheduler = Scheduler.query.filter_by(id=scheduler_id, user_id=user_id).first()
        
        if not scheduler:
            return jsonify({'error': 'Scheduler not found'}), 404
        
        # Get dashboard
        dashboard = Dashboard.query.get(scheduler.dashboard_id)
        if not dashboard:
            return jsonify({'error': 'Dashboard not found'}), 404
        
        logger.info(f"Test scheduler: {scheduler_id} - {scheduler.name}")
        logger.info(f"Dashboard: {dashboard.title}")
        logger.info(f"Delivery method: {scheduler.delivery_method}")
        
        # Actually send based on delivery method
        success = False
        error_message = None
        
        if scheduler.delivery_method == 'email':
            if not scheduler.recipients_email:
                return jsonify({'error': 'No email recipients configured'}), 400
            
            # Create email content
            subject = scheduler.subject or f"Test Report: {dashboard.title}"
            
            # HTML email body
            body_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .dashboard-link {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }}
                    .info-box {{ background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 DataMantri Dashboard Report</h1>
                        <p style="margin: 0; opacity: 0.9;">Test Report</p>
                    </div>
                    <div class="content">
                        <h2 style="color: #667eea;">Dashboard: {dashboard.title}</h2>
                        
                        <div class="info-box">
                            <p><strong>Scheduler:</strong> {scheduler.name}</p>
                            <p><strong>Frequency:</strong> {scheduler.frequency.capitalize()}</p>
                            <p><strong>Generated:</strong> {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}</p>
                        </div>
                        
                        {'<p>' + scheduler.message + '</p>' if scheduler.message else '<p>This is a test report from your DataMantri scheduler.</p>'}
                        
                        <p>Your scheduled dashboard report is ready. Click the button below to view your dashboard:</p>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:8080/dashboard-view/{dashboard.id}" class="dashboard-link">
                                View Dashboard
                            </a>
                        </div>
                        
                        <div class="info-box">
                            <p style="margin: 0;"><strong>💡 Note:</strong> This is a test email. Your actual scheduled reports will be delivered according to your configured schedule ({scheduler.frequency}).</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Powered by <strong>DataMantri</strong></p>
                        <p>Automated Dashboard Reporting & Analytics</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Plain text version
            body_text = f"""
DataMantri Dashboard Report - Test

Dashboard: {dashboard.title}
Scheduler: {scheduler.name}
Frequency: {scheduler.frequency.capitalize()}
Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}

{scheduler.message if scheduler.message else 'This is a test report from your DataMantri scheduler.'}

View your dashboard: http://localhost:8080/dashboard-view/{dashboard.id}

Note: This is a test email. Your actual scheduled reports will be delivered according to your configured schedule.

---
Powered by DataMantri
Automated Dashboard Reporting & Analytics
            """
            
            # Send email
            success, error_message = send_email(
                to_emails=scheduler.recipients_email,
                subject=subject,
                body_html=body_html,
                body_text=body_text
            )
            
        elif scheduler.delivery_method == 'whatsapp':
            # WhatsApp integration would go here
            logger.info(f"WhatsApp not yet implemented. Would send to: {scheduler.recipients_mobile}")
            error_message = "WhatsApp delivery is not yet implemented. Coming soon!"
            
        elif scheduler.delivery_method == 'slack':
            # Slack integration would go here
            logger.info(f"Slack not yet implemented. Would send to: {scheduler.recipients_email}")
            error_message = "Slack delivery is not yet implemented. Coming soon!"
        
        # Update last_run status
        scheduler.last_run = datetime.utcnow()
        scheduler.last_status = 'success' if success else 'failed'
        scheduler.last_error = error_message if not success else None
        db.session.commit()
        
        if success:
            return jsonify({
                'status': 'success',
                'message': f'✅ Test report sent successfully via {scheduler.delivery_method}!',
                'test_details': {
                    'scheduler_name': scheduler.name,
                    'dashboard_name': dashboard.title,
                    'delivery_method': scheduler.delivery_method,
                    'recipients_email': scheduler.recipients_email,
                    'recipients_mobile': scheduler.recipients_mobile,
                    'subject': scheduler.subject,
                    'timestamp': datetime.utcnow().isoformat() + 'Z'
                }
            })
        else:
            return jsonify({
                'status': 'error',
                'error': error_message or 'Failed to send test report'
            }), 500
        
    except Exception as e:
        logger.error(f"Test scheduler error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedulers/stats', methods=['GET'])
@login_required
def get_scheduler_stats():
    """Get scheduler statistics"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        total = Scheduler.query.filter_by(user_id=user_id).count()
        active = Scheduler.query.filter_by(user_id=user_id, status='active').count()
        paused = Scheduler.query.filter_by(user_id=user_id, status='paused').count()
        
        # Count successful runs this month
        from datetime import datetime, timedelta
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        reports_sent = Scheduler.query.filter(
            Scheduler.user_id == user_id,
            Scheduler.last_run >= month_start,
            Scheduler.last_status == 'success'
        ).count()
        
        return jsonify({
            'status': 'success',
            'stats': {
                'total': total,
                'active': active,
                'paused': paused,
                'reports_sent_this_month': reports_sent
            }
        })
        
    except Exception as e:
        logger.error(f"Get scheduler stats error: {e}")
        return jsonify({'error': str(e)}), 500

# =====================
# UPLOAD CONFIGURATION API ENDPOINTS
# =====================

@app.route('/api/upload-configurations', methods=['GET'])
@login_required
def get_upload_configurations():
    """Get all upload configurations for current user"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        configurations = UploadConfiguration.query.filter_by(user_id=user_id).order_by(UploadConfiguration.created_at.desc()).all()
        
        # Enrich with data source info
        result = []
        for config in configurations:
            config_dict = config.to_dict()
            data_source = DataSource.query.get(config.data_source_id)
            if data_source:
                config_dict['data_source_name'] = data_source.name
                config_dict['data_source_type'] = data_source.connection_type
            result.append(config_dict)
        
        return jsonify({
            'status': 'success',
            'configurations': result
        })
        
    except Exception as e:
        logger.error(f"Get upload configurations error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-configurations', methods=['POST'])
@login_required
def create_upload_configuration():
    """Create a new upload configuration"""
    try:
        data = request.json
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        # Validate required fields
        required_fields = ['name', 'file_format', 'data_source_id', 'table_name']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        configuration = UploadConfiguration(
            user_id=user_id,
            created_by=user_id,
            name=data['name'],
            description=data.get('description', ''),
            file_format=data['file_format'],
            file_encoding=data.get('file_encoding', 'utf-8'),
            delimiter=data.get('delimiter', ','),
            has_header=data.get('has_header', True),
            data_source_id=data['data_source_id'],
            table_name=data['table_name'],
            upload_mode=data.get('upload_mode', 'append'),
            validation_rules=data.get('validation_rules', {}),
            transformation_rules=data.get('transformation_rules', {}),
            conditions=data.get('conditions', {}),
            status='active',
            is_active=True
        )
        
        db.session.add(configuration)
        db.session.commit()
        
        logger.info(f"Upload configuration created: {configuration.id} - {configuration.name}")
        
        return jsonify({
            'status': 'success',
            'message': 'Configuration created successfully',
            'configuration': configuration.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Create upload configuration error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-configurations/<config_id>', methods=['GET'])
@login_required
def get_upload_configuration(config_id):
    """Get a specific upload configuration"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        configuration = UploadConfiguration.query.filter_by(id=config_id, user_id=user_id).first()
        
        if not configuration:
            return jsonify({'error': 'Configuration not found'}), 404
        
        return jsonify(configuration.to_dict())
        
    except Exception as e:
        logger.error(f"Get upload configuration error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-configurations/<config_id>', methods=['PUT'])
@login_required
def update_upload_configuration(config_id):
    """Update an upload configuration"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        configuration = UploadConfiguration.query.filter_by(id=config_id, user_id=user_id).first()
        
        if not configuration:
            return jsonify({'error': 'Configuration not found'}), 404
        
        data = request.json
        
        # Update fields
        updatable_fields = [
            'name', 'description', 'file_format', 'file_encoding', 'delimiter',
            'has_header', 'data_source_id', 'table_name', 'upload_mode',
            'validation_rules', 'transformation_rules', 'conditions', 'status', 'is_active'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(configuration, field, data[field])
        
        configuration.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Upload configuration updated: {config_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Configuration updated successfully',
            'configuration': configuration.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Update upload configuration error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-configurations/<config_id>', methods=['DELETE'])
@login_required
def delete_upload_configuration(config_id):
    """Delete an upload configuration"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        configuration = UploadConfiguration.query.filter_by(id=config_id, user_id=user_id).first()
        
        if not configuration:
            return jsonify({'error': 'Configuration not found'}), 404
        
        # Delete sample file if exists
        if configuration.sample_file_path and os.path.exists(configuration.sample_file_path):
            try:
                os.remove(configuration.sample_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete sample file: {e}")
        
        db.session.delete(configuration)
        db.session.commit()
        
        logger.info(f"Upload configuration deleted: {config_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Configuration deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Delete upload configuration error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-configurations/<config_id>/sample', methods=['POST'])
@login_required
def upload_sample_file(config_id):
    """Upload a sample file for a configuration"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        configuration = UploadConfiguration.query.filter_by(id=config_id, user_id=user_id).first()
        
        if not configuration:
            return jsonify({'error': 'Configuration not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.getcwd(), 'uploads', 'samples')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Delete old sample file if exists
        if configuration.sample_file_path and os.path.exists(configuration.sample_file_path):
            try:
                os.remove(configuration.sample_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete old sample file: {e}")
        
        # Save new sample file
        filename = f"{config_id}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Update configuration
        configuration.sample_file_name = file.filename
        configuration.sample_file_path = file_path
        configuration.sample_file_size = os.path.getsize(file_path)
        configuration.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Sample file uploaded for configuration: {config_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Sample file uploaded successfully',
            'file_info': {
                'name': configuration.sample_file_name,
                'size': configuration.sample_file_size
            }
        })
        
    except Exception as e:
        logger.error(f"Upload sample file error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-configurations/<config_id>/sample', methods=['GET'])
@login_required
def download_sample_file(config_id):
    """Download the sample file for a configuration"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        configuration = UploadConfiguration.query.filter_by(id=config_id, user_id=user_id).first()
        
        if not configuration:
            return jsonify({'error': 'Configuration not found'}), 404
        
        if not configuration.sample_file_path or not os.path.exists(configuration.sample_file_path):
            return jsonify({'error': 'Sample file not found'}), 404
        
        return send_from_directory(
            os.path.dirname(configuration.sample_file_path),
            os.path.basename(configuration.sample_file_path),
            as_attachment=True,
            download_name=configuration.sample_file_name
        )
        
    except Exception as e:
        logger.error(f"Download sample file error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-configurations/<config_id>/upload', methods=['POST'])
@login_required
def upload_file_to_configuration(config_id):
    """Upload a file using a configuration"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        configuration = UploadConfiguration.query.filter_by(id=config_id, user_id=user_id).first()
        
        if not configuration:
            return jsonify({'error': 'Configuration not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Create upload history record
        history = UploadHistory(
            configuration_id=config_id,
            user_id=user_id,
            file_name=file.filename,
            file_size=len(file.read()),
            status='processing'
        )
        file.seek(0)  # Reset file pointer after reading size
        
        db.session.add(history)
        db.session.commit()
        
        # TODO: Process file based on configuration
        # This would involve:
        # 1. Validating file against validation_rules
        # 2. Applying transformation_rules
        # 3. Loading data into target table
        # 4. Updating history record with results
        
        # For now, just update status to success
        history.status = 'success'
        history.completed_at = datetime.utcnow()
        history.records_processed = 0  # Placeholder
        history.records_success = 0  # Placeholder
        
        # Update configuration stats
        configuration.total_uploads += 1
        configuration.last_upload_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"File uploaded for configuration: {config_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'File uploaded successfully',
            'history': history.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Upload file error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-history', methods=['GET'])
@login_required
def get_upload_history():
    """Get upload history for current user"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        # Get configurations for this user
        config_ids = [c.id for c in UploadConfiguration.query.filter_by(user_id=user_id).all()]
        
        # Get history for these configurations
        history = UploadHistory.query.filter(
            UploadHistory.configuration_id.in_(config_ids)
        ).order_by(UploadHistory.started_at.desc()).limit(100).all()
        
        # Enrich with configuration names
        result = []
        for h in history:
            h_dict = h.to_dict()
            config = UploadConfiguration.query.get(h.configuration_id)
            if config:
                h_dict['configuration_name'] = config.name
            result.append(h_dict)
        
        return jsonify({
            'status': 'success',
            'history': result
        })
        
    except Exception as e:
        logger.error(f"Get upload history error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-configurations/stats', methods=['GET'])
@login_required
def get_upload_stats():
    """Get upload statistics"""
    try:
        user_id = str(current_user.id) if hasattr(current_user, 'id') else 'demo'
        
        total = UploadConfiguration.query.filter_by(user_id=user_id).count()
        active = UploadConfiguration.query.filter_by(user_id=user_id, is_active=True).count()
        
        # Total uploads this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        config_ids = [c.id for c in UploadConfiguration.query.filter_by(user_id=user_id).all()]
        uploads_this_month = UploadHistory.query.filter(
            UploadHistory.configuration_id.in_(config_ids),
            UploadHistory.started_at >= month_start
        ).count()
        
        successful_uploads = UploadHistory.query.filter(
            UploadHistory.configuration_id.in_(config_ids),
            UploadHistory.started_at >= month_start,
            UploadHistory.status == 'success'
        ).count()
        
        return jsonify({
            'status': 'success',
            'stats': {
                'total_configurations': total,
                'active_configurations': active,
                'uploads_this_month': uploads_this_month,
                'successful_uploads': successful_uploads
            }
        })
        
    except Exception as e:
        logger.error(f"Get upload stats error: {e}")
        return jsonify({'error': str(e)}), 500

# ==========================================
# END AI DASHBOARD BUILDER APIS
# ==========================================

# Serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

def seed_demo_data():
    """Seed database with demo data sources if empty"""
    try:
        # Check if any data sources exist
        if DataSource.query.count() == 0:
            logger.info("Seeding database with demo data sources...")
            
            demo_sources = [
                DataSource(
                    id='1',
                    name='PostgreSQL Production',
                    connection_type='postgresql',
                    host='localhost',
                    port=5432,
                    database='prod_db',
                    username='admin',
                    status='connected'
                ),
                DataSource(
                    id='2',
                    name='MySQL Analytics',
                    connection_type='mysql',
                    host='localhost',
                    port=3306,
                    database='analytics_db',
                    username='analytics_user',
                    status='connected'
                ),
                DataSource(
                    id='3',
                    name='MongoDB Logs',
                    connection_type='mongodb',
                    host='localhost',
                    port=27017,
                    database='logs_db',
                    username='logs_user',
                    status='connected'
                )
            ]
            
            for source in demo_sources:
                db.session.add(source)
            
            db.session.commit()
            logger.info(f"Successfully seeded {len(demo_sources)} demo data sources")
    except Exception as e:
        logger.error(f"Failed to seed demo data: {e}")
        db.session.rollback()

def fix_data_mart_sources():
    """Fix data marts that don't have a data_source_id"""
    try:
        # Get all data marts without a data_source_id
        marts_without_source = DataMart.query.filter(
            (DataMart.data_source_id == None) | (DataMart.data_source_id == '')
        ).all()
        
        if not marts_without_source:
            logger.info("All data marts already have data source IDs")
            return
        
        logger.info(f"Fixing {len(marts_without_source)} data marts without source IDs...")
        
        # Get the first available data source as default
        default_source = DataSource.query.first()
        
        if not default_source:
            logger.warning("No data sources available to assign to data marts")
            return
        
        fixed_count = 0
        for mart in marts_without_source:
            # Try to get data_source_id from definition first
            source_id = None
            if isinstance(mart.definition, dict):
                source_id = mart.definition.get('dataSourceId') or mart.definition.get('data_source_id')
            
            # If not found in definition, use default source
            if not source_id:
                source_id = default_source.id
                logger.info(f"Assigning default source '{default_source.name}' to data mart '{mart.name}'")
            
            mart.data_source_id = source_id
            fixed_count += 1
        
        db.session.commit()
        logger.info(f"Successfully fixed {fixed_count} data marts")
        
    except Exception as e:
        logger.error(f"Failed to fix data mart sources: {e}")
        db.session.rollback()

# =============================================
# ACCESS MANAGEMENT API ENDPOINTS (Phase 2)
# =============================================

# Organizations Management (Super Admin Only)
@app.route('/api/organizations', methods=['GET', 'POST'])
@login_required
def organizations_api():
    """Manage organizations (Super Admin only)"""
    
    if request.method == 'GET':
        try:
            # Super admin can see all organizations
            if str(current_user.id) == 'demo' or getattr(current_user, 'is_admin', False):
                orgs = Organization.query.all()
                return jsonify([org.to_dict() for org in orgs])
            
            # Regular users can only see their own organization
            org_id = get_user_organization_id()
            if org_id:
                org = Organization.query.get(org_id)
                if org:
                    return jsonify([org.to_dict()])
            
            return jsonify([])
            
        except Exception as e:
            logger.exception(f"Failed to fetch organizations: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            # Only super admin can create organizations
            if str(current_user.id) != 'demo' and not getattr(current_user, 'is_admin', False):
                return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
            
            data = request.json
            
            # Create slug from name
            slug = data.get('name', '').lower().replace(' ', '-').replace('_', '-')
            
            # Check if slug already exists
            existing_org = Organization.query.filter_by(slug=slug).first()
            if existing_org:
                return jsonify({'status': 'error', 'message': 'Organization with this name already exists'}), 400
            
            new_org = Organization(
                id=str(uuid.uuid4()),
                name=data.get('name'),
                slug=slug,
                domain=data.get('domain'),
                logo_url=data.get('logo_url'),
                plan_type=data.get('plan_type', 'free'),
                max_users=data.get('max_users', 10),
                max_data_sources=data.get('max_data_sources', 5),
                max_dashboards=data.get('max_dashboards', 20),
                features=data.get('features', {}),
                is_active=True,
                created_by=str(current_user.id)
            )
            
            db.session.add(new_org)
            db.session.commit()
            
            logger.info(f"Created organization: {new_org.name} (ID: {new_org.id})")
            return jsonify(new_org.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to create organization: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/organizations/<org_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def organization_detail_api(org_id):
    """Get, update, or delete a specific organization"""
    
    org = Organization.query.get(org_id)
    if not org:
        return jsonify({'status': 'error', 'message': 'Organization not found'}), 404
    
    # Check permissions
    is_super_admin = str(current_user.id) == 'demo' or getattr(current_user, 'is_admin', False)
    
    if request.method == 'GET':
        # Super admin or members of the org can view
        if is_super_admin or get_user_organization_id() == org_id:
            return jsonify(org.to_dict())
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
    
    elif request.method == 'PUT':
        # Only super admin can update
        if not is_super_admin:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
        try:
            data = request.json
            org.name = data.get('name', org.name)
            org.domain = data.get('domain', org.domain)
            org.logo_url = data.get('logo_url', org.logo_url)
            org.plan_type = data.get('plan_type', org.plan_type)
            org.max_users = data.get('max_users', org.max_users)
            org.max_data_sources = data.get('max_data_sources', org.max_data_sources)
            org.max_dashboards = data.get('max_dashboards', org.max_dashboards)
            org.features = data.get('features', org.features)
            org.is_active = data.get('is_active', org.is_active)
            
            db.session.commit()
            return jsonify(org.to_dict())
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update organization: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    elif request.method == 'DELETE':
        # Only super admin can delete
        if not is_super_admin:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
        try:
            db.session.delete(org)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Organization deleted'})
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to delete organization: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

# Users Management
@app.route('/api/users', methods=['GET', 'POST'])
@login_required
def users_api():
    """Manage users"""
    
    if request.method == 'GET':
        try:
            org_id = get_user_organization_id()
            
            # Super admin can see all users
            if str(current_user.id) == 'demo':
                users = User.query.all()
            else:
                # Regular users see only users in their organization
                users = User.query.filter_by(organization_id=org_id).all()
            
            # Convert to dict with organization info
            result = []
            for user in users:
                user_dict = {
                    'id': user.id,
                    'email': user.email,
                    'first_name': getattr(user, 'first_name', ''),
                    'last_name': getattr(user, 'last_name', ''),
                    'role': user.role,
                    'is_active': user.is_active,
                    'is_admin': user.is_admin,
                    'organization_id': user.organization_id,
                    'last_login': user.last_login_at.isoformat() + 'Z' if user.last_login_at else None,
                    'created_at': user.created_at.isoformat() + 'Z' if user.created_at else None,
                    'updated_at': user.updated_at.isoformat() + 'Z' if user.updated_at else None
                }
                
                # Get organization name
                if user.organization_id:
                    org = Organization.query.get(user.organization_id)
                    if org:
                        user_dict['organization_name'] = org.name
                
                # Get created_by user name
                if hasattr(user, 'created_by') and user.created_by:
                    creator = User.query.get(user.created_by)
                    if creator:
                        user_dict['created_by_name'] = f"{creator.first_name or ''} {creator.last_name or ''}".strip() or creator.email
                    else:
                        user_dict['created_by_name'] = 'System'
                else:
                    user_dict['created_by_name'] = 'System'
                
                # Get updated_by user name
                if hasattr(user, 'updated_by') and user.updated_by:
                    updater = User.query.get(user.updated_by)
                    if updater:
                        user_dict['updated_by_name'] = f"{updater.first_name or ''} {updater.last_name or ''}".strip() or updater.email
                    else:
                        user_dict['updated_by_name'] = None
                else:
                    user_dict['updated_by_name'] = None
                
                result.append(user_dict)
            
            return jsonify(result)
            
        except Exception as e:
            logger.exception(f"Failed to fetch users: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.json
            
            # Check if user already exists
            existing_user = User.query.filter_by(email=data.get('email')).first()
            if existing_user:
                return jsonify({'status': 'error', 'message': 'User with this email already exists'}), 400
            
            # Get organization (use current user's org unless super admin assigns different)
            org_id = data.get('organization_id')
            if not org_id or (str(current_user.id) != 'demo' and not getattr(current_user, 'is_admin', False)):
                org_id = get_user_organization_id()
            
            # Create new user
            new_user = User(
                id=str(uuid.uuid4()),
                email=data.get('email'),
                password_hash=generate_password_hash(data.get('password', 'changeme')),  # Default password
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                role=data.get('role', 'viewer'),
                is_active=True,
                is_admin=data.get('role') in ['admin', 'super_admin'],
                organization_id=org_id,
                created_by=str(current_user.id)
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            logger.info(f"Created user: {new_user.email} (ID: {new_user.id})")
            return jsonify({'status': 'success', 'message': 'User created successfully', 'id': new_user.id}), 201
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to create user: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/users/<user_id>/status', methods=['PATCH'])
@login_required
def update_user_status(user_id):
    """Toggle user active status"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'status': 'error', 'message': 'User not found'}), 404
        
        # Check permissions (must be in same org or super admin)
        org_id = get_user_organization_id()
        if str(current_user.id) != 'demo' and user.organization_id != org_id:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
        data = request.json
        user.is_active = data.get('is_active', user.is_active)
        user.updated_by = str(current_user.id)
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'User status updated'})
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Failed to update user status: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Roles Management
@app.route('/api/roles', methods=['GET', 'POST'])
@login_required
def roles_api():
    """Manage roles"""
    
    if request.method == 'GET':
        try:
            org_id = get_user_organization_id()
            
            # Get platform roles + organization roles
            if str(current_user.id) == 'demo':
                roles = Role.query.all()
            else:
                # Get platform roles and roles for current organization
                roles = Role.query.filter(
                    (Role.level == 'platform') | 
                    (Role.organization_id == org_id)
                ).all()
            
            # Format roles with permissions
            result = []
            for role in roles:
                role_dict = role.to_dict()
                
                # Get permissions for this role
                role_perms = RolePermission.query.filter_by(role_id=role.id).all()
                permissions = {}
                for rp in role_perms:
                    permissions[rp.permission_id] = True
                
                role_dict['permissions'] = permissions
                role_dict['is_system_role'] = role.is_system
                
                result.append(role_dict)
            
            return jsonify(result)
            
        except Exception as e:
            logger.exception(f"Failed to fetch roles: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.json
            org_id = get_user_organization_id()
            
            # Create new role
            new_role = Role(
                id=str(uuid.uuid4()),
                name=data.get('name'),
                display_name=data.get('name'),
                description=data.get('description', ''),
                level='organization',
                organization_id=org_id,
                is_system=False
            )
            
            db.session.add(new_role)
            db.session.flush()
            
            # Assign permissions
            permissions = data.get('permissions', {})
            for perm_id, enabled in permissions.items():
                if enabled:
                    role_perm = RolePermission(
                        id=str(uuid.uuid4()),
                        role_id=new_role.id,
                        permission_id=perm_id
                    )
                    db.session.add(role_perm)
            
            db.session.commit()
            
            logger.info(f"Created role: {new_role.name} (ID: {new_role.id})")
            return jsonify(new_role.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to create role: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/roles/<role_id>', methods=['PATCH'])
@login_required
def update_role_permissions(role_id):
    """Update role permissions"""
    try:
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'status': 'error', 'message': 'Role not found'}), 404
        
        # Cannot modify system roles
        if role.is_system:
            return jsonify({'status': 'error', 'message': 'Cannot modify system roles'}), 403
        
        data = request.json
        permissions = data.get('permissions', {})
        
        # Delete existing permissions
        RolePermission.query.filter_by(role_id=role_id).delete()
        
        # Add new permissions
        for perm_id, enabled in permissions.items():
            if enabled:
                role_perm = RolePermission(
                    id=str(uuid.uuid4()),
                    role_id=role_id,
                    permission_id=perm_id
                )
                db.session.add(role_perm)
        
        db.session.commit()
        
        # Clear permission cache for all users with this role
        clear_user_permissions_cache()
        
        return jsonify({'status': 'success', 'message': 'Role permissions updated'})
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Failed to update role permissions: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Permissions (Read-Only)
@app.route('/api/permissions', methods=['GET'])
@login_required
def permissions_api():
    """Get all permissions"""
    try:
        permissions = Permission.query.all()
        return jsonify([perm.to_dict() for perm in permissions])
    except Exception as e:
        logger.exception(f"Failed to fetch permissions: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Access Policies Management
@app.route('/api/access-policies', methods=['GET', 'POST'])
@login_required
def access_policies_api():
    """Manage access policies"""
    
    if request.method == 'GET':
        try:
            org_id = get_user_organization_id()
            
            # For now, return empty list (placeholder for future implementation)
            policies = []
            
            return jsonify(policies)
            
        except Exception as e:
            logger.exception(f"Failed to fetch access policies: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.json
            
            new_policy = DataAccessPolicy(
                id=str(uuid.uuid4()),
                user_id=data.get('user_id'),
                role_id=data.get('role_id'),
                resource_type=data.get('resource_type'),
                resource_id=data.get('resource_id'),
                access_level=data.get('access_level', 'read_only'),
                conditions=data.get('conditions', {}),
                created_by=str(current_user.id)
            )
            
            db.session.add(new_policy)
            db.session.commit()
            
            logger.info(f"Created access policy: {new_policy.id}")
            return jsonify(new_policy.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to create access policy: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

# ==========================================
# ALERT EVALUATION BACKGROUND SCHEDULER
# ==========================================

def run_alert_evaluation():
    """Background task to evaluate all active alerts"""
    with app.app_context():
        try:
            from alert_system import AlertEvaluator, NotificationService
            
            # Get all active alerts
            active_alerts = Alert.query.filter_by(is_active=True).all()
            
            if not active_alerts:
                logger.info("No active alerts to evaluate")
                return
            
            evaluator = AlertEvaluator(db, DataSource, Pipeline, PipelineRun)
            notif_service = NotificationService()
            
            for alert in active_alerts:
                try:
                    # Evaluate alert condition
                    alert_data = evaluator.evaluate_alert(alert.to_dict())
                    
                    if alert_data:
                        # Alert condition met - send notifications
                        logger.info(f"Alert triggered: {alert.name}")
                        
                        # Send notifications
                        results = notif_service.send_notification(alert.to_dict(), alert_data)
                        
                        # Create history record
                        history = AlertHistory(
                            alert_id=alert.id,
                            condition_met=alert_data.get('details', {}),
                            severity=alert_data.get('severity', 'warning'),
                            notifications_sent=results
                        )
                        db.session.add(history)
                        
                        # Update alert
                        alert.last_triggered_at = datetime.utcnow()
                        alert.trigger_count = (alert.trigger_count or 0) + 1
                        
                        db.session.commit()
                        
                        logger.info(f"Alert {alert.name} processed successfully")
                    
                except Exception as e:
                    logger.error(f"Error evaluating alert {alert.name}: {e}")
                    db.session.rollback()
                    continue
            
        except Exception as e:
            logger.error(f"Alert evaluation job failed: {e}")
            import traceback
            traceback.print_exc()

def start_alert_scheduler():
    """Start background scheduler for alert evaluation"""
    import threading
    import time
    
    def scheduler_loop():
        logger.info("🔔 Alert scheduler started")
        while True:
            try:
                run_alert_evaluation()
            except Exception as e:
                logger.error(f"Alert scheduler error: {e}")
            
            # Run every 5 minutes
            time.sleep(300)
    
    scheduler_thread = threading.Thread(target=scheduler_loop, daemon=True)
    scheduler_thread.start()
    logger.info("✅ Alert scheduler thread started")

if __name__ == '__main__':
    with app.app_context():
        # Ensure all tables are created
        db.create_all()
        
        # ⚡ ACCESS MANAGEMENT: Seed default organizations, roles, and permissions
        seed_default_data()
        
        # ⚡ ACCESS MANAGEMENT: Migrate existing data to default organization
        migrate_existing_data_to_organizations()
        
        # Seed demo data if database is empty
        seed_demo_data()
        
        # Fix existing data marts without data_source_id
        fix_data_mart_sources()
    
    # Start alert scheduler
    start_alert_scheduler()
    
    # Run the Flask development server
    # Use port 5001 to avoid conflict with AirPlay Receiver on port 5000
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)

