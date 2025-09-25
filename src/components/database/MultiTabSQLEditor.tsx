import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  X, 
  Play, 
  Save, 
  Copy,
  FileText,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  History,
  BookOpen,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SQLEditor from './SQLEditor';

interface QueryTab {
  id: string;
  name: string;
  query: string;
  isModified: boolean;
  result?: QueryResult;
  isExecuting?: boolean;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  status: 'success' | 'error';
  error?: string;
}

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: string;
  executionTime: number;
  status: 'success' | 'error';
  rowCount?: number;
  error?: string;
}

interface MultiTabSQLEditorProps {
  selectedDatabase: string;
  onExecuteQuery: (query: string, tabId: string) => Promise<QueryResult>;
  onSaveQuery?: (name: string, query: string) => void;
  savedQueries?: SavedQuery[];
  queryHistory?: QueryHistory[];
}

const MultiTabSQLEditor: React.FC<MultiTabSQLEditorProps> = ({
  selectedDatabase,
  onExecuteQuery,
  onSaveQuery,
  savedQueries = [],
  queryHistory = []
}) => {
  const { toast } = useToast();
  const [tabs, setTabs] = useState<QueryTab[]>([
    {
      id: '1',
      name: 'Query 1',
      query: '',
      isModified: false
    }
  ]);
  const [activeTab, setActiveTab] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const tabCounter = useRef(1);

  const createNewTab = useCallback(() => {
    tabCounter.current += 1;
    const newTab: QueryTab = {
      id: tabCounter.current.toString(),
      name: `Query ${tabCounter.current}`,
      query: '',
      isModified: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    if (tabs.length === 1) {
      toast({
        title: 'Cannot close tab',
        description: 'At least one tab must remain open',
        variant: 'destructive'
      });
      return;
    }

    const tabToClose = tabs.find(t => t.id === tabId);
    if (tabToClose?.isModified) {
      if (!confirm(`Tab "${tabToClose.name}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    setTabs(prev => prev.filter(t => t.id !== tabId));
    
    if (activeTab === tabId) {
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      setActiveTab(remainingTabs[0]?.id || '');
    }
  }, [tabs, activeTab, toast]);

  const updateTabQuery = useCallback((tabId: string, query: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, query, isModified: query !== '' }
        : tab
    ));
  }, []);

  const renameTab = useCallback((tabId: string, newName: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, name: newName }
        : tab
    ));
  }, []);

  const executeQuery = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab?.query.trim()) {
      toast({
        title: 'No query to execute',
        description: 'Please enter a SQL query',
        variant: 'destructive'
      });
      return;
    }

    setTabs(prev => prev.map(t => 
      t.id === tabId 
        ? { ...t, isExecuting: true }
        : t
    ));

    try {
      const result = await onExecuteQuery(tab.query, tabId);
      setTabs(prev => prev.map(t => 
        t.id === tabId 
          ? { ...t, result, isExecuting: false, isModified: false }
          : t
      ));
      
      if (result.status === 'success') {
        toast({
          title: 'Query Executed',
          description: `Returned ${result.rowCount} rows in ${result.executionTime}s`
        });
      } else {
        toast({
          title: 'Query Error',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      setTabs(prev => prev.map(t => 
        t.id === tabId 
          ? { ...t, isExecuting: false }
          : t
      ));
      toast({
        title: 'Execution Failed',
        description: error.message || 'Failed to execute query',
        variant: 'destructive'
      });
    }
  }, [tabs, onExecuteQuery, toast]);

  const duplicateTab = useCallback((tabId: string) => {
    const tabToDuplicate = tabs.find(t => t.id === tabId);
    if (!tabToDuplicate) return;

    tabCounter.current += 1;
    const newTab: QueryTab = {
      id: tabCounter.current.toString(),
      name: `${tabToDuplicate.name} (Copy)`,
      query: tabToDuplicate.query,
      isModified: tabToDuplicate.isModified
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
  }, [tabs]);

  const loadSavedQuery = useCallback((query: SavedQuery) => {
    tabCounter.current += 1;
    const newTab: QueryTab = {
      id: tabCounter.current.toString(),
      name: query.name,
      query: query.query,
      isModified: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    
    toast({
      title: 'Query Loaded',
      description: `Loaded "${query.name}" into a new tab`
    });
  }, [toast]);

  const loadHistoryQuery = useCallback((historyItem: QueryHistory) => {
    tabCounter.current += 1;
    const newTab: QueryTab = {
      id: tabCounter.current.toString(),
      name: `History ${tabCounter.current}`,
      query: historyItem.query,
      isModified: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    
    toast({
      title: 'Query Loaded',
      description: 'Loaded query from history into a new tab'
    });
  }, [toast]);

  const exportResults = useCallback((tabId: string, format: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab?.result || tab.result.status !== 'success') {
      toast({
        title: 'Export Error',
        description: 'No successful query results to export',
        variant: 'destructive'
      });
      return;
    }

    const { columns, rows } = tab.result;
    
    if (format === 'csv') {
      const csvContent = [
        columns.join(','),
        ...rows.map(row => 
          Array.isArray(row) 
            ? row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
            : columns.map(col => `"${String((row as any)[col] || '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tab.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const jsonData = rows.map(row => {
        if (Array.isArray(row)) {
          const obj: any = {};
          columns.forEach((col, index) => {
            obj[col] = row[index];
          });
          return obj;
        }
        return row;
      });
      
      const jsonContent = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tab.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: 'Export Complete',
      description: `Results exported as ${format.toUpperCase()}`
    });
  }, [tabs, toast]);

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <Card className={isFullscreen ? 'h-full rounded-none border-0' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>SQL Query Tabs</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {sidebarCollapsed ? 'Show Panel' : 'Hide Panel'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`${isFullscreen ? 'h-[calc(100vh-100px)] overflow-hidden' : ''}`}>
          <div className={`grid ${sidebarCollapsed ? 'grid-cols-1' : 'grid-cols-4'} gap-4 h-full`}>
            {/* Main Content Area */}
            <div className={`${sidebarCollapsed ? 'col-span-1' : 'col-span-3'} space-y-4`}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between">
              <TabsList className="h-auto p-1 flex-1 justify-start overflow-x-auto">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative group px-3 py-2 flex items-center gap-2 min-w-0"
                  >
                    <span 
                      className="truncate max-w-32"
                      onDoubleClick={() => {
                        const newName = prompt('Enter new tab name:', tab.name);
                        if (newName && newName.trim()) {
                          renameTab(tab.id, newName.trim());
                        }
                      }}
                    >
                      {tab.name}
                    </span>
                    {tab.isModified && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
                    )}
                    {tab.isExecuting && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Executing..." />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={createNewTab}
                className="ml-2"
              >
                <Plus className="h-4 w-4" />
                New Tab
              </Button>
            </div>

            {tabs.map((tab) => (
              <TabsContent 
                key={tab.id} 
                value={tab.id} 
                className="flex-1 mt-4 space-y-4 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Database: {selectedDatabase || 'None'}
                    </Badge>
                    {tab.result && (
                      <Badge variant={tab.result.status === 'success' ? 'default' : 'destructive'}>
                        {tab.result.status === 'success' 
                          ? `${tab.result.rowCount} rows • ${tab.result.executionTime}s`
                          : 'Error'
                        }
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateTab(tab.id)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSaveQuery?.(tab.name, tab.query)}
                      disabled={!tab.query.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    {tab.result && tab.result.status === 'success' && tab.result.rows && tab.result.rows.length > 0 && (
                      <Select onValueChange={(format) => exportResults(tab.id, format)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Export" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              CSV
                            </div>
                          </SelectItem>
                          <SelectItem value="json">
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              JSON
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      onClick={() => executeQuery(tab.id)}
                      disabled={tab.isExecuting || !selectedDatabase || !tab.query.trim()}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {tab.isExecuting ? 'Executing...' : 'Execute'}
                    </Button>
                  </div>
                </div>

                <div className={`grid ${tab.result ? 'grid-rows-2' : 'grid-rows-1'} gap-4 ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'}`}>
                  <div className="overflow-hidden">
                    <SQLEditor
                      value={tab.query}
                      onChange={(query) => updateTabQuery(tab.id, query)}
                      database={selectedDatabase}
                      height={isFullscreen ? '40vh' : '200px'}
                    />
                  </div>

                  {tab.result && (
                    <div className="overflow-hidden">
                      <Card className="h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Results</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[calc(100%-60px)] overflow-auto">
                          {tab.result.status === 'error' ? (
                            <div className="text-red-600 p-4 bg-red-50 rounded">
                              <p className="font-medium">Query Error:</p>
                              <p className="text-sm mt-1">{tab.result.error}</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="border-b">
                                    {tab.result.columns.map((col) => (
                                      <th key={col} className="text-left p-2 font-medium">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {tab.result.rows.slice(0, 100).map((row, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                      {Array.isArray(row) ? (
                                        row.map((cell, cellIndex) => (
                                          <td key={cellIndex} className="p-2">
                                            {cell?.toString() || 'NULL'}
                                          </td>
                                        ))
                                      ) : (
                                        tab.result!.columns.map((col, cellIndex) => (
                                          <td key={cellIndex} className="p-2">
                                            {(row as any)[col]?.toString() || 'NULL'}
                                          </td>
                                        ))
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {tab.result.rowCount > 100 && (
                                <div className="text-center p-4 text-muted-foreground">
                                  Showing first 100 of {tab.result.rowCount} rows
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
            </div>

            {/* Collapsible Sidebar */}
            {!sidebarCollapsed && (
              <div className="col-span-1 space-y-4">
                <Tabs defaultValue="saved" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="saved">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Saved
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4 w-4 mr-2" />
                      History
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="saved" className="mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Saved Queries</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                        {savedQueries.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No saved queries yet
                          </p>
                        ) : (
                          savedQueries.map((query) => (
                            <div 
                              key={query.id} 
                              className="p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => loadSavedQuery(query)}
                            >
                              <div className="font-medium text-sm truncate">{query.name}</div>
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {query.query}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(query.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Query History</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                        {queryHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No query history yet
                          </p>
                        ) : (
                          queryHistory.slice(0, 20).map((item) => (
                            <div 
                              key={item.id} 
                              className="p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => loadHistoryQuery(item)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {item.status === 'success' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.executionTime}s
                                </span>
                              </div>
                              <div className="text-xs font-mono truncate">
                                {item.query}
                              </div>
                              {item.status === 'success' && item.rowCount !== undefined && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.rowCount} rows returned
                                </div>
                              )}
                              {item.status === 'error' && item.error && (
                                <div className="text-xs text-red-500 mt-1 truncate">
                                  {item.error}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiTabSQLEditor;
