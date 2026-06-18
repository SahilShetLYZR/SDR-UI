import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmailLetterPreview from "@/components/templates/EmailLetterPreview";
import {
  templateLibraryService,
  EmailTemplateLibraryItem,
  TemplatePayload,
} from "@/services/templateLibraryService";
import { toast } from "sonner";

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing template to edit; omit to create a new one. */
  template?: EmailTemplateLibraryItem | null;
  /** Prefill for "Save as template" from the email editor. */
  initial?: Partial<TemplatePayload>;
  onSaved: (saved: EmailTemplateLibraryItem) => void;
}

export default function TemplateEditorDialog({
  open,
  onOpenChange,
  template,
  initial,
  onSaved,
}: TemplateEditorDialogProps) {
  const editing = !!template;
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset fields whenever the dialog opens for a different target.
  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? initial?.name ?? "");
    setTag(template?.tag ?? initial?.tag ?? "");
    setSubject(template?.subject ?? initial?.subject ?? "");
    setBody(template?.body ?? initial?.body ?? "");
  }, [open, template, initial]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Give your template a name");
      return;
    }
    const payload: TemplatePayload = { name: name.trim(), subject, body, tag: tag.trim() || null };
    try {
      setSaving(true);
      const saved = editing
        ? await templateLibraryService.update(template!._id, payload)
        : await templateLibraryService.create(payload);
      toast.success(editing ? "Template updated" : "Template saved");
      onSaved(saved);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Couldn't save the template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Form */}
          <div className="flex flex-col p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-ink">
                {editing ? "Edit template" : "New template"}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tpl-name">Name <span className="text-red-500">*</span></Label>
                  <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cold intro" />
                </div>
                <div>
                  <Label htmlFor="tpl-tag">Tag</Label>
                  <Input id="tpl-tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. Follow-up" />
                </div>
              </div>

              <div>
                <Label htmlFor="tpl-subject">Subject</Label>
                <Input id="tpl-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
              </div>

              <div>
                <Label htmlFor="tpl-body">Body</Label>
                <Textarea
                  id="tpl-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the email. Use {{firstName}} and [Company Name] for personalization."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Long dashes and stray markdown are cleaned automatically when you save.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-500 text-white">
                {saving ? "Saving…" : editing ? "Save changes" : "Save template"}
              </Button>
            </div>
          </div>

          {/* Live preview */}
          <div className="hidden md:flex flex-col bg-zinc-50/70 p-6 border-l border-zinc-200">
            <p className="mb-3 font-display text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              Live preview
            </p>
            <EmailLetterPreview subject={subject} body={body} className="shadow-sm" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
