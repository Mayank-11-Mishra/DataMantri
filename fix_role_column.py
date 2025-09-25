#!/usr/bin/env python3
"""
Migration script to fix the role column constraint
"""

from app import app, db
from sqlalchemy import text

def fix_role_column():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                # Make role column nullable since we're using the roles relationship now
                conn.execute(text("""
                    ALTER TABLE "user" 
                    ALTER COLUMN role DROP NOT NULL
                """))
                conn.commit()
                print("✓ Made role column nullable in user table")
                
        except Exception as e:
            print(f"Error during migration: {e}")
            raise

if __name__ == '__main__':
    fix_role_column()
