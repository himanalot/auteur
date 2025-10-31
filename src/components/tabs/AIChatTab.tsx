import React, { useEffect, useRef } from 'react';

const AIChatTab: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mount the original HTML structure for AI Chat tab
    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <div class="simple-chat-container">
          <!-- Chat Mode Toggle -->
          <div class="chat-mode-toggle" style="margin-bottom: 16px; display: flex; gap: 8px;">
            <button id="textModeBtn" class="mode-toggle-btn active" data-mode="text">
              💬 Text Chat
            </button>
            <button id="videoModeBtn" class="mode-toggle-btn" data-mode="video">
              🎥 Video Understanding
            </button>
          </div>

          <!-- Video Upload Area (initially hidden) -->
          <div id="videoUploadArea" class="video-upload-area" style="display: none; margin-bottom: 16px;">
            <div class="video-upload-dropzone" id="videoDropzone">
              <div class="upload-content">
                <div class="upload-icon">🎥</div>
                <div class="upload-text">
                  <div class="upload-primary">Drop video files here or click to upload</div>
                  <div class="upload-secondary">Supports MP4, MOV, AVI (max 2GB)</div>
                </div>
              </div>
              <input type="file" id="videoFileInput" accept="video/*" multiple style="display: none;">
            </div>
            
            <!-- Uploaded Videos List -->
            <div id="uploadedVideosList" class="uploaded-videos-list"></div>
          </div>

          <div class="simple-chat-messages" id="simpleChatMessages">
            <!-- Welcome message will be added by SimpleChatManager -->
          </div>
          
          <div class="simple-chat-input-area">
            <div class="chat-model-selector">
              <label for="simpleChatModel">Model:</label>
              <select id="simpleChatModel" class="model-dropdown">
                <option value="claude" selected>Claude 4 Sonnet</option>
                <option value="gemini">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>
            
            <div class="chat-input-container">
              <div class="simple-chat-input-container">
                <div class="flex flex-col h-fit p-2">
                  <div class="relative h-fit">
                    <textarea id="simpleChatInput" class="simple-chat-input" placeholder="Ask about After Effects scripting, automation, or just say hi..."></textarea>
                  </div>
                </div>
                <div class="chat-input-controls">
                  <div class="chat-actions">
                    <button id="clearSimpleChat" class="clear-chat-btn" title="Clear Chat">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                    <button id="sendSimpleChatMessage" class="send-chat-btn" title="Send Message">
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
            <span id="simpleChatStatus" class="status-text">Ready to chat</span>
          </div>
        </div>
      `;

      // Initialize SimpleChatManager and video mode controls after a short delay to ensure DOM is ready
      setTimeout(() => {
        if ((window as any).SimpleChatManager && !(window as any).simpleChatInstance) {
          console.log('🤖 Initializing SimpleChatManager from React...');
          (window as any).simpleChatInstance = new (window as any).SimpleChatManager();
        } else if ((window as any).simpleChatInstance) {
          console.log('🤖 SimpleChatManager already initialized');
        } else {
          console.warn('⚠️ SimpleChatManager not available');
        }

        // Initialize video mode functionality
        initializeVideoMode();
      }, 100);
    }
  }, []);

  // Initialize video mode functionality
  const initializeVideoMode = () => {
    let isVideoMode = false;
    let uploadedVideos: Array<{id: string, name: string, uri: string, state: string}> = [];

    // Mode toggle handlers
    const textModeBtn = document.getElementById('textModeBtn');
    const videoModeBtn = document.getElementById('videoModeBtn');
    const videoUploadArea = document.getElementById('videoUploadArea');
    const modelSelect = document.getElementById('simpleChatModel') as HTMLSelectElement;

    if (textModeBtn && videoModeBtn && videoUploadArea && modelSelect) {
      textModeBtn.addEventListener('click', () => {
        isVideoMode = false;
        textModeBtn.classList.add('active');
        videoModeBtn.classList.remove('active');
        videoUploadArea.style.display = 'none';
        
        // Reset model options for text mode
        modelSelect.innerHTML = `
          <option value="claude" selected>Claude 4 Sonnet</option>
          <option value="gemini">Gemini 2.0 Flash</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
        `;
        console.log('🎯 Switched to text mode');
      });

      videoModeBtn.addEventListener('click', () => {
        isVideoMode = true;
        videoModeBtn.classList.add('active');
        textModeBtn.classList.remove('active');
        videoUploadArea.style.display = 'block';
        
        // Set video-capable models only
        modelSelect.innerHTML = `
          <option value="gemini" selected>Gemini 2.0 Flash</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
        `;
        console.log('🎥 Switched to video mode');
      });
    }

    // Video upload functionality
    const videoDropzone = document.getElementById('videoDropzone');
    const videoFileInput = document.getElementById('videoFileInput') as HTMLInputElement;
    const uploadedVideosList = document.getElementById('uploadedVideosList');

    if (videoDropzone && videoFileInput && uploadedVideosList) {
      // Drag and drop handlers
      videoDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoDropzone.classList.add('dragover');
      });

      videoDropzone.addEventListener('dragleave', () => {
        videoDropzone.classList.remove('dragover');
      });

      videoDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        videoDropzone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer?.files || []);
        handleVideoFiles(files);
      });

      videoDropzone.addEventListener('click', () => {
        videoFileInput.click();
      });

      videoFileInput.addEventListener('change', (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        handleVideoFiles(files);
      });
    }

    // Handle video file uploads
    const handleVideoFiles = async (files: File[]) => {
      for (const file of files) {
        if (!file.type.startsWith('video/')) {
          console.warn('⚠️ Skipping non-video file:', file.name);
          continue;
        }

        console.log('📹 Uploading video:', file.name);
        
        try {
          // Create FormData for upload
          const formData = new FormData();
          formData.append('video', file);
          formData.append('originalName', file.name);
          formData.append('mimeType', file.type);

          // Upload to backend
          const response = await fetch('/api/upload/video', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success) {
            const videoData = {
              id: result.fileId,
              name: file.name,
              uri: result.uri,
              state: result.state
            };
            
            uploadedVideos.push(videoData);
            updateVideosList();
            console.log('✅ Video uploaded:', file.name);
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          console.error('❌ Video upload error:', error);
          // Show error to user (you could add a toast notification here)
        }
      }
    };

    // Update the uploaded videos list display
    const updateVideosList = () => {
      if (!uploadedVideosList) return;

      if (uploadedVideos.length === 0) {
        uploadedVideosList.innerHTML = '';
        return;
      }

      uploadedVideosList.innerHTML = `
        <div class="uploaded-videos-header">
          <span>📹 Uploaded Videos (${uploadedVideos.length})</span>
        </div>
        ${uploadedVideos.map(video => `
          <div class="uploaded-video-item" data-video-id="${video.id}">
            <span class="video-name">${video.name}</span>
            <span class="video-state ${video.state.toLowerCase()}">${video.state}</span>
            <button class="remove-video-btn" onclick="removeVideo('${video.id}')">×</button>
          </div>
        `).join('')}
      `;
    };

    // Make removeVideo function globally available
    (window as any).removeVideo = (videoId: string) => {
      uploadedVideos = uploadedVideos.filter(v => v.id !== videoId);
      updateVideosList();
      console.log('🗑️ Removed video:', videoId);
    };

    // Modify the SimpleChatManager to handle video mode
    if ((window as any).simpleChatInstance) {
      const originalSendMessage = (window as any).simpleChatInstance.sendMessage;
      
      (window as any).simpleChatInstance.sendMessage = function(message: string) {
        if (isVideoMode && uploadedVideos.length > 0) {
          console.log('🎥 Sending video message with', uploadedVideos.length, 'videos');
          // Handle video message differently
          return this.sendVideoMessage(message, uploadedVideos);
        } else {
          return originalSendMessage.call(this, message);
        }
      };

      // Add video message handling
      (window as any).simpleChatInstance.sendVideoMessage = async function(message: string, videos: any[]) {
        try {
          // Use WebSocket for video chat
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'video_chat_start',
              message: message,
              videos: videos,
              model: (document.getElementById('simpleChatModel') as HTMLSelectElement)?.value || 'gemini'
            }));
          }
        } catch (error) {
          console.error('❌ Video message error:', error);
        }
      };
    }
  };

  return (
    <div className="tab-content">
      <div ref={containerRef}></div>
    </div>
  );
};

export default AIChatTab;