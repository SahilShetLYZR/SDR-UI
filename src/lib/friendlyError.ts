// Translate raw API failures into messages written from the user's point of
// view. Backend `detail` strings are developer-speak ("Email must use the
// domain: x", "Field required") — never show them directly.

interface FriendlyErrorOptions {
  /** Shown when nothing more specific matches. Write it from the user's POV. */
  fallback: string;
}

interface ResponseLike {
  status?: number;
  data?: { detail?: unknown };
}

// The api.ts interceptor rejects with `error.response` (the response object
// itself), while code that bypasses the interceptor throws a full AxiosError
// with a `.response` property. Accept either shape.
function extractResponse(err: unknown): ResponseLike | undefined {
  const e = err as { response?: ResponseLike; status?: number; data?: unknown };
  if (e?.response) return e.response;
  if (typeof e?.status === 'number') return e as ResponseLike;
  return undefined;
}

export function friendlyError(err: unknown, { fallback }: FriendlyErrorOptions): string {
  const response = extractResponse(err);

  // No HTTP response at all — server down, CORS, offline.
  if (!response) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  const status = response.status ?? 0;
  const rawDetail = response.data?.detail;

  // Pydantic validation errors arrive as an array of {msg, loc, ...}.
  if (Array.isArray(rawDetail)) {
    return 'Some required information is missing or invalid. Please check the form and try again.';
  }

  const detail = typeof rawDetail === 'string' ? rawDetail : '';

  if (status === 401 || status === 403) {
    return 'Your session has expired. Please sign in again.';
  }

  const domainMatch = detail.match(/must use the domain:\s*(\S+)/i);
  if (domainMatch) {
    return `Sender emails in this workspace must end with @${domainMatch[1]}.`;
  }

  if (/maximum limit/i.test(detail)) {
    return "You've reached the limit of 10 sender emails. Delete one to add another.";
  }

  const existsMatch = detail.match(/'(.+?)' already exists/i);
  if (existsMatch) {
    return `${existsMatch[1]} is already in your sender list.`;
  }

  if (/name is required/i.test(detail)) {
    return 'Please give this website a name so you can find it later.';
  }

  if (/not found/i.test(detail)) {
    return "We couldn't find that item — it may have already been removed.";
  }

  if (status >= 500) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }

  return fallback;
}
