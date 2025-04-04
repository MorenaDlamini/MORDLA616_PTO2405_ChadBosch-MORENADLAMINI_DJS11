// src/hooks/useAudio.ts

import { useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';

/**
 * Custom hook to synchronize HTMLAudioElement behavior with the global player state.
 *
 * Responsibilities:
 * - Manages play/pause state
 * - Synchronizes volume, playbackRate, duration, and currentTime
 * - Saves playback progress periodically
 * - Handles completion and auto-advance
 * - Implements keyboard shortcuts for playback control
 * - Prevents accidental navigation while playing
 * - Manages sleep timer to pause playback
 *
 * @returns Object containing a ref to be attached to the <audio> element
 */
export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const {
    isPlaying,
    currentEpisode,
    currentTime,
    volume,
    playbackRate,
    sleepTimer,
    setCurrentTime,
    setDuration,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    toggleMute,
    markAsCompleted,
    saveProgress,
    skipForward,
    skipBackward,
  } = usePlayerStore();

  /**
   * Sync the audio element's playback state with the global store (play/pause).
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Audio playback failed:', error);
          // Reset playing state in the store if autoplay fails
          usePlayerStore.setState(state => ({
            ...state,
            isPlaying: false
          }));
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentEpisode]);

  /**
   * Sync audio element volume when updated in store.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  /**
   * Sync playback rate with global store setting.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  /**
   * If the currentTime from store differs from audio element, seek to it.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    const diff = Math.abs(audio.currentTime - currentTime);
    if (diff > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime, currentEpisode]);

  /**
   * Attach event listeners to the audio element for:
   * - Metadata loading (set duration)
   * - Episode end (mark completed and advance)
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      markAsCompleted();
      setTimeout(() => {
        skipToNext();
      }, 500);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setDuration, markAsCompleted, skipToNext]);

  /**
   * Smoothly updates the store with audio progress using requestAnimationFrame.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      animationFrameId.current = requestAnimationFrame(updateProgress);
    };

    animationFrameId.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, setCurrentTime]);

  /**
   * Saves the current playback position every 10 seconds.
   */
  useEffect(() => {
    if (!isPlaying || !currentEpisode) return;

    progressSaveInterval.current = setInterval(() => {
      saveProgress();
    }, 10000); // Save every 10s

    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [isPlaying, currentEpisode, saveProgress]);

  /**
   * Adds global keyboard shortcuts for playback control.
   * - Space: toggle play/pause
   * - ArrowLeft: rewind
   * - ArrowRight: forward
   * - M: mute
   * - N: next episode
   * - P: previous episode
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputField || !currentEpisode) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward(10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward(10);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyN':
          e.preventDefault();
          skipToNext();
          break;
        case 'KeyP':
          e.preventDefault();
          skipToPrevious();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    currentEpisode,
    togglePlayPause,
    toggleMute,
    skipToNext,
    skipToPrevious,
    skipForward,
    skipBackward
  ]);

  /**
   * Automatically pauses playback when sleep timer expires.
   */
  useEffect(() => {
    if (!sleepTimer || !isPlaying) return;

    const checkSleepTimer = () => {
      if (Date.now() >= sleepTimer) {
        togglePlayPause();
        usePlayerStore.setState(state => ({
          ...state,
          sleepTimer: null
        }));
      }
    };

    const intervalId = setInterval(checkSleepTimer, 1000);

    return () => clearInterval(intervalId);
  }, [sleepTimer, isPlaying, togglePlayPause]);

  /**
   * Warn user before page unload if playback is active.
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isPlaying) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPlaying]);

  return { audioRef };
};
