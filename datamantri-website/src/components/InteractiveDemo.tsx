import { useState, useEffect } from 'react';
import { Play, Pause, Database, Zap, Code, Activity, Network, GitBranch, Boxes, CheckCircle, ArrowRight, Loader, Table, BarChart3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const demos = [
  {
    id: 'data-sources',
    title: 'Data Sources',
    icon: <Database className="w-5 h-5" />,
    description: 'Connect databases, browse schema, and explore data in real-time',
    color: 'from-blue-500 to-indigo-600',
    animationSteps: [
      { action: 'Click "Add Data Source" button', visual: 'button-click', duration: 1200 },
      { action: 'Select PostgreSQL from dropdown', visual: 'dropdown-select', duration: 1500 },
      { action: 'Enter connection details (Host, Port, Database)', visual: 'form-typing', duration: 2000 },
      { action: 'Click "Test Connection" → Success ✓', visual: 'success-animation', duration: 1500 },
      { action: 'View schema: 148 tables loaded', visual: 'schema-list', duration: 2000 },
      { action: 'Click table → View columns, indexes, relations', visual: 'table-expand', duration: 1800 },
      { action: 'Browse data with pagination (50,000 rows)', visual: 'data-grid', duration: 1500 }
    ]
  },
  {
    id: 'data-marts',
    title: 'Data Marts',
    icon: <Boxes className="w-5 h-5" />,
    description: 'Build data marts with UI Builder or SQL Query Editor',
    color: 'from-green-500 to-emerald-600',
    animationSteps: [
      { action: 'Click "Create Data Mart"', visual: 'button-click', duration: 1000 },
      { action: 'Choose UI Builder or Query Editor', visual: 'modal-select', duration: 1500 },
      { action: 'Select UI Builder (Visual Interface)', visual: 'card-click', duration: 1200 },
      { action: 'Enter mart name: "Sales Dashboard Data"', visual: 'form-typing', duration: 1800 },
      { action: 'Select source: PostgreSQL Production', visual: 'dropdown-select', duration: 1500 },
      { action: 'Choose tables: orders, customers, products', visual: 'multi-select', duration: 2000 },
      { action: 'Data mart created successfully ✓', visual: 'success-card', duration: 1500 }
    ]
  },
  {
    id: 'pipelines',
    title: 'Data Pipelines',
    icon: <GitBranch className="w-5 h-5" />,
    description: 'Airflow-style ETL pipelines with visual data flow',
    color: 'from-purple-500 to-violet-600',
    animationSteps: [
      { action: 'Click "Create Pipeline"', visual: 'button-click', duration: 1000 },
      { action: 'Enter name: "Sales Data ETL"', visual: 'form-typing', duration: 1500 },
      { action: 'Select Source: PostgreSQL → sales_raw', visual: 'source-select', duration: 1800 },
      { action: 'Select Destination: MySQL → sales_processed', visual: 'dest-select', duration: 1800 },
      { action: 'Add SQL transformation with WHERE clause', visual: 'sql-editor', duration: 2000 },
      { action: 'Set schedule: Daily at 2 AM', visual: 'schedule-config', duration: 1500 },
      { action: 'Pipeline created → Visual flow diagram', visual: 'flow-diagram', duration: 2000 },
      { action: 'Click "Run Now" → Processing 50,000 rows', visual: 'pipeline-running', duration: 1800 },
      { action: 'Pipeline completed successfully ✓', visual: 'success-badge', duration: 1200 }
    ]
  },
  {
    id: 'sql-editor',
    title: 'SQL Editor',
    icon: <Code className="w-5 h-5" />,
    description: 'Multi-tab SQL editor with Monaco editor and result export',
    color: 'from-orange-500 to-amber-600',
    animationSteps: [
      { action: 'Open SQL Editor tab', visual: 'tab-switch', duration: 1000 },
      { action: 'Select database: PostgreSQL Production', visual: 'dropdown-select', duration: 1500 },
      { action: 'Type query: SELECT * FROM users WHERE...', visual: 'code-typing', duration: 2500 },
      { action: 'Autocomplete suggests table names', visual: 'autocomplete-popup', duration: 1500 },
      { action: 'Click "Execute" → Query running', visual: 'loading-animation', duration: 1200 },
      { action: 'Results loaded: 15,847 rows in 0.3s', visual: 'results-table', duration: 2000 },
      { action: 'Click "Export" → Save as CSV', visual: 'export-menu', duration: 1500 },
      { action: 'Open new tab for another query', visual: 'new-tab', duration: 1200 }
    ]
  },
  {
    id: 'performance',
    title: 'Performance Monitoring',
    icon: <Activity className="w-5 h-5" />,
    description: 'Real-time system metrics and query performance',
    color: 'from-pink-500 to-rose-600',
    animationSteps: [
      { action: 'Open Performance tab', visual: 'tab-switch', duration: 1000 },
      { action: 'Enable auto-refresh (5 seconds)', visual: 'toggle-switch', duration: 1200 },
      { action: 'View CPU usage: 45% → 52% (live update)', visual: 'gauge-animation', duration: 2000 },
      { action: 'View Memory: 8.2 GB / 16 GB', visual: 'progress-bar', duration: 1500 },
      { action: 'Active processes: 47 connections', visual: 'table-update', duration: 1800 },
      { action: 'Identify slow query (2.3s execution)', visual: 'slow-query-highlight', duration: 1500 },
      { action: 'Click "Optimize" → Performance tips', visual: 'modal-open', duration: 1500 }
    ]
  },
  {
    id: 'visual-tools',
    title: 'Visual Tools',
    icon: <Network className="w-5 h-5" />,
    description: 'ER diagrams and database relationship visualization',
    color: 'from-cyan-500 to-teal-600',
    animationSteps: [
      { action: 'Open Visual Tools tab', visual: 'tab-switch', duration: 1000 },
      { action: 'Select database: PostgreSQL Production', visual: 'dropdown-select', duration: 1500 },
      { action: 'Generating ER diagram for 148 tables...', visual: 'loading-spinner', duration: 2000 },
      { action: 'Diagram rendered with table relationships', visual: 'er-diagram', duration: 2500 },
      { action: 'Zoom in to view table details', visual: 'zoom-animation', duration: 1500 },
      { action: 'Click table → Show columns & keys', visual: 'table-popup', duration: 1800 },
      { action: 'Relationship arrows between tables', visual: 'connection-lines', duration: 1500 },
      { action: 'Export diagram as PNG', visual: 'export-animation', duration: 1200 }
    ]
  },
  {
    id: 'ai-dashboard',
    title: 'AI Dashboard Builder',
    icon: <Zap className="w-5 h-5" />,
    description: 'Create dashboards with natural language prompts (Coming Soon)',
    color: 'from-indigo-500 to-purple-600',
    animationSteps: [
      { action: 'Type prompt: "Create sales dashboard"', visual: 'prompt-typing', duration: 2000 },
      { action: 'AI analyzing requirements...', visual: 'ai-thinking', duration: 1800 },
      { action: 'Identifying relevant data sources', visual: 'data-scan', duration: 1500 },
      { action: 'Generating chart recommendations', visual: 'chart-preview', duration: 2000 },
      { action: 'Creating: Revenue trend (Line chart)', visual: 'chart-build-1', duration: 1500 },
      { action: 'Creating: Top products (Bar chart)', visual: 'chart-build-2', duration: 1500 },
      { action: 'Creating: Sales by region (Map)', visual: 'chart-build-3', duration: 1500 },
      { action: 'Dashboard preview ready ✓', visual: 'dashboard-complete', duration: 1800 },
      { action: 'One-click deploy → Live dashboard', visual: 'deploy-animation', duration: 1200 }
    ]
  }
];

export default function InteractiveDemo() {
  const { theme } = useTheme();
  const [activeDemo, setActiveDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentDemo = demos[activeDemo];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    
    if (isPlaying && currentStep < currentDemo.animationSteps.length) {
      const stepDuration = currentDemo.animationSteps[currentStep].duration;
      
      // Progress bar animation
      let progressCount = 0;
      progressInterval = setInterval(() => {
        progressCount += 50;
        setProgress((progressCount / stepDuration) * 100);
      }, 50);
      
      // Move to next step
      interval = setTimeout(() => {
        if (currentStep < currentDemo.animationSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      }, stepDuration);
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(interval);
    };
  }, [isPlaying, currentStep, currentDemo]);

  const handlePlay = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const getVisualComponent = (visual: string, step: number) => {
    const isActive = isPlaying && step === currentStep;
    const isComplete = step < currentStep || (!isPlaying && step <= currentStep);

    switch (visual) {
      case 'button-click':
      case 'tab-switch':
        return (
          <div className={`w-full h-16 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
            isActive ? 'border-blue-500 bg-blue-50 scale-105' : isComplete ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              isActive ? 'bg-blue-600 text-white animate-pulse' : isComplete ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {isActive && <Loader className="w-4 h-4 inline mr-2 animate-spin" />}
              {isComplete && <CheckCircle className="w-4 h-4 inline mr-2" />}
              Button
            </div>
          </div>
        );
      
      case 'form-fill':
      case 'form-typing':
      case 'prompt-typing':
        return (
          <div className={`w-full space-y-2 transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-10 rounded-lg border-2 transition-all duration-500 ${
                isActive && i === 2 ? 'border-blue-500 bg-blue-50' : isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}>
                {isActive && i === 2 && (
                  <div className="h-full flex items-center px-3">
                    <div className="w-1 h-4 bg-blue-600 animate-pulse"></div>
                    <span className="ml-2 text-sm text-gray-600 animate-pulse">Typing...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      
      case 'dropdown-select':
      case 'modal-select':
        return (
          <div className={`w-full transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
            <div className={`h-12 rounded-lg border-2 flex items-center justify-between px-4 ${
              isActive ? 'border-blue-500 bg-blue-50' : isComplete ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <span className="text-sm font-medium text-gray-700">
                {isComplete ? '✓ PostgreSQL Production' : 'Select database...'}
              </span>
              {isActive && <Loader className="w-4 h-4 text-blue-600 animate-spin" />}
            </div>
            {isActive && (
              <div className="mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-xl animate-fade-in">
                {['PostgreSQL Production', 'MySQL Analytics', 'MongoDB Logs'].map((db, i) => (
                  <div key={i} className={`px-4 py-2 hover:bg-blue-50 cursor-pointer ${i === 0 ? 'bg-blue-100 font-semibold' : ''}`}>
                    {db}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'success-check':
      case 'success-animation':
      case 'success-card':
        return (
          <div className={`w-full h-24 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${
            isActive || isComplete ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="text-center">
              <CheckCircle className={`w-12 h-12 mx-auto mb-2 text-green-600 ${isActive ? 'animate-bounce' : ''}`} />
              <span className="text-green-700 font-bold">Success!</span>
            </div>
          </div>
        );

      case 'schema-load':
      case 'schema-list':
        return (
          <div className={`w-full space-y-1 transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-8 rounded-lg border flex items-center px-3 transition-all duration-300 ${
                isActive ? `border-blue-300 bg-blue-50 ${i <= 3 ? 'opacity-100' : 'opacity-50'}` : 
                isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`} style={{ transitionDelay: `${i * 100}ms` }}>
                <Database className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-xs text-gray-700">table_{i}</span>
              </div>
            ))}
            {isActive && (
              <div className="text-xs text-blue-600 animate-pulse">Loading 148 tables...</div>
            )}
          </div>
        );

      case 'data-browse':
      case 'data-grid':
      case 'results-table':
        return (
          <div className={`w-full transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
            <div className={`grid grid-cols-3 gap-1`}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`h-8 rounded border flex items-center justify-center text-xs transition-all duration-200 ${
                  isActive ? 'border-blue-300 bg-blue-50 animate-pulse' : isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`} style={{ transitionDelay: `${i * 50}ms` }}>
                  {i < 3 ? 'Column' : 'Data'}
                </div>
              ))}
            </div>
            {isActive && (
              <div className="mt-2 text-xs text-blue-600 animate-pulse">Loading rows 1-50 of 50,000...</div>
            )}
          </div>
        );

      case 'loading-spinner':
      case 'loading-animation':
        return (
          <div className="w-full h-32 rounded-xl border-2 border-blue-300 bg-blue-50 flex items-center justify-center">
            <Loader className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        );

      case 'pipeline-running':
        return (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className={`w-5 h-5 text-gray-400 ${isActive ? 'animate-pulse' : ''}`} />
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className={`w-5 h-5 text-gray-400 ${isActive ? 'animate-pulse' : ''}`} />
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-blue-600 transition-all duration-1000 ${isActive ? 'w-3/4' : 'w-0'}`}></div>
            </div>
            {isActive && (
              <div className="text-xs text-blue-600 animate-pulse">Processing 50,000 rows...</div>
            )}
          </div>
        );

      case 'er-diagram':
        return (
          <div className="w-full h-40 rounded-xl border-2 border-cyan-300 bg-cyan-50 p-4">
            <div className="grid grid-cols-3 gap-4 h-full">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`border-2 border-cyan-500 rounded-lg bg-white p-2 transition-all duration-300 ${
                  isActive ? 'animate-pulse' : ''
                }`}>
                  <div className="text-xs font-bold text-cyan-700">Table {i}</div>
                  <div className="space-y-1 mt-2">
                    <div className="h-1 bg-cyan-200 rounded"></div>
                    <div className="h-1 bg-cyan-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className={`w-full h-20 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
            isActive ? 'border-blue-500 bg-blue-50' : isComplete ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <span className="text-sm text-gray-600">
              {isActive && <Loader className="w-4 h-4 inline mr-2 animate-spin" />}
              {isComplete && <CheckCircle className="w-4 h-4 inline mr-2 text-green-600" />}
              {visual}
            </span>
          </div>
        );
    }
  };

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-gray-50 to-white px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            <Play className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Animated Product Demos</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See DataMantri
            <span className={`block mt-2 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
              In Action
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch animated demos showing real product workflows and features
          </p>
        </div>

        {/* Feature Tabs */}
        <div className="mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max pb-4 justify-center">
            {demos.map((demo, index) => (
              <button
                key={demo.id}
                onClick={() => {
                  setActiveDemo(index);
                  setIsPlaying(false);
                  setCurrentStep(0);
                  setProgress(0);
                }}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  activeDemo === index
                    ? `bg-gradient-to-r ${demo.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {demo.icon}
                  <span>{demo.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Player */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
          {/* Browser Chrome */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b-2 border-gray-300">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 shadow-inner border border-gray-200">
                <span className="text-green-600 font-medium">🔒</span> https://app.datamantri.com/{currentDemo.id}
              </div>
            </div>
          </div>

          {/* Video Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentDemo.color} text-white shadow-lg`}>
                  {currentDemo.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{currentDemo.title}</h3>
                  <p className="text-gray-600">{currentDemo.description}</p>
                </div>
              </div>
              
              {/* Video Controls */}
              <div className="flex items-center gap-2">
                {!isPlaying && currentStep === 0 && (
                  <button
                    onClick={handlePlay}
                    className={`px-6 py-3 bg-gradient-to-r ${currentDemo.color} text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2`}
                  >
                    <Play className="w-5 h-5" />
                    Play Demo
                  </button>
                )}
                {isPlaying && (
                  <button
                    onClick={handlePause}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                )}
                {!isPlaying && currentStep > 0 && (
                  <button
                    onClick={handleRestart}
                    className={`px-6 py-3 bg-gradient-to-r ${currentDemo.color} text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2`}
                  >
                    <Play className="w-5 h-5" />
                    Restart
                  </button>
                )}
              </div>
            </div>

            {/* Animation Display */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-6 min-h-[400px] border-2 border-gray-200">
              <div className="space-y-4">
                {currentDemo.animationSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-300 ${
                      index === currentStep ? 'opacity-100 scale-100' : 
                      index < currentStep ? 'opacity-60 scale-95' : 
                      'opacity-30 scale-90'
                    }`}
                  >
                    {/* Step Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                          index === currentStep ? `bg-gradient-to-br ${currentDemo.color} text-white` :
                          index < currentStep ? 'bg-green-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {index < currentStep ? '✓' : index + 1}
                        </div>
                        <span className={`font-semibold ${
                          index === currentStep ? 'text-gray-900 text-lg' :
                          index < currentStep ? 'text-green-700' :
                          'text-gray-500'
                        }`}>
                          {step.action}
                        </span>
                      </div>
                      {index === currentStep && isPlaying && (
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                        </div>
                      )}
                    </div>

                    {/* Visual Animation */}
                    {index === currentStep && (
                      <div className="pl-11">
                        {getVisualComponent(step.visual, index)}
                        {/* Progress Bar */}
                        {isPlaying && (
                          <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${currentDemo.color} transition-all duration-100`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Completion Message */}
              {!isPlaying && currentStep === currentDemo.animationSteps.length - 1 && (
                <div className="mt-8 text-center animate-fade-in">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4 animate-bounce" />
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Demo Complete!</h4>
                  <p className="text-gray-600 mb-6">Want to try it yourself?</p>
                  <button
                    onClick={() => window.open('http://localhost:8082', '_blank')}
                    className={`px-8 py-3 bg-gradient-to-r ${currentDemo.color} text-white rounded-xl font-bold hover:shadow-2xl transition`}
                  >
                    Open Live Product →
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              {activeDemo > 0 && (
                <button
                  onClick={() => {
                    setActiveDemo(activeDemo - 1);
                    setIsPlaying(false);
                    setCurrentStep(0);
                    setProgress(0);
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  ← Previous
                </button>
              )}
              {activeDemo < demos.length - 1 && (
                <button
                  onClick={() => {
                    setActiveDemo(activeDemo + 1);
                    setIsPlaying(false);
                    setCurrentStep(0);
                    setProgress(0);
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
