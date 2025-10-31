/**
 * Simple AI Chat System - Clean conversation interface with RAG tools
 * Cursor-style intelligent tool usage
 */

class SimpleChatManager {
    constructor() {
        this.currentModel = 'claude';
        this.chatHistory = [];
        this.isProcessing = false;
        this.elements = {};
        this.ragTool = null;
        this.maxIterations = 1;
        this.maxToolCallsPerIteration = 5;
        this.maxTotalToolCalls = 10;
        
        // WebSocket client for backend communication
        this.wsClient = null;
        this.currentStreamingDiv = null;
        
        this.init();
    }

    init() {
        console.log('🤖 Initializing Simple Chat Manager...');
        
        // Add error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && 
                (event.reason.message.includes('tx_attempts_exceeded') || 
                 event.reason.message.includes('Failed to initialize messaging') ||
                 event.reason.message.includes('chrome-extension://') ||
                 event.reason.message.includes('message channel closed') ||
                 event.reason.message.includes('listener indicated an asynchronous response'))) {
                // Suppress Chrome extension messaging errors
                event.preventDefault();
                console.warn('Chrome extension messaging error suppressed:', event.reason.message);
            }
        });
        
        // Add general error handler for Chrome extension errors
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message && 
                (event.error.message.includes('tx_attempts_exceeded') ||
                 event.error.message.includes('Failed to initialize messaging') ||
                 event.error.message.includes('message channel closed') ||
                 event.error.message.includes('listener indicated an asynchronous response') ||
                 event.filename && event.filename.includes('chrome-extension://'))) {
                event.preventDefault();
                console.warn('Chrome extension error suppressed:', event.error.message);
            }
        });
        
        // Override console.error to suppress Chrome extension errors
        const originalConsoleError = console.error;
        console.error = function(...args) {
            const message = args.join(' ');
            if (message.includes('chrome-extension://') ||
                message.includes('tx_attempts_exceeded') ||
                message.includes('message channel closed') ||
                message.includes('listener indicated an asynchronous response')) {
                // Suppress Chrome extension errors in console
                console.warn('Chrome extension error suppressed:', message);
                return;
            }
            originalConsoleError.apply(console, args);
        };
        
        // Get DOM elements
        this.elements = {
            messages: document.getElementById('simpleChatMessages'),
            input: document.getElementById('simpleChatInput'),
            sendBtn: document.getElementById('sendSimpleChatMessage'),
            clearBtn: document.getElementById('clearSimpleChat'),
            modelSelect: document.getElementById('simpleChatModel'),
            status: document.getElementById('simpleChatStatus')
        };
        

        // Initialize WebSocket client
        this.initWebSocket();

        // Initialize RAG tool if available (for backwards compatibility)
        if (window.RAGDocumentationTool) {
            this.ragTool = new RAGDocumentationTool();
            console.log('🔧 RAG tool initialized (fallback)');
        }

        // Bind events
        this.bindEvents();
        
        // Initialize chat history with welcome message
        this.chatHistory = [{
            role: 'assistant',
            content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
        }];
        
        // Initialize send button state after events are bound
        this.updateSendButton();
        
        this.updateStatus('Ready to chat');
        console.log('✅ Simple Chat Manager initialized');
    }

    async testBackendConnectivity() {
        console.log('🧪 Testing backend connectivity...');
        
        const urls = [
            'http://127.0.0.1:3001/api/test-connection',
            'http://localhost:3001/api/test-connection'
        ];
        
        for (const url of urls) {
            try {
                console.log(`🧪 Testing HTTP connection to: ${url}`);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ HTTP connection successful to ${url}:`, data);
                    return { success: true, url, data };
                } else {
                    console.warn(`⚠️ HTTP connection failed to ${url}: ${response.status}`);
                }
            } catch (error) {
                console.error(`❌ HTTP connection error to ${url}:`, error);
            }
        }
        
        return { success: false, error: 'All HTTP connectivity tests failed' };
    }

    initWebSocket() {
        console.log('🔌 Initializing WebSocket client...');
        
        // First test basic HTTP connectivity
        this.testBackendConnectivity().then(result => {
            if (result.success) {
                console.log('✅ Backend HTTP connectivity confirmed');
            } else {
                console.error('❌ Backend HTTP connectivity failed');
                this.updateStatus('Backend server unreachable');
                return;
            }
        });
        
        // Check if WebSocketChatClient is available
        if (!window.WebSocketChatClient) {
            console.error('❌ WebSocketChatClient not available');
            return;
        }
        
        this.wsClient = new WebSocketChatClient();
        
        // Set up event handlers
        this.wsClient.onMessage = (message) => {
            this.handleWebSocketMessage(message);
        };
        
        this.wsClient.onConnect = () => {
            console.log('✅ Connected to backend');
            this.updateStatus('Connected to backend');
        };
        
        this.wsClient.onDisconnect = () => {
            console.log('🔌 Disconnected from backend');
            this.updateStatus('Disconnected from backend');
        };
        
        this.wsClient.onError = (error) => {
            console.error('❌ WebSocket error:', error);
            console.error('🔍 Environment details:', {
                userAgent: navigator.userAgent,
                protocol: document.location.protocol,
                href: document.location.href,
                isCEP: this.wsClient?.isCEP || 'unknown'
            });
            this.updateStatus('Backend connection error - check console');
        };
        
        // Connect to backend
        this.wsClient.connect().catch((error) => {
            console.error('❌ Failed to connect to backend:', error);
            console.error('🔍 Connection attempt details:', {
                urls: this.wsClient?.backendUrls || [],
                currentIndex: this.wsClient?.currentUrlIndex || 0,
                isCEP: this.wsClient?.isCEP || 'unknown',
                environment: {
                    userAgent: navigator.userAgent,
                    protocol: document.location.protocol,
                    href: document.location.href
                }
            });
            this.updateStatus('Backend unavailable - check server and console');
        });
    }

    handleWebSocketMessage(message) {
        const { type, data, timestamp } = message;
        
        console.log(`📨 WebSocket message: ${type}`);
        
        switch (type) {
            case 'connection_established':
                console.log('🔌 WebSocket connection established');
                break;
                
            case 'chat_started':
                console.log(`🤖 Chat started with ${data?.model || 'unknown'} model`);
                break;
                
            case 'content_delta':
                if (this.currentStreamingDiv && message.content) {
                    this.updateStreamingMessage(this.currentStreamingDiv, message.content, false);
                }
                break;
                
            case 'tool_call_start':
                if (message.toolCalls && this.currentStreamingDiv) {
                    // Add search indicators for each tool call
                    message.toolCalls.forEach(toolCall => {
                        if (toolCall.name === 'search_ae_documentation') {
                            this.addSearchIndicatorAfterContent(this.currentStreamingDiv, toolCall.query);
                        }
                    });
                }
                break;
                
            case 'tool_call_complete':
                if (message.toolCall && message.result && this.currentStreamingDiv) {
                    // Update search indicator with results
                    this.updateSearchIndicator(this.currentStreamingDiv, message.toolCall.query, message.result);
                }
                break;
                
            case 'chat_complete':
                if (this.currentStreamingDiv && message.result?.content) {
                    this.updateStreamingMessage(this.currentStreamingDiv, message.result.content, true);
                    
                    // Add to chat history
                    this.chatHistory.push({ role: 'assistant', content: message.result.content });
                }
                
                // Clean up
                this.currentStreamingDiv = null;
                this.isProcessing = false;
                this.updateSendButton();
                this.updateStatus('Ready to chat');
                break;
                
            case 'error':
                console.error('❌ Backend error:', message.error);
                if (this.currentStreamingDiv) {
                    this.updateStreamingMessage(this.currentStreamingDiv, `❌ Error: ${message.error}`, true);
                }
                this.currentStreamingDiv = null;
                this.isProcessing = false;
                this.updateSendButton();
                this.updateStatus('Error occurred');
                break;
                
            case 'pong':
                console.log('🏓 Pong received');
                break;
                
            default:
                console.warn('❓ Unknown WebSocket message type:', type);
        }
    }

    bindEvents() {
        // Check if elements exist before binding
        if (!this.elements.sendBtn || !this.elements.input) {
            console.error('❌ Cannot bind events - elements not found');
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
                console.log(`🔄 Model changed to: ${this.currentModel}`);
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
        input.style.height = Math.min(input.scrollHeight, 258) + 'px';
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
            this.updateStatus('Thinking...');

            // Add user message to chat
            this.addMessage('user', message);
            this.elements.input.value = '';
            this.autoResizeInput();
            this.updateSendButton();

            // Add to history
            this.chatHistory.push({ role: 'user', content: message });

            // Create streaming assistant message
            this.currentStreamingDiv = this.addStreamingAssistantMessage();

            // Send message to backend via WebSocket
            const success = this.wsClient.startChat(message, this.currentModel, this.chatHistory);
            
            if (!success) {
                throw new Error('Failed to send message to backend');
            }

        } catch (error) {
            console.error('Chat error:', error);
            if (this.currentStreamingDiv) {
                this.updateStreamingMessage(this.currentStreamingDiv, `❌ Unexpected error: ${error.message}`, true);
            } else {
                this.addMessage('assistant', `❌ Unexpected error: ${error.message}`);
            }
            this.updateStatus('Error occurred');
            this.currentStreamingDiv = null;
            this.isProcessing = false;
            this.updateSendButton();
        }
    }

    async runStreamingAgent(userMessage) {
        let assistantMessageDiv = null;
        try {
            // Add initial assistant message
            assistantMessageDiv = this.addStreamingAssistantMessage();
            let fullResponse = '';
            let toolCallsData = [];
            
            for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
                console.log(`🔄 Agent iteration ${iteration}`);
                this.updateStatus(`Thinking... (iteration ${iteration})`);
                
                // Build conversation context
                const conversation = this.buildConversation(userMessage, toolCallsData, iteration);
                
                // Get AI decision
                const decision = await this.callAIWithTools(conversation, assistantMessageDiv);
                console.log(`🧠 AI decision (iteration ${iteration}):`, decision);
                
                if (!decision.success) {
                    this.updateStreamingMessage(assistantMessageDiv, `❌ Error: ${decision.error}`, true);
                    this.updateStatus('Error occurred');
                    return;
                }
                
                // If there's content, add it to response
                if (decision.content && !decision.toolCalls?.length) {
                    fullResponse += decision.content;
                    this.updateStreamingMessage(assistantMessageDiv, fullResponse, true);
                    this.chatHistory.push({ role: 'assistant', content: fullResponse });
                    this.updateStatus('Ready to chat');
                    return;
                }
                
                // Execute tool calls if any
                if (decision.toolCalls && decision.toolCalls.length > 0) {
                    let totalToolCalls = toolCallsData.length;
                    const toolResults = [];
                    
                    for (let i = 0; i < Math.min(decision.toolCalls.length, this.maxToolCallsPerIteration); i++) {
                        if (totalToolCalls >= this.maxTotalToolCalls) break;
                        
                        const toolCall = decision.toolCalls[i];
                        console.log(`🔧 Calling tool: ${toolCall.name} with query: ${toolCall.query}`);
                        
                        // Tool call will be displayed via streaming events
                        
                        // Update status
                        this.updateStatus(`Searching documentation... (${toolCall.query})`);
                        
                        // Show search indicator in the message - add it after any existing text content
                        this.addSearchIndicatorAfterContent(assistantMessageDiv, toolCall.query);
                        
                        // Execute tool call
                        const toolResult = await this.executeToolCall(toolCall);
                        console.log('🔧 Tool result:', toolResult);
                        
                        // Add ID from Claude's tool call for proper response
                        toolResult.id = toolCall.id;
                        toolResults.push(toolResult);
                        
                        // Update search indicator with results
                        this.updateSearchIndicator(assistantMessageDiv, toolCall.query, toolResult);
                        
                        // Add to tool calls data
                        toolCallsData.push({
                            iteration,
                            toolCall,
                            result: toolResult,
                            timestamp: new Date().toISOString()
                        });
                        
                        totalToolCalls++;
                    }
                    
                    // After executing tools, we need to process the results
                    if (toolResults.length > 0) {
                        this.updateStatus('Processing tool results...');
                        
                        // Check if we're using Claude (either explicitly set or if we used Claude's tool format)
                        const isUsingClaude = this.currentModel === 'claude' || (decision.toolCalls && decision.toolCalls[0]?.id);
                        
                        if (isUsingClaude) {
                            // PRESERVE the initial content that Claude generated before tool calls
                            if (decision.content && decision.content.trim()) {
                                fullResponse += decision.content;
                                this.updateStreamingMessage(assistantMessageDiv, fullResponse, false);
                            }
                            
                            // Build message history for Claude tool results call
                            // Include any text content before tool calls
                            const assistantContent = [];
                            
                            // Add any text content from the assistant's response before tool calls
                            if (decision.content && decision.content.trim()) {
                                assistantContent.push({
                                    type: 'text',
                                    text: decision.content.trim()
                                });
                            }
                            
                            // Add the tool calls
                            decision.toolCalls.forEach(tc => {
                                assistantContent.push({
                                    type: 'tool_use',
                                    id: tc.id,
                                    name: tc.name,
                                    input: { query: tc.query }
                                });
                            });
                            
                            const originalMessages = [{
                                role: 'user',
                                content: userMessage
                            }, {
                                role: 'assistant',
                                content: assistantContent
                            }];
                            
                            const followUpResult = await this.callClaudeWithToolResults(originalMessages, toolResults, assistantMessageDiv, fullResponse);
                            
                            if (followUpResult.success) {
                                // The streaming has already updated the message, just finalize it
                                const finalContent = fullResponse.trim() ? 
                                    fullResponse + '\n\n' + followUpResult.content : 
                                    followUpResult.content;
                                
                                this.updateStreamingMessage(assistantMessageDiv, finalContent, true);
                                this.chatHistory.push({ role: 'assistant', content: finalContent });
                                this.updateStatus('Ready to chat');
                                return;
                            }
                        } else {
                            // For non-Claude models, we need to generate a response based on tool results
                            console.log('🔧 Processing tool results for non-Claude model');
                            
                            // Build a prompt with the tool results
                            const toolResultsPrompt = this.buildFinalConversation(userMessage, toolCallsData);
                            const finalResponse = await this.callAIFinal(toolResultsPrompt, assistantMessageDiv);
                            
                            if (finalResponse.success) {
                                fullResponse = finalResponse.content;
                                this.updateStreamingMessage(assistantMessageDiv, fullResponse, true);
                                this.chatHistory.push({ role: 'assistant', content: fullResponse });
                                this.updateStatus('Ready to chat');
                                return;
                            }
                        }
                    }
                    
                    // Add any thinking text from this iteration
                    if (decision.content && decision.content.trim()) {
                        fullResponse += decision.content;
                        this.updateStreamingMessage(assistantMessageDiv, fullResponse, false);
                    }
                }
                
                // Check if we should continue
                if (decision.finalAnswer) {
                    fullResponse += decision.finalAnswer;
                    this.updateStreamingMessage(assistantMessageDiv, fullResponse, true);
                    this.chatHistory.push({ role: 'assistant', content: fullResponse });
                    this.updateStatus('Ready to chat');
                    return;
                }
                
                // If we just made tool calls but no final answer, continue to next iteration
                if (decision.toolCalls && decision.toolCalls.length > 0) {
                    continue;
                }
            }
            
            // Generate final response in a NEW message box
            console.log('🔄 Final response generation');
            this.updateStatus('Generating final response...');
            
            // Complete the original message if it has content
            if (fullResponse.trim()) {
                this.updateStreamingMessage(assistantMessageDiv, fullResponse, true);
            } else {
                // Remove the empty original message
                assistantMessageDiv.parentElement.remove();
            }
            
            // Create new message for final response
            const finalMessageDiv = this.addStreamingAssistantMessage();
            
            const finalConversation = this.buildFinalConversation(userMessage, toolCallsData);
            const finalResponse = await this.callAIFinal(finalConversation, finalMessageDiv);
            
            if (finalResponse.success) {
                this.updateStreamingMessage(finalMessageDiv, finalResponse.content, true);
                this.chatHistory.push({ role: 'assistant', content: finalResponse.content });
                this.updateStatus('Ready to chat');
            } else {
                this.updateStreamingMessage(finalMessageDiv, `❌ Error: ${finalResponse.error}`, true);
                this.updateStatus('Error occurred');
            }
            
        } catch (error) {
            console.error('Streaming agent error:', error);
            // Try to update the streaming message first, fall back to regular message
            try {
                if (assistantMessageDiv) {
                    this.updateStreamingMessage(assistantMessageDiv, `❌ Unexpected error: ${error.message}`, true);
                } else {
                    this.addMessage('assistant', `❌ Unexpected error: ${error.message}`);
                }
            } catch (updateError) {
                // If updating fails, just add a new message
                this.addMessage('assistant', `❌ Unexpected error: ${error.message}`);
            }
            this.updateStatus('Error occurred');
        } finally {
            this.isProcessing = false;
            this.updateSendButton();
        }
    }

    async runAgent(userMessage) {
        try {
            let totalToolCalls = 0;
            let allToolResults = [];
            
            for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
                console.log(`🔄 Agent iteration ${iteration}`);
                this.updateStatus(`Thinking... (iteration ${iteration})`);
                
                // Build conversation context including tool results
                const conversation = this.buildConversation(userMessage, allToolResults, iteration);
                
                // Call AI with tool decision
                const decision = await this.callAIWithTools(conversation);
                console.log(`🧠 AI decision (iteration ${iteration}):`, decision);
                
                if (!decision.success) {
                    console.error(`❌ AI decision failed:`, decision.error);
                    return decision;
                }
                
                // If no tool calls, return the response
                if (!decision.toolCalls || decision.toolCalls.length === 0) {
                    return {
                        success: true,
                        content: decision.content,
                        toolResults: allToolResults
                    };
                }
                
                // Execute tool calls
                const iterationToolCalls = Math.min(decision.toolCalls.length, this.maxToolCallsPerIteration);
                for (let i = 0; i < iterationToolCalls; i++) {
                    if (totalToolCalls >= this.maxTotalToolCalls) {
                        console.warn('🚫 Reached max total tool calls limit');
                        break;
                    }
                    
                    const toolCall = decision.toolCalls[i];
                    console.log(`🔧 Calling tool: ${toolCall.name}`);
                    this.updateStatus(`Searching documentation... (${toolCall.query})`);
                    
                    const toolResult = await this.executeToolCall(toolCall);
                    console.log('🔧 Tool result:', toolResult);
                    
                    allToolResults.push({
                        iteration,
                        toolCall,
                        result: toolResult,
                        timestamp: new Date().toISOString()
                    });
                    
                    totalToolCalls++;
                }
                
                // If we have a final answer after tool calls, return it
                if (decision.finalAnswer && decision.finalAnswer.trim()) {
                    return {
                        success: true,
                        content: decision.finalAnswer,
                        toolResults: allToolResults
                    };
                }
            }
            
            // If we've exhausted iterations, make one final call for a response
            console.log('🔄 Final response generation');
            this.updateStatus('Generating final response...');
            
            const finalConversation = this.buildFinalConversation(userMessage, allToolResults);
            const finalResponse = await this.callAIFinal(finalConversation);
            
            console.log('🔍 Final response result:', finalResponse);
            
            if (!finalResponse.success) {
                console.error('❌ Final response failed:', finalResponse.error);
                return {
                    success: false,
                    error: finalResponse.error || 'Failed to generate final response'
                };
            }
            
            return {
                success: true,
                content: finalResponse.content || 'I apologize, but I had trouble generating a complete response.',
                toolResults: allToolResults
            };
            
        } catch (error) {
            console.error('Agent error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    buildConversation(userMessage, toolResults = [], iteration = 1) {
        const systemPrompt = `You are Cursor, an AI assistant paired with a human software engineer. You are helping them with After Effects ExtendScript development.

You have access to a comprehensive After Effects documentation search tool that can find specific API information, code examples, and technical details.

<important>
You should proactively use the documentation search tool for most After Effects technical questions to provide accurate, detailed information with specific API details and code examples.

For simple questions like "hi", "hello", "thanks", respond directly without using tools.
For technical questions about After Effects, including specific terms, API names, effect names, property names (like "adbe glo2"), layers, effects, compositions, scripting, etc., you should search the documentation when you need specific details.

Default approach for technical questions:
- Search documentation when users mention specific After Effects terms or concepts that need verification
- Search multiple times with different queries to ensure comprehensive coverage
- Provide specific API details, code examples, and accurate information from the documentation
- If you can't find something after searching, then mention it wasn't found in the documentation
</important>

<tool_instructions>
Use the search_ae_documentation tool for After Effects technical questions when you need specific details. Examples:
- User asks about "layers" → Search for layer creation, layer properties, layer types
- User asks about "effects" → Search for adding effects, effect properties, effect removal  
- User asks about "adbe glo2" → Search for "adbe glo2", "glow effect", "effect match names"
- User asks about specific terms → Search for that exact term and related concepts
- User asks for help with After Effects scripting → Search for relevant APIs and examples

When using the search_ae_documentation tool:
1. Search when you need specific API details or verification of technical information
2. Make multiple focused searches to cover different aspects of the topic
3. Search for exact terms mentioned by the user
4. Search for related concepts and synonyms
5. Provide answers based on both your knowledge and documentation search results
</tool_instructions>

<conversation_context>
Recent conversation:
${this.chatHistory.slice(-4).map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`).join('\n')}

Current message: ${userMessage}
</conversation_context>

${toolResults.length > 0 ? `<tool_results>
Previous documentation searches in this conversation:
${toolResults.map(tr => `
Search: ${tr.toolCall.query}
Results: ${tr.result.success ? `Found ${tr.result.resultCount || 0} relevant sections` : 'Failed'}
${tr.result.documentation ? `Documentation: ${tr.result.documentation.substring(0, 200)}...` : ''}
`).join('\n')}
</tool_results>` : ''}

Respond naturally and helpfully. If you need to search the documentation, use the search_ae_documentation tool. Otherwise, provide a direct response.`;

        return systemPrompt;
    }

    buildFinalConversation(userMessage, toolResults = []) {
        const systemPrompt = `You are an expert After Effects ExtendScript assistant. Based on the documentation searches performed, provide a comprehensive and helpful response.

User's question: ${userMessage}

Documentation found:
${toolResults.map(tr => {
    console.log('🔍 Tool result for final conversation:', tr);
    return `
Query: ${tr.toolCall.query}
${tr.result && tr.result.success ? `Documentation: ${tr.result.documentation || tr.result.content || 'No content available'}` : 'No results found'}
`;
}).join('\n')}

Provide a complete, helpful response based on the documentation found. Include specific code examples and API references when relevant.`;

        console.log('📝 Final conversation prompt:', systemPrompt);
        return systemPrompt;
    }

    async callAIWithTools(prompt, streamingMessageDiv = null) {
        if (this.currentModel === 'claude') {
            return await this.callClaudeWithTools(prompt, streamingMessageDiv);
        }
        
        try {
            const modelName = this.currentModel === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp';
            
            const systemInstruction = `${prompt}

For After Effects technical questions, use the documentation search tool when you need specific details or verification.

To search documentation, use this format:
TOOL_CALL: search_ae_documentation
QUERY: [specific search query]

For comprehensive answers, make multiple searches:
TOOL_CALL: search_ae_documentation
QUERY: [exact term user mentioned]

TOOL_CALL: search_ae_documentation
QUERY: [related concept or synonym]

TOOL_CALL: search_ae_documentation
QUERY: [broader category if applicable]

Example: User asks "tell me about adbe glo2"
TOOL_CALL: search_ae_documentation
QUERY: adbe glo2

TOOL_CALL: search_ae_documentation
QUERY: glow effect match name

TOOL_CALL: search_ae_documentation
QUERY: effect match names

Use your judgment about when searching will help provide more accurate and detailed information.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: systemInstruction }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                        topP: 0.9
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
                throw new Error('No response from Gemini');
            }

            // Parse tool calls from response
            const toolCalls = this.parseToolCalls(content);
            
            return {
                success: true,
                content: content.trim(),
                toolCalls: toolCalls,
                finalAnswer: toolCalls.length === 0 ? content.trim() : null
            };

        } catch (error) {
            console.error('Gemini call error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async callAIFinal(prompt, streamingMessageDiv = null) {
        if (this.currentModel === 'claude') {
            return await this.callClaudeFinal(prompt, streamingMessageDiv);
        }
        
        try {
            const modelName = this.currentModel === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp';
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                        topP: 0.9
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
                throw new Error('No response from Gemini');
            }

            return {
                success: true,
                content: content.trim()
            };

        } catch (error) {
            console.error('Gemini final call error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async callClaudeWithTools(prompt, streamingMessageDiv = null) {
        try {

            const systemPrompt = `${prompt}

For After Effects technical questions, use the documentation search tool when you need specific details or verification.

To search documentation, use this format:
TOOL_CALL: search_ae_documentation
QUERY: [specific search query]

For comprehensive answers, make multiple searches:
TOOL_CALL: search_ae_documentation
QUERY: [exact term user mentioned]

TOOL_CALL: search_ae_documentation
QUERY: [related concept or synonym]

TOOL_CALL: search_ae_documentation
QUERY: [broader category if applicable]

Example: User asks "tell me about adbe glo2"
TOOL_CALL: search_ae_documentation
QUERY: adbe glo2

TOOL_CALL: search_ae_documentation
QUERY: glow effect match name

TOOL_CALL: search_ae_documentation
QUERY: effect match names

Use your judgment about when searching will help provide more accurate and detailed information.`;

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 8192,
                    temperature: 0.7,
                    stream: true,
                    system: systemPrompt,
                    tools: [{
                        name: 'search_ae_documentation',
                        description: 'Search the comprehensive After Effects ExtendScript documentation database for specific API information, code examples, property names, method signatures, and technical details. Use this when users ask about After Effects scripting, automation, effects, layers, compositions, or any AE-related programming topics. The tool searches through official Adobe documentation, API references, and scripting guides.',
                        input_schema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'The search query for After Effects documentation. Should be specific terms like "Layer.addProperty", "CompItem.layers", effect names like "adbe glo2", or concepts like "keyframe animation".'
                                }
                            },
                            required: ['query']
                        }
                    }],
                    messages: [{
                        role: 'user',
                        content: 'Please respond to the user query above.'
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Claude API error: ${response.status} - ${errorData}`);
            }

            // Handle streaming response with fine-grained tool streaming
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let stopReason = null;
            let toolUses = [];
            let toolUsesByIndex = {}; // Map content block index to tool use

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            
                            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                fullContent += parsed.delta.text;
                                
                                // Update streaming display if provided
                                if (streamingMessageDiv) {
                                    this.updateStreamingMessage(streamingMessageDiv, fullContent, false);
                                }
                            } else if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                                // Tool use started - with fine-grained streaming, input should be more complete
                                console.log('🔧 Tool start event (fine-grained):', parsed.content_block);
                                console.log('🔧 Tool at content block index:', parsed.index);
                                console.log('🔧 Raw input object:', JSON.stringify(parsed.content_block.input, null, 2));
                                console.log('🔧 Input keys:', Object.keys(parsed.content_block.input || {}));
                                
                                const toolUse = {
                                    id: parsed.content_block.id,
                                    name: parsed.content_block.name,
                                    input: parsed.content_block.input || {},
                                    inputJson: '', // For accumulating delta input
                                    contentBlockIndex: parsed.index
                                };
                                
                                console.log('🔧 Created tool use object:', JSON.stringify(toolUse, null, 2));
                                toolUses.push(toolUse);
                                toolUsesByIndex[parsed.index] = toolUse; // Store by content block index
                                
                                // Don't show tool calls in UI to avoid visual gaps/flashing
                                // Tool calls happen in background and results are appended seamlessly
                            } else if (parsed.type === 'content_block_delta') {
                                // Handle delta events that might contain tool input
                                console.log('🔧 Delta event details:', JSON.stringify(parsed, null, 2));
                                console.log('🔧 Delta type:', parsed.delta?.type);
                                console.log('🔧 Delta keys:', Object.keys(parsed.delta || {}));
                                
                                const currentContentBlockIndex = parsed.index;
                                console.log('🔧 Content block index:', currentContentBlockIndex);
                                console.log('🔧 Available tool indices:', Object.keys(toolUsesByIndex));
                                
                                const currentTool = toolUsesByIndex[currentContentBlockIndex];
                                if (currentTool) {
                                    console.log('🔧 Found tool at content block index:', currentContentBlockIndex);
                                    // Check if this delta contains tool input
                                    if (parsed.delta?.type === 'input_json_delta') {
                                        console.log('🔧 Found input_json_delta:', parsed.delta.partial_json);
                                        
                                        // Initialize inputJson if not exists
                                        if (!currentTool.inputJson) {
                                            currentTool.inputJson = '';
                                            console.log('🔧 Initialized inputJson');
                                        }
                                        
                                        // Accumulate the JSON
                                        currentTool.inputJson += parsed.delta.partial_json;
                                        console.log('🔧 Accumulated JSON so far:', currentTool.inputJson);
                                        
                                        // Try to parse and update input if we have a complete JSON
                                        try {
                                            const parsedInput = JSON.parse(currentTool.inputJson);
                                            currentTool.input = {...currentTool.input, ...parsedInput};
                                            console.log('🔧 SUCCESS - Updated tool input:', currentTool.input);
                                        } catch (e) {
                                            // JSON not complete yet, continue accumulating
                                            console.log('🔧 JSON not complete yet, continuing...', e.message);
                                        }
                                    } else {
                                        console.log('🔧 Not an input_json_delta, type is:', parsed.delta?.type);
                                    }
                                } else {
                                    console.log('🔧 No tool found at content block index:', currentContentBlockIndex);
                                }
                            } else if (parsed.type === 'content_block_stop') {
                                // Tool use completed
                                console.log('🔧 Tool completed at index:', parsed.index);
                            } else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                                stopReason = parsed.delta.stop_reason;
                            }
                        } catch (e) {
                            // Skip invalid JSON lines
                            continue;
                        }
                    }
                }
            }

            // Handle Claude 4's new refusal stop reason
            if (stopReason === 'refusal') {
                throw new Error('Claude declined to generate content for safety reasons');
            }

            // Convert tool uses to our format
            const toolCalls = toolUses.map(tool => {
                console.log('🔧 Tool input debug:', tool.input);
                return {
                    name: tool.name,
                    query: tool.input.query || '',
                    id: tool.id
                };
            });

            // Log complete model output
            console.log('📝 COMPLETE MODEL OUTPUT:');
            console.log('Text Content:', fullContent);
            console.log('Tool Calls:', toolCalls);
            console.log('Stop Reason:', stopReason);
            console.log('Raw Tool Uses:', toolUses);
            console.log('---END COMPLETE OUTPUT---');

            return {
                success: true,
                content: fullContent.trim(),
                toolCalls: toolCalls,
                finalAnswer: toolCalls.length === 0 ? fullContent.trim() : null,
                stopReason: stopReason
            };

        } catch (error) {
            console.error('Claude call error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async callClaudeFinal(prompt, streamingMessageDiv = null) {
        try {

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 8192,
                    temperature: 0.7,
                    stream: true,
                    tools: [{
                        name: 'search_ae_documentation',
                        description: 'Search the comprehensive After Effects ExtendScript documentation database for specific API information, code examples, property names, method signatures, and technical details. Use this when users ask about After Effects scripting, automation, effects, layers, compositions, or any AE-related programming topics. The tool searches through official Adobe documentation, API references, and scripting guides.',
                        input_schema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'The search query for After Effects documentation. Should be specific terms like "Layer.addProperty", "CompItem.layers", effect names like "adbe glo2", or concepts like "keyframe animation".'
                                }
                            },
                            required: ['query']
                        }
                    }],
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Claude API error: ${response.status} - ${errorData}`);
            }

            // Handle streaming response with fine-grained tool streaming
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let stopReason = null;
            let toolUses = [];
            let toolUsesByIndex = {}; // Map content block index to tool use

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            
                            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                fullContent += parsed.delta.text;
                                
                                // Update streaming display if provided
                                if (streamingMessageDiv) {
                                    this.updateStreamingMessage(streamingMessageDiv, fullContent, false);
                                }
                            } else if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                                // Tool use started - with fine-grained streaming, input should be more complete
                                console.log('🔧 Tool start event (fine-grained):', parsed.content_block);
                                console.log('🔧 Tool at content block index:', parsed.index);
                                console.log('🔧 Raw input object:', JSON.stringify(parsed.content_block.input, null, 2));
                                console.log('🔧 Input keys:', Object.keys(parsed.content_block.input || {}));
                                
                                const toolUse = {
                                    id: parsed.content_block.id,
                                    name: parsed.content_block.name,
                                    input: parsed.content_block.input || {},
                                    inputJson: '', // For accumulating delta input
                                    contentBlockIndex: parsed.index
                                };
                                
                                console.log('🔧 Created tool use object:', JSON.stringify(toolUse, null, 2));
                                toolUses.push(toolUse);
                                toolUsesByIndex[parsed.index] = toolUse; // Store by content block index
                                
                                // Don't show tool calls in UI to avoid visual gaps/flashing
                                // Tool calls happen in background and results are appended seamlessly
                            } else if (parsed.type === 'content_block_delta') {
                                // Handle delta events that might contain tool input
                                console.log('🔧 Delta event details:', JSON.stringify(parsed, null, 2));
                                console.log('🔧 Delta type:', parsed.delta?.type);
                                console.log('🔧 Delta keys:', Object.keys(parsed.delta || {}));
                                
                                const currentContentBlockIndex = parsed.index;
                                console.log('🔧 Content block index:', currentContentBlockIndex);
                                console.log('🔧 Available tool indices:', Object.keys(toolUsesByIndex));
                                
                                const currentTool = toolUsesByIndex[currentContentBlockIndex];
                                if (currentTool) {
                                    console.log('🔧 Found tool at content block index:', currentContentBlockIndex);
                                    // Check if this delta contains tool input
                                    if (parsed.delta?.type === 'input_json_delta') {
                                        console.log('🔧 Found input_json_delta:', parsed.delta.partial_json);
                                        
                                        // Initialize inputJson if not exists
                                        if (!currentTool.inputJson) {
                                            currentTool.inputJson = '';
                                            console.log('🔧 Initialized inputJson');
                                        }
                                        
                                        // Accumulate the JSON
                                        currentTool.inputJson += parsed.delta.partial_json;
                                        console.log('🔧 Accumulated JSON so far:', currentTool.inputJson);
                                        
                                        // Try to parse and update input if we have a complete JSON
                                        try {
                                            const parsedInput = JSON.parse(currentTool.inputJson);
                                            currentTool.input = {...currentTool.input, ...parsedInput};
                                            console.log('🔧 SUCCESS - Updated tool input:', currentTool.input);
                                        } catch (e) {
                                            // JSON not complete yet, continue accumulating
                                            console.log('🔧 JSON not complete yet, continuing...', e.message);
                                        }
                                    } else {
                                        console.log('🔧 Not an input_json_delta, type is:', parsed.delta?.type);
                                    }
                                } else {
                                    console.log('🔧 No tool found at content block index:', currentContentBlockIndex);
                                }
                            } else if (parsed.type === 'content_block_stop') {
                                // Tool use completed
                                console.log('🔧 Tool completed at index:', parsed.index);
                            } else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                                stopReason = parsed.delta.stop_reason;
                            }
                        } catch (e) {
                            // Skip invalid JSON lines
                            continue;
                        }
                    }
                }
            }

            // Handle Claude 4's new refusal stop reason
            if (stopReason === 'refusal') {
                throw new Error('Claude declined to generate content for safety reasons');
            }
            
            // Convert tool uses to our format
            const toolCalls = toolUses.map(tool => {
                console.log('🔧 Tool input debug:', tool.input);
                return {
                    name: tool.name,
                    query: tool.input.query || '',
                    id: tool.id
                };
            });

            // Log complete model output
            console.log('📝 COMPLETE MODEL OUTPUT:');
            console.log('Text Content:', fullContent);
            console.log('Tool Calls:', toolCalls);
            console.log('Stop Reason:', stopReason);
            console.log('Raw Tool Uses:', toolUses);
            console.log('---END COMPLETE OUTPUT---');

            return {
                success: true,
                content: fullContent.trim(),
                toolCalls: toolCalls,
                finalAnswer: toolCalls.length === 0 ? fullContent.trim() : null,
                stopReason: stopReason
            };

        } catch (error) {
            console.error('Claude final call error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async callClaudeWithToolResults(originalMessages, toolResults, streamingMessageDiv = null, existingContent = '') {
        try {
            console.log('🔧 Processing tool results:', toolResults.length, 'results');
            
            // Build conversation with tool results
            const messages = [...originalMessages];
            
            // Add tool results to the conversation
            const toolResultContent = toolResults.map(result => {
                const content = result.success ? result.documentation || result.content || 'No results found' : `Error: ${result.error}`;
                console.log(`🔧 Tool result ${result.id}:`, content.substring(0, 200) + '...');
                return {
                    type: 'tool_result',
                    tool_use_id: result.id,
                    content: content
                };
            });

            // Add tool results as user message with proper content structure
            messages.push({
                role: 'user',
                content: toolResultContent
            });
            
            console.log('🔧 Messages for Claude:', messages.length, 'messages');
            console.log('🔧 Full message structure being sent to Claude:');
            messages.forEach((msg, index) => {
                console.log(`Message ${index}:`, JSON.stringify(msg, null, 2));
            });

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 8192,
                    temperature: 0.7,
                    stream: true,
                    system: 'You are an AI assistant that has just executed a documentation search and received comprehensive results. The user asked a question, you searched for documentation, and now you have the results.\n\nYou must respond with a comprehensive answer based on the documentation that was found. Do NOT say you need to search for more information. Do NOT make additional tool calls. Use the documentation provided in the tool results to answer the user\'s question directly and thoroughly.',
                    messages: messages
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('🔧 Claude tool results API error:', response.status, errorData);
                throw new Error(`Claude API error: ${response.status} - ${errorData}`);
            }
            
            console.log('🔧 Claude tool results API response received, starting stream processing...');

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let stopReason = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            
                            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                fullContent += parsed.delta.text;
                                
                                // Update streaming display if provided
                                if (streamingMessageDiv) {
                                    // Just use the new content - don't duplicate existing content
                                    this.updateStreamingMessage(streamingMessageDiv, fullContent, false);
                                }
                            } else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                                stopReason = parsed.delta.stop_reason;
                            }
                        } catch (e) {
                            // Skip invalid JSON lines
                            continue;
                        }
                    }
                }
            }

            // Handle Claude 4's new refusal stop reason
            if (stopReason === 'refusal') {
                throw new Error('Claude declined to generate content for safety reasons');
            }

            // Log complete final call output  
            console.log('📝 COMPLETE FINAL CALL OUTPUT:');
            console.log('Text Content:', fullContent);
            console.log('Text Content Length:', fullContent.length);
            console.log('Stop Reason:', stopReason);
            console.log('---END FINAL OUTPUT---');
            
            if (fullContent.trim().length === 0) {
                console.warn('⚠️ Empty response from Claude tool results call!');
            }

            return {
                success: true,
                content: fullContent.trim(),
                toolCalls: [],
                finalAnswer: fullContent.trim(),
                stopReason: stopReason
            };

        } catch (error) {
            console.error('Claude tool results call error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    parseToolCalls(content) {
        const toolCalls = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('TOOL_CALL: search_ae_documentation')) {
                // Look for the next QUERY line
                for (let j = i + 1; j < lines.length; j++) {
                    const queryLine = lines[j].trim();
                    if (queryLine.startsWith('QUERY:')) {
                        const query = queryLine.substring(6).trim();
                        if (query) {
                            toolCalls.push({
                                name: 'search_ae_documentation',
                                query: query
                            });
                        }
                        break;
                    }
                }
            }
        }
        
        return toolCalls;
    }

    async executeToolCall(toolCall) {
        if (toolCall.name === 'search_ae_documentation') {
            if (!this.ragTool) {
                console.warn('⚠️ RAG tool not available');
                return {
                    success: false,
                    error: 'Documentation search not available - RAG system not initialized',
                    documentation: '',
                    sources: [],
                    query: toolCall.query,
                    resultCount: 0,
                    searchQueries: []
                };
            }

            try {
                console.log(`🔍 Searching documentation for: "${toolCall.query}"`);
                const result = await this.ragTool.searchDocumentation(toolCall.query);
                
                // Ensure result has expected structure
                if (!result || typeof result !== 'object') {
                    console.error('❌ Invalid result from RAG tool:', result);
                    return {
                        success: false,
                        error: 'Invalid response from documentation search',
                        documentation: '',
                        sources: [],
                        query: toolCall.query,
                        resultCount: 0,
                        searchQueries: []
                    };
                }
                
                return {
                    success: result.success || false,
                    documentation: result.documentation || '',
                    sources: result.sources || [],
                    query: toolCall.query,
                    resultCount: result.resultCount || 0,
                    searchQueries: result.searchQueries || [],
                    error: result.error || null
                };
                
            } catch (error) {
                console.error('Tool call error:', error);
                return {
                    success: false,
                    error: error.message || 'Unknown error during documentation search',
                    documentation: '',
                    sources: [],
                    query: toolCall.query,
                    resultCount: 0,
                    searchQueries: []
                };
            }
        } else {
            return {
                success: false,
                error: `Unknown tool: ${toolCall.name}`,
                documentation: '',
                sources: [],
                query: toolCall.query,
                resultCount: 0,
                searchQueries: []
            };
        }
    }


    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `simple-chat-message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';

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

        // Scroll to bottom
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    addSearchIndicator(messageDiv, query) {
        // Find the message content div - messageDiv might already be the content div
        const messageContent = messageDiv.classList.contains('message-content') ? 
            messageDiv : messageDiv.querySelector('.message-content');
        if (!messageContent) {
            console.warn('Could not find message content div for search indicator');
            return;
        }

        // Create search indicator
        const searchDiv = document.createElement('div');
        searchDiv.className = 'search-indicator';
        searchDiv.innerHTML = `
            <div class="search-text">
                <span class="search-icon">🔍</span>
                <span class="search-label">Searching:</span>
                <span class="search-query">"${query}"</span>
                <span class="search-status">...</span>
            </div>
        `;

        // Add compact, on-brand styles
        searchDiv.style.cssText = `
            margin: 2px 0 2px 0;
            padding: 1px 6px;
            background: linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(40, 40, 40, 0.6));
            border: 1px solid rgba(100, 100, 100, 0.3);
            border-radius: 8px;
            font-size: 9px;
            color: rgba(200, 200, 200, 0.9);
            font-family: 'SF Pro Text', -apple-system, system-ui, sans-serif;
            backdrop-filter: blur(8px);
            line-height: 1;
            display: inline-block;
            width: fit-content;
            height: 14px;
            vertical-align: middle;
            white-space: nowrap;
        `;

        const searchIcon = searchDiv.querySelector('.search-icon');
        if (searchIcon) {
            searchIcon.style.cssText = `
                margin-right: 4px;
                font-size: 10px;
                opacity: 0.7;
            `;
        }

        const searchLabel = searchDiv.querySelector('.search-label');
        if (searchLabel) {
            searchLabel.style.cssText = `
                color: rgba(170, 170, 170, 0.8);
                margin-right: 4px;
                font-weight: 400;
            `;
        }

        const searchQuery = searchDiv.querySelector('.search-query');
        if (searchQuery) {
            searchQuery.style.cssText = `
                color: rgba(120, 180, 255, 0.9);
                font-weight: 500;
                margin-right: 4px;
            `;
        }

        const searchStatus = searchDiv.querySelector('.search-status');
        if (searchStatus) {
            searchStatus.style.cssText = `
                color: rgba(255, 200, 100, 0.8);
                font-style: italic;
                animation: pulse 1.5s infinite;
            `;
        }

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 0.4; }
            }
        `;
        document.head.appendChild(style);

        // Create a dedicated container for search indicators that won't move
        let searchContainer = messageContent.querySelector('.search-indicators-container');
        if (!searchContainer) {
            searchContainer = document.createElement('div');
            searchContainer.className = 'search-indicators-container';
            searchContainer.style.cssText = `
                margin: 2px 0;
                line-height: 1.2;
            `;
            
            // Insert after the assistant label
            const assistantLabel = messageContent.querySelector('strong');
            if (assistantLabel) {
                assistantLabel.insertAdjacentElement('afterend', searchContainer);
            } else {
                messageContent.appendChild(searchContainer);
            }
        }
        
        searchContainer.appendChild(searchDiv);
    }

    addSearchIndicatorAfterContent(messageDiv, query) {
        // Find the message content div - messageDiv might already be the content div
        const messageContent = messageDiv.classList.contains('message-content') ? 
            messageDiv : messageDiv.querySelector('.message-content');
        if (!messageContent) {
            console.warn('Could not find message content div for search indicator');
            return;
        }

        // Create search indicator
        const searchDiv = document.createElement('div');
        searchDiv.className = 'search-indicator';
        searchDiv.innerHTML = `
            <div class="search-text">
                <span class="search-icon">🔍</span>
                <span class="search-label">Searching:</span>
                <span class="search-query">"${query}"</span>
                <span class="search-status">...</span>
            </div>
        `;

        // Add compact, on-brand styles
        searchDiv.style.cssText = `
            margin: 2px 0 2px 0;
            padding: 1px 6px;
            background: linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(40, 40, 40, 0.6));
            border: 1px solid rgba(100, 100, 100, 0.3);
            border-radius: 8px;
            font-size: 9px;
            color: rgba(200, 200, 200, 0.9);
            font-family: 'SF Pro Text', -apple-system, system-ui, sans-serif;
            backdrop-filter: blur(8px);
            line-height: 1;
            display: inline-block;
            width: fit-content;
            height: 14px;
            vertical-align: middle;
            white-space: nowrap;
        `;

        const searchIcon = searchDiv.querySelector('.search-icon');
        if (searchIcon) {
            searchIcon.style.cssText = `
                margin-right: 4px;
                font-size: 10px;
                opacity: 0.7;
            `;
        }

        const searchLabel = searchDiv.querySelector('.search-label');
        if (searchLabel) {
            searchLabel.style.cssText = `
                color: rgba(170, 170, 170, 0.8);
                margin-right: 4px;
                font-weight: 400;
            `;
        }

        const searchQuery = searchDiv.querySelector('.search-query');
        if (searchQuery) {
            searchQuery.style.cssText = `
                color: rgba(120, 180, 255, 0.9);
                font-weight: 500;
                margin-right: 4px;
            `;
        }

        const searchStatus = searchDiv.querySelector('.search-status');
        if (searchStatus) {
            searchStatus.style.cssText = `
                color: rgba(255, 200, 100, 0.8);
                font-style: italic;
                animation: pulse 1.5s infinite;
            `;
        }

        // Create or find the search container in the streaming content area
        const streamingContentArea = messageContent.querySelector('.streaming-content-area');
        if (streamingContentArea) {
            // Add search indicator at the end of current content in streaming area
            let searchContainer = streamingContentArea.querySelector('.search-indicators-container');
            if (!searchContainer) {
                searchContainer = document.createElement('div');
                searchContainer.className = 'search-indicators-container';
                searchContainer.style.cssText = `
                    margin: 2px 0;
                    line-height: 1.2;
                    display: block;
                `;
                streamingContentArea.appendChild(searchContainer);
            }
            searchContainer.appendChild(searchDiv);
        } else {
            // Fallback: use the original method if no streaming content area exists yet
            this.addSearchIndicator(messageDiv, query);
        }
    }

    updateSearchIndicator(messageDiv, query, toolResult) {
        const searchDiv = messageDiv.querySelector('.search-indicator');
        if (!searchDiv) return;

        const resultCount = toolResult.resultCount || 0;
        const sources = toolResult.sources || [];

        // Update the entire search indicator to show documentation results
        const searchText = searchDiv.querySelector('.search-text');
        if (searchText) {
            // Change icon and label to indicate documentation found
            searchText.innerHTML = `
                <span class="search-icon">📚</span>
                <span class="search-label">Documentation:</span>
                <span class="search-query">"${query}"</span>
                <span class="search-status">${resultCount} results</span>
            `;

            // Update the search indicator background to show completion
            searchDiv.style.background = 'linear-gradient(135deg, rgba(20, 40, 20, 0.8), rgba(40, 60, 40, 0.6))';
            searchDiv.style.borderColor = 'rgba(100, 150, 100, 0.4)';
            
            // Ensure it stays compact and rectangular
            searchDiv.style.display = 'inline-block';
            searchDiv.style.width = 'fit-content';
            searchDiv.style.height = '14px';
            searchDiv.style.lineHeight = '1';
            searchDiv.style.padding = '1px 6px';
            searchDiv.style.margin = '2px 0 2px 0';
            searchDiv.style.verticalAlign = 'middle';
            searchDiv.style.whiteSpace = 'nowrap';
            searchDiv.style.borderRadius = '8px';

            // Update icon color
            const icon = searchText.querySelector('.search-icon');
            if (icon) {
                icon.style.color = 'rgba(100, 200, 100, 0.9)';
            }

            // Update status color
            const status = searchText.querySelector('.search-status');
            if (status) {
                status.style.cssText = `
                    color: rgba(100, 200, 100, 0.9);
                    font-weight: 500;
                    animation: none;
                `;
            }
        }
    }

    formatMessage(content) {
        // Enhanced markdown formatting for rich text display
        let formatted = content;
        
        // Code blocks (triple backticks) - strip language identifier if present
        formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code style="background: #1a1a1a; padding: 12px; border-radius: 6px; display: block; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); font-family: \'Fira Code\', monospace;">$2</code></pre>');
        
        // Headers
        formatted = formatted.replace(/^### (.*$)/gm, '<h3 style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600; margin: 16px 0 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">$1</h3>');
        formatted = formatted.replace(/^## (.*$)/gm, '<h2 style="color: rgba(255,255,255,0.95); font-size: 18px; font-weight: 600; margin: 20px 0 10px 0; border-bottom: 2px solid rgba(255,255,255,0.2); padding-bottom: 6px;">$1</h2>');
        formatted = formatted.replace(/^# (.*$)/gm, '<h1 style="color: #fff; font-size: 20px; font-weight: 700; margin: 24px 0 12px 0;">$1</h1>');
        
        // Bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: rgba(255,255,255,0.9); font-weight: 600;">$1</strong>');
        
        // Italic text
        formatted = formatted.replace(/\*(.*?)\*/g, '<em style="color: rgba(255,255,255,0.8); font-style: italic;">$1</em>');
        
        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #2a2a2a; color: #f8f8f2; padding: 2px 6px; border-radius: 4px; font-family: \'Fira Code\', monospace; font-size: 12px; border: 1px solid rgba(255,255,255,0.1);">$1</code>');
        
        // Links
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3498db; text-decoration: underline;" target="_blank">$1</a>');
        
        // Unordered lists
        formatted = formatted.replace(/^[\s]*[-*+] (.+)$/gm, '•LIST_ITEM•$1');
        formatted = formatted.replace(/(•LIST_ITEM•[^•]+(?:\n•LIST_ITEM•[^•]+)*)/g, function(match) {
            const items = match.split('•LIST_ITEM•').filter(item => item.trim()).map(item => 
                `<li style="margin: 4px 0; padding-left: 4px; color: rgba(255,255,255,0.8);">${item.trim()}</li>`
            ).join('');
            return `<ul style="margin: 8px 0; padding-left: 20px;">${items}</ul>`;
        });
        
        // Ordered lists
        formatted = formatted.replace(/^[\s]*\d+\. (.+)$/gm, '•NUM_ITEM•$1');
        formatted = formatted.replace(/(•NUM_ITEM•[^•]+(?:\n•NUM_ITEM•[^•]+)*)/g, function(match) {
            const items = match.split('•NUM_ITEM•').filter(item => item.trim()).map(item => 
                `<li style="margin: 4px 0; padding-left: 4px; color: rgba(255,255,255,0.8);">${item.trim()}</li>`
            ).join('');
            return `<ol style="margin: 8px 0; padding-left: 20px;">${items}</ol>`;
        });
        
        // Blockquotes
        formatted = formatted.replace(/^> (.+)$/gm, '<blockquote style="border-left: 3px solid #3498db; padding-left: 12px; margin: 8px 0; color: rgba(255,255,255,0.7); font-style: italic;">$1</blockquote>');
        
        // Horizontal rules
        formatted = formatted.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 16px 0;">');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    clearChat() {
        // Clear messages except the welcome message
        this.elements.messages.innerHTML = `
            <div class="simple-chat-message assistant">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <strong>Assistant:</strong> Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?
                </div>
            </div>
        `;

        // Reset chat history
        this.chatHistory = [{
            role: 'assistant',
            content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
        }];

        this.updateStatus('Ready to chat');
        console.log('🗑️ Chat cleared');
    }

    updateStatus(message) {
        this.elements.status.textContent = message;
    }

    addStreamingAssistantMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'simple-chat-message assistant';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = '<strong>Assistant:</strong> <span class="streaming-cursor">▌</span>';

        messageDiv.appendChild(messageContent);
        this.elements.messages.appendChild(messageDiv);

        // Scroll to bottom
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

        return messageContent;
    }

    // Streaming support for future enhancement
    async addStreamingMessage(role, initialContent = '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `simple-chat-message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (role === 'assistant') {
            messageContent.innerHTML = `<strong>Assistant:</strong> ${initialContent}<span class="streaming-cursor">▌</span>`;
        } else {
            messageContent.innerHTML = `<strong>You:</strong> ${initialContent}<span class="streaming-cursor">▌</span>`;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        this.elements.messages.appendChild(messageDiv);

        // Scroll to bottom
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

        return messageContent;
    }

    updateStreamingMessage(messageElement, content, isComplete = false) {
        const prefix = messageElement.innerHTML.split(':</strong>')[0] + ':</strong> ';
        
        // Find existing streaming content area 
        const existingStreamingArea = messageElement.querySelector('.streaming-content-area');
        
        if (existingStreamingArea && existingStreamingArea.querySelector('.search-indicators-container')) {
            // If search indicators exist, we need to be very careful about positioning
            // The search indicators should stay exactly where they are in the content flow
            
            // Instead of replacing all content, we append new content AFTER the search indicators
            // This preserves the original order: initial text -> search indicators -> new streaming content
            
            const searchContainer = existingStreamingArea.querySelector('.search-indicators-container');
            
            // Remove any existing content that comes after search indicators (previous streaming updates)
            let currentNode = searchContainer.nextSibling;
            while (currentNode) {
                const nextNode = currentNode.nextSibling;
                if (currentNode.nodeType === Node.TEXT_NODE || 
                    (currentNode.nodeType === Node.ELEMENT_NODE && 
                     !currentNode.classList.contains('streaming-cursor'))) {
                    currentNode.remove();
                }
                currentNode = nextNode;
            }
            
            // Add new content after the search indicators
            const newContentElement = document.createElement('span');
            newContentElement.innerHTML = this.formatMessage(content);
            
            // Insert the new content after search indicators
            if (searchContainer.nextSibling) {
                existingStreamingArea.insertBefore(newContentElement, searchContainer.nextSibling);
            } else {
                existingStreamingArea.appendChild(newContentElement);
            }
            
            // Handle cursor - remove existing and add new if needed
            const existingCursor = existingStreamingArea.querySelector('.streaming-cursor');
            if (existingCursor) existingCursor.remove();
            
            if (!isComplete) {
                const cursor = document.createElement('span');
                cursor.className = 'streaming-cursor';
                cursor.textContent = '▌';
                existingStreamingArea.appendChild(cursor);
            }
            
            messageElement.dataset.isStreaming = isComplete ? 'false' : 'true';
        } else {
            // No search indicators yet - use normal method
            if (isComplete) {
                messageElement.innerHTML = prefix + '<div class="streaming-content-area" style="display: inline;">' + this.formatMessage(content) + '</div>';
                messageElement.dataset.isStreaming = 'false';
            } else {
                messageElement.innerHTML = prefix + '<div class="streaming-content-area" style="display: inline;">' + this.formatMessage(content) + '<span class="streaming-cursor">▌</span></div>';
                messageElement.dataset.isStreaming = 'true';
            }
        }

        // Scroll to bottom
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    // displayRawToolCall method removed to prevent visual gaps during streaming

    // Test delta processing manually
    testDeltaProcessing() {
        console.log('🧪 Testing delta processing...');
        
        // Simulate the exact deltas from your log
        const toolUses = [];
        
        // 1. Tool start event
        const startEvent = {
            type: 'content_block_start',
            content_block: {
                type: 'tool_use',
                id: 'toolu_016v11U5h9P51Qs6cTqkB2Vd',
                name: 'search_ae_documentation',
                input: {}
            }
        };
        
        console.log('🔧 Tool start event:', startEvent.content_block);
        toolUses.push({
            id: startEvent.content_block.id,
            name: startEvent.content_block.name,
            input: startEvent.content_block.input || {},
            inputJson: ''
        });
        
        // 2. Delta events (exact from your log)
        const deltas = [
            {type: 'content_block_delta', index: 1, delta: {type: 'input_json_delta', partial_json: ''}},
            {type: 'content_block_delta', index: 1, delta: {type: 'input_json_delta', partial_json: '{"query'}},
            {type: 'content_block_delta', index: 1, delta: {type: 'input_json_delta', partial_json: '": "ma'}},
            {type: 'content_block_delta', index: 1, delta: {type: 'input_json_delta', partial_json: 'sk'}},
            {type: 'content_block_delta', index: 1, delta: {type: 'input_json_delta', partial_json: 's"}'}}
        ];
        
        deltas.forEach((parsed, i) => {
            console.log(`🔧 Tool delta event ${i + 1}:`, parsed);
            const currentToolIndex = parsed.index;
            if (toolUses[currentToolIndex]) {
                if (!toolUses[currentToolIndex].inputJson) {
                    toolUses[currentToolIndex].inputJson = '';
                }
                toolUses[currentToolIndex].inputJson += parsed.delta.partial_json;
                console.log(`   Accumulated JSON so far: "${toolUses[currentToolIndex].inputJson}"`);
            }
        });
        
        // 3. Stop event
        const stopEvent = {type: 'content_block_stop', index: 1};
        console.log('🔧 Tool stop event:', stopEvent);
        
        const currentToolIndex = stopEvent.index;
        if (toolUses[currentToolIndex] && toolUses[currentToolIndex].inputJson) {
            try {
                console.log('🔧 Finalizing tool input JSON:', toolUses[currentToolIndex].inputJson);
                const parsedInput = JSON.parse(toolUses[currentToolIndex].inputJson);
                toolUses[currentToolIndex].input = {...toolUses[currentToolIndex].input, ...parsedInput};
                console.log('🔧 Final tool input:', toolUses[currentToolIndex].input);
                
                // Test the query extraction
                const query = toolUses[currentToolIndex].input.query || '';
                console.log(`🎯 Extracted query: "${query}"`);
                
                // Test tool execution
                if (query) {
                    console.log('✅ Delta processing SUCCESS - query extracted:', query);
                    return query;
                } else {
                    console.log('❌ Delta processing FAILED - no query extracted');
                    return '';
                }
            } catch (e) {
                console.warn('❌ Failed to parse tool input JSON:', toolUses[currentToolIndex].inputJson, e);
                return '';
            }
        }
    }

    // Tool call box method removed - executing silently
    // addToolCallBox(toolCalls) {
    //     const toolCallDiv = document.createElement('div');
    //     toolCallDiv.className = 'tool-call-box';
    //     
    //     const header = document.createElement('div');
    //     header.className = 'tool-call-header';
    //     header.innerHTML = `
    //         <div class="tool-call-icon">🔍</div>
    //         <div class="tool-call-title">Searched codebase for "${toolCalls[0].query}"</div>
    //         <div class="tool-call-toggle">▼</div>
    //     `;
    //     
    //     const content = document.createElement('div');
    //     content.className = 'tool-call-content';
    //     content.style.display = 'none';
    //     
    //     const fileList = document.createElement('div');
    //     fileList.className = 'tool-call-files';
    //     fileList.innerHTML = '<div class="tool-call-loading">Searching...</div>';
    //     
    //     content.appendChild(fileList);
    //     toolCallDiv.appendChild(header);
    //     toolCallDiv.appendChild(content);
    //     
    //     // Add click handler for toggle
    //     header.addEventListener('click', () => {
    //         const isVisible = content.style.display !== 'none';
    //         content.style.display = isVisible ? 'none' : 'block';
    //         header.querySelector('.tool-call-toggle').textContent = isVisible ? '▼' : '▲';
    //     });
    //     
    //     // Create a container div for the tool call box
    //     const toolCallContainer = document.createElement('div');
    //     toolCallContainer.className = 'simple-chat-message tool-call-container';
    //     toolCallContainer.appendChild(toolCallDiv);
    //     
    //     this.elements.messages.appendChild(toolCallContainer);
    //     this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    //     
    //     return toolCallDiv;
    // }

    // Tool call box update method removed
    // updateToolCallBox(toolCallBox, toolCall, toolResult) {
    //     const fileList = toolCallBox.querySelector('.tool-call-files');
    //     const header = toolCallBox.querySelector('.tool-call-header');
    //     
    //     // Update header with query info
    //     const title = header.querySelector('.tool-call-title');
    //     title.textContent = `Searched codebase for "${toolCall.query}"`;
    //     
    //     // Update content with results
    //     if (toolResult.success && toolResult.sources && toolResult.sources.length > 0) {
    //         const filesHtml = toolResult.sources.map(source => {
    //             const fileName = typeof source === 'string' ? source : source.file || source.name || 'unknown';
    //             const filePath = typeof source === 'string' ? source : source.path || source.file || 'unknown';
    //             const lineInfo = source.line ? `L${source.line}` : '';
    //             
    //             return `
    //                 <div class="tool-call-file">
    //                     <div class="file-icon">📄</div>
    //                     <div class="file-info">
    //                         <div class="file-name">${fileName}</div>
    //                         <div class="file-path">${filePath} ${lineInfo}</div>
    //                     </div>
    //                 </div>
    //             `;
    //         }).join('');
    //         
    //         fileList.innerHTML = filesHtml;
    //     } else {
    //         fileList.innerHTML = '<div class="tool-call-no-results">No results found</div>';
    //     }
    //     
    //     // Update header to show result count
    //     if (toolResult.success && toolResult.sources) {
    //         const count = toolResult.sources.length;
    //         title.textContent = `Searched codebase for "${toolCall.query}" (${count} results)`;
    //     }
    //     
    //     this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    // }
}

// Export for use in main.js
window.SimpleChatManager = SimpleChatManager;