from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
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

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dataviz.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

# DataSource model
class DataSource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    host = db.Column(db.String(100), nullable=False)
    port = db.Column(db.Integer, nullable=False)
    database = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

@app.context_processor
def inject_now():
    return {'now': datetime.utcnow()}

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Catch-all route to serve the React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/login', methods=['POST'])
def login():
    app.logger.info('Login attempt started.')
    try:
        data = request.get_json()
        if not data:
            app.logger.error('Login failed: No JSON data received.')
            return jsonify({'status': 'error', 'message': 'Invalid request.'}), 400

        email = data.get('email')
        password = data.get('password')
        app.logger.info(f'Login attempt for email: {email}')

        user = User.query.filter_by(email=email).first()
        app.logger.info(f'User query result: {user}')

        if user and check_password_hash(user.password, password):
            login_user(user)
            app.logger.info('Login successful.')
            return jsonify({'status': 'success', 'message': 'Login successful.'})
        else:
            app.logger.warning(f'Login failed for email: {email}. Invalid credentials.')
            return jsonify({'status': 'error', 'message': 'Invalid email or password.'}), 401

    except Exception as e:
        app.logger.error(f'An unexpected error occurred during login: {e}', exc_info=True)
        return jsonify({'status': 'error', 'message': 'An internal server error occurred.'}), 500

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'status': 'success', 'message': 'Logout successful.'})

@app.route('/api/session', methods=['GET'])
@login_required
def get_session():
    role = 'super_admin' if current_user.is_admin else 'viewer'
    return jsonify({
        'status': 'success',
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'role': role
        }
    })

@app.route('/api/data-sources', methods=['GET', 'POST'])
@login_required
def manage_data_sources():
    if request.method == 'POST':
        data = request.get_json()
        new_source = DataSource(
            name=data['name'],
            host=data['host'],
            port=data['port'],
            database=data['database'],
            username=data['username'],
            password=data['password'], # Note: In a real app, encrypt this!
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
            'host': source.host,
            'port': source.port,
            'database': source.database,
            'username': source.username
        } for source in sources])

@app.route('/api/data-sources/<int:source_id>', methods=['DELETE'])
@login_required
def delete_data_source(source_id):
    source = DataSource.query.get_or_404(source_id)
    if source.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    
    db.session.delete(source)
    db.session.commit()
    
    return jsonify({'status': 'success', 'message': 'Data source deleted.'})

@app.route('/api/data-sources/<int:source_id>/schema')
@login_required
def get_data_source_schema(source_id):
    source = DataSource.query.get_or_404(source_id)
    if source.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    try:
        connection_url = URL.create(
            'postgresql+psycopg2',
            username=source.username,
            password=source.password, # This is insecure, use a vault in production
            host=source.host,
            port=source.port,
            database=source.database
        )
        engine = create_engine(connection_url)
        inspector = inspect(engine)
        
        schema = {}
        tables = inspector.get_table_names()
        for table in tables:
            columns = inspector.get_columns(table)
            schema[table] = [{'name': col['name'], 'type': str(col['type'])} for col in columns]
            
        return jsonify({'status': 'success', 'schema': schema})
        
    except Exception as e:
        logger.error(f"Failed to fetch schema for source {source_id}: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Could not connect or fetch schema', 'details': str(e)}), 500

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
        # 1. Get Schema
        connection_url = URL.create('postgresql+psycopg2', username=source.username, password=source.password, host=source.host, port=source.port, database=source.database)
        engine = create_engine(connection_url)
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        table_schema = {table_name: [col['name'] for col in columns]}

        # 2. Construct Prompt for OpenAI
        prompt_template = f"""
        You are an expert PostgreSQL data analyst. Your task is to write a single, syntactically correct PostgreSQL query to answer the user's request based on the schema of the specified table.

        Table Schema for `{table_name}`:
        {json.dumps(table_schema, indent=2)}

        User Request: "{prompt}"

        Guidelines:
        - Respond with ONLY the SQL query, nothing else.
        - Do not use any markdown or other formatting.
        - If the request is complex, try to create a query that is as simple as possible to answer the core question.
        - If a date or time column is available, use it to order results chronologically where appropriate.
        """

        # 3. Call OpenAI API
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

        # 4. Execute the Query
        with engine.connect() as connection:
            df = pd.read_sql_query(text(sql_query), connection)

        # 5. Process Results and Determine Chart Type (Basic Heuristics)
        if df.empty:
            return jsonify({'status': 'success', 'message': 'The query returned no results.'})

        # Identify potential label and data columns
        potential_labels = df.select_dtypes(include=['object', 'datetime64[ns]']).columns
        potential_data = df.select_dtypes(include=['number']).columns

        if not potential_labels or not potential_data:
            return jsonify({'status': 'error', 'message': 'Could not determine how to chart the data.'})

        label_col = potential_labels[0]
        data_cols = potential_data

        chart_type = 'bar' # Default to bar chart
        if len(data_cols) == 1 and len(df) < 10:
             # If only one numeric column and few data points, pie chart might be good
             chart_type = 'pie'
        if 'date' in label_col.lower() or 'time' in label_col.lower():
            chart_type = 'line'

        # 6. Format for Chart.js
        chart_data = {
            'labels': df[label_col].tolist(),
            'datasets': [
                {
                    'label': col,
                    'data': df[col].tolist(),
                } for col in data_cols
            ]
        }

        response_data = {
            'type': 'chart',
            'chartType': chart_type,
            'title': prompt,
            'data': chart_data,
            'message': 'Here is a chart based on your request.'
        }

        return jsonify(response_data)

    except Exception as e:
        logger.error(f"AI query failed for source {source_id}: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to generate AI query.', 'details': str(e)}), 500

@app.route('/api/data-sources/test', methods=['POST'])
@login_required
def test_data_source():
    """Test PostgreSQL connection with provided credentials"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['host', 'port', 'database', 'username', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create connection URL
        connection_url = URL.create(
            'postgresql+psycopg2',
            username=data['username'],
            password=data['password'],
            host=data['host'],
            port=int(data['port']),
            database=data['database']
        )
        
        # Test connection
        engine = create_engine(connection_url, connect_args={'connect_timeout': 10})
        with engine.connect() as conn:
            result = conn.execute(text('SELECT 1'))
            result.fetchone()
        
        logger.info(f"Successfully tested connection to {data['host']}:{data['port']}/{data['database']}")
        
        return jsonify({
            'status': 'success',
            'message': 'Connection successful'
        })
        
    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Connection failed',
            'details': str(e)
        }), 500

# Initialize database and create admin user
with app.app_context():
    db.create_all()
    
    # Create admin user if not exists
    if not User.query.filter_by(email='admin@example.com').first():
        admin = User(
            email='admin@example.com',
            password=generate_password_hash('admin123', method='pbkdf2:sha256'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print('Created admin user: admin@example.com / admin123')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8081)
