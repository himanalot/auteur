import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket, { WebSocketMessage } from './useWebSocket';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface SimpleAIChatOptions {
  model?: string;
  systemPrompt?: string;
  maxMessages?: number;
  wsUrl?: string;
}

interface SimpleAIChatHook {
  messages: ChatMessage[];
  isProcessing: boolean;
  isConnected: boolean;
  connectionStatus: string;
  sendMessage: (content: string) => Promise<void>;
  clearChat: (welcomeMessage?: string) => void;
  formatMessage: (content: string) => string;
  error: string | null;
}

const useSimpleAIChat = (options: SimpleAIChatOptions = {}): SimpleAIChatHook => {
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
      content: "Hi! I'm an AI assistant. I can help answer questions about Adobe After Effects, provide explanations, and have conversations on various topics. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentModel, setCurrentModel] = useState(defaultModel);
  const [error, setError] = useState<string | null>(null);
  const [lastSentMessage, setLastSentMessage] = useState('');
  const [sendingInProgress, setSendingInProgress] = useState(false);

  const currentStreamingIdRef = useRef<string | null>(null);

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
    console.log(`📨 Simple AI Chat WebSocket message: ${type}`);
    
    switch (type) {
      case 'connection_established':
        console.log('🔌 Simple AI Chat WebSocket connection established');
        setError(null);
        break;
        
      case 'chat_started':
        console.log(`🤖 Simple AI Chat started with ${message.data?.model || 'unknown'} model`);
        break;
        
      case 'content_delta':
        if (currentStreamingIdRef.current && message.content) {
          updateStreamingMessage(message.content, false);
        }
        break;
        
      case 'chat_complete':
        if (currentStreamingIdRef.current && message.result?.content) {
          updateStreamingMessage(message.result.content, true);
          
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
        console.error('❌ Simple AI Chat backend error:', message.error);
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
        console.warn('❓ Unknown Simple AI Chat WebSocket message type:', type);
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
      return newMessages.length > maxMessages 
        ? newMessages.slice(-maxMessages) 
        : newMessages;
    });
    
    return message;
  }, [maxMessages]);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
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

      // Create streaming assistant message
      const streamingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const streamingMessage: ChatMessage = {
        id: streamingId,
        role: 'assistant',
        content: '▌',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, streamingMessage]);
      currentStreamingIdRef.current = streamingId;

      // Prepare chat history (no tool catalog for simple chat)
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add current message to history
      chatHistory.push({ role: 'user', content: messageContent });
      
      // Add system prompt if provided
      if (systemPrompt) {
        chatHistory.unshift({ role: 'system', content: systemPrompt });
      }

      const chatData = {
        message: messageContent,
        model: currentModel,
        conversation: chatHistory
      };

      const success = wsSend({
        type: 'chat_start',
        data: chatData
      });
      
      if (!success) {
        throw new Error('Failed to send message to backend');
      }

    } catch (err) {
      console.error('Simple AI Chat error:', err);
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
    const welcome = welcomeMessage || "Hi! I'm an AI assistant. I can help answer questions about Adobe After Effects, provide explanations, and have conversations on various topics. How can I help you today?";
    
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
    
    console.log('🗑️ Simple AI Chat cleared');
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

  // Auto-connect on mount
  useEffect(() => {
    const connectToBackend = async () => {
      if (!isConnected && connectionState !== 'connecting') {
        try {
          console.log('🔌 Simple AI Chat auto-connecting to backend...');
          await wsConnect();
        } catch (err) {
          console.error('Simple AI Chat failed to connect to backend:', err);
          setError('Failed to connect to backend');
        }
      }
    };

    const timeoutId = setTimeout(connectToBackend, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  const connectionStatus = isConnected 
    ? `Connected (${currentModel})` 
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
    formatMessage,
    error
  };
};

export default useSimpleAIChat;
export type { ChatMessage, SimpleAIChatOptions, SimpleAIChatHook };