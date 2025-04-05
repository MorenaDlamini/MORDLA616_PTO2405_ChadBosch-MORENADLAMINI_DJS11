// src/hooks/useAudioService.ts

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { audioService } from '../services/audioService';

/**
 * Hook to connect the audio service with the player store.
 * Handles synchronization between UI state and the actual audio element.
 */
export const useAudioService = () => {
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  const {
    isPlaying,
    currentEpisode,
    currentTime,
    volume,
    isMuted,
    playbackRate,
    playlist,
    currentEpisodeIndex,
    sleepTimer,
    saveProgress,
    setCurrentTime,
    setDuration,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    skipForward,
    skipBackward,
    toggleMute
  } = usePlayerStore();
  
  // Handle play/pause based on state changes
  useEffect(() => {
    if (!currentEpisode || !currentEpisode.episode.file) {
      // If there's no episode or no file, we can't play anything
      if (isPlaying) {
        console.log('Cannot play - no episode selected or no file available');
        // Reset the playing state
        usePlayerStore.setState({ isPlaying: false });
      }
      return;
    }
    
    const audio = audioService.getAudioElement();
    
    if (isPlaying) {
      // Only try to play if we have a valid source
      if (audio.src) {
        audioService.play().catch(error => {
          console.error('Failed to play from useAudioService:', error);
          usePlayerStore.setState({ isPlaying: false });
        });
      } else {
        // If we have an episode but no source, try to load it first
        console.log('No audio source but episode exists, attempting to load');
        audioService.loadEpisode(
          currentEpisode.episode.file,
          currentTime,
          true
        );
      }
    } else {
      audioService.pause();
    }
  }, [isPlaying, currentEpisode]);
  
  // Load episode when it changes
  useEffect(() => {
    if (!currentEpisode) {
      console.log('No current episode to load');
      return;
    }
    
    // Check if the episode has a valid file URL
    if (!currentEpisode.episode.file) {
      console.error('Current episode has no file URL');
      return;
    }
    
    // Load the episode with the current time
    audioService.loadEpisode(
      currentEpisode.episode.file,
      currentTime,
      isPlaying
    );
  }, [currentEpisode?.episode.file]);
  
  // Update volume
  useEffect(() => {
    audioService.setVolume(isMuted === 0 ? volume : 0);
  }, [volume, isMuted]);
  
  // Update playback rate
  useEffect(() => {
    audioService.setPlaybackRate(playbackRate);
  }, [playbackRate]);
  
  // Sync time from store to audio
  useEffect(() => {
    const audio = audioService.getAudioElement();
    if (!audio || !currentEpisode) return;
    
    const diff = Math.abs(audio.currentTime - currentTime);
    if (diff > 0.5) {
      audioService.seek(currentTime);
    }
  }, [currentTime, currentEpisode]);
  
  // Update store with current playback time using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !currentEpisode) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }
    
    const audio = audioService.getAudioElement();
    
    const updateProgress = () => {
      if (audio && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
      
      if (audio && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      
      animationFrameId.current = requestAnimationFrame(updateProgress);
    };
    
    animationFrameId.current = requestAnimationFrame(updateProgress);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, currentEpisode, setCurrentTime, setDuration]);
  
  // Save progress periodically
  useEffect(() => {
    if (!isPlaying || !currentEpisode) return;
    
    progressSaveInterval.current = setInterval(() => {
      saveProgress();
    }, 10000);
    
    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [isPlaying, currentEpisode, saveProgress]);
  
  // Check sleep timer
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
  
  // Add keyboard controls
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
          if (currentEpisodeIndex !== null && 
              playlist.length > 0 && 
              currentEpisodeIndex < playlist.length - 1) {
            skipToNext();
          }
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
    skipBackward,
    currentEpisodeIndex,
    playlist
  ]);
  
  // Warn before unloading if playing
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
  
  return { audioElement: audioService.getAudioElement() };
};