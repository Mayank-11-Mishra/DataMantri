import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, 
  RefreshCw,
  Download,
  ZoomIn,
  ZoomOut,
  Move,
  Database,
  Table,
  Link,
  Eye,
  Settings,
  Maximize
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TableRelation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
}

interface TableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimary: boolean;
    isForeign: boolean;
    nullable: boolean;
  }>;
  position: { x: number; y: number };
}

interface VisualToolsSectionProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

const VisualToolsSection: React.FC<VisualToolsSectionProps> = ({ connectionStatus }) => {
  const { toast } = useToast();
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [databases, setDatabases] = useState<string[]>([]);
  const [tableSchemas, setTableSchemas] = useState<TableSchema[]>([]);
  const [relations, setRelations] = useState<TableRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showTableDetails, setShowTableDetails] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('');

  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchDatabases();
    }
  }, [connectionStatus]);

  useEffect(() => {
    if (selectedDatabase) {
      fetchDatabaseSchema();
    }
  }, [selectedDatabase]);

  const fetchDatabases = async () => {
    try {
      setDatabases(['dataviz_main', 'analytics_db', 'user_sessions']);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch databases',
        variant: 'destructive'
      });
    }
  };

  const fetchDatabaseSchema = async () => {
    if (!selectedDatabase) return;
    
    setLoading(true);
    try {
      // Mock schema data with positions for ER diagram
      const mockSchemas: TableSchema[] = [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'int', isPrimary: true, isForeign: false, nullable: false },
            { name: 'name', type: 'varchar(255)', isPrimary: false, isForeign: false, nullable: false },
            { name: 'email', type: 'varchar(255)', isPrimary: false, isForeign: false, nullable: false },
            { name: 'created_at', type: 'timestamp', isPrimary: false, isForeign: false, nullable: false },
            { name: 'updated_at', type: 'timestamp', isPrimary: false, isForeign: false, nullable: true }
          ],
          position: { x: 50, y: 50 }
        },
        {
          name: 'dashboards',
          columns: [
            { name: 'id', type: 'int', isPrimary: true, isForeign: false, nullable: false },
            { name: 'name', type: 'varchar(255)', isPrimary: false, isForeign: false, nullable: false },
            { name: 'user_id', type: 'int', isPrimary: false, isForeign: true, nullable: false },
            { name: 'data_source_id', type: 'int', isPrimary: false, isForeign: true, nullable: true },
            { name: 'created_at', type: 'timestamp', isPrimary: false, isForeign: false, nullable: false }
          ],
          position: { x: 350, y: 50 }
        },
        {
          name: 'data_sources',
          columns: [
            { name: 'id', type: 'int', isPrimary: true, isForeign: false, nullable: false },
            { name: 'name', type: 'varchar(255)', isPrimary: false, isForeign: false, nullable: false },
            { name: 'type', type: 'varchar(50)', isPrimary: false, isForeign: false, nullable: false },
            { name: 'config', type: 'json', isPrimary: false, isForeign: false, nullable: true },
            { name: 'created_at', type: 'timestamp', isPrimary: false, isForeign: false, nullable: false }
          ],
          position: { x: 650, y: 50 }
        },
        {
          name: 'upload_history',
          columns: [
            { name: 'id', type: 'int', isPrimary: true, isForeign: false, nullable: false },
            { name: 'user_id', type: 'int', isPrimary: false, isForeign: true, nullable: false },
            { name: 'filename', type: 'varchar(255)', isPrimary: false, isForeign: false, nullable: false },
            { name: 'file_size', type: 'bigint', isPrimary: false, isForeign: false, nullable: false },
            { name: 'uploaded_at', type: 'timestamp', isPrimary: false, isForeign: false, nullable: false }
          ],
          position: { x: 50, y: 300 }
        }
      ];

      const mockRelations: TableRelation[] = [
        {
          fromTable: 'dashboards',
          fromColumn: 'user_id',
          toTable: 'users',
          toColumn: 'id',
          type: 'many-to-one'
        },
        {
          fromTable: 'dashboards',
          fromColumn: 'data_source_id',
          toTable: 'data_sources',
          toColumn: 'id',
          type: 'many-to-one'
        },
        {
          fromTable: 'upload_history',
          fromColumn: 'user_id',
          toTable: 'users',
          toColumn: 'id',
          type: 'many-to-one'
        }
      ];
      
      setTimeout(() => {
        setTableSchemas(mockSchemas);
        setRelations(mockRelations);
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch database schema',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const exportDiagram = (format: string) => {
    toast({
      title: 'Export Started',
      description: `Exporting ER diagram as ${format.toUpperCase()}...`
    });
    
    // Mock export functionality
    setTimeout(() => {
      toast({
        title: 'Export Complete',
        description: `ER diagram exported as ${format.toUpperCase()}`
      });
    }, 2000);
  };

  const generateSQL = () => {
    const sql = `-- Database Schema for ${selectedDatabase}
${tableSchemas.map(table => `
CREATE TABLE ${table.name} (
${table.columns.map(col => 
  `  ${col.name} ${col.type}${col.isPrimary ? ' PRIMARY KEY' : ''}${!col.nullable ? ' NOT NULL' : ''}`
).join(',\n')}
);`).join('\n')}

-- Foreign Key Constraints
${relations.map(rel => 
  `ALTER TABLE ${rel.fromTable} ADD FOREIGN KEY (${rel.fromColumn}) REFERENCES ${rel.toTable}(${rel.toColumn});`
).join('\n')}`;

    navigator.clipboard.writeText(sql);
    toast({
      title: 'SQL Copied',
      description: 'Database schema SQL copied to clipboard'
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? Math.min(prev + 25, 200) : Math.max(prev - 25, 50);
      return newZoom;
    });
  };

  const getRelationshipLine = (relation: TableRelation) => {
    const fromTable = tableSchemas.find(t => t.name === relation.fromTable);
    const toTable = tableSchemas.find(t => t.name === relation.toTable);
    
    if (!fromTable || !toTable) return null;

    const fromX = fromTable.position.x + 150; // Center of table
    const fromY = fromTable.position.y + 100;
    const toX = toTable.position.x + 150;
    const toY = toTable.position.y + 100;

    return (
      <line
        key={`${relation.fromTable}-${relation.toTable}`}
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="#6b7280"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    );
  };

  if (connectionStatus !== 'connected') {
    return (
      <div className="text-center py-8">
        <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {connectionStatus === 'connecting' ? 'Connecting to database server...' : 'Not connected to database server'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Selection and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Database Tools</CardTitle>
          <CardDescription>Generate ER diagrams and visualize database relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="database-select">Database</Label>
                <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select database" />
                  </SelectTrigger>
                  <SelectContent>
                    {databases.map((db) => (
                      <SelectItem key={db} value={db}>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {db}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedDatabase && (
                <Button onClick={fetchDatabaseSchema} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>

            {selectedDatabase && (
              <div className="flex items-center gap-2">
                <Button onClick={() => handleZoom('out')} variant="outline" size="sm">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{zoomLevel}%</span>
                <Button onClick={() => handleZoom('in')} variant="outline" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowTableDetails(!showTableDetails)} variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  {showTableDetails ? 'Hide' : 'Show'} Details
                </Button>
                <Select onValueChange={(format) => exportDiagram(format)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateSQL} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  SQL
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedDatabase && (
        <Tabs defaultValue="er-diagram" className="w-full">
          <TabsList>
            <TabsTrigger value="er-diagram">ER Diagram</TabsTrigger>
            <TabsTrigger value="table-list">Table List</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>
          
          <TabsContent value="er-diagram">
            <Card>
              <CardHeader>
                <CardTitle>Entity Relationship Diagram</CardTitle>
                <CardDescription>Visual representation of database tables and their relationships</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Generating diagram...</span>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-auto" style={{ height: '600px' }}>
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 1000 600"
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                    >
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                        </marker>
                      </defs>
                      
                      {/* Relationship lines */}
                      {relations.map(relation => getRelationshipLine(relation))}
                      
                      {/* Tables */}
                      {tableSchemas.map((table) => (
                        <g key={table.name}>
                          <rect
                            x={table.position.x}
                            y={table.position.y}
                            width="300"
                            height={showTableDetails ? Math.max(120, 40 + table.columns.length * 20) : 60}
                            fill="white"
                            stroke="#d1d5db"
                            strokeWidth="2"
                            rx="8"
                            className="hover:stroke-primary cursor-pointer"
                            onClick={() => setSelectedTable(table.name)}
                          />
                          
                          {/* Table header */}
                          <rect
                            x={table.position.x}
                            y={table.position.y}
                            width="300"
                            height="40"
                            fill="#f3f4f6"
                            stroke="#d1d5db"
                            strokeWidth="1"
                            rx="8"
                          />
                          
                          <text
                            x={table.position.x + 15}
                            y={table.position.y + 25}
                            className="font-bold text-sm"
                            fill="#374151"
                          >
                            <tspan>📊 {table.name}</tspan>
                          </text>
                          
                          {/* Table columns */}
                          {showTableDetails && table.columns.map((column, index) => (
                            <g key={column.name}>
                              <text
                                x={table.position.x + 15}
                                y={table.position.y + 60 + index * 20}
                                className="text-xs"
                                fill={column.isPrimary ? '#dc2626' : column.isForeign ? '#2563eb' : '#374151'}
                              >
                                {column.isPrimary && '🔑 '}
                                {column.isForeign && '🔗 '}
                                {column.name}: {column.type}
                                {!column.nullable && ' *'}
                              </text>
                            </g>
                          ))}
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="table-list">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tableSchemas.map((table) => (
                <Card key={table.name} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      {table.name}
                    </CardTitle>
                    <CardDescription>
                      {table.columns.length} columns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {table.columns.map((column) => (
                        <div key={column.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={column.isPrimary ? 'font-bold text-red-600' : column.isForeign ? 'text-blue-600' : ''}>
                              {column.name}
                            </span>
                            {column.isPrimary && <Badge variant="outline" className="text-xs">PK</Badge>}
                            {column.isForeign && <Badge variant="outline" className="text-xs">FK</Badge>}
                          </div>
                          <span className="text-muted-foreground text-xs">{column.type}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="relationships">
            <Card>
              <CardHeader>
                <CardTitle>Table Relationships</CardTitle>
                <CardDescription>Foreign key relationships between tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {relations.map((relation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          <span className="font-medium">{relation.fromTable}</span>
                          <span className="text-muted-foreground">({relation.fromColumn})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{relation.type}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          <span className="font-medium">{relation.toTable}</span>
                          <span className="text-muted-foreground">({relation.toColumn})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {relations.length === 0 && (
                    <div className="text-center py-8">
                      <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No relationships found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default VisualToolsSection;
