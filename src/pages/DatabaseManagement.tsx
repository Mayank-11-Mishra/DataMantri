import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Database, 
  Table, 
  Edit3, 
  Play, 
  Key, 
  Users, 
  Activity, 
  Network,
  CheckCircle,
  AlertCircle,
  Code,
  Link,
  HardDrive,
  Zap,
  Boxes
} from 'lucide-react';

// Import all database management section components
import DatabaseManagementSection from '@/components/database/DatabaseManagementSection';
import TableManagementSection from '@/components/database/TableManagementSection';
import DataManagementSection from '@/components/database/DataManagementSection';
import SQLExecutionSection from '@/components/database/SQLExecutionSection';
import IndexesRelationsSection from '@/components/database/IndexesRelationsSection';
import UserPrivilegeSection from '@/components/database/UserPrivilegeSection';
import PerformanceMonitoringSection from '@/components/database/PerformanceMonitoringSection';
import VisualToolsSection from '@/components/database/VisualToolsSection';
import DataSourceBuilder from '@/components/database/DataSourceBuilder';
import DataMartBuilder from '@/components/database/DataMartBuilder';
import { useAuth } from '@/contexts/AuthContext';

const DatabaseManagement: React.FC = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [activeTab, setActiveTab] = useState('databases');
  const [serverInfo, setServerInfo] = useState({
    host: 'localhost',
    port: 3306,
    version: 'MySQL 8.0.35',
    uptime: '15 days, 8 hours, 23 minutes',
    connections: 47,
    maxConnections: 151,
    databases: 8
  });

  const isAdmin = user?.is_admin;

  const tabs = [
    {
      id: 'databases',
      label: 'DataSources',
      icon: Database,
      description: 'Connect with new data sources, see schemas, and more',
      component: DataSourceBuilder
    },
    {
      id: 'datamart',
      label: 'DataMart',
      icon: Boxes,
      description: 'Create and manage data marts',
      component: DataMartBuilder
    },
    {
      id: 'tables',
      label: 'Table Management',
      icon: Table,
      description: 'Manage table structure and properties',
      component: TableManagementSection
    },
    {
      id: 'sql',
      label: 'SQL Execution',
      icon: Code,
      description: 'Execute queries and manage SQL scripts',
      component: SQLExecutionSection
    },
    {
      id: 'performance',
      label: 'Performance & Monitoring',
      icon: Activity,
      description: 'Monitor server performance and optimize',
      component: PerformanceMonitoringSection
    },
    {
      id: 'visual',
      label: 'Visual Tools',
      icon: Network,
      description: 'ER diagrams and visual database design',
      component: VisualToolsSection
    }
  ];

  useEffect(() => {
    // Simulate connection check
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
      setServerInfo(prev => ({
        ...prev,
        version: 'MySQL 8.0.35',
        uptime: '15 days, 3 hours',
        connections: 42,
        databases: 8
      }));
    }, 1500);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  const filteredTabs = tabs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Server className="h-8 w-8 text-primary" />
            Database Management Suite
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete MySQL/MariaDB administration and management interface
          </p>
        </div>
        
        {/* Connection Status */}
        <Card className="w-80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="font-medium">{getStatusText()}</span>
              </div>
              {serverInfo && (
                <Badge variant="outline">{serverInfo.version}</Badge>
              )}
            </div>
            {serverInfo && connectionStatus === 'connected' && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>{serverInfo.databases} DBs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{serverInfo.connections} Conn</span>
                </div>
                <div className="text-xs">
                  Up: {serverInfo.uptime}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto p-1">
          {filteredTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex flex-col items-center gap-1 p-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-xs font-medium leading-none">{tab.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        {filteredTabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>{tab.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Component connectionStatus={connectionStatus} />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default DatabaseManagement;
