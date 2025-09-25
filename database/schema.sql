-- =====================================================
-- DataViz Platform - PostgreSQL Database Schema
-- =====================================================
-- A comprehensive, modular, and scalable database design
-- for the DataViz data visualization platform
-- =====================================================

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE BUSINESS TABLES
-- =====================================================

-- Users table with comprehensive user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Roles for RBAC (Role-Based Access Control)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- User-Role assignments with time-based access control
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- External database connections
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    connection_type VARCHAR(50) NOT NULL, -- postgresql, mysql, bigquery, snowflake, etc.
    connection_config JSONB NOT NULL, -- encrypted connection details
    is_active BOOLEAN DEFAULT TRUE,
    test_query TEXT,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(20), -- success, failed, pending
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- METADATA TABLES
-- =====================================================

-- Database metadata discovery
CREATE TABLE database_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    database_name VARCHAR(255),
    schema_name VARCHAR(255),
    table_name VARCHAR(255) NOT NULL,
    table_type VARCHAR(50), -- table, view, materialized_view
    table_comment TEXT,
    row_count BIGINT,
    size_bytes BIGINT,
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Column metadata
CREATE TABLE column_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_metadata_id UUID NOT NULL REFERENCES database_metadata(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    column_position INTEGER,
    data_type VARCHAR(100),
    is_nullable BOOLEAN,
    default_value TEXT,
    column_comment TEXT,
    is_primary_key BOOLEAN DEFAULT FALSE,
    is_foreign_key BOOLEAN DEFAULT FALSE,
    foreign_key_table VARCHAR(255),
    foreign_key_column VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved queries for reusability
CREATE TABLE saved_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_text TEXT NOT NULL,
    data_source_id UUID NOT NULL REFERENCES data_sources(id),
    query_type VARCHAR(50), -- select, insert, update, delete, ddl
    is_public BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]',
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    avg_execution_time_ms INTEGER,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Data marts (logical data models)
CREATE TABLE data_marts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_source_id UUID NOT NULL REFERENCES data_sources(id),
    definition JSONB NOT NULL, -- tables, joins, filters, aggregations
    refresh_schedule VARCHAR(100), -- cron expression
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Visualizations (charts, graphs, etc.)
CREATE TABLE visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    visualization_type VARCHAR(100) NOT NULL, -- bar, line, pie, scatter, etc.
    data_source_id UUID REFERENCES data_sources(id),
    data_mart_id UUID REFERENCES data_marts(id),
    query_config JSONB NOT NULL, -- query definition
    chart_config JSONB NOT NULL, -- chart styling and options
    is_public BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    CONSTRAINT check_data_source_or_mart CHECK (
        (data_source_id IS NOT NULL AND data_mart_id IS NULL) OR
        (data_source_id IS NULL AND data_mart_id IS NOT NULL)
    )
);

-- Dashboards
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout_config JSONB NOT NULL DEFAULT '{}', -- grid layout configuration
    theme_id UUID, -- Will add FK constraint later
    filters_config JSONB DEFAULT '{}', -- dashboard-level filters
    mobile_layout JSONB DEFAULT '{}', -- mobile-specific layout
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Dashboard components (widgets on dashboards)
CREATE TABLE dashboard_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    visualization_id UUID REFERENCES visualizations(id),
    component_type VARCHAR(100) NOT NULL, -- chart, filter, text, image, iframe
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 4,
    height INTEGER NOT NULL DEFAULT 3,
    component_config JSONB NOT NULL DEFAULT '{}',
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- THEME & CHART LIBRARIES
-- =====================================================

-- Theme library for dashboard styling
CREATE TABLE theme_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    css_variables JSONB NOT NULL DEFAULT '{}', -- CSS custom properties
    component_styles JSONB DEFAULT '{}', -- component-specific styles
    color_palette JSONB NOT NULL DEFAULT '[]', -- array of colors
    typography JSONB DEFAULT '{}', -- font settings
    preview_image_url VARCHAR(500),
    source_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Chart library for reusable chart components
CREATE TABLE chart_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    chart_type VARCHAR(100) NOT NULL, -- bar, line, pie, custom, etc.
    config_schema JSONB NOT NULL DEFAULT '{}', -- JSON schema for configuration
    component_code TEXT NOT NULL, -- React/JS component code
    css_styles TEXT, -- custom CSS
    preview_image_url VARCHAR(500),
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- UPLOAD UTILITY TABLES
-- =====================================================

-- Upload templates (admin-defined file upload configurations)
CREATE TABLE upload_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_format VARCHAR(50) NOT NULL, -- csv, excel, json, parquet
    validation_rules JSONB DEFAULT '{}', -- validation configuration
    transformation_rules JSONB DEFAULT '{}', -- data transformation logic
    destination_type VARCHAR(50) NOT NULL, -- postgresql, mysql, bigquery
    destination_config JSONB NOT NULL, -- connection and table details
    table_name VARCHAR(255) NOT NULL,
    upload_mode VARCHAR(50) NOT NULL, -- truncate_load, delta, insert, upsert
    max_file_size_mb INTEGER DEFAULT 100,
    allowed_extensions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Upload history tracking
CREATE TABLE upload_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES upload_templates(id),
    file_name VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    file_hash VARCHAR(64), -- SHA-256 hash for deduplication
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- pending, processing, success, failed, cancelled
    error_log TEXT,
    processing_time_ms INTEGER,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- SCHEDULER TABLES
-- =====================================================

-- Scheduled jobs
CREATE TABLE scheduler_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(100) NOT NULL, -- dashboard_refresh, data_sync, report_generation, email_report
    schedule_expression VARCHAR(200) NOT NULL, -- cron expression
    target_resource_type VARCHAR(100), -- dashboard, data_source, visualization
    target_resource_id UUID,
    job_config JSONB DEFAULT '{}', -- job-specific configuration
    notification_config JSONB DEFAULT '{}', -- email, slack, webhook settings
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    consecutive_failures INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    timeout_minutes INTEGER DEFAULT 30,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Job execution history
CREATE TABLE scheduler_job_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES scheduler_jobs(id) ON DELETE CASCADE,
    run_id VARCHAR(100) NOT NULL, -- unique identifier for this run
    status VARCHAR(50) NOT NULL, -- pending, running, success, failed, timeout, cancelled
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    output_log TEXT,
    error_log TEXT,
    retry_count INTEGER DEFAULT 0,
    triggered_by VARCHAR(100), -- scheduler, manual, api
    triggered_by_user_id UUID REFERENCES users(id)
);

-- =====================================================
-- AUDIT & LOGGING TABLES
-- =====================================================

-- User activity audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    action_type VARCHAR(100) NOT NULL, -- login, logout, create, update, delete, view, export
    resource_type VARCHAR(100), -- user, dashboard, visualization, data_source
    resource_id UUID,
    resource_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    additional_data JSONB DEFAULT '{}'
);

-- Dashboard analytics and usage tracking
CREATE TABLE dashboard_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    action_type VARCHAR(100) NOT NULL, -- view, edit, share, export, filter, drill_down
    component_id UUID REFERENCES dashboard_components(id),
    duration_seconds INTEGER,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Query execution logs
CREATE TABLE query_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    data_source_id UUID REFERENCES data_sources(id),
    query_text TEXT NOT NULL,
    query_hash VARCHAR(64), -- SHA-256 hash for query deduplication
    execution_time_ms INTEGER,
    rows_returned INTEGER,
    bytes_processed BIGINT,
    status VARCHAR(50) NOT NULL, -- success, error, timeout, cancelled
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cache_hit BOOLEAN DEFAULT FALSE
);

-- Data source connection logs
CREATE TABLE data_source_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    connection_status VARCHAR(50) NOT NULL, -- success, failed, timeout
    response_time_ms INTEGER,
    error_message TEXT,
    tested_by UUID REFERENCES users(id),
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SETTINGS & CONFIGURATION TABLES
-- =====================================================

-- User preferences and settings
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(255) NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- System-wide configuration
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- whether setting is visible to non-admins
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Bookmarks for quick access
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL, -- dashboard, visualization, query, data_source
    resource_id UUID NOT NULL,
    resource_name VARCHAR(255),
    bookmark_name VARCHAR(255),
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved filters for reuse across dashboards
CREATE TABLE saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filter_config JSONB NOT NULL,
    data_source_id UUID REFERENCES data_sources(id),
    is_global BOOLEAN DEFAULT FALSE, -- can be used across multiple dashboards
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- RESOURCE PERMISSIONS (Granular Access Control)
-- =====================================================

-- Fine-grained resource permissions
CREATE TABLE resource_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(100) NOT NULL, -- dashboard, visualization, data_source, theme, chart
    resource_id UUID NOT NULL,
    principal_type VARCHAR(50) NOT NULL, -- user, role
    principal_id UUID NOT NULL,
    permission_type VARCHAR(50) NOT NULL, -- read, write, delete, share, admin
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================

-- Notifications for users
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL, -- info, warning, error, success
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- COMMENTS & COLLABORATION
-- =====================================================

-- Comments on dashboards and visualizations
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(100) NOT NULL, -- dashboard, visualization
    resource_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES comments(id), -- for threaded comments
    comment_text TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);

-- Data sources indexes
CREATE INDEX idx_data_sources_active ON data_sources(is_active);
CREATE INDEX idx_data_sources_type ON data_sources(connection_type);
CREATE INDEX idx_data_sources_created_by ON data_sources(created_by);

-- Database metadata indexes
CREATE INDEX idx_database_metadata_data_source ON database_metadata(data_source_id);
CREATE INDEX idx_database_metadata_table ON database_metadata(table_name);
CREATE INDEX idx_column_metadata_table ON column_metadata(table_metadata_id);

-- Dashboards indexes
CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX idx_dashboards_public ON dashboards(is_public);
CREATE INDEX idx_dashboards_featured ON dashboards(is_featured);
CREATE INDEX idx_dashboards_created_at ON dashboards(created_at);

-- Dashboard components indexes
CREATE INDEX idx_dashboard_components_dashboard ON dashboard_components(dashboard_id);
CREATE INDEX idx_dashboard_components_visualization ON dashboard_components(visualization_id);

-- Visualizations indexes
CREATE INDEX idx_visualizations_created_by ON visualizations(created_by);
CREATE INDEX idx_visualizations_data_source ON visualizations(data_source_id);
CREATE INDEX idx_visualizations_data_mart ON visualizations(data_mart_id);
CREATE INDEX idx_visualizations_type ON visualizations(visualization_type);

-- Upload history indexes
CREATE INDEX idx_upload_history_template ON upload_history(template_id);
CREATE INDEX idx_upload_history_uploaded_by ON upload_history(uploaded_by);
CREATE INDEX idx_upload_history_status ON upload_history(status);
CREATE INDEX idx_upload_history_uploaded_at ON upload_history(uploaded_at);

-- Scheduler indexes
CREATE INDEX idx_scheduler_jobs_active ON scheduler_jobs(is_active);
CREATE INDEX idx_scheduler_jobs_next_run ON scheduler_jobs(next_run_at);
CREATE INDEX idx_scheduler_job_runs_job_id ON scheduler_job_runs(job_id);
CREATE INDEX idx_scheduler_job_runs_status ON scheduler_job_runs(status);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Dashboard analytics indexes
CREATE INDEX idx_dashboard_analytics_dashboard ON dashboard_analytics(dashboard_id);
CREATE INDEX idx_dashboard_analytics_user ON dashboard_analytics(user_id);
CREATE INDEX idx_dashboard_analytics_timestamp ON dashboard_analytics(timestamp);
CREATE INDEX idx_dashboard_analytics_action ON dashboard_analytics(action_type);

-- Query execution logs indexes
CREATE INDEX idx_query_logs_user_id ON query_execution_logs(user_id);
CREATE INDEX idx_query_logs_data_source ON query_execution_logs(data_source_id);
CREATE INDEX idx_query_logs_executed_at ON query_execution_logs(executed_at);
CREATE INDEX idx_query_logs_hash ON query_execution_logs(query_hash);

-- Resource permissions indexes
CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_type, resource_id);
CREATE INDEX idx_resource_permissions_principal ON resource_permissions(principal_type, principal_id);
CREATE INDEX idx_resource_permissions_active ON resource_permissions(is_active);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Comments indexes
CREATE INDEX idx_comments_resource ON comments(resource_type, resource_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_by ON comments(created_by);

-- =====================================================
-- CONSTRAINTS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_database_metadata_updated_at BEFORE UPDATE ON database_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_column_metadata_updated_at BEFORE UPDATE ON column_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_queries_updated_at BEFORE UPDATE ON saved_queries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_marts_updated_at BEFORE UPDATE ON data_marts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visualizations_updated_at BEFORE UPDATE ON visualizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_components_updated_at BEFORE UPDATE ON dashboard_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theme_library_updated_at BEFORE UPDATE ON theme_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chart_library_updated_at BEFORE UPDATE ON chart_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upload_templates_updated_at BEFORE UPDATE ON upload_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduler_jobs_updated_at BEFORE UPDATE ON scheduler_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_filters_updated_at BEFORE UPDATE ON saved_filters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Check constraints
ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE upload_history ADD CONSTRAINT check_records_consistency CHECK (records_processed >= (records_success + records_failed));
ALTER TABLE scheduler_jobs ADD CONSTRAINT check_max_retries CHECK (max_retries >= 0 AND max_retries <= 10);
ALTER TABLE scheduler_jobs ADD CONSTRAINT check_timeout CHECK (timeout_minutes > 0 AND timeout_minutes <= 1440);
ALTER TABLE dashboard_analytics ADD CONSTRAINT check_duration CHECK (duration_seconds >= 0);
ALTER TABLE query_execution_logs ADD CONSTRAINT check_execution_time CHECK (execution_time_ms >= 0);
