import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, X, Loader2, Trash2 } from "lucide-react"
import { MaterialsSettings as MaterialsSettingsType } from "@/services/campaignSettingsService"
import { useToast } from "@/components/ui/use-toast"
import { campaignSettingsService } from "@/services/campaignSettingsService"

interface MaterialSettingsProps {
  settings?: MaterialsSettingsType;
  campaignId?: string;
  settingsId?: string;
  onSettingsUpdated?: () => Promise<void>;
}

export default function MaterialSettings({ settings, campaignId, settingsId, onSettingsUpdated }: MaterialSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState({
    sellerName: '',
    meetingLink: '',
    websiteUrl: '',
    painPoints: '',
    caseStudies: '',
    testimonials: ''
  });
  
  // Default settings if none are provided
  const defaultSettings: MaterialsSettingsType = {
    seller: { field_name: "seller_name", field_type: "single_field", field_value: "", field_options: null },
    meeting_booking_link: { field_name: "meeting_booking_link", field_type: "single_field", field_value: "", field_options: null },
    pain_points: { field_name: "pain_points", field_type: "multiple_field", field_value: [], field_options: null },
    case_studies: { field_name: "case_studies", field_type: "multiple_field", field_value: [], field_options: null },
    testimonials: { field_name: "testimonials", field_type: "multiple_field", field_value: [], field_options: null },
    website_url: { field_name: "website_url", field_type: "single_field", field_value: "", field_options: null }
  };
  
  const settingsData = settings || defaultSettings;
  
  // Helper function to get array values
  const getArrayValue = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    return [];
  };
  
  // State for form fields
  const [sellerName, setSellerName] = useState(settingsData.seller.field_value as string);
  const [meetingLink, setMeetingLink] = useState(settingsData.meeting_booking_link.field_value as string);
  const [painPoints, setPainPoints] = useState<string[]>(getArrayValue(settingsData.pain_points.field_value));
  const [caseStudies, setCaseStudies] = useState<string[]>(getArrayValue(settingsData.case_studies.field_value));
  const [testimonials, setTestimonials] = useState<string[]>(getArrayValue(settingsData.testimonials.field_value));
  const [websiteUrl, setWebsiteUrl] = useState(settingsData.website_url.field_value as string);
  
  // State for new items
  const [newPainPoint, setNewPainPoint] = useState("");
  const [newCaseStudy, setNewCaseStudy] = useState("");
  const [newTestimonial, setNewTestimonial] = useState("");
  
  // Update state when settings change
  useEffect(() => {
    if (settings) {
      setSellerName(settings.seller.field_value as string);
      setMeetingLink(settings.meeting_booking_link.field_value as string);
      setPainPoints(getArrayValue(settings.pain_points.field_value));
      setCaseStudies(getArrayValue(settings.case_studies.field_value));
      setTestimonials(getArrayValue(settings.testimonials.field_value));
      setWebsiteUrl(settings.website_url.field_value as string);
    }
  }, [settings]);

  // Log the settings ID when the component mounts
  useEffect(() => {
    console.log("MaterialSettings component mounted");
    console.log("Settings ID in MaterialSettings:", settingsId);
  }, [settingsId]);
  
  // Validation functions
  const validateMinLength = (value: string, fieldName: string, minLength: number = 3): string => {
    return value.length < minLength ? `${fieldName} must be at least ${minLength} characters` : '';
  };
  
  const validateUrl = (url: string): string => {
    if (!url) return '';
    try {
      new URL(url);
      return '';
    } catch (e) {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }
  };
  
  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors = {
      sellerName: validateMinLength(sellerName, 'Seller name'),
      meetingLink: validateUrl(meetingLink),
      websiteUrl: validateUrl(websiteUrl),
      painPoints: painPoints.length === 0 ? 'Add at least one pain point' : '',
      caseStudies: '',
      testimonials: ''
    };
    
    setErrors(newErrors);
    
    // Form is valid if all error messages are empty
    return Object.values(newErrors).every(error => error === '');
  };
  
  // Add new pain point
  const addPainPoint = () => {
    if (newPainPoint.trim() !== "") {
      setPainPoints([...painPoints, newPainPoint.trim()]);
      setNewPainPoint("");
    }
  };
  
  // Remove pain point
  const removePainPoint = (index: number) => {
    const updatedPainPoints = [...painPoints];
    updatedPainPoints.splice(index, 1);
    setPainPoints(updatedPainPoints);
  };
  
  // Add new case study
  const addCaseStudy = () => {
    if (newCaseStudy.trim() !== "") {
      setCaseStudies([...caseStudies, newCaseStudy.trim()]);
      setNewCaseStudy("");
    }
  };
  
  // Remove case study
  const removeCaseStudy = (index: number) => {
    const updatedCaseStudies = [...caseStudies];
    updatedCaseStudies.splice(index, 1);
    setCaseStudies(updatedCaseStudies);
  };
  
  // Add new testimonial
  const addTestimonial = () => {
    if (newTestimonial.trim() !== "") {
      setTestimonials([...testimonials, newTestimonial.trim()]);
      setNewTestimonial("");
    }
  };
  
  // Remove testimonial
  const removeTestimonial = (index: number) => {
    const updatedTestimonials = [...testimonials];
    updatedTestimonials.splice(index, 1);
    setTestimonials(updatedTestimonials);
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
      
      // Collect the updated settings data
      const updatedSettings = {
        seller: { 
          ...settingsData.seller, 
          field_value: sellerName 
        },
        meeting_booking_link: { 
          ...settingsData.meeting_booking_link, 
          field_value: meetingLink 
        },
        pain_points: { 
          ...settingsData.pain_points, 
          field_value: painPoints 
        },
        case_studies: { 
          ...settingsData.case_studies, 
          field_value: caseStudies 
        },
        testimonials: { 
          ...settingsData.testimonials, 
          field_value: testimonials 
        },
        website_url: { 
          ...settingsData.website_url, 
          field_value: websiteUrl 
        }
      };
      
      console.log("Updated settings:", updatedSettings);
      
      // Make the API call to update the settings
      const result = await campaignSettingsService.updateSettingsById(settingsId, {
        materials: updatedSettings
      });
      
      console.log("API response:", result);
      
      // Call the onSettingsUpdated callback if provided
      if (onSettingsUpdated) {
        await onSettingsUpdated();
      }
      
      toast({
        title: "Settings saved",
        description: "Your materials settings have been saved successfully."
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
        <h2 className="text-xl font-semibold">Materials Settings</h2>
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
          <Label>Seller Name</Label>
          <p className="text-sm text-muted-foreground">Name of the seller or company</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            placeholder="Enter seller name"
            className={errors.sellerName ? "border-red-500" : ""}
          />
          {errors.sellerName && (
            <p className="text-sm text-red-500">{errors.sellerName}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Meeting Booking Link</Label>
          <p className="text-sm text-muted-foreground">Link for booking meetings</p>
        </div>
        <div className="space-y-1">
          <Input 
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="Enter meeting booking link"
            className={errors.meetingLink ? "border-red-500" : ""}
          />
          {errors.meetingLink && (
            <p className="text-sm text-red-500">{errors.meetingLink}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Website URL</Label>
          <p className="text-sm text-muted-foreground">URL of your website</p>
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
          <Label>Pain Points</Label>
          <p className="text-sm text-muted-foreground">Customer pain points addressed by your product</p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={newPainPoint}
              onChange={(e) => setNewPainPoint(e.target.value)}
              placeholder="Add a pain point"
              className={errors.painPoints ? "border-red-500" : ""}
            />
            <Button 
              type="button" 
              size="icon" 
              onClick={addPainPoint}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {errors.painPoints && (
            <p className="text-sm text-red-500">{errors.painPoints}</p>
          )}
          <div className="space-y-2">
            {painPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <p className="flex-1 text-sm">{point}</p>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  onClick={() => removePainPoint(index)}
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Case Studies</Label>
          <p className="text-sm text-muted-foreground">Success stories to share with prospects</p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={newCaseStudy}
              onChange={(e) => setNewCaseStudy(e.target.value)}
              placeholder="Add a case study"
            />
            <Button 
              type="button" 
              size="icon" 
              onClick={addCaseStudy}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {caseStudies.map((study, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <p className="flex-1 text-sm">{study}</p>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  onClick={() => removeCaseStudy(index)}
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Testimonials</Label>
          <p className="text-sm text-muted-foreground">Customer testimonials to include in communications</p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={newTestimonial}
              onChange={(e) => setNewTestimonial(e.target.value)}
              placeholder="Add a testimonial"
            />
            <Button 
              type="button" 
              size="icon" 
              onClick={addTestimonial}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <p className="flex-1 text-sm">{testimonial}</p>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  onClick={() => removeTestimonial(index)}
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
