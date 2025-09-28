import sys
import os

# Add project root to the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from app_minimal import app, db

def drop_all_tables():
    """Connects to the database and drops all tables."""
    print('Connecting to the database to drop all tables...')
    try:
        with app.app_context():
            db.drop_all()
        print('Successfully dropped all tables.')
    except Exception as e:
        print(f'An error occurred while dropping tables: {e}')

if __name__ == '__main__':
    drop_all_tables()
