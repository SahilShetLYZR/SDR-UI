import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { SearchIcon } from "@/components/icons";
import { FilterIcon } from "@/components/icons/filter-icon";
import { useProspects, ProspectsFilters } from '@/hooks/useProspects';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Prospect } from '@/types/prospects';
import api from '@/lib/api';
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
import { cn } from "@/lib/utils";

interface ProspectsListProps {
  onProspectClick: (prospectId: string) => void;
  campaignId?: string;
  showPaginationInfo?: boolean;
  showFilter?: boolean;
}

// No longer need to store mapping as we now use the id directly

/**
 * ProspectsList component displays a searchable, paginated list of prospects
 */
export const ProspectsList: React.FC<ProspectsListProps> = ({ 
  onProspectClick, 
  campaignId,
  showPaginationInfo = false, 
  showFilter = true
}) => {
  const [actionNames, setActionNames] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const {
    prospects,
    loading,
    error,
    total,
    page,
    pages,
    search,
    setSearch,
    setPage,
    hasNextPage,
    hasPreviousPage,
    setFilters,
    filters
  } = useProspects(10, campaignId);

  // Fetch action names when component mounts or campaignId changes
  useEffect(() => {
    if (!campaignId) return;
    
    api.get(`/workflow/action-names/by-campaign/${campaignId}`)
      .then(response => {
        if (response.data && response.data.action_names) {
          setActionNames(response.data.action_names.filter(name => name && typeof name === 'string'));
        }
      })
      .catch(error => {
        console.error('Error fetching action names:', error);
      });
  }, [campaignId]);

  // No longer need to fetch original prospect data as we now use the id directly

  // Handle prospect click with the id directly
  const handleProspectClick = (id: string) => {
    console.log('Prospect clicked, id:', id);
    onProspectClick(id);
  };

  // Handle quick filter buttons
  const handleQuickFilter = (filterType: string, value?: boolean) => {
    let newFilters: ProspectsFilters = {};
    
    if (filterType === 'all') {
      // Clear all filters for "All"
      newFilters = {};
    } else if (filterType === 'unsubscribed') {
      newFilters = filters.unsubscribed === true ? {} : { unsubscribed: true };
    } else if (filterType === 'unread') {
      newFilters = filters.opened === false ? {} : { opened: false };
    } else {
      // Handle boolean filters (replied, meeting_clicked, opened)
      newFilters = { ...filters };
      
      if (value !== undefined) {
        // If the same filter is clicked again, remove it (toggle off)
        if (newFilters[filterType as keyof ProspectsFilters] === value) {
          // Remove the filter by deleting the property
          if (filterType === 'replied') {
            delete newFilters.replied;
          } else if (filterType === 'meeting_clicked') {
            delete newFilters.meeting_clicked;
          } else if (filterType === 'opened') {
            delete newFilters.opened;
          }
        } else {
          // Set the new filter value
          if (filterType === 'replied') {
            newFilters.replied = value;
          } else if (filterType === 'meeting_clicked') {
            newFilters.meeting_clicked = value;
          } else if (filterType === 'opened') {
            newFilters.opened = value;
          }
        }
      }
    }
    
    console.log('Setting new filters:', newFilters); // Debug log
    setFilters(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
  };

  // Count active filters
  const activeFiltersCount = Object.keys(filters).length;

  // Check if "All" is selected (no filters active)
  const isAllSelected = activeFiltersCount === 0;

  return (
    <div className="space-y-4">
      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={isAllSelected ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter('all')}
          className={cn(
            "text-xs h-7",
            isAllSelected && "bg-gray-600 hover:bg-gray-700"
          )}
        >
          All
        </Button>
        
        <Button
          variant={filters.replied === true ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter('replied', true)}
          className={cn(
            "text-xs h-7",
            filters.replied === true && "bg-green-600 hover:bg-green-700"
          )}
        >
          Replied
        </Button>
        
        <Button
          variant={filters.replied === false ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter('replied', false)}
          className={cn(
            "text-xs h-7",
            filters.replied === false && "bg-red-600 hover:bg-red-700"
          )}
        >
          Not Replied
        </Button>
        
        <Button
          variant={filters.meeting_clicked === true ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter('meeting_clicked', true)}
          className={cn(
            "text-xs h-7",
            filters.meeting_clicked === true && "bg-purple-600 hover:bg-purple-700"
          )}
        >
          Meeting Clicks
        </Button>
        
        <Button
          variant={filters.opened === true ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter('opened', true)}
          className={cn(
            "text-xs h-7",
            filters.opened === true && "bg-blue-600 hover:bg-blue-700"
          )}
        >
          Opened
        </Button>
        
        {/* <Button
          variant={filters.opened === false ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter('opened', false)}
          className={cn(
            "text-xs h-7",
            filters.opened === false && "bg-gray-600 hover:bg-gray-700"
          )}
        >
          Not Opened
        </Button> */}

        <Button
          variant={filters.unsubscribed === true ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter('unsubscribed')}
          className={cn(
            "text-xs h-7",
            filters.unsubscribed === true && "bg-orange-600 hover:bg-orange-700"
          )}
        >
          Unsubscribed
        </Button>

        {/* <Button
          variant={filters.opened === false && !filters.replied && !filters.meeting_clicked && !filters.unsubscribed ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter('unread')}
          className={cn(
            "text-xs h-7",
            filters.opened === false && !filters.replied && !filters.meeting_clicked && !filters.unsubscribed && "bg-yellow-600 hover:bg-yellow-700"
          )}
        >
          Unread
        </Button> */}

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs h-7 text-gray-500 hover:text-gray-700"
          >
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search prospects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {showFilter && (
          <div className="flex items-center">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter by Action</h4>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Workflows</SelectItem>
                      {actionNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Prospects List */}
      <div className="border rounded-md overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-500">Error loading prospects</div>
        ) : prospects.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No prospects found</div>
        ) : (
          <div className="divide-y">
            {prospects.map((prospect) => (
              <div 
                key={prospect.id} 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleProspectClick(prospect.id)}
              >
                <div className="font-medium">{prospect.name}</div>
                <div className="text-sm text-gray-500">{prospect.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination - Always visible and clickable */}
      <div className="flex justify-between items-center">
        {showPaginationInfo ? (
          <div className="text-sm text-gray-500">
            {total > 0 ? (
              <>
                Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} prospects
              </>
            ) : (
              <>No prospects found</>
            )}
          </div>
        ) : (
          <div></div> 
        )}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => page > 1 && setPage(page - 1)}
            disabled={loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
