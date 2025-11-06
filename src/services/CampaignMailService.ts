// src/services/CampaignMailService.ts (Example)
import api from '@/lib/api';
import { CampaignMail } from '@/types/campaignMail'; // Define this type based on backend model

// Define CampaignMail type based on backend (simplified for polling)
export interface ActionStatus {
    status_text: string;
    error_text: string;
    success_text: string; // Might not be needed directly for polling status
}

export interface CampaignMail {
    id: string; // alias for _id
    mail_type: string;
    from_email: string;
    to_email: string;
    subject: string;
    content: string;
    campaign_id: string;
    workflow_id: string;
    prospect_id: string;
    action_status?: ActionStatus;
    // Add other fields if needed
}


export class CampaignMailService {
  static async getActionResult(mailId: string): Promise<CampaignMail> {
    try {
      const response = await api.get(`/campaign-mails/${mailId}`);
      // Map _id to id if necessary, depending on your api client setup
      return { ...response.data, id: response.data._id };
    } catch (error) {
      console.error(`Error fetching action result ${mailId}:`, error);
      throw error; // Re-throw to be handled by the caller
    }
  }
}

