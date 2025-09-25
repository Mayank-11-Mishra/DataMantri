# DataViz Platform - Database Architecture Documentation

## Overview

This document provides comprehensive documentation for the DataViz platform's PostgreSQL database architecture. The database is designed to be modular, scalable, and follows best practices for normalization, indexing, and data integrity.

## Architecture Principles

- **Modular Design**: Tables are organized into logical groups for easy maintenance
- **Scalability**: Uses UUIDs for primary keys to support distributed systems
- **Audit Trail**: All tables include created_at, updated_at, and user tracking
- **Data Integrity**: Comprehensive foreign keys, constraints, and validation
- **Multi-Engine Support**: Schema designed to work with PostgreSQL, MySQL, and BigQuery
- **RBAC Integration**: Role-based access control throughout the system

## Database Schema Overview

### Core Business Tables

#### Users (`users`)
**Purpose**: Central user management with comprehensive profile information

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email address |
| password_hash | VARCHAR(255) | Encrypted password |
| first_name | VARCHAR(100) | User's first name |
| last_name | VARCHAR(100) | User's last name |
| avatar_url | VARCHAR(500) | Profile picture URL |
| timezone | VARCHAR(50) | User's timezone |
| is_admin | BOOLEAN | Admin privileges flag |
| is_active | BOOLEAN | Account status |
| email_verified | BOOLEAN | Email verification status |
| last_login_at | TIMESTAMP | Last login timestamp |

**Relationships**:
- One-to-many with `dashboards`, `visualizations`, `data_sources`
- Many-to-many with `roles` through `user_roles`

**Indexes**:
- `idx_users_email` on email (unique)
- `idx_users_active` on is_active
- `idx_users_created_at` on created_at

#### Roles (`roles`)
**Purpose**: Define system roles for RBAC (Role-Based Access Control)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Unique role name |
| description | TEXT | Role description |
| permissions | JSONB | Array of permissions |
| is_system_role | BOOLEAN | System-defined role flag |
| is_active | BOOLEAN | Role status |

**Default Roles**:
- `super_admin`: Full system access
- `admin`: Management privileges
- `editor`: Dashboard and visualization management
- `analyst`: Query and visualization capabilities
- `viewer`: Read-only access
- `uploader`: File upload capabilities

#### Data Sources (`data_sources`)
**Purpose**: External database connections and configurations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Data source name |
| connection_type | VARCHAR(50) | Database type (postgresql, mysql, bigquery) |
| connection_config | JSONB | Encrypted connection details |
| is_active | BOOLEAN | Connection status |
| test_query | TEXT | Query for connection testing |
| last_tested_at | TIMESTAMP | Last test timestamp |
| test_status | VARCHAR(20) | Test result status |

### Metadata Tables

#### Database Metadata (`database_metadata`)
**Purpose**: Store discovered database schema information

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| data_source_id | UUID | Reference to data source |
| database_name | VARCHAR(255) | Database name |
| schema_name | VARCHAR(255) | Schema name |
| table_name | VARCHAR(255) | Table name |
| table_type | VARCHAR(50) | Type (table, view, materialized_view) |
| row_count | BIGINT | Number of rows |
| size_bytes | BIGINT | Table size in bytes |

#### Column Metadata (`column_metadata`)
**Purpose**: Store column-level metadata for discovered tables

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| table_metadata_id | UUID | Reference to table metadata |
| column_name | VARCHAR(255) | Column name |
| data_type | VARCHAR(100) | Column data type |
| is_nullable | BOOLEAN | Nullable flag |
| is_primary_key | BOOLEAN | Primary key flag |
| is_foreign_key | BOOLEAN | Foreign key flag |

#### Saved Queries (`saved_queries`)
**Purpose**: Store reusable SQL queries

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Query name |
| query_text | TEXT | SQL query |
| data_source_id | UUID | Target data source |
| query_type | VARCHAR(50) | Query type (select, insert, etc.) |
| execution_count | INTEGER | Usage counter |
| avg_execution_time_ms | INTEGER | Average execution time |

### Dashboard and Visualization Tables

#### Dashboards (`dashboards`)
**Purpose**: Store dashboard definitions and configurations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Dashboard name |
| description | TEXT | Dashboard description |
| layout_config | JSONB | Grid layout configuration |
| theme_id | UUID | Reference to theme |
| filters_config | JSONB | Dashboard-level filters |
| mobile_layout | JSONB | Mobile-specific layout |
| is_public | BOOLEAN | Public access flag |
| view_count | INTEGER | View counter |

#### Visualizations (`visualizations`)
**Purpose**: Store chart and visualization definitions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Visualization name |
| visualization_type | VARCHAR(100) | Chart type |
| data_source_id | UUID | Data source reference |
| query_config | JSONB | Query definition |
| chart_config | JSONB | Chart styling and options |
| is_public | BOOLEAN | Public access flag |

#### Dashboard Components (`dashboard_components`)
**Purpose**: Individual widgets/components on dashboards

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| dashboard_id | UUID | Parent dashboard |
| visualization_id | UUID | Associated visualization |
| component_type | VARCHAR(100) | Component type |
| position_x | INTEGER | X coordinate |
| position_y | INTEGER | Y coordinate |
| width | INTEGER | Component width |
| height | INTEGER | Component height |
| component_config | JSONB | Component configuration |

### Theme and Chart Libraries

#### Theme Library (`theme_library`)
**Purpose**: Reusable themes for dashboard styling

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Theme name |
| css_variables | JSONB | CSS custom properties |
| color_palette | JSONB | Color array |
| typography | JSONB | Font settings |
| is_public | BOOLEAN | Public availability |
| is_default | BOOLEAN | Default theme flag |
| download_count | INTEGER | Usage counter |

#### Chart Library (`chart_library`)
**Purpose**: Reusable chart components

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Chart name |
| chart_type | VARCHAR(100) | Chart type |
| config_schema | JSONB | Configuration schema |
| component_code | TEXT | React/JS component code |
| css_styles | TEXT | Custom CSS |
| category | VARCHAR(100) | Chart category |
| is_public | BOOLEAN | Public availability |

### Upload Utility Tables

#### Upload Templates (`upload_templates`)
**Purpose**: Admin-defined file upload configurations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Template name |
| file_format | VARCHAR(50) | Supported format (csv, excel, json) |
| validation_rules | JSONB | Validation configuration |
| transformation_rules | JSONB | Data transformation logic |
| destination_type | VARCHAR(50) | Target database type |
| destination_config | JSONB | Connection and table details |
| upload_mode | VARCHAR(50) | Upload strategy |
| max_file_size_mb | INTEGER | Size limit |

#### Upload History (`upload_history`)
**Purpose**: Track all file upload operations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| template_id | UUID | Upload template used |
| file_name | VARCHAR(500) | Original filename |
| file_size_bytes | BIGINT | File size |
| file_hash | VARCHAR(64) | SHA-256 hash for deduplication |
| records_processed | INTEGER | Total records processed |
| records_success | INTEGER | Successfully imported |
| records_failed | INTEGER | Failed imports |
| status | VARCHAR(50) | Processing status |
| processing_time_ms | INTEGER | Processing duration |

### Scheduler Tables

#### Scheduler Jobs (`scheduler_jobs`)
**Purpose**: Automated job definitions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Job name |
| job_type | VARCHAR(100) | Job type |
| schedule_expression | VARCHAR(200) | Cron expression |
| target_resource_type | VARCHAR(100) | Target resource type |
| target_resource_id | UUID | Target resource ID |
| job_config | JSONB | Job-specific configuration |
| notification_config | JSONB | Notification settings |
| is_active | BOOLEAN | Job status |
| next_run_at | TIMESTAMP | Next execution time |
| consecutive_failures | INTEGER | Failure counter |

#### Scheduler Job Runs (`scheduler_job_runs`)
**Purpose**: Job execution history and logs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | Parent job |
| run_id | VARCHAR(100) | Unique run identifier |
| status | VARCHAR(50) | Execution status |
| started_at | TIMESTAMP | Start time |
| completed_at | TIMESTAMP | Completion time |
| duration_ms | INTEGER | Execution duration |
| output_log | TEXT | Execution output |
| error_log | TEXT | Error messages |

### Audit and Logging Tables

#### Audit Logs (`audit_logs`)
**Purpose**: Comprehensive user activity tracking

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User performing action |
| action_type | VARCHAR(100) | Action type |
| resource_type | VARCHAR(100) | Affected resource type |
| resource_id | UUID | Affected resource ID |
| old_values | JSONB | Previous values |
| new_values | JSONB | New values |
| ip_address | INET | Client IP address |
| user_agent | TEXT | Client user agent |
| timestamp | TIMESTAMP | Action timestamp |

#### Dashboard Analytics (`dashboard_analytics`)
**Purpose**: Dashboard usage analytics

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| dashboard_id | UUID | Dashboard accessed |
| user_id | UUID | User accessing |
| action_type | VARCHAR(100) | Action performed |
| duration_seconds | INTEGER | Session duration |
| ip_address | INET | Client IP |
| timestamp | TIMESTAMP | Access timestamp |

#### Query Execution Logs (`query_execution_logs`)
**Purpose**: Track all query executions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User executing query |
| data_source_id | UUID | Target data source |
| query_text | TEXT | SQL query |
| query_hash | VARCHAR(64) | Query hash for deduplication |
| execution_time_ms | INTEGER | Execution time |
| rows_returned | INTEGER | Result row count |
| status | VARCHAR(50) | Execution status |
| cache_hit | BOOLEAN | Cache hit flag |

### Settings and Configuration Tables

#### User Preferences (`user_preferences`)
**Purpose**: Individual user settings and preferences

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| preference_key | VARCHAR(255) | Setting key |
| preference_value | JSONB | Setting value |

**Common Preferences**:
- `dashboard_refresh_interval`: Auto-refresh interval
- `default_chart_colors`: Preferred color palette
- `timezone`: User timezone
- `theme_preference`: Preferred theme

#### System Settings (`system_settings`)
**Purpose**: Application-wide configuration

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| setting_key | VARCHAR(255) | Setting key |
| setting_value | JSONB | Setting value |
| description | TEXT | Setting description |
| is_public | BOOLEAN | Visibility to non-admins |

**Key Settings**:
- `max_upload_size_mb`: File upload limit
- `session_timeout_minutes`: Session timeout
- `enable_public_dashboards`: Public dashboard feature
- `query_timeout_seconds`: Query execution timeout

#### Bookmarks (`bookmarks`)
**Purpose**: User bookmarks for quick access

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| resource_type | VARCHAR(100) | Bookmarked resource type |
| resource_id | UUID | Bookmarked resource ID |
| bookmark_name | VARCHAR(255) | Custom bookmark name |
| tags | JSONB | Bookmark tags |

### Access Control Tables

#### Resource Permissions (`resource_permissions`)
**Purpose**: Fine-grained access control

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| resource_type | VARCHAR(100) | Resource type |
| resource_id | UUID | Resource ID |
| principal_type | VARCHAR(50) | Principal type (user/role) |
| principal_id | UUID | Principal ID |
| permission_type | VARCHAR(50) | Permission level |
| granted_by | UUID | User who granted permission |
| expires_at | TIMESTAMP | Permission expiration |

### Collaboration Tables

#### Comments (`comments`)
**Purpose**: Comments on dashboards and visualizations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| resource_type | VARCHAR(100) | Commented resource type |
| resource_id | UUID | Commented resource ID |
| parent_comment_id | UUID | Parent comment (for threads) |
| comment_text | TEXT | Comment content |
| is_resolved | BOOLEAN | Resolution status |
| resolved_by | UUID | User who resolved |

#### Notifications (`notifications`)
**Purpose**: User notifications

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Target user |
| notification_type | VARCHAR(100) | Notification type |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification content |
| action_url | VARCHAR(500) | Action URL |
| is_read | BOOLEAN | Read status |
| expires_at | TIMESTAMP | Expiration time |

## Performance Considerations

### Indexing Strategy

The database includes comprehensive indexing for optimal performance:

1. **Primary Keys**: All tables use UUID primary keys with automatic indexing
2. **Foreign Keys**: All foreign key columns are indexed
3. **Query Patterns**: Indexes on commonly queried columns (email, status, timestamps)
4. **Composite Indexes**: Multi-column indexes for complex queries
5. **Partial Indexes**: Conditional indexes for filtered queries

### Query Optimization

- **Connection Pooling**: Configured connection pools for concurrent access
- **Query Timeout**: Configurable query timeouts to prevent long-running queries
- **Prepared Statements**: Use of parameterized queries for security and performance
- **Result Caching**: Query result caching for frequently accessed data

### Scalability Features

- **UUID Primary Keys**: Support for distributed systems and replication
- **Partitioning Ready**: Table structure supports horizontal partitioning
- **Read Replicas**: Schema supports read replica configurations
- **Archival Strategy**: Automatic data archival for audit logs and analytics

## Security Features

### Data Protection

- **Encryption at Rest**: Sensitive data encrypted in database
- **Connection Security**: SSL/TLS encryption for database connections
- **Password Hashing**: Bcrypt hashing for user passwords
- **API Key Encryption**: Encrypted storage of external API keys

### Access Control

- **Role-Based Access**: Comprehensive RBAC implementation
- **Resource-Level Permissions**: Fine-grained access control
- **Audit Trail**: Complete audit logging for compliance
- **Session Management**: Secure session handling with timeouts

### Compliance

- **Data Retention**: Configurable data retention policies
- **Audit Logging**: Comprehensive audit trail for all actions
- **Privacy Controls**: User data privacy and deletion capabilities
- **Backup Security**: Encrypted database backups

## Maintenance and Operations

### Backup Strategy

```sql
-- Daily full backup
pg_dump dataviz > dataviz_backup_$(date +%Y%m%d).sql

-- Point-in-time recovery setup
-- Configure WAL archiving for continuous backup
```

### Monitoring Queries

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('dataviz'));

-- Monitor active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'dataviz';

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

### Maintenance Tasks

1. **Daily**: Automated backup, log rotation
2. **Weekly**: Index maintenance, statistics update
3. **Monthly**: Archive old audit logs, cleanup temp data
4. **Quarterly**: Performance review, capacity planning

## Migration and Deployment

### Initial Setup

```bash
# 1. Copy environment configuration
cp database/.env.example database/.env
# Edit database/.env with your settings

# 2. Create database and run migrations
cd database
python setup.py --full

# 3. Verify setup
python setup.py --verify
```

### Schema Updates

```bash
# Create new migration
python setup.py --schema

# Verify migration
python setup.py --verify
```

### Environment Migration

```bash
# Export from source
pg_dump source_db > migration.sql

# Import to target
psql target_db < migration.sql
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Check connection pool settings
2. **Slow Queries**: Review query execution plans and indexes
3. **Lock Contention**: Monitor blocking queries and transactions
4. **Storage Growth**: Implement data archival and cleanup

### Diagnostic Queries

```sql
-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor locks
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## Best Practices

### Development

1. **Use Transactions**: Wrap related operations in transactions
2. **Validate Input**: Always validate and sanitize user input
3. **Handle Errors**: Implement proper error handling and rollback
4. **Test Migrations**: Test schema changes in development first

### Production

1. **Monitor Performance**: Regular performance monitoring and optimization
2. **Backup Regularly**: Automated daily backups with retention policy
3. **Security Updates**: Keep database software updated
4. **Capacity Planning**: Monitor growth and plan for scaling

### Data Management

1. **Archive Old Data**: Implement data lifecycle management
2. **Clean Temp Data**: Regular cleanup of temporary and cache data
3. **Optimize Queries**: Regular query performance reviews
4. **Index Maintenance**: Monitor and maintain database indexes
