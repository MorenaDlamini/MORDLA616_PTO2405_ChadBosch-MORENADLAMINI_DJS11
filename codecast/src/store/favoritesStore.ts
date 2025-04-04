// src/store/favoritesStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  FavoriteEpisode,
  FavoriteSortOption,
  Episode,
} from '../types';
import {
  loadFavorites,
  saveFavorites,
} from '../services/storage';

/**
 * Zustand store state for managing favorite episodes.
 */
interface FavoritesState {
  favorites: FavoriteEpisode[];
  sortOption: FavoriteSortOption;
}

/**
 * Store actions for interacting with the favorites state.
 */
interface FavoritesActions {
  addFavorite: (
    showId: string,
    showTitle: string,
    seasonNumber: number,
    seasonTitle: string,
    episode: Episode
  ) => void;

  removeFavorite: (
    showId: string,
    seasonNumber: number,
    episodeNumber: number
  ) => void;

  setSortOption: (option: FavoriteSortOption) => void;

  isFavorite: (
    showId: string,
    seasonNumber: number,
    episodeNumber: number
  ) => boolean;
}

/**
 * Initial state, loading persisted favorites from localStorage.
 */
const initialState: FavoritesState = {
  favorites: loadFavorites(),
  sortOption: FavoriteSortOption.ADDED_DESC,
};

/**
 * Zustand store for managing user's favorite podcast episodes.
 */
export const useFavoritesStore = create<FavoritesState & FavoritesActions>()(
  immer((set, get) => ({
    ...initialState,

    /**
     * Adds a new episode to favorites if it doesn't already exist.
     */
    addFavorite: (
      showId,
      showTitle,
      seasonNumber,
      seasonTitle,
      episode
    ) => {
      set(state => {
        const exists = state.favorites.some(
          fav =>
            fav.showId === showId &&
            fav.seasonNumber === seasonNumber &&
            fav.episode.episode === episode.episode
        );

        if (!exists) {
          const newFavorite: FavoriteEpisode = {
            showId,
            showTitle,
            seasonNumber,
            seasonTitle,
            episode,
            addedAt: new Date().toISOString(),
          };

          state.favorites.push(newFavorite);
          state.favorites = sortFavorites(state.favorites, state.sortOption);

          saveFavorites(state.favorites);
        }
      });
    },

    /**
     * Removes an episode from favorites.
     */
    removeFavorite: (showId, seasonNumber, episodeNumber) => {
      set(state => {
        state.favorites = state.favorites.filter(
          fav =>
            !(
              fav.showId === showId &&
              fav.seasonNumber === seasonNumber &&
              fav.episode.episode === episodeNumber
            )
        );

        saveFavorites(state.favorites);
      });
    },

    /**
     * Sets the current sort option and re-sorts the favorites list.
     */
    setSortOption: (option) => {
      set(state => {
        state.sortOption = option;
        state.favorites = sortFavorites(state.favorites, option);
      });
    },

    /**
     * Checks if a specific episode is marked as a favorite.
     */
    isFavorite: (showId, seasonNumber, episodeNumber) => {
      return get().favorites.some(
        fav =>
          fav.showId === showId &&
          fav.seasonNumber === seasonNumber &&
          fav.episode.episode === episodeNumber
      );
    },
  }))
);

/**
 * Sorts favorite episodes based on the selected sort option.
 *
 * @param favorites - List of favorite episodes
 * @param option - Sorting preference
 * @returns Sorted list of favorites
 */
const sortFavorites = (
  favorites: FavoriteEpisode[],
  option: FavoriteSortOption
): FavoriteEpisode[] => {
  const favoritesCopy = [...favorites];

  switch (option) {
    case FavoriteSortOption.TITLE_ASC:
      return favoritesCopy.sort((a, b) => {
        const titleCompare = a.showTitle.localeCompare(b.showTitle);
        if (titleCompare !== 0) return titleCompare;
        if (a.seasonNumber !== b.seasonNumber) {
          return a.seasonNumber - b.seasonNumber;
        }
        return a.episode.episode - b.episode.episode;
      });

    case FavoriteSortOption.TITLE_DESC:
      return favoritesCopy.sort((a, b) => {
        const titleCompare = b.showTitle.localeCompare(a.showTitle);
        if (titleCompare !== 0) return titleCompare;
        if (a.seasonNumber !== b.seasonNumber) {
          return b.seasonNumber - a.seasonNumber;
        }
        return b.episode.episode - a.episode.episode;
      });

    case FavoriteSortOption.ADDED_ASC:
      return favoritesCopy.sort(
        (a, b) =>
          new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
      );

    case FavoriteSortOption.ADDED_DESC:
      return favoritesCopy.sort(
        (a, b) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );

    default:
      return favoritesCopy;
  }
};
