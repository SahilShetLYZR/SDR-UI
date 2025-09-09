// src/services/ActionApiService.ts (Example)
import api from '@/lib/api';

export interface RunSampleResponse {
  action_result_id: string;
}

export class ActionApiService {
  static async runSampleAction(
    campaignId: string,
    prospectId: string,
    actionId: string
  ): Promise<RunSampleResponse> {
    try {
      // Construct query parameters
      const params = new URLSearchParams({
        campaign_id: campaignId,
        prospect_id: prospectId,
        action_id: actionId,
      });
      const response = await api.post(`/action/run_sample?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error running sample action:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }
   // Add the run full action method if needed elsewhere
   static async runFullAction(campaignId: string, prospectId: string): Promise<{ message: string }> {
      try {
        const params = new URLSearchParams({
          campaign_id: campaignId,
          prospect_id: prospectId,
        });
        const response = await api.post(`/action/run?${params.toString()}`);
        return response.data;
      } catch (error) {
        console.error('Error running full action:', error);
        throw error;
      }
   }
}

