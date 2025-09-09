// src/components/settings/AddDomainConfigDialog.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { domainConfigService, CreateDomainConfigRequest } from '@/services/domainConfigService';

interface AddDomainConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback after successful creation
  domain: string; // Domain to append to the email
}

const AddDomainConfigDialog: React.FC<AddDomainConfigDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  domain,
}) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();


  const closeModal = () => {
    onOpenChange(false);
    setUsername('');
  };

  const handleCreate = async () => {
    if (!username.trim()) {
      toast({ title: 'Error', description: 'Please enter a username for your email.', variant: 'destructive' });
      return;
    }
    
    // Check if username contains @ symbol (which should have been prevented by the onChange handler)
    if (username.includes('@')) {
      toast({ 
        title: 'Error', 
        description: 'Please enter only the username part without the @ symbol or domain.', 
        variant: 'destructive' 
      });
      return;
    }
    
    // Validate username format (no spaces or special characters except dots, hyphens, and underscores)
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
      toast({ 
        title: 'Error', 
        description: 'Username can only contain letters, numbers, dots, hyphens, and underscores.', 
        variant: 'destructive' 
      });
      return;
    }
    
    // Validate username length
    if (username.length < 3) {
      toast({ 
        title: 'Error', 
        description: 'Username must be at least 3 characters long.', 
        variant: 'destructive' 
      });
      return;
    }

    const emailId = `${username}@${domain}`;
    
    const data: CreateDomainConfigRequest = {
      email_id: emailId
    };

    setIsSubmitting(true);
    try {
      await domainConfigService.createDomainConfig(data);
      toast({ title: 'Success', description: 'Email configuration added.' });
      onSuccess(); // Refresh the list in the parent component
      closeModal();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || 'Failed to add email configuration.';
      console.error("Create config error:", error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Email Configuration</DialogTitle>
          <DialogDescription>
            Create an email address for sending campaign emails. Limited to 10 emails per user.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Email Username</Label>
            <div className="flex items-center">
              <div className="relative flex-1">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    // Remove any @ characters and anything after them
                    const value = e.target.value.split('@')[0];
                    setUsername(value);
                  }}
                  placeholder="username"
                  className="w-full pr-2"
                  autoComplete="off"
                />
              </div>
              <div className="bg-gray-100 px-3 py-2 border border-gray-200 rounded-r-md text-gray-500 flex-shrink-0 whitespace-nowrap">
                @{domain}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This email address will be used to send campaign emails.</p>
            <p className="text-xs text-amber-600 mt-1">Only enter the username portion. The domain will be added automatically.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Email'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDomainConfigDialog;
