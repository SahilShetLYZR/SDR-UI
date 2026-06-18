import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EmailLetterPreview from "@/components/templates/EmailLetterPreview";
import { EmailTemplateLibraryItem } from "@/services/templateLibraryService";
import { Pencil } from "lucide-react";

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplateLibraryItem | null;
  onEdit: (t: EmailTemplateLibraryItem) => void;
}

export default function TemplatePreviewDialog({ open, onOpenChange, template, onEdit }: TemplatePreviewDialogProps) {
  if (!template) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-ink">{template.name}</h2>
            <p className="text-xs text-zinc-400">
              {template.tag ? `${template.tag} · ` : ""}Used {template.times_used}×
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEdit(template);
            }}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>
        <div className="mt-4">
          <EmailLetterPreview subject={template.subject} body={template.body} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
