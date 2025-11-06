import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CampaignTab {
  label: string;
  path: string;
}

interface CampaignTabsProps {
  campaignId: string;
  isActive: boolean;
}

const CampaignTabs: React.FC<CampaignTabsProps> = ({ campaignId, isActive }) => {
  const location = useLocation();

  const allTabs: CampaignTab[] = [
    { label: "Settings", path: `/campaign/${campaignId}/settings` },
    { label: "Prospects", path: `/campaign/${campaignId}/prospects` },
    { label: "Knowledge Base", path: `/campaign/${campaignId}/knowledge-base` },
    { label: "Workflow", path: `/campaign/${campaignId}/workflow` },
    { label: "Analytics", path: `/campaign/${campaignId}/analytics` },
  ];

  const tabs = allTabs;

  return (
    <nav className="-mb-px">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={cn(
            "inline-block px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            location.pathname === tab.path
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
};

export default CampaignTabs;
