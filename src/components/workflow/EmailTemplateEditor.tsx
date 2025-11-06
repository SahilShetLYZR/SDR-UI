import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import * as Diff from "diff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Eye, Copy, Save, ArrowLeft } from "lucide-react";
import { ApiAction } from "@/services/WorkflowService";
import { 
  emailTemplateService, 
  EmailTemplate,
  EmailTemplateUpdateRequest 
} from "@/services/emailTemplateService";
import { ProspectsService } from "@/services/prospectsService";
import { ActionApiService } from "@/services/ActionApiService";
import { CampaignMailService } from "@/services/CampaignMailService";
import ActionResult from "@/components/workflow/ActionResult";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  changes_made?: string;
}

interface EmailTemplateEditorProps {
  selectedAction: ApiAction;
  campaignId?: string;
  workflowId?: string;
}

interface DiffState {
  isAnimating: boolean;
  oldTemplate: EmailTemplate | null;
  newTemplate: EmailTemplate | null;
  showingDiff: boolean;
}

interface DiffChunk {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  index: number;
}

// Query Keys
const queryKeys = {
  emailTemplate: (actionId: string) => ['emailTemplate', actionId] as const,
};

// Animation components for diff display
const AnimatedText = ({ chunk, delay }: { chunk: DiffChunk; delay: number }) => {
  if (chunk.type === 'unchanged') {
    return <span className="text-gray-600">{chunk.value}</span>;
  }

  if (chunk.type === 'removed') {
    return (
      <motion.span
        initial={{ opacity: 1, backgroundColor: 'rgb(254, 202, 202)' }}
        animate={{ opacity: 0, backgroundColor: 'rgb(239, 68, 68)' }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, delay }}
        className="line-through text-red-600 px-1 rounded"
      >
        {chunk.value}
      </motion.span>
    );
  }

  if (chunk.type === 'added') {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, backgroundColor: 'rgb(187, 247, 208)' }}
        transition={{ 
          opacity: { duration: 0.1, delay: delay + 1.2 },
          backgroundColor: { duration: 0.5, delay: delay + 1.2 }
        }}
        className="text-green-600 px-1 rounded font-medium"
      >
        <motion.span
          initial={{ width: 0, display: 'inline-block', overflow: 'hidden' }}
          animate={{ width: 'auto' }}
          transition={{ duration: 0.6, delay: delay + 1.3 }}
        >
          {chunk.value}
        </motion.span>
      </motion.span>
    );
  }

  return null;
};

const DiffDisplay = ({ 
  title, 
  oldText, 
  newText, 
  onComplete 
}: { 
  title: string; 
  oldText: string; 
  newText: string; 
  onComplete: () => void;
}) => {
  const [chunks, setChunks] = useState<DiffChunk[]>([]);

  useEffect(() => {
    const diff = Diff.diffWords(oldText, newText);
    const processedChunks: DiffChunk[] = diff.map((part, index) => ({
      type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
      value: part.value,
      index
    }));
    setChunks(processedChunks);

    // Auto-complete animation after 3 seconds
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [oldText, newText, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg"
    >
      <div className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"
        />
        {title}
      </div>
      <div className="text-gray-800 leading-relaxed" style={{ fontSize: '15px' }}>
        <AnimatePresence mode="wait">
          {chunks.map((chunk, index) => (
            <AnimatedText 
              key={`${chunk.type}-${index}`} 
              chunk={chunk} 
              delay={index * 0.1}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function EmailTemplateEditor({ 
  selectedAction, 
  campaignId, 
  workflowId 
}: EmailTemplateEditorProps) {
  const queryClient = useQueryClient();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "I've generated a new email step template for you! You can customize any part of this email by simply telling me what you'd like to change. For example: \"Make the subject line more engaging\" or \"Add a call-to-action button\".",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [diffState, setDiffState] = useState<DiffState>({
    isAnimating: false,
    oldTemplate: null,
    newTemplate: null,
    showingDiff: false,
  });
  
  // Preview functionality state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    subject: string;
    content: string;
    from_email?: string;
    to_email?: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<string | null>(null);
  
  // Retry functionality state
  const [retryCount, setRetryCount] = useState(0);
  const [lastRequest, setLastRequest] = useState<EmailTemplateUpdateRequest | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Query for fetching email template
  const {
    data: emailTemplate,
    isLoading,
    error,
    refetch: refetchTemplate,
  } = useQuery<EmailTemplate, Error>({
    queryKey: queryKeys.emailTemplate(selectedAction._id),
    queryFn: () => emailTemplateService.getEmailTemplate(selectedAction._id),
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2,
  });

  // Mutation for updating email template
  const updateTemplateMutation = useMutation({
    mutationFn: (updateRequest: EmailTemplateUpdateRequest) => 
      emailTemplateService.updateEmailTemplate(updateRequest),
    onMutate: async (updateRequest) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.emailTemplate(selectedAction._id) });

      // Store current template for diffing
      const currentTemplate = queryClient.getQueryData<EmailTemplate>(queryKeys.emailTemplate(selectedAction._id));
      
      // Add user message immediately for optimistic UI
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: updateRequest.message,
        isUser: true,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, userMessage]);

      return { previousTemplate: currentTemplate };
    },
    onSuccess: (result, variables, context) => {
      const maxRetries = 2; // Maximum number of retries
      
      // Start diff animation if we have both old and new templates
      if (context?.previousTemplate && result.updated_template) {
        const hasSubjectChanges = context.previousTemplate.subject !== result.updated_template.subject;
        const hasContentChanges = context.previousTemplate.content !== result.updated_template.content;
        
        // Check if there are actual changes
        if (hasSubjectChanges || hasContentChanges) {
          // Changes detected - proceed normally
          setDiffState({
            isAnimating: true,
            oldTemplate: context.previousTemplate,
            newTemplate: result.updated_template,
            showingDiff: true,
          });
          
          // Reset retry count on successful change
          setRetryCount(0);
          
          // Add assistant response message
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: result.changes_made,
            isUser: false,
            timestamp: new Date(),
            changes_made: result.changes_made,
          };

          setChatMessages(prev => [...prev, assistantMessage]);
          toast.success("Email template updated successfully");
          
        } else {
          // No changes detected - check if we should retry
          if (retryCount < maxRetries && lastRequest) {
            // Retry with the same request
            setRetryCount(prev => prev + 1);
            
            // Add retry message to chat
            const retryMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: `No changes were made. Retrying your request... (Attempt ${retryCount + 2}/${maxRetries + 1})`,
              isUser: false,
              timestamp: new Date(),
            };
            
            setChatMessages(prev => [...prev, retryMessage]);
            
            // Retry the mutation after a short delay
            setTimeout(() => {
              updateTemplateMutation.mutate(lastRequest);
            }, 1000);
            
          } else {
            // Max retries reached or no request to retry
            setDiffState({
              isAnimating: false,
              oldTemplate: null,
              newTemplate: null,
              showingDiff: false,
            });
            
            const noChangesMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: retryCount >= maxRetries 
                ? "I wasn't able to make the requested changes after several attempts. Could you try rephrasing your request with more specific instructions?"
                : "No changes were made to the template. The current content might already match your request.",
              isUser: false,
              timestamp: new Date(),
            };

            setChatMessages(prev => [...prev, noChangesMessage]);
            setRetryCount(0); // Reset for future requests
          }
        }
      } else {
        // No templates to compare, ensure diff state is reset
        setDiffState({
          isAnimating: false,
          oldTemplate: null,
          newTemplate: null,
          showingDiff: false,
        });
        
        // Add assistant response message
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: result.changes_made,
          isUser: false,
          timestamp: new Date(),
          changes_made: result.changes_made,
        };

        setChatMessages(prev => [...prev, assistantMessage]);
        toast.success("Email template updated successfully");
      }

      // Update the email template cache with the new data
      queryClient.setQueryData<EmailTemplate>(
        queryKeys.emailTemplate(selectedAction._id), 
        result.updated_template
      );
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update if needed
      if (context?.previousTemplate) {
        queryClient.setQueryData(
          queryKeys.emailTemplate(selectedAction._id), 
          context.previousTemplate
        );
      }

      // Reset diff state on error to ensure input is not stuck disabled
      setDiffState({
        isAnimating: false,
        oldTemplate: null,
        newTemplate: null,
        showingDiff: false,
      });

      // Reset retry count on error
      setRetryCount(0);

      console.error("Error updating email template:", error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while updating the template. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to update email template");
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplate(selectedAction._id) });
    },
  });

  // Preview generation functions
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const pollActionResult = (resultId: string) => {
    stopPolling(); // Clear any previous interval
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes with 2-second intervals

    pollingIntervalRef.current = setInterval(async () => {
      attempts += 1;
      if (attempts > maxAttempts) {
        stopPolling();
        setPreviewError("Preview generation timed out. Please try again.");
        setIsGeneratingPreview(false);
        return;
      }

      try {
        const result = await CampaignMailService.getActionResult(resultId);

        // Update status text
        if (result.action_status?.status_text) {
          setPreviewStatus(result.action_status.status_text);
        }

        // Check for backend error
        if (result.action_status?.error_text) {
          stopPolling();
          setPreviewError(result.action_status.error_text);
          setIsGeneratingPreview(false);
          return;
        }

        // Check if content is filled (success condition)
        if (result.subject && result.content) {
          stopPolling();
          setPreviewData({
            subject: result.subject,
            content: result.content,
            from_email: result.from_email,
            to_email: result.to_email,
          });
          setIsGeneratingPreview(false);
          setPreviewStatus(null);
        }
      } catch (error: any) {
        if (error?.response?.status !== 404 || attempts > 5) {
          console.error("Polling error:", error);
          stopPolling();
          setPreviewError("Failed to check preview generation status.");
          setIsGeneratingPreview(false);
        } else {
          setPreviewStatus("Waiting for generation process to start...");
        }
      }
    }, 2000);
  };

  const handleGeneratePreview = async () => {
    if (!campaignId || !selectedAction._id) {
      toast.error("Missing campaign or action information");
      return;
    }

    setIsGeneratingPreview(true);
    setPreviewError(null);
    setPreviewStatus("Loading prospects...");

    try {
      // Get prospects for the campaign
      const prospectsData = await ProspectsService.getCampaignProspects(campaignId, 1, 1);
      const prospects = prospectsData.prospects || [];

      if (prospects.length === 0) {
        toast.error("No prospects found for this campaign. Please add prospects first.");
        setIsGeneratingPreview(false);
        return;
      }

      // Use the first prospect
      const firstProspect = prospects[0];
      setPreviewStatus("Generating preview...");

      // Call run_sample API
      const response = await ActionApiService.runSampleAction(
        campaignId,
        firstProspect.id,
        selectedAction._id
      );

      // Start polling for results
      setPreviewStatus("Processing...");
      pollActionResult(response.action_result_id);
      setIsPreviewMode(true);

    } catch (error: any) {
      console.error("Failed to generate preview:", error);
      const errorMsg = error?.response?.data?.detail || "Failed to generate preview. Please try again.";
      setPreviewError(errorMsg);
      setIsGeneratingPreview(false);
      toast.error(errorMsg);
    }
  };

  const handleBackToTemplate = () => {
    setIsPreviewMode(false);
    setPreviewData(null);
    setPreviewError(null);
    setPreviewStatus(null);
    stopPolling();
  };

  // Handle diff animation completion
  const handleDiffComplete = () => {
    setDiffState(prev => ({
      ...prev,
      isAnimating: false,
      showingDiff: false,
      oldTemplate: null,
      newTemplate: null,
    }));
  };

  // Handle query errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching email template:", error);
      toast.error("Failed to load email template");
    }
  }, [error]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Close preview when action changes (user switches to different action)
  useEffect(() => {
    if (isPreviewMode) {
      handleBackToTemplate();
    }
    // Reset retry state when switching actions
    setRetryCount(0);
    setLastRequest(null);
  }, [selectedAction._id]); // Watch for action ID changes

  // Generate quick suggestions based on email content
  const quickSuggestions = [
    "Make the subject line more engaging",
    "Add a stronger call-to-action"
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || updateTemplateMutation.isPending || !emailTemplate) return;

    // Close preview mode when user starts chatting
    if (isPreviewMode) {
      handleBackToTemplate();
    }

    const updateRequest: EmailTemplateUpdateRequest = {
      action_id: selectedAction._id,
      campaign_id: campaignId!,
      subject: emailTemplate.subject,
      content: emailTemplate.content,
      message: inputValue.trim(),
    };

    // Reset retry count for new requests
    setRetryCount(0);
    setLastRequest(updateRequest);

    // Clear input immediately
    setInputValue("");

    // Execute mutation
    updateTemplateMutation.mutate(updateRequest);
  };

  const handleQuickSuggestionClick = (suggestion: string) => {
    // Reset retry state when using quick suggestions
    setRetryCount(0);
    setLastRequest(null);
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopyTemplate = () => {
    if (emailTemplate) {
      const templateText = `Subject: ${emailTemplate.subject}\n\n${emailTemplate.content}`;
      navigator.clipboard.writeText(templateText);
      toast.success("Template copied to clipboard");
    }
  };

  const handleSaveTemplate = () => {
    // Trigger a manual refetch to ensure we have the latest data
    refetchTemplate();
    toast.success("Template synchronized with server");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <div className="text-lg font-semibold text-gray-700">Loading email template...</div>
        </div>
      </div>
    );
  }

  if (error || !emailTemplate) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-gray-900">Could not load email template</div>
          <div className="text-sm text-gray-500 mt-2">Please try refreshing the page</div>
          <Button 
            onClick={() => refetchTemplate()} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white">
      {/* Left Side - Email Template Preview */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{selectedAction.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Step #{selectedAction._id.slice(-11)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPreviewMode && (
              <Button variant="outline" size="sm" onClick={handleBackToTemplate}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Template
              </Button>
            )}
            {!isPreviewMode && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGeneratePreview}
                disabled={isGeneratingPreview || diffState.isAnimating}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isGeneratingPreview ? "Generating..." : "Preview"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopyTemplate}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>

        {/* Email Template Content or Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {isPreviewMode ? (
            <ActionResult
              isLoading={isGeneratingPreview}
              status={previewStatus}
              error={previewError}
              subject={previewData?.subject || null}
              content={previewData?.content || null}
              from_email={previewData?.from_email}
              to_email={previewData?.to_email}
              campaignId={campaignId}
            />
          ) : (
            <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg">
              {(() => {
                const hasSubjectChanges = diffState.showingDiff && diffState.oldTemplate && diffState.newTemplate && 
                                         diffState.oldTemplate.subject !== diffState.newTemplate.subject;
                const hasContentChanges = diffState.showingDiff && diffState.oldTemplate && diffState.newTemplate && 
                                         diffState.oldTemplate.content !== diffState.newTemplate.content;
                
                return (
                  <>
                    {/* Email Subject - either diff or normal */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="text-sm text-gray-600 mb-1">Subject:</div>
                      {hasSubjectChanges ? (
                        <DiffDisplay
                          title=""
                          oldText={diffState.oldTemplate!.subject}
                          newText={diffState.newTemplate!.subject}
                          onComplete={hasContentChanges ? () => {} : handleDiffComplete}
                        />
                      ) : (
                        <div className="text-lg font-medium text-gray-900">
                          {emailTemplate.subject}
                        </div>
                      )}
                    </div>

                    {/* Email Content - either diff or normal */}
                    <div className="p-6">
                      {hasContentChanges ? (
                        <DiffDisplay
                          title=""
                          oldText={diffState.oldTemplate!.content}
                          newText={diffState.newTemplate!.content}
                          onComplete={handleDiffComplete}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed" style={{ fontSize: '15px' }}>
                          {emailTemplate.content}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Email Editor Chat */}
      <div className="w-80 flex flex-col bg-white border-l border-gray-200">
        {/* Chat Header */}
        <div className="px-4 py-4 bg-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">✨</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">Email Editor</h3>
              <p className="text-purple-100 text-xs">Customize with AI assistance</p>
            </div>
          </div>
          <button className="text-white hover:text-purple-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
          {chatMessages.map((message) => (
            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${message.isUser ? 'order-2' : 'order-1'}`}>
                {!message.isUser && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                  </div>
                )}
                <div
                  className={`px-4 py-3 text-sm leading-relaxed ${message.isUser
                    ? 'bg-purple-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md'
                  }`}
                >
                  {message.content}
                </div>
                {message.isUser && (
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {updateTemplateMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
            <div className="space-y-2">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="flex items-center gap-2 w-full px-0 py-1 text-left hover:bg-gray-50 transition-colors rounded"
                  onClick={() => handleQuickSuggestionClick(suggestion)}
                  disabled={updateTemplateMutation.isPending || diffState.isAnimating}
                >
                  <span className="text-purple-600 text-sm">✨</span>
                  <span className="text-gray-900 text-sm font-medium">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="space-y-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="How would you like to modify this email?"
              disabled={updateTemplateMutation.isPending || diffState.isAnimating}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Press Enter to send</p>
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || updateTemplateMutation.isPending || diffState.isAnimating}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 