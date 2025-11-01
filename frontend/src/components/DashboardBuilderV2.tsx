import React, { useState, useEffect } from 'react';
import { 
  Plus, Database, Table2, Layout, Sparkles, Eye, Save, 
  Settings, Palette, Grid3x3, ChevronRight, X, Check,
  BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon,
  Activity, Target, MousePointer2, Zap, Layers, FileCode, 
  CheckCircle2, Info, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DashboardBuilderV2Props {
  editingDashboard?: {
    id: string;
    title: string;
    description: string;
    spec: any;
  } | null;
}

const DashboardBuilderV2: React.FC<DashboardBuilderV2Props> = ({ editingDashboard }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState(1);
  const [dataMode, setDataMode] = useState<'datasource' | 'datamart'>('datasource');
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedDataMart, setSelectedDataMart] = useState<number | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<any>(null);
  const [dashboardName, setDashboardName] = useState('My Dashboard');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<any>(null);
  const [selectedCharts, setSelectedCharts] = useState<any[]>([]);
  
  // Data
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [dataMarts, setDataMarts] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [charts, setCharts] = useState<any[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingDataSources, setLoadingDataSources] = useState(true);
  const [loadingDataMarts, setLoadingDataMarts] = useState(true);
  const [error, setError] = useState<string>('');
  const [dashboardCreated, setDashboardCreated] = useState(false);
  const [createdDashboardId, setCreatedDashboardId] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchDataSources();
    fetchDataMarts();
    fetchLayouts();
    fetchThemes();
    fetchCharts();
  }, []);

  const fetchDataSources = async () => {
    try {
      setLoadingDataSources(true);
      setError('');
      const response = await fetch('/api/data-sources', { credentials: 'include' });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to access data sources');
          toast({
            title: '🔒 Authentication Required',
            description: 'Please log in to continue',
            variant: 'destructive'
          });
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        throw new Error(`Failed to fetch data sources: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data sources API response:', data);
      
      // Handle different response formats
      let sources = [];
      if (Array.isArray(data)) {
        sources = data;
      } else if (data.data_sources && Array.isArray(data.data_sources)) {
        sources = data.data_sources;
      } else if (data.sources && Array.isArray(data.sources)) {
        sources = data.sources;
      }
      
      console.log('Parsed data sources:', sources);
      setDataSources(sources);
      
      if (!data.data_sources || data.data_sources.length === 0) {
        console.warn('No data sources available');
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
      setError('Failed to load data sources');
      toast({
        title: '❌ Error',
        description: 'Failed to load data sources. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoadingDataSources(false);
    }
  };

  const fetchDataMarts = async () => {
    try {
      setLoadingDataMarts(true);
      const response = await fetch('/api/data-marts', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data marts: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data marts API response:', data);
      
      // Handle different response formats
      let marts = [];
      if (Array.isArray(data)) {
        marts = data;
      } else if (data.data_marts && Array.isArray(data.data_marts)) {
        marts = data.data_marts;
      } else if (data.marts && Array.isArray(data.marts)) {
        marts = data.marts;
      }
      
      console.log('Parsed data marts:', marts);
      setDataMarts(marts);
    } catch (error) {
      console.error('Error fetching data marts:', error);
    } finally {
      setLoadingDataMarts(false);
    }
  };

  const fetchLayouts = async () => {
    try {
      const response = await fetch('/api/layout-templates', { credentials: 'include' });
      const data = await response.json();
      setLayouts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching layouts:', error);
    }
  };

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/custom-themes', { credentials: 'include' });
      const data = await response.json();
      setThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  const fetchCharts = async () => {
    try {
      const response = await fetch('/api/chart-templates', { credentials: 'include' });
      const data = await response.json();
      setCharts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching charts:', error);
    }
  };

  const fetchTables = async (dataSourceId: string) => {
    try {
      const response = await fetch(`/api/data-sources/${dataSourceId}/schema`, { credentials: 'include' });
      const data = await response.json();
      const tableNames = Object.keys(data.schema || {});
      setTables(tableNames);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleDataSourceChange = (dsId: string) => {
    setSelectedDataSource(dsId);
    setSelectedTable('');
    setTables([]);
    if (dsId) {
      fetchTables(dsId);
    }
  };

  const canProceedToStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 2:
        return (dataMode === 'datasource' && selectedDataSource !== '' && selectedTable !== '') ||
               (dataMode === 'datamart' && selectedDataMart !== null);
      case 3:
        return true; // Can always skip layout
      case 4:
        return dashboardName.trim() !== '';
      case 5:
        return dashboardName.trim() !== '';
      default:
        return true;
    }
  };

  // Generate placeholder charts based on selected layout or default structure
  const generatePlaceholderCharts = () => {
    const charts: any[] = [];
    
    // If layout is selected, use its structure
    if (selectedLayout) {
      const layoutType = selectedLayout.layout_type;
      
      if (layoutType === 'kpi-focused' || layoutType === 'kpi-dashboard') {
        // 4 KPI cards + 2 charts
        for (let i = 0; i < 4; i++) {
          charts.push({
            id: `chart-kpi-${i + 1}`,
            type: 'kpi',
            title: `Key Metric ${i + 1}`,
            query: `SELECT COUNT(*) as value FROM ${selectedTable || 'table'}`,
            x: 'label',
            y: 'value'
          });
        }
        charts.push({
          id: 'chart-trend-1',
          type: 'line',
          title: 'Trend Analysis',
          query: `SELECT date, COUNT(*) as value FROM ${selectedTable || 'table'} GROUP BY date LIMIT 30`,
          x: 'date',
          y: 'value'
        });
        charts.push({
          id: 'chart-category-1',
          type: 'bar',
          title: 'Category Breakdown',
          query: `SELECT category, COUNT(*) as value FROM ${selectedTable || 'table'} GROUP BY category LIMIT 10`,
          x: 'category',
          y: 'value'
        });
      } else if (layoutType === 'comparison') {
        // 2 KPI cards + 4 comparison charts
        for (let i = 0; i < 2; i++) {
          charts.push({
            id: `chart-kpi-${i + 1}`,
            type: 'kpi',
            title: `Total ${i === 0 ? 'Count' : 'Sum'}`,
            query: `SELECT COUNT(*) as value FROM ${selectedTable || 'table'}`,
            x: 'label',
            y: 'value'
          });
        }
        for (let i = 0; i < 4; i++) {
          charts.push({
            id: `chart-comparison-${i + 1}`,
            type: i % 2 === 0 ? 'bar' : 'pie',
            title: `Comparison ${i + 1}`,
            query: `SELECT category, COUNT(*) as value FROM ${selectedTable || 'table'} GROUP BY category LIMIT 10`,
            x: 'category',
            y: 'value'
          });
        }
      } else if (layoutType === 'trend') {
        // 2 KPI + 1 main trend + 2 supporting
        for (let i = 0; i < 2; i++) {
          charts.push({
            id: `chart-kpi-${i + 1}`,
            type: 'kpi',
            title: `Key Metric ${i + 1}`,
            query: `SELECT COUNT(*) as value FROM ${selectedTable || 'table'}`,
            x: 'label',
            y: 'value'
          });
        }
        charts.push({
          id: 'chart-trend-main',
          type: 'area',
          title: 'Main Trend',
          query: `SELECT date, COUNT(*) as value FROM ${selectedTable || 'table'} GROUP BY date LIMIT 30`,
          x: 'date',
          y: 'value'
        });
        charts.push({
          id: 'chart-support-1',
          type: 'line',
          title: 'Supporting Metric 1',
          query: `SELECT date, SUM(value) as total FROM ${selectedTable || 'table'} GROUP BY date LIMIT 30`,
          x: 'date',
          y: 'total'
        });
        charts.push({
          id: 'chart-support-2',
          type: 'bar',
          title: 'Supporting Metric 2',
          query: `SELECT category, COUNT(*) as count FROM ${selectedTable || 'table'} GROUP BY category LIMIT 10`,
          x: 'category',
          y: 'count'
        });
      }
    }
    
    // Default structure if no layout or layout doesn't match known types
    if (charts.length === 0) {
      // Create a standard dashboard: 3 KPIs + 2 charts + 1 table
      charts.push(
        {
          id: 'chart-kpi-1',
          type: 'kpi',
          title: 'Total Records',
          query: `SELECT COUNT(*) as value FROM ${selectedTable || 'table'}`,
          x: 'label',
          y: 'value'
        },
        {
          id: 'chart-kpi-2',
          type: 'kpi',
          title: 'Total Sum',
          query: `SELECT SUM(amount) as value FROM ${selectedTable || 'table'}`,
          x: 'label',
          y: 'value'
        },
        {
          id: 'chart-kpi-3',
          type: 'kpi',
          title: 'Average',
          query: `SELECT AVG(value) as value FROM ${selectedTable || 'table'}`,
          x: 'label',
          y: 'value'
        },
        {
          id: 'chart-trend-1',
          type: 'line',
          title: 'Trend Over Time',
          query: `SELECT date, COUNT(*) as count FROM ${selectedTable || 'table'} GROUP BY date LIMIT 30`,
          x: 'date',
          y: 'count'
        },
        {
          id: 'chart-category-1',
          type: 'bar',
          title: 'Category Distribution',
          query: `SELECT category, COUNT(*) as count FROM ${selectedTable || 'table'} GROUP BY category LIMIT 10`,
          x: 'category',
          y: 'count'
        },
        {
          id: 'chart-table-1',
          type: 'table',
          title: 'Data Table',
          query: `SELECT * FROM ${selectedTable || 'table'} LIMIT 100`,
          x: '',
          y: ''
        }
      );
    }
    
    return charts;
  };

  // Generate layout configuration for the charts
  const generateLayoutConfig = (charts: any[]) => {
    const layout: any[] = [];
    let currentY = 0;
    
    charts.forEach((chart, index) => {
      if (chart.type === 'kpi') {
        // KPIs in a row (3 columns each)
        const kpiIndex = layout.filter(l => charts.find(c => c.id === l.i)?.type === 'kpi').length;
        layout.push({
          i: chart.id,
          x: (kpiIndex % 4) * 3,
          y: Math.floor(kpiIndex / 4) * 2,
          w: 3,
          h: 2,
          minW: 2,
          minH: 2
        });
      } else if (chart.type === 'table') {
        // Tables full width at bottom
        layout.push({
          i: chart.id,
          x: 0,
          y: currentY + 10,
          w: 12,
          h: 6,
          minW: 6,
          minH: 4
        });
      } else {
        // Regular charts (half width)
        const chartIndex = layout.filter(l => {
          const c = charts.find(ch => ch.id === l.i);
          return c && c.type !== 'kpi' && c.type !== 'table';
        }).length;
        layout.push({
          i: chart.id,
          x: (chartIndex % 2) * 6,
          y: currentY + 4 + Math.floor(chartIndex / 2) * 4,
          w: 6,
          h: 4,
          minW: 4,
          minH: 3
        });
      }
    });
    
    return layout;
  };

  const handleCreateDashboard = async () => {
    setCreating(true);
    
    try {
      // Generate placeholder charts based on layout or default structure
      const placeholderCharts = generatePlaceholderCharts();
      
      // Build dashboard specification with framework
      const spec: any = {
        title: dashboardName,
        description: dashboardDescription,
        theme: selectedTheme ? 'custom' : 'default',
        charts: placeholderCharts,
        filters: [],
        layout: generateLayoutConfig(placeholderCharts),
        metadata: {}
      };

      // Set data source info
      if (dataMode === 'datasource') {
        spec.dataSourceId = selectedDataSource;
        spec.metadata.tableName = selectedTable;
      } else if (selectedDataMart) {
        spec.dataMartId = selectedDataMart;
      }

      // Apply custom theme if selected
      if (selectedTheme) {
        spec.metadata.customTheme = selectedTheme;
      }

      // Apply layout if selected
      if (selectedLayout) {
        spec.metadata.customLayout = selectedLayout;
        spec.metadata.layoutApplied = true;
      }

      // Wrap in the format expected by API
      const payload = {
        title: dashboardName,
        description: dashboardDescription || '',
        spec: spec
      };

      console.log('Saving dashboard:', payload);

      // Save dashboard via API
      const response = await fetch('/api/save-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create dashboard');
      }

      const result = await response.json();
      console.log('Dashboard created:', result);
      
      // Success! Mark as created and show success state
      setDashboardCreated(true);
      
      // Try to get dashboard ID from various possible fields
      const dashboardId = result.id || result.dashboard_id || result.data?.id || result.data?.dashboard_id;
      setCreatedDashboardId(dashboardId);
      
      console.log('Dashboard ID:', dashboardId);
      
      toast({
        title: '🎉 Dashboard Created Successfully!',
        description: `${dashboardName} has been saved`,
      });

    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to create dashboard. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const getSelectedDataSourceName = () => {
    const ds = dataSources.find(d => d.id === selectedDataSource);
    return ds?.name || 'Unknown';
  };

  const getSelectedDataMartName = () => {
    const dm = dataMarts.find(d => d.id === selectedDataMart);
    return dm?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Builder 2.0</h1>
                <p className="text-sm text-gray-500">Modern, Fast & Intuitive</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard-builder')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Builder V1
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Select Data', icon: Database },
              { num: 2, title: 'Choose Layout', icon: Layout },
              { num: 3, title: 'Configure', icon: Settings },
              { num: 4, title: 'Customize', icon: Palette },
              { num: 5, title: 'Review & Create', icon: CheckCircle2 }
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <button
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl transition ${
                    step === s.num
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : step > s.num
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  } ${canProceedToStep(s.num) || step > s.num ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  onClick={() => {
                    if (step > s.num || canProceedToStep(s.num)) {
                      setStep(s.num);
                    }
                  }}
                  disabled={!canProceedToStep(s.num) && step < s.num}
                >
                  <div className={`p-2 rounded-lg ${
                    step === s.num ? 'bg-white/20' : step > s.num ? 'bg-green-200' : 'bg-gray-200'
                  }`}>
                    {step > s.num ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-semibold ${
                      step === s.num ? 'text-white/80' : step > s.num ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      STEP {s.num}
                    </div>
                    <div className="text-sm font-bold">{s.title}</div>
                  </div>
                </button>
                {index < 4 && (
                  <ChevronRight className={`w-5 h-5 ${step > s.num ? 'text-green-500' : 'text-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Step 1: Select Data */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Select Your Data Source</h2>
                <p className="text-gray-600">Choose where your dashboard data will come from</p>
              </div>
            </div>

            {/* Data Mode Toggle */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => {
                  setDataMode('datasource');
                  setSelectedDataMart(null);
                }}
                className={`flex-1 p-6 rounded-xl border-2 transition ${
                  dataMode === 'datasource'
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <Database className={`w-8 h-8 mb-3 ${dataMode === 'datasource' ? 'text-blue-600' : 'text-gray-400'}`} />
                <h3 className="font-bold text-lg mb-1">Data Source</h3>
                <p className="text-sm text-gray-600">Connect to database tables</p>
              </button>
              <button
                onClick={() => {
                  setDataMode('datamart');
                  setSelectedDataSource('');
                  setSelectedTable('');
                }}
                className={`flex-1 p-6 rounded-xl border-2 transition ${
                  dataMode === 'datamart'
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <Layers className={`w-8 h-8 mb-3 ${dataMode === 'datamart' ? 'text-purple-600' : 'text-gray-400'}`} />
                <h3 className="font-bold text-lg mb-1">Data Mart</h3>
                <p className="text-sm text-gray-600">Use pre-built data views</p>
              </button>
            </div>

            {/* Data Source Selection */}
            {dataMode === 'datasource' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Select Data Source *</label>
                  
                  {/* Loading State */}
                  {loadingDataSources ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Loading data sources...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 bg-red-50 rounded-xl border-2 border-red-200">
                      <X className="w-12 h-12 mx-auto mb-3 text-red-500" />
                      <p className="text-red-600 font-medium mb-2">{error}</p>
                      <button
                        onClick={fetchDataSources}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : dataSources.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {dataSources.map((ds) => (
                        <button
                          key={ds.id}
                          onClick={() => handleDataSourceChange(ds.id)}
                          className={`p-4 rounded-xl border-2 text-left transition ${
                            selectedDataSource === ds.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Database className={`w-6 h-6 ${selectedDataSource === ds.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div>
                              <div className="font-semibold">{ds.name}</div>
                              <div className="text-xs text-gray-500">{ds.connection_type}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 font-medium mb-2">No data sources available</p>
                      <p className="text-sm text-gray-500 mb-4">Please add a data source first</p>
                      <button
                        onClick={() => navigate('/database-management')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-flex items-center gap-2"
                      >
                        <Database className="w-5 h-5" />
                        Go to Data Management
                      </button>
                    </div>
                  )}
                </div>

                {selectedDataSource && tables.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Select Table *</label>
                    <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                      {tables.map((table) => (
                        <button
                          key={table}
                          onClick={() => setSelectedTable(table)}
                          className={`p-3 rounded-lg border-2 text-left transition text-sm ${
                            selectedTable === table
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                          }`}
                        >
                          <Table2 className={`w-4 h-4 inline mr-2 ${selectedTable === table ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className="font-medium">{table}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data Mart Selection */}
            {dataMode === 'datamart' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Data Mart *</label>
                
                {/* Loading State */}
                {loadingDataMarts ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading data marts...</p>
                  </div>
                ) : dataMarts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {dataMarts.map((dm) => (
                      <button
                        key={dm.id}
                        onClick={() => setSelectedDataMart(dm.id)}
                        className={`p-4 rounded-xl border-2 text-left transition ${
                          selectedDataMart === dm.id
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Layers className={`w-6 h-6 ${selectedDataMart === dm.id ? 'text-purple-600' : 'text-gray-400'}`} />
                          <div>
                            <div className="font-semibold">{dm.name}</div>
                            <div className="text-xs text-gray-500">Data Mart</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 font-medium mb-2">No data marts available</p>
                    <p className="text-sm text-gray-500 mb-4">Please create a data mart first</p>
                    <button
                      onClick={() => navigate('/database-management')}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold inline-flex items-center gap-2"
                    >
                      <Layers className="w-5 h-5" />
                      Go to Data Management
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Action Hint */}
            {canProceedToStep(2) && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-1">Quick Start Available!</h4>
                    <p className="text-sm text-green-800 mb-3">
                      You can start building immediately, or customize your dashboard with layouts and themes in the next steps.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setDashboardName(`${dataMode === 'datasource' ? selectedTable : getSelectedDataMartName()} Dashboard`);
                          handleCreateDashboard();
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                      >
                        <Zap className="w-5 h-5" />
                        Create Dashboard Now
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="px-6 py-2.5 bg-white border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition flex items-center gap-2"
                      >
                        Customize First
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {canProceedToStep(2) 
                  ? "Selection complete! Choose an option above or continue to customize."
                  : "Select a data source and table to continue"}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep(2)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue to Layout
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Layout */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Layout className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Choose Dashboard Layout</h2>
                <p className="text-gray-600">Select a pre-designed layout structure (optional)</p>
              </div>
            </div>

            {layouts.length > 0 ? (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {layouts.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout)}
                      className={`p-5 rounded-xl border-2 text-left transition ${
                        selectedLayout?.id === layout.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Grid3x3 className={`w-6 h-6 ${selectedLayout?.id === layout.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                        {selectedLayout?.id === layout.id && (
                          <span className="px-2 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-1">{layout.name}</h3>
                      <p className="text-xs text-gray-500 capitalize mb-2">{layout.layout_type} Layout</p>
                      {layout.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{layout.description}</p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Tip:</strong> Layouts create placeholder charts that you can customize later. Skip this step if you want to start from scratch.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <Layout className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Custom Layouts Available</h3>
                <p className="text-gray-600 mb-4">Import dashboard code to extract layout templates</p>
                <button
                  onClick={() => window.open('/code-importer', '_blank')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold inline-flex items-center gap-2"
                >
                  <FileCode className="w-5 h-5" />
                  Go to Code Importer
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
                >
                  Skip Layout
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                >
                  Continue to Configure
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Configure */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Configure Dashboard</h2>
                <p className="text-gray-600">Set your dashboard name and description</p>
              </div>
            </div>

            <div className="space-y-6 max-w-3xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Dashboard Name *
                </label>
                <input
                  type="text"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="e.g., Sales Performance Dashboard"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Description (Optional)
                </label>
                <textarea
                  value={dashboardDescription}
                  onChange={(e) => setDashboardDescription(e.target.value)}
                  placeholder="Describe what this dashboard will show..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Summary Card */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                <h3 className="font-bold text-lg mb-4 text-purple-900">Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-xs text-purple-600 font-semibold">DATA SOURCE</div>
                      <div className="font-semibold text-purple-900">
                        {dataMode === 'datasource' ? `${getSelectedDataSourceName()} → ${selectedTable}` : getSelectedDataMartName()}
                      </div>
                    </div>
                  </div>
                  {selectedLayout && (
                    <div className="flex items-center gap-3">
                      <Layout className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-xs text-purple-600 font-semibold">LAYOUT</div>
                        <div className="font-semibold text-purple-900">{selectedLayout.name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!canProceedToStep(4)}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue to Customize
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Customize */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-pink-100 rounded-xl">
                <Palette className="w-8 h-8 text-pink-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Customize Appearance</h2>
                <p className="text-gray-600">Choose theme and add chart templates (optional)</p>
              </div>
            </div>

            {/* Themes Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Palette className="w-6 h-6 text-pink-600" />
                Select Theme (Optional)
              </h3>
              {themes.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {themes.map((theme) => {
                    const colors = theme.chart_colors || theme.colors?.chart_colors || [];
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme)}
                        className={`p-4 rounded-xl border-2 text-left transition ${
                          selectedTheme?.id === theme.id
                            ? 'border-pink-500 bg-pink-50 shadow-lg'
                            : 'border-gray-200 hover:border-pink-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">🎨</span>
                          {selectedTheme?.id === theme.id && (
                            <Check className="w-5 h-5 text-pink-600" />
                          )}
                        </div>
                        <p className="font-semibold text-sm mb-2 truncate">{theme.name}</p>
                        <div className="flex gap-1">
                          {Array.isArray(colors) && colors.slice(0, 4).map((color: string, i: number) => (
                            <div
                              key={i}
                              className="h-6 w-full rounded"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Palette className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium">No custom themes available</p>
                </div>
              )}
            </div>

            {/* Charts Section */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-pink-600" />
                Pre-select Chart Templates (Optional)
              </h3>
              {charts.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {charts.slice(0, 12).map((chart) => (
                    <button
                      key={chart.id}
                      onClick={() => {
                        const isSelected = selectedCharts.find(c => c.id === chart.id);
                        if (isSelected) {
                          setSelectedCharts(selectedCharts.filter(c => c.id !== chart.id));
                        } else {
                          setSelectedCharts([...selectedCharts, chart]);
                        }
                      }}
                      className={`p-3 rounded-lg border-2 text-left transition text-sm ${
                        selectedCharts.find(c => c.id === chart.id)
                          ? 'border-pink-500 bg-pink-50 shadow-md'
                          : 'border-gray-200 hover:border-pink-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">
                          {chart.chart_type === 'bar' && '📊'}
                          {chart.chart_type === 'line' && '📈'}
                          {chart.chart_type === 'pie' && '🥧'}
                          {chart.chart_type === 'area' && '📉'}
                          {chart.chart_type === 'kpi' && '🎯'}
                          {!['bar', 'line', 'pie', 'area', 'kpi'].includes(chart.chart_type) && '📊'}
                        </span>
                        {selectedCharts.find(c => c.id === chart.id) && (
                          <Check className="w-4 h-4 text-pink-600" />
                        )}
                      </div>
                      <p className="font-semibold text-xs truncate">{chart.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{chart.chart_type}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium">No chart templates available</p>
                </div>
              )}
              {selectedCharts.length > 0 && (
                <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                  <p className="text-sm text-pink-800">
                    <strong>{selectedCharts.length}</strong> chart templates selected
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(5)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
                >
                  Skip Customization
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="px-8 py-3 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                >
                  Continue to Review
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Create / Success State */}
        {step === 5 && !dashboardCreated && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Review & Create Dashboard</h2>
                <p className="text-gray-600">Confirm your selections and create your dashboard</p>
              </div>
            </div>

            {/* Review Summary */}
            <div className="space-y-4 mb-8">
              {/* Data Source */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-lg text-blue-900">Data Source</h3>
                    </div>
                    <p className="text-blue-800 font-semibold">
                      {dataMode === 'datasource' 
                        ? `${getSelectedDataSourceName()} → ${selectedTable}`
                        : getSelectedDataMartName()}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-blue-300 rounded-lg hover:bg-blue-100 transition"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Dashboard Details */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-lg text-purple-900">Dashboard Details</h3>
                    </div>
                    <p className="font-bold text-xl text-purple-900 mb-1">{dashboardName}</p>
                    {dashboardDescription && (
                      <p className="text-purple-700 text-sm">{dashboardDescription}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="px-3 py-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 border border-purple-300 rounded-lg hover:bg-purple-100 transition"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Layout & Theme */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-6 border-2 rounded-xl ${
                  selectedLayout 
                    ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className={`w-5 h-5 ${selectedLayout ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <h3 className={`font-bold ${selectedLayout ? 'text-indigo-900' : 'text-gray-600'}`}>Layout</h3>
                  </div>
                  <p className={`font-semibold ${selectedLayout ? 'text-indigo-800' : 'text-gray-500'}`}>
                    {selectedLayout ? selectedLayout.name : 'No layout selected'}
                  </p>
                </div>

                <div className={`p-6 border-2 rounded-xl ${
                  selectedTheme 
                    ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className={`w-5 h-5 ${selectedTheme ? 'text-pink-600' : 'text-gray-400'}`} />
                    <h3 className={`font-bold ${selectedTheme ? 'text-pink-900' : 'text-gray-600'}`}>Theme</h3>
                  </div>
                  <p className={`font-semibold ${selectedTheme ? 'text-pink-800' : 'text-gray-500'}`}>
                    {selectedTheme ? selectedTheme.name : 'Default theme'}
                  </p>
                </div>
              </div>

              {/* Charts */}
              {selectedCharts.length > 0 && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <h3 className="font-bold text-lg text-green-900">Chart Templates</h3>
                      </div>
                      <p className="text-green-800 font-semibold">{selectedCharts.length} templates selected</p>
                    </div>
                    <button
                      onClick={() => setStep(4)}
                      className="px-3 py-1.5 text-xs font-semibold text-green-700 hover:text-green-900 border border-green-300 rounded-lg hover:bg-green-100 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl mb-8">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-yellow-900 mb-1">What happens next?</h4>
                  <p className="text-sm text-yellow-800">
                    You'll be taken to the Visual Dashboard Builder where you can customize your dashboard, 
                    add more charts, configure queries, and arrange the layout exactly how you want it.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleCreateDashboard}
                disabled={creating}
                className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {creating ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Create Dashboard
                    <Sparkles className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success State - Dashboard Created */}
        {step === 5 && dashboardCreated && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto">
              {/* Success Icon */}
              <div className="mb-6">
                <div className="inline-flex p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                  <CheckCircle2 className="w-20 h-20 text-green-600" />
                </div>
              </div>

              {/* Success Message */}
              <h2 className="text-4xl font-bold mb-3 text-gray-900">
                🎉 Dashboard Created Successfully!
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                <strong className="text-green-600">{dashboardName}</strong> has been saved and is ready to use
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{dataMode === 'datasource' ? '1' : '1'}</div>
                  <div className="text-sm text-gray-600 font-medium">Data {dataMode === 'datasource' ? 'Source' : 'Mart'}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{selectedLayout ? '1' : '0'}</div>
                  <div className="text-sm text-gray-600 font-medium">Layout</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {selectedLayout 
                      ? (selectedLayout.layout_type === 'kpi-focused' || selectedLayout.layout_type === 'kpi-dashboard' ? '6' : 
                         selectedLayout.layout_type === 'comparison' ? '6' : 
                         selectedLayout.layout_type === 'trend' ? '5' : '6')
                      : '6'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Placeholder Charts</div>
                </div>
              </div>

              {/* What's Next */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">What would you like to do next?</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Option 1: Edit Dashboard (Visual Builder) */}
                  <button
                    onClick={() => {
                      if (createdDashboardId) {
                        // If we have the ID, open in edit mode
                        navigate(`/dashboard-builder?mode=visual&editId=${createdDashboardId}`);
                      } else {
                        // Fallback: open with pre-configured settings
                        const params = new URLSearchParams();
                        if (dataMode === 'datasource') {
                          params.set('dataSource', selectedDataSource);
                          params.set('table', selectedTable);
                        } else if (selectedDataMart) {
                          params.set('dataMart', selectedDataMart.toString());
                        }
                        
                        if (selectedLayout) {
                          sessionStorage.setItem('selectedLayout', JSON.stringify(selectedLayout));
                          params.set('applyLayout', 'true');
                        }
                        if (selectedTheme) {
                          sessionStorage.setItem('selectedTheme', JSON.stringify(selectedTheme));
                          params.set('applyTheme', 'true');
                        }
                        if (selectedCharts.length > 0) {
                          sessionStorage.setItem('selectedCharts', JSON.stringify(selectedCharts));
                          params.set('addCharts', 'true');
                        }
                        sessionStorage.setItem('dashboardName', dashboardName);
                        
                        navigate(`/dashboard-builder?mode=visual&${params.toString()}`);
                      }
                    }}
                    className="p-6 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:shadow-lg transition text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500 rounded-lg group-hover:scale-110 transition">
                        <Settings className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-blue-900 mb-1">Edit Dashboard</h4>
                        <p className="text-sm text-blue-700">
                          Add charts, configure queries, and customize your dashboard in the Visual Builder
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-blue-600 group-hover:translate-x-2 transition" />
                    </div>
                  </button>

                  {/* Option 2: View Dashboard */}
                  <button
                    onClick={() => {
                      if (createdDashboardId) {
                        navigate(`/dashboard-view/${createdDashboardId}`);
                      } else {
                        // If no ID, go to all dashboards and user can find it there
                        navigate('/all-dashboards');
                      }
                    }}
                    className="p-6 border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-lg transition text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-500 rounded-lg group-hover:scale-110 transition">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-green-900 mb-1">View Dashboard</h4>
                        <p className="text-sm text-green-700">
                          {createdDashboardId 
                            ? "Preview your dashboard (add charts to see data)" 
                            : "View your dashboard in the All Dashboards page"}
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-green-600 group-hover:translate-x-2 transition" />
                    </div>
                  </button>

                  {/* Option 3: Go to All Dashboards */}
                  <button
                    onClick={() => navigate('/all-dashboards')}
                    className="p-6 border-2 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500 rounded-lg group-hover:scale-110 transition">
                        <Layout className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-purple-900 mb-1">View All Dashboards</h4>
                        <p className="text-sm text-purple-700">
                          See all your dashboards and manage them
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-purple-600 group-hover:translate-x-2 transition" />
                    </div>
                  </button>

                  {/* Option 4: Create Another */}
                  <button
                    onClick={() => {
                      setDashboardCreated(false);
                      setCreatedDashboardId(null);
                      setStep(1);
                      setSelectedDataSource('');
                      setSelectedTable('');
                      setSelectedDataMart(null);
                      setSelectedLayout(null);
                      setSelectedTheme(null);
                      setSelectedCharts([]);
                      setDashboardName('My Dashboard');
                      setDashboardDescription('');
                    }}
                    className="p-6 border-2 border-gray-300 bg-white rounded-xl hover:shadow-lg hover:border-gray-400 transition text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-500 rounded-lg group-hover:scale-110 transition">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">Create Another Dashboard</h4>
                        <p className="text-sm text-gray-600">
                          Start fresh with a new dashboard
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-600 group-hover:translate-x-2 transition" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Tip */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 text-left">
                    <strong>Framework Created!</strong> Your dashboard "{dashboardName}" has been created with placeholder charts based on the {selectedLayout ? selectedLayout.name : 'default layout'}. 
                    Click <strong>"View Dashboard"</strong> to preview the framework, or <strong>"Edit Dashboard"</strong> to customize queries and chart titles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardBuilderV2;
