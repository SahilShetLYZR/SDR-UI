import React, { useState } from 'react';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { campaignService, CreateCampaignRequest } from '@/services/campaignService';

interface CreateCampaignDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSuccess: () => void;
}

const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({
                                                                      open,
                                                                      onOpenChange,
                                                                      onSuccess,
                                                                   }) => {
   const [newCampaignName, setNewCampaignName] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const { toast } = useToast();

   const closeModal = () => {
      setNewCampaignName('');
      onOpenChange(false);
   };

   const handleCreateCampaign = async () => {
      if (!newCampaignName.trim()) {
         toast({
            title: 'Error',
            description: 'Please enter a campaign name',
            variant: 'destructive',
         });
         return;
      }

      const campaignData: CreateCampaignRequest = {
         name: newCampaignName,
      };

      try {
         setIsSubmitting(true);
         await campaignService.createCampaign(campaignData);
         toast({
            title: 'Success',
            description: 'Campaign created successfully',
         });
         closeModal();
         onSuccess(); // Tell parent to refresh campaigns
      } catch (err) {
         toast({
            title: 'Error',
            description: 'Failed to create campaign',
            variant: 'destructive',
         });
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
           <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                 Create a new campaign to start sending emails
              </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
              <div className="space-y-2">
                 <Label htmlFor="name">Campaign Name</Label>
                 <Input
                   id="name"
                   value={newCampaignName}
                   onChange={(e) => setNewCampaignName(e.target.value)}
                   placeholder="Enter campaign name"
                 />
              </div>
           </div>
           <DialogFooter>
              <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
                 Cancel
              </Button>
              <Button
                onClick={handleCreateCampaign}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isSubmitting}
              >
                 {isSubmitting ? (
                   <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                   </>
                 ) : (
                   'Create Campaign'
                 )}
              </Button>
           </DialogFooter>
        </DialogContent>
     </Dialog>
   );
};

export default CreateCampaignDialog;