// src/services/api.ts
import { Show, ShowPreview, Genre } from '../types';

const BASE_URL = 'https://podcast-api.netlify.app';

/**
 * Fetches all shows from the API
 * @returns Promise with an array of show previews
 */
export const fetchAllShows = async (): Promise<ShowPreview[]> => {
  try {
    const response = await fetch(`${BASE_URL}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all shows:', error);
    throw error;
  }
};

/**
 * Fetches a specific show by ID
 * @param id Show ID
 * @returns Promise with detailed show information
 */
export const fetchShow = async (id: string): Promise<Show> => {
  try {
    const response = await fetch(`${BASE_URL}/id/${id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching show ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches genre information by ID
 * @param id Genre ID
 * @returns Promise with genre information
 */
export const fetchGenre = async (id: number): Promise<Genre> => {
  try {
    const response = await fetch(`${BASE_URL}/genre/${id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching genre ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches all genres from the API
 * Uses the first show's genres to fetch all genre information
 * @returns Promise with an array of genres
 */
export const fetchAllGenres = async (): Promise<Genre[]> => {
  try {
    // First get all shows to extract genre IDs
    const shows = await fetchAllShows();
    
    // Collect unique genre IDs
    const uniqueGenreIds = Array.from(
      new Set(shows.flatMap(show => show.genres))
    );
    
    // Fetch each genre in parallel
    const genrePromises = uniqueGenreIds.map(id => fetchGenre(id));
    return await Promise.all(genrePromises);
  } catch (error) {
    console.error('Error fetching all genres:', error);
    throw error;
  }
};