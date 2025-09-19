import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

def verify_database():
    """Verify database connection and table structure"""
    try:
        # Use the same database configuration as the main app
        from app import app
        db_url = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"Connecting to database: {db_url}")
        
        # Ensure the instance directory exists for SQLite
        if 'sqlite' in db_url.lower():
            db_path = db_url.split('///')[-1]
            os.makedirs(os.path.dirname(db_path) or '.', exist_ok=True)
        
        # Create database engine
        engine = create_engine(db_url)
        
        # Test connection
        with engine.connect() as conn:
            print("\n[SUCCESS] Database connection successful!")
            
            # Get table information
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            if not tables:
                print("\n[INFO] No tables found in the database.")
                print("Creating necessary tables...")
                from app import db, create_app
                app = create_app()
                with app.app_context():
                    db.create_all()
                print("Database tables created.")
                tables = inspector.get_table_names()
                
            print("\nDatabase Tables:")
            for table in tables:
                try:
                    # Get column information for each table
                    columns = [col['name'] for col in inspector.get_columns(table)]
                    print(f"\nTable: {table}")
                    print(f"Columns: {', '.join(columns)}")
                    
                    # Get row count for each table
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    print(f"Row count: {count}")
                except Exception as e:
                    print(f"Error processing table {table}: {str(e)}")
                
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    print("=== Verifying database connection and structure... ===")
    if verify_database():
        print("\n[SUCCESS] Database verification completed!")
    else:
        print("\n[ERROR] Database verification failed.")
