import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useParams } from 'react-router-dom';
import { ProspectsService, CampaignProspect } from '@/services/prospectsService';
import api from '@/lib/api';

interface Prospect {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
}

interface Mail {
  id: string;
  mail_type: string;
  from_email: string;
  to_email: string;
  subject: string;
  content: string;
  created_at: string;
  campaign_id: string;
  workflow_id: string;
  prospect_id: string;
  phase: string | null;
  status: string | null;
  analytics: {
    delivered: boolean;
    delivered_at: string | null;
    opened: boolean;
    opened_at: string | null;
    open_count: number;
    clicked: boolean;
    clicked_at: string | null;
    click_count: number;
    urls_clicked: string[];
    replied: boolean;
    replied_at: string | null;
    bounced: boolean;
    bounced_at: string | null;
    bounce_reason: string | null;
  };
}

interface MailResponse {
  mails: Mail[];
  total: number;
  skip: number;
  limit: number;
}

const AnalyticsPage: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [mailHistory, setMailHistory] = useState<Mail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMails, setIsLoadingMails] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchProspects = async (query: string = '', currentPage: number = 1) => {
    if (!campaignId) {
      toast({
        title: 'Error',
        description: 'Campaign ID is missing',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the campaign-specific endpoint from ProspectsService
      const campaignProspects = await ProspectsService.getCampaignProspects(
        campaignId,
        currentPage,
        pageSize
      );
      
      // Transform the campaign prospects to match the expected Prospect format
      const transformedProspects: Prospect[] = campaignProspects.map(item => ({
        id: item._id || item.prospect_id,
        first_name: item.prospect_details?.first_name || '',
        last_name: item.prospect_details?.last_name || '',
        email: item.prospect_details?.email || '',
        company_name: item.prospect_details?.company_name || '',
      }));
      
      setProspects(transformedProspects);
      
      // Calculate total pages based on the length of the array
      // This is a simple approach; in a real app, you might want to get this from the API
      setTotalPages(Math.ceil(transformedProspects.length / pageSize));
    } catch (error) {
      console.error('Error fetching prospects:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch prospects',
        variant: 'destructive',
      });
      setProspects([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMailHistory = async (prospectId: string) => {
    try {
      console.log('Fetching mail history for prospect:', prospectId);
      setIsLoadingMails(true);
      
      // Use the exact URL format provided in the requirements
      const url = `/campaign-mails/prospect/${prospectId}/mails?sort_order=-1&skip=0&limit=50`;
      console.log('API request URL:', url);
      
      const response = await api.get(url);
      console.log('Mail history response:', response.data);
      
      // Check if the response has the expected structure
      if (response.data && response.data.mails) {
        setMailHistory(response.data.mails);
      } else {
        console.error('Unexpected response format:', response.data);
        setMailHistory([]);
      }
    } catch (error) {
      console.error('Error fetching mail history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch mail history',
        variant: 'destructive',
      });
      setMailHistory([]);
    } finally {
      setIsLoadingMails(false);
    }
  };

  useEffect(() => {
    fetchProspects(searchQuery, page);
  }, [searchQuery, page, campaignId]);

  const handleProspectSelect = (prospect: Prospect) => {
    console.log('Prospect selected:', prospect);
    setSelectedProspect(prospect);
    
    // Make sure we have a valid prospect ID before making the API call
    if (prospect && prospect.id) {
      fetchMailHistory(prospect.id);
    } else {
      console.error('Invalid prospect or missing ID:', prospect);
      toast({
        title: 'Error',
        description: 'Cannot fetch mail history: Invalid prospect',
        variant: 'destructive',
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Analytics</h2>
      
      <div className="flex h-[calc(100vh-12rem)]">
        {/* Left side - Mail History */}
        <div className="w-1/3 bg-white rounded-lg border overflow-hidden flex flex-col">
          {!selectedProspect ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a prospect to see outreach history
            </div>
          ) : (
            <>
              <div className="p-4 border-b">
                <h3 className="font-semibold">
                  Mail History - {selectedProspect.first_name} {selectedProspect.last_name}
                </h3>
                <div className="text-sm text-gray-500">{selectedProspect.email}</div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {isLoadingMails ? (
                  <div className="text-center text-gray-500">Loading mail history...</div>
                ) : mailHistory.length === 0 ? (
                  <div className="text-center text-gray-500">No mail history found</div>
                ) : (
                  <div className="space-y-4">
                    {mailHistory.map((mail) => (
                      <div key={mail.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{mail.subject}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(mail.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div 
                          className="text-sm text-gray-600 mt-2"
                          dangerouslySetInnerHTML={{ __html: mail.content }}
                        />
                        <div className="mt-3 flex justify-between">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              mail.analytics.delivered
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {mail.analytics.delivered ? 'Delivered' : 'Sent'}
                          </span>
                          {mail.analytics.delivered && mail.analytics.delivered_at && (
                            <span className="text-xs text-gray-500">
                              Delivered: {new Date(mail.analytics.delivered_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="border-l border-dotted border-gray-300 mx-6" />

        {/* Right side - Prospects List */}
        <div className="w-2/3 bg-white rounded-lg border overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search by email"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : prospects.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No prospects found
              </div>
            ) : (
              <div className="divide-y">
                {prospects.map((prospect) => (
                  <div
                    key={prospect.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedProspect?.id === prospect.id ? 'bg-purple-50' : ''
                    }`}
                    onClick={() => handleProspectSelect(prospect)}
                  >
                    <div className="font-medium">
                      {prospect.first_name} {prospect.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{prospect.email}</div>
                    {prospect.company_name && (
                      <div className="text-sm text-gray-400">{prospect.company_name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t bg-white">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
