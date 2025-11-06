import { useState, useCallback, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FlowOrder from "@/components/workflow/FlowOrder";
import ActionDetails from "@/components/workflow/ActionDetails";
import WorkflowChat from "@/components/workflow/WorkflowChat";
import EmailTemplateEditor from "@/components/workflow/EmailTemplateEditor";
import {
  workflowService,
  ApiWorkflowWithActions,
  ApiAction,
  UpdateActionRequest,
  DeleteActionRequest,
  ReorderActionsRequest,
} from "@/services/WorkflowService";
import { toast } from "sonner";

type WorkflowContext = {
  isActive: boolean;
};

// Query Keys
const queryKeys = {
  workflow: (campaignId: string) => ['workflow', campaignId] as const,
};

export default function Workflow() {
  const { id: campaignId } = useParams<{ id: string }>();
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [previousSelectedActionId, setPreviousSelectedActionId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isActive } = useOutletContext<WorkflowContext>();

  // Query for fetching workflow data
  const {
    data: workflowData,
    isLoading,
    error,
    refetch: refetchWorkflow,
  } = useQuery<ApiWorkflowWithActions, Error>({
    queryKey: queryKeys.workflow(campaignId!),
    queryFn: () => workflowService.getWorkflowWithActionsByCampaign(campaignId!),
    enabled: !!campaignId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const workflowId = workflowData?._id;

  // Reset selected action when workflow data changes
  useEffect(() => {
    if (workflowData) {
      setSelectedActionId(null);
    }
  }, [workflowData]);

  // Handle query errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching workflow:", error);
      toast.error("Failed to load workflow data.");
    }
  }, [error]);

  // Mutation for updating actions
  const updateActionMutation = useMutation({
    mutationFn: (actionUpdateData: Omit<UpdateActionRequest, "workflow_id">) => {
      if (!workflowId) throw new Error("Workflow ID is missing");
      const fullUpdateData: UpdateActionRequest = {
        ...actionUpdateData,
        workflow_id: workflowId,
      };
      return workflowService.updateAction(fullUpdateData);
    },
    onMutate: async (actionUpdateData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.workflow(campaignId!) });

      // Snapshot the previous value
      const previousWorkflow = queryClient.getQueryData<ApiWorkflowWithActions>(queryKeys.workflow(campaignId!));

      // Optimistically update to the new value
      queryClient.setQueryData<ApiWorkflowWithActions>(queryKeys.workflow(campaignId!), (old) => {
        if (!old) return old;
        const updatedActions = old.actions.map((action) =>
          action._id === actionUpdateData.action_id
            ? { ...action, ...actionUpdateData }
            : action
        );
        return { ...old, actions: updatedActions };
      });

      return { previousWorkflow };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousWorkflow) {
        queryClient.setQueryData(queryKeys.workflow(campaignId!), context.previousWorkflow);
      }
      console.error("Error updating action:", err);
      toast.error("Failed to update action.");
    },
    onSuccess: (updatedAction) => {
      toast.success(`Action "${updatedAction.name}" updated.`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow(campaignId!) });
    },
  });

  // Mutation for deleting actions
  const deleteActionMutation = useMutation({
    mutationFn: (actionIdToDelete: string) => {
      if (!workflowId) throw new Error("Workflow ID is missing");
      const deleteData: DeleteActionRequest = {
        workflow_id: workflowId,
        action_id: actionIdToDelete,
      };
      return workflowService.deleteAction(deleteData);
    },
    onMutate: async (actionIdToDelete) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.workflow(campaignId!) });

      // Snapshot the previous value
      const previousWorkflow = queryClient.getQueryData<ApiWorkflowWithActions>(queryKeys.workflow(campaignId!));

      // Get action name for toast
      const actionToDelete = workflowData?.actions.find((a) => a._id === actionIdToDelete);

      // Optimistically remove the action
      queryClient.setQueryData<ApiWorkflowWithActions>(queryKeys.workflow(campaignId!), (old) => {
        if (!old) return old;
        const updatedActions = old.actions.filter((action) => action._id !== actionIdToDelete);
        const updatedGraph = old.action_graph.filter((id) => id !== actionIdToDelete);
        return {
          ...old,
          actions: updatedActions,
          action_graph: updatedGraph,
        };
      });

      // Clear selection if deleted action was selected
      if (selectedActionId === actionIdToDelete) {
        setSelectedActionId(null);
      }

      return { previousWorkflow, actionToDelete };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousWorkflow) {
        queryClient.setQueryData(queryKeys.workflow(campaignId!), context.previousWorkflow);
      }
      console.error("Error deleting action:", err);
      toast.error("Failed to delete action.");
    },
    onSuccess: (_, actionIdToDelete, context) => {
      const actionName = context?.actionToDelete?.name || "Action";
      toast.success(`Action "${actionName}" deleted.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow(campaignId!) });
    },
  });

  // Mutation for reordering actions
  const reorderActionsMutation = useMutation({
    mutationFn: (reorderedActions: ApiAction[]) => {
      if (!workflowId) throw new Error("Workflow ID is missing");
      const newOrderIds = reorderedActions.map((action) => action._id);
      const reorderData: ReorderActionsRequest = {
        workflow_id: workflowId,
        new_order: newOrderIds,
      };
      return workflowService.reorderActions(reorderData);
    },
    onMutate: async (reorderedActions) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.workflow(campaignId!) });

      // Snapshot the previous value
      const previousWorkflow = queryClient.getQueryData<ApiWorkflowWithActions>(queryKeys.workflow(campaignId!));

      // Optimistically update the order
      const newOrderIds = reorderedActions.map((action) => action._id);
      queryClient.setQueryData<ApiWorkflowWithActions>(queryKeys.workflow(campaignId!), (old) => {
        if (!old) return old;
        return {
          ...old,
          actions: reorderedActions,
          action_graph: newOrderIds,
        };
      });

      return { previousWorkflow };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousWorkflow) {
        queryClient.setQueryData(queryKeys.workflow(campaignId!), context.previousWorkflow);
      }
      console.error("Error reordering actions:", err);
      toast.error("Failed to reorder actions.");
    },
    onSuccess: (updatedWorkflow) => {
      // Update with confirmed data from API
      queryClient.setQueryData<ApiWorkflowWithActions>(queryKeys.workflow(campaignId!), (old) => {
        if (!old) return old;
        return {
          ...old,
          action_graph: updatedWorkflow.action_graph,
          updated_at: updatedWorkflow.updated_at,
        };
      });
      toast.success("Actions reordered.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow(campaignId!) });
    },
  });

  

  // Handler functions that use the mutations
  const handleSelectAction = useCallback((actionId: string) => {
    setSelectedActionId(actionId);
    setPreviousSelectedActionId(null); // Clear previous selection when manually selecting
  }, []);

  const handleUpdateAction = useCallback(
    (actionUpdateData: Omit<UpdateActionRequest, "workflow_id">) => {
      updateActionMutation.mutate(actionUpdateData);
    },
    [updateActionMutation]
  );

  const handleDeleteAction = useCallback(
    async (actionIdToDelete: string) => {
      deleteActionMutation.mutate(actionIdToDelete);
    },
    [deleteActionMutation]
  );

  const handleReorderActions = useCallback(
    async (reorderedActions: ApiAction[]) => {
      reorderActionsMutation.mutate(reorderedActions);
    },
    [reorderActionsMutation]
  );



  // Handler for edit workflow button
  const handleEditWorkflow = useCallback(() => {
    setPreviousSelectedActionId(selectedActionId); // Store current selection
    setSelectedActionId(null); // Deselect current action to show WorkflowChat
  }, [selectedActionId]);

  // Derived state
  const selectedAction =
    workflowData?.actions.find((action) => action._id === selectedActionId) ?? null;

  // Determine if we're in editing mode (has actions but no selection)
  const isEditingMode = workflowData?.actions.length > 0 && !selectedActionId;

  // Convert error to string for display
  const errorMessage = error instanceof Error ? error.message : "Failed to load workflow data.";

  // Render logic
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-var(--header-height,60px))] w-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
          <div className="text-xl font-medium">Loading workflow...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {errorMessage}</div>;
  }

  if (!workflowData || !workflowId) {
    return <div className="p-4">Workflow data not found or missing ID.</div>;
  }

  return (
    <div className="py-4 h-[calc(100vh-var(--header-height,60px))] w-full flex space-x-4">
      <div className="p-4 h-full flex flex-col space-y-3 w-1/5 border-r dark:border-gray-700">
        <FlowOrder
          actions={workflowData.actions || []}
          selectedActionId={selectedActionId}
          workflowId={workflowId}
          onSelectAction={handleSelectAction}
          onReorder={handleReorderActions}
          onDeleteAction={handleDeleteAction}
          onEditWorkflow={handleEditWorkflow}
        />
      </div>
      <div className="p-4 w-4/5 h-full rounded-xl flex flex-col gap-4">
        {selectedAction ? (
          <EmailTemplateEditor
            selectedAction={selectedAction}
            campaignId={campaignId}
            workflowId={workflowId}
          />
        ) : (
          <WorkflowChat
            campaignId={campaignId}
            workflowId={workflowId}
            onWorkflowUpdate={refetchWorkflow}
            isEditingMode={isEditingMode}
            onSelectAction={handleSelectAction}
            actions={workflowData?.actions || []}
            previousSelectedActionId={previousSelectedActionId}
          />
        )}
      </div>
    </div>
  );
}
