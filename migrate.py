from app import app, db
from app import Upload  # Import models from app

def migrate():
    with app.app_context():
        # Create all tables if they don't exist
        db.create_all()
        
        # Check if we need to add the new columns
        from sqlalchemy import text
        
        # Get the list of columns in the upload table
        result = db.session.execute(text("PRAGMA table_info(upload)"))
        columns = [row[1] for row in result]
        
        # Add missing columns if they don't exist
        with db.engine.begin() as connection:
            if 'upload_time' not in columns:
                connection.execute(text("ALTER TABLE upload ADD COLUMN upload_time DATETIME"))
                print("Added upload_time column")
            
            if 'transform_time' not in columns:
                connection.execute(text("ALTER TABLE upload ADD COLUMN transform_time DATETIME"))
                print("Added transform_time column")
            
            if 'update_time' not in columns:
                connection.execute(text("ALTER TABLE upload ADD COLUMN update_time DATETIME"))
                print("Added update_time column")
            
            if 'error_message' not in columns:
                connection.execute(text("ALTER TABLE upload ADD COLUMN error_message TEXT"))
                print("Added error_message column")
        
        print("Migration completed successfully!")

if __name__ == '__main__':
    migrate()
