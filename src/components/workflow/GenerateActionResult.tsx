// src/components/workflow/GenerateActionResult.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ProspectsService,
  CampaignProspect,
} from "@/services/prospectsService"; // Adjust path
import { ActionApiService } from "@/services/ActionApiService"; // Adjust path
import { CampaignMailService } from "@/services/CampaignMailService"; // Adjust path

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Zap } from "lucide-react";

// --- Constants ---
const MAX_POLLING_ATTEMPTS = 150; // poll every 2 seconds for 5 minutes
const POLLING_INTERVAL_MS = 2000; // 2 seconds
const PROSPECTS_PAGE_SIZE = 50; // Fetch 50 prospects initially

// --- Props Interface ---
interface GenerateActionResultProps {
  campaignId: string;
  actionId: string;
  onGenerationStart: (prospectId: string) => void; // Notify parent that generation started
  onGenerationStatusUpdate: (status: string) => void; // Notify parent of polling status
  onGenerationComplete: (result: { subject: string; content: string; from_email?: string; to_email?: string }) => void; // Pass result to parent
  onGenerationError: (error: string) => void; // Pass error to parent
}

export default function GenerateActionResult({
  campaignId,
  actionId,
  onGenerationStart,
  onGenerationStatusUpdate,
  onGenerationComplete,
  onGenerationError,
}: GenerateActionResultProps) {
  // --- State ---
  const [open, setOpen] = useState(false); // Control dialog visibility
  const [prospects, setProspects] = useState<CampaignProspect[]>([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState<boolean>(false);
  const [prospectsError, setProspectsError] = useState<string | null>(null);

  // Refs for polling logic
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef<number>(0);

  // --- Polling Logic ---
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollingAttemptsRef.current = 0; // Reset attempts
  }, []);

  const pollActionResult = useCallback(
    (resultId: string) => {
      stopPolling(); // Clear any previous interval
      pollingAttemptsRef.current = 0; // Reset attempts counter

      pollingIntervalRef.current = setInterval(async () => {
        pollingAttemptsRef.current += 1;
        if (pollingAttemptsRef.current > MAX_POLLING_ATTEMPTS) {
          stopPolling();
          onGenerationError("Sample generation timed out. Please try again.");
          return;
        }

        try {
          const result = await CampaignMailService.getActionResult(resultId);

          // Update status text via callback
          if (result.action_status?.status_text) {
            onGenerationStatusUpdate(result.action_status.status_text);
          }

          // Check for backend error
          if (result.action_status?.error_text) {
            stopPolling();
            onGenerationError(result.action_status.error_text);
            return;
          }

          // Check if content is filled (success condition)
          // Ensure both subject and content are non-empty strings
          if (result.subject && result.content) {
            stopPolling();
            onGenerationComplete({
              subject: result.subject,
              content: result.content,
              from_email: result.from_email,
              to_email: result.to_email
            });
          }
          // Keep polling if not finished and no error
        } catch (error: any) {
          // Handle fetch error (e.g., 404 if not created yet, or 500)
          if (
            error?.response?.status !== 404 ||
            pollingAttemptsRef.current > 5
          ) {
            console.error("Polling error:", error);
            stopPolling();
            onGenerationError("Failed to check generation status.");
          } else {
            console.log("Action result not found yet, continuing poll...");
            onGenerationStatusUpdate(
              "Waiting for generation process to start...",
            );
          }
        }
      }, POLLING_INTERVAL_MS);
    },
    [
      stopPolling,
      onGenerationError,
      onGenerationComplete,
      onGenerationStatusUpdate,
    ],
  );

  // --- Sample Generation Trigger ---
  const triggerSampleGeneration = useCallback(
    async (prospectId: string) => {
      // Check IDs again just in case
      if (!campaignId || !actionId || !prospectId) {
        // This case should ideally be prevented by disabling the button if IDs are missing,
        // but good to have a check here.
        onGenerationError("Cannot start generation: Missing required IDs.");
        return;
      }

      onGenerationStart(prospectId); // Notify parent generation is starting

      try {
        const response = await ActionApiService.runSampleAction(
          campaignId,
          prospectId,
          actionId,
        );
        // Start polling
        pollActionResult(response.action_result_id);
      } catch (error) {
        console.error("Failed to initiate sample generation:", error);
        // Try to provide a more specific error if possible
        const errorMsg =
          error?.response?.data?.detail ||
          "Failed to start sample generation process.";
        onGenerationError(errorMsg);
        stopPolling(); // Ensure polling is stopped if initial call fails
      }
    },
    [
      campaignId,
      actionId,
      onGenerationStart,
      onGenerationError,
      pollActionResult,
      stopPolling,
    ],
  );

  // --- Fetch Prospects ---
  const fetchProspects = useCallback(async () => {
    // Ensure campaignId is present before fetching
    if (!campaignId) {
      setProspectsError("Cannot load prospects: Campaign ID is missing.");
      return;
    }
    setIsLoadingProspects(true);
    setProspectsError(null);
    setProspects([]); // Clear previous results
    try {
      const prospectsData = await ProspectsService.getCampaignProspects(
        campaignId,
        1,
        PROSPECTS_PAGE_SIZE,
      );
      // Handle the new response structure with prospects and pagination
      if (prospectsData && Array.isArray(prospectsData.prospects)) {
        setProspects(prospectsData.prospects);
      } else if (Array.isArray(prospectsData)) {
        // Fallback for backward compatibility
        setProspects(prospectsData);
      } else {
        console.error("Unexpected prospects data format:", prospectsData);
        setProspectsError("Failed to parse prospect data.");
        setProspects([]);
      }
    } catch (error) {
      console.error("Error fetching prospects:", error);
      setProspectsError("Failed to load prospects. Please try again.");
    } finally {
      setIsLoadingProspects(false);
    }
  }, [campaignId]); // Re-fetch if campaignId changes

  // --- Effects ---
  // Fetch prospects when the dialog opens
  useEffect(() => {
    if (open) {
      fetchProspects();
    }
    // Optional: Clear prospects/error when dialog closes?
    // else {
    //    setProspects([]);
    //    setProspectsError(null);
    // }
  }, [open, fetchProspects]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // --- Render ---
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="primary"
          // Disable the trigger if essential IDs are missing
          disabled={!campaignId || !actionId}
          title={
            !campaignId || !actionId
              ? "Cannot generate sample without Campaign and Action IDs"
              : "Generate Action Result"
          }
          className="bg-primary hover:shadow-lg text-white"
        >
          <Zap className="mr-2 h-4 w-4" />
          <span>Generate Action Result</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Prospect</DialogTitle>
          <DialogDescription>
            Search and select a prospect to generate a sample email.
          </DialogDescription>
        </DialogHeader>
        <Command className="mt-4">
          {" "}
          {/* Added margin top */}
          <CommandInput
            placeholder="Search by name or email..."
            disabled={isLoadingProspects || !!prospectsError} // Disable while loading or if error occurred
          />
          <ScrollArea className="h-72 mt-2 border rounded-md">
            {" "}
            {/* Added margin top and border */}
            <CommandList>
              {isLoadingProspects && (
                <div className="flex justify-center items-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoadingProspects && prospectsError && (
                <div className="p-4 text-center text-sm text-destructive">
                  {prospectsError}
                </div>
              )}
              {!isLoadingProspects &&
                !prospectsError &&
                prospects.length === 0 && (
                  <CommandEmpty>
                    No prospects found for this campaign.
                  </CommandEmpty>
                )}
              {!isLoadingProspects &&
                !prospectsError &&
                prospects.length > 0 && (
                  // Optionally add heading <CommandGroup heading={`${prospects.length} Prospects`}>
                  <CommandGroup>
                    {prospects.map((prospect) => {
                      // Construct a value for filtering that includes key info
                      const filterValue =
                        `${prospect.name || ""} ${prospect.email || ""} ${prospect.company || ""}`.toLowerCase();
                      const prospectName = prospect.name || "";
                      const prospectEmail = prospect.email || "No Email";

                      return (
                        <CommandItem
                          key={prospect.id}
                          value={filterValue} // Use combined value for filtering
                          onSelect={() => {
                            setOpen(false); // Close dialog
                            triggerSampleGeneration(prospect.id); // Trigger generation
                          }}
                          className="cursor-pointer flex flex-col items-start p-3" // Style for better display
                        >
                          <span className="font-medium text-sm">
                            {prospectName || "Unnamed Prospect"}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {prospectEmail}
                          </span>
                          {prospect.company && (
                            <span className="text-xs text-muted-foreground/80 mt-0.5">
                              {prospect.company}
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
            </CommandList>
          </ScrollArea>
        </Command>
        {/* Footer is optional, selection closes dialog */}
        {/* <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
