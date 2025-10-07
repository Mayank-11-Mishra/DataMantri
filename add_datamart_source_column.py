#!/usr/bin/env python3
"""
Add data_source_id column to data_marts table if it doesn't exist
"""
import sqlite3
import os

db_path = 'instance/zoho_uploader.db'

if not os.path.exists(db_path):
    print(f"Database file not found: {db_path}")
    exit(0)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(data_marts)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'data_source_id' in columns:
        print("✅ Column 'data_source_id' already exists in data_marts table")
    else:
        print("Adding 'data_source_id' column to data_marts table...")
        cursor.execute("ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36)")
        conn.commit()
        print("✅ Successfully added 'data_source_id' column")
    
    conn.close()
    print("✅ Database migration complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

