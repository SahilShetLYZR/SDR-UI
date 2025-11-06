import api from '@/lib/api';
import { ApiCampaign } from './campaignService';

export interface AdminStatus {
  is_admin: boolean;
  email: string;
  organization_id: string;
  user_id: string;
}

export interface AdminCampaignsResponse {
  total_items: number;
  page_no: number;
  page_size: number;
  items: ApiCampaign[];
}

export const adminService = {
  checkAdminStatus: async (): Promise<AdminStatus> => {
    try {
      const response = await api.get('/admin/check-admin');
      return response.data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      throw error;
    }
  },

  getAdminCampaigns: async (pageNo: number = 1, pageSize: number = 10): Promise<AdminCampaignsResponse> => {
    try {
      const response = await api.get('/admin/campaigns', {
        params: {
          page_no: pageNo,
          page_size: pageSize,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin campaigns:', error);
      throw error;
    }
  },

  getCampaignAnalytics: async (
    campaignId: string,
    phase?: string,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      const params: any = {};
      if (phase) params.phase = phase;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get(`/admin/campaigns/${campaignId}/analytics`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  },
};


