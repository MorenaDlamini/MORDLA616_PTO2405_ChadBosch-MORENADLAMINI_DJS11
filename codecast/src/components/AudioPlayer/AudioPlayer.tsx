// src/components/AudioPlayer/AudioPlayer.tsx

import React, { useRef, useEffect, useState } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useAudio } from '../../hooks/useAudio';
import { formatTime } from '../../utils/dateUtils';
import PlaylistQueue from './PlaylistQueue';
import './AudioPlayer.css';

const SKIP_SECONDS = 15; // Number of seconds to skip with forward/backward buttons

/**
 * AudioPlayer component handles playback controls and progress tracking
 * for the currently selected episode using a shared player store and audio ref.
 *
 * @returns {JSX.Element | null}
 */
const AudioPlayer: React.FC = () => {
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [showPlaybackRateMenu, setShowPlaybackRateMenu] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const {
    isPlaying,
    currentEpisode,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    playlist,
    currentEpisodeIndex,
    sleepTimer,
    togglePlayPause,
    setCurrentTime,
    setVolume,
    toggleMute,
    setPlaybackRate,
    skipToNext,
    skipToPrevious,
    skipForward,
    skipBackward,
    setSleepTimer,
  } = usePlayerStore();

  const { audioRef } = useAudio();

  // Calculate remaining time for sleep timer if active
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  
  useEffect(() => {
    if (!sleepTimer) {
      setSleepTimerRemaining(null);
      return;
    }
    
    const updateRemainingTime = () => {
      const remaining = Math.max(0, sleepTimer - Date.now());
      setSleepTimerRemaining(remaining);
      
      if (remaining > 0) {
        requestAnimationFrame(updateRemainingTime);
      }
    };
    
    requestAnimationFrame(updateRemainingTime);
  }, [sleepTimer]);

  // Debug audio playback
  useEffect(() => {
    if (currentEpisode) {
      console.log('Current audio file:', currentEpisode.episode.file);
      console.log('Audio element:', audioRef.current);
      console.log('Is playing:', isPlaying);
    }
  }, [currentEpisode, audioRef, isPlaying]);

  /**
   * Handles click on progress bar to seek to a specific time.
   */
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentEpisode || !audioRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    setCurrentTime(newTime);
    
    // Also directly set the audio element's currentTime for immediate feedback
    audioRef.current.currentTime = newTime;
  };

  /**
   * Handles touch on progress bar for mobile devices
   */
  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentEpisode || !audioRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.touches[0].clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, percent * duration));

    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  /**
   * Handles click on volume bar to set audio volume.
   */
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;

    const rect = volumeRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, percent));

    setVolume(newVolume);
  };
  
  /**
   * Handle the skip forward button - uses the store skipForward function
   */
  const handleSkipForward = () => {
    skipForward(SKIP_SECONDS);
  };
  
  /**
   * Handle the skip backward button - uses the store skipBackward function
   */
  const handleSkipBackward = () => {
    skipBackward(SKIP_SECONDS);
  };
  
  /**
   * Handle next episode button click
   */
  const handleNextClick = () => {
    if (playlist.length === 0 || currentEpisodeIndex === playlist.length - 1) {
      console.log('No next episode available');
      return;
    }
    console.log('Skipping to next episode');
    skipToNext();
  };

  /**
   * Handle previous episode button click
   */
  const handlePreviousClick = () => {
    if (currentTime > 3) {
      // If we're more than 3 seconds in, just restart the current episode
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    } else if (playlist.length > 0 && currentEpisodeIndex > 0) {
      console.log('Skipping to previous episode');
      skipToPrevious();
    }
  };
  
  /**
   * Creates playback rate options
   */
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowPlaybackRateMenu(false);
  };
  
  /**
   * Handle sleep timer selection
   */
  const handleSetSleepTimer = (minutes: number | null) => {
    setSleepTimer(minutes);
    setShowSleepTimer(false);
  };
  
  /**
   * Format sleep timer remaining time
   */
  const formatSleepTimerRemaining = () => {
    if (!sleepTimerRemaining) return '';
    
    const minutes = Math.floor(sleepTimerRemaining / 60000);
    const seconds = Math.floor((sleepTimerRemaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Don't render the player if no episode is currently selected
  if (!currentEpisode) return null;

  // Pre-calculate progress and volume bar percentages
  const progressPercent = (currentTime / duration) * 100 || 0;
  const volumePercent = volume * 100;

  // Check if there are next/previous episodes available
  const hasNextEpisode = playlist.length > 0 && currentEpisodeIndex < playlist.length - 1;
  const hasPreviousEpisode = playlist.length > 0 && currentEpisodeIndex > 0;
  
  // Available playback rate options
  const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  
  // Sleep timer options (in minutes)
  const sleepTimerOptions = [5, 15, 30, 60, null]; // null means "Cancel"

  return (
    <div className="audio-player">
      {/* Native audio element with dynamic source */}
      <audio
        ref={audioRef}
        src={currentEpisode.episode.file}
        preload="metadata"
      />

      {/* Episode/show metadata display */}
      <div className="audio-player__info">
        <div className="audio-player__show-title">
          {currentEpisode.showTitle}
        </div>
        <div className="audio-player__episode-title">
          {currentEpisode.seasonTitle} - {currentEpisode.episode.title}
        </div>
      </div>

      {/* Main player controls */}
      <div className="audio-player__controls">
        {/* Previous button */}
        <button
          className="audio-player__control-btn"
          onClick={handlePreviousClick}
          aria-label={currentTime > 3 ? "Restart episode" : "Previous episode"}
          disabled={!hasPreviousEpisode && currentTime <= 3}
          style={{ opacity: (!hasPreviousEpisode && currentTime <= 3) ? 0.5 : 1 }}
        >
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
            <polygon points="19 20 9 12 19 4 19 20"></polygon>
            <line x1="5" y1="19" x2="5" y2="5"></line>
          </svg>
        </button>

        {/* Skip backward button */}
        <button
          className="audio-player__control-btn"
          onClick={handleSkipBackward}
          aria-label={`Skip backward ${SKIP_SECONDS} seconds`}
        >
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 8 8 12 12 16" />
            <text x="12" y="16" fontSize="8" fontWeight="bold" fill="currentColor" textAnchor="middle">
              {SKIP_SECONDS}
            </text>
          </svg>
        </button>

        {/* Play/Pause toggle button */}
        <button
          className="audio-player__play-pause"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
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
          >
            {isPlaying ? (
              // Pause icon (two vertical bars)
              <>
                <line x1="6" y1="4" x2="6" y2="20"></line>
                <line x1="18" y1="4" x2="18" y2="20"></line>
              </>
            ) : (
              // Play icon (triangle)
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            )}
          </svg>
        </button>

        {/* Skip forward button */}
        <button
          className="audio-player__control-btn"
          onClick={handleSkipForward}
          aria-label={`Skip forward ${SKIP_SECONDS} seconds`}
        >
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 16 16 12 12 8" />
            <text x="12" y="16" fontSize="8" fontWeight="bold" fill="currentColor" textAnchor="middle">
              {SKIP_SECONDS}
            </text>
          </svg>
        </button>

        {/* Next button */}
        <button
          className="audio-player__control-btn"
          onClick={handleNextClick}
          aria-label="Next episode"
          disabled={!hasNextEpisode}
          style={{ opacity: !hasNextEpisode ? 0.5 : 1 }}
        >
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
            <polygon points="5 4 15 12 5 20 5 4"></polygon>
            <line x1="19" y1="5" x2="19" y2="19"></line>
          </svg>
        </button>

        {/* Current time display */}
        <div className="audio-player__time-current">
          {formatTime(currentTime)}
        </div>

        {/* Seek/progress bar */}
        <div
          className="audio-player__progress-container"
          ref={progressRef}
          onClick={handleProgressClick}
          onTouchStart={handleProgressTouch}
        >
          <div className="audio-player__progress-bg"></div>
          <div
            className="audio-player__progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Total duration display */}
        <div className="audio-player__time-total">
          {formatTime(duration)}
        </div>

        {/* Playback rate control */}
        <div className="audio-player__playback-rate">
          <button 
            className="audio-player__rate-btn"
            onClick={() => setShowPlaybackRateMenu(!showPlaybackRateMenu)}
            aria-label="Change playback speed"
          >
            {playbackRate}x
          </button>
          
          {showPlaybackRateMenu && (
            <div className="audio-player__rate-menu">
              {playbackRates.map(rate => (
                <button
                  key={rate}
                  className={`audio-player__rate-option ${playbackRate === rate ? 'audio-player__rate-option--active' : ''}`}
                  onClick={() => handlePlaybackRateChange(rate)}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sleep timer button */}
        <div className="audio-player__sleep-timer">
          <button
            className="audio-player__timer-btn"
            onClick={() => setShowSleepTimer(!showSleepTimer)}
            aria-label={sleepTimer ? `Sleep timer: ${formatSleepTimerRemaining()} remaining` : "Set sleep timer"}
          >
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {sleepTimer && <span className="audio-player__timer-remaining">{formatSleepTimerRemaining()}</span>}
          </button>
          
          {showSleepTimer && (
            <div className="audio-player__timer-menu">
              {sleepTimerOptions.map((option, index) => (
                <button
                  key={index}
                  className="audio-player__timer-option"
                  onClick={() => handleSetSleepTimer(option)}
                >
                  {option === null ? "Cancel" : `${option} min`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Playlist button */}
        <button
          className="audio-player__control-btn audio-player__playlist-btn"
          onClick={() => setShowPlaylist(!showPlaylist)}
          aria-label="Show playlist"
        >
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
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>

        {/* Volume control UI */}
        <div className="audio-player__volume">
          {/* Volume/mute button */}
          <button
            onClick={toggleMute}
            className="audio-player__volume-btn"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMuted || volume === 0 ? (
                // Muted icon
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </>
              ) : (
                // Sound icon with waves depending on volume level
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  {volume > 0.5 && (
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  )}
                </>
              )}
            </svg>
          </button>

          {/* Volume level bar */}
          <div
            className="audio-player__volume-container"
            ref={volumeRef}
            onClick={handleVolumeClick}
          >
            <div className="audio-player__volume-bg"></div>
            <div
              className="audio-player__volume-fill"
              style={{ width: `${volumePercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Playlist Queue (conditionally rendered) */}
      {showPlaylist && (
        <PlaylistQueue onClose={() => setShowPlaylist(false)} />
      )}
    </div>
  );
};

export default AudioPlayer;