"""PostgreSQL data service"""
from sqlalchemy import create_engine, text, inspect
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class PostgresService:
    """Service for interacting with PostgreSQL"""
    
    def __init__(self, connection_string: str):
        self.engine = create_engine(connection_string, pool_pre_ping=True)
    
    def insert_dataframe(
        self,
        df: pd.DataFrame,
        table_name: str,
        if_exists: str = 'append'
    ) -> int:
        """Insert DataFrame into PostgreSQL table"""
        logger.info(f"Inserting {len(df)} records into {table_name}")
        
        df.to_sql(
            table_name,
            self.engine,
            if_exists=if_exists,
            index=False,
            method='multi',
            chunksize=1000
        )
        
        return len(df)
    
    def execute_query(self, query: str):
        """Execute a SQL query"""
        with self.engine.connect() as conn:
            return conn.execute(text(query))
    
    def table_exists(self, table_name: str) -> bool:
        """Check if table exists"""
        inspector = inspect(self.engine)
        return table_name in inspector.get_table_names()
    
    def get_table_schema(self, table_name: str) -> list:
        """Get table schema"""
        inspector = inspect(self.engine)
        columns = inspector.get_columns(table_name)
        return [{"name": col["name"], "type": str(col["type"])} for col in columns]


