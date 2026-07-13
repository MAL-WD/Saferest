import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'saferest-theme';

/**
 * Theme hook — persists 'dark' | 'light' to localStorage and
 * sets data-theme on <html> so CSS can respond via
 * [data-theme="light"] selectors.
 */
export default function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      /* ignore */
    }
    return 'dark'; // default
  });

  // Sync attribute + localStorage whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  );

  const setTheme = useCallback((t) => setThemeState(t), []);

  return { theme, toggleTheme, setTheme };
}
