import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UploadModal from "@/components/knowledgebase/UploadModal";
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

  const fetchCampaignDetails = async () => {
    if (!campaignId) return;
    
    try {
      const campaigns = await campaignService.getCampaigns();
      const campaign = campaigns.find(c => c._id === campaignId);
      if (campaign && campaign.kb_id) {
        setKbId(campaign.kb_id);
      } else {
        return
        toast({
          title: "Error",
          description: "Could not find knowledge base ID for this campaign!!",
          variant: "destructive"
        });
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

  const fetchDocuments = async () => {
    if (!campaignId) return;
    
    try {
      setIsLoading(true);
      const docs = await KnowledgeBaseService.getDocumentsByCampaign(campaignId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      fetchDocuments();
    }
  }, [campaignId]);

  return (
    <div className="p-6">
      <Table 
        documents={documents}
        isLoading={isLoading}
        onDelete={confirmDelete}
        onUpload={() => setIsModalOpen(true)}
      />

      {isModalOpen && (
        <UploadModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchDocuments();
            toast({
              title: "Success",
              description: "Document uploaded successfully",
            });
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
