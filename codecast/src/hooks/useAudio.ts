// src/hooks/useAudio.ts

import { useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';

/**
 * Custom hook that manages audio element behavior:
 * - Binds playback state (play/pause)
 * - Syncs volume, currentTime, and duration
 * - Handles progress saving and completion tracking
 * - Prevents accidental navigation during playback
 *
 * @returns Ref to be attached to <audio> element
 */
export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);

  const {
    isPlaying,
    currentEpisode,
    currentTime,
    volume,
    setCurrentTime,
    setDuration,
    markAsCompleted,
    saveProgress,
  } = usePlayerStore();

  /**
   * Handle play/pause toggle when player state changes
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('Audio playback failed:', error);
      });
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
   * - Progress tracking (timeupdate)
   * - Metadata (duration)
   * - Completion detection (ended)
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      markAsCompleted();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, markAsCompleted]);

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
