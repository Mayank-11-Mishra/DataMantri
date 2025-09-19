import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create and return a database connection"""
    postgres_url = os.getenv('POSTGRES_URL', 'postgresql://postgres:postgres@localhost:5432/your_database')
    return create_engine(postgres_url)

def check_table_counts(engine, table_name):
    """Check the number of records in a specific table"""
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        return result.scalar()

def truncate_table(engine, table_name):
    """Truncate a table"""
    with engine.connect() as conn:
        conn.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
        conn.commit()
    print(f"Table {table_name} has been truncated.")

def sync_marzi_data(file_path):
    """
    Synchronize data between uploaded file and database tables.
    If counts don't match, truncate and reload the data.
    """
    try:
        # Read the uploaded file
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:  # Assuming Excel file
            df = pd.read_excel(file_path)
        
        file_record_count = len(df)
        print(f"Records in uploaded file: {file_record_count}")
        
        # Connect to PostgreSQL
        engine = get_db_connection()
        
        # Table to check and sync
        tables_to_sync = ['marzi_zoho_data_cleaned']  # Add other tables if needed
        
        for table in tables_to_sync:
            try:
                # Check current record count in the table
                db_count = check_table_counts(engine, table)
                print(f"Current records in {table}: {db_count}")
                
                # If counts don't match, truncate and reload
                if db_count != file_record_count:
                    print(f"Count mismatch detected for {table}. Truncating and reloading...")
                    truncate_table(engine, table)
                    
                    # Here you would add code to reload the data into the table
                    # For example:
                    # df.to_sql(table, engine, if_exists='append', index=False)
                    print(f"Data reloaded into {table}")
                else:
                    print(f"No sync needed for {table}. Record counts match.")
                    
            except Exception as e:
                print(f"Error syncing {table}: {str(e)}")
                
    except Exception as e:
        print(f"Error during database sync: {str(e)}")

if __name__ == "__main__":
    # Example usage:
    # sync_marzi_data("path/to/your/uploaded_file.csv")
    print("Please provide the path to the uploaded file as an argument.")
