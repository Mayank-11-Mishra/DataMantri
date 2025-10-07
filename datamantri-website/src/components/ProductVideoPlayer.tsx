import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Maximize2, X } from 'lucide-react';

interface VideoPlayerProps {
  videoId: 'ai-dashboard' | 'data-management-suite';
  onClose: () => void;
}

interface VideoScene {
  title: string;
  description: string;
  duration: number;
  productUrl: string;
}

const videoScenes = {
  'ai-dashboard': [
    {
      title: 'AI Dashboard Builder',
      description: 'Navigate to AI Dashboard Builder from the sidebar',
      duration: 3000,
      productUrl: 'http://localhost:8082/ai-dashboard'
    },
    {
      title: 'Select Your Data',
      description: 'Choose a data source and table with our beautiful card interface',
      duration: 5000,
      productUrl: 'http://localhost:8082/ai-dashboard'
    },
    {
      title: 'Type Your Prompt',
      description: 'Describe what you want to see in natural language',
      duration: 4000,
      productUrl: 'http://localhost:8082/ai-dashboard'
    },
    {
      title: 'AI Generates Dashboard',
      description: 'Watch as AI creates charts, KPIs, and tables automatically',
      duration: 5000,
      productUrl: 'http://localhost:8082/ai-dashboard'
    },
    {
      title: 'Interactive Dashboard',
      description: 'Filter data, view details, and explore your insights',
      duration: 4000,
      productUrl: 'http://localhost:8082/ai-dashboard'
    }
  ],
  'data-management-suite': [
    {
      title: 'Data Management Suite',
      description: 'Six powerful tools in one unified interface',
      duration: 3000,
      productUrl: 'http://localhost:8082/database-management'
    },
    {
      title: 'Data Sources',
      description: 'Connect to PostgreSQL, MySQL, MongoDB databases',
      duration: 5000,
      productUrl: 'http://localhost:8082/database-management'
    },
    {
      title: 'Schema Explorer',
      description: 'Browse tables, columns, and relationships',
      duration: 5000,
      productUrl: 'http://localhost:8082/database-management'
    },
    {
      title: 'Data Marts',
      description: 'Create unified views by joining multiple tables',
      duration: 4000,
      productUrl: 'http://localhost:8082/database-management'
    },
    {
      title: 'SQL Editor',
      description: 'Write queries with autocomplete and instant results',
      duration: 5000,
      productUrl: 'http://localhost:8082/database-management'
    }
  ]
};

export default function ProductVideoPlayer({ videoId, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentScene, setCurrentScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scenes = videoScenes[videoId];
  const totalScenes = scenes.length;
  const scene = scenes[currentScene];

  // Auto-advance scenes
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentScene < totalScenes - 1) {
            setCurrentScene(currentScene + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + (100 / (scene.duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentScene, scene.duration, totalScenes]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentScene(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSceneClick = (index: number) => {
    setCurrentScene(index);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black ${isFullscreen ? '' : 'p-4'} flex items-center justify-center`}>
      <div className={`bg-gray-900 rounded-xl overflow-hidden ${isFullscreen ? 'w-full h-full' : 'w-[95vw] h-[95vh]'} flex flex-col`}>
        {/* Header - Compact */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                {videoId === 'ai-dashboard' ? 'AI Dashboard Builder' : 'Data Management Suite'}
              </h3>
            </div>
            <div className="text-xs text-gray-400">
              Scene {currentScene + 1}/{totalScenes}: {scene.title}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Area - Live Product in iframe */}
        <div className="flex-1 relative bg-black">
          <iframe
            src={scene.productUrl}
            className="w-full h-full border-0"
            title={scene.title}
            allow="fullscreen"
          />
          
          {/* Login Helper - Top Right */}
          {currentScene === 0 && (
            <div className="absolute top-6 right-6 max-w-md bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-2xl p-6 border-2 border-blue-400 animate-slide-in">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔑</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Quick Demo Login</h4>
                  <p className="text-blue-100 text-sm">Use these credentials to explore:</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 font-mono text-sm">
                <div className="text-blue-100 mb-2">
                  <span className="text-white font-semibold">Email:</span> demo@datamantri.com
                </div>
                <div className="text-blue-100">
                  <span className="text-white font-semibold">Password:</span> demo123
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-200">
                <span>💡</span>
                <span>Login in the iframe above to start the demo tour!</span>
              </div>
            </div>
          )}
          
          {/* Overlay with scene info - Compact */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
            <div className="mb-3">
              <div className="text-white text-base font-semibold mb-1">{scene.title}</div>
              <div className="text-gray-300 text-xs">{scene.description}</div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Controls - Compact */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={handleRestart}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
                <div className="text-white text-xs font-medium">
                  {Math.floor((currentScene / totalScenes) * 100)}% Complete
                </div>
              </div>

              <button
                onClick={() => window.open(scene.productUrl, '_blank')}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm"
              >
                Try It Live →
              </button>
            </div>
          </div>
        </div>

        {/* Scene Timeline - Compact */}
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
          <div className="flex items-center gap-2 overflow-x-auto">
            {scenes.map((s, index) => (
              <button
                key={index}
                onClick={() => handleSceneClick(index)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  index === currentScene
                    ? 'bg-blue-600 text-white'
                    : index < currentScene
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {index + 1}. {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner - Compact */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-center">
          <p className="text-white text-xs">
            ✨ <strong>Live Demo:</strong> This is the actual DataMantri product. Login with demo@datamantri.com / demo123 to explore!
          </p>
        </div>
      </div>
    </div>
  );
}

