import React, {useEffect, useState} from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import GeneralSettings from "@/components/settings/GeneralSettings";
import MaterialSettings from "@/components/settings/MaterialSettings";
import ScheduleSettings from "@/components/settings/ScheduleSettings";
import OtherSettings from "@/components/settings/OtherSettings";
import { ApiCampaign } from "@/services/campaignService";
import { CampaignSettings } from "@/services/campaignSettingsService";
import {useHomeStore} from "@/store/home.store.ts";

// Define the type for the context
interface CampaignContextType {
  campaign: ApiCampaign;
  settings: CampaignSettings | null;
  updateSettings?: () => Promise<void>;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('General');
  
  // Get campaign, settings, and updateSettings function from outlet context
  const { campaign, settings, updateSettings } = useOutletContext<CampaignContextType>();
  const { setCampaignSettings } = useHomeStore((state) => state)

  useEffect(() => {
    if (settings) {
      setCampaignSettings(settings);
    }
  }, [settings, setCampaignSettings]);
  
  // Log the settings data to debug
  console.log("Settings in SettingsPage:", settings);
  console.log("Settings ID in SettingsPage:", settings?._id);

  // Helper function to normalize tab names for comparison
  const isTabActive = (tabName: string) => {
    return activeTab.toLowerCase() === tabName.toLowerCase();
  };

  return (
    <div className="h-full flex">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1">
        <div className="flex-1 bg-gray-50">
          <div className="p-8">
            {isTabActive('General') && (
              <GeneralSettings 
                settings={settings?.general} 
                campaignId={campaign?._id} 
                settingsId={settings?._id} 
                onSettingsUpdated={updateSettings}
              />
            )}
            {isTabActive('Materials') && (
              <MaterialSettings 
                settings={settings?.materials} 
                campaignId={campaign?._id} 
                settingsId={settings?._id} 
                onSettingsUpdated={updateSettings}
              />
            )}
            {isTabActive('Schedule') && (
              <ScheduleSettings 
                settings={settings?.schedule} 
                campaignId={campaign?._id} 
                settingsId={settings?._id} 
                onSettingsUpdated={updateSettings}
              />
            )}
            {isTabActive('Others') && (
              <OtherSettings 
                settings={settings?.others} 
                campaignId={campaign?._id} 
                settingsId={settings?._id} 
                onSettingsUpdated={updateSettings}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
