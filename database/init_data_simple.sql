-- DataViz Platform - Initial Seed Data
-- Insert default system roles
INSERT INTO roles (id, name, description, permissions, is_system_role, is_active) VALUES
(uuid_generate_v4(), 'super_admin', 'Super Administrator with full system access', '["*"]'::jsonb, true, true),
(uuid_generate_v4(), 'admin', 'Administrator with management privileges', '["users:*", "roles:*", "dashboards:*", "data_sources:*", "analytics:*"]'::jsonb, true, true),
(uuid_generate_v4(), 'editor', 'Content Editor with dashboard management', '["dashboards:*", "visualizations:*", "themes:read", "charts:read"]'::jsonb, true, true),
(uuid_generate_v4(), 'analyst', 'Data Analyst with query capabilities', '["dashboards:read", "visualizations:*", "data_sources:read"]'::jsonb, true, true),
(uuid_generate_v4(), 'viewer', 'Viewer with read-only access', '["dashboards:read", "visualizations:read"]'::jsonb, true, true),
(uuid_generate_v4(), 'uploader', 'Data Uploader with file upload capabilities', '["uploads:*", "dashboards:read"]'::jsonb, true, true);

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('app_name', '"DataViz Platform"', 'Application name', true),
('app_version', '"1.0.0"', 'Application version', true),
('max_upload_size_mb', '100', 'Maximum file upload size in MB', false),
('session_timeout_minutes', '480', 'User session timeout in minutes', false),
('enable_public_dashboards', 'true', 'Allow public dashboards', false),
('query_timeout_seconds', '300', 'Query execution timeout', false);

-- Create system user for automated processes
INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_active, email_verified)
VALUES (uuid_generate_v4(), 'system@dataviz.com', '$2b$12$system.hash.placeholder', 'System', 'User', true, true, true);

-- Create default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, is_active, email_verified)
VALUES (uuid_generate_v4(), 'admin@dataviz.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'Admin', 'User', true, true, true);

-- Get the admin user ID for role assignment
DO $$
DECLARE
    admin_user_id UUID;
    super_admin_role_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@dataviz.com';
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
    
    INSERT INTO user_roles (user_id, role_id, granted_by)
    VALUES (admin_user_id, super_admin_role_id, admin_user_id);
END $$;

-- Insert default themes
INSERT INTO theme_library (id, name, description, css_variables, color_palette, is_public, is_default, is_active, created_by) 
SELECT 
    uuid_generate_v4(),
    'DataViz Default',
    'Default theme for DataViz platform',
    '{"--primary": "#3b82f6", "--background": "#ffffff", "--foreground": "#0f172a"}'::jsonb,
    '["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]'::jsonb,
    true,
    true,
    true,
    u.id
FROM users u WHERE u.email = 'system@dataviz.com' LIMIT 1;

INSERT INTO theme_library (id, name, description, css_variables, color_palette, is_public, is_default, is_active, created_by)
SELECT 
    uuid_generate_v4(),
    'Dark Professional',
    'Professional dark theme',
    '{"--primary": "#6366f1", "--background": "#0f172a", "--foreground": "#f1f5f9"}'::jsonb,
    '["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]'::jsonb,
    true,
    false,
    true,
    u.id
FROM users u WHERE u.email = 'system@dataviz.com' LIMIT 1;

-- Insert default chart library entries
INSERT INTO chart_library (id, name, description, chart_type, config_schema, component_code, category, tags, is_public, is_active, created_by)
SELECT 
    uuid_generate_v4(),
    'Standard Bar Chart',
    'Basic vertical bar chart with customizable colors',
    'bar',
    '{"colors": ["#3b82f6", "#8b5cf6", "#06b6d4"], "showValues": true}'::jsonb,
    'const StandardBarChart = ({ data, config }) => { return <div>Bar Chart</div>; };',
    'Basic Charts',
    '["bar", "chart", "basic"]'::jsonb,
    true,
    true,
    u.id
FROM users u WHERE u.email = 'system@dataviz.com' LIMIT 1;

INSERT INTO chart_library (id, name, description, chart_type, config_schema, component_code, category, tags, is_public, is_active, created_by)
SELECT 
    uuid_generate_v4(),
    'Interactive Line Chart',
    'Line chart with hover interactions',
    'line',
    '{"colors": ["#3b82f6", "#8b5cf6"], "showPoints": true}'::jsonb,
    'const InteractiveLineChart = ({ data, config }) => { return <div>Line Chart</div>; };',
    'Basic Charts',
    '["line", "chart", "interactive"]'::jsonb,
    true,
    true,
    u.id
FROM users u WHERE u.email = 'system@dataviz.com' LIMIT 1;

-- Insert sample upload template
INSERT INTO upload_templates (id, name, description, file_format, validation_rules, destination_type, destination_config, table_name, upload_mode, created_by)
SELECT 
    uuid_generate_v4(),
    'Sales Data Upload',
    'Template for uploading sales data',
    'csv',
    '{"required_columns": ["date", "product", "sales_amount"]}'::jsonb,
    'postgresql',
    '{"table_name": "sales_data", "schema": "public"}'::jsonb,
    'sales_data',
    'upsert',
    u.id
FROM users u WHERE u.email = 'admin@dataviz.com' LIMIT 1;
