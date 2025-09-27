#!/usr/bin/env python3
import os
import sys
sys.path.append('/Users/sunny.agarwal/Projects/DataViz-main')

from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime

# Direct database connection
import psycopg2

def create_admin():
    try:
        # Connect to database
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='sunny.agarwal',
            password='postgres',
            database='dataviz'
        )
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = %s", ('sunnyagarwal0801@gmail.com',))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing user
            password_hash = generate_password_hash('DataMantri@2024', method='pbkdf2:sha256')
            cursor.execute("""
                UPDATE users SET 
                password_hash = %s,
                is_active = %s
                WHERE email = %s
            """, (password_hash, True, 'sunnyagarwal0801@gmail.com'))
            print("Super admin user updated!")
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            password_hash = generate_password_hash('DataMantri@2024', method='pbkdf2:sha256')
            cursor.execute("""
                INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, 'sunnyagarwal0801@gmail.com', password_hash, 'Sunny', 'Agarwal', True, datetime.utcnow()))
            print("Super admin user created!")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("Login credentials:")
        print("Email: sunnyagarwal0801@gmail.com")
        print("Password: DataMantri@2024")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    create_admin()
