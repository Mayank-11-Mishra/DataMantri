#!/usr/bin/env python3
"""
Get PostgreSQL connection string for DataViz database
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add database directory to path
sys.path.append(str(Path(__file__).parent / 'database'))

try:
    from config import get_connection_string, config
    
    print("DataViz PostgreSQL Connection Information:")
    print("=" * 50)
    print(f"Host: {config.host}")
    print(f"Port: {config.port}")
    print(f"Database: {config.database}")
    print(f"Username: {config.username}")
    print(f"Schema: {config.schema}")
    print()
    print("Connection String:")
    print(get_connection_string())
    print()
    print("For psql command line:")
    print(f"psql {get_connection_string()}")
    print()
    print("For pgAdmin or other tools:")
    print(f"Host: {config.host}")
    print(f"Port: {config.port}")
    print(f"Database: {config.database}")
    print(f"Username: {config.username}")
    print(f"Password: [from environment]")
    
except ImportError:
    # Fallback if config not available
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '5432')
    user = os.getenv('DB_USER', 'postgres')
    password = os.getenv('DB_PASSWORD', 'postgres')
    database = os.getenv('DB_NAME', 'dataviz')
    
    connection_string = f"postgresql://{user}:{password}@{host}:{port}/{database}"
    
    print("DataViz PostgreSQL Connection String:")
    print(connection_string)
    print()
    print("For psql command line:")
    print(f"psql {connection_string}")
