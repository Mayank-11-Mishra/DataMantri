import { useTheme, themes } from '../contexts/ThemeContext';
import { Palette } from 'lucide-react';

export default function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme();

  const themeColors = {
    oceanBlue: '#2563eb',
    royalPurple: '#7c3aed',
    forestGreen: '#059669',
    sunsetOrange: '#ea580c'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <Palette className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Choose Theme</span>
        </div>
        <div className="flex gap-3">
          {Object.entries(themeColors).map(([name, color]) => (
            <button
              key={name}
              onClick={() => setTheme(name)}
              className={`w-10 h-10 rounded-full transition-all transform hover:scale-110 ${
                currentTheme === name ? 'ring-4 ring-offset-2 ring-gray-400' : 'hover:ring-2 ring-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={name.replace(/([A-Z])/g, ' $1').trim()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

