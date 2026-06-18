import api from '@/lib/api';

export interface EmailTemplateLibraryItem {
  _id: string;
  user_email: string;
  name: string;
  subject: string;
  body: string;
  tag?: string | null;
  times_used: number;
  created_at: string;
  updated_at: string;
}

export interface TemplatePayload {
  name: string;
  subject?: string;
  body?: string;
  tag?: string | null;
}

class TemplateLibraryService {
  async list(search = ''): Promise<EmailTemplateLibraryItem[]> {
    try {
      const response = await api.get('/templates', { params: search ? { search } : {} });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error listing templates:', error);
      throw error;
    }
  }

  async create(data: TemplatePayload): Promise<EmailTemplateLibraryItem> {
    const response = await api.post('/templates', data);
    return response.data;
  }

  async update(id: string, data: TemplatePayload): Promise<EmailTemplateLibraryItem> {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/templates/${id}`);
  }

  /** Record reuse (bumps usage count) and return the template. */
  async use(id: string): Promise<EmailTemplateLibraryItem> {
    const response = await api.post(`/templates/${id}/use`);
    return response.data;
  }
}

export const templateLibraryService = new TemplateLibraryService();
