import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEmailSubject, unescapeLiteralSequences } from "@/lib/emailFormat";
import { sanitizeEmailText, sanitizeEmailSubject } from "@/lib/emailSanitize";
import { Badge } from "@/components/ui/badge";
import { Send, Eye, Copy, ArrowLeft, Pencil, X, Check, Loader2, RotateCcw, BookmarkPlus } from "lucide-react";
import TemplateEditorDialog from "@/components/templates/TemplateEditorDialog";
import { ApiAction } from "@/services/WorkflowService";
import {
  emailTemplateService,
  EmailTemplate,
  EmailTemplateUpdateRequest
} from "@/services/emailTemplateService";
import {
  emailEditorThreadService,
  EditorThreadMessage,
} from "@/services/emailEditorThreadService";
import ActionResult from "@/components/workflow/ActionResult";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  changes_made?: string;
}

type SaveStatus = "idle" | "saving" | "saved";

// The bot's opening line. Shown when there's no saved conversation yet.
const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  content:
    "Hi, I'm Jazon. Tell me how you'd like this email to read and I'll rewrite it, keeping everything we've changed so far. Try \"make it shorter\", \"remove the dashes\", or \"warmer opening line\".",
  isUser: false,
  timestamp: new Date(),
};

// Map the UI message shape to/from the persisted wire shape.
const toWire = (m: ChatMessage): EditorThreadMessage => ({
  id: m.id,
  role: m.isUser ? "user" : "assistant",
  content: m.content,
  changes_made: m.changes_made ?? null,
  created_at: m.timestamp instanceof Date ? m.timestamp.toISOString() : undefined,
});

const fromWire = (m: EditorThreadMessage): ChatMessage => ({
  id: m.id,
  content: m.content,
  isUser: m.role === "user",
  timestamp: m.created_at ? new Date(m.created_at) : new Date(),
  changes_made: m.changes_made ?? undefined,
});

/**
 * Build a specific confirmation of what Jazon actually changed, instead of a
 * generic "changes applied" line. Names the fields touched (subject / body) and
 * echoes the user's instruction so the reply reads like a real assistant.
 */
const describeChange = (
  prevSubject: string,
  nextSubject: string,
  prevBody: string,
  nextBody: string,
  instruction?: string
): string => {
  const fields: string[] = [];
  if (prevSubject !== nextSubject) fields.push("subject line");
  if (prevBody !== nextBody) fields.push("email body");
  const what = fields.length === 0 ? "email" : fields.join(" and ");

  // Clean the instruction so the echo reads naturally: drop placeholders,
  // collapse whitespace/newlines, trim trailing punctuation.
  const req = (instruction || "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!,]+$/, "");

  // Only echo a SHORT, single-clause instruction. Long pastes or multi-part
  // requests (periods, "and/then/also") would garble the sentence, so for
  // those we just confirm which fields changed.
  const isShortSingle =
    req.length > 0 && req.length <= 48 && !/[.\n]|\b(and|then|also|plus)\b/i.test(req);
  if (isShortSingle) {
    const lead = req.charAt(0).toLowerCase() + req.slice(1);
    return `Done — updated the ${what} to ${lead}.`;
  }
  return `Done — updated the ${what}.`;
};

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

// Query Keys
const queryKeys = {
  emailTemplate: (actionId: string) => ['emailTemplate', actionId] as const,
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Shows the existing text, then replaces it with the new text line by line:
 * the old copy crossfades out underneath while each new line fades and rises
 * into place, staggered. No scattered word highlights, no width animations, no
 * layout gaps — it simply reads as "the email is being rewritten". Honors
 * reduced-motion by snapping straight to the new text.
 */
const LineReplaceReveal = ({
  oldText,
  newText,
  singleLine = false,
  onComplete,
}: {
  oldText: string;
  newText: string;
  singleLine?: boolean;
  onComplete: () => void;
}) => {
  const reduced = prefersReducedMotion();
  const newLines = (newText || "").split("\n");

  // Timeline: brief hold on the old copy, then per-line reveal, then settle.
  const FADE_OUT = 0.32; // old copy exit (s)
  const START = 0.18; // when new lines start arriving (s)
  const PER_LINE = 0.05; // stagger between lines (s)
  const LINE_DUR = 0.3; // each line's entrance (s)

  useEffect(() => {
    if (reduced) {
      onComplete();
      return;
    }
    const totalMs = (START + newLines.length * PER_LINE + LINE_DUR + 0.2) * 1000;
    const t = setTimeout(onComplete, Math.min(totalMs, 4000));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oldText, newText]);

  const baseText = singleLine
    ? "text-lg font-medium text-gray-900"
    : "whitespace-pre-wrap text-gray-800 leading-relaxed text-[15px]";

  if (reduced) {
    return <div className={baseText}>{newText}</div>;
  }

  return (
    <div className="relative">
      {/* Old copy crossfades out underneath (exit faster than enter). */}
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${baseText} text-gray-300`}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: FADE_OUT, ease: "easeIn" }}
      >
        {oldText}
      </motion.div>

      {/* New copy reveals line by line. */}
      <div className={baseText}>
        {newLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: LINE_DUR, delay: START + i * PER_LINE, ease: "easeOut" }}
          >
            {line || " "}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function EmailTemplateEditor({ 
  selectedAction, 
  campaignId, 
  workflowId 
}: EmailTemplateEditorProps) {
  const queryClient = useQueryClient();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");

  // Conversation persistence state
  const [threadLoaded, setThreadLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest values captured for the page-unload save (refs avoid stale closures).
  const latestMessagesRef = useRef<ChatMessage[]>([WELCOME_MESSAGE]);
  const actionIdRef = useRef<string>(selectedAction._id);
  const campaignIdRef = useRef<string | undefined>(campaignId);
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

  // Direct manual-edit state (edit the template text yourself, no AI rewrite)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");

  // Save-as-template (to the reusable library)
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

          // Describe what actually changed (fields + the user's instruction).
          const summary = describeChange(
            context.previousTemplate.subject,
            result.updated_template.subject,
            context.previousTemplate.content,
            result.updated_template.content,
            variables.message
          );

          // Add assistant response message
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: summary,
            isUser: false,
            timestamp: new Date(),
            changes_made: summary,
          };

          setChatMessages(prev => [...prev, assistantMessage]);
          toast.success("Email updated");
          
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
        
        // No previous snapshot to diff — still confirm specifically using the
        // user's instruction rather than a generic line.
        const summary = describeChange("", "", "", "", variables.message);
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: summary,
          isUser: false,
          timestamp: new Date(),
          changes_made: summary,
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

  // Mutation for saving manual edits verbatim (no AI rewrite)
  const saveTemplateMutation = useMutation({
    mutationFn: (data: { subject: string; content: string }) =>
      emailTemplateService.saveEmailTemplate({
        action_id: selectedAction._id,
        campaign_id: campaignId,
        subject: data.subject,
        content: data.content,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData<EmailTemplate>(
        queryKeys.emailTemplate(selectedAction._id),
        saved
      );
      setIsEditMode(false);
      toast.success("Changes saved");
    },
    onError: (err) => {
      console.error("Error saving template edits:", err);
      toast.error("Failed to save changes");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplate(selectedAction._id) });
    },
  });

  const handleEnterEditMode = () => {
    if (!emailTemplate) return;
    if (isPreviewMode) handleBackToTemplate();
    setEditSubject(formatEmailSubject(emailTemplate.subject));
    setEditContent(unescapeLiteralSequences(emailTemplate.content));
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = () => {
    saveTemplateMutation.mutate({ subject: editSubject, content: editContent });
  };

  // Render a faithful preview of the email the user actually edited — the same
  // subject and body shown in the template view, formatted as it lands in an
  // inbox. This does NOT call run_sample (which re-generates a brand-new AI
  // email per prospect and appends a backend signature); previewing must show
  // what was written, not a different email.
  const handleGeneratePreview = () => {
    if (!emailTemplate) {
      toast.error("Email template is not loaded yet");
      return;
    }

    setPreviewError(null);
    setPreviewStatus(null);
    setIsGeneratingPreview(false);
    setPreviewData({
      subject: sanitizeEmailSubject(formatEmailSubject(emailTemplate.subject)),
      content: sanitizeEmailText(unescapeLiteralSequences(emailTemplate.content)),
    });
    setIsPreviewMode(true);
  };

  const handleBackToTemplate = () => {
    setIsPreviewMode(false);
    setPreviewData(null);
    setPreviewError(null);
    setPreviewStatus(null);
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

  // Load the saved conversation for this action (restore where the user left
  // off). Runs whenever the action changes; resets to the welcome line if the
  // user has never chatted about this step.
  useEffect(() => {
    let cancelled = false;
    // Before switching, flush the PREVIOUS action's thread (refs still hold it
    // at this point) so a pending debounce isn't lost when the timer is cleared.
    const prevMsgs = latestMessagesRef.current;
    const prevIsOnlyWelcome =
      prevMsgs.length === 1 && prevMsgs[0].id === "welcome";
    if (actionIdRef.current !== selectedAction._id && !prevIsOnlyWelcome) {
      emailEditorThreadService.saveThreadOnUnload(
        actionIdRef.current,
        campaignIdRef.current,
        prevMsgs.map(toWire)
      );
    }
    setThreadLoaded(false);
    setSaveStatus("idle");
    emailEditorThreadService.getThread(selectedAction._id).then((thread) => {
      if (cancelled) return;
      const restored = (thread.messages || []).map(fromWire);
      setChatMessages(restored.length ? restored : [WELCOME_MESSAGE]);
      setThreadLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedAction._id]);

  // Keep refs in sync for the unload handler (which can't read live state).
  useEffect(() => {
    latestMessagesRef.current = chatMessages;
    actionIdRef.current = selectedAction._id;
    campaignIdRef.current = campaignId;
  }, [chatMessages, selectedAction._id, campaignId]);

  // Debounced auto-save whenever the conversation changes (after load, so we
  // never overwrite a real thread with the placeholder welcome).
  useEffect(() => {
    if (!threadLoaded) return;
    const isOnlyWelcome =
      chatMessages.length === 1 && chatMessages[0].id === "welcome";
    if (isOnlyWelcome) return;

    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await emailEditorThreadService.saveThread(
        selectedAction._id,
        campaignId,
        chatMessages.map(toWire)
      );
      setSaveStatus("saved");
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [chatMessages, threadLoaded, selectedAction._id, campaignId]);

  // Save on page leave (tab close / refresh / navigate away) and on unmount,
  // so nothing is lost even if the debounce hasn't fired yet.
  useEffect(() => {
    const flush = () => {
      const msgs = latestMessagesRef.current;
      const isOnlyWelcome = msgs.length === 1 && msgs[0].id === "welcome";
      if (isOnlyWelcome) return;
      emailEditorThreadService.saveThreadOnUnload(
        actionIdRef.current,
        campaignIdRef.current,
        msgs.map(toWire)
      );
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush(); // unmount (e.g. switching action / leaving the editor)
    };
  }, []);

  // Close preview when action changes (user switches to different action)
  useEffect(() => {
    if (isPreviewMode) {
      handleBackToTemplate();
    }
    // Reset retry + edit state when switching actions
    setRetryCount(0);
    setLastRequest(null);
    setIsEditMode(false);
  }, [selectedAction._id]); // Watch for action ID changes

  // Quick suggestions surfaced as chips (the things people actually ask for).
  const quickSuggestions = [
    "Remove the dashes",
    "Make it sound less AI-generated",
    "Shorten it",
    "Warmer opening line",
  ];

  const sendInstruction = (rawText: string) => {
    const text = rawText.trim();
    if (!text || updateTemplateMutation.isPending || isEditMode || !emailTemplate) return;

    // Close preview mode when user starts chatting
    if (isPreviewMode) {
      handleBackToTemplate();
    }

    const updateRequest: EmailTemplateUpdateRequest = {
      action_id: selectedAction._id,
      campaign_id: campaignId!,
      subject: emailTemplate.subject,
      content: emailTemplate.content,
      message: text,
      // Send the conversation so far (minus the welcome line) so the bot
      // remembers every prior instruction before it rewrites.
      history: chatMessages.filter((m) => m.id !== "welcome").map(toWire),
    };

    setRetryCount(0);
    setLastRequest(updateRequest);
    setInputValue("");
    updateTemplateMutation.mutate(updateRequest);
  };

  const handleSendMessage = () => sendInstruction(inputValue);

  const handleQuickSuggestionClick = (suggestion: string) => {
    sendInstruction(suggestion);
  };

  const handleClearChat = () => {
    setChatMessages([WELCOME_MESSAGE]);
    setSaveStatus("saving");
    // Persist the cleared state so it stays cleared after refresh.
    emailEditorThreadService
      .saveThread(selectedAction._id, campaignId, [])
      .then(() => setSaveStatus("saved"));
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
      const subject = sanitizeEmailSubject(formatEmailSubject(emailTemplate.subject));
      const content = sanitizeEmailText(unescapeLiteralSequences(emailTemplate.content));
      const templateText = `Subject: ${subject}\n\n${content}`;
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
      <div className="flex h-full flex-col gap-4 bg-white p-6" role="status" aria-label="Loading email template">
        <Skeleton className="h-9 w-2/5" />
        <Skeleton className="h-10 w-full" />
        <div className="flex-1 space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
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
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-gray-900">{selectedAction.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Step #{selectedAction._id.slice(-11)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 [&_button]:whitespace-nowrap">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saveTemplateMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                  onClick={handleSaveEdit}
                  disabled={saveTemplateMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {saveTemplateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                {isPreviewMode && (
                  <Button variant="outline" size="sm" onClick={handleBackToTemplate}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Template
                  </Button>
                )}
                {!isPreviewMode && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEnterEditMode}
                      disabled={diffState.isAnimating}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGeneratePreview}
                      disabled={isGeneratingPreview || diffState.isAnimating}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {isGeneratingPreview ? "Generating..." : "Preview"}
                    </Button>
                  </>
                )}
                {!isPreviewMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveAsTemplateOpen(true)}
                    disabled={diffState.isAnimating || !emailTemplate}
                    title="Save this email to your reusable template library"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Save as template
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleCopyTemplate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Email Template Content or Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditMode ? (
            <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <label className="block text-sm text-gray-600 mb-1" htmlFor="edit-subject">
                  Subject:
                </label>
                <Input
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full text-lg font-medium text-gray-900"
                  placeholder="Email subject"
                />
              </div>
              <div className="p-6">
                <label className="block text-sm text-gray-600 mb-2" htmlFor="edit-content">
                  Body:
                </label>
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[320px] text-gray-800 leading-relaxed font-sans"
                  style={{ fontSize: "15px" }}
                  placeholder="Write your email here. Use {{firstName}} and [Company Name] for personalization."
                />
                <p className="mt-3 text-xs text-gray-500">
                  Your edits are saved exactly as written (we only strip AI-slop like
                  long dashes and stray markdown). Placeholders such as{" "}
                  <code>{"{{firstName}}"}</code> are preserved.
                </p>
              </div>
            </div>
          ) : isPreviewMode ? (
            <ActionResult
              title="Preview"
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
                        <LineReplaceReveal
                          singleLine
                          oldText={sanitizeEmailSubject(formatEmailSubject(diffState.oldTemplate!.subject))}
                          newText={sanitizeEmailSubject(formatEmailSubject(diffState.newTemplate!.subject))}
                          onComplete={hasContentChanges ? () => {} : handleDiffComplete}
                        />
                      ) : (
                        <div className="text-lg font-medium text-gray-900">
                          {sanitizeEmailSubject(formatEmailSubject(emailTemplate.subject))}
                        </div>
                      )}
                    </div>

                    {/* Email Content - either diff or normal */}
                    <div className="p-6">
                      {hasContentChanges ? (
                        <LineReplaceReveal
                          oldText={sanitizeEmailText(unescapeLiteralSequences(diffState.oldTemplate!.content))}
                          newText={sanitizeEmailText(unescapeLiteralSequences(diffState.newTemplate!.content))}
                          onComplete={handleDiffComplete}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed" style={{ fontSize: '15px' }}>
                          {sanitizeEmailText(unescapeLiteralSequences(emailTemplate.content))}
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

      {/* Right Side - Jazon assistant */}
      <div className="w-80 flex flex-col bg-white border-l border-gray-200">
        {/* Assistant header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
                <img src="/jazon-mark.svg" alt="" className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="leading-tight">
              <h3 className="text-sm font-semibold text-gray-900">Jazon</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" /> All changes saved
                  </>
                ) : (
                  "Email assistant"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            title="Clear conversation"
            className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-md hover:bg-gray-100"
            disabled={updateTemplateMutation.isPending}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-zinc-50/60">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  message.isUser
                    ? "bg-purple-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm"
                }`}
              >
                {message.content}
              </div>
              <span className="mt-1 px-1 text-[11px] text-gray-400">
                {message.isUser ? formatTime(message.timestamp) : "Jazon"}
              </span>
            </div>
          ))}

          {updateTemplateMutation.isPending && (
            <div className="flex flex-col items-start">
              <div className="bg-white border border-gray-200 shadow-sm px-3.5 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                </div>
              </div>
              <span className="mt-1 px-1 text-[11px] text-gray-400">Jazon is editing…</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200 p-3 bg-white">
          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleQuickSuggestionClick(suggestion)}
                disabled={updateTemplateMutation.isPending || diffState.isAnimating || isEditMode}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input pill */}
          <div className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-white py-1.5 pl-3.5 pr-1.5 transition-colors focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              placeholder={isEditMode ? "Finish your manual edit first…" : "Ask Jazon to change this email…"}
              disabled={updateTemplateMutation.isPending || diffState.isAnimating || isEditMode}
              className="min-w-0 flex-1 resize-none self-center border-0 bg-transparent p-0 text-sm leading-6 placeholder-gray-400 shadow-none focus-visible:ring-0 min-h-[24px] max-h-32"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || updateTemplateMutation.isPending || diffState.isAnimating || isEditMode}
              size="icon"
              aria-label="Send"
              className="ml-auto h-9 w-9 shrink-0 self-center rounded-full bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 grid place-items-center"
            >
              <Send className="h-4 w-4 -translate-x-px" />
            </Button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-gray-400">
            Jazon remembers this conversation, even after you leave. Enter to send, Shift+Enter for a new line.
          </p>
        </div>
      </div>

      {/* Save the current email to the reusable template library */}
      <TemplateEditorDialog
        open={saveAsTemplateOpen}
        onOpenChange={setSaveAsTemplateOpen}
        initial={
          emailTemplate
            ? {
                name: selectedAction.name || "Saved email",
                subject: formatEmailSubject(emailTemplate.subject),
                body: unescapeLiteralSequences(emailTemplate.content),
              }
            : undefined
        }
        onSaved={() => toast.success("Saved to your template library")}
      />
    </div>
  );
}