import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Eye, 
  Loader2, 
  Shield, 
  Users, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Mail, 
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Zap,
  Globe,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { adminService, AdminCampaignsResponse } from '@/services/adminService';
import { ApiCampaign } from '@/services/campaignService';
import { useToast } from '@/components/ui/use-toast';
import { useAdmin } from '@/hooks/useAdmin';

const AdminDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, adminStatus, loading: adminLoading, error: adminError } = useAdmin();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (!adminLoading && isAdmin) {
      fetchAdminCampaigns();
    }
  }, [adminLoading, isAdmin, navigate, toast]);

  const fetchAdminCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: AdminCampaignsResponse = await adminService.getAdminCampaigns(1, 50);
      setCampaigns(data.items);
      setTotalCampaigns(data.total_items);
    } catch (err) {
      setError('Failed to fetch campaigns. Please try again.');
      console.error('Error fetching admin campaigns:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch campaigns.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCampaign = (campaignId: string, event: React.MouseEvent) => {
    event.preventDefault();
    navigate(`/campaign/${campaignId}?from=admin`);
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (adminLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="text-purple-600 animate-spin h-8 w-8 mb-4" />
        <p className="text-gray-600">Checking admin access...</p>
      </div>
    );
  }

  if (adminError || !isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">You do not have admin privileges to access this page.</p>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - matching existing pages */}
      <header className="border-b p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Organization: {adminStatus?.organization_id} | Admin: {adminStatus?.email}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={fetchAdminCampaigns}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="p-6 flex-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                Across all users in organization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaigns.filter(c => c.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently running campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaigns.reduce((sum, c) => sum + (c.total_mails_sent || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total emails sent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading campaigns...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchAdminCampaigns} variant="outline">
                  Retry
                </Button>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-500">No campaigns found.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Campaign Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Prospects</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Mails Sent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User ID</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {campaign.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {campaign.total_prospects || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {campaign.total_mails_sent || 0}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          campaign.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}>
                          {campaign.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {campaign.user_id?.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleViewCampaign(campaign._id, e)}
                        >
                          <Eye className="h-4 w-4 mr-1"/>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
