/**
 * Environment variable utility functions
 */

/**
 * Check if the application is configured for a new client
 * @returns boolean indicating if the app is configured for a new client
 */
export const isNewClient = (): boolean => {
  return import.meta.env.VITE_NEW_CLIENT === 'true';
};
