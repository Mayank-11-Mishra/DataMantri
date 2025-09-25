#!/usr/bin/env python3
"""
Migration script to add must_reset_password column to user table
"""

from app import app, db
from sqlalchemy import text

def migrate_user_table():
    with app.app_context():
        try:
            # Check if column already exists
            with db.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='user' AND column_name='must_reset_password'
                """))
                
                if result.fetchone() is None:
                    # Add the column
                    conn.execute(text("""
                        ALTER TABLE "user" 
                        ADD COLUMN must_reset_password BOOLEAN DEFAULT FALSE
                    """))
                    conn.commit()
                    print("✓ Added must_reset_password column to user table")
                else:
                    print("✓ must_reset_password column already exists")
                
        except Exception as e:
            print(f"Error during migration: {e}")
            raise

if __name__ == '__main__':
    migrate_user_table()
