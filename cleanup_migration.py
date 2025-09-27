import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables from the project's .env file
load_dotenv()

# Use the configuration from database/config.py
from database.config import config as db_config

def cleanup_db():
    engine = create_engine(db_config.get_database_url())
    print("Connecting to the database...")

    commands = [
        "ALTER TABLE users DROP COLUMN IF EXISTS role",
        "ALTER TABLE users DROP COLUMN IF EXISTS organization_id",
        "DROP TABLE IF EXISTS organizations CASCADE",
        "DROP TABLE IF EXISTS alembic_version"
    ]

    for command in commands:
        with engine.connect() as connection:
            try:
                with connection.begin():
                    connection.execute(text(command))
                    print(f"Successfully executed: {command}")
            except Exception as e:
                print(f"Could not execute '{command}': {e}")

    print("Database cleanup complete.")

if __name__ == "__main__":
    cleanup_db()
