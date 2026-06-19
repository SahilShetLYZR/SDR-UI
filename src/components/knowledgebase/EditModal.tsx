import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { KnowledgeBaseService } from '@/services/knowledgeBaseService';
import { KbDocument } from '@/types/knowledgeBase';
import { X, Globe, FileText, RefreshCw, ExternalLink, Loader2, Upload } from 'lucide-react';
import { normalizeUrl, URL_ERROR_MESSAGE } from '@/lib/url';
import { friendlyError } from '@/lib/friendlyError';

interface EditModalProps {
  document: KbDocument;
  kbId: string;
  onClose: () => void;
  onSaved: () => void;
}

const isWebsite = (doc: KbDocument) => doc.doc_type?.toLowerCase() === 'website';

const EditModal: React.FC<EditModalProps> = ({ document, kbId, onClose, onSaved }) => {
  const { toast } = useToast();
  const website = isWebsite(document);

  const [name, setName] = useState(document.name || '');
  const [url, setUrl] = useState(document.doc_link || '');
  // Kept (not shown as an editable field) so a rename preserves the content.
  const [content, setContent] = useState(document.content || '');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFileUrl, setNewFileUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  const docType = document.doc_type?.toLowerCase();
  const isFile = ['pdf', 'docx', 'txt', 'csv'].includes(docType);
  // Types that render inline in an <iframe> (pdf / text-ish).
  const isInlinePreview = ['pdf', 'txt', 'csv'].includes(docType);

  // Fetch the fed content (and recover the ingested URL) so the preview can
  // show it and a rename preserves it — for entries created before we stored
  // content/doc_link locally. Legacy website entries have no doc_link, so we
  // recover the crawled URL from the RAG store's source metadata.
  const needsUrlBackfill = website && !document.doc_link;
  useEffect(() => {
    if (document.content && !needsUrlBackfill) return;
    let cancelled = false;
    setLoadingContent(true);
    KnowledgeBaseService.getDocumentContent(kbId, document.name, document.doc_link || '')
      .then(({ content: fetchedContent, docLink: recoveredUrl }) => {
        if (cancelled) return;
        if (fetchedContent && !document.content) setContent(fetchedContent);
        // Show what was ingested: fill the URL field for legacy entries that
        // never stored a doc_link. Don't clobber anything the user typed.
        if (recoveredUrl && needsUrlBackfill) setUrl((prev) => prev || recoveredUrl);
      })
      .finally(() => {
        if (!cancelled) setLoadingContent(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document._id]);

  // Object URL for previewing a freshly picked file; revoked on change/unmount.
  useEffect(() => {
    if (!newFile) {
      setNewFileUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(newFile);
    setNewFileUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [newFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewFile(file);
  };

  const recrawlFromUrl = async () => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      toast({ title: 'Check the address', description: URL_ERROR_MESSAGE, variant: 'destructive' });
      return;
    }
    if (!name.trim()) {
      toast({ title: 'Name needed', description: 'Give this website a name.', variant: 'destructive' });
      return;
    }
    try {
      setIsSaving(true);
      await KnowledgeBaseService.updateWebsite({
        kb_id: kbId,
        old_name: document.name,
        source: normalizedUrl,
        urls: [normalizedUrl],
        name: name.trim(),
      });
      toast({ title: 'Website updated', description: "We're re-reading it now — changes appear shortly." });
      onSaved();
    } catch (error) {
      console.error('Error re-crawling website:', error);
      toast({ title: "Couldn't re-crawl", description: friendlyError(error, { fallback: 'Please try again.' }), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    // 1. A new file was chosen → replace the entry's file (any type).
    if (newFile) {
      try {
        setIsSaving(true);
        await KnowledgeBaseService.replaceFile(kbId, document.name, newFile);
        toast({ title: 'File replaced', description: 'The new file has been fed to the agent.' });
        onSaved();
      } catch (error) {
        console.error('Error replacing file:', error);
        toast({ title: "Couldn't replace file", description: friendlyError(error, { fallback: 'Please try again.' }), variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!name.trim()) {
      toast({ title: 'Name needed', description: 'Give this entry a name.', variant: 'destructive' });
      return;
    }

    // 2. Existing content → persist (rename + keep content/URL intact).
    if (content.trim()) {
      const docLink = website ? normalizeUrl(url) || url.trim() : document.doc_link || '';
      try {
        setIsSaving(true);
        await KnowledgeBaseService.updateDocumentContent({
          kb_id: kbId,
          old_name: document.name,
          name: name.trim(),
          content: content.trim(),
          doc_type: document.doc_type,
          doc_link: docLink,
        });
        toast({ title: 'Saved', description: 'Your changes have been saved.' });
        onSaved();
      } catch (error) {
        console.error('Error saving document:', error);
        toast({ title: "Couldn't save", description: friendlyError(error, { fallback: 'Please try again.' }), variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // 3. No content yet: a website can be populated by crawling its URL.
    if (website && url.trim()) {
      await recrawlFromUrl();
      return;
    }

    toast({
      title: 'Nothing to save yet',
      description: website
        ? 'Enter the URL and click Re-crawl, or upload a file.'
        : 'Upload a file to set this entry’s content.',
      variant: 'destructive',
    });
  };

  // Only an absolute http(s) URL is safe to iframe / link. A relative path
  // (e.g. an S3 key) would resolve against the app origin and load the SPA's
  // own 404 page inside the frame — which is exactly the bug being fixed.
  const isAbsoluteUrl = (u?: string) => !!u && /^https?:\/\//i.test(u.trim());
  const websiteLink = isAbsoluteUrl(document.doc_link)
    ? document.doc_link
    : normalizeUrl(url) || (isAbsoluteUrl(url) ? url : '');
  const fileLink = isAbsoluteUrl(document.doc_link) ? document.doc_link : '';
  const canInlineFile = isInlinePreview && !!fileLink;
  const newFileIsPdf = newFile?.type === 'application/pdf' || newFile?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-black" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          {website ? <Globe className="w-5 h-5 text-purple-600" /> : <FileText className="w-5 h-5 text-purple-600" />}
          <h2 className="text-lg font-semibold">Edit knowledge entry</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Preview what the agent uses below. Rename it, replace the file, or re-crawl the URL.
        </p>

        <div className="space-y-4">
          <div>
            <Label>
              Name <span className="text-red-500" aria-hidden>*</span>
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          </div>

          {website && (
            <div>
              <Label>Website URL</Label>
              <div className="flex items-center gap-2">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={recrawlFromUrl}
                  disabled={isSaving || !url.trim()}
                  title="Re-crawl this URL and replace the content with fresh page text"
                  className="shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isSaving ? 'animate-spin' : ''}`} />
                  Re-crawl
                </Button>
              </div>
            </div>
          )}

          {/* Replace file (works for any entry type) */}
          <div>
            <Label>{isFile ? 'Replace file' : 'Replace with a file'}</Label>
            <label
              htmlFor="kb-edit-file"
              className="mt-1 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center text-center px-3">
                <Upload className="w-6 h-6 mb-1 text-gray-500" />
                {newFile ? (
                  <span className="text-sm text-gray-700 truncate max-w-full">{newFile.name}</span>
                ) : (
                  <>
                    <span className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> a replacement</span>
                    <span className="text-xs text-gray-400">PDF, DOCX, TXT, CSV</span>
                  </>
                )}
              </div>
              <input id="kb-edit-file" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt,.csv" />
            </label>
            {newFile && (
              <button type="button" className="mt-1 text-xs text-red-500 hover:text-red-700" onClick={() => setNewFile(null)}>
                Remove selected file
              </button>
            )}
          </div>

          {/* Preview pane — what was fed to the agent */}
          <div>
            <Label className="flex items-center gap-2">
              Preview
              {loadingContent && (
                <span className="flex items-center gap-1 text-xs font-normal text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> loading…
                </span>
              )}
            </Label>
            <div className="mt-1 rounded-lg border border-gray-200 overflow-hidden">
              {newFile ? (
                // Freshly picked file — object URL always renders for PDFs.
                newFileIsPdf && newFileUrl ? (
                  <iframe title="New file preview" src={newFileUrl} className="w-full h-72 bg-white" />
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-600">
                    Selected <span className="font-medium">{newFile.name}</span> — it’ll be used after you save.
                  </div>
                )
              ) : canInlineFile ? (
                // Existing PDF/text with a real (absolute) URL — render it inline.
                <iframe title="Document preview" src={fileLink} className="w-full h-72 bg-white" />
              ) : content ? (
                // The text the agent actually holds. Always correct, never 404s.
                <>
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words p-4 text-sm text-gray-700 font-mono">
                    {content}
                  </pre>
                  {(website ? websiteLink : fileLink) && (
                    <a
                      href={website ? websiteLink : fileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 border-t border-gray-100 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {website ? 'Open website in a new tab' : 'Open original file'}
                    </a>
                  )}
                </>
              ) : (website && websiteLink) || fileLink ? (
                <a
                  href={website ? websiteLink : fileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-purple-700 hover:bg-purple-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  {website ? 'Open website in a new tab' : 'Open original file'}
                </a>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  {loadingContent ? 'Loading what was fed…' : 'No preview yet. Upload a file or re-crawl the URL.'}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-500">
              {isSaving ? 'Saving…' : newFile ? 'Replace file' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
