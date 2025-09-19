from app import app, db, User
from werkzeug.security import generate_password_hash

def init_db():
    with app.app_context():
        # Create all database tables
        print("Creating database tables...")
        db.create_all()
        
        # Create admin user if it doesn't exist
        if not User.query.filter_by(email='admin@example.com').first():
            print("Creating admin user...")
            admin = User(
                email='admin@example.com',
                password=generate_password_hash('admin123', method='pbkdf2:sha256'),
                is_admin=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin user created successfully!")
        else:
            print("Admin user already exists.")

if __name__ == '__main__':
    init_db()
    print("Database initialization complete!")
