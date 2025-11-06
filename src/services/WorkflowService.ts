import api from '@/lib/api';

// --- Interfaces matching Pydantic Models ---
export type ActionType = 'EmailSending' | 'Manual';

export interface ApiFile {
  id: string;
  workflow_id: string;
  action_id: string;
  filename: string;
  content_type: string;
  size: number;
  s3_key: string;
  s3_url: string;
  created_at: string;
  updated_at: string;
}

export interface ApiAction {
  _id: string;
  workflow_id: string;
  name: string;
  description: string;
  time_interval: number;
  action_type: ActionType;
  action_payload: Record<string, any>;
  get_copied?: boolean;
  copy_type?: 'cc' | 'bcc';
  copy_email?: string;
  attach_files?: boolean;
  attachment_files?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiWorkflowModel {
    _id: string;
    created_at?: string;
    updated_at?: string;
    action_graph: string[];
}

export interface ApiWorkflowWithActions extends ApiWorkflowModel {
  actions: ApiAction[];
}

// --- Request Interfaces matching FastAPI request models ---
export interface AddActionRequest {
  name: string;
  description: string;
  workflow_id: string;
  action_type: ActionType;
  action_payload: Record<string, any>;
  time_interval: number;
  get_copied?: boolean;
  copy_type?: 'cc' | 'bcc';
  copy_email?: string;
  attach_files?: boolean;
  attachment_files?: string[];
}

interface ActionUpdateData {
    name: string;
    description: string;
    action_type?: ActionType; // Not typically updated here, but part of model
    time_interval: number;
    action_payload?: Record<string, any>;
    get_copied?: boolean;
    copy_type?: 'cc' | 'bcc';
    copy_email?: string;
    attach_files?: boolean;
    attachment_files?: string[];
}

export interface UpdateActionRequest {
  workflow_id: string;
  action_id: string;
  action_data: ActionUpdateData;
}

export interface DeleteActionRequest {
  workflow_id: string;
  action_id: string;
}

export interface ReorderActionsRequest {
  workflow_id: string;
  new_order: string[];
}

// --- Workflow Service Implementation ---

export const workflowService = {
  // ... (getWorkflowWithActionsByCampaign, addAction, deleteAction, updateAction, reorderActions remain the same) ...
   /**
   * Get Workflow With hydrated Actions By Campaign ID
   */
  getWorkflowWithActionsByCampaign: async (campaignId: string): Promise<ApiWorkflowWithActions> => {
    try {
      const response = await api.get(`/workflow/with-actions/by-campaign/${campaignId}`);
      // Assuming response.data matches ApiWorkflowWithActions
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow for campaign ${campaignId}:`, error);
      throw error;
    }
  },

  /**
   * Add a new action to a workflow
   * Returns the created ActionModel
   */
  addAction: async (data: AddActionRequest): Promise<ApiAction> => {
    try {
      const response = await api.post(`/workflow/action`, data);
       // Assuming response.data matches ApiAction
      return response.data;
    } catch (error) {
      console.error('Error adding workflow action:', error);
      throw error;
    }
  },

  /**
   * Delete an action from a workflow
   * Backend returns the deleted action, but frontend might not need it. We'll keep void for simplicity unless needed.
   */
  deleteAction: async (data: DeleteActionRequest): Promise<void> => { // Or Promise<ApiAction> if you need the returned data
    try {
      await api.delete(`/workflow/action`, { data });
    } catch (error) {
      console.error('Error deleting workflow action:', error);
      throw error;
    }
  },

  /**
   * Update an existing workflow action
   * Returns the updated ActionModel
   */
  updateAction: async (data: UpdateActionRequest): Promise<ApiAction> => {
    try {
      const response = await api.put(`/workflow/action`, data);
       // Assuming response.data matches ApiAction
      return response.data;
    } catch (error) {
      console.error('Error updating workflow action:', error);
      throw error;
    }
  },

  /**
   * Reorder actions within a workflow
   * Returns the updated WorkflowModel (with new action_graph)
   */
  reorderActions: async (data: ReorderActionsRequest): Promise<ApiWorkflowModel> => {
    try {
      const response = await api.put(`/workflow/reorder`, data);
       // Assuming response.data matches ApiWorkflowModel
      return response.data;
    } catch (error) {
      console.error('Error reordering workflow actions:', error);
      throw error;
    }
  },

  /**
   * Get the required payload structure (keys and default values) for an action type.
   * Returns an object like {"field_name_1": "default_value_1", "field_name_2": ""}
   */
  getActionInputFields: async (actionType: ActionType): Promise<Record<string, any>> => {
    try {
      const response = await api.get(`/workflow/actions/input_fields`, {
        params: { action_type: actionType }
      });
      // Assuming response.data is the object representing the payload schema
      return response.data ?? {}; // Return empty object if data is null/undefined
    } catch (error) {
      console.error(`Error fetching input fields schema for action type ${actionType}:`, error);
      throw error;
    }
  },

  /**
   * Upload a file for a workflow action
   * @param workflowId - The ID of the workflow
   * @param actionId - The ID of the action
   * @param file - The file to upload
   * @returns The uploaded file metadata
   */
  uploadFile: async (workflowId: string, actionId: string, file: File): Promise<ApiFile> => {
    try {
      const formData = new FormData();
      formData.append('workflow_id', workflowId);
      formData.append('action_id', actionId);
      formData.append('file', file);

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Get files for a workflow
   * @param workflowId - The ID of the workflow
   * @returns Array of file metadata
   */
  getWorkflowFiles: async (workflowId: string): Promise<ApiFile[]> => {
    try {
      const response = await api.get(`/files/workflow/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching files for workflow ${workflowId}:`, error);
      throw error;
    }
  },

  /**
   * Get files for an action
   * @param actionId - The ID of the action
   * @returns Array of file metadata
   */
  getActionFiles: async (actionId: string): Promise<ApiFile[]> => {
    try {
      const response = await api.get(`/files/action/${actionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching files for action ${actionId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a file
   * @param fileId - The ID of the file to delete
   * @returns Success message
   */
  deleteFile: async (fileId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      throw error;
    }
  }
};

// Re-export relevant types
export type {
    ApiAction,
    ApiWorkflowWithActions,
    ApiWorkflowModel,
    AddActionRequest,
    UpdateActionRequest,
    DeleteActionRequest,
    ReorderActionsRequest,
    ActionType,
    ApiFile
};

// Remove ApiActionInputField export as it's no longer used
