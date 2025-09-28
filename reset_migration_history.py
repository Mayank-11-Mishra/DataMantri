import sys
import os

# Add project root to the Python path to allow for package imports
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from sqlalchemy import create_engine, text
from database.config import config as db_config

def reset_migrations():
    """Connects to the database and drops the alembic_version table."""
    print('Connecting to the database to reset migration history...')
    try:
        engine = create_engine(db_config.get_database_url())
        with engine.connect() as connection:
            # The 'text' construct is important for executing raw SQL
            connection.execute(text('DROP TABLE IF EXISTS alembic_version;'))
            # For PostgreSQL, transactions are managed automatically with 'with connection.begin()'
            # but for a simple DDL statement, this is sufficient.
            print('Successfully dropped alembic_version table.')
    except Exception as e:
        print(f'An error occurred while resetting migration history: {e}')

if __name__ == '__main__':
    reset_migrations()
