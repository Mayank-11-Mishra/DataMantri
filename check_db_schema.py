import sqlite3
import os
from app import app

def check_database_schema():
    db_path = os.path.join(app.root_path, 'instance', 'zoho_uploader.db')
    
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get the list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("\n=== Database Tables ===")
        for table in tables:
            table_name = table[0]
            print(f"\nTable: {table_name}")
            
            # Get table info
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            print("Columns:")
            for col in columns:
                print(f"  - {col[1]}: {col[2]}")
            
            # Count rows
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            print(f"  Rows: {count}")
            
            # Show sample data if table is not empty
            if count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 1;")
                sample = cursor.fetchone()
                print(f"  Sample row: {sample}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error checking database: {str(e)}")
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_database_schema()
