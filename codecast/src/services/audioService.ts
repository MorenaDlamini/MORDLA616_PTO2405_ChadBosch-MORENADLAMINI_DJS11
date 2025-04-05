// src/services/audioService.ts

import { usePlayerStore } from '../store/playerStore';

/**
 * Private audio instance singleton.
 * This pattern ensures we maintain a single audio element throughout the application
 * to prevent memory leaks and conflicting audio playback.
 * @private
 */
let audioElement: HTMLAudioElement | null = null;

/**
 * Tracks registered event listeners to prevent attaching duplicates.
 * This is essential when dealing with a singleton that might receive multiple
 * initialization calls from different components.
 * @private
 */
const registeredEvents: Record<string, boolean> = {};

/**
 * Initializes the global audio element singleton if it doesn't exist yet.
 * Uses lazy initialization to ensure the audio element is only created when needed.
 * 
 * @returns {HTMLAudioElement} The singleton audio element instance
 */
const initializeAudio = (): HTMLAudioElement => {
  if (!audioElement) {
    console.log('Creating new global audio element');
    audioElement = new Audio();
    audioElement.preload = 'metadata'; // Only preload metadata for better performance
  }
  return audioElement;
};

/**
 * Registers core event listeners that should only be attached once to the audio element.
 * Handles critical playback events including track completion, metadata loading, and error handling.
 * Uses a guard pattern with the registeredEvents map to prevent duplicate listeners.
 * 
 * @private
 */
const registerCoreEvents = (): void => {
  const audio = initializeAudio();
  
  // Only add these core events once to prevent memory leaks and duplicate handlers
  if (!registeredEvents['core']) {
    // Handle automatic advancing to next track
    audio.addEventListener('ended', () => {
      console.log('Audio ended event in global service');
      
      // First mark the current episode as completed
      const store = usePlayerStore.getState();
      store.markAsCompleted();
      
      // Get the most up-to-date state
      const latestState = usePlayerStore.getState();
      
      // IMPORTANT DEBUG: Log the entire playlist to understand content
      console.log("Current playlist:", JSON.stringify(latestState.playlist.map(p => ({
        showId: p.showId,
        title: p.episode.title,
        file: p.episode.file?.substring(0, 30) + '...' // Truncate for clarity
      }))));
      
      // Detailed logging to help debug the issue
      console.log("Playlist state when track ended:", {
        playlistLength: latestState.playlist.length,
        currentEpisodeIndex: latestState.currentEpisodeIndex,
        hasNextEpisode: latestState.currentEpisodeIndex !== null && 
                       latestState.playlist.length > 0 && 
                       latestState.currentEpisodeIndex < latestState.playlist.length - 1
      });
      
      // Check for next episode - more reliable checking with direct indices
      if (latestState.playlist.length > 0 && 
          latestState.currentEpisodeIndex !== null && 
          Number(latestState.currentEpisodeIndex) < latestState.playlist.length - 1) {
        
        // Get next index and explicitly log it
        const nextIndex = Number(latestState.currentEpisodeIndex) + 1;
        console.log(`Auto-advancing to next episode at index ${nextIndex} of ${latestState.playlist.length - 1}`);
        
        // Get the next track details if available
        if (latestState.playlist[nextIndex]) {
          const nextTrack = latestState.playlist[nextIndex];
          console.log(`Next track will be: ${nextTrack.episode.title} with file ${nextTrack.episode.file?.substring(0, 30) + '...'}`);
          
          // Force update the index before calling skipToNext for safety
          usePlayerStore.setState({
            currentEpisodeIndex: nextIndex - 1, // Ensure skipToNext will work correctly
          });
          
          // Call skipToNext with a delay to ensure state has settled
          setTimeout(() => {
            console.log("Triggering skipToNext after delay");
            usePlayerStore.getState().skipToNext();
          }, 500);
        } else {
          console.error("Next track index exists but item not found in playlist!");
          console.log("Full playlist for debugging:", latestState.playlist);
        }
      } else {
        console.log("No next episode available, stopping playback");
        usePlayerStore.setState({ isPlaying: false });
      }
    });
    
    // Handle metadata loading for duration updates
    audio.addEventListener('loadedmetadata', () => {
      console.log('Audio metadata loaded, setting duration:', audio.duration);
      if (isFinite(audio.duration)) {
        usePlayerStore.getState().setDuration(audio.duration);
      }
    });
    
    // Add error handling - FIX: Removed unused 'e' parameter
    audio.addEventListener('error', () => {
      console.error('Audio error:', audio.error);
      usePlayerStore.setState({ isPlaying: false });
    });
    
    registeredEvents['core'] = true;
  }
};

/**
 * Attempts to start playing the audio with proper error handling.
 * Handles different readyState scenarios to ensure reliable playback:
 * - For ready audio (readyState >= 2), plays immediately
 * - For loading audio, sets up event listeners and timeouts
 * 
 * @returns {Promise<void>} Promise that resolves when play succeeds or rejects on failure
 * @private
 */
const playAudio = (): Promise<void> => {
  const audio = initializeAudio();
  
  // Only attempt to play if we have a source
  if (!audio.src) {
    console.error('Attempted to play audio without a source');
    return Promise.reject(new Error('No audio source'));
  }
  
  // Handle different readyState values
  if (audio.readyState >= 2) {
    // Already loaded enough to play
    return audio.play();
  } else {
    // Wait for the canplay event before playing
    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        console.log('Audio can play, starting playback');
        const playPromise = audio.play();
        playPromise.then(resolve).catch(reject);
        audio.removeEventListener('canplay', onCanPlay);
      };
      
      audio.addEventListener('canplay', onCanPlay);
      
      // Safety timeout to prevent hanging
      setTimeout(() => {
        if (audio.readyState < 2) {
          console.warn('Audio loading timeout, attempting playback anyway');
          try {
            audio.play().then(resolve).catch(reject);
          } catch (e) {
            reject(e);
          }
          audio.removeEventListener('canplay', onCanPlay);
        }
      }, 2000);
    });
  }
};

/**
 * Loads an episode into the audio player with optional position and autoplay settings.
 * Includes defensive programming to handle edge cases:
 * - Validates input URL
 * - Properly resets the audio element
 * - Handles autoplay with appropriate event listeners
 * - Includes timeout fallbacks for reliability
 * 
 * @param {string | null | undefined} audioUrl - URL of the audio file to load
 * @param {number} startTime - Position in seconds to start playback from (default: 0)
 * @param {boolean} autoplay - Whether to automatically start playback after loading (default: false)
 * @returns {boolean} Status indicating if loading was initiated successfully
 * @private
 */
const loadEpisode = (audioUrl: string | null | undefined, startTime: number = 0, autoplay: boolean = false): boolean => {
  // Early return if no URL is provided
  if (!audioUrl) {
    console.log('No audio URL provided to loadEpisode');
    return false;
  }
  
  const audio = initializeAudio();
  registerCoreEvents();
  
  console.log(`Loading episode: ${audioUrl}, startTime: ${startTime}, autoplay: ${autoplay}`);
  
  // Force a clean slate approach - create a new source
  audio.pause();
  
  // We're loading a new episode - reset the audio element first
  try {
    // Using load() resets the media element and restarts the media resource
    audio.src = audioUrl;
    audio.load();
    audio.currentTime = startTime;
    
    if (autoplay) {
      // For auto-play, we need to wait until the audio can play
      const onCanPlay = () => {
        console.log("Audio can play, starting auto-playback");
        audio.play().catch(err => {
          console.error("Auto-play failed:", err);
          usePlayerStore.setState({ isPlaying: false });
        });
        audio.removeEventListener('canplay', onCanPlay);
      };
      
      // Listen for canplay event
      audio.addEventListener('canplay', onCanPlay);
      
      // Safety timeout in case canplay doesn't fire
      setTimeout(() => {
        if (audio.readyState < 3) {
          console.warn("Canplay timeout reached, forcing playback attempt");
          audio.play().catch(err => {
            console.error("Force play attempt failed:", err);
            usePlayerStore.setState({ isPlaying: false });
          });
          audio.removeEventListener('canplay', onCanPlay);
        }
      }, 3000);
    }
    
    return true;
  } catch (error) {
    console.error("Error loading audio:", error);
    usePlayerStore.setState({ isPlaying: false });
    return false;
  }
};

/**
 * Audio Service - Public API
 * 
 * Provides a comprehensive interface for audio playback functionality in the application.
 * Encapsulates the complexity of audio element management and exposes a clean, predictable API.
 * 
 * Implementation uses the singleton pattern to ensure only one audio instance exists
 * throughout the application lifecycle, preventing resource leaks and playback conflicts.
 * 
 * @namespace
 */
export const audioService = {
  /**
   * Retrieves the singleton audio element instance.
   * Guarantees that the same audio element is used across the application.
   * 
   * @returns {HTMLAudioElement} The global HTMLAudioElement instance
   */
  getAudioElement: initializeAudio,
  
  /**
   * Loads an episode into the audio player and prepares it for playback.
   * Handles all the complexity of setting up the audio element with the new source.
   * 
   * @param {string | null | undefined} audioUrl - URL of the audio file to load
   * @param {number} startTime - Position to start from in seconds (default: 0)
   * @param {boolean} autoplay - Whether to start playing automatically (default: false)
   * @returns {boolean} Status indicating if loading was initiated successfully
   */
  loadEpisode,
  
  /**
   * Starts or resumes audio playback.
   * Handles the complexities of audio loading states and browser autoplay restrictions.
   * 
   * @returns {Promise<void>} Promise resolving when playback starts, rejecting on failure
   */
  play: () => playAudio(),
  
  /**
   * Pauses audio playback without resetting position.
   * Safe to call even if no audio is currently playing.
   */
  pause: () => audioElement?.pause(),
  
  /**
   * Seeks to a specific time position in the audio.
   * Updates the currentTime property of the audio element.
   * 
   * @param {number} time - Time in seconds to seek to
   */
  seek: (time: number) => {
    if (audioElement) {
      audioElement.currentTime = time;
    }
  },
  
  /**
   * Sets the audio playback volume.
   * 
   * @param {number} volume - Volume level from 0 (muted) to 1 (maximum)
   */
  setVolume: (volume: number) => {
    if (audioElement) {
      audioElement.volume = volume;
    }
  },
  
  /**
   * Sets the audio playback rate (speed).
   * 
   * @param {number} rate - Playback speed multiplier (1.0 = normal speed)
   */
  setPlaybackRate: (rate: number) => {
    if (audioElement) {
      audioElement.playbackRate = rate;
    }
  },
  
  /**
   * Gets the current playback position.
   * Safely returns 0 if the audio element is not initialized.
   * 
   * @returns {number} Current time in seconds
   */
  getCurrentTime: () => audioElement?.currentTime || 0,
  
  /**
   * Gets the total duration of the current audio.
   * Safely returns 0 if the audio element is not initialized or duration is not available.
   * 
   * @returns {number} Duration in seconds
   */
  getDuration: () => audioElement?.duration || 0,
  
  /**
   * Checks if audio is loaded and ready to play.
   * Verifies that the audio element exists, has a source, and has loaded enough data.
   * 
   * @returns {boolean} Status indicating if audio is ready for playback
   */
  isLoaded: () => !!audioElement && !!audioElement.src && audioElement.readyState >= 2
};