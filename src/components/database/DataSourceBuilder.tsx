import React, { useState, useEffect } from 'react';
import CreateDataSourceView from '../views/CreateDataSourceView';
import EditDataSourceView from '../views/EditDataSourceView';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Pencil, Database, Table, Link, Plus, Search, RefreshCw, Edit3, Key, Zap, AlertTriangle, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Interfaces
interface DataSource {
  id: number;
  name: string;
  type: string;
}

interface DataRow { [key: string]: any; }
interface ColumnInfo { name: string; type: string; nullable: boolean; key: string; default: any; }
interface IndexInfo { name: string; table: string; columns: string[]; type: 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT'; cardinality: number; size: string; }
interface ForeignKeyInfo { name: string; table: string; columns: string[]; referencedTable: string; referencedColumns: string[]; onUpdate: string; onDelete: string; }

const DataSourceBuilder: React.FC<{ connectionStatus?: string }> = () => {
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);

  useEffect(() => {
    if (view === 'list') {
      fetch('/api/data-sources', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => setDataSources(data))
        .catch((error) => console.error('Error fetching data sources:', error));
    }
  }, [view]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/data-sources/${id}`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) {
        setDataSources(dataSources.filter((source) => source.id !== id));
        toast({ title: 'Success', description: 'Data source deleted successfully.' });
      } else {
        const errorData = await response.json();
        toast({ title: 'Error', description: `Failed to delete data source: ${errorData.message}`, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  if (view === 'create') {
    return <CreateDataSourceView onCancel={() => setView('list')} />;
  }

  if (view === 'edit' && editingId) {
    return <EditDataSourceView dataSourceId={editingId} onCancel={() => setView('list')} onSaved={() => setView('list')} />;
  }

  if (selectedDataSource) {
    return <DataSourceDetailView dataSource={selectedDataSource} onBack={() => setSelectedDataSource(null)} />
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Data Sources</h1>
        <Button onClick={() => setView('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Data Source
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataSources.map((source) => (
          <Card key={source.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{source.name}</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{source.type}</div>
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedDataSource(source)}>
                  Manage
                </Button>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingId(source.id); setView('edit'); }}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete the "{source.name}" data source.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={() => handleDelete(source.id)}>Delete</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const DataSourceDetailView = ({ dataSource, onBack }: { dataSource: DataSource, onBack: () => void }) => {
  return (
    <div className="p-6">
        <Button onClick={onBack} variant="outline" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Data Sources
        </Button>
        <h1 className="text-2xl font-bold mb-4">{dataSource.name} ({dataSource.type})</h1>
        <Tabs defaultValue="schema">
            <TabsList>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="data-browser">Data Browser</TabsTrigger>
                <TabsTrigger value="indexes">Indexes & Relations</TabsTrigger>
            </TabsList>
            <TabsContent value="schema"><SchemaView dataSource={dataSource} /></TabsContent>
            <TabsContent value="data-browser"><DataBrowser dataSource={dataSource} /></TabsContent>
            <TabsContent value="indexes"><IndexesView dataSource={dataSource} /></TabsContent>
        </Tabs>
    </div>
  )
}

const SchemaView = ({ dataSource }: { dataSource: DataSource }) => {
    const [schema, setSchema] = useState<any>(null);
    const [isLoadingSchema, setIsLoadingSchema] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoadingSchema(true);
        fetch(`/api/data-sources/${dataSource.id}/schema`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.schema) setSchema(data.schema);
                else throw new Error(data.message || 'Failed to fetch schema');
            })
            .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
            .finally(() => setIsLoadingSchema(false));
    }, [dataSource]);

    return (
        <Card>
            <CardHeader><CardTitle>Schema</CardTitle></CardHeader>
            <CardContent>
            {isLoadingSchema ? <p>Loading schema...</p> : schema ? (
                <div className="space-y-4">
                    {Object.entries(schema).map(([tableName, columns]: [string, any]) => (
                    <div key={tableName}>
                        <h3 className="font-semibold text-lg mb-2">{tableName}</h3>
                        <ul className="divide-y divide-gray-200 border rounded-md">
                        {columns.map((col: any) => (
                            <li key={col.name} className="px-4 py-2 flex justify-between">
                            <span>{col.name}</span>
                            <span className="text-gray-500 text-sm">{col.type}</span>
                            </li>
                        ))}
                        </ul>
                    </div>
                    ))}
                </div>
                ) : <p>Could not load schema.</p>}
            </CardContent>
        </Card>
    )
}

const DataBrowser = ({ dataSource }: { dataSource: DataSource }) => {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [rowsPerPage] = useState(25);

  const fetchTables = async () => {
    try {
      const schemaResponse = await fetch(`/api/data-sources/${dataSource.id}/schema`, { credentials: 'include' });
      if (schemaResponse.ok) {
        const schemaData = await schemaResponse.json();
        const tableNames = Object.keys(schemaData.schema || {});
        setTables(tableNames);
        if (tableNames.length > 0) {
          setSelectedTable(tableNames[0]);
        }
      } else {
        throw new Error('Failed to fetch schema');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch tables.', variant: 'destructive' });
    }
  };

  const fetchData = async (table = selectedTable) => {
    if (!table) return;
    setLoading(true);
    try {
      const offset = (currentPage - 1) * rowsPerPage;
      let url = `/api/data-sources/${dataSource.id}/table/${table}/browse?limit=${rowsPerPage}&offset=${offset}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
        setTotalRows(result.total || 0);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to fetch data: ${error.message}`, variant: 'destructive' });
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }

  const fetchColumnsAndData = async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const schemaResponse = await fetch(`/api/data-sources/${dataSource.id}/schema`, { credentials: 'include' });
      if (!schemaResponse.ok) throw new Error('Failed to fetch schema for columns');
      const schemaData = await schemaResponse.json();
      const tableColumns = schemaData.schema[selectedTable] || [];
      const columnInfo: ColumnInfo[] = tableColumns.map((col: any) => ({ name: col.name, type: col.type, nullable: col.nullable, key: col.key || '', default: col.default }));
      setColumns(columnInfo);
      await fetchData(selectedTable);
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to initialize table view: ${error.message}`, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [dataSource]);

  useEffect(() => {
    if (selectedTable) {
      setCurrentPage(1);
      fetchColumnsAndData();
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
        fetchData();
    }
  }, [currentPage, searchTerm]);

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Table</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTable && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input placeholder="Search data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
              <Button onClick={() => fetchData()} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            </div>
            <Button><Plus className="h-4 w-4 mr-2" />Insert Row</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data ({totalRows} rows)</CardTitle>
              <CardDescription>
                Showing {totalRows > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0} to {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows} rows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      {columns.map((col) => <th key={col.name} className="text-left p-2 font-medium">{col.name}</th>)}
                      <th className="text-left p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        {columns.map((col) => <td key={col.name} className="p-2 max-w-xs truncate">{row[col.name]?.toString() ?? <span className="text-muted-foreground">NULL</span>}</td>)}
                        <td className="p-2"><div className="flex items-center gap-1"><Button size="sm" variant="outline"><Edit3 className="h-3 w-3" /></Button><Button size="sm" variant="outline" className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

const IndexesView = ({ dataSource }: { dataSource: DataSource }) => {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [foreignKeys, setForeignKeys] = useState<ForeignKeyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateIndexDialog, setShowCreateIndexDialog] = useState(false);
  const [showCreateFKDialog, setShowCreateFKDialog] = useState(false);

  const fetchTables = async () => {
    try {
      const schemaResponse = await fetch(`/api/data-sources/${dataSource.id}/schema`, { credentials: 'include' });
      if (schemaResponse.ok) {
        const schemaData = await schemaResponse.json();
        const tableNames = Object.keys(schemaData.schema || {});
        setTables(tableNames);
        if (tableNames.length > 0) {
          setSelectedTable(tableNames[0]);
        }
      } else {
        throw new Error('Failed to fetch schema');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch tables.', variant: 'destructive' });
    }
  };

  const fetchIndexes = async (table: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}/table/${table}/indexes`, { credentials: 'include' });
      if(response.ok) {
        const data = await response.json();
        setIndexes(data.indexes || []);
      } else {
        throw new Error('Failed to fetch indexes');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const fetchForeignKeys = async (table: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}/table/${table}/foreign-keys`, { credentials: 'include' });
      if(response.ok) {
        const data = await response.json();
        setForeignKeys(data.foreign_keys || []);
      } else {
        throw new Error('Failed to fetch foreign keys');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const fetchTableColumns = async (table: string) => {
    try {
        const schemaResponse = await fetch(`/api/data-sources/${dataSource.id}/schema`, { credentials: 'include' });
        if (schemaResponse.ok) {
            const schemaData = await schemaResponse.json();
            const tableColumns = schemaData.schema[table] || [];
            setColumns(tableColumns.map((c: any) => ({ name: c.name, type: c.type, nullable: c.nullable, key: c.key, default: c.default })));
        } else {
            throw new Error('Failed to fetch schema for columns');
        }
    } catch (error: any) {
        toast({ title: 'Error', description: `Failed to fetch columns: ${error.message}`, variant: 'destructive' });
    }
  };
  
  const createIndex = async (indexData: any) => {
    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}/table/${selectedTable}/indexes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(indexData),
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Index created successfully.' });
        fetchIndexes(selectedTable);
        setShowCreateIndexDialog(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create index');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteIndex = async (indexName: string) => {
    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}/table/${selectedTable}/indexes/${indexName}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Index deleted successfully.' });
        fetchIndexes(selectedTable);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete index');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createForeignKey = async (fkData: any) => {
    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}/table/${selectedTable}/foreign-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fkData),
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Foreign key created successfully.' });
        fetchForeignKeys(selectedTable);
        setShowCreateFKDialog(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create foreign key');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteForeignKey = async (fkName: string) => {
    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}/table/${selectedTable}/foreign-keys/${fkName}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Foreign key deleted successfully.' });
        fetchForeignKeys(selectedTable);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete foreign key');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchTables();
  }, [dataSource]);

  useEffect(() => {
    if (selectedTable) {
      fetchIndexes(selectedTable);
      fetchForeignKeys(selectedTable);
      fetchTableColumns(selectedTable);
    }
  }, [selectedTable]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Table</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTable && (
        <>
          <div className="flex items-center justify-end gap-2 mb-4">
            <Button variant="outline" onClick={() => setShowCreateFKDialog(true)}><Link className="h-4 w-4 mr-2" />Add Foreign Key</Button>
            <Button onClick={() => setShowCreateIndexDialog(true)}><Plus className="h-4 w-4 mr-2" />Create Index</Button>
          </div>
          <Tabs defaultValue="indexes">
            <TabsList>
              <TabsTrigger value="indexes">Indexes</TabsTrigger>
              <TabsTrigger value="foreign-keys">Foreign Keys</TabsTrigger>
            </TabsList>
            <TabsContent value="indexes">
              {loading ? <p>Loading indexes...</p> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {indexes.map((index) => (
                    <Card key={index.name}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><Key className="h-4 w-4" /><span>{index.name}</span></div>
                          <Badge variant={index.type === 'PRIMARY' ? 'default' : 'outline'}>{index.type}</Badge>
                        </CardTitle>
                        <CardDescription>{index.columns.join(', ')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => deleteIndex(index.name)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="foreign-keys">
              {loading ? <p>Loading foreign keys...</p> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {foreignKeys.map((fk) => (
                    <Card key={fk.name}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Link className="h-4 w-4" /><span>{fk.name}</span></CardTitle>
                        <CardDescription>{fk.columns.join(', ')} → {fk.referencedTable}.{fk.referencedColumns.join(', ')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => deleteForeignKey(fk.name)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default DataSourceBuilder;
