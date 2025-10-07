import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Database, Code, GitBranch, Boxes } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface VideoFrame {
  title: string;
  narration: string;
  duration: number;
  screen: string;
  action?: 'cursor-move' | 'click' | 'typing' | 'scroll' | 'hover' | 'zoom';
  highlight?: { x: number; y: number; width: number; height: number };
}

const productVideos = [
  {
    id: 'data-sources-full',
    title: 'Data Sources',
    subtitle: 'From zero to exploring 148 tables in 60 seconds',
    icon: <Database className="w-8 h-8" />,
    color: 'from-blue-500 to-indigo-600',
    duration: '60 seconds',
    frames: [
      {
        title: 'Dashboard View',
        narration: 'Starting from the main dashboard...',
        duration: 2000,
        screen: 'dashboard-home'
      },
      {
        title: 'Click Data Management',
        narration: 'Navigate to Data Management in the sidebar',
        duration: 2000,
        screen: 'dashboard-home',
        action: 'cursor-move' as const,
        highlight: { x: 5, y: 40, width: 15, height: 6 }
      },
      {
        title: 'Data Management Suite',
        narration: 'Opening the Data Management Suite...',
        duration: 2500,
        screen: 'data-management-tabs'
      },
      {
        title: 'Click Data Sources Tab',
        narration: 'Select the Data Sources tab',
        duration: 2000,
        screen: 'data-management-tabs',
        action: 'click' as const,
        highlight: { x: 15, y: 25, width: 20, height: 15 }
      },
      {
        title: 'Data Sources Page',
        narration: 'See the Data Sources interface with stats and existing connections',
        duration: 3000,
        screen: 'data-sources-list'
      },
      {
        title: 'Click Add Data Source',
        narration: 'Click the "Add Data Source" button in the top right',
        duration: 2000,
        screen: 'data-sources-list',
        action: 'click' as const,
        highlight: { x: 70, y: 20, width: 25, height: 8 }
      },
      {
        title: 'Connection Form Opens',
        narration: 'A modal appears with database connection options',
        duration: 2500,
        screen: 'connection-modal-open'
      },
      {
        title: 'Select Database Type',
        narration: 'Choose PostgreSQL from the database type dropdown',
        duration: 2500,
        screen: 'database-type-select',
        action: 'click' as const
      },
      {
        title: 'Fill Connection Details',
        narration: 'Enter host (10.19.9.9), port (15445), database name, and credentials',
        duration: 4000,
        screen: 'connection-form-filled',
        action: 'typing' as const
      },
      {
        title: 'Test Connection',
        narration: 'Click "Test Connection" to verify the connection works',
        duration: 2000,
        screen: 'connection-form-filled',
        action: 'click' as const,
        highlight: { x: 30, y: 75, width: 20, height: 8 }
      },
      {
        title: 'Connection Success!',
        narration: 'Green checkmark appears - connection successful!',
        duration: 2500,
        screen: 'connection-success'
      },
      {
        title: 'Save Data Source',
        narration: 'Click "Save" to add this data source',
        duration: 2000,
        screen: 'connection-success',
        action: 'click' as const,
        highlight: { x: 55, y: 75, width: 20, height: 8 }
      },
      {
        title: 'Back to Data Sources List',
        narration: 'The new PostgreSQL data source appears in the list with a green "Active" status',
        duration: 3000,
        screen: 'data-sources-with-new'
      },
      {
        title: 'Click Manage',
        narration: 'Click "Manage" on the PostgreSQL Production data source to explore it',
        duration: 2000,
        screen: 'data-sources-with-new',
        action: 'click' as const,
        highlight: { x: 70, y: 55, width: 15, height: 6 }
      },
      {
        title: 'Loading Schema',
        narration: 'Loading database schema... discovering tables and structure',
        duration: 2500,
        screen: 'schema-loading'
      },
      {
        title: 'Schema Explorer',
        narration: '148 tables loaded! Browse tables with search, see columns, types, and keys',
        duration: 4000,
        screen: 'schema-explorer-full',
        action: 'scroll' as const
      },
      {
        title: 'Click on Users Table',
        narration: 'Click to expand the "users" table to see its columns',
        duration: 2500,
        screen: 'schema-explorer-full',
        action: 'click' as const,
        highlight: { x: 20, y: 35, width: 60, height: 8 }
      },
      {
        title: 'Table Details',
        narration: 'See all columns: id (PRIMARY KEY), name (VARCHAR), email (VARCHAR), timestamps',
        duration: 3000,
        screen: 'table-expanded'
      },
      {
        title: 'Switch to Data Browser',
        narration: 'Click the "Data Browser" tab to see actual data',
        duration: 2000,
        screen: 'table-expanded',
        action: 'click' as const,
        highlight: { x: 35, y: 22, width: 15, height: 5 }
      },
      {
        title: 'Browse Live Data',
        narration: 'View real data with pagination - 50,000 rows total, showing first 50',
        duration: 4000,
        screen: 'data-browser-table',
        action: 'scroll' as const
      },
      {
        title: 'Switch to Indexes & Relations',
        narration: 'Click the "Indexes & Relations" tab',
        duration: 2000,
        screen: 'data-browser-table',
        action: 'click' as const,
        highlight: { x: 52, y: 22, width: 20, height: 5 }
      },
      {
        title: 'View Relationships',
        narration: 'See all indexes and foreign key relationships between tables',
        duration: 3500,
        screen: 'indexes-relations',
        action: 'scroll' as const
      },
      {
        title: 'Complete!',
        narration: 'Data source connected! Now ready to query, build dashboards, and create pipelines',
        duration: 3000,
        screen: 'completion-state'
      }
    ]
  },
  {
    id: 'pipelines-full',
    title: 'Data Pipelines',
    subtitle: 'Build Airflow-style ETL pipelines visually',
    icon: <GitBranch className="w-8 h-8" />,
    color: 'from-purple-500 to-violet-600',
    duration: '55 seconds',
    frames: [
      {
        title: 'Pipelines Tab',
        narration: 'Navigate to the Pipelines tab in Data Management',
        duration: 2500,
        screen: 'pipelines-empty'
      },
      {
        title: 'Click Create Pipeline',
        narration: 'Click the "Create Pipeline" button',
        duration: 2000,
        screen: 'pipelines-empty',
        action: 'click' as const,
        highlight: { x: 70, y: 18, width: 25, height: 8 }
      },
      {
        title: 'Pipeline Form Opens',
        narration: 'A comprehensive form appears to configure your pipeline',
        duration: 2500,
        screen: 'pipeline-form-open'
      },
      {
        title: 'Enter Pipeline Name',
        narration: 'Type: "Sales Data ETL"',
        duration: 2000,
        screen: 'pipeline-name-typed',
        action: 'typing' as const
      },
      {
        title: 'Select Source Database',
        narration: 'Choose PostgreSQL Production from the source dropdown',
        duration: 2500,
        screen: 'pipeline-source-select',
        action: 'click' as const
      },
      {
        title: 'Select Source Table',
        narration: 'Choose "sales_raw" table as the data source',
        duration: 2500,
        screen: 'pipeline-source-table',
        action: 'click' as const
      },
      {
        title: 'Select Destination Database',
        narration: 'Choose MySQL Analytics as the destination',
        duration: 2500,
        screen: 'pipeline-dest-select',
        action: 'click' as const
      },
      {
        title: 'Select Destination Table',
        narration: 'Choose "sales_processed" table as the destination',
        duration: 2500,
        screen: 'pipeline-dest-table',
        action: 'click' as const
      },
      {
        title: 'Add SQL Transformation',
        narration: 'Write SQL to transform data: SELECT *, UPPER(customer_name) FROM {{source_table}} WHERE status = active',
        duration: 4000,
        screen: 'pipeline-transformation',
        action: 'typing' as const
      },
      {
        title: 'Set Schedule',
        narration: 'Configure schedule: Daily at 2:00 AM',
        duration: 2500,
        screen: 'pipeline-schedule',
        action: 'click' as const
      },
      {
        title: 'Click Create',
        narration: 'Click "Create Pipeline" to save',
        duration: 2000,
        screen: 'pipeline-schedule',
        action: 'click' as const,
        highlight: { x: 60, y: 85, width: 30, height: 8 }
      },
      {
        title: 'Pipeline Created!',
        narration: 'Pipeline appears in the list with visual flow diagram',
        duration: 3500,
        screen: 'pipeline-created'
      },
      {
        title: 'Click Run Now',
        narration: 'Trigger the pipeline manually by clicking "Run Now"',
        duration: 2000,
        screen: 'pipeline-created',
        action: 'click' as const,
        highlight: { x: 70, y: 50, width: 15, height: 6 }
      },
      {
        title: 'Pipeline Running',
        narration: 'Watch live progress: Source → Transform → Destination',
        duration: 4000,
        screen: 'pipeline-running',
        action: 'hover' as const
      },
      {
        title: 'Pipeline Complete!',
        narration: 'Success! 50,000 rows processed in 2.3 seconds with 0 errors',
        duration: 3500,
        screen: 'pipeline-success'
      },
      {
        title: 'View Run History',
        narration: 'See complete execution history with timestamps and results',
        duration: 3000,
        screen: 'pipeline-history'
      }
    ]
  },
  {
    id: 'sql-editor-full',
    title: 'SQL Editor',
    subtitle: 'Multi-tab editor with autocomplete and export',
    icon: <Code className="w-8 h-8" />,
    color: 'from-orange-500 to-amber-600',
    duration: '45 seconds',
    frames: [
      {
        title: 'SQL Editor Tab',
        narration: 'Open the SQL Editor from Data Management',
        duration: 2500,
        screen: 'sql-editor-open'
      },
      {
        title: 'Select Database',
        narration: 'Choose PostgreSQL Production from the database dropdown',
        duration: 2500,
        screen: 'sql-db-select',
        action: 'click' as const
      },
      {
        title: 'Start Typing Query',
        narration: 'Type: SELECT * FROM users WHERE created_at >',
        duration: 3500,
        screen: 'sql-typing-1',
        action: 'typing' as const
      },
      {
        title: 'Autocomplete Appears',
        narration: 'Monaco editor suggests table names and columns',
        duration: 2500,
        screen: 'sql-autocomplete'
      },
      {
        title: 'Complete Query',
        narration: 'Finish typing: WHERE created_at > 2024-01-01 LIMIT 100',
        duration: 3000,
        screen: 'sql-query-complete',
        action: 'typing' as const
      },
      {
        title: 'Click Execute',
        narration: 'Click the green "Execute" button to run the query',
        duration: 2000,
        screen: 'sql-query-complete',
        action: 'click' as const,
        highlight: { x: 75, y: 50, width: 20, height: 7 }
      },
      {
        title: 'Query Executing',
        narration: 'Query running... connecting to database',
        duration: 1500,
        screen: 'sql-executing'
      },
      {
        title: 'Results Loaded!',
        narration: 'Results: 15,847 rows in 0.3 seconds',
        duration: 4000,
        screen: 'sql-results-table',
        action: 'scroll' as const
      },
      {
        title: 'Export Results',
        narration: 'Click "Export" to download as CSV, JSON, or Excel',
        duration: 2500,
        screen: 'sql-results-table',
        action: 'click' as const,
        highlight: { x: 80, y: 45, width: 15, height: 6 }
      },
      {
        title: 'Export Menu',
        narration: 'Choose export format: CSV selected',
        duration: 2500,
        screen: 'sql-export-menu'
      },
      {
        title: 'New Tab',
        narration: 'Click "+ New Tab" to work on multiple queries simultaneously',
        duration: 2500,
        screen: 'sql-export-menu',
        action: 'click' as const,
        highlight: { x: 12, y: 35, width: 12, height: 5 }
      },
      {
        title: 'Multiple Tabs Active',
        narration: 'Tab 1 and Tab 2 active - work on different queries in parallel',
        duration: 3000,
        screen: 'sql-multi-tabs'
      },
      {
        title: 'Save Query',
        narration: 'Click "Save Query" to add to your saved queries library',
        duration: 2500,
        screen: 'sql-multi-tabs',
        action: 'click' as const,
        highlight: { x: 83, y: 36, width: 12, height: 5 }
      },
      {
        title: 'Query Saved!',
        narration: 'Query added to sidebar - reuse anytime',
        duration: 2500,
        screen: 'sql-query-saved'
      }
    ]
  },
  {
    id: 'data-marts-full',
    title: 'Data Marts',
    subtitle: 'Join data from multiple sources visually',
    icon: <Boxes className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-600',
    duration: '50 seconds',
    frames: [
      {
        title: 'Data Marts Tab',
        narration: 'Navigate to Data Marts in Data Management',
        duration: 2500,
        screen: 'datamarts-list'
      },
      {
        title: 'Click Create Data Mart',
        narration: 'Click the "Create Data Mart" button',
        duration: 2000,
        screen: 'datamarts-list',
        action: 'click' as const,
        highlight: { x: 70, y: 18, width: 25, height: 8 }
      },
      {
        title: 'Choose Creation Mode',
        narration: 'Two options: UI Builder (visual) or Query Editor (SQL)',
        duration: 3000,
        screen: 'datamart-mode-select'
      },
      {
        title: 'Select UI Builder',
        narration: 'Click "UI Builder" for the visual interface',
        duration: 2500,
        screen: 'datamart-mode-select',
        action: 'click' as const,
        highlight: { x: 25, y: 40, width: 35, height: 40 }
      },
      {
        title: 'UI Builder Opens',
        narration: 'Beautiful visual interface for building data marts',
        duration: 2500,
        screen: 'datamart-builder-open'
      },
      {
        title: 'Enter Mart Name',
        narration: 'Type: "Sales Dashboard Data"',
        duration: 2500,
        screen: 'datamart-name-typed',
        action: 'typing' as const
      },
      {
        title: 'Select Data Source',
        narration: 'Choose PostgreSQL Production',
        duration: 2500,
        screen: 'datamart-source-select',
        action: 'click' as const
      },
      {
        title: 'Select Tables',
        narration: 'Choose multiple tables: orders, customers, products',
        duration: 4000,
        screen: 'datamart-tables-select',
        action: 'click' as const
      },
      {
        title: 'Visual Join Builder',
        narration: 'Drag and drop to create joins between tables',
        duration: 3500,
        screen: 'datamart-joins-visual'
      },
      {
        title: 'Configure Join',
        narration: 'Set join type (INNER) and join columns',
        duration: 3000,
        screen: 'datamart-join-config'
      },
      {
        title: 'Preview Data',
        narration: 'Click "Preview" to see the joined data',
        duration: 2500,
        screen: 'datamart-join-config',
        action: 'click' as const,
        highlight: { x: 70, y: 85, width: 25, height: 7 }
      },
      {
        title: 'Data Preview',
        narration: 'See combined data from all sources in real-time',
        duration: 3500,
        screen: 'datamart-preview',
        action: 'scroll' as const
      },
      {
        title: 'Save Data Mart',
        narration: 'Click "Create Data Mart" to save',
        duration: 2000,
        screen: 'datamart-preview',
        action: 'click' as const,
        highlight: { x: 75, y: 90, width: 20, height: 6 }
      },
      {
        title: 'Data Mart Created!',
        narration: 'Appears in the list - ready to use in dashboards and reports',
        duration: 3000,
        screen: 'datamart-created-list'
      }
    ]
  }
];

export default function ProductVideo() {
  const { theme } = useTheme();
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });

  const video = productVideos[selectedVideo];
  const frame = video.frames[currentFrame];
  const totalFrames = video.frames.length;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    
    if (isPlaying) {
      let elapsed = 0;
      progressInterval = setInterval(() => {
        elapsed += 50;
        setProgress((elapsed / frame.duration) * 100);
      }, 50);

      // Animate cursor if action specified
      if (frame.action === 'cursor-move' && frame.highlight) {
        setShowCursor(true);
        const targetX = frame.highlight.x + frame.highlight.width / 2;
        const targetY = frame.highlight.y + frame.highlight.height / 2;
        animateCursor(targetX, targetY, frame.duration);
      } else if (frame.action === 'click') {
        setShowCursor(true);
      }

      interval = setTimeout(() => {
        if (currentFrame < totalFrames - 1) {
          setCurrentFrame(prev => prev + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
          setProgress(100);
          setShowCursor(false);
        }
      }, frame.duration);
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(interval);
    };
  }, [isPlaying, currentFrame, frame, totalFrames]);

  const animateCursor = (targetX: number, targetY: number, duration: number) => {
    const startX = cursorPos.x;
    const startY = cursorPos.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setCursorPos({
        x: startX + (targetX - startX) * eased,
        y: startY + (targetY - startY) * eased
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const handlePlay = () => {
    if (currentFrame === totalFrames - 1) {
      setCurrentFrame(0);
      setProgress(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowCursor(false);
  };

  const handleRestart = () => {
    setCurrentFrame(0);
    setProgress(0);
    setCursorPos({ x: 50, y: 50 });
    setIsPlaying(true);
  };

  const renderProductScreen = (screenType: string) => {
    const baseClasses = "relative w-full h-full";
    
    // Return rich visual mockups based on screen type
    const screenContent = (() => {
      switch (screenType) {
        case 'dashboard-home':
          return (
            <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 w-full h-full p-8">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Welcome to DataMantri</h1>
                <div className="grid grid-cols-4 gap-6 mb-8">
                  {['Data Sources', 'Pipelines', 'Dashboards', 'Queries'].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{12 + i * 3}</div>
                      <div className="text-sm text-gray-600">{item}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg h-64">
                  <div className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full"></div>
                        <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'data-management-tabs':
        case 'data-sources-list':
          return (
            <div className="bg-gradient-to-br from-gray-50 to-white w-full h-full p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2">
                  Data Management Suite
                </h1>
                <div className="flex gap-4 mt-4">
                  {['Data Sources', 'Data Marts', 'Pipelines', 'SQL', 'Performance'].map((tab, i) => (
                    <div key={i} className={`px-6 py-3 rounded-xl ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {tab}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Data Sources</h2>
                <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold">
                  + Add Data Source
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {['Total: 3', 'Active: 3', 'Types: 2', 'Connected: 3'].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-md">
                    <div className="text-sm text-gray-600">{stat.split(':')[0]}</div>
                    <div className="text-2xl font-bold text-blue-600">{stat.split(':')[1]}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['PostgreSQL Production', 'MySQL Analytics'].map((db, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                        🐘
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{db}</div>
                        <div className="text-sm text-green-600 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Active
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-center font-semibold">
                        Manage
                      </div>
                      <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Edit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'connection-modal-open':
        case 'database-type-select':
        case 'connection-form-filled':
          return (
            <div className="bg-gray-900/50 w-full h-full flex items-center justify-center p-8">
              <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Data Source</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Database Type</label>
                    <div className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg bg-blue-50">
                      PostgreSQL
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Connection Name</label>
                    <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg">
                      PostgreSQL Production
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Host</label>
                      <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg">
                        10.19.9.9
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Port</label>
                      <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg">
                        15445
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button className="flex-1 px-6 py-3 border-2 border-blue-500 text-blue-600 rounded-xl font-semibold">
                      Test Connection
                    </button>
                    <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'connection-success':
          return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-4xl font-bold text-green-700 mb-3">Connection Successful!</h3>
                <p className="text-xl text-green-600">PostgreSQL Production is now connected</p>
              </div>
            </div>
          );

        case 'schema-loading':
          return (
            <div className="bg-white w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Schema...</h3>
                <p className="text-gray-600">Discovering tables and columns</p>
              </div>
            </div>
          );

        case 'schema-explorer-full':
        case 'table-expanded':
          return (
            <div className="bg-gray-50 w-full h-full p-8 overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Schema Explorer</h2>
                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                  148 Tables
                </div>
              </div>
              <div className="space-y-3">
                {['users', 'orders', 'products', 'customers', 'transactions'].map((table, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-gray-900">{table}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">12 columns</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">50K rows</span>
                      </div>
                    </div>
                    {i === 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {['id (INT)', 'name (VARCHAR)', 'email (VARCHAR)', 'created_at (TIMESTAMP)'].map((col, j) => (
                          <div key={j} className="px-3 py-2 bg-blue-50 text-blue-700 rounded text-sm">
                            {col}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );

        case 'data-browser-table':
          return (
            <div className="bg-white w-full h-full p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Browser: users</h2>
              <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <tr>
                      {['ID', 'Name', 'Email', 'Status', 'Created'].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-sm font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((row) => (
                      <tr key={row} className="border-b border-gray-200">
                        <td className="px-4 py-3 font-mono text-sm">{1000 + row}</td>
                        <td className="px-4 py-3 text-sm">User {row}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">user{row}@example.com</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">2024-01-0{row}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center text-sm text-gray-600">
                Showing 1-50 of 50,000 rows
              </div>
            </div>
          );

        case 'indexes-relations':
          return (
            <div className="bg-gray-50 w-full h-full p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Indexes & Relations</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Indexes</h3>
                  <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">idx_users_email</div>
                        <div className="text-sm text-gray-600">Column: email</div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        UNIQUE
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Foreign Keys</h3>
                  <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                    <div className="font-bold text-gray-900 mb-2">fk_orders_user_id</div>
                    <div className="text-sm text-gray-600">
                      orders.user_id → users.id
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'completion-state':
          return (
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-4">You're All Set!</h3>
                <p className="text-xl text-gray-700 mb-8">Data source connected and ready to use</p>
                <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg text-lg">
                  Create Your First Dashboard →
                </button>
              </div>
            </div>
          );

        default:
          return (
            <div className="bg-white w-full h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-800">{frame.title}</h3>
              </div>
            </div>
          );
      }
    })();

    return (
      <div className={baseClasses}>
        {screenContent}
        
        {/* Highlight overlay */}
        {frame.highlight && (
          <div 
            className="absolute border-4 border-blue-500 rounded-lg animate-pulse bg-blue-500/10 z-10"
            style={{
              left: `${frame.highlight.x}%`,
              top: `${frame.highlight.y}%`,
              width: `${frame.highlight.width}%`,
              height: `${frame.highlight.height}%`,
              transition: 'all 0.5s ease'
            }}
          />
        )}

        {/* Animated cursor */}
        {showCursor && (
          <div 
            className="absolute w-6 h-6 pointer-events-none transition-all duration-300 z-20"
            style={{
              left: `${cursorPos.x}%`,
              top: `${cursorPos.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-lg">
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="white"
                stroke="black"
                strokeWidth="1"
              />
            </svg>
            {frame.action === 'click' && (
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping"></div>
            )}
          </div>
        )}

        {/* Typing indicator */}
        {frame.action === 'typing' && (
          <div className="absolute bottom-10 left-10 flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg z-20">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Typing...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full mb-6 shadow-2xl">
            <Play className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wide">PRODUCT DEMO VIDEOS</span>
          </div>
          <h2 className="text-6xl font-bold text-white mb-6">
            Watch Real Product
            <span className={`block mt-2 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
              Walkthroughs
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See actual product screens with smooth animations and interactive elements
          </p>
        </div>

        {/* Video Selector */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {productVideos.map((v, index) => (
            <button
              key={v.id}
              onClick={() => {
                setSelectedVideo(index);
                setCurrentFrame(0);
                setProgress(0);
                setIsPlaying(false);
                setShowCursor(false);
              }}
              className={`group p-6 rounded-2xl transition-all duration-300 text-left ${
                selectedVideo === index
                  ? `bg-gradient-to-br ${v.color} text-white shadow-2xl scale-105`
                  : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all ${
                selectedVideo === index ? 'bg-white/20' : 'bg-gray-700 group-hover:bg-gray-600'
              }`}>
                <div className={selectedVideo === index ? 'text-white' : 'text-gray-400'}>
                  {v.icon}
                </div>
              </div>
              <h4 className={`font-bold text-lg mb-2 ${selectedVideo === index ? 'text-white' : 'text-gray-200'}`}>
                {v.title}
              </h4>
              <p className={`text-sm mb-3 ${selectedVideo === index ? 'text-white/90' : 'text-gray-400'}`}>
                {v.subtitle}
              </p>
              <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
                selectedVideo === index ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-300'
              }`}>
                <Play className="w-3 h-3" />
                {v.duration}
              </div>
            </button>
          ))}
        </div>

        {/* Video Player */}
        <div className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-700">
          {/* Browser Chrome - Simple */}
          <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className={`text-sm font-semibold bg-gradient-to-r ${video.color} bg-clip-text text-transparent`}>
                DataMantri - {video.title}
              </div>
              <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                <Maximize2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Video Screen */}
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            {renderProductScreen(frame.screen)}
          </div>

          {/* Video Controls */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 border-t border-gray-700">
            {/* Narration */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${video.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                    {currentFrame + 1}
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">
                      Scene {currentFrame + 1} of {totalFrames}
                    </div>
                    <div className="text-white font-semibold text-lg">{frame.title}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  {(frame.duration / 1000).toFixed(1)}s
                </div>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed">
                {frame.narration}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full flex">
                  {/* Completed frames */}
                  <div 
                    className={`bg-gradient-to-r ${video.color} transition-all`}
                    style={{ width: `${(currentFrame / totalFrames) * 100}%` }}
                  />
                  {/* Current frame progress */}
                  <div 
                    className={`bg-gradient-to-r ${video.color} opacity-60 transition-all`}
                    style={{ width: `${(progress / totalFrames)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Start</span>
                <span>{currentFrame + 1} / {totalFrames} scenes</span>
                <span>End</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {!isPlaying ? (
                  <button
                    onClick={handlePlay}
                    className={`px-8 py-4 bg-gradient-to-r ${video.color} text-white rounded-xl font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 flex items-center gap-3 text-lg`}
                  >
                    <Play className="w-6 h-6" />
                    {currentFrame === 0 ? 'Play Video' : 'Resume'}
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold shadow-xl transition-all flex items-center gap-3 text-lg"
                  >
                    <Pause className="w-6 h-6" />
                    Pause
                  </button>
                )}
                
                <button
                  onClick={handleRestart}
                  className="px-6 py-4 border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart
                </button>
              </div>

              {currentFrame === totalFrames - 1 && !isPlaying && (
                <button
                  onClick={() => window.open('http://localhost:8082', '_blank')}
                  className={`px-8 py-4 bg-gradient-to-r ${video.color} text-white rounded-xl font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105`}
                >
                  Try Live Product →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: '🎬', title: 'Real Product Screens', desc: 'Actual UI from the live product' },
            { icon: '✨', title: 'Interactive Animations', desc: 'Cursor movements, clicks, typing' },
            { icon: '📖', title: 'Step-by-Step Journey', desc: 'Complete workflow from start to finish' }
          ].map((feature, i) => (
            <div key={i} className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h4 className="text-white font-bold text-lg mb-2">{feature.title}</h4>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

