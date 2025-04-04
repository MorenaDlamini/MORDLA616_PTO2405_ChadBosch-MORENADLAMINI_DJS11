// src/components/Filters/Filters.tsx

import React from 'react';
import {
  ShowSortOption,
  FavoriteSortOption,
  Genre,
} from '../../types';
import './Filters.css';

/**
 * Props for the ShowFilters component.
 */
interface ShowFiltersProps {
  sortOption: ShowSortOption;
  onSortChange: (option: ShowSortOption) => void;
  genres: Genre[];
  selectedGenre: number | null;
  onGenreChange: (genreId: number | null) => void;
}

/**
 * Filter controls for the shows view — includes sorting and genre filtering.
 *
 * @component
 * @param {ShowFiltersProps} props - Props containing current state and callbacks
 * @returns {JSX.Element}
 */
export const ShowFilters: React.FC<ShowFiltersProps> = ({
  sortOption,
  onSortChange,
  genres,
  selectedGenre,
  onGenreChange,
}) => {
  return (
    <div className="filters">
      {/* Sorting dropdown */}
      <div className="filters__group">
        <label htmlFor="sort-select" className="filters__label">
          Sort by:
        </label>
        <select
          id="sort-select"
          className="filters__select"
          value={sortOption}
          onChange={(e) =>
            onSortChange(e.target.value as ShowSortOption)
          }
        >
          <option value={ShowSortOption.TITLE_ASC}>Title: A-Z</option>
          <option value={ShowSortOption.TITLE_DESC}>Title: Z-A</option>
          <option value={ShowSortOption.UPDATED_DESC}>Newest First</option>
          <option value={ShowSortOption.UPDATED_ASC}>Oldest First</option>
        </select>
      </div>

      {/* Genre filter dropdown */}
      <div className="filters__group">
        <label htmlFor="genre-select" className="filters__label">
          Genre:
        </label>
        <select
          id="genre-select"
          className="filters__select"
          value={selectedGenre === null ? '' : selectedGenre}
          onChange={(e) => {
            const value = e.target.value;
            onGenreChange(value === '' ? null : Number(value));
          }}
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

/**
 * Props for the FavoriteFilters component.
 */
interface FavoriteFiltersProps {
  sortOption: FavoriteSortOption;
  onSortChange: (option: FavoriteSortOption) => void;
}

/**
 * Filter controls for the favorites view — supports only sorting options.
 *
 * @component
 * @param {FavoriteFiltersProps} props - Props containing current sort state and handler
 * @returns {JSX.Element}
 */
export const FavoriteFilters: React.FC<FavoriteFiltersProps> = ({
  sortOption,
  onSortChange,
}) => {
  return (
    <div className="filters">
      {/* Sorting dropdown */}
      <div className="filters__group">
        <label htmlFor="favorite-sort-select" className="filters__label">
          Sort by:
        </label>
        <select
          id="favorite-sort-select"
          className="filters__select"
          value={sortOption}
          onChange={(e) =>
            onSortChange(e.target.value as FavoriteSortOption)
          }
        >
          <option value={FavoriteSortOption.TITLE_ASC}>Title: A-Z</option>
          <option value={FavoriteSortOption.TITLE_DESC}>Title: Z-A</option>
          <option value={FavoriteSortOption.ADDED_DESC}>Newest Added</option>
          <option value={FavoriteSortOption.ADDED_ASC}>Oldest Added</option>
        </select>
      </div>
    </div>
  );
};
