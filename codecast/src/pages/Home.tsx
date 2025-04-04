// src/pages/Home.tsx

import React, { useEffect, useState } from 'react';
import { ShowFilters } from '../components/Filters/Filters';
import SearchFilter from '../components/SearchFilter/SearchFilter';
import ShowCard from '../components/ShowCard/ShowCard';
import ShowCarousel from '../components/ShowCarousel/ShowCarousel';
import { PageLoader } from '../components/ui/Loading/Loading';
import { useShowsStore } from '../store/showsStore';
import { fuzzySearchShows } from '../utils/searchUtils';
import { ShowPreview } from '../types';
import './Pages.css';

/**
 * Home page component responsible for displaying:
 * - A carousel of recently updated shows
 * - Search input and filters
 * - All available shows, filtered and searchable
 */
const Home: React.FC = () => {
  // Search input value
  const [searchQuery, setSearchQuery] = useState('');
  
  // Computed results after applying search
  const [searchResults, setSearchResults] = useState<ShowPreview[]>([]);

  const {
    shows,
    filteredShows,
    genres,
    selectedGenre,
    sortOption,
    status,
    fetchShows,
    fetchGenres,
    setSortOption,
    setGenreFilter,
  } = useShowsStore();

  /**
   * Update `searchResults` whenever query or filters change.
   * Uses fuzzy matching to search by title/description.
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(filteredShows);
    } else {
      const results = fuzzySearchShows(filteredShows, searchQuery)
        .map(item => item.show);
      setSearchResults(results);
    }
  }, [searchQuery, filteredShows]);

  /**
   * Fetch shows and genres on initial page load.
   * Avoids redundant requests if already loaded.
   */
  useEffect(() => {
    if (shows.length === 0) fetchShows();
    if (genres.length === 0) fetchGenres();
  }, [shows.length, genres.length, fetchShows, fetchGenres]);

  // Most recently updated shows for the top carousel
  const recentlyUpdatedShows = [...shows]
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
    .slice(0, 5);

  // Show loader while data is still being fetched
  if (status === 'loading' && shows.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="page">
      {/* Recently updated shows carousel */}
      {shows.length > 0 && (
        <ShowCarousel 
          shows={recentlyUpdatedShows} 
          title="Recently Updated Shows" 
        />
      )}

      <header className="page__header">
        <h1 className="page__title">All Shows</h1>

        <div className="page__search-and-filters">
          <SearchFilter
            onSearch={setSearchQuery}
            placeholder="Search by title or description..."
          />

          {/* Genre and sorting filters */}
          {genres.length > 0 && (
            <ShowFilters
              sortOption={sortOption}
              onSortChange={setSortOption}
              genres={genres}
              selectedGenre={selectedGenre}
              onGenreChange={setGenreFilter}
            />
          )}
        </div>
      </header>

      {/* Error message if fetching shows fails */}
      {status === 'error' && (
        <div className="page__error">
          <p>Sorry, we couldn't load the shows. Please try again later.</p>
          <button
            className="page__retry-btn"
            onClick={() => fetchShows()}
          >
            Retry
          </button>
        </div>
      )}

      {/* No results state — handles both search and filter empty results */}
      {searchResults.length === 0 && status === 'success' && (
        <div className="page__empty">
          {searchQuery ? (
            <>
              <p>No shows found matching "{searchQuery}".</p>
              <button
                className="page__reset-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <p>No shows found for the selected filters.</p>
              <button
                className="page__reset-btn"
                onClick={() => setGenreFilter(null)}
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Show grid */}
      <div className="show-grid">
        {searchResults.map(show => (
          <ShowCard
            key={show.id}
            show={show}
            genres={genres}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
