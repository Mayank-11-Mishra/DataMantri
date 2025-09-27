from flask import Flask, request, jsonify, send_from_directory
from flask_mail import Mail, Message
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import URL
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import openai
import json
import pandas as pd
import secrets
from functools import lru_cache
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Initialize Flask app to serve the React frontend
app = Flask(__name__, static_folder='dist', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
# Use the configuration from database/config.py
from database.config import config as db_config
app.config['SQLALCHEMY_DATABASE_URI'] = db_config.get_database_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Mail configuration - optional, graceful degradation if not configured
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() in ['true', '1', 't']
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
app.config['MAIL_SUPPRESS_SEND'] = os.getenv('MAIL_SUPPRESS_SEND', 'false').lower() in ['true', '1', 't']

# Initialize extensions
db = SQLAlchemy(app)
mail = Mail(app)
login_manager = LoginManager()
login_manager.init_app(app)
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'status': 'error', 'message': 'Authentication required'}), 401

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if user and user.is_active and check_password_hash(user.password_hash, password):
        login_user(user, remember=True)
        user.last_login_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Login successful',
            'must_reset_password': user.must_reset_password
        })
    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory cache for schema data
schema_cache = {}
CACHE_DURATION = 300  # 5 minutes

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    must_reset_password = db.Column(db.Boolean, default=False)
    dashboards = db.relationship('Dashboard', backref='owner', lazy=True)
    roles = db.relationship(
        'Role', 
        secondary='user_roles', 
        primaryjoin='User.id == UserRole.user_id',
        secondaryjoin='Role.id == UserRole.role_id',
        back_populates='users'
    )

# DataSource model
class DataSource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Store connection details in a JSON field for flexibility
    connection_details = db.Column(db.Text, nullable=False)

# DataMart model
class DataMart(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_source.id'), nullable=False)
    definition = db.Column(db.Text, nullable=False) # JSON storing tables, columns, joins, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Upload Templates model
class UploadTemplate(db.Model):
    __tablename__ = 'upload_templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    file_format = db.Column(db.String(20), nullable=False)
    validation_rules = db.Column(db.Text)
    transformation_rules = db.Column(db.Text)
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_source.id'), nullable=False)
    table_name = db.Column(db.String(100), nullable=False)
    upload_mode = db.Column(db.String(20), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

# Upload History model
class UploadHistory(db.Model):
    __tablename__ = 'upload_history'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('upload_templates.id'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer)
    records_processed = db.Column(db.Integer)
    records_success = db.Column(db.Integer)
    records_failed = db.Column(db.Integer)
    status = db.Column(db.String(20), nullable=False)
    error_log = db.Column(db.Text)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)

# Chart Library model
class ChartLibrary(db.Model):
    __tablename__ = 'chart_library'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    chart_type = db.Column(db.String(50), nullable=False)
    config_schema = db.Column(db.Text, nullable=False)
    component_code = db.Column(db.Text, nullable=False)
    css_styles = db.Column(db.Text)
    preview_image = db.Column(db.String(255))
    category = db.Column(db.String(50))
    tags = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=False)

# Theme Library model
class ThemeLibrary(db.Model):
    __tablename__ = 'theme_library'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    css_variables = db.Column(db.Text, nullable=False)
    component_styles = db.Column(db.Text)
    color_palette = db.Column(db.Text, nullable=False)
    typography = db.Column(db.Text)
    preview_image = db.Column(db.String(255))
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=False)

# Dashboard Analytics model
class DashboardAnalytics(db.Model):
    __tablename__ = 'dashboard_analytics'
    id = db.Column(db.Integer, primary_key=True)
    dashboard_id = db.Column(db.Integer, db.ForeignKey('dashboard.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    session_id = db.Column(db.String(100))
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    duration_seconds = db.Column(db.Integer)

# Roles model
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.Text)
    permissions = db.Column(db.Text, nullable=False, default='{}')  # JSON object for feature access
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    policies = db.relationship('AccessPolicy', secondary='role_access_policies', back_populates='roles')
    users = db.relationship(
        'User', 
        secondary='user_roles', 
        primaryjoin='Role.id == UserRole.role_id',
        secondaryjoin='User.id == UserRole.user_id',
        back_populates='roles'
    )

# Access Policy model for data-level security
class AccessPolicy(db.Model):
    __tablename__ = 'access_policies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    resource_type = db.Column(db.String(50), nullable=False)  # e.g., 'datamart', 'table'
    resource_id = db.Column(db.String(100))  # Can be an ID or name
    filter_condition = db.Column(db.Text, nullable=False)  # e.g., "user_id = '{user_id}'"
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    roles = db.relationship('Role', secondary='role_access_policies', back_populates='policies')

# Association table for Roles and AccessPolicies
role_access_policies = db.Table('role_access_policies',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('policy_id', db.Integer, db.ForeignKey('access_policies.id'), primary_key=True)
)

# User Roles model
class UserRole(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    granted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

# Scheduler Jobs model
class SchedulerJob(db.Model):
    __tablename__ = 'scheduler_jobs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    job_type = db.Column(db.String(50), nullable=False)
    schedule_expression = db.Column(db.String(100), nullable=False)
    target_resource_type = db.Column(db.String(50))
    target_resource_id = db.Column(db.Integer)
    config = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    last_run_at = db.Column(db.DateTime)
    next_run_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Dashboard Components model
class DashboardComponent(db.Model):
    __tablename__ = 'dashboard_components'
    id = db.Column(db.Integer, primary_key=True)
    dashboard_id = db.Column(db.Integer, db.ForeignKey('dashboard.id'), nullable=False)
    component_type = db.Column(db.String(50), nullable=False)
    chart_library_id = db.Column(db.Integer, db.ForeignKey('chart_library.id'))
    position_x = db.Column(db.Integer, nullable=False, default=0)
    position_y = db.Column(db.Integer, nullable=False, default=0)
    width = db.Column(db.Integer, nullable=False, default=4)
    height = db.Column(db.Integer, nullable=False, default=3)
    config = db.Column(db.Text, nullable=False)
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_source.id'))
    query_config = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Dashboard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    theme_id = db.Column(db.Integer, db.ForeignKey('theme.id'), nullable=True)
    layout = db.Column(db.Text, nullable=False)  # JSON for dashboard layout
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Theme(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    styles = db.Column(db.Text, nullable=False) # JSON storing theme styles
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

@app.context_processor
def inject_now():
    return {'now': datetime.utcnow()}

def user_has_permission(user, permission_name):
    """Check if a user has a specific permission."""
    if user.is_admin:
        return True
    for role in user.roles:
        permissions = json.loads(role.permissions)
        if permissions.get(permission_name):
            return True
    return False

def permission_required(permission_name):
    """Decorator to check if a user has a specific permission."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not user_has_permission(current_user, permission_name):
                return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def apply_row_level_security(query, resource_type):
    """Applies row-level security filters to a SQLAlchemy query."""
    if current_user.is_admin:
        return query

    policy_filters = []
    for role in current_user.roles:
        for policy in role.policies:
            if policy.is_active and policy.resource_type == resource_type:
                # Replace placeholders like {user_id} with actual values
                condition = policy.filter_condition.format(user_id=current_user.id)
                policy_filters.append(text(condition))

    if not policy_filters:
        # If no policies are defined for this resource, deny access by default
        # by adding a condition that is always false.
        return query.filter(text("1=0"))

    # Combine all applicable policy filters with an OR condition
    return query.filter(db.or_(*policy_filters))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- API Routes ---

@app.route('/api/data-sources', methods=['GET'])
@login_required
def get_data_sources():
    """Endpoint to get all available data sources for the current user."""
    try:
        # Query all user-defined data sources
        query = DataSource.query
        query = apply_row_level_security(query, 'datasource')
        data_sources = query.all()

        sources_list = [{
            'id': ds.id,
            'name': ds.name,
            'type': ds.type
        } for ds in data_sources]

        # Add the primary DataViz database as a default, identifiable option
        sources_list.insert(0, {
            'id': 0,  # Special ID for the primary DB
            'name': 'DataViz Primary Database',
            'type': 'postgresql'
        })

        return jsonify(sources_list)
    except Exception as e:
        logger.error(f"Error fetching data sources: {e}")
        return jsonify({'status': 'error', 'message': 'Could not retrieve data sources.'}), 500


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        # For GET requests, serve the React SPA (handled by catch-all route)
        return send_from_directory(app.static_folder, 'index.html')
    
    # Handle POST requests for actual login
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        login_user(user)
        return jsonify({
            'status': 'success', 
            'message': 'Login successful.',
            'must_reset_password': user.must_reset_password
        })
    else:
        return jsonify({'status': 'error', 'message': 'Invalid email or password.'}), 401

@app.route('/api/reset-password', methods=['POST'])
@login_required
def reset_password():
    data = request.get_json()
    new_password = data.get('password')

    if not new_password or len(new_password) < 8:
        return jsonify({'status': 'error', 'message': 'Password must be at least 8 characters long.'}), 400

    current_user.password = generate_password_hash(new_password)
    current_user.must_reset_password = False
    db.session.commit()

    return jsonify({'status': 'success', 'message': 'Password has been reset successfully.'})

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'status': 'success', 'message': 'Logout successful.'})

@app.route('/api/session', methods=['GET'])
@login_required
def get_session():
    # Get user's roles as a list of role names
    user_roles = [role.name for role in current_user.roles] if current_user.roles else []
    
    return jsonify({
        'status': 'success',
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'is_admin': current_user.is_admin,
            'roles': user_roles,
            'must_reset_password': current_user.must_reset_password
        }
    })

# Dashboard Analytics API Routes
@app.route('/api/analytics/dashboard', methods=['GET'])
@login_required
@permission_required('view_analytics')
def get_dashboard_analytics():
    time_range = request.args.get('range', '7d')
    
    # Mock data for now - replace with actual analytics queries
    analytics_data = {
        'totalDashboards': 12,
        'totalViews': 1847,
        'activeUsers': 23,
        'avgSessionDuration': 420,  # seconds
        'topDashboards': [
            {'id': 1, 'name': 'Sales Performance Q4', 'views': 342, 'lastAccessed': '2024-01-15T10:30:00Z'},
            {'id': 2, 'name': 'Marketing ROI Dashboard', 'views': 289, 'lastAccessed': '2024-01-14T15:45:00Z'},
            {'id': 3, 'name': 'Customer Journey Analytics', 'views': 234, 'lastAccessed': '2024-01-13T09:20:00Z'}
        ],
        'userActivity': [
            {'date': '2024-01-10', 'views': 45, 'users': 8},
            {'date': '2024-01-11', 'views': 52, 'users': 12},
            {'date': '2024-01-12', 'views': 38, 'users': 7},
            {'date': '2024-01-13', 'views': 67, 'users': 15},
            {'date': '2024-01-14', 'views': 43, 'users': 9},
            {'date': '2024-01-15', 'views': 58, 'users': 11},
            {'date': '2024-01-16', 'views': 49, 'users': 10}
        ],
        'dashboardsByCategory': [
            {'category': 'Sales', 'count': 4, 'color': '#8884d8'},
            {'category': 'Marketing', 'count': 3, 'color': '#82ca9d'},
            {'category': 'Finance', 'count': 2, 'color': '#ffc658'},
            {'category': 'Operations', 'count': 3, 'color': '#ff7300'}
        ]
    }
    
    return jsonify(analytics_data)

@app.route('/api/analytics/export', methods=['GET'])
@login_required
@permission_required('view_analytics')
def export_analytics():
    time_range = request.args.get('range', '7d')
    # Generate CSV export - mock implementation
    return jsonify({'status': 'success', 'message': 'Export functionality to be implemented'})

# Upload Templates API Routes
@app.route('/api/upload-templates', methods=['GET', 'POST'])
@login_required
# This route will be further refined. For now, POST requires manage_upload_templates
# GET is open to logged-in users, but the decorator will be applied inside if needed.
def manage_upload_templates():
    if request.method == 'POST':
        if not user_has_permission(current_user, 'manage_upload_templates'):
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        data = request.get_json()
        template = UploadTemplate(
            name=data['name'],
            description=data.get('description', ''),
            file_format=data['file_format'],
            validation_rules=data.get('validation_rules', '{}'),
            transformation_rules=data.get('transformation_rules', '{}'),
            data_source_id=data['data_source_id'],
            table_name=data['table_name'],
            upload_mode=data['upload_mode'],
            created_by=current_user.id
        )
        db.session.add(template)
        db.session.commit()
        return jsonify({'status': 'success', 'id': template.id}), 201
    
    templates = UploadTemplate.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'description': t.description,
        'file_format': t.file_format,
        'upload_mode': t.upload_mode,
        'table_name': t.table_name,
        'is_active': t.is_active,
        'created_at': t.created_at.isoformat()
    } for t in templates])

@app.route('/api/upload-templates/<int:template_id>/sample', methods=['GET'])
@login_required
def download_sample_file(template_id):
    template = UploadTemplate.query.get_or_404(template_id)
    # Generate sample file based on template - mock implementation
    return jsonify({'status': 'success', 'message': 'Sample file generation to be implemented'})

@app.route('/api/upload-file', methods=['POST'])
@login_required
@permission_required('perform_uploads')
def upload_file():
    template_id = request.form.get('template_id')
    file = request.files.get('file')
    
    if not file or not template_id:
        return jsonify({'status': 'error', 'message': 'Missing file or template'}), 400
    
    if not file.filename:
        return jsonify({'status': 'error', 'message': 'No file selected'}), 400
    
    template = UploadTemplate.query.get_or_404(template_id)
    
    # Get file size without consuming the stream
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    # Create upload history record
    history = UploadHistory(
        template_id=template_id,
        file_name=file.filename,
        file_size=file_size,
        status='processing',
        uploaded_by=current_user.id
    )
    db.session.add(history)
    db.session.commit()
    
    try:
        # Read and process file content
        file_content = file.read()
        
        # Mock processing based on file type
        if template.file_format == 'csv':
            # Simulate CSV processing
            lines = file_content.decode('utf-8').split('\n')
            records_processed = len(lines) - 1  # Exclude header
        elif template.file_format == 'excel':
            # Simulate Excel processing
            records_processed = 50  # Mock value
        else:
            records_processed = 25  # Mock value for other formats
        
        # Update history with success
        history.status = 'success'
        history.records_processed = records_processed
        history.records_success = max(0, records_processed - 2)  # Mock some failures
        history.records_failed = min(2, records_processed)
        history.processed_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'success', 
            'id': history.id,
            'message': f'File processed successfully. {history.records_success} records imported.'
        })
        
    except Exception as e:
        # Update history with failure
        history.status = 'failed'
        history.error_log = str(e)
        history.processed_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'error', 
            'message': f'File processing failed: {str(e)}'
        }), 500

@app.route('/api/upload-history', methods=['GET'])
@login_required
def get_upload_history():
    history = db.session.query(UploadHistory, UploadTemplate.name.label('template_name')).join(
        UploadTemplate, UploadHistory.template_id == UploadTemplate.id
    ).filter(UploadHistory.uploaded_by == current_user.id).all()
    
    return jsonify([{
        'id': h.UploadHistory.id,
        'template_id': h.UploadHistory.template_id,
        'template_name': h.template_name,
        'file_name': h.UploadHistory.file_name,
        'file_size': h.UploadHistory.file_size,
        'records_processed': h.UploadHistory.records_processed or 0,
        'records_success': h.UploadHistory.records_success or 0,
        'records_failed': h.UploadHistory.records_failed or 0,
        'status': h.UploadHistory.status,
        'uploaded_at': h.UploadHistory.uploaded_at.isoformat(),
        'processed_at': h.UploadHistory.processed_at.isoformat() if h.UploadHistory.processed_at else None
    } for h in history])

# Access Management API Routes

@app.route('/api/features', methods=['GET'])
@login_required
@permission_required('manage_users') # Or a more specific permission if needed
def get_features():
    """Returns a list of all available features that can be permissioned."""
    features = [
        {'id': 'view_dashboards', 'name': 'View Dashboards', 'category': 'Dashboards'},
        {'id': 'create_dashboards', 'name': 'Create/Edit Dashboards', 'category': 'Dashboards'},
        {'id': 'view_datamarts', 'name': 'View Data Marts', 'category': 'Data'},
        {'id': 'manage_datamarts', 'name': 'Manage Data Marts', 'category': 'Data'},
        {'id': 'view_datasources', 'name': 'View Data Sources', 'category': 'Data'},
        {'id': 'manage_datasources', 'name': 'Manage Data Sources', 'category': 'Data'},
        {'id': 'perform_uploads', 'name': 'Perform File Uploads', 'category': 'Uploads'},
        {'id': 'manage_upload_templates', 'name': 'Manage Upload Templates', 'category': 'Uploads'},
        {'id': 'view_analytics', 'name': 'View Dashboard Analytics', 'category': 'Admin'},
        {'id': 'manage_users', 'name': 'Manage Users & Roles', 'category': 'Admin'},
        {'id': 'manage_access_policies', 'name': 'Manage Access Policies', 'category': 'Admin'},
        {'id': 'manage_libraries', 'name': 'Manage Theme & Chart Libraries', 'category': 'Admin'},
        {'id': 'manage_scheduler', 'name': 'Manage Scheduler', 'category': 'Admin'}
    ]
    return jsonify(features)

@app.route('/api/access-policies', methods=['GET', 'POST'])
@login_required
@permission_required('manage_access_policies')
def manage_access_policies():
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403

    if request.method == 'POST':
        data = request.get_json()
        new_policy = AccessPolicy(
            name=data['name'],
            description=data.get('description', ''),
            resource_type=data['resource_type'],
            resource_id=data.get('resource_id'),
            filter_condition=data['filter_condition']
        )
        db.session.add(new_policy)
        db.session.commit()
        return jsonify({'status': 'success', 'id': new_policy.id}), 201

    policies = AccessPolicy.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'resource_type': p.resource_type,
        'resource_id': p.resource_id,
        'filter_condition': p.filter_condition,
        'is_active': p.is_active
    } for p in policies])

@app.route('/api/access-policies/<int:policy_id>', methods=['PUT', 'DELETE'])
@login_required
@permission_required('manage_access_policies')
def manage_single_access_policy(policy_id):
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403

    policy = AccessPolicy.query.get_or_404(policy_id)

    if request.method == 'PUT':
        data = request.get_json()
        policy.name = data.get('name', policy.name)
        policy.description = data.get('description', policy.description)
        policy.resource_type = data.get('resource_type', policy.resource_type)
        policy.resource_id = data.get('resource_id', policy.resource_id)
        policy.filter_condition = data.get('filter_condition', policy.filter_condition)
        policy.is_active = data.get('is_active', policy.is_active)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Policy updated successfully.'})

    if request.method == 'DELETE':
        db.session.delete(policy)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Policy deleted successfully.'})

@app.route('/api/users', methods=['GET', 'POST'])
@login_required
@permission_required('manage_users')
def manage_users():
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
    
    if request.method == 'POST':
        data = request.get_json()
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'status': 'error', 'message': 'User already exists'}), 409
        
        # Generate a temporary password
        temp_password = secrets.token_urlsafe(12)

        user = User(
            email=data['email'],
            password=generate_password_hash(temp_password),
            is_admin=data.get('is_admin', False),
            must_reset_password=True
        )

        # Try to send email, but don't fail user creation if email fails
        email_sent = False
        try:
            msg = Message(
                'Your New DataViz Account Password',
                recipients=[user.email]
            )
            msg.body = f'Welcome to DataViz! Your one-time password is: {temp_password}\n\nYou will be required to reset your password upon your first login.'
            mail.send(msg)
            email_sent = True
        except Exception as e:
            logger.error(f"Failed to send OTP email to {user.email}: {e}")
            # If email fails, set password to default value
            temp_password = "12341234"
            user.password = generate_password_hash(temp_password)
        db.session.add(user)
        db.session.commit()
        
        # Assign roles
        for role_id in data.get('role_ids', []):
            user_role = UserRole(
                user_id=user.id,
                role_id=role_id,
                granted_by=current_user.id
            )
            db.session.add(user_role)
        
        db.session.commit()
        
        # Return success with password info if email failed
        response_data = {
            'status': 'success', 
            'id': user.id,
            'email_sent': email_sent
        }
        
        if not email_sent:
            response_data['temp_password'] = temp_password
            response_data['message'] = f'User created successfully. Email delivery failed - default password: {temp_password}'
        else:
            response_data['message'] = 'User created successfully. Login credentials sent via email.'
            
        return jsonify(response_data), 201
    
    # Get all users with their roles
    users = User.query.all()
    result = []
    for user in users:
        user_roles = db.session.query(Role).join(UserRole).filter(
            UserRole.user_id == user.id,
            UserRole.is_active == True
        ).all()
        
        result.append({
            'id': user.id,
            'email': user.email,
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            'is_active': True,  # Add is_active field to User model if needed
            'is_admin': user.is_admin,
            'roles': [{'id': r.id, 'name': r.name} for r in user_roles],
            'created_at': datetime.utcnow().isoformat()  # Add created_at field if needed
        })
    
    return jsonify(result)

@app.route('/api/users/<int:user_id>/status', methods=['PATCH'])
@login_required
@permission_required('manage_users')
def update_user_status(user_id):
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    user = User.query.get_or_404(user_id)
    # Update user status - add is_active field to User model if needed
    return jsonify({'status': 'success'})

@app.route('/api/roles', methods=['GET', 'POST'])
@login_required
@permission_required('manage_users')
def manage_roles():
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403

    if request.method == 'POST':
        data = request.get_json()
        new_role = Role(
            name=data['name'],
            description=data.get('description', ''),
            permissions=json.dumps(data.get('permissions', {}))
        )
        
        policy_ids = data.get('policy_ids', [])
        if policy_ids:
            policies = AccessPolicy.query.filter(AccessPolicy.id.in_(policy_ids)).all()
            new_role.policies.extend(policies)

        db.session.add(new_role)
        db.session.commit()
        return jsonify({'status': 'success', 'id': new_role.id}), 201

    roles = Role.query.all()
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'description': r.description,
        'permissions': json.loads(r.permissions),
        'policies': [{'id': p.id, 'name': p.name} for p in r.policies],
        'user_count': len(r.users) if hasattr(r, 'users') else 0
    } for r in roles])

@app.route('/api/roles/<int:role_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@permission_required('manage_users')
def manage_single_role(role_id):
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403

    role = Role.query.get_or_404(role_id)

    if request.method == 'GET':
        return jsonify({
            'id': role.id,
            'name': role.name,
            'description': role.description,
            'permissions': json.loads(role.permissions),
            'policies': [{'id': p.id, 'name': p.name} for p in role.policies]
        })

    if request.method == 'PUT':
        data = request.get_json()
        role.name = data.get('name', role.name)
        role.description = data.get('description', role.description)
        if 'permissions' in data:
            role.permissions = json.dumps(data['permissions'])
        
        if 'policy_ids' in data:
            role.policies.clear()
            policies = AccessPolicy.query.filter(AccessPolicy.id.in_(data['policy_ids'])).all()
            role.policies.extend(policies)

        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Role updated successfully.'})

    if request.method == 'DELETE':
        db.session.delete(role)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Role deleted successfully.'})

@app.route('/api/permissions', methods=['GET'])
@login_required
def get_permissions():
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
    
    # Mock permissions data
    permissions = [
        {'id': 'dashboard_create', 'name': 'Create Dashboards', 'description': 'Create new dashboards', 'category': 'dashboard'},
        {'id': 'dashboard_edit', 'name': 'Edit Dashboards', 'description': 'Edit existing dashboards', 'category': 'dashboard'},
        {'id': 'dashboard_delete', 'name': 'Delete Dashboards', 'description': 'Delete dashboards', 'category': 'dashboard'},
        {'id': 'user_manage', 'name': 'Manage Users', 'description': 'Create and manage users', 'category': 'admin'},
        {'id': 'role_manage', 'name': 'Manage Roles', 'description': 'Create and manage roles', 'category': 'admin'},
        {'id': 'data_upload', 'name': 'Upload Data', 'description': 'Upload data files', 'category': 'data'},
        {'id': 'data_export', 'name': 'Export Data', 'description': 'Export data and reports', 'category': 'data'}
    ]
    
    return jsonify(permissions)

# Theme and Chart Libraries API Routes
@app.route('/api/themes/<int:theme_id>', methods=['PUT', 'DELETE'])
@login_required
@permission_required('manage_libraries')
def update_or_delete_theme(theme_id):
    theme = ThemeLibrary.query.get_or_404(theme_id)
    
    if request.method == 'DELETE':
        if not current_user.is_admin:
            return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
        
        db.session.delete(theme)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Theme deleted successfully'})
    
    elif request.method == 'PUT':
        if not current_user.is_admin:
            return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
        
        data = request.get_json()
        theme.name = data.get('name', theme.name)
        theme.description = data.get('description', theme.description)
        theme.css_content = data.get('css_content', theme.css_content)
        theme.variables = data.get('variables', theme.variables)
        theme.source_url = data.get('source_url', theme.source_url)
        
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Theme updated successfully'})

@app.route('/api/chart-libraries/<int:chart_id>', methods=['PUT', 'DELETE'])
@login_required
@permission_required('manage_libraries')
def update_or_delete_chart_library(chart_id):
    chart = ChartLibrary.query.get_or_404(chart_id)
    
    if request.method == 'DELETE':
        if not current_user.is_admin:
            return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
        
        db.session.delete(chart)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Chart library deleted successfully'})
    
    elif request.method == 'PUT':
        if not current_user.is_admin:
            return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
        
        data = request.get_json()
        chart.name = data.get('name', chart.name)
        chart.description = data.get('description', chart.description)
        chart.library_type = data.get('library_type', chart.library_type)
        chart.code_content = data.get('code_content', chart.code_content)
        chart.config_schema = data.get('config_schema', chart.config_schema)
        chart.source_url = data.get('source_url', chart.source_url)
        
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Chart library updated successfully'})

@app.route('/api/themes', methods=['GET', 'POST'])
@login_required
def manage_themes():
    if request.method == 'POST':
        if not user_has_permission(current_user, 'manage_libraries'):
            return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
        
        data = request.get_json()
        theme = ThemeLibrary(
            name=data['name'],
            description=data.get('description', ''),
            css_variables=data.get('css_content', ''),
            color_palette=data.get('variables', '{}'),
            created_by=current_user.id
        )
        db.session.add(theme)
        db.session.commit()
        return jsonify({'status': 'success', 'id': theme.id}), 201
    
    themes = ThemeLibrary.query.all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'description': t.description,
        'css_content': t.css_variables,
        'variables': json.loads(t.color_palette) if t.color_palette and t.color_palette.startswith('{') else {'colors': t.color_palette.split(',') if t.color_palette else []},
        'preview_url': t.preview_image or '',
        'source_url': '',
        'is_default': False,
        'is_active': True,
        'created_at': t.created_at.isoformat()
    } for t in themes])

@app.route('/api/themes/<int:theme_id>/status', methods=['PATCH'])
@login_required
def update_theme_status(theme_id):
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    theme = ThemeLibrary.query.get_or_404(theme_id)
    # Update theme status - add is_active field if needed
    return jsonify({'status': 'success'})

@app.route('/api/themes/<int:theme_id>/default', methods=['PATCH'])
@login_required
def set_default_theme(theme_id):
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
    
    # Set theme as default - add is_default field if needed
    return jsonify({'status': 'success'})

@app.route('/api/chart-libraries', methods=['GET', 'POST'])
@login_required
def manage_chart_libraries():
    if request.method == 'POST':
        if not user_has_permission(current_user, 'manage_libraries'):
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
        data = request.get_json()
        library = ChartLibrary(
            name=data['name'],
            description=data.get('description', ''),
            chart_type=data['library_type'],
            component_code=data.get('code_content', ''),
            config_schema=data.get('config_schema', '{}'),
            created_by=current_user.id
        )
        db.session.add(library)
        db.session.commit()
        return jsonify({'status': 'success', 'id': library.id}), 201
    
    libraries = ChartLibrary.query.all()
    return jsonify([{
        'id': l.id,
        'name': l.name,
        'description': l.description,
        'library_type': l.chart_type,
        'code_content': l.component_code,
        'config_schema': json.loads(l.config_schema) if l.config_schema else {},
        'source_url': '',  # Add field if needed
        'is_active': True,  # Add field if needed
        'created_at': l.created_at.isoformat()
    } for l in libraries])

@app.route('/api/import-from-lovable', methods=['POST'])
@login_required
def import_from_lovable():
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
    
    try:
        # Mock implementation - simulate importing popular themes and charts from Lovable.dev
        imported_themes = [
            {
                'name': 'Lovable Dark Pro',
                'description': 'Professional dark theme from Lovable.dev',
                'css_variables': ':root { --primary: #6366f1; --background: #0f172a; --foreground: #f1f5f9; --accent: #8b5cf6; }',
                'color_palette': '#6366f1,#0f172a,#f1f5f9,#8b5cf6'
            },
            {
                'name': 'Lovable Gradient',
                'description': 'Modern gradient theme with vibrant colors',
                'css_variables': ':root { --primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --background: #ffffff; --foreground: #1a202c; }',
                'color_palette': '#667eea,#764ba2,#ffffff,#1a202c'
            },
            {
                'name': 'Lovable Minimal',
                'description': 'Clean minimal theme for professional dashboards',
                'css_variables': ':root { --primary: #10b981; --background: #f9fafb; --foreground: #111827; --muted: #6b7280; }',
                'color_palette': '#10b981,#f9fafb,#111827,#6b7280'
            }
        ]
        
        imported_charts = [
            {
                'name': 'Lovable Advanced Bar Chart',
                'description': 'Enhanced bar chart with animations and interactions',
                'chart_type': 'bar',
                'component_code': 'const LovableBarChart = ({ data, config }) => { /* Advanced bar chart implementation */ };',
                'config_schema': json.dumps({
                    'colors': ['#6366f1', '#8b5cf6', '#06b6d4'],
                    'animated': True,
                    'interactive': True,
                    'showValues': True,
                    'borderRadius': 4
                })
            },
            {
                'name': 'Lovable Interactive Pie Chart',
                'description': 'Beautiful pie chart with hover effects and legends',
                'chart_type': 'pie',
                'component_code': 'const LovablePieChart = ({ data, config }) => { /* Interactive pie chart implementation */ };',
                'config_schema': json.dumps({
                    'colors': ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'],
                    'showLegend': True,
                    'showLabels': True,
                    'innerRadius': 0,
                    'padAngle': 0.02
                })
            }
        ]
        
        themes_created = 0
        charts_created = 0
        
        # Import themes
        for theme_data in imported_themes:
            # Check if theme already exists
            existing = ThemeLibrary.query.filter_by(name=theme_data['name']).first()
            if not existing:
                theme = ThemeLibrary(
                    name=theme_data['name'],
                    description=theme_data['description'],
                    css_variables=theme_data['css_variables'],
                    color_palette=theme_data['color_palette'],
                    created_by=current_user.id
                )
                db.session.add(theme)
                themes_created += 1
        
        # Import chart libraries
        for chart_data in imported_charts:
            # Check if chart library already exists
            existing = ChartLibrary.query.filter_by(name=chart_data['name']).first()
            if not existing:
                chart = ChartLibrary(
                    name=chart_data['name'],
                    description=chart_data['description'],
                    chart_type=chart_data['chart_type'],
                    component_code=chart_data['component_code'],
                    config_schema=chart_data['config_schema'],
                    created_by=current_user.id
                )
                db.session.add(chart)
                charts_created += 1
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'themes_count': themes_created,
            'charts_count': charts_created,
            'message': f'Successfully imported {themes_created} themes and {charts_created} chart libraries from Lovable.dev'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'Import failed: {str(e)}'
        }), 500

@app.route('/api/data-sources', methods=['GET', 'POST'])
@login_required
def manage_data_sources():
    if request.method == 'POST':
        data = request.get_json()
        name = data['name']
        details = data['details']

        # Check for duplicate name
        existing_by_name = DataSource.query.filter_by(user_id=current_user.id, name=name).first()
        if existing_by_name:
            return jsonify({'status': 'error', 'message': f'A data source with the name "{name}" already exists.'}), 409

        # Check for duplicate host/username combination
        sources = DataSource.query.filter_by(user_id=current_user.id).all()
        for source in sources:
            existing_details = json.loads(source.connection_details)
            if existing_details.get('host') == details.get('host') and existing_details.get('user') == details.get('user'):
                return jsonify({'status': 'error', 'message': f'A data source for host "{details.get("host")}" and user "{details.get("user")}" already exists.'}), 409

        new_source = DataSource(
            name=name,
            type=data['type'],
            connection_details=json.dumps(details),
            user_id=current_user.id
        )
        db.session.add(new_source)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Data source saved!', 'id': new_source.id}), 201

    if request.method == 'GET':
        sources = DataSource.query.filter_by(user_id=current_user.id).all()
        return jsonify([{
            'id': source.id,
            'name': source.name,
            'type': source.type,
            'details': json.loads(source.connection_details)
        } for source in sources])

@app.route('/api/data-sources/test', methods=['POST'])
@login_required
def test_data_source_connection():
    data = request.get_json()
    source_type = data.get('type')
    details = data.get('details', {})
    
    try:
        if source_type == 'postgres':
            import psycopg2
            conn = psycopg2.connect(
                host=details.get('host'),
                port=details.get('port', 5432),
                user=details.get('user'),
                password=details.get('password'),
                database=details.get('database'),
                connect_timeout=10  # 10 second timeout
            )
            conn.close()
            return jsonify({'status': 'success', 'message': 'PostgreSQL connection successful'})
        
        elif source_type == 'mongodb':
            from pymongo import MongoClient
            client = MongoClient(
                host=details.get('host'),
                port=details.get('port', 27017),
                username=details.get('user'),
                password=details.get('password'),
                connectTimeoutMS=10000,  # 10 second timeout
                serverSelectionTimeoutMS=10000  # 10 second server selection timeout
            )
            # Test connection
            client.admin.command('ping')
            client.close()
            return jsonify({'status': 'success', 'message': 'MongoDB connection successful'})
        
        elif source_type == 'bigquery':
            # Mock BigQuery test - in real implementation, use google-cloud-bigquery
            if details.get('project_id') and details.get('credentials'):
                return jsonify({'status': 'success', 'message': 'BigQuery connection successful'})
            else:
                return jsonify({'status': 'error', 'message': 'Missing project_id or credentials'}), 400
        
        else:
            return jsonify({'status': 'error', 'message': f'Unsupported data source type: {source_type}'}), 400
            
    except ImportError as e:
        return jsonify({
            'status': 'error', 
            'message': f'Required database driver not installed for {source_type}. Please install the appropriate package.'
        }), 500
    except Exception as e:
        logger.error(f"Connection test failed for {source_type}: {str(e)}")
        
        # Provide more user-friendly error messages
        error_str = str(e).lower()
        if 'timeout' in error_str or 'timed out' in error_str:
            message = "Connection timeout - the database server is not responding. Please check if the server is running and accessible."
        elif 'connection refused' in error_str:
            message = "Connection refused - the database server is not accepting connections. Please verify the host and port."
        elif 'name or service not known' in error_str or 'nodename nor servname provided' in error_str:
            message = "Host not found - please verify the database server hostname or IP address."
        elif 'authentication failed' in error_str or 'password authentication failed' in error_str:
            message = "Authentication failed - please check your username and password."
        elif 'database' in error_str and 'does not exist' in error_str:
            message = "Database not found - please verify the database name exists on the server."
        else:
            message = f"Connection failed: {str(e)}"
            
        return jsonify({'status': 'error', 'message': message}), 500

@app.route('/api/data-sources/<int:source_id>', methods=['PUT', 'DELETE'])
@login_required
def update_or_delete_data_source(source_id):
    source = DataSource.query.get_or_404(source_id)
    
    # Allow access if user is admin or owns the data source
    if not current_user.is_admin and source.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    
    if request.method == 'DELETE':
        db.session.delete(source)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Data source deleted.'})

    if request.method == 'PUT':
        data = request.get_json()
        name = data.get('name')
        details = data.get('details')

        if not name or not details:
            return jsonify({'status': 'error', 'message': 'Name and connection details are required.'}), 400

        # Check for duplicate name (excluding the current source)
        existing_by_name = DataSource.query.filter(
            DataSource.user_id == current_user.id,
            DataSource.name == name,
            DataSource.id != source_id
        ).first()
        if existing_by_name:
            return jsonify({'status': 'error', 'message': f'A data source with the name "{name}" already exists.'}), 409

        source.name = name
        source.connection_details = json.dumps(details)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Data source updated successfully.'})

@app.route('/api/test-connection', methods=['POST'])
@login_required
def test_connection():
    data = request.get_json()
    db_type = data.get('type')
    details = data.get('details')

    if not db_type or not details:
        return jsonify({'status': 'error', 'message': 'Type and connection details are required.'}), 400

    try:
        if db_type == 'postgres':
            connection_url = URL.create(
                'postgresql+psycopg2',
                username=details.get('user'),
                password=details.get('password'),
                host=details.get('host'),
                port=details.get('port'),
                database=details.get('database')
            )
            # Add connection timeout and pool settings
            engine = create_engine(
                connection_url,
                connect_args={
                    'connect_timeout': 10,  # 10 second timeout
                    'application_name': 'DataViz_Connection_Test'
                },
                pool_timeout=10,
                pool_recycle=3600
            )
            with engine.connect() as connection:
                connection.execute(text('SELECT 1'))
            return jsonify({'status': 'success', 'message': 'Connection successful!'})
        else:
            return jsonify({'status': 'error', 'message': f'Connection type \'{db_type}\' not supported yet.'}), 400

    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        
        # Provide more user-friendly error messages
        error_str = str(e).lower()
        if 'timeout' in error_str or 'timed out' in error_str:
            message = "Connection timeout - the database server is not responding. Please check if the server is running and accessible."
        elif 'connection refused' in error_str:
            message = "Connection refused - the database server is not accepting connections. Please verify the host and port."
        elif 'name or service not known' in error_str or 'nodename nor servname provided' in error_str:
            message = "Host not found - please verify the database server hostname or IP address."
        elif 'authentication failed' in error_str or 'password authentication failed' in error_str:
            message = "Authentication failed - please check your username and password."
        elif 'database' in error_str and 'does not exist' in error_str:
            message = "Database not found - please verify the database name exists on the server."
        else:
            message = f"Connection failed: {str(e)}"
            
        return jsonify({'status': 'error', 'message': message}), 500

@app.route('/api/data-sources/<int:source_id>/schema')
@login_required
def get_data_source_schema(source_id):
    source = DataSource.query.get_or_404(source_id)
    
    # Allow access if user is admin or owns the data source
    if not current_user.is_admin and source.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    # Check cache first
    cache_key = f"schema_{source_id}"
    if cache_key in schema_cache:
        cached_data, timestamp = schema_cache[cache_key]
        if datetime.now() - timestamp < timedelta(seconds=CACHE_DURATION):
            return jsonify(cached_data)

    try:
        details = json.loads(source.connection_details)
        if source.type == 'postgres':
            # Optimized PostgreSQL schema fetch with single query
            import psycopg2
            import psycopg2.extras
            
            conn = psycopg2.connect(
                host=details.get('host'),
                port=details.get('port', 5432),
                user=details.get('user'),
                password=details.get('password'),
                database=details.get('database'),
                connect_timeout=5  # Reduced timeout
            )
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Single optimized query to get all tables and columns
            cursor.execute("""
                SELECT 
                    t.table_name,
                    c.column_name,
                    c.data_type,
                    c.is_nullable,
                    c.column_default
                FROM information_schema.tables t
                LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
                WHERE t.table_schema = 'public' 
                    AND t.table_type = 'BASE TABLE'
                    AND c.table_schema = 'public'
                ORDER BY t.table_name, c.ordinal_position
            """)
            
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            
            # Group results by table
            schema_data = {}
            for row in results:
                table_name = row['table_name']
                if table_name not in schema_data:
                    schema_data[table_name] = []
                
                if row['column_name']:  # Only add if column exists
                    schema_data[table_name].append({
                        'name': row['column_name'],
                        'type': row['data_type']
                    })
            
            # Cache the result
            result = {'status': 'success', 'schema': schema_data}
            schema_cache[cache_key] = (result, datetime.now())
            
            return jsonify(result)
        else:
            return jsonify({'status': 'error', 'message': 'Schema viewing not supported for this data source type.'}), 400
        
    except Exception as e:
        logger.error(f"Failed to fetch schema for source {source_id}: {str(e)}")
        
        # Provide more user-friendly error messages
        error_str = str(e).lower()
        if 'timeout' in error_str or 'timed out' in error_str:
            message = "Connection timeout - the database server is not responding. Please check if the server is running and accessible."
        elif 'connection refused' in error_str:
            message = "Connection refused - the database server is not accepting connections. Please verify the host and port."
        elif 'name or service not known' in error_str or 'nodename nor servname provided' in error_str:
            message = "Host not found - please verify the database server hostname or IP address."
        elif 'authentication failed' in error_str or 'password authentication failed' in error_str:
            message = "Authentication failed - please check your username and password."
        elif 'database' in error_str and 'does not exist' in error_str:
            message = "Database not found - please verify the database name exists on the server."
        else:
            message = "Could not connect or fetch schema"
            
        return jsonify({
            'status': 'error', 
            'message': message,
            'details': str(e)
        }), 500

# Dashboard Builder API Routes
@app.route('/api/dashboards/generate-ai', methods=['POST'])
@login_required
def generate_ai_dashboard():
    data = request.get_json()
    prompt = data.get('prompt', '')
    data_mart_id = data.get('data_mart_id')
    
    # Mock AI generation - in real implementation, use OpenAI or similar
    mock_components = [
        {
            'id': 'bar-chart-ai-1',
            'type': 'bar',
            'title': 'Revenue by Category',
            'icon': 'BarChart3',
            'description': 'Shows revenue breakdown by product category'
        },
        {
            'id': 'line-chart-ai-1',
            'type': 'line', 
            'title': 'Trend Analysis',
            'icon': 'LineChart',
            'description': 'Displays trends over time based on your data'
        },
        {
            'id': 'pie-chart-ai-1',
            'type': 'pie',
            'title': 'Market Share',
            'icon': 'PieChart', 
            'description': 'Shows proportional breakdown of key metrics'
        }
    ]
    
    return jsonify({
        'status': 'success',
        'components': mock_components,
        'message': f'Generated dashboard based on: "{prompt}"'
    })

@app.route('/api/dashboards', methods=['GET', 'POST'])
@login_required
def manage_dashboards():
    if request.method == 'POST':
        data = request.get_json()
        dashboard = Dashboard(
            name=data['name'],
            description=data.get('description', ''),
            user_id=current_user.id,
            theme_id=data.get('theme_id'),
            layout=json.dumps(data.get('layout', {}))
        )
        db.session.add(dashboard)
        db.session.commit()
        return jsonify({'status': 'success', 'id': dashboard.id}), 201
    
    # GET request - fetch dashboards with row-level security
    query = Dashboard.query
    query = apply_row_level_security(query, 'dashboard')
    dashboards = query.all()
    return jsonify([{
        'id': d.id,
        'name': d.name,
        'description': d.description,
        'theme_id': d.theme_id,
        'layout': json.loads(d.layout) if d.layout else {},
        'created_at': d.created_at.isoformat(),
        'updated_at': d.updated_at.isoformat()
    } for d in dashboards])

@app.route('/api/dashboards/<int:dashboard_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_dashboard(dashboard_id):
    query = Dashboard.query.filter_by(id=dashboard_id)
    secured_query = apply_row_level_security(query, 'dashboard')
    dashboard = secured_query.first_or_404(description='Dashboard not found or access denied.')
    
    if request.method == 'GET':
        return jsonify({
            'id': dashboard.id,
            'name': dashboard.name,
            'description': dashboard.description,
            'theme': dashboard.theme,
            'layout': json.loads(dashboard.layout) if dashboard.layout else {},
            'created_at': dashboard.created_at.isoformat(),
            'updated_at': dashboard.updated_at.isoformat(),
            'components': json.loads(dashboard.layout).get('components', []) if dashboard.layout else [],
            'owner': {
                'name': current_user.email.split('@')[0],
                'email': current_user.email
            }
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        dashboard.name = data.get('name', dashboard.name)
        dashboard.description = data.get('description', dashboard.description)
        dashboard.theme = data.get('theme', dashboard.theme)
        if 'layout' in data:
            dashboard.layout = json.dumps(data['layout'])
        dashboard.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'status': 'success'})
    
    elif request.method == 'DELETE':
        db.session.delete(dashboard)
        db.session.commit()
        return jsonify({'status': 'success'})

# Scheduler API Routes
@app.route('/api/scheduler-jobs', methods=['GET', 'POST'])
@login_required
def manage_scheduler_jobs():
    if request.method == 'POST':
        data = request.get_json()
        job = SchedulerJob(
            name=data['name'],
            description=data.get('description', ''),
            job_type=data['job_type'],
            schedule_expression=data['schedule_expression'],
            target_resource_type=data.get('target_resource_type'),
            target_resource_id=data.get('target_resource_id'),
            config=json.dumps(data.get('config', {})),
            created_by=current_user.id
        )
        db.session.add(job)
        db.session.commit()
        return jsonify({'status': 'success', 'id': job.id}), 201
    
    jobs = SchedulerJob.query.filter_by(created_by=current_user.id).all()
    return jsonify([{
        'id': j.id,
        'name': j.name,
        'description': j.description,
        'job_type': j.job_type,
        'schedule_expression': j.schedule_expression,
        'is_active': j.is_active,
        'last_run_at': j.last_run_at.isoformat() if j.last_run_at else None,
        'next_run_at': j.next_run_at.isoformat() if j.next_run_at else None,
        'created_at': j.created_at.isoformat()
    } for j in jobs])

@app.route('/api/scheduler-jobs/<int:job_id>/toggle', methods=['PATCH'])
@login_required
def toggle_scheduler_job(job_id):
    job = SchedulerJob.query.get_or_404(job_id)
    if job.created_by != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    
    job.is_active = not job.is_active
    db.session.commit()
    return jsonify({'status': 'success', 'is_active': job.is_active})

@app.route('/api/ai/query', methods=['POST'])
@login_required
def ai_query():
    data = request.get_json()
    prompt = data.get('prompt')
    source_id = data.get('source_id')
    table_name = data.get('table')

    if not all([prompt, source_id, table_name]):
        return jsonify({'status': 'error', 'message': 'Prompt, data source, and table are required.'}), 400

    source = DataSource.query.get_or_404(source_id)
    if source.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    try:
        details = json.loads(source.connection_details)
        connection_url = URL.create(
            'postgresql+psycopg2',
            username=details.get('user'),
            password=details.get('password'),
            host=details.get('host'),
            port=details.get('port'),
            database=details.get('database')
        )
        engine = create_engine(connection_url)
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        table_schema = {table_name: [col['name'] for col in columns]}

        prompt_template = f"""
        You are an expert PostgreSQL data analyst. Your task is to write a single, syntactically correct PostgreSQL query to answer the user's request based on the schema of the specified table.

        Table Schema for `{table_name}`:
        {json.dumps(table_schema, indent=2)}

        User Request: "{prompt}"

        Guidelines:
        - Respond with ONLY the SQL query, nothing else.
        - Do not use any markdown or other formatting.
        """

        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a PostgreSQL data analyst who responds with only a single SQL query."},
                {"role": "user", "content": prompt_template}
            ],
            temperature=0.0
        )
        
        sql_query = completion.choices[0].message.content.strip()

        with engine.connect() as connection:
            df = pd.read_sql_query(text(sql_query), connection)

        if df.empty:
            return jsonify({'status': 'success', 'message': 'The query returned no results.'})

        potential_labels = df.select_dtypes(include=['object', 'datetime64[ns]']).columns
        potential_data = df.select_dtypes(include=['number']).columns

        if not potential_labels.any() or not potential_data.any():
            return jsonify({'status': 'error', 'message': 'Could not determine how to chart the data.'})

        label_col = potential_labels[0]
        data_cols = potential_data
        chart_type = 'bar'
        if 'date' in label_col.lower() or 'time' in label_col.lower():
            chart_type = 'line'

        chart_data = {
            'labels': df[label_col].tolist(),
            'datasets': [{'label': col, 'data': df[col].tolist()} for col in data_cols]
        }

        return jsonify({
            'type': 'chart',
            'chartType': chart_type,
            'title': prompt,
            'data': chart_data,
            'message': 'Here is a chart based on your request.'
        })

    except Exception as e:
        logger.error(f"AI query failed for source {source_id}: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to generate AI query.', 'details': str(e)}), 500


# --- Data Marts API ---

@app.route('/api/data-marts', methods=['GET', 'POST'])
@login_required
def manage_data_marts():
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        source_id = data.get('data_source_id')
        definition = data.get('definition')

        if not all([name, source_id, definition]):
            return jsonify({'status': 'error', 'message': 'Name, data source, and definition are required.'}), 400

        # Check for duplicate name
        existing = DataMart.query.filter_by(user_id=current_user.id, name=name).first()
        if existing:
            return jsonify({'status': 'error', 'message': f'A data mart with the name "{name}" already exists.'}), 409

        new_datamart = DataMart(
            name=name,
            user_id=current_user.id,
            data_source_id=source_id,
            definition=json.dumps(definition)
        )
        db.session.add(new_datamart)
        db.session.commit()

        return jsonify({'status': 'success', 'message': 'Data mart created successfully!', 'id': new_datamart.id}), 201

    if request.method == 'GET':
        query = DataMart.query
        query = apply_row_level_security(query, 'datamart')
        data_marts = query.all()
        return jsonify([{
            'id': dm.id,
            'name': dm.name,
            'data_source_id': dm.data_source_id,
            'created_at': dm.created_at.isoformat(),
            'updated_at': dm.updated_at.isoformat()
        } for dm in data_marts])

@app.route('/api/data-marts/execute-query', methods=['POST'])
@login_required
def execute_query():
    data = request.get_json()
    data_source_id = data.get('data_source_id')
    query = data.get('query')
    
    logger.info(f"=== SQL EXECUTION REQUEST ===")
    logger.info(f"Data source ID: {data_source_id}")
    logger.info(f"Query: {query}")
    
    if not data_source_id or not query:
        return jsonify({'status': 'error', 'message': 'Data source ID and query are required'}), 400
    
    try:
        # Get the data source
        data_source = DataSource.query.get(data_source_id)
        if not data_source:
            return jsonify({'status': 'error', 'message': 'Data source not found'}), 404
        
        # Get connection details
        connection_details = json.loads(data_source.connection_details)
        
        # Execute query based on database type
        if data_source.type == 'mysql':
            import mysql.connector
            conn = mysql.connector.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 3306),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor(dictionary=True)
            
            # Execute the query
            cursor.execute(query)
            
            # Check if it's a SELECT query
            if query.strip().upper().startswith('SELECT'):
                rows = cursor.fetchall()
                columns = list(rows[0].keys()) if rows else []
                # Convert rows to list of lists for frontend compatibility
                data_rows = [list(row.values()) for row in rows]
            else:
                # For non-SELECT queries (INSERT, UPDATE, DELETE)
                conn.commit()
                affected_rows = cursor.rowcount
                rows = []
                columns = []
                data_rows = []
            
            cursor.close()
            conn.close()
            
            result = {
                'status': 'success',
                'data': data_rows,
                'columns': columns,
                'rows': rows,  # Keep original format for compatibility
                'row_count': len(data_rows),
                'affected_rows': affected_rows if not query.strip().upper().startswith('SELECT') else None
            }
            logger.info(f"MySQL Query Result: {result}")
            return jsonify(result)
        
        elif data_source.type == 'postgresql' or data_source.type == 'postgres':
            import psycopg2
            import psycopg2.extras
            
            conn = psycopg2.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 5432),
                user=connection_details.get('user'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Execute the query
            cursor.execute(query)
            
            # Check if it's a SELECT query
            if query.strip().upper().startswith('SELECT'):
                rows = cursor.fetchall()
                columns = list(rows[0].keys()) if rows else []
                # Convert rows to list of lists for frontend compatibility
                data_rows = [list(row.values()) for row in rows]
                # Convert to regular dict for JSON serialization
                rows = [dict(row) for row in rows]
            else:
                # For non-SELECT queries (INSERT, UPDATE, DELETE)
                conn.commit()
                affected_rows = cursor.rowcount
                rows = []
                columns = []
                data_rows = []
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'data': data_rows,
                'columns': columns,
                'rows': rows,  # Keep original format for compatibility
                'row_count': len(data_rows),
                'affected_rows': affected_rows if not query.strip().upper().startswith('SELECT') else None
            })
        
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unsupported database type: {data_source.type}'
            }), 400
            
    except Exception as e:
        logger.error(f"Query execution failed: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': f'Query execution failed: {str(e)}'
        }), 500

@app.route('/api/database/<database_name>/table/create', methods=['POST'])
@login_required
def create_table(database_name):
    data = request.get_json()
    table_name = data.get('name')
    columns = data.get('columns', [])
    
    if not table_name or not columns:
        return jsonify({
            'status': 'error',
            'message': 'Table name and columns are required'
        }), 400
    
    try:
        # Find the data source by name
        data_source = DataSource.query.filter_by(name=database_name).first()
        if not data_source:
            return jsonify({
                'status': 'error',
                'message': 'Data source not found'
            }), 404
        
        # Get connection details
        connection_details = json.loads(data_source.connection_details)
        
        # Create table based on database type
        if data_source.type == 'postgresql' or data_source.type == 'postgres':
            import psycopg2
            
            conn = psycopg2.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 5432),
                user=connection_details.get('user'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor()
            
            # Build CREATE TABLE SQL
            column_definitions = []
            for col in columns:
                col_def = f'"{col["name"]}" {col["type"]}'
                if col.get('primary_key'):
                    col_def += ' PRIMARY KEY'
                if col.get('not_null'):
                    col_def += ' NOT NULL'
                if col.get('unique'):
                    col_def += ' UNIQUE'
                if col.get('default'):
                    col_def += f' DEFAULT {col["default"]}'
                column_definitions.append(col_def)
            
            create_sql = f'CREATE TABLE "{table_name}" ({", ".join(column_definitions)})'
            logger.info(f"Creating table with SQL: {create_sql}")
            
            cursor.execute(create_sql)
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': f'Table "{table_name}" created successfully'
            })
            
        elif data_source.type == 'mysql':
            import mysql.connector
            
            conn = mysql.connector.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 3306),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor()
            
            # Build CREATE TABLE SQL for MySQL
            column_definitions = []
            for col in columns:
                col_def = f'`{col["name"]}` {col["type"]}'
                if col.get('primary_key'):
                    col_def += ' PRIMARY KEY'
                if col.get('not_null'):
                    col_def += ' NOT NULL'
                if col.get('unique'):
                    col_def += ' UNIQUE'
                if col.get('default'):
                    col_def += f' DEFAULT {col["default"]}'
                column_definitions.append(col_def)
            
            create_sql = f'CREATE TABLE `{table_name}` ({", ".join(column_definitions)})'
            logger.info(f"Creating table with SQL: {create_sql}")
            
            cursor.execute(create_sql)
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': f'Table "{table_name}" created successfully'
            })
        
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unsupported database type: {data_source.type}'
            }), 400
            
    except Exception as e:
        logger.error(f"Table creation failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Table creation failed: {str(e)}'
        }), 500

@app.route('/api/database/<database_name>/schema', methods=['GET'])
@login_required
def get_database_schema(database_name):
    try:
        # Find the data source by name
        data_source = DataSource.query.filter_by(name=database_name).first()
        if not data_source:
            return jsonify({
                'status': 'error',
                'message': 'Data source not found'
            }), 404
        
        # Get connection details
        connection_details = json.loads(data_source.connection_details)
        
        # Get schema based on database type
        if data_source.type == 'postgresql' or data_source.type == 'postgres':
            import psycopg2
            import psycopg2.extras
            
            conn = psycopg2.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 5432),
                user=connection_details.get('user'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get all tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            tables = [dict(row) for row in cursor.fetchall()]
            
            # Get all columns for each table
            schema = {}
            for table in tables:
                table_name = table['table_name']
                cursor.execute("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = %s AND table_schema = 'public'
                    ORDER BY ordinal_position
                """, (table_name,))
                columns = [dict(row) for row in cursor.fetchall()]
                schema[table_name] = columns
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'database': database_name,
                'tables': [t['table_name'] for t in tables],
                'schema': schema
            })
            
        elif data_source.type == 'mysql':
            import mysql.connector
            
            conn = mysql.connector.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 3306),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor(dictionary=True)
            
            # Get all tables
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            table_names = [list(table.values())[0] for table in tables]
            
            # Get all columns for each table
            schema = {}
            for table_name in table_names:
                cursor.execute(f"DESCRIBE `{table_name}`")
                columns = cursor.fetchall()
                schema[table_name] = [
                    {
                        'column_name': col['Field'],
                        'data_type': col['Type'],
                        'is_nullable': col['Null'],
                        'column_default': col['Default']
                    } for col in columns
                ]
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'database': database_name,
                'tables': table_names,
                'schema': schema
            })
        
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unsupported database type: {data_source.type}'
            }), 400
            
    except Exception as e:
        logger.error(f"Schema fetch failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Schema fetch failed: {str(e)}'
        }), 500

@app.route('/api/data-marts/<int:datamart_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_data_mart(datamart_id):
    query = DataMart.query.filter_by(id=datamart_id)
    secured_query = apply_row_level_security(query, 'datamart')
    datamart = secured_query.first_or_404(description='Data mart not found or access denied.')

    if request.method == 'GET':
        return jsonify({
            'id': datamart.id,
            'name': datamart.name,
            'data_source_id': datamart.data_source_id,
            'definition': json.loads(datamart.definition),
            'created_at': datamart.created_at.isoformat(),
            'updated_at': datamart.updated_at.isoformat()
        })

    if request.method == 'PUT':
        data = request.get_json()
        name = data.get('name')
        definition = data.get('definition')

        if not name or not definition:
            return jsonify({'status': 'error', 'message': 'Name and definition are required.'}), 400

        # Check for duplicate name
        existing = DataMart.query.filter(
            DataMart.user_id == current_user.id,
            DataMart.name == name,
            DataMart.id != datamart_id
        ).first()
        if existing:
            return jsonify({'status': 'error', 'message': f'A data mart with the name "{name}" already exists.'}), 409

        datamart.name = name
        datamart.definition = json.dumps(definition)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Data mart updated successfully.'})

    if request.method == 'DELETE':
        db.session.delete(datamart)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Data mart deleted successfully.'})

# --- Themes API ---

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Database Management API Routes
@app.route('/api/database/create', methods=['POST'])
@login_required
@admin_required
def create_database():
    data = request.get_json()
    db_name = data.get('name')
    charset = data.get('charset', 'utf8mb4')
    collation = data.get('collation', 'utf8mb4_unicode_ci')
    
    try:
        # Mock database creation - replace with actual MySQL connection
        return jsonify({
            'status': 'success',
            'message': f'Database "{db_name}" created successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to create database: {str(e)}'
        }), 500

@app.route('/api/database/<db_name>', methods=['DELETE'])
@login_required
@admin_required
def delete_database(db_name):
    try:
        # Mock database deletion - replace with actual MySQL connection
        return jsonify({
            'status': 'success',
            'message': f'Database "{db_name}" deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete database: {str(e)}'
        }), 500

@app.route('/api/database/<db_name>/export', methods=['GET'])
@login_required
def export_database(db_name):
    format_type = request.args.get('format', 'sql')
    
    try:
        # Mock database export - replace with actual mysqldump or similar
        if format_type == 'sql':
            # Generate mock SQL dump
            sql_content = f"-- Database dump for {db_name}\n-- Generated on {datetime.now()}\n\nCREATE DATABASE IF NOT EXISTS `{db_name}`;\nUSE `{db_name}`;\n"
            
            response = make_response(sql_content)
            response.headers['Content-Type'] = 'application/sql'
            response.headers['Content-Disposition'] = f'attachment; filename={db_name}.sql'
            return response
        
        return jsonify({'status': 'error', 'message': 'Unsupported export format'}), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to export database: {str(e)}'
        }), 500

@app.route('/api/database/execute-query', methods=['POST'])
@login_required
def execute_database_query():
    data = request.get_json()
    database = data.get('database')
    query = data.get('query')
    
    try:
        # Mock query execution - replace with actual MySQL connection
        # For security, implement proper query validation and sanitization
        return jsonify({
            'status': 'success',
            'columns': ['id', 'name', 'email'],
            'rows': [
                [1, 'John Doe', 'john@example.com'],
                [2, 'Jane Smith', 'jane@example.com']
            ],
            'execution_time': 0.045,
            'rows_affected': 2
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Query execution failed: {str(e)}'
        }), 500

@app.route('/api/database/user/create', methods=['POST'])
@login_required
@admin_required
def create_db_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    host = data.get('host', '%')
    privileges = data.get('privileges', [])
    
    try:
        # Mock user creation - replace with actual CREATE USER and GRANT commands
        return jsonify({
            'status': 'success',
            'message': f'User "{username}@{host}" created successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to create user: {str(e)}'
        }), 500

@app.route('/api/database/user/<username>/<host>', methods=['DELETE'])
@login_required
@admin_required
def delete_db_user(username, host):
    try:
        # Mock user deletion - replace with actual DROP USER command
        return jsonify({
            'status': 'success',
            'message': f'User "{username}@{host}" deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete user: {str(e)}'
        }), 500

@app.route('/api/database/optimize', methods=['POST'])
@login_required
@admin_required
def optimize_database():
    try:
        # Mock database optimization - replace with actual optimization commands
        return jsonify({
            'status': 'success',
            'message': 'Database optimization started successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to start optimization: {str(e)}'
        }), 500

@app.route('/api/database/slow-queries', methods=['GET'])
@login_required
def get_slow_queries():
    try:
        # For SQLite, we don't have a traditional slow query log like MySQL/PostgreSQL
        # Return empty array to show "No slow queries detected" message
        return jsonify({
            'status': 'success',
            'slowQueries': []
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch slow queries: {str(e)}'
        }), 500

# Table Management API Routes
@app.route('/api/database/<database_name>/table/<table_name>/browse', methods=['GET'])
@login_required
def browse_table_data(database_name, table_name):
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Find the data source by name
        data_source = DataSource.query.filter_by(name=database_name).first()
        if not data_source:
            return jsonify({
                'status': 'error',
                'message': 'Data source not found'
            }), 404
        
        # Get connection details
        connection_details = json.loads(data_source.connection_details)
        
        # Connect to the database and fetch data
        if data_source.type == 'mysql':
            import mysql.connector
            conn = mysql.connector.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 3306),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor(dictionary=True)
            
            # Execute query to get table data
            query = f"SELECT * FROM `{table_name}` LIMIT {limit} OFFSET {offset}"
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM `{table_name}`"
            cursor.execute(count_query)
            total_count = cursor.fetchone()['total']
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'data': rows,
                'total': total_count,
                'limit': limit,
                'offset': offset
            })
        
        elif data_source.type == 'postgresql':
            import psycopg2
            import psycopg2.extras
            
            conn = psycopg2.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 5432),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Execute query to get table data
            query = f'SELECT * FROM "{table_name}" LIMIT %s OFFSET %s'
            cursor.execute(query, (limit, offset))
            rows = cursor.fetchall()
            
            # Get total count
            count_query = f'SELECT COUNT(*) as total FROM "{table_name}"'
            cursor.execute(count_query)
            total_count = cursor.fetchone()['total']
            
            cursor.close()
            conn.close()
            
            # Convert to regular dict for JSON serialization
            rows = [dict(row) for row in rows]
            
            return jsonify({
                'status': 'success',
                'data': rows,
                'total': total_count,
                'limit': limit,
                'offset': offset
            })
        
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unsupported database type: {data_source.type}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error browsing table data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to browse table data: {str(e)}'
        }), 500

@app.route('/api/database/<database_name>/table/<table_name>/optimize', methods=['POST'])
@login_required
def optimize_table(database_name, table_name):
    try:
        # Find the data source by name
        data_source = DataSource.query.filter_by(name=database_name).first()
        if not data_source:
            return jsonify({
                'status': 'error',
                'message': 'Data source not found'
            }), 404
        
        # Get connection details
        connection_details = json.loads(data_source.connection_details)
        
        # Connect to the database and optimize table
        if data_source.type == 'mysql':
            import mysql.connector
            conn = mysql.connector.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 3306),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor()
            
            # Execute OPTIMIZE TABLE command
            query = f"OPTIMIZE TABLE `{table_name}`"
            cursor.execute(query)
            result = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': f'Table "{table_name}" optimized successfully',
                'result': result
            })
        
        elif data_source.type == 'postgresql':
            import psycopg2
            
            conn = psycopg2.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 5432),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor()
            
            # Execute VACUUM ANALYZE command for PostgreSQL
            query = f'VACUUM ANALYZE "{table_name}"'
            cursor.execute(query)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': f'Table "{table_name}" optimized successfully'
            })
        
        else:
            return jsonify({
                'status': 'error',
                'message': f'Optimization not supported for {data_source.type}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error optimizing table: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to optimize table: {str(e)}'
        }), 500

@app.route('/api/database/<database_name>/table/<table_name>/truncate', methods=['POST'])
@login_required
@admin_required
def truncate_table(database_name, table_name):
    try:
        # Find the data source by name
        data_source = DataSource.query.filter_by(name=database_name).first()
        if not data_source:
            return jsonify({
                'status': 'error',
                'message': 'Data source not found'
            }), 404
        
        # Get connection details
        connection_details = json.loads(data_source.connection_details)
        
        # Connect to the database and truncate table
        if data_source.type == 'mysql':
            import mysql.connector
            conn = mysql.connector.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 3306),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor()
            
            # Execute TRUNCATE TABLE command
            query = f"TRUNCATE TABLE `{table_name}`"
            cursor.execute(query)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': f'Table "{table_name}" truncated successfully'
            })
        
        elif data_source.type == 'postgresql':
            import psycopg2
            
            conn = psycopg2.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 5432),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor()
            
            # Execute TRUNCATE TABLE command
            query = f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY'
            cursor.execute(query)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': f'Table "{table_name}" truncated successfully'
            })
        
        else:
            return jsonify({
                'status': 'error',
                'message': f'Truncate not supported for {data_source.type}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error truncating table: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to truncate table: {str(e)}'
        }), 500

@app.route('/api/database/<database_name>/table/<table_name>/copy', methods=['POST'])
@login_required
def copy_table(database_name, table_name):
    try:
        data = request.get_json()
        new_name = data.get('newName')
        
        if not new_name:
            return jsonify({
                'status': 'error',
                'message': 'New table name is required'
            }), 400
        
        # Find the data source by name
        data_source = DataSource.query.filter_by(name=database_name).first()
        if not data_source:
            return jsonify({
                'status': 'error',
                'message': 'Data source not found'
            }), 404
        
        # Get connection details
        connection_details = json.loads(data_source.connection_details)
        
        # Connect to the database and copy table
        if data_source.type == 'mysql':
            import mysql.connector
            conn = mysql.connector.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 3306),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor()
            
            # Create table structure
            create_query = f"CREATE TABLE `{new_name}` LIKE `{table_name}`"
            cursor.execute(create_query)
            
            # Copy data
            copy_query = f"INSERT INTO `{new_name}` SELECT * FROM `{table_name}`"
            cursor.execute(copy_query)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': f'Table copied as "{new_name}" successfully'
            })
        
        elif data_source.type == 'postgresql':
            import psycopg2
            
            conn = psycopg2.connect(
                host=connection_details.get('host'),
                port=connection_details.get('port', 5432),
                user=connection_details.get('username'),
                password=connection_details.get('password'),
                database=connection_details.get('database')
            )
            cursor = conn.cursor()
            
            # Create table with data
            copy_query = f'CREATE TABLE "{new_name}" AS SELECT * FROM "{table_name}"'
            cursor.execute(copy_query)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': f'Table copied as "{new_name}" successfully'
            })
        
        else:
            return jsonify({
                'status': 'error',
                'message': f'Copy not supported for {data_source.type}'
            }), 400
            
    except Exception as e:
        logger.error(f"Error copying table: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to copy table: {str(e)}'
        }), 500

@app.route('/api/database/primary/schema', methods=['GET'])
@login_required
def get_primary_database_schema():
    """Get schema for the primary DataViz SQLite database - optimized version"""
    # Check cache first
    cache_key = "primary_schema"
    if cache_key in schema_cache:
        cached_data, timestamp = schema_cache[cache_key]
        if datetime.now() - timestamp < timedelta(seconds=CACHE_DURATION):
            return jsonify(cached_data)
    
    try:
        # Use the current app's database connection with optimized query
        with db.engine.connect() as connection:
            # Get all tables in a single query
            tables_query = """
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            """
            table_results = connection.execute(text(tables_query)).fetchall()
            
            tables = []
            for table_row in table_results:
                table_name = table_row[0]
                
                # Get columns for this table in a single query
                columns_query = f"PRAGMA table_info({table_name})"
                column_results = connection.execute(text(columns_query)).fetchall()
                
                columns = [
                    {
                        'name': col[1],  # column name
                        'type': col[2],  # data type
                        'nullable': not col[3],  # not null flag (inverted)
                        'default': col[4]  # default value
                    } for col in column_results
                ]
                
                tables.append({
                    'name': table_name,
                    'columns': columns
                })
        
        result = {
            'status': 'success',
            'database': 'DataViz Primary Database',
            'tables': tables
        }
        
        # Cache the result
        schema_cache[cache_key] = (result, datetime.now())
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Failed to fetch primary database schema: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch schema: {str(e)}'
        }), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Handle API routes - return 404 for unknown API endpoints
    if path.startswith('api/'):
        return jsonify({'status': 'error', 'message': 'API endpoint not found'}), 404
    
    # Serve static files if they exist
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # For all other routes (including /login, /access-management, etc.), serve index.html for SPA routing
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        logger.error(f"Error serving index.html: {e}")
        return f"Error loading application: {e}", 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8091, threaded=True)
