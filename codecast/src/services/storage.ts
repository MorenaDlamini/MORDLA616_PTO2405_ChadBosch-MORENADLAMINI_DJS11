// src/services/storage.ts

import { FavoriteEpisode, ListenedEpisode } from '../types';

/**
 * Keys used in localStorage for persistence.
 */
const FAVORITES_KEY = 'codecast_favorites';
const LISTENED_KEY = 'codecast_listened';
const PROGRESS_KEY = 'codecast_progress';

/**
 * Interface for tracking playback progress of an episode.
 */
export interface EpisodeProgress {
  showId: string;
  seasonNumber: number;
  episodeNumber: number;
  timestamp: number;
  duration: number;
  lastUpdated: string; // ISO 8601 format
}

/**
 * Persist an array of favorite episodes to localStorage.
 * 
 * @param favorites - List of episodes the user marked as favorite
 */
export const saveFavorites = (favorites: FavoriteEpisode[]): void => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
};

/**
 * Load user's favorite episodes from localStorage.
 *
 * @returns Array of favorite episodes or empty array if none exist
 */
export const loadFavorites = (): FavoriteEpisode[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load favorites from storage:', error);
    return [];
  }
};

/**
 * Persist listened episodes (fully played) to localStorage.
 * 
 * @param listened - Episodes the user completed
 */
export const saveListened = (listened: ListenedEpisode[]): void => {
  try {
    localStorage.setItem(LISTENED_KEY, JSON.stringify(listened));
  } catch (error) {
    console.error('Failed to save listened episodes:', error);
  }
};

/**
 * Load the list of completed episodes from localStorage.
 *
 * @returns Array of listened episodes or empty array
 */
export const loadListened = (): ListenedEpisode[] => {
  try {
    const stored = localStorage.getItem(LISTENED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load listened episodes:', error);
    return [];
  }
};

/**
 * Removes all user listening history and episode progress data.
 * Useful for reset functionality or sign-out cleanup.
 */
export const clearListeningHistory = (): void => {
  try {
    localStorage.removeItem(LISTENED_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  } catch (error) {
    console.error('Failed to clear listening history:', error);
  }
};

/**
 * Persist playback progress data for episodes.
 * 
 * @param progress - Array of episode progress objects
 */
export const saveProgress = (progress: EpisodeProgress[]): void => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save episode progress:', error);
  }
};

/**
 * Load playback progress data from localStorage.
 * 
 * @returns An array of progress entries or empty array if none found
 */
export const loadProgress = (): EpisodeProgress[] => {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load episode progress:', error);
    return [];
  }
};
