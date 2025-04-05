// src/components/EpisodeList/EpisodeList.tsx

import React, { useState } from 'react';
import { Episode } from '../../types';
import { usePlayerStore } from '../../store/playerStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { formatTime } from '../../utils/dateUtils';
import './EpisodeList.css';

/**
 * Props for rendering a list of episodes within a season of a show.
 */
interface EpisodeListProps {
  showId: string;
  showTitle: string;
  seasonNumber: number;
  seasonTitle: string;
  episodes: Episode[];
}

/**
 * EpisodeList displays a list of podcast episodes for a given show and season.
 * Allows users to play, queue, and favorite episodes, and view playback progress.
 *
 * @component
 * @param {EpisodeListProps} props - Metadata and episodes for the list
 * @returns {JSX.Element}
 */
const EpisodeList: React.FC<EpisodeListProps> = ({
  showId,
  showTitle,
  seasonNumber,
  seasonTitle,
  episodes,
}) => {
  // Track which episodes have been added to queue for UI feedback
  const [recentlyQueued, setRecentlyQueued] = useState<number[]>([]);
  
  const {
    playEpisode,
    addToPlaylist,
    currentEpisode,
    isCompleted,
    getEpisodeProgress,
    playlist
  } = usePlayerStore();

  const {
    addFavorite,
    removeFavorite,
    isFavorite,
  } = useFavoritesStore();

  /**
   * Initiates playback of the selected episode.
   * @param episode - The episode to play
   */
  const handlePlayEpisode = (episode: Episode) => {
    playEpisode(showId, showTitle, seasonNumber, seasonTitle, episode);
  };

  /**
   * Adds the selected episode to the playback queue with visual feedback.
   * @param episode - The episode to queue
   */
  const handleAddToQueue = (episode: Episode) => {
    console.log(`Adding episode ${episode.episode} to queue: ${episode.title}`);
    
    // Store entire playlist before adding
    const playlistBefore = [...playlist];
    console.log("Playlist before adding:", playlistBefore.map(p => p.episode.title));
    
    // Add to playlist
    addToPlaylist(showId, showTitle, seasonNumber, seasonTitle, episode);
    
    // Show visual feedback
    setRecentlyQueued(prev => [...prev, episode.episode]);
    
    // Clear visual feedback after 2 seconds
    setTimeout(() => {
      setRecentlyQueued(prev => prev.filter(ep => ep !== episode.episode));
    }, 2000);
    
    // Check playlist after adding
    setTimeout(() => {
      const currentPlaylist = usePlayerStore.getState().playlist;
      console.log("Playlist after adding:", currentPlaylist.map(p => p.episode.title));
    }, 100);
  };

  /**
   * Toggles favorite status of an episode.
   * @param episode - The episode to favorite/unfavorite
   */
  const handleToggleFavorite = (episode: Episode) => {
    const isCurrentlyFavorite = isFavorite(showId, seasonNumber, episode.episode);
    if (isCurrentlyFavorite) {
      removeFavorite(showId, seasonNumber, episode.episode);
    } else {
      addFavorite(showId, showTitle, seasonNumber, seasonTitle, episode);
    }
  };
  
  /**
   * Checks if an episode is already in the playlist
   * @param episode - The episode to check
   * @returns boolean - Whether the episode is in the playlist
   */
  const isInPlaylist = (episode: Episode): boolean => {
    return playlist.some(
      item =>
        item.showId === showId &&
        item.seasonNumber === seasonNumber &&
        item.episode.episode === episode.episode
    );
  };

  return (
    <div className="episode-list">
      <h2 className="episode-list__title">Episodes</h2>
      <div className="episode-list__container">
        {episodes.map((episode) => {
          // Check if this episode is currently playing
          const isCurrentlyPlaying =
            currentEpisode?.showId === showId &&
            currentEpisode?.seasonNumber === seasonNumber &&
            currentEpisode?.episode.episode === episode.episode;

          // Check if this episode was previously completed
          const hasCompleted = isCompleted(showId, seasonNumber, episode.episode);

          // Check if this episode is marked as a favorite
          const isFavorited = isFavorite(showId, seasonNumber, episode.episode);
          
          // Check if this episode is in playlist/queue
          const inPlaylist = isInPlaylist(episode);
          
          // Check if recently queued for animation/feedback
          const isRecentlyQueued = recentlyQueued.includes(episode.episode);

          // Retrieve the saved playback progress
          const savedProgress = getEpisodeProgress(showId, seasonNumber, episode.episode);

          return (
            <div
              key={episode.episode}
              className={`episode-item 
                ${isCurrentlyPlaying ? 'episode-item--playing' : ''} 
                ${hasCompleted ? 'episode-item--completed' : ''}
                ${isRecentlyQueued ? 'episode-item--queued' : ''}`}
            >
              {/* Episode number display */}
              <div className="episode-item__number">{episode.episode}</div>

              {/* Main content: title, description, and optional resume UI */}
              <div className="episode-item__content">
                <h3 className="episode-item__title">{episode.title}</h3>
                <p className="episode-item__description">{episode.description}</p>

                {/* If episode has saved progress and is not completed, show resume info */}
                {savedProgress && !hasCompleted && (
                  <div className="episode-item__progress">
                    <div className="episode-item__progress-icon">
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <span className="episode-item__progress-text">
                      Resume from {formatTime(savedProgress)}
                    </span>
                  </div>
                )}
                
                {/* Show in playlist indicator if it's already queued */}
                {inPlaylist && !isCurrentlyPlaying && (
                  <div className="episode-item__in-playlist">
                    <div className="episode-item__playlist-icon">
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="21" cy="16" r="3"></circle>
                      </svg>
                    </div>
                    <span className="episode-item__playlist-text">
                      In Queue
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive controls: favorite, queue, play */}
              <div className="episode-item__actions">
                {/* Favorite toggle button */}
                <button
                  className="episode-item__favorite-btn"
                  onClick={() => handleToggleFavorite(episode)}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill={isFavorited ? 'currentColor' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="episode-item__favorite-icon"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>

                {/* Add to queue button */}
                <button
                  className={`episode-item__queue-btn ${isRecentlyQueued ? 'episode-item__queue-btn--active' : ''} ${inPlaylist ? 'episode-item__queue-btn--in-queue' : ''}`}
                  onClick={() => handleAddToQueue(episode)}
                  aria-label={inPlaylist ? "Already in queue" : "Add to queue"}
                  disabled={isCurrentlyPlaying}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="episode-item__queue-icon"
                  >
                    {isRecentlyQueued ? (
                      // Checkmark when recently added
                      <path d="M20 6L9 17l-5-5"></path>
                    ) : inPlaylist ? (
                      // Music note when already in playlist
                      <>
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="21" cy="16" r="3"></circle>
                      </>
                    ) : (
                      // Plus sign for adding
                      <>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </>
                    )}
                  </svg>
                </button>

                {/* Play or indicate currently playing */}
                <button
                  className="episode-item__play-btn"
                  onClick={() => handlePlayEpisode(episode)}
                  aria-label={isCurrentlyPlaying ? 'Currently playing' : 'Play episode'}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="episode-item__play-icon"
                  >
                    {isCurrentlyPlaying ? (
                      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                    ) : (
                      <polygon points="5 3 19 12 5 21 5 3" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EpisodeList;