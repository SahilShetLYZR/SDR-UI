// src/pages/DomainConfigPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, AlertCircle, Trash2, Mail } from 'lucide-react';
import AddDomainConfigDialog from '@/components/settings/AddDomainConfigDialog';
import PageHeader from '@/components/layout/PageHeader';
import { TableSkeleton } from '@/components/ui/skeletons';
import { domainConfigService, DomainConfig } from '@/services/domainConfigService';
import { friendlyError } from '@/lib/friendlyError';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
      const errorMessage = friendlyError(err, {
        fallback: "We couldn't load your sender emails. Please try again.",
      });
      setError(errorMessage);
      toast({ title: "Couldn't load emails", description: errorMessage, variant: 'destructive' });
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
      console.error("Delete config error:", err);
      toast({
        title: "Couldn't delete email",
        description: friendlyError(err, {
          fallback: "We couldn't delete that email. Please try again.",
        }),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedConfigId(null);
    }
  };


  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="Settings"
        title="Email configuration"
        description="The sending addresses Jazon writes from. Limited to 10 per workspace."
        actions={
          // Header CTA only once configs exist: while loading nothing shows
          // (no appear-then-vanish flicker), and on an empty list the empty
          // state below owns the single primary action.
          configs.length > 0 ? (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/25"
              disabled={configs.length >= 10} // Disable if limit reached
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Email
            </Button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-auto px-6 py-8 md:px-8">

      {configs.length >= 10 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
          You've reached the maximum limit of 10 email configurations.
        </div>
      )}

       {isLoading && (
        <TableSkeleton rows={3} cols={5} cellClassName="py-4 px-6" className="shadow-sm" />
      )}

      {error && !isLoading && (
         <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-red-200 bg-red-50 p-6 my-6 text-center">
           <div className="flex items-center text-red-600">
             <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
             <span>{error}</span>
           </div>
           <Button variant="outline" onClick={fetchConfigs}>
             Try again
           </Button>
         </div>
       )}

      {!isLoading && !error && configs.length === 0 && (
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
            <Mail className="h-7 w-7 text-purple-600" strokeWidth={1.75} />
          </span>
          <h3 className="mt-5 font-display text-xl font-medium text-zinc-900">
            Nothing to send <em className="text-purple-600">from, yet.</em>
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
            You haven't added any email configurations yet. Add your first
            email to start sending campaigns.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/25"
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
      </div>

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
