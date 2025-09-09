// src/services/domainConfigService.ts
import api from '@/lib/api';

// Interface based on the new API response
export interface DomainConfig {
  id: string;
  user_id: string;
  email_id: string;
  created_at: string;
  total_mails_sent: number;
  total_opens: number;
}

// Interface for creating a new email configuration
export interface CreateDomainConfigRequest {
  email_id: string;
}

export const domainConfigService = {
  /**
   * Get all email configurations for the current user
   */
  getDomainConfigs: async (): Promise<DomainConfig[]> => {
    try {
      const response = await api.get<DomainConfig[]>('/domain-configs/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching email configurations:', error);
      throw error; // Re-throw to be caught by the calling component
    }
  },

  /**
   * Create a new email configuration
   */
  createDomainConfig: async (data: CreateDomainConfigRequest): Promise<DomainConfig> => {
    try {
      const response = await api.post<DomainConfig>('/domain-configs/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating email configuration:', error);
      throw error; // Re-throw to be caught by the calling component
    }
  },

  /**
   * Delete an email configuration
   * @param emailId The email address to delete (e.g., user@jazon.lyzr.app)
   */
  deleteDomainConfig: async (emailId: string): Promise<void> => {
    try {
      await api.delete(`/domain-configs/${encodeURIComponent(emailId)}`);
    } catch (error) {
      console.error('Error deleting email configuration:', error);
      throw error;
    }
  }
};
