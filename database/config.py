"""
DataViz Platform - Database Configuration
=========================================
Database connection and configuration management for the DataViz platform.
Supports multiple database engines with connection pooling and environment-based configuration.
"""

import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv
import logging

# Load environment variables
# Get the project root directory (parent of database folder)
project_root = os.path.dirname(os.path.dirname(__file__))
dotenv_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path=dotenv_path)

# Configure logging
logger = logging.getLogger(__name__)

# Database configuration from environment variables
class DatabaseConfig:
    """Database configuration class with support for multiple engines"""
    
    def __init__(self):
        self.db_type = os.getenv('DB_TYPE', 'postgresql')
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = int(os.getenv('DB_PORT', 5432))
        self.username = os.getenv('DB_USER', 'postgres')
        self.password = os.getenv('DB_PASSWORD', 'postgres')
        self.database = os.getenv('DB_NAME', 'dataviz')
        self.schema = os.getenv('DB_SCHEMA', 'public')
        
        # Connection pool settings
        self.pool_size = int(os.getenv('DB_POOL_SIZE', 10))
        self.max_overflow = int(os.getenv('DB_MAX_OVERFLOW', 20))
        self.pool_timeout = int(os.getenv('DB_POOL_TIMEOUT', 30))
        self.pool_recycle = int(os.getenv('DB_POOL_RECYCLE', 3600))
        
        # SSL settings
        self.ssl_mode = os.getenv('DB_SSL_MODE', 'prefer')
        self.ssl_cert = os.getenv('DB_SSL_CERT')
        self.ssl_key = os.getenv('DB_SSL_KEY')
        self.ssl_ca = os.getenv('DB_SSL_CA')
        
        # Query settings
        self.query_timeout = int(os.getenv('DB_QUERY_TIMEOUT', 300))
        self.echo_sql = os.getenv('DB_ECHO_SQL', 'false').lower() == 'true'
        
    def get_database_url(self):
        """Generate database URL based on configuration"""
        if self.db_type == 'postgresql':
            return self._get_postgresql_url()
        elif self.db_type == 'mysql':
            return self._get_mysql_url()
        elif self.db_type == 'sqlite':
            return self._get_sqlite_url()
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")
    
    def _get_postgresql_url(self):
        """Generate PostgreSQL connection URL"""
        password_encoded = quote_plus(self.password)
        url = f"postgresql://{self.username}:{password_encoded}@{self.host}:{self.port}/{self.database}"
        
        # Add SSL parameters if configured
        params = []
        params.append('gssencmode=disable')

        if self.ssl_mode:
            params.append(f"sslmode={self.ssl_mode}")
        if self.ssl_cert:
            params.append(f"sslcert={self.ssl_cert}")
        if self.ssl_key:
            params.append(f"sslkey={self.ssl_key}")
        if self.ssl_ca:
            params.append(f"sslrootcert={self.ssl_ca}")
        
        if params:
            url += "?" + "&".join(params)
        
        return url
    
    def _get_mysql_url(self):
        """Generate MySQL connection URL"""
        password_encoded = quote_plus(self.password)
        return f"mysql+pymysql://{self.username}:{password_encoded}@{self.host}:{self.port}/{self.database}"
    
    def _get_sqlite_url(self):
        """Generate SQLite connection URL"""
        db_path = os.getenv('SQLITE_PATH', 'instance/dataviz.db')
        # Ensure the directory exists
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
        return f"sqlite:///{db_path}"
    
    def get_engine_kwargs(self):
        """Get SQLAlchemy engine configuration"""
        kwargs = {
            'echo': self.echo_sql,
            'pool_pre_ping': True,  # Verify connections before use
        }
        
        # Add connection pooling for non-SQLite databases
        if self.db_type != 'sqlite':
            kwargs.update({
                'poolclass': QueuePool,
                'pool_size': self.pool_size,
                'max_overflow': self.max_overflow,
                'pool_timeout': self.pool_timeout,
                'pool_recycle': self.pool_recycle,
            })
        
        return kwargs

# Global configuration instance
config = DatabaseConfig()

# Create database engine
def create_database_engine():
    """Create and configure database engine"""
    database_url = config.get_database_url()
    engine_kwargs = config.get_engine_kwargs()
    
    engine = create_engine(database_url, **engine_kwargs)
    
    # Add event listeners for connection management
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        """Set SQLite pragmas for better performance and integrity"""
        if config.db_type == 'sqlite':
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=10000")
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.close()
    
    @event.listens_for(engine, "connect")
    def set_postgresql_search_path(dbapi_connection, connection_record):
        """Set PostgreSQL search path"""
        if config.db_type == 'postgresql' and config.schema != 'public':
            cursor = dbapi_connection.cursor()
            cursor.execute(f"SET search_path TO {config.schema}, public")
            cursor.close()
    
    return engine

# Create engine and session factory
engine = create_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Database connection utilities
def get_db_session():
    """Get database session with automatic cleanup"""
    session = SessionLocal()
    try:
        yield session
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()

def get_db_connection():
    """Get raw database connection"""
    return engine.connect()

def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as conn:
            if config.db_type == 'postgresql':
                result = conn.execute("SELECT version()")
            elif config.db_type == 'mysql':
                result = conn.execute("SELECT VERSION()")
            elif config.db_type == 'sqlite':
                result = conn.execute("SELECT sqlite_version()")
            
            version = result.fetchone()[0]
            logger.info(f"Database connection successful. Version: {version}")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

# Connection string for external tools
def get_connection_string():
    """Get connection string for external tools (psql, mysql, etc.)"""
    if config.db_type == 'postgresql':
        return f"postgresql://{config.username}:{config.password}@{config.host}:{config.port}/{config.database}"
    elif config.db_type == 'mysql':
        return f"mysql://{config.username}:{config.password}@{config.host}:{config.port}/{config.database}"
    elif config.db_type == 'sqlite':
        return f"sqlite:///{os.getenv('SQLITE_PATH', 'dataviz.db')}"

# Database health check
def health_check():
    """Perform comprehensive database health check"""
    try:
        with engine.connect() as conn:
            # Test basic connectivity
            conn.execute("SELECT 1")
            
            # Check if key tables exist
            if config.db_type == 'postgresql':
                result = conn.execute("""
                    SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name IN 
                    ('users', 'roles', 'dashboards', 'data_sources')
                """)
            elif config.db_type == 'mysql':
                result = conn.execute("""
                    SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = DATABASE() AND table_name IN 
                    ('users', 'roles', 'dashboards', 'data_sources')
                """)
            elif config.db_type == 'sqlite':
                result = conn.execute("""
                    SELECT COUNT(*) FROM sqlite_master 
                    WHERE type='table' AND name IN 
                    ('users', 'roles', 'dashboards', 'data_sources')
                """)
            
            table_count = result.fetchone()[0]
            
            return {
                'status': 'healthy',
                'database_type': config.db_type,
                'host': config.host,
                'port': config.port,
                'database': config.database,
                'tables_found': table_count,
                'pool_size': engine.pool.size() if hasattr(engine.pool, 'size') else 'N/A',
                'checked_out_connections': engine.pool.checkedout() if hasattr(engine.pool, 'checkedout') else 'N/A'
            }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'database_type': config.db_type,
            'host': config.host,
            'port': config.port,
            'database': config.database
        }

# Export commonly used objects
__all__ = [
    'engine',
    'SessionLocal', 
    'Base',
    'config',
    'get_db_session',
    'get_db_connection',
    'test_connection',
    'get_connection_string',
    'health_check'
]
