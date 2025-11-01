import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Edit,
  Download,
  FileText,
  FileDown,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardRenderer from '../components/DashboardRenderer';

interface Dashboard {
  id: string;
  title: string;
  description: string;
  spec: {
    name: string;
    theme: string;
    header: {
      title: string;
      subtitle: string;
      showLogo: boolean;
    };
    charts: Array<{
      id: string;
      type: string;
      title: string;
      query: string;
      position: { x: number; y: number; w: number; h: number };
    }>;
    filters: Array<{
      id: string;
      name: string;
      label: string;
      type: string;
      options?: string[];
    }>;
    dataSourceId?: string;
  };
  created_at: string;
  updated_at: string;
}

const DashboardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDashboard();
    }
  }, [id]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/get-dashboards`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const foundDashboard = data.dashboards?.find((d: Dashboard) => d.id === id);
        
        if (foundDashboard) {
          setDashboard(foundDashboard);
        } else {
          toast({
            title: '❌ Error',
            description: 'Dashboard not found',
            variant: 'destructive'
          });
          navigate('/all-dashboards');
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load dashboard',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'csv' | 'excel') => {
    toast({
      title: '📥 Downloading',
      description: `Preparing ${format.toUpperCase()} export...`
    });

    // Mock download
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: '✅ Download Complete',
      description: `Dashboard exported as ${format.toUpperCase()}`
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
    toast({
      title: '✅ Refreshed',
      description: 'Dashboard data updated'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/all-dashboards')}
            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Dashboards
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <div className="relative group">
              <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border-2 border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => handleDownload('pdf')}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 rounded-t-xl transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  className="w-full px-4 py-3 text-left hover:bg-green-50 text-green-600 transition flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Download CSV
                </button>
                <button
                  onClick={() => handleDownload('excel')}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 text-emerald-600 rounded-b-xl transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate(`/dashboard-builder?edit=${id}`)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Use DashboardRenderer for consistent rendering across all dashboards */}
        <DashboardRenderer 
          spec={{
            title: dashboard.spec?.header?.title || dashboard.title,
            description: dashboard.spec?.header?.subtitle || dashboard.description,
            theme: dashboard.spec?.theme,
            filters: dashboard.spec?.filters || [],
            charts: dashboard.spec?.charts || []
          }}
          editable={false}
        />
      </div>
    </div>
  );
};

export default DashboardView;
