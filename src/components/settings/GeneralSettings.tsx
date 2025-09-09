// components/settings/GeneralSettings.tsx
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { GeneralSettings as GeneralSettingsType } from "@/services/campaignSettingsService"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { campaignSettingsService } from "@/services/campaignSettingsService"
import { Loader2, Mail, Upload, Link } from "lucide-react"
import { domainConfigService, DomainConfig } from "@/services/domainConfigService"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GeneralSettingsProps {
  settings?: GeneralSettingsType;
  campaignId?: string;
  settingsId?: string;
  onSettingsUpdated?: () => Promise<void>;
}

export default function GeneralSettings({ settings, campaignId, settingsId, onSettingsUpdated }: GeneralSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState({
    campaignName: '',
    agentName: '',
    agentDesignation: '',
    agentEmail: '',
    agentNumber: '',
    agentAddress: '',
    agentSignature: '',
    campaignEmail: '',
    highEngagementNotifiers: '',
    threshold: ''
  });
  
  // Log the settings ID when the component mounts
  useEffect(() => {
    console.log("GeneralSettings component mounted");
    console.log("Settings ID in GeneralSettings:", settingsId);
  }, [settingsId]);
  
  // If settings are provided, use them, otherwise use default values
  const defaultSettings = {
    campaign_name: { field_name: "campaign_name", field_type: "single_field", field_value: "", field_options: null },
    is_active: { field_name: "is_active", field_type: "boolean", field_value: true, field_options: null },
    agent_name: { field_name: "agent_name", field_type: "single_field", field_value: "", field_options: null },
    agent_designation: { field_name: "agent_designation", field_type: "single_field", field_value: "", field_options: null },
    agent_email: { field_name: "agent_email", field_type: "single_field", field_value: "", field_options: null },
    agent_number: { field_name: "agent_number", field_type: "single_field", field_value: "", field_options: null },
    agent_address: { field_name: "address", field_type: "single_field", field_value: "", field_options: null },
    signature_image: { field_name: "signature_image", field_type: "single_field", field_value: "https://ui-avatars.com/api/?name=Default&background=0D8ABC&color=fff&size=100", field_options: null },
    campaign_email: { field_name: "campaign_email", field_type: "single_field", field_value: "", field_options: null },
    high_engagement_notifiers: { field_name: "high_engagement_notifiers", field_type: "multiple_field", field_value: [], field_options: null },
    threshold: { field_name: "threshold", field_type: "single_field", field_value: 80, field_options: null }
  };
  
  const settingsData = settings || defaultSettings;
  
  // Helper function to convert field_value to boolean
  const getBooleanValue = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 1 || value === '1') return true;
    return false;
  };

  // Helper function to convert field_value to string array
  const getArrayValue = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').map(item => item.trim()).filter(item => item);
    }
    return [];
  };

  // Helper function to convert string array to comma-separated string for UI
  const arrayToString = (arr: string[]): string => {
    return arr.join(', ');
  };
  
  // State for form fields
  const [campaignName, setCampaignName] = useState(settingsData.campaign_name.field_value as string);
  const [isActive, setIsActive] = useState(getBooleanValue(settingsData.is_active.field_value));
  const [agentName, setAgentName] = useState(settingsData.agent_name.field_value as string);
  const [agentDesignation, setAgentDesignation] = useState(settingsData.agent_designation.field_value as string);
  const [agentEmail, setAgentEmail] = useState(settingsData.agent_email.field_value as string);
  const [agentNumber, setAgentNumber] = useState(settingsData.agent_number.field_value as string);
  const [agentAddress, setAgentAddress] = useState(settingsData.agent_address.field_value as string);
  const [agentSignature, setAgentSignature] = useState(settingsData.signature_image?.field_value as string || "https://ui-avatars.com/api/?name=Default&background=0D8ABC&color=fff&size=100");
  const [campaignEmail, setCampaignEmail] = useState(settingsData.campaign_email?.field_value as string || "");
  const [highEngagementNotifiers, setHighEngagementNotifiers] = useState(arrayToString(getArrayValue(settingsData.high_engagement_notifiers?.field_value)));
  const [threshold, setThreshold] = useState(settingsData.threshold?.field_value as number || 80);
  
  // State for email configurations
  const [emailConfigs, setEmailConfigs] = useState<DomainConfig[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  
  // State for signature upload  
  const [signatureUploadMode, setSignatureUploadMode] = useState<'url' | 'upload'>(() => {
    const initialSignature = settingsData.signature_image?.field_value as string;
    return initialSignature?.startsWith('data:image/') ? 'upload' : 'url';
  });
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  
  // Update state when settings change
  useEffect(() => {
    if (settings) {
      setCampaignName(settings.campaign_name.field_value as string);
      setIsActive(getBooleanValue(settings.is_active.field_value));
      setAgentName(settings.agent_name.field_value as string);
      setAgentDesignation(settings.agent_designation.field_value as string);
      setAgentEmail(settings.agent_email.field_value as string);
      setAgentNumber(settings.agent_number.field_value as string);
      setAgentAddress(settings.agent_address.field_value as string);
      if (settings.signature_image) {
        const signatureValue = settings.signature_image.field_value as string;
        setAgentSignature(signatureValue);
        // Auto-detect if it's a base64 image or URL
        setSignatureUploadMode(signatureValue.startsWith('data:image/') ? 'upload' : 'url');
      }
      setCampaignEmail(settings.campaign_email?.field_value as string || "");
      setHighEngagementNotifiers(arrayToString(getArrayValue(settings.high_engagement_notifiers?.field_value)));
      setThreshold(settings.threshold?.field_value as number || 80);
    }
  }, [settings]);
  
  // Fetch email configurations when component mounts
  useEffect(() => {
    const fetchEmailConfigs = async () => {
      setLoadingEmails(true);
      try {
        const configs = await domainConfigService.getDomainConfigs();
        setEmailConfigs(configs);
      } catch (error) {
        console.error("Error fetching email configurations:", error);
        toast({
          title: "Error",
          description: "Failed to load email configurations",
          variant: "destructive",
        });
      } finally {
        setLoadingEmails(false);
      }
    };
    
    fetchEmailConfigs();
  }, [toast]);
  
  // Validation functions
  const validateMinLength = (value: string, fieldName: string, minLength: number = 3): string => {
    return value.length < minLength ? `${fieldName} must be at least ${minLength} characters` : '';
  };
  
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(email) ? 'Please enter a valid email address' : '';
  };
  
  const validatePhoneNumber = (phone: string): string => {
    const phoneRegex = /^[+]?[0-9]+$/;
    return !phoneRegex.test(phone) ? 'Phone number should contain only digits (+ is allowed)' : '';
  };
  
  // Validate URL format
  const validateUrl = (url: string): string => {
    try {
      new URL(url);
      return '';
    } catch (e) {
      return 'Please enter a valid URL';
    }
  };

  // Validate email list (comma-separated emails)
  const validateEmailList = (emailList: string): string => {
    if (!emailList.trim()) return ''; // Allow empty list
    
    const emails = emailList.split(',').map(email => email.trim()).filter(email => email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return `Invalid email: ${email}`;
      }
    }
    return '';
  };

  // Validate threshold (engagement score)
  const validateThreshold = (value: number): string => {
    if (isNaN(value)) return 'Threshold must be a valid number';
    if (value < 0) return 'Threshold must be a positive number';
    if (value > 100) return 'Threshold cannot exceed 100';
    return '';
  };

  // Compress and resize image for email signature
  const compressAndConvertImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set very small dimensions for email signatures (more aggressive compression)
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 80;
        
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with very high compression (0.3 quality for minimal file size)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3);
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload for signature
  const handleSignatureFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploadingSignature(true);
      const compressedBase64 = await compressAndConvertImage(file);
      setAgentSignature(compressedBase64);
      
      // Calculate size reduction
      const originalSize = Math.round(file.size / 1024); // KB
      const compressedSize = Math.round((compressedBase64.length * 3) / 4 / 1024); // Approximate KB
      
      toast({
        title: "Image uploaded and optimized",
        description: `Image compressed from ${originalSize}KB to ~${compressedSize}KB for email compatibility`,
      });
    } catch (error) {
      console.error("Error compressing and converting image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to process image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingSignature(false);
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors = {
      campaignName: validateMinLength(campaignName, 'Campaign name'),
      agentName: validateMinLength(agentName, 'Agent name'),
      agentDesignation: validateMinLength(agentDesignation, 'Agent designation'),
      agentEmail: validateEmail(agentEmail),
      // Make agent phone number optional - only validate if a value is provided
      agentNumber: agentNumber ? validatePhoneNumber(agentNumber) : '',
      // Make agent address optional - no validation required
      agentAddress: '',
      // Validate agent signature (URL or base64)
      agentSignature: agentSignature && !agentSignature.startsWith('data:image/') ? validateUrl(agentSignature) : '',
      campaignEmail: emailConfigs.length > 0 && !campaignEmail ? 'Please select a campaign email' : '',
      highEngagementNotifiers: validateEmailList(highEngagementNotifiers),
      threshold: validateThreshold(threshold)
    };
    
    setErrors(newErrors);
    
    // Form is valid if all error messages are empty
    return Object.values(newErrors).every(error => error === '');
  };
  
  const handleSave = async () => {
    console.log("Save button clicked in GeneralSettings");
    console.log("Settings ID:", settingsId);
    console.log("Settings ID type:", typeof settingsId);
    
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
      
      // Collect the updated settings data
      const updatedSettings = {
        campaign_name: { 
          ...settingsData.campaign_name, 
          field_value: campaignName 
        },
        is_active: { 
          ...settingsData.is_active, 
          field_value: isActive 
        },
        agent_name: { 
          ...settingsData.agent_name, 
          field_value: agentName 
        },
        agent_designation: { 
          ...settingsData.agent_designation, 
          field_value: agentDesignation 
        },
        agent_email: { 
          ...settingsData.agent_email, 
          field_value: agentEmail 
        },
        agent_number: { 
          ...settingsData.agent_number, 
          field_value: agentNumber 
        },
        agent_address: { 
          ...settingsData.agent_address, 
          field_value: agentAddress 
        },
        signature_image: { 
          ...(settingsData.signature_image || { field_name: "signature_image", field_type: "single_field", field_options: null }), 
          field_value: agentSignature 
        },
        campaign_email: {
          ...(settingsData.campaign_email || { field_name: "campaign_email", field_type: "single_field", field_options: null }),
          field_value: campaignEmail
        },
        high_engagement_notifiers: {
          ...(settingsData.high_engagement_notifiers || { field_name: "high_engagement_notifiers", field_type: "multiple_field", field_options: null }),
          field_value: getArrayValue(highEngagementNotifiers)
        },
        threshold: {
          ...(settingsData.threshold || { field_name: "threshold", field_type: "single_field", field_options: null }),
          field_value: threshold
        }
      };
      
      console.log("Updated settings:", updatedSettings);
      
      // Make the API call to update the settings
      const result = await campaignSettingsService.updateSettingsById(settingsId, {
        general: updatedSettings
      });
      
      console.log("API response:", result);
      
      // Call the onSettingsUpdated callback if provided
      if (onSettingsUpdated) {
        await onSettingsUpdated();
      }
      
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully."
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
        <h2 className="text-xl font-semibold">General Settings</h2>
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
          <Label>Campaign Name</Label>
          <p className="text-sm text-muted-foreground">The name of your campaign</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Enter campaign name"
            className={errors.campaignName ? "border-red-500" : ""}
          />
          {errors.campaignName && (
            <p className="text-sm text-red-500">{errors.campaignName}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Campaign Status</Label>
          <p className="text-sm text-muted-foreground">Enable or disable this campaign</p>
        </div>

        <div className="flex items-center gap-2">
          <Switch 
            id="campaign-status" 
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="campaign-status">
            {isActive ? 'Active' : 'Inactive'}
          </Label>
        </div>

        <div className="space-y-1">
          <Label>Agent Name</Label>
          <p className="text-sm text-muted-foreground">Name of the agent handling this campaign</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Enter agent name"
            className={errors.agentName ? "border-red-500" : ""}
          />
          {errors.agentName && (
            <p className="text-sm text-red-500">{errors.agentName}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Agent Designation</Label>
          <p className="text-sm text-muted-foreground">Job title of the agent</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={agentDesignation}
            onChange={(e) => setAgentDesignation(e.target.value)}
            placeholder="Enter agent designation"
            className={errors.agentDesignation ? "border-red-500" : ""}
          />
          {errors.agentDesignation && (
            <p className="text-sm text-red-500">{errors.agentDesignation}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Agent Email</Label>
          <p className="text-sm text-muted-foreground">Email address of the agent</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={agentEmail}
            onChange={(e) => setAgentEmail(e.target.value)}
            placeholder="Enter agent email"
            type="email"
            className={errors.agentEmail ? "border-red-500" : ""}
          />
          {errors.agentEmail && (
            <p className="text-sm text-red-500">{errors.agentEmail}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Agent Phone Number <span className="text-muted-foreground">(Optional)</span></Label>
          <p className="text-sm text-muted-foreground">Phone number of the agent</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={agentNumber}
            onChange={(e) => setAgentNumber(e.target.value)}
            placeholder="Enter agent phone number"
            className={errors.agentNumber ? "border-red-500" : ""}
          />
          {errors.agentNumber && (
            <p className="text-sm text-red-500">{errors.agentNumber}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Agent Address <span className="text-muted-foreground">(Optional)</span></Label>
          <p className="text-sm text-muted-foreground">Address of the agent</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={agentAddress}
            onChange={(e) => setAgentAddress(e.target.value)}
            placeholder="Enter agent address"
            className={errors.agentAddress ? "border-red-500" : ""}
          />
          {errors.agentAddress && (
            <p className="text-sm text-red-500">{errors.agentAddress}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Agent Signature</Label>
          <p className="text-sm text-muted-foreground">Upload an image or provide a URL (uploaded images are compressed to ~5-15KB for email compatibility)</p>
        </div>
        <div className="space-y-3">
          {/* Toggle between URL and Upload */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={signatureUploadMode === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSignatureUploadMode('url')}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              URL
            </Button>
            <Button
              type="button"
              variant={signatureUploadMode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSignatureUploadMode('upload')}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>

          {/* URL Input */}
          {signatureUploadMode === 'url' && (
            <div className="space-y-1">
              <Input 
                value={agentSignature}
                onChange={(e) => setAgentSignature(e.target.value)}
                placeholder="Enter signature image URL"
                type="url"
                className={errors.agentSignature ? "border-red-500" : ""}
              />
              {errors.agentSignature && (
                <p className="text-sm text-red-500">{errors.agentSignature}</p>
              )}
            </div>
          )}

          {/* File Upload */}
          {signatureUploadMode === 'upload' && (
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploadingSignature}
                />
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isUploadingSignature ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  {isUploadingSignature ? (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Click to upload an image</p>
                      <p className="text-xs mt-1">Highly compressed for email compatibility</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {agentSignature && !errors.agentSignature && (
            <div className="mt-2">
              <p className="text-sm mb-1">Preview:</p>
              <img 
                src={agentSignature} 
                alt="Agent Signature" 
                className="max-h-20 border rounded p-1" 
                onError={(e) => {
                  e.currentTarget.src = "https://lh7-us.googleusercontent.com/qvN8znEqiwua_ScNYfY-QBIJueosIm6ZRSF6DvcNCOrNB2bN2oyjZLUXXAg8Asljstu0jlu7Fm8y-ELoiwI9jmxKzUCi4EkAgQDcVGQVSf15-wy_Rkaj1IYoZZlrQF-v8LSVbQV0s_6_TjiI5hF3o3g";
                }}
              />
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <Label>Campaign Email <span className="text-red-500">*</span></Label>
          <p className="text-sm text-muted-foreground">Select an email address to send campaign emails from</p>
        </div>
        <div className="space-y-1">
          {loadingEmails ? (
            <div className="flex items-center space-x-2 h-10 px-3 py-2 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500">Loading emails...</span>
            </div>
          ) : (
            <Select 
              value={campaignEmail} 
              onValueChange={setCampaignEmail}
            >
              <SelectTrigger className={errors.campaignEmail ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an email" />
              </SelectTrigger>
              <SelectContent>
                {emailConfigs.length === 0 ? (
                  <div className="px-2 py-4">
                    <div className="flex items-center space-x-2 mb-3 px-3 py-2 border border-amber-200 bg-amber-50 rounded-md">
                      <Mail className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm text-amber-700">No email configurations found</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = "/settings/domain-configs"}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Add Email Configuration
                    </Button>
                  </div>
                ) : (
                  emailConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.email_id}>
                      {config.email_id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
          {errors.campaignEmail && (
            <p className="text-sm text-red-500">{errors.campaignEmail}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>High Engagement Notifiers <span className="text-muted-foreground">(Optional)</span></Label>
          <p className="text-sm text-muted-foreground">Email addresses to notify about high engagement prospects (comma-separated)</p>
        </div>
        <div className="space-y-1">
          <Textarea 
            value={highEngagementNotifiers}
            onChange={(e) => setHighEngagementNotifiers(e.target.value)}
            placeholder="example1@company.com, example2@company.com"
            className={errors.highEngagementNotifiers ? "border-red-500" : ""}
            rows={3}
          />
          {errors.highEngagementNotifiers && (
            <p className="text-sm text-red-500">{errors.highEngagementNotifiers}</p>
          )}
          {highEngagementNotifiers && !errors.highEngagementNotifiers && (
            <p className="text-sm text-muted-foreground">
              {getArrayValue(highEngagementNotifiers).length} email(s) will be notified
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Engagement Score Threshold <span className="text-gray-100">(Optional)</span></Label>
          <p className="text-sm text-muted-foreground">Notify when engagement score reaches this threshold (0-100)</p>
        </div>
        <div className="space-y-1">
          <Input 
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
            placeholder="0"
            min="0"
            max="100"
            className={errors.threshold ? "border-red-500" : ""}
          />
          {errors.threshold && (
            <p className="text-sm text-red-500">{errors.threshold}</p>
          )}
          <p className="text-sm text-muted-foreground">
            When a prospect's engagement score reaches {threshold}, the notifiers will be alerted
          </p>
        </div>
      </div>
    </div>
  );
}
