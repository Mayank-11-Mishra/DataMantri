from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime
import logging
import os
import uuid

# Create Flask app
app = Flask(__name__, static_folder='dist', static_url_path='')
app.config['SECRET_KEY'] = os.urandom(24)

# Use the configuration from database/config.py
from database.config import config as db_config
app.config['SQLALCHEMY_DATABASE_URI'] = db_config.get_database_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure CORS to allow credentials
CORS(app, supports_credentials=True, origins=['http://localhost:8080', 'http://127.0.0.1:8080'])

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
    # Support demo session without DB
    if str(user_id) == 'demo':
        return DemoUser()
    # Ensure correct type for UUID primary key
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
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    role = db.Column(db.String(20), nullable=False, default='VIEWER')
    organization_id = db.Column(db.String(36))

# Pipeline model for data orchestration
class Pipeline(db.Model):
    __tablename__ = 'pipelines'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False, unique=True)
    description = db.Column(db.Text)
    source_id = db.Column(db.Integer, nullable=False)  # Reference to data_sources
    source_table = db.Column(db.String(255))
    destination_id = db.Column(db.Integer, nullable=False)  # Reference to data_sources
    destination_table = db.Column(db.String(255))
    mode = db.Column(db.String(50), default='batch')  # batch or realtime
    schedule = db.Column(db.String(100))  # Cron expression
    status = db.Column(db.String(50), default='inactive')  # active, inactive, running, failed
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_run_at = db.Column(db.DateTime)

# Pipeline run history
class PipelineRun(db.Model):
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

    @property
    def must_reset_password(self):
        return False  # Default behavior
    
    @must_reset_password.setter
    def must_reset_password(self, value):
        pass  # Ignore for now

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
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
        return jsonify({
            'status': 'success',
            'user': {
                'id': current_user.id,
                'email': current_user.email,
                'role': getattr(current_user, 'role', 'ADMIN'),
                'is_admin': getattr(current_user, 'is_admin', True) if hasattr(current_user, 'is_admin') else True,
                'organization_name': getattr(current_user, 'organization_name', None),
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

# Pipeline API Routes
@app.route('/api/pipelines', methods=['GET'])
@login_required
def get_pipelines():
    """Get all pipelines"""
    try:
        pipelines = Pipeline.query.all()
        return jsonify([{
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'source_id': p.source_id,
            'source_table': p.source_table,
            'destination_id': p.destination_id,
            'destination_table': p.destination_table,
            'mode': p.mode,
            'schedule': p.schedule,
            'status': p.status,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'last_run_at': p.last_run_at.isoformat() if p.last_run_at else None
        } for p in pipelines])
    except Exception as e:
        logger.error(f"Error fetching pipelines: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/pipelines', methods=['POST'])
@login_required
def create_pipeline():
    """Create a new pipeline"""
    try:
        data = request.get_json()
        pipeline = Pipeline(
            name=data['name'],
            description=data.get('description'),
            source_id=data['source_id'],
            source_table=data.get('source_table'),
            destination_id=data['destination_id'],
            destination_table=data.get('destination_table'),
            mode=data.get('mode', 'batch'),
            schedule=data.get('schedule'),
            created_by=current_user.id
        )
        db.session.add(pipeline)
        db.session.commit()
        return jsonify({'id': pipeline.id, 'message': 'Pipeline created successfully'}), 201
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
        
        return jsonify({
            'id': pipeline.id,
            'name': pipeline.name,
            'description': pipeline.description,
            'source_id': pipeline.source_id,
            'source_table': pipeline.source_table,
            'destination_id': pipeline.destination_id,
            'destination_table': pipeline.destination_table,
            'mode': pipeline.mode,
            'schedule': pipeline.schedule,
            'status': pipeline.status,
            'created_at': pipeline.created_at.isoformat() if pipeline.created_at else None,
            'last_run_at': pipeline.last_run_at.isoformat() if pipeline.last_run_at else None,
            'runs': [{
                'id': r.id,
                'status': r.status,
                'start_time': r.start_time.isoformat() if r.start_time else None,
                'end_time': r.end_time.isoformat() if r.end_time else None,
                'records_processed': r.records_processed,
                'records_failed': r.records_failed,
                'log': r.log,
                'error_message': r.error_message
            } for r in runs]
        })
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
        return jsonify({'message': 'Pipeline updated successfully'})
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
        
        # Create a new run record
        run = PipelineRun(
            pipeline_id=pipeline_id,
            status='pending',
            triggered_by=current_user.id
        )
        db.session.add(run)
        db.session.commit()
        
        # TODO: Integrate with actual data transfer logic
        # For now, just mark as success
        run.status = 'running'
        pipeline.status = 'running'
        pipeline.last_run_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Pipeline triggered successfully', 'run_id': run.id}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error triggering pipeline: {e}")
        return jsonify({'error': str(e)}), 500

# Serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    with app.app_context():
        # Ensure all tables are created
        db.create_all()
    
    # Run the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True)
