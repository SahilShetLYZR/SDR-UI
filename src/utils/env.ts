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

/**
 * Local development mode. When enabled, the UI skips the Lyzr Studio OAuth
 * round-trip (which can't redirect back to localhost) and authenticates with
 * dummy credentials. Pair with the backend's DEV_MODE=true, which ignores the
 * token/api-key values.
 * @returns boolean indicating if local dev auth bypass is enabled
 */
export const isDevMode = (): boolean => {
  return import.meta.env.VITE_DEV_MODE === 'true';
};

/**
 * Real Lyzr Studio sign-in without the lyzr-agent SDK (whose only sign-in
 * path is a studio.lyzr.ai redirect that can't return to localhost, and whose
 * modal covers the designed login page). Authenticates directly via the
 * Memberstack Google popup + Pagos — a real Studio session with the user's
 * own API key. Auth only; no agent provisioning. Used for local dev AND in
 * the production build (set in the Azure deploy workflow) so the designed
 * login page is shown. See src/lib/studioAuth.ts.
 * @returns boolean indicating if Studio popup auth is enabled
 */
export const isLocalStudioAuth = (): boolean => {
  return import.meta.env.VITE_LOCAL_STUDIO_AUTH === 'true';
};
