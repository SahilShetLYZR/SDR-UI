import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CampaignTabs from '@/components/campaign/CampaignTabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AnalyticsPage from './Analytics';
import { campaignService, ApiCampaign } from '@/services/campaignService';
import { campaignSettingsService, CampaignSettings } from '@/services/campaignSettingsService';
import PageHeader from '@/components/layout/PageHeader';
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
      <div className="h-full flex flex-col" role="status" aria-label="Loading campaign details">
        <header className="border-b bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </header>
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
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
      <PageHeader
        eyebrow="Campaign"
        leading={
          <Link
            to={isFromAdmin ? "/admin" : "/campaign"}
            aria-label="Back to campaigns"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        }
        title={
          <span className="flex items-center gap-3">
            <span className="truncate">{campaign.name}</span>
            <Badge
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium font-sans not-italic tracking-normal",
                campaign.is_active
                  ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-400/15"
                  : "bg-white/10 text-white/60 ring-1 ring-white/15 hover:bg-white/10"
              )}
            >
              {campaign.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </span>
        }
      />
      <div className="border-b bg-white">
        <CampaignTabs campaignId={campaign._id} isActive={campaign.is_active} />
      </div>

      <div className="flex-1 overflow-auto">
        {isAnalyticsRoute ? (
          <AnalyticsPage />
        ) : (
          <Outlet context={{ campaign, settings, updateSettings, isActive: campaign.is_active }} />
        )}
      </div>
    </div>
  );
};

export default CampaignDetailsPage;
