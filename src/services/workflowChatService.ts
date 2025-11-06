import api from "@/lib/api";

interface ChatApiRequest {
  message: string;
  workflow_id?: string;
}

interface ChatApiResponse {
  response: string;
  actionCreated?: string;
  actionsCreated?: string[]; // For multiple actions
  success: boolean;
}

class WorkflowChatService {

  async sendChatMessage(data: ChatApiRequest): Promise<ChatApiResponse> {
    try {



      const response = await api.post('/workflow/action/natural_language', data)

      console.log(response.data, "response.data")



      return {
        response: response?.data?.message,
        actionCreated: "Email action created",
        success: true,
      };
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }
}

export const workflowChatService = new WorkflowChatService();
export type { ChatApiRequest, ChatApiResponse }; 