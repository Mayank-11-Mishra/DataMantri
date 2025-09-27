from app import app, db, User, RoleEnum
from werkzeug.security import generate_password_hash
import uuid

def init_db():
    with app.app_context():
        # Drop all database tables
        print("Dropping all database tables...")
        db.drop_all()
        print("Creating database tables...")
        db.create_all()
        
        # Create admin user if it doesn't exist
        if not User.query.filter_by(email='admin@dataviz.com').first():
            print("Creating admin user...")
            admin = User(
                id=str(uuid.uuid4()),
                email='admin@dataviz.com',
                password_hash=generate_password_hash('admin123', method='pbkdf2:sha256'),
                first_name='Admin',
                last_name='User',
                role=RoleEnum.SUPER_ADMIN,
                is_active=True,
                email_verified=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin user created successfully!")
            print("Login credentials:")
            print("Email: admin@dataviz.com")
            print("Password: admin123")
        else:
            print("Admin user already exists.")

if __name__ == '__main__':
    init_db()
    print("Database initialization complete!")
