import api from '@/lib/api';
import { EditorThreadMessage } from '@/services/emailEditorThreadService';

export interface EmailTemplate {
  id: string;
  subject: string;
  content: string;
  from_email?: string;
  to_email?: string;
  variables?: Record<string, any>;
}

export interface EmailTemplateUpdateRequest {
  action_id: string;
  campaign_id: string;
  subject?: string;
  content?: string;
  message: string; // Natural language instruction for changes
  history?: EditorThreadMessage[]; // Recent conversation so the bot remembers
}

export interface EmailTemplateUpdateResponse {
  success: boolean;
  updated_template: EmailTemplate;
  changes_made: string;
}

export interface EmailTemplateSaveRequest {
  action_id: string;
  campaign_id?: string;
  subject?: string;
  content?: string;
}

class EmailTemplateService {

  async getEmailTemplate(actionId: string): Promise<EmailTemplate> {
    try {






      const response = await api.get(`/workflow/action/${actionId}`)


      return {
        id: actionId,
        subject: response.data?.action_payload.email_templates.subject,
        content: response.data?.action_payload.email_templates.body,
        from_email: response.data?.action_payload.email_templates.from_email,
        to_email: response.data?.action_payload.email_templates.to_email,
        variables: {
          firstName: "{{firstName}}",
          companyName: "[Company Name]"
        }
      };
    } catch (error) {
      console.error('Error fetching email template:', error);
      throw error;
    }
  }

  async updateEmailTemplate(data: EmailTemplateUpdateRequest): Promise<EmailTemplateUpdateResponse> {
    try {
      const response = await api.patch(`workflow/action/email-template`, data);


      return {
        success: true,
        updated_template: {
          id: response?.data?._id,
          subject: response?.data?.action_payload?.email_templates?.subject ,
          content: response?.data?.action_payload?.email_templates?.body ,
          from_email: "hello@company.com",
          to_email: "{{email}}",
          variables: {
            firstName: "{{firstName}}",
            companyName: "[Company Name]"
          }
        },
        changes_made: "Updated the email template as requested. The changes have been applied successfully."
      };
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  }

  /**
   * Save the user's manual edits verbatim (no AI rewrite). Uses PUT, which the
   * backend persists exactly as entered (after deterministic AI-slop
   * sanitizing), so direct edits are reliable and survive a refresh.
   */
  async saveEmailTemplate(data: EmailTemplateSaveRequest): Promise<EmailTemplate> {
    try {
      const response = await api.put(`workflow/action/email-template`, data);
      return {
        id: response?.data?._id ?? data.action_id,
        subject: response?.data?.action_payload?.email_templates?.subject ?? data.subject ?? "",
        content: response?.data?.action_payload?.email_templates?.body ?? data.content ?? "",
        from_email: response?.data?.action_payload?.email_templates?.from_email,
        to_email: response?.data?.action_payload?.email_templates?.to_email,
        variables: {
          firstName: "{{firstName}}",
          companyName: "[Company Name]"
        }
      };
    } catch (error) {
      console.error('Error saving email template:', error);
      throw error;
    }
  }
}

export const emailTemplateService = new EmailTemplateService();