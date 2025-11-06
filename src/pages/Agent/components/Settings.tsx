import { useState, useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import GeneralSettings from "@/components/settings/GeneralSettings"
import SettingsSidebar from "@/components/settings/SettingsSidebar"
import MaterialSettings from "@/components/settings/MaterialSettings"
import ScheduleSettings from "@/components/settings/ScheduleSettings"
import OtherSettings from "@/components/settings/OtherSettings"
import { Loader2 } from "lucide-react"
import { CampaignSettings } from "@/services/campaignSettingsService"
import { ApiCampaign } from "@/services/campaignService"

// Define the type for the outlet context
interface CampaignOutletContext {
  campaign: ApiCampaign;
  settings: CampaignSettings | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General")
  const { campaign, settings } = useOutletContext<CampaignOutletContext>()
  
  // Helper function to normalize tab names for comparison
  const isTabActive = (tabName: string) => {
    return activeTab.toLowerCase() === tabName.toLowerCase();
  };

  useEffect(() => {
    if (campaign) {
      console.log("Campaign in Settings component:", campaign);
      console.log("Settings ID from campaign:", campaign.settings_id);
    }
  }, [campaign]);

  if (!settings || !campaign) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-semibold">Campaign Settings</h1>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
            {isTabActive("General") && (
              <GeneralSettings 
                settings={settings.general} 
                campaignId={campaign._id} 
                settingsId={campaign.settings_id} 
              />
            )}
            {isTabActive("Materials") && (
              <MaterialSettings 
                settings={settings.materials} 
                campaignId={campaign._id} 
                settingsId={campaign.settings_id} 
              />
            )}
            {isTabActive("Schedule") && (
              <ScheduleSettings 
                settings={settings.schedule} 
                campaignId={campaign._id} 
                settingsId={campaign.settings_id} 
              />
            )}
            {isTabActive("Others") && (
              <OtherSettings 
                settings={settings.others} 
                campaignId={campaign._id} 
                settingsId={campaign.settings_id} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
