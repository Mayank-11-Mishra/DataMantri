#!/usr/bin/env python3
"""
DataViz Platform - Database Setup Script
=========================================
This script handles the creation and initialization of the PostgreSQL database
for the DataViz platform. It includes functions for:
- Creating the database
- Running schema migrations
- Seeding initial data
- Verifying the setup
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import argparse
from pathlib import Path
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
    'database': os.getenv('DB_NAME', 'dataviz'),
    'admin_database': os.getenv('DB_ADMIN_DATABASE', 'postgres')
}

def get_connection(use_admin_db=False):
    """Get database connection"""
    config = DB_CONFIG.copy()
    if use_admin_db:
        config['database'] = config['admin_database']
    
    try:
        conn = psycopg2.connect(**{k: v for k, v in config.items() if k != 'admin_database'})
        return conn
    except psycopg2.Error as e:
        logger.error(f"Failed to connect to database: {e}")
        sys.exit(1)

def database_exists():
    """Check if the target database exists"""
    try:
        conn = get_connection(use_admin_db=True)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (DB_CONFIG['database'],)
        )
        exists = cursor.fetchone() is not None
        
        cursor.close()
        conn.close()
        return exists
    except psycopg2.Error as e:
        logger.error(f"Error checking database existence: {e}")
        return False

def create_database():
    """Create the database if it doesn't exist"""
    if database_exists():
        logger.info(f"Database '{DB_CONFIG['database']}' already exists")
        return True
    
    try:
        conn = get_connection(use_admin_db=True)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create database
        cursor.execute(f'CREATE DATABASE "{DB_CONFIG["database"]}"')
        logger.info(f"Database '{DB_CONFIG['database']}' created successfully")
        
        cursor.close()
        conn.close()
        return True
    except psycopg2.Error as e:
        logger.error(f"Failed to create database: {e}")
        return False

def run_sql_file(filepath, use_admin_db=False):
    """Execute SQL commands from a file"""
    if not os.path.exists(filepath):
        logger.error(f"SQL file not found: {filepath}")
        return False
    
    try:
        conn = get_connection(use_admin_db=use_admin_db)
        cursor = conn.cursor()
        
        with open(filepath, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement:
                try:
                    cursor.execute(statement)
                except psycopg2.Error as e:
                    logger.warning(f"Warning executing statement: {e}")
                    # Continue with other statements
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Successfully executed SQL file: {filepath}")
        return True
    except psycopg2.Error as e:
        logger.error(f"Failed to execute SQL file {filepath}: {e}")
        return False

def verify_setup():
    """Verify that the database setup is correct"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if key tables exist
        key_tables = [
            'users', 'roles', 'user_roles', 'data_sources',
            'dashboards', 'visualizations', 'theme_library',
            'chart_library', 'upload_templates', 'scheduler_jobs'
        ]
        
        for table in key_tables:
            cursor.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = %s)",
                (table,)
            )
            exists = cursor.fetchone()[0]
            if not exists:
                logger.error(f"Table '{table}' not found")
                return False
            logger.info(f"✓ Table '{table}' exists")
        
        # Check if default data exists
        cursor.execute("SELECT COUNT(*) FROM roles WHERE is_system_role = true")
        role_count = cursor.fetchone()[0]
        if role_count == 0:
            logger.error("No system roles found")
            return False
        logger.info(f"✓ Found {role_count} system roles")
        
        cursor.execute("SELECT COUNT(*) FROM theme_library WHERE is_default = true")
        theme_count = cursor.fetchone()[0]
        if theme_count == 0:
            logger.error("No default theme found")
            return False
        logger.info(f"✓ Found {theme_count} default theme(s)")
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE is_admin = true")
        admin_count = cursor.fetchone()[0]
        if admin_count == 0:
            logger.error("No admin users found")
            return False
        logger.info(f"✓ Found {admin_count} admin user(s)")
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Database setup verification completed successfully")
        return True
    except psycopg2.Error as e:
        logger.error(f"Database verification failed: {e}")
        return False

def reset_database():
    """Drop and recreate the database (WARNING: This will delete all data!)"""
    logger.warning("⚠️  This will completely reset the database and delete all data!")
    confirmation = input("Type 'RESET' to confirm: ")
    
    if confirmation != 'RESET':
        logger.info("Database reset cancelled")
        return False
    
    try:
        conn = get_connection(use_admin_db=True)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Terminate existing connections to the database
        cursor.execute(f"""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '{DB_CONFIG['database']}' AND pid <> pg_backend_pid()
        """)
        
        # Drop database if exists
        cursor.execute(f'DROP DATABASE IF EXISTS "{DB_CONFIG["database"]}"')
        logger.info(f"Database '{DB_CONFIG['database']}' dropped")
        
        cursor.close()
        conn.close()
        
        # Recreate database
        return create_database()
    except psycopg2.Error as e:
        logger.error(f"Failed to reset database: {e}")
        return False

def main():
    """Main function to handle command line arguments and execute setup"""
    parser = argparse.ArgumentParser(description='DataViz Database Setup')
    parser.add_argument('--create', action='store_true', help='Create database only')
    parser.add_argument('--schema', action='store_true', help='Run schema migration only')
    parser.add_argument('--seed', action='store_true', help='Seed initial data only')
    parser.add_argument('--verify', action='store_true', help='Verify setup only')
    parser.add_argument('--reset', action='store_true', help='Reset database (WARNING: Deletes all data)')
    parser.add_argument('--full', action='store_true', help='Full setup (create + schema + seed)')
    
    args = parser.parse_args()
    
    # Get script directory
    script_dir = Path(__file__).parent
    schema_file = script_dir / 'schema.sql'
    seed_file = script_dir / 'init_data.sql'
    
    success = True
    
    if args.reset:
        success = reset_database()
        if not success:
            sys.exit(1)
    
    if args.create or args.full:
        logger.info("Creating database...")
        success = create_database()
        if not success:
            sys.exit(1)
    
    if args.schema or args.full:
        logger.info("Running schema migration...")
        success = run_sql_file(schema_file)
        if not success:
            sys.exit(1)
    
    if args.seed or args.full:
        logger.info("Seeding initial data...")
        success = run_sql_file(seed_file)
        if not success:
            sys.exit(1)
    
    if args.verify or args.full:
        logger.info("Verifying setup...")
        success = verify_setup()
        if not success:
            sys.exit(1)
    
    if not any([args.create, args.schema, args.seed, args.verify, args.reset, args.full]):
        parser.print_help()
        return
    
    if success:
        logger.info("🎉 Database setup completed successfully!")
        logger.info(f"Database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
        logger.info("Default admin user: admin@dataviz.com (password: admin123)")
        logger.info("⚠️  Remember to change the default password in production!")

if __name__ == '__main__':
    main()
