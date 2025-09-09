import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ActionType, AddActionRequest, workflowService, ApiFile } from "@/services/WorkflowService";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface CreateActionProps {
  workflowId: string;
  // This function now receives all required fields for the new API
  onAddAction: (
    data: AddActionRequest,
  ) => Promise<void>;
}

const availableActionTypes: ActionType[] = ["EmailSending", "Manual"];

export default function CreateAction({
  workflowId,
  onAddAction,
}: CreateActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionName, setActionName] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [timeInterval, setTimeInterval] = useState(0);
  const [actionType, setActionType] = useState<ActionType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New fields for email actions
  const [getCopied, setGetCopied] = useState(false);
  const [copyType, setCopyType] = useState<'cc' | 'bcc'>('bcc');
  const [copyEmail, setCopyEmail] = useState("");
  const [attachFiles, setAttachFiles] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: string, filename: string}>>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const resetForm = () => {
    setActionName("");
    setActionDescription("");
    setActionType(availableActionTypes[0]);
    setTimeInterval(0);
    setGetCopied(false);
    setCopyType("cc");
    setCopyEmail("");
    setAttachFiles(false);
    setAttachmentFiles([]);
    setUploadedFiles([]);
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionName || !actionType) {
      toast.warning("Please provide both Action Name and Type.");
      return;
    }

    // Validate email fields if needed
    if (getCopied && !copyEmail) {
      toast.warning("Please provide a copy email address.");
      return;
    }

    setIsSubmitting(true);
    
    // Create a complete action request with all fields
    const actionPayload: Record<string, any> = {};
    
    // For EmailSending action type, we'll add email-specific fields to the payload
    if (actionType === 'EmailSending') {
      actionPayload.email_subject = "";
      actionPayload.email_body = "";
      actionPayload.to_email = "";
    }
    
    const newActionData: AddActionRequest = {
      name: actionName,
      description: actionDescription || "",
      workflow_id: workflowId,
      action_type: actionType,
      action_payload: actionPayload,
      time_interval: timeInterval,
      get_copied: getCopied,
      copy_type: getCopied ? copyType : undefined,
      copy_email: getCopied ? copyEmail : undefined,
      attach_files: attachFiles,
      attachment_files: attachFiles ? attachmentFiles : undefined,
    };

    try {
      await onAddAction(newActionData);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to add action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Dialog and Trigger remain the same
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="link"
          className="w-full justify-start text-muted-foreground hover:text-foreground text-primary mb-3"
        >
          <Plus size={16} className="mr-2" />
          Create new action
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Action</DialogTitle>
            <DialogDescription>
              Provide a name and select the type for the new action. You'll
              configure details later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Action Name Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action-name" className="text-right">
                Name*
              </Label>
              <Input
                id="action-name"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Send Welcome Email"
                required
              />
            </div>

            {/* Action Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action-description" className="text-right">
                Description
              </Label>
              <Input
                id="action-description"
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Send an email with attachments"
              />
            </div>

            {/* Action Type Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action-type" className="text-right">
                Type*
              </Label>
              <Select
                value={actionType}
                onValueChange={(value: ActionType | "") => setActionType(value)}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Action Type</SelectLabel>
                    {availableActionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time-interval" className="text-right">
                Time Interval*
              </Label>
              <Input
                type="number"
                id="time-interval"
                value={timeInterval}
                onChange={(e) => setTimeInterval(Number(e.target.value))}
                className="col-span-3"
                required
              />
            </div>

            {/* Email Copy Options - Only show if action type is email related */}
            {actionType === 'EmailSending' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">
                    <Label htmlFor="get-copied" className="mr-2">
                      Get Copied
                    </Label>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox 
                      id="get-copied" 
                      checked={getCopied}
                      onCheckedChange={(checked) => setGetCopied(!!checked)} 
                    />
                    <Label htmlFor="get-copied">Send a copy to another email</Label>
                  </div>
                </div>

                {getCopied && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="copy-type" className="text-right">
                        Copy Type
                      </Label>
                      <Select
                        value={copyType}
                        onValueChange={(value: 'cc' | 'bcc') => setCopyType(value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select copy type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="cc">CC</SelectItem>
                            <SelectItem value="bcc">BCC</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="copy-email" className="text-right">
                        Copy Email
                      </Label>
                      <Input
                        id="copy-email"
                        type="email"
                        value={copyEmail}
                        onChange={(e) => setCopyEmail(e.target.value)}
                        className="col-span-3"
                        placeholder="manager@example.com"
                        required={getCopied}
                      />
                    </div>
                  </>
                )}

                {/* Attachment Options */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">
                    <Label htmlFor="attach-files" className="mr-2">
                      Attach Files
                    </Label>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox 
                      id="attach-files" 
                      checked={attachFiles}
                      onCheckedChange={(checked) => setAttachFiles(!!checked)} 
                    />
                    <Label htmlFor="attach-files">Include file attachments</Label>
                  </div>
                </div>
                
                {/* File Upload UI - Only show if attachFiles is true */}
                {attachFiles && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right mt-2">
                      Files
                    </Label>
                    <div className="col-span-3">
                      {/* File list */}
                      {uploadedFiles.length > 0 && (
                        <div className="mb-3 border rounded-md p-2">
                          <ul className="space-y-1">
                            {uploadedFiles.map((file, index) => (
                              <li key={index} className="flex items-center justify-between text-sm">
                                <span className="truncate">{file.filename}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      // Get the file to be removed
                                      const newUploadedFiles = [...uploadedFiles];
                                      const removedFile = newUploadedFiles.splice(index, 1)[0];
                                      
                                      // Remove from attachmentFiles state (file IDs)
                                      const newAttachmentFiles = [...attachmentFiles];
                                      newAttachmentFiles.splice(index, 1);
                                      
                                      // Use the workflowService to delete the file
                                      await workflowService.deleteFile(removedFile.id);
                                      
                                      // Update state after successful deletion
                                      setUploadedFiles(newUploadedFiles);
                                      setAttachmentFiles(newAttachmentFiles);
                                      
                                      toast.success('File removed successfully');
                                    } catch (error) {
                                      console.error('Error deleting file:', error);
                                      toast.error('Failed to delete file');
                                    }
                                  }}
                                >
                                  Remove
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* File upload button */}
                      <div className="flex items-center gap-2">
                        <Input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          disabled={isUploading || uploadedFiles.length >= 3}
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              
                              // Validate file size (5MB limit)
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error(`File size exceeds 5MB limit: ${file.name}`);
                                e.target.value = '';
                                return;
                              }
                              
                              try {
                                setIsUploading(true);
                                
                                // For workflow creation, we need to handle files differently
                                // since we don't have an action ID yet
                                
                                // 1. Upload the file to a temporary location
                                const formData = new FormData();
                                formData.append('workflow_id', workflowId);
                                formData.append('action_id', 'temp-action-id'); // Will be replaced when action is created
                                formData.append('file', file);
                                
                                // Use the workflowService to upload the file
                                const uploadedFile = await workflowService.uploadFile(
                                  workflowId,
                                  'temp-action-id', // Will be replaced when action is created
                                  file
                                );
                                
                                // Add the file ID to attachmentFiles (for API request)
                                setAttachmentFiles([...attachmentFiles, uploadedFile.id]);
                                
                                // Add the file metadata to uploadedFiles (for UI display)
                                setUploadedFiles([...uploadedFiles, {
                                  id: uploadedFile.id,
                                  filename: uploadedFile.filename
                                }]);
                                
                                toast.success(`File uploaded: ${file.name}`);
                                
                              } catch (error) {
                                console.error('Error uploading file:', error);
                                toast.error(`Failed to upload file: ${file.name}`);
                              } finally {
                                setIsUploading(false);
                                // Reset the input so the same file can be selected again
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploading || uploadedFiles.length >= 3}
                          onClick={() => {
                            document.getElementById('file-upload')?.click();
                          }}
                        >
                          {isUploading ? 'Uploading...' : 'Select File'}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {uploadedFiles.length}/3 files selected
                        </span>
                      </div>
                      {uploadedFiles.length >= 3 && (
                        <div className="mt-2 text-xs text-amber-500">
                          Maximum 3 files allowed
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || !actionName || !actionType}
            >
              {isSubmitting ? "Creating..." : "Create Action"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
