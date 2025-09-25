-- =====================================================
-- DataViz Platform - Initial Data and Seed Scripts
-- =====================================================
-- This script populates the database with essential
-- initial data required for the platform to function
-- =====================================================

-- Insert default system roles
INSERT INTO roles (id, name, description, permissions, is_system_role, is_active) VALUES
(
    uuid_generate_v4(),
    'super_admin',
    'Super Administrator with full system access',
    '["*"]'::jsonb,
    true,
    true
),
(
    uuid_generate_v4(),
    'admin',
    'Administrator with management privileges',
    '[
        "users:create", "users:read", "users:update", "users:delete",
        "roles:create", "roles:read", "roles:update", "roles:delete",
        "data_sources:create", "data_sources:read", "data_sources:update", "data_sources:delete",
        "dashboards:create", "dashboards:read", "dashboards:update", "dashboards:delete", "dashboards:share",
        "visualizations:create", "visualizations:read", "visualizations:update", "visualizations:delete", "visualizations:share",
        "themes:create", "themes:read", "themes:update", "themes:delete",
        "charts:create", "charts:read", "charts:update", "charts:delete",
        "uploads:create", "uploads:read", "uploads:update", "uploads:delete",
        "scheduler:create", "scheduler:read", "scheduler:update", "scheduler:delete",
        "analytics:read", "system:read", "system:update"
    ]'::jsonb,
    true,
    true
),
(
    uuid_generate_v4(),
    'editor',
    'Content Editor with dashboard and visualization management',
    '[
        "dashboards:create", "dashboards:read", "dashboards:update", "dashboards:delete", "dashboards:share",
        "visualizations:create", "visualizations:read", "visualizations:update", "visualizations:delete", "visualizations:share",
        "data_sources:read", "data_sources:test",
        "themes:read", "charts:read",
        "uploads:create", "uploads:read",
        "scheduler:create", "scheduler:read", "scheduler:update",
        "analytics:read"
    ]'::jsonb,
    true,
    true
),
(
    uuid_generate_v4(),
    'analyst',
    'Data Analyst with query and visualization capabilities',
    '[
        "dashboards:read", "dashboards:create", "dashboards:update",
        "visualizations:create", "visualizations:read", "visualizations:update", "visualizations:share",
        "data_sources:read", "data_sources:query",
        "queries:create", "queries:read", "queries:update", "queries:execute",
        "themes:read", "charts:read",
        "analytics:read"
    ]'::jsonb,
    true,
    true
),
(
    uuid_generate_v4(),
    'viewer',
    'Viewer with read-only access to dashboards',
    '[
        "dashboards:read",
        "visualizations:read",
        "themes:read", "charts:read"
    ]'::jsonb,
    true,
    true
),
(
    uuid_generate_v4(),
    'uploader',
    'Data Uploader with file upload capabilities',
    '[
        "uploads:create", "uploads:read",
        "dashboards:read",
        "visualizations:read",
        "data_sources:read"
    ]'::jsonb,
    true,
    true
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('app_name', '"DataViz Platform"', 'Application name displayed in the UI', true),
('app_version', '"1.0.0"', 'Current application version', true),
('max_upload_size_mb', '100', 'Maximum file upload size in MB', false),
('session_timeout_minutes', '480', 'User session timeout in minutes', false),
('enable_public_dashboards', 'true', 'Allow users to create public dashboards', false),
('enable_user_registration', 'false', 'Allow new user self-registration', false),
('default_theme_id', 'null', 'Default theme ID for new dashboards', true),
('query_timeout_seconds', '300', 'Default query execution timeout', false),
('max_dashboard_components', '50', 'Maximum components per dashboard', false),
('enable_comments', 'true', 'Enable commenting on dashboards and visualizations', true),
('enable_notifications', 'true', 'Enable notification system', true),
('backup_retention_days', '30', 'Number of days to retain database backups', false),
('log_retention_days', '90', 'Number of days to retain audit logs', false),
('analytics_retention_days', '365', 'Number of days to retain analytics data', false);

-- Insert default theme library entries
INSERT INTO theme_library (id, name, description, css_variables, color_palette, typography, is_public, is_default, is_active, created_by) VALUES
(
    uuid_generate_v4(),
    'DataViz Default',
    'Default theme for DataViz platform with professional styling',
    '{
        "--primary": "#3b82f6",
        "--primary-foreground": "#ffffff",
        "--secondary": "#f1f5f9",
        "--secondary-foreground": "#0f172a",
        "--background": "#ffffff",
        "--foreground": "#0f172a",
        "--muted": "#f8fafc",
        "--muted-foreground": "#64748b",
        "--accent": "#f1f5f9",
        "--accent-foreground": "#0f172a",
        "--destructive": "#ef4444",
        "--destructive-foreground": "#ffffff",
        "--border": "#e2e8f0",
        "--input": "#e2e8f0",
        "--ring": "#3b82f6",
        "--radius": "0.5rem"
    }'::jsonb,
    '["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]'::jsonb,
    '{
        "fontFamily": "Inter, system-ui, sans-serif",
        "fontSize": {
            "xs": "0.75rem",
            "sm": "0.875rem",
            "base": "1rem",
            "lg": "1.125rem",
            "xl": "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
            "4xl": "2.25rem"
        },
        "fontWeight": {
            "normal": "400",
            "medium": "500",
            "semibold": "600",
            "bold": "700"
        }
    }'::jsonb,
    true,
    true,
    true,
    (SELECT id FROM users WHERE email = 'system@dataviz.com' LIMIT 1)
),
(
    uuid_generate_v4(),
    'Dark Professional',
    'Professional dark theme for reduced eye strain',
    '{
        "--primary": "#6366f1",
        "--primary-foreground": "#ffffff",
        "--secondary": "#1e293b",
        "--secondary-foreground": "#f1f5f9",
        "--background": "#0f172a",
        "--foreground": "#f1f5f9",
        "--muted": "#1e293b",
        "--muted-foreground": "#94a3b8",
        "--accent": "#1e293b",
        "--accent-foreground": "#f1f5f9",
        "--destructive": "#ef4444",
        "--destructive-foreground": "#ffffff",
        "--border": "#334155",
        "--input": "#334155",
        "--ring": "#6366f1",
        "--radius": "0.5rem"
    }'::jsonb,
    '["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]'::jsonb,
    '{
        "fontFamily": "Inter, system-ui, sans-serif",
        "fontSize": {
            "xs": "0.75rem",
            "sm": "0.875rem",
            "base": "1rem",
            "lg": "1.125rem",
            "xl": "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
            "4xl": "2.25rem"
        }
    }'::jsonb,
    true,
    false,
    true,
    (SELECT id FROM users WHERE email = 'system@dataviz.com' LIMIT 1)
);

-- Insert default chart library entries
INSERT INTO chart_library (id, name, description, chart_type, config_schema, component_code, category, tags, is_public, is_active, created_by) VALUES
(
    uuid_generate_v4(),
    'Standard Bar Chart',
    'Basic vertical bar chart with customizable colors and labels',
    'bar',
    '{
        "type": "object",
        "properties": {
            "colors": {
                "type": "array",
                "items": {"type": "string"},
                "default": ["#3b82f6", "#8b5cf6", "#06b6d4"]
            },
            "showValues": {"type": "boolean", "default": true},
            "showLegend": {"type": "boolean", "default": true},
            "orientation": {"type": "string", "enum": ["vertical", "horizontal"], "default": "vertical"},
            "borderRadius": {"type": "number", "default": 4}
        }
    }'::jsonb,
    'const StandardBarChart = ({ data, config }) => {
        const { colors, showValues, showLegend, orientation, borderRadius } = config;
        // Implementation would go here
        return <div>Bar Chart Component</div>;
    };',
    'Basic Charts',
    '["bar", "chart", "basic", "standard"]'::jsonb,
    true,
    true,
    (SELECT id FROM users WHERE email = 'system@dataviz.com' LIMIT 1)
),
(
    uuid_generate_v4(),
    'Interactive Line Chart',
    'Line chart with hover interactions and zoom capabilities',
    'line',
    '{
        "type": "object",
        "properties": {
            "colors": {
                "type": "array",
                "items": {"type": "string"},
                "default": ["#3b82f6", "#8b5cf6"]
            },
            "showPoints": {"type": "boolean", "default": true},
            "showGrid": {"type": "boolean", "default": true},
            "enableZoom": {"type": "boolean", "default": true},
            "strokeWidth": {"type": "number", "default": 2}
        }
    }'::jsonb,
    'const InteractiveLineChart = ({ data, config }) => {
        const { colors, showPoints, showGrid, enableZoom, strokeWidth } = config;
        // Implementation would go here
        return <div>Line Chart Component</div>;
    };',
    'Basic Charts',
    '["line", "chart", "interactive", "time-series"]'::jsonb,
    true,
    true,
    (SELECT id FROM users WHERE email = 'system@dataviz.com' LIMIT 1)
),
(
    uuid_generate_v4(),
    'Donut Chart',
    'Modern donut chart with customizable inner radius and labels',
    'pie',
    '{
        "type": "object",
        "properties": {
            "colors": {
                "type": "array",
                "items": {"type": "string"},
                "default": ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"]
            },
            "innerRadius": {"type": "number", "default": 0.6},
            "showLabels": {"type": "boolean", "default": true},
            "showPercentages": {"type": "boolean", "default": true},
            "padAngle": {"type": "number", "default": 0.02}
        }
    }'::jsonb,
    'const DonutChart = ({ data, config }) => {
        const { colors, innerRadius, showLabels, showPercentages, padAngle } = config;
        // Implementation would go here
        return <div>Donut Chart Component</div>;
    };',
    'Basic Charts',
    '["pie", "donut", "chart", "circular"]'::jsonb,
    true,
    true,
    (SELECT id FROM users WHERE email = 'system@dataviz.com' LIMIT 1)
);

-- Insert sample upload templates
INSERT INTO upload_templates (id, name, description, file_format, validation_rules, transformation_rules, destination_type, destination_config, table_name, upload_mode, max_file_size_mb, allowed_extensions, is_active, created_by) VALUES
(
    uuid_generate_v4(),
    'Sales Data Upload',
    'Template for uploading monthly sales data',
    'csv',
    '{
        "required_columns": ["date", "product", "sales_amount", "region"],
        "data_types": {
            "date": "date",
            "product": "string",
            "sales_amount": "numeric",
            "region": "string"
        },
        "constraints": {
            "sales_amount": {"min": 0},
            "region": {"enum": ["North", "South", "East", "West"]}
        }
    }'::jsonb,
    '{
        "date_format": "YYYY-MM-DD",
        "currency_columns": ["sales_amount"],
        "uppercase_columns": ["region"]
    }'::jsonb,
    'postgresql',
    '{
        "table_name": "sales_data",
        "schema": "public",
        "connection": "default"
    }'::jsonb,
    'sales_data',
    'upsert',
    50,
    '["csv", "xlsx"]'::jsonb,
    true,
    (SELECT id FROM users WHERE email = 'admin@dataviz.com' LIMIT 1)
),
(
    uuid_generate_v4(),
    'Customer Data Import',
    'Template for importing customer information',
    'excel',
    '{
        "required_columns": ["customer_id", "name", "email", "signup_date"],
        "data_types": {
            "customer_id": "string",
            "name": "string",
            "email": "email",
            "signup_date": "date"
        },
        "unique_columns": ["customer_id", "email"]
    }'::jsonb,
    '{
        "email_validation": true,
        "name_capitalization": "title_case"
    }'::jsonb,
    'postgresql',
    '{
        "table_name": "customers",
        "schema": "public",
        "connection": "default"
    }'::jsonb,
    'customers',
    'insert',
    25,
    '["xlsx", "xls"]'::jsonb,
    true,
    (SELECT id FROM users WHERE email = 'admin@dataviz.com' LIMIT 1)
);

-- Insert sample scheduler jobs
INSERT INTO scheduler_jobs (id, name, description, job_type, schedule_expression, target_resource_type, job_config, notification_config, is_active, created_by) VALUES
(
    uuid_generate_v4(),
    'Daily Analytics Refresh',
    'Refresh dashboard analytics data every day at 2 AM',
    'analytics_refresh',
    '0 2 * * *',
    'system',
    '{
        "refresh_type": "incremental",
        "tables": ["dashboard_analytics", "query_execution_logs"],
        "retention_days": 90
    }'::jsonb,
    '{
        "email": {
            "enabled": true,
            "recipients": ["admin@dataviz.com"],
            "on_failure": true,
            "on_success": false
        }
    }'::jsonb,
    true,
    (SELECT id FROM users WHERE email = 'admin@dataviz.com' LIMIT 1)
),
(
    uuid_generate_v4(),
    'Weekly Usage Report',
    'Generate and email weekly platform usage report',
    'report_generation',
    '0 9 * * 1',
    'system',
    '{
        "report_type": "usage_summary",
        "include_charts": true,
        "date_range": "last_7_days",
        "format": "pdf"
    }'::jsonb,
    '{
        "email": {
            "enabled": true,
            "recipients": ["admin@dataviz.com", "management@dataviz.com"],
            "subject": "Weekly DataViz Usage Report",
            "on_failure": true,
            "on_success": true
        }
    }'::jsonb,
    true,
    (SELECT id FROM users WHERE email = 'admin@dataviz.com' LIMIT 1)
);

-- Create system user for automated processes (if not exists)
INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_active, email_verified)
SELECT 
    uuid_generate_v4(),
    'system@dataviz.com',
    '$2b$12$system.hash.placeholder', -- This should be replaced with actual hash
    'System',
    'User',
    true,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'system@dataviz.com');

-- Update theme library entries to use system user ID
UPDATE theme_library 
SET created_by = (SELECT id FROM users WHERE email = 'system@dataviz.com' LIMIT 1)
WHERE created_by IS NULL;

UPDATE chart_library 
SET created_by = (SELECT id FROM users WHERE email = 'system@dataviz.com' LIMIT 1)
WHERE created_by IS NULL;

-- Create default admin user (password: admin123 - should be changed in production)
INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_active, email_verified)
SELECT 
    uuid_generate_v4(),
    'admin@dataviz.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', -- admin123
    'Admin',
    'User',
    true,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@dataviz.com');

-- Assign super_admin role to admin user
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT 
    u.id,
    r.id,
    u.id
FROM users u, roles r
WHERE u.email = 'admin@dataviz.com' 
  AND r.name = 'super_admin'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- Update upload templates to use admin user ID
UPDATE upload_templates 
SET created_by = (SELECT id FROM users WHERE email = 'admin@dataviz.com' LIMIT 1)
WHERE created_by IS NULL;

UPDATE scheduler_jobs 
SET created_by = (SELECT id FROM users WHERE email = 'admin@dataviz.com' LIMIT 1)
WHERE created_by IS NULL;

-- Insert sample user preferences for admin user
INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT 
    u.id,
    'dashboard_refresh_interval',
    '300'::jsonb
FROM users u
WHERE u.email = 'admin@dataviz.com'
  AND NOT EXISTS (
      SELECT 1 FROM user_preferences up 
      WHERE up.user_id = u.id AND up.preference_key = 'dashboard_refresh_interval'
  );

INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT 
    u.id,
    'default_chart_colors',
    '["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]'::jsonb
FROM users u
WHERE u.email = 'admin@dataviz.com'
  AND NOT EXISTS (
      SELECT 1 FROM user_preferences up 
      WHERE up.user_id = u.id AND up.preference_key = 'default_chart_colors'
  );

INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT 
    u.id,
    'timezone',
    '"UTC"'::jsonb
FROM users u
WHERE u.email = 'admin@dataviz.com'
  AND NOT EXISTS (
      SELECT 1 FROM user_preferences up 
      WHERE up.user_id = u.id AND up.preference_key = 'timezone'
  );

-- Set default theme in system settings
UPDATE system_settings 
SET setting_value = (
    SELECT to_jsonb(id::text) 
    FROM theme_library 
    WHERE name = 'DataViz Default' 
    LIMIT 1
)
WHERE setting_key = 'default_theme_id';

-- Create sample notification for admin user
INSERT INTO notifications (user_id, notification_type, title, message, action_url, action_label)
SELECT 
    u.id,
    'info',
    'Welcome to DataViz Platform',
    'Your DataViz platform has been successfully set up. Start by creating your first dashboard or connecting a data source.',
    '/dashboards/new',
    'Create Dashboard'
FROM users u
WHERE u.email = 'admin@dataviz.com'
  AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = u.id AND n.title = 'Welcome to DataViz Platform'
  );
