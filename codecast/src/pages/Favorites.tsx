// src/pages/Favorites.tsx

import React from 'react';
import { FavoriteFilters } from '../components/Filters/Filters';
import FavoritesList from '../components/FavoritesList/FavoritesList';
import { useFavoritesStore } from '../store/favoritesStore';
import './Pages.css';

/**
 * 📁 Favorites Page
 * 
 * Displays user's favorited episodes, grouped by show and season.
 * Provides sorting controls and a "Delete All" feature for batch management.
 */
const Favorites: React.FC = () => {
  // 🧠 Zustand store: favorites list, current sort option, and actions
  const { favorites, sortOption, setSortOption, clearAllFavorites } = useFavoritesStore();

  /**
   * 🧹 Handler for clearing all favorites
   * Uses browser confirmation dialog to prevent accidental deletion
   */
  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all favorites?')) {
      clearAllFavorites();
    }
  };

  return (
    <div className="page">
      {/* 🧭 Page header with title and sorting controls */}
      <header className="page__header">
        <h1 className="page__title">Your Favorites</h1>

        {/* 🎚️ Filters and delete-all button grouped together */}
        <div className="page__header-actions">
          <FavoriteFilters
            sortOption={sortOption}
            onSortChange={setSortOption}
          />

          {/* 🗑️ Only show "Delete All" if favorites exist */}
          {favorites.length > 0 && (
            <button 
              className="page__delete-all-btn"
              onClick={handleDeleteAll}
              aria-label="Delete all favorites"
            >
              Delete All
            </button>
          )}
        </div>
      </header>

      {/* 📦 Render all favorited episodes grouped by show/season */}
      <FavoritesList favorites={favorites} />
    </div>
  );
};

export default Favorites;
