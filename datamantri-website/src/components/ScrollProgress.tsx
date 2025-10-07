import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div
        className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-100`}
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}

