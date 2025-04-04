// src/layouts/MainLayout.tsx

import React, { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AudioPlayer from '../components/AudioPlayer/AudioPlayer';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import { usePlayerStore } from '../store/playerStore';
import { useThemeStore, initializeTheme } from '../store/themeStore';
import './MainLayout.css';

/**
 * Props for the main layout component.
 */
interface MainLayoutProps {
  children: ReactNode;
}

/**
 * MainLayout wraps every page with global UI elements:
 * - Header navigation
 * - Theme toggle
 * - Conditionally padded main area (if audio is playing)
 * - Global AudioPlayer
 * - Reset listening history button
 *
 * @component
 * @param {MainLayoutProps} props - Component children to be rendered inside layout
 * @returns {JSX.Element}
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { currentEpisode } = usePlayerStore();
  const { theme } = useThemeStore();

  // Determine if the audio player is visible to apply bottom padding to content
  const hasAudioPlayer = currentEpisode !== null;

  // Initialize theme and apply data-theme attribute to document
  useEffect(() => {
    // Initialize theme based on system preference if not already set
    initializeTheme();
    
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="layout">
      {/* 🔝 Global header */}
      <header className="header">
        <div className="container">
          <Link to="/" className="header__logo">
            <span className="header__logo-code">Code</span>
            <span className="header__logo-cast">cast</span>
          </Link>

          {/* 🔗 Navigation links and theme toggle */}
          <nav className="nav">
            <Link
              to="/"
              className={`nav__link ${
                location.pathname === '/' ? 'nav__link--active' : ''
              }`}
            >
              Shows
            </Link>
            <Link
              to="/favorites"
              className={`nav__link ${
                location.pathname === '/favorites' ? 'nav__link--active' : ''
              }`}
            >
              Favorites
            </Link>
            
            {/* 🌓 Theme toggle button */}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* 📄 Main content area */}
      <main className={`main ${hasAudioPlayer ? 'main--with-player' : ''}`}>
        <div className="container">{children}</div>
      </main>

      {/* 🔊 Persistent audio player component (positioned fixed) */}
      <AudioPlayer />

      {/* 🗑️ Reset listening history button (placed after audio to avoid overlay) */}
      <div className="reset-button-container">
        <button
          className="reset-button"
          onClick={() => {
            const confirmed = window.confirm(
              'Are you sure you want to reset your listening history? This action cannot be undone.'
            );
            if (confirmed) {
              usePlayerStore.getState().resetListeningHistory();
            }
          }}
        >
          Reset Listening History
        </button>
      </div>
    </div>
  );
};

export default MainLayout;