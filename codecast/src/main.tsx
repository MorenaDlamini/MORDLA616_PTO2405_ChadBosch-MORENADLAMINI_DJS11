// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Main entry point of the React application.
 * - Uses React 18's `createRoot` API for concurrent rendering.
 * - Wraps the app in `StrictMode` to surface potential issues.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
