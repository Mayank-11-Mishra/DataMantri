import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Brain, 
  Code, 
  Palette,
  Edit,
  Eye,
  Calendar,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const DashboardBuilder = () => {
  const [selectedCreationType, setSelectedCreationType] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [themes, setThemes] = useState<any[]>([]);

  const creationOptions = [
    {
      id: 'visual',
      title: 'Visual Builder',
      description: 'Drag and drop interface to build dashboards',
      icon: BarChart3,
      features: ['Drag & Drop', 'Real-time Preview', 'Component Library']
    },
    {
      id: 'ai',
      title: 'AI Builder',
      description: 'Generate dashboards using AI prompts',
      icon: Brain,
      features: ['Natural Language', 'Smart Suggestions', 'Auto-Layout']
    },
    {
      id: 'query',
      title: 'Query Builder',
      description: 'Build dashboards with SQL-like queries',
      icon: Code,
      features: ['SQL Support', 'Advanced Filtering', 'Custom Logic']
    }
  ];


  useEffect(() => {
    fetch('/api/themes', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setThemes(data))
      .catch(() => toast({ title: 'Error', description: 'Failed to load themes.', variant: 'destructive' }));
  }, []);

  const existingDashboards = [
    { id: 1, name: 'Sales Performance Q4', type: 'Analytics', lastModified: '2 hours ago', status: 'Published' },
    { id: 2, name: 'Marketing ROI Dashboard', type: 'Marketing', lastModified: '1 day ago', status: 'Draft' },
    { id: 3, name: 'Customer Journey Analytics', type: 'Customer', lastModified: '3 days ago', status: 'Published' },
    { id: 4, name: 'Financial Overview 2024', type: 'Finance', lastModified: '1 week ago', status: 'Published' },
  ];

  const handleCreateDashboard = async () => {
    if (!selectedCreationType || !dashboardName) {
      toast({
        title: "Missing Information",
        description: "Please select a creation type and enter a dashboard name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: dashboardName,
          description: dashboardDescription,
          theme_id: selectedTheme,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast({
          title: "Dashboard Created",
          description: `${dashboardName} has been created successfully.`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create dashboard.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Builder</h1>
        <p className="text-muted-foreground">
          Create new dashboards or manage existing ones
        </p>
      </div>

      {/* Create New Dashboard Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Dashboard
          </CardTitle>
          <CardDescription>
            Choose your preferred method to create a new dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Creation Type Selection */}
          <div>
            <Label className="text-base font-medium">Select Creation Method</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {creationOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCreationType === option.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCreationType(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <option.icon className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">{option.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {option.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Dashboard Details */}
          {selectedCreationType && (
            <div className="space-y-4 border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-name">Dashboard Name</Label>
                  <Input
                    id="dashboard-name"
                    placeholder="Enter dashboard name"
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-select">Theme</Label>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id.toString()}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dashboard-description">Description (Optional)</Label>
                <Textarea
                  id="dashboard-description"
                  placeholder="Describe what this dashboard will show..."
                  value={dashboardDescription}
                  onChange={(e) => setDashboardDescription(e.target.value)}
                />
              </div>

              {/* AI-specific inputs */}
              {selectedCreationType === 'ai' && (
                <div className="space-y-2">
                  <Label htmlFor="ai-prompt">AI Prompt</Label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="Describe the dashboard you want to create. Example: 'Create a sales dashboard with revenue trends, top products, and regional performance'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <Button onClick={handleCreateDashboard} className="w-full">
                Create Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Dashboards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Existing Dashboards</CardTitle>
              <CardDescription>Manage and edit your dashboards</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search dashboards..." className="pl-8 w-64" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {existingDashboards.map((dashboard) => (
              <div key={dashboard.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{dashboard.name}</h3>
                    <Badge variant={dashboard.status === 'Published' ? 'default' : 'secondary'}>
                      {dashboard.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Type: {dashboard.type}</span>
                    <span>Modified: {dashboard.lastModified}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardBuilder;
