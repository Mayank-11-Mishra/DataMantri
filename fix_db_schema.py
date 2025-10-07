#!/usr/bin/env python3
"""Fix database schema by adding missing columns"""
import sqlite3
import os

# Path to database
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'dataviz.db')

print(f"🔧 Fixing database schema at: {db_path}")

if not os.path.exists(db_path):
    print(f"❌ Database file not found at {db_path}")
    exit(1)

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if data_source_id column exists in data_marts
    cursor.execute("PRAGMA table_info(data_marts)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'data_source_id' not in columns:
        print("➕ Adding data_source_id column to data_marts table...")
        cursor.execute("ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36)")
        conn.commit()
        print("✅ Added data_source_id column")
    else:
        print("✓ data_source_id column already exists in data_marts")
    
    # Check if role, is_active, is_admin columns exist in users table
    cursor.execute("PRAGMA table_info(users)")
    user_columns = [row[1] for row in cursor.fetchall()]
    
    if 'role' not in user_columns:
        print("➕ Adding role column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER'")
        conn.commit()
        print("✅ Added role column")
    else:
        print("✓ role column already exists in users")
    
    if 'is_active' not in user_columns:
        print("➕ Adding is_active column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
        conn.commit()
        print("✅ Added is_active column")
    else:
        print("✓ is_active column already exists in users")
    
    if 'is_admin' not in user_columns:
        print("➕ Adding is_admin column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
        conn.commit()
        print("✅ Added is_admin column")
    else:
        print("✓ is_admin column already exists in users")
    
    print("\n✅ Database schema is now up to date!")
    
except sqlite3.Error as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()

