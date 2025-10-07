# 🔐 DataMantri Access Management System Design

## Overview
Multi-tenant SaaS architecture with hierarchical role-based access control (RBAC)

## Access Hierarchy

```
DataMantri (Platform)
├── Super Admin (DataMantri Team)
│   └── Full platform access
│       └── Manage all organizations
│       └── Create organizations
│       └── Assign org admins
│       └── View all data (for support)
│
└── Organizations (Client Companies)
    ├── Organization Admin
    │   └── Full access to their organization
    │   └── Manage users in their org
    │   └── Assign roles
    │   └── Configure organization settings
    │
    ├── Developer/Creator
    │   └── Create & manage data sources
    │   └── Create & manage data marts
    │   └── Create & manage upload configurations
    │   └── Create & manage pipelines
    │   └── Create & manage dashboards
    │   └── Create & manage schedulers
    │   └── Cannot manage users
    │
    └── Viewer/Analyst
        └── View dashboards
        └── View schedulers
        └── View reports
        └── Execute queries (read-only)
        └── No create/edit/delete permissions
```

## Database Schema

### 1. Organizations Table
```sql
organizations:
  - id (UUID, PK)
  - name (String)
  - slug (String, Unique)
  - domain (String) - for email domain verification
  - logo_url (String)
  - plan_type (String) - free, professional, enterprise
  - max_users (Integer)
  - max_data_sources (Integer)
  - features (JSON) - enabled features for this org
  - is_active (Boolean)
  - created_at (DateTime)
  - created_by (UUID) - DataMantri super admin who created it
```

### 2. Roles Table (System-level & Org-level)
```sql
roles:
  - id (UUID, PK)
  - name (String) - super_admin, org_admin, developer, viewer
  - display_name (String)
  - description (Text)
  - level (String) - platform, organization
  - organization_id (UUID, nullable) - null for platform roles
  - is_system (Boolean) - true for default roles
  - created_at (DateTime)
```

### 3. Permissions Table
```sql
permissions:
  - id (UUID, PK)
  - resource (String) - datasources, datamarts, dashboards, etc.
  - action (String) - create, read, update, delete, manage
  - code (String, Unique) - datasources.create, dashboards.read
  - description (Text)
  - category (String) - data_management, analytics, admin
```

### 4. Role Permissions Mapping
```sql
role_permissions:
  - id (UUID, PK)
  - role_id (UUID, FK)
  - permission_id (UUID, FK)
```

### 5. User Roles Mapping
```sql
user_roles:
  - id (UUID, PK)
  - user_id (UUID, FK)
  - role_id (UUID, FK)
  - organization_id (UUID, FK)
  - granted_by (UUID) - who assigned this role
  - granted_at (DateTime)
```

### 6. Data Access Policies (Row-Level Security)
```sql
data_access_policies:
  - id (UUID, PK)
  - user_id (UUID, FK, nullable)
  - role_id (UUID, FK, nullable)
  - resource_type (String) - data_source, data_mart, dashboard
  - resource_id (UUID)
  - access_level (String) - full, read_only, restricted
  - conditions (JSON) - {column: value} for filtering
  - created_at (DateTime)
```

## Updated Existing Tables

All existing tables will be updated to include:
- `organization_id (UUID, FK)` - links resource to organization
- `created_by (UUID, FK)` - who created the resource

Tables to update:
- users
- data_sources
- data_marts
- dashboards
- upload_configurations
- schedulers

## Permission Structure

### Super Admin Permissions
- `platform.manage` - Full platform access
- `organizations.create`
- `organizations.read`
- `organizations.update`
- `organizations.delete`
- `organizations.manage_users`

### Org Admin Permissions
- `org.manage` - Full org access
- `org.manage_users`
- `org.manage_roles`
- All developer + viewer permissions

### Developer Permissions
- `datasources.create`
- `datasources.read`
- `datasources.update`
- `datasources.delete`
- `datamarts.create`
- `datamarts.read`
- `datamarts.update`
- `datamarts.delete`
- `dashboards.create`
- `dashboards.read`
- `dashboards.update`
- `dashboards.delete`
- `upload_configs.create`
- `upload_configs.read`
- `upload_configs.update`
- `upload_configs.delete`
- `schedulers.create`
- `schedulers.read`
- `schedulers.update`
- `schedulers.delete`
- `pipelines.create`
- `pipelines.read`
- `pipelines.update`
- `pipelines.delete`

### Viewer Permissions
- `dashboards.read`
- `datamarts.read` (for viewing only)
- `datasources.read` (metadata only)
- `schedulers.read`
- `reports.read`

## Implementation Phases

### Phase 1: Backend Models & Database
1. Create Organization model
2. Create Role model
3. Create Permission model
4. Create mapping tables
5. Update existing models with organization_id
6. Create seed data for default roles and permissions

### Phase 2: Backend Middleware & Decorators
1. Create permission checking middleware
2. Create decorators: @require_permission, @require_role
3. Create organization isolation middleware
4. Update existing endpoints with permission checks

### Phase 3: Backend API Endpoints
1. Organization management APIs
2. User management APIs (org-level)
3. Role management APIs
4. Permission assignment APIs
5. Data access policy APIs

### Phase 4: Frontend Access Management UI
1. Organization management page (super admin)
2. User management page (org admin)
3. Role management page
4. Permission matrix UI
5. Data access policy builder

### Phase 5: UI Access Control
1. Conditional rendering based on permissions
2. Hide/disable features based on role
3. Show appropriate navigation items
4. Filter data based on organization

## Security Considerations

1. **Organization Isolation**: Every query must filter by organization_id
2. **Permission Caching**: Cache user permissions for performance
3. **Audit Logging**: Log all permission changes
4. **Session Management**: Validate organization context in session
5. **API Security**: All endpoints must check permissions
6. **SQL Injection Prevention**: Use parameterized queries
7. **XSS Prevention**: Sanitize all inputs

## Migration Strategy

1. Add new tables (organizations, roles, permissions, etc.)
2. Create default organization for existing data
3. Add organization_id column to existing tables
4. Migrate existing users to default organization
5. Assign default roles based on current user.role
6. Update all queries to include organization filter

## Testing Checklist

- [ ] Super admin can create organizations
- [ ] Super admin can access all organizations
- [ ] Org admin can only see their organization
- [ ] Org admin can manage users in their org
- [ ] Developer can create resources
- [ ] Developer cannot manage users
- [ ] Viewer can only view, no edit
- [ ] Cross-organization data isolation
- [ ] Permission inheritance works correctly
- [ ] Role changes take effect immediately

## API Examples

```python
# Check permission
@require_permission('datasources.create')
def create_datasource():
    # Only users with this permission can access
    pass

# Check role
@require_role(['org_admin', 'developer'])
def manage_datasource():
    # Only these roles can access
    pass

# Get user's organization
@login_required
def get_my_data():
    org_id = current_user.organization_id
    data = DataSource.query.filter_by(organization_id=org_id).all()
    return data
```

## Frontend Examples

```typescript
// Check permission
if (hasPermission('dashboards.create')) {
  <Button>Create Dashboard</Button>
}

// Check role
if (hasRole('developer') || hasRole('org_admin')) {
  <SettingsMenu />
}

// Filter by organization
const dataSources = await api.get('/api/data-sources'); // Auto-filtered by org
```

## Next Steps

1. Review this design with the team
2. Implement Phase 1 (Backend Models)
3. Create migration scripts
4. Implement Phase 2 (Middleware)
5. Update existing endpoints
6. Implement Phase 3 (New APIs)
7. Implement Phase 4 (Frontend UI)
8. Testing & QA
9. Documentation

## Estimated Timeline

- Phase 1: 2 days
- Phase 2: 1 day
- Phase 3: 2 days
- Phase 4: 3 days
- Phase 5: 2 days
- Testing: 2 days
Total: ~12 days

---

This is a comprehensive access management system that will make DataMantri a true enterprise-ready SaaS platform! 🚀

