import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_login import (LoginManager, UserMixin, login_user, logout_user,
                         login_required, current_user)
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, inspect
from werkzeug.security import check_password_hash

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='dist', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Database configuration
from database.config import config as db_config
app.config['SQLALCHEMY_DATABASE_URI'] = db_config.get_database_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'status': 'error', 'message': 'Authentication required'}), 401

# --- Database Models ---
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='VIEWER')
    # Simplified for clarity

    @property
    def is_admin(self):
        return self.role in ['ADMIN', 'SUPER_ADMIN']

class DataSource(db.Model):
    __tablename__ = 'data_sources'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), unique=True, nullable=False)
    connection_type = db.Column(db.String(50), nullable=False)
    connection_params = db.Column(db.JSON, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'connection_type': self.connection_type,
            'description': self.description,
            'created_at': self.created_at.isoformat() + 'Z',
        }

    def get_db_url(self):
        params = self.connection_params
        if self.connection_type == 'postgresql':
            return f"postgresql://{params['user']}:{params['password']}@{params['host']}:{params['port']}/{params['database']}?gssencmode=disable"
        return None

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(str(user_id))

# --- Auth API Endpoints ---
@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        login_user(user, remember=True)
        return jsonify({
            'status': 'success',
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'is_admin': user.is_admin
            }
        })
    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

@app.route('/api/session', methods=['GET'])
@login_required
def get_session():
    return jsonify({
        'status': 'success',
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'role': current_user.role,
            'is_admin': current_user.is_admin
        }
    })

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'status': 'success', 'message': 'Logout successful.'})

# --- Data Source API Endpoints ---
@app.route('/api/data-sources', methods=['GET', 'POST'])
@login_required
def data_sources():
    if request.method == 'GET':
        sources = DataSource.query.order_by(DataSource.created_at).all()
        return jsonify([source.to_dict() for source in sources])
    
    elif request.method == 'POST':
        data = request.get_json()
        if not data or not data.get('name') or not data.get('type') or not data.get('connection_params'):
            return jsonify({'status': 'error', 'message': 'Name, type, and connection_params are required'}), 400

        if DataSource.query.filter_by(name=data['name']).first():
            return jsonify({'status': 'error', 'message': f'Data source with name "{data["name"]}" already exists'}), 409

        new_source = DataSource(
            name=data['name'],
            connection_type=data['type'],
            connection_params=data['connection_params'],
            description=data.get('description', '')
        )
        db.session.add(new_source)
        db.session.commit()
        return jsonify(new_source.to_dict()), 201

@app.route('/api/data-sources/<source_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_data_source(source_id):
    source = DataSource.query.get_or_404(source_id)

    if request.method == 'GET':
        return jsonify(source.to_dict())

    if request.method == 'PUT':
        data = request.get_json()
        source.name = data.get('name', source.name)
        source.description = data.get('description', source.description)
        db.session.commit()
        return jsonify(source.to_dict())

    if request.method == 'DELETE':
        db.session.delete(source)
        db.session.commit()
        return jsonify({'message': 'Data source deleted successfully'})

@app.route('/api/data-sources/test', methods=['POST'])
@login_required
def test_data_source():
    data = request.get_json()
    source_type = data.get('type')
    details = data.get('details', {})
    
    # Mock connection test - always return success for demo
    return jsonify({
        'status': 'success',
        'message': f'Successfully connected to {source_type} database',
        'connection_info': {
            'host': details.get('host'),
            'database': details.get('database'),
            'status': 'connected'
        }
    })

@app.route('/api/data-marts', methods=['GET', 'POST'])
@login_required
def data_marts():
    if request.method == 'GET':
        # Return sample data marts
        sample_data_marts = [
            {
                'id': '1',
                'name': 'Sales Analytics',
                'data_source_id': '1',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            },
            {
                'id': '2',
                'name': 'Customer Insights',
                'data_source_id': '2',
                'created_at': '2024-01-02T00:00:00Z',
                'updated_at': '2024-01-02T00:00:00Z'
            }
        ]
        return jsonify(sample_data_marts)
    elif request.method == 'POST':
        data = request.get_json()
        return jsonify({
            'status': 'success',
            'message': 'Data mart created successfully',
            'data': data
        })

@app.route('/api/execute-query', methods=['POST'])
@login_required
def execute_query():
    data = request.get_json()
    query = data.get('query', '')
    data_source_id = data.get('data_source_id')
    
    # Mock SQL execution - return sample data
    if 'select' in query.lower():
        sample_result = {
            'status': 'success',
            'data': [
                {'id': 1, 'name': 'Sample Record 1', 'value': 100},
                {'id': 2, 'name': 'Sample Record 2', 'value': 200},
                {'id': 3, 'name': 'Sample Record 3', 'value': 300}
            ],
            'columns': ['id', 'name', 'value'],
            'row_count': 3
        }
    else:
        sample_result = {
            'status': 'success',
            'message': 'Query executed successfully',
            'affected_rows': 1
        }
    
    return jsonify(sample_result)

# Schema templates for different database types
SCHEMA_TEMPLATES = {
    'oneapp_dev': {
        'users': [
            {'name': 'id', 'type': 'UUID', 'nullable': False, 'key': 'PRIMARY', 'description': 'Unique user identifier'},
            {'name': 'email', 'type': 'VARCHAR(255)', 'nullable': False, 'key': 'UNIQUE', 'description': 'User email address'},
            {'name': 'password_hash', 'type': 'VARCHAR(255)', 'nullable': False, 'key': '', 'description': 'Hashed password'},
            {'name': 'role', 'type': 'VARCHAR(50)', 'nullable': False, 'key': '', 'description': 'User role (ADMIN/VIEWER)'},
            {'name': 'created_at', 'type': 'TIMESTAMP', 'nullable': False, 'key': '', 'description': 'Account creation timestamp'},
            {'name': 'updated_at', 'type': 'TIMESTAMP', 'nullable': True, 'key': '', 'description': 'Last update timestamp'}
        ],
        'data_sources': [
            {'name': 'id', 'type': 'UUID', 'nullable': False, 'key': 'PRIMARY', 'description': 'Data source identifier'},
            {'name': 'name', 'type': 'VARCHAR(255)', 'nullable': False, 'key': '', 'description': 'Data source name'},
            {'name': 'connection_type', 'type': 'VARCHAR(50)', 'nullable': False, 'key': '', 'description': 'Database type (postgres, mysql, etc)'},
            {'name': 'connection_string', 'type': 'TEXT', 'nullable': False, 'key': '', 'description': 'Database connection string'},
            {'name': 'is_active', 'type': 'BOOLEAN', 'nullable': False, 'key': '', 'description': 'Active status flag'},
            {'name': 'created_at', 'type': 'TIMESTAMP', 'nullable': False, 'key': '', 'description': 'Creation timestamp'}
        ],
        'dashboards': [
            {'name': 'id', 'type': 'UUID', 'nullable': False, 'key': 'PRIMARY', 'description': 'Dashboard identifier'},
            {'name': 'name', 'type': 'VARCHAR(255)', 'nullable': False, 'key': '', 'description': 'Dashboard name'},
            {'name': 'description', 'type': 'TEXT', 'nullable': True, 'key': '', 'description': 'Dashboard description'},
            {'name': 'config', 'type': 'JSONB', 'nullable': True, 'key': '', 'description': 'Dashboard configuration JSON'},
            {'name': 'created_by', 'type': 'UUID', 'nullable': False, 'key': 'FOREIGN', 'description': 'Creator user ID'},
            {'name': 'created_at', 'type': 'TIMESTAMP', 'nullable': False, 'key': '', 'description': 'Creation timestamp'}
        ],
        'queries': [
            {'name': 'id', 'type': 'UUID', 'nullable': False, 'key': 'PRIMARY', 'description': 'Query identifier'},
            {'name': 'name', 'type': 'VARCHAR(255)', 'nullable': False, 'key': '', 'description': 'Query name'},
            {'name': 'sql_query', 'type': 'TEXT', 'nullable': False, 'key': '', 'description': 'SQL query text'},
            {'name': 'data_source_id', 'type': 'UUID', 'nullable': False, 'key': 'FOREIGN', 'description': 'Associated data source'},
            {'name': 'created_by', 'type': 'UUID', 'nullable': False, 'key': 'FOREIGN', 'description': 'Creator user ID'},
            {'name': 'created_at', 'type': 'TIMESTAMP', 'nullable': False, 'key': '', 'description': 'Creation timestamp'}
        ]
    },
    'postgresql': {
        'customers': [
            {'name': 'customer_id', 'type': 'SERIAL', 'nullable': False, 'key': 'PRIMARY', 'description': 'Customer identifier'},
            {'name': 'company_name', 'type': 'VARCHAR(255)', 'nullable': False, 'key': '', 'description': 'Company name'},
            {'name': 'contact_email', 'type': 'VARCHAR(255)', 'nullable': True, 'key': '', 'description': 'Contact email'},
            {'name': 'phone', 'type': 'VARCHAR(20)', 'nullable': True, 'key': '', 'description': 'Phone number'},
            {'name': 'address', 'type': 'TEXT', 'nullable': True, 'key': '', 'description': 'Company address'},
            {'name': 'created_date', 'type': 'TIMESTAMP', 'nullable': False, 'key': '', 'description': 'Registration date'}
        ],
        'orders': [
            {'name': 'order_id', 'type': 'SERIAL', 'nullable': False, 'key': 'PRIMARY', 'description': 'Order identifier'},
            {'name': 'customer_id', 'type': 'INTEGER', 'nullable': False, 'key': 'FOREIGN', 'description': 'Customer reference'},
            {'name': 'order_date', 'type': 'DATE', 'nullable': False, 'key': '', 'description': 'Order date'},
            {'name': 'total_amount', 'type': 'DECIMAL(10,2)', 'nullable': False, 'key': '', 'description': 'Total order amount'},
            {'name': 'status', 'type': 'VARCHAR(50)', 'nullable': False, 'key': '', 'description': 'Order status'},
            {'name': 'shipping_address', 'type': 'TEXT', 'nullable': True, 'key': '', 'description': 'Shipping address'}
        ],
        'products': [
            {'name': 'product_id', 'type': 'SERIAL', 'nullable': False, 'key': 'PRIMARY', 'description': 'Product identifier'},
            {'name': 'name', 'type': 'VARCHAR(255)', 'nullable': False, 'key': '', 'description': 'Product name'},
            {'name': 'description', 'type': 'TEXT', 'nullable': True, 'key': '', 'description': 'Product description'},
            {'name': 'price', 'type': 'DECIMAL(10,2)', 'nullable': False, 'key': '', 'description': 'Product price'},
            {'name': 'category', 'type': 'VARCHAR(100)', 'nullable': True, 'key': '', 'description': 'Product category'},
            {'name': 'in_stock', 'type': 'BOOLEAN', 'nullable': False, 'key': '', 'description': 'Stock availability'}
        ]
    },
    'sqlite': {
        'users': [
            {'name': 'id', 'type': 'INTEGER', 'nullable': False, 'key': 'PRIMARY', 'description': 'User identifier'},
            {'name': 'username', 'type': 'TEXT', 'nullable': False, 'key': 'UNIQUE', 'description': 'Username'},
            {'name': 'email', 'type': 'TEXT', 'nullable': False, 'key': '', 'description': 'Email address'},
            {'name': 'created_at', 'type': 'DATETIME', 'nullable': False, 'key': '', 'description': 'Creation timestamp'}
        ],
        'sessions': [
            {'name': 'id', 'type': 'INTEGER', 'nullable': False, 'key': 'PRIMARY', 'description': 'Session identifier'},
            {'name': 'user_id', 'type': 'INTEGER', 'nullable': False, 'key': 'FOREIGN', 'description': 'User reference'},
            {'name': 'session_token', 'type': 'TEXT', 'nullable': False, 'key': '', 'description': 'Session token'},
            {'name': 'expires_at', 'type': 'DATETIME', 'nullable': False, 'key': '', 'description': 'Expiration time'}
        ]
    }
}

@app.route('/api/data-sources/<source_id>/schema', methods=['GET'])
@login_required
def get_data_source_schema(source_id):
    source = DataSource.query.get_or_404(source_id)
    db_url = source.get_db_url()
    if not db_url:
        return jsonify({'status': 'error', 'message': 'Database connection parameters not configured for this source.'}), 400

    try:
        engine = create_engine(db_url)
        inspector = inspect(engine)
        schema_info = {}
        for table_name in inspector.get_table_names():
            columns = []
            for column in inspector.get_columns(table_name):
                columns.append({'name': column['name'], 'type': str(column['type'])})
            schema_info[table_name] = columns
        return jsonify(schema_info)
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Failed to inspect schema: {str(e)}'}), 500

@app.route('/api/database/slow-queries', methods=['GET'])
@login_required
def get_slow_queries():
    # Return mock slow queries data
    mock_slow_queries = [
        {
            'query': 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE u.created_at > ?',
            'duration': 2.45,
            'calls': 156,
            'avg_duration': 0.89,
            'last_seen': '2024-01-15T10:30:00Z'
        },
        {
            'query': 'SELECT COUNT(*) FROM products WHERE category = ? AND in_stock = true',
            'duration': 1.23,
            'calls': 89,
            'avg_duration': 0.34,
            'last_seen': '2024-01-15T09:15:00Z'
        }
    ]
    return jsonify(mock_slow_queries)

@app.route('/api/dashboards', methods=['GET', 'POST'])
@login_required
def dashboards():
    if request.method == 'GET':
        # Return sample dashboards
        sample_dashboards = [
            {
                'id': '1',
                'name': 'Sales Dashboard',
                'description': 'Overview of sales metrics',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z',
                'created_by': current_user.id,
                'is_public': False
            },
            {
                'id': '2',
                'name': 'Analytics Overview',
                'description': 'Key performance indicators',
                'created_at': '2024-01-02T00:00:00Z',
                'updated_at': '2024-01-02T00:00:00Z',
                'created_by': current_user.id,
                'is_public': True
            }
        ]
        return jsonify(sample_dashboards)
    elif request.method == 'POST':
        data = request.get_json()
        new_dashboard = {
            'id': str(datetime.utcnow().timestamp()),
            'name': data.get('name'),
            'description': data.get('description', ''),
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'updated_at': datetime.utcnow().isoformat() + 'Z',
            'created_by': current_user.id,
            'is_public': data.get('is_public', False)
        }
        return jsonify({
            'status': 'success',
            'message': 'Dashboard created successfully',
            'data': new_dashboard
        })

# Serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.cli.command('init-db')
def init_db_command():
    """Creates the database tables and populates default data."""
    db.create_all()
    if not DataSource.query.filter_by(name='oneapp_dev').first():
        db_params = {
            "user": os.getenv("DB_USERNAME", "sunny.agarwal"),
            "password": os.getenv("DB_PASSWORD", "postgres"),
            "host": os.getenv("DB_HOST", "localhost"),
            "port": os.getenv("DB_PORT", "5432"),
            "database": os.getenv("DB_NAME", "dataviz")
        }
        oneapp_dev_source = DataSource(name='oneapp_dev', connection_type='postgresql', description='Main OneApp dev database', connection_params=db_params)
        db.session.add(oneapp_dev_source)
        db.session.commit()
        print('Default oneapp_dev data source created.')
    print('Database initialized.')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
