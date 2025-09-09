import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { workflowChatService } from "@/services/workflowChatService";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  actionCreated?: string; // For showing "Action Created: {name}" indicator
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

export default function WorkflowChat({ campaignId, workflowId, onWorkflowUpdate, isEditingMode, onSelectAction, actions, previousSelectedActionId }: WorkflowChatProps) {
  // Dynamic initial messages based on mode
  const getInitialMessages = (): ChatMessage[] => {
    if (isEditingMode) {
      return [
        {
          id: "1",
          content: "You can edit this workflow using natural language. For example: 'Add a follow-up email after 3 days' or 'Change the second email timing to 1 week'",
          isUser: false,
          timestamp: new Date(),
        }
      ];
    }
    
    return [
      {
        id: "1",
        content: "Hello! I'm your SDR automation assistant. I can help you create email sequences and workflow steps using natural language. Just tell me what you want to achieve!",
        isUser: false,
        timestamp: new Date(),
      },
      {
        id: "2", 
        content: "For example, you can say: 'Create a welcome email that goes out immediately when someone signs up' or 'Add a follow-up email about our new product launch after 3 days'",
        isUser: false,
        timestamp: new Date(),
      }
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages());
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Update messages when editing mode changes
  useEffect(() => {
    if (isEditingMode) {
      setMessages([
        {
          id: "1",
          content: "You can edit this workflow using natural language. For example: 'Add a follow-up email after 3 days' or 'Change the second email timing to 1 week'",
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    } else {
      setMessages([
        {
          id: "1",
          content: "Hello! I'm your SDR automation assistant. I can help you create email sequences and workflow steps using natural language. Just tell me what you want to achieve!",
          isUser: false,
          timestamp: new Date(),
        },
        {
          id: "2", 
          content: "For example, you can say: 'Create a welcome email that goes out immediately when someone signs up' or 'Add a follow-up email about our new product launch after 3 days'",
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    }
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
      // Call the chat API (placeholder for now)
      const result = await sendChatMessage(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: result.response,
        isUser: false,
        timestamp: new Date(),
        actionCreated: result.actionCreated,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Call the callback to refresh workflow data if needed
      // if (onWorkflowUpdate) {
      //   onWorkflowUpdate();
      // }
    } catch (error) {
      console.error("Error sending chat message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
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
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">AI</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg">SDR Automation Assistant</h2>
            <p className="text-sm text-gray-500">
              {isEditingMode 
                ? "Edit your workflow using natural language" 
                : "Describe your email workflow in natural language"
              }
            </p>
          </div>
        </div>
                <div className="flex items-center gap-2">
          {isEditingMode && onSelectAction && actions && actions.length > 0 ? (
            <button
              onClick={() => {
                // Return to previously selected action, or first action if none was selected
                const actionIdToSelect = previousSelectedActionId && actions.find(a => a._id === previousSelectedActionId)
                  ? previousSelectedActionId
                  : actions[0]._id;
                onSelectAction(actionIdToSelect);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              AI Powered
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${message.isUser ? 'order-2' : 'order-1'}`}>
              {!message.isUser && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">AI</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                </div>
              )}
              <div
                className={`p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-purple-600 text-white ml-auto'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.actionCreated && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-gray-600">⚙️ Action Created:</span>
                    <span className="font-medium">{message.actionCreated}</span>
                  </div>
                )}
              </div>
              {message.isUser && (
                <div className="text-xs text-gray-500 text-right mt-1">
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
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">AI</span>
                </div>
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
} 