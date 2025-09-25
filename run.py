from app import app, db

if __name__ == '__main__':
    with app.app_context():
        from app import User, Role, UserRole, AccessPolicy
        from werkzeug.security import generate_password_hash
        import secrets
        import json

        # Ensure all tables are created
        db.create_all()

        # Create Super Admin Role if it doesn't exist
        super_admin_role = Role.query.filter_by(name='Super Admin').first()
        if not super_admin_role:
            all_features = [
                'view_dashboards', 'create_dashboards', 'view_datamarts', 'manage_datamarts',
                'view_datasources', 'manage_datasources', 'perform_uploads', 'manage_upload_templates',
                'view_analytics', 'manage_users', 'manage_access_policies', 'manage_libraries', 'manage_scheduler'
            ]
            permissions = {feature: True for feature in all_features}
            super_admin_role = Role(
                name='Super Admin',
                description='Has all permissions in the system.',
                permissions=json.dumps(permissions)
            )
            db.session.add(super_admin_role)
            db.session.commit()

        # Create Super Admin User if it doesn't exist
        super_admin_user = User.query.filter_by(email='sunnyagarwal0806@gmail.com').first()
        if not super_admin_user:
            temp_password = secrets.token_urlsafe(16)
            print(f'--- SUPER ADMIN OTP FOR sunnyagarwal0806@gmail.com: {temp_password} ---')
            super_admin_user = User(
                email='sunnyagarwal0806@gmail.com',
                password=generate_password_hash(temp_password),
                is_admin=True,
                must_reset_password=True
            )
            db.session.add(super_admin_user)
            db.session.commit()

            # Assign Super Admin role
            user_role = UserRole.query.filter_by(user_id=super_admin_user.id, role_id=super_admin_role.id).first()
            if not user_role:
                db.session.add(UserRole(user_id=super_admin_user.id, role_id=super_admin_role.id, granted_by=super_admin_user.id))
                db.session.commit()
    
    # Run the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True)
