export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  totalProspects: number;
  totalMailsSent: number;
}

export interface Prospect {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  info?: string;
  linkedInUrl?: string;
  sequence?: string;
  status: 'active' | 'inactive';
}
