-- DataViz Platform Extended Database Schema
-- New tables for comprehensive platform features

-- Upload Templates (Admin creates file upload configurations)
CREATE TABLE upload_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    file_format VARCHAR(20) NOT NULL, -- csv, excel, json
    validation_rules TEXT, -- JSON with validation rules
    transformation_rules TEXT, -- JSON with transformation logic
    destination_type VARCHAR(20) NOT NULL, -- postgres, mysql, sqlite
    destination_config TEXT NOT NULL, -- JSON with DB connection details
    table_name VARCHAR(100) NOT NULL,
    upload_mode VARCHAR(20) NOT NULL, -- truncate_load, delta, insert, upsert
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- Upload History (Track all file uploads)
CREATE TABLE upload_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    records_processed INTEGER,
    records_success INTEGER,
    records_failed INTEGER,
    status VARCHAR(20) NOT NULL, -- pending, processing, success, failed
    error_log TEXT,
    uploaded_by INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (template_id) REFERENCES upload_templates(id),
    FOREIGN KEY (uploaded_by) REFERENCES user(id)
);

-- Chart Library (Reusable chart components)
CREATE TABLE chart_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50) NOT NULL, -- bar, line, pie, custom
    config_schema TEXT NOT NULL, -- JSON schema for configuration
    component_code TEXT NOT NULL, -- React component code
    css_styles TEXT, -- Custom CSS
    preview_image VARCHAR(255),
    category VARCHAR(50),
    tags TEXT, -- JSON array of tags
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- Theme Library (Reusable themes)
CREATE TABLE theme_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    css_variables TEXT NOT NULL, -- JSON with CSS custom properties
    component_styles TEXT, -- JSON with component-specific styles
    color_palette TEXT NOT NULL, -- JSON array of colors
    typography TEXT, -- JSON with font settings
    preview_image VARCHAR(255),
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- Dashboard Analytics (Usage tracking)
CREATE TABLE dashboard_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dashboard_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- view, edit, share, export
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    FOREIGN KEY (dashboard_id) REFERENCES dashboard(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Access Control (Role-based permissions)
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT NOT NULL, -- JSON array of permissions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    granted_by INTEGER NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (granted_by) REFERENCES user(id),
    UNIQUE(user_id, role_id)
);

-- Resource Permissions (Granular access control)
CREATE TABLE resource_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_type VARCHAR(50) NOT NULL, -- dashboard, datasource, theme, chart
    resource_id INTEGER NOT NULL,
    user_id INTEGER,
    role_id INTEGER,
    permission_type VARCHAR(20) NOT NULL, -- read, write, delete, share
    granted_by INTEGER NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (granted_by) REFERENCES user(id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Scheduler Jobs
CREATE TABLE scheduler_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    job_type VARCHAR(50) NOT NULL, -- dashboard_refresh, data_sync, report_generation
    schedule_expression VARCHAR(100) NOT NULL, -- cron expression
    target_resource_type VARCHAR(50), -- dashboard, datasource
    target_resource_id INTEGER,
    config TEXT, -- JSON configuration
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at DATETIME,
    next_run_at DATETIME,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- Scheduler Job Runs (Execution history)
CREATE TABLE scheduler_job_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending, running, success, failed
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_seconds INTEGER,
    output_log TEXT,
    error_log TEXT,
    FOREIGN KEY (job_id) REFERENCES scheduler_jobs(id)
);

-- Dashboard Components (For drag-drop builder)
CREATE TABLE dashboard_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dashboard_id INTEGER NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- chart, filter, text, image
    chart_library_id INTEGER, -- Reference to chart library if applicable
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 4,
    height INTEGER NOT NULL DEFAULT 3,
    config TEXT NOT NULL, -- JSON configuration
    data_source_id INTEGER,
    query_config TEXT, -- JSON with query configuration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dashboard_id) REFERENCES dashboard(id),
    FOREIGN KEY (chart_library_id) REFERENCES chart_library(id),
    FOREIGN KEY (data_source_id) REFERENCES data_source(id)
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES 
('admin', 'Full system access', '["*"]'),
('editor', 'Create and edit dashboards', '["dashboard:create", "dashboard:edit", "dashboard:view", "datasource:view", "theme:view", "chart:view"]'),
('viewer', 'View dashboards only', '["dashboard:view"]'),
('uploader', 'Upload data files', '["upload:create", "upload:view", "dashboard:view"]');

-- Update existing user table to add more fields
ALTER TABLE user ADD COLUMN first_name VARCHAR(50);
ALTER TABLE user ADD COLUMN last_name VARCHAR(50);
ALTER TABLE user ADD COLUMN avatar_url VARCHAR(255);
ALTER TABLE user ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE user ADD COLUMN last_login_at DATETIME;
ALTER TABLE user ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Update dashboard table for enhanced features
ALTER TABLE dashboard ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE dashboard ADD COLUMN theme_library_id INTEGER;
ALTER TABLE dashboard ADD COLUMN grid_config TEXT; -- JSON for grid layout configuration
ALTER TABLE dashboard ADD COLUMN filters_config TEXT; -- JSON for dashboard-level filters
ALTER TABLE dashboard ADD COLUMN mobile_layout TEXT; -- JSON for mobile-specific layout

-- Add foreign key for theme library
-- ALTER TABLE dashboard ADD FOREIGN KEY (theme_library_id) REFERENCES theme_library(id);
