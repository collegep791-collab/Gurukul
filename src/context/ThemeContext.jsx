import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first for instant load
    return localStorage.getItem('gurukul-theme') === 'dark';
  });

  // Apply class to <html> on mount and on change
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gurukul-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Sync with server settings when user is logged in
  const syncFromServer = useCallback((theme) => {
    if (theme === 'dark') {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, []);

  const toggleDark = useCallback(async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    try {
      // Persist to server
      await api.put('/settings', { theme: newVal ? 'dark' : 'light' });
    } catch (e) {
      // Silently fail if not logged in
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, syncFromServer }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
