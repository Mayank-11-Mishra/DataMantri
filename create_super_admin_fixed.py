#!/usr/bin/env python3
"""
Fixed Super Admin Creation Script
This script creates a super admin user compatible with the UUID-based schema
"""
import os
import sys
import uuid
from datetime import datetime

# Add the project root to Python path
sys.path.append('/Users/sunny.agarwal/Projects/DataViz-main')

from werkzeug.security import generate_password_hash
import psycopg2
from psycopg2.extras import RealDictCursor

def create_super_admin():
    """Create a super admin user with proper UUID handling"""
    
    # Database connection parameters
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'user': 'sunny.agarwal',
        'password': 'postgres',
        'database': 'dataviz'
    }
    
    # Super admin credentials
    admin_email = 'sunnyagarwal0801@gmail.com'
    admin_password = 'DataMantri@2024'
    
    try:
        # Connect to database
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("Connected to database successfully")
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"User {admin_email} already exists. Updating password and admin status...")
            
            # Update existing user
            password_hash = generate_password_hash(admin_password, method='pbkdf2:sha256')
            cursor.execute("""
                UPDATE users SET 
                    password_hash = %s,
                    is_admin = %s,
                    is_active = %s,
                    updated_at = %s
                WHERE email = %s
            """, (password_hash, True, True, datetime.utcnow(), admin_email))
            
            print("Super admin user updated successfully!")
            
        else:
            print(f"Creating new super admin user: {admin_email}")
            
            # Generate UUID for new user
            user_id = str(uuid.uuid4())
            password_hash = generate_password_hash(admin_password, method='pbkdf2:sha256')
            
            # Create new user
            cursor.execute("""
                INSERT INTO users (
                    id, email, password_hash, first_name, last_name, 
                    is_admin, is_active, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, admin_email, password_hash, 'Sunny', 'Agarwal',
                True, True, datetime.utcnow(), datetime.utcnow()
            ))
            
            print("Super admin user created successfully!")
        
        # Commit changes
        conn.commit()
        
        # Verify the user was created/updated
        cursor.execute("""
            SELECT id, email, is_admin, is_active, created_at 
            FROM users WHERE email = %s
        """, (admin_email,))
        user = cursor.fetchone()
        
        if user:
            print("\n" + "="*50)
            print("SUPER ADMIN LOGIN CREDENTIALS")
            print("="*50)
            print(f"Email: {admin_email}")
            print(f"Password: {admin_password}")
            print(f"User ID: {user['id']}")
            print(f"Admin Status: {user['is_admin']}")
            print(f"Active Status: {user['is_active']}")
            print("="*50)
            print("\nLogin URL: http://localhost:8080/login")
            print("API Login URL: http://localhost:5000/api/auth/login")
        else:
            print("ERROR: Could not verify user creation")
            
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("Database connection closed")

if __name__ == '__main__':
    create_super_admin()
