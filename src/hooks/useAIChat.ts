import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket, { WebSocketMessage } from './useWebSocket';
import { UploadedFile } from './useFileUpload';
import aeToolsService from '../services/aeToolsService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatOptions {
  model?: string;
  systemPrompt?: string;
  maxMessages?: number;
  wsUrl?: string;
}

interface AIChatHook {
  messages: ChatMessage[];
  isProcessing: boolean;
  isConnected: boolean;
  connectionStatus: string;
  sendMessage: (
    content: string, 
    options?: { 
      files?: UploadedFile[]; 
      frameRate?: number;
      model?: string;
    }
  ) => Promise<void>;
  clearChat: (welcomeMessage?: string) => void;
  retryLastMessage: () => Promise<void>;
  setModel: (model: string) => void;
  formatMessage: (content: string) => string;
  error: string | null;
}

const useAIChat = (options: ChatOptions = {}): AIChatHook => {
  const {
    model: defaultModel = 'claude',
    systemPrompt,
    maxMessages = 100,
    wsUrl
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm an AI assistant for Adobe After Effects with access to 57+ professional tools across 9 categories. I can help you create, animate, and automate After Effects workflows. Just tell me what you'd like to create or do!",
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentModel, setCurrentModel] = useState(defaultModel);
  const [error, setError] = useState<string | null>(null);
  const [lastSentMessage, setLastSentMessage] = useState('');
  const [sendingInProgress, setSendingInProgress] = useState(false);

  const currentStreamingIdRef = useRef<string | null>(null);
  const lastMessageRef = useRef<string>('');

  // WebSocket connection
  const { 
    isConnected, 
    connectionState, 
    send: wsSend, 
    connect: wsConnect, 
    isReady 
  } = useWebSocket(handleWebSocketMessage, { url: wsUrl });

  async function handleWebSocketMessage(message: WebSocketMessage) {
    const { type } = message;
    console.log(`📨 AI Chat WebSocket message: ${type}`);
    
    switch (type) {
      case 'connection_established':
        console.log('🔌 AI Chat WebSocket connection established');
        setError(null);
        break;
        
      case 'chat_started':
        console.log(`🤖 AI Chat started with ${message.data?.model || 'unknown'} model`);
        break;
        
      case 'content_delta':
        if (currentStreamingIdRef.current && message.content) {
          updateStreamingMessage(message.content, false);
        }
        break;

      case 'tool_call_start':
        if (currentStreamingIdRef.current) {
          updateStreamingMessage('🔧 Using tools...', false);
        }
        break;

      case 'tool_call_complete':
        if (currentStreamingIdRef.current) {
          updateStreamingMessage('🔧 Tool completed, generating response...', false);
        }
        break;
        
      case 'chat_complete':
        if (currentStreamingIdRef.current && message.result?.content) {
          updateStreamingMessage(message.result.content, true);
          
          // Process tool calls from the AI response
          await processAIResponse(message.result.content);
          
          // Add to message history
          setMessages(prev => prev.map(msg => 
            msg.id === currentStreamingIdRef.current 
              ? { ...msg, content: message.result.content }
              : msg
          ));
        }
        
        currentStreamingIdRef.current = null;
        setIsProcessing(false);
        setSendingInProgress(false);
        setError(null);
        setTimeout(() => setLastSentMessage(''), 5000);
        break;
        
      case 'error':
        console.error('❌ AI Chat backend error:', message.error);
        const errorMessage = `❌ Error: ${message.error}`;
        
        if (currentStreamingIdRef.current) {
          updateStreamingMessage(errorMessage, true);
        } else {
          addMessage('assistant', errorMessage);
        }
        
        currentStreamingIdRef.current = null;
        setIsProcessing(false);
        setSendingInProgress(false);
        setError(message.error || 'Unknown error occurred');
        setTimeout(() => setLastSentMessage(''), 1000);
        break;
        
      default:
        console.warn('❓ Unknown AI Chat WebSocket message type:', type);
    }
  }

  const updateStreamingMessage = useCallback((content: string, isComplete: boolean) => {
    if (!currentStreamingIdRef.current) return;
    
    setMessages(prev => prev.map(msg => 
      msg.id === currentStreamingIdRef.current 
        ? { ...msg, content: content + (isComplete ? '' : '▌') }
        : msg
    ));
  }, []);

  const addMessage = useCallback((role: 'user' | 'assistant' | 'system', content: string): ChatMessage => {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Limit message history to maxMessages
      return newMessages.length > maxMessages 
        ? newMessages.slice(-maxMessages) 
        : newMessages;
    });
    
    return message;
  }, [maxMessages]);

  // Process AI response to extract and execute tool calls
  const processAIResponse = useCallback(async (response: string) => {
    // Look for JSON tool calls in the response
    const toolCallPattern = /\{[\s]*"tool"[\s]*:[\s]*"([^"]+)"[\s]*,[\s]*"parameters"[\s]*:[\s]*(\{[^}]*\})\}/g;
    let match;
    let toolCallsExecuted = 0;
    const MAX_TOOLS_PER_REQUEST = 25;
    
    console.log('🔍 Processing AI response for tool calls...');
    
    while ((match = toolCallPattern.exec(response)) !== null && toolCallsExecuted < MAX_TOOLS_PER_REQUEST) {
      try {
        const toolName = match[1];
        const parametersStr = match[2];
        
        console.log(`🛠️ Found tool call: ${toolName} with parameters: ${parametersStr}`);
        
        // Parse parameters
        let parameters = {};
        try {
          parameters = JSON.parse(parametersStr);
        } catch (paramError) {
          console.error('❌ Failed to parse tool parameters:', paramError);
          addMessage('system', `❌ Invalid parameters for tool "${toolName}": ${parametersStr}`);
          continue;
        }
        
        // Execute the tool
        addMessage('system', `🔧 Executing tool: ${toolName}`);
        
        const toolResult = await aeToolsService.executeAITool(toolName, parameters);
        
        if (toolResult.success) {
          const resultMessage = `✅ Tool "${toolName}" executed successfully: ${toolResult.message}`;
          addMessage('system', resultMessage);
          console.log('✅ Tool executed successfully:', toolResult);
          
          // Check if this is a stop tool call
          if (toolName === 'stop') {
            addMessage('system', '🛑 AI task completed');
            break;
          }
        } else {
          const errorMessage = `❌ Tool "${toolName}" failed: ${toolResult.message}`;
          addMessage('system', errorMessage);
          console.error('❌ Tool execution failed:', toolResult);
        }
        
        toolCallsExecuted++;
        
      } catch (error) {
        console.error('❌ Error processing tool call:', error);
        addMessage('system', `❌ Error processing tool call: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (toolCallsExecuted === 0) {
      console.log('ℹ️ No tool calls found in AI response');
    } else {
      console.log(`✅ Processed ${toolCallsExecuted} tool calls`);
    }
  }, [addMessage]);

  const sendMessage = useCallback(async (
    content: string, 
    options: { 
      files?: UploadedFile[]; 
      frameRate?: number;
      model?: string;
    } = {}
  ): Promise<void> => {
    const messageContent = content.trim();
    if (!messageContent || isProcessing || sendingInProgress) return;

    // Prevent duplicate sends
    if (messageContent === lastSentMessage) {
      console.log('🚫 Preventing duplicate message send:', messageContent);
      return;
    }

    // Check connection
    if (!isReady?.()) {
      setError('Backend not connected');
      throw new Error('Backend not connected');
    }

    setSendingInProgress(true);
    setLastSentMessage(messageContent);
    setIsProcessing(true);
    setError(null);

    try {
      // Add user message
      addMessage('user', messageContent);
      lastMessageRef.current = messageContent;

      // Create streaming assistant message with unique ID
      const streamingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const streamingMessage: ChatMessage = {
        id: streamingId,
        role: 'assistant',
        content: '▌',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, streamingMessage]);
      currentStreamingIdRef.current = streamingId;

      // AUTOMATICALLY get tool catalog first to ensure AI has current tool info
      console.log('🛠️ Auto-calling get_tool_catalog for AI context...');
      let catalogInfo = '';
      
      try {
        if (aeToolsService.isAvailable()) {
          const catalogResult = await aeToolsService.getToolCatalog();
          if (catalogResult.success) {
            const toolCount = catalogResult.data?.totalCount || 0;
            const toolsList = catalogResult.data?.tools || {};
            
            // Format the tools catalog for the AI prompt
            let toolsText = '\n\n📋 **AVAILABLE TOOLS CATALOG**:\n';
            
            try {
              Object.keys(toolsList).forEach(category => {
                toolsText += `\n**${category.toUpperCase()}:**\n`;
                
                if (Array.isArray(toolsList[category])) {
                  toolsList[category].forEach((tool: string) => {
                    toolsText += `• ${tool}\n`;
                  });
                } else if (typeof toolsList[category] === 'object') {
                  toolsText += `• ${category.toLowerCase()}\n`;
                } else {
                  toolsText += `• ${toolsList[category]}\n`;
                }
              });
            } catch (error) {
              console.error('🔍 Error formatting tools list:', error);
              toolsText += `\nError formatting tools: ${error}\n`;
            }
            
            catalogInfo = toolsText + `\nTotal: ${toolCount} tools available.`;
            console.log('✅ Tool catalog loaded successfully');
          } else {
            catalogInfo = '\n\n⚠️ **Tool Catalog Warning**: Could not load tool catalog.';
            addMessage('system', `⚠️ **Tool Catalog Failed**: ${catalogResult.message}`);
          }
        } else {
          catalogInfo = '\n\n⚠️ **Tool Catalog Warning**: After Effects tools not available (not in CEP environment).';
          addMessage('system', '⚠️ **Tool Execution Disabled**: Not running in After Effects CEP environment');
        }
      } catch (toolError) {
        console.log('Could not get tool catalog, proceeding without it');
        catalogInfo = '\n\n⚠️ **Tool Catalog Warning**: Could not load tool catalog.';
      }

      // Prepare chat history
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add current message to history
      chatHistory.push({ role: 'user', content: messageContent });
      
      // Add system prompt with tool catalog if provided
      let fullSystemPrompt = systemPrompt || '';
      if (systemPrompt) {
        fullSystemPrompt = systemPrompt + catalogInfo;
        chatHistory.unshift({ role: 'system', content: fullSystemPrompt });
      }

      // Determine message type based on files
      const messageType = options.files?.length ? 'video_chat_start' : 'chat_start';
      const modelToUse = options.model || currentModel;

      const chatData = {
        message: messageContent,
        model: modelToUse,
        conversation: chatHistory,
        ...(options.files?.length && {
          files: options.files,
          frameRate: options.frameRate || 1
        })
      };

      const success = wsSend({
        type: messageType,
        data: chatData
      });
      
      if (!success) {
        throw new Error('Failed to send message to backend');
      }

    } catch (err) {
      console.error('AI Chat error:', err);
      const errorMessage = `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      
      if (currentStreamingIdRef.current) {
        setMessages(prev => prev.map(msg => 
          msg.id === currentStreamingIdRef.current 
            ? { ...msg, content: errorMessage }
            : msg
        ));
      } else {
        addMessage('assistant', errorMessage);
      }
      
      currentStreamingIdRef.current = null;
      setIsProcessing(false);
      setSendingInProgress(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setLastSentMessage(''), 1000);
      
      throw err;
    }
  }, [
    isProcessing, 
    sendingInProgress, 
    lastSentMessage, 
    isReady, 
    messages, 
    currentModel, 
    systemPrompt, 
    addMessage, 
    wsSend
  ]);

  const clearChat = useCallback((welcomeMessage?: string) => {
    const welcome = welcomeMessage || "Hi! I'm an AI assistant for Adobe After Effects with access to 57+ professional tools across 9 categories. I can help you create, animate, and automate After Effects workflows. Just tell me what you'd like to create or do!";
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcome,
      timestamp: new Date()
    }]);
    
    setIsProcessing(false);
    setSendingInProgress(false);
    currentStreamingIdRef.current = null;
    setError(null);
    setLastSentMessage('');
    
    console.log('🗑️ AI Chat cleared');
  }, []);

  const retryLastMessage = useCallback(async (): Promise<void> => {
    if (!lastMessageRef.current || isProcessing) return;
    
    // Remove the last assistant message (which likely contains an error)
    setMessages(prev => {
      const filtered = prev.filter(msg => !(msg.role === 'assistant' && msg.content.includes('❌')));
      return filtered.slice(0, -1); // Remove last assistant message
    });
    
    // Resend the last user message
    await sendMessage(lastMessageRef.current);
  }, [isProcessing, sendMessage]);

  const setModel = useCallback((model: string) => {
    setCurrentModel(model);
    console.log(`🔄 AI Chat model changed to: ${model}`);
  }, []);

  const formatMessage = useCallback((content: string): string => {
    let formatted = content;
    
    // Code blocks
    formatted = formatted.replace(
      /```(\w+)?\n?([\s\S]*?)```/g, 
      '<pre><code style="background: #1a1a1a; padding: 12px; border-radius: 6px; display: block; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1);">$2</code></pre>'
    );
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: rgba(255,255,255,0.9);">$1</strong>');
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #2a2a2a; color: #f8f8f2; padding: 2px 6px; border-radius: 4px;">$1</code>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }, []);

  // Auto-connect on mount with better retry logic
  useEffect(() => {
    const connectToBackend = async () => {
      if (!isConnected && connectionState !== 'connecting') {
        try {
          console.log('🔌 Auto-connecting to backend...');
          await wsConnect();
        } catch (err) {
          console.error('Failed to connect to backend:', err);
          setError('Failed to connect to backend');
        }
      }
    };

    // Give backend time to start, then connect
    const timeoutId = setTimeout(connectToBackend, 2000);
    return () => clearTimeout(timeoutId);
  }, []); // Only run once on mount

  const connectionStatus = isConnected 
    ? 'Connected to backend' 
    : connectionState === 'connecting' 
      ? 'Connecting to backend...' 
      : 'Disconnected from backend';

  return {
    messages,
    isProcessing,
    isConnected,
    connectionStatus,
    sendMessage,
    clearChat,
    retryLastMessage,
    setModel,
    formatMessage,
    error
  };
};

export default useAIChat;
export type { ChatMessage, ChatOptions, AIChatHook };