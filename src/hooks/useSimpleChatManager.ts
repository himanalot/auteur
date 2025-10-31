import { useState, useEffect, useCallback, useRef } from 'react';

// Types matching vanilla JS implementation
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ToolCall {
  name: string;
  query: string;
  id?: string;
}

interface ToolResult {
  success: boolean;
  documentation?: string;
  sources?: string[];
  query: string;
  resultCount: number;
  searchQueries?: string[];
  error?: string;
  id?: string;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  content?: string;
  result?: any;
  error?: string;
  toolCalls?: ToolCall[];
  toolCall?: ToolCall;
  timestamp?: string;
}

interface DebugInteraction {
  id: string;
  timestamp: string;
  type: 'user_message' | 'ai_request' | 'tool_call' | 'tool_result' | 'ai_response' | 'system_prompt' | 'claude_context';
  description: string;
  data: any;
  context?: any;
}

interface MessageWithDebug {
  role: string; 
  content: string; 
  isStreaming?: boolean;
  debugInteractions?: DebugInteraction[];
}

interface SimpleChatManagerHook {
  messages: MessageWithDebug[];
  isProcessing: boolean;
  isConnected: boolean;
  connectionStatus: string;
  currentModel: string;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  setModel: (model: string) => void;
  formatMessage: (content: string) => string;
  stopGeneration: () => void;
  error: string | null;
  debugInteractions: DebugInteraction[];
}

interface SimpleChatManagerOptions {
  model?: string;
  wsUrl?: string;
}

const useSimpleChatManager = (options: SimpleChatManagerOptions = {}): SimpleChatManagerHook => {
  // State
  const [messages, setMessages] = useState<MessageWithDebug[]>([
    {
      role: 'assistant',
      content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?",
      debugInteractions: []
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [debugInteractions, setDebugInteractions] = useState<DebugInteraction[]>([]);
  const [currentModel, setCurrentModel] = useState(options.model || 'claude');
  const [error, setError] = useState<string | null>(null);
  
  // Chat history for context (separate from display messages)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
    }
  ]);
  
  // Debug interaction logging
  const logDebugInteraction = useCallback((
    type: DebugInteraction['type'],
    description: string,
    data: any,
    context?: any
  ) => {
    const interaction: DebugInteraction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      description,
      data: JSON.parse(JSON.stringify(data)), // Deep clone to avoid reference issues
      context: context ? JSON.parse(JSON.stringify(context)) : undefined
    };
    
    setDebugInteractions(prev => [...prev, interaction]);
    
    // Also attach to the current message being processed if applicable
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        const lastMessage = { ...updated[updated.length - 1] };
        lastMessage.debugInteractions = [...(lastMessage.debugInteractions || []), interaction];
        updated[updated.length - 1] = lastMessage;
      }
      return updated;
    });
    
    console.log(`🔧 DEBUG [${type}]: ${description}`, { data, context });
  }, []);

  // Refs for streaming state
  const currentStreamingMessageIndexRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ragToolRef = useRef<any>(null);

  // Constants matching vanilla implementation
  const maxIterations = 1;
  const maxToolCallsPerIteration = 5;
  const maxTotalToolCalls = 10;

  // Initialize RAG tool (matching vanilla JS behavior)
  useEffect(() => {
    if ((window as any).RAGDocumentationTool) {
      ragToolRef.current = new (window as any).RAGDocumentationTool();
      console.log('🔧 RAG tool initialized (fallback)');
    }
  }, []);

  // WebSocket connection logic
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    
    try {
      // Test HTTP connectivity first (matching vanilla behavior)
      const urls = [
        'http://127.0.0.1:3001/api/test-connection',
        'http://localhost:3001/api/test-connection'
      ];
      
      let httpConnected = false;
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          if (response.ok) {
            httpConnected = true;
            break;
          }
        } catch (error) {
          console.error(`❌ HTTP connection error to ${url}:`, error);
        }
      }

      if (!httpConnected) {
        throw new Error('Backend HTTP connectivity failed');
      }

      // WebSocket connection
      const wsUrls = [
        'ws://127.0.0.1:3001/api/chat/stream',
        'ws://localhost:3001/api/chat/stream'
      ];

      for (const wsUrl of wsUrls) {
        try {
          const ws = new WebSocket(wsUrl);
          
          ws.onopen = () => {
            console.log('✅ Connected to backend');
            setIsConnected(true);
            setConnectionState('connected');
            setError(null);
          };

          ws.onmessage = (event) => {
            try {
              // Check if event.data is defined and not empty
              if (!event.data || event.data === 'undefined' || event.data.trim() === '') {
                console.warn('⚠️ Received empty or undefined WebSocket message, skipping');
                return;
              }
              
              const message: WebSocketMessage = JSON.parse(event.data);
              handleWebSocketMessage(message);
            } catch (err) {
              console.error('❌ WebSocket message parse error:', err);
              console.error('❌ Raw message data:', event.data);
            }
          };

          ws.onclose = () => {
            console.log('🔌 Disconnected from backend');
            setIsConnected(false);
            setConnectionState('disconnected');
            
            // Auto-reconnect logic
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, 3000);
          };

          ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            setError('Backend connection error');
          };

          wsRef.current = ws;
          break;
        } catch (error) {
          console.error(`❌ WebSocket connection failed to ${wsUrl}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Failed to connect to backend:', error);
      setError('Backend unavailable - check server');
      setConnectionState('error');
    }
  }, []);

  // Handle WebSocket messages (matching vanilla behavior exactly)
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    const { type } = message;
    console.log(`📨 Simple AI Chat WebSocket message: ${type}`, message);
    
    // Only log important WebSocket messages for debug (not streaming deltas)
    if (type !== 'content_delta') {
      logDebugInteraction(
        'ai_response',
        `WebSocket message: ${type}`,
        message,
        { messageType: type, timestamp: new Date().toISOString() }
      );
    }
    
    switch (type) {
      case 'connection_established':
        console.log('🔌 WebSocket connection established');
        break;
        
      case 'chat_started':
        console.log(`🤖 Chat started with ${message.data?.model || 'unknown'} model`);
        break;
        
      case 'content_delta':
        if (currentStreamingMessageIndexRef.current !== null && message.content) {
          updateStreamingMessage(message.content, false);
        }
        // Don't log every content delta for debug - too verbose
        break;
        
      case 'tool_call_start':
        if (message.toolCalls && currentStreamingMessageIndexRef.current !== null) {
          // Log tool calls for debug
          logDebugInteraction(
            'tool_call',
            `Tool calls started: ${message.toolCalls.map(tc => tc.name).join(', ')}`,
            { toolCalls: message.toolCalls },
            { messageIndex: currentStreamingMessageIndexRef.current }
          );
          
          // Add search indicators for each tool call
          message.toolCalls.forEach(toolCall => {
            if (toolCall.name === 'search_ae_documentation') {
              addSearchIndicator(toolCall.query);
            }
          });
        }
        break;
        
      case 'tool_call_complete':
        if (message.toolCall && message.result && currentStreamingMessageIndexRef.current !== null) {
          // Check if this is the special claude context debug message
          if (message.toolCall.name === 'claude_full_context') {
            logDebugInteraction(
              'claude_context',
              'Full context sent to Claude including tool results',
              message.result.fullContext,
              { 
                messageIndex: currentStreamingMessageIndexRef.current,
                timestamp: message.result.timestamp
              }
            );
          } else {
            // Log regular tool results for debug
            logDebugInteraction(
              'tool_result',
              `Tool result for ${message.toolCall.name}: ${message.toolCall.query}`,
              { 
                toolCall: message.toolCall, 
                result: message.result,
                success: message.result.success,
                resultCount: message.result.resultCount,
                hasDocumentation: !!message.result.documentation,
                documentationLength: message.result.documentation ? message.result.documentation.length : 0,
                documentationPreview: message.result.documentation ? message.result.documentation.substring(0, 300) + '...' : 'No documentation content'
              },
              { messageIndex: currentStreamingMessageIndexRef.current }
            );
            
            // Update search indicator with results
            updateSearchIndicator(message.toolCall.query, message.result);
          }
        }
        break;
        
      case 'chat_complete':
        if (currentStreamingMessageIndexRef.current !== null && message.result?.content) {
          updateStreamingMessage(message.result.content, true);
          
          // Add to chat history
          setChatHistory(prev => [...prev, { role: 'assistant', content: message.result.content }]);
        }
        
        // Clean up
        currentStreamingMessageIndexRef.current = null;
        setIsProcessing(false);
        setError(null);
        setIsAutonomousMode(false); // Reset autonomous mode on completion
        console.log('🤖 Reset autonomous mode on chat complete');
        break;
        
      case 'error':
        console.error('❌ Backend error:', message.error);
        if (currentStreamingMessageIndexRef.current !== null) {
          updateStreamingMessage(`❌ Error: ${message.error}`, true);
        }
        currentStreamingMessageIndexRef.current = null;
        setIsProcessing(false);
        setError(message.error || 'Unknown error occurred');
        setIsAutonomousMode(false); // Reset autonomous mode on error
        break;
        
      case 'pong':
        console.log('🏓 Pong received');
        break;
        
      default:
        console.warn('❓ Unknown WebSocket message type:', type);
    }
  }, [logDebugInteraction]); // Simplified dependencies for now

  // Update streaming message (no cursor) - preserve search indicators
  const updateStreamingMessage = useCallback((content: string, isComplete: boolean) => {
    if (currentStreamingMessageIndexRef.current === null) return;
    
    setMessages(prev => prev.map((msg, index) => 
      index === currentStreamingMessageIndexRef.current 
        ? { 
            ...msg, 
            content: (prevContent => {
              // Extract any search indicators from the previous content
              const searchIndicatorRegex = /<br><span style="[^"]*"[^>]*>(?:🔍|📚)[^<]*<\/span>/g;
              const searchIndicators = prevContent.match(searchIndicatorRegex) || [];
              
              // If we have search indicators, preserve them and add new content after
              if (searchIndicators.length > 0) {
                // Find where the last search indicator ends
                const lastIndicatorMatch = Array.from(prevContent.matchAll(searchIndicatorRegex)).pop();
                if (lastIndicatorMatch && lastIndicatorMatch.index !== undefined) {
                  const beforeIndicators = prevContent.substring(0, lastIndicatorMatch.index);
                  const indicators = searchIndicators.join('');
                  return beforeIndicators + indicators + '<br>' + content.replace(beforeIndicators, '');
                }
              }
              
              // No search indicators, just use new content
              return content;
            })(msg.content),
            isStreaming: !isComplete 
          }
        : msg
    ));

    // Clear streaming reference when complete
    if (isComplete) {
      currentStreamingMessageIndexRef.current = null;
    }
  }, []);

  // State to track if we're in autonomous mode
  const [isAutonomousMode, setIsAutonomousMode] = useState(false);

  // Add search indicator - insert at current position in message
  const addSearchIndicator = useCallback((query: string) => {
    if (currentStreamingMessageIndexRef.current === null) return;
    
    // Check if current message is autonomous by examining the content directly
    // This is more reliable than checking state which might not be updated yet
    const currentMessageIndex = currentStreamingMessageIndexRef.current;
    let isCurrentMessageAutonomous = false;
    
    setMessages(prev => {
      // Find the original user message to check if it's autonomous
      if (currentMessageIndex > 0 && prev[currentMessageIndex - 1]) {
        const userMessage = prev[currentMessageIndex - 1];
        isCurrentMessageAutonomous = userMessage.content.includes('AUTONOMOUS AGENT MODE:');
      }
      
      // Skip search indicators in autonomous mode to prevent visual clutter
      if (isCurrentMessageAutonomous) {
        console.log('🤖 Skipping search indicator in autonomous mode (content-based detection)');
        return prev; // Return unchanged
      }
      
      // Create search indicator with inline styles
      const searchIndicatorHTML = `<br><span style="display: inline-block; margin: 4px 0; padding: 4px 8px; background-color: #1f2937; border: 1px solid #4b5563; border-radius: 6px; font-size: 11px; color: #d1d5db; font-family: monospace;">🔍 Searching: "${query}"...</span>`;
      
      // Insert search indicator at current position in the message
      return prev.map((msg, index) => 
        index === currentMessageIndex 
          ? { 
              ...msg, 
              content: msg.content + searchIndicatorHTML
            }
          : msg
      );
    });
  }, []);

  // Update search indicator with results - find and replace in message content
  const updateSearchIndicator = useCallback((query: string, result: any) => {
    if (currentStreamingMessageIndexRef.current === null) return;
    
    // Check if current message is autonomous by examining the content directly
    const currentMessageIndex = currentStreamingMessageIndexRef.current;
    let isCurrentMessageAutonomous = false;
    
    setMessages(prev => {
      // Find the original user message to check if it's autonomous
      if (currentMessageIndex > 0 && prev[currentMessageIndex - 1]) {
        const userMessage = prev[currentMessageIndex - 1];
        isCurrentMessageAutonomous = userMessage.content.includes('AUTONOMOUS AGENT MODE:');
      }
      
      // Skip search indicator updates in autonomous mode
      if (isCurrentMessageAutonomous) {
        console.log('🤖 Skipping search indicator update in autonomous mode (content-based detection)');
        return prev; // Return unchanged
      }
      
      const resultCount = result.resultCount || 0;
      
      // Find and replace the searching indicator with completed indicator in the message
      const searchingIndicator = `🔍 Searching: "${query}"...`;
      const completedIndicator = `📚 Documentation: "${query}" (${resultCount} results)`;
      
      return prev.map((msg, index) => 
        index === currentMessageIndex 
          ? { 
              ...msg, 
              content: msg.content.replace(searchingIndicator, completedIndicator).replace(
                'background-color: #1f2937; border: 1px solid #4b5563;',
                'background-color: #166534; border: 1px solid #16a34a;'
              ).replace(
                'color: #d1d5db;',
                'color: #bbf7d0;'
              )
            }
          : msg
      );
    });
  }, []);

  // Send message (matching vanilla implementation logic)
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    const messageContent = content.trim();
    if (!messageContent || isProcessing) return;

    // Log user message for debug
    logDebugInteraction(
      'user_message',
      'User message sent',
      { content: messageContent, length: messageContent.length },
      { isProcessing, currentModel }
    );

    // Check if this is autonomous mode
    const isAutonomous = messageContent.includes('AUTONOMOUS AGENT MODE:');
    setIsAutonomousMode(isAutonomous);
    console.log(`🤖 Setting autonomous mode: ${isAutonomous}`);

    // Check connection
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Backend not connected - check if server is running');
      throw new Error('Backend not connected');
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: messageContent }]);

      // Add to history
      setChatHistory(prev => [...prev, { role: 'user', content: messageContent }]);

      // Create streaming assistant message
      const streamingMessageIndex = messages.length + 1; // Account for user message just added
      currentStreamingMessageIndexRef.current = streamingMessageIndex;
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '', 
        isStreaming: true 
      }]);

      // Send message to backend via WebSocket (matching vanilla format)
      const chatData = {
        message: messageContent,
        model: currentModel,
        conversation: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      // Log AI request for debug
      logDebugInteraction(
        'ai_request',
        `Sending AI request to ${currentModel}`,
        chatData,
        { 
          conversationLength: chatHistory.length,
          isAutonomous,
          messageLength: messageContent.length,
          fullConversationContext: chatData.conversation // Full context being sent to AI
        }
      );

      wsRef.current.send(JSON.stringify({
        type: 'chat_start',
        data: chatData
      }));

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = `❌ Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      
      if (currentStreamingMessageIndexRef.current !== null) {
        updateStreamingMessage(errorMessage, true);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      }
      
      currentStreamingMessageIndexRef.current = null;
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      throw err;
    }
  }, [isProcessing, chatHistory, currentModel, messages.length, logDebugInteraction]);

  // Clear chat
  const clearChat = useCallback(() => {
    const welcomeMessage = "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?";
    
    setMessages([{
      role: 'assistant',
      content: welcomeMessage
    }]);
    
    setChatHistory([{
      role: 'assistant',
      content: welcomeMessage
    }]);
    
    setIsProcessing(false);
    currentStreamingMessageIndexRef.current = null;
    setError(null);
    setIsAutonomousMode(false); // Reset autonomous mode on clear
    
    console.log('🗑️ Chat cleared');
  }, []);

  // Set model
  const setModel = useCallback((model: string) => {
    setCurrentModel(model);
    console.log(`🔄 Model changed to: ${model}`);
  }, []);

  // Format message (matching vanilla implementation)
  const formatMessage = useCallback((content: string): string => {
    let formatted = content;
    
    // Code blocks (triple backticks) - strip language identifier if present
    formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code style="background: #1a1a1a; padding: 12px; border-radius: 6px; display: block; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); font-family: \'Fira Code\', monospace;">$2</code></pre>');
    
    // Headers
    formatted = formatted.replace(/^### (.*$)/gm, '<h3 style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600; margin: 16px 0 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h2 style="color: rgba(255,255,255,0.95); font-size: 18px; font-weight: 600; margin: 20px 0 10px 0; border-bottom: 2px solid rgba(255,255,255,0.2); padding-bottom: 6px;">$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gm, '<h1 style="color: #fff; font-size: 20px; font-weight: 700; margin: 24px 0 12px 0;">$1</h1>');
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: rgba(255,255,255,0.9); font-weight: 600;">$1</strong>');
    
    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em style="color: rgba(255,255,255,0.8); font-style: italic;">$1</em>');
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #2a2a2a; color: #f8f8f2; padding: 2px 6px; border-radius: 4px; font-family: \'Fira Code\', monospace; font-size: 12px; border: 1px solid rgba(255,255,255,0.1);">$1</code>');
    
    // Links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3498db; text-decoration: underline;" target="_blank">$1</a>');
    
    // Unordered lists
    formatted = formatted.replace(/^[\s]*[-*+] (.+)$/gm, '•LIST_ITEM•$1');
    formatted = formatted.replace(/(•LIST_ITEM•[^•]+(?:\n•LIST_ITEM•[^•]+)*)/g, function(match) {
      const items = match.split('•LIST_ITEM•').filter(item => item.trim()).map(item => 
        `<li style="margin: 4px 0; padding-left: 4px; color: rgba(255,255,255,0.8);">${item.trim()}</li>`
      ).join('');
      return `<ul style="margin: 8px 0; padding-left: 20px;">${items}</ul>`;
    });
    
    // Ordered lists
    formatted = formatted.replace(/^[\s]*\d+\. (.+)$/gm, '•NUM_ITEM•$1');
    formatted = formatted.replace(/(•NUM_ITEM•[^•]+(?:\n•NUM_ITEM•[^•]+)*)/g, function(match) {
      const items = match.split('•NUM_ITEM•').filter(item => item.trim()).map(item => 
        `<li style="margin: 4px 0; padding-left: 4px; color: rgba(255,255,255,0.8);">${item.trim()}</li>`
      ).join('');
      return `<ol style="margin: 8px 0; padding-left: 20px;">${items}</ol>`;
    });
    
    // Blockquotes
    formatted = formatted.replace(/^> (.+)$/gm, '<blockquote style="border-left: 3px solid #3498db; padding-left: 12px; margin: 8px 0; color: rgba(255,255,255,0.7); font-style: italic;">$1</blockquote>');
    
    // Horizontal rules
    formatted = formatted.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 16px 0;">');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      connect();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const connectionStatus = isConnected
    ? `Connected (${currentModel})`
    : connectionState === 'connecting'
      ? 'Connecting to backend...'
      : 'Disconnected from backend';

  // Stop generation - cancel the current streaming response
  const stopGeneration = useCallback(() => {
    console.log('🛑 Stopping generation...');

    // Send stop message to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_generation',
        data: {}
      }));
    }

    // Update UI state
    setIsProcessing(false);

    // Mark the last streaming message as complete
    if (currentStreamingMessageIndexRef.current !== null) {
      setMessages(prev => {
        const updated = [...prev];
        const idx = currentStreamingMessageIndexRef.current;
        if (idx !== null && idx < updated.length) {
          updated[idx] = {
            ...updated[idx],
            isStreaming: false,
            content: updated[idx].content + '\n\n[Generation stopped by user]'
          };
        }
        return updated;
      });
      currentStreamingMessageIndexRef.current = null;
    }

    console.log('✅ Generation stopped');
  }, []);

  return {
    messages,
    isProcessing,
    isConnected,
    connectionStatus,
    currentModel,
    sendMessage,
    clearChat,
    setModel,
    formatMessage,
    stopGeneration,
    error,
    debugInteractions
  };
};

export default useSimpleChatManager;
export type { SimpleChatManagerHook, SimpleChatManagerOptions };