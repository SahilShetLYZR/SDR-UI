/**
 * Interface representing a prospect's data
 */
export interface Prospect {
  id: string;
  name: string;
  email: string;
  organization?: string;
  designation?: string;
  engagementScore: number;
  engagementStatus: string;
  sequenceStatus: string;
  // Add other fields as needed
}

/**
 * Interface for prospect list API response
 */
export interface ProspectsResponse {
  items: Prospect[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * Interface for prospect list query parameters
 */
export interface ProspectListParams {
  page?: number;
  size?: number;
  search?: string;
  engagementScore?: number;
  engagementStatus?: string;
  sequenceStatus?: string;
  campaignId?: string;
}
