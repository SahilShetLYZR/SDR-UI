import api from '@/lib/api';
import { KbDocument, KbTextRequest, KbWebsiteRequest, KbFileRequest } from '@/types/knowledgeBase';

export const KnowledgeBaseService = {
  /**
   * Get documents by campaign ID
   * @param campaignId - The campaign ID
   */
  getDocumentsByCampaign: async (campaignId: string): Promise<KbDocument[]> => {
    try {
      const response = await api.get(`/kb/documents/by-campaign/${campaignId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents by campaign:', error);
      throw error;
    }
  },

  /**
   * Add text to knowledge base
   * @param data - Text data to add
   */
  addText: async (data: KbTextRequest): Promise<KbDocument> => {
    try {
      const response = await api.post(`/kb/text`, data);
      return response.data;
    } catch (error) {
      console.error('Error adding text to knowledge base:', error);
      throw error;
    }
  },

  /**
   * Add website to knowledge base
   * @param data - Website data to add including optional name
   */
  addWebsite: async (data: KbWebsiteRequest): Promise<KbDocument> => {
    try {
      // Create payload with all required fields and optional name if provided
      const payload = {
        kb_id: data.kb_id,
        source: data.source,
        urls: data.urls,
        ...(data.name ? { name: data.name } : {})
      };
      
      const response = await api.post(`/kb/website`, payload);
      return response.data;
    } catch (error) {
      console.error('Error adding website to knowledge base:', error);
      throw error;
    }
  },

  /**
   * Add file to knowledge base
   * @param kbId - The knowledge base ID
   * @param file - The file to upload
   */
  addFile: async (kbId: string, file: File): Promise<KbDocument> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/kb/file?kb_id=${kbId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding file to knowledge base:', error);
      throw error;
    }
  },

  /**
   * Delete document from knowledge base
   * @param kbId - The knowledge base ID
   * @param documentId - The document ID to delete
   */
  deleteDocument: async (kbId: string, documentId: string): Promise<void> => {
    try {
      await api.delete(`/kb/documents`, {
        data: {
          kb_id: kbId,
          sources: [documentId]
        }
      });
    } catch (error) {
      console.error('Error deleting document from knowledge base:', error);
      throw error;
    }
  }
};
