import os
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Load environment variables from the project root .env file
project_root = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path=dotenv_path)

# Database configuration from config or environment variables
DB_USERNAME = os.getenv('DB_USER', 'sunny.agarwal')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_DATABASE', 'dataviz')

def main():
    """
    Connects to the database and drops the alembic_version table to reset migration history.
    """
    try:
        print("Connecting to the database to reset migration history...")
        password_encoded = quote_plus(DB_PASSWORD)
        database_url = f"postgresql://{DB_USERNAME}:{password_encoded}@{DB_HOST}:{DB_PORT}/{DB_NAME}?gssencmode=disable"
        
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            print("Connection successful.")
            print("Dropping 'alembic_version' table...")
            
            with connection.begin():
                connection.execute(text("DROP TABLE IF EXISTS alembic_version;"))
            
            print("'alembic_version' table dropped successfully. Migration history has been reset.")
            
    except Exception as e:
        print(f"An error occurred while resetting migration history: {e}")

if __name__ == "__main__":
    main()
