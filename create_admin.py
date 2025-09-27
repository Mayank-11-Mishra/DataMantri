#!/usr/bin/env python3
from app import app, db, User, RoleEnum
from werkzeug.security import generate_password_hash
import uuid

def create_admin():
    with app.app_context():
        # Create super admin user
        admin = User.query.filter_by(email='sunnyagarwal0801@gmail.com').first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email='sunnyagarwal0801@gmail.com',
                password_hash=generate_password_hash('DataMantri@2024', method='pbkdf2:sha256'),
                first_name='Sunny',
                last_name='Agarwal',
                role=RoleEnum.SUPER_ADMIN,
                is_active=True,
                email_verified=True,
                must_reset_password=False
            )
            db.session.add(admin)
            db.session.commit()
            print("Super admin created successfully!")
        else:
            admin.password_hash = generate_password_hash('DataMantri@2024', method='pbkdf2:sha256')
            admin.role = RoleEnum.SUPER_ADMIN
            admin.is_active = True
            admin.must_reset_password = False
            db.session.commit()
            print("Super admin updated!")
        
        print("Email: sunnyagarwal0801@gmail.com")
        print("Password: DataMantri@2024")

if __name__ == '__main__':
    create_admin()
