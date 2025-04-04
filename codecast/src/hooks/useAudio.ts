// src/hooks/useAudio.ts

import { useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';

/**
 * Custom hook that manages audio element behavior:
 * - Binds playback state (play/pause)
 * - Syncs volume, currentTime, duration, and playbackRate
 * - Handles progress saving and completion tracking
 * - Implements keyboard controls and skip actions
 * - Prevents accidental navigation during playback
 * - Manages sleep timer functionality
 *
 * @returns Ref to be attached to <audio> element
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
   * Handle play/pause toggle when player state changes
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // Use promise to handle autoplay restrictions
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Audio playback failed:', error);
          
          // If autoplay was blocked, update the store state
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
   * Sync volume with global player state
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  /**
   * Sync playback rate with global player state
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  /**
   * Seek to updated currentTime if it's significantly different
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
   * Register event listeners on <audio> for:
   * - Metadata (duration)
   * - Completion detection (ended)
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      markAsCompleted();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setDuration, markAsCompleted]);

  /**
   * Use requestAnimationFrame for smoother progress updates
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
   * Auto-save progress every 10 seconds
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
   * Implement keyboard controls for playback
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to keyboard events when they're not in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable) {
        return;
      }
      
      if (!currentEpisode) return;
      
      // Space bar toggles play/pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      }
      
      // Left arrow seeks backward 10 seconds
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipBackward(10);
      }
      
      // Right arrow seeks forward 10 seconds
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipForward(10);
      }
      
      // M key toggles mute
      if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
      
      // N key for Next episode
      if (e.code === 'KeyN') {
        e.preventDefault();
        skipToNext();
      }
      
      // P key for Previous episode
      if (e.code === 'KeyP') {
        e.preventDefault();
        skipToPrevious();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentEpisode, togglePlayPause, toggleMute, skipToNext, skipToPrevious, skipForward, skipBackward]);

  /**
   * Implement sleep timer functionality
   */
  useEffect(() => {
    if (!sleepTimer || !isPlaying) return;
    
    const checkSleepTimer = () => {
      if (Date.now() >= sleepTimer) {
        togglePlayPause();
        // Reset sleep timer in store
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
   * Prevent page unload if audio is playing
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