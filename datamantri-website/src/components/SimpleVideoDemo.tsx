import { useState } from 'react';
import { Play, Sparkles, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ProductVideoPlayer from './ProductVideoPlayer';

interface DemoVideo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: JSX.Element;
  color: string;
  features: string[];
  videoUrl?: string; // For future real video integration
  duration: string;
}

const demoVideos: DemoVideo[] = [
  {
    id: 'ai-dashboard',
    title: 'AI Dashboard Builder',
    subtitle: 'Create stunning dashboards with natural language',
    description: 'Simply describe what you want to see, and our AI generates a complete, interactive dashboard in seconds. No coding required.',
    icon: <Sparkles className="w-12 h-12" />,
    color: 'from-blue-500 via-indigo-600 to-purple-600',
    duration: '2-3 minutes',
    features: [
      'Select data source or data mart with beautiful card interface',
      'Auto-collapsing panels save screen space',
      'Type natural language prompts ("Show sales by region")',
      'AI generates dashboard with KPIs, charts, and tables',
      'Smart number formatting (Lakhs, Crores)',
      'Real-time filtering by region, brand, or date',
      'Chat with AI to enhance your dashboard',
      'Edit SQL queries for individual charts',
      'Save and share dashboards with one click'
    ]
  },
  {
    id: 'data-management-suite',
    title: 'Data Management Suite',
    subtitle: 'Complete control over your data ecosystem',
    description: 'Six powerful tools in one unified interface. Connect sources, create data marts, build pipelines, run queries, monitor performance, and visualize relationships.',
    icon: <Database className="w-12 h-12" />,
    color: 'from-green-500 via-emerald-600 to-teal-600',
    duration: '3-4 minutes',
    features: [
      'Connect PostgreSQL, MySQL, MongoDB databases',
      'Browse schema: 148 tables with columns and types',
      'Explore live data with search and pagination',
      'View indexes and foreign key relationships',
      'Create Data Marts (union/join multiple tables)',
      'Build Airflow-style ETL pipelines visually',
      'SQL editor with autocomplete for queries',
      'Monitor performance: CPU, memory, connections',
      'Identify slow queries and optimize',
      'Visualize ER diagrams with relationships'
    ]
  }
];

export default function SimpleVideoDemo() {
  const { theme } = useTheme();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = (videoId: string) => {
    setSelectedVideo(videoId);
    setIsPlaying(true);
    // In production, this would trigger actual video playback
  };

  const selectedVideoData = demoVideos.find(v => v.id === selectedVideo);

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-gray-50 to-white px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float delay-1000"></div>

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            <Play className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Product Demonstrations</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See DataMantri in
            <span className={`block mt-2 bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
              Action
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how DataMantri transforms data management and analytics. From AI-powered dashboards to comprehensive data pipelines.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {demoVideos.map((video) => (
            <div
              key={video.id}
              className="group bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              {/* Video Thumbnail / Placeholder */}
              <div className={`relative h-64 bg-gradient-to-br ${video.color} flex items-center justify-center overflow-hidden`}>
                {/* Animated background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-500"></div>
                </div>

                {/* Icon */}
                <div className="relative z-10 text-white transform group-hover:scale-110 transition-transform duration-300">
                  {video.icon}
                </div>

                {/* Play Button Overlay */}
                <button
                  onClick={() => handlePlayVideo(video.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform hover:scale-110 transition-transform shadow-2xl">
                    <Play className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </button>

                {/* Duration Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                  {video.duration}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {video.title}
                </h3>
                <p className="text-lg font-semibold text-gray-600 mb-3">
                  {video.subtitle}
                </p>
                <p className="text-gray-600 mb-6">
                  {video.description}
                </p>

                {/* Features List */}
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-700 mb-3">What you'll see:</p>
                  <ul className="space-y-2">
                    {video.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {video.features.length > 4 && (
                    <p className="text-xs text-gray-500 mt-2 ml-6">
                      + {video.features.length - 4} more features...
                    </p>
                  )}
                </div>

                {/* Watch Button */}
                <button
                  onClick={() => handlePlayVideo(video.id)}
                  className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${video.color} hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group`}
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Video Player */}
        {selectedVideo && (
          <ProductVideoPlayer
            videoId={selectedVideo as 'ai-dashboard' | 'data-management-suite'}
            onClose={() => {
              setSelectedVideo(null);
              setIsPlaying(false);
            }}
          />
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">
            Want to see more? Try our interactive product demo
          </p>
          <button
            onClick={() => window.location.href = 'http://localhost:8082'}
            className={`px-8 py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-bold hover:shadow-2xl transition text-lg inline-flex items-center gap-2`}
          >
            Launch Live Demo
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}

