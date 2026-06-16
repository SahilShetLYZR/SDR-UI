// Lenient URL handling for user-typed web addresses. People type
// "example.com", not "https://example.com" — accept the former and
// normalize instead of rejecting.

/**
 * Returns the normalized URL (https:// prepended when no scheme was given),
 * or null when the input can't be a web address.
 */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    // Require a dot in the hostname so bare words ("homepage") don't pass.
    if (!parsed.hostname.includes('.')) return null;
    return candidate;
  } catch {
    return null;
  }
}

export const URL_ERROR_MESSAGE =
  "That doesn't look like a web address. Try something like example.com.";
