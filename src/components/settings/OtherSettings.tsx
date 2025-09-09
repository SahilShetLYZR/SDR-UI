import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { OtherSettings as OtherSettingsType } from "@/services/campaignSettingsService";
import { useToast } from "@/components/ui/use-toast";
import { campaignSettingsService } from "@/services/campaignSettingsService";

interface OtherSettingsProps {
  settings?: OtherSettingsType;
  campaignId?: string;
  settingsId?: string;
  onSettingsUpdated?: () => Promise<void>;
}

export default function OtherSettings({ settings, campaignId, settingsId, onSettingsUpdated }: OtherSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState({
    websiteUrl: '',
    ccList: '',
    specialOffers: ''
  });
  
  // Log the settings ID when the component mounts
  useEffect(() => {
    console.log("OtherSettings component mounted");
    console.log("Settings ID in OtherSettings:", settingsId);
  }, [settingsId]);
  
  // Default settings if none are provided
  const defaultSettings: OtherSettingsType = {
    website_url: { field_name: "website_url", field_type: "single_field", field_value: "", field_options: null },
    cc_list: { field_name: "cc_list", field_type: "multiple_field", field_value: [], field_options: null },
    special_offers: { field_name: "special_offers", field_type: "single_field", field_value: "", field_options: null },
    use_bcc: { field_name: "use_bcc", field_type: "boolean", field_value: false, field_options: null }
  };
  
  const settingsData = settings || defaultSettings;
  
  // Helper function to get array values
  const getArrayValue = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    return [];
  };
  
  // Helper function to convert field_value to boolean
  const getBooleanValue = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 1 || value === '1') return true;
    return false;
  };
  
  // State for form fields
  const [websiteUrl, setWebsiteUrl] = useState(settingsData.website_url?.field_value as string || "");
  const [ccList, setCcList] = useState(getArrayValue(settingsData.cc_list.field_value));
  const [specialOffers, setSpecialOffers] = useState(settingsData.special_offers.field_value as string);
  const [useBcc, setUseBcc] = useState(getBooleanValue(settingsData.use_bcc?.field_value || false));
  const [newEmail, setNewEmail] = useState("");
  
  // Update state when settings change
  useEffect(() => {
    if (settings) {
      setWebsiteUrl(settings.website_url?.field_value as string || "");
      setCcList(getArrayValue(settings.cc_list.field_value));
      setSpecialOffers(settings.special_offers.field_value as string);
      if (settings.use_bcc) {
        setUseBcc(getBooleanValue(settings.use_bcc.field_value));
      }
    }
  }, [settings]);
  
  // Validation functions
  const validateUrl = (url: string): string => {
    if (!url) return '';
    try {
      new URL(url);
      return '';
    } catch (e) {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }
  };
  
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors = {
      websiteUrl: validateUrl(websiteUrl),
      ccList: '',
      specialOffers: ''
    };
    
    setErrors(newErrors);
    
    // Form is valid if all error messages are empty
    return Object.values(newErrors).every(error => error === '');
  };
  
  // Add new email to CC list
  const addEmail = () => {
    if (newEmail.trim() !== "" && isValidEmail(newEmail)) {
      setCcList([...ccList, newEmail.trim()]);
      setNewEmail("");
    } else if (newEmail.trim() !== "") {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
    }
  };
  
  // Remove email from CC list
  const removeEmail = (index: number) => {
    const updatedCcList = [...ccList];
    updatedCcList.splice(index, 1);
    setCcList(updatedCcList);
  };
  
  const handleSave = async () => {
    if (!settingsId) {
      console.error("No settings ID provided");
      toast({
        title: "Error",
        description: "Could not save settings: No settings ID found",
        variant: "destructive"
      });
      return;
    }
    
    // Validate form before saving
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Make sure we have all required fields for each setting
      // Ensure website_url has all required fields
      const websiteUrlSetting = {
        field_name: "website_url",
        field_type: "single_field",
        field_value: websiteUrl,
        field_options: null,
        ...(settingsData.website_url || {})
      };
      
      // Collect the updated settings data with all required fields
      const updatedSettings = {
        website_url: { 
          ...websiteUrlSetting,
          field_value: websiteUrl 
        },
        cc_list: { 
          ...settingsData.cc_list, 
          field_value: ccList 
        },
        special_offers: { 
          ...settingsData.special_offers, 
          field_value: specialOffers 
        },
        use_bcc: {
          ...(settingsData.use_bcc || { field_name: "use_bcc", field_type: "boolean", field_options: null }),
          field_value: useBcc
        }
      };
      
      console.log("Updated settings payload:", updatedSettings);
      
      // Make the API call to update the settings
      const result = await campaignSettingsService.updateSettingsById(settingsId, {
        others: updatedSettings
      });
      
      // Call the onSettingsUpdated callback if provided
      if (onSettingsUpdated) {
        await onSettingsUpdated();
      }
      
      toast({
        title: "Settings saved",
        description: "Your other settings have been saved successfully."
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-6 pt-4 w-full">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-semibold">Other Settings</h2>
        <Button 
          onClick={handleSave} 
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        <div className="space-y-1">
          <Label>Website URL</Label>
          <p className="text-sm text-muted-foreground">Your company website URL</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="Enter website URL"
            className={errors.websiteUrl ? "border-red-500" : ""}
          />
          {errors.websiteUrl && (
            <p className="text-sm text-red-500">{errors.websiteUrl}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>CC Email List</Label>
          <p className="text-sm text-muted-foreground">Emails to CC on all communications</p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Add an email address"
              type="email"
            />
            <Button 
              type="button" 
              size="icon" 
              onClick={addEmail}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {ccList.map((email, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <p className="flex-1 text-sm">{email}</p>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  onClick={() => removeEmail(index)}
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Special Offers</Label>
          <p className="text-sm text-muted-foreground">Any special offers to include in communications</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={specialOffers}
            onChange={(e) => setSpecialOffers(e.target.value)}
            placeholder="Enter special offers"
          />
        </div>

        <div className="space-y-1">
          <Label>Use BCC</Label>
          <p className="text-sm text-muted-foreground">Send emails using BCC instead of TO field</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            id="use-bcc" 
            checked={useBcc}
            onCheckedChange={setUseBcc}
          />
          <Label htmlFor="use-bcc">
            {useBcc ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      </div>
    </div>
  );
}