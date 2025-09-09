// src/pages/DomainConfigPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, AlertCircle, Trash2, Mail } from 'lucide-react';
import AddDomainConfigDialog from '@/components/settings/AddDomainConfigDialog';
import { domainConfigService, DomainConfig } from '@/services/domainConfigService';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import emptyStateImage from '@/assets/empty-state.svg';

const DomainConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<DomainConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Domain for email configurations from environment variable
  const domain = import.meta.env.VITE_EMAIL_DOMAIN || "jazon.lyzr.app";

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await domainConfigService.getDomainConfigs();
      setConfigs(data);
    } catch (err: any) {
      console.error("Fetch config error:", err);
      const errorMessage = err?.response?.data?.detail || 'Failed to fetch email configurations.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleAddSuccess = () => {
    fetchConfigs(); // Refresh the list after adding a new config
  };

  const handleDeleteClick = (emailId: string) => {
    setSelectedConfigId(emailId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConfigId) return;
    
    setIsDeleting(true);
    try {
      await domainConfigService.deleteDomainConfig(selectedConfigId);
      toast({ title: 'Success', description: 'Email configuration deleted successfully.' });
      fetchConfigs(); // Refresh the list after deletion
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Failed to delete email configuration.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedConfigId(null);
    }
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Email Configuration</h1>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-purple-600 hover:bg-purple-700"
          disabled={configs.length >= 10} // Disable if limit reached
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Email
        </Button>
      </div>
      
      {configs.length >= 10 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
          You've reached the maximum limit of 10 email configurations.
        </div>
      )}

       {isLoading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-lg">Loading Configurations...</span>
        </div>
      )}

      {error && !isLoading && (
         <div className="flex items-center justify-center py-10 text-red-600 bg-red-100 border border-red-300 rounded-md p-6 my-6">
           <AlertCircle className="h-5 w-5 mr-3" />
           <span>Error loading configurations: {error}</span>
         </div>
       )}

      {!isLoading && !error && configs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <img 
            src={emptyStateImage} 
            alt="No emails configured" 
            className="w-48 h-48 mb-6 opacity-80"
            onError={(e) => {
              // Fallback if the image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          <Mail className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Wow, such empty!</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            You haven't added any email configurations yet. Add your first email to start sending campaigns.
          </p>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-purple-600 hover:bg-purple-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Your First Email
          </Button>
        </div>
      )}

      {!isLoading && !error && configs.length > 0 && (
        <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
            <TableCaption className="py-3">A list of your configured email addresses. Limited to 10 per user.</TableCaption>
            <TableHeader className="bg-gray-50">
                <TableRow>
                <TableHead className="w-[40%] py-4 px-6">Email</TableHead>
                <TableHead className="py-4 px-6">Created</TableHead>
                <TableHead className="py-4 px-6">Emails Sent</TableHead>
                <TableHead className="py-4 px-6">Opens</TableHead>
                <TableHead className="text-right py-4 px-6">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {configs.map((config) => (
                    <TableRow key={config.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium py-4 px-6">{config.email_id}</TableCell>
                    <TableCell className="py-4 px-6">{new Date(config.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="py-4 px-6">{config.total_mails_sent}</TableCell>
                    <TableCell className="py-4 px-6">{config.total_opens}</TableCell>
                    <TableCell className="text-right py-4 px-6">
                       <Button
                         variant="outline"
                         size="sm"
                         className="text-red-600 hover:text-white hover:bg-red-600 border-red-200"
                         onClick={() => handleDeleteClick(config.email_id)}
                        >
                         <Trash2 className="h-4 w-4 mr-2" />
                         Delete
                       </Button>
                    </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
       )}


      <AddDomainConfigDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleAddSuccess}
        domain={domain}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Email Configuration</AlertDialogTitle>
            <AlertDialogDescription className="py-2">
              Are you sure you want to delete this email configuration? 
              <span className="font-medium block mt-2">{selectedConfigId}</span>
              <p className="mt-2 text-red-600">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting} className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Email'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DomainConfigPage;
