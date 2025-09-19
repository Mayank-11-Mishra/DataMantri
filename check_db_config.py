import os
from app import app, db
from sqlalchemy import create_engine, text

def check_database_connection():
    try:
        # Get the database URI from the app config
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"Current database URI: {db_uri}")
        
        # Create a new engine with the same URI
        engine = create_engine(db_uri)
        
        # Test the connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 'Database connection successful'"))
            print(result.scalar())
            
            # Check if the uploads table exists
            if 'uploads' in [table.name for table in db.metadata.tables.values()]:
                print("Uploads table exists")
                
                # Count the number of uploads
                result = connection.execute(text("SELECT COUNT(*) FROM upload"))
                count = result.scalar()
                print(f"Number of upload records: {count}")
                
                # Get the latest uploads
                result = connection.execute(text("SELECT id, filename, status, upload_time FROM upload ORDER BY id DESC LIMIT 5"))
                print("\nLatest uploads:")
                for row in result:
                    print(f"ID: {row[0]}, Filename: {row[1]}, Status: {row[2]}, Upload Time: {row[3]}")
            else:
                print("Uploads table does not exist")
                
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")

if __name__ == "__main__":
    with app.app_context():
        check_database_connection()
