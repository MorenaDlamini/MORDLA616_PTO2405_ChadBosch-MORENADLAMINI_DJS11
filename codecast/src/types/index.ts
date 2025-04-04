// src/types/index.ts

/**
 * Represents a summarized preview of a podcast show from the main API.
 */
export interface ShowPreview {
    id: string;
    title: string;
    description: string;
    image: string;
    seasons: number;
    genres: number[];
    updated: string; // ISO 8601 date string
  }
  
  /**
   * Represents detailed show information, including seasons and episodes.
   */
  export interface Show extends Omit<ShowPreview, 'seasons'> {
    seasons: Season[];
  }
  
  /**
   * Represents a season of a podcast show.
   */
  export interface Season {
    season: number;
    title: string;
    image: string;
    episodes: Episode[];
  }
  
  /**
   * Represents an individual podcast episode.
   */
  export interface Episode {
    title: string;
    description: string;
    episode: number;
    file: string; // URL to the audio file
  }
  
  /**
   * Represents a podcast genre/category.
   */
  export interface Genre {
    id: number;
    title: string;
  }
  
  /**
   * Represents an episode that has been marked as a favorite by the user.
   */
  export interface FavoriteEpisode {
    showId: string;
    showTitle: string;
    seasonNumber: number;
    seasonTitle: string;
    episode: Episode;
    addedAt: string; // ISO 8601 date string
  }
  
  /**
   * Represents tracking data for an episode the user has listened to.
   */
  export interface ListenedEpisode {
    showId: string;
    seasonNumber: number;
    episodeNumber: number;
    completedAt: string; // ISO 8601 date string
  }
  
  /**
   * Enum for available sorting options when displaying podcast shows.
   */
  export enum ShowSortOption {
    TITLE_ASC = 'title_asc',
    TITLE_DESC = 'title_desc',
    UPDATED_ASC = 'updated_asc',
    UPDATED_DESC = 'updated_desc',
  }
  
  /**
   * Enum for available sorting options when displaying favorites.
   */
  export enum FavoriteSortOption {
    TITLE_ASC = 'title_asc',
    TITLE_DESC = 'title_desc',
    ADDED_ASC = 'added_asc',
    ADDED_DESC = 'added_desc',
  }
  
  /**
   * Represents the status of an API request.
   */
  export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';
  