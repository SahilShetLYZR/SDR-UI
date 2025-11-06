import { cn } from "@/lib/utils.ts"

// Define the tab names with consistent casing
const tabs = ["General", "Materials", "Schedule", "Others"]

// Add proper TypeScript types
interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  // Helper function to normalize tab names for comparison
  const isTabActive = (tabName: string) => {
    return activeTab.toLowerCase() === tabName.toLowerCase();
  };
  
  return (
    <div className="w-44 border-r p-2">
      {tabs.map((tab) => (
        <div
          key={tab}
          className={cn(
            "cursor-pointer rounded px-3 py-2 text-sm",
            isTabActive(tab)
              ? "bg-muted font-medium"
              : "hover:bg-muted/50 text-muted-foreground"
          )}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </div>
      ))}
    </div>
  )
}
