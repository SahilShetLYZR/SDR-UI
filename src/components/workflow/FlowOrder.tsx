import ActionList from "@/components/workflow/ActionList";
import { ApiAction } from "@/services/WorkflowService"; // Adjust path

// Define props type
interface FlowOrderProps {
  actions: ApiAction[];
  selectedActionId: string | null;
  workflowId: string;
  onSelectAction: (id: string) => void;
  onReorder: (reorderedActions: ApiAction[]) => Promise<void>;
  onDeleteAction: (actionId: string) => Promise<void>;
  onEditWorkflow: () => void;
}

export default function FlowOrder({
  actions,
  selectedActionId,
  workflowId,
  onSelectAction,
  onReorder,
  onDeleteAction,
  onEditWorkflow,
}: FlowOrderProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header Section */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Flow Order</h3>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{actions.length}</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">steps</span>
          </div>
        </div>
      </div>

      {/* Edit Workflow Section - Only show when actions exist */}
      {actions.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <button
            onClick={onEditWorkflow}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-3 transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2 text-sm font-medium"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            Edit Workflow
          </button>
        </div>
      )}

      {/* Actions List Section */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="p-4">
          <ActionList
            actions={actions}
            selectedActionId={selectedActionId}
            onSelectAction={onSelectAction}
            onReorder={onReorder}
            onDeleteAction={onDeleteAction}
          />
        </div>
      </div>
    </div>
  );
}
