// src/components/ThemeToggle/ThemeToggle.tsx

import React from 'react';
import { useThemeStore } from '../../store/themeStore';

/**
 * ThemeToggle component
 *
 * A reusable button that toggles between light and dark themes.
 * - Uses Zustand state from `useThemeStore`
 * - Displays a moon icon when in light mode (suggesting a switch to dark mode)
 * - Displays a sun icon when in dark mode (suggesting a switch to light mode)
 *
 * Accessibility:
 * - Includes `aria-label` and `title` attributes to describe the current action
 *
 * @returns {JSX.Element} A button with theme toggle functionality
 */
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === 'light' ? (
        // Moon icon — shown in light mode to suggest enabling dark mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon — shown in dark mode to suggest enabling light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
