import React, { useState, useEffect } from 'react';
import {
  Palette, BarChart3, Layout, Eye, Trash2, Download, 
  Search, Filter, RefreshCw, Sparkles, CheckCircle2, X, Edit2, Save, XCircle
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, FunnelChart, Funnel, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Theme {
  id: string;
  name: string;
  description: string;
  colors: any;
  chart_colors: string[];
  font_family: string;
  border_radius: string;
  shadow_style: string;
  created_at: string;
  usage_count: number;
}

interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  chart_type: string;
  chart_config: any;
  default_colors: string[];
  category: string;
  created_at: string;
  usage_count: number;
}

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  grid_config: any;
  num_rows: number;
  num_cols: number;
  layout_type: string;
  created_at: string;
  usage_count: number;
}

const ThemesAndCharts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'themes' | 'charts' | 'layouts'>('themes');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [charts, setCharts] = useState<ChartTemplate[]>([]);
  const [layouts, setLayouts] = useState<LayoutTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewChart, setPreviewChart] = useState<ChartTemplate | null>(null);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [previewLayout, setPreviewLayout] = useState<LayoutTemplate | null>(null);
  const [editingChart, setEditingChart] = useState<ChartTemplate | null>(null);
  const [newChartName, setNewChartName] = useState('');

  // Generate sample data for chart preview
  const generateSampleData = (chartType: string) => {
    switch (chartType) {
      case 'bar':
      case 'line':
      case 'area':
        return [
          { name: 'Jan', value: 4000, value2: 2400 },
          { name: 'Feb', value: 3000, value2: 1398 },
          { name: 'Mar', value: 2000, value2: 9800 },
          { name: 'Apr', value: 2780, value2: 3908 },
          { name: 'May', value: 1890, value2: 4800 },
          { name: 'Jun', value: 2390, value2: 3800 },
        ];
      case 'pie':
        return [
          { name: 'Group A', value: 400 },
          { name: 'Group B', value: 300 },
          { name: 'Group C', value: 300 },
          { name: 'Group D', value: 200 },
        ];
      case 'scatter':
        return [
          { x: 100, y: 200 }, { x: 120, y: 100 }, { x: 170, y: 300 },
          { x: 140, y: 250 }, { x: 150, y: 400 }, { x: 110, y: 280 },
        ];
      case 'radar':
        return [
          { subject: 'Math', A: 120, B: 110 },
          { subject: 'Chinese', A: 98, B: 130 },
          { subject: 'English', A: 86, B: 130 },
          { subject: 'Geography', A: 99, B: 100 },
          { subject: 'Physics', A: 85, B: 90 },
          { subject: 'History', A: 65, B: 85 },
        ];
      case 'treemap':
        return [
          { name: 'Category A', size: 100, children: [
            { name: 'A1', size: 50 }, { name: 'A2', size: 50 }
          ]},
          { name: 'Category B', size: 200, children: [
            { name: 'B1', size: 100 }, { name: 'B2', size: 100 }
          ]},
          { name: 'Category C', size: 150 },
        ];
      case 'funnel':
        return [
          { name: 'Visits', value: 1000 },
          { name: 'Leads', value: 800 },
          { name: 'Qualified', value: 600 },
          { name: 'Proposals', value: 400 },
          { name: 'Closed', value: 200 },
        ];
      default:
        return [
          { name: 'A', value: 400 },
          { name: 'B', value: 300 },
          { name: 'C', value: 500 },
          { name: 'D', value: 200 },
        ];
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch themes
      const themesRes = await fetch('http://localhost:5001/api/custom-themes', {
        credentials: 'include',
      });
      if (themesRes.ok) {
        const themesData = await themesRes.json();
        // Backend now returns array directly, not wrapped in object
        setThemes(Array.isArray(themesData) ? themesData : []);
      }

      // Fetch charts
      const chartsRes = await fetch('http://localhost:5001/api/chart-templates', {
        credentials: 'include',
      });
      if (chartsRes.ok) {
        const chartsData = await chartsRes.json();
        // Backend now returns array directly, not wrapped in object
        setCharts(Array.isArray(chartsData) ? chartsData : []);
      }

      // Fetch layouts
      const layoutsRes = await fetch('http://localhost:5001/api/layout-templates', {
        credentials: 'include',
      });
      if (layoutsRes.ok) {
        const layoutsData = await layoutsRes.json();
        // Backend now returns array directly, not wrapped in object
        setLayouts(Array.isArray(layoutsData) ? layoutsData : []);
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTheme = async (id: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;
    
    try {
      const res = await fetch(`http://localhost:5001/api/custom-themes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        setThemes(themes.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete theme:', err);
    }
  };

  const deleteChart = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chart template?')) return;
    
    try {
      const res = await fetch(`http://localhost:5001/api/chart-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        setCharts(charts.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete chart:', err);
    }
  };

  const renameChart = async (chart: ChartTemplate, newName: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/chart-templates/${chart.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName }),
      });
      
      if (res.ok) {
        setCharts(charts.map(c => c.id === chart.id ? { ...c, name: newName } : c));
        setEditingChart(null);
        setNewChartName('');
      }
    } catch (err) {
      console.error('Failed to rename chart:', err);
    }
  };

  const groupChartsByType = (charts: ChartTemplate[]) => {
    const grouped: Record<string, ChartTemplate[]> = {};
    charts.forEach(chart => {
      const category = chart.chart_type === 'bar' ? 'Bar Charts' :
                      chart.chart_type === 'line' ? 'Line Charts' :
                      chart.chart_type === 'pie' ? 'Pie Charts' :
                      chart.chart_type === 'area' ? 'Area Charts' :
                      chart.chart_type === 'scatter' ? 'Scatter Charts' :
                      chart.chart_type === 'radar' ? 'Radar Charts' :
                      chart.chart_type === 'treemap' ? 'Treemaps' :
                      chart.chart_type === 'funnel' ? 'Funnel Charts' :
                      chart.chart_type === 'kpi' ? 'KPI Cards' :
                      chart.chart_type === 'heatmap' ? 'Heatmaps' :
                      'Other Charts';
      
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(chart);
    });
    return grouped;
  };

  const deleteLayout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this layout template?')) return;
    
    try {
      const res = await fetch(`http://localhost:5001/api/layout-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        setLayouts(layouts.filter(l => l.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete layout:', err);
    }
  };

  const filteredThemes = themes.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCharts = charts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.chart_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLayouts = layouts.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.layout_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-purple-600" />
                Themes & Charts Library
              </h1>
              <p className="text-slate-600 mt-1">
                Browse and manage your imported templates from Lovable dashboards
              </p>
            </div>
            <button
              onClick={fetchTemplates}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('themes')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'themes'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Palette className="w-5 h-5" />
              Themes ({themes.length})
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'charts'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Charts ({charts.length})
            </button>
            <button
              onClick={() => setActiveTab('layouts')}
              className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'layouts'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layout className="w-5 h-5" />
              Layouts ({layouts.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 mx-auto text-slate-400 animate-spin mb-4" />
                <p className="text-slate-600">Loading templates...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {/* Themes Tab */}
                {activeTab === 'themes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredThemes.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <Palette className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600">No themes found</p>
                        <p className="text-sm text-slate-500 mt-2">
                          Import dashboard code from the Code Importer to create themes
                        </p>
                      </div>
                    ) : (
                      filteredThemes.map((theme) => (
                        <div
                          key={theme.id}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-purple-900">{theme.name}</h3>
                              <p className="text-xs text-purple-700 mt-1">{theme.description}</p>
                            </div>
                            <button
                              onClick={() => deleteTheme(theme.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete theme"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Color Palette */}
                          {theme.chart_colors && theme.chart_colors.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-purple-700 mb-2">
                                Colors ({theme.chart_colors.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {theme.chart_colors.slice(0, 8).map((color, idx) => (
                                  <div
                                    key={idx}
                                    className="w-8 h-8 rounded border-2 border-white shadow"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Theme Details */}
                          <div className="text-xs text-purple-700 space-y-1 pt-3 border-t border-purple-200">
                            <div className="flex justify-between">
                              <span className="font-medium">Font:</span>
                              <span>{theme.font_family || 'Default'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Used:</span>
                              <span>{theme.usage_count || 0} times</span>
                            </div>
                          </div>

                          {/* Preview Button */}
                          <button
                            onClick={() => setPreviewTheme(theme)}
                            className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Preview Theme
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Charts Tab */}
                {activeTab === 'charts' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCharts.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600">No chart templates found</p>
                        <p className="text-sm text-slate-500 mt-2">
                          Import dashboard code from the Code Importer to create chart templates
                        </p>
                      </div>
                    ) : (
                      filteredCharts.map((chart) => (
                        <div
                          key={chart.id}
                          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {editingChart?.id === chart.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={newChartName}
                                    onChange={(e) => setNewChartName(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter new name..."
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => renameChart(chart, newChartName)}
                                    className="text-green-600 hover:text-green-700 p-1"
                                    title="Save"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => { setEditingChart(null); setNewChartName(''); }}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                    title="Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="font-semibold text-blue-900">{chart.name}</h3>
                                  <p className="text-xs text-blue-700 mt-1">{chart.description}</p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { 
                                  setEditingChart(chart); 
                                  setNewChartName(chart.name); 
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title="Rename chart"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteChart(chart.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete chart"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Chart Type Badge */}
                          <div className="mb-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
                              {chart.chart_type}
                            </span>
                            <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                              {chart.category}
                            </span>
                          </div>

                          {/* Chart Visual */}
                          <div className="h-20 bg-white/50 rounded flex items-center justify-center mb-3">
                            {chart.chart_type === 'bar' && (
                              <div className="flex items-end gap-1 h-16">
                                <div className="w-3 bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                                <div className="w-3 bg-blue-500 rounded-t" style={{height: '80%'}}></div>
                                <div className="w-3 bg-blue-500 rounded-t" style={{height: '50%'}}></div>
                                <div className="w-3 bg-blue-500 rounded-t" style={{height: '90%'}}></div>
                              </div>
                            )}
                            {chart.chart_type === 'line' && (
                              <svg className="w-20 h-16" viewBox="0 0 80 64">
                                <polyline
                                  points="0,50 20,30 40,35 60,20 80,25"
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="2"
                                />
                              </svg>
                            )}
                            {chart.chart_type === 'pie' && (
                              <svg className="w-16 h-16" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" fill="#3b82f6" fillOpacity="0.3" />
                                <path d="M32,32 L32,4 A28,28 0 0,1 60,32 Z" fill="#3b82f6" />
                              </svg>
                            )}
                            {!['bar', 'line', 'pie'].includes(chart.chart_type) && (
                              <span className="text-3xl">📊</span>
                            )}
                          </div>

                          {/* Chart Details */}
                          <div className="text-xs text-blue-700 space-y-1 pt-3 border-t border-blue-200">
                            <div className="flex justify-between">
                              <span className="font-medium">Colors:</span>
                              <span>{chart.default_colors?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Used:</span>
                              <span>{chart.usage_count || 0} times</span>
                            </div>
                          </div>

                          {/* Preview Button */}
                          <button
                            onClick={() => setPreviewChart(chart)}
                            className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Preview Chart
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Layouts Tab */}
                {activeTab === 'layouts' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLayouts.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <Layout className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600">No layout templates found</p>
                        <p className="text-sm text-slate-500 mt-2">
                          Import dashboard code from the Code Importer to create layout templates
                        </p>
                      </div>
                    ) : (
                      filteredLayouts.map((layout) => (
                        <div
                          key={layout.id}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-green-900">{layout.name}</h3>
                              <p className="text-xs text-green-700 mt-1">{layout.description}</p>
                            </div>
                            <button
                              onClick={() => deleteLayout(layout.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete layout"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Layout Type Badge */}
                          <div className="mb-3">
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full capitalize">
                              {layout.layout_type}
                            </span>
                          </div>

                          {/* Layout Visual */}
                          <div className="h-20 bg-white/50 rounded flex items-center justify-center mb-3 p-2">
                            <div 
                              className="grid gap-1 w-full h-full"
                              style={{ 
                                gridTemplateColumns: `repeat(${layout.num_cols || 3}, 1fr)`,
                                gridTemplateRows: `repeat(${layout.num_rows || 2}, 1fr)`
                              }}
                            >
                              {Array.from({ length: Math.min((layout.num_rows || 2) * (layout.num_cols || 3), 6) }).map((_, idx) => (
                                <div key={idx} className="bg-green-300 rounded"></div>
                              ))}
                            </div>
                          </div>

                          {/* Layout Details */}
                          <div className="text-xs text-green-700 space-y-1 pt-3 border-t border-green-200">
                            <div className="flex justify-between">
                              <span className="font-medium">Grid:</span>
                              <span>{layout.num_rows || 0} × {layout.num_cols || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Used:</span>
                              <span>{layout.usage_count || 0} times</span>
                            </div>
                          </div>

                          {/* Preview Button */}
                          <button
                            onClick={() => setPreviewLayout(layout)}
                            className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Preview Layout
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
            <div className="flex items-center gap-3">
              <Palette className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{themes.length}</p>
                <p className="text-sm text-purple-700">Themes</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{charts.length}</p>
                <p className="text-sm text-blue-700">Charts</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center gap-3">
              <Layout className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{layouts.length}</p>
                <p className="text-sm text-green-700">Layouts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Preview Modal - ENHANCED! */}
        {previewTheme && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              {/* Modal Header with Gradient */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    {previewTheme.name}
                  </h3>
                  <p className="text-purple-100 mt-1">{previewTheme.description}</p>
                </div>
                <button
                  onClick={() => setPreviewTheme(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body - Beautiful Theme Showcase */}
              <div className="p-8">
                <div className="space-y-8">
                  {/* Color Palette - Enhanced with Gradients */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-600" />
                      Color Palette
                    </h4>
                    <div className="grid grid-cols-6 gap-4">
                      {(previewTheme.chart_colors || []).map((color, idx) => (
                        <div key={idx} className="group">
                          <div 
                            className="aspect-square rounded-xl shadow-xl hover:scale-110 transition-all duration-300 cursor-pointer relative overflow-hidden"
                            style={{ 
                              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                            }}
                          >
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <span className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                {idx + 1}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs font-mono text-center mt-2 text-slate-600">{color}</p>
                          <p className="text-xs text-center text-slate-400">Color {idx + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full Dashboard Preview - Much More Beautiful! */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Live Dashboard Preview
                    </h4>
                    <div 
                      className="rounded-2xl p-8 shadow-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${previewTheme.chart_colors?.[0]}15 0%, ${previewTheme.chart_colors?.[1]}15 100%)`
                      }}
                    >
                      {/* Larger, More Impressive KPI Cards */}
                      <div className="grid grid-cols-4 gap-6 mb-8">
                        {[
                          { label: 'Total Revenue', value: '$124.5K', trend: '+23.5%', icon: '💰' },
                          { label: 'Active Users', value: '8,456', trend: '+12.3%', icon: '👥' },
                          { label: 'Conversion Rate', value: '18.2%', trend: '+5.1%', icon: '📈' },
                          { label: 'Growth Score', value: '94/100', trend: '+8.2%', icon: '🎯' },
                        ].map((kpi, idx) => (
                          <div
                            key={idx}
                            className="relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
                            style={{
                              background: `linear-gradient(135deg, ${previewTheme.chart_colors?.[idx] || '#3b82f6'} 0%, ${previewTheme.chart_colors?.[idx]}cc 100%)`,
                              borderRadius: previewTheme.border_radius || '16px',
                              fontFamily: previewTheme.font_family || 'Inter'
                            }}
                          >
                            <div className="absolute top-0 right-0 text-6xl opacity-10">{kpi.icon}</div>
                            <div className="relative z-10">
                              <div className="text-sm opacity-90 mb-2">{kpi.label}</div>
                              <div className="text-3xl font-bold mb-2">{kpi.value}</div>
                              <div className="text-xs opacity-80 flex items-center gap-1">
                                <span className="font-semibold">{kpi.trend}</span>
                                <span>vs last month</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Two Charts Side by Side */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Bar Chart */}
                        <div 
                          className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-xl"
                          style={{ borderRadius: previewTheme.border_radius || '12px' }}
                        >
                          <h5 
                            className="font-bold text-lg mb-4 text-slate-800" 
                            style={{ fontFamily: previewTheme.font_family || 'Inter' }}
                          >
                            📊 Monthly Performance
                          </h5>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={generateSampleData('bar')}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="name" style={{ fontFamily: previewTheme.font_family || 'Inter', fontSize: '12px' }} />
                              <YAxis style={{ fontFamily: previewTheme.font_family || 'Inter', fontSize: '12px' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: previewTheme.border_radius || '8px',
                                  border: 'none',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                              />
                              <Legend wrapperStyle={{ fontFamily: previewTheme.font_family || 'Inter' }} />
                              <Bar dataKey="value" fill={previewTheme.chart_colors?.[0] || '#3b82f6'} radius={[8, 8, 0, 0]} />
                              <Bar dataKey="value2" fill={previewTheme.chart_colors?.[1] || '#8b5cf6'} radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Line Chart */}
                        <div 
                          className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-xl"
                          style={{ borderRadius: previewTheme.border_radius || '12px' }}
                        >
                          <h5 
                            className="font-bold text-lg mb-4 text-slate-800" 
                            style={{ fontFamily: previewTheme.font_family || 'Inter' }}
                          >
                            📈 Growth Trends
                          </h5>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={generateSampleData('line')}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="name" style={{ fontFamily: previewTheme.font_family || 'Inter', fontSize: '12px' }} />
                              <YAxis style={{ fontFamily: previewTheme.font_family || 'Inter', fontSize: '12px' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: previewTheme.border_radius || '8px',
                                  border: 'none',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                              />
                              <Legend wrapperStyle={{ fontFamily: previewTheme.font_family || 'Inter' }} />
                              <Line type="monotone" dataKey="value" stroke={previewTheme.chart_colors?.[2] || '#10b981'} strokeWidth={3} dot={{ r: 5 }} />
                              <Line type="monotone" dataKey="value2" stroke={previewTheme.chart_colors?.[3] || '#f59e0b'} strokeWidth={3} dot={{ r: 5 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theme Technical Details - More Visual */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-4">Theme Specifications</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200 hover:shadow-lg transition-shadow">
                        <div className="text-3xl mb-2">🎨</div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Font Family</p>
                        <p className="text-lg font-bold text-purple-700" style={{ fontFamily: previewTheme.font_family || 'Inter' }}>
                          {previewTheme.font_family || 'Inter'}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-200 hover:shadow-lg transition-shadow">
                        <div className="text-3xl mb-2">📐</div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Border Radius</p>
                        <p className="text-lg font-bold text-blue-700">{previewTheme.border_radius || '8px'}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 hover:shadow-lg transition-shadow">
                        <div className="text-3xl mb-2">💫</div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Shadow Style</p>
                        <p className="text-lg font-bold text-green-700 capitalize">{previewTheme.shadow_style || 'Medium'}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200 hover:shadow-lg transition-shadow">
                        <div className="text-3xl mb-2">📊</div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Usage Count</p>
                        <p className="text-lg font-bold text-orange-700">{previewTheme.usage_count || 0} times</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - More Action */}
              <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 p-6 flex justify-between items-center rounded-b-2xl">
                <div className="text-sm text-slate-600">
                  <p className="font-semibold">✨ This theme includes {previewTheme.chart_colors?.length || 0} colors</p>
                  <p className="text-xs text-slate-500">Perfect for professional dashboards</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreviewTheme(null)}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-white font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => {
                      // Store the selected theme in sessionStorage for cross-page access
                      sessionStorage.setItem('selectedTheme', JSON.stringify(previewTheme));
                      // Navigate to Visual Dashboard Builder
                      window.location.href = '/dashboard-builder?mode=visual&applyTheme=true';
                    }}
                  >
                    <Download className="w-5 h-5" />
                    Apply Theme to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Preview Modal */}
        {previewChart && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewChart.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{previewChart.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
                      {previewChart.chart_type}
                    </span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                      {previewChart.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewChart(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* Modal Body - Chart Preview */}
              <div className="p-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <ResponsiveContainer width="100%" height={400}>
                    {previewChart.chart_type === 'bar' && (
                      <BarChart data={generateSampleData('bar')}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill={previewChart.default_colors?.[0] || '#3b82f6'} />
                        <Bar dataKey="value2" fill={previewChart.default_colors?.[1] || '#8b5cf6'} />
                      </BarChart>
                    )}
                    {previewChart.chart_type === 'line' && (
                      <LineChart data={generateSampleData('line')}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke={previewChart.default_colors?.[0] || '#3b82f6'} strokeWidth={2} />
                        <Line type="monotone" dataKey="value2" stroke={previewChart.default_colors?.[1] || '#8b5cf6'} strokeWidth={2} />
                      </LineChart>
                    )}
                    {previewChart.chart_type === 'area' && (
                      <AreaChart data={generateSampleData('area')}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="value" fill={previewChart.default_colors?.[0] || '#3b82f6'} stroke={previewChart.default_colors?.[0] || '#3b82f6'} />
                        <Area type="monotone" dataKey="value2" fill={previewChart.default_colors?.[1] || '#8b5cf6'} stroke={previewChart.default_colors?.[1] || '#8b5cf6'} />
                      </AreaChart>
                    )}
                    {previewChart.chart_type === 'pie' && (
                      <PieChart>
                        <Pie
                          data={generateSampleData('pie')}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.name}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generateSampleData('pie').map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={previewChart.default_colors?.[index] || ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    )}
                    {previewChart.chart_type === 'scatter' && (
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" />
                        <YAxis dataKey="y" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Data Points" data={generateSampleData('scatter')} fill={previewChart.default_colors?.[0] || '#3b82f6'} />
                      </ScatterChart>
                    )}
                    {previewChart.chart_type === 'radar' && (
                      <RadarChart data={generateSampleData('radar')}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis />
                        <Radar name="Series A" dataKey="A" stroke={previewChart.default_colors?.[0] || '#3b82f6'} fill={previewChart.default_colors?.[0] || '#3b82f6'} fillOpacity={0.6} />
                        <Radar name="Series B" dataKey="B" stroke={previewChart.default_colors?.[1] || '#8b5cf6'} fill={previewChart.default_colors?.[1] || '#8b5cf6'} fillOpacity={0.6} />
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    )}
                    {previewChart.chart_type === 'treemap' && (
                      <Treemap
                        data={generateSampleData('treemap')}
                        dataKey="size"
                        aspectRatio={4/3}
                        stroke="#fff"
                        fill={previewChart.default_colors?.[0] || '#3b82f6'}
                      >
                        <Tooltip />
                      </Treemap>
                    )}
                    {(previewChart.chart_type === 'composed' || previewChart.chart_type === 'unknown') && (
                      <BarChart data={generateSampleData('bar')}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill={previewChart.default_colors?.[0] || '#3b82f6'} />
                        <Line type="monotone" dataKey="value2" stroke={previewChart.default_colors?.[1] || '#8b5cf6'} />
                      </BarChart>
                    )}
                    {previewChart.chart_type === 'funnel' && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="space-y-2">
                            {generateSampleData('funnel').map((item: any, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  width: `${300 - idx * 50}px`,
                                  backgroundColor: previewChart.default_colors?.[idx % (previewChart.default_colors?.length || 1)] || ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][idx],
                                }}
                                className="h-16 rounded flex items-center justify-center text-white font-semibold mx-auto"
                              >
                                {item.name}: {item.value}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {previewChart.chart_type === 'kpi' && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8 bg-white/80 rounded-xl">
                          <div className="text-6xl font-bold" style={{ color: previewChart.default_colors?.[0] || '#3b82f6' }}>
                            1,234
                          </div>
                          <div className="text-xl text-slate-600 mt-2">Key Performance Indicator</div>
                          <div className="text-sm text-green-600 mt-2 font-semibold">↑ 12.5% from last month</div>
                        </div>
                      </div>
                    )}
                    {previewChart.chart_type === 'heatmap' && (
                      <div className="grid grid-cols-6 gap-2 p-4">
                        {Array.from({ length: 24 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded"
                            style={{
                              backgroundColor: previewChart.default_colors?.[0] || '#3b82f6',
                              opacity: 0.3 + (Math.random() * 0.7)
                            }}
                            title={`Value: ${Math.floor(Math.random() * 100)}`}
                          />
                        ))}
                      </div>
                    )}
                    {(previewChart.chart_type === 'custom' || !['bar', 'line', 'area', 'pie', 'scatter', 'radar', 'treemap', 'composed', 'unknown', 'funnel', 'kpi', 'heatmap'].includes(previewChart.chart_type)) && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📊</div>
                          <p className="text-slate-600 font-medium">Custom {previewChart.chart_type} Chart</p>
                          <p className="text-sm text-slate-500 mt-2">Preview not available for this chart type</p>
                        </div>
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Chart Info */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Chart Type</p>
                    <p className="text-sm text-slate-600 capitalize">{previewChart.chart_type}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Library</p>
                    <p className="text-sm text-slate-600">{previewChart.category}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Colors</p>
                    <div className="flex gap-1 mt-1">
                      {(previewChart.default_colors || []).slice(0, 5).map((color, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Usage</p>
                    <p className="text-sm text-slate-600">{previewChart.usage_count || 0} times</p>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> This is a preview with sample data. The actual chart will use your dashboard's real data when applied.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end gap-3">
                <button
                  onClick={() => setPreviewChart(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  onClick={() => {
                    // Store the selected chart in sessionStorage for cross-page access
                    sessionStorage.setItem('selectedChart', JSON.stringify(previewChart));
                    // Navigate to Visual Dashboard Builder
                    window.location.href = '/dashboard-builder?mode=visual&addChart=true';
                  }}
                >
                  <Download className="w-4 h-4" />
                  Use in Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Layout Preview Modal - NEW! */}
        {previewLayout && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewLayout.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{previewLayout.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {previewLayout.num_rows} × {previewLayout.num_cols} Grid
                    </span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded capitalize">
                      {previewLayout.layout_type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewLayout(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* Modal Body - Layout Preview */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Smart Layout Interpretation */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Layout className="w-5 h-5 text-green-600" />
                      Dashboard Layout Structure
                    </h4>
                    
                    {/* Realistic Dashboard Preview */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200">
                      {/* KPI-Focused Layout */}
                      {previewLayout.layout_type === 'kpi-focused' && (
                        <div className="space-y-4">
                          <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border-2 border-blue-300">
                            <p className="text-sm font-semibold text-blue-700">📊 KPI-Focused Dashboard</p>
                            <p className="text-xs text-slate-600 mt-1">Key metrics at top, main chart below, supporting charts at bottom</p>
                          </div>
                          {/* KPI Row */}
                          <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-md p-4 border-2 border-blue-300">
                                <div className="text-blue-600 text-2xl mb-1">💰</div>
                                <div className="text-xs text-slate-600">KPI Metric {i}</div>
                                <div className="text-xl font-bold text-blue-700">{(i * 12345).toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                          {/* Main Chart */}
                          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-300">
                            <div className="text-sm font-semibold text-slate-700 mb-3">📈 Main Trend Chart (Full Width)</div>
                            <div className="h-56 bg-gradient-to-br from-blue-100 to-cyan-100 rounded flex items-center justify-center text-slate-500">
                              Primary Line/Area Chart
                            </div>
                          </div>
                          {/* Side Charts */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-blue-300">
                              <div className="text-sm font-semibold text-slate-700 mb-2">📊 Breakdown</div>
                              <div className="h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded flex items-center justify-center text-xs text-slate-500">
                                Bar Chart
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-blue-300">
                              <div className="text-sm font-semibold text-slate-700 mb-2">🥧 Distribution</div>
                              <div className="h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded flex items-center justify-center text-xs text-slate-500">
                                Pie Chart
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comparison Layout */}
                      {previewLayout.layout_type === 'comparison' && (
                        <div className="space-y-4">
                          <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border-2 border-purple-300">
                            <p className="text-sm font-semibold text-purple-700">⚖️ Comparison Layout</p>
                            <p className="text-xs text-slate-600 mt-1">Side-by-side comparison of metrics and charts</p>
                          </div>
                          {/* KPI Row (3 cols) */}
                          <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md p-4 border-2 border-purple-300">
                                <div className="text-purple-600 text-2xl mb-1">📊</div>
                                <div className="text-xs text-slate-600">Metric {i}</div>
                                <div className="text-xl font-bold text-purple-700">{(i * 9876).toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                          {/* Side-by-Side Charts */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg shadow-lg p-5 border-2 border-purple-300">
                              <div className="text-sm font-semibold text-slate-700 mb-3">📈 Option A</div>
                              <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center text-slate-500">
                                Comparison Chart A
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-lg p-5 border-2 border-purple-300">
                              <div className="text-sm font-semibold text-slate-700 mb-3">📊 Option B</div>
                              <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center text-slate-500">
                                Comparison Chart B
                              </div>
                            </div>
                          </div>
                          {/* More Comparisons */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-purple-300">
                              <div className="text-sm font-semibold text-slate-700 mb-2">🥧 Split View 1</div>
                              <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center text-xs text-slate-500">
                                Detail Chart
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-purple-300">
                              <div className="text-sm font-semibold text-slate-700 mb-2">📋 Split View 2</div>
                              <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center text-xs text-slate-500">
                                Detail Chart
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Trend Analysis Layout */}
                      {previewLayout.layout_type === 'trend' && (
                        <div className="space-y-4">
                          <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border-2 border-orange-300">
                            <p className="text-sm font-semibold text-orange-700">📈 Trend Analysis Layout</p>
                            <p className="text-xs text-slate-600 mt-1">Main trend chart dominates, with supporting analytics below</p>
                          </div>
                          {/* Main Trend Chart (Large) */}
                          <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-orange-300">
                            <div className="text-base font-bold text-slate-800 mb-4">📊 Primary Trend Visualization (Full Width, Tall)</div>
                            <div className="h-72 bg-gradient-to-br from-orange-100 to-amber-100 rounded flex items-center justify-center text-slate-600 text-lg">
                              Main Time Series / Trend Chart
                            </div>
                          </div>
                          {/* Supporting Charts */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg shadow-lg p-5 border-2 border-orange-300">
                              <div className="text-sm font-semibold text-slate-700 mb-3">📉 Supporting Metric 1</div>
                              <div className="h-40 bg-gradient-to-br from-orange-100 to-amber-100 rounded flex items-center justify-center text-slate-500">
                                Supporting Chart A
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-lg p-5 border-2 border-orange-300">
                              <div className="text-sm font-semibold text-slate-700 mb-3">💹 Supporting Metric 2</div>
                              <div className="h-40 bg-gradient-to-br from-orange-100 to-amber-100 rounded flex items-center justify-center text-slate-500">
                                Supporting Chart B
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Flex/Grid/Sidebar Layouts (from imported code) */}
                      {(previewLayout.layout_type === 'flex' || previewLayout.layout_type === 'grid' || previewLayout.layout_type === 'sidebar') && (
                        <div className="space-y-4">
                          <div className="bg-white/80 backdrop-blur rounded-lg p-3 text-center border-2 border-green-300">
                            <p className="text-sm font-semibold text-green-700 capitalize">📐 {previewLayout.layout_type} Layout</p>
                            <p className="text-xs text-slate-600 mt-1">
                              {previewLayout.layout_type === 'sidebar' ? 'Sidebar navigation with main content area' :
                               previewLayout.layout_type === 'flex' ? 'Flexible layout that adapts to content dynamically' :
                               'Custom grid layout with multiple columns'}
                            </p>
                          </div>

                          {previewLayout.layout_type === 'sidebar' ? (
                            /* Sidebar Preview */
                            <div className="flex gap-4 h-64">
                              <div className="w-48 bg-white rounded-lg shadow-md p-4 border-2 border-green-300">
                                <div className="text-sm font-bold text-slate-700 mb-3">📋 Sidebar</div>
                                <div className="space-y-2">
                                  {['Menu 1', 'Menu 2', 'Menu 3', 'Menu 4'].map((item, i) => (
                                    <div key={i} className="h-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded flex items-center justify-center text-xs">
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex-1 bg-white rounded-lg shadow-md p-6 border-2 border-green-300">
                                <div className="text-sm font-semibold text-slate-700 mb-3">📊 Main Content Area</div>
                                <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 rounded flex items-center justify-center text-slate-500">
                                  Dashboard Charts & Data
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Flex/Grid Preview */
                            <div className="space-y-3">
                              <div className="grid grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                  <div key={i} className="bg-white rounded-lg shadow-md p-3 border-2 border-green-300">
                                    <div className="text-green-600 text-xl mb-1">📈</div>
                                    <div className="text-xs text-slate-600">Card {i}</div>
                                    <div className="text-base font-bold text-green-700">{i * 234}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                {[1, 2].map(i => (
                                  <div key={i} className="bg-white rounded-lg shadow-md p-4 border-2 border-green-300">
                                    <div className="text-sm font-semibold text-slate-700 mb-2">Chart {i}</div>
                                    <div className="h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded flex items-center justify-center text-xs text-slate-500">
                                      Visualization {i}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-white rounded-lg shadow-md p-4 border-2 border-green-300">
                                <div className="text-sm font-semibold text-slate-700 mb-2">Full Width Element</div>
                                <div className="h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded flex items-center justify-center text-xs text-slate-500">
                                  Table / Timeline
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layout Information Cards */}
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-4">Layout Specifications</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                        <div className="text-3xl mb-2">📐</div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Grid Type</p>
                        <p className="text-lg font-bold text-green-700 capitalize">
                          {previewLayout.layout_type || 'Standard'}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {previewLayout.num_rows} rows × {previewLayout.num_cols} columns
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-200">
                        <div className="text-3xl mb-2">🎯</div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Best For</p>
                        <p className="text-sm font-bold text-blue-700">
                          {previewLayout.recommended_for || 'General Dashboards'}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                        <div className="text-3xl mb-2">📊</div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">Usage</p>
                        <p className="text-lg font-bold text-purple-700">{previewLayout.usage_count || 0} times</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {previewLayout.usage_count && previewLayout.usage_count > 0 ? 'Proven layout' : 'New layout'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Usage Tips */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      💡 Layout Tips
                    </h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {previewLayout.layout_type === 'flex' || (previewLayout.num_cols && previewLayout.num_cols > 8) ? (
                        <>
                          <li>• <strong>Flexible:</strong> Charts adapt to screen size automatically</li>
                          <li>• <strong>Responsive:</strong> Works great on mobile, tablet, and desktop</li>
                          <li>• <strong>Best for:</strong> Dashboards with varying chart sizes</li>
                        </>
                      ) : (
                        <>
                          <li>• <strong>Fixed Grid:</strong> Consistent chart sizing across dashboard</li>
                          <li>• <strong>Organized:</strong> Clear structure with {previewLayout.num_rows} rows × {previewLayout.num_cols} columns</li>
                          <li>• <strong>Best for:</strong> {previewLayout.recommended_for || 'Structured dashboards with uniform charts'}</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end gap-3">
                <button
                  onClick={() => setPreviewLayout(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  onClick={() => {
                    // Store the selected layout in sessionStorage for cross-page access
                    sessionStorage.setItem('selectedLayout', JSON.stringify(previewLayout));
                    // Navigate to Visual Dashboard Builder
                    window.location.href = '/dashboard-builder?mode=visual&applyLayout=true';
                  }}
                >
                  <Download className="w-4 h-4" />
                  Apply Layout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemesAndCharts;

