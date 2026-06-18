import { Pencil, Trash2, Copy } from "lucide-react";
import { EmailTemplateLibraryItem } from "@/services/templateLibraryService";
import { formatEmailSubject } from "@/lib/emailFormat";

interface TemplateCardProps {
  template: EmailTemplateLibraryItem;
  onOpen: (t: EmailTemplateLibraryItem) => void;
  onEdit: (t: EmailTemplateLibraryItem) => void;
  onDelete: (t: EmailTemplateLibraryItem) => void;
  index?: number;
}

// Strip tags to a plain-text excerpt for the card body.
const toExcerpt = (html: string): string => {
  if (!html) return "";
  const text = html
    .replace(/<br\s*\/?>(?=)/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

export default function TemplateCard({ template, onOpen, onEdit, onDelete, index = 0 }: TemplateCardProps) {
  const excerpt = toExcerpt(template.body);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md auth-reveal"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      {/* Letterhead accent — grows on hover */}
      <div className="h-1 w-16 bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300 group-hover:w-full" />

      <button
        type="button"
        onClick={() => onOpen(template)}
        className="flex flex-1 flex-col px-5 pb-4 pt-4 text-left"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
            {template.tag?.trim() || "Template"}
          </span>
          {template.times_used > 0 && (
            <span className="text-[11px] text-zinc-400">
              Used {template.times_used}×
            </span>
          )}
        </div>

        <h3 className="font-display text-lg leading-snug text-ink line-clamp-2">
          {formatEmailSubject(template.subject) || template.name}
        </h3>

        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 line-clamp-3">
          {excerpt || "No body yet."}
        </p>
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-2.5">
        <span className="truncate text-[11px] text-zinc-400" title={template.name}>
          {template.name} · {formatDate(template.updated_at)}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onOpen(template)}
            title="Preview"
            aria-label={`Preview ${template.name}`}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(template)}
            title="Edit"
            aria-label={`Edit ${template.name}`}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-purple-50 hover:text-purple-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(template)}
            title="Delete"
            aria-label={`Delete ${template.name}`}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
