import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import UploadModal from "@/components/knowledgebase/UploadModal";
import EditModal from "@/components/knowledgebase/EditModal";
import Table from "@/components/knowledgebase/Table";
import { KnowledgeBaseService } from '@/services/knowledgeBaseService';
import { KbDocument } from '@/types/knowledgeBase';
import { useToast } from '@/components/ui/use-toast';
import { campaignService } from '@/services/campaignService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const KnowledgeBase: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kbId, setKbId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  // True while we poll for an asynchronously-ingested website to appear.
  const [isIngesting, setIsIngesting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Document currently being edited (null = modal closed) and the website name
  // currently being re-crawled (for the spinner on its button).
  const [editDoc, setEditDoc] = useState<KbDocument | null>(null);
  const [recrawlingName, setRecrawlingName] = useState<string | null>(null);

  const fetchCampaignDetails = async () => {
    if (!campaignId) return;
    
    try {
      const campaigns = await campaignService.getCampaigns();
      const campaign = campaigns.find(c => c._id === campaignId);
      if (campaign && campaign.kb_id) {
        setKbId(campaign.kb_id);
      } else {
        toast({
          title: "Error",
          description: "Could not find knowledge base ID for this campaign",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaign details",
        variant: "destructive"
      });
    }
  };

  const fetchDocuments = async (options?: { silent?: boolean }) => {
    if (!campaignId) return [] as KbDocument[];

    const silent = options?.silent ?? false;
    try {
      if (!silent) setIsLoading(true);
      const docs = await KnowledgeBaseService.getDocumentsByCampaign(campaignId);
      setDocuments(docs);
      return docs;
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to fetch documents",
          variant: "destructive",
        });
      }
      return [] as KbDocument[];
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Website content is ingested in the background, so the document isn't there
  // the instant the upload request returns. Poll quietly until it shows up (or
  // we give up), instead of forcing the user to refresh the page.
  const pollForNewDocument = (baselineCount: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setIsIngesting(true);

    let attempts = 0;
    const maxAttempts = 20; // ~60s at 3s intervals

    const stop = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setIsIngesting(false);
    };

    pollRef.current = setInterval(async () => {
      attempts += 1;
      const docs = await fetchDocuments({ silent: true });
      if (docs.length > baselineCount) {
        stop();
      } else if (attempts >= maxAttempts) {
        stop();
        toast({
          title: "Still processing",
          description: "The website is taking a while to read. It'll appear here once it's done.",
        });
      }
    }, 3000);
  };

  const confirmDelete = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete || !kbId) return;
    
    try {
      await KnowledgeBaseService.deleteDocument(kbId, documentToDelete);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleEdit = (doc: KbDocument) => {
    setEditDoc(doc);
  };

  // Re-crawl a website in place. If the stored URL is known we refresh it
  // directly; legacy entries without a saved URL open the edit modal so the
  // user can supply the address.
  const handleRecrawl = async (doc: KbDocument) => {
    if (!kbId) return;
    if (!doc.doc_link) {
      setEditDoc(doc);
      return;
    }
    try {
      setRecrawlingName(doc.name);
      setIsIngesting(true);
      await KnowledgeBaseService.updateWebsite({
        kb_id: kbId,
        old_name: doc.name,
        source: doc.doc_link,
        urls: [doc.doc_link],
        name: doc.name,
      });
      await fetchDocuments({ silent: true });
      toast({
        title: "Website re-crawled",
        description: "The latest content has been refreshed.",
      });
    } catch (error) {
      console.error('Error re-crawling website:', error);
      toast({
        title: "Re-crawl failed",
        description: "We couldn't re-read that website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRecrawlingName(null);
      setIsIngesting(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      fetchDocuments();
    }
  }, [campaignId]);

  // Stop polling if the user navigates away mid-ingestion.
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="p-6">
      {isIngesting && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reading the website and adding it to your knowledge base. This can take up to a minute.
        </div>
      )}

      <Table
        documents={documents}
        isLoading={isLoading}
        onDelete={confirmDelete}
        onUpload={() => setIsModalOpen(true)}
        onEdit={handleEdit}
        onRecrawl={handleRecrawl}
        recrawlingName={recrawlingName}
      />

      {editDoc && kbId && (
        <EditModal
          document={editDoc}
          kbId={kbId}
          onClose={() => setEditDoc(null)}
          onSaved={() => {
            setEditDoc(null);
            fetchDocuments();
          }}
        />
      )}

      {isModalOpen && (
        <UploadModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(info) => {
            setIsModalOpen(false);
            toast({
              title: "Success",
              description: "Document uploaded successfully",
            });
            if (info?.async) {
              // Background ingestion (website): poll until it appears.
              pollForNewDocument(documents.length);
            } else {
              fetchDocuments();
            }
          }}
          campaignId={campaignId || ''}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document from your knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KnowledgeBase;
