from app import app, db

def check_database():
    with app.app_context():
        # Get the database engine
        engine = db.engine
        
        # Get table names
        table_names = db.inspect(engine).get_table_names()
        print("\n=== Database Tables ===")
        for table in table_names:
            print(f"\nTable: {table}")
            print("Columns:")
            columns = db.inspect(engine).get_columns(table)
            for column in columns:
                print(f"  - {column['name']}: {column['type']}")
        
        # Check if tables exist
        required_tables = ['user', 'upload', 'lead_record']
        missing_tables = [t for t in required_tables if t not in table_names]
        
        if missing_tables:
            print(f"\n❌ Missing tables: {', '.join(missing_tables)}")
        else:
            print("\n✅ All required tables exist")
        
        # Count records in each table
        print("\n=== Record Counts ===")
        for table in table_names:
            try:
                count = db.session.execute(f"SELECT COUNT(*) FROM {table}").scalar()
                print(f"{table}: {count} records")
            except Exception as e:
                print(f"Error counting records in {table}: {str(e)}")

if __name__ == '__main__':
    check_db()
