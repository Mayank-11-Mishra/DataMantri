import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Palette, Code, Download, Upload, Eye, 
  Plus, Edit, Trash2, Star, ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Theme {
  id: number;
  name: string;
  description: string;
  css_content: string;
  variables: any;
  preview_url: string;
  source_url: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface ChartLibrary {
  id: number;
  name: string;
  description: string;
  library_type: string;
  code_content: string;
  config_schema: any;
  preview_url: string;
  source_url: string;
  is_active: boolean;
  created_at: string;
}

const ThemeLibrary: React.FC = () => {
  const { user } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [chartLibraries, setChartLibraries] = useState<ChartLibrary[]>([]);
  const [loading, setLoading] = useState(false);

  // Theme form state
  const [themeForm, setThemeForm] = useState({
    name: '',
    description: '',
    css_content: '',
    variables: '{}',
    source_url: ''
  });

  // Chart library form state
  const [chartForm, setChartForm] = useState({
    name: '',
    description: '',
    library_type: 'recharts',
    code_content: '',
    config_schema: '{}',
    source_url: ''
  });

  // Preview states
  const [previewTheme, setPreviewTheme] = useState<any>(null);
  const [showThemePreview, setShowThemePreview] = useState(false);
  const [showChartPreview, setShowChartPreview] = useState(false);
  const [previewChartData, setPreviewChartData] = useState<any>(null);

  const isAdmin = user?.is_admin || false;

  useEffect(() => {
    fetchThemes();
    fetchChartLibraries();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/themes', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setThemes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const fetchChartLibraries = async () => {
    try {
      const response = await fetch('/api/chart-libraries', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setChartLibraries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch chart libraries:', error);
    }
  };

  const createTheme = async () => {
    // Validation
    if (!themeForm.name.trim()) {
      alert('Please enter a theme name');
      return;
    }
    
    if (!themeForm.css_content.trim() && !themeForm.variables.trim()) {
      alert('Please enter either CSS content or color palette');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the data
      const themeData = {
        name: themeForm.name.trim(),
        description: themeForm.description.trim(),
        css_content: themeForm.css_content.trim(),
        variables: themeForm.variables.trim(),
        source_url: themeForm.source_url.trim()
      };

      console.log('Creating theme with data:', themeData);
      
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(themeData)
      });
      
      const result = await response.json();
      console.log('Theme creation response:', result);
      
      if (response.ok) {
        alert('Theme created successfully!');
        await fetchThemes();
        setThemeForm({
          name: '',
          description: '',
          css_content: '',
          variables: '',
          source_url: ''
        });
      } else {
        alert(`Failed to create theme: ${result.message || 'Unknown error'}`);
        console.error('Theme creation failed:', result);
      }
    } catch (error) {
      console.error('Failed to create theme:', error);
      alert('Failed to create theme: Network error');
    } finally {
      setLoading(false);
    }
  };

  const createChartLibrary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chart-libraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(chartForm)
      });
      
      const result = await response.json();
      if (response.ok) {
        alert('Chart library created successfully!');
        fetchChartLibraries();
        setChartForm({
          name: '',
          description: '',
          library_type: 'recharts',
          code_content: '',
          config_schema: '{}',
          source_url: ''
        });
      } else {
        alert(`Failed to create chart library: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create chart library:', error);
      alert('Failed to create chart library: Network error');
    } finally {
      setLoading(false);
    }
  };

  const previewThemeColors = () => {
    try {
      const cssContent = themeForm.css_content;
      let variables = {};
      
      // Parse variables - either JSON or comma-separated colors
      if (themeForm.variables.trim()) {
        if (themeForm.variables.startsWith('{')) {
          variables = JSON.parse(themeForm.variables);
        } else {
          // Parse comma-separated colors
          const colors = themeForm.variables.split(',').map(c => c.trim()).filter(c => c);
          variables = {
            primary: colors[0] || '#3b82f6',
            background: colors[1] || '#ffffff',
            foreground: colors[2] || '#000000',
            secondary: colors[3] || '#64748b'
          };
        }
      }
      
      setPreviewTheme({
        css_content: cssContent,
        variables: variables,
        name: themeForm.name || 'Preview Theme'
      });
      setShowThemePreview(true);
    } catch (error) {
      alert('Invalid format. Please check your CSS or color palette input.');
    }
  };

  const previewChart = () => {
    try {
      const config = JSON.parse(chartForm.config_schema || '{}');
      
      setPreviewChartData({
        name: chartForm.name || 'Preview Chart',
        library_type: chartForm.library_type,
        config: config,
        code_content: chartForm.code_content
      });
      setShowChartPreview(true);
    } catch (error) {
      alert('Invalid configuration format. Please check your JSON.');
    }
  };

  const importFromLovable = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/import-from-lovable', {
        method: 'POST',
        credentials: 'include'
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(`Successfully imported ${result.themes_count || 0} themes and ${result.charts_count || 0} chart libraries from Lovable.dev`);
        fetchThemes();
        fetchChartLibraries();
      } else {
        alert(`Import failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to import from Lovable:', error);
      alert('Import failed: Network error');
    } finally {
      setLoading(false);
    }
  };

  const toggleThemeStatus = async (themeId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/themes/${themeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !isActive })
      });
      
      if (response.ok) {
        fetchThemes();
      }
    } catch (error) {
      console.error('Failed to update theme status:', error);
    }
  };

  const setDefaultTheme = async (themeId: number) => {
    try {
      const response = await fetch(`/api/themes/${themeId}/default`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchThemes();
      }
    } catch (error) {
      console.error('Failed to set default theme:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme & Chart Libraries</h1>
          <p className="text-muted-foreground">
            Manage themes and chart libraries for your DataMantri platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={importFromLovable} variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Import from Lovable.dev
          </Button>
        </div>
      </div>

      <Tabs defaultValue="themes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="charts">Chart Libraries</TabsTrigger>
        </TabsList>

        {/* Themes Management */}
        <TabsContent value="themes" className="space-y-4">
          {isAdmin && (
            <>
              {/* Quick Theme Creator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Quick Theme Creator
                  </CardTitle>
                  <CardDescription>
                    Create themes instantly with preset color combinations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col gap-2"
                      onClick={async () => {
                        const themeData = {
                          name: 'Ocean Blue',
                          description: 'Professional blue theme',
                          css_content: ':root { --primary: #0ea5e9; --background: #f0f9ff; --foreground: #0c4a6e; }',
                          variables: '#0ea5e9,#f0f9ff,#0c4a6e,#64748b',
                          source_url: ''
                        };
                        setThemeForm(themeData);
                        await createTheme();
                      }}
                      disabled={loading}
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-sky-500"></div>
                        <div className="w-4 h-4 rounded bg-sky-50"></div>
                        <div className="w-4 h-4 rounded bg-sky-900"></div>
                      </div>
                      <span className="text-sm">Ocean Blue</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-20 flex flex-col gap-2"
                      onClick={async () => {
                        const themeData = {
                          name: 'Forest Green',
                          description: 'Nature-inspired green theme',
                          css_content: ':root { --primary: #10b981; --background: #f0fdf4; --foreground: #064e3b; }',
                          variables: '#10b981,#f0fdf4,#064e3b,#6b7280',
                          source_url: ''
                        };
                        setThemeForm(themeData);
                        await createTheme();
                      }}
                      disabled={loading}
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-emerald-500"></div>
                        <div className="w-4 h-4 rounded bg-emerald-50"></div>
                        <div className="w-4 h-4 rounded bg-emerald-900"></div>
                      </div>
                      <span className="text-sm">Forest Green</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-20 flex flex-col gap-2"
                      onClick={async () => {
                        const themeData = {
                          name: 'Sunset Orange',
                          description: 'Warm orange theme',
                          css_content: ':root { --primary: #f97316; --background: #fff7ed; --foreground: #9a3412; }',
                          variables: '#f97316,#fff7ed,#9a3412,#78716c',
                          source_url: ''
                        };
                        setThemeForm(themeData);
                        await createTheme();
                      }}
                      disabled={loading}
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-orange-500"></div>
                        <div className="w-4 h-4 rounded bg-orange-50"></div>
                        <div className="w-4 h-4 rounded bg-orange-800"></div>
                      </div>
                      <span className="text-sm">Sunset Orange</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Theme Creator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Custom Theme Creator
                  </CardTitle>
                  <CardDescription>
                    Create your own custom theme with specific colors
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme-name">Theme Name</Label>
                    <Input
                      id="theme-name"
                      value={themeForm.name}
                      onChange={(e) => setThemeForm({...themeForm, name: e.target.value})}
                      placeholder="Modern Dark Theme"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source-url">Source URL (Optional)</Label>
                    <Input
                      id="source-url"
                      value={themeForm.source_url}
                      onChange={(e) => setThemeForm({...themeForm, source_url: e.target.value})}
                      placeholder="https://lovable.dev/theme/123"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="theme-description">Description</Label>
                  <Textarea
                    id="theme-description"
                    value={themeForm.description}
                    onChange={(e) => setThemeForm({...themeForm, description: e.target.value})}
                    placeholder="A modern dark theme with blue accents..."
                  />
                </div>

                <div>
                  <Label htmlFor="css-content">CSS Content</Label>
                  <Textarea
                    id="css-content"
                    value={themeForm.css_content}
                    onChange={(e) => setThemeForm({...themeForm, css_content: e.target.value})}
                    placeholder=":root { --primary: #3b82f6; --background: #0f172a; --foreground: #ffffff; }"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: :root {`{ --primary: #3b82f6; --background: #ffffff; }`}
                  </p>
                </div>

                <div>
                  <Label htmlFor="variables">Color Palette (comma-separated colors)</Label>
                  <Input
                    id="variables"
                    value={themeForm.variables}
                    onChange={(e) => setThemeForm({...themeForm, variables: e.target.value})}
                    placeholder="#3b82f6,#ffffff,#000000,#64748b"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter colors separated by commas (e.g., #3b82f6,#ffffff,#000000)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={previewThemeColors} 
                    variant="outline" 
                    className="flex-1"
                    disabled={!themeForm.css_content && !themeForm.variables}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Theme
                  </Button>
                  <Button onClick={createTheme} disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Create Theme'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <Card key={theme.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                    <div className="flex gap-1">
                      {theme.is_default && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                      <Badge variant={theme.is_active ? "default" : "secondary"}>
                        {theme.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{theme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Theme Preview */}
                    <div className="h-24 rounded border bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-medium">Theme Preview</span>
                    </div>

                    {/* Theme Actions */}
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleThemeStatus(theme.id, theme.is_active)}
                          >
                            {theme.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          {!theme.is_default && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDefaultTheme(theme.id)}
                            >
                              Set Default
                            </Button>
                          )}
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {theme.source_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={theme.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Chart Libraries Management */}
        <TabsContent value="charts" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Chart Library
                </CardTitle>
                <CardDescription>
                  Integrate external chart libraries and custom components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="chart-name">Library Name</Label>
                    <Input
                      id="chart-name"
                      value={chartForm.name}
                      onChange={(e) => setChartForm({...chartForm, name: e.target.value})}
                      placeholder="Advanced Bar Chart"
                    />
                  </div>
                  <div>
                    <Label htmlFor="library-type">Library Type</Label>
                    <Select value={chartForm.library_type} onValueChange={(value) => setChartForm({...chartForm, library_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recharts">Recharts</SelectItem>
                        <SelectItem value="d3">D3.js</SelectItem>
                        <SelectItem value="chartjs">Chart.js</SelectItem>
                        <SelectItem value="plotly">Plotly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="chart-description">Description</Label>
                  <Textarea
                    id="chart-description"
                    value={chartForm.description}
                    onChange={(e) => setChartForm({...chartForm, description: e.target.value})}
                    placeholder="Advanced bar chart with animations and interactions..."
                  />
                </div>

                <div>
                  <Label htmlFor="chart-source-url">Source URL (Optional)</Label>
                  <Input
                    id="chart-source-url"
                    value={chartForm.source_url}
                    onChange={(e) => setChartForm({...chartForm, source_url: e.target.value})}
                    placeholder="https://lovable.dev/chart/456"
                  />
                </div>

                <div>
                  <Label htmlFor="code-content">Component Code</Label>
                  <Textarea
                    id="code-content"
                    value={chartForm.code_content}
                    onChange={(e) => setChartForm({...chartForm, code_content: e.target.value})}
                    placeholder="import React from 'react';\n\nconst CustomChart = ({ data }) => {\n  return <div>Chart Component</div>;\n};\n\nexport default CustomChart;"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="config-schema">Configuration Schema (JSON)</Label>
                  <Textarea
                    id="config-schema"
                    value={chartForm.config_schema}
                    onChange={(e) => setChartForm({...chartForm, config_schema: e.target.value})}
                    placeholder='{"properties": {"color": {"type": "string"}, "size": {"type": "number"}}}'
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={previewChart} 
                    variant="outline" 
                    className="flex-1"
                    disabled={!chartForm.config_schema}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Chart
                  </Button>
                  <Button onClick={createChartLibrary} disabled={loading} className="flex-1">
                    {loading ? 'Adding...' : 'Add Chart Library'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart Libraries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chartLibraries.map((library) => (
              <Card key={library.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{library.name}</CardTitle>
                    <Badge variant="outline">{library.library_type}</Badge>
                  </div>
                  <CardDescription>{library.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Chart Preview */}
                    <div className="h-32 rounded border bg-muted flex items-center justify-center">
                      <Code className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Library Info */}
                    <div className="text-sm text-muted-foreground">
                      <p>Added: {new Date(library.created_at).toLocaleDateString()}</p>
                      <Badge variant={library.is_active ? "default" : "secondary"} className="mt-1">
                        {library.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      {library.source_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={library.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {isAdmin && (
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Theme Preview Modal */}
      {showThemePreview && previewTheme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Theme Preview: {previewTheme.name}</h3>
              <Button variant="ghost" onClick={() => setShowThemePreview(false)}>×</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Theme Variables */}
              <div>
                <h4 className="font-semibold mb-2">Theme Variables</h4>
                <div className="space-y-2">
                  {Object.entries(previewTheme.variables || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border" 
                        style={{ backgroundColor: String(value) }}
                      ></div>
                      <span className="text-sm font-mono">{key}: {String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <h4 className="font-semibold mb-2">Live Preview</h4>
                <div 
                  className="border rounded p-4 space-y-4"
                  style={{ 
                    background: previewTheme.variables?.background || '#ffffff',
                    color: previewTheme.variables?.foreground || '#000000'
                  }}
                >
                  <div className="space-y-2">
                    <h5 className="text-lg font-bold">Sample Dashboard</h5>
                    <p className="text-sm opacity-75">This is how your theme will look</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div 
                      className="p-3 rounded text-white text-center"
                      style={{ backgroundColor: previewTheme.variables?.primary || '#3b82f6' }}
                    >
                      Primary Button
                    </div>
                    <div 
                      className="p-3 rounded border text-center"
                      style={{ 
                        borderColor: previewTheme.variables?.primary || '#3b82f6',
                        color: previewTheme.variables?.primary || '#3b82f6'
                      }}
                    >
                      Secondary Button
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 rounded" style={{ backgroundColor: previewTheme.variables?.primary || '#3b82f6', opacity: 0.8 }}></div>
                    <div className="h-4 rounded" style={{ backgroundColor: previewTheme.variables?.primary || '#3b82f6', opacity: 0.6 }}></div>
                    <div className="h-4 rounded" style={{ backgroundColor: previewTheme.variables?.primary || '#3b82f6', opacity: 0.4 }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowThemePreview(false)}>
                Close Preview
              </Button>
              <Button onClick={() => {
                setThemeForm(prev => ({
                  ...prev,
                  css_content: previewTheme.css_content,
                  variables: JSON.stringify(previewTheme.variables)
                }));
                setShowThemePreview(false);
              }}>
                Use This Theme
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chart Preview Modal */}
      {showChartPreview && previewChartData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Chart Preview: {previewChartData.name}</h3>
              <Button variant="ghost" onClick={() => setShowChartPreview(false)}>×</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart Configuration */}
              <div>
                <h4 className="font-semibold mb-2">Configuration</h4>
                <div className="bg-gray-50 p-4 rounded font-mono text-sm">
                  <pre>{JSON.stringify(previewChartData.config, null, 2)}</pre>
                </div>
              </div>

              {/* Mock Chart Preview */}
              <div>
                <h4 className="font-semibold mb-2">Chart Preview</h4>
                <div className="border rounded p-4 h-64 flex items-center justify-center bg-gray-50">
                  {previewChartData.library_type === 'bar' && (
                    <div className="flex items-end gap-2 h-32">
                      <div className="w-8 bg-blue-500 h-20"></div>
                      <div className="w-8 bg-blue-400 h-16"></div>
                      <div className="w-8 bg-blue-600 h-24"></div>
                      <div className="w-8 bg-blue-300 h-12"></div>
                    </div>
                  )}
                  {previewChartData.library_type === 'line' && (
                    <div className="relative w-full h-32">
                      <svg viewBox="0 0 200 100" className="w-full h-full">
                        <polyline
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          points="20,80 60,40 100,60 140,20 180,50"
                        />
                      </svg>
                    </div>
                  )}
                  {previewChartData.library_type === 'donut' && (
                    <div className="w-32 h-32 rounded-full border-8 border-blue-500 border-t-blue-300 border-r-blue-400"></div>
                  )}
                  {!['bar', 'line', 'donut'].includes(previewChartData.library_type) && (
                    <div className="text-center text-gray-500">
                      <Code className="h-12 w-12 mx-auto mb-2" />
                      <p>Custom {previewChartData.library_type} Chart</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowChartPreview(false)}>
                Close Preview
              </Button>
              <Button onClick={() => {
                setChartForm(prev => ({
                  ...prev,
                  config_schema: JSON.stringify(previewChartData.config)
                }));
                setShowChartPreview(false);
              }}>
                Use This Configuration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeLibrary;
