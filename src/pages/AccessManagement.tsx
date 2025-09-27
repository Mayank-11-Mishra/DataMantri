import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, Shield, Key, UserPlus, Settings, 
  Edit, Trash2, Eye, Lock, Unlock, Building
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  policies: { id: string; name: string; }[];
  is_system_role: boolean;
  created_at: string;
}

type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: UserRole;
  organization_id?: string;
  organization_name?: string;
  last_login: string;
  created_at: string;
}

interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  resource_type: string;
  resource_id: string;
  filter_condition: string;
  is_active: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const AccessManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [accessPolicies, setAccessPolicies] = useState<AccessPolicy[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string; logo_url: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<{ id: number; name: string }[]>([]);
  const [dataMarts, setDataMarts] = useState<{ id: number; name: string }[]>([]);

  // Form states
  const [organizationForm, setOrganizationForm] = useState({ name: '', logo_url: '' });
  const [userForm, setUserForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'viewer' as UserRole,
    organization_id: ''
  });

  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    resource_type: 'datamart',
    resource_id: '',
    filter_condition: ''
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: {} as Record<string, boolean>,
    policy_ids: [] as string[]
  });

  // Feature Access editing state
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [featurePermissions, setFeaturePermissions] = useState<Record<string, boolean>>({});

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchRoles();
      fetchPermissions();
      fetchAccessPolicies();
      fetchDataSources();
      fetchDataMarts();
      fetchOrganizations();
    }
  }, [isAdmin]);

  const fetchDataSources = async () => {
    try {
      const res = await fetch('/api/data-sources', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const list = await res.json();
        console.log('Data sources response:', list);
        const normalized = (Array.isArray(list) ? list : []).map((ds: any) => ({ id: ds.id, name: String(ds.name || '').trim() }))
          .filter((d: any) => d.name);
        setDataSources(normalized);
      } else {
        console.error('Data sources fetch failed:', res.status);
        toast({ title: 'Error', description: 'Failed to load data sources', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Failed to fetch data sources:', e);
      toast({ title: 'Error', description: 'Failed to fetch data sources', variant: 'destructive' });
    }
  };

  const fetchDataMarts = async () => {
    try {
      const res = await fetch('/api/data-marts', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const list = await res.json();
        console.log('Data marts response:', list);
        const normalized = (Array.isArray(list) ? list : []).map((dm: any) => ({ id: dm.id, name: String(dm.name || dm.title || '').trim() }))
          .filter((d: any) => d.name);
        setDataMarts(normalized);
      } else {
        console.error('Data marts fetch failed:', res.status);
        toast({ title: 'Error', description: 'Failed to load data marts', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Failed to fetch data marts:', e);
      toast({ title: 'Error', description: 'Failed to fetch data marts', variant: 'destructive' });
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setRoles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        console.log('Permissions response:', data);
        setPermissions(Array.isArray(data) ? data : []);
      } else {
        console.error('Permissions fetch failed:', response.status);
        toast({ title: 'Error', description: 'Failed to load permissions', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      toast({ title: 'Error', description: 'Failed to fetch permissions', variant: 'destructive' });
    }
  };

  const fetchAccessPolicies = async () => {
    try {
      const response = await fetch('/api/access-policies', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAccessPolicies(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const createOrganization = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(organizationForm)
      });
      
      if (response.ok) {
        fetchOrganizations();
        setOrganizationForm({ name: '', logo_url: '' });
        toast({ title: 'Success', description: 'Organization created successfully.' });
      } else {
        const errorData = await response.json();
        toast({ title: 'Error', description: `Failed to create organization: ${errorData.message}`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userForm)
      });
      
      if (response.ok) {
        fetchUsers();
        setUserForm({
          email: '',
          first_name: '',
          last_name: '',
          role: 'viewer' as UserRole,
          organization_id: ''
        });
        toast({ title: 'Success', description: 'User created successfully.' });
      } else {
        const errorData = await response.json();
        toast({ title: 'Error', description: `Failed to create user: ${errorData.message}`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAccessPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/access-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(policyForm)
      });
      
      if (response.ok) {
        fetchAccessPolicies();
        setPolicyForm({
          name: '',
          description: '',
          resource_type: 'datamart',
          resource_id: '',
          filter_condition: ''
        });
      }
    } catch (error) {
      console.error('Failed to create access policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(roleForm)
      });
      
      if (response.ok) {
        fetchRoles();
        setRoleForm({
          name: '',
          description: '',
          permissions: {},
          policy_ids: []
        });
      }
    } catch (error) {
      console.error('Failed to create role:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !isActive })
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for your DataMantri platform
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="organizations">Organizations</TabsTrigger>}
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="data-access">Data Access</TabsTrigger>
          <TabsTrigger value="feature-access">Feature Access</TabsTrigger>
        </TabsList>

        {/* Organizations Management (Super Admin only) */}
        {isSuperAdmin && (
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Create New Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="org_name">Organization Name</Label>
                    <Input id="org_name" value={organizationForm.name} onChange={(e) => setOrganizationForm({...organizationForm, name: e.target.value})} placeholder="New Organization Inc." />
                  </div>
                  <div>
                    <Label htmlFor="org_logo">Logo URL</Label>
                    <Input id="org_logo" value={organizationForm.logo_url} onChange={(e) => setOrganizationForm({...organizationForm, logo_url: e.target.value})} placeholder="https://example.com/logo.png" />
                  </div>
                </div>
                <Button onClick={createOrganization} disabled={loading}>{loading ? 'Creating...' : 'Create Organization'}</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>All Organizations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {organizations.map(org => (
                    <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="font-medium">{org.name}</div>
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Users Management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New User
              </CardTitle>
              <CardDescription>
                Create a new user account and assign roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} placeholder="user@example.com" />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value as UserRole})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isSuperAdmin && (
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Select value={userForm.organization_id} onValueChange={(value) => setUserForm({...userForm, organization_id: value})}>
                    <SelectTrigger><SelectValue placeholder="Select an organization" /></SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" value={userForm.first_name} onChange={(e) => setUserForm({...userForm, first_name: e.target.value})} placeholder="John" />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" value={userForm.last_name} onChange={(e) => setUserForm({...userForm, last_name: e.target.value})} placeholder="Doe" />
                </div>
              </div>

              <Button onClick={createUser} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium">{user.first_name} {user.last_name}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">{user.role.replace('_', ' ')}</Badge>
                          {user.organization_name && <Badge variant="outline" className="text-xs">{user.organization_name}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                      />
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Access (per role permissions editing) */}
        <TabsContent value="feature-access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Feature Access Controls
              </CardTitle>
              <CardDescription>
                Modify permissions for existing roles. This directly changes what features each role can access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select value={selectedRoleId ? String(selectedRoleId) : ''} onValueChange={(v) => {
                    const id = v;
                    setSelectedRoleId(id);
                    const role = roles.find(r => r.id === id);
                    setFeaturePermissions(role?.permissions || {});
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedRoleId && (
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 capitalize">{category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {perms.map((permission) => (
                          <label key={permission.id} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              id={`feat-${permission.id}`}
                              checked={!!featurePermissions[permission.id]}
                              onCheckedChange={(checked) => {
                                setFeaturePermissions(prev => ({ ...prev, [permission.id]: !!checked }));
                              }}
                            />
                            <span className="text-sm">{permission.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button
                      disabled={loading}
                      onClick={async () => {
                        if (!selectedRoleId) return;
                        try {
                          setLoading(true);
                          const resp = await fetch(`/api/roles/${selectedRoleId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ permissions: featurePermissions })
                          });
                          if (resp.ok) {
                            fetchRoles();
                            toast({ title: 'Success', description: 'Feature access updated' });
                          } else {
                            toast({ title: 'Error', description: 'Failed to save feature access', variant: 'destructive' });
                          }
                        } catch (e) {
                          console.error('Failed to update role permissions', e);
                          toast({ title: 'Error', description: 'Failed to save feature access', variant: 'destructive' });
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Feature Access'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Management */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create New Role Template
              </CardTitle>
              <CardDescription>
                Create role templates with default permissions that can be assigned to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role_name">Role Name</Label>
                <Input
                  id="role_name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                  placeholder="Data Analyst"
                />
              </div>

              <div>
                <Label htmlFor="role_description">Description</Label>
                <Textarea
                  id="role_description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                  placeholder="Role description..."
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="space-y-4 mt-2">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 capitalize">{category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {perms.map((permission) => (
                          <label key={permission.id} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              id={`perm-${permission.id}`}
                              checked={!!roleForm.permissions[permission.id]}
                              onCheckedChange={(checked) => {
                                setRoleForm(prev => ({
                                  ...prev,
                                  permissions: {
                                    ...prev.permissions,
                                    [permission.id]: !!checked
                                  }
                                }));
                              }}
                            />
                            <span className="text-sm">{permission.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Label>Assign Data Access Policies</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {accessPolicies.map((policy) => (
                    <label key={policy.id} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        id={`policy-${policy.id}`}
                        checked={roleForm.policy_ids.includes(policy.id)}
                        onCheckedChange={(checked) => {
                          setRoleForm(prev => ({
                            ...prev,
                            policy_ids: checked
                              ? [...prev.policy_ids, policy.id]
                              : prev.policy_ids.filter(id => id !== policy.id)
                          }));
                        }}
                      />
                      <span className="text-sm">{policy.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={createRole} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Role'}
              </Button>
            </CardContent>
          </Card>

          {/* Roles List */}
          <Card>
            <CardHeader>
              <CardTitle>Role Templates</CardTitle>
              <CardDescription>
                These are role templates that can be assigned to users. Use Feature Access tab to modify permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <Card key={role.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{role.name}</h4>
                        {role.is_system_role && (
                          <Badge variant="outline">System</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(role.permissions).filter(p => role.permissions[p]).slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permissions.find(p => p.id === permission)?.name || permission}
                          </Badge>
                        ))}
                        {Object.keys(role.permissions).filter(p => role.permissions[p]).length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{Object.keys(role.permissions).filter(p => role.permissions[p]).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Access Management */}
        <TabsContent value="data-access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Create New Data Access Policy
              </CardTitle>
              <CardDescription>
                Define row-level and dataset-level security policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="policy_name">Policy Name</Label>
                    <Input id="policy_name" value={policyForm.name} onChange={(e) => setPolicyForm({...policyForm, name: e.target.value})} placeholder="e.g., Salesman Own Data" />
                  </div>
                  <div>
                    <Label htmlFor="resource_type">Resource Type</Label>
                    <Select value={policyForm.resource_type} onValueChange={(value) => setPolicyForm({...policyForm, resource_type: value})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="datamart">Data Mart</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="datasource">Data Source</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="policy_description">Description</Label>
                  <Textarea id="policy_description" value={policyForm.description} onChange={(e) => setPolicyForm({...policyForm, description: e.target.value})} placeholder="Policy description..." />
                </div>
                {policyForm.resource_type === 'datasource' && (
                  <div>
                    <Label>Data Source</Label>
                    <Select value={policyForm.resource_id} onValueChange={(v) => setPolicyForm({...policyForm, resource_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select data source" /></SelectTrigger>
                      <SelectContent>
                        {dataSources.map(ds => (
                          <SelectItem key={ds.id} value={String(ds.id)}>{ds.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {policyForm.resource_type === 'datamart' && (
                  <div>
                    <Label>Data Mart</Label>
                    <Select value={policyForm.resource_id} onValueChange={(v) => setPolicyForm({...policyForm, resource_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select data mart" /></SelectTrigger>
                      <SelectContent>
                        {dataMarts.map(dm => (
                          <SelectItem key={dm.id} value={String(dm.id)}>{dm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {policyForm.resource_type === 'table' && (
                  <div>
                    <Label htmlFor="resource_id">Table Name</Label>
                    <Input id="resource_id" value={policyForm.resource_id} onChange={(e) => setPolicyForm({...policyForm, resource_id: e.target.value})} placeholder="e.g., public.sales" />
                  </div>
                )}
                <div>
                  <Label htmlFor="filter_condition">Filter Condition</Label>
                  <Input id="filter_condition" value={policyForm.filter_condition} onChange={(e) => setPolicyForm({...policyForm, filter_condition: e.target.value})} placeholder="e.g., user_id = '{user_id}'" />
                </div>
                <Button onClick={async () => {
                  try {
                    await createAccessPolicy();
                    toast({ title: 'Success', description: 'Access policy created' });
                  } catch (e) {
                    toast({ title: 'Error', description: 'Failed to create policy', variant: 'destructive' });
                  }
                }} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Policy'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Data Access Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accessPolicies.map(policy => (
                  <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{policy.name}</p>
                      <p className="text-sm text-muted-foreground">{policy.description}</p>
                      <code className="text-xs bg-muted px-1 rounded mt-1 inline-block">{policy.filter_condition}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Overview */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                System Permissions
              </CardTitle>
              <CardDescription>
                Overview of all available permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {perms.map((permission) => (
                        <Card key={permission.id}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{permission.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessManagement;
