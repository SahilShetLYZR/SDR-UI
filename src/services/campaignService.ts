import api from '@/lib/api';

// API response interface based on the provided sample
export interface ApiCampaign {
  _id: string;
  created_at: string;
  updated_at: string;
  workflow_id: string;
  kb_id: string;
  settings_id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  total_prospects: number;
  total_mails_sent: number;
}

// Request interface for creating a new campaign
export interface CreateCampaignRequest {
  name: string;
}

export const campaignService = {
  /**
   * Get all campaigns
   */
  getCampaigns: async (): Promise<ApiCampaign[]> => {
    try {
      const response = await api.get(`/campaign/`);
      // Handle the paginated response structure
      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      // Fallback in case the response structure is different
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  /**
   * Create a new campaign
   */
  createCampaign: async (data: CreateCampaignRequest): Promise<ApiCampaign> => {
    try {
      const response = await api.post(`/campaign/`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  /**
   * Copy a campaign
   */
  copyCampaign: async (campaignId: string): Promise<ApiCampaign> => {
    try {
      const response = await api.post(`/campaign/copy`, {
        campaign_id: campaignId,
      });
      return response.data;
    } catch (error) {
      console.error('Error copying campaign:', error);
      throw error;
    }
  },

  /**
   * Full clone a campaign
   */
  fullCloneCampaign: async (campaignId: string, name?: string): Promise<ApiCampaign> => {
    try {
      const payload: { campaign_id: string; name?: string } = {
        campaign_id: campaignId,
      };
      
      if (name) {
        payload.name = name;
      }
      
      const response = await api.post(`/campaign/full-clone`, payload);
      return response.data;
    } catch (error) {
      console.error('Error full cloning campaign:', error);
      throw error;
    }
  },

  /**
   * Delete a campaign
   */
  deleteCampaign: async (campaignId: string): Promise<void> => {
    try {
      await api.delete(`/campaign/${campaignId}`);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },
};
