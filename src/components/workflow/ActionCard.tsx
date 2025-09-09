import { cn } from "@/lib/utils";
import { ApiAction } from "@/services/WorkflowService"; // Adjust path
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Trash2, Mail, User, Info } from "lucide-react"; // Import icons

// Helper function to get ordinal number (1st, 2nd, 3rd, etc.)
const getOrdinal = (num: number): string => {
  const ordinals = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
  return ordinals[num - 1] || `${num}th`;
};

// Helper function to convert time interval to days
const convertToDays = (timeInterval: number): number => {
  // If timeInterval is very large (> 365), assume it's in seconds and convert to days
  // If timeInterval is small (≤ 365), assume it's already in days
  if (timeInterval > 365) {
    // Convert seconds to days (86400 seconds = 1 day)
    return Math.round(timeInterval / 86400);
  }
  // Already in days
  return timeInterval;
};

// Helper function to generate timing message
const getTimingMessage = (timeInterval: number, position: number): string => {
  if (position === 0) {
    return "This mail will be sent as the first action";
  }
  
  const ordinalPosition = getOrdinal(position);
  const daysInterval = convertToDays(timeInterval);
  
  if (daysInterval === 0) {
    return `This mail will be sent on the same day as completing the ${ordinalPosition} action`;
  }
  
  const days = daysInterval === 1 ? "day" : "days";
  return `This mail will be sent ${daysInterval} ${days} after completing the ${ordinalPosition} action`;
};

export default function ActionCard({
  action,
  selected,
  onClick,
  handleDeleteClick,
  position,
}: {
  action: ApiAction; // Expect ApiAction object
  selected: boolean;
  onClick: () => void; // Define onClick prop type
  handleDeleteClick: (e: React.MouseEvent, actionId: string) => void;
  position: number; // Position of action in the workflow (0-based index)
}) {
  // Handle cases where action might be null/undefined if needed
  const actionName = action?.name ?? "Unnamed Action";
  const timingMessage = getTimingMessage(action?.time_interval ?? 0, position);
  const timeInterval = action?.time_interval ?? 0;
  
  // Get display text for time interval
  const getTimeDisplay = () => {
    if (position === 0) {
      return "First action";
    }
    const daysInterval = convertToDays(timeInterval);
    if (daysInterval === 0) {
      return "Same day";
    }
    const days = daysInterval === 1 ? "day" : "days";
    return `${daysInterval} ${days}`;
  };

  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg shadow-sm bg-white dark:bg-slate-800 cursor-pointer border border-gray-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md w-full",
        selected &&
          "bg-purple-50 border-purple-300 shadow-md dark:bg-purple-900/20 dark:border-purple-500",
        "hover:bg-gray-50 dark:hover:bg-slate-700",
      )}
      onClick={onClick}
    >
      {/* Main Content */}
      <div className="flex items-start justify-between gap-2 min-h-0">
        {/* Left side - Text content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium text-sm leading-tight mb-1 text-gray-900 dark:text-gray-100",
            selected && "text-purple-700 dark:text-purple-300 font-semibold",
          )}>
            <span className="line-clamp-2 break-words">
              {actionName}
            </span>
          </h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-help">
                  <Mail size={14} />
                  <span className="truncate">{getTimeDisplay()}</span>
                  <Info size={12} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">{timingMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right side - Delete button */}
        <div className="flex-shrink-0 ml-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              selected && "opacity-100" // Always show when selected
            )}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card selection
              handleDeleteClick(e, action._id); // Fix: use action._id instead of action.id
            }}
            aria-label={`Delete ${actionName}`}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg" />
      )}
    </div>
  );
}
