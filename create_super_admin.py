import os
import sys
import uuid
from werkzeug.security import generate_password_hash

# Add project root to the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from app_minimal import app, db, User

def create_admin_user():
    """Creates the admin user with the specified credentials."""
    with app.app_context():
        # Ensure all tables are created
        db.create_all()
        email = "sunnyagarwal0801@gmail.com"
        password = "DataMantri@2024"

        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"User with email {email} already exists. Updating password and role.")
            user.password_hash = generate_password_hash(password)
            user.role = 'ADMIN'
        else:
            print(f"Creating new admin user with email {email}.")
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password_hash=generate_password_hash(password),
                role='ADMIN'
            )
            db.session.add(user)
        
        db.session.commit()
        print(f"Admin user '{email}' is ready.")

if __name__ == "__main__":
    create_admin_user()
