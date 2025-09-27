#!/usr/bin/env python3
"""
DataMantri Super Admin Setup Script
Creates the DataMantri organization and super admin user
"""

from app import app, db, User, Organization, RoleEnum
from werkzeug.security import generate_password_hash
import uuid

def setup_datamantri():
    with app.app_context():
        print("Setting up DataMantri SaaS platform...")
        
        # Create DataMantri organization
        datamantri_org = Organization.query.filter_by(name='DataMantri').first()
        if not datamantri_org:
            print("Creating DataMantri organization...")
            datamantri_org = Organization(
                id=str(uuid.uuid4()),
                name='DataMantri',
                logo_url='https://datamantri.com/logo.png'
            )
            db.session.add(datamantri_org)
            db.session.commit()
            print("DataMantri organization created successfully!")
        else:
            print("DataMantri organization already exists.")
        
        # Create super admin user
        super_admin = User.query.filter_by(email='sunnyagarwal0801@gmail.com').first()
        if not super_admin:
            print("Creating super admin user...")
            super_admin = User(
                id=str(uuid.uuid4()),
                email='sunnyagarwal0801@gmail.com',
                password_hash=generate_password_hash('DataMantri@2024', method='pbkdf2:sha256'),
                first_name='Sunny',
                last_name='Agarwal',
                role=RoleEnum.SUPER_ADMIN,
                organization_id=datamantri_org.id,
                is_active=True,
                email_verified=True
            )
            db.session.add(super_admin)
            db.session.commit()
            print("Super admin user created successfully!")
            print("Login credentials:")
            print("Email: sunnyagarwal0801@gmail.com")
            print("Password: DataMantri@2024")
        else:
            print("Super admin user already exists.")
            # Update password if needed
            super_admin.password_hash = generate_password_hash('DataMantri@2024', method='pbkdf2:sha256')
            super_admin.role = RoleEnum.SUPER_ADMIN
            super_admin.organization_id = datamantri_org.id
            super_admin.is_active = True
            db.session.commit()
            print("Super admin user updated!")
            print("Login credentials:")
            print("Email: sunnyagarwal0801@gmail.com")
            print("Password: DataMantri@2024")
        
        print("\nDataMantri setup complete!")
        print("You can now log in at http://localhost:8080")

if __name__ == '__main__':
    setup_datamantri()
