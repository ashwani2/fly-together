import React, { createContext, useContext, useEffect, useState } from 'react';
import { cn } from './utils';

type ColorTheme = {
  name: string;
  color: string;
  oklch: string;
};

export const themes: ColorTheme[] = [
  { name: 'Violet', color: '#6366f1', oklch: '0.6 0.15 264' },
  { name: 'Blue', color: '#3b82f6', oklch: '0.6 0.15 250' },
  { name: 'Rose', color: '#f43f5e', oklch: '0.6 0.15 0' },
  { name: 'Green', color: '#22c55e', oklch: '0.7 0.15 140' },
  { name: 'Amber', color: '#f59e0b', oklch: '0.75 0.18 70' },
];

type ThemeSettings = {
  primaryColor: string;
  isDarkMode: boolean;
};

type ThemeScope = 'home' | 'student' | 'admin';

interface ThemeContextType {
  getTheme: (scope: ThemeScope) => ThemeSettings;
  setTheme: (scope: ThemeScope, settings: Partial<ThemeSettings>) => void;
}

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: themes[1].oklch,
  isDarkMode: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [globalPrimaryColor, setGlobalPrimaryColor] = useState(() => {
    const saved = localStorage.getItem('theme-global-primary-color');
    return saved || themes[1].oklch;
  });

  const [homeDarkMode, setHomeDarkMode] = useState(() => localStorage.getItem('theme-home-dark') === 'true');
  const [studentDarkMode, setStudentDarkMode] = useState(() => localStorage.getItem('theme-student-dark') === 'true');
  const [adminDarkMode, setAdminDarkMode] = useState(() => localStorage.getItem('theme-admin-dark') === 'true');

  const getTheme = (scope: ThemeScope) => {
    const isDarkMode = scope === 'home' ? homeDarkMode : scope === 'student' ? studentDarkMode : adminDarkMode;
    return {
      primaryColor: globalPrimaryColor,
      isDarkMode
    };
  };

  const setTheme = (scope: ThemeScope, settings: Partial<ThemeSettings>) => {
    if (settings.primaryColor !== undefined) {
      setGlobalPrimaryColor(settings.primaryColor);
      localStorage.setItem('theme-global-primary-color', settings.primaryColor);
    }

    if (settings.isDarkMode !== undefined) {
      switch (scope) {
        case 'home':
          setHomeDarkMode(settings.isDarkMode);
          localStorage.setItem('theme-home-dark', settings.isDarkMode.toString());
          break;
        case 'student':
          setStudentDarkMode(settings.isDarkMode);
          localStorage.setItem('theme-student-dark', settings.isDarkMode.toString());
          break;
        case 'admin':
          setAdminDarkMode(settings.isDarkMode);
          localStorage.setItem('theme-admin-dark', settings.isDarkMode.toString());
          break;
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ getTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeScopeWrapper({ 
  scope, 
  children,
  className 
}: { 
  scope: ThemeScope; 
  children: React.ReactNode;
  className?: string;
}) {
  const { getTheme } = useTheme();
  const theme = getTheme(scope);

  const style = {
    '--primary': `oklch(${theme.primaryColor})`,
    '--ring': `oklch(${theme.primaryColor})`,
    '--sidebar-primary': `oklch(${theme.primaryColor})`,
  } as React.CSSProperties;

  return (
    <div 
      className={cn(className, theme.isDarkMode ? "dark" : "", "min-h-screen bg-background text-foreground transition-colors duration-300")}
      style={style}
    >
      {children}
    </div>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
