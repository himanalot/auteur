import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setIsProcessing, setStatus } from '../../store/appSlice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistantTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedModel, isProcessing, status } = useAppSelector((state) => state.app);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'BRUHHHH! I\'m your AI assistant powered by Google Gemini. Ask me anything about After Effects, motion graphics, or get help with your projects!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    dispatch(setIsProcessing(true));
    dispatch(setStatus('Thinking...'));

    try {
      // This will be implemented with the actual AI chat logic
      // For now, just a placeholder response
      setTimeout(() => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: 'This is a placeholder response. The actual AI chat functionality will be implemented next.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Ready'));
      }, 1000);
    } catch (error) {
      console.error('Chat error:', error);
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Error occurred'));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="tab-content">
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <input
              type="text"
              className="chat-input"
              placeholder="Ask me about After Effects..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
            />
            <button
              className="send-btn"
              title="Send Message"
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
              </svg>
            </button>
            <button
              className="clear-btn"
              title="Debug Shape Creation"
              style={{ background: 'var(--button-danger)', borderColor: 'var(--button-danger)' }}
            >
              DEBUG
            </button>
          </div>
        </div>
        
        <div className="api-status">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <label htmlFor="modelSelect" style={{ fontSize: 'var(--size-sm)', margin: 0 }}>Model:</label>
              <select className="model-dropdown" value={selectedModel}>
                <option value="gemini">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="o4-mini">OpenAI o4-mini</option>
              </select>
            </div>
            <span className="ai-status">● {status}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button className="api-settings-btn" title="API Settings">⚙</button>
            <button className="debug-toggle-btn" title="Toggle Debug Mode">🔍</button>
            <button className="copy-convo-btn" title="Copy Full Conversation">📋</button>
            <button className="clear-convo-btn" title="Clear Conversation">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantTab;