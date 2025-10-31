import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  content?: string;
  result?: any;
  error?: string;
}

interface WebSocketOptions {
  url?: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketHook {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  send: (message: any) => boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  lastMessage: WebSocketMessage | null;
  error: string | null;
  isReady: () => boolean;
}

const useWebSocket = (
  onMessage?: (message: WebSocketMessage) => void,
  options: WebSocketOptions = {}
): WebSocketHook => {
  const {
    url = 'ws://localhost:3001/api/chat/stream',
    protocols = [],
    reconnectInterval = 5000,
    maxReconnectAttempts = 3
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManuallyClosedRef = useRef(false);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      setLastMessage(message);
      onMessage?.(message);
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
      setError('Failed to parse message from server');
    }
  }, [onMessage]);

  const handleOpen = useCallback(() => {
    console.log('✅ WebSocket connected');
    setIsConnected(true);
    setConnectionState('connected');
    setError(null);
    reconnectAttemptsRef.current = 0;
    clearReconnectTimeout();
  }, [clearReconnectTimeout]);

  const handleClose = useCallback(() => {
    console.log('🔌 WebSocket disconnected');
    setIsConnected(false);
    setConnectionState('disconnected');
    
    // Only attempt to reconnect if not manually closed
    if (!isManuallyClosedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
      console.log(`🔄 Attempting to reconnect... (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        connect();
      }, reconnectInterval);
    } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      setConnectionState('error');
      setError('Failed to reconnect to server');
    }
  }, [reconnectInterval, maxReconnectAttempts]);

  const handleError = useCallback((event: Event) => {
    console.error('❌ WebSocket error:', event);
    setConnectionState('error');
    setError('WebSocket connection error');
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (wsRef.current) {
          wsRef.current.close();
        }

        setConnectionState('connecting');
        setError(null);
        isManuallyClosedRef.current = false;

        const ws = new WebSocket(url, protocols);
        wsRef.current = ws;

        ws.onopen = () => {
          handleOpen();
          resolve();
        };

        ws.onmessage = handleMessage;
        ws.onclose = handleClose;
        ws.onerror = (event) => {
          handleError(event);
          reject(new Error('WebSocket connection failed'));
        };

      } catch (err) {
        setConnectionState('error');
        setError(err instanceof Error ? err.message : 'Unknown connection error');
        reject(err);
      }
    });
  }, [url, protocols, handleOpen, handleMessage, handleClose, handleError]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
  }, [clearReconnectTimeout]);

  const send = useCallback((message: any): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageStr);
      return true;
    } catch (err) {
      console.error('❌ Failed to send WebSocket message:', err);
      setError('Failed to send message');
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
      if (wsRef.current) {
        isManuallyClosedRef.current = true;
        wsRef.current.close();
      }
    };
  }, [clearReconnectTimeout]);

  // Helper method to check if WebSocket is ready (for compatibility with existing code)
  const isReady = useCallback(() => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  }, []);

  return {
    isConnected,
    connectionState,
    send,
    connect,
    disconnect,
    lastMessage,
    error,
    isReady
  };
};

export default useWebSocket;
export type { WebSocketMessage, WebSocketOptions, WebSocketHook };