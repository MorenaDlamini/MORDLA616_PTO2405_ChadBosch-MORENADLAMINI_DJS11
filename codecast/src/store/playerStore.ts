// src/store/playerStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Episode, ListenedEpisode } from '../types';
import {
  loadListened,
  saveListened,
  clearListeningHistory,
  loadProgress,
  saveProgress,
  EpisodeProgress as StoredEpisodeProgress, // Renamed to clarify its purpose
} from '../services/storage';

/**
 * Represents the saved progress of a specific episode.
 */
interface EpisodeProgress {
  showId: string;
  seasonNumber: number;
  episodeNumber: number;
  timestamp: number; // Current playback position in seconds
  duration: number;  // Total duration of the episode in seconds
  lastUpdated: string; // ISO timestamp of when progress was last saved
}

/**
 * Tracks detailed listening analytics
 */
interface ListeningSession {
  showId: string;
  episodeId: number;
  startTime: string; // ISO timestamp
  duration: number;  // seconds listened
  completed: boolean;
}

/**
 * Zustand store state for the audio player.
 */
interface PlayerState {
  isPlaying: boolean;
  currentEpisode: {
    showId: string;
    showTitle: string;
    seasonNumber: number;
    seasonTitle: string;
    episode: Episode;
  } | null;
  currentTime: number;
  duration: number;
  volume: number;
  previousVolume: number; // Add this to store previous volume for mute toggle
  isMuted: boolean; // Add this to track mute state
  playbackRate: number; // Track playback speed
  playlist: {
    showId: string;
    showTitle: string;
    seasonNumber: number;
    seasonTitle: string;
    episode: Episode;
  }[]; // Add this to handle next episode functionality
  currentEpisodeIndex: number; // Track current position in playlist
  listenedEpisodes: ListenedEpisode[];
  episodeProgress: EpisodeProgress[]; // Track progress for episodes
  listeningHistory: ListeningSession[]; // Analytics for listening behavior
  sleepTimer: number | null; // Timestamp when playback should stop
}

/**
 * All available actions for the player store.
 */
interface PlayerActions {
  playEpisode: (
    showId: string,
    showTitle: string,
    seasonNumber: number,
    seasonTitle: string,
    episode: Episode,
    episodes?: Episode[] // Optional array of all episodes for playlist
  ) => void;
  togglePlayPause: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void; // Add mute toggle function
  setPlaybackRate: (rate: number) => void; // Control playback speed
  skipToNext: () => void; // Add skip to next episode function
  skipToPrevious: () => void; // Add skip to previous episode function
  skipForward: (seconds: number) => void; // Skip forward by n seconds
  skipBackward: (seconds: number) => void; // Skip backward by n seconds
  markAsCompleted: () => void;
  isCompleted: (showId: string, seasonNumber: number, episodeNumber: number) => boolean;
  resetListeningHistory: () => void;
  saveProgress: () => void;
  getEpisodeProgress: (showId: string, seasonNumber: number, episodeNumber: number) => number | null;
  clearPlaylist: () => void;
  moveInPlaylist: (fromIndex: number, toIndex: number) => void;
  removeFromPlaylist: (index: number) => void;
  setSleepTimer: (minutes: number | null) => void; // Set sleep timer in minutes
  recordListeningSession: () => void; // Record analytics data
}

// Load listening analytics from localStorage
const loadListeningHistory = (): ListeningSession[] => {
  try {
    const data = localStorage.getItem('listeningHistory');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading listening history:', error);
    return [];
  }
};

// Initial state loaded from localStorage
const initialState: PlayerState = {
  isPlaying: false,
  currentEpisode: null,
  currentTime: 0,
  duration: 0,
  volume: 0.75,
  previousVolume: 0.75, // Initialize same as volume
  isMuted: false,
  playbackRate: 1.0,
  playlist: [],
  currentEpisodeIndex: -1,
  listenedEpisodes: loadListened(),
  episodeProgress: loadProgress() as EpisodeProgress[], // Properly cast from StoredEpisodeProgress
  listeningHistory: loadListeningHistory(),
  sleepTimer: null,
};

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  immer((set, get) => ({
    ...initialState,

    /**
     * Starts playing a specific episode and restores saved progress if available.
     */
    playEpisode: (
      showId,
      showTitle,
      seasonNumber,
      seasonTitle,
      episode,
      episodes
    ) => {
      set(state => {
        state.currentEpisode = { showId, showTitle, seasonNumber, seasonTitle, episode };
        state.isPlaying = true;

        const savedProgress = state.episodeProgress.find(
          prog =>
            prog.showId === showId &&
            prog.seasonNumber === seasonNumber &&
            prog.episodeNumber === episode.episode
        );

        state.currentTime = savedProgress?.timestamp ?? 0;
        
        // If episodes array is provided, set up the playlist
        if (episodes && episodes.length > 0) {
          state.playlist = episodes.map(ep => ({
            showId,
            showTitle,
            seasonNumber,
            seasonTitle,
            episode: ep
          }));
          
          // Find the current episode index in the playlist
          state.currentEpisodeIndex = episodes.findIndex(
            ep => ep.episode === episode.episode
          );
        }
      });
    },

    /**
     * Toggles between play and pause states.
     */
    togglePlayPause: () => {
      set(state => {
        state.isPlaying = !state.isPlaying;
      });
    },

    /**
     * Updates the current playback time.
     */
    setCurrentTime: (time) => {
      set(state => {
        state.currentTime = time;
      });
    },

    /**
     * Updates the current episode's total duration.
     */
    setDuration: (duration) => {
      set(state => {
        state.duration = duration;
      });
    },

    /**
     * Sets the player volume (range: 0 to 1).
     */
    setVolume: (volume) => {
      set(state => {
        state.volume = volume;
        // If we're manually changing volume, we're no longer muted
        if (volume > 0) {
          state.isMuted = false;
        } else if (volume === 0) {
          state.isMuted = true;
        }
        // Store the volume value for unmute
        if (volume > 0) {
          state.previousVolume = volume;
        }
      });
    },

    /**
     * Toggle mute/unmute the audio
     */
    toggleMute: () => {
      set(state => {
        if (state.isMuted) {
          // Unmute: restore previous volume
          state.volume = state.previousVolume;
          state.isMuted = false;
        } else {
          // Mute: store current volume and set to 0
          state.previousVolume = state.volume > 0 ? state.volume : 0.75; // Default to 0.75 if already at 0
          state.volume = 0;
          state.isMuted = true;
        }
      });
    },

    /**
     * Sets the playback rate (speed)
     */
    setPlaybackRate: (rate) => {
      set(state => {
        state.playbackRate = rate;
      });
    },

    /**
     * Skip to the next episode in the playlist
     */
    skipToNext: () => {
      const { playlist, currentEpisodeIndex } = get();
      
      if (playlist.length === 0 || currentEpisodeIndex === -1) return;
      
      // Check if there is a next episode
      if (currentEpisodeIndex < playlist.length - 1) {
        const nextEpisode = playlist[currentEpisodeIndex + 1];
        
        set(state => {
          state.currentEpisode = nextEpisode;
          state.currentEpisodeIndex = currentEpisodeIndex + 1;
          state.currentTime = 0;
          state.isPlaying = true;
        });
      }
    },

    /**
     * Skip to the previous episode in the playlist
     */
    skipToPrevious: () => {
      const { playlist, currentEpisodeIndex, currentTime } = get();
      
      if (playlist.length === 0 || currentEpisodeIndex === -1) return;
      
      // If we're more than 3 seconds into the current episode, go back to the beginning
      if (currentTime > 3) {
        set(state => {
          state.currentTime = 0;
        });
      } 
      // Otherwise go to previous episode if available
      else if (currentEpisodeIndex > 0) {
        const prevEpisode = playlist[currentEpisodeIndex - 1];
        
        set(state => {
          state.currentEpisode = prevEpisode;
          state.currentEpisodeIndex = currentEpisodeIndex - 1;
          state.currentTime = 0;
          state.isPlaying = true;
        });
      }
    },

    /**
     * Skip forward by specified number of seconds
     */
    skipForward: (seconds) => {
      const { currentTime, duration } = get();
      const newTime = Math.min(duration, currentTime + seconds);
      
      set(state => {
        state.currentTime = newTime;
      });
    },

    /**
     * Skip backward by specified number of seconds
     */
    skipBackward: (seconds) => {
      const { currentTime } = get();
      const newTime = Math.max(0, currentTime - seconds);
      
      set(state => {
        state.currentTime = newTime;
      });
    },

    /**
     * Saves the current progress of the playing episode to localStorage.
     */
    saveProgress: () => {
      const { currentEpisode, currentTime, duration } = get();
      if (!currentEpisode || currentTime <= 0 || duration <= 0) return;

      set(state => {
        const { showId, seasonNumber, episode } = currentEpisode;
        const episodeNumber = episode.episode;

        const existingIndex = state.episodeProgress.findIndex(
          prog =>
            prog.showId === showId &&
            prog.seasonNumber === seasonNumber &&
            prog.episodeNumber === episodeNumber
        );

        const progressUpdate: EpisodeProgress = {
          showId,
          seasonNumber,
          episodeNumber,
          timestamp: currentTime,
          duration,
          lastUpdated: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          state.episodeProgress[existingIndex] = progressUpdate;
        } else {
          state.episodeProgress.push(progressUpdate);
        }

        saveProgress(state.episodeProgress as StoredEpisodeProgress[]); // Cast to match the storage service type
      });
    },

    /**
     * Retrieves previously saved progress for a given episode.
     *
     * @returns The timestamp in seconds or null if not found
     */
    getEpisodeProgress: (showId, seasonNumber, episodeNumber) => {
      const { episodeProgress } = get();
      const progress = episodeProgress.find(
        prog =>
          prog.showId === showId &&
          prog.seasonNumber === seasonNumber &&
          prog.episodeNumber === episodeNumber
      );

      return progress?.timestamp ?? null;
    },

    /**
     * Marks the current episode as completed and stores it persistently.
     */
    markAsCompleted: () => {
      const { currentEpisode } = get();
      if (!currentEpisode) return;

      set(state => {
        const { showId, seasonNumber, episode } = currentEpisode;
        const episodeNumber = episode.episode;

        const alreadyCompleted = state.listenedEpisodes.some(
          ep =>
            ep.showId === showId &&
            ep.seasonNumber === seasonNumber &&
            ep.episodeNumber === episodeNumber
        );

        if (!alreadyCompleted) {
          state.listenedEpisodes.push({
            showId,
            seasonNumber,
            episodeNumber,
            completedAt: new Date().toISOString(),
          });

          saveListened(state.listenedEpisodes);
        }
      });
    },

    /**
     * Checks whether a specific episode has been marked as completed.
     */
    isCompleted: (showId, seasonNumber, episodeNumber) => {
      return get().listenedEpisodes.some(
        ep =>
          ep.showId === showId &&
          ep.seasonNumber === seasonNumber &&
          ep.episodeNumber === episodeNumber
      );
    },

    /**
     * Clears all listening history and progress from state and localStorage.
     */
    resetListeningHistory: () => {
      set(state => {
        state.listenedEpisodes = [];
        state.episodeProgress = [];
        clearListeningHistory();
      });
    },

    /**
     * Clears the current playlist
     */
    clearPlaylist: () => {
      set(state => {
        state.playlist = [];
        state.currentEpisodeIndex = -1;
      });
    },

    /**
     * Moves an item in the playlist from one position to another
     */
    moveInPlaylist: (fromIndex, toIndex) => {
      set(state => {
        if (
          fromIndex < 0 || 
          fromIndex >= state.playlist.length || 
          toIndex < 0 || 
          toIndex >= state.playlist.length
        ) return;
        
        const item = state.playlist[fromIndex];
        state.playlist.splice(fromIndex, 1);
        state.playlist.splice(toIndex, 0, item);
        
        // Update currentEpisodeIndex if needed
        if (state.currentEpisodeIndex === fromIndex) {
          state.currentEpisodeIndex = toIndex;
        } else if (
          state.currentEpisodeIndex > fromIndex && 
          state.currentEpisodeIndex <= toIndex
        ) {
          state.currentEpisodeIndex--;
        } else if (
          state.currentEpisodeIndex < fromIndex && 
          state.currentEpisodeIndex >= toIndex
        ) {
          state.currentEpisodeIndex++;
        }
      });
    },

    /**
     * Removes an item from the playlist
     */
    removeFromPlaylist: (index) => {
      set(state => {
        if (index < 0 || index >= state.playlist.length) return;
        
        state.playlist.splice(index, 1);
        
        // Update currentEpisodeIndex if needed
        if (index === state.currentEpisodeIndex) {
          // If removing current episode, play next one if available
          if (index < state.playlist.length) {
            state.currentEpisode = state.playlist[index];
          } else if (state.playlist.length > 0) {
            state.currentEpisodeIndex = state.playlist.length - 1;
            state.currentEpisode = state.playlist[state.currentEpisodeIndex];
          } else {
            state.currentEpisodeIndex = -1;
            state.currentEpisode = null;
          }
        } else if (index < state.currentEpisodeIndex) {
          state.currentEpisodeIndex--;
        }
      });
    },

    /**
     * Sets a sleep timer to automatically pause playback
     * @param minutes Number of minutes until playback should stop, or null to cancel
     */
    setSleepTimer: (minutes) => {
      set(state => {
        state.sleepTimer = minutes ? Date.now() + minutes * 60 * 1000 : null;
      });
    },

    /**
     * Records analytics data about the current listening session
     */
    recordListeningSession: () => {
      const { currentEpisode, currentTime, duration } = get();
      if (!currentEpisode) return;

      set(state => {
        const { showId, episode } = currentEpisode;
        const episodeId = episode.episode;

        state.listeningHistory.push({
          showId,
          episodeId,
          startTime: new Date().toISOString(),
          duration: currentTime,
          completed: currentTime >= duration * 0.9, // Mark as completed if listened to 90%
        });
        
        // Store in localStorage
        localStorage.setItem('listeningHistory', JSON.stringify(state.listeningHistory));
      });
    },
  }))
);