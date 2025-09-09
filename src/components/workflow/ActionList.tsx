import { SortableList, SortableListItem } from "@/components/ui/sortable-list";
import ActionCard from "@/components/workflow/ActionCard";
import { cn } from "@/lib/utils";
import { ApiAction } from "@/services/WorkflowService"; // Fix import casing

// Define props type
interface ActionListProps {
  actions: ApiAction[];
  selectedActionId: string | null;
  onSelectAction: (id: string) => void;
  onReorder: (reorderedActions: ApiAction[]) => Promise<void>;
  onDeleteAction: (actionId: string) => Promise<void>;
}

// Define the structure SortableList expects (must include an 'id')
interface SortableActionItem extends ApiAction {
  id: string; // Ensure 'id' exists and matches action._id
}

export default function ActionList({
  actions,
  selectedActionId,
  onSelectAction,
  onReorder,
  onDeleteAction,
}: ActionListProps) {
  // Map ApiAction to the structure expected by SortableList
  const sortableItems: SortableActionItem[] = actions.map((action) => ({
    ...action,
    id: action._id, // Explicitly map _id to id
  }));

  const handleReorder = (reorderedItems: SortableActionItem[]) => {
    // Convert back to ApiAction[] if needed, or just pass the array if the handler expects it
    onReorder(reorderedItems);
  };

  const handleDeleteClick = (e: React.MouseEvent, actionId: string) => {
    e.stopPropagation(); // Prevent triggering selection when clicking delete
    onDeleteAction(actionId);
  };

  return (
    <div className="h-full flex flex-col no-scrollbar">
      {/* Only render list if there are actions */}
      {actions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">No actions yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first action to get started</p>
        </div>
      )}
      
      {actions.length > 0 && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
          
          <div className="space-y-3">
            <SortableList
              items={sortableItems}
              disabled={false}
              onReorder={handleReorder}
              renderItem={(item, disabled) => (
                <div key={item.id} className="relative flex items-start gap-3">
                  {/* Timeline dot with number */}
                  <div
                    className={cn(
                      "relative z-10 flex-shrink-0 w-6 h-6 border-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mt-1",
                      item.id === selectedActionId 
                        ? "border-purple-500 bg-purple-500" 
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    <span 
                      className={cn(
                        "text-xs font-semibold",
                        item.id === selectedActionId 
                          ? "text-white" 
                          : "text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {actions.findIndex(a => a._id === item.id) + 1}
                    </span>
                  </div>

                  {/* Card content */}
                  <div className="flex-1 min-w-0">
                    <SortableListItem
                      key={item.id}
                      item={item}
                      order={actions.findIndex(a => a._id === item.id)}
                      disabled={disabled}
                      handleDrag={() => {}}
                      className="w-full"
                      renderExtra={(item) => {
                        // Find the position of this action in the original actions array
                        const position = actions.findIndex(a => a._id === item.id);
                        return (
                          <ActionCard
                            action={item}
                            selected={item.id === selectedActionId}
                            onClick={() => onSelectAction(item.id)}
                            handleDeleteClick={handleDeleteClick}
                            position={position}
                          />
                        );
                      }}
                    />
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
