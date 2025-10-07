import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Database, GitBranch, Boxes, Code, Activity, Network, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface DemoScene {
  title: string;
  screen: React.ReactNode;
  duration: number;
  narration: string;
}

const demos = [
  {
    id: 'data-sources',
    title: 'Connect & Explore Data Sources',
    icon: <Database className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-600',
    story: 'From connection to insights in 30 seconds',
    scenes: [
      {
        title: 'Start: No Data Sources',
        narration: 'You have multiple databases but no unified view...',
        screen: 'empty-state',
        duration: 2000
      },
      {
        title: 'Click "Add Data Source"',
        narration: 'Click the button to connect your first database',
        screen: 'add-button-highlight',
        duration: 1500
      },
      {
        title: 'Select PostgreSQL',
        narration: 'Choose from 50+ database types',
        screen: 'database-selection',
        duration: 2000
      },
      {
        title: 'Enter Connection Details',
        narration: 'Fill in host, port, and credentials',
        screen: 'connection-form',
        duration: 2500
      },
      {
        title: 'Test Connection - Success!',
        narration: 'Instant validation of your connection',
        screen: 'connection-success',
        duration: 2000
      },
      {
        title: 'Loading Schema',
        narration: 'Automatically discovering 148 tables...',
        screen: 'schema-loading',
        duration: 2000
      },
      {
        title: 'Explore Schema',
        narration: 'Browse tables, columns, types, and keys',
        screen: 'schema-explorer',
        duration: 3000
      },
      {
        title: 'Browse Live Data',
        narration: 'View and search 50,000 rows with pagination',
        screen: 'data-browser',
        duration: 2500
      },
      {
        title: 'View Relationships',
        narration: 'See indexes and foreign key connections',
        screen: 'relationships',
        duration: 2500
      },
      {
        title: 'Complete!',
        narration: 'Your database is now connected and ready to use',
        screen: 'completion',
        duration: 2000
      }
    ]
  },
  {
    id: 'pipelines',
    title: 'Build Data Pipelines',
    icon: <GitBranch className="w-6 h-6" />,
    color: 'from-purple-500 to-violet-600',
    story: 'Airflow-style ETL in minutes, not hours',
    scenes: [
      {
        title: 'Start: Manual Data Copying',
        narration: 'Data stuck in silos, copied manually...',
        screen: 'problem-state',
        duration: 2000
      },
      {
        title: 'Create Pipeline',
        narration: 'Click to build your first automated pipeline',
        screen: 'create-pipeline',
        duration: 1500
      },
      {
        title: 'Name Your Pipeline',
        narration: 'Sales Data ETL - from raw to processed',
        screen: 'pipeline-name',
        duration: 2000
      },
      {
        title: 'Select Source',
        narration: 'PostgreSQL Production → sales_raw table',
        screen: 'source-selection',
        duration: 2500
      },
      {
        title: 'Select Destination',
        narration: 'MySQL Analytics → sales_processed table',
        screen: 'dest-selection',
        duration: 2500
      },
      {
        title: 'Add Transformation',
        narration: 'SQL: Filter, clean, and enrich your data',
        screen: 'transformation-sql',
        duration: 3000
      },
      {
        title: 'Set Schedule',
        narration: 'Daily at 2 AM or trigger manually',
        screen: 'schedule-config',
        duration: 2000
      },
      {
        title: 'Visual Flow Preview',
        narration: 'See your data pipeline in action',
        screen: 'flow-diagram',
        duration: 2500
      },
      {
        title: 'Run Pipeline',
        narration: 'Processing 50,000 rows in real-time...',
        screen: 'pipeline-running',
        duration: 3000
      },
      {
        title: 'Success & Monitoring',
        narration: 'Pipeline complete! Track history and performance',
        screen: 'pipeline-complete',
        duration: 2500
      }
    ]
  },
  {
    id: 'data-marts',
    title: 'Create Data Marts',
    icon: <Boxes className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-600',
    story: 'Join data from multiple sources visually',
    scenes: [
      {
        title: 'Start: Scattered Data',
        narration: 'Data spread across multiple databases...',
        screen: 'scattered-data',
        duration: 2000
      },
      {
        title: 'Create Data Mart',
        narration: 'Unify data from multiple sources',
        screen: 'create-mart',
        duration: 1500
      },
      {
        title: 'Choose Builder Mode',
        narration: 'UI Builder for visual or SQL for power users',
        screen: 'mode-selection',
        duration: 2500
      },
      {
        title: 'Select Source Tables',
        narration: 'Pick tables from PostgreSQL, MySQL, MongoDB',
        screen: 'source-tables',
        duration: 3000
      },
      {
        title: 'Visual Join Builder',
        narration: 'Drag and drop to connect tables',
        screen: 'join-builder',
        duration: 3000
      },
      {
        title: 'Preview Joined Data',
        narration: 'See combined data in real-time',
        screen: 'data-preview',
        duration: 2500
      },
      {
        title: 'Save Data Mart',
        narration: 'Reusable, queryable, ready for dashboards',
        screen: 'mart-saved',
        duration: 2000
      }
    ]
  },
  {
    id: 'sql-editor',
    title: 'Powerful SQL Editor',
    icon: <Code className="w-6 h-6" />,
    color: 'from-orange-500 to-amber-600',
    story: 'Query any database with autocomplete & export',
    scenes: [
      {
        title: 'Open SQL Editor',
        narration: 'Monaco editor with syntax highlighting',
        screen: 'sql-editor-open',
        duration: 1500
      },
      {
        title: 'Type Your Query',
        narration: 'Autocomplete suggests tables and columns',
        screen: 'query-typing',
        duration: 3000
      },
      {
        title: 'Execute Query',
        narration: 'Run against any connected database',
        screen: 'query-execute',
        duration: 2000
      },
      {
        title: 'Results in 0.3s',
        narration: '15,847 rows loaded with pagination',
        screen: 'query-results',
        duration: 2500
      },
      {
        title: 'Export Results',
        narration: 'Download as CSV, JSON, or Excel',
        screen: 'export-data',
        duration: 2000
      },
      {
        title: 'Multiple Tabs',
        narration: 'Work on multiple queries simultaneously',
        screen: 'multi-tabs',
        duration: 2000
      },
      {
        title: 'Save & Share',
        narration: 'Save queries and share with your team',
        screen: 'save-query',
        duration: 2000
      }
    ]
  }
];

export default function VideoDemo() {
  const { theme } = useTheme();
  const [activeDemo, setActiveDemo] = useState(0);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const demo = demos[activeDemo];
  const scene = demo.scenes[currentScene];
  const totalScenes = demo.scenes.length;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    
    if (isPlaying) {
      let elapsed = 0;
      progressInterval = setInterval(() => {
        elapsed += 50;
        setProgress((elapsed / scene.duration) * 100);
      }, 50);

      interval = setTimeout(() => {
        if (currentScene < totalScenes - 1) {
          setCurrentScene(prev => prev + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      }, scene.duration);
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(interval);
    };
  }, [isPlaying, currentScene, scene, totalScenes]);

  const handlePlay = () => {
    if (currentScene === totalScenes - 1) {
      setCurrentScene(0);
      setProgress(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);
  
  const handleRestart = () => {
    setCurrentScene(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const renderScreen = (screenType: string) => {
    const baseClasses = "w-full h-full transition-all duration-500";
    
    switch (screenType) {
      case 'empty-state':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl p-8">
            <Database className="w-20 h-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Data Sources Connected</h3>
            <p className="text-gray-500 text-center mb-6">Connect your first database to get started</p>
            <div className="w-48 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg animate-pulse">
              + Add Data Source
            </div>
          </div>
        );

      case 'connection-form':
        return (
          <div className="bg-white rounded-xl p-8 h-full overflow-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Add PostgreSQL Database</h3>
                <p className="text-gray-600">Enter your connection details</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {['Connection Name', 'Host', 'Port', 'Database', 'Username', 'Password'].map((label, i) => (
                <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <div className="h-12 border-2 border-blue-200 rounded-lg px-4 flex items-center bg-blue-50">
                    {i === 0 && <span className="text-gray-700">PostgreSQL Production</span>}
                    {i === 1 && <span className="text-gray-700">10.19.9.9</span>}
                    {i === 2 && <span className="text-gray-700">15445</span>}
                    {i === 3 && <span className="text-gray-700">oneapp</span>}
                    {i === 4 && <span className="text-gray-700">postgres</span>}
                    {i === 5 && <span className="text-gray-400">••••••••</span>}
                    {i <= 3 && <div className="w-1 h-5 bg-blue-600 ml-2 animate-pulse"></div>}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3 pt-4">
                <button className="flex-1 h-12 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
                  Test Connection
                </button>
                <button className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow-lg">
                  Connect
                </button>
              </div>
            </div>
          </div>
        );

      case 'connection-success':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-green-700 mb-3">Connection Successful!</h3>
            <p className="text-green-600 text-lg mb-4">Connected to PostgreSQL Production</p>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>148 tables discovered</span>
            </div>
          </div>
        );

      case 'schema-explorer':
        return (
          <div className="bg-white rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Database Schema</h3>
              <div className="px-4 py-2 bg-blue-100 rounded-lg">
                <span className="text-blue-700 font-semibold">148 Tables</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {['users', 'orders', 'products', 'customers', 'transactions', 'inventory'].map((table, i) => (
                <div key={i} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-gray-900">{table}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 rounded">12 columns</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">50K rows</span>
                    </div>
                  </div>
                  {i === 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs animate-fade-in">
                      {['id (PRIMARY KEY)', 'name (VARCHAR)', 'email (VARCHAR)', 'created_at (TIMESTAMP)'].map((col, j) => (
                        <div key={j} className="px-2 py-1 bg-blue-50 rounded text-blue-700">{col}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'data-browser':
        return (
          <div className="bg-white rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Browse Data: users</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-gray-100 rounded text-sm">← Previous</button>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold">Page 1 of 1000</span>
                <button className="px-3 py-1 bg-gray-100 rounded text-sm">Next →</button>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-lg border-2 border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <tr>
                    {['ID', 'Name', 'Email', 'Status', 'Created'].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-sm font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((row, i) => (
                    <tr key={i} className="border-b border-gray-200 hover:bg-blue-50 transition animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">{1000 + row}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">User {row}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">user{row}@example.com</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Active</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">2024-01-0{row}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing rows 1-50 of 50,000
            </div>
          </div>
        );

      case 'pipeline-running':
        return (
          <div className="bg-white rounded-xl p-8 h-full flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Pipeline Executing</h3>
            
            <div className="w-full max-w-2xl mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">PostgreSQL</span>
                  <span className="text-xs text-gray-500">sales_raw</span>
                </div>
                
                <div className="flex-1 mx-8 relative">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-100 px-3 py-1 rounded-full text-xs font-semibold text-purple-700 animate-bounce">
                    Transforming...
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">MySQL</span>
                  <span className="text-xs text-gray-500">sales_processed</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2 animate-pulse">30,547 / 50,000</div>
              <p className="text-gray-600">Rows processed</p>
            </div>
          </div>
        );

      case 'pipeline-complete':
        return (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-green-700 mb-4">Pipeline Complete!</h3>
            
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 text-center shadow-md">
                <div className="text-3xl font-bold text-green-600 mb-1">50,000</div>
                <div className="text-sm text-gray-600">Rows Processed</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-md">
                <div className="text-3xl font-bold text-blue-600 mb-1">2.3s</div>
                <div className="text-sm text-gray-600">Execution Time</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-md">
                <div className="text-3xl font-bold text-purple-600 mb-1">0</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>
            
            <p className="text-green-700 text-lg">Next run: Tomorrow at 2:00 AM</p>
          </div>
        );

      case 'completion':
        return (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-8 h-full flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">You're All Set!</h3>
            <p className="text-xl text-gray-700 text-center max-w-md mb-8">
              Your data source is connected and ready to power dashboards, queries, and pipelines
            </p>
            
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
                Create Dashboard
              </button>
              <button className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition">
                Run SQL Query
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl">
            <span className="text-gray-500">{screenType}</span>
          </div>
        );
    }
  };

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-gray-50 to-white px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full mb-6 shadow-lg">
            <Play className="w-4 h-4" />
            <span className="text-sm font-semibold">Product Demo Videos</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            See The Complete
            <span className={`block mt-2 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
              User Journey
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch how users accomplish real tasks from start to finish
          </p>
        </div>

        {/* Demo Selector */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {demos.map((d, index) => (
            <button
              key={d.id}
              onClick={() => {
                setActiveDemo(index);
                setCurrentScene(0);
                setProgress(0);
                setIsPlaying(false);
              }}
              className={`p-6 rounded-2xl transition-all text-left ${
                activeDemo === index
                  ? `bg-gradient-to-br ${d.color} text-white shadow-2xl scale-105`
                  : 'bg-white hover:shadow-lg border-2 border-gray-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                activeDemo === index ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {d.icon}
              </div>
              <h4 className={`font-bold text-lg mb-2 ${activeDemo === index ? 'text-white' : 'text-gray-900'}`}>
                {d.title}
              </h4>
              <p className={`text-sm ${activeDemo === index ? 'text-white/90' : 'text-gray-600'}`}>
                {d.story}
              </p>
            </button>
          ))}
        </div>

        {/* Video Player */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200">
          {/* Browser Chrome */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">
                🔒 https://app.datamantri.com/{demo.id}
              </div>
              <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${demo.color} text-white text-sm font-semibold`}>
                {demo.icon}
              </div>
            </div>
          </div>

          {/* Screen Display */}
          <div className="bg-gray-900 p-4">
            <div className="bg-gray-100 rounded-xl h-[500px] overflow-hidden">
              {renderScreen(scene.screen)}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-gray-50 p-6 border-t-2 border-gray-200">
            {/* Narration */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold bg-gradient-to-r ${demo.color} bg-clip-text text-transparent`}>
                  Scene {currentScene + 1} of {totalScenes}
                </span>
                <span className="text-sm text-gray-500">{scene.title}</span>
              </div>
              <p className="text-lg font-medium text-gray-900">{scene.narration}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${demo.color} transition-all`}
                  style={{ width: `${((currentScene / totalScenes) * 100) + (progress / totalScenes)}%` }}
                ></div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!isPlaying ? (
                  <button
                    onClick={handlePlay}
                    className={`px-6 py-3 bg-gradient-to-r ${demo.color} text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2`}
                  >
                    <Play className="w-5 h-5" />
                    {currentScene === 0 ? 'Play Demo' : 'Resume'}
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                )}
                
                <button
                  onClick={handleRestart}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart
                </button>
              </div>

              {currentScene === totalScenes - 1 && !isPlaying && (
                <button
                  onClick={() => window.open('http://localhost:8082', '_blank')}
                  className={`px-6 py-3 bg-gradient-to-r ${demo.color} text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition`}
                >
                  Try It Live →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

