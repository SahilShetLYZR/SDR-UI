import React, {useState, useEffect} from "react";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { campaignSettingsService, CampaignSettings } from '@/services/campaignSettingsService';

interface ActionResultProps {
  isLoading: boolean;
  status: string | null;
  error: string | null;
  subject: string | null;
  content: string | null;
  from_email?: string | null;
  to_email?: string | null;
  campaignId?: string;
}

const Button = ({ variant, size, className, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md ${
      variant === "outline"
        ? "border border-gray-300 hover:bg-gray-100"
        : "bg-blue-600 text-white hover:bg-blue-700"
    } ${size === "sm" ? "text-sm" : ""} ${className}`}
  >
    {children}
  </button>
);

export default function ActionResult({
  isLoading,
  status,
  error,
  subject,
  content,
  from_email = null,
  to_email = null,
  campaignId,
}: ActionResultProps) {
  const created_at = new Date().toISOString();
  
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Get the email to display - prioritize campaign settings, fallback to hardcoded
  const getDisplayEmail = () => {
    if (campaignSettings?.general?.campaign_email?.field_value) {
      return campaignSettings.general.campaign_email.field_value as string;
    }
    return "jeremy@notivium.org"; // fallback to hardcoded value
  };

  const displayEmail = getDisplayEmail();

  const bodyContent = (html) => {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : html;
  };

  const className = "email-content";

  // Fetch campaign settings when campaignId is available
  useEffect(() => {
    const fetchCampaignSettings = async () => {
      if (!campaignId) return;
      
      try {
        setSettingsLoading(true);
        const settings = await campaignSettingsService.getSettingsByCampaignId(campaignId);
        setCampaignSettings(settings);
      } catch (error) {
        console.error('Error fetching campaign settings for ActionResult:', error);
        // Continue with fallback email if settings fetch fails
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchCampaignSettings();
  }, [campaignId]);

  useEffect(() => {
    if(content) {
      bodyContent(content);
    }
    if (created_at) {
      try {
        const date = new Date(created_at);
        setFormattedDate(format(date, "MMM dd, yyyy"));
        setFormattedTime(format(date, "h:mm a"));
      } catch (error) {
        console.error("Error formatting date:", error);
      }
    }
  }, [created_at, content]);

  return (
    <div className="flex flex-col space-y-4 w-full h-full">
      <h3 className="text-lg font-semibold border-b pb-2">Sample Generation</h3>

      {isLoading && (
        <div className="flex items-center text-sm text-muted-foreground mt-4 flex-grow justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>{status || "Processing..."}</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md flex-grow">
          <p className="font-semibold mb-1">Error:</p>
          {error}
        </div>
      )}

      {!isLoading && !error && subject !== null && content !== null && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-grow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-800">{subject}</h2>
            <div className="flex items-center mt-3 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {displayEmail.charAt(0)}
                </div>
                <div className="ml-2">
                  <div className="font-medium text-gray-700">
                    {displayEmail.split('@')[0]}
                  </div>
                  <div className="text-xs">
                    {displayEmail}
                  </div>
                </div>
              </div>
              <div className="ml-auto text-xs text-gray-400">
                {formattedDate || "Today, 12:00 PM"}
              </div>
            </div>
          </div>

          <div className="p-6 text-gray-700 email-content">
            <div
              className="email-content prose prose-slate max-w-none"
              style={{
                color: '#374151',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
                lineHeight: '1.6',
                fontSize: '1rem'
              }}
              dangerouslySetInnerHTML={{__html: content ? bodyContent(content) : ''}}
            />
          </div>
        </div>
      )}
      {!isLoading && !error && subject === null && content === null && (
        <div className="text-sm text-muted-foreground flex-grow flex items-center justify-center">
          <p>Click "Generate Action Result" to see a preview.</p>
        </div>
      )}
    </div>
  );
}
