// src/pages/Season.tsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShowsStore } from '../store/showsStore';
import EpisodeList from '../components/EpisodeList/EpisodeList';
import { PageLoader } from '../components/ui/Loading/Loading';
import { Season as SeasonType } from '../types';
import './Pages.css';

/**
 * Season page – displays a single season’s info and episodes.
 * - Fetches show details by ID
 * - Parses and locates the season by URL param
 * - Offers a switcher for multi-season shows
 *
 * @returns {JSX.Element}
 */
const Season: React.FC = () => {
  const { id, seasonNumber } = useParams<{ id: string; seasonNumber: string }>();
  const { currentShow, status, fetchShowById } = useShowsStore();

  const [currentSeason, setCurrentSeason] = useState<SeasonType | null>(null);

  /**
   * Ensure show data is available when component mounts.
   * Avoids duplicate fetch if the correct show is already loaded.
   */
  useEffect(() => {
    if (id && (!currentShow || currentShow.id !== id)) {
      fetchShowById(id);
    }
  }, [id, currentShow, fetchShowById]);

  /**
   * When the current show or seasonNumber changes, find the matching season.
   * If no match is found, we fallback to an error message.
   */
  useEffect(() => {
    if (currentShow && seasonNumber) {
      const season = currentShow.seasons.find(
        (s) => s.season === parseInt(seasonNumber, 10)
      );
      setCurrentSeason(season || null);
    } else {
      setCurrentSeason(null);
    }
  }, [currentShow, seasonNumber]);

  // 📦 Show full-page loader while data is being fetched or missing
  if (status === 'loading' || !currentShow) {
    return <PageLoader />;
  }

  return (
    <div className="page">
      {/* 🔙 Navigation back to the show page */}
      <Link to={`/show/${id}`} className="page__back-link">
        ← Back to {currentShow.title}
      </Link>

      {/* ✅ If a valid season is found */}
      {currentSeason ? (
        <>
          {/* 📺 Season details header */}
          <div className="season-header">
            <div className="season-header__image-container">
              <img
                src={currentSeason.image}
                alt={currentSeason.title}
                className="season-header__image"
              />
            </div>

            <div className="season-header__content">
              <h1 className="season-header__title">{currentSeason.title}</h1>
              <div className="season-header__show-title">
                {currentShow.title}
              </div>

              <div className="season-header__meta">
                <span className="season-header__episodes">
                  {currentSeason.episodes.length}{' '}
                  {currentSeason.episodes.length === 1 ? 'Episode' : 'Episodes'}
                </span>
              </div>

              {/* 🎛️ Multi-season switcher for quick navigation */}
              {currentShow.seasons.length > 1 && (
                <div className="season-selector">
                  <span className="season-selector__label">Switch season:</span>
                  <div className="season-selector__buttons">
                    {currentShow.seasons.map((season) => (
                      <Link
                        key={season.season}
                        to={`/show/${id}/season/${season.season}`}
                        className={`season-selector__button ${
                          season.season === parseInt(seasonNumber!, 10)
                            ? 'season-selector__button--active'
                            : ''
                        }`}
                      >
                        {season.season}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ▶️ List of episodes in this season */}
          <EpisodeList
            showId={id!}
            showTitle={currentShow.title}
            seasonNumber={parseInt(seasonNumber!, 10)}
            seasonTitle={currentSeason.title}
            episodes={currentSeason.episodes}
          />
        </>
      ) : (
        // ❌ Fallback if the season wasn't found (e.g., invalid URL)
        <div className="page__error">
          <p>Season not found. Please select a valid season.</p>
          <Link to={`/show/${id}`} className="page__back-btn">
            Back to Show
          </Link>
        </div>
      )}
    </div>
  );
};

export default Season;
