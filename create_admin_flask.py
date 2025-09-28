#!/usr/bin/env python3
"""
Super Admin Creation using Flask App Context
This script uses the Flask app to create a super admin user
"""
import os
import sys
import uuid
from datetime import datetime

# Add the project root to Python path
sys.path.append('/Users/sunny.agarwal/Projects/DataViz-main')

# Set environment variables for Flask
os.environ['FLASK_APP'] = 'app.py'

try:
    from app import app, db, User
    from werkzeug.security import generate_password_hash
    
    def create_super_admin():
        """Create a super admin user using Flask app context"""
        
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
            
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure the Flask app and dependencies are properly installed.")
except Exception as e:
    print(f"Error: {e}")
