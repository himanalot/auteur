import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ProcessedVideoTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Pre-processed video file ID from Gemini
  const VIDEO_FILE_ID = 'files/34py56yt13a8';
  const VIDEO_DISPLAY_NAME = 'bruhhh_video';

  useEffect(() => {
    // Add initial message
    setMessages([{
      role: 'assistant',
      content: `🎬 Video Understanding Chat\n\nI'm ready to analyze the video "${VIDEO_DISPLAY_NAME}" (${VIDEO_FILE_ID}). What would you like to know about it?`,
      timestamp: new Date().toLocaleTimeString()
    }]);

    // Initialize WebSocket connection
    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:3002');
      
      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connected for processed video chat');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'video_content_delta':
        // Update streaming response
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.includes('🔄')) {
            // Update existing streaming message
            return prev.map((msg, index) => 
              index === prev.length - 1 
                ? { ...msg, content: `🔄 ${data.content}` }
                : msg
            );
          } else {
            // Add new streaming message
            return [...prev, {
              role: 'assistant',
              content: `🔄 ${data.content}`,
              timestamp: new Date().toLocaleTimeString()
            }];
          }
        });
        break;

      case 'video_complete':
        // Final response
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.content.includes('🔄'));
          return [...filtered, {
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toLocaleTimeString()
          }];
        });
        setIsProcessing(false);
        break;

      case 'video_error':
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Error: ${data.error}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        setIsProcessing(false);
        break;

      default:
        console.log('🔔 Unhandled message type:', data.type);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isProcessing || !wsRef.current) return;

    const userMessage = {
      role: 'user' as const,
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Send video chat message with pre-processed file
      wsRef.current.send(JSON.stringify({
        type: 'processed_video_chat',
        message: inputValue,
        fileId: VIDEO_FILE_ID,
        model: 'gemini-2.0-flash'
      }));

      setInputValue('');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Failed to send message. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }]);
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>🎬 Processed Video Chat</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
          Chatting with: {VIDEO_DISPLAY_NAME} ({VIDEO_FILE_ID})
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#ffffff'
      }}>
        {messages.map((message, index) => (
          <div key={index} style={{
            marginBottom: '16px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
            border: message.role === 'user' ? '1px solid #2196f3' : '1px solid #ddd'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '4px',
              fontWeight: 'bold'
            }}>
              {message.role === 'user' ? '👤 You' : '🤖 AI'} • {message.timestamp}
            </div>
            <div style={{
              color: '#333',
              lineHeight: '1.4'
            }}>
              {message.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{
                  __html: message.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code style="background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">$1</code>')
                    .replace(/###\s(.*?)$/gm, '<h3 style="margin: 16px 0 8px 0; color: #333;">$1</h3>')
                    .replace(/##\s(.*?)$/gm, '<h2 style="margin: 20px 0 10px 0; color: #333;">$1</h2>')
                    .replace(/\n\*/g, '\n•')
                    .replace(/\n\s\s\*/g, '\n  •')
                    .replace(/\n/g, '<br/>')
                }} />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the video... (press Enter to send)"
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              minHeight: '40px',
              maxHeight: '120px'
            }}
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={isProcessing || !inputValue.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: isProcessing ? '#ccc' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isProcessing ? '⏳' : '📤'}
          </button>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '8px'
        }}>
          💡 Try asking: "What is happening in this video?", "Describe the content", "What objects do you see?"
        </div>
      </div>
    </div>
  );
};

export default ProcessedVideoTab;