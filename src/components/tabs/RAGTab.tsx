import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setIsProcessing, setStatus, setSelectedModel } from '../../store/appSlice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const RAGTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedModel, isProcessing, status } = useAppSelector((state) => state.app);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I can help you find information from the official After Effects scripting documentation. Ask me about layers, compositions, properties, effects, and more!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [ragStatus, setRagStatus] = useState('Initializing...');
  const [ragEnabled, setRagEnabled] = useState(false);
  const [resultsCount, setResultsCount] = useState(5);
  const [debugMode, setDebugMode] = useState(false);
  const [rawDebug, setRawDebug] = useState(false);
  const [contextPreview, setContextPreview] = useState('');
  const [showCompositionSelector, setShowCompositionSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInitializeRAG = async () => {
    dispatch(setIsProcessing(true));
    setRagStatus('Initializing RAG system...');

    try {
      // This will be implemented with the actual RAG initialization logic
      setTimeout(() => {
        setRagEnabled(true);
        setRagStatus('RAG system ready');
        dispatch(setIsProcessing(false));
      }, 2000);
    } catch (error) {
      console.error('RAG initialization error:', error);
      setRagStatus('RAG initialization failed');
      dispatch(setIsProcessing(false));
    }
  };

  const handleDisableRAG = () => {
    setRagEnabled(false);
    setRagStatus('RAG system disabled');
  };

  const handleSendQuery = async () => {
    if (!input.trim() || isProcessing || !ragEnabled) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    dispatch(setIsProcessing(true));
    dispatch(setStatus('Searching documentation...'));

    try {
      // This will be implemented with the actual RAG search logic
      setTimeout(() => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: `Based on the After Effects documentation, here's what I found about "${userMessage.content}":\n\nThis is a placeholder response. The actual implementation will search through the comprehensive AE documentation and provide detailed, accurate information with code examples and API references.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Search complete'));
      }, 2000);
    } catch (error) {
      console.error('RAG search error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Error searching documentation: ' + (error instanceof Error ? error.message : 'Unknown error'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Search failed'));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendQuery();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I can help you find information from the official After Effects scripting documentation. Ask me about layers, compositions, properties, effects, and more!",
        timestamp: new Date()
      }
    ]);
    dispatch(setStatus('Ready'));
  };

  const handleSelectCompositions = () => {
    setShowCompositionSelector(true);
  };

  const handleExportProject = async () => {
    dispatch(setIsProcessing(true));
    dispatch(setStatus('Exporting project...'));

    try {
      // This will be implemented with the actual project export logic
      setTimeout(() => {
        setContextPreview('Project exported successfully');
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Project exported'));
      }, 1000);
    } catch (error) {
      console.error('Project export error:', error);
      setContextPreview('Error exporting project');
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Export failed'));
    }
  };

  const handleAttachJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          setContextPreview(`JSON file attached: ${file.name}`);
          dispatch(setStatus('JSON file attached'));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearContext = () => {
    setContextPreview('');
    dispatch(setStatus('Context cleared'));
  };

  const handleReprocess = async () => {
    dispatch(setIsProcessing(true));
    dispatch(setStatus('Reprocessing documents...'));

    try {
      setTimeout(() => {
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Documents reprocessed'));
      }, 3000);
    } catch (error) {
      console.error('Reprocess error:', error);
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Reprocess failed'));
    }
  };

  return (
    <div id="ragTab" className="tab-content">
      <div className="rag-container">
        <h3>📚 After Effects Documentation RAG</h3>
        <p>Ask questions about After Effects scripting and get answers from the official documentation!</p>
        
        <div className="rag-status-section">
          <div className="rag-status">
            <span id="ragStatus" className="rag-status-text">{ragStatus}</span>
            <button
              id="ragInitBtn"
              className="rag-init-btn"
              onClick={handleInitializeRAG}
              disabled={isProcessing || ragEnabled}
              style={{ display: ragEnabled ? 'none' : 'inline-block' }}
            >
              Initialize RAG System
            </button>
            <button
              id="ragDisableBtn"
              className="rag-disable-btn"
              onClick={handleDisableRAG}
              style={{ display: ragEnabled ? 'inline-block' : 'none' }}
            >
              Disable RAG
            </button>
          </div>
        </div>
        
        <div className="rag-chat-section">
          <div id="ragChatContainer" className="rag-chat-container">
            <div id="ragChatMessages" className="rag-chat-messages">
              {messages.map((message, index) => (
                <div key={index} className={`rag-message ${message.role}`}>
                  <div className="rag-message-content">
                    <strong>{message.role === 'user' ? 'You' : '📖 AE Docs Assistant'}:</strong> {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="rag-input-container">
            <input
              type="text"
              id="ragInput"
              className="rag-input"
              placeholder="Ask about After Effects scripting..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!ragEnabled || isProcessing}
            />
            <button
              id="sendRagQuery"
              className="rag-send-btn"
              title="Send Query"
              onClick={handleSendQuery}
              disabled={!ragEnabled || isProcessing || !input.trim()}
            >
              <span className="send-icon">🔍</span>
            </button>
            <button
              id="clearRagChat"
              className="rag-clear-btn"
              title="Clear Chat"
              onClick={handleClearChat}
            >
              <span className="clear-icon">🗑️</span>
            </button>
          </div>
        </div>
        
        <div className="rag-controls">
          <div className="rag-model-selector">
            <label htmlFor="ragModelSelect">AI Model:</label>
            <select
              id="ragModelSelect"
              className="model-dropdown"
              value={selectedModel}
              onChange={(e) => dispatch(setSelectedModel(e.target.value))}
            >
              <option value="gemini">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="claude">Claude 4 Sonnet</option>
              <option value="o4-mini">OpenAI o4-mini</option>
            </select>
          </div>
          
          <div className="rag-settings">
            <label htmlFor="ragResultsCount">Results:</label>
            <select
              id="ragResultsCount"
              className="rag-dropdown"
              value={resultsCount}
              onChange={(e) => setResultsCount(Number(e.target.value))}
            >
              <option value={3}>3 results</option>
              <option value={5}>5 results</option>
              <option value={10}>10 results</option>
            </select>
          </div>
          
          <div className="rag-debug">
            <label htmlFor="ragRawDebugCheck" style={{ fontSize: '10px', color: '#ccc' }}>
              <input
                type="checkbox"
                id="ragRawDebugCheck"
                checked={rawDebug}
                onChange={(e) => setRawDebug(e.target.checked)}
                style={{ marginRight: '3px' }}
              />
              Raw API Debug
            </label>
            <button
              id="ragDebugToggle"
              className="rag-debug-btn"
              title="Toggle Debug Info"
              onClick={() => setDebugMode(!debugMode)}
            >
              🔍
            </button>
            <button
              id="ragReprocessBtn"
              className="rag-reprocess-btn"
              title="Reprocess Documents"
              onClick={handleReprocess}
              disabled={isProcessing}
            >
              🔄
            </button>
          </div>
        </div>

        <div className="context-section">
          <label>Project Context (optional):</label>
          <div className="context-controls">
            <button
              id="selectRagCompositionsBtn"
              className="context-btn"
              onClick={handleSelectCompositions}
            >
              <span className="btn-icon">🎬</span>
              Select Compositions
            </button>
            <button
              id="exportRagProjectBtn"
              className="context-btn"
              onClick={handleExportProject}
              disabled={isProcessing}
            >
              <span className="btn-icon">📄</span>
              Export Full Project
            </button>
            <label htmlFor="ragJsonFileInput" className="context-btn">
              <span className="btn-icon">📎</span>
              Attach JSON File
              <input
                type="file"
                id="ragJsonFileInput"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleAttachJson}
              />
            </label>
            <button
              id="clearRagContextBtn"
              className="context-btn"
              onClick={handleClearContext}
            >
              <span className="btn-icon">🗑️</span>
              Clear Context
            </button>
          </div>
          
          <div
            id="ragCompositionSelector"
            className="composition-selector"
            style={{ display: showCompositionSelector ? 'block' : 'none' }}
          >
            <label>Select compositions to include in context:</label>
            <div id="ragCompositionList" className="composition-list">
              {/* Composition list will be populated dynamically */}
            </div>
            <div className="composition-selector-actions">
              <button id="ragSelectAllComps" className="context-btn">Select All</button>
              <button id="ragSelectNoneComps" className="context-btn">Select None</button>
              <button id="ragExportSelectedComps" className="context-btn">
                <span className="btn-icon">✅</span>
                Export Selected
              </button>
              <button
                id="ragCancelCompSelection"
                className="context-btn"
                onClick={() => setShowCompositionSelector(false)}
              >
                Cancel
              </button>
            </div>
          </div>
          <div id="ragContextPreview" className="context-preview">
            {contextPreview}
          </div>
        </div>
        
        <div
          id="ragDebugInfo"
          className="rag-debug-info"
          style={{ display: debugMode ? 'block' : 'none' }}
        >
          <h4>Debug Information:</h4>
          <div id="ragDebugContent" className="rag-debug-content">
            Debug information will be displayed here when available.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RAGTab;