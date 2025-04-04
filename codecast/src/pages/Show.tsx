// src/pages/Show.tsx

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShowsStore } from '../store/showsStore';
import SeasonList from '../components/SeasonList/SeasonList';
import { PageLoader } from '../components/ui/Loading/Loading';
import { formatDate } from '../utils/dateUtils';
import './Pages.css';

/**
 * Individual Show page
 * - Fetches and displays detailed info for a single show
 * - Displays metadata, genres, and associated seasons
 * - Supports loading and error states
 *
 * @returns {JSX.Element}
 */
const Show: React.FC = () => {
  // 🧭 Read show ID from route parameters
  const { id } = useParams<{ id: string }>();

  // 🗃️ Zustand store hooks for show data and actions
  const {
    currentShow,
    genres,
    status,
    fetchShowById,
    fetchGenres,
    resetShowState,
  } = useShowsStore();

  /**
   * On mount: fetch show details and genre list if not loaded
   * On unmount: reset show-specific state to avoid data bleed
   */
  useEffect(() => {
    if (id) {
      fetchShowById(id);
    }

    if (genres.length === 0) {
      fetchGenres();
    }

    return () => {
      resetShowState();
    };
  }, [id, genres.length, fetchShowById, fetchGenres, resetShowState]);

  /**
   * Display loader when fetching data or before show is available
   */
  if (status === 'loading' || !currentShow) {
    return <PageLoader />;
  }

  /**
   * Derive genre titles for the current show (from genre IDs)
   * Add safety check for currentShow.genres
   */
  const showGenres = currentShow.genres 
    ? genres
        .filter((genre) => currentShow.genres.includes(genre.id))
        .map((genre) => genre.title)
    : [];

  return (
    <div className="page">
      {/* 🔙 Navigation back to main show list */}
      <Link to="/" className="page__back-link">
        ← Back to all shows
      </Link>

      {/* 🧾 Show details: image, title, genres, seasons, description */}
      <div className="show-header">
        <div className="show-header__image-container">
          <img
            src={currentShow.image}
            alt={currentShow.title}
            className="show-header__image"
          />
        </div>

        <div className="show-header__content">
          <h1 className="show-header__title">{currentShow.title}</h1>

          {showGenres.length > 0 && (
            <div className="show-header__genres">
              {showGenres.map((genre, index) => (
                <span key={index} className="show-header__genre">
                  {genre}
                </span>
              ))}
            </div>
          )}

          <div className="show-header__meta">
            <span className="show-header__seasons">
              {currentShow.seasons?.length || 0}{' '}
              {currentShow.seasons?.length === 1 ? 'Season' : 'Seasons'}
            </span>
            <span className="show-header__separator">•</span>
            <span className="show-header__updated">
              Last updated: {formatDate(currentShow.updated)}
            </span>
          </div>

          <p className="show-header__description">{currentShow.description}</p>
        </div>
      </div>

      {/* ❌ Error fallback if show failed to load */}
      {status === 'error' && (
        <div className="page__error">
          <p>
            Sorry, we couldn't load the show details. Please try again later.
          </p>
          <button
            className="page__retry-btn"
            onClick={() => id && fetchShowById(id)}
          >
            Retry
          </button>
        </div>
      )}

      {/* 📚 Season list (if present) */}
      {currentShow.seasons?.length > 0 && (
        <SeasonList showId={currentShow.id} seasons={currentShow.seasons} />
      )}
    </div>
  );
};

export default Show;