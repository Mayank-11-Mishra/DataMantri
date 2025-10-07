"""Data transfer orchestration service"""
from .bigquery_service import BigQueryService
from .postgres_service import PostgresService
import logging

logger = logging.getLogger(__name__)


class TransferService:
    """Service for orchestrating data transfers"""
    
    def __init__(self):
        self.bq_service = None
        self.pg_service = None
    
    def transfer_bigquery_to_postgres(
        self,
        bq_config: dict,
        pg_config: dict,
        batch_size: int = 10000
    ) -> dict:
        """Transfer data from BigQuery to PostgreSQL"""
        logger.info("Starting BigQuery to PostgreSQL transfer")
        
        # Initialize BigQuery service
        self.bq_service = BigQueryService(project_id=bq_config.get('project_id'))
        
        # Initialize PostgreSQL service
        pg_conn_str = (
            f"postgresql://{pg_config['user']}:{pg_config['password']}"
            f"@{pg_config['host']}:{pg_config['port']}/{pg_config['database']}"
        )
        self.pg_service = PostgresService(pg_conn_str)
        
        total_records = 0
        total_batches = 0
        failed_records = 0
        
        try:
            # Get data from BigQuery in batches
            for batch_df in self.bq_service.get_table_data(
                project=bq_config['project'],
                dataset=bq_config['dataset'],
                table=bq_config['table'],
                batch_size=batch_size
            ):
                try:
                    # Insert batch into PostgreSQL
                    records = self.pg_service.insert_dataframe(
                        batch_df,
                        pg_config['table'],
                        if_exists='append'
                    )
                    
                    total_records += records
                    total_batches += 1
                    
                    logger.info(f"Batch {total_batches}: Transferred {records} records")
                    
                except Exception as e:
                    logger.error(f"Failed to insert batch {total_batches}: {e}")
                    failed_records += len(batch_df)
                    raise
            
            return {
                "status": "success",
                "total_records": total_records,
                "total_batches": total_batches,
                "failed_records": failed_records
            }
            
        except Exception as e:
            logger.error(f"Transfer failed: {e}")
            return {
                "status": "failed",
                "total_records": total_records,
                "total_batches": total_batches,
                "failed_records": failed_records,
                "error": str(e)
            }


