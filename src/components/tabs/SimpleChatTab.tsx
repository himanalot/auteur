import React, { useState, useRef, useEffect } from 'react';
import useSimpleChatManager from '../../hooks/useSimpleChatManager';

interface VideoLayer {
  name: string;
  filePath: string;
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  id: number;
}

interface UploadedVideo {
  name: string;
  fileId: string;
  state: string;
}

const SimpleChatTab: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isAutonomousMode, setIsAutonomousMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [expandedDebugMessages, setExpandedDebugMessages] = useState<Set<number>>(new Set());
  const [videoLayers, setVideoLayers] = useState<VideoLayer[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Single chat manager - no parallel autonomous agent
  const {
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
  } = useSimpleChatManager({ model: 'claude' });

  // Debug functions
  const toggleDebugMessage = (index: number) => {
    const newExpanded = new Set(expandedDebugMessages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDebugMessages(newExpanded);
  };

  const getMessageDebugInfo = (message: any, index: number) => {
    // Get all debug interactions for this specific message
    const messageDebugInteractions = message.debugInteractions || [];
    
    // Get global debug interactions around this time
    const globalInteractions = debugInteractions.slice(-20); // Last 20 interactions
    
    return {
      messageIndex: index,
      timestamp: new Date().toISOString(),
      role: message.role,
      contentLength: message.content?.length || 0,
      contentPreview: message.content?.substring(0, 200) + '...',
      fullContent: message.content,
      metadata: message.metadata || {},
      autonomousMode: isAutonomousMode,
      rawMessage: message,
      
      // Debug interaction details
      messageSpecificInteractions: messageDebugInteractions,
      globalInteractions: globalInteractions,
      totalInteractions: debugInteractions.length,
      
      // Summary of interaction types for this message
      interactionSummary: {
        userMessages: messageDebugInteractions.filter((i: any) => i.type === 'user_message').length,
        aiRequests: messageDebugInteractions.filter((i: any) => i.type === 'ai_request').length,
        toolCalls: messageDebugInteractions.filter((i: any) => i.type === 'tool_call').length,
        toolResults: messageDebugInteractions.filter((i: any) => i.type === 'tool_result').length,
        aiResponses: messageDebugInteractions.filter((i: any) => i.type === 'ai_response').length,
        claudeContexts: messageDebugInteractions.filter((i: any) => i.type === 'claude_context').length,
      }
    };
  };

  // Auto-resize textarea (matching vanilla behavior)
  const autoResizeInput = () => {
    const input = inputRef.current;
    if (input) {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 258) + 'px';
    }
  };

  useEffect(() => {
    autoResizeInput();
  }, [inputValue]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch video layers from After Effects
  const fetchVideoLayers = async () => {
    try {
      if (!(window as any).CSInterface) {
        throw new Error('CSInterface not available');
      }

      const csInterface = new (window as any).CSInterface();
      const result = await new Promise<string>((resolve) => {
        csInterface.evalScript('getVideoFootageLayers()', (evalResult: string) => {
          resolve(evalResult);
        });
      });

      console.log('📹 ExtendScript result:', result);

      if (!result || result.trim() === '') {
        console.error('❌ Empty result from ExtendScript');
        return;
      }

      const parsed = JSON.parse(result);
      if (parsed.success) {
        setVideoLayers(parsed.data || []);
      } else {
        console.error('❌ ExtendScript returned error:', parsed.message);
      }
    } catch (error) {
      console.error('❌ Failed to fetch video layers:', error);
    }
  };

  // Handle input change and @ mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const query = textBeforeCursor.substring(atIndex + 1);
      // Only show autocomplete if @ is at start or after whitespace
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) {
        setAutocompleteQuery(query);
        setShowAutocomplete(true);
        setSelectedVideoIndex(0);

        // Fetch layers if not already fetched
        if (videoLayers.length === 0) {
          fetchVideoLayers();
        }
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  // Filter video layers based on query
  const filteredVideos = videoLayers.filter(video =>
    video.name.toLowerCase().includes(autocompleteQuery.toLowerCase())
  );

  // Handle video selection from autocomplete
  const handleVideoSelect = async (video: VideoLayer) => {
    // Replace @mention with video name
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = inputValue.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = inputValue.substring(cursorPos);

    const newValue = inputValue.substring(0, atIndex) + `@${video.name} ` + textAfterCursor;
    setInputValue(newValue);
    setShowAutocomplete(false);

    // Upload the video
    await uploadVideo(video);
  };

  // Upload video to backend
  const uploadVideo = async (video: VideoLayer) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read file and create FormData
      const response = await fetch(`file://${video.filePath}`);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, video.name);
      formData.append('frameRate', '1');

      setUploadProgress(30);

      const uploadResponse = await fetch('http://localhost:3001/api/upload/video', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(70);

      const result = await uploadResponse.json();
      setUploadProgress(100);

      if (result.success) {
        setUploadedVideos(prev => [...prev, {
          name: video.name,
          fileId: result.fileId,
          state: result.state || 'ACTIVE'
        }]);
      }
    } catch (error) {
      console.error('Video upload failed:', error);
      alert(`Failed to upload video: ${error}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove uploaded video
  const removeUploadedVideo = (fileId: string) => {
    setUploadedVideos(prev => prev.filter(v => v.fileId !== fileId));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing || isUploading) return;

    console.log('🔄 SimpleChatTab: handleSendMessage called');
    console.log('🔄 isAutonomousMode:', isAutonomousMode);
    console.log('🔄 inputValue:', inputValue);
    console.log('🎥 Uploaded videos:', uploadedVideos);

    try {
      // If there are uploaded videos, prepend their file IDs to the message
      let messageToSend = inputValue;
      if (uploadedVideos.length > 0) {
        const videoContext = uploadedVideos.map(v =>
          `Video "${v.name}" (file ID: ${v.fileId})`
        ).join('\n');
        messageToSend = `${videoContext}\n\n${inputValue}`;
      }

      if (isAutonomousMode) {
        console.log('🤖 SimpleChatTab: Using autonomous mode - sending through regular chat with prefix');
        const autonomousMessage = `AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: ${messageToSend}`;
        console.log('🤖 SimpleChatTab: Autonomous message:', autonomousMessage);
        await sendMessage(autonomousMessage);
      } else {
        console.log('📝 SimpleChatTab: Calling regular sendMessage');
        await sendMessage(messageToSend);
      }

      setInputValue('');
      setUploadedVideos([]); // Clear uploaded videos after sending
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleClearChat = () => {
    clearChat();
  };

  const handleModelChange = (newModel: string) => {
    if (!isAutonomousMode) {
      setModel(newModel);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showAutocomplete && filteredVideos.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedVideoIndex(prev =>
          prev < filteredVideos.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedVideoIndex(prev =>
          prev > 0 ? prev - 1 : filteredVideos.length - 1
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleVideoSelect(filteredVideos[selectedVideoIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const shouldDisableSend = !inputValue.trim() || isProcessing || isUploading;

  return (
    <div className="tab-content">
      {/* Add pulse animation CSS for search indicators */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div className="simple-chat-container">
        <div className="simple-chat-messages" ref={messagesRef}>
          {messages.map((message, index) => (
            <div key={index} className={`simple-chat-message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong>
                      {message.role === 'user' ? 'You' : 
                       isAutonomousMode ? '🤖 Autonomous Agent' : 'Assistant'}:
                    </strong>{' '}
                    <span 
                      dangerouslySetInnerHTML={{ 
                        __html: formatMessage(message.content)
                      }} 
                    />
                  </div>
                  {debugMode && (
                    <button
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        backgroundColor: expandedDebugMessages.has(index) ? '#007acc' : '#f0f0f0',
                        color: expandedDebugMessages.has(index) ? 'white' : '#333',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      onClick={() => toggleDebugMessage(index)}
                      title="Show debug info for this message"
                    >
                      🔧
                    </button>
                  )}
                </div>
                
                {isAutonomousMode && message.role === 'assistant' && (
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#666', 
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    Mode: Autonomous execution with enhanced iterations
                  </div>
                )}
                
                {debugMode && expandedDebugMessages.has(index) && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f8f8f8',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}>
                    <strong>Debug Info:</strong>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      margin: '4px 0 0 0',
                      fontSize: '10px'
                    }}>
                      {JSON.stringify(getMessageDebugInfo(message, index), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="simple-chat-input-area">
          <div className="chat-model-selector">
            <label htmlFor="simpleChatModel">Mode:</label>
            <select
              id="simpleChatModel"
              className="model-dropdown"
              value={isAutonomousMode ? 'autonomous' : currentModel}
              onChange={(e) => {
                if (e.target.value === 'autonomous') {
                  setIsAutonomousMode(true);
                } else {
                  setIsAutonomousMode(false);
                  handleModelChange(e.target.value);
                }
              }}
            >
              <option value="claude">Claude 4 Sonnet</option>
              <option value="gemini">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="autonomous">🤖 Autonomous Agent</option>
            </select>
          </div>

          <div className="chat-input-container">
            {/* Upload Progress */}
            {isUploading && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#f0f0f0',
                borderRadius: '6px',
                marginBottom: '8px',
                fontSize: '12px'
              }}>
                📹 Uploading video... {uploadProgress}%
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '2px',
                  marginTop: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#007acc',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            )}

            {/* Uploaded Videos List */}
            {uploadedVideos.length > 0 && (
              <div style={{
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#666' }}>
                  Attached Videos ({uploadedVideos.length}):
                </div>
                {uploadedVideos.map(video => (
                  <div key={video.fileId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎬</span>
                      <span>{video.name}</span>
                      <span style={{
                        color: video.state === 'ACTIVE' ? '#28a745' : '#6c757d',
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: video.state === 'ACTIVE' ? '#d4edda' : '#e2e3e5',
                        borderRadius: '3px'
                      }}>
                        {video.state}
                      </span>
                    </div>
                    <button
                      onClick={() => removeUploadedVideo(video.fileId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0 4px'
                      }}
                      title="Remove video"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="simple-chat-input-container">
              <div className="flex flex-col h-fit p-2">
                <div className="relative h-fit">
                  <textarea
                    ref={inputRef}
                    className="simple-chat-input"
                    placeholder={
                      isAutonomousMode ?
                        "Describe a complex After Effects task for autonomous completion... (Type @ to mention a video)" :
                        "Ask about After Effects scripting, automation, or just say hi... (Type @ to mention a video)"
                    }
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing || isUploading}
                  />

                  {/* Autocomplete Dropdown */}
                  {showAutocomplete && (
                    <div
                      ref={autocompleteRef}
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        boxShadow: '0 -4px 8px rgba(0,0,0,0.1)',
                        zIndex: 1000
                      }}
                    >
                      {filteredVideos.length > 0 ? (
                        filteredVideos.map((video, index) => (
                          <div
                            key={video.id}
                            onClick={() => handleVideoSelect(video)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              backgroundColor: index === selectedVideoIndex ? '#e3f2fd' : 'white',
                              borderBottom: index < filteredVideos.length - 1 ? '1px solid #eee' : 'none',
                              fontSize: '13px'
                            }}
                            onMouseEnter={() => setSelectedVideoIndex(index)}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                              🎬 {video.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {video.width}x{video.height} • {video.duration.toFixed(1)}s • {video.frameRate} fps
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px', fontSize: '13px', color: '#666', textAlign: 'center' }}>
                          {videoLayers.length === 0 ? 'Loading videos...' : 'No videos found'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="chat-input-controls">
                <div className="chat-actions">
                  <button 
                    className="clear-chat-btn" 
                    title="Toggle Debug Mode"
                    onClick={() => setDebugMode(!debugMode)}
                    style={{
                      backgroundColor: debugMode ? '#007acc' : undefined,
                      color: debugMode ? 'white' : undefined
                    }}
                  >
                    🔧
                  </button>
                  <button 
                    className="clear-chat-btn" 
                    title="Clear Chat"
                    onClick={handleClearChat}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                  {isProcessing ? (
                    <button
                      className="clear-chat-btn"
                      title="Stop Generation"
                      onClick={stopGeneration}
                      style={{ backgroundColor: '#dc3545' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      </svg>
                    </button>
                  ) : (
                    <button
                      className={`send-chat-btn ${shouldDisableSend ? 'disabled' : ''}`}
                      title={isAutonomousMode ? "Start Autonomous Task" : "Send Message"}
                      onClick={handleSendMessage}
                      disabled={shouldDisableSend}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 7-7 7 7"></path>
                        <path d="M12 19V5"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="simple-chat-status">
          <span className="status-text">
            {error ? `Error: ${error}` : connectionStatus}
          </span>
          {isAutonomousMode && isProcessing && (
            <div className="agent-progress" style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <div>Processing autonomously...</div>
              <div>Using single continuous conversation flow</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleChatTab;