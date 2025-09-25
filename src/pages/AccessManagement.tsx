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
  Edit, Trash2, Eye, Lock, Unlock 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  policies: { id: number; name: string; }[];
  is_system_role: boolean;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_admin: boolean;
  roles: Role[];
  last_login: string;
  created_at: string;
}

interface AccessPolicy {
  id: number;
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
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [accessPolicies, setAccessPolicies] = useState<AccessPolicy[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role_ids: [] as number[]
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
    policy_ids: [] as number[]
  });

  const isAdmin = user?.is_admin || false;

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchRoles();
      fetchPermissions();
      fetchAccessPolicies();
    }
  }, [isAdmin]);

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
        setPermissions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
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
          role_ids: []
        });
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
          policy_ids: [] as number[]
        });
      }
    } catch (error) {
      console.error('Failed to create role:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
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
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="data-access">Data Access</TabsTrigger>
          <TabsTrigger value="feature-access">Feature Access</TabsTrigger>
        </TabsList>

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
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label>Assign Roles</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userForm.role_ids.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUserForm({
                              ...userForm,
                              role_ids: [...userForm.role_ids, role.id]
                            });
                          } else {
                            setUserForm({
                              ...userForm,
                              role_ids: userForm.role_ids.filter(id => id !== role.id)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
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
                          {user.roles?.map((role) => (
                            <Badge key={role.id} variant="secondary" className="text-xs">
                              {role.name}
                            </Badge>
                          )) || <Badge variant="outline" className="text-xs">No Roles</Badge>}
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

        {/* Roles Management */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create New Role
              </CardTitle>
              <CardDescription>
                Define a new role with specific permissions
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
              <CardTitle>Existing Roles</CardTitle>
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
                <div>
                  <Label htmlFor="resource_id">Resource ID/Name</Label>
                  <Input id="resource_id" value={policyForm.resource_id} onChange={(e) => setPolicyForm({...policyForm, resource_id: e.target.value})} placeholder="e.g., finance_datamart or sales_table" />
                </div>
                <div>
                  <Label htmlFor="filter_condition">Filter Condition</Label>
                  <Input id="filter_condition" value={policyForm.filter_condition} onChange={(e) => setPolicyForm({...policyForm, filter_condition: e.target.value})} placeholder="e.g., user_id = '{user_id}'" />
                </div>
                <Button onClick={createAccessPolicy} disabled={loading} className="w-full">
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
