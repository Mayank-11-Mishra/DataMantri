import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Play, RefreshCw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MultiTabSQLEditor from './MultiTabSQLEditor';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  affectedRows?: number;
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

interface SQLExecutionSectionProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

const SQLExecutionSection: React.FC<SQLExecutionSectionProps> = ({ connectionStatus }) => {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [databases, setDatabases] = useState<any[]>([]);
  const { toast } = useToast();
  
  // State management

  // Fetch available databases from Data Sources Builder
  const fetchDatabases = async () => {
    try {
      const response = await fetch('/api/data-sources', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const dataSources = await response.json();
        setDatabases(dataSources);
        
        // Set default database if none selected
        if (dataSources.length > 0 && !selectedDatabase) {
          setSelectedDatabase(dataSources[0].name);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch data sources',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to data sources',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    // Fetch databases on component mount
    fetchDatabases();
  }, []);

  useEffect(() => {
    // Set default database when databases are loaded
    if (databases.length > 0 && !selectedDatabase) {
      setSelectedDatabase(databases[0].name);
    }
  }, [databases, selectedDatabase]);


  const executeQueryForTab = async (query: string, tabId: string): Promise<QueryResult> => {
    if (!query.trim() || !selectedDatabase) {
      throw new Error('Please enter a SQL query and select a database');
    }

    const startTime = Date.now();

    try {
      // Fetch data sources
      const dataSourcesResponse = await fetch('/api/data-sources', {
        credentials: 'include'
      });
      
      if (!dataSourcesResponse.ok) {
        throw new Error('Failed to fetch data sources');
      }
      
      const dataSources = await dataSourcesResponse.json();
      const selectedSource = dataSources.find((source: any) => source.name === selectedDatabase);
      
      if (!selectedSource) {
        throw new Error(`Data source '${selectedDatabase}' not found`);
      }
      
      const response = await fetch('/api/data-marts/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          data_source_id: selectedSource.id,
          query: query
        })
      });

      const result = await response.json();
      const executionTime = (Date.now() - startTime) / 1000;
      
      if (response.ok && result.status === 'success') {
        const queryResult: QueryResult = {
          columns: result.columns || [],
          rows: result.data || result.rows || [],
          rowCount: result.row_count || (result.data || result.rows || []).length,
          executionTime: executionTime,
          status: 'success'
        };
        
        
        // Add to history
        const historyEntry: QueryHistory = {
          id: Date.now().toString(),
          query: query,
          timestamp: new Date().toISOString(),
          executionTime: executionTime,
          status: 'success',
          rowCount: queryResult.rowCount
        };
        setQueryHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
        
        return queryResult;
      } else {
        throw new Error(result.message || 'Query execution failed');
      }
    } catch (error: any) {
      const executionTime = (Date.now() - startTime) / 1000;
      
      // Add error to history
      const historyEntry: QueryHistory = {
        id: Date.now().toString(),
        query: query,
        timestamp: new Date().toISOString(),
        executionTime: executionTime,
        status: 'error',
        error: error.message
      };
      setQueryHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
      
      // Return error result instead of throwing
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: executionTime,
        status: 'error',
        error: error.message
      };
    }
  };

  const handleSaveQuery = (name: string, query: string) => {
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name: name,
      query: query,
      createdAt: new Date().toISOString()
    };
    
    setSavedQueries([newQuery, ...savedQueries]);
    
    toast({
      title: 'Success',
      description: 'Query saved successfully'
    });
  };

  if (connectionStatus !== 'connected') {
    return (
      <div className="text-center py-8">
        <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {connectionStatus === 'connecting' ? 'Connecting to database server...' : 'Not connected to database server'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Selection */}
      <Card>
        <CardHeader>
          <CardTitle>SQL Query Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="database-select">Database</Label>
              <div className="flex gap-2">
                <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select database" />
                  </SelectTrigger>
                  <SelectContent>
                    {databases.map((db) => (
                      <SelectItem key={db.id || db.name} value={db.name}>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {db.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDatabases}
                  title="Refresh database list"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Tab SQL Editor */}
      <MultiTabSQLEditor
        selectedDatabase={selectedDatabase}
        onExecuteQuery={executeQueryForTab}
        onSaveQuery={handleSaveQuery}
        savedQueries={savedQueries}
        queryHistory={queryHistory}
      />
    </div>
  );
};

export default SQLExecutionSection;
