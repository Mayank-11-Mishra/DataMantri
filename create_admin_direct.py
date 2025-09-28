#!/usr/bin/env python3
"""
Direct PostgreSQL Super Admin Creation Script
Creates a super admin user by connecting directly to PostgreSQL
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
    """Create a super admin user with direct PostgreSQL connection"""
    
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
        cursor.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"User {admin_email} already exists. Updating password and admin status...")
            
            # Update existing user
            password_hash = generate_password_hash(admin_password)
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
            password_hash = generate_password_hash(admin_password)
            
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
            print("\nLogin URLs:")
            print("Frontend: http://localhost:8080/login")
            print("API: http://localhost:5000/api/auth/login")
            print("="*50)
            return True
        else:
            print("ERROR: Could not verify user creation")
            return False
            
    except ImportError:
        print("psycopg2 not available. Trying alternative method...")
        return create_admin_alternative()
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

def create_admin_alternative():
    """Alternative method using system psql command"""
    import subprocess
    
    admin_email = 'sunnyagarwal0801@gmail.com'
    admin_password = 'DataMantri@2024'
    user_id = str(uuid.uuid4())
    password_hash = generate_password_hash(admin_password)
    
    # SQL commands
    sql_commands = f"""
    -- Check if user exists and delete if present
    DELETE FROM users WHERE email = '{admin_email}';
    
    -- Insert new super admin user
    INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        is_admin, is_active, created_at, updated_at
    ) VALUES (
        '{user_id}', '{admin_email}', '{password_hash}', 'Sunny', 'Agarwal',
        true, true, NOW(), NOW()
    );
    
    -- Verify insertion
    SELECT id, email, is_admin, is_active FROM users WHERE email = '{admin_email}';
    """
    
    try:
        # Write SQL to temporary file
        with open('/tmp/create_admin.sql', 'w') as f:
            f.write(sql_commands)
        
        # Execute using psql
        cmd = [
            'psql',
            '-h', 'localhost',
            '-p', '5432',
            '-U', 'sunny.agarwal',
            '-d', 'dataviz',
            '-f', '/tmp/create_admin.sql'
        ]
        
        env = os.environ.copy()
        env['PGPASSWORD'] = 'postgres'
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Super admin created successfully using psql!")
            print("\n" + "="*50)
            print("SUPER ADMIN LOGIN CREDENTIALS")
            print("="*50)
            print(f"Email: {admin_email}")
            print(f"Password: {admin_password}")
            print(f"User ID: {user_id}")
            print("="*50)
            print("\nLogin URLs:")
            print("Frontend: http://localhost:8080/login")
            print("API: http://localhost:5000/api/auth/login")
            print("="*50)
            return True
        else:
            print(f"psql command failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Alternative method failed: {e}")
        return False
    finally:
        # Clean up temp file
        try:
            os.remove('/tmp/create_admin.sql')
        except:
            pass

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
