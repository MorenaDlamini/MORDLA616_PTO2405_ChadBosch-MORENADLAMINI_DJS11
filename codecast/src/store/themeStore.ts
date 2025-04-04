// src/store/themeStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Represents the shape of the theme store.
 */
interface ThemeState {
  /**
   * The currently active theme.
   * Possible values: 'light' or 'dark'.
   */
  theme: 'light' | 'dark';

  /**
   * Toggles between light and dark themes.
   */
  toggleTheme: () => void;

  /**
   * Sets the theme explicitly.
   * @param theme - The desired theme ('light' | 'dark').
   */
  setTheme: (theme: 'light' | 'dark') => void;
}

/**
 * Zustand store for managing application theme state.
 * 
 * - Persists the selected theme in localStorage.
 * - Defaults to `'light'` unless otherwise set or initialized based on system preference.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage', // localStorage key used for persistence
    }
  )
);

/**
 * Initializes the theme preference on application start.
 * 
 * This function will:
 * - Respect a previously stored preference (if present).
 * - Fall back to the user's system color scheme preference on first load.
 * 
 * Should be called once during app initialization.
 */
export const initializeTheme = (): void => {
  const themeStore = useThemeStore.getState();

  // Skip if a theme is already persisted in localStorage
  const storedTheme = localStorage.getItem('theme-storage');
  if (storedTheme) return;

  // Fall back to system color scheme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    themeStore.setTheme('dark');
  }
};
