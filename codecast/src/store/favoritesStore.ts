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
 * 🧠 Zustand state slice for managing user's favorite episodes.
 */
interface FavoritesState {
  favorites: FavoriteEpisode[];
  sortOption: FavoriteSortOption;
}

/**
 * ✋ Actions for manipulating favorite episodes.
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

  clearAllFavorites: () => void;

  setSortOption: (option: FavoriteSortOption) => void;

  isFavorite: (
    showId: string,
    seasonNumber: number,
    episodeNumber: number
  ) => boolean;
}

/**
 * 📦 Initial state loaded from localStorage
 */
const initialState: FavoritesState = {
  favorites: loadFavorites(),
  sortOption: FavoriteSortOption.ADDED_DESC,
};

/**
 * ✅ Zustand store for favorites, with Immer for immutable logic.
 * Includes full add/remove/sort functionality with persistent storage.
 */
export const useFavoritesStore = create<FavoritesState & FavoritesActions>()(
  immer((set, get) => ({
    ...initialState,

    /**
     * ➕ Adds an episode to favorites if not already added.
     * Episodes are stored with show and season context.
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
     * ❌ Removes a single favorite episode by identity.
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
     * 🧹 Clears all favorite episodes from state and storage.
     */
    clearAllFavorites: () => {
      set(state => {
        state.favorites = [];
        saveFavorites([]);
      });
    },

    /**
     * 🔀 Updates current sorting preference and reorders the list.
     */
    setSortOption: (option) => {
      set(state => {
        state.sortOption = option;
        state.favorites = sortFavorites(state.favorites, option);
      });
    },

    /**
     * ✅ Returns whether a given episode is in the favorites list.
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
 * 📊 Utility to sort favorites based on selected strategy.
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
