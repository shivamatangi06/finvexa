import { ThemeMode } from '../types';

const THEME_KEY = 'finvexa-theme';

export function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (e) {
    // LocalStorage might be disabled
  }
  return 'system';
}

export const getInitialTheme = getStoredTheme;

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // Ignore storage errors
  }
}
