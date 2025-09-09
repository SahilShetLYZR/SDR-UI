import api from '@/lib/api';
import { ProspectsResponse, ProspectListParams, Prospect as ProspectType } from '@/types/prospects';

/**
 * Interface for a prospect's details
 */
export interface ProspectDetails {
  id: string;
  name: string;
  email: string;
  company?: string;
  organization?: string;
  company_name?: string;
  position?: string;
  designation?: string;
  linkedin_url?: string;
  created_at: string;
  campaign_id: string;
  is_active: boolean;
  unsubscribed: boolean;
  total_mails?: number;
  total_replies?: number;
  total_opens?: number;
  last_open_timestamp?: string;
  engagement_score?: number;
  engagement_status?: string;
  warm_timestamp?: string | null;
  hot_timestamp?: string | null;
  phase?: string;
}

/**
 * Interface for a campaign prospect
 */
export interface CampaignProspect {
  id: string;
  name: string;
  email: string;
  company?: string;
  position?: string;
  linkedin_url?: string;
  created_at: string;
  campaign_id: string;
  is_active: boolean;
  unsubscribed: boolean;
  total_mails?: number;
  total_replies?: number;
  total_opens?: number;
  last_open_timestamp?: string;
  engagement_score?: number;
  engagement_status?: string;
  sequence_status?: string;
  phase?: string;
  warm_timestamp?: string | null;
  hot_timestamp?: string | null;
}

/**
 * Interface for a prospect
 */
export interface Prospect {
  id?: string;
  name: string;
  email: string;
  company_name?: string;
  organization?: string;
  designation?: string;
  position?: string;
  linkedin_url?: string;
  created_at?: string;
  engagement_score?: number;
  engagement_status?: string;
  sequence_status?: string;
  is_active?: boolean;
  unsubscribed?: boolean;
}

/**
 * Interface for paginated prospects response
 */
export interface PaginatedProspectsResponse {
  prospects: CampaignProspect[];
  pagination: {
    total: number;
    total_pages: number;
    current_page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Interface for adding a prospect to a campaign
 */
export interface AddProspectRequest {
  campaign_id: string;
  prospect: Prospect;
}

/**
 * Interface for updating multiple prospects
 */
export interface UpdateProspectsRequest {
  campaign_id: string;
  prospects: {
    id: string;
    email: string;
    name?: string;
    organization?: string;
    company_name?: string;
    designation?: string;
    position?: string;
    linkedin_url?: string;
  }[];
}

/**
 * Interface for removing prospects
 */
export interface RemoveProspectsRequest {
  campaign_id: string;
  prospect_ids: string[];
}

/**
 * Service class for handling prospect-related API calls
 */
export class ProspectsService {
  /**
   * Fetches prospects list with pagination and search
   * @param params - Query parameters for the API
   * @returns Promise with prospects response
   */
  static async getProspects(params: ProspectListParams): Promise<ProspectsResponse> {
    try {
      if (!params.campaignId) {
        throw new Error('Campaign ID is required');
      }
      
      const response = await api.get(`/prospects/campaign/${params.campaignId}`, {
        params: {
          page_no: params.page || 1,
          page_size: params.size || 10
        }
      });
      
      // Transform the campaign prospects to match the expected ProspectsResponse format
      const campaignProspects = response.data || [];
      const transformedItems: ProspectType[] = Array.isArray(campaignProspects) 
        ? campaignProspects.map(item => ({
            id: item._id || item.prospect_id,
            name: item.prospect_details ? 
              item.prospect_details.name || 
              `${item.prospect_details.first_name || ''} ${item.prospect_details.last_name || ''}`.trim() : '',
            email: item.prospect_details ? item.prospect_details.email : '',
            organization: item.prospect_details ? 
              item.prospect_details.organization || item.prospect_details.company_name || '' : '',
            designation: item.prospect_details ? 
              item.prospect_details.designation || item.prospect_details.position || '' : '',
            engagementScore: item.engagement_score || 0,
            engagementStatus: item.engagement_status || '',
            sequenceStatus: item.phase || item.sequence_status || '' // Map phase to sequenceStatus, fallback to sequence_status
          }))
        : [];
      
      const transformedResponse: ProspectsResponse = {
        items: transformedItems,
        total: transformedItems.length,
        page: params.page || 1,
        size: params.size || 10,
        pages: Math.ceil(transformedItems.length / (params.size || 10))
      };
      
      return transformedResponse;
    } catch (error) {
      console.error('Error fetching prospects:', error);
      throw error;
    }
  }

  /**
   * Fetches prospects for a specific campaign with pagination
   * @param campaignId - The ID of the campaign
   * @param page - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 12)
   * @param filters - Optional filters for searchString, phase, engagement status, min score, is_active, unsubscribed, replied, meeting_clicked, and opened
   * @returns Promise with paginated prospects response
   */
  static async getCampaignProspects(
    campaignId: string, 
    page: number = 1, 
    pageSize: number = 12,
    filters?: {
      searchString?: string;
      phase?: string;
      engagement_status?: string;
      min_score?: number;
      is_active?: boolean;
      unsubscribed?: boolean;
      replied?: boolean;
      meeting_clicked?: boolean;
      opened?: boolean;
    }
  ): Promise<PaginatedProspectsResponse> {
    try {
      const params: Record<string, any> = {
        page_no: page,
        page_size: pageSize
      };

      // Add optional filters if they exist
      if (filters) {
        console.log('ProspectsService - Applying filters:', filters); // Debug log
        if (filters.searchString) params.searchString = filters.searchString;
        if (filters.phase && filters.phase !== 'all') params.phase = filters.phase;
        if (filters.engagement_status && filters.engagement_status !== 'all') params.engagement_status = filters.engagement_status;
        if (filters.min_score !== undefined) params.min_score = filters.min_score;
        if (filters.is_active !== undefined && filters.is_active !== null) {
          if (typeof filters.is_active === 'boolean') {
            params.is_active = filters.is_active;
          } else if (filters.is_active !== 'all') {
            params.is_active = filters.is_active === 'true';
          }
        }
        if (filters.unsubscribed !== undefined && filters.unsubscribed !== null) {
          if (typeof filters.unsubscribed === 'boolean') {
            params.unsubscribed = filters.unsubscribed;
          } else if (filters.unsubscribed !== 'all') {
            params.unsubscribed = filters.unsubscribed === 'true';
          }
        }
        // Add new filter parameters
        if (filters.replied !== undefined) {
          params.replied = filters.replied;
          console.log('ProspectsService - Added replied filter:', filters.replied); // Debug log
        }
        if (filters.meeting_clicked !== undefined) {
          params.meeting_clicked = filters.meeting_clicked;
          console.log('ProspectsService - Added meeting_clicked filter:', filters.meeting_clicked); // Debug log
        }
        if (filters.opened !== undefined) {
          params.opened = filters.opened;
          console.log('ProspectsService - Added opened filter:', filters.opened); // Debug log
        }
      }

      console.log('ProspectsService - Final API params:', params); // Debug log
      const response = await api.get(`/prospects/campaign/${campaignId}`, {
        params
      });
      console.log('ProspectsService - Raw API response:', response);
      console.log('ProspectsService - Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching prospects for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Adds a prospect to a campaign
   * @param request - The request containing campaign ID and prospect data
   * @returns Promise with the created prospect
   */
  static async addProspectToCampaign(request: AddProspectRequest): Promise<Prospect> {
    try {
      const response = await api.post('/prospects/upload', request);
      return response.data;
    } catch (error) {
      console.error('Error adding prospect to campaign:', error);
      throw error;
    }
  }

  /**
   * Uploads prospects from a CSV file
   * @param campaignId - The ID of the campaign
   * @param file - The CSV file to upload
   * @returns Promise with the upload response
   */
  static async uploadProspects(campaignId: string, file: File): Promise<{
    total: number;
    added: number;
    skipped: number;
    errors: number;
  }> {
    try {
      const formData = new FormData();
      formData.append('csv_file', file);

      const response = await api.post(`/prospects/bulk-upload?campaign_id=${campaignId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading prospects:', error);
      throw error;
    }
  }

  /**
   * Updates multiple prospects
   * @param request - The request containing campaign ID and prospects data
   * @returns Promise with the updated prospects
   */
  static async updateProspects(request: UpdateProspectsRequest): Promise<any> {
    try {
      const response = await api.put('/prospects/update-multiple', request);
      return response.data;
    } catch (error) {
      console.error('Error updating prospects:', error);
      throw error;
    }
  }

  /**
   * Removes prospects from a campaign
   * @param request - The request containing campaign ID and prospect IDs
   * @returns Promise with the removal response
   */
  static async removeProspects(request: RemoveProspectsRequest): Promise<any> {
    try {
      const response = await api.delete('/prospects/delete-multiple', { data: request });
      return response.data;
    } catch (error) {
      console.error('Error removing prospects:', error);
      throw error;
    }
  }

  /**
   * Sends mail to a prospect
   * @param campaignId - The ID of the campaign
   * @param prospectId - The ID of the prospect
   * @returns Promise with the response
   */
  static async sendMail(campaignId: string, prospectId: string): Promise<any> {
    try {
      const response = await api.post(`/action/run?campaign_id=${campaignId}&prospect_id=${prospectId}`);
      return response.data;
    } catch (error) {
      console.error('Error sending mail to prospect:', error);
      throw error;
    }
  }

  /**
   * Toggles prospect active status
   * @param campaignId - The ID of the campaign
   * @param prospectId - The ID of the prospect
   * @param isActive - The new active status (opposite of current status)
   * @returns Promise with the updated prospect
   */
  static async toggleProspectStatus(campaignId: string, prospectId: string, isActive: boolean): Promise<any> {
    try {
      const requestBody = {
        campaign_id: campaignId,
        updates: [
          {
            is_active: isActive,
            prospect_id: prospectId
          }
        ]
      };
      
      const response = await api.put(`/prospects/activity`, requestBody);
      return response.data;
    } catch (error) {
      console.error('Error toggling prospect status:', error);
      throw error;
    }
  }
}
