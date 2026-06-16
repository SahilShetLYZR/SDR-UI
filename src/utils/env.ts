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
  // Environment-aware (intentionally ignores VITE_LOCAL_STUDIO_AUTH).
  //
  // On a REAL deployed domain -> false -> use the lyzr-agent SDK, which sends
  // users to the full studio.lyzr.ai sign-in page (Google / LinkedIn / GitHub
  // / Email) and redirects back. This is what every prod user needs (e.g.
  // non-Google sign-ins like Davis couldn't log in via the Google-only popup).
  //
  // On LOCALHOST -> true -> use the Memberstack Google popup. The SDK's
  // studio.lyzr.ai redirect can't complete on localhost: its session cookie is
  // scoped to .lyzr.ai, so localhost lands back with no session and getKeys()
  // fails. The popup avoids the cross-domain round-trip so local dev works.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
      return true;
    }
  }
  return false;
};
