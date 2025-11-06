import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {PlusIcon, Search, Eye, Loader2, Copy, Trash2, CopyPlus} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { campaignService, ApiCampaign } from '@/services/campaignService';
import { useToast } from '@/components/ui/use-toast';
import { campaignSettingsService } from '@/services/campaignSettingsService';
import CreateCampaignDialog from '@/pages/CreateCampaignDialog';
import FullCloneCampaignDialog from '@/components/campaign/FullCloneCampaignDialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CampaignPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCampaignId, setCopiedCampaignId] = useState<string>("");
  const [fullClonedCampaignId, setFullClonedCampaignId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string>("");
  const [isFullCloneModalOpen, setIsFullCloneModalOpen] = useState(false);
  const [campaignToFullClone, setCampaignToFullClone] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError('Failed to fetch campaigns. Please try again.');
      console.error('Error fetching campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCampaign = async (campaignId: string) => {
    setCopiedCampaignId(campaignId);
    setIsLoading(true);
    try {
      await campaignService.copyCampaign(campaignId);
      await fetchCampaigns();
      setCopiedCampaignId("");
      toast({
        title: 'Campaign duplicated',
        description: 'The campaign has been successfully duplicated.',
      });
    } catch (err) {
      console.log(err);
      setCopiedCampaignId("");
      toast({
        title: 'Error',
        description: 'Failed to duplicate campaign',
        variant: 'destructive',
      });
    }
  };

  const handleFullCloneClick = (campaignId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCampaignToFullClone(campaignId);
    setIsFullCloneModalOpen(true);
  };

  const handleFullCloneCampaign = async (name: string) => {
    if (!campaignToFullClone) return;
    
    setFullClonedCampaignId(campaignToFullClone);
    setIsLoading(true);
    try {
      await campaignService.fullCloneCampaign(campaignToFullClone, name);
      await fetchCampaigns();
      setFullClonedCampaignId("");
      setIsFullCloneModalOpen(false);
      setCampaignToFullClone("");
      toast({
        title: 'Campaign fully cloned',
        description: 'The campaign has been successfully cloned with all associated data.',
      });
    } catch (err) {
      console.log(err);
      setFullClonedCampaignId("");
      toast({
        title: 'Error',
        description: 'Failed to full clone campaign',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (campaignId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    try {
      setIsLoading(true);
      await campaignService.deleteCampaign(campaignToDelete);
      toast({
        title: 'Campaign deleted',
        description: 'The campaign has been successfully deleted.',
      });
      await fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setCampaignToDelete("");
    }
  };

  const filteredCampaigns = campaigns;

  const openCreateModal = () => setIsCreateModalOpen(true);

  const handleViewCampaign = async (campaignId: string, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent default link behavior

    try {
      // Show loading toast
      toast({
        title: 'Loading campaign settings',
        description: 'Please wait...',
      });

      // Fetch campaign settings
      await campaignSettingsService.getSettingsByCampaignId(campaignId);

      // Navigate to campaign details page
      navigate(`/campaign/${campaignId}`);
    } catch (error) {
      console.error('Error fetching campaign settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b p-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
        </div>
        <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </header>

      <div className="p-6 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading campaigns...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchCampaigns} variant="outline">
              Retry
            </Button>
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="ghost" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Campaign Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Creation Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total Prospects</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total Mails Sent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign._id} className="border-b">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          {campaign.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleViewCampaign(campaign._id, e)}
                          >
                            <Eye className="h-4 w-4 mr-1"/>
                            View
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(campaign.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{campaign.total_prospects || 0}</td>
                      <td className="px-4 py-3 text-sm">{campaign.total_mails_sent || 0}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          campaign.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}>
                          {campaign.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end space-x-1">
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                key={campaign._id + "fullClone"}
                                variant="link"
                                size="icon"
                                className="group-hover:visible"
                                onClick={(e) => handleFullCloneClick(campaign._id, e)}
                                disabled={
                                  isLoading &&
                                  campaign._id === fullClonedCampaignId
                                }
                              >
                                <CopyPlus className="h-4 w-4 "/>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="border-none">
                              Full Clone
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                key={campaign._id + "delete"}
                                variant="link"
                                size="icon"
                                className="group-hover:visible text-red-500 hover:text-red-700"
                                onClick={(e) => handleDeleteClick(campaign._id, e)}
                              >
                                <Trash2 className="h-4 w-4"/>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="border-none">
                              Delete
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="mb-5">
              <img src="/nocampaigns.svg" alt="No campaigns" className="w-60 h-60 object-contain" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No campaigns here yet!</h2>
            <p className="text-muted-foreground mb-6">Create a new campaign to get started.</p>
            <div className="space-y-2">
              <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create new
              </Button>
              <div>
                <Button variant="outline" className="mt-4">
                  Skip
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateCampaignDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchCampaigns}
      />

      <FullCloneCampaignDialog
        open={isFullCloneModalOpen}
        onOpenChange={setIsFullCloneModalOpen}
        onConfirm={handleFullCloneCampaign}
        isLoading={isLoading && !!fullClonedCampaignId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCampaign}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CampaignPage;
