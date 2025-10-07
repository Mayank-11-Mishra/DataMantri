"""Initialize database and create admin user"""
from app.core.database import init_db, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
import uuid
from datetime import datetime

def create_admin_user():
    """Create default admin user"""
    db = SessionLocal()
    
    try:
        # Check if admin exists
        existing_admin = db.query(User).filter(User.email == "admin@datamantri.com").first()
        
        if existing_admin:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin = User(
            id=uuid.uuid4(),
            email="admin@datamantri.com",
            password_hash=get_password_hash("admin123"),
            full_name="Admin User",
            role="admin",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(admin)
        db.commit()
        
        print("=" * 60)
        print("✅ Admin user created successfully!")
        print("=" * 60)
        print("Email: admin@datamantri.com")
        print("Password: admin123")
        print("=" * 60)
        print("\nYou can now login with these credentials")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("✅ Database tables created")
    
    print("\nCreating admin user...")
    create_admin_user()


