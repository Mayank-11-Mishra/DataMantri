import os
from app_clean import app, db, User
from werkzeug.security import generate_password_hash

def create_user():
    with app.app_context():
        email = "sunnyagarwal0801@gmail.com"
        password = "Purvee@0801"

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            print(f"User with email {email} already exists.")
            return

        # Create the user
        new_user = User(
            email=email,
            password=generate_password_hash(password, method='pbkdf2:sha256'),
            is_admin=True
        )

        db.session.add(new_user)
        db.session.commit()

        print(f"User '{email}' created successfully.")

if __name__ == "__main__":
    create_user()
