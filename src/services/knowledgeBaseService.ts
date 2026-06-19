import api from '@/lib/api';
import {
  KbDocument,
  KbTextRequest,
  KbWebsiteRequest,
  KbFileRequest,
  KbWebsiteUpdateRequest,
  KbTextUpdateRequest,
  KbDocumentContentUpdateRequest,
} from '@/types/knowledgeBase';

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
   * Edit / re-crawl a website document. The backend deletes the old document
   * and re-crawls the URL under the (possibly changed) name. Passing the same
   * name + URL is a plain re-crawl.
   */
  updateWebsite: async (data: KbWebsiteUpdateRequest): Promise<KbDocument> => {
    try {
      const response = await api.put(`/kb/website`, {
        kb_id: data.kb_id,
        old_name: data.old_name,
        source: data.source,
        urls: data.urls,
        name: data.name,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating website in knowledge base:', error);
      throw error;
    }
  },

  /**
   * Edit a text document (replaces it: delete old + add new).
   */
  updateText: async (data: KbTextUpdateRequest): Promise<KbDocument> => {
    try {
      const response = await api.put(`/kb/text`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating text in knowledge base:', error);
      throw error;
    }
  },

  /**
   * Replace an existing entry's file (any type) with a newly uploaded one,
   * keeping the entry's name.
   */
  replaceFile: async (kbId: string, oldName: string, file: File): Promise<KbDocument> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.put(
        `/kb/file?kb_id=${encodeURIComponent(kbId)}&old_name=${encodeURIComponent(oldName)}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      console.error('Error replacing file:', error);
      throw error;
    }
  },

  /**
   * Fetch the text (and recovered source URL) the agent holds for a document.
   * Backfills entries created before content/doc_link were stored locally —
   * the RAG store still carries the ingested URL in its source metadata.
   * Returns empty strings if unavailable.
   */
  getDocumentContent: async (
    kbId: string,
    name: string,
    docLink = ""
  ): Promise<{ content: string; docLink: string }> => {
    try {
      const response = await api.get(`/kb/document/content`, {
        params: { kb_id: kbId, name, doc_link: docLink },
      });
      return {
        content: response.data?.content ?? "",
        docLink: response.data?.doc_link ?? "",
      };
    } catch (error) {
      console.error('Error fetching document content:', error);
      return { content: "", docLink: "" };
    }
  },

  /**
   * Manually edit any document's content (user-authored). Preserves the
   * document's type and link; replaces the text fed to the agent.
   */
  updateDocumentContent: async (data: KbDocumentContentUpdateRequest): Promise<KbDocument> => {
    try {
      const response = await api.put(`/kb/document`, {
        kb_id: data.kb_id,
        old_name: data.old_name,
        name: data.name,
        content: data.content,
        doc_type: data.doc_type,
        doc_link: data.doc_link ?? '',
      });
      return response.data;
    } catch (error) {
      console.error('Error updating document content:', error);
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
