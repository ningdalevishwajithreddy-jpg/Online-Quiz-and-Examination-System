import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Theme handling.
 *
 * Dark mode is the product default. The resolved theme is derived during render
 * from the stored preference plus the OS setting, and one effect applies it to
 * the document - so the light palette can be added later without touching any
 * consumer.
 */

const ThemeContext = createContext(null);

const STORAGE_KEY = 'quizsphere:theme';
const THEMES = { DARK: 'dark', LIGHT: 'light', SYSTEM: 'system' };

function readStoredTheme() {
  if (typeof window === 'undefined') return THEMES.SYSTEM;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return Object.values(THEMES).includes(stored) ? stored : THEMES.SYSTEM;
}

function systemPrefersLight() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readStoredTheme);
  const [prefersLight, setPrefersLight] = useState(systemPrefersLight);

  const theme = preference === THEMES.SYSTEM ? (prefersLight ? THEMES.LIGHT : THEMES.DARK) : preference;

  // Follow the operating system until the user makes an explicit choice.
  useEffect(() => {
    if (!window.matchMedia) return undefined;

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event) => setPrefersLight(event.matches);

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  // Apply the theme to the document and remember the explicit choice.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === THEMES.DARK);
    root.style.colorScheme = theme;

    if (preference === THEMES.SYSTEM) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, preference);
  }, [preference, theme]);

  const setTheme = useCallback((next) => {
    setPreference(Object.values(THEMES).includes(next) ? next : THEMES.SYSTEM);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      preference,
      isDark: theme === THEMES.DARK,
      setTheme,
      themes: THEMES,
    }),
    [preference, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
}

export { THEMES };
