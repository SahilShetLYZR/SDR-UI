import { formatEmailHtml, formatEmailSubject } from "@/lib/emailFormat";

interface EmailLetterPreviewProps {
  subject: string;
  body: string;
  /**
   * Optional eyebrow above the subject. Off by default — sender/from is set by
   * the campaign's sending domain at send time, not here, so the preview must
   * not imply a "From" identity.
   */
  eyebrow?: string;
  className?: string;
}

/**
 * The signature element of the template library: an email rendered as a real
 * piece of correspondence. A thin letterhead rule, the subject set as a
 * Fraunces display headline, then the body as readable prose at a comfortable
 * measure — so a template reads like a letter, not a form field.
 */
export default function EmailLetterPreview({
  subject,
  body,
  eyebrow,
  className = "",
}: EmailLetterPreviewProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white ${className}`}>
      {/* Letterhead accent */}
      <div className="h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-transparent" />
      <div className="px-7 py-6">
        {eyebrow && (
          <p className="font-display text-[11px] uppercase tracking-[0.18em] text-purple-500/80">
            {eyebrow}
          </p>
        )}
        <h3 className="font-display text-2xl leading-snug text-ink">
          {formatEmailSubject(subject) || "Untitled subject"}
        </h3>
        <div className="mt-4 h-px w-12 bg-zinc-200" />
        {body?.trim() ? (
          <div
            className="prose-email mt-4 max-w-[62ch] text-[15px] leading-relaxed text-zinc-700 [&_a]:text-purple-600 [&_a]:underline [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: formatEmailHtml(body) }}
          />
        ) : (
          <p className="mt-4 text-sm italic text-zinc-400">No body yet.</p>
        )}
      </div>
    </div>
  );
}
