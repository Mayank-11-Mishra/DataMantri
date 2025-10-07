"""BigQuery data service"""
from google.cloud import bigquery
from typing import Generator
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class BigQueryService:
    """Service for interacting with Google BigQuery"""
    
    def __init__(self, project_id: str = None):
        self.client = bigquery.Client(project=project_id)
    
    def query_data(self, query: str, batch_size: int = 10000) -> Generator[pd.DataFrame, None, None]:
        """Query BigQuery and return data in batches"""
        logger.info(f"Executing BigQuery query: {query}")
        query_job = self.client.query(query)
        
        rows_buffer = []
        for row in query_job:
            rows_buffer.append(dict(row))
            
            if len(rows_buffer) >= batch_size:
                yield pd.DataFrame(rows_buffer)
                rows_buffer = []
        
        if rows_buffer:
            yield pd.DataFrame(rows_buffer)
    
    def get_table_data(
        self,
        project: str,
        dataset: str,
        table: str,
        batch_size: int = 10000,
        where_clause: str = None
    ) -> Generator[pd.DataFrame, None, None]:
        """Get data from a BigQuery table"""
        query = f"SELECT * FROM `{project}.{dataset}.{table}`"
        if where_clause:
            query += f" WHERE {where_clause}"
        
        return self.query_data(query, batch_size)
    
    def get_table_schema(self, project: str, dataset: str, table: str) -> list:
        """Get table schema"""
        table_ref = self.client.dataset(dataset, project=project).table(table)
        table = self.client.get_table(table_ref)
        return [{"name": field.name, "type": field.field_type} for field in table.schema]


