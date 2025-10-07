import { useTheme } from '../contexts/ThemeContext';
import { Database, Zap } from 'lucide-react';

export default function Logo() {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      {/* Modern Logo Icon */}
      <div 
        className={`w-11 h-11 bg-gradient-to-br rounded-xl flex items-center justify-center transition-all shadow-md group-hover:shadow-lg group-hover:scale-105 relative overflow-hidden`}
        style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
        }}
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        
        {/* Icon combination */}
        <div className="relative z-10 flex items-center justify-center">
          <Database className="w-5 h-5 text-white absolute" />
          <Zap className="w-3 h-3 text-white absolute translate-x-1 translate-y-1" />
        </div>
      </div>
      
      {/* Brand name */}
      <div>
        <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Data<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Mantri</span>
        </span>
        <div className="text-[10px] text-gray-500 -mt-1 tracking-wide font-medium">
          DATA INTELLIGENCE PLATFORM
        </div>
      </div>
    </div>
  );
}

