import React, { useState, useEffect } from 'react';
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
  Palette,
  Edit,
  Eye,
  Calendar,
  Search,
  Database,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DataMart {
  id: number;
  name: string;
  type: string;
  description: string;
}

interface ChartComponent {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'table';
  title: string;
  icon: any;
  description: string;
}

const DashboardBuilder = () => {
  const [selectedCreationType, setSelectedCreationType] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [selectedDataMart, setSelectedDataMart] = useState<string>('');
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [dashboardComponents, setDashboardComponents] = useState<ChartComponent[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [themes, setThemes] = useState<any[]>([]);
  const [dataMarts, setDataMarts] = useState<DataMart[]>([]);

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
    }
  ];

  const availableCharts: ChartComponent[] = [
    {
      id: 'bar-chart',
      type: 'bar',
      title: 'Bar Chart',
      icon: BarChart3,
      description: 'Compare values across categories'
    },
    {
      id: 'line-chart',
      type: 'line',
      title: 'Line Chart',
      icon: LineChart,
      description: 'Show trends over time'
    },
    {
      id: 'pie-chart',
      type: 'pie',
      title: 'Pie Chart',
      icon: PieChart,
      description: 'Show proportions of a whole'
    },
    {
      id: 'data-table',
      type: 'table',
      title: 'Data Table',
      icon: Database,
      description: 'Display raw data in table format'
    }
  ];

  useEffect(() => {
    // Fetch themes
    fetch('/api/themes', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setThemes(Array.isArray(data) ? data : []))
      .catch(() => toast({ title: 'Error', description: 'Failed to load themes.', variant: 'destructive' }));

    // Fetch data marts
    fetch('/api/data-marts', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setDataMarts(Array.isArray(data) ? data : []))
      .catch(() => toast({ title: 'Error', description: 'Failed to load data marts.', variant: 'destructive' }));
  }, []);

  const handleAddChart = (chart: ChartComponent) => {
    const newChart = {
      ...chart,
      id: `${chart.id}-${Date.now()}`
    };
    setDashboardComponents([...dashboardComponents, newChart]);
    toast({
      title: 'Chart Added',
      description: `${chart.title} has been added to your dashboard.`
    });
  };

  const handleRemoveChart = (chartId: string) => {
    setDashboardComponents(dashboardComponents.filter(c => c.id !== chartId));
  };

  const handlePreview = () => {
    if (!selectedDataMart) {
      toast({
        title: 'Missing Data Mart',
        description: 'Please select a data mart to preview the dashboard.',
        variant: 'destructive'
      });
      return;
    }
    setPreviewOpen(true);
  };

  const handleCreateDashboard = async () => {
    if (!selectedCreationType || !dashboardName) {
      toast({
        title: "Missing Information",
        description: "Please select a creation type and enter a dashboard name.",
        variant: "destructive"
      });
      return;
    }

    if (selectedCreationType === 'visual' && !selectedDataMart) {
      toast({
        title: "Missing Data Mart",
        description: "Please select a data mart for your dashboard.",
        variant: "destructive"
      });
      return;
    }

    if (selectedCreationType === 'ai' && !aiPrompt.trim()) {
      toast({
        title: "Missing AI Prompt",
        description: "Please provide a description for AI to generate your dashboard.",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload: any = {
        name: dashboardName,
        description: dashboardDescription,
        theme_id: selectedTheme,
        data_mart_id: selectedDataMart,
        creation_type: selectedCreationType
      };

      if (selectedCreationType === 'visual') {
        payload.components = dashboardComponents;
      } else if (selectedCreationType === 'ai') {
        payload.ai_prompt = aiPrompt;
      }

      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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

  const generateAIDashboard = async () => {
    if (!aiPrompt.trim() || !selectedDataMart) {
      toast({
        title: "Missing Information",
        description: "Please select a data mart and provide an AI prompt.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/dashboards/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: aiPrompt,
          data_mart_id: selectedDataMart
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setDashboardComponents(result.components || []);
        toast({
          title: "AI Dashboard Generated",
          description: "Your dashboard has been generated based on your prompt.",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: result.message || "Failed to generate dashboard.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during generation.",
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
          Create new dashboards with visual builder or AI assistance
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label htmlFor="datamart-select">Data Mart</Label>
                  <Select value={selectedDataMart} onValueChange={setSelectedDataMart}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data mart" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataMarts.map((mart) => (
                        <SelectItem key={mart.id} value={mart.id.toString()}>
                          {mart.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Visual Builder Components */}
              {selectedCreationType === 'visual' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Dashboard Components</Label>
                    <Button onClick={handlePreview} variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                  
                  {/* Available Charts */}
                  <div>
                    <Label className="text-sm font-medium">Available Charts</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {availableCharts.map((chart) => (
                        <Card 
                          key={chart.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleAddChart(chart)}
                        >
                          <CardContent className="p-3 text-center">
                            <chart.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <h4 className="text-sm font-medium">{chart.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{chart.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Selected Components */}
                  {dashboardComponents.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Selected Components ({dashboardComponents.length})</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {dashboardComponents.map((component) => (
                          <Card key={component.id} className="relative">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <component.icon className="h-5 w-5 text-primary" />
                                  <span className="text-sm font-medium">{component.title}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveChart(component.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Builder Components */}
              {selectedCreationType === 'ai' && (
                <div className="space-y-4">
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
                  
                  <div className="flex gap-2">
                    <Button onClick={generateAIDashboard} variant="outline">
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Dashboard
                    </Button>
                    <Button onClick={handlePreview} variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>

                  {/* AI Generated Components */}
                  {dashboardComponents.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">AI Generated Components</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {dashboardComponents.map((component) => (
                          <Card key={component.id}>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <component.icon className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">{component.title}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleCreateDashboard} className="w-full">
                Create Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dashboard Preview</DialogTitle>
            <DialogDescription>
              Preview of "{dashboardName}" with {dashboardComponents.length} components
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dashboardComponents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardComponents.map((component) => (
                  <Card key={component.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <component.icon className="h-5 w-5" />
                        {component.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-muted rounded flex items-center justify-center">
                        <div className="text-center">
                          <component.icon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {component.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Data from: {dataMarts.find(m => m.id.toString() === selectedDataMart)?.name || 'Selected Data Mart'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No components added yet. Add charts to see the preview.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardBuilder;
