/**
 * Video Chat Manager - Gemini video understanding interface
 * Supports video uploads, frame rate selection, and multiple Gemini models
 */

class VideoChatManager {
    constructor() {
        this.currentModel = 'gemini-2.0-flash';
        this.frameRate = 1; // Default 1 FPS
        this.chatHistory = [];
        this.isProcessing = false;
        this.elements = {};
        this.wsClient = null;
        this.currentStreamingDiv = null;
        this.uploadedFiles = []; // Track uploaded files
        
        this.init();
    }

    init() {
        console.log('🎥 Initializing Video Chat Manager...');
        
        // Get DOM elements
        this.elements = {
            messages: document.getElementById('videoChatMessages'),
            input: document.getElementById('videoChatInput'),
            sendBtn: document.getElementById('sendVideoChatMessage'),
            clearBtn: document.getElementById('clearVideoChat'),
            modelSelect: document.getElementById('videoChatModel'),
            frameRateSelect: document.getElementById('videoChatFrameRate'),
            fileInput: document.getElementById('videoChatFileInput'),
            uploadBtn: document.getElementById('videoChatUploadBtn'),
            fileList: document.getElementById('videoChatFileList'),
            status: document.getElementById('videoChatStatus')
        };

        // Initialize WebSocket client (shared with main chat)
        this.initWebSocket();

        // Bind events
        this.bindEvents();
        
        // Initialize chat history with welcome message
        this.chatHistory = [{
            role: 'assistant',
            content: "Hi! I'm a video-understanding AI assistant powered by Gemini. I can analyze videos, images, and answer questions about visual content. Upload a video file and ask me about what I see!"
        }];
        
        // Initialize UI state
        this.updateSendButton();
        this.updateStatus('Ready for video chat');
        
        console.log('✅ Video Chat Manager initialized');
    }

    initWebSocket() {
        console.log('🔌 Initializing WebSocket client for video chat...');
        
        // Check if WebSocketChatClient is available
        if (!window.WebSocketChatClient) {
            console.error('❌ WebSocketChatClient not available');
            this.updateStatus('WebSocket client unavailable');
            return;
        }
        
        // Reuse existing WebSocket client if available, or create new one
        if (window.simpleChatManager && window.simpleChatManager.wsClient) {
            this.wsClient = window.simpleChatManager.wsClient;
            console.log('♻️ Reusing existing WebSocket client');
        } else {
            this.wsClient = new WebSocketChatClient();
            
            // Set up event handlers
            this.wsClient.onMessage = (message) => {
                this.handleWebSocketMessage(message);
            };
            
            this.wsClient.onConnect = () => {
                console.log('✅ Video chat connected to backend');
                this.updateStatus('Connected to backend');
            };
            
            this.wsClient.onDisconnect = () => {
                console.log('🔌 Video chat disconnected from backend');
                this.updateStatus('Disconnected from backend');
            };
            
            this.wsClient.onError = (error) => {
                console.error('❌ Video chat WebSocket error:', error);
                this.updateStatus('Backend connection error');
            };
            
            // Connect to backend
            this.wsClient.connect().catch((error) => {
                console.error('❌ Failed to connect video chat to backend:', error);
                this.updateStatus('Backend unavailable');
            });
        }
    }

    handleWebSocketMessage(message) {
        const { type, data } = message;
        
        console.log(`📨 Video chat WebSocket message: ${type}`);
        
        switch (type) {
            case 'connection_established':
                console.log('🔌 Video chat WebSocket connection established');
                break;
                
            case 'chat_started':
                console.log(`🎥 Video chat started with ${data?.model || 'unknown'} model`);
                break;
                
            case 'content_delta':
                console.log('🔄 Content delta received:', message.content?.substring(0, 50));
                console.log('📍 Current streaming div exists:', !!this.currentStreamingDiv);
                if (this.currentStreamingDiv && message.content) {
                    this.updateStreamingMessage(this.currentStreamingDiv, message.content, false);
                } else if (!this.currentStreamingDiv && message.content) {
                    console.warn('⚠️ No streaming div - creating one now');
                    this.currentStreamingDiv = this.addStreamingAssistantMessage();
                    this.updateStreamingMessage(this.currentStreamingDiv, message.content, false);
                }
                break;
                
            case 'chat_complete':
                console.log('✅ CHAT COMPLETE - FULL MESSAGE OBJECT:', JSON.stringify(message, null, 2));
                console.log('✅ FULL RESPONSE CONTENT:', message.result?.content);
                console.log('📍 Current streaming div exists:', !!this.currentStreamingDiv);
                console.log('📍 Current chat history length:', this.chatHistory.length);

                if (message.result?.content) {
                    // Update UI
                    if (this.currentStreamingDiv) {
                        console.log('🔧 Updating streaming message in UI');
                        this.updateStreamingMessage(this.currentStreamingDiv, message.result.content, true);
                    } else {
                        console.warn('⚠️ No streaming div - adding message directly to UI');
                        this.addMessage('assistant', message.result.content);
                    }

                    // Add to chat history ONCE
                    this.chatHistory.push({ role: 'assistant', content: message.result.content });
                    console.log('📝 Added assistant message to history. New length:', this.chatHistory.length);
                    console.log('📜 CURRENT FULL HISTORY:', JSON.stringify(this.chatHistory, null, 2));
                } else {
                    console.error('❌ No content in chat_complete message');
                }

                // Clean up
                this.currentStreamingDiv = null;
                this.isProcessing = false;
                this.updateSendButton();
                this.updateStatus('Ready for video chat');
                break;
                
            case 'error':
                console.error('❌ Video chat backend error:', message.error);
                if (this.currentStreamingDiv) {
                    this.updateStreamingMessage(this.currentStreamingDiv, `❌ Error: ${message.error}`, true);
                }
                this.currentStreamingDiv = null;
                this.isProcessing = false;
                this.updateSendButton();
                this.updateStatus('Error occurred');
                break;
                
            case 'file_uploaded':
                console.log('📁 File uploaded successfully:', data);
                if (data.fileId) {
                    this.addUploadedFile(data);
                }
                break;
                
            case 'file_upload_error':
                console.error('❌ File upload error:', data.error);
                this.updateStatus(`Upload error: ${data.error}`);
                break;
                
            default:
                console.warn('❓ Unknown video chat WebSocket message type:', type);
        }
    }

    bindEvents() {
        // Check if elements exist before binding
        if (!this.elements.sendBtn || !this.elements.input) {
            console.error('❌ Cannot bind video chat events - elements not found');
            return;
        }
        
        // Send message button
        this.elements.sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.sendMessage();
        });

        // Enter key in input
        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Clear chat button
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => {
                this.clearChat();
            });
        }

        // Model selection
        if (this.elements.modelSelect) {
            this.elements.modelSelect.addEventListener('change', (e) => {
                this.currentModel = e.target.value;
                console.log(`🔄 Video model changed to: ${this.currentModel}`);
            });
        }

        // Frame rate selection
        if (this.elements.frameRateSelect) {
            this.elements.frameRateSelect.addEventListener('change', (e) => {
                this.frameRate = parseFloat(e.target.value);
                console.log(`🎞️ Frame rate changed to: ${this.frameRate} FPS`);
            });
        }

        // File upload button
        if (this.elements.uploadBtn) {
            this.elements.uploadBtn.addEventListener('click', () => {
                this.elements.fileInput.click();
            });
        }

        // File input change
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => this.uploadFile(file));
                // Reset file input so same file can be selected again
                e.target.value = '';
            });
        }

        // Auto-resize input and update send button
        this.elements.input.addEventListener('input', () => {
            this.autoResizeInput();
            this.updateSendButton();
        });
    }

    autoResizeInput() {
        const input = this.elements.input;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    updateSendButton() {
        const hasContent = this.elements.input.value.trim().length > 0;
        const shouldDisable = !hasContent || this.isProcessing;
        
        this.elements.sendBtn.disabled = shouldDisable;
        
        if (shouldDisable) {
            this.elements.sendBtn.setAttribute('disabled', 'disabled');
            this.elements.sendBtn.style.opacity = '0.5';
            this.elements.sendBtn.style.cursor = 'not-allowed';
        } else {
            this.elements.sendBtn.removeAttribute('disabled');
            this.elements.sendBtn.style.opacity = '1';
            this.elements.sendBtn.style.cursor = 'pointer';
        }
    }

    async uploadFile(file) {
        if (!file) return;

        // Validate file type
        const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            this.updateStatus(`Invalid file type: ${file.type}. Please upload a video or image file.`);
            return;
        }

        // Validate file size (2GB limit)
        const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
        if (file.size > maxSize) {
            this.updateStatus('File too large. Maximum size is 2GB.');
            return;
        }

        this.updateStatus(`Uploading ${file.name}...`);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('frameRate', this.frameRate.toString());

            // Upload via HTTP (not WebSocket due to file size)
            const response = await fetch('http://127.0.0.1:3001/api/upload/video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('📁 File upload result:', result);

            if (result.success) {
                this.addUploadedFile({
                    fileId: result.fileId,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    frameRate: this.frameRate
                });
                this.updateStatus(`${file.name} uploaded successfully`);
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            console.error('❌ File upload error:', error);
            this.updateStatus(`Upload failed: ${error.message}`);
        }
    }

    addUploadedFile(fileData) {
        this.uploadedFiles.push(fileData);

        // Add to file list UI
        const fileItem = document.createElement('div');
        fileItem.className = 'uploaded-file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-name">${fileData.fileName}</div>
                <div class="file-details">${this.formatFileSize(fileData.fileSize)} • ${fileData.frameRate} FPS</div>
            </div>
            <button class="remove-file-btn" onclick="videoChatManager.removeFile('${fileData.fileId}')">×</button>
        `;

        this.elements.fileList.appendChild(fileItem);

        // Hide upload area to save space
        const uploadArea = document.getElementById('videoChatUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }
    }

    removeFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.fileId !== fileId);

        // Remove from UI
        const fileItems = this.elements.fileList.children;
        for (let item of fileItems) {
            if (item.querySelector('.remove-file-btn').onclick.toString().includes(fileId)) {
                item.remove();
                break;
            }
        }

        // Show upload area again if no files remain
        if (this.uploadedFiles.length === 0) {
            const uploadArea = document.getElementById('videoChatUploadArea');
            if (uploadArea) {
                uploadArea.style.display = 'flex';
            }
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async sendMessage() {
        const message = this.elements.input.value.trim();
        if (!message || this.isProcessing) return;

        // Check if WebSocket is connected
        if (!this.wsClient || !this.wsClient.isReady()) {
            console.error('❌ Backend not connected');
            this.updateStatus('Backend not connected - check if server is running');
            return;
        }

        try {
            this.isProcessing = true;
            this.elements.sendBtn.disabled = true;
            this.updateStatus('Processing...');

            // Add user message to chat UI
            this.addMessage('user', message);
            this.elements.input.value = '';
            this.autoResizeInput();
            this.updateSendButton();

            // Create streaming assistant message
            this.currentStreamingDiv = this.addStreamingAssistantMessage();

            // Prepare video chat data - send history WITHOUT current message
            // Create a COPY of the history to avoid reference issues
            const conversationCopy = JSON.parse(JSON.stringify(this.chatHistory));
            
            const chatData = {
                message,
                model: this.currentModel,
                conversation: conversationCopy, // Send copy of history before current message
                files: this.uploadedFiles,
                frameRate: this.frameRate
            };

            console.log(`💬 FULL CONVERSATION BEING SENT (${conversationCopy.length} messages):`,
                JSON.stringify(conversationCopy, null, 2));
            console.log(`💬 Current message being sent:`, message);

            // Add current message to history AFTER creating the copy
            this.chatHistory.push({ role: 'user', content: message });

            // Send message to backend via WebSocket
            const success = this.wsClient.send({
                type: 'video_chat_start',
                data: chatData
            });
            
            if (!success) {
                throw new Error('Failed to send message to backend');
            }

        } catch (error) {
            console.error('Video chat error:', error);
            if (this.currentStreamingDiv) {
                this.updateStreamingMessage(this.currentStreamingDiv, `❌ Error: ${error.message}`, true);
            } else {
                this.addMessage('assistant', `❌ Error: ${error.message}`);
            }
            this.updateStatus('Error occurred');
            this.currentStreamingDiv = null;
            this.isProcessing = false;
            this.updateSendButton();
        }
    }

    addMessage(role, content) {
        console.log(`📝 Adding ${role} message:`, content?.substring(0, 100));
        console.log('📍 Messages container exists:', !!this.elements.messages);

        const messageDiv = document.createElement('div');
        messageDiv.className = `video-chat-message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🎥';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (role === 'assistant') {
            messageContent.innerHTML = `<strong>Assistant:</strong> ${this.formatMessage(content)}`;
        } else {
            messageContent.innerHTML = `<strong>You:</strong> ${this.formatMessage(content)}`;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        this.elements.messages.appendChild(messageDiv);

        console.log('✅ Message added to DOM, total messages:', this.elements.messages.children.length);

        // Scroll to bottom
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    addStreamingAssistantMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'video-chat-message assistant';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🎥';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = '<strong>Assistant:</strong> <span class="streaming-cursor">▌</span>';

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        this.elements.messages.appendChild(messageDiv);

        // Scroll to bottom
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

        return messageContent;
    }

    updateStreamingMessage(messageElement, content, isComplete = false) {
        const prefix = messageElement.innerHTML.split(':</strong>')[0] + ':</strong> ';
        
        if (isComplete) {
            messageElement.innerHTML = prefix + this.formatMessage(content);
        } else {
            messageElement.innerHTML = prefix + this.formatMessage(content) + '<span class="streaming-cursor">▌</span>';
        }

        // Scroll to bottom
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    formatMessage(content) {
        // Basic markdown formatting
        let formatted = content;
        
        // Code blocks
        formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code style="background: #1a1a1a; padding: 12px; border-radius: 6px; display: block; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1);">$2</code></pre>');
        
        // Bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: rgba(255,255,255,0.9);">$1</strong>');
        
        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #2a2a2a; color: #f8f8f2; padding: 2px 6px; border-radius: 4px;">$1</code>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    clearChat() {
        // Clear messages except the welcome message
        this.elements.messages.innerHTML = `
            <div class="video-chat-message assistant">
                <div class="message-avatar">🎥</div>
                <div class="message-content">
                    <strong>Assistant:</strong> Hi! I'm a video-understanding AI assistant powered by Gemini. I can analyze videos, images, and answer questions about visual content. Upload a video file and ask me about what I see!
                </div>
            </div>
        `;

        // Reset chat history
        this.chatHistory = [{
            role: 'assistant',
            content: "Hi! I'm a video-understanding AI assistant powered by Gemini. I can analyze videos, images, and answer questions about visual content. Upload a video file and ask me about what I see!"
        }];

        // Clear uploaded files
        this.uploadedFiles = [];
        this.elements.fileList.innerHTML = '';

        // Show upload area again
        const uploadArea = document.getElementById('videoChatUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'flex';
        }

        this.updateStatus('Ready for video chat');
        console.log('🗑️ Video chat cleared');
    }

    updateStatus(message) {
        if (this.elements.status) {
            this.elements.status.textContent = message;
        }
    }
}

// Export for use in main.js
window.VideoChatManager = VideoChatManager;