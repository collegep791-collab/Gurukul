/**
 * dateUtils.js
 * 
 * Technical Module: Shared Date & Timezone Utilities
 * Description: Contains helper functions to standardise and correct timezone offsets
 * between backend PostgreSQL (Supabase UTC) timestamps and client-side local times.
 */

/**
 * Helper: Supabase returns timestamps without 'Z' suffix, so new Date() treats them
 * as local time instead of UTC. This ensures correct local time conversion.
 * 
 * @param {string|Date} timestamp - The UTC timestamp or Date object to convert
 * @returns {Date} The converted local Date object
 */
export const toLocalTime = (timestamp) => {
  if (!timestamp) return new Date();
  const str = String(timestamp);
  // If no timezone indicator, append 'Z' to mark as UTC
  if (!str.endsWith('Z') && !str.includes('+') && !/\d{2}:\d{2}$/.test(str.slice(-5))) {
    return new Date(str + 'Z');
  }
  return new Date(str);
};
