#!/usr/bin/env python3
"""
Check Database Schema Script
Inspects the actual database schema to understand the structure
"""
import psycopg2
from psycopg2.extras import RealDictCursor

def check_database_schema():
    """Check the actual database schema"""
    
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'user': 'sunny.agarwal',
        'password': 'postgres',
        'database': 'dataviz'
    }
    
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("Connected to PostgreSQL database successfully")
        
        # Check if users table exists
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'users'
        """)
        users_table = cursor.fetchone()
        
        if users_table:
            print("\n✅ Users table exists")
            
            # Get column information for users table
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'users'
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
            
            print("\nUsers table structure:")
            print("-" * 60)
            for col in columns:
                print(f"{col['column_name']:<20} {col['data_type']:<15} {col['is_nullable']:<10} {col['column_default'] or ''}")
            
            # Check if any users exist
            cursor.execute("SELECT COUNT(*) as count FROM users")
            user_count = cursor.fetchone()['count']
            print(f"\nTotal users in database: {user_count}")
            
            if user_count > 0:
                cursor.execute("SELECT id, email, created_at FROM users LIMIT 5")
                users = cursor.fetchall()
                print("\nExisting users:")
                for user in users:
                    print(f"- {user['email']} (ID: {user['id']})")
        else:
            print("\n❌ Users table does not exist")
            
            # Check what tables do exist
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = cursor.fetchall()
            
            print("\nExisting tables:")
            for table in tables:
                print(f"- {table['table_name']}")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    check_database_schema()
