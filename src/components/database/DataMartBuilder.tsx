import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Boxes, Plus, FileText, LayoutGrid, Trash2, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

const UiBuilder = ({ onCancel, dataMartId }: { onCancel: () => void, dataMartId?: number | null }) => {
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<{ [key: string]: string[] }>({});
      const [joins, setJoins] = useState<{ leftTable: string; leftColumn: string; rightTable: string; rightColumn: string; type: string; }[]>([]);
  const [unions, setUnions] = useState<{ tables: string[] }[]>([]);
      const [dataMartName, setDataMartName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [columnSearchTerms, setColumnSearchTerms] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetch('/api/data-sources', { credentials: 'include' })
      .then(res => res.json())
      .then(setDataSources)
      .catch(err => console.error('Failed to fetch data sources:', err));

    if (dataMartId) {
      setIsEditMode(true);
      fetch(`/api/data-marts/${dataMartId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setDataMartName(data.name);
          setSelectedSource(data.data_source_id.toString());
          // Definition will be set in the schema useEffect
        });
    }
  }, [dataMartId]);

  useEffect(() => {
    if (selectedSource) {
      setIsLoadingSchema(true);
      if (!isEditMode || (isEditMode && selectedSource !== dataMartId?.toString())) {
        setSchema(null);
        setSelectedTables([]);
        setSelectedColumns({});
        setJoins([]);
      }
      fetch(`/api/data-sources/${selectedSource}/schema`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.schema) {
            setSchema(data.schema);
            if (isEditMode) {
              // Now that schema is loaded, set the rest of the definition
              fetch(`/api/data-marts/${dataMartId}`, { credentials: 'include' })
                .then(res => res.json())
                .then(dm => {
                  setSelectedTables(dm.definition.tables || []);
                  setSelectedColumns(dm.definition.columns || {});
                  setJoins(dm.definition.joins || []);
                  setUnions(dm.definition.unions || []);
                });
            }
          }
        })
        .catch(() => setSchema(null))
        .finally(() => setIsLoadingSchema(false));
    }
  }, [selectedSource]);

  const handleTableSelect = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

    const handleColumnSearchChange = (tableName: string, searchTerm: string) => {
    setColumnSearchTerms(prev => ({ ...prev, [tableName]: searchTerm }));
  };

  const handleSelectAllColumns = (tableName: string, filteredColumns: any[]) => {
    const allColumnNames = filteredColumns.map(c => c.name);
    const currentSelected = selectedColumns[tableName] || [];
    const allSelected = allColumnNames.length > 0 && allColumnNames.every(name => currentSelected.includes(name));

    setSelectedColumns(prev => {
      const newSelected = { ...prev };
      if (allSelected) {
        newSelected[tableName] = currentSelected.filter(c => !allColumnNames.includes(c));
      } else {
        newSelected[tableName] = [...new Set([...currentSelected, ...allColumnNames])];
      }
      return newSelected;
    });
  };

  const handleColumnSelect = (tableName: string, columnName: string) => {
    setSelectedColumns(prev => {
      const tableColumns = prev[tableName] || [];
      const newTableColumns = tableColumns.includes(columnName)
        ? tableColumns.filter(c => c !== columnName)
        : [...tableColumns, columnName];
      return { ...prev, [tableName]: newTableColumns };
    });
  };

  const addJoin = () => {
    setJoins(prev => [...prev, { leftTable: '', leftColumn: '', rightTable: '', rightColumn: '', type: 'INNER' }]);
  };

  const updateJoin = (index: number, field: string, value: string) => {
    const newJoins = [...joins];
    const currentJoin = { ...newJoins[index], [field]: value };
    if (field === 'leftTable') currentJoin.leftColumn = '';
    if (field === 'rightTable') currentJoin.rightColumn = '';
    newJoins[index] = currentJoin;
    setJoins(newJoins);
  };

      const removeJoin = (index: number) => {
    setJoins(prev => prev.filter((_, i) => i !== index));
  };

    const addUnion = () => {
    setUnions(prev => [...prev, { tables: [] }]);
  };

  const updateUnion = (index: number, table: string) => {
    const newUnions = [...unions];
    const currentUnion = newUnions[index];
    if (currentUnion.tables.includes(table)) {
      currentUnion.tables = currentUnion.tables.filter(t => t !== table);
    } else {
      currentUnion.tables.push(table);
    }
    setUnions(newUnions);
  };

  const removeUnion = (index: number) => {
    setUnions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDataMart = async () => {
    if (isEditMode) {
      await handleUpdateDataMart();
    } else {
      await handleCreateDataMart();
    }
  };

  const handleCreateDataMart = async () => {
    if (!dataMartName.trim()) {
      toast({ title: 'Error', description: 'Data mart name is required.', variant: 'destructive' });
      return;
    }

        const payload = {
      name: dataMartName,
      data_source_id: selectedSource,
      definition: {
        tables: selectedTables,
        columns: selectedColumns,
        joins: joins,
        unions: unions,
      },
    };

    try {
      const response = await fetch('/api/data-marts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        toast({ title: 'Success!', description: 'Data mart created successfully.' });
        onCancel();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to create data mart.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  const handleUpdateDataMart = async () => {
    if (!dataMartName.trim()) {
      toast({ title: 'Error', description: 'Data mart name is required.', variant: 'destructive' });
      return;
    }

        const payload = {
      name: dataMartName,
      definition: {
        tables: selectedTables,
        columns: selectedColumns,
        joins: joins,
        unions: unions,
      },
    };

    try {
      const response = await fetch(`/api/data-marts/${dataMartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        toast({ title: 'Success!', description: 'Data mart updated successfully.' });
        onCancel();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to update data mart.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  return (
    <Card>
            <CardHeader>
        <CardTitle>Data Mart UI Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Mart Name</label>
          <Input 
            placeholder="Enter a name for your data mart..."
            value={dataMartName}
            onChange={(e) => setDataMartName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">1. Select a Data Source</label>
          <Select onValueChange={setSelectedSource} value={selectedSource || ''}>
            <SelectTrigger><SelectValue placeholder="Choose a data source..." /></SelectTrigger>
            <SelectContent>
              {dataSources.map(ds => (
                <SelectItem key={ds.id} value={ds.id.toString()}>{ds.name} ({ds.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSource && isLoadingSchema && <p>Loading schema...</p>}
        {schema && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">2. Select Tables and Columns</label>
            <Accordion type="multiple" className="w-full">
              {Object.keys(schema).map(tableName => (
                <AccordionItem value={tableName} key={tableName}>
                  <AccordionTrigger>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={tableName}
                        checked={selectedTables.includes(tableName)}
                        onCheckedChange={() => handleTableSelect(tableName)}
                      />
                      <label htmlFor={tableName} className="font-medium">{tableName}</label>
                    </div>
                  </AccordionTrigger>
                                    <AccordionContent className="pl-10 space-y-4">
                    <Input
                      placeholder="Search columns..."
                      value={columnSearchTerms[tableName] || ''}
                      onChange={(e) => handleColumnSearchChange(tableName, e.target.value)}
                      className="mb-2"
                    />
                    {(() => {
                      const searchTerm = (columnSearchTerms[tableName] || '').toLowerCase();
                      const filteredColumns = schema[tableName].filter((c: any) => c.name.toLowerCase().includes(searchTerm));
                      const allSelected = filteredColumns.length > 0 && filteredColumns.every((c: any) => selectedColumns[tableName]?.includes(c.name));

                      return (
                        <>
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`select-all-${tableName}`}
                              checked={allSelected}
                              onCheckedChange={() => handleSelectAllColumns(tableName, filteredColumns)}
                            />
                            <label htmlFor={`select-all-${tableName}`} className="text-sm font-medium">Select All</label>
                          </div>
                          <div className="space-y-2">
                            {filteredColumns.map((column: any) => (
                      <div key={column.name} className="flex items-center space-x-3">
                        <Checkbox
                          id={`${tableName}-${column.name}`}
                          checked={selectedColumns[tableName]?.includes(column.name)}
                          onCheckedChange={() => handleColumnSelect(tableName, column.name)}
                        />
                        <label htmlFor={`${tableName}-${column.name}`} className="text-sm font-medium">
                          {column.name} <span className="text-gray-400">({column.type})</span>
                        </label>
                      </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {selectedTables.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">3. Define Joins</label>
            <div className="space-y-4 p-4 border rounded-md">
              {joins.map((join, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto,1fr,1fr,auto] gap-2 items-center">
                  <Select onValueChange={(v) => updateJoin(index, 'leftTable', v)} value={join.leftTable}><SelectTrigger><SelectValue placeholder="Left Table" /></SelectTrigger><SelectContent>{selectedTables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                  <Select onValueChange={(v) => updateJoin(index, 'leftColumn', v)} value={join.leftColumn} disabled={!join.leftTable}><SelectTrigger><SelectValue placeholder="Left Column" /></SelectTrigger><SelectContent>{join.leftTable && schema[join.leftTable]?.map((c: any) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
                  <Select onValueChange={(v) => updateJoin(index, 'type', v)} value={join.type}><SelectTrigger className="w-[120px] mx-auto"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INNER">Inner</SelectItem><SelectItem value="LEFT">Left</SelectItem><SelectItem value="RIGHT">Right</SelectItem></SelectContent></Select>
                  <Select onValueChange={(v) => updateJoin(index, 'rightTable', v)} value={join.rightTable}><SelectTrigger><SelectValue placeholder="Right Table" /></SelectTrigger><SelectContent>{selectedTables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                  <Select onValueChange={(v) => updateJoin(index, 'rightColumn', v)} value={join.rightColumn} disabled={!join.rightTable}><SelectTrigger><SelectValue placeholder="Right Column" /></SelectTrigger><SelectContent>{join.rightTable && schema[join.rightTable]?.map((c: any) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
                  <Button variant="ghost" size="icon" onClick={() => removeJoin(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
              <Button onClick={addJoin} variant="secondary" size="sm">+ Add Join</Button>
            </div>
          </div>
        )}

        {selectedTables.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">4. Define Unions</label>
            <div className="space-y-4 p-4 border rounded-md">
              {unions.map((union, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Union #{index + 1}</h4>
                    <Button variant="ghost" size="icon" onClick={() => removeUnion(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedTables.map(table => (
                      <div key={table} className="flex items-center space-x-2">
                        <Checkbox
                          id={`union-${index}-${table}`}
                          checked={union.tables.includes(table)}
                          onCheckedChange={() => updateUnion(index, table)}
                        />
                        <label htmlFor={`union-${index}-${table}`}>{table}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={addUnion} variant="secondary" size="sm">+ Add Union</Button>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button onClick={onCancel} variant="outline">Cancel</Button>
                    <Button onClick={handleSaveDataMart}>{isEditMode ? 'Update Data Mart' : 'Save Data Mart'}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const QueryEditor = ({ onCancel }: { onCancel: () => void }) => {
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [dataMartName, setDataMartName] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/data-sources', { credentials: 'include' })
      .then(res => res.json())
      .then(setDataSources)
      .catch(err => console.error('Failed to fetch data sources:', err));
  }, []);

  const executeQuery = async () => {
    if (!selectedSource || !sqlQuery.trim()) {
      toast({ title: 'Error', description: 'Please select a data source and enter a query.', variant: 'destructive' });
      return;
    }

    setIsExecuting(true);
    try {
      const response = await fetch('/api/data-marts/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          data_source_id: selectedSource,
          query: sqlQuery
        })
      });

      const result = await response.json();
      if (response.ok) {
        setQueryResult(result);
        toast({ title: 'Success', description: 'Query executed successfully.' });
      } else {
        toast({ title: 'Error', description: result.message || 'Query execution failed.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to execute query.', variant: 'destructive' });
    } finally {
      setIsExecuting(false);
    }
  };

  const saveDataMart = async () => {
    if (!dataMartName.trim() || !selectedSource || !sqlQuery.trim()) {
      toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/data-marts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: dataMartName,
          data_source_id: selectedSource,
          query: sqlQuery,
          type: 'query'
        })
      });

      const result = await response.json();
      if (response.ok) {
        toast({ title: 'Success', description: 'Data mart created successfully.' });
        onCancel();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to create data mart.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save data mart.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Mart Query Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Mart Name</label>
          <Input 
            placeholder="Enter a name for your data mart..."
            value={dataMartName}
            onChange={(e) => setDataMartName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
          <Select onValueChange={setSelectedSource} value={selectedSource}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a data source..." />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map(ds => (
                <SelectItem key={ds.id} value={ds.id.toString()}>
                  {ds.name} ({ds.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SQL Query</label>
          <textarea
            className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="Enter your SQL query here...\nExample:\nSELECT \n  customer_id,\n  SUM(order_amount) as total_spent,\n  COUNT(*) as order_count\nFROM orders \nWHERE order_date >= '2024-01-01'\nGROUP BY customer_id\nORDER BY total_spent DESC"
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={executeQuery} 
            disabled={isExecuting || !selectedSource || !sqlQuery.trim()}
            variant="outline"
          >
            {isExecuting ? 'Executing...' : 'Test Query'}
          </Button>
        </div>

        {queryResult && (
          <div>
            <h3 className="text-lg font-medium mb-2">Query Results</h3>
            <div className="border rounded-md p-4 bg-gray-50 max-h-64 overflow-auto">
              <p className="text-sm text-gray-600 mb-2">
                Rows returned: {queryResult.rows?.length || 0}
              </p>
              {queryResult.rows && queryResult.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(queryResult.rows[0]).map(col => (
                          <th key={col} className="text-left p-2 font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.slice(0, 10).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          {Object.values(row).map((val: any, colIdx: number) => (
                            <td key={colIdx} className="p-2">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {queryResult.rows.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing first 10 rows of {queryResult.rows.length} total rows
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button onClick={onCancel} variant="outline">Cancel</Button>
          <Button 
            onClick={saveDataMart} 
            disabled={isSaving || !dataMartName.trim() || !selectedSource || !sqlQuery.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Data Mart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DataMartBuilder: React.FC<{ connectionStatus?: string }> = ({ connectionStatus }) => {
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'select' | 'ui-builder' | 'query-editor'>('list');
    const [dataMarts, setDataMarts] = useState<any[]>([]);
  const [editingDataMartId, setEditingDataMartId] = useState<number | null>(null);

  useEffect(() => {
    if (view === 'list') {
      fetch('/api/data-marts', { credentials: 'include' })
        .then(res => res.json())
        .then(setDataMarts)
        .catch(err => console.error('Failed to fetch data marts:', err));
    }
  }, [view]);

  const handleEdit = (id: number) => {
    setEditingDataMartId(id);
    setView('ui-builder');
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/data-marts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setDataMarts(dataMarts.filter(dm => dm.id !== id));
        toast({ title: 'Success', description: 'Data mart deleted successfully.' });
      } else {
        const errorData = await response.json();
        toast({ title: 'Error', description: errorData.message || 'Failed to delete data mart.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'select':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">How would you like to build your Data Mart?</h2>
            <div className="flex justify-center gap-8">
              <Button variant="outline" className="h-32 w-48 flex flex-col items-center justify-center space-y-2" onClick={() => setView('ui-builder')}>
                <LayoutGrid className="h-8 w-8" />
                <span>UI Builder</span>
              </Button>
              <Button variant="outline" className="h-32 w-48 flex flex-col items-center justify-center space-y-2" onClick={() => setView('query-editor')}>
                <FileText className="h-8 w-8" />
                <span>Query Editor</span>
              </Button>
            </div>
            <Button onClick={() => setView('list')} variant="link" className="mt-8">Cancel</Button>
          </div>
        );
            case 'ui-builder':
        return <UiBuilder onCancel={() => { setView('list'); setEditingDataMartId(null); }} dataMartId={editingDataMartId} />;
      case 'query-editor':
        return <QueryEditor onCancel={() => setView('list')} />;
      case 'list':
      default:
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-3"><Boxes /> Data Marts</h1>
              <Button className="gap-2" onClick={() => setView('select')}>
                <Plus className="h-4 w-4" />
                Create Data Mart
              </Button>
            </div>
                        <div className="bg-white shadow-md rounded-lg">
              {dataMarts.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {dataMarts.map(dm => (
                    <li key={dm.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{dm.name}</p>
                        <p className="text-sm text-gray-500">Updated: {new Date(dm.updated_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(dm.id)}><Pencil className="h-4 w-4 text-blue-500" /></Button>
                                                <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you sure?</DialogTitle>
                              <DialogDescription>
                                This action will permanently delete the "{dm.name}" data mart.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                              <Button variant="destructive" onClick={() => handleDelete(dm.id)}>Delete</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p>No data marts created yet. Click 'Create Data Mart' to get started.</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return <div className="p-6">{renderContent()}</div>;
};

export default DataMartBuilder;
