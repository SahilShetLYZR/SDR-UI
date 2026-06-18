import { useEffect, useMemo, useState } from "react";
import { PlusIcon, Search, Mail } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateEditorDialog from "@/components/templates/TemplateEditorDialog";
import TemplatePreviewDialog from "@/components/templates/TemplatePreviewDialog";
import { templateLibraryService, EmailTemplateLibraryItem } from "@/services/templateLibraryService";
import { toast } from "sonner";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplateLibraryItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewing, setPreviewing] = useState<EmailTemplateLibraryItem | null>(null);
  const [toDelete, setToDelete] = useState<EmailTemplateLibraryItem | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setTemplates(await templateLibraryService.list());
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Couldn't load your templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.tag || "").toLowerCase().includes(q)
    );
  }, [templates, search]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (t: EmailTemplateLibraryItem) => {
    setEditing(t);
    setEditorOpen(true);
  };
  const openPreview = (t: EmailTemplateLibraryItem) => {
    setPreviewing(t);
    setPreviewOpen(true);
  };

  const handleSaved = (saved: EmailTemplateLibraryItem) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t._id === saved._id);
      return exists ? prev.map((t) => (t._id === saved._id ? saved : t)) : [saved, ...prev];
    });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await templateLibraryService.remove(toDelete._id);
      setTemplates((prev) => prev.filter((t) => t._id !== toDelete._id));
      toast.success("Template deleted");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Couldn't delete the template");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        eyebrow="Workspace"
        title="Templates"
        description="Reusable emails you can drop into any campaign step."
        actions={
          templates.length > 0 ? (
            <Button onClick={openNew} className="bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/25">
              <PlusIcon className="h-4 w-4 mr-2" />
              New template
            </Button>
          ) : undefined
        }
      />

      <div className="p-6 flex-1">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <Mail className="h-6 w-6 text-purple-600" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl text-ink">Build your first template</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Save an email once and reuse it across every campaign. Start one here, or click
              "Save as template" from any email step.
            </p>
            <Button onClick={openNew} className="mt-5 bg-purple-600 hover:bg-purple-500">
              <PlusIcon className="h-4 w-4 mr-2" />
              New template
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">No templates match "{search}".</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((t, i) => (
                  <TemplateCard
                    key={t._id}
                    template={t}
                    index={i}
                    onOpen={openPreview}
                    onEdit={openEdit}
                    onDelete={setToDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
        onSaved={handleSaved}
      />
      <TemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={previewing}
        onEdit={openEdit}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" will be removed from your library. Campaigns already using it keep
              their copy. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
