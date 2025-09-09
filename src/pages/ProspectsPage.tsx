import React, { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  Search,
  Download,
  UploadIcon,
  LinkIcon,
  Filter,
  ArrowUpDown,
  Mail,
  Power,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BulkUploadModal from "@/components/prospects/BulkUploadModal";
import AddProspectModal from "@/components/prospects/AddProspectModal";
import EditProspectModal from "@/components/prospects/EditProspectModal";
import { useToast } from "@/components/ui/use-toast";
import debounce from "lodash/debounce";
import { useParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
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
import { ProspectsService, CampaignProspect } from "@/services/prospectsService";
import api from "@/lib/api";

// Sample data for filters - would come from API in real implementation
const engagementStatusOptions = ["cold", "warm", "hot"];
const sequenceStatusOptions = ["Active", "Completed", "Paused", "Not Started"];
const activeStatusOptions = ["true", "false"];
const unsubscribedStatusOptions = ["true", "false"];
const sequenceOptions = [
  "Sequence 1",
  "Sequence 2",
  "Sequence 3",
  "Sequence 4",
];

const ProspectsPage: React.FC = () => {
  const { toast } = useToast();
  const { id: campaignId } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAddProspectOpen, setIsAddProspectOpen] = useState(false);
  const [isEditProspectOpen, setIsEditProspectOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] =
    useState<CampaignProspect | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isSendMailDialogOpen, setIsSendMailDialogOpen] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [prospects, setProspects] = useState<CampaignProspect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [engagementScore, setEngagementScore] = useState<number[]>([0]);
  const [engagementStatus, setEngagementStatus] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [unsubscribedFilter, setUnsubscribedFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [actionNames, setActionNames] = useState<string[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);

  // Debounced states for search and slider
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [debouncedEngagementScore, setDebouncedEngagementScore] = useState(
    engagementScore
  );

  // Sorting states
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const fetchProspects = useCallback(
    async (newPage: number) => {
      setIsLoading(true);

      try {
        if (!campaignId) {
          toast({
            title: "Error",
            description: "Campaign ID is missing",
            variant: "destructive",
          });
          return;
        }

        // Create filters object
        const filters: any = {
          searchString: debouncedSearchQuery || undefined,
          phase: selectedAction !== "all" ? selectedAction : undefined,
          min_score:
            debouncedEngagementScore[0] > 0
              ? debouncedEngagementScore[0]
              : undefined,
        };

        // Only add engagement_status if it's not "all"
        if (engagementStatus && engagementStatus !== "all") {
          filters.engagement_status = engagementStatus;
        }

        // Only add is_active if it's not "all"
        if (isActiveFilter && isActiveFilter !== "all") {
          filters.is_active = isActiveFilter === "true";
        }

        // Only add unsubscribed if it's not "all"
        if (unsubscribedFilter && unsubscribedFilter !== "all") {
          filters.unsubscribed = unsubscribedFilter === "true";
        }

        const response = await ProspectsService.getCampaignProspects(
          campaignId,
          newPage,
          itemsPerPage,
          filters
        );

        if (response.prospects.length === 0) {
          setProspects([]);
          setTotalItems(0);
          setTotalPages(1);
          setPage(1);
        } else {
          setProspects(response.prospects);
          setTotalItems(response.pagination.total);
          setTotalPages(response.pagination.total_pages);
          setPage(response.pagination.current_page);
        }
      } catch (error) {
        console.error("Error fetching prospects:", error);
        toast({
          title: "Error",
          description: "Failed to fetch prospects",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      campaignId,
      itemsPerPage,
      toast,
      debouncedSearchQuery,
      selectedAction,
      engagementStatus,
      debouncedEngagementScore,
      isActiveFilter,
      unsubscribedFilter,
    ]
  );

  // Initial load and when campaign ID changes
  useEffect(() => {
    fetchProspects(1);

    // Fetch action names if we have a campaign ID
    if (campaignId) {
      api.get(`/workflow/action-names/by-campaign/${campaignId}`)
        .then(response => {
          if (response.data && response.data.action_names) {
            // Filter out empty strings and undefined values
            setActionNames(response.data.action_names.filter(name => name && typeof name === 'string' && name.trim() !== ''));
          }
        })
        .catch(error => {
          console.error('Error fetching action names:', error);
        });
    }
  }, [fetchProspects, campaignId]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce engagement score
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEngagementScore(engagementScore);
    }, 500);

    return () => clearTimeout(timer);
  }, [engagementScore]);

  // Add effect to refetch when filters change
  useEffect(() => {
    fetchProspects(1);
  }, [
    debouncedSearchQuery,
    engagementStatus,
    debouncedEngagementScore,
    selectedAction,
    isActiveFilter,
    unsubscribedFilter,
  ]);

  const handlePageChange = async (newPage: number) => {
    // Don't allow negative page numbers or pages beyond the total
    if (newPage < 1 || (newPage > totalPages && totalPages > 0)) {
      return;
    }

    setIsLoading(true);

    try {
      if (!campaignId) {
        toast({
          title: "Error",
          description: "Campaign ID is missing",
          variant: "destructive",
        });
        return;
      }

      // Create filters object for API call
      const filters: any = {
        searchString: debouncedSearchQuery || undefined,
        phase: selectedAction !== "all" ? selectedAction : undefined,
        min_score:
          debouncedEngagementScore[0] > 0
            ? debouncedEngagementScore[0]
            : undefined,
      };

      // Only add engagement_status if it's not "all"
      if (engagementStatus && engagementStatus !== "all") {
        filters.engagement_status = engagementStatus;
      }

      // Only add is_active if it's not "all"
      if (isActiveFilter && isActiveFilter !== "all") {
        filters.is_active = isActiveFilter === "true";
      }

      // Only add unsubscribed if it's not "all"
      if (unsubscribedFilter && unsubscribedFilter !== "all") {
        filters.unsubscribed = unsubscribedFilter === "true";
      }

      try {
        const response = await ProspectsService.getCampaignProspects(
          campaignId,
          newPage,
          itemsPerPage,
          filters
        );
      
        // Debug logging
        console.log('API Response:', response);
        console.log('Pagination data:', response.pagination);

        // Check if we have prospects in the response
        if (!response.prospects || !Array.isArray(response.prospects)) {
          console.error('Invalid prospects data in response:', response);
          throw new Error('Invalid response format: prospects data missing or invalid');
        }

        // If we got an empty page and it's not the first page, don't navigate
        if (response.prospects.length === 0 && newPage > 1) {
          // Show a toast notification
          toast({
            title: "End of prospects list",
            description: "There are no more prospects to display",
          });
          setIsLoading(false);
          return;
        }

        // Process the prospects data
        const enhancedData = response.prospects.map((prospect: CampaignProspect) => {
          // Make sure prospect_details exists to avoid errors
          const details = prospect.prospect_details || {};
          
          return {
            ...prospect,
            // Use data from prospect_details if available, otherwise use data from the parent object
            engagement_score:
              details.engagement_score !== undefined
                ? details.engagement_score
                : (prospect.engagement_score !== undefined
                    ? prospect.engagement_score
                    : 0),
            engagement_status:
              details.engagement_status ||
              prospect.engagement_status ||
              "cold",
            // Use phase from prospect_details if available, otherwise use sequence_status
            sequence_status:
              details.phase ||
              prospect.phase ||
              prospect.sequence_status ||
              "Not Started",
            is_active:
              prospect.is_active !== undefined ? prospect.is_active : true,
          };
        });

        // Update the prospects state
        setProspects(enhancedData);
        
        // Handle pagination data
        if (response.pagination) {
          // Update pagination state
          setTotalItems(response.pagination.total || 0);
          setTotalPages(response.pagination.total_pages || 1);
          setPage(newPage); // Update current page
        } else {
          // Fallback if pagination data is missing
          console.warn('Pagination data missing in response');
          setTotalItems(enhancedData.length);
          setTotalPages(Math.ceil(enhancedData.length / itemsPerPage) || 1);
          setPage(newPage);
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        throw apiError; // Re-throw to be caught by the outer try-catch
      }
    } catch (error) {
      console.error("Error fetching prospects:", error);
      
      // Get more detailed error information
      let errorMessage = "Failed to fetch prospects";
      if (error.response) {
        console.error("Error response data:", error.response.data);
        errorMessage = error.response.data?.detail || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProspectSuccess = () => {
    fetchProspects(1);
    setIsAddProspectOpen(false);
  };

  const handleBulkUploadSuccess = (result: { total: number; added: number; skipped: number; errors: number }) => {
    fetchProspects(1);
    setIsBulkUploadOpen(false);
    
    // Show toast with upload results
    toast({
      title: "Upload Complete",
      description: `Total: ${result.total}, Added: ${result.added}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
      variant: result.errors > 0 ? "destructive" : "default",
    });
  };

  const handleEditProspect = (prospect: CampaignProspect) => {
    setSelectedProspect(prospect);
    setIsEditProspectOpen(true);
  };

  const handleEditSuccess = () => {
    fetchProspects(page);
    setIsEditProspectOpen(false);
    setSelectedProspect(null);
  };

  const handleRemoveProspect = (prospect: CampaignProspect) => {
    setSelectedProspect(prospect);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveProspect = async () => {
    if (!campaignId || !selectedProspect) return;

    try {
      await ProspectsService.removeProspects({
        campaign_id: campaignId,
        prospect_ids: [selectedProspect.id],
      });

      toast({
        title: "Success",
        description: "Prospect removed successfully",
      });

      fetchProspects(page);
    } catch (error) {
      console.error("Error removing prospect:", error);
      toast({
        title: "Error",
        description: "Failed to remove prospect",
        variant: "destructive",
      });
    } finally {
      setIsRemoveDialogOpen(false);
      setSelectedProspect(null);
    }
  };

  const handleSendMail = async (prospect: CampaignProspect) => {
    if (!campaignId) return;
    
    // Check if prospect has a negative score or has unsubscribed/reported spam
    const hasNegativeScore = prospect.engagement_score !== undefined && prospect.engagement_score < 0;
    const hasUnsubscribed = prospect.unsubscribed === true;
    
    if (hasNegativeScore || hasUnsubscribed) {
      // Show confirmation dialog
      setSelectedProspect(prospect);
      setIsSendMailDialogOpen(true);
      return;
    }
    
    // If no negative indicators, send email directly
    await sendMailToProspect(prospect);
  };
  
  const confirmSendMail = async () => {
    if (!selectedProspect) return;
    
    await sendMailToProspect(selectedProspect);
    setIsSendMailDialogOpen(false);
  };
  
  const sendMailToProspect = async (prospect: CampaignProspect) => {
    if (!campaignId) return;

    try {
      setIsSendingMail(true);
      setSelectedProspect(prospect);

      await ProspectsService.sendMail(campaignId, prospect.id);

      toast({
        title: "Success",
        description: "Email sent successfully",
      });
    } catch (error) {
      console.error("Error sending mail:", error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingMail(false);
      setSelectedProspect(null);
    }
  };

  const handleToggleStatus = async (prospect: CampaignProspect) => {
    if (!campaignId) {
      toast({
        title: "Error",
        description: "Campaign ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsTogglingStatus(true);
      setSelectedProspect(prospect);

      // Toggle to the opposite of the current status
      const newStatus = !prospect.is_active;
      
      // Call the updated API with campaign ID and prospect ID
      await ProspectsService.toggleProspectStatus(
        campaignId,
        prospect.id,
        newStatus
      );

      // Update the prospect in the local state
      setProspects((prevProspects) =>
        prevProspects.map((p) =>
          p.id === prospect.id ? { ...p, is_active: newStatus } : p
        )
      );

      toast({
        title: "Success",
        description: `Prospect ${newStatus ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling prospect status:", error);
      toast({
        title: "Error",
        description: "Failed to update prospect status",
        variant: "destructive",
      });
    } finally {
      setIsTogglingStatus(false);
      setSelectedProspect(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }

    // Sort the prospects based on the selected field and direction
    const sortedProspects = [...prospects].sort((a, b) => {
      let valueA, valueB;

      // All properties are now at the top level
      valueA = a[field as keyof CampaignProspect];
      valueB = b[field as keyof CampaignProspect];

      if (valueA === undefined || valueB === undefined) return 0;

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });

    setProspects(sortedProspects);
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          {/* Temporarily hidden CRM integration button
          <Button variant="outline" className="bg-white">
            <LinkIcon className="h-4 w-4 mr-2" />
            Integrate with CRM
          </Button>
          */}
          <Button
            variant="outline"
            className="bg-white mr-2"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {isFilterOpen ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button
            variant="outline"
            className="bg-white"
            onClick={() => setIsBulkUploadOpen(true)}
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
          <Button
            variant="outline"
            className="bg-white"
            onClick={() => setIsAddProspectOpen(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Prospect
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search prospects..."
              className="pl-8 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>
      </div>

      {isFilterOpen && (
        <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Engagement Score (0-30)
            </label>
            <Slider
              defaultValue={[0]}
              max={30}
              step={1}
              value={engagementScore}
              onValueChange={setEngagementScore}
              className="my-4"
            />
            <div className="text-sm">Min: {engagementScore[0]}</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Engagement Status
            </label>
            <Select
              value={engagementStatus}
              onValueChange={setEngagementStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {engagementStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sequence Status</label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows</SelectItem>
                {actionNames.filter(name => name !== '').map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Active Status</label>
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subscription Status</label>
            <Select value={unsubscribedFilter} onValueChange={setUnsubscribedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">Subscribed</SelectItem>
                <SelectItem value="true">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortField === "name" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("email")}
                  >
                    Email
                    {sortField === "email" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("company")}
                  >
                    Organization
                    {sortField === "company" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("position")}
                  >
                    Designation
                    {sortField === "position" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("linkedin_url")}
                  >
                    LinkedIn
                    {sortField === "linkedin_url" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("engagement_status")}
                  >
                    Engagement
                    {sortField === "engagement_status" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("sequence_status")}
                  >
                    Sequence Status
                    {sortField === "sequence_status" && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Loading prospects...
                  </td>
                </tr>
              ) : prospects.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No prospects found
                  </td>
                </tr>
              ) : (
                prospects.map((prospect) => (
                  <tr
                    key={prospect.id}
                    className="hover:bg-gray-50 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {prospect.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prospect.email || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prospect.company || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prospect.position || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prospect.linkedin_url ? (
                        <a
                          href={prospect.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <Popover>
                        <PopoverTrigger asChild>
                          <div className="flex items-center cursor-help">
                            <div className="font-medium">
                              {prospect.engagement_score ? prospect.engagement_score : 0}
                            </div>
                            <div className="ml-2">
                              {prospect.engagement_score && prospect.engagement_score > 20 ? (
                                <span className="text-red-500" title="Hot">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                                  </svg>
                                </span>
                              ) : prospect.engagement_score && prospect.engagement_score > 10 ? (
                                <span className="text-yellow-500" title="Warm">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                  </svg>
                                </span>
                              ) : (
                                <span className="text-blue-500" title="Cold">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12h10"></path>
                                    <path d="M12 2v10"></path>
                                    <path d="m4.93 4.93 4.24 4.24"></path>
                                    <path d="m14.83 9.17 4.24-4.24"></path>
                                    <path d="M14.83 14.83 19.07 19.07"></path>
                                    <path d="m9.17 14.83 4.24 4.24"></path>
                                    <path d="M12 12v10"></path>
                                    <path d="M12 12h10"></path>
                                  </svg>
                                </span>
                              )}
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="text-sm">
                            <p>Engagement Score: {prospect.engagement_score} / 30</p>
                            <p>Status: {prospect.engagement_status}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prospect.sequence_status || prospect.phase || "Not Started"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-0">
                          <div className="py-1">
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                              onClick={() => handleEditProspect(prospect)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                              onClick={() => handleSendMail(prospect)}
                              disabled={
                                isSendingMail &&
                                selectedProspect?.id === prospect.id
                              }
                            >
                              {isSendingMail && selectedProspect?.id === prospect.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4 mr-2" />
                              )}
                              Send Mail
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                              onClick={() => handleToggleStatus(prospect)}
                              disabled={
                                isTogglingStatus &&
                                selectedProspect?.id === prospect.id
                              }
                            >
                              <Power className="h-4 w-4 mr-2" />
                              {prospect.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                              onClick={() => handleRemoveProspect(prospect)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 flex items-center justify-between border-t">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={isLoading || page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={isLoading || page >= totalPages}
              >
                Next
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Show:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  const newItemsPerPage = parseInt(value);
                  setItemsPerPage(newItemsPerPage);
                  // Reset to page 1 when changing items per page
                  handlePageChange(1);
                }}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {isLoading ? (
              "Loading..."
            ) : (
              `Page ${page} of ${totalPages} (${totalItems} total items)`
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isBulkUploadOpen && (
        <BulkUploadModal
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={handleBulkUploadSuccess}
        />
      )}

      {isAddProspectOpen && (
        <AddProspectModal
          onClose={() => setIsAddProspectOpen(false)}
          onSuccess={handleAddProspectSuccess}
        />
      )}

      {isEditProspectOpen && selectedProspect && (
        <EditProspectModal
          onClose={() => {
            setIsEditProspectOpen(false);
            setSelectedProspect(null);
          }}
          onSuccess={handleEditSuccess}
          prospect={selectedProspect}
        />
      )}

      {/* Confirmation Dialog for Remove */}
      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Prospect</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this prospect? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRemoveDialogOpen(false);
                setSelectedProspect(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveProspect}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirmation Dialog for Sending Email to Negative Prospects */}
      <AlertDialog
        open={isSendMailDialogOpen}
        onOpenChange={setIsSendMailDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Negative Engagement</AlertDialogTitle>
            <AlertDialogDescription>
              This prospect has replied negatively and/or unsubscribed/reported the email as spam. 
              Do you want to send an email nonetheless?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsSendMailDialogOpen(false);
                setSelectedProspect(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSendMail}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Send Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProspectsPage;
