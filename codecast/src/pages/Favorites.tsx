// src/pages/Favorites.tsx

import React from 'react';
import { FavoriteFilters } from '../components/Filters/Filters';
import FavoritesList from '../components/FavoritesList/FavoritesList';
import { useFavoritesStore } from '../store/favoritesStore';
import './Pages.css';

/**
 * Favorites page – displays user's favorited episodes grouped by show & season.
 * Includes sorting functionality for better organization.
 *
 * @returns {JSX.Element}
 */
const Favorites: React.FC = () => {
  // 🔄 Zustand store for favorites and sort state
  const { favorites, sortOption, setSortOption } = useFavoritesStore();

  return (
    <div className="page">
      {/* 📋 Page title and sort controls */}
      <header className="page__header">
        <h1 className="page__title">Your Favorites</h1>

        <FavoriteFilters
          sortOption={sortOption}
          onSortChange={setSortOption}
        />
      </header>

      {/* 🧾 Render grouped list of favorite episodes */}
      <FavoritesList favorites={favorites} />
    </div>
  );
};

export default Favorites;
