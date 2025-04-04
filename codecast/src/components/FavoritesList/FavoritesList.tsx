// src/components/FavoritesList/FavoritesList.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { FavoriteEpisode } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { usePlayerStore } from '../../store/playerStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import './FavoritesList.css';

/**
 * Props for the FavoritesList component.
 */
interface FavoritesListProps {
  favorites: FavoriteEpisode[];
}

/**
 * Displays a list of favorite episodes, grouped by show and season.
 * Each episode supports play and remove functionality.
 *
 * @component
 * @param {FavoritesListProps} props - List of favorite episodes
 * @returns {JSX.Element}
 */
const FavoritesList: React.FC<FavoritesListProps> = ({ favorites }) => {
  const { playEpisode, isCompleted } = usePlayerStore();
  const { removeFavorite } = useFavoritesStore();

  /**
   * Groups favorite episodes by show and season for hierarchical display.
   */
  const groupedFavorites = favorites.reduce((acc, favorite) => {
    const key = `${favorite.showId}-${favorite.seasonNumber}`;

    if (!acc[key]) {
      acc[key] = {
        showId: favorite.showId,
        showTitle: favorite.showTitle,
        seasonNumber: favorite.seasonNumber,
        seasonTitle: favorite.seasonTitle,
        episodes: [],
      };
    }

    acc[key].episodes.push(favorite);
    return acc;
  }, {} as Record<
    string,
    {
      showId: string;
      showTitle: string;
      seasonNumber: number;
      seasonTitle: string;
      episodes: FavoriteEpisode[];
    }
  >);

  return (
    <div className="favorites-list">
      {/* Show empty state when no favorites exist */}
      {Object.values(groupedFavorites).length === 0 ? (
        <div className="favorites-list__empty">
          <p>You haven't added any favorites yet.</p>
          <p>Browse shows and mark episodes as favorites to see them here.</p>
        </div>
      ) : (
        Object.values(groupedFavorites).map((group) => (
          <div
            key={`${group.showId}-${group.seasonNumber}`}
            className="favorites-group"
          >
            {/* Show + Season title header */}
            <div className="favorites-group__header">
              <Link
                to={`/show/${group.showId}`}
                className="favorites-group__show-title"
              >
                {group.showTitle}
              </Link>
              <span className="favorites-group__separator">›</span>
              <Link
                to={`/show/${group.showId}/season/${group.seasonNumber}`}
                className="favorites-group__season-title"
              >
                {group.seasonTitle}
              </Link>
            </div>

            {/* Episodes under this group */}
            <div className="favorites-group__episodes">
              {group.episodes.map((favorite) => {
                const completed = isCompleted(
                  favorite.showId,
                  favorite.seasonNumber,
                  favorite.episode.episode
                );

                return (
                  <div
                    key={`${favorite.showId}-${favorite.seasonNumber}-${favorite.episode.episode}`}
                    className={`favorite-item ${
                      completed ? 'favorite-item--completed' : ''
                    }`}
                  >
                    <div className="favorite-item__content">
                      <div className="favorite-item__title">
                        Episode {favorite.episode.episode}:{' '}
                        {favorite.episode.title}
                      </div>
                      <div className="favorite-item__meta">
                        Added on {formatDate(favorite.addedAt)}
                      </div>
                    </div>

                    {/* Action buttons: play + remove */}
                    <div className="favorite-item__actions">
                      <button
                        className="favorite-item__play-btn"
                        onClick={() =>
                          playEpisode(
                            favorite.showId,
                            favorite.showTitle,
                            favorite.seasonNumber,
                            favorite.seasonTitle,
                            favorite.episode
                          )
                        }
                        aria-label="Play episode"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </button>

                      <button
                        className="favorite-item__remove-btn"
                        onClick={() =>
                          removeFavorite(
                            favorite.showId,
                            favorite.seasonNumber,
                            favorite.episode.episode
                          )
                        }
                        aria-label="Remove from favorites"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FavoritesList;
