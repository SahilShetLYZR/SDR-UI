import { useState, useEffect, useCallback } from 'react';
import { ProspectsService } from '@/services/prospectsService';
import { Prospect, ProspectsResponse } from '@/types/prospects';
import debounce from 'lodash/debounce';
import { useToast } from '@/components/ui/use-toast';

export interface ProspectsFilters {
  replied?: boolean;
  meeting_clicked?: boolean;
  opened?: boolean;
  engagement_status?: string;
  phase?: string;
  is_active?: boolean;
  unsubscribed?: boolean;
}

interface UseProspectsReturn {
  prospects: Prospect[];
  loading: boolean;
  error: Error | null;
  total: number;
  page: number;
  pages: number;
  search: string;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setFilters: (filters: ProspectsFilters) => void;
  filters: ProspectsFilters;
}

/**
 * Custom hook for managing prospects data with search and pagination
 * @param pageSize - Number of items per page
 * @param campaignId - Optional campaign ID to filter prospects
 */
export const useProspects = (pageSize: number = 10, campaignId?: string): UseProspectsReturn => {
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearchTerm] = useState('');
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [filters, setFilters] = useState<ProspectsFilters>({});

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setPage(1); // Reset to first page on new search
      fetchProspects(1, searchTerm, filters);
    }, 500),
    [campaignId, filters]
  );

  // Fetch prospects from API
  const fetchProspects = async (currentPage: number, searchTerm: string, currentFilters: ProspectsFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!campaignId) {
        console.warn('Campaign ID is missing in useProspects hook');
        setProspects([]);
        setTotal(0);
        setPages(1);
        setHasNextPage(false);
        setHasPreviousPage(false);
        setLoading(false);
        return;
      }
      
      console.log('Fetching prospects with filters:', currentFilters); // Debug log
      
      const response = await ProspectsService.getCampaignProspects(
        campaignId,
        currentPage,
        pageSize,
        { 
          searchString: searchTerm,
          ...currentFilters
        }
      );
      
      // Handle the new response format with prospects array and pagination object
      if (!response.prospects || !response.pagination) {
        console.error('Unexpected response format:', response);
        setProspects([]);
        setTotal(0);
        setPages(1);
        setLoading(false);
        return;
      }
      
      // If we got an empty page and it's not the first page, stay on the current page
      if (response.prospects.length === 0 && currentPage > 1) {
        // Show a toast notification
        toast({
          title: "End of prospects list",
          description: "There are no more prospects to display",
        });
        
        // Don't update the page state, just return
        setLoading(false);
        return;
      }
      
      // Transform CampaignProspect[] to Prospect[] to match the expected interface
      const transformedProspects: Prospect[] = response.prospects.map(prospect => ({
        id: prospect.id,
        name: prospect.name,
        email: prospect.email,
        organization: prospect.company || '',
        designation: prospect.position || '',
        engagementScore: prospect.engagement_score || 0,
        engagementStatus: prospect.engagement_status || '',
        sequenceStatus: prospect.sequence_status || prospect.phase || ''
      }));
      
      setProspects(transformedProspects);
      setTotal(response.pagination.total);
      setPages(response.pagination.total_pages);
      
      // Update pagination state
      setHasNextPage(response.pagination.has_next);
      setHasPreviousPage(response.pagination.has_prev);
      
      // Only update the page if we got data
      if (response.prospects.length > 0) {
        setPage(response.pagination.current_page);
      }
    } catch (err) {
      console.error('Error fetching prospects:', err);
      setError(err as Error);
      // Don't change the current page on error
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const setSearch = useCallback((value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    // Always attempt to fetch the requested page
    fetchProspects(newPage, search, filters);
  }, [search, campaignId, filters]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ProspectsFilters) => {
    console.log('Filters changed:', newFilters); // Debug log
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
    fetchProspects(1, search, newFilters);
  }, [search, campaignId]);

  // Initial fetch and refetch when campaign ID changes
  useEffect(() => {
    fetchProspects(page, search, filters);
  }, [campaignId]);

  return {
    prospects,
    loading,
    error,
    total,
    page,
    pages,
    search,
    setSearch,
    setPage: handlePageChange,
    hasNextPage,
    hasPreviousPage,
    setFilters: handleFiltersChange,
    filters,
  };
};
