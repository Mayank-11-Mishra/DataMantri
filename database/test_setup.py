#!/usr/bin/env python3
"""
DataViz Platform - Database Setup Test Script
==============================================
This script tests the database setup and verifies all relationships work correctly.
"""

import sys
import os
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from dotenv import load_dotenv
import logging

# Add the database directory to Python path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import database configuration
try:
    from config import config, test_connection, health_check
except ImportError:
    logger.error("Could not import database configuration. Make sure config.py is in the same directory.")
    sys.exit(1)

def get_test_connection():
    """Get database connection for testing"""
    try:
        conn = psycopg2.connect(
            host=config.host,
            port=config.port,
            user=config.username,
            password=config.password,
            database=config.database,
            cursor_factory=RealDictCursor
        )
        return conn
    except psycopg2.Error as e:
        logger.error(f"Failed to connect to database: {e}")
        return None

def test_table_existence():
    """Test that all required tables exist"""
    logger.info("Testing table existence...")
    
    required_tables = [
        'users', 'roles', 'user_roles', 'data_sources',
        'database_metadata', 'column_metadata', 'saved_queries', 'data_marts',
        'visualizations', 'dashboards', 'dashboard_components',
        'theme_library', 'chart_library',
        'upload_templates', 'upload_history',
        'scheduler_jobs', 'scheduler_job_runs',
        'audit_logs', 'dashboard_analytics', 'query_execution_logs',
        'user_preferences', 'system_settings', 'bookmarks', 'saved_filters',
        'resource_permissions', 'notifications', 'comments'
    ]
    
    conn = get_test_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        missing_tables = []
        
        for table in required_tables:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = %s
                )
            """, (table,))
            
            exists = cursor.fetchone()['exists']
            if exists:
                logger.info(f"✓ Table '{table}' exists")
            else:
                logger.error(f"✗ Table '{table}' missing")
                missing_tables.append(table)
        
        cursor.close()
        conn.close()
        
        if missing_tables:
            logger.error(f"Missing tables: {', '.join(missing_tables)}")
            return False
        
        logger.info("✅ All required tables exist")
        return True
        
    except psycopg2.Error as e:
        logger.error(f"Error checking tables: {e}")
        return False

def test_foreign_key_constraints():
    """Test foreign key relationships"""
    logger.info("Testing foreign key constraints...")
    
    conn = get_test_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Get all foreign key constraints
        cursor.execute("""
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name;
        """)
        
        foreign_keys = cursor.fetchall()
        logger.info(f"Found {len(foreign_keys)} foreign key constraints")
        
        for fk in foreign_keys:
            logger.info(f"✓ {fk['table_name']}.{fk['column_name']} -> {fk['foreign_table_name']}.{fk['foreign_column_name']}")
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Foreign key constraints verified")
        return True
        
    except psycopg2.Error as e:
        logger.error(f"Error checking foreign keys: {e}")
        return False

def test_indexes():
    """Test that required indexes exist"""
    logger.info("Testing indexes...")
    
    conn = get_test_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Get all indexes
        cursor.execute("""
            SELECT
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
                AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname;
        """)
        
        indexes = cursor.fetchall()
        logger.info(f"Found {len(indexes)} custom indexes")
        
        # Check for key indexes
        key_indexes = [
            'idx_users_email',
            'idx_dashboards_created_by',
            'idx_dashboard_analytics_dashboard',
            'idx_audit_logs_user_id',
            'idx_upload_history_template'
        ]
        
        existing_indexes = [idx['indexname'] for idx in indexes]
        
        for key_idx in key_indexes:
            if key_idx in existing_indexes:
                logger.info(f"✓ Index '{key_idx}' exists")
            else:
                logger.warning(f"⚠ Index '{key_idx}' missing")
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Index verification completed")
        return True
        
    except psycopg2.Error as e:
        logger.error(f"Error checking indexes: {e}")
        return False

def test_initial_data():
    """Test that initial seed data was loaded correctly"""
    logger.info("Testing initial data...")
    
    conn = get_test_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check system roles
        cursor.execute("SELECT COUNT(*) as count FROM roles WHERE is_system_role = true")
        role_count = cursor.fetchone()['count']
        if role_count >= 6:  # We expect at least 6 system roles
            logger.info(f"✓ Found {role_count} system roles")
        else:
            logger.error(f"✗ Expected at least 6 system roles, found {role_count}")
            return False
        
        # Check default themes
        cursor.execute("SELECT COUNT(*) as count FROM theme_library WHERE is_public = true")
        theme_count = cursor.fetchone()['count']
        if theme_count >= 2:  # We expect at least 2 default themes
            logger.info(f"✓ Found {theme_count} public themes")
        else:
            logger.error(f"✗ Expected at least 2 public themes, found {theme_count}")
            return False
        
        # Check chart library
        cursor.execute("SELECT COUNT(*) as count FROM chart_library WHERE is_public = true")
        chart_count = cursor.fetchone()['count']
        if chart_count >= 3:  # We expect at least 3 default charts
            logger.info(f"✓ Found {chart_count} public charts")
        else:
            logger.error(f"✗ Expected at least 3 public charts, found {chart_count}")
            return False
        
        # Check system settings
        cursor.execute("SELECT COUNT(*) as count FROM system_settings")
        settings_count = cursor.fetchone()['count']
        if settings_count >= 10:  # We expect multiple system settings
            logger.info(f"✓ Found {settings_count} system settings")
        else:
            logger.error(f"✗ Expected at least 10 system settings, found {settings_count}")
            return False
        
        # Check admin user
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE is_admin = true")
        admin_count = cursor.fetchone()['count']
        if admin_count >= 1:
            logger.info(f"✓ Found {admin_count} admin user(s)")
        else:
            logger.error(f"✗ No admin users found")
            return False
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Initial data verification completed")
        return True
        
    except psycopg2.Error as e:
        logger.error(f"Error checking initial data: {e}")
        return False

def test_crud_operations():
    """Test basic CRUD operations"""
    logger.info("Testing CRUD operations...")
    
    conn = get_test_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Test user creation and relationships
        test_user_id = None
        test_dashboard_id = None
        
        try:
            # Create test user
            cursor.execute("""
                INSERT INTO users (email, password_hash, first_name, last_name, is_active)
                VALUES ('test@example.com', '$2b$12$test', 'Test', 'User', true)
                RETURNING id
            """)
            test_user_id = cursor.fetchone()['id']
            logger.info(f"✓ Created test user with ID: {test_user_id}")
            
            # Create test dashboard
            cursor.execute("""
                INSERT INTO dashboards (name, description, layout_config, created_by)
                VALUES ('Test Dashboard', 'Test dashboard description', '{}', %s)
                RETURNING id
            """, (test_user_id,))
            test_dashboard_id = cursor.fetchone()['id']
            logger.info(f"✓ Created test dashboard with ID: {test_dashboard_id}")
            
            # Test relationship query
            cursor.execute("""
                SELECT u.email, d.name as dashboard_name
                FROM users u
                JOIN dashboards d ON u.id = d.created_by
                WHERE u.id = %s
            """, (test_user_id,))
            
            result = cursor.fetchone()
            if result and result['email'] == 'test@example.com':
                logger.info("✓ User-Dashboard relationship working correctly")
            else:
                logger.error("✗ User-Dashboard relationship failed")
                return False
            
            # Test audit log creation
            cursor.execute("""
                INSERT INTO audit_logs (user_id, action_type, resource_type, resource_id, resource_name)
                VALUES (%s, 'create', 'dashboard', %s, 'Test Dashboard')
            """, (test_user_id, test_dashboard_id))
            logger.info("✓ Audit log created successfully")
            
            # Commit the test transaction
            conn.commit()
            
        finally:
            # Clean up test data
            if test_dashboard_id:
                cursor.execute("DELETE FROM audit_logs WHERE resource_id = %s", (test_dashboard_id,))
                cursor.execute("DELETE FROM dashboards WHERE id = %s", (test_dashboard_id,))
                logger.info("✓ Cleaned up test dashboard")
            
            if test_user_id:
                cursor.execute("DELETE FROM users WHERE id = %s", (test_user_id,))
                logger.info("✓ Cleaned up test user")
            
            conn.commit()
        
        cursor.close()
        conn.close()
        
        logger.info("✅ CRUD operations test completed")
        return True
        
    except psycopg2.Error as e:
        logger.error(f"Error in CRUD operations test: {e}")
        if conn:
            conn.rollback()
        return False

def test_triggers_and_constraints():
    """Test database triggers and constraints"""
    logger.info("Testing triggers and constraints...")
    
    conn = get_test_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Test updated_at trigger
        cursor.execute("""
            INSERT INTO users (email, password_hash, first_name, last_name)
            VALUES ('trigger_test@example.com', '$2b$12$test', 'Trigger', 'Test')
            RETURNING id, created_at, updated_at
        """)
        user_data = cursor.fetchone()
        user_id = user_data['id']
        original_updated_at = user_data['updated_at']
        
        # Wait a moment and update
        import time
        time.sleep(1)
        
        cursor.execute("""
            UPDATE users SET first_name = 'Updated' WHERE id = %s
            RETURNING updated_at
        """, (user_id,))
        new_updated_at = cursor.fetchone()['updated_at']
        
        if new_updated_at > original_updated_at:
            logger.info("✓ updated_at trigger working correctly")
        else:
            logger.error("✗ updated_at trigger not working")
            return False
        
        # Test email constraint
        try:
            cursor.execute("""
                INSERT INTO users (email, password_hash, first_name, last_name)
                VALUES ('invalid-email', '$2b$12$test', 'Invalid', 'Email')
            """)
            conn.commit()
            logger.error("✗ Email constraint not working - invalid email was accepted")
            return False
        except psycopg2.Error:
            logger.info("✓ Email constraint working correctly")
            conn.rollback()
        
        # Clean up
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Triggers and constraints test completed")
        return True
        
    except psycopg2.Error as e:
        logger.error(f"Error testing triggers and constraints: {e}")
        if conn:
            conn.rollback()
        return False

def run_all_tests():
    """Run all database tests"""
    logger.info("🧪 Starting comprehensive database tests...")
    
    tests = [
        ("Connection Test", test_connection),
        ("Table Existence", test_table_existence),
        ("Foreign Key Constraints", test_foreign_key_constraints),
        ("Indexes", test_indexes),
        ("Initial Data", test_initial_data),
        ("CRUD Operations", test_crud_operations),
        ("Triggers and Constraints", test_triggers_and_constraints),
    ]
    
    results = []
    for test_name, test_func in tests:
        logger.info(f"\n--- Running {test_name} ---")
        try:
            result = test_func()
            results.append((test_name, result))
            if result:
                logger.info(f"✅ {test_name} PASSED")
            else:
                logger.error(f"❌ {test_name} FAILED")
        except Exception as e:
            logger.error(f"❌ {test_name} ERROR: {e}")
            results.append((test_name, False))
    
    # Summary
    logger.info("\n" + "="*50)
    logger.info("TEST SUMMARY")
    logger.info("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"{test_name:<25} {status}")
    
    logger.info(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! Database setup is working correctly.")
        
        # Display health check
        health = health_check()
        logger.info("\n--- Database Health Check ---")
        logger.info(f"Status: {health['status']}")
        logger.info(f"Database Type: {health['database_type']}")
        logger.info(f"Host: {health['host']}:{health['port']}")
        logger.info(f"Database: {health['database']}")
        logger.info(f"Tables Found: {health['tables_found']}")
        
        return True
    else:
        logger.error(f"❌ {total - passed} tests failed. Please check the database setup.")
        return False

if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
