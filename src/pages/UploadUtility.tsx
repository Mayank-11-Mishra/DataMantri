import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, Download, History, Settings, FileText, 
  Database, CheckCircle, XCircle, Clock, Plus 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UploadTemplate {
  id: number;
  name: string;
  description: string;
  file_format: string;
  validation_rules: any;
  transformation_rules: any;
  data_source_id: number;
  table_name: string;
  upload_mode: string;
  created_at: string;
  is_active: boolean;
}

interface UploadHistory {
  id: number;
  template_id: number;
  template_name: string;
  file_name: string;
  file_size: number;
  records_processed: number;
  records_success: number;
  records_failed: number;
  status: string;
  uploaded_at: string;
  processed_at: string;
}

const UploadUtility: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<UploadTemplate[]>([]);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<UploadTemplate | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<{id: number, name: string, type: string}[]>([]);

  // Template creation form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    file_format: 'csv',
    validation_rules: '{}',
    transformation_rules: '{}',
    data_source_id: 0,
    table_name: '',
    upload_mode: 'truncate_load'
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchTemplates();
    fetchHistory();
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDataSources(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/upload-templates', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/upload-history', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const createTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/upload-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateForm)
      });
      
      if (response.ok) {
        fetchTemplates();
        setTemplateForm({
          name: '',
          description: '',
          file_format: 'csv',
          validation_rules: '{}',
          transformation_rules: '{}',
          data_source_id: 0,
          table_name: '',
          upload_mode: 'truncate_load'
        });
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFileToTemplate = async () => {
    if (!selectedTemplate || !uploadFile) {
      alert('Please select both a template and a file to upload.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('template_id', selectedTemplate.id.toString());

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('File uploaded successfully!');
        fetchHistory();
        setUploadFile(null);
        // Reset file input
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        alert(`Upload failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Upload failed: Network error or server unavailable');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleFile = async (template: UploadTemplate) => {
    try {
      const response = await fetch(`/api/upload-templates/${template.id}/sample`, {
        credentials: 'include'
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sample_${template.name}.${template.file_format}`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to download sample:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload Utility</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage file upload templates and process data files' : 'Upload data files using predefined templates'}
          </p>
        </div>
      </div>

      <Tabs defaultValue={isAdmin ? "templates" : "upload"} className="space-y-4">
        <TabsList>
          {isAdmin && <TabsTrigger value="templates">Templates</TabsTrigger>}
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="history">Upload History</TabsTrigger>
        </TabsList>

        {/* Admin Template Management */}
        {isAdmin && (
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Upload Template
                </CardTitle>
                <CardDescription>
                  Define file format, validations, and destination for data uploads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                      placeholder="Sales Data Upload"
                    />
                  </div>
                  <div>
                    <Label htmlFor="file_format">File Format</Label>
                    <Select value={templateForm.file_format} onValueChange={(value) => setTemplateForm({...templateForm, file_format: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                    placeholder="Template for uploading sales data..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_source_id">Destination</Label>
                    <Select value={templateForm.data_source_id.toString()} onValueChange={(value) => setTemplateForm({...templateForm, data_source_id: parseInt(value, 10)})}>
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label htmlFor="table_name">Table Name</Label>
                    <Input
                      id="table_name"
                      value={templateForm.table_name}
                      onChange={(e) => setTemplateForm({...templateForm, table_name: e.target.value})}
                      placeholder="sales_data"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="upload_mode">Upload Mode</Label>
                  <Select value={templateForm.upload_mode} onValueChange={(value) => setTemplateForm({...templateForm, upload_mode: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truncate_load">Truncate & Load</SelectItem>
                      <SelectItem value="delta">Delta Update</SelectItem>
                      <SelectItem value="insert">Insert Only</SelectItem>
                      <SelectItem value="upsert">Insert & Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={createTemplate} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Template'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Format:</span>
                        <Badge variant="secondary">{template.file_format.toUpperCase()}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Mode:</span>
                        <Badge variant="outline">{template.upload_mode}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Table:</span>
                        <code className="text-xs bg-muted px-1 rounded">{template.table_name}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* File Upload */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Data File
              </CardTitle>
              <CardDescription>
                Select a template and upload your data file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-select">Select Upload Template</Label>
                  <Select 
                    value={selectedTemplate?.id.toString() || ""} 
                    onValueChange={(value) => {
                      const template = templates.find(t => t.id.toString() === value);
                      setSelectedTemplate(template || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template to upload files" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter(t => t.is_active).map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{template.name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {template.file_format.toUpperCase()}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{selectedTemplate.name}</h4>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => downloadSampleFile(selectedTemplate)}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download Sample
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{selectedTemplate.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Format: <Badge variant="secondary">{selectedTemplate.file_format.toUpperCase()}</Badge></span>
                      <span>Mode: <Badge variant="outline">{selectedTemplate.upload_mode}</Badge></span>
                    </div>
                  </div>
                )}
              </div>

              {selectedTemplate && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Upload to: {selectedTemplate.name}</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file">Select File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept={selectedTemplate.file_format === 'csv' ? '.csv' : 
                               selectedTemplate.file_format === 'excel' ? '.xlsx,.xls' : 
                               '.json'}
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    
                    {uploadFile && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}

                    <Button 
                      onClick={uploadFileToTemplate} 
                      disabled={!uploadFile || loading}
                      className="w-full"
                    >
                      {loading ? 'Uploading...' : 'Upload File'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Upload History
              </CardTitle>
              <CardDescription>
                Track all file uploads and their processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-medium">{item.file_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Template: {item.template_name} • 
                          Uploaded: {new Date(item.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        item.status === 'success' ? 'default' :
                        item.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {item.status}
                      </Badge>
                      {item.records_processed > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.records_success}/{item.records_processed} records
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {history.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No upload history found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadUtility;
