// src/utils/searchUtils.ts

import { ShowPreview } from '../types';

/**
 * Calculates the Levenshtein distance between two strings.
 * This represents the minimum number of single-character edits
 * (insertions, deletions, substitutions) required to transform one string into another.
 *
 * @param a - The first string
 * @param b - The second string
 * @returns The Levenshtein distance
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const distances: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(null));

  // Initialize base cases
  for (let i = 0; i <= a.length; i++) {
    distances[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    distances[0][j] = j;
  }

  // Dynamic programming approach to calculate distance
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        distances[i][j] = distances[i - 1][j - 1];
      } else {
        distances[i][j] = Math.min(
          distances[i - 1][j] + 1,     // deletion
          distances[i][j - 1] + 1,     // insertion
          distances[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return distances[a.length][b.length];
};

/**
 * Performs fuzzy matching between a query string and a target string.
 * Returns a relevance score between 0 and 1, where 1 is an exact match.
 * Uses substring matching and Levenshtein distance as fallback.
 *
 * @param query - The user input to match
 * @param target - The string to be matched against
 * @returns A fuzzy match score from 0 to 1
 */
export const fuzzyMatch = (query: string, target: string): number => {
  if (!query || !target) return 0;

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();

  if (normalizedQuery.length === 0) return 0;

  // Direct substring match with position weighting
  if (normalizedTarget.includes(normalizedQuery)) {
    const position = normalizedTarget.indexOf(normalizedQuery);
    const positionScore = 1 - (position / normalizedTarget.length) * 0.5;
    return Math.min(1, positionScore);
  }

  // Fallback to Levenshtein distance
  const distance = levenshteinDistance(normalizedQuery, normalizedTarget);
  const maxLength = Math.max(normalizedQuery.length, normalizedTarget.length);

  const score = 1 - distance / maxLength;

  // Apply relevance threshold
  return score > 0.3 ? score : 0;
};

/**
 * Performs a fuzzy search on an array of shows using the show's title and description.
 * Results are ranked by similarity score and include shows with a score > 0.
 *
 * @param shows - The array of shows to search
 * @param query - The search input string
 * @returns Array of matched shows with their relevance scores
 */
export const fuzzySearchShows = (
  shows: ShowPreview[],
  query: string
): { show: ShowPreview; score: number }[] => {
  if (!query || query.trim() === '') {
    // No query provided; return all shows with max score
    return shows.map(show => ({ show, score: 1 }));
  }

  const queryWords = query.toLowerCase().trim().split(/\s+/);

  const matchedShows = shows
    .map(show => {
      // Title score (weighted more heavily)
      const titleScore =
        queryWords.reduce((acc, word) => acc + fuzzyMatch(word, show.title) * 2, 0) /
        (queryWords.length * 2);

      // Description score (weighted less heavily)
      const descriptionScore =
        queryWords.reduce((acc, word) => acc + fuzzyMatch(word, show.description), 0) /
        queryWords.length;

      // Weighted composite score
      const combinedScore = titleScore * 0.7 + descriptionScore * 0.3;

      return { show, score: combinedScore };
    })
    .filter(({ score }) => score > 0) // Only include relevant matches
    .sort((a, b) => b.score - a.score); // Sort descending by score

  return matchedShows;
};
