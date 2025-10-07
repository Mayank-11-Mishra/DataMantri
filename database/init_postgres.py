"""
Initialize PostgreSQL database for DataMantri
Creates all tables and seed data
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import db, User, DataSource, DataMart, Pipeline, Dashboard
from datetime import datetime, timedelta
import uuid

def init_database(app):
    """Initialize database with tables and seed data"""
    
    with app.app_context():
        # Drop all tables (use with caution!)
        print("🗑️  Dropping existing tables...")
        db.drop_all()
        
        # Create all tables
        print("📊 Creating tables...")
        db.create_all()
        
        # Create demo user
        print("👤 Creating demo user...")
        demo_user = User(
            id=str(uuid.uuid4()),
            email='demo@datamantri.com',
            name='Demo User',
            role='SUPER_ADMIN',
            is_admin=True,
            is_active=True,
            organization_name='DataMantri Demo',
            must_reset_password=False,
            created_at=datetime.utcnow()
        )
        demo_user.set_password('demo123')
        db.session.add(demo_user)
        
        # Create admin user
        print("👤 Creating admin user...")
        admin_user = User(
            id=str(uuid.uuid4()),
            email='admin@datamantri.com',
            name='Admin User',
            role='ADMIN',
            is_admin=True,
            is_active=True,
            organization_name='DataMantri',
            must_reset_password=False,
            created_at=datetime.utcnow()
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        
        db.session.commit()
        print(f"✅ Created users: demo@datamantri.com (demo123), admin@datamantri.com (admin123)")
        
        # Create sample data sources
        print("🔌 Creating sample data sources...")
        
        postgres_source = DataSource(
            id='a2fc63cc-958d-47ec-93eb-8e4b5c17015b',
            name='PostgreSQL Production',
            connection_type='postgresql',
            host='localhost',
            port=5432,
            database='production_db',
            username='postgres',
            status='connected',
            last_sync=datetime.utcnow(),
            created_by=demo_user.id,
            created_at=datetime.utcnow()
        )
        
        mysql_source = DataSource(
            id='b3gd74dd-069e-48fd-04fc-9f4c5c28026c',
            name='MySQL Analytics',
            connection_type='mysql',
            host='localhost',
            port=3306,
            database='analytics_db',
            username='mysql_user',
            status='connected',
            last_sync=datetime.utcnow() - timedelta(hours=2),
            created_by=demo_user.id,
            created_at=datetime.utcnow()
        )
        
        mongo_source = DataSource(
            id='c4he85ee-170f-59ge-15gd-0g5d6d39037d',
            name='MongoDB Logs',
            connection_type='mongodb',
            host='localhost',
            port=27017,
            database='logs_db',
            username='mongo_user',
            status='connected',
            last_sync=datetime.utcnow() - timedelta(minutes=30),
            created_by=demo_user.id,
            created_at=datetime.utcnow()
        )
        
        db.session.add_all([postgres_source, mysql_source, mongo_source])
        db.session.commit()
        print(f"✅ Created 3 data sources")
        
        # Create sample data marts
        print("📦 Creating sample data marts...")
        
        user_analytics = DataMart(
            id=str(uuid.uuid4()),
            name='User Analytics',
            description='User activity and engagement metrics',
            source_id=postgres_source.id,
            query='SELECT user_id, COUNT(*) as activity_count FROM user_events GROUP BY user_id',
            schedule='0 2 * * *',  # Daily at 2 AM
            status='ready',
            last_run=datetime.utcnow() - timedelta(days=1),
            created_by=demo_user.id,
            created_at=datetime.utcnow()
        )
        
        sales_summary = DataMart(
            id=str(uuid.uuid4()),
            name='Sales Summary',
            description='Daily sales aggregation',
            source_id=mysql_source.id,
            query='SELECT DATE(created_at) as date, SUM(total) as total_sales FROM orders GROUP BY DATE(created_at)',
            schedule='0 0 * * *',  # Daily at midnight
            status='ready',
            last_run=datetime.utcnow() - timedelta(hours=12),
            created_by=demo_user.id,
            created_at=datetime.utcnow()
        )
        
        db.session.add_all([user_analytics, sales_summary])
        db.session.commit()
        print(f"✅ Created 2 data marts")
        
        # Create sample pipelines
        print("🔄 Creating sample pipelines...")
        
        user_sync = Pipeline(
            id=str(uuid.uuid4()),
            name='User Data Sync',
            description='Sync user data from production to analytics',
            pipeline_type='simple',
            source_id=postgres_source.id,
            destination_id=mysql_source.id,
            source_table='users',
            destination_table='users_copy',
            schedule='0 * * * *',  # Every hour
            status='active',
            last_run=datetime.utcnow() - timedelta(hours=1),
            next_run=datetime.utcnow() + timedelta(hours=1),
            created_by=demo_user.id,
            created_at=datetime.utcnow()
        )
        
        order_etl = Pipeline(
            id=str(uuid.uuid4()),
            name='Order ETL Pipeline',
            description='Transform and load orders into data warehouse',
            pipeline_type='sql',
            source_id=mysql_source.id,
            destination_id=postgres_source.id,
            transformation_sql='''
                SELECT 
                    id,
                    user_id,
                    total,
                    status,
                    DATE(created_at) as order_date
                FROM orders
                WHERE status = 'completed'
            ''',
            schedule='0 */6 * * *',  # Every 6 hours
            status='active',
            last_run=datetime.utcnow() - timedelta(hours=6),
            next_run=datetime.utcnow() + timedelta(hours=6),
            created_by=demo_user.id,
            created_at=datetime.utcnow()
        )
        
        db.session.add_all([user_sync, order_etl])
        db.session.commit()
        print(f"✅ Created 2 pipelines")
        
        # Create sample dashboard
        print("📊 Creating sample dashboard...")
        
        main_dashboard = Dashboard(
            id=str(uuid.uuid4()),
            name='Main Analytics Dashboard',
            description='Overview of key metrics',
            config={
                'charts': [
                    {'type': 'line', 'title': 'Daily Sales', 'query_id': None},
                    {'type': 'bar', 'title': 'User Growth', 'query_id': None},
                    {'type': 'pie', 'title': 'Order Status', 'query_id': None}
                ],
                'layout': '3-column'
            },
            is_public=False,
            created_by=demo_user.id,
            created_at=datetime.utcnow()
        )
        
        db.session.add(main_dashboard)
        db.session.commit()
        print(f"✅ Created 1 dashboard")
        
        print("\n" + "="*60)
        print("✅ DATABASE INITIALIZED SUCCESSFULLY!")
        print("="*60)
        print("\n📊 Summary:")
        print(f"   • Users: 2")
        print(f"   • Data Sources: 3")
        print(f"   • Data Marts: 2")
        print(f"   • Pipelines: 2")
        print(f"   • Dashboards: 1")
        print("\n🔐 Login Credentials:")
        print(f"   • Demo: demo@datamantri.com / demo123")
        print(f"   • Admin: admin@datamantri.com / admin123")
        print("\n🌐 Start the application:")
        print(f"   python app_simple.py")
        print("="*60)

if __name__ == '__main__':
    from flask import Flask
    
    app = Flask(__name__)
    
    # Database configuration
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'datamantri')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    print("\n" + "="*60)
    print("🚀 DATAMANTRI DATABASE INITIALIZATION")
    print("="*60)
    print(f"\n📍 Database: postgresql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    print("\n⚠️  WARNING: This will drop all existing tables!")
    
    response = input("\nContinue? (yes/no): ")
    
    if response.lower() == 'yes':
        init_database(app)
    else:
        print("❌ Initialization cancelled.")

