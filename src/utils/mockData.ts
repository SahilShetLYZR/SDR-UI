import { Campaign, Prospect } from '@/types/campaign';

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Yellow_Cold Mails',
    description: 'Cold email campaign targeting tech companies',
    status: 'active',
    createdAt: '2023-06-15',
    totalProspects: 150,
    totalMailsSent: 450
  },
  {
    id: '2',
    name: 'Campaign 2',
    description: 'Follow-up campaign for existing leads',
    status: 'inactive',
    createdAt: '2023-07-22',
    totalProspects: 75,
    totalMailsSent: 225
  }
];

export const mockProspects: Prospect[] = [
  {
    id: '1',
    email: 'Marco29@gmail.com',
    firstName: 'Marco',
    lastName: 'Thompson',
    companyName: 'Nolan, Hauck and Waelchi',
    info: 'Figma ipsum component variant main layer. Share blur.',
    sequence: '2.84',
    status: 'active'
  },
  {
    id: '2',
    email: 'Jody.Kuvalis@gmail.com',
    firstName: 'Jody',
    lastName: 'Kuvalis',
    companyName: 'Ritchie - Farrell',
    info: 'Figma ipsum component variant main layer. Pencil font.',
    sequence: '3.33',
    status: 'inactive'
  }
];
