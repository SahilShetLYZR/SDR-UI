import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, PlusIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CampaignTabs from '@/components/campaign/CampaignTabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AnalyticsPage from './Analytics';
import { campaignService, ApiCampaign } from '@/services/campaignService';
import { campaignSettingsService, CampaignSettings } from '@/services/campaignSettingsService';
import CreateCampaignDialog from '@/pages/CreateCampaignDialog';
import { useToast } from '@/components/ui/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { adminService } from '@/services/adminService';

const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [settings, setSettings] = useState<CampaignSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const isFromAdmin = searchParams.get('from') === 'admin';

  // Use a ref to track if data has been loaded
  const dataLoadedRef = useRef(false);

  // Function to update settings and campaign data after a save operation
  const updateSettings = useCallback(async () => {
    if (!id) return;

    try {
      // Fetch updated settings
      const updatedSettings = await campaignSettingsService.getSettingsByCampaignId(id);
      setSettings(updatedSettings);
      console.log('Settings updated after save:', updatedSettings);

      // Also update the campaign data to reflect changes like is_active status
      const campaigns = await campaignService.getCampaigns();
      const updatedCampaign = campaigns.find(camp => camp._id === id);

      if (updatedCampaign) {
        setCampaign(updatedCampaign);
        console.log('Campaign data updated after settings change:', updatedCampaign);
      }
    } catch (error) {
      console.error('Error updating data after save:', error);
    }
  }, [id]);

  const fetchCampaigns = async () => {
    navigate(`/campaign`);
  };

  const openCreateModal = () => setIsCreateModalOpen(true);

  useEffect(() => {
    if (adminLoading) return;
    // Only fetch data if it hasn't been loaded yet or if the ID changes
    if (!dataLoadedRef.current || !campaign) {
      const fetchCampaignData = async () => {
        if (!id) {
          navigate('/campaign');
          return;
        }

        try {
          setIsLoading(true);
          setError(null);

          let campaignData: ApiCampaign | undefined;
          if (isFromAdmin && isAdmin) {
            const adminCampaigns = await adminService.getAdminCampaigns(1, 100);
            campaignData = adminCampaigns.items.find(camp => camp._id === id);
          } else {
            const userCampaigns = await campaignService.getCampaigns();
            campaignData = userCampaigns.find(camp => camp._id === id);
          }

          if (!campaignData) {
            setError('Campaign not found');
            navigate(isFromAdmin ? '/admin' : '/campaign');
            return;
          }

          setCampaign(campaignData);

          // Fetch campaign settings
          try {
            const settingsData = await campaignSettingsService.getSettingsByCampaignId(id);
            setSettings(settingsData);
            console.log('Campaign settings loaded:', settingsData);

            // Mark data as loaded
            dataLoadedRef.current = true;
          } catch (settingsError) {
            console.error('Error fetching campaign settings:', settingsError);
            toast({
              title: 'Warning',
              description: 'Could not load campaign settings. Some features may be limited.',
              variant: 'destructive',
            });
          }
        } catch (err) {
          console.error('Error fetching campaign data:', err);
          setError('Failed to load campaign data. Please try again.');
          toast({
            title: 'Error',
            description: 'Failed to load campaign data',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchCampaignData();
    }
  }, [id, navigate, toast, campaign, isAdmin, adminLoading]);

  // Reset the dataLoaded ref when the ID changes
  useEffect(() => {
    return () => {
      dataLoadedRef.current = false;
    };
  }, [id]);

  // Check if we're on the analytics route
  const isAnalyticsRoute = location.pathname.endsWith('/analytics');


  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading campaign details...</span>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || 'Campaign not found'}</p>
        <Button onClick={() => navigate(isFromAdmin ? '/admin' : '/campaign')} variant="outline">
          Return to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link to={isFromAdmin ? "/admin" : "/campaign"} className="mr-2 text-gray-500 hover:text-gray-700">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold">
              {campaign.name}
              <Badge
                className={cn(
                  "ml-3 rounded-full px-2 py-0.5 text-xs font-medium",
                  campaign.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                )}
              >
                {campaign.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </h1>
          </div>
          <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
        <CampaignTabs campaignId={campaign._id} isActive={campaign.is_active} />
      </header>

      <div className="flex-1 overflow-auto">
        {isAnalyticsRoute ? (
          <AnalyticsPage />
        ) : (
          <Outlet context={{ campaign, settings, updateSettings, isActive: campaign.is_active }} />
        )}
      </div>
      <CreateCampaignDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchCampaigns}
      />
    </div>
  );
};

export default CampaignDetailsPage;
