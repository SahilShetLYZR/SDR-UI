import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, }
  from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ScheduleSettings as ScheduleSettingsType } from "@/services/campaignSettingsService"
import { useToast } from "@/components/ui/use-toast"
import { campaignSettingsService } from "@/services/campaignSettingsService"
import { Loader2 } from "lucide-react"

interface ScheduleSettingsProps {
  settings?: ScheduleSettingsType;
  campaignId?: string;
  settingsId?: string;
  onSettingsUpdated?: () => Promise<void>;
}

export default function ScheduleSettings({ settings, campaignId, settingsId, onSettingsUpdated }: ScheduleSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState({
    timezone: '',
    startTime: '',
    endTime: '',
    daysOfWeek: '',
    frequency: '',
    maxFollowups: ''
  });
  
  // Log the settings ID when the component mounts
  useEffect(() => {
    console.log("ScheduleSettings component mounted");
    console.log("Settings ID in ScheduleSettings:", settingsId);
  }, [settingsId]);
  
  // Default settings if none are provided
  const defaultSettings: ScheduleSettingsType = {
    timezone: { field_name: "timezone", field_type: "single_field", field_value: "UTC", field_options: null },
    start_time: { field_name: "start_time", field_type: "single_field", field_value: "09:00", field_options: null },
    end_time: { field_name: "end_time", field_type: "single_field", field_value: "17:00", field_options: null },
    days_of_week: { 
      field_name: "days_of_week", 
      field_type: "selectable", 
      field_value: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      field_options: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    frequency: { field_name: "frequency", field_type: "single_field", field_value: "1", field_options: null },
    max_followup_mails: { field_name: "max_followup_mails", field_type: "single_field", field_value: 3, field_options: null }
  };
  
  const settingsData = settings || defaultSettings;
  
  // Helper function to get array values
  const getArrayValue = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    return [];
  };
  
  // State for form fields
  const [timezone, setTimezone] = useState(settingsData.timezone.field_value as string);
  const [startTime, setStartTime] = useState(settingsData.start_time.field_value as string);
  const [endTime, setEndTime] = useState(settingsData.end_time.field_value as string);
  const [daysOfWeek, setDaysOfWeek] = useState(getArrayValue(settingsData.days_of_week.field_value));
  const [frequency, setFrequency] = useState(settingsData.frequency.field_value as string);
  const [maxFollowupMails, setMaxFollowupMails] = useState(
    typeof settingsData.max_followup_mails.field_value === 'number'
      ? settingsData.max_followup_mails.field_value
      : 3
  );
  
  // Update state when settings change
  useEffect(() => {
    if (settings) {
      setTimezone(settings.timezone.field_value as string);
      setStartTime(settings.start_time.field_value as string);
      setEndTime(settings.end_time.field_value as string);
      setDaysOfWeek(getArrayValue(settings.days_of_week.field_value));
      setFrequency(settings.frequency.field_value as string);
      setMaxFollowupMails(Number(settings.max_followup_mails.field_value));
    }
  }, [settings]);

  // Toggle day selection
  const toggleDay = (day: string) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };
  
  // Validation functions
  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  };
  
  const validateTimeRange = (): string => {
    if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
      return 'Please enter valid time formats (HH:MM)';
    }
    
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    if (startMinutes >= endMinutes) {
      return 'End time must be greater than start time';
    }
    
    return '';
  };
  
  const validateDaysOfWeek = (): string => {
    return daysOfWeek.length === 0 ? 'Select at least one day' : '';
  };
  
  const validateFrequency = (): string => {
    const frequencyNum = Number(frequency);
    if (isNaN(frequencyNum) || frequencyNum <= 0) {
      return 'Frequency must be a positive number';
    }
    return '';
  };
  
  // Validate all fields
  const validateForm = (): boolean => {
    const timeRangeError = validateTimeRange();
    const daysError = validateDaysOfWeek();
    const frequencyError = validateFrequency();
    
    const newErrors = {
      timezone: '',
      startTime: timeRangeError,
      endTime: timeRangeError,
      daysOfWeek: daysError,
      frequency: frequencyError,
      maxFollowups: ''
    };
    
    setErrors(newErrors);
    
    // Form is valid if all error messages are empty
    return Object.values(newErrors).every(error => error === '');
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
        timezone: { 
          ...settingsData.timezone, 
          field_value: timezone 
        },
        start_time: { 
          ...settingsData.start_time, 
          field_value: startTime 
        },
        end_time: { 
          ...settingsData.end_time, 
          field_value: endTime 
        },
        days_of_week: { 
          ...settingsData.days_of_week, 
          field_value: daysOfWeek 
        },
        frequency: { 
          ...settingsData.frequency, 
          field_value: frequency 
        },
        max_followup_mails: { 
          ...settingsData.max_followup_mails, 
          field_value: maxFollowupMails 
        }
      };
      
      // Make the API call to update the settings
      const result = await campaignSettingsService.updateSettingsById(settingsId, {
        schedule: updatedSettings
      });
      
      // Call the onSettingsUpdated callback if provided
      if (onSettingsUpdated) {
        await onSettingsUpdated();
      }
      
      toast({
        title: "Settings saved",
        description: "Your schedule settings have been saved successfully."
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
        <h2 className="text-xl font-semibold">Schedule Settings</h2>
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
          <Label>Timezone</Label>
          <p className="text-sm text-muted-foreground">Select your timezone</p>
        </div>
        <div className="space-y-1">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              <SelectItem value="Europe/London">London</SelectItem>
              <SelectItem value="Europe/Paris">Paris</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              <SelectItem value="Asia/Kolkata">India</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Start Time</Label>
          <p className="text-sm text-muted-foreground">When to start sending emails</p>
        </div>
        <div className="space-y-1">
          <Input 
            type="time" 
            value={startTime} 
            onChange={(e) => setStartTime(e.target.value)}
            className={errors.startTime ? "border-red-500" : ""}
          />
          {errors.startTime && (
            <p className="text-sm text-red-500">{errors.startTime}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>End Time</Label>
          <p className="text-sm text-muted-foreground">When to stop sending emails</p>
        </div>
        <div className="space-y-1">
          <Input 
            type="time" 
            value={endTime} 
            onChange={(e) => setEndTime(e.target.value)}
            className={errors.endTime ? "border-red-500" : ""}
          />
          {errors.endTime && (
            <p className="text-sm text-red-500">{errors.endTime}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Days of Week</Label>
          <p className="text-sm text-muted-foreground">Days to send emails</p>
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2">
            {settingsData.days_of_week.field_options?.map((day) => (
              <Button
                key={day}
                type="button"
                variant={daysOfWeek.includes(day) ? "default" : "outline"}
                onClick={() => toggleDay(day)}
                className={daysOfWeek.includes(day) ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {day}
              </Button>
            ))}
          </div>
          {errors.daysOfWeek && (
            <p className="text-sm text-red-500 mt-2">{errors.daysOfWeek}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Frequency (in minutes)</Label>
          <p className="text-sm text-muted-foreground">How often to send emails</p>
        </div>
        <div className="space-y-1">
          <Input 
            type="number" 
            value={frequency} 
            onChange={(e) => setFrequency(e.target.value)}
            min="1"
            className={errors.frequency ? "border-red-500" : ""}
          />
          {errors.frequency && (
            <p className="text-sm text-red-500">{errors.frequency}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Max Follow-up Emails</Label>
          <p className="text-sm text-muted-foreground">Maximum number of follow-up emails</p>
        </div>
        <div className="space-y-1">
          <Input 
            type="number" 
            value={maxFollowupMails} 
            onChange={(e) => setMaxFollowupMails(Number(e.target.value))}
            min="1"
          />
        </div>
      </div>
    </div>
  );
}