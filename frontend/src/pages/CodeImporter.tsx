import React, { useState } from 'react';
import {
  Upload, Code, FileCode, Sparkles, CheckCircle2, AlertCircle,
  Loader2, Download, Eye, Palette, Layout, BarChart3, Info
} from 'lucide-react';
import Editor from '@monaco-editor/react';

interface AnalysisResult {
  id: string;
  name: string;
  filename: string;
  status: string;
  extracted_themes: any[];
  extracted_charts: any[];
  extracted_layouts: any[];
  detected_components: string[];
  created_at: string;
}

const CodeImporter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [code, setCode] = useState('');
  const [fileName, setFileName] = useState('dashboard.tsx');
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('lovable');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    setError(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setTemplateName(file.name.replace(/\.(tsx?|jsx?|zip)$/, ''));
    
    // Store the file for ZIP handling
    if (file.name.endsWith('.zip')) {
      setUploadedFile(file);
      setCode(''); // Clear code for ZIP files
      setError(null);
    } else {
      // Read text content for single code files
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        setUploadedFile(null);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    // Validate input
    if (!code.trim() && !uploadedFile) {
      setError('Please provide some code to analyze or upload a file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let response;
      
      // Handle ZIP file upload with FormData
      if (uploadedFile && uploadedFile.name.endsWith('.zip')) {
        const formData = new FormData();
        formData.append('zipFile', uploadedFile);
        formData.append('name', templateName || `Imported from ${fileName}`);
        formData.append('description', description);
        formData.append('source_type', sourceType);
        
        response = await fetch('http://localhost:5001/api/import/analyze', {
          method: 'POST',
          credentials: 'include',
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary
        });
      } else {
        // Handle regular code/text file with JSON
        response = await fetch('http://localhost:5001/api/import/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            code,
            filename: fileName,
            name: templateName || `Imported from ${fileName}`,
            description,
            source_type: sourceType,
          }),
        });
      }

      if (response.status === 401) {
        setError('Please login first to use this feature. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const data = await response.json();

      // Handle duplicate code (409 Conflict)
      if (response.status === 409 && data.duplicate) {
        const existingTemplate = data.existing_template;
        const shouldReimport = confirm(
          `⚠️ ${data.message}\n\n` +
          `Previously imported as: "${existingTemplate.name}"\n` +
          `Date: ${existingTemplate.created_at ? new Date(existingTemplate.created_at).toLocaleDateString() : 'N/A'}\n\n` +
          `Would you like to RE-IMPORT this code?\n` +
          `(This will create a fresh analysis and new templates)`
        );
        
        if (shouldReimport) {
          // Retry with force_reimport flag
          setIsAnalyzing(true);
          
          if (uploadedFile && uploadedFile.name.endsWith('.zip')) {
            const formData = new FormData();
            formData.append('zipFile', uploadedFile);
            formData.append('name', templateName || `Imported from ${fileName}`);
            formData.append('description', description);
            formData.append('source_type', sourceType);
            formData.append('force_reimport', 'true');
            
            response = await fetch('http://localhost:5001/api/import/analyze', {
              method: 'POST',
              credentials: 'include',
              body: formData,
            });
          } else {
            response = await fetch('http://localhost:5001/api/import/analyze', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code,
                filename: fileName,
                name: templateName || `Imported from ${fileName}`,
                description,
                source_type: sourceType,
                force_reimport: true,
              }),
            });
          }
          
          const retryData = await response.json();
          if (retryData.status === 'success') {
            setAnalysisResult(retryData.template);
            setError(null);
          } else {
            setError(retryData.message || 'Re-import failed');
          }
        } else {
          setError(`Import cancelled. The existing template "${existingTemplate.name}" was not modified.`);
        }
        return;
      }

      if (data.status === 'success') {
        setAnalysisResult(data.template);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (err) {
      setError(`Failed to analyze code: ${err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConvert = async () => {
    if (!analysisResult) return;

    setIsConverting(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5001/api/import/convert/${analysisResult.id}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (response.status === 401) {
        setError('Session expired. Please login again. Redirecting...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const data = await response.json();

      if (data.status === 'success') {
        // Update analysis result with conversion info
        setAnalysisResult({...analysisResult, status: 'converted'});
        alert(
          `✅ Successfully created:\n• ${data.created.themes} Theme(s)\n• ${data.created.charts} Chart Template(s)\n• ${data.created.layouts} Layout Template(s)`
        );
      } else {
        setError(data.message || 'Conversion failed');
      }
    } catch (err) {
      setError(`Failed to convert template: ${err}`);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Smart Code Importer
              </h1>
              <p className="text-sm text-gray-600">
                Import Lovable dashboards and extract themes, charts & layouts
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="mt-4 flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">How it works:</p>
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                <li>Paste or upload your React dashboard code (from Lovable exports)</li>
                <li>Click "Analyze Code" to extract patterns automatically</li>
                <li>Review detected themes, charts, and layouts</li>
                <li>Click "Convert to Templates" to save them for reuse</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Code Input */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Code Input
              </h2>

              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'paste'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileCode className="w-4 h-4 inline mr-2" />
                  Paste Code
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'upload'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload File
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Template Metadata */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Sales Dashboard"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this dashboard template"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Type
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="lovable">Lovable Export</option>
                    <option value="custom">Custom Code</option>
                    <option value="uploaded">Uploaded File</option>
                  </select>
                </div>
              </div>

              {/* Code Editor or File Upload */}
              {activeTab === 'paste' ? (
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    defaultLanguage="typescript"
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".tsx,.jsx,.ts,.js,.zip"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-700 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-slate-500">
                      .tsx, .jsx, .ts, .js or .zip files
                    </p>
                    {fileName && (
                      <p className="mt-3 text-sm text-blue-600 font-medium">
                        Selected: {fileName}
                      </p>
                    )}
                  </label>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!code.trim() && !uploadedFile)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Code...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Analysis Results */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Analysis Results
              </h2>
            </div>

            <div className="p-6">
              {!analysisResult ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">
                    Paste or upload code and click "Analyze" to see results
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">
                        Analysis Complete
                      </span>
                    </div>
                    {analysisResult.status === 'converted' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        ✅ Converted
                      </span>
                    )}
                  </div>

                  {/* Extracted Elements Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">
                          Themes
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {analysisResult.extracted_themes?.length || 0}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Charts
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analysisResult.extracted_charts?.length || 0}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Layout className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Layouts
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {analysisResult.extracted_layouts?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Detected Components */}
                  {analysisResult.detected_components && analysisResult.detected_components.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Detected Components:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.detected_components.map((comp, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Themes Details with Preview */}
                  {analysisResult.extracted_themes && analysisResult.extracted_themes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        🎨 Theme Preview ({analysisResult.extracted_themes.length}):
                      </h3>
                      {analysisResult.extracted_themes.map((theme, idx) => (
                        <div
                          key={idx}
                          className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 space-y-4"
                        >
                          {theme.colors?.chart_colors && theme.colors.chart_colors.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-purple-900 mb-3">
                                📊 Chart Color Palette ({theme.colors.chart_colors.length} colors):
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {theme.colors.chart_colors.slice(0, 12).map((color: string, cidx: number) => (
                                  <div key={cidx} className="flex flex-col items-center gap-1">
                                    <div
                                      className="w-12 h-12 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                    <span className="text-[10px] font-mono text-purple-700">
                                      {color}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-purple-200">
                            {theme.fonts?.family && (
                              <div>
                                <p className="text-xs font-medium text-purple-700 mb-1">Font Family:</p>
                                <p className="text-sm text-purple-900 font-semibold">{theme.fonts.family}</p>
                              </div>
                            )}
                            {theme.border_radius && theme.border_radius.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-purple-700 mb-1">Border Radius:</p>
                                <p className="text-sm text-purple-900 font-semibold">{theme.border_radius[0]}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Extracted Charts Details with Preview */}
                  {analysisResult.extracted_charts && analysisResult.extracted_charts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        📊 Chart Types Found ({analysisResult.extracted_charts.length}):
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {analysisResult.extracted_charts.map((chart, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-blue-900 capitalize">
                                  {chart.type || 'chart'}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {chart.library || 'recharts'}
                              </span>
                            </div>
                            <p className="text-xs text-blue-700 mb-2">
                              Component: <span className="font-mono">{chart.component}</span>
                            </p>
                            {/* Visual indicator based on chart type */}
                            <div className="mt-3 h-16 bg-white/50 rounded flex items-center justify-center">
                              {chart.type === 'bar' && (
                                <div className="flex items-end gap-1 h-12">
                                  <div className="w-4 bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                                  <div className="w-4 bg-blue-500 rounded-t" style={{height: '80%'}}></div>
                                  <div className="w-4 bg-blue-500 rounded-t" style={{height: '50%'}}></div>
                                  <div className="w-4 bg-blue-500 rounded-t" style={{height: '90%'}}></div>
                                </div>
                              )}
                              {chart.type === 'line' && (
                                <svg className="w-20 h-12" viewBox="0 0 80 48">
                                  <polyline
                                    points="0,40 20,25 40,30 60,15 80,20"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                  />
                                </svg>
                              )}
                              {chart.type === 'pie' && (
                                <svg className="w-12 h-12" viewBox="0 0 48 48">
                                  <circle cx="24" cy="24" r="20" fill="#3b82f6" fillOpacity="0.3" />
                                  <path d="M24,24 L24,4 A20,20 0 0,1 44,24 Z" fill="#3b82f6" />
                                </svg>
                              )}
                              {chart.type === 'treemap' && (
                                <div className="grid grid-cols-2 gap-1 w-16 h-12">
                                  <div className="bg-blue-500 rounded" style={{gridColumn: '1 / 2', gridRow: '1 / 3'}}></div>
                                  <div className="bg-blue-400 rounded"></div>
                                  <div className="bg-blue-300 rounded"></div>
                                </div>
                              )}
                              {!['bar', 'line', 'pie', 'treemap'].includes(chart.type) && (
                                <span className="text-2xl">📊</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Convert Button */}
                  {analysisResult.status !== 'converted' && (
                    <button
                      onClick={handleConvert}
                      disabled={isConverting}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Convert to Templates
                        </>
                      )}
                    </button>
                  )}

                  {analysisResult.status === 'converted' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <p className="text-green-900 font-medium">
                        Successfully converted to reusable templates!
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        You can now use these in your dashboard builders
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeImporter;

