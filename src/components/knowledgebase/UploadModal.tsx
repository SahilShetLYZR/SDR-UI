import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { KnowledgeBaseService } from '@/services/knowledgeBaseService';
import { X, TriangleAlert, Upload, FileText, Globe } from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { normalizeUrl, URL_ERROR_MESSAGE } from '@/lib/url';
import { friendlyError } from '@/lib/friendlyError';

interface UploadModalProps {
  onClose: () => void;
  // `async: true` means the backend ingests in the background (websites are
  // crawled after the request returns) so the parent should poll for the new
  // document instead of refetching once.
  onSuccess: (info?: { async?: boolean }) => void;
  campaignId: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess, campaignId }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('File');
  const [isLoading, setIsLoading] = useState(false);
  const [kbId, setKbId] = useState<string>('');
  const [formData, setFormData] = useState({
    text: '',
    url: '',
    websiteName: '',
    file: null as File | null,
  });

  // Fetch campaign details to get the kb_id
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        const campaigns = await campaignService.getCampaigns();
        const campaign = campaigns.find(c => c._id === campaignId);
        if (campaign && campaign.kb_id) {
          setKbId(campaign.kb_id);
        } else {
          toast({
            title: "Error",
            description: "Could not find knowledge base ID for this campaign",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Error fetching campaign details:', error);
        toast({
          title: "Error",
          description: "Failed to fetch campaign details",
          variant: "destructive"
        });
      }
    };

    fetchCampaignDetails();
  }, [campaignId, toast]);

  const handleTextSubmit = async () => {
    if (!formData.text || !kbId) {
      toast({
        title: "Error",
        description: !kbId 
          ? "Knowledge base ID not found" 
          : "Please enter text content",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await KnowledgeBaseService.addText({
        kb_id: kbId,
        text: formData.text
      });
      toast({
        title: "Success",
        description: "Text content added successfully",
      });
      onSuccess();
    } catch (error) {
      console.error('Error adding text:', error);
      toast({
        title: "Error",
        description: "Failed to add text",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebsiteSubmit = async () => {
    if (!formData.url || !kbId) {
      toast({
        title: "Error",
        description: !kbId 
          ? "Knowledge base ID not found" 
          : "Please enter a website URL",
        variant: "destructive"
      });
      return;
    }

    // The backend requires a name to identify the website in the KB.
    if (!formData.websiteName.trim()) {
      toast({
        title: "Name needed",
        description: "Give this website a name so you can find it in your knowledge base later.",
        variant: "destructive"
      });
      return;
    }

    // Accept scheme-less input ("example.com") — normalize to https://.
    const normalizedUrl = normalizeUrl(formData.url);
    if (!normalizedUrl) {
      toast({
        title: "Check the address",
        description: URL_ERROR_MESSAGE,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await KnowledgeBaseService.addWebsite({
        kb_id: kbId,
        source: "webpage",
        urls: [normalizedUrl],
        name: formData.websiteName.trim()
      });
      toast({
        title: "Website added",
        description: "We're reading it now — content will appear in your knowledge base shortly.",
      });
      // Website ingestion is asynchronous on the backend, so tell the parent to
      // poll for the new document rather than refetch a single time (which
      // returns before the crawl finishes — the "need to refresh" bug).
      onSuccess({ async: true });
    } catch (error) {
      console.error('Error adding website:', error);
      toast({
        title: "Couldn't add website",
        description: friendlyError(error, {
          fallback: "We couldn't add that website. Please try again.",
        }),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!formData.file || !kbId) {
      toast({
        title: "Error",
        description: !kbId 
          ? "Knowledge base ID not found" 
          : "Please select a file",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await KnowledgeBaseService.addFile(kbId, formData.file);
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      onSuccess();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = () => {
    switch (activeTab) {
      case 'File':
        handleFileSubmit();
        break;
      case 'Website':
        handleWebsiteSubmit();
        break;
      case 'Text':
        handleTextSubmit();
        break;
    }
  };

  const tabs = [
    { id: 'File', icon: <Upload className="w-4 h-4 mr-2" /> },
    { id: 'Website', icon: <Globe className="w-4 h-4 mr-2" /> },
    { id: 'Text', icon: <FileText className="w-4 h-4 mr-2" /> }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-black" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">Add to Knowledge Base</h2>

        <div className="bg-orange-50 border border-orange-200 text-sm rounded-lg px-4 py-3 mb-6 flex flex-row">
          <TriangleAlert className="w-5 h-5 mr-2 text-orange-400 font-semibold"/>
          <div className="flex flex-col">
            <span className="mr-2 text-orange-400 font-semibold inline-flex items-center">
              Important Notice
            </span>
            <span className="text-xs text-gray-500">
              By uploading documents to Jazon, you confirm that you have the right to share the information contained within them.
            </span>
          </div>
        </div>

        <div className="bg-gray-100 rounded-md overflow-hidden mb-6">
          <div className="flex justify-between bg-gray-100 p-1 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2 text-sm font-medium flex items-center justify-center ${
                  activeTab === tab.id
                    ? 'bg-white rounded-md text-black shadow-sm'
                    : 'text-gray-400 hover:text-black'
                }`}
              >
                {tab.icon}
                {tab.id}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {activeTab === 'Text' && (
            <div>
              <Label>Text Content</Label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Enter text content"
                className="min-h-[150px]"
              />
            </div>
          )}

          {activeTab === 'Website' && (
            <div className="space-y-4">
              <div>
                <Label>
                  Website Name <span className="text-red-500" aria-hidden>*</span>
                </Label>
                <Input
                  value={formData.websiteName}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteName: e.target.value }))}
                  placeholder="e.g. Company blog"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <Label>Website URL</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Enter website URL (e.g., https://example.com)"
                />
              </div>
            </div>
          )}

          {activeTab === 'File' && (
            <div>
              <Label>File Upload</Label>
              <div className="mt-2 flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOCX, TXT (MAX. 10MB)</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                  />
                </label>
              </div>
              {formData.file && (
                <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <span className="text-sm truncate">{formData.file.name}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !kbId}
              className="bg-purple-600 hover:bg-purple-500"
            >
              {isLoading ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
