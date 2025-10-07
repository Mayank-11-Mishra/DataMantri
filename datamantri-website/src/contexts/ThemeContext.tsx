import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
}

export const themes: Record<string, Theme> = {
  oceanBlue: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#ec4899',
    gradient: 'from-blue-600 via-purple-600 to-pink-600'
  },
  royalPurple: {
    primary: '#7c3aed',
    secondary: '#a855f7',
    accent: '#ec4899',
    gradient: 'from-purple-600 via-pink-600 to-rose-600'
  },
  forestGreen: {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#14b8a6',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600'
  },
  sunsetOrange: {
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#fb923c',
    gradient: 'from-orange-600 via-amber-600 to-yellow-600'
  }
};

interface ThemeContextType {
  currentTheme: string;
  theme: Theme;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('oceanBlue');

  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, theme: themes[currentTheme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

