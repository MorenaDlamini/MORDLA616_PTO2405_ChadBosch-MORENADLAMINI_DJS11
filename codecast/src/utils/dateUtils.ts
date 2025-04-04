// src/utils/dateUtils.ts

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Formats an ISO date string into a full, human-readable date.
 *
 * @param {string} dateString - ISO 8601 date string (e.g., "2024-03-15T12:34:56Z")
 * @returns {string} Formatted date (e.g., "March 15, 2024")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'MMMM d, yyyy');
};

/**
 * Returns the relative time difference between the given date and now.
 *
 * @param {string} dateString - ISO 8601 date string
 * @returns {string} Human-friendly relative time (e.g., "2 days ago")
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Converts a duration in seconds to a MM:SS formatted string.
 *
 * @param {number} seconds - Total number of seconds
 * @returns {string} Time string (e.g., "03:45")
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
