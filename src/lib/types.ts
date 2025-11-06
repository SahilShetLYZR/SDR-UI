import {
   OtherSettings,
  ScheduleSettings, SettingsField
} from "@/services/campaignSettingsService.ts";

export enum Path {
  HOME = "/",
  AUTH = "auth",
  LOGIN = "login",
  CAMPAIGN = "campaign",
  PROSPECTS = "prospects",
  KNOWLEDGE_BASE = "knowledge-base",
  WORKFLOW = "workflow",
  ANALYTICS = "analytics",
  SETTINGS = "settings",
  SETTING = "setting",
  DOMAIN_CONFIGS = "settings/domain-configs",
  ADMIN = "admin",
}

export type ICreateCampaignSettings = {
  _id: string,
  campaign_id: string;
  general: IGeneralSettings;
  materials: IMaterialsSettings;
  schedule: ScheduleSettings | null;
  others: OtherSettings | null;
  created_at: string;
  updated_at: string;
};

export type IGeneralSettings = {
  campaign_name: SettingsField;
  is_active: SettingsField;
  agent_name: SettingsField;
  agent_designation: SettingsField;
  agent_email: SettingsField;
  agent_number: SettingsField;
  agent_address: SettingsField;
};

export interface IMaterialsSettings {
  seller: ISettingsField;
  meeting_booking_link: ISettingsField;
  pain_points: ISettingsField;
  case_studies: ISettingsField;
  testimonials: ISettingsField;
  website_url: ISettingsField;
}

export interface ISettingsField {
  field_name?: string;
  field_type?: string;
  field_value: string | number | any[] | boolean;
  field_options?: string[] | null;
}