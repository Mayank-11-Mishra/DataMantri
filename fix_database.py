#!/usr/bin/env python3
"""Fix database by adding missing data_source_id column"""
import sqlite3
import os

db_path = 'instance/zoho_uploader.db'

print("🔧 Fixing database schema...")
print("=" * 50)

if not os.path.exists(db_path):
    print(f"❌ Database not found: {db_path}")
    print("Creating database directory...")
    os.makedirs('instance', exist_ok=True)
    print("✅ Directory created. Backend will create database on next start.")
    exit(0)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if data_marts table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='data_marts'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        print("ℹ️  data_marts table doesn't exist yet")
        print("✅ Backend will create it on next start")
        conn.close()
        exit(0)
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(data_marts)")
    columns = [column[1] for column in cursor.fetchall()]
    
    print(f"📋 Current columns: {', '.join(columns)}")
    print()
    
    if 'data_source_id' in columns:
        print("✅ Column 'data_source_id' already exists!")
    else:
        print("➕ Adding 'data_source_id' column...")
        cursor.execute("ALTER TABLE data_marts ADD COLUMN data_source_id VARCHAR(36)")
        conn.commit()
        print("✅ Successfully added 'data_source_id' column!")
    
    # Verify
    cursor.execute("PRAGMA table_info(data_marts)")
    columns_after = [column[1] for column in cursor.fetchall()]
    print()
    print(f"📋 Updated columns: {', '.join(columns_after)}")
    
    # Check how many data marts exist
    cursor.execute("SELECT COUNT(*) FROM data_marts")
    count = cursor.fetchone()[0]
    print()
    print(f"📊 Found {count} data mart(s) in database")
    
    if count > 0:
        # Check how many need fixing
        cursor.execute("SELECT COUNT(*) FROM data_marts WHERE data_source_id IS NULL OR data_source_id = ''")
        needs_fix = cursor.fetchone()[0]
        if needs_fix > 0:
            print(f"⚠️  {needs_fix} data mart(s) need data_source_id assigned")
            print("   (Backend will auto-fix these on startup)")
        else:
            print("✅ All data marts have data_source_id assigned")
    
    conn.close()
    print()
    print("=" * 50)
    print("✅ Database schema is ready!")
    print()
    print("Next step: Restart the backend")
    
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

