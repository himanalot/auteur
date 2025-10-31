import React, { useEffect, useRef } from 'react';

const VideoChatTab: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mount the video chat HTML structure with AI chat styling
    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <div class="simple-chat-container">
          <div class="video-chat-header">
            <h3>🎥 Video Understanding</h3>
            <p>Upload videos or images and ask questions about visual content using advanced AI models</p>
          </div>
          
          <div class="video-chat-upload-section">
            <div class="upload-area" id="videoChatUploadArea" style="border: 3px dashed rgba(52, 152, 219, 0.6); border-radius: 12px; padding: 32px 24px; text-align: center; cursor: pointer; background: rgba(52, 152, 219, 0.1); margin-bottom: 16px; min-height: 120px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
              <div class="upload-content" style="pointer-events: none; z-index: 2; position: relative;">
                <div class="upload-icon" style="font-size: 48px; margin-bottom: 16px; color: #3498db;">🎬</div>
                <div class="upload-text" style="color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 600; margin-bottom: 12px;">Drop video files here or click to browse</div>
                <div class="upload-details" style="color: rgba(255, 255, 255, 0.7); font-size: 12px; background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; display: inline-block;">
                  Supports: MP4, MOV, AVI, WMV, WebM, JPG, PNG, WebP<br>
                  Maximum size: 2GB per file
                </div>
              </div>
              <input type="file" id="videoChatFileInput" style="display: none;" multiple accept="video/*,image/*">
            </div>
            <div id="videoChatFileList" class="file-list"></div>
          </div>
          
          <div class="simple-chat-messages" id="videoChatMessages">
            <!-- Welcome message will be added by VideoChatManager -->
          </div>
          
          <div class="simple-chat-input-area">
            <div class="video-chat-controls">
              <div class="control-row">
                <div class="control-group">
                  <label for="videoChatModel">Model:</label>
                  <select id="videoChatModel" class="model-dropdown">
                    <option value="gemini-2.0-flash" selected>Gemini 2.0 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  </select>
                </div>
                <div class="control-group">
                  <label for="videoChatFrameRate">Frame Rate:</label>
                  <select id="videoChatFrameRate" class="model-dropdown">
                    <option value="0.5">0.5 FPS</option>
                    <option value="1" selected>1 FPS</option>
                    <option value="2">2 FPS</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="chat-input-container">
              <div class="simple-chat-input-container">
                <div class="flex flex-col h-fit p-2">
                  <div class="relative h-fit">
                    <textarea id="videoChatInput" class="simple-chat-input" placeholder="Ask me about your video or image..."></textarea>
                  </div>
                </div>
                <div class="chat-input-controls">
                  <div class="chat-actions">
                    <button id="clearVideoChat" class="clear-chat-btn" title="Clear Chat">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                    <button id="sendVideoChatMessage" class="send-chat-btn" title="Send Message">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m5 12 7-7 7 7"></path>
                        <path d="M12 19V5"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="simple-chat-status">
            <span id="videoChatStatus" class="status-text">Ready for video chat</span>
          </div>
        </div>
      `;

      // Initialize VideoChatManager after a short delay to ensure DOM is ready
      const initializeVideoChat = () => {
        const uploadArea = document.getElementById('videoChatUploadArea');
        const fileInput = document.getElementById('videoChatFileInput');
        
        console.log('🎥 Checking video chat elements:', {
          uploadArea: !!uploadArea,
          fileInput: !!fileInput,
          VideoChatManager: !!(window as any).VideoChatManager
        });
        
        if (uploadArea && fileInput) {
          // Click handler to open file picker
          uploadArea.addEventListener('click', () => {
            console.log('🎯 Upload area clicked');
            fileInput.click();
          });

          console.log('✅ Upload area click handler added');
        }
        
        if ((window as any).VideoChatManager && !(window as any).videoChatInstance) {
          console.log('🎥 Initializing VideoChatManager from React...');
          (window as any).videoChatInstance = new (window as any).VideoChatManager();
        } else if ((window as any).videoChatInstance) {
          console.log('🎥 VideoChatManager already initialized');
        } else {
          console.warn('⚠️ VideoChatManager not available');
        }
      };
      
      setTimeout(initializeVideoChat, 100);
      setTimeout(initializeVideoChat, 500);  // Retry after 500ms
    }
  }, []);

  return (
    <div className="tab-content">
      <div ref={containerRef}></div>
    </div>
  );
};

export default VideoChatTab;