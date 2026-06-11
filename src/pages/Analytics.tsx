import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid
} from "recharts";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { ChevronUpIcon, CalendarIcon, SearchIcon } from "@/components/icons/index";
import { SendVolumeIcon, OpenRateIcon, RepliesIcon, ClickRateIcon, UnsubscribedIcon } from "@/components/icons/metrics-icons";
import { ProspectsList } from "@/components/prospects/ProspectsList";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartSkeleton, EmailHistorySkeleton } from "@/components/analytics/skeletons";
import { format } from "date-fns";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatEmailHtml, formatEmailSubject } from "@/lib/emailFormat";
import { useToast } from "@/components/ui/use-toast";

// Chart accent aligned with the brand primary (purple)
const CHART_COLOR = "#8B5CF6";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  loading: boolean;
}

function MetricCard({ icon, label, value, sub, loading }: MetricCardProps) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
          <span className="truncate text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <span className="animate-fade-in font-display text-2xl font-medium tabular-nums tracking-tight">
              {value}
            </span>
          )}
          {sub && !loading && (
            <span className="truncate text-xs text-muted-foreground">{sub}</span>
          )}
        </div>
      </div>
    </Card>
  );
}

// Interface for campaign metrics
interface CampaignMetrics {
  campaign_id: string;
  total_mails: number;
  total_opens: number;
  total_clicks: number;
  total_replies: number;
  total_unsubscribes: number;
  total_bounces: number;
  total_meeting_clicks?: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  bounce_rate: number;
  filters: {
    phase: string | null;
    start_date: string | null;
    end_date: string | null;
  };
}

// Interface for mail data
interface Mail {
  id: string;
  mail_type: string;
  from_email: string;
  to_email: string;
  subject: string;
  content: string;
  created_at: string;
  campaign_id: string;
  workflow_id: string;
  prospect_id: string;
  phase: string | null;
  status: string | null;
  analytics: {
    delivered: boolean;
    delivered_at: string | null;
    opened: boolean;
    opened_at: string | null;
    open_count: number;
    clicked: boolean;
    clicked_at: string | null;
    click_count: number;
    urls_clicked: string[];
    replied: boolean;
    replied_at: string | null;
    bounced: boolean;
    bounced_at: string | null;
    bounce_reason: string | null;
  };
}

// Interface for mail response
interface MailResponse {
  mails: Mail[];
  total: number;
  skip: number;
  limit: number;
}

// Interface for daily metrics
interface DailyMetric {
  date: string;
  count: number;
}

// Interface for engagement status
interface EngagementStatus {
  campaign_id: string;
  status_counts: {
    cold: number;
    warm: number;
    hot: number;
    total: number;
  };
}

// Interface for position data
interface PositionData {
  campaign_id: string;
  positions: {
    position: string;
    total_score: number;
    count?: number;
  }[];
}

export default function AnalyticsPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("alltime");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isCustomRange, setIsCustomRange] = useState(false);
  
  // Action names state
  const [actionNames, setActionNames] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>("all");
  
  // Campaign metrics state
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  
  // Daily metrics state
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [isLoadingDailyMetrics, setIsLoadingDailyMetrics] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<string>("sent");
  
  // Engagement status state
  const [engagementStatus, setEngagementStatus] = useState<EngagementStatus | null>(null);
  const [isLoadingEngagementStatus, setIsLoadingEngagementStatus] = useState(false);
  
  // Position data state
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  
  // Mail history state
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [mailHistory, setMailHistory] = useState<Mail[]>([]);
  const [isLoadingMails, setIsLoadingMails] = useState(false);

  // Fetch action names when component mounts or campaignId changes
  useEffect(() => {
    if (!campaignId) return;
    
    api.get(`/workflow/action-names/by-campaign/${campaignId}`)
      .then(response => {
        if (response.data && response.data.action_names) {
          setActionNames(response.data.action_names.filter((name: string) => name && typeof name === 'string'));
        }
      })
      .catch(error => {
        console.error('Error fetching action names:', error);
      });
  }, [campaignId]);

  // Fetch campaign metrics based on filters
  const fetchCampaignMetrics = async () => {
    if (!campaignId) {
      console.error("Campaign ID is missing");
      return;
    }

    try {
      setIsLoadingMetrics(true);
      
      // Build query parameters based on filters
      const params: Record<string, any> = {};
      
      if (selectedAction !== "all") {
        params.phase = selectedAction;
      }
      
      if (dateRange !== "alltime" && startDate && endDate) {
        // Set the start date to the beginning of the day (00:00:00)
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        params.start_date = startDateTime.toISOString();
        
        // Set the end date to the end of the day (23:59:59.999)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        params.end_date = endDateTime.toISOString();
        
        console.log('Date range:', { start: params.start_date, end: params.end_date });
      }
      
      const response = await api.get(`/analytics/campaign/${campaignId}/metrics`, { params });
      console.log('Campaign metrics response:', response.data);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching campaign metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch campaign metrics',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Fetch metrics when filters change
  useEffect(() => {
    fetchCampaignMetrics();
  }, [campaignId, selectedAction, dateRange, startDate, endDate]);

  const handleProspectClick = async (prospectId: string) => {
    console.log(`Prospect clicked: ${prospectId}`);
    setSelectedProspectId(prospectId);
    
    try {
      setIsLoadingMails(true);
      
      // Use the exact URL format provided in the requirements
      const url = `/campaign-mails/prospect/${prospectId}/mails?sort_order=-1&skip=0&limit=50`;
      console.log('API request URL:', url);
      
      const response = await api.get(url);
      console.log('Mail history response:', response.data);
      
      // Check if the response has the expected structure
      if (response.data && response.data.mails) {
        setMailHistory(response.data.mails);
      } else {
        console.error('Unexpected response format:', response.data);
        setMailHistory([]);
        toast({
          title: 'Error',
          description: 'Failed to fetch mail history: Unexpected response format',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching mail history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch mail history',
        variant: 'destructive',
      });
      setMailHistory([]);
    } finally {
      setIsLoadingMails(false);
    }
  };

  // Fetch daily metrics for the last 7 days in a single request
  const fetchDailyMetrics = async (metricType: string = "sent") => {
    if (!campaignId) {
      console.error("Campaign ID is missing");
      return;
    }

    try {
      setIsLoadingDailyMetrics(true);

      const params: Record<string, string> = { metric_type: metricType };
      if (selectedAction !== "all") {
        params.phase = selectedAction;
      }

      const response = await api.get(
        `/analytics/campaign/${campaignId}/daily-metrics`,
        { params }
      );

      const dailyCounts: DailyMetric[] = (response.data || []).map(
        (entry: { date: string; count: number }) => ({
          // Backend dates are UTC "YYYY-MM-DD"; format label as "MMM dd"
          date: format(new Date(`${entry.date}T00:00:00`), "MMM dd"),
          count: entry.count || 0,
        })
      );

      setDailyMetrics(dailyCounts);
    } catch (error) {
      console.error('Error fetching daily metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch daily metrics',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDailyMetrics(false);
    }
  };

  // Fetch daily metrics when component mounts or when metric type changes
  useEffect(() => {
    fetchDailyMetrics(selectedMetricType);
  }, [campaignId, selectedMetricType, selectedAction]);

  // Fetch engagement status
  const fetchEngagementStatus = async () => {
    if (!campaignId) {
      console.error("Campaign ID is missing");
      return;
    }

    try {
      setIsLoadingEngagementStatus(true);
      
      const response = await api.get(`/prospects/campaign/${campaignId}/engagement-status`);
      console.log('Engagement status response:', response.data);
      setEngagementStatus(response.data);
    } catch (error) {
      console.error('Error fetching engagement status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch engagement status',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEngagementStatus(false);
    }
  };

  // Fetch engagement status when component mounts or campaignId changes
  useEffect(() => {
    fetchEngagementStatus();
  }, [campaignId]);

  // Fetch position data
  const fetchPositionData = async () => {
    if (!campaignId) {
      console.error("Campaign ID is missing");
      return;
    }

    try {
      setIsLoadingPositions(true);
      
      const response = await api.get(`/prospects/campaign/${campaignId}/positions`);
      console.log('Position data response:', response.data);
      setPositionData(response.data);
    } catch (error) {
      console.error('Error fetching position data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch position data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPositions(false);
    }
  };

  // Fetch position data when component mounts or campaignId changes
  useEffect(() => {
    fetchPositionData();
  }, [campaignId]);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const now = new Date();

    switch(range) {
      case "today":
        setStartDate(now);
        setEndDate(now);
        setIsCustomRange(false);
        break;
      case "last3days":
        setStartDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000));
        setEndDate(now);
        setIsCustomRange(false);
        break;
      case "last7days":
        setStartDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        setEndDate(now);
        setIsCustomRange(false);
        break;
      case "last1month":
        setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        setEndDate(now);
        setIsCustomRange(false);
        break;
      case "alltime":
        setStartDate(undefined);
        setEndDate(now);
        setIsCustomRange(false);
        break;
      case "custom":
        setIsCustomRange(true);
        break;
    }
  };

  const getDateRangeLabel = () => {
    if (dateRange === "custom" && startDate && endDate) {
      return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    }

    switch(dateRange) {
      case "today": return "Today";
      case "last3days": return "Last 3 days";
      case "last7days": return "Last 7 days";
      case "last1month": return "Last 1 month";
      case "alltime": return "All time";
      default: return "Last 7 days";
    }
  };

  // Helper function to convert GMT timestamps to the user's local timezone
  const formatLocalDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      // Parse the GMT timestamp
      const gmtDate = new Date(dateString);
      
      // Format the date in the user's local timezone
      const formattedDate = gmtDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
      
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return the original string if there's an error
    }
  };

  // Helper function to extract only the reply content from email HTML
  const extractReplyContent = (htmlContent: string): string => {
    try {
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Look for common reply indicators and remove quoted content
      const blockquotes = tempDiv.querySelectorAll('blockquote');
      const gmailQuotes = tempDiv.querySelectorAll('.gmail_quote');
      const outlookQuotes = tempDiv.querySelectorAll('[id*="divRplyFwdMsg"]');
      
      // Remove blockquotes (quoted content)
      blockquotes.forEach(blockquote => blockquote.remove());
      
      // Remove Gmail quoted content
      gmailQuotes.forEach(quote => quote.remove());
      
      // Remove Outlook quoted content  
      outlookQuotes.forEach(quote => quote.remove());
      
      // Also look for text patterns that indicate quoted content
      const content = tempDiv.innerHTML;
      
      // Remove content after "On [date] ... wrote:" pattern (common in replies)
      const replyPattern = /On .+? wrote:<br>/gi;
      const cleanedContent = content.replace(replyPattern, '');
      
      // Remove content after "From:" line (another common reply indicator)
      const fromPattern = /<br><div[^>]*>From:/gi;
      const finalContent = cleanedContent.split(fromPattern)[0];
      
      return finalContent.trim();
    } catch (error) {
      console.error('Error extracting reply content:', error);
      return htmlContent; // Return original content if extraction fails
    }
  };

  // Helper function to get display content based on mail type
  const getDisplayContent = (mail: Mail): string => {
    if (mail.mail_type === 'reply') {
      return extractReplyContent(mail.content);
    }
    return mail.content;
  };

  // Helper function to get status badge info
  const getStatusBadgeInfo = (mail: Mail) => {
    // For reply emails, show "Customer Reply, Received"
    if (mail.mail_type === 'reply' && mail.status === 'received') {
      return {
        text: 'Customer Reply, Received',
        className: 'bg-green-100 text-green-800'
      };
    }
    
    // For regular sent emails
    if (mail.analytics.delivered) {
      return {
        text: 'Delivered',
        className: 'bg-green-100 text-green-800'
      };
    }
    
    return {
      text: 'Sent',
      className: 'bg-blue-100 text-blue-800'
    };
  };

  // Validate that we have a campaign ID
  useEffect(() => {
    if (!campaignId) {
      console.error("Campaign ID is missing in Analytics page");
    } else {
      console.log(`Analytics page loaded for campaign: ${campaignId}`);
    }
  }, [campaignId]);

  // Add global styles for email content
  const emailContentStyles = `
    .email-html-content {
      color: #202124;
    }
    
    .email-html-content p {
      margin-bottom: 16px;
      margin-top: 0;
    }
    
    .email-html-content br {
      display: block;
      content: "";
      margin-top: 8px;
    }
    
    .email-html-content a {
      color: #1a73e8;
      text-decoration: none;
    }
    
    .email-html-content a:hover {
      text-decoration: underline;
    }
    
    .email-html-content ul, .email-html-content ol {
      margin-top: 0;
      margin-bottom: 16px;
      padding-left: 24px;
    }
    
    .email-html-content li {
      margin-bottom: 4px;
    }
    
    .email-html-content blockquote {
      margin: 0 0 16px;
      padding: 0 16px;
      color: #5f6368;
      border-left: 2px solid #dadce0;
    }
  `;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-display text-xs italic text-purple-600">Analytics</p>
          <h1 className="font-display text-2xl font-medium tracking-tight text-zinc-900">Account overview</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Sequence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sequences</SelectItem>
              {actionNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {getDateRangeLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-2 border-b">
                <div className="space-y-1">
                  {[
                    { value: "today", label: "Today" },
                    { value: "last3days", label: "Last 3 days" },
                    { value: "last7days", label: "Last 7 days" },
                    { value: "last1month", label: "Last 1 month" },
                    { value: "alltime", label: "All time" },
                    { value: "custom", label: "Custom range" }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={dateRange === option.value ? "default" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => handleDateRangeChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              {isCustomRange && (
                <div className="p-2">
                  <div className="space-y-2">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Start date
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          End date
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setIsCustomRange(false)}
                      disabled={!startDate || !endDate}
                    >
                      Apply range
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          icon={<SendVolumeIcon className="h-4 w-4" />}
          label="Total Send volume"
          value={metrics?.total_mails || 0}
          loading={isLoadingMetrics}
        />
        <MetricCard
          icon={<OpenRateIcon className="h-4 w-4" />}
          label="Open Rate"
          value={`${(metrics?.open_rate || 0).toFixed(1)}%`}
          sub={`${metrics?.total_opens || 0} opens`}
          loading={isLoadingMetrics}
        />
        <MetricCard
          icon={<RepliesIcon className="h-4 w-4" />}
          label="Replies"
          value={metrics?.total_replies || 0}
          loading={isLoadingMetrics}
        />
        <MetricCard
          icon={<ClickRateIcon className="h-4 w-4" />}
          label="Clicks"
          value={metrics?.total_clicks || 0}
          loading={isLoadingMetrics}
        />
        <MetricCard
          icon={<UnsubscribedIcon className="h-4 w-4" />}
          label="Unsubscribed"
          value={metrics?.total_unsubscribes || 0}
          loading={isLoadingMetrics}
        />
        <MetricCard
          icon={<ClickRateIcon className="h-4 w-4" />}
          label="Meeting Clicks"
          value={metrics?.total_meeting_clicks || 0}
          loading={isLoadingMetrics}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardContent className="pt-6 pl-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Progress rate</h3>
              <Select value={selectedMetricType} onValueChange={(value) => {
                setSelectedMetricType(value);
                fetchDailyMetrics(value);
              }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Metric Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sent">Emails Sent</SelectItem>
                  <SelectItem value="opens">Opens</SelectItem>
                  <SelectItem value="clicks">Clicks</SelectItem>
                  <SelectItem value="replies">Replies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isLoadingDailyMetrics ? (
              <ChartSkeleton layout="columns" bars={7} />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart 
                  data={dailyMetrics}
                  margin={{ top: 5, right: 30, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={true} 
                    tickLine={true} 
                    tick={{ fontSize: 10 }}
                    padding={{ left: 0, right: 0 }}
                  />
                  <YAxis 
                    axisLine={true} 
                    tickLine={true} 
                    tick={{ fontSize: 10 }}
                    padding={{ top: 10, bottom: 10 }}
                    domain={[0, 'dataMax + 5']}
                    allowDecimals={false}
                    tickCount={5}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name={selectedMetricType === "sent" ? "Emails Sent" :
                          selectedMetricType === "opens" ? "Opens" :
                          selectedMetricType === "clicks" ? "Clicks" : "Replies"}
                    stroke={CHART_COLOR}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLOR, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardContent className="pt-6 pl-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Engagement score by position</h3>
            </div>
            {isLoadingPositions ? (
              <ChartSkeleton layout="rows" bars={5} />
            ) : positionData && positionData.positions.length > 0 ? (
              (() => {
                const maxScore = Math.max(
                  ...positionData.positions.map((p) => p.total_score || 0)
                );
                const noEngagementYet = maxScore === 0;
                const maxCount = Math.max(
                  ...positionData.positions.map((p) => p.count || 0),
                  1
                );
                const positions = [...positionData.positions].sort((a, b) =>
                  noEngagementYet
                    ? (b.count || 0) - (a.count || 0)
                    : (b.total_score || 0) - (a.total_score || 0)
                );
                return (
                  <>
                    <div className={cn("space-y-4 overflow-y-auto pr-2 pt-1", noEngagementYet ? "h-[214px]" : "h-[240px]")}>
                      {positions.map((item) => (
                        <div key={item.position}>
                          <div className="mb-1.5 flex items-baseline justify-between gap-3">
                            <span
                              className="truncate text-xs font-medium text-gray-600"
                              title={item.position}
                            >
                              {item.position}
                            </span>
                            <span className="flex shrink-0 items-baseline gap-2">
                              {item.count !== undefined && (
                                <span className="text-xs tabular-nums text-gray-400">
                                  {item.count} {item.count === 1 ? "prospect" : "prospects"}
                                </span>
                              )}
                              {!noEngagementYet && (
                                <span className="text-xs font-semibold tabular-nums text-gray-900">
                                  {item.total_score || 0}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                            <div
                              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                              style={{
                                width: `${Math.max(
                                  (noEngagementYet
                                    ? (item.count || 0) / maxCount
                                    : (item.total_score || 0) / maxScore) * 100,
                                  1.5
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {noEngagementYet && (
                      <p className="mt-2 text-center text-xs text-gray-400">
                        No engagement yet — bars show prospects per position. Scores appear once emails are opened or clicked.
                      </p>
                    )}
                  </>
                );
              })()
            ) : (
              <div className="flex h-[240px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-center">
                <p className="text-sm font-medium text-gray-600">No data yet</p>
                <p className="text-sm text-gray-400">Position scores will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="transition-shadow duration-200 hover:shadow-md">
          <CardContent className="pt-6 pl-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Prospect Engagement Status</h3>
            </div>
            {isLoadingEngagementStatus ? (
              <ChartSkeleton layout="columns" bars={3} />
            ) : engagementStatus ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={[
                      { name: 'Cold', value: engagementStatus.status_counts.cold || 0 },
                      { name: 'Warm', value: engagementStatus.status_counts.warm || 0 },
                      { name: 'Hot', value: engagementStatus.status_counts.hot || 0 },
                    ]}
                    margin={{ top: 5, right: 30, left: -15, bottom: 5 }}
                    barSize={60}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={true}
                      tickLine={true}
                      tick={{ fontSize: 10 }}
                      padding={{ left: 0, right: 0 }}
                    />
                    <YAxis 
                      axisLine={true}
                      tickLine={true}
                      tick={{ fontSize: 10 }}
                      domain={[0, 'dataMax + 5']}
                      allowDecimals={false}
                      tickCount={5}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} prospects`, '']}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                      minPointSize={3}
                    >
                      {['Cold', 'Warm', 'Hot'].map((name) => (
                        <Cell key={`cell-${name}`} fill="rgba(139, 92, 246, 0.85)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[240px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-center">
                <p className="text-sm font-medium text-gray-600">No data yet</p>
                <p className="text-sm text-gray-400">Engagement status will appear here</p>
              </div>
            )}
            <div className="mt-2 flex justify-center text-sm text-gray-500">
              {isLoadingEngagementStatus ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <span>Total: {engagementStatus?.status_counts.total || 0} prospects</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-[250px]">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              type="text"
              placeholder="Search"
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex rounded-lg border">
          <div className="w-1/4 p-4 border-r border-dashed bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">All prospects</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronUpIcon className="h-4 w-4" />
              </Button>
            </div>
            <ProspectsList 
              onProspectClick={handleProspectClick} 
              campaignId={campaignId} 
              showPaginationInfo={false}
              showFilter={true}
            />
          </div>

          <div className="w-3/4 p-4 bg-gray-50">
            <h2 className="text-lg font-semibold mb-4">Email history</h2>
            <div className="space-y-4">
              {isLoadingMails ? (
                <EmailHistorySkeleton cards={2} />
              ) : !selectedProspectId ? (
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-white/50 px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-600">No prospect selected</p>
                  <p className="text-sm text-gray-400">Select a prospect from the list to view their email history</p>
                </div>
              ) : mailHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-white/50 px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-600">No emails yet</p>
                  <p className="text-sm text-gray-400">No email history found for this prospect</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mailHistory.map((mail) => (
                    <div key={mail.id} className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex justify-between items-start mb-3 border-b pb-3">
                        <div className="font-medium text-lg">{formatEmailSubject(mail.subject)}</div>
                        <div className="text-sm text-gray-500">
                          {formatLocalDateTime(mail.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-start mb-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">From:</span> {mail.from_email}
                        </div>
                        <div>
                          <span className="font-medium">To:</span> {mail.to_email}
                        </div>
                      </div>
                      
                      <div 
                        className="email-content py-4 text-gray-700 overflow-auto max-h-[300px]"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          backgroundColor: '#ffffff',
                          padding: '16px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <style>{emailContentStyles}</style>
                        <div 
                          dangerouslySetInnerHTML={{ __html: formatEmailHtml(getDisplayContent(mail)) }}
                          style={{
                            maxWidth: '100%'
                          }}
                          className="email-html-content"
                        />
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeInfo(mail).className}`}
                          >
                            {getStatusBadgeInfo(mail).text}
                          </span>
                          
                          {mail.analytics.opened && (
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                              Opened {mail.analytics.open_count > 1 ? `(${mail.analytics.open_count}x)` : ''}
                            </span>
                          )}
                          
                          {mail.analytics.clicked && (
                            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                              Clicked {mail.analytics.click_count > 1 ? `(${mail.analytics.click_count}x)` : ''}
                            </span>
                          )}
                          
                          {mail.analytics.replied && mail.mail_type !== 'reply' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                              Replied
                            </span>
                          )}
                          
                          {mail.analytics.bounced && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                              Bounced
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {mail.analytics.delivered && mail.analytics.delivered_at && (
                            <div>Delivered: {formatLocalDateTime(mail.analytics.delivered_at)}</div>
                          )}
                          {mail.analytics.opened && mail.analytics.opened_at && (
                            <div>Opened: {formatLocalDateTime(mail.analytics.opened_at)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
