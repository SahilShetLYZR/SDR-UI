import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ProspectsService, UpdateProspectsRequest, Prospect } from '@/services/prospectsService';
import { useParams } from 'react-router-dom';

interface EditProspectModalProps {
  onClose: () => void;
  onSuccess: () => void;
  prospect: {
    id: string;
    name?: string;
    email: string;
    company?: string;
    position?: string;
    linkedin_url?: string;
  };
}

const EditProspectModal: React.FC<EditProspectModalProps> = ({ onClose, onSuccess, prospect }) => {
  const { toast } = useToast();
  const { id: campaignId } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: prospect.name || '',
    email: prospect.email || '',
    company: prospect.company || '',
    position: prospect.position || '',
    linkedin_url: prospect.linkedin_url || '',
  });

  useEffect(() => {
    // Update form data if prospect changes
    setFormData({
      name: prospect.name || '',
      email: prospect.email || '',
      company: prospect.company || '',
      position: prospect.position || '',
      linkedin_url: prospect.linkedin_url || '',
    });
  }, [prospect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!campaignId) {
      toast({
        title: "Error",
        description: "Campaign ID is missing",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const request: UpdateProspectsRequest = {
        campaign_id: campaignId,
        prospects: [{
          id: prospect.id,
          name: formData.name,
          email: formData.email,
          company: formData.company,
          position: formData.position,
          linkedin_url: formData.linkedin_url
        }]
      };
      
      await ProspectsService.updateProspects(request);

      onSuccess();
      toast({
        title: "Success",
        description: "Prospect updated successfully",
      });
      onClose();
    } catch (error) {
      console.error('Error updating prospect:', error);
      toast({
        title: "Error",
        description: "Failed to update prospect. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold mb-6">Edit Prospect</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="company">Organization</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Acme Inc."
            />
          </div>
          
          <div>
            <Label htmlFor="position">Designation</Label>
            <Input
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Senior Developer"
            />
          </div>
          
          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleChange}
              placeholder="https://www.linkedin.com/in/johndoe"
            />
          </div>
          
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
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProspectModal;
