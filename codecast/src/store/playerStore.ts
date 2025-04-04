// src/store/playerStore.ts

import { create } from 'zustand';
import { Episode } from '../types';

/**
 * PlayerEpisode extends Episode by including show and season context.
 */
export interface PlayerEpisode {
  showId: string;
  showTitle: string;
  seasonNumber: number;
  seasonTitle: string;
  episode: Episode;
}

/**
 * Zustand store state and action interface for the audio player.
 */
interface PlayerState {
  // Playback state
  isPlaying: boolean;
  currentEpisode: PlayerEpisode | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: number;
  playbackRate: number;
  sleepTimer: number | null;

  // Playlist management
  playlist: PlayerEpisode[];
  currentEpisodeIndex: number | null;

  // History and progress tracking
  completedEpisodes: Record<string, boolean>;
  episodeProgress: Record<string, number>;

  // Core player actions
  togglePlayPause: () => void;

  // Playlist actions
  playEpisode: (
    showId: string,
    showTitle: string,
    seasonNumber: number,
    seasonTitle: string,
    episode: Episode
  ) => void;
  addToPlaylist: (
    showId: string,
    showTitle: string,
    seasonNumber: number,
    seasonTitle: string,
    episode: Episode
  ) => void;
  removeFromPlaylist: (index: number) => void;
  moveInPlaylist: (fromIndex: number, toIndex: number) => void;
  clearPlaylist: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;

  // Playback manipulation
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  skipForward: (seconds: number) => void;
  skipBackward: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setSleepTimer: (minutes: number | null) => void;

  // Progress tracking
  markAsCompleted: () => void;
  saveProgress: () => void;
  isCompleted: (
    showId: string,
    seasonNumber: number,
    episodeNumber: number
  ) => boolean;
  getEpisodeProgress: (
    showId: string,
    seasonNumber: number,
    episodeNumber: number
  ) => number | null;
  resetShowState: () => void;
}

/**
 * Builds a unique key to track individual episode completion and progress.
 *
 * @param showId - The show identifier
 * @param seasonNumber - Season number
 * @param episodeNumber - Episode number
 * @returns Unique episode key string
 */
const getEpisodeKey = (
  showId: string,
  seasonNumber: number,
  episodeNumber: number
): string => {
  return `${showId}_s${seasonNumber}_e${episodeNumber}`;
};

/**
 * Loads persisted playback state from localStorage.
 * Falls back to defaults on failure.
 */
const loadSavedState = () => {
  try {
    const savedVolume = localStorage.getItem('codecast_volume');
    const savedRate = localStorage.getItem('codecast_playback_rate');
    const savedCompleted = localStorage.getItem('codecast_completed_episodes');
    const savedProgress = localStorage.getItem('codecast_episode_progress');

    return {
      volume: savedVolume ? parseFloat(savedVolume) : 0.8,
      playbackRate: savedRate ? parseFloat(savedRate) : 1.0,
      completedEpisodes: savedCompleted ? JSON.parse(savedCompleted) : {},
      episodeProgress: savedProgress ? JSON.parse(savedProgress) : {}
    };
  } catch (error) {
    console.error('Error loading saved player state:', error);
    return {
      volume: 0.8,
      playbackRate: 1.0,
      completedEpisodes: {},
      episodeProgress: {}
    };
  }
};

const savedState = loadSavedState();

/**
 * Zustand store that manages audio playback state and controls.
 */
export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentEpisode: null,
  currentTime: 0,
  duration: 0,
  volume: savedState.volume,
  isMuted: 0,
  playbackRate: savedState.playbackRate,
  playlist: [],
  currentEpisodeIndex: null,
  completedEpisodes: savedState.completedEpisodes,
  episodeProgress: savedState.episodeProgress,
  sleepTimer: null,

  /**
   * Toggles between play and pause state.
   */
  togglePlayPause: () => {
    set(state => ({
      isPlaying: !state.isPlaying
    }));
  },

  /**
   * Starts playback of a selected episode and resumes progress if available.
   */
  playEpisode: (showId, showTitle, seasonNumber, seasonTitle, episode) => {
    const state = get();
    const episodeItem = { showId, showTitle, seasonNumber, seasonTitle, episode };

    const existingIndex = state.playlist.findIndex(
      item =>
        item.showId === showId &&
        item.seasonNumber === seasonNumber &&
        item.episode.episode === episode.episode
    );

    const newPlaylist = [...state.playlist];
    const newIndex = existingIndex >= 0 ? existingIndex : newPlaylist.push(episodeItem) - 1;

    set({
      currentEpisode: episodeItem,
      currentEpisodeIndex: newIndex,
      playlist: newPlaylist,
      isPlaying: true,
      currentTime: 0
    });

    const savedProgress = state.getEpisodeProgress(showId, seasonNumber, episode.episode);
    if (savedProgress && savedProgress > 0) {
      set({ currentTime: savedProgress });
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        audioElement.currentTime = savedProgress;
      }
    }
  },

  /**
   * Appends an episode to the playlist if not already added.
   */
  addToPlaylist: (showId, showTitle, seasonNumber, seasonTitle, episode) => {
    const state = get();
    const newItem = { showId, showTitle, seasonNumber, seasonTitle, episode };

    const isAlreadyInPlaylist = state.playlist.some(
      item =>
        item.showId === showId &&
        item.seasonNumber === seasonNumber &&
        item.episode.episode === episode.episode
    );

    if (isAlreadyInPlaylist) return;

    set({ playlist: [...state.playlist, newItem] });

    if (state.playlist.length === 0) {
      set({ currentEpisodeIndex: 0 });
    }

    alert(`Added "${episode.title}" to queue`);
  },

  /**
   * Removes an episode from the playlist and adjusts current index.
   */
  removeFromPlaylist: index => {
    const state = get();
    const currentIndex = state.currentEpisodeIndex;
    const newPlaylist = state.playlist.filter((_, i) => i !== index);
    let newCurrentIndex = currentIndex;

    if (currentIndex !== null) {
      if (index === currentIndex) {
        if (newPlaylist.length === 0) {
          set({
            playlist: newPlaylist,
            currentEpisodeIndex: null,
            currentEpisode: null,
            isPlaying: false
          });
          return;
        } else if (index < newPlaylist.length) {
          set({
            playlist: newPlaylist,
            currentEpisodeIndex: newCurrentIndex,
            currentEpisode: newPlaylist[newCurrentIndex]
          });
          return;
        } else {
          newCurrentIndex = newPlaylist.length - 1;
          set({
            playlist: newPlaylist,
            currentEpisodeIndex: newCurrentIndex,
            currentEpisode: newPlaylist[newCurrentIndex]
          });
          return;
        }
      } else if (index < currentIndex) {
        newCurrentIndex = currentIndex - 1;
      }
    }

    set({
      playlist: newPlaylist,
      currentEpisodeIndex: newCurrentIndex
    });
  },

  /**
   * Moves a playlist item from one index to another.
   */
  moveInPlaylist: (fromIndex, toIndex) => {
    const state = get();
    const newPlaylist = [...state.playlist];
    const [movedItem] = newPlaylist.splice(fromIndex, 1);
    newPlaylist.splice(toIndex, 0, movedItem);

    let newCurrentIndex = state.currentEpisodeIndex;
    if (newCurrentIndex !== null) {
      if (newCurrentIndex === fromIndex) {
        newCurrentIndex = toIndex;
      } else if (
        (newCurrentIndex > fromIndex && newCurrentIndex <= toIndex) ||
        (newCurrentIndex < fromIndex && newCurrentIndex >= toIndex)
      ) {
        newCurrentIndex += fromIndex < toIndex ? -1 : 1;
      }
    }

    set({
      playlist: newPlaylist,
      currentEpisodeIndex: newCurrentIndex
    });
  },

  /**
   * Clears the playlist but optionally retains the current episode.
   */
  clearPlaylist: () => {
    const state = get();
    if (state.currentEpisode) {
      set({
        playlist: [state.currentEpisode],
        currentEpisodeIndex: 0
      });
    } else {
      set({
        playlist: [],
        currentEpisodeIndex: null
      });
    }
  },

  /**
   * Skips to the next episode in the playlist if available.
   */
  skipToNext: () => {
    const state = get();
    if (
      state.playlist.length === 0 ||
      state.currentEpisodeIndex === null ||
      state.currentEpisodeIndex >= state.playlist.length - 1
    ) {
      return;
    }

    const nextIndex = state.currentEpisodeIndex + 1;
    const nextItem = state.playlist[nextIndex];

    set({
      currentEpisode: nextItem,
      currentEpisodeIndex: nextIndex,
      currentTime: 0,
      isPlaying: true
    });

    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(err => {
        console.error('Failed to play next episode:', err);
        set({ isPlaying: false });
      });
    }
  },

  /**
   * Skips to previous episode or restarts current one.
   */
  skipToPrevious: () => {
    const state = get();
    if (state.currentTime > 3) {
      set({ currentTime: 0 });
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        audioElement.currentTime = 0;
      }
      return;
    }

    if (
      state.playlist.length === 0 ||
      state.currentEpisodeIndex === null ||
      state.currentEpisodeIndex <= 0
    ) {
      return;
    }

    const prevIndex = state.currentEpisodeIndex - 1;
    const prevItem = state.playlist[prevIndex];

    set({
      currentEpisode: prevItem,
      currentEpisodeIndex: prevIndex,
      currentTime: 0,
      isPlaying: true
    });

    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(err => {
        console.error('Failed to play previous episode:', err);
        set({ isPlaying: false });
      });
    }
  },

  /**
   * Sets the current playback time.
   */
  setCurrentTime: time => {
    set({ currentTime: time });
  },

  /**
   * Sets the total duration of the current episode.
   */
  setDuration: duration => {
    set({ duration });
  },

  /**
   * Skips forward in the episode by given seconds.
   */
  skipForward: seconds => {
    const state = get();
    if (!state.currentEpisode) return;

    const newTime = Math.min(state.currentTime + seconds, state.duration);
    set({ currentTime: newTime });

    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.currentTime = newTime;
    }
  },

  /**
   * Skips backward in the episode by given seconds.
   */
  skipBackward: seconds => {
    const state = get();
    if (!state.currentEpisode) return;

    const newTime = Math.max(state.currentTime - seconds, 0);
    set({ currentTime: newTime });

    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.currentTime = newTime;
    }
  },

  /**
   * Sets playback volume and persists it.
   */
  setVolume: volume => {
    set({ volume });
    localStorage.setItem('codecast_volume', volume.toString());
  },

  /**
   * Toggles mute state based on current volume.
   */
  toggleMute: () => {
    set(state => ({
      isMuted: state.isMuted === 0 ? state.volume : 0
    }));
  },

  /**
   * Sets playback speed and saves to localStorage.
   */
  setPlaybackRate: rate => {
    set({ playbackRate: rate });
    localStorage.setItem('codecast_playback_rate', rate.toString());
  },

  /**
   * Sets or clears the sleep timer.
   */
  setSleepTimer: minutes => {
    if (minutes === null) {
      set({ sleepTimer: null });
    } else {
      const timer = Date.now() + minutes * 60 * 1000;
      set({ sleepTimer: timer });
    }
  },

  /**
   * Marks the current episode as completed and persists the state.
   */
  markAsCompleted: () => {
    const state = get();
    if (!state.currentEpisode) return;

    const { showId, seasonNumber, episode } = state.currentEpisode;
    const key = getEpisodeKey(showId, seasonNumber, episode.episode);

    const updatedCompleted = { ...state.completedEpisodes, [key]: true };
    set({ completedEpisodes: updatedCompleted });
    localStorage.setItem('codecast_completed_episodes', JSON.stringify(updatedCompleted));
  },

  /**
   * Saves playback progress for current episode.
   */
  saveProgress: () => {
    const state = get();
    if (!state.currentEpisode || state.currentTime < 10) return;

    const { showId, seasonNumber, episode } = state.currentEpisode;
    const key = getEpisodeKey(showId, seasonNumber, episode.episode);

    const updatedProgress = { ...state.episodeProgress, [key]: state.currentTime };
    set({ episodeProgress: updatedProgress });
    localStorage.setItem('codecast_episode_progress', JSON.stringify(updatedProgress));
  },

  /**
   * Checks if an episode has been marked as completed.
   */
  isCompleted: (showId, seasonNumber, episodeNumber) => {
    const state = get();
    const key = getEpisodeKey(showId, seasonNumber, episodeNumber);
    return !!state.completedEpisodes[key];
  },

  /**
   * Retrieves saved playback progress for a specific episode.
   */
  getEpisodeProgress: (showId, seasonNumber, episodeNumber) => {
    const state = get();
    const key = getEpisodeKey(showId, seasonNumber, episodeNumber);
    return state.episodeProgress[key] || null;
  },

  /**
   * Resets playback state when leaving a show.
   */
  resetShowState: () => {
    set({
      currentEpisode: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0
    });
  }
}));
