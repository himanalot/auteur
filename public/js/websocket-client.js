/**
 * WebSocket client for backend AI chat integration
 */
class WebSocketChatClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.backendUrls = [
            'ws://127.0.0.1:3001/api/chat/stream',  // Try 127.0.0.1 first for CEP
            'ws://localhost:3001/api/chat/stream'   // Fallback to localhost
        ];
        this.currentUrlIndex = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 2000;
        
        // Event handlers
        this.onMessage = null;
        this.onConnect = null;
        this.onDisconnect = null;
        this.onError = null;
        
        // CEP detection
        this.isCEP = this.detectCEP();
        console.log(`🔍 Environment: ${this.isCEP ? 'CEP Extension' : 'Browser'}`);
    }

    /**
     * Detect if running in CEP environment
     */
    detectCEP() {
        return !!(window.__adobe_cep__ || 
                 window.cep || 
                 document.location.protocol === 'file:' ||
                 navigator.userAgent.includes('CEF'));
    }

    /**
     * Get current backend URL
     */
    getCurrentUrl() {
        return this.backendUrls[this.currentUrlIndex];
    }

    /**
     * Try next URL in the list
     */
    tryNextUrl() {
        this.currentUrlIndex = (this.currentUrlIndex + 1) % this.backendUrls.length;
        return this.currentUrlIndex === 0; // true if we've cycled through all URLs
    }

    /**
     * Connect to the backend WebSocket server
     */
    async connect() {
        if (this.isConnected) {
            console.log('🔌 WebSocket already connected');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const attemptConnection = () => {
                try {
                    const url = this.getCurrentUrl();
                    console.log(`🔌 Connecting to WebSocket: ${url} (attempt ${this.reconnectAttempts + 1})`);
                    this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    if (this.onConnect) {
                        this.onConnect();
                    }
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (this.onMessage) {
                            this.onMessage(message);
                        }
                    } catch (error) {
                        console.error('❌ WebSocket message parse error:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log(`🔌 WebSocket disconnected: ${event.code} ${event.reason}`);
                    this.isConnected = false;
                    
                    if (this.onDisconnect) {
                        this.onDisconnect(event);
                    }
                    
                    // Attempt to reconnect
                    this.attemptReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error(`❌ WebSocket error on ${url}:`, error);
                    
                    // Try next URL if available
                    const cycledThrough = this.tryNextUrl();
                    if (!cycledThrough && this.reconnectAttempts < this.maxReconnectAttempts) {
                        console.log(`🔄 Trying next URL: ${this.getCurrentUrl()}`);
                        setTimeout(attemptConnection, 1000);
                        return;
                    }
                    
                    if (this.onError) {
                        this.onError(error);
                    }
                    reject(error);
                };

                } catch (error) {
                    console.error('❌ WebSocket connection error:', error);
                    
                    // Try next URL if available
                    const cycledThrough = this.tryNextUrl();
                    if (!cycledThrough && this.reconnectAttempts < this.maxReconnectAttempts) {
                        console.log(`🔄 Trying next URL: ${this.getCurrentUrl()}`);
                        setTimeout(attemptConnection, 1000);
                        return;
                    }
                    
                    reject(error);
                }
            };
            
            // Start the first connection attempt
            attemptConnection();
        });
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }

    /**
     * Send a message to the backend
     */
    send(message) {
        if (!this.isConnected || !this.ws) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        try {
            this.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('❌ WebSocket send error:', error);
            return false;
        }
    }

    /**
     * Start a chat conversation
     */
    startChat(message, model = 'claude', conversation = []) {
        return this.send({
            type: 'chat_start',
            data: {
                message,
                model,
                conversation
            }
        });
    }

    /**
     * Send a ping to test connection
     */
    ping() {
        return this.send({
            type: 'ping'
        });
    }

    /**
     * Attempt to reconnect to WebSocket
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        
        setTimeout(() => {
            this.connect().catch((error) => {
                console.error('❌ Reconnect failed:', error);
            });
        }, delay);
    }

    /**
     * Check if WebSocket is connected and ready
     */
    isReady() {
        return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Get connection status information
     */
    getStatus() {
        return {
            connected: this.isConnected,
            readyState: this.ws ? this.ws.readyState : -1,
            reconnectAttempts: this.reconnectAttempts,
            backendUrl: this.backendUrl
        };
    }
}

// Export for use in other modules
window.WebSocketChatClient = WebSocketChatClient;