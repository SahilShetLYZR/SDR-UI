import api from '@/lib/api';

// Define the field structure
export interface SettingsField {
  field_name?: string;
  field_type?: string;
  field_value: string | number | any[] | boolean;
  field_options?: string[] | null;
}

// Define the sections of settings
export interface GeneralSettings {
  campaign_name: SettingsField;
  is_active: SettingsField;
  agent_name: SettingsField;
  agent_designation: SettingsField;
  agent_email: SettingsField;
  agent_number: SettingsField;
  agent_address: SettingsField;
  campaign_email: SettingsField;
  signature_image: SettingsField;
  high_engagement_notifiers: SettingsField;
  threshold: SettingsField;
  [key: string]: SettingsField;
}

export interface MaterialsSettings {
  seller: SettingsField;
  meeting_booking_link: SettingsField;
  pain_points: SettingsField;
  case_studies: SettingsField;
  testimonials: SettingsField;
  website_url: SettingsField;
  [key: string]: SettingsField;
}

export interface ScheduleSettings {
  timezone: SettingsField;
  start_time?: SettingsField;
  end_time?: SettingsField;
  days_of_week?: SettingsField;
  frequency?: SettingsField;
  max_followup_mails?: SettingsField;
  // Keep these for backward compatibility
  max_outreach_email_count?: SettingsField;
  max_follow_emails?: SettingsField;
  time_interval?: SettingsField;
  time_window?: SettingsField;
  days?: SettingsField;
  [key: string]: SettingsField | undefined;
}

export interface OtherSettings {
  website_url?: SettingsField;
  special_offers: SettingsField;
  cc_list: SettingsField;
  [key: string]: SettingsField | undefined;
}

// Define the complete settings structure
export interface CampaignSettings {
  _id: string;
  campaign_id: string;
  general: GeneralSettings;
  materials: MaterialsSettings;
  schedule: ScheduleSettings;
  others: OtherSettings;
  created_at: string;
  updated_at: string;
}

export const campaignSettingsService = {
  /**
   * Get settings for a specific campaign
   */
  async getSettingsByCampaignId(campaignId: string): Promise<CampaignSettings> {
    try {
      // Use the _id from the campaign object to fetch settings
      const response = await api.get(`/campaign-settings/by-campaign/${campaignId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign settings:', error);
      throw error;
    }
  },

  /**
   * Get settings by settings ID
   */
  async getSettingsById(settingsId: string): Promise<CampaignSettings> {
    try {
      const response = await api.get(`/campaign-settings/${settingsId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign settings by ID:', error);
      throw error;
    }
  },

  /**
   * Save campaign settings
   */
  async saveCampaignSettings(settings: CampaignSettings): Promise<CampaignSettings> {
    try {
      const response = await api.put(`/campaign-settings/${settings._id}`, settings);
      return response.data;
    } catch (error) {
      console.error('Error saving campaign settings:', error);
      throw error;
    }
  },

  /**
   * Update campaign settings by settings ID
   */
  async updateSettingsById(settingsId: string | any, settingsData: Partial<CampaignSettings>): Promise<CampaignSettings> {
    try {
      // Enhanced debugging
      console.log("Original settingsId received:", settingsId);
      console.log("Type of settingsId:", typeof settingsId);
      
      // Handle different possible formats of settingsId
      let id: string;
      
      if (typeof settingsId === 'object') {
        if (settingsId === null) {
          throw new Error('Settings ID is null');
        }
        
        if (settingsId.field_value) {
          id = settingsId.field_value;
        } else if (settingsId._id) {
          id = settingsId._id;
        } else {
          console.error('Invalid settings ID object:', settingsId);
          throw new Error('Invalid settings ID format');
        }
      } else if (typeof settingsId === 'string') {
        id = settingsId;
      } else {
        console.error('Unexpected settings ID type:', typeof settingsId);
        throw new Error(`Unexpected settings ID type: ${typeof settingsId}`);
      }
      
      console.log("Processed settings ID for API call:", id);
      
      // First get the current settings to ensure we have all required fields
      const currentSettings = await this.getSettingsById(id);
      
      // Create a complete settings object with updated values
      const completeSettings: Partial<CampaignSettings> = {
        // Keep the existing fields
        _id: currentSettings._id,
        campaign_id: currentSettings.campaign_id,
        created_at: currentSettings.created_at,
        updated_at: new Date().toISOString(),
        
        // Use the provided data or fall back to current data
        general: settingsData.general || currentSettings.general,
        materials: settingsData.materials || currentSettings.materials,
        schedule: settingsData.schedule || currentSettings.schedule,
        others: settingsData.others || currentSettings.others
      };
      
      console.log("Complete settings to send:", completeSettings);
      
      const response = await api.put(`/campaign-settings/${id}`, completeSettings);
      return response.data;
    } catch (error) {
      console.error('Error updating campaign settings:', error);
      throw error;
    }
  },

  /**
   * Update campaign settings with complete data structure
   * This method updates the campaign settings with the complete data structure
   * and then fetches the updated settings
   */
  async updateAndFetchSettings(settingsId: string, settingsData: any): Promise<CampaignSettings> {
    try {
      // First update the settings
      await api.post(`/campaign-settings/${settingsId}`, settingsData);
      
      // Then fetch the updated settings
      const response = await api.get(`/campaign-settings/${settingsId}`);
      return response.data;
    } catch (error) {
      console.error('Error updating and fetching campaign settings:', error);
      throw error;
    }
  },

  /**
   * Collect and combine settings from all tabs and update them
   * @param settingsId - The ID of the settings to update
   * @param generalSettings - The general settings data
   * @param materialsSettings - The materials settings data
   * @param scheduleSettings - The schedule settings data
   * @param otherSettings - The other settings data
   */
  async updateCombinedSettings(
    settingsId: string,
    generalSettings: GeneralSettings,
    materialsSettings: MaterialsSettings,
    scheduleSettings: ScheduleSettings,
    otherSettings: OtherSettings
  ): Promise<CampaignSettings> {
    try {
      // Get the current settings to preserve any fields not being updated
      const currentSettings = await this.getSettingsById(settingsId);
      
      // Combine all settings into one object
      const combinedSettings = {
        _id: settingsId,
        created_at: currentSettings.created_at,
        updated_at: new Date().toISOString(),
        general: generalSettings,
        materials: materialsSettings,
        schedule: scheduleSettings,
        others: otherSettings
      };
      
      // Update the settings
      const response = await api.put(`/campaign-settings/${settingsId}`, combinedSettings);
      
      // Fetch the updated settings
      const updatedSettings = await this.getSettingsById(settingsId);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating combined settings:', error);
      throw error;
    }
  }
};

// Example function to update campaign settings with the provided data structure
export const updateCampaignSettingsExample = async (settingsId: string) => {
  const settingsData = {
    "_id": settingsId,
    "created_at": "2025-04-05T12:44:47.653000",
    "updated_at": "2025-04-05T12:44:47.653000",
    "general": {
        "campaign_name": {
            "field_name": "campaign_name",
            "field_type": "single_field",
            "field_value": "New Campaign",
            "field_options": null
        },
        "is_active": {
            "field_name": "is_active",
            "field_type": "boolean",
            "field_value": "",
            "field_options": null
        },
        "agent_name": {
            "field_name": "agent_name",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "agent_designation": {
            "field_name": "agent_designation",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "agent_email": {
            "field_name": "agent_email",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "agent_number": {
            "field_name": "agent_number",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "agent_address": {
            "field_name": "address",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        }
    },
    "materials": {
        "seller": {
            "field_name": "seller_name",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "meeting_booking_link": {
            "field_name": "meeting_booking_link",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "pain_points": {
            "field_name": "pain_points",
            "field_type": "multiple_field",
            "field_value": [],
            "field_options": null
        },
        "case_studies": {
            "field_name": "case_studies",
            "field_type": "multiple_field",
            "field_value": [],
            "field_options": null
        },
        "testimonials": {
            "field_name": "testimonials",
            "field_type": "multiple_field",
            "field_value": [],
            "field_options": null
        },
        "website_url": {
            "field_name": "website_url",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        }
    },
    "schedule": {
        "timezone": {
            "field_name": "timezone",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "start_time": {
            "field_name": "start_time",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "end_time": {
            "field_name": "end_time",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "days_of_week": {
            "field_name": "days_of_week",
            "field_type": "selectable",
            "field_value": "",
            "field_options": [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ]
        },
        "frequency": {
            "field_name": "frequency",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        },
        "max_followup_mails": {
            "field_name": "max_followup_mails",
            "field_type": "single_field",
            "field_value": 0,
            "field_options": null
        }
    },
    "others": {
        "cc_list": {
            "field_name": "cc_list",
            "field_type": "multiple_field",
            "field_value": [],
            "field_options": null
        },
        "special_offers": {
            "field_name": "special_offers",
            "field_type": "single_field",
            "field_value": "",
            "field_options": null
        }
    }
  };

  try {
    // Update the settings and get the updated data
    const updatedSettings = await campaignSettingsService.updateAndFetchSettings(settingsId, settingsData);
    console.log('Updated settings:', updatedSettings);
    return updatedSettings;
  } catch (error) {
    console.error('Failed to update campaign settings:', error);
    throw error;
  }
};
