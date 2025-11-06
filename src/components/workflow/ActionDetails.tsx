import React, { useState, useEffect, useCallback, useRef } from "react";
import debounce from "lodash/debounce";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import InfoTag from "@/components/ui/info-tag";
import ActionInput from "@/components/workflow/ActionInput";
import ActionResult from "@/components/workflow/ActionResult";
import GenerateActionResult from "@/components/workflow/GenerateActionResult";
import { ApiAction, UpdateActionRequest, ApiFile } from "@/services/WorkflowService";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { workflowService } from "@/services/WorkflowService";
import { snakeToTitleCase } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadedFile {
  id: string;
  filename: string;
  s3_url?: string;
}

interface ActionDetailsProps {
  selectedAction: ApiAction | null;
  workflowId: string;
  campaignId: string;
  onUpdateAction: (
    data: Omit<UpdateActionRequest, "workflow_id">,
  ) => Promise<void>;
  isActive: boolean;
}

export default function ActionDetails({
  selectedAction,
  workflowId,
  campaignId,
  onUpdateAction,
  isActive,
}: ActionDetailsProps) {
  const [actionName, setActionName] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [timeInterval, setTimeInterval] = useState(0);
  const [actionPayload, setActionPayload] = useState<Record<string, any>>({});
  const [payloadSchema, setPayloadSchema] = useState<Record<
    string,
    any
  > | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // New fields for email actions
  const [getCopied, setGetCopied] = useState(false);
  const [copyType, setCopyType] = useState<'cc' | 'bcc'>('bcc');
  const [copyEmail, setCopyEmail] = useState("");
  const [attachFiles, setAttachFiles] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Reference to store the debounced save function
  const debouncedSaveRef = useRef<any>(null);

  // --- State for Sample Generation Result Display ---
  const [showActionResultColumn, setShowActionResultColumn] = useState(false); // Controls right column visibility - explicitly set to false by default
  const [isGeneratingSample, setIsGeneratingSample] = useState<boolean>(false); // Overall loading state
  const [generationStatus, setGenerationStatus] = useState<string | null>(null); // Status message from polling
  const [generationError, setGenerationError] = useState<string | null>(null); // Error message
  const [generatedSubject, setGeneratedSubject] = useState<string | null>(null); // Final result
  const [generatedContent, setGeneratedContent] = useState<string | null>(null); // Final result
  const [fromEmail, setFromEmail] = useState<string | null>(null); // Sender email
  const [toEmail, setToEmail] = useState<string | null>(null); // Recipient email

  // --- Effect to load Action details and Schema (Updated with new fields) ---
  useEffect(() => {
    setPayloadSchema(null); // Clear previous schema immediately
    // Reset generation state when action changes
    setShowActionResultColumn(false);
    setIsGeneratingSample(false);
    setGenerationStatus(null);
    setGenerationError(null);
    setGeneratedSubject(null);
    setGeneratedContent(null);
    setFromEmail(null);
    setToEmail(null);

    if (selectedAction) {
      setActionName(selectedAction.name);
      setActionDescription(selectedAction.description || "");
      setTimeInterval(selectedAction.time_interval || 0);
      setActionPayload(selectedAction.action_payload || {});
      
      // Set email-related fields
      setGetCopied(selectedAction.get_copied || false);
      setCopyType(selectedAction.copy_type || 'bcc');
      setCopyEmail(selectedAction.copy_email || "");
      setAttachFiles(selectedAction.attach_files || false);
      setAttachmentFiles(selectedAction.attachment_files || []);

      // Reset dirty state
      setIsDirty(false);
      setGenerationStatus(null);
      setGenerationError(null);
      setGeneratedSubject(null);
      setGeneratedContent(null);
      
      // Load files for this action if attachFiles is true
      if (selectedAction.attach_files && selectedAction._id) {
        const loadActionFiles = async () => {
          try {
            const files = await workflowService.getActionFiles(selectedAction._id);
            setUploadedFiles(files.map(file => ({
              id: file.id,
              filename: file.filename,
              s3_url: file.s3_url
            })));
          } catch (error) {
            console.error('Error loading action files:', error);
            toast.error('Failed to load attachment files');
          }
        };
        
        loadActionFiles();
      } else {
        setUploadedFiles([]);
      }
      
      // Fetch payload schema
      const fetchSchema = async () => {
        setIsLoadingSchema(true);
        setPayloadSchema(null);
        try {
          const schema = await workflowService.getActionInputFields(
            selectedAction.action_type,
          );
          setPayloadSchema(schema);
          // Initialize/Merge Payload State based on Schema (logic remains same)
          setActionPayload((currentPayload) => {
            const newPayload = {}; // Start empty
            // Ensure schema is an object before iterating
            if (schema && typeof schema === "object") {
              for (const key in schema) {
                // Use existing value if valid, otherwise use schema default
                if (
                  currentPayload &&
                  Object.prototype.hasOwnProperty.call(currentPayload, key) &&
                  currentPayload[key] !== null &&
                  currentPayload[key] !== undefined
                ) {
                  newPayload[key] = currentPayload[key];
                } else {
                  newPayload[key] = schema[key]; // Use schema default
                }
              }
            } else {
              // Handle cases where schema is not as expected, maybe log an error
              console.warn("Received schema is not an object:", schema);
              // Fallback: Use current payload as is, or handle error
              Object.assign(newPayload, currentPayload || {});
            }
            return newPayload;
          });
        } catch (error) {
          console.error(
            `Failed to load payload schema for ${selectedAction.action_type}`,
            error,
          );
          toast.error("Could not load configuration schema.");
        } finally {
          setIsLoadingSchema(false);
        }
      };

      fetchSchema();
    } else {
      // Clear all fields if no action is selected
      setActionName("");
      setActionDescription("");
      setActionPayload({});
      setPayloadSchema(null);
      setIsDirty(false);
      // setShowActionResult(false); // Use showActionResultColumn
    }
  }, [selectedAction]); // Dependency: selectedAction

  // --- Create a debounced save function ---
  const debouncedSave = useCallback(
    debounce(async () => {
      if (!selectedAction || !isDirty || isSaving) return;
      
      console.log('Auto-saving after 10 seconds of inactivity...');
      setIsAutoSaving(true);
      
      try {
        // Prepare the payload similar to handleSave
        const finalPayloadToSend: Record<string, any> = {};
        if (payloadSchema && typeof payloadSchema === "object") {
          for (const key in payloadSchema) {
            if (Object.prototype.hasOwnProperty.call(actionPayload, key)) {
              finalPayloadToSend[key] = actionPayload[key];
            }
          }
        } else {
          Object.assign(finalPayloadToSend, actionPayload);
        }

        const actionUpdateData: UpdateActionRequest["action_data"] = {
          name: actionName,
          description: actionDescription,
          action_payload: finalPayloadToSend,
          time_interval: timeInterval,
        };
        
        const updateRequest: Omit<UpdateActionRequest, "workflow_id"> = {
          action_id: selectedAction._id,
          action_data: actionUpdateData,
        };
        
        await onUpdateAction(updateRequest);
        setIsDirty(false);
        toast.success("Changes auto-saved");
      } catch (error) {
        console.error("Auto-save failed:", error);
        toast.error("Auto-save failed. Please save manually.");
      } finally {
        setIsAutoSaving(false);
      }
    }, 10000), // 10 seconds debounce
    [selectedAction, isDirty, isSaving, payloadSchema, actionPayload, actionName, actionDescription, timeInterval, onUpdateAction]
  );

  // Store the debouncedSave function in a ref so we can cancel it
  useEffect(() => {
    debouncedSaveRef.current = debouncedSave;
    
    // Cleanup function to cancel the debounced save when component unmounts
    return () => {
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, [debouncedSave]);

  // --- Handlers for local state changes with auto-save trigger ---
  const handlePayloadChange = useCallback((fieldName: string, value: any) => {
    setActionPayload((prev) => ({ ...prev, [fieldName]: value }));
    setIsDirty(true);
    
    // Trigger the debounced save
    debouncedSave();
  }, [debouncedSave]);

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setActionName(event.target.value);
      setIsDirty(true);
      
      // Trigger the debounced save
      debouncedSave();
    },
    [debouncedSave],
  );

  const handleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setActionDescription(event.target.value);
      setIsDirty(true);
      
      // Trigger the debounced save
      debouncedSave();
    },
    [debouncedSave],
  );

  const handleActionTimeIntervalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setTimeInterval(Number(event.target.value));
      setIsDirty(true);
      
      // Trigger the debounced save
      debouncedSave();
    },
    [debouncedSave],
  );
  
  // New handlers for email-related fields
  const handleGetCopiedChange = useCallback(
    (checked: boolean) => {
      setGetCopied(checked);
      setIsDirty(true);
      
      debouncedSave();
    },
    [debouncedSave],
  );
  
  const handleCopyTypeChange = useCallback(
    (value: 'cc' | 'bcc') => {
      setCopyType(value);
      setIsDirty(true);
      
      debouncedSave();
    },
    [debouncedSave],
  );
  
  const handleCopyEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCopyEmail(event.target.value);
      setIsDirty(true);
      
      debouncedSave();
    },
    [debouncedSave],
  );
  
  const handleAttachFilesChange = useCallback(
    (checked: boolean) => {
      setAttachFiles(checked);
      setIsDirty(true);
      
      debouncedSave();
    },
    [debouncedSave],
  );

  // --- Save handler (Updated to cancel debounced save) ---
  const handleSave = async () => {
    // Cancel any pending auto-save when manual save is clicked
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.cancel();
    }
    
    if (!selectedAction || !isDirty || isSaving) return;
    setIsSaving(true);

    const finalPayloadToSend: Record<string, any> = {};
    if (payloadSchema && typeof payloadSchema === "object") {
      for (const key in payloadSchema) {
        if (Object.prototype.hasOwnProperty.call(actionPayload, key)) {
          finalPayloadToSend[key] = actionPayload[key];
        }
      }
    } else {
      console.warn(
        "Payload schema not loaded or invalid, sending current payload state.",
      );
      Object.assign(finalPayloadToSend, actionPayload);
    }

    const actionUpdateData: UpdateActionRequest["action_data"] = {
      name: actionName,
      description: actionDescription,
      action_payload: finalPayloadToSend,
      time_interval: timeInterval,
      // Include the new email-related fields
      get_copied: getCopied,
      copy_type: getCopied ? copyType : undefined,
      copy_email: getCopied ? copyEmail : undefined,
      attach_files: attachFiles,
      attachment_files: attachFiles ? attachmentFiles : undefined,
    };
    const updateRequest: Omit<UpdateActionRequest, "workflow_id"> = {
      action_id: selectedAction._id,
      action_data: actionUpdateData,
    };
    try {
      await onUpdateAction(updateRequest);
      setIsDirty(false);
    } catch (error) {
      /* Handled by parent */
    } finally {
      setIsSaving(false);
    }
  };

  // --- Sample Generation Handlers ---
  const handleGenerationStart = useCallback(() => {
    // Only show the result column when user explicitly generates a sample
    setShowActionResultColumn(true);
    setIsGeneratingSample(true);
    setGenerationStatus("Starting generation...");
    setGenerationError(null);
    setGeneratedSubject(null);
    setGeneratedContent(null);
    setFromEmail(null);
    setToEmail(null);
  }, []);

  const handleStatusUpdate = useCallback((status: string) => {
    setGenerationStatus(status);
  }, []);

  const handleGenerationComplete = useCallback(
    (result: { subject: string; content: string; from_email?: string; to_email?: string }) => {
      setIsGeneratingSample(false);
      setGenerationStatus(null);
      setGeneratedSubject(result.subject);
      setGeneratedContent(result.content);
      setFromEmail(result.from_email || null);
      setToEmail(result.to_email || null);
    },
    [],
  );

  const handleGenerationError = useCallback((error: string) => {
    setIsGeneratingSample(false);
    setGenerationStatus(null); // Clear status on error
    setGenerationError(error);
    // Optionally hide the column on certain errors? Or let ActionResult display the error.
    // setShowActionResultColumn(false);
  }, []);

  // --- Render dynamic inputs (Unchanged logic) ---
  const renderPayloadInputs = () => {
    if (isLoadingSchema) {
      return (
        <div className="text-muted-foreground p-4">
          Loading configuration fields...
        </div>
      );
    }
    if (
      !payloadSchema ||
      typeof payloadSchema !== "object" ||
      Object.keys(payloadSchema).length === 0
    ) {
      return (
        <div className="text-muted-foreground p-4">
          No specific payload configuration needed.
        </div>
      );
    }

    return Object.keys(payloadSchema).map((key) => {
      const useTextArea =
        key.includes("instructions") ||
        key.includes("template") ||
        key.includes("body");
      const label = snakeToTitleCase(key);

      return (
        <ActionInput
          key={key}
          id={`action-payload-${key}`}
          name={label}
          value={actionPayload[key] ?? ""}
          onChange={(e) => handlePayloadChange(key, e.target.value)}
          isTextArea={useTextArea}
          placeholder={`Enter ${label}`}
          disabled={isSaving}
        />
      );
    });
  };

  // --- Main Render ---
  if (!selectedAction) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No action selected
      </div>
    );
  }

  // Ensure campaignId and actionId are available before rendering GenerateActionResult
  if (!campaignId) {
    return (
      <div className="p-4 text-center text-destructive">
        Error: Campaign ID is missing. Cannot generate sample.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2 flex-grow mr-4">
          <Label
            htmlFor="action-detail-name"
            className="text-lg font-semibold whitespace-nowrap"
          >
            Action Name:
          </Label>
          <Input
            id="action-detail-name"
            placeholder="Enter action name"
            value={actionName}
            onChange={handleNameChange}
            disabled={isSaving}
            className="flex-grow"
          />
        </div>
        <div>
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving || isAutoSaving || isLoadingSchema}
          >
            {isSaving || isAutoSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSaving ? "Saving..." : isAutoSaving ? "Auto-saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Configuration Area */}
      <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-md shadow-sm flex-grow overflow-hidden flex flex-col">
        <InfoTag>
          Configure the action name, description, and specific parameters below.
          Use variables like{" "}
          <code className="text-primary/80 px-1 bg-neutral-100 dark:bg-neutral-800 border dark:border-neutral-700 rounded">
            {"{firstName}"}
          </code>
          .
        </InfoTag>
        
        {/* Two-column layout */}
        <div className="flex flex-row h-full">

        {/* Main Form Content */}
        <div className={`mt-4 space-y-4 overflow-y-auto ${showActionResultColumn ? 'w-1/2 pr-4' : 'w-full'}`}>
          {/* Action Description */}
          <div className="mb-4">
            <Label htmlFor="action-description" className="mb-2 block">
              Description
            </Label>
            <Textarea
              id="action-description"
              value={actionDescription}
              onChange={handleDescriptionChange}
              placeholder="Describe what this action does"
              className="min-h-[100px]"
              disabled={isSaving}
            />
          </div>

          {/* Action Time Interval */}
          <div className="mb-4">
            <Label htmlFor="action-time-interval" className="mb-2 block">
              Time Interval (seconds)
            </Label>
            <Input
              id="action-time-interval"
              type="number"
              value={timeInterval}
              onChange={handleActionTimeIntervalChange}
              placeholder="0"
              disabled={isSaving}
            />
          </div>
          
          {/* Email-specific fields - only show for email actions */}
          {selectedAction?.action_type === 'EmailSending' && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Email Settings</h3>
              
              {/* Get Copied Option */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="get-copied" 
                    checked={getCopied}
                    onCheckedChange={(checked) => handleGetCopiedChange(!!checked)}
                    disabled={isSaving}
                  />
                  <Label htmlFor="get-copied">Send a copy to another email</Label>
                </div>
              </div>
              
              {/* Copy Type and Email - only show if getCopied is true */}
              {getCopied && (
                <>
                  <div className="mb-4">
                    <Label htmlFor="copy-type" className="mb-2 block">
                      Copy Type
                    </Label>
                    <Select
                      value={copyType}
                      onValueChange={(value: 'cc' | 'bcc') => handleCopyTypeChange(value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
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
                  
                  <div className="mb-4">
                    <Label htmlFor="copy-email" className="mb-2 block">
                      Copy Email Address
                    </Label>
                    <Input
                      id="copy-email"
                      type="email"
                      value={copyEmail}
                      onChange={handleCopyEmailChange}
                      placeholder="manager@example.com"
                      disabled={isSaving}
                    />
                  </div>
                </>
              )}
              
              {/* Attach Files Option */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="attach-files" 
                    checked={attachFiles}
                    onCheckedChange={(checked) => handleAttachFilesChange(!!checked)}
                    disabled={isSaving}
                  />
                  <Label htmlFor="attach-files">Include file attachments</Label>
                </div>
              </div>
              
              {/* File Attachment Management - only show if attachFiles is true */}
              {attachFiles && (
                <div className="mb-4">
                  <Label className="mb-2 block">
                    Attachment Files
                  </Label>
                  {uploadedFiles.length > 0 ? (
                    <div className="mb-3 border rounded-md p-2">
                      <ul className="space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-blue-500 hover:text-blue-700"
                                onClick={() => {
                                  // Open the S3 URL in a new tab if available
                                  if (file.s3_url) {
                                    window.open(file.s3_url, '_blank');
                                  } else {
                                    toast.error('File URL not available');
                                  }
                                }}
                              >
                                <span className="truncate">{file.filename}</span>
                              </Button>
                            </div>
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
                                  
                                  // Delete the file from the server using the API
                                  await workflowService.deleteFile(removedFile.id);
                                  
                                  // Update state after successful deletion
                                  setUploadedFiles(newUploadedFiles);
                                  setAttachmentFiles(newAttachmentFiles);
                                  setIsDirty(true);
                                  debouncedSave();
                                  
                                  toast.success('File removed successfully');
                                } catch (error) {
                                  console.error('Error removing file:', error);
                                  toast.error('Failed to remove file');
                                }
                              }}
                              disabled={isSaving}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No attachments added yet.</p>
                  )}
                  
                  {/* File Upload Button */}
                  <div className="mt-3">
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      disabled={isSaving || isUploading || uploadedFiles.length >= 3}
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
                            
                            if (selectedAction?._id && campaignId) {
                              // Upload the file using the workflowService API
                              const uploadedFile = await workflowService.uploadFile(
                                selectedAction.workflow_id,
                                selectedAction._id,
                                file
                              );
                              
                              // Add the file ID to attachmentFiles (for API request)
                              const newAttachmentFiles = [...attachmentFiles, uploadedFile.id];
                              setAttachmentFiles(newAttachmentFiles);
                              
                              // Add the file metadata to uploadedFiles (for UI display)
                              setUploadedFiles([...uploadedFiles, {
                                id: uploadedFile.id,
                                filename: uploadedFile.filename,
                                s3_url: uploadedFile.s3_url
                              }]);
                              
                              setIsDirty(true);
                              debouncedSave();
                              
                              toast.success(`File uploaded: ${file.name}`);
                            } else {
                              toast.error('Cannot upload file: Action ID is missing');
                            }
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          document.getElementById('file-upload')?.click();
                        }}
                        disabled={isSaving || isUploading || uploadedFiles.length >= 3}
                      >
                        {isUploading ? 'Uploading...' : 'Upload File'}
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
                    <div className="mt-1 text-xs text-muted-foreground">
                      Maximum file size: 5MB per file
                    </div>
                  </div>
                </div>
              )}
            
            {/* No additional UI elements needed here as they're already in the payload configuration section */}
            </div>
          )}
          
          {/* Payload Configuration Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Payload Configuration</h3>
            {renderPayloadInputs()}
          </div>
          
          {payloadSchema &&
            typeof payloadSchema === "object" &&
            Object.keys(payloadSchema).length > 0 && (
              <div className="mt-auto pt-4 border-t dark:border-gray-700">
                {/* Push to bottom */}
                <GenerateActionResult
                  campaignId={campaignId} // Pass campaignId
                  actionId={selectedAction._id} // Pass current action ID
                  onGenerationStart={handleGenerationStart}
                  onGenerationStatusUpdate={handleStatusUpdate}
                  onGenerationComplete={handleGenerationComplete}
                  onGenerationError={handleGenerationError}
                  // No longer pass setShowActionResult
                />
              </div>
            )}
        </div>

        {/* Right Column: Result (Conditional) */}
        {showActionResultColumn && (
          <div className="flex h-full overflow-y-auto border-l dark:border-gray-700 pl-4 pb-2">
            {/* Use the updated ActionResult and pass state */}
            <ActionResult
              isLoading={isGeneratingSample}
              status={generationStatus}
              error={generationError}
              subject={generatedSubject}
              content={generatedContent}
              from_email={fromEmail}
              to_email={toEmail}
              campaignId={campaignId}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
