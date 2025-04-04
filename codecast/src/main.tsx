// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeTheme } from './store/themeStore';
import './index.css';

/**
 * Initialize application theme before rendering.
 *
 * This ensures the correct theme (light or dark) is applied based on:
 * - Stored user preference (from localStorage)
 * - Fallback to system preference if no stored theme
 *
 * This must run before rendering to avoid visual flash between themes.
 */
initializeTheme();

/**
 * Bootstrap the React application
 *
 * - Uses React 18's createRoot API
 * - Wraps <App /> in <React.StrictMode> for development best practices
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
