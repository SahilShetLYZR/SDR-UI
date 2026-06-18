import { useEffect, useMemo, useState } from "react";
import { Search, Mail, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { templateLibraryService, EmailTemplateLibraryItem } from "@/services/templateLibraryService";
import { formatEmailSubject } from "@/lib/emailFormat";
import { toast } from "sonner";

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the chosen template (usage already recorded). */
  onPick: (template: EmailTemplateLibraryItem) => void;
}

const toExcerpt = (html: string): string =>
  (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function TemplatePickerDialog({ open, onOpenChange, onPick }: TemplatePickerDialogProps) {
  const [templates, setTemplates] = useState<EmailTemplateLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [picking, setPicking] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setIsLoading(true);
    templateLibraryService
      .list()
      .then(setTemplates)
      .catch(() => toast.error("Couldn't load templates"))
      .finally(() => setIsLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || (t.tag || "").toLowerCase().includes(q)
    );
  }, [templates, search]);

  const choose = async (t: EmailTemplateLibraryItem) => {
    try {
      setPicking(t._id);
      // Record usage; fall back to the local copy if the call fails.
      const used = await templateLibraryService.use(t._id).catch(() => t);
      onPick(used);
      onOpenChange(false);
    } finally {
      setPicking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-ink">Start from a template</DialogTitle>
          <DialogDescription>Pick a saved email to prefill this step.</DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-10" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
          ) : templates.length === 0 ? (
            <div className="py-10 text-center">
              <Mail className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-500">No templates yet. Save one from the email editor or the Templates page.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">No templates match "{search}".</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => choose(t)}
                disabled={picking === t._id}
                className="group flex w-full items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-purple-300 hover:bg-purple-50/40 disabled:opacity-60"
              >
                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-purple-600 to-purple-400" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display text-sm text-ink">{formatEmailSubject(t.subject) || t.name}</span>
                    {t.tag && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">{t.tag}</span>}
                  </span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-zinc-500">{toExcerpt(t.body) || t.name}</span>
                </span>
                <Check className="mt-1 h-4 w-4 shrink-0 text-purple-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
