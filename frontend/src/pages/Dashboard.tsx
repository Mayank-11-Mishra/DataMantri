import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  LayoutDashboard, 
  Eye, 
  Database, 
  GitBranch, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Users,
  Server,
  Zap,
  CheckCircle,
  AlertCircle,
  Calendar,
  Palette,
  BarChart3,
  Boxes
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Dashboard {
  id: number;
  name: string;
  description: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: number;
  type: 'dashboard' | 'query' | 'pipeline' | 'data-source';
  action: string;
  timestamp: string;
  icon: React.ElementType;
  color: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    dashboards: 0,
    dataSources: 0,
    dataMarts: 0,
    schedulers: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  // Fetch real data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboards
        const dashboardsRes = await fetch('/api/get-dashboards', {
          credentials: 'include'
        });
        let dashboardsData = [];
        let dashboardsCount = 0;
        if (dashboardsRes.ok) {
          const responseData = await dashboardsRes.json();
          // API returns {status: 'success', dashboards: [...]}
          dashboardsData = responseData.dashboards || [];
          setDashboards(Array.isArray(dashboardsData) ? dashboardsData : []);
          dashboardsCount = Array.isArray(dashboardsData) ? dashboardsData.length : 0;
        }

        // Fetch data sources
        const sourcesRes = await fetch('/api/data-sources', {
          credentials: 'include'
        });
        let sourcesCount = 0;
        if (sourcesRes.ok) {
          const sources = await sourcesRes.json();
          sourcesCount = Array.isArray(sources) ? sources.length : 0;
        }

        // Fetch data marts
        const martsRes = await fetch('/api/data-marts', {
          credentials: 'include'
        });
        let martsCount = 0;
        if (martsRes.ok) {
          const marts = await martsRes.json();
          martsCount = Array.isArray(marts) ? marts.length : 0;
        }

        // Fetch schedulers
        const schedulersRes = await fetch('/api/schedulers', {
          credentials: 'include'
        });
        let schedulersCount = 0;
        if (schedulersRes.ok) {
          const responseData = await schedulersRes.json();
          // API returns {status: 'success', schedulers: [...]}
          const schedulers = responseData.schedulers || [];
          schedulersCount = Array.isArray(schedulers) ? schedulers.length : 0;
        }

        // Update stats with real data
        setStats({
          dashboards: dashboardsCount,
          dataSources: sourcesCount,
          dataMarts: martsCount,
          schedulers: schedulersCount
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 p-8 text-white shadow-2xl">
        {/* Animated blur decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {getGreeting()}, {getUserDisplayName()}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Here's what's happening with your data today
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/dashboard-builder')}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
              <Button 
                onClick={() => navigate('/database-management')}
                variant="outline"
                className="border-white text-white hover:bg-white/20"
              >
                <Database className="h-4 w-4 mr-2" />
                Data Suite
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-t-4 border-t-blue-500"
          onClick={() => navigate('/all-dashboards')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-blue-600" />
              </div>
              {!loading && stats.dashboards > 0 && (
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.dashboards}
            </div>
            <div className="text-sm text-gray-600">Dashboards</div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-t-4 border-t-green-500"
          onClick={() => navigate('/database-management')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              {!loading && stats.dataSources > 0 && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.dataSources}
            </div>
            <div className="text-sm text-gray-600">Data Sources</div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-t-4 border-t-purple-500"
          onClick={() => navigate('/database-management')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Boxes className="h-6 w-6 text-purple-600" />
              </div>
              {!loading && stats.dataMarts > 0 && (
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.dataMarts}
            </div>
            <div className="text-sm text-gray-600">Data Marts</div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-t-4 border-t-orange-500"
          onClick={() => navigate('/scheduler')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              {!loading && stats.schedulers > 0 && (
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.schedulers}
            </div>
            <div className="text-sm text-gray-600">Schedulers</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity & Getting Started */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Complete these steps to unlock DataMantri's full potential</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Step 1: Connect Data Source */}
              <div className={`p-4 rounded-lg border-2 ${stats.dataSources > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${stats.dataSources > 0 ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {stats.dataSources > 0 ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <Database className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900">Step 1: Connect Data Sources</h3>
                      {stats.dataSources > 0 && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {stats.dataSources > 0 
                        ? `Great! You have ${stats.dataSources} data source${stats.dataSources !== 1 ? 's' : ''} connected. You can add more anytime.`
                        : 'Connect your databases (PostgreSQL, MySQL, MongoDB) to start analyzing your data.'
                      }
                    </p>
                    {stats.dataSources === 0 && (
                      <Button 
                        size="sm"
                        onClick={() => navigate('/database-management')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Connect First Source
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Create Dashboard */}
              <div className={`p-4 rounded-lg border-2 ${stats.dashboards > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${stats.dashboards > 0 ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {stats.dashboards > 0 ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <LayoutDashboard className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900">Step 2: Create Your First Dashboard</h3>
                      {stats.dashboards > 0 && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {stats.dashboards > 0 
                        ? `Excellent! You have ${stats.dashboards} dashboard${stats.dashboards !== 1 ? 's' : ''} created.`
                        : 'Build beautiful dashboards with our AI-powered builder or visual drag-drop interface.'
                      }
                    </p>
                    {stats.dashboards === 0 && (
                      <Button 
                        size="sm"
                        onClick={() => navigate('/dashboard-builder')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Create Dashboard
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Build Data Mart */}
              <div className={`p-4 rounded-lg border-2 ${stats.dataMarts > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${stats.dataMarts > 0 ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {stats.dataMarts > 0 ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <Boxes className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900">Step 3: Build Data Marts (Optional)</h3>
                      {stats.dataMarts > 0 && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {stats.dataMarts > 0 
                        ? `Perfect! You have ${stats.dataMarts} data mart${stats.dataMarts !== 1 ? 's' : ''} ready for analytics.`
                        : 'Create pre-aggregated data marts for faster analytics and reporting.'
                      }
                    </p>
                    {stats.dataMarts === 0 && stats.dataSources > 0 && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/database-management')}
                      >
                        <Boxes className="h-4 w-4 mr-2" />
                        Build Data Mart
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Setup Progress</span>
                  <span className="text-sm font-bold text-blue-600">
                    {Math.round(((stats.dataSources > 0 ? 1 : 0) + (stats.dashboards > 0 ? 1 : 0)) / 2 * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${((stats.dataSources > 0 ? 1 : 0) + (stats.dashboards > 0 ? 1 : 0)) / 2 * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Center & System Status */}
        <div className="space-y-6">
          {/* Resource Center */}
          <Card className="border-t-4 border-t-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Resource Center
              </CardTitle>
              <CardDescription>Quick guides to help you get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-500 rounded-md">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">Connect Database</h4>
                      <p className="text-xs text-gray-600 mb-2">Link PostgreSQL, MySQL, or MongoDB in 2 minutes</p>
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="h-auto p-0 text-blue-600 hover:text-blue-700"
                        onClick={() => navigate('/database-management')}
                      >
                        View Guide →
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-purple-500 rounded-md">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">AI Dashboard</h4>
                      <p className="text-xs text-gray-600 mb-2">Create dashboards with natural language</p>
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="h-auto p-0 text-purple-600 hover:text-purple-700"
                        onClick={() => navigate('/dashboard-builder')}
                      >
                        Try Now →
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-green-500 rounded-md">
                      <GitBranch className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">Data Pipelines</h4>
                      <p className="text-xs text-gray-600 mb-2">Automate ETL workflows easily</p>
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="h-auto p-0 text-green-600 hover:text-green-700"
                        onClick={() => navigate('/database-management')}
                      >
                        Learn More →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="border-t-4 border-t-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">API Services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">Connected</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Data Sources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${stats.dataSources > 0 ? 'bg-green-500' : 'bg-gray-300'} rounded-full ${stats.dataSources > 0 ? 'animate-pulse' : ''}`}></div>
                    <span className={`text-sm font-medium ${stats.dataSources > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {stats.dataSources > 0 ? `${stats.dataSources} Active` : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-semibold text-green-600">~50ms</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Uptime</span>
                  <span className="font-semibold text-green-600">99.9%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-semibold text-gray-700">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Helpful Tips */}
          <Card className="border-t-4 border-t-blue-500 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                💡 Pro Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                Start by connecting your first data source, then use our AI Dashboard Builder to create visualizations with natural language prompts!
              </p>
              <Button 
                size="sm" 
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => navigate('/database-management')}
              >
                Get Started →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Your Dashboards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Dashboards</CardTitle>
              <CardDescription>Recently accessed and created dashboards</CardDescription>
            </div>
            <Button onClick={() => navigate('/dashboard-builder')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dashboards.length === 0 ? (
            <div className="text-center py-12">
              <LayoutDashboard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No dashboards yet</p>
              <Button onClick={() => navigate('/dashboard-builder')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Dashboard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((dashboard) => (
                <Card 
                  key={dashboard.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
                  onClick={() => navigate(`/dashboard-view/${dashboard.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                        <LayoutDashboard className="h-6 w-6 text-blue-600" />
                      </div>
                      <Badge variant="outline">{dashboard.theme}</Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                      {dashboard.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{dashboard.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Updated {new Date(dashboard.updated_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
