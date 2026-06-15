import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Zap } from "lucide-react";
import { workflowChatService } from "@/services/workflowChatService";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  actionCreated?: string; // For showing "Action created: {name}" indicator
  /** Reveal letter-by-letter when first rendered (assistant messages). */
  animate?: boolean;
  /** Delay before the reveal starts — used to stagger the intro messages. */
  delayMs?: number;
}

interface WorkflowChatProps {
  campaignId?: string;
  workflowId?: string;
  onWorkflowUpdate?: () => void; // Callback to refresh workflow data after API call
  isEditingMode?: boolean; // Whether we're in editing mode (has actions but no selection)
  onSelectAction?: (actionId: string) => void; // Callback to select an action when closing edit mode
  actions?: any[]; // Available actions to select from
  previousSelectedActionId?: string | null; // Previously selected action to return to
}

// Fast reveal: 2 chars every 12ms ≈ 165 chars/s — quick enough to feel
// responsive, slow enough to read along.
const TYPE_CHUNK = 2;
const TYPE_INTERVAL_MS = 12;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function TypewriterText({
  text,
  delayMs = 0,
  onTick,
  onDone,
}: {
  text: string;
  delayMs?: number;
  onTick?: () => void;
  onDone?: () => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const done = visibleCount >= text.length;

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisibleCount(text.length);
      onDone?.();
      return;
    }
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        i = Math.min(text.length, i + TYPE_CHUNK);
        setVisibleCount(i);
        onTick?.();
        if (i >= text.length) {
          clearInterval(interval);
          onDone?.();
        }
      }, TYPE_INTERVAL_MS);
    }, delayMs);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delayMs]);

  return (
    <p className="text-sm whitespace-pre-wrap">
      {text.slice(0, visibleCount)}
      {!done && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse rounded-full bg-purple-500"
        />
      )}
    </p>
  );
}

const JazonChip = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
  <div
    className={`flex shrink-0 items-center justify-center rounded-lg bg-ink ${
      size === "lg" ? "h-10 w-10" : "h-6 w-6 rounded-full"
    }`}
  >
    <img
      src="/jazon-mark.svg"
      alt=""
      className={size === "lg" ? "h-5 w-5" : "h-3 w-3"}
    />
  </div>
);

export default function WorkflowChat({ campaignId, workflowId, onWorkflowUpdate, isEditingMode, onSelectAction, actions, previousSelectedActionId }: WorkflowChatProps) {
  // Dynamic initial messages based on mode. The intro types itself out,
  // second bubble starting just after the first finishes.
  const getInitialMessages = (): ChatMessage[] => {
    if (isEditingMode) {
      return [
        {
          id: "1",
          content: "You can edit this workflow using natural language. For example: 'Add a follow-up email after 3 days' or 'Change the second email timing to 1 week'",
          isUser: false,
          timestamp: new Date(),
          animate: true,
        }
      ];
    }

    return [
      {
        id: "1",
        content: "Hello! I'm Jazon. I can help you create email sequences and workflow steps using natural language. Just tell me what you want to achieve!",
        isUser: false,
        timestamp: new Date(),
        animate: true,
      },
      {
        id: "2",
        content: "For example, you can say: 'Create a welcome email that goes out immediately when someone signs up' or 'Add a follow-up email about our new product launch after 3 days'",
        isUser: false,
        timestamp: new Date(),
        animate: true,
        delayMs: 250, // small breath after the first bubble finishes
      }
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages());
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Messages whose reveal has finished. State (not a ref) so completing one
  // message re-renders and lets the next bubble appear.
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Show messages one by one: everything up to (and including) the first
  // still-typing assistant message; later bubbles stay hidden until it's done.
  const firstPendingIndex = messages.findIndex(
    (m) => m.animate && !m.isUser && !revealedIds.has(m.id)
  );
  const visibleMessages =
    firstPendingIndex === -1 ? messages : messages.slice(0, firstPendingIndex + 1);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Update messages when editing mode changes
  useEffect(() => {
    setRevealedIds(new Set());
    setMessages(getInitialMessages());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send chat message to backend API
  const sendChatMessage = async (message: string): Promise<{ response: string; actionCreated?: string }> => {
    const result = await workflowChatService.sendChatMessage({
      message,
      workflow_id: workflowId,
    });
    onWorkflowUpdate()

    return {
      response: result.response,
      actionCreated: result.actionCreated,
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(userMessage.content);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: result.response,
        isUser: false,
        timestamp: new Date(),
        actionCreated: result.actionCreated,
        animate: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, something went wrong on our end. Please try again.",
        isUser: false,
        timestamp: new Date(),
        animate: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <JazonChip size="lg" />
          <div>
            <h2 className="font-display text-lg font-medium text-zinc-900">Jazon</h2>
            <p className="text-sm text-zinc-500">
              {isEditingMode
                ? "Edit your workflow using natural language"
                : "Describe your email workflow in natural language"
              }
            </p>
          </div>
        </div>
        {isEditingMode && onSelectAction && actions && actions.length > 0 && (
          <button
            onClick={() => {
              // Return to previously selected action, or first action if none was selected
              const actionIdToSelect = previousSelectedActionId && actions.find(a => a._id === previousSelectedActionId)
                ? previousSelectedActionId
                : actions[0]._id;
              onSelectAction(actionIdToSelect);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
            Close
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${message.isUser ? 'order-2' : 'order-1'}`}>
              {!message.isUser && (
                <div className="flex items-center gap-2 mb-1">
                  <JazonChip />
                  <span className="text-xs text-zinc-500">{formatTime(message.timestamp)}</span>
                </div>
              )}
              <div
                className={`p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-purple-600 text-white ml-auto'
                    : 'bg-zinc-100 text-zinc-900'
                }`}
              >
                {message.animate && !revealedIds.has(message.id) ? (
                  <TypewriterText
                    text={message.content}
                    delayMs={message.delayMs}
                    onTick={() => scrollToBottom("auto")}
                    onDone={() =>
                      setRevealedIds((prev) => new Set(prev).add(message.id))
                    }
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                {message.actionCreated && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
                    <Zap className="h-3.5 w-3.5 text-purple-600" strokeWidth={1.75} />
                    <span>Action created:</span>
                    <span className="font-medium text-zinc-900">{message.actionCreated}</span>
                  </div>
                )}
              </div>
              {message.isUser && (
                <div className="text-xs text-zinc-500 text-right mt-1">
                  {formatTime(message.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%]">
              <div className="flex items-center gap-2 mb-1">
                <JazonChip />
                <span className="text-xs text-zinc-500">Writing…</span>
              </div>
              <div className="bg-zinc-100 p-3 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the email step you want to create..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-purple-600 hover:bg-purple-500"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
