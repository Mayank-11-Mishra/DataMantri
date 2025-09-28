import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def create_database_if_not_exists():
    """Connects to the PostgreSQL server and creates the 'dataviz' database if it doesn't exist."""
    db_user = os.getenv('DB_USERNAME', 'sunny.agarwal')
    db_password = os.getenv('DB_PASSWORD', 'postgres')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = 'dataviz'

    # Connect to the default 'postgres' database to run the CREATE DATABASE command
    engine = create_engine(
        f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/postgres',
        isolation_level='AUTOCOMMIT'
    )

    try:
        with engine.connect() as connection:
            # Check if the database already exists
            result = connection.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
            db_exists = result.scalar() == 1

            if not db_exists:
                print(f'Database \'{db_name}\' does not exist. Creating it now...')
                connection.execute(text(f'CREATE DATABASE {db_name}'))
                print(f'Database \'{db_name}\' created successfully.')
            else:
                print(f'Database \'{db_name}\' already exists.')

    except Exception as e:
        print(f'An error occurred: {e}')
        print(f'Please ensure the user \'{db_user}\' has permissions to connect to the \'postgres\' database and create new databases.')

if __name__ == '__main__':
    create_database_if_not_exists()
