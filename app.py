import os
import time
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import JSON
from sqlalchemy import text
from sqlalchemy import inspect
from sqlalchemy import create_engine
from sqlalchemy import types as satypes
from sqlalchemy.engine import URL
import psycopg2
import psycopg2.extras as pg_extras
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import pandas as pd
import os
import dotenv
import logging
import re

# Load environment variables
dotenv.load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['MAX_CONTENT_LENGTH_READABLE'] = '100MB'  # For user-friendly display
ALLOWED_EXTENSIONS = {'csv', 'xlsx'}

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database configuration
import os
basedir = os.path.abspath(os.path.dirname(__file__))

# Choose database based on environment variable
db_type = os.getenv('DATABASE_TYPE', 'sqlite').lower()

if db_type == 'postgres':
    # PostgreSQL configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('POSTGRES_URL')
    if os.getenv('POSTGRES_SCHEMA'):
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'connect_args': {'options': f'-csearch_path={os.getenv("POSTGRES_SCHEMA")}'}
        }
else:
    # SQLite configuration (default)
    db_path = os.path.join(basedir, 'instance', 'zoho_uploader.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(error):
    max_size = app.config.get('MAX_CONTENT_LENGTH_READABLE', '50MB')
    return jsonify({
        'status': 'error',
        'message': f'File is too large (max {max_size})',
        'details': f'The file you tried to upload exceeds the maximum allowed size of {max_size}. Please try with a smaller file.'
    }), 413

# Make datetime available in all templates
@app.context_processor
def inject_now():
    return {'now': datetime.utcnow}

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploads = db.relationship('Upload', backref='user', lazy=True)

class Upload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, uploaded, transformed, completed, failed
    upload_time = db.Column(db.DateTime, nullable=True)
    transform_time = db.Column(db.DateTime, nullable=True)
    update_time = db.Column(db.DateTime, nullable=True)
    processed_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    records = db.relationship('LeadRecord', backref='upload', lazy=True)
    
    def update_status(self, status):
        self.status = status
        if status == 'uploaded':
            self.upload_time = datetime.utcnow()
        elif status == 'transformed':
            self.transform_time = datetime.utcnow()
        elif status in ['completed', 'failed']:
            self.update_time = datetime.utcnow()
        db.session.commit()

class LeadRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.Integer, db.ForeignKey('upload.id'), nullable=False)
    data = db.Column(JSON)  # Store the full record as JSON
    status = db.Column(db.String(20), default='pending')
    processed_at = db.Column(db.DateTime, default=datetime.utcnow)
    error_message = db.Column(db.Text)
    
    # Add index for better query performance
    __table_args__ = (
        db.Index('idx_lead_upload', 'upload_id'),
        db.Index('idx_lead_status', 'status')
    )

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'danger')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

@app.route('/upload', methods=['POST'])
@login_required
def upload_file():
    logger.info("Upload request received")
    
    # Check if the post request has the file part
    if 'file' not in request.files:
        logger.warning("No file part in request")
        return jsonify({
            'status': 'error',
            'message': 'No file selected',
            'details': 'Please select a file to upload before submitting.'
        }), 400
    
    file = request.files['file']
    file_type = request.form.get('file_type')
    logger.info(f"File upload started - Filename: {file.filename}, Type: {file_type}")
    
    # If the user does not select a file, the browser submits an empty file
    if file.filename == '':
        logger.warning("Empty filename in request")
        return jsonify({
            'status': 'error',
            'message': 'No file selected',
            'details': 'Please select a file to upload.'
        }), 400
    
    if not file or not allowed_file(file.filename):
        logger.warning(f"Invalid file type: {file.filename if file else 'No file'}")
        return jsonify({
            'status': 'error',
            'message': 'Invalid file type',
            'details': 'File type not allowed. Please upload a CSV or Excel file.'
        }), 400
    
    if not file_type:
        logger.warning("No file type specified")
        return jsonify({
            'status': 'error',
            'message': 'Missing file type',
            'details': 'Please select a file type.'
        }), 400
    
    # Create upload record
    upload = None
    temp_path = None
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(app.root_path, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        logger.debug(f"Upload directory: {upload_dir}")
        
        # Create a secure filename with timestamp
        timestamp = datetime.utcnow()
        filename = f"{timestamp.strftime('%Y%m%d_%H%M%S')}_{secure_filename(file.filename)}"
        temp_path = os.path.join(upload_dir, filename)
        logger.info(f"Saving file to: {temp_path}")
        
        # Save the file temporarily
        file.save(temp_path)
        logger.info("File saved successfully")
        
        # Create upload record with initial status
        upload = Upload(
            filename=filename,
            file_type=file_type,
            user_id=current_user.id,
            status='uploaded',
            upload_time=timestamp
        )
        db.session.add(upload)
        db.session.commit()
        logger.info(f"Created upload record with ID: {upload.id}")
        
        try:
            # Update status to 'uploaded'
            logger.info("Updating status to 'uploaded'")
            upload.update_status('uploaded')
            
            # Process the uploaded file with user ID and upload ID
            logger.info("Starting file processing")
            result = process_uploaded_file(temp_path, file_type, current_user.id, upload.id)
            logger.info(f"File processing completed. Result: {result}")
            
            # Clean up the temporary file if processing was successful
            if result.get('status') in ['success', 'partial_success']:
                try:
                    os.remove(temp_path)
                    logger.info("Temporary file removed successfully")
                except Exception as e:
                    logger.warning(f"Could not remove temporary file {temp_path}: {str(e)}")
            
            # Add upload ID to the result
            result['upload_id'] = upload.id
            
            # Return the processing results
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}", exc_info=True)
            
            # Clean up the temporary file if it exists
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    logger.info("Removed temporary file after error")
                except Exception as cleanup_error:
                    logger.warning(f"Could not remove temporary file {temp_path}: {str(cleanup_error)}")
            
            # Update upload status to failed
            if upload:
                error_msg = str(e)
                upload.error_message = error_msg
                upload.update_status('failed')
                logger.error(f"Upload {upload.id} failed: {error_msg}")
            
            return jsonify({
                'status': 'error',
                'message': 'Error processing file',
                'details': str(e),
                'upload_id': upload.id if upload else None
            }), 500
            
    except Exception as e:
        logger.critical(f"Unexpected error during file upload: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred during file upload',
            'details': str(e)
        }), 500

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv', 'xlsx'}

def standardize_state_name(state_name):
    """Standardize Indian state names"""
    if pd.isna(state_name) or str(state_name).strip() in ['', 'NULL', 'null', 'None']:
        return None
        
    state = str(state_name).strip().lower()
    # Normalize punctuation and common separators
    state = state.replace('&', 'and')
    state = state.replace('.', ' ')
    state = ' '.join(state.split())
    state_mapping = {
        'andaman and nicobar islands': 'Andaman and Nicobar Islands',
        'andhra pradesh': 'Andhra Pradesh',
        'arunachal pradesh': 'Arunachal Pradesh',
        'assam': 'Assam',
        'bihar': 'Bihar',
        'chandigarh': 'Chandigarh',
        'chhattisgarh': 'Chhattisgarh',
        'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
        'delhi': 'Delhi',
        'nct of delhi': 'Delhi',
        'delhi ncr': 'Delhi',
        'goa': 'Goa',
        'gujarat': 'Gujarat',
        'haryana': 'Haryana',
        'himachal pradesh': 'Himachal Pradesh',
        'jammu and kashmir': 'Jammu and Kashmir',
        'jammu kashmir': 'Jammu and Kashmir',
        'j and k': 'Jammu and Kashmir',
        'j&k': 'Jammu and Kashmir',
        'jharkhand': 'Jharkhand',
        'karnataka': 'Karnataka',
        'kerala': 'Kerala',
        'ladakh': 'Ladakh',
        'lakshadweep': 'Lakshadweep',
        'madhya pradesh': 'Madhya Pradesh',
        'maharashtra': 'Maharashtra',
        'manipur': 'Manipur',
        'meghalaya': 'Meghalaya',
        'mizoram': 'Mizoram',
        'nagaland': 'Nagaland',
        'odisha': 'Odisha',
        'orissa': 'Odisha',
        'puducherry': 'Puducherry',
        'pondicherry': 'Puducherry',
        'punjab': 'Punjab',
        'rajasthan': 'Rajasthan',
        'sikkim': 'Sikkim',
        'tamil nadu': 'Tamil Nadu',
        'telangana': 'Telangana',
        'tripura': 'Tripura',
        'uttar pradesh': 'Uttar Pradesh',
        'uttarakhand': 'Uttarakhand',
        'uttaranchal': 'Uttarakhand',
        'west bengal': 'West Bengal'
    }
    
    # Check for exact match first
    if state in state_mapping:
        return state_mapping[state]
    
    # Check for partial matches
    for key, value in state_mapping.items():
        if state in key or key in state:
            return value
    
    # If no match found, return the original value with proper case
    return state.title()

def clean_phone_number(phone):
    """Clean and standardize phone numbers to Indian format: 12 digits starting with 91. Returns None if not valid."""
    if pd.isna(phone):
        return None

    # If multiple numbers separated by common delimiters, take the first non-empty
    raw = str(phone).strip()
    for sep in ['/', ',', ';', '|']:
        if sep in raw:
            raw = raw.split(sep)[0].strip()
            break

    # Remove all non-digit characters
    digits = ''.join(ch for ch in raw if ch.isdigit())
    if not digits:
        return None

    # Remove leading 00 or 0 prefixes
    if digits.startswith('0091'):
        digits = digits[2:]  # make it 91...
    if digits.startswith('00'):
        # International prefix, try to trim to last 12 if includes country code
        if len(digits) > 12:
            digits = digits[-12:]
    if digits.startswith('0') and len(digits) in (11, 12, 13):
        # leading 0 trunk prefix
        while digits.startswith('0'):
            digits = digits[1:]

    # Standard cases
    if len(digits) == 10:
        # Mobile numbers in India start with 6-9 typically
        if digits[0] in '6789':
            return '91' + digits
        # Landline or invalid mobile; still prefix 91 if you want to keep it
        return '91' + digits
    if len(digits) == 11 and digits.startswith('91'):
        # malformed missing one digit; cannot fix reliably
        return None
    if len(digits) == 12 and digits.startswith('91'):
        return digits
    if len(digits) > 12:
        # Take last 12 if it ends with a plausible Indian number
        tail = digits[-12:]
        if tail.startswith('91'):
            return tail
    # If it's exactly 11 and starts with 0 + 10-digit, normalize
    if len(digits) == 11 and digits.startswith('0'):
        return '91' + digits[1:]

    return None

def _build_pg_url(host, username, password, database, schema: str | None = "public"):
    """Safely build a SQLAlchemy URL for Postgres with special characters in password."""
    url = URL.create(
        drivername="postgresql+psycopg2",
        username=username,
        password=password,
        host=host,
        port=5432,
        database=database,
    )
    # Add search_path to force schema if provided
    if schema:
        # SQLAlchemy URL doesn't directly carry options; use connect_args later in create_engine
        return url, {"options": f"-csearch_path={schema}"}
    return url, {}

def upload_cleaned_to_postgres(processed_data, expected_count: int):
    """Upload cleaned processed data to two Postgres databases.

    Expects a list of dicts in processed_data. Internal keys starting with '_' are dropped.
    """
    try:
        if not processed_data:
            return {"status": "skipped", "message": "No processed data to upload"}

        # Prepare DataFrame and drop internal keys
        cleaned_rows = []
        for rec in processed_data:
            cleaned = {k: v for k, v in rec.items() if not str(k).startswith('_')}
            cleaned_rows.append(cleaned)
        df = pd.DataFrame(cleaned_rows)

        # Sanitize column names: remove special characters, keep only letters, numbers, and underscore
        def _sanitize_name(name: str) -> str:
            s = re.sub(r'[^0-9a-zA-Z_]', '_', str(name))
            # Avoid empty names
            return s if s else 'col'
        df.columns = [_sanitize_name(c) for c in df.columns]

        # Replace empty strings and NaN with 'Null' string
        df = df.replace('', 'Null')
        df = df.fillna('Null')

        # Build engines for both targets using environment variables
        dev_host = os.getenv('DEV_DB_HOST')
        dev_name = os.getenv('DEV_DB_NAME')
        dev_user = os.getenv('DEV_DB_USER')
        dev_pass = os.getenv('DEV_DB_PASS')
        prod_host = os.getenv('PROD_DB_HOST')
        prod_name = os.getenv('PROD_DB_NAME')
        prod_user = os.getenv('PROD_DB_USER')
        prod_pass = os.getenv('PROD_DB_PASS')

        missing = [
            k for k, v in {
                'DEV_DB_HOST': dev_host,
                'DEV_DB_NAME': dev_name,
                'DEV_DB_USER': dev_user,
                'DEV_DB_PASS': dev_pass,
                'PROD_DB_HOST': prod_host,
                'PROD_DB_NAME': prod_name,
                'PROD_DB_USER': prod_user,
                'PROD_DB_PASS': prod_pass,
            }.items() if not v
        ]
        if missing:
            return {"status": "error", "message": "Missing required environment variables", "missing": missing}

        url1, conn_args1 = _build_pg_url(
            host=dev_host,
            username=dev_user,
            password=dev_pass,
            database=dev_name,
        )
        url2, conn_args2 = _build_pg_url(
            host=prod_host,
            username=prod_user,
            password=prod_pass,
            database=prod_name,
        )
        engine1 = create_engine(url1, pool_pre_ping=True, connect_args=conn_args1)
        engine2 = create_engine(url2, pool_pre_ping=True, connect_args=conn_args2)

        table_name = "marzi_zoho_data_cleaned"
        results = {}

        def _create_text_table(engine, table_name: str, columns: list[str]):
            # Create a table with all TEXT columns
            col_defs = ', '.join([f'"{c}" TEXT' for c in columns])
            ddl = f'CREATE TABLE "{table_name}" ({col_defs})'
            with engine.begin() as conn:
                conn.execute(text(ddl))

        def _ensure_unique_index_on_key(engine, table_name: str, key_col: str):
            idx_name = f"uq_{table_name}_{key_col}"
            with engine.begin() as conn:
                # Create unique index if not exists
                conn.execute(text(
                    f'CREATE UNIQUE INDEX IF NOT EXISTS "{idx_name}" ON "{table_name}" ("{key_col}")'
                ))

        def _batch_upsert(engine, table_name: str, df_to_write: pd.DataFrame, key_col: str):
            cols = list(df_to_write.columns)
            if key_col not in cols:
                raise ValueError(f"Key column '{key_col}' not found in DataFrame for upsert")
            # Ensure unique index on key
            _ensure_unique_index_on_key(engine, table_name, key_col)

            # Build upsert SQL
            col_list = ', '.join([f'"{c}"' for c in cols])
            update_assignments = ', '.join([f'"{c}"=EXCLUDED."{c}"' for c in cols if c != key_col])
            upsert_sql = (
                f'INSERT INTO "{table_name}" ({col_list}) VALUES %s '
                f'ON CONFLICT ("{key_col}") DO UPDATE SET {update_assignments}'
            )
            # Prepare data tuples
            values = [tuple(df_to_write[c].where(pd.notna(df_to_write[c]), None)) for c in cols]
            # Transpose column-wise list to row-wise tuples
            rows = list(zip(*values))

            raw_conn = engine.raw_connection()
            try:
                cur = raw_conn.cursor()
                try:
                    pg_extras.execute_values(cur, upsert_sql, rows, page_size=1000)
                finally:
                    cur.close()
                raw_conn.commit()
            finally:
                raw_conn.close()

        # For each DB, align columns; if Id/id exists do upsert, else append
        for idx, engine in enumerate((engine1, engine2), start=1):
            target = f"db{idx}"
            try:
                # If table exists, align DataFrame columns to table schema; otherwise create TEXT-only table
                insp = inspect(engine)
                if insp.has_table(table_name):
                    cols = [col['name'] for col in insp.get_columns(table_name)]
                    # Add any missing columns as None and drop extras not in table
                    for c in cols:
                        if c not in df.columns:
                            df[c] = None
                    df_to_write = df[cols]
                else:
                    # Create table with TEXT columns matching current DataFrame
                    _create_text_table(engine, table_name, list(df.columns))
                    df_to_write = df
                # Determine key column for upsert
                key_col = None
                for candidate in ['Id', 'id']:
                    if candidate in df_to_write.columns:
                        key_col = candidate
                        break
                if key_col:
                    # Filter out rows with missing/empty key (only for upsert)
                    key_series = df_to_write[key_col].astype(str).str.strip()
                    valid_mask = key_series.notna() & key_series.ne("")
                    missing_count = int((~valid_mask).sum())
                    if missing_count > 0:
                        results[target] = results.get(target, {})
                        results[target]["missing_id_rows"] = missing_count
                    df_to_write = df_to_write[valid_mask]
                    if not df_to_write.empty:
                        _batch_upsert(engine, table_name, df_to_write, key_col)
                        op_status = "upserted"
                    else:
                        results[target] = {
                            "status": "skipped",
                            "reason": "all_rows_missing_id",
                            "rows_processed": 0,
                            "missing_id_rows": missing_count
                        }
                        continue
                else:
                    # No key present: fall back to append
                    df_to_write.to_sql(table_name, engine, if_exists='append', index=False, method='multi', chunksize=1000)
                    op_status = "inserted"

                # Post-operation verification: count rows in table
                with engine.connect() as conn:
                    after = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
                    count_rows = int(after.scalar())
                base = results.get(target, {})
                base.update({
                    "status": op_status,
                    "rows_processed": len(df_to_write),
                    "table_row_count": count_rows,
                    "key": key_col if key_col else None,
                })
                results[target] = base
            except Exception as e:
                logger.error(f"Error uploading to {target}: {e}")
                results[target] = {"status": "error", "error": str(e)}
        return {"status": "completed", "details": results}
    except Exception as e:
        logger.error(f"Unexpected error during Postgres upload: {e}")
        return {"status": "error", "error": str(e)}

def process_lead_row(row_data):
    """Process and clean a single lead record"""
    processed = {}
    
    # Standardize state
    if 'State' in row_data:
        processed['state'] = standardize_state_name(row_data['State'])
    
    # Clean phone numbers (consider common field variations)
    for field in ['Phone', 'Mobile', 'ContactNumber', 'CrmDataMobile', 'CrmDataPhone']:
        if field in row_data:
            processed['phone'] = clean_phone_number(row_data[field])
            if processed['phone']:
                break
    
    # Copy all other fields
    for key, value in row_data.items():
        if pd.notna(value) and str(value).strip() not in ['', 'NULL', 'null', 'None']:
            # Convert numpy types to Python native types for JSON serialization
            if hasattr(value, 'item'):
                value = value.item()
            processed[key] = value
    
    return processed

def save_to_database(records, upload_id):
    """Save processed records to the database"""
    try:
        for record in records:
            lead_record = LeadRecord(
                upload_id=upload_id,
                data=record,
                status=record.get('_row_status', 'pending'),
                error_message=record.get('_error')
            )
            db.session.add(lead_record)
        
        # Update upload status
        upload = Upload.query.get(upload_id)
        if upload:
            upload.status = 'completed'
            upload.processed_at = datetime.utcnow()
        
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving to database: {str(e)}")
        return False

def process_uploaded_file(filepath, file_type, user_id, upload_id):
    """
    Process the uploaded file and save to database.
    
    Args:
        filepath (str): Path to the uploaded file
        file_type (str): Type of the file (csv, xlsx, etc.)
        user_id (int): ID of the user who uploaded the file
        upload_id (int): ID of the upload record
        
    Returns:
        dict: Dictionary containing processing results and statistics
    """
    # Get the upload record
    upload = Upload.query.get(upload_id)
    if not upload:
        return {
            'status': 'error',
            'message': 'Upload record not found',
            'details': 'Could not find the upload record in the database.'
        }
    stats = {
        'total': 0,
        'processed': 0,
        'success': 0,
        'failed': 0,
        'errors': []
    }
    
    try:
        # Read the file based on its type
        try:
            if filepath.lower().endswith('.csv'):
                df = pd.read_csv(filepath, dtype=str, keep_default_na=False)
            else:  # Excel file
                df = pd.read_excel(filepath, dtype=str)
        except Exception as e:
            error_msg = f"Error reading file: {str(e)}"
            stats['errors'].append(error_msg)
            logger.error(error_msg)
            return {
                'status': 'error',
                'message': 'Error reading file',
                'details': str(e),
                'stats': stats
            }
        
        # Basic validation
        if df.empty:
            error_msg = 'The uploaded file is empty'
            stats['errors'].append(error_msg)
            return {
                'status': 'error',
                'message': error_msg,
                'stats': stats
            }
        
        stats['total'] = len(df)
        processed_data = []
        
        # Update status to 'transforming' with timestamp
        upload.status = 'transforming'
        upload.transform_time = datetime.utcnow()
        db.session.commit()
        
        # Process each row in the DataFrame
        processed_data = []
        for index, row in df.iterrows():
            try:
                # Convert row to dict for easier handling
                row_data = row.to_dict()
                
                try:
                    # Process and clean the row data
                    processed_row = process_lead_row(row_data)
                    
                    # Add metadata
                    processed_row['_processed_at'] = datetime.utcnow().isoformat()
                    processed_row['_row_status'] = 'success'
                    
                except Exception as e:
                    # If processing fails, mark as failed and include error
                    processed_row = row_data
                    processed_row['_error'] = str(e)
                    processed_row['_row_status'] = 'failed'
                    raise  # Re-raise to be caught by the outer exception handler
                
                processed_data.append(processed_row)
                stats['success'] += 1
                
            except Exception as e:
                stats['failed'] += 1
                error_msg = f"Row {index + 2}: {str(e)}"  # +2 for 1-based index and header row
                stats['errors'].append(error_msg)
                logger.error(error_msg)
                
                # Add failed row with error info
                failed_row = row.to_dict()
                failed_row['_error'] = str(e)
                failed_row['_row_status'] = 'failed'
                processed_data.append(failed_row)
                
            finally:
                stats['processed'] = index + 1
        
        # Update status to 'transformed' after processing all rows
        upload.status = 'transformed'
        upload.update_time = datetime.utcnow()
        db.session.commit()
        
        # Save processed data to database
        save_success = False
        if processed_data:
            save_success = save_to_database(processed_data, upload_id)
            if save_success:
                # Update status to 'completed' after successful database update
                upload.update_status('completed')
        
        # Prepare response
        success_status = 'success' if save_success and stats['failed'] == 0 else 'partial_success'
        response = {
            'status': success_status,
            'file_info': {
                'filename': os.path.basename(filepath),
                'size': os.path.getsize(filepath),
                'processed_at': upload.processed_at.isoformat() if upload.processed_at else None,
                'stats': stats,
                'sample_data': processed_data[:5] if processed_data else []
            },
            'message': 'File processed successfully' if save_success and stats['failed'] == 0 else 'File processed with some errors',
            'upload_id': upload.id
        }
        
        # Upload cleaned data to the specified PostgreSQL databases
        try:
            expected_count = stats.get('total', len(processed_data))
            pg_result = upload_cleaned_to_postgres(processed_data, expected_count)
            response['postgres_upload'] = pg_result
        except Exception as e:
            logger.error(f"Error during Postgres upload: {e}")
            response['postgres_upload'] = {"status": "error", "error": str(e)}
        
        return response
        
    except Exception as e:
        error_msg = f"Error processing file: {str(e)}"
        logger.error(error_msg, exc_info=True)
        stats['errors'].append(error_msg)
        
        # Update upload status to failed
        if 'upload' in locals() and upload:
            upload.error_message = str(e)
            upload.update_status('failed')
            db.session.commit()
            
        return {
            'status': 'error',
            'message': 'Error processing file',
            'details': str(e),
            'stats': stats,
            'upload_id': upload.id if 'upload' in locals() and upload else None
        }

@app.route('/api/upload/<int:upload_id>', methods=['GET'])
@login_required
def get_upload_details(upload_id):
    """Get details of a specific upload"""
    logger.info(f"[DEBUG] ===== Starting get_upload_details for ID: {upload_id} =====")
    
    try:
        logger.info(f"[DEBUG] Current user: ID={current_user.id}, Email={current_user.email}, is_admin={current_user.is_admin}")
        
        # Get the upload record with error handling
        try:
            logger.info("[DEBUG] Querying database for upload record...")
            upload = Upload.query.get(upload_id)
            logger.info(f"[DEBUG] Query result: {upload}")
            
            if not upload:
                logger.warning(f"[WARN] Upload with ID {upload_id} not found in database")
                return jsonify({
                    'status': 'error',
                    'message': 'Upload not found',
                    'details': f'No upload found with ID {upload_id}'
                }), 404
                
            logger.info(f"[DEBUG] Upload found - ID: {upload.id}, Filename: {upload.filename}, Status: {upload.status}")
            
        except Exception as e:
            logger.error(f"[ERROR] Database query failed: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': 'Database error',
                'details': 'Error retrieving upload information',
                'error': str(e),
                'error_type': type(e).__name__
            }), 500
        
        # Verify the current user has access to this upload
        try:
            logger.info(f"[DEBUG] Verifying access - Upload User ID: {upload.user_id}, Current User ID: {current_user.id}")
            if upload.user_id != current_user.id and not current_user.is_admin:
                logger.warning(f"[AUTH] Unauthorized access attempt to upload {upload_id} by user {current_user.id}")
                return jsonify({
                    'status': 'forbidden',
                    'message': 'Unauthorized',
                    'details': 'You do not have permission to access this upload'
                }), 403
        except Exception as e:
            logger.error(f"[ERROR] Error in authorization check: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': 'Authorization error',
                'details': 'Error verifying permissions',
                'error': str(e),
                'error_type': type(e).__name__
            }), 500
        
        # Count records for this upload
        try:
            logger.info("[DEBUG] Counting records...")
            records_processed = LeadRecord.query.filter_by(upload_id=upload.id).count()
            records_failed = LeadRecord.query.filter_by(upload_id=upload.id, status='failed').count()
            logger.info(f"[DEBUG] Record counts - Processed: {records_processed}, Failed: {records_failed}")
            
        except Exception as e:
            logger.error(f"[ERROR] Error counting records: {str(e)}", exc_info=True)
            records_processed = 0
            records_failed = 0
            logger.warning("[WARN] Using default record counts (0) due to error")
        
        # Prepare response data with error handling for each field
        try:
            logger.info("[DEBUG] Preparing response data...")
            response_data = {
                'id': upload.id,
                'filename': getattr(upload, 'filename', 'Unknown'),
                'file_type': getattr(upload, 'file_type', None),
                'status': getattr(upload, 'status', 'unknown'),
                'records_processed': records_processed,
                'records_failed': records_failed,
                'error_message': getattr(upload, 'error_message', None)
            }
            
            # Add timestamps if they exist
            timestamp_fields = ['upload_time', 'transform_time', 'update_time', 'processed_at']
            for field in timestamp_fields:
                if hasattr(upload, field):
                    try:
                        field_value = getattr(upload, field)
                        if field_value is not None:
                            response_data[field] = field_value.isoformat()
                        else:
                            response_data[field] = None
                    except Exception as e:
                        logger.warning(f"[WARN] Error formatting {field}: {str(e)}")
                        response_data[field] = None
                else:
                    logger.warning(f"[WARN] Field {field} does not exist on upload object")
                    response_data[field] = None
            
            logger.info(f"[DEBUG] Response data prepared: {response_data}")
            return jsonify(response_data)
            
        except Exception as e:
            logger.error(f"[ERROR] Error in response preparation: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': 'Response error',
                'details': 'Error preparing response data',
                'error': str(e),
                'error_type': type(e).__name__
            }), 500
            
    except Exception as e:
        logger.critical(f"[CRITICAL] Unhandled exception in get_upload_details: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'details': 'An unexpected error occurred',
            'error': str(e),
            'error_type': type(e).__name__
        }), 500

# Connection test endpoint
@app.route('/api/test_db_connections', methods=['GET'])
@login_required
def test_db_connections():
    """Test connection and table counts for both Postgres DBs without uploading data."""
    table_name = "marzi_zoho_data_cleaned"
    results = {}
    try:
        # Build engines identical to upload logic
        url1, conn_args1 = _build_pg_url(
            host="dev.framasaasai.com",
            username="postgres",
            password=".Qx#(~[(_cQLuA6+",
            database="marzi-life",
        )
        url2, conn_args2 = _build_pg_url(
            host="marzi-database-prod.cdk0iqyk2cg4.ap-south-1.rds.amazonaws.com",
            username="postgres",
            password="m0YzMjjpiXVh49J2xDVs",
            database="postgres",
        )
        engine1 = create_engine(url1, pool_pre_ping=True, connect_args=conn_args1)
        engine2 = create_engine(url2, pool_pre_ping=True, connect_args=conn_args2)

        engines = [
            ("db1", engine1, "dev.framasaasai.com", "marzi-life"),
            ("db2", engine2, "marzi-database-prod.cdk0iqyk2cg4.ap-south-1.rds.amazonaws.com", "postgres"),
        ]

        for key, engine, host, dbname in engines:
            try:
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                insp = inspect(engine)
                table_exists = insp.has_table(table_name)
                count = None
                columns = None
                if table_exists:
                    with engine.connect() as conn:
                        r = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
                        count = int(r.scalar())
                    columns = [col['name'] for col in insp.get_columns(table_name)]
                results[key] = {
                    "connection": "ok",
                    "host": host,
                    "database": dbname,
                    "table": table_name,
                    "table_exists": table_exists,
                    "count": count,
                    "columns": columns,
                }
            except Exception as e:
                results[key] = {
                    "connection": "failed",
                    "host": host,
                    "database": dbname,
                    "error": str(e),
                }
        return jsonify({"status": "ok", "details": results})
    except Exception as e:
        logger.error(f"/api/test_db_connections failed: {e}")
        return jsonify({"status": "error", "error": str(e), "details": results}), 500

# One-time replication endpoint: copy DB2 table into DB1, replacing DB1 table
@app.route('/api/replicate_db2_to_db1', methods=['POST'])
@login_required
def replicate_db2_to_db1():
    table_name = "marzi_zoho_data_cleaned"
    try:
        url1, conn_args1 = _build_pg_url(
            host="dev.framasaasai.com",
            username="postgres",
            password=".Qx#(~[(_cQLuA6+",
            database="marzi-life",
        )
        url2, conn_args2 = _build_pg_url(
            host="marzi-database-prod.cdk0iqyk2cg4.ap-south-1.rds.amazonaws.com",
            username="postgres",
            password="m0YzMjjpiXVh49J2xDVs",
            database="postgres",
        )
        engine1 = create_engine(url1, pool_pre_ping=True, connect_args=conn_args1)
        engine2 = create_engine(url2, pool_pre_ping=True, connect_args=conn_args2)

        # Read all from DB2
        with engine2.connect() as conn2:
            df2 = pd.read_sql_query(text(f'SELECT * FROM "{table_name}"'), conn2)
        # Replace DB1 table with DB2 data
        df2.to_sql(table_name, engine1, if_exists='replace', index=False, method='multi', chunksize=1000)

        # Verify
        with engine1.connect() as conn1:
            cnt = conn1.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
            cols = [c['name'] for c in inspect(engine1).get_columns(table_name)]
        return jsonify({
            "status": "success",
            "rows": int(cnt),
            "columns": cols[:50],
            "message": "DB2 table replicated into DB1 (replaced)"
        })
    except Exception as e:
        logger.error(f"replicate_db2_to_db1 failed: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# Test endpoints for debugging
@app.route('/api/upload_test/start', methods=['POST'])
@login_required
def test_upload_start():
    """Test endpoint to create an upload record"""
    try:
        # Create a test upload record
        upload = Upload(
            filename='test_upload.csv',
            file_type='marzi_zoho_lead',
            status='uploaded',
            upload_time=datetime.utcnow(),
            user_id=current_user.id
        )
        db.session.add(upload)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Test upload record created',
            'upload_id': upload.id,
            'upload_time': upload.upload_time.isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/upload_test/transform/<int:upload_id>', methods=['POST'])
@login_required
def test_upload_transform(upload_id):
    """Test endpoint to simulate transformation"""
    try:
        upload = Upload.query.get_or_404(upload_id)
        
        # Update status to transforming
        upload.status = 'transforming'
        upload.transform_time = datetime.utcnow()
        db.session.commit()
        
        # Simulate transformation work
        time.sleep(2)  # Simulate processing time
        
        # Update status to transformed
        upload.status = 'transformed'
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Transformation test completed',
            'upload_id': upload.id,
            'transform_time': upload.transform_time.isoformat(),
            'current_status': upload.status
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/upload_test/update/<int:upload_id>', methods=['POST'])
@login_required
def test_upload_update(upload_id):
    """Test endpoint to simulate database update"""
    try:
        upload = Upload.query.get_or_404(upload_id)
        
        # Update status to updating
        upload.status = 'updating'
        upload.update_time = datetime.utcnow()
        db.session.commit()
        
        # Simulate database update work
        time.sleep(2)  # Simulate processing time
        
        # Update status to completed
        upload.status = 'completed'
        upload.processed_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Update test completed',
            'upload_id': upload.id,
            'update_time': upload.update_time.isoformat(),
            'processed_at': upload.processed_at.isoformat(),
            'final_status': upload.status
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Initialize database
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
    # Set maximum file size to 1GB
    app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024  # 1GB in bytes
    
    # Run without SSL for now
    app.run(
        debug=True,
        host='0.0.0.0',
        port=8081,
        threaded=True
    )
