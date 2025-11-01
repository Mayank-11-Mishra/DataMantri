import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  TestTube2,
  Mail,
  MessageSquare,
  Send,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity,
  Database,
  BarChart3,
  GitBranch,
  Timer,
  Zap,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Alert {
  id: string;
  name: string;
  description?: string;
  condition_type: string;
  condition_config: Record<string, any>;
  channels: string[];
  recipients: Record<string, any>;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DataSource {
  id: string;
  name: string;
}

interface Pipeline {
  id: string;
  name: string;
}

export default function AlertManagement() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    condition_type: 'datasource_failure',
    condition_config: {} as Record<string, any>,
    channels: [] as string[],
    recipients: {
      email: [] as string[],
      slack: '',
      teams: '',
      whatsapp: [] as string[]
    },
    is_active: true
  });

  // Recipient input states
  const [emailInput, setEmailInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');

  useEffect(() => {
    fetchAlerts();
    fetchDataSources();
    fetchPipelines();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({ title: 'Error', description: 'Failed to fetch alerts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDataSources(data);
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  };

  const fetchPipelines = async () => {
    try {
      const response = await fetch('/api/pipelines', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPipelines(data);
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.condition_type) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (formData.channels.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one notification channel', variant: 'destructive' });
      return;
    }

    try {
      const method = editingAlert ? 'PUT' : 'POST';
      const url = editingAlert ? `/api/alerts/${editingAlert.id}` : '/api/alerts';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({ title: 'Success', description: `Alert ${editingAlert ? 'updated' : 'created'} successfully` });
        fetchAlerts();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.error || 'Operation failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving alert:', error);
      toast({ title: 'Error', description: 'Failed to save alert', variant: 'destructive' });
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setFormData({
      name: alert.name,
      description: alert.description || '',
      condition_type: alert.condition_type,
      condition_config: alert.condition_config,
      channels: alert.channels,
      recipients: alert.recipients,
      is_active: alert.is_active
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Alert deleted successfully' });
        fetchAlerts();
      } else {
        toast({ title: 'Error', description: 'Failed to delete alert', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({ title: 'Error', description: 'Failed to delete alert', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (alert: Alert) => {
    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !alert.is_active })
      });

      if (response.ok) {
        toast({ title: 'Success', description: `Alert ${!alert.is_active ? 'activated' : 'deactivated'}` });
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast({ title: 'Error', description: 'Failed to update alert', variant: 'destructive' });
    }
  };

  const handleTestAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/test`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        toast({ 
          title: 'Test Alert Sent', 
          description: JSON.stringify(result.results, null, 2) 
        });
      } else {
        toast({ title: 'Error', description: 'Failed to send test alert', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error testing alert:', error);
      toast({ title: 'Error', description: 'Failed to test alert', variant: 'destructive' });
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingAlert(null);
    setFormData({
      name: '',
      description: '',
      condition_type: 'datasource_failure',
      condition_config: {},
      channels: [],
      recipients: { email: [], slack: '', teams: '', whatsapp: [] },
      is_active: true
    });
    setEmailInput('');
    setWhatsappInput('');
  };

  const handleAddEmail = () => {
    if (emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setFormData({
        ...formData,
        recipients: {
          ...formData.recipients,
          email: [...formData.recipients.email, emailInput]
        }
      });
      setEmailInput('');
    } else {
      toast({ title: 'Error', description: 'Invalid email address', variant: 'destructive' });
    }
  };

  const handleAddWhatsApp = () => {
    if (whatsappInput) {
      setFormData({
        ...formData,
        recipients: {
          ...formData.recipients,
          whatsapp: [...formData.recipients.whatsapp, whatsappInput]
        }
      });
      setWhatsappInput('');
    }
  };

  const getConditionTypeIcon = (type: string) => {
    switch (type) {
      case 'datasource_failure': return <Database className="h-4 w-4" />;
      case 'pipeline_failure': return <GitBranch className="h-4 w-4" />;
      case 'query_slow': return <Timer className="h-4 w-4" />;
      case 'dashboard_failure': return <BarChart3 className="h-4 w-4" />;
      case 'sla_breach': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getConditionTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredAlerts = alerts.filter(alert =>
    alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render condition config fields based on condition type
  const renderConditionConfigFields = () => {
    switch (formData.condition_type) {
      case 'datasource_failure':
        return (
          <div className="space-y-4">
            <div>
              <Label>Data Source *</Label>
              <Select
                value={formData.condition_config.datasource_id || ''}
                onValueChange={(value) => setFormData({
                  ...formData,
                  condition_config: { ...formData.condition_config, datasource_id: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map(ds => (
                    <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Check Interval (minutes)</Label>
              <Input
                type="number"
                value={formData.condition_config.check_interval_minutes || 5}
                onChange={(e) => setFormData({
                  ...formData,
                  condition_config: { ...formData.condition_config, check_interval_minutes: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        );

      case 'pipeline_failure':
        return (
          <div className="space-y-4">
            <div>
              <Label>Pipeline *</Label>
              <Select
                value={formData.condition_config.pipeline_id || ''}
                onValueChange={(value) => setFormData({
                  ...formData,
                  condition_config: { ...formData.condition_config, pipeline_id: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Check Last N Runs</Label>
              <Input
                type="number"
                value={formData.condition_config.check_last_n_runs || 1}
                onChange={(e) => setFormData({
                  ...formData,
                  condition_config: { ...formData.condition_config, check_last_n_runs: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        );

      case 'query_slow':
        return (
          <div className="space-y-4">
            <div>
              <Label>Threshold (seconds)</Label>
              <Input
                type="number"
                value={formData.condition_config.threshold_seconds || 30}
                onChange={(e) => setFormData({
                  ...formData,
                  condition_config: { ...formData.condition_config, threshold_seconds: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        );

      case 'sla_breach':
        return (
          <div className="space-y-4">
            <div>
              <Label>Data Source *</Label>
              <Select
                value={formData.condition_config.datasource_id || ''}
                onValueChange={(value) => setFormData({
                  ...formData,
                  condition_config: { ...formData.condition_config, datasource_id: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map(ds => (
                    <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected Load Time (HH:MM)</Label>
              <Input
                type="time"
                value={formData.condition_config.expected_load_time || '09:00'}
                onChange={(e) => setFormData({
                  ...formData,
                  condition_config: { ...formData.condition_config, expected_load_time: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>Tolerance (minutes)</Label>
              <Input
                type="number"
                value={formData.condition_config.tolerance_minutes || 30}
                onChange={(e) => setFormData({
                  ...formData,
                  condition_config: { ...formData.condition_config, tolerance_minutes: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-500 p-6 text-white shadow-lg">
        {/* Animated blur decorations */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Bell className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Alert Management</h1>
                <p className="text-white/90 text-sm mt-0.5">
                  Monitor and get notified about data sources, pipelines, and SLA breaches
                </p>
              </div>
            </div>
            
            {/* Stats Card */}
            <Card className="border-0 bg-white/10 backdrop-blur-md shadow-lg">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/90">Active Alerts</span>
                    <span className="font-bold text-white text-lg">
                      {alerts.filter(a => a.is_active).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/90">Total Triggers</span>
                    <span className="font-bold text-white text-lg">
                      {alerts.reduce((sum, a) => sum + (a.trigger_count || 0), 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Search and Create Button */}
      <div className="flex items-center gap-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search alerts by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-full px-6"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Alerts Grid */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading alerts...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredAlerts.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                <Bell className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Alerts Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm ? 'No alerts match your search criteria' : 'Create your first alert to start monitoring your data sources, pipelines, and SLA compliance'}
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlerts.map(alert => (
            <Card 
              key={alert.id}
              className={`overflow-hidden transition-all hover:shadow-lg ${
                alert.is_active 
                  ? 'border-l-4 border-l-green-500' 
                  : 'border-l-4 border-l-gray-300 opacity-75'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 flex items-center gap-2">
                      {getConditionTypeIcon(alert.condition_type)}
                      <span className="truncate">{alert.name}</span>
                    </CardTitle>
                    {alert.description && (
                      <CardDescription className="text-sm line-clamp-2">
                        {alert.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Condition Type */}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getConditionTypeIcon(alert.condition_type)}
                    <span>{getConditionTypeLabel(alert.condition_type)}</span>
                  </Badge>
                </div>

                {/* Channels */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Notification Channels</p>
                  <div className="flex gap-2 flex-wrap">
                    {alert.channels.includes('email') && (
                      <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        <Mail className="h-3 w-3" />
                        Email
                      </div>
                    )}
                    {alert.channels.includes('slack') && (
                      <div className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        <MessageSquare className="h-3 w-3" />
                        Slack
                      </div>
                    )}
                    {alert.channels.includes('teams') && (
                      <div className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                        <Send className="h-3 w-3" />
                        Teams
                      </div>
                    )}
                    {alert.channels.includes('whatsapp') && (
                      <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                        <Phone className="h-3 w-3" />
                        WhatsApp
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant={alert.is_active ? 'default' : 'secondary'}
                      className={`mt-1 ${alert.is_active ? 'bg-green-500' : ''}`}
                    >
                      {alert.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Triggers</p>
                    <p className="font-semibold mt-1">{alert.trigger_count || 0}</p>
                  </div>
                </div>

                {/* Last Triggered */}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last: {alert.last_triggered_at
                    ? new Date(alert.last_triggered_at).toLocaleString()
                    : 'Never'}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={alert.is_active ? "default" : "outline"}
                    onClick={() => handleToggleActive(alert)}
                    className="flex-1"
                    title={alert.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Power className={`h-4 w-4 mr-1 ${alert.is_active ? 'text-white' : 'text-gray-500'}`} />
                    {alert.is_active ? 'Active' : 'Inactive'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestAlert(alert.id)}
                    title="Test Alert"
                  >
                    <TestTube2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(alert)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(alert.id)}
                    title="Delete"
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Alert Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg">
                <Bell className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {editingAlert ? 'Edit Alert' : 'Create New Alert'}
                </DialogTitle>
                <DialogDescription>
                  Configure alert conditions and notification channels
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div>
                <Label>Alert Name *</Label>
                <Input
                  placeholder="e.g., Production DB Connection Failure"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Optional description of this alert"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              </CardContent>
            </Card>

            {/* Condition Type */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Alert Condition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div>
                <Label>Condition Type *</Label>
                <Select
                  value={formData.condition_type}
                  onValueChange={(value) => setFormData({ ...formData, condition_type: value, condition_config: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="datasource_failure">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Data Source Connectivity Failure
                      </div>
                    </SelectItem>
                    <SelectItem value="pipeline_failure">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Pipeline Failure
                      </div>
                    </SelectItem>
                    <SelectItem value="query_slow">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Query Execution Slow
                      </div>
                    </SelectItem>
                    <SelectItem value="dashboard_failure">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Dashboard Scheduler Failure
                      </div>
                    </SelectItem>
                    <SelectItem value="sla_breach">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        SLA Breach
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Condition Config Fields */}
              {renderConditionConfigFields()}
              </CardContent>
            </Card>

            {/* Notification Channels */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-green-600" />
                  Notification Channels *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="email"
                    checked={formData.channels.includes('email')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, channels: [...formData.channels, 'email'] });
                      } else {
                        setFormData({ ...formData, channels: formData.channels.filter(c => c !== 'email') });
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Mail className="h-5 w-5 text-blue-500" />
                  <Label htmlFor="email" className="cursor-pointer flex-1">Email</Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="slack"
                    checked={formData.channels.includes('slack')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, channels: [...formData.channels, 'slack'] });
                      } else {
                        setFormData({ ...formData, channels: formData.channels.filter(c => c !== 'slack') });
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <Label htmlFor="slack" className="cursor-pointer flex-1">Slack</Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="teams"
                    checked={formData.channels.includes('teams')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, channels: [...formData.channels, 'teams'] });
                      } else {
                        setFormData({ ...formData, channels: formData.channels.filter(c => c !== 'teams') });
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Send className="h-5 w-5 text-indigo-500" />
                  <Label htmlFor="teams" className="cursor-pointer flex-1">Microsoft Teams</Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="whatsapp"
                    checked={formData.channels.includes('whatsapp')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, channels: [...formData.channels, 'whatsapp'] });
                      } else {
                        setFormData({ ...formData, channels: formData.channels.filter(c => c !== 'whatsapp') });
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Phone className="h-5 w-5 text-green-500" />
                  <Label htmlFor="whatsapp" className="cursor-pointer flex-1">WhatsApp</Label>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Recipients */}
            <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-amber-600" />
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

              {/* Email Recipients */}
              {formData.channels.includes('email') && (
                <div className="space-y-2">
                  <Label>Email Addresses</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                    />
                    <Button type="button" onClick={handleAddEmail}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.recipients.email.map((email, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-2">
                        {email}
                        <XCircle
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setFormData({
                            ...formData,
                            recipients: {
                              ...formData.recipients,
                              email: formData.recipients.email.filter((_, i) => i !== idx)
                            }
                          })}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Slack Webhook */}
              {formData.channels.includes('slack') && (
                <div>
                  <Label>Slack Webhook URL</Label>
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    value={formData.recipients.slack}
                    onChange={(e) => setFormData({
                      ...formData,
                      recipients: { ...formData.recipients, slack: e.target.value }
                    })}
                  />
                </div>
              )}

              {/* Teams Webhook */}
              {formData.channels.includes('teams') && (
                <div>
                  <Label>Microsoft Teams Webhook URL</Label>
                  <Input
                    placeholder="https://outlook.office.com/webhook/..."
                    value={formData.recipients.teams}
                    onChange={(e) => setFormData({
                      ...formData,
                      recipients: { ...formData.recipients, teams: e.target.value }
                    })}
                  />
                </div>
              )}

              {/* WhatsApp Numbers */}
              {formData.channels.includes('whatsapp') && (
                <div className="space-y-2">
                  <Label>WhatsApp Phone Numbers (E.164 format: +1234567890)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="+1234567890"
                      value={whatsappInput}
                      onChange={(e) => setWhatsappInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddWhatsApp()}
                    />
                    <Button type="button" onClick={handleAddWhatsApp}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.recipients.whatsapp.map((phone, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-2">
                        {phone}
                        <XCircle
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setFormData({
                            ...formData,
                            recipients: {
                              ...formData.recipients,
                              whatsapp: formData.recipients.whatsapp.filter((_, i) => i !== idx)
                            }
                          })}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label className="text-base font-semibold">Active (start monitoring immediately)</Label>
              </div>
              <Badge 
                variant={formData.is_active ? "default" : "secondary"}
                className={formData.is_active ? "bg-green-500" : ""}
              >
                {formData.is_active ? "Alert Active" : "Alert Inactive"}
              </Badge>
            </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex-1"
            >
              {editingAlert ? '✓ Update Alert' : '✓ Create Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

