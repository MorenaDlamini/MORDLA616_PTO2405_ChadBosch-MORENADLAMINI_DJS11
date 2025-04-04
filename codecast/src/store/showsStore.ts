// src/store/showsStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  ShowPreview,
  Show,
  Genre,
  ShowSortOption,
  ApiStatus,
} from '../types';
import {
  fetchAllShows,
  fetchShow,
  fetchAllGenres,
} from '../services/api';

/**
 * State structure for shows-related data.
 */
interface ShowsState {
  shows: ShowPreview[];
  filteredShows: ShowPreview[];
  currentShow: Show | null;
  genres: Genre[];
  selectedGenre: number | null;
  sortOption: ShowSortOption;
  status: ApiStatus;
  error: string | null;
}

/**
 * Actions and async handlers for the shows store.
 */
interface ShowsActions {
  fetchShows: () => Promise<void>;
  fetchShowById: (id: string) => Promise<void>;
  fetchGenres: () => Promise<void>;
  setSortOption: (option: ShowSortOption) => void;
  setGenreFilter: (genreId: number | null) => void;
  resetShowState: () => void;
}

/**
 * Initial Zustand store state for show management.
 */
const initialState: ShowsState = {
  shows: [],
  filteredShows: [],
  currentShow: null,
  genres: [],
  selectedGenre: null,
  sortOption: ShowSortOption.TITLE_ASC,
  status: 'idle',
  error: null,
};

/**
 * Zustand store for managing podcast shows, filtering, and UI state.
 */
export const useShowsStore = create<ShowsState & ShowsActions>()(
  immer((set, get) => ({
    ...initialState,

    /**
     * Fetches all shows and initializes both full and filtered lists.
     */
    fetchShows: async () => {
      try {
        set({ status: 'loading' });

        const shows = await fetchAllShows();
        const sortedShows = sortShows(shows, ShowSortOption.TITLE_ASC);

        set(state => {
          state.shows = sortedShows;
          state.filteredShows = sortedShows;
          state.status = 'success';
          state.error = null;
        });
      } catch (error) {
        set({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    /**
     * Fetches detailed information about a single show by ID.
     * @param id - Show ID
     */
    fetchShowById: async (id: string) => {
      try {
        set({ status: 'loading' });

        const show = await fetchShow(id);

        set(state => {
          state.currentShow = show;
          state.status = 'success';
          state.error = null;
        });
      } catch (error) {
        set({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    /**
     * Fetches all genres and updates state.
     */
    fetchGenres: async () => {
      try {
        set({ status: 'loading' });

        const genres = await fetchAllGenres();

        set(state => {
          state.genres = genres;
          state.status = 'success';
          state.error = null;
        });
      } catch (error) {
        set({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    /**
     * Updates the current sort option and re-sorts the filtered shows.
     * @param option - Sorting preference
     */
    setSortOption: (option: ShowSortOption) => {
      set(state => {
        state.sortOption = option;
        state.filteredShows = sortShows(state.filteredShows, option);
      });
    },

    /**
     * Applies a genre filter to the shows list.
     * @param genreId - Genre ID to filter by, or null to remove filter
     */
    setGenreFilter: (genreId: number | null) => {
      set(state => {
        state.selectedGenre = genreId;

        const filtered = genreId === null
          ? state.shows
          : state.shows.filter(show => show.genres.includes(genreId));

        state.filteredShows = sortShows(filtered, state.sortOption);
      });
    },

    /**
     * Resets the current show details in state.
     */
    resetShowState: () => {
      set(state => {
        state.currentShow = null;
      });
    },
  }))
);

/**
 * Sorts a list of shows according to the provided sort option.
 *
 * @param shows - Array of shows to sort
 * @param option - Selected sort option
 * @returns Sorted array of shows
 */
const sortShows = (
  shows: ShowPreview[],
  option: ShowSortOption
): ShowPreview[] => {
  const showsCopy = [...shows];

  switch (option) {
    case ShowSortOption.TITLE_ASC:
      return showsCopy.sort((a, b) => a.title.localeCompare(b.title));
    case ShowSortOption.TITLE_DESC:
      return showsCopy.sort((a, b) => b.title.localeCompare(a.title));
    case ShowSortOption.UPDATED_ASC:
      return showsCopy.sort(
        (a, b) => new Date(a.updated).getTime() - new Date(b.updated).getTime()
      );
    case ShowSortOption.UPDATED_DESC:
      return showsCopy.sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
    default:
      return showsCopy;
  }
};
