#!/usr/bin/env python3
"""
Simple Super Admin Creation Script
Creates a super admin user without complex relationships
"""
import os
import sys
import uuid
from datetime import datetime

# Add the project root to Python path
sys.path.append('/Users/sunny.agarwal/Projects/DataViz-main')

# Set environment variables for Flask
os.environ['FLASK_APP'] = 'app.py'

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from database.config import config as db_config

# Create minimal Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = db_config.get_database_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Simple User model for admin creation
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

def create_super_admin():
    """Create a super admin user"""
    
    # Super admin credentials
    admin_email = 'sunnyagarwal0801@gmail.com'
    admin_password = 'DataMantri@2024'
    
    with app.app_context():
        try:
            # Check if user already exists
            existing_user = User.query.filter_by(email=admin_email).first()
            
            if existing_user:
                print(f"User {admin_email} already exists. Updating password and admin status...")
                
                # Update existing user
                existing_user.password_hash = generate_password_hash(admin_password, method='pbkdf2:sha256')
                existing_user.is_admin = True
                existing_user.is_active = True
                existing_user.updated_at = datetime.utcnow()
                
                db.session.commit()
                print("Super admin user updated successfully!")
                user = existing_user
                
            else:
                print(f"Creating new super admin user: {admin_email}")
                
                # Create new user with UUID
                user_id = str(uuid.uuid4())
                password_hash = generate_password_hash(admin_password, method='pbkdf2:sha256')
                
                new_user = User(
                    id=user_id,
                    email=admin_email,
                    password_hash=password_hash,
                    first_name='Sunny',
                    last_name='Agarwal',
                    is_admin=True,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                db.session.add(new_user)
                db.session.commit()
                print("Super admin user created successfully!")
                user = new_user
            
            # Display credentials
            print("\n" + "="*50)
            print("SUPER ADMIN LOGIN CREDENTIALS")
            print("="*50)
            print(f"Email: {admin_email}")
            print(f"Password: {admin_password}")
            print(f"User ID: {user.id}")
            print(f"Admin Status: {user.is_admin}")
            print(f"Active Status: {user.is_active}")
            print("="*50)
            print("\nLogin URLs:")
            print("Frontend: http://localhost:8080/login")
            print("API: http://localhost:5000/api/auth/login")
            print("="*50)
            
            return True
            
        except Exception as e:
            print(f"Error creating super admin: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = create_super_admin()
    if success:
        print("\nSuper admin creation completed successfully!")
    else:
        print("\nSuper admin creation failed!")
