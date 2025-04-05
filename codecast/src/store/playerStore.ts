// src/store/playerStore.ts

import { create } from 'zustand';
import { Episode } from '../types';
import { audioService } from '../services/audioService';

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
    const state = get();
    
    // If we're not playing and there's no current episode but we have a playlist,
    // start playing the first episode
    if (!state.isPlaying && !state.currentEpisode && state.playlist.length > 0) {
      set({
        currentEpisode: state.playlist[0],
        currentEpisodeIndex: 0,
        isPlaying: true
      });
      return;
    }
    
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

    // Log current playlist state before modifications for debugging
    console.log("Playlist before playing:", state.playlist.map(p => p.episode.title));
    console.log("Current index before playing:", state.currentEpisodeIndex);

    const existingIndex = state.playlist.findIndex(
      item =>
        item.showId === showId &&
        item.seasonNumber === seasonNumber &&
        item.episode.episode === episode.episode
    );

    const newPlaylist = [...state.playlist];
    const newIndex = existingIndex >= 0 ? existingIndex : newPlaylist.push(episodeItem) - 1;

    console.log(`Playing episode at index ${newIndex}:`, episode.title);

    const savedProgress = state.getEpisodeProgress(showId, seasonNumber, episode.episode);
    const startTime = savedProgress && savedProgress > 0 ? savedProgress : 0;

    set({
      currentEpisode: episodeItem,
      currentEpisodeIndex: newIndex,
      playlist: newPlaylist,
      isPlaying: true,
      currentTime: startTime
    });
    
    // Force the audio service to load the episode directly to ensure it plays
    if (episode.file) {
      setTimeout(() => {
        audioService.loadEpisode(episode.file, startTime, true);
      }, 100);
    }
    
    // Log the updated playlist state for debugging
    setTimeout(() => {
      const currentState = get();
      console.log("Playlist after playing:", currentState.playlist.map(p => p.episode.title));
      console.log("Current index after playing:", currentState.currentEpisodeIndex);
    }, 200);
  },

  /**
   * Appends an episode to the playlist if not already added.
   */
  addToPlaylist: (showId, showTitle, seasonNumber, seasonTitle, episode) => {
    const state = get();
    const newItem = { showId, showTitle, seasonNumber, seasonTitle, episode };

    // Log for debugging
    console.log(`Adding to playlist: ${episode.title}`);
    console.log("Current playlist:", state.playlist.map(p => p.episode.title));

    const isAlreadyInPlaylist = state.playlist.some(
      item =>
        item.showId === showId &&
        item.seasonNumber === seasonNumber &&
        item.episode.episode === episode.episode
    );

    if (isAlreadyInPlaylist) {
      console.log("Episode already in playlist, skipping add");
      return;
    }

    const newPlaylist = [...state.playlist, newItem];
    console.log("New playlist after add:", newPlaylist.map(p => p.episode.title));
    
    // If nothing currently playing, set this as current
    if (state.currentEpisode === null) {
      console.log("No current episode, setting this as current");
      set({
        playlist: newPlaylist,
        currentEpisodeIndex: 0,
        currentEpisode: newItem
      });
    } else {
      set({ playlist: newPlaylist });
    }

    // This alert is now handled by enhanced EpisodeList component
    // with visual feedback instead of browser alert
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
          newCurrentIndex = index;
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
   * IMPROVED: Skips to the next episode in the playlist with direct audio control.
   */
  skipToNext: () => {
    const state = get();
    console.log("skipToNext called, currentEpisodeIndex:", state.currentEpisodeIndex, "playlist length:", state.playlist.length);
    
    // Print full playlist for debugging
    console.log("Current playlist:", state.playlist.map((item, idx) => 
      `${idx}: ${item.episode.title} (${item.episode.file ? 'has file' : 'no file'})`
    ));
    
    // Validate that we have a next episode - with more explicit logging
    if (state.playlist.length === 0) {
      console.log("Playlist is empty, can't skip to next");
      return;
    }
    
    if (state.currentEpisodeIndex === null) {
      console.log("No current episode index, can't determine next");
      // If we have items but no current index, start at the beginning
      if (state.playlist.length > 0) {
        console.log("Starting playlist from beginning");
        const firstItem = state.playlist[0];
        set({
          currentEpisode: firstItem,
          currentEpisodeIndex: 0,
          currentTime: 0,
          isPlaying: true
        });
        
        // Force load the episode with the audio service
        if (firstItem.episode.file) {
          audioService.loadEpisode(firstItem.episode.file, 0, true);
        }
      }
      return;
    }
    
    // Force convert to number to ensure proper comparison
    const currentIndex = Number(state.currentEpisodeIndex);
    
    if (currentIndex >= state.playlist.length - 1) {
      console.log("Already at the last episode, can't skip to next");
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextItem = state.playlist[nextIndex];
    
    console.log(`Moving to next episode at index ${nextIndex}: ${nextItem.episode.title}`);

    // Update state
    set({
      currentEpisode: nextItem,
      currentEpisodeIndex: nextIndex,
      currentTime: 0,
      isPlaying: true
    });
    
    // Force the audio element to update immediately
    if (nextItem.episode.file) {
      console.log(`Setting audio source to: ${nextItem.episode.file}`);
      
      // Directly load and play with audio service
      setTimeout(() => {
        audioService.loadEpisode(nextItem.episode.file, 0, true);
      }, 50);
    } else {
      console.error("Next episode has no file URL!");
    }
  },

  /**
   * IMPROVED: Skips to previous episode or restarts current one with direct audio control.
   */
  skipToPrevious: () => {
    const state = get();
    console.log("skipToPrevious called, currentTime:", state.currentTime);
    
    // If we're more than 3 seconds in, just restart the current track
    if (state.currentTime > 3) {
      console.log("Current time > 3 seconds, restarting current episode");
      set({ currentTime: 0 });
      audioService.seek(0);
      return;
    }

    // Validate that we have a previous episode - with more explicit logging
    if (state.playlist.length === 0) {
      console.log("Playlist is empty, can't skip to previous");
      return;
    }
    
    if (state.currentEpisodeIndex === null) {
      console.log("No current episode index, can't determine previous");
      return;
    }
    
    // Force convert to number to ensure proper comparison
    const currentIndex = Number(state.currentEpisodeIndex);
    
    if (currentIndex <= 0) {
      console.log("Already at the first episode, can't skip to previous");
      return;
    }

    const prevIndex = currentIndex - 1;
    const prevItem = state.playlist[prevIndex];
    
    console.log(`Moving to previous episode at index ${prevIndex}: ${prevItem.episode.title}`);

    // Update state
    set({
      currentEpisode: prevItem,
      currentEpisodeIndex: prevIndex,
      currentTime: 0,
      isPlaying: true
    });
    
    // Force the audio element to update immediately
    if (prevItem.episode.file) {
      console.log(`Setting audio source to: ${prevItem.episode.file}`);
      
      // Directly load and play with audio service
      setTimeout(() => {
        audioService.loadEpisode(prevItem.episode.file, 0, true);
      }, 50);
    } else {
      console.error("Previous episode has no file URL!");
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
    audioService.seek(newTime);
  },

  /**
   * Skips backward in the episode by given seconds.
   */
  skipBackward: seconds => {
    const state = get();
    if (!state.currentEpisode) return;

    const newTime = Math.max(state.currentTime - seconds, 0);
    set({ currentTime: newTime });
    audioService.seek(newTime);
  },

  /**
   * Sets playback volume and persists it.
   */
  setVolume: volume => {
    set({ volume });
    localStorage.setItem('codecast_volume', volume.toString());
    audioService.setVolume(volume);
  },

  /**
   * Toggles mute state based on current volume.
   */
  toggleMute: () => {
    set(state => {
      const newIsMuted = state.isMuted === 0 ? state.volume : 0;
      audioService.setVolume(newIsMuted);
      return { isMuted: newIsMuted };
    });
  },

  /**
   * Sets playback speed and saves to localStorage.
   */
  setPlaybackRate: rate => {
    set({ playbackRate: rate });
    localStorage.setItem('codecast_playback_rate', rate.toString());
    audioService.setPlaybackRate(rate);
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

    // Get current time from audio service if possible, otherwise use state
    const currentAudioTime = audioService.getCurrentTime();
    const timeToSave = isFinite(currentAudioTime) && currentAudioTime > 0 
                      ? currentAudioTime 
                      : state.currentTime;

    const updatedProgress = { ...state.episodeProgress, [key]: timeToSave };
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