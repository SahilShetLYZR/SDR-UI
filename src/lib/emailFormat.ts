import DOMPurify from "dompurify";

const BLOCK_TAG_RE = /<(p|br|div|table|ul|ol|li|h[1-6]|blockquote|body)[\s/>]/i;
const ANY_TAG_RE = /<[a-zA-Z][^>]*>/;

/**
 * Collapse literal escape sequences (\n, \r, \t, \") left in stored email
 * content by over-escaped LLM JSON output. Idempotent — clean text with real
 * newlines passes through unchanged.
 */
export function unescapeLiteralSequences(raw: string): string {
  return raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"');
}

/** Unescape and collapse to a single line — for email subjects. */
export function formatEmailSubject(raw: string | null | undefined): string {
  if (!raw) return "";
  return unescapeLiteralSequences(raw).split(/\s+/).join(" ").trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Normalize email content for HTML rendering (dangerouslySetInnerHTML):
 * - unescape literal \n sequences from legacy records
 * - block-level HTML passes through untouched
 * - inline-tags-only content gets newlines converted to <br>
 * - pure plain text is HTML-escaped and wrapped into <p> paragraphs with <br>
 * The result is sanitized with DOMPurify, so it is safe to pass to
 * dangerouslySetInnerHTML even for untrusted content (e.g. prospect replies).
 * Idempotent, so content already fixed by the backend is unaffected.
 */
export function formatEmailHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  const content = unescapeLiteralSequences(raw);

  let html: string;
  if (BLOCK_TAG_RE.test(content)) {
    html = content;
  } else if (ANY_TAG_RE.test(content)) {
    html = content.replace(/\n/g, "<br>\n");
  } else {
    html = content
      .trim()
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map(
        (p) =>
          `<p style="margin:0 0 1em 0;">${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`
      )
      .join("");
  }
  return DOMPurify.sanitize(html);
}
