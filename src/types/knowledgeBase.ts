export type KbFileType = 'text' | 'file' | 'webpage';

export interface KbDocument {
  _id: string;
  created_at: string;
  updated_at: string;
  name: string;
  doc_type: string;
  doc_link: string;
  kb_id: string;
  content?: string; // the actual text fed to the agent (viewable/editable)
}

export interface KbTextRequest {
  kb_id: string;
  text: string;
}

export interface KbWebsiteRequest {
  kb_id: string;
  source: string;
  urls: string[];
  name?: string; // Optional name for the website
}

export interface KbFileRequest {
  kb_id: string;
  file: File;
}

export interface KbWebsiteUpdateRequest {
  kb_id: string;
  old_name: string; // current name of the website document being edited
  source: string;
  urls: string[];
  name: string; // new (or unchanged) name
}

export interface KbTextUpdateRequest {
  kb_id: string;
  old_name: string;
  text: string;
}

export interface KbDocumentContentUpdateRequest {
  kb_id: string;
  old_name: string;
  name: string;
  content: string;
  doc_type: string;
  doc_link?: string;
}

export interface KbDeleteRequest {
  kb_id: string;
  sources: string[];
}

export interface KbResponse {
  success: boolean;
  message: string;
  data?: KbDocument;
}
