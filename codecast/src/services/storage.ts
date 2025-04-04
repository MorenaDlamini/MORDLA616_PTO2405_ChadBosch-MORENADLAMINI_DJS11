// src/services/storage.ts

import { FavoriteEpisode, ListenedEpisode } from '../types';

const FAVORITES_KEY = 'codecast_favorites';
const LISTENED_KEY = 'codecast_listened';

/**
 * Saves the given list of favorite episodes to localStorage.
 *
 * @param {FavoriteEpisode[]} favorites - Array of favorite episodes to be saved.
 */
export const saveFavorites = (favorites: FavoriteEpisode[]): void => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

/**
 * Loads the list of favorite episodes from localStorage.
 *
 * @returns {FavoriteEpisode[]} Array of favorite episodes, or an empty array if none found or parsing fails.
 */
export const loadFavorites = (): FavoriteEpisode[] => {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    return storedFavorites ? JSON.parse(storedFavorites) : [];
  } catch (error) {
    console.error('Error loading favorites from localStorage:', error);
    return [];
  }
};

/**
 * Saves the given list of listened episodes to localStorage.
 *
 * @param {ListenedEpisode[]} listened - Array of listened episodes to be saved.
 */
export const saveListened = (listened: ListenedEpisode[]): void => {
  localStorage.setItem(LISTENED_KEY, JSON.stringify(listened));
};

/**
 * Loads the list of listened episodes from localStorage.
 *
 * @returns {ListenedEpisode[]} Array of listened episodes, or an empty array if none found or parsing fails.
 */
export const loadListened = (): ListenedEpisode[] => {
  try {
    const storedListened = localStorage.getItem(LISTENED_KEY);
    return storedListened ? JSON.parse(storedListened) : [];
  } catch (error) {
    console.error('Error loading listened episodes from localStorage:', error);
    return [];
  }
};

/**
 * Clears all listened episode history from localStorage.
 */
export const clearListeningHistory = (): void => {
  localStorage.removeItem(LISTENED_KEY);
};
