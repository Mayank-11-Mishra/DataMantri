#!/usr/bin/env python3
"""
Final Super Admin Creation Script
Creates a super admin user with the correct database schema
"""
import uuid
from datetime import datetime
import hashlib
import base64
import os

def generate_password_hash(password, method='pbkdf2:sha256'):
    """Generate password hash compatible with Werkzeug"""
    if method == 'pbkdf2:sha256':
        import hashlib
        import base64
        import os
        
        salt = os.urandom(16)
        iterations = 260000
        hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
        hash_b64 = base64.b64encode(salt + hash_obj).decode('ascii')
        return f"pbkdf2:sha256:260000${base64.b64encode(salt).decode('ascii')}${base64.b64encode(hash_obj).decode('ascii')}"

def create_super_admin():
    """Create a super admin user with the correct schema"""
    
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
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        # Connect to database
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("Connected to PostgreSQL database successfully")
        
        # Check if user already exists
        cursor.execute("SELECT id, email, role FROM users WHERE email = %s", (admin_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"User {admin_email} already exists. Updating password and role...")
            
            # Update existing user - set role to ADMIN and update password
            password_hash = generate_password_hash(admin_password)
            cursor.execute("""
                UPDATE users SET 
                    password_hash = %s,
                    role = 'ADMIN',
                    is_active = %s,
                    updated_at = %s
                WHERE email = %s
            """, (password_hash, True, datetime.utcnow(), admin_email))
            
            print("Super admin user updated successfully!")
            
        else:
            print(f"Creating new super admin user: {admin_email}")
            
            # Generate UUID for new user
            user_id = str(uuid.uuid4())
            password_hash = generate_password_hash(admin_password)
            
            # Create new user with ADMIN role
            cursor.execute("""
                INSERT INTO users (
                    id, email, password_hash, first_name, last_name, 
                    role, is_active, email_verified, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, admin_email, password_hash, 'Sunny', 'Agarwal',
                'ADMIN', True, True, datetime.utcnow(), datetime.utcnow()
            ))
            
            print("Super admin user created successfully!")
        
        # Commit changes
        conn.commit()
        
        # Verify the user was created/updated
        cursor.execute("""
            SELECT id, email, role, is_active, created_at 
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
            print(f"Role: {user['role']}")
            print(f"Active Status: {user['is_active']}")
            print("="*50)
            print("\nLogin URLs:")
            print("Frontend: http://localhost:8080/login")
            print("API: http://localhost:5000/api/auth/login")
            print("="*50)
            return True
        else:
            print("ERROR: Could not verify user creation")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    success = create_super_admin()
    if success:
        print("\n✅ Super admin creation completed successfully!")
        print("\nNext steps:")
        print("1. Start the Flask backend: python3 app.py")
        print("2. Start the React frontend: npm start")
        print("3. Navigate to http://localhost:8080/login")
        print("4. Login with the credentials above")
    else:
        print("\n❌ Super admin creation failed!")
        print("Please check the database connection and try again.")
