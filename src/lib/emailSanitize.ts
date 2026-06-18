/**
 * Frontend mirror of the backend deterministic email sanitizer
 * (Jazon-SDR/lib/text/email_sanitizer.py).
 *
 * The backend strips AI-slop (em/en dashes, leaked markdown, random bold,
 * cliche openers, ragged spacing) on generation and on every edit, so freshly
 * produced templates are already clean. This module exists so that:
 *   1. legacy templates persisted before the backend fix still *display*
 *      cleanly in the editor without waiting for a re-save, and
 *   2. the editor preview matches what will actually be sent.
 *
 * Apply this ONLY to our own outbound/template content — never to inbound
 * prospect replies, whose words must be shown verbatim.
 *
 * Pure and idempotent: sanitize(sanitize(x)) === sanitize(x).
 */

const UNICODE_DASHES = /[–—―]/;

function stripDashes(text: string): string {
  return text
    .replace(/(?<=\d)[ \t]*[–—―][ \t]*(?=\d)/g, "-") // numeric range stays a range
    .replace(/[ \t]*[–—―][ \t]*/g, ", ") // prose dash → comma break (keeps newlines)
    .replace(/ +-- +/g, ", ")
    .replace(/(?<=\w)--(?=\w)/g, ", ");
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*\n]+?)\*\*/g, "$1")
    .replace(/__([^_\n]+?)__/g, "$1")
    .replace(/(?<![\w*])\*([^*\n]+?)\*(?![\w*])/g, "$1")
    .replace(/\*\*+/g, "");
}

function unwrapEmphasis(text: string): string {
  return text.replace(/<\/?(?:b|strong|i|em)(?:\s[^>]*)?>/gi, "");
}

const SLOP_PHRASES = [
  "I hope this email finds you well",
  "I hope this message finds you well",
  "I hope this note finds you well",
  "I hope this finds you well",
  "I hope you are doing well",
  "I hope you're doing well",
  "I hope all is well",
  "I trust this email finds you well",
  "I trust this message finds you well",
  "in today's fast-paced world",
  "in today's fast paced world",
  "in today's digital age",
  "in this day and age",
  "at the end of the day",
  "without further ado",
  "needless to say",
  "it goes without saying",
];

const SLOP_PATTERNS = SLOP_PHRASES.map(
  (p) =>
    new RegExp(
      p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+") +
        "[\\s,.;:!—–-]*",
      "gi"
    )
);

const BUZZWORDS: Array<[RegExp, string]> = [
  [/\bleverage(d|s)?\b/gi, "use"],
  [/\butiliz(e|es|ed)\b/gi, "use"],
  [/\bin order to\b/gi, "to"],
  [/\b(?:a\s+)?myriad of\b/gi, "many"],
  [/\b(?:a\s+)?plethora of\b/gi, "many"],
];

function stripSlop(text: string): string {
  for (const re of SLOP_PATTERNS) text = text.replace(re, "");
  for (const [re, rep] of BUZZWORDS) text = text.replace(re, rep);
  return text;
}

function punctuationCleanup(text: string): string {
  return text
    .replace(/,(?:\s*,)+/g, ", ")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/^[ \t]*[,;:]+[ \t]*/gm, "");
}

function recapitalize(text: string): string {
  return text.replace(
    /(^|[.!?]\s+|\n\s*)([a-z])/g,
    (_m, p1, p2) => p1 + p2.toUpperCase()
  );
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+(?=\n)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Clean a body of text (plain or with inline HTML). */
export function sanitizeEmailText(text: string | null | undefined): string {
  if (!text) return "";
  let t = stripMarkdown(text);
  t = stripDashes(t);
  t = unwrapEmphasis(t);
  t = stripSlop(t);
  t = punctuationCleanup(t);
  t = recapitalize(t);
  return normalizeWhitespace(t);
}

/** Clean a subject line and force it onto a single line. */
export function sanitizeEmailSubject(text: string | null | undefined): string {
  if (!text) return "";
  let t = stripMarkdown(text);
  t = stripDashes(t);
  t = unwrapEmphasis(t);
  t = stripSlop(t);
  t = punctuationCleanup(t);
  t = recapitalize(t);
  return t.split(/\s+/).join(" ").trim();
}

/** True if the text still contains obvious AI-slop artifacts (for hints/badges). */
export function hasAiSlop(text: string | null | undefined): boolean {
  if (!text) return false;
  if (UNICODE_DASHES.test(text)) return true;
  if (/\*\*|__/.test(text)) return true;
  return SLOP_PATTERNS.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}
