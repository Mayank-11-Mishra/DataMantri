import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LayoutDashboard, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Dashboard {
  id: number;
  name: string;
  description: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const response = await fetch('/api/dashboards', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDashboards(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDashboard = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    
    try {
      const response = await fetch(`/api/dashboards/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setDashboards(dashboards.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboards</h1>
          <p className="text-muted-foreground">
            {dashboards.length > 0 
              ? `Manage your ${dashboards.length} dashboard${dashboards.length !== 1 ? 's' : ''}`
              : 'Welcome to DataMantri Dashboard'
            }
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard-builder')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Dashboard
        </Button>
      </div>

      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <LayoutDashboard className="h-16 w-16 text-muted-foreground" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">No Dashboards Yet</h2>
            <p className="text-muted-foreground max-w-md">
              Get started by creating your first dashboard. Connect your data sources and build beautiful visualizations.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/dashboard-builder')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Dashboard
            </Button>
            <Button onClick={() => navigate('/data-sources')} variant="outline" className="gap-2">
              Connect Data Sources
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {dashboard.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                      title="View Dashboard"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/dashboard-builder?edit=${dashboard.id}`)}
                      title="Edit Dashboard"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDashboard(dashboard.id)}
                      title="Delete Dashboard"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(dashboard.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                      Theme: {dashboard.theme || 'Default'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;