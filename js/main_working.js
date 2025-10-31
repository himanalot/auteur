/**
 * Main JavaScript file for Maximise AE Tools extension - AI Enhanced with Tool Calls
 */

(function() {
    'use strict';
    
    console.log('🔥 SCRIPT START: main.js loading...');
    
    // ========================================
    // GLOBAL VARIABLES AND STATE
    // ========================================
    
    var csInterface = new CSInterface();
    var isInCEP = typeof CSInterface !== 'undefined';
    var statusTimeout;
    var isDocked = true;
    var availableAETools = {};

    var appState = {
        version: '2.1.0',
        isConnected: false,
        chatHistory: [],
        themeType: 'dark',
        isDocked: true,
        lastActivity: Date.now(),
        currentProject: null,
        debugMode: false,
        fullConversationLog: [],
        isProcessing: false,
        shouldStop: false,
        currentSessionToolResults: []
    };

    // ========================================
    // CORE UTILITY FUNCTIONS
    // ========================================

    function executeScript(script) {
        return new Promise((resolve, reject) => {
            if (!isInCEP) {
                console.warn('⚠️ Not in CEP environment, cannot execute script');
                resolve('{"success": false, "message": "Not in CEP environment"}');
                return;
            }

            csInterface.evalScript(script, (result) => {
                if (result === 'EvalScript error.') {
                    console.error('❌ ExtendScript execution error');
                    reject(new Error('ExtendScript execution error'));
                } else {
                    resolve(result);
                }
            });
        });
    }

    // Test tool execution function
    async function testTools() {
        console.log('🧪 Testing tool execution...');
        try {
            const result = await executeScript('testToolExecution()');
            console.log('🧪 Test result:', result);
        } catch (error) {
            console.error('🧪 Test error:', error);
        }
    }

    // Add global test functions
    window.testAETools = testTools;
    window.debugShapeCreation = debugShapeCreation;

    // Generic tool execution function for AI
    async function executeAITool(toolName, parameters) {
        try {
            await executeScript('$.evalFile("' + csInterface.getSystemPath(CSInterface.SystemPath.EXTENSION) + '/jsx/ae_tools_consolidated.jsx")');
            
            const script = `executeComprehensiveAITool("${toolName}", ${JSON.stringify(parameters || {})})`;
            const result = await executeScript(script);
            
            const parsedResult = JSON.parse(result);
            console.log('🛠️ Tool execution result:', parsedResult);
            
            return parsedResult;
        } catch (error) {
            console.error('🛠️ Tool execution error:', error);
            return {
                success: false,
                message: 'Error executing tool: ' + error.message
            };
        }
    }

    // Get available AI tools from ExtendScript - NEW DYNAMIC APPROACH
    async function loadAvailableAITools() {
        try {
            await executeScript('$.evalFile("' + csInterface.getSystemPath(CSInterface.SystemPath.EXTENSION) + '/jsx/ae_tools_consolidated.jsx")');
            
            // Load only the tool discovery/info functions initially
            const discoveryTools = {
                "get_tool_catalog": {
                    "description": "Get a simplified catalog of all available After Effects tools with basic descriptions",
                    "parameters": {
                        "category": {
                            "type": "string",
                            "description": "Optional: Filter by category (project, composition, layer, animation, effects, text, render, shape, mask, utility)",
                            "optional": true
                        }
                    }
                },
                "get_tool_info": {
                    "description": "Get detailed information about a specific tool including parameters, examples, and usage notes",
                    "parameters": {
                        "tool_name": {
                            "type": "string", 
                            "description": "The name of the tool to get detailed information about"
                        }
                    }
                },
                "get_effect_info": {
                    "description": "Get detailed information about available effects for the apply_effect tool",
                    "parameters": {
                        "category": {
                            "type": "string",
                            "description": "Optional: Filter by effect category (blur, color, distort, generate, etc.)",
                            "optional": true
                        },
                        "effect_name": {
                            "type": "string", 
                            "description": "Optional: Get info about a specific effect",
                            "optional": true
                        }
                    }
                },
                "get_project_status": {
                    "description": "Get comprehensive status information about the current project",
                    "parameters": {}
                }
            };
            
            availableAETools = discoveryTools;
            console.log('🛠️ Loaded discovery tools:', Object.keys(availableAETools));
            return availableAETools;
        } catch (error) {
            console.error('🛠️ Error loading available tools:', error);
            return {};
        }
    }

    // Debug Console System
    class DebugConsole {
        constructor() {
            this.isVisible = false;
            this.lines = [];
            this.maxLines = 100;
            this.setupDebugConsole();
        }
        
        setupDebugConsole() {
            // Override console methods to capture logs
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            console.log = (...args) => {
                originalLog.apply(console, args);
                this.addLine('info', args.join(' '));
            };
            
            console.error = (...args) => {
                originalError.apply(console, args);
                this.addLine('error', args.join(' '));
            };
            
            console.warn = (...args) => {
                originalWarn.apply(console, args);
                this.addLine('warn', args.join(' '));
            };
            
            // Set up event listeners once DOM is ready
            setTimeout(() => {
                const showBtn = document.getElementById('showDebug');
                const toggleBtn = document.getElementById('toggleDebug');
                const clearBtn = document.getElementById('clearDebug');
                
                if (showBtn) {
                    showBtn.addEventListener('click', () => this.show());
                }
                if (toggleBtn) {
                    toggleBtn.addEventListener('click', () => this.hide());
                }
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => this.clear());
                }
            }, 100);
        }
        
        addLine(type, message) {
            const timestamp = new Date().toLocaleTimeString();
            const line = `[${timestamp}] ${message}`;
            
            this.lines.push({ type, line });
            
            // Keep only last maxLines
            if (this.lines.length > this.maxLines) {
                this.lines.shift();
            }
            
            this.updateDisplay();
        }
        
        updateDisplay() {
            const output = document.getElementById('debugOutput');
            if (output) {
                output.innerHTML = this.lines
                    .map(item => `<div class="debug-line debug-${item.type}">${item.line}</div>`)
                    .join('');
                output.scrollTop = output.scrollHeight;
            }
        }
        
        show() {
            const console = document.getElementById('debugConsole');
            const showBtn = document.getElementById('showDebug');
            
            if (console && showBtn) {
                console.style.display = 'flex';
                showBtn.style.display = 'none';
                this.isVisible = true;
                this.updateDisplay();
            }
        }
        
        hide() {
            const console = document.getElementById('debugConsole');
            const showBtn = document.getElementById('showDebug');
            
            if (console && showBtn) {
                console.style.display = 'none';
                showBtn.style.display = 'block';
                this.isVisible = false;
            }
        }
        
        clear() {
            this.lines = [];
            this.updateDisplay();
        }
    }

    // Initialize debug console
    window.debugConsole = new DebugConsole();
    
    // Immediate diagnostic logging
    console.log('🔥 IMMEDIATE TEST: Extension JS loaded!');
    console.log('🔥 Current time:', new Date().toLocaleTimeString());
    console.log('🔥 Document ready state:', document.readyState);
    
    // ========================================
    // ENHANCED AI CHAT WITH DYNAMIC TOOL DISCOVERY
    // ========================================
    
    class GeminiChat {
        constructor() {
            console.log('🤖 GeminiChat: Initializing with dynamic tool discovery...');
            
            // Default API keys
            this.defaultGeminiKey = '';
            this.defaultOpenAIKey = ''; // User must provide their own OpenAI key
            
            // Model selection
            this.selectedModel = localStorage.getItem('selected_model') || 'gemini';
            console.log('🤖 GeminiChat: Selected model:', this.selectedModel);
            
            // API keys
            this.geminiApiKey = localStorage.getItem('gemini_api_key') || this.defaultGeminiKey;
            this.openaiApiKey = localStorage.getItem('openai_api_key') || this.defaultOpenAIKey;
            
            console.log('🔑 GeminiChat: Gemini API key length:', this.geminiApiKey ? this.geminiApiKey.length : 0);
            console.log('🔑 GeminiChat: OpenAI API key length:', this.openaiApiKey ? this.openaiApiKey.length : 0);
            
            this.isConnected = false;
            this.chatContainer = null;
            this.chatMessages = null;
            this.chatInput = null;
            this.sendBtn = null;
            this.statusElement = null;
            this.apiModal = null;
            this.modelSelect = null;
            
            console.log('🤖 GeminiChat: Starting initialization...');
            this.initializeChat();
        }
        
        initializeChat() {
            console.log('🔧 GeminiChat: Getting DOM elements...');
            
            // Get DOM elements
            this.chatContainer = document.getElementById('chatContainer');
            this.chatMessages = document.getElementById('chatMessages');
            this.chatInput = document.getElementById('chatInput');
            this.sendBtn = document.getElementById('sendChat');
            this.statusElement = document.getElementById('aiStatus');
            this.apiModal = document.getElementById('apiModal');
            this.modelSelect = document.getElementById('modelSelect');
            
            console.log('🔧 GeminiChat: DOM elements found:', {
                chatContainer: !!this.chatContainer,
                chatMessages: !!this.chatMessages,
                chatInput: !!this.chatInput,
                sendBtn: !!this.sendBtn,
                statusElement: !!this.statusElement,
                apiModal: !!this.apiModal,
                modelSelect: !!this.modelSelect
            });
            
            // Test if elements actually exist in DOM
            console.log('🔥 DOM TEST - getElementById results:');
            console.log('  chatInput:', document.getElementById('chatInput'));
            console.log('  sendChat:', document.getElementById('sendChat'));
            console.log('  chatContainer:', document.getElementById('chatContainer'));
            console.log('  modelSelect:', document.getElementById('modelSelect'));
            
            // Set model selector to saved value
            if (this.modelSelect) {
                this.modelSelect.value = this.selectedModel;
            }
            
            // Set up event listeners
            console.log('🔧 GeminiChat: Setting up event listeners...');
            this.setupEventListeners();
            
            // Load available tools and chat history
            this.loadAvailableTools();
            this.loadChatHistory();
            this.checkApiKeyStatus();
            
            console.log('🤖 GeminiChat: Initialization complete');
        }
        
        async loadAvailableTools() {
            try {
                availableAETools = await loadAvailableAITools();
                console.log('🛠️ GeminiChat: Loaded tools:', Object.keys(availableAETools));
            } catch (error) {
                console.error('🛠️ GeminiChat: Error loading tools:', error);
            }
        }
        
        setupEventListeners() {
            console.log('🔧 GeminiChat: Setting up event listeners...');
            
            // Chat input enter key
            if (this.chatInput) {
                this.chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            } else {
                console.error('❌ GeminiChat: chatInput element not found');
            }
            
            // Send button
            if (this.sendBtn) {
                this.sendBtn.addEventListener('click', () => {
                    this.sendMessage();
                });
            } else {
                console.error('❌ GeminiChat: sendBtn element not found');
            }
            
            // API Modal buttons
            const closeModalBtn = document.getElementById('closeApiModal');
            const saveApiBtn = document.getElementById('saveApiKey');
            const apiSettingsBtn = document.getElementById('apiSettings');
            
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => this.hideApiModal());
            }
            
            if (saveApiBtn) {
                saveApiBtn.addEventListener('click', () => this.saveApiKey());
            }
            
            if (apiSettingsBtn) {
                apiSettingsBtn.addEventListener('click', () => this.showApiModal());
            }
            
            // Debug toggle button
            const debugToggleBtn = document.getElementById('debugToggle');
            if (debugToggleBtn) {
                debugToggleBtn.addEventListener('click', () => this.toggleDebugMode());
            }
            
            // Copy conversation button
            const copyConvoBtn = document.getElementById('copyConvo');
            if (copyConvoBtn) {
                copyConvoBtn.addEventListener('click', () => this.copyFullConversation());
            }
            
            // Clear conversation button
            const clearConvoBtn = document.getElementById('clearConvo');
            if (clearConvoBtn) {
                clearConvoBtn.addEventListener('click', () => this.clearConversation());
            }
            
            // Stop AI button
            const stopAIBtn = document.getElementById('stopAI');
            if (stopAIBtn) {
                stopAIBtn.addEventListener('click', () => this.stopAIProcessing());
            }
            
            // Model selector
            if (this.modelSelect) {
                this.modelSelect.addEventListener('change', (e) => {
                    this.selectedModel = e.target.value;
                    localStorage.setItem('selected_model', this.selectedModel);
                    console.log('🤖 Model changed to:', this.selectedModel);
                    this.checkApiKeyStatus();
                });
            }
            
            // Debug button (existing)
            const debugBtn = document.getElementById('debugBtn');
            if (debugBtn) {
                debugBtn.addEventListener('click', () => {
                    console.log('🔍 Debug button clicked!');
                    try {
                        debugShapeCreation();
                    } catch (error) {
                        console.error('🔍 Debug error:', error);
                        this.addMessageToChat('❌ Debug failed: ' + error.message, 'system');
                    }
                });
            }
            
            console.log('🔧 GeminiChat: Event listeners setup complete');
        }
        
        checkApiKeyStatus() {
            const currentApiKey = this.getCurrentApiKey();
            if (currentApiKey) {
                this.updateStatus(`● Ready (${this.selectedModel === 'gemini' ? 'Gemini' : 'o4-mini'})`, 'connected');
                this.isConnected = true;
                console.log(`✅ GeminiChat: ${this.selectedModel} API key configured`);
            } else {
                this.updateStatus(`● No ${this.selectedModel === 'gemini' ? 'Gemini' : 'OpenAI'} Key`, 'error');
                this.isConnected = false;
                console.log(`❌ GeminiChat: No ${this.selectedModel} API key configured`);
            }
        }
        
        getCurrentApiKey() {
            return this.selectedModel === 'gemini' ? this.geminiApiKey : this.openaiApiKey;
        }
        
        updateStatus(message, type) {
            if (this.statusElement) {
                this.statusElement.textContent = message;
                this.statusElement.className = 'ai-status ' + (type || 'info');
            }
        }
        
        showApiModal() {
            if (this.apiModal) {
                this.apiModal.style.display = 'flex';
                const apiKeyInput = document.getElementById('apiKey');
                const modalTitle = this.apiModal.querySelector('h3');
                
                if (modalTitle) {
                    modalTitle.textContent = `${this.selectedModel === 'gemini' ? 'Google Gemini' : 'OpenAI o4-mini'} API Settings`;
                }
                
                if (apiKeyInput) {
                    const currentKey = this.selectedModel === 'gemini' ? this.geminiApiKey : this.openaiApiKey;
                    apiKeyInput.value = currentKey || '';
                    apiKeyInput.placeholder = `Enter your ${this.selectedModel === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key`;
                    apiKeyInput.focus();
                }
            }
        }
        
        hideApiModal() {
            if (this.apiModal) {
                this.apiModal.style.display = 'none';
            }
        }
        
        saveApiKey() {
            const apiKeyInput = document.getElementById('apiKey');
            if (apiKeyInput) {
                const newApiKey = apiKeyInput.value.trim();
                if (newApiKey) {
                    if (this.selectedModel === 'gemini') {
                        this.geminiApiKey = newApiKey;
                        localStorage.setItem('gemini_api_key', newApiKey);
                    } else if (this.selectedModel === 'o4-mini') {
                        this.openaiApiKey = newApiKey;
                        localStorage.setItem('openai_api_key', newApiKey);
                    }
                    this.checkApiKeyStatus();
                    this.hideApiModal();
                    this.addMessageToChat(`${this.selectedModel === 'gemini' ? 'Gemini' : 'OpenAI'} API key updated successfully!`, 'system');
                    console.log(`✅ GeminiChat: ${this.selectedModel} API key saved`);
                } else {
                    alert('Please enter a valid API key');
                }
            }
        }
        
        async sendMessage() {
            const message = this.chatInput.value.trim();
            if (!message) return;
            
            if (!this.isConnected) {
                const modelName = this.selectedModel === 'gemini' ? 'Gemini' : 'OpenAI';
                this.addMessageToChat(`Please configure your ${modelName} API key first.`, 'system');
                this.showApiModal();
                return;
            }

            // Reset processing state
            appState.isProcessing = true;
            appState.shouldStop = false;
            appState.currentSessionToolResults = []; // Clear previous session results
            this.showStopButton(true);
            
            // Reset retryAttempts at the beginning of every new user message
            this.retryAttempts = {};
            // Store the user message for retry context
            this.lastUserMessage = message;

            console.log('📤 GeminiChat: Sending message:', message);
            
            // Add user message to chat
            this.addMessageToChat(message, 'user');
            
            // Clear input
            this.chatInput.value = '';
            
            // Show thinking status
            this.updateStatus('● Thinking...', 'thinking');
            
            try {
                // AUTOMATICALLY get tool catalog first to ensure AI has current tool info
                console.log('🛠️ Auto-calling get_tool_catalog for AI context...');
                const catalogResult = await executeAITool('get_tool_catalog', {});
                let catalogInfo = '';
                if (catalogResult.success) {
                    const toolCount = catalogResult.data.totalCount || 0;
                    const toolsList = catalogResult.data.tools || {};
                    
                    // Debug: Check the structure of toolsList
                    console.log('🔍 Tools list structure:', JSON.stringify(toolsList, null, 2));
                    
                    // Format the tools catalog for the AI prompt
                    let toolsText = '\n\n📋 **AVAILABLE TOOLS CATALOG**:\n';
                    
                    try {
                        Object.keys(toolsList).forEach(category => {
                            toolsText += `\n**${category.toUpperCase()}:**\n`;
                            
                            // Check if toolsList[category] is an array
                            if (Array.isArray(toolsList[category])) {
                                toolsList[category].forEach(tool => {
                                    toolsText += `• ${tool}\n`;
                                });
                            } else if (typeof toolsList[category] === 'object') {
                                // If it's an object, extract just the tool name (which is the category key)
                                toolsText += `• ${category.toLowerCase()}\n`;
                            } else {
                                // If it's a string or other type
                                toolsText += `• ${toolsList[category]}\n`;
                            }
                        });
                    } catch (error) {
                        console.error('🔍 Error formatting tools list:', error);
                        toolsText += `\nError formatting tools: ${error.message}\n`;
                        toolsText += `Raw data: ${JSON.stringify(toolsList, null, 2)}\n`;
                    }
                    
                    catalogInfo = toolsText + `\nTotal: ${toolCount} tools available.`;
                    this.addMessageToChat(`🛠️ **Auto Tool Catalog**: Loaded ${toolCount} tools for AI context`, 'system');
                } else {
                    catalogInfo = '\n\n⚠️ **Tool Catalog Warning**: Could not load tool catalog.';
                    this.addMessageToChat(`⚠️ **Tool Catalog Failed**: ${catalogResult.message}`, 'system');
                }
                
                const systemPrompt = `You are an After Effects automation agent. You EXECUTE actions using tools.${catalogInfo}

🎯 COMPLETION SYSTEM:
- ALWAYS call {"tool": "stop", "parameters": {"reason": "explanation"}} when your task is complete
- Check project state after each tool to see if you're done
- Maximum 25 tool calls per request (hard limit, should mention this is the reason for stopping if you reach it and stop because of this — mention only the progress that was actually achieved)

EXECUTION RULES:
1. Start by understanding EXACTLY what "done" looks like for the user's request
2. Tool catalog is already loaded - you have access to all available tools
3. Execute tools step by step toward the completion goal
4. After each tool, check: "Is the project now in the target state?"
5. When target state is reached, call stop() immediately

TOOL FORMAT (use this EXACT format):
{"tool": "exact_tool_name", "parameters": {"param1": "value1"}}

COMPLETION EXAMPLES:
- "make a square" → create shape → call stop("Created square")
- "make two squares" → create first → create second → call stop("Created 2 squares")  
- "animate a square" → create shape → animate it → call stop("Created and animated square")

🎯 ANIMATION GUIDANCE:
- For shape morphing (circle→square): Create a circle, then create a square at the same position, then use animate_layer to fade opacity between them
- CRITICAL LAYER NAMING: Use EXACT layer names from tool success messages:
  * Circle layer is named: "AI Ellipse" (not "AI Ellipse 1")  
  * Rectangle layer is named: "AI Rectangle" (not "AI Rectangle 1")
  * Example: {"tool": "animate_layer", "parameters": {"layer_name": "AI Ellipse", "property": "opacity", "startValue": 100, "endValue": 0, "startTime": 0, "endTime": 2}}
- For opacity: use animate_layer with property="opacity" and startValue/endValue as numbers (0-100)
- For size changes: use animate_layer with property="size" and startValue/endValue as arrays [width, height]
- For position: use animate_layer with property="position" and startValue/endValue as [x, y]
- For rotation: use animate_layer with property="rotation" with degree values
- NO tools called: add_keyframes, set_keyframes - use animate_layer instead

🎯 CRITICAL RULES:
- When setting layer properties to specific values, if layers already have keyframes for that property, use set_layer_property with clear_keyframes: true instead of animate_layer. This prevents existing keyframes from overriding your property setting.
- For INSTANT property changes (no animation), create keyframes with HOLD interpolation using set_layer_property with interpolation: "hold"

CRITICAL: Call stop() when done. Do NOT keep adding more tools after achieving the goal.`;

                // Show debug prompt if enabled
                this.showDebugPrompt(`SYSTEM: ${systemPrompt}\n\nUSER: ${message}`, 'INITIAL PROMPT');

                const response = await this.callGeminiAPI(systemPrompt + '\n\nUser: ' + message);
                
                if (response) {
                    // Check for tool calls in the response and log them
                    const toolCallsForLog = await this.processAIResponse(response);
                    
                    // Log conversation step for full log with tool calls
                    this.logConversationStep(message, systemPrompt, response, toolCallsForLog || []);
                } else {
                    this.addMessageToChat('Sorry, I encountered an error processing your request.', 'assistant');
                }
            } catch (error) {
                console.error('❌ GeminiChat: Error:', error);
                this.addMessageToChat('Error: ' + error.message, 'system');
            }
            
            // Reset processing state
            appState.isProcessing = false;
            appState.shouldStop = false;
            this.showStopButton(false);
            this.updateStatus('● Ready', 'connected');
        }
        
        async processAIResponse(response) {
            let processedResponse = response;
            let toolCallsExecuted = 0;
            const MAX_TOOLS_PER_REQUEST = 25;
            
            // Check if we should stop processing
            if (appState.shouldStop) {
                this.addMessageToChat('🛑 **Processing stopped by user**', 'system');
                appState.isProcessing = false;
                this.showStopButton(false);
                return [];
            }
            
            // Strip markdown code-block fences so we can still parse JSON enclosed in ```json ... ```
            const parseSource = response.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1');
            // Look for JSON tool calls in the cleaned response
            const toolCallPattern = /\{[\s]*"tool"[\s]*:[\s]*"([^"]+)"[\s]*,[\s]*"parameters"[\s]*:[\s]*(\{[^}]*\})\}/g;
            let match;
            let allToolResults = [];
            
            // Add debug info about parsing
            if (appState.debugMode) {
                this.addMessageToChat(`🐛 **Debug**: Parsing response for tool calls\n\nResponse length: ${response.length}\nParsed source length: ${parseSource.length}`, 'system');
            }
            
            // Execute all tool calls found in the response
            try {
                while ((match = toolCallPattern.exec(parseSource)) !== null) {
                    if (!match || !match[1] || !match[2]) {
                        this.addMessageToChat(`🐛 **Debug**: Invalid match found: ${JSON.stringify(match)}`, 'system');
                        continue;
                    }
                const toolName = match[1];
                let parameters;
                
                try {
                    parameters = JSON.parse(match[2]);
                } catch (e) {
                    console.error('🛠️ Error parsing tool parameters:', e);
                    this.addMessageToChat(`❌ **Parse Error**: Could not parse tool parameters for \`${toolName}\``, 'system');
                    continue;
                }
                
                console.log('🛠️ Executing tool from AI:', toolName, 'with parameters:', parameters);
                
                // Show tool execution status
                const timestamp = new Date().toLocaleTimeString();
                const paramStr = Object.keys(parameters).length > 0 ? JSON.stringify(parameters, null, 2) : '{}';
                this.addMessageToChat(`🛠️ **Tool Call** (${timestamp}): \`${toolName}\`\n\`\`\`json\n${paramStr}\n\`\`\``, 'system');
                
                const toolResult = await executeAITool(toolName, parameters);
                toolCallsExecuted++;
                
                // Check for stop tool
                if (toolName === 'stop') {
                    // Handle both 'reason' and 'message' parameters for flexibility
                    const stopMessage = parameters.reason || parameters.message || "No reason provided";
                    this.addMessageToChat(`🛑 **Task Completed**: Task completed: ${stopMessage}`, 'assistant');
                    const stopToolEntry = { 
                        name: toolName, 
                        parameters: parameters, 
                        result: `COMPLETED: Task completed: ${stopMessage}`
                    };
                    allToolResults.push(stopToolEntry);
                    appState.currentSessionToolResults.push(stopToolEntry);
                    appState.isProcessing = false;
                    this.showStopButton(false);
                    return allToolResults; // Stop processing immediately
                }
                
                // Check tool limit
                if (toolCallsExecuted >= MAX_TOOLS_PER_REQUEST) {
                    this.addMessageToChat(`⚠️ **Tool Limit Reached**: Maximum ${MAX_TOOLS_PER_REQUEST} tools per request. Task may be incomplete.`, 'system');
                    appState.isProcessing = false;
                    this.showStopButton(false);
                    return allToolResults;
                }
                
                // Check if user requested stop
                if (appState.shouldStop) {
                    this.addMessageToChat('🛑 **Processing stopped by user**', 'system');
                    appState.isProcessing = false;
                    this.showStopButton(false);
                    return allToolResults;
                }
                
                // Create feedback message for this tool
                let feedbackMessage = '';
                
                if (toolResult.success) {
                    feedbackMessage = `✅ **Tool Success**: ${toolResult.message}`;
                    
                    // Include relevant data from tool results
                    if (toolResult.data) {
                        if (toolName === 'get_tool_catalog') {
                            const toolCount = toolResult.data.totalCount || 0;
                            feedbackMessage += `\n📋 Found ${toolCount} tools available`;
                        } else if (toolName === 'get_project_status') {
                            feedbackMessage += `\n📊 Project Status: ${JSON.stringify(toolResult.data, null, 2)}`;
                        } else if (toolName === 'create_shape_layer' && toolResult.data.size) {
                            feedbackMessage += `\n📐 Shape created with size: [${toolResult.data.size[0]}, ${toolResult.data.size[1]}]`;
                        } else if (toolName === 'list_layers') {
                            feedbackMessage += `\n📋 Current layers: ${JSON.stringify(toolResult.data.layers, null, 2)}`;
                        } else if (toolName === 'create_composition') {
                            feedbackMessage += `\n🎬 Composition created: ${toolResult.data.name || 'New Composition'}`;
                        }
                    }
                    
                } else {
                    feedbackMessage = `❌ **Tool Failed**: ${toolResult.message}`;
                    
                    // Get actual tool parameters and validate
                    try {
                        const toolInfoResult = await executeAITool('get_tool_info', { tool_name: toolName });
                        if (toolInfoResult.success && toolInfoResult.data && toolInfoResult.data.parameters) {
                            const validParams = Object.keys(toolInfoResult.data.parameters);
                            const usedParams = Object.keys(parameters);
                            const wrongParams = usedParams.filter(param => !validParams.includes(param));
                            
                            if (wrongParams.length > 0) {
                                feedbackMessage += `\n🚨 **INVALID PARAMETERS**: ${wrongParams.join(', ')}`;
                                feedbackMessage += `\n✅ **VALID PARAMETERS**: ${validParams.join(', ')}`;
                                feedbackMessage += `\n📖 **TOOL INFO**: ${JSON.stringify(toolInfoResult.data.parameters, null, 2)}`;
                            }
                        }
                    } catch (error) {
                        console.log('Could not validate parameters:', error);
                        // Fallback to generic underscore detection
                        const wrongParams = [];
                        for (const param in parameters) {
                            if (param.includes('_')) {
                                const camelCase = param.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
                                wrongParams.push(`${param} → ${camelCase}`);
                            }
                        }
                        
                        if (wrongParams.length > 0) {
                            feedbackMessage += `\n🚨 **WRONG PARAMETER NAMES**: ${wrongParams.join(', ')}`;
                            feedbackMessage += `\n✅ **USE CAMELCASE**: No underscores! Use camelCase for all parameters.`;
                        }
                    }
                    
                    // Provide general error guidance without hardcoded fixes
                    if (toolResult.message.toLowerCase().includes('object is invalid') || toolResult.message.toLowerCase().includes('no active composition')) {
                        feedbackMessage += `\n🚨 **IMMEDIATE ACTION REQUIRED**: Call create_composition NOW, then retry your original tool. Use this exact format: {"tool": "create_composition", "parameters": {"name": "New Project"}}`;
                    }
                    if (toolResult.message.toLowerCase().includes('property')) {
                        feedbackMessage += `\n💡 **Hint**: Check the tool documentation for correct property names`;
                    }
                    if (toolResult.message.toLowerCase().includes('value') || toolResult.message.toLowerCase().includes('format')) {
                        feedbackMessage += `\n💡 **Hint**: Check parameter format - some properties require arrays like [x, y]`;
                    }
                    }
                    
                    this.addMessageToChat(feedbackMessage, 'system');
                    
                    // Handle confirmation required for deletion tools
                    if (toolResult.message && toolResult.message.includes('Confirmation required') && toolResult.message.includes('confirmDeletion')) {
                        const confirmed = await this.showConfirmationDialog(
                            `Confirm ${toolName}`,
                            `Are you sure you want to ${toolName.replace(/_/g, ' ')}?\n\nThis action cannot be undone.`,
                            'Delete',
                            'Cancel'
                        );
                        
                        if (confirmed) {
                            // Retry with confirmation
                            const retryParams = { ...parameters, confirmDeletion: true };
                            this.addMessageToChat(`🔄 **Retrying with confirmation**: \`${toolName}\``, 'system');
                            
                            const retryResult = await executeAITool(toolName, retryParams);
                            const retryMessage = retryResult.success ? 
                                `✅ **Confirmed & Executed**: ${retryResult.message}` : 
                                `❌ **Still Failed**: ${retryResult.message}`;
                            this.addMessageToChat(retryMessage, 'system');
                            
                            // Update the tool result entry
                            const retryEntry = { 
                                name: toolName, 
                                parameters: retryParams, 
                                result: retryResult.success ? `SUCCESS: ${retryResult.message}` : `FAILED: ${retryResult.message}`
                            };
                            allToolResults.push(retryEntry);
                            appState.currentSessionToolResults.push(retryEntry);
                        } else {
                            this.addMessageToChat(`🚫 **User Cancelled**: ${toolName} was not executed`, 'system');
                        }
                    }
                    
                const toolResultEntry = { 
                    name: toolName, 
                    parameters: parameters, 
                    result: toolResult.success ? 
                        `SUCCESS: ${toolResult.message}${toolResult.data ? `\nData: ${JSON.stringify(toolResult.data)}` : ''}` : 
                        `FAILED: ${toolResult.message}`
                };
                
                allToolResults.push(toolResultEntry);
                appState.currentSessionToolResults.push(toolResultEntry);
                
                // Remove this tool call from the response text
                processedResponse = processedResponse.replace(match[0], '');
                        }
                    } catch (error) {
            const debugInfo = `🐛 Tool parsing error: ${error.message}\nStack: ${error.stack}`;
            console.error(debugInfo);
            this.addMessageToChat(`⚠️ **Tool Parsing Error**: ${error.message}\n\n🐛 **Debug Info**: ${debugInfo}`, 'system');
            appState.isProcessing = false;
            this.showStopButton(false);
            return [];
        }
            
                        // If tools were executed, ask AI to analyze results and continue if needed
            if (toolCallsExecuted > 0) {
                // Check if user requested stop before continuation
                if (appState.shouldStop) {
                    this.addMessageToChat('🛑 **Processing stopped by user**', 'system');
                    appState.isProcessing = false;
                    this.showStopButton(false);
                    return allToolResults;
                    }
                    
                // Get ALL tool results from this session, not just the current batch
                const sessionToolResults = this.getAllSessionToolResults(allToolResults);
                
                // Safety check to prevent undefined errors
                if (!sessionToolResults || !Array.isArray(sessionToolResults)) {
                    const debugInfo = `🔄 Session tool results is not an array: ${typeof sessionToolResults} = ${JSON.stringify(sessionToolResults)}`;
                    console.error(debugInfo);
                    this.addMessageToChat(`⚠️ **Continuation Error**: Session tool results corrupted\n\n🐛 **Debug Info**: ${debugInfo}`, 'system');
                    appState.isProcessing = false;
                    this.showStopButton(false);
                    return allToolResults;
                }
                
                const resultsContext = sessionToolResults.map((tr, index) => 
                    `${index + 1}. Tool: ${tr.name}\n   Parameters: ${JSON.stringify(tr.parameters)}\n   Result: ${tr.result}`
                ).join('\n\n');
                
                const continuationPrompt = `**ALL Tool Execution Results for This Task:**\n${resultsContext}\n\n**Original User Request:** "${this.lastUserMessage}"\n\n**Task Analysis:**\nYou have executed ${sessionToolResults.length} tool(s) so far. Look at ALL the results above and determine:\n\n1. Is the user's request "${this.lastUserMessage}" now complete?\n2. Do you need to execute additional tools?\n3. Are there any errors that need to be addressed?\n\n**Important:** Count the tools you've executed and check if the task is done!\n\nIf you need to continue, execute the next appropriate tool(s). If the task is complete, call stop() with a summary.`;
                
                // Show the continuation prompt in debug mode
                this.showDebugPrompt(continuationPrompt, '[CONTINUATION ANALYSIS]');
                    
                    try {
                    const continuationResponse = await this.callGeminiAPI(continuationPrompt);
                    if (continuationResponse && !appState.shouldStop) {
                        const continuationToolCalls = await this.processAIResponse(continuationResponse);
                        // Add continuation tool calls to the log
                        if (continuationToolCalls && continuationToolCalls.length > 0) {
                            allToolResults.push(...continuationToolCalls);
                        }
                        }
                    } catch (error) {
                    console.error('🔄 Error getting continuation:', error);
                    this.addMessageToChat(`⚠️ **Continuation Error**: ${error.message}`, 'system');
                    appState.isProcessing = false;
                    this.showStopButton(false);
                }
                
                return allToolResults; // Return tool calls for logging
            }
            
            // Check for invalid tool calls if no valid tool call was found
            if (toolCallsExecuted === 0) {
                // Look for potential invalid tool patterns
                const invalidPatterns = [
                    /\{[\s]*"tool_code"[\s]*:[\s]*"([^"]+)"/gi,  // tool_code format
                    /\{[\s]*"tool"[\s]*:[\s]*"([^"]+)"/gi,       // incomplete tool format
                    /print\(([^)]+)\)/gi,                        // print() format
                    /create_shape\(/gi,                          // function call format
                    /add_shape\(/gi                              // function call format
                ];
                
                let invalidMatch = null;
                let matchedPattern = '';
                
                for (let pattern of invalidPatterns) {
                    invalidMatch = pattern.exec(parseSource);
                    if (invalidMatch) {
                        matchedPattern = pattern.source;
                        break;
                    }
                }
                
                if (invalidMatch) {
                    this.addMessageToChat(`❌ **Invalid Tool Format**: Detected invalid tool call format. Use the exact format: {"tool": "create_shape_layer", "parameters": {"shape": "rectangle", "size": [200, 200], "fillColor": [0, 0, 0]}}`, 'system');
                        
                    // Ask AI to use correct format
                    const correctionPrompt = `INCORRECT FORMAT DETECTED. Use this EXACT format to create an opaque square:

{"tool": "create_shape_layer", "parameters": {"shape": "rectangle", "size": [200, 200], "fillColor": [0, 0, 0]}}

Do NOT use:
- tool_code format
- print() functions  
- create_shape() functions
- add_shape() functions

Use the exact JSON format shown above.`;

                    // Show the correction prompt in debug mode
                    this.showDebugPrompt(correctionPrompt, '[FORMAT CORRECTION]');
                        
                        try {
                            const correctionResponse = await this.callGeminiAPI(correctionPrompt);
                        if (correctionResponse && !appState.shouldStop) {
                            const correctionToolCalls = await this.processAIResponse(correctionResponse);
                            return correctionToolCalls || [];
                            }
                        } catch (error) {
                            console.error('🔧 Correction error:', error);
                        this.addMessageToChat(`⚠️ **Correction Error**: ${error.message}`, 'system');
                        appState.isProcessing = false;
                        this.showStopButton(false);
                        }
                    return [];
                }
            }
            
            return allToolResults; // Return tool calls for logging
            
            // Add the remaining response text if there's any
            if (processedResponse.trim()) {
                this.addMessageToChat(processedResponse.trim(), 'assistant');
            }
            
            // If no tool calls were executed but the user is asking for actions, provide guidance
            if (toolCallsExecuted === 0 && this.isActionRequest(this.lastUserMessage)) {
                const suggestions = `\n\n💡 I can help you perform actions in After Effects! Try asking me to:\n` +
                    `• "Create a 4K composition"\n` +
                    `• "Add a text layer with 'Hello World'"\n` +
                    `• "Animate the selected layer's position"\n` +
                    `• "Apply a blur effect"\n` +
                    `• "Get project information"\n` +
                    `• "Show me available tools"`;
                
                this.addMessageToChat(suggestions, 'assistant');
            }
        }
        
        isActionRequest(message) {
            const actionKeywords = ['create', 'add', 'make', 'animate', 'apply', 'generate', 'build', 'setup', 'show'];
            const lowerMessage = message.toLowerCase();
            return actionKeywords.some(keyword => lowerMessage.includes(keyword));
        }
        
        async callGeminiAPI(message) {
            console.log('🌐 GeminiChat: Making API request to Gemini...');
            
            // Get current project status for context
            let projectContext = "";
            try {
                const projectStatus = await executeAITool("get_project_status", {});
                if (projectStatus.success) {
                    projectContext = `\n\nCURRENT PROJECT STATUS:\n${JSON.stringify(projectStatus.data, null, 2)}`;
                }
            } catch (error) {
                console.log('Could not get project status for context');
            }
            
            // Get recent conversation history for context
            const recentHistory = this.getRecentConversationContext();
            
            const systemPrompt = `You are an AI assistant for Adobe After Effects with access to 57+ professional tools across 9 categories.

CONTEXT AWARENESS:
- You have access to the current project status including compositions, layers, and their properties
- You remember recent conversation history and can reference previous work
- When user asks to "edit" or "modify" something, look at existing project elements first
- Use get_project_status tool to check current state before making changes
- Prefer modifying existing elements over creating duplicates

SMART EDITING BEHAVIOR:
- If user says "edit the circle" or "change the mask" - look at project status to find existing elements
- Use layer_name parameter in tools to target specific existing layers
- Before creating new compositions, check if suitable ones already exist
- When user references "the previous thing" or "that animation" - use conversation context to understand what they mean
- Ask clarifying questions if multiple elements could match the user's request

CONVERSATION CONTEXT:
${recentHistory}

PROJECT CONTEXT:
${projectContext}

EXECUTION RULES:
1. For ANY action request, START with a tool call
2. Use ONLY tools from the catalog - no made-up tools
3. If ANY tool fails with "No active composition found", you MUST immediately call create_composition, then retry the original tool
4. Read tool responses and adapt your approach based on results
5. ALWAYS execute tools, NEVER just explain what you could do
6. When you see an error hint telling you to create composition first, DO IT IMMEDIATELY

RENAME-SPECIFIC RULES:
7. When user says "rename all [TYPE]", ONLY rename existing layers - NEVER create new ones
8. If no layers of that type exist, report "No [TYPE] layers found to rename" and stop
9. "rename rectangles" means find layers with "rectangle" in the name, not create rectangles
10. Don't assume user wants new layers created when they ask to rename existing ones

PROPERTY INTERPRETATION RULES:
7. When user says "make [PROPERTY] text", interpret PROPERTY as a visual attribute to apply, NOT as the literal text content
8. Distinguish between property descriptions and content requests:
   - Visual properties: opaque, transparent, red, large, bold, animated, glowing, etc.
   - Content indicators: "text that says", "with the words", "reading", "containing", etc.
9. If the request describes visual characteristics without content indicators, use appropriate placeholder text
10. Apply the described visual properties to the text layer after creation

TRUTHFULNESS RULES:
11. NEVER claim you did something unless you actually executed the tools to do it
12. If you only called get_project_status, you have NOT modified anything
13. Only call stop() AFTER you have actually completed the requested action successfully
14. If any tool FAILS (❌), you have NOT completed the task - do not call stop()
15. Check tool results carefully - "Confirmation required" means the tool DID NOT execute
16. "No layers found matching the criteria" means ZERO layers were renamed - this is FAILURE
17. If you cannot complete the task, explain what tools you need instead of pretending
18. Read tool success/failure messages before claiming completion
19. "INVALID PARAMETERS" means the tool failed - try different tool or parameters
20. If you see ❌ Tool Failed, that tool did NOT work - acknowledge the failure and try alternatives
21. "Tool not found" means you used a non-existent tool name - find the correct tool name
22. When multiple tools fail in sequence, you have NOT completed the task - do not claim success
23. Only successful tools (✅ Tool Success) count as completed actions

WORKFLOW ENFORCEMENT:
24. DO NOT call stop() after only calling get_project_status or list_layers
25. These are INSPECTION tools - you must use the data to perform ACTIONS
26. For positioning requests: inspect → extract coordinates → animate layers → then stop
27. NEVER stop until you have actually moved/animated/modified the requested elements
28. If you get position data, you MUST use it in subsequent animate_layer calls
29. Position animations require: startValue (current position) and endValue (target position)

PARAMETER NAME INTELLIGENCE:
21. When you get INVALID PARAMETERS error, check the VALID PARAMETERS list in the response
22. The tool response shows you the correct parameter names to use
23. Example: if tool expects "layerNames" but you used "names", fix the parameter name and retry
24. NEVER ignore parameter validation errors - they tell you exactly what to fix
25. BETTER: Use get_tool_info BEFORE calling the tool to avoid errors entirely
26. When unsure about ANY tool, check its specification first rather than guessing

TOOL RESPONSE DATA EXTRACTION:
25. When tools return data, extract the information from the response before using other tools
26. analyze_shape_properties returns: {success: true, data: {layerNames: ["layer1", "layer2"], layerIndices: [5, 7, 8, 9]}}
27. CRITICAL: layerIndices are the ACTUAL layer positions, NOT [1,2,3,4] sequence!
28. NEVER assume layerIndices = [1,2,3,4] - they could be [5,7,8,9] or any indices
29. Extract the EXACT layerIndices array from response.data.layerIndices
30. Use those EXACT indices with delete_layers_by_index tool for reliable deletion
31. NEVER hardcode layer indices - always use the actual data returned by analysis tools
32. If a tool fails, you CANNOT use its data - the failure means no valid data was returned
33. The analyze_shape_properties tool response contains the precise layer indices you need

PROPERTY-BASED LAYER IDENTIFICATION:
25. Use analyze_shape_properties tool to find layers with specific properties
26. CORRECT analyze_shape_properties usage: {"tool": "analyze_shape_properties", "parameters": {"property": "rounded_corners"}}
27. WRONG: {"property": "rounded_corners": true} - this is invalid parameter format!
28. Extract layerIndices from the tool response data.layerIndices array
29. EXAMPLE: if response shows layerIndices: [5, 7, 8, 9], use {"layerIndices": [5, 7, 8, 9], "confirmDeletion": true}
30. NEVER use sequential numbers [1,2,3,4] unless that's exactly what the response contains
31. NEVER guess layer properties from names - always use actual property analysis
32. analyze_shape_properties can detect: rounded_corners, repeater, offset, zigzag, pucker_bloat
33. WORKFLOW: analyze_shape_properties → extract EXACT layerIndices → delete_layers_by_index
34. READ the tool response carefully - the indices tell you which layers have the property

CRITICAL ERROR PREVENTION:
7. If you get "Tool not found" error, IMMEDIATELY call get_tool_catalog to see available tools
8. NEVER use duration parameter - ALWAYS use startTime and endTime instead
9. If you get "No layers selected", create the layer first OR use layer targeting parameters
10. Before using any tool, verify it exists in the catalog

PROACTIVE TOOL SPECIFICATION CHECKING:
11. Before calling unfamiliar tools, use get_tool_info to check exact parameter names and requirements
12. get_tool_info usage: {"tool": "get_tool_info", "parameters": {"tool_name": "the_tool_you_want_to_check"}}
13. Extract parameter names from the response.data.parameters object - use EXACT spelling
14. Read usage_notes for special requirements like "selected layers only" or required sequences
15. Use examples from the response as templates for proper formatting
16. This prevents "INVALID PARAMETERS" errors and false success claims

DELETION OPERATIONS:
11. ALL deletion tools require confirmDeletion: true parameter for safety
12. If you get "Confirmation required" error, the system will show a popup to the user
13. Wait for user confirmation before claiming deletion was successful
14. NEVER claim deletion worked unless you see "SUCCESS" in the tool result

PARAMETER RULES:
- animate_mask: Use startTime/endTime, NOT duration
- All animation tools: Use startTime/endTime, NOT duration  
- Layer targeting: Use layer_name, layer_index, or target_newest parameters
- Mask tools: Require existing layers - create shape layer first if needed

LAYER INDEX TARGETING (CRITICAL):
- ALWAYS prefer layer_index over layer_name for reliable targeting
- Layer names can be duplicated causing wrong layer selection
- Layer indices are unique: index 1 = top layer, index 2 = second layer, etc.
- Use list_layers with include_details: true to get current positions and indices
- CORRECT: {"layer_index": 3} to target the 3rd layer from top
- WRONG: {"layer_name": "Icon 1"} when multiple layers have same name
- animate_layer supports both layer_index and layer_name - prefer layer_index
- For multiple layer operations, always get indices first with list_layers tool

LAYER REORDERING TOOLS:
- Use reorder_layer to move individual layers to new positions
- Use arrange_layers for bulk operations like sorting or grouping
- Layer index 1 = topmost layer, higher numbers = lower in stack
- Examples:
  * {"tool": "reorder_layer", "parameters": {"layer_index": 3, "new_index": 1}} // Move layer 3 to top
  * {"tool": "reorder_layer", "parameters": {"layer_name": "Icon", "move_to": "bottom"}} // Move to bottom
  * {"tool": "arrange_layers", "parameters": {"operation": "sort_by_name"}} // Sort all layers alphabetically
  * {"tool": "arrange_layers", "parameters": {"operation": "reverse_order"}} // Reverse current order
- Always check current layer order with list_layers before reordering

LAYER PROPERTY INSPECTION:
- Use list_layers tool to get current layer properties including position
- CORRECT: {"tool": "list_layers", "parameters": {"include_details": true}}
- Returns: position, scale, rotation, opacity for each layer with their indices
- Extract position data: layer.properties.position = [x, y] coordinates
- Use this data to calculate relative positions for animations
- NEVER guess layer positions - always inspect them first

POSITION DATA EXTRACTION (CRITICAL):
- When list_layers returns position data, EXTRACT the exact coordinates from the response
- NEVER use arbitrary positions like [200,200] when you have actual position data
- Always READ and USE the position values from the tool response data

LAYER MANIPULATION:
- To disable/enable layers: Use layer visibility or opacity tools
- To modify layer properties: Use animate_layer with appropriate targeting
- To delete layers: Look for layer deletion tools in catalog
- To rename layers: Use rename_layers tool with findPattern or findNames parameters
- ALWAYS target specific layers by name or index when modifying existing work

LAYER RENAMING INTELLIGENCE:
- Analyze user's request to identify WHAT they want to rename and WHAT they want to rename it TO
- "rename all [THINGS] to [NAME]" means: find layers containing [THINGS], rename them to [NAME]
- Extract the layer type/pattern from the user's words (remove plurals if needed)
- Use findPattern: "*" only when user says "all layers" or similar universal terms
- When no matching layers exist, report failure - NEVER create new layers in rename operations

ROUNDED CORNERS FOR EXISTING SHAPES:
- add_shape_modifiers tool works on SELECTED layers only - it has NO layer targeting parameters
- Step 1: Use select_layers tool to select the shape layers you want to modify
- Step 2: Use add_shape_modifiers with modifier: "round_corners" and cornerRadius: 20
- WRONG: add_shape_modifiers with layer_name parameter (doesn't exist!)
- CORRECT SEQUENCE:
  1. {"tool": "select_layers", "parameters": {"pattern": "hi"}} (to select layers containing "hi")
  2. {"tool": "add_shape_modifiers", "parameters": {"modifier": "round_corners", "cornerRadius": 20}}
- For shapes/squares/rectangles: use pattern matching or type: "shape"
- For specific names: use names: ["layer1", "layer2"] array

POSITION PLANNING FOR ANIMATIONS:
- BEFORE animating, think about WHERE things should end up
- Check existing layer positions using get_project_status to see current layout
- When arranging items "within" or "onto" something, use that target's position as reference
- Calculate logical positions based on the arrangement goal (lined up, grid, etc.)
- NEVER use random coordinates like [10, 10] - always consider the intended final layout
- For multiple items: calculate spacing and positioning relative to target area

TOOL CALLING FORMAT (use this EXACT format):
{"tool": "tool_name", "parameters": {"param1": "value1", "param2": [1, 2, 3]}}

CRITICAL PARAMETER FORMATS - USE EXACT NAMES:
- create_shape_layer: {"tool": "create_shape_layer", "parameters": {"shape": "rectangle", "size": [200, 200], "fillColor": [1, 0, 0], "layerName": "custom name"}}
- create_composition: {"tool": "create_composition", "parameters": {"name": "My Comp", "width": 1920, "height": 1080}}
- stop: {"tool": "stop", "parameters": {"reason": "explanation of completion"}}

EXACT PARAMETER NAMES FOR create_shape_layer:
- "shape" (NOT shape_type, shapeType, type)
- "size" (NOT width/height separately) 
- "fillColor" (NOT fill_color, color)
- "strokeColor" (NOT stroke_color)
- "strokeWidth" (NOT stroke_width)
- "position" (NOT x/y separately)
- "layerName" (optional - for custom layer names)

EXACT PARAMETER NAMES FOR animate_mask:
- "property" (opacity, feather, expansion, path)
- "startTime" (NOT duration)
- "endTime" (NOT duration)
- "startValue" and "endValue"
- "maskIndex" (optional, defaults to 1)

CORRECT TOOLS (don't make up tools):
✅ create_mask, animate_mask, create_shape_layer, animate_layer
❌ modify_mask_properties, get_layer_properties, remove_mask, set_layer_properties

USE EXACT CAMELCASE - NO UNDERSCORES OR WRONG NAMES!

AVAILABLE TOOL CATEGORIES:
- Project Tools: create_project, import_footage, organize_folders
- Composition Tools: create_composition, duplicate_composition, set_composition_settings
- Layer Tools: add_layer, duplicate_layers, align_layers, set_layer_properties, rename_layers
- Animation Tools: animate_layer, add_expression, create_motion_path, sequence_layers
- Effects Tools: apply_effect, remove_effects, copy_effects
- Text Tools: create_text_layer, set_text_opacity, set_text_position, set_text_style, animate_text_properties
- Shape Tools: create_shape_layer, animate_shape_path, add_shape_modifiers
- Render Tools: add_to_render_queue, export_frame, create_proxy
- Mask Tools: create_mask, animate_mask, copy_mask

SHAPE ANIMATION RULES:

For "circle morphs into square" (vertex morphing):
- Use custom_path + animate_shape_path with animationType="morph"

For "circle fills in as square" (progressive reveal):
- Use MASK REVEAL approach with specific sizing

CRITICAL MASK REVEAL PARAMETERS (use these exact values):
create_shape_layer: {"shape": "rectangle", "size": [200, 200]}
create_mask: {"shape": "ellipse", "size": [140, 140]} ← MUST be smaller than square
animate_mask: {"property": "expansion", "startValue": -30, "endValue": 50, "startTime": 0, "endTime": 2} ← MUST use startTime/endTime

WHY THESE VALUES MATTER:
- Square size: [200, 200] = inscribed circle diameter is 200
- Mask size: [140, 140] = smaller than inscribed circle
- Start expansion: -30 = makes visible circle ~110 diameter (inscribed)
- End expansion: +50 = reveals full square corners

WRONG APPROACH (don't do this):
❌ create_mask: {"size": [200, 200]} (too big, shows square immediately)
❌ animate_mask: {"startValue": 0} (should be negative)
❌ animate_mask: {"startValue": 100, "endValue": 0} (backwards)
❌ animate_mask: {"duration": 2} (use startTime/endTime instead)
❌ modify_mask_properties, get_layer_properties, remove_mask (tools don't exist)

WRONG: Two separate shapes with opacity fades

When a user asks for ANY action (create, make, add, animate, etc.), immediately execute the appropriate tool.`;
            
            // Combine system prompt with user message
            const fullPrompt = systemPrompt + "\n\nUser Request: " + message;
            
            // Log the complete prompt for debugging
            this.logConversationStep(message, fullPrompt, null, []);
            this.showDebugPrompt(fullPrompt, 'FULL PROMPT SENT TO AI');
            
            const payload = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: fullPrompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 20000,
                }
            };
            
            try {
                let response;
                const currentApiKey = this.getCurrentApiKey();
                
                if (this.selectedModel === 'gemini') {
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentApiKey}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload)
                    });
                } else if (this.selectedModel === 'o4-mini') {
                    // OpenAI o4-mini API call
                    const openaiPayload = {
                        model: "o4-mini",
                        messages: [
                            {
                                role: "user",
                                content: fullPrompt
                            }
                        ],
                        max_completion_tokens: 20000
                    };
                    
                    response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${currentApiKey}`
                        },
                        body: JSON.stringify(openaiPayload)
                    });
                }
                
                console.log('🌐 GeminiChat: Response status:', response.status);
                
                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('🌐 GeminiChat: API Error:', errorData);
                    throw new Error(`API Error ${response.status}: ${errorData}`);
                }
                
                const data = await response.json();
                console.log('✅ GeminiChat: API Response received');
                
                if (this.selectedModel === 'gemini') {
                    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                        return data.candidates[0].content.parts[0].text;
                    } else {
                        throw new Error('Unexpected Gemini API response format');
                    }
                } else if (this.selectedModel === 'o4-mini') {
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        return data.choices[0].message.content;
                    } else {
                        throw new Error('Unexpected OpenAI API response format');
                    }
                } else {
                    throw new Error('Unknown model selected');
                }
            } catch (error) {
                console.error('❌ GeminiChat: API call failed:', error);
                throw error;
            }
        }
        
        addMessageToChat(message, sender) {
            if (!this.chatMessages) {
                console.error('❌ GeminiChat: Chat messages container not found');
                return;
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${sender}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            if (sender === 'system') {
                contentDiv.className += ' system-message';
            }
            
            // Format the message (basic markdown support)
            let formattedMessage = message
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
            
            contentDiv.innerHTML = formattedMessage;
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(timeDiv);
            
            this.chatMessages.appendChild(messageDiv);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            
            // Save to history
            appState.chatHistory.push({
                message: message,
                sender: sender,
                timestamp: Date.now()
            });
            
            this.saveChatHistory();
        }
        
        loadChatHistory() {
            try {
                const saved = localStorage.getItem('aetools_chat_history');
                if (saved) {
                    appState.chatHistory = JSON.parse(saved);
                    
                    // Load last 10 messages
                    const recentMessages = appState.chatHistory;
                    recentMessages.forEach(msg => {
                        this.addMessageToChat(msg.message, msg.sender);
                    });
                }
            } catch (error) {
                console.error('❌ Error loading chat history:', error);
            }
        }
        
        saveChatHistory() {
            try {
                // Keep only last 50 messages
                if (appState.chatHistory.length > 50) {
                    appState.chatHistory = appState.chatHistory.slice(-50);
                }
                localStorage.setItem('aetools_chat_history', JSON.stringify(appState.chatHistory));
            } catch (error) {
                console.error('❌ Error saving chat history:', error);
            }
        }
        
        clearChatHistory() {
            appState.chatHistory = [];
            localStorage.removeItem('aetools_chat_history');
            if (this.chatMessages) {
                this.chatMessages.innerHTML = '<div class="chat-message assistant"><div class="message-content">Chat history cleared. How can I help you with After Effects?</div></div>';
            }
        }
        
        clearConversation() {
            // Show confirmation dialog
            const confirmed = confirm('Are you sure you want to clear the entire conversation?\n\nThis will delete:\n• All chat messages\n• Full conversation logs\n• Session tool results\n\nThis action cannot be undone.');
            
            if (confirmed) {
                // Clear all conversation data
                appState.chatHistory = [];
                appState.fullConversationLog = [];
                appState.currentSessionToolResults = [];
                
                // Clear localStorage
                localStorage.removeItem('aetools_chat_history');
                
                // Reset chat display
                if (this.chatMessages) {
                    this.chatMessages.innerHTML = '<div class="chat-message assistant"><div class="message-content">🗑️ Conversation cleared! Ready for a fresh start. How can I help you with After Effects?</div></div>';
                }
                
                // Reset any processing state
                appState.isProcessing = false;
                appState.shouldStop = false;
                this.showStopButton(false);
                this.updateStatus('● Ready', 'connected');
                
                console.log('🗑️ Conversation cleared completely');
            }
        }
        
        toggleDebugMode() {
            appState.debugMode = !appState.debugMode;
            const debugBtn = document.getElementById('debugToggle');
            
            if (debugBtn) {
                if (appState.debugMode) {
                    debugBtn.classList.add('active');
                    debugBtn.title = 'Debug Mode: ON - Click to turn off';
                    this.addMessageToChat('🔍 Debug mode enabled - AI prompts will be shown', 'system');
                } else {
                    debugBtn.classList.remove('active');
                    debugBtn.title = 'Debug Mode: OFF - Click to turn on';
                    this.addMessageToChat('🔍 Debug mode disabled', 'system');
                }
            }
            
            console.log('🔍 Debug mode:', appState.debugMode ? 'ON' : 'OFF');
        }
        
        copyFullConversation() {
            try {
                console.log('📋 Copy button clicked, conversation log length:', appState.fullConversationLog.length);
                
                let fullLog = '=== MAXIMISE AE TOOLS - FULL CONVERSATION LOG ===\n\n';
                
                if (appState.fullConversationLog.length === 0) {
                    fullLog += 'No conversation data logged yet.\n\n';
                    fullLog += 'To see conversation logs:\n';
                    fullLog += '1. Enable debug mode (🔍 button)\n';
                    fullLog += '2. Send messages to the AI\n';
                    fullLog += '3. Copy the conversation again\n\n';
                } else {
                    appState.fullConversationLog.forEach((entry, index) => {
                        fullLog += `--- STEP ${index + 1} ---\n`;
                        fullLog += `Timestamp: ${entry.timestamp}\n`;
                        fullLog += `User Message: ${entry.userMessage}\n\n`;
                        
                        if (entry.systemPrompt) {
                            fullLog += `System Prompt Sent:\n${entry.systemPrompt}\n\n`;
                        }
                        
                        if (entry.aiResponse) {
                            fullLog += `AI Response:\n${entry.aiResponse}\n\n`;
                        }
                        
                        if (entry.toolCalls && entry.toolCalls.length > 0) {
                            fullLog += `Tool Calls Executed:\n`;
                            entry.toolCalls.forEach((tool, toolIndex) => {
                                fullLog += `  ${toolIndex + 1}. ${tool.name}(${JSON.stringify(tool.parameters)})\n`;
                                fullLog += `     Result: ${tool.result}\n`;
                            });
                            fullLog += '\n';
                        }
                        
                        fullLog += '=' + '='.repeat(50) + '\n\n';
                    });
                }
                
                // Add current chat history as fallback
                if (this.chatHistory && this.chatHistory.length > 0) {
                    fullLog += '\n=== CHAT HISTORY ===\n\n';
                    this.chatHistory.forEach((msg, index) => {
                        fullLog += `${index + 1}. [${msg.sender}]: ${msg.message}\n`;
                    });
                    fullLog += '\n';
                }
                
                console.log('📋 Generated log length:', fullLog.length);
                
                // Try multiple copy methods
                this.tryMultipleCopyMethods(fullLog);
                
            } catch (error) {
                console.error('❌ Error copying conversation:', error);
                this.addMessageToChat('❌ Error copying conversation: ' + error.message, 'system');
            }
        }
        
        tryMultipleCopyMethods(text) {
            console.log('📋 Trying to copy text...');
            
            // Method 1: Modern clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                console.log('📋 Trying modern clipboard API...');
                navigator.clipboard.writeText(text).then(() => {
                    console.log('📋 Modern clipboard API success');
                    this.addMessageToChat('📋 Full conversation copied to clipboard!', 'system');
                }).catch((err) => {
                    console.log('📋 Modern clipboard API failed:', err);
                    this.tryLegacyCopy(text);
                });
                return;
            }
            
            // Method 2: Legacy copy
            this.tryLegacyCopy(text);
        }
        
        tryLegacyCopy(text) {
            console.log('📋 Trying legacy copy method...');
            
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                textArea.style.opacity = '0';
                textArea.style.zIndex = '-1';
                
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                textArea.setSelectionRange(0, text.length);
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    console.log('📋 Legacy copy success');
                    this.addMessageToChat('📋 Full conversation copied to clipboard!', 'system');
                } else {
                    console.log('📋 Legacy copy failed');
                    this.showCopyFallback(text);
                }
                
            } catch (err) {
                console.error('📋 Legacy copy error:', err);
                this.showCopyFallback(text);
            }
        }
        
        showCopyFallback(text) {
            console.log('📋 All copy methods failed, showing fallback');
            
            // Show the text in the chat so user can manually copy
            this.addMessageToChat('❌ Could not copy to clipboard automatically. Here is the conversation log:', 'system');
            
            // Create a text area in the chat for manual copying
            const logDiv = document.createElement('div');
            logDiv.style.cssText = `
                background: #1a1a1a;
                border: 1px solid #444;
                border-radius: 4px;
                padding: 10px;
                margin: 10px 0;
                font-family: monospace;
                font-size: 11px;
                max-height: 300px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-break: break-word;
                user-select: text;
                cursor: text;
            `;
            logDiv.textContent = text;
            
            if (this.chatMessages) {
                this.chatMessages.appendChild(logDiv);
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
            
            // Also log to console
            console.log('FULL CONVERSATION LOG:\n', text);
            this.addMessageToChat('💡 You can also check the browser console for the full log.', 'system');
        }
        

        
        logConversationStep(userMessage, systemPrompt, aiResponse, toolCalls = []) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                userMessage: userMessage,
                systemPrompt: systemPrompt,
                aiResponse: aiResponse,
                toolCalls: toolCalls
            };
            
            appState.fullConversationLog.push(logEntry);
            
            // Keep only last 50 conversation steps to prevent memory issues
            if (appState.fullConversationLog.length > 50) {
                appState.fullConversationLog = appState.fullConversationLog.slice(-50);
            }
        }
        
        showDebugPrompt(promptContent, promptType = 'INITIAL PROMPT') {
            if (!appState.debugMode) return;
            
            const debugDiv = document.createElement('div');
            debugDiv.className = 'debug-prompt';
            
            const header = document.createElement('div');
            header.className = 'prompt-header';
            header.textContent = `🔍 DEBUG: ${promptType} sent to AI`;
            
            const content = document.createElement('div');
            content.textContent = promptContent;
            
            debugDiv.appendChild(header);
            debugDiv.appendChild(content);
            
            if (this.chatMessages) {
                this.chatMessages.appendChild(debugDiv);
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
        }
        
        showStopButton(show) {
            const stopBtn = document.getElementById('stopAI');
            if (stopBtn) {
                stopBtn.style.display = show ? 'inline-block' : 'none';
            }
        }
        
        stopAIProcessing() {
            console.log('🛑 User requested stop');
            appState.shouldStop = true;
            appState.isProcessing = false;
            this.showStopButton(false);
            this.addMessageToChat('🛑 **Stop requested** - AI will halt after current operation', 'system');
            this.updateStatus('● Ready', 'connected');
        }
        
        getAllSessionToolResults(currentBatchResults) {
            // Return all tool results from the current session
            // This includes tools from previous continuation cycles
            
            // Ensure currentSessionToolResults is always an array
            if (!appState.currentSessionToolResults || !Array.isArray(appState.currentSessionToolResults)) {
                const debugInfo = `🔄 Initializing corrupted currentSessionToolResults: ${typeof appState.currentSessionToolResults} = ${JSON.stringify(appState.currentSessionToolResults)}`;
                console.warn(debugInfo);
                // Show debug info in chat if debug mode is enabled
                if (appState.debugMode && window.geminiChat) {
                    window.geminiChat.addMessageToChat(`🐛 **Debug**: ${debugInfo}`, 'system');
                }
                appState.currentSessionToolResults = [];
            }
            
            return appState.currentSessionToolResults;
        }

        getRecentConversationContext() {
            // Get last 5 user messages and AI responses for context
            const recentMessages = appState.chatHistory.slice(-10).filter(msg => msg.sender !== 'system');
            
            if (recentMessages.length === 0) {
                return "No previous conversation context.";
            }
            
            let context = "RECENT CONVERSATION:\n";
            recentMessages.forEach((msg, index) => {
                const role = msg.sender === 'user' ? 'USER' : 'AI';
                const time = new Date(msg.timestamp).toLocaleTimeString();
                context += `[${time}] ${role}: ${msg.message.substring(0, 200)}${msg.message.length > 200 ? '...' : ''}\n`;
            });
            
            return context;
        }
        
        async showConfirmationDialog(title, message, confirmText = 'OK', cancelText = 'Cancel') {
            return new Promise((resolve) => {
                // Create modal overlay
                const overlay = document.createElement('div');
                overlay.className = 'confirmation-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                `;
                
                // Create dialog
                const dialog = document.createElement('div');
                dialog.className = 'confirmation-dialog';
                dialog.style.cssText = `
                    background: var(--bg-color);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 24px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                `;
                
                dialog.innerHTML = `
                    <h3 style="margin: 0 0 16px 0; color: var(--text-color); font-size: 18px;">${title}</h3>
                    <p style="margin: 0 0 24px 0; color: var(--text-color); line-height: 1.4; white-space: pre-line;">${message}</p>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="cancelBtn" style="
                            padding: 8px 16px;
                            border: 1px solid var(--border-color);
                            background: var(--bg-color);
                            color: var(--text-color);
                            border-radius: 4px;
                            cursor: pointer;
                        ">${cancelText}</button>
                        <button id="confirmBtn" style="
                            padding: 8px 16px;
                            border: 1px solid #e74c3c;
                            background: #e74c3c;
                            color: white;
                            border-radius: 4px;
                            cursor: pointer;
                        ">${confirmText}</button>
                    </div>
                `;
                
                // Add event listeners
                const cancelBtn = dialog.querySelector('#cancelBtn');
                const confirmBtn = dialog.querySelector('#confirmBtn');
                
                const cleanup = () => {
                    document.body.removeChild(overlay);
                };
                
                cancelBtn.addEventListener('click', () => {
                    cleanup();
                    resolve(false);
                });
                
                confirmBtn.addEventListener('click', () => {
                    cleanup();
                    resolve(true);
                });
                
                // ESC key to cancel
                const handleKeydown = (e) => {
                    if (e.key === 'Escape') {
                        cleanup();
                        document.removeEventListener('keydown', handleKeydown);
                        resolve(false);
                    }
                };
                document.addEventListener('keydown', handleKeydown);
                
                // Click overlay to cancel
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        cleanup();
                        resolve(false);
                    }
                });
                
                // Show dialog
                overlay.appendChild(dialog);
                document.body.appendChild(overlay);
                
                // Focus confirm button
                setTimeout(() => confirmBtn.focus(), 100);
            });
        }
    }
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    function updateTheme() {
        if (!isInCEP) {
            console.log('🎨 Theme: Browser mode, using default dark theme');
            document.body.classList.add('dark-theme');
            return;
        }
        
        try {
            var hostEnvironment = csInterface.getHostEnvironment();
            var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
            var panelBgColor = skinInfo.panelBackgroundColor;
            var brightness = panelBgColor.red + panelBgColor.green + panelBgColor.blue;
            
            console.log('🎨 Theme: Brightness level:', brightness);
            
            if (brightness > 0.5) {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
                appState.themeType = 'light';
            } else {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
                appState.themeType = 'dark';
            }
        } catch (error) {
            console.error('🎨 Theme error:', error);
            document.body.classList.add('dark-theme');
        }
    }
    
    function showStatus(message, type) {
        var statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'status ' + (type || 'info');
            
            clearTimeout(statusTimeout);
            statusTimeout = setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'status';
        }, 3000);
        }
    }
    
    function setupDockToggle() {
        const dockBtn = document.getElementById('dockToggle');
        if (dockBtn) {
            dockBtn.addEventListener('click', function() {
                isDocked = !isDocked;
                appState.isDocked = isDocked;
                
                const icon = dockBtn.querySelector('.dock-icon');
                if (icon) {
                    if (isDocked) {
                        icon.textContent = '⚏';
                        dockBtn.style.color = '#4CAF50';
                        dockBtn.title = 'Currently docked - Click to float';
                        showStatus('Panel docked', 'success');
            } else {
                        icon.textContent = '🪟';
                        dockBtn.style.color = '#2196F3';
                        dockBtn.title = 'Currently floating - Click to dock';
                        showStatus('Panel floating', 'info');
                    }
                }
            });
            
            // Keyboard shortcut: Ctrl/Cmd + D
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                    e.preventDefault();
                    dockBtn.click();
                }
            });
        }
    }
    
    // ========================================
    // TRADITIONAL TOOL BUTTON FUNCTIONS
    // ========================================
    
    function openGeminiAPI() {
        if (window.geminiChat) {
            window.geminiChat.showApiModal();
        } else {
            console.error('Gemini chat not initialized');
        }
    }

    function createStandardComposition() {
        executeScript('createStandardComposition()');
    }

    function create4KComposition() {
        executeScript('create4KComposition()');
    }

    function duplicateActiveComposition() {
        executeScript('duplicateActiveComposition()');
    }

    function organizeCompositions() {
        executeScript('organizeCompositions()');
        showStatus('Compositions organized', 'success');
    }

    function addNullToActiveComp() {
        executeScript('addNullToActiveComp()');
    }

    function addAdjustmentLayer() {
        executeScript('addAdjustmentLayer()');
    }

    function centerAnchorPointsForSelected() {
        executeScript('centerAnchorPointsForSelected()');
    }

    function distributeLayersVertically() {
        executeScript('distributeLayersVertically()');
    }

    function distributeLayersHorizontally() {
        executeScript('distributeLayersHorizontally()');
    }

    function easeSelectedKeyframes() {
        executeScript('easeSelectedKeyframes()');
        showStatus('Keyframes eased', 'success');
    }

    function sequenceSelectedLayers() {
        executeScript('sequenceSelectedLayers()');
    }

    function createMotionGraphicsTemplate() {
        executeScript('createMotionGraphicsTemplate()');
        showStatus('Motion Graphics Template created', 'success');
    }

    function createTextLayerWithContent() {
        executeScript('createTextLayerWithContent()');
    }

    function animateTextLayerIn() {
        executeScript('animateTextLayerIn()');
    }

    function addActiveCompToRenderQueue() {
        executeScript('addActiveCompToRenderQueue()');
    }

    function exportCurrentFrame() {
        executeScript('exportCurrentFrame()');
    }

    function optimizeProject() {
        executeScript('optimizeProject()');
        showStatus('Project optimized', 'success');
    }

    function createQuickPreview() {
        executeScript('jsx/quickPreview.jsx');
    }
    
    // Reset cursor function to fix stuck hand cursor
    function resetCursorState() {
        console.log('🔄 Resetting cursor state...');
        executeScript('jsx/cursor_fix.jsx');
        
        // Also try using the AI tool directly
        executeAITool('reset_ui_state', {}).then(result => {
            console.log('🔄 UI state reset result:', result);
            showStatus('Cursor reset completed', 'info');
        }).catch(error => {
            console.error('🔄 Error resetting UI state:', error);
            showStatus('Error resetting cursor: ' + error.message, 'error');
        });
    }

    // Test moving square with correct tool names
    function testMovingSquare() {
        console.log('🎯 Testing moving square with correct tools...');
        executeScript('$.evalFile("' + csInterface.getSystemPath(CSInterface.SystemPath.EXTENSION) + '/jsx/test_moving_square.jsx"); testMovingSquareWorkflow();').then(result => {
            console.log('🎯 Test result:', result);
            showStatus('Moving square test completed', 'info');
        }).catch(error => {
            console.error('🎯 Test error:', error);
            showStatus('Error testing moving square: ' + error.message, 'error');
        });
    }

    // Test intelligent animation targeting
    function testIntelligentAnimation() {
        console.log('🧠 Testing intelligent animation targeting...');
        executeScript('$.evalFile(\"' + csInterface.getSystemPath(CSInterface.SystemPath.EXTENSION) + '/jsx/test_intelligent_animation.jsx\"); testIntelligentAnimation();').then(result => {
            console.log('🧠 Test result:', result);
            showStatus('Intelligent animation test completed', 'info');
        }).catch(error => {
            console.error('🧠 Test error:', error);
            showStatus('Error testing intelligent animation: ' + error.message, 'error');
        });
    }

    // Test backward compatibility for animation
    function testBackwardCompatibility() {
        console.log('🔄 Testing backward compatibility for animation...');
        executeScript('$.evalFile(\"' + csInterface.getSystemPath(CSInterface.SystemPath.EXTENSION) + '/jsx/test_backward_compatibility.jsx\"); testBackwardCompatibility();').then(result => {
            console.log('🔄 Test result:', result);
            showStatus('Backward compatibility test completed', 'info');
        }).catch(error => {
            console.error('🔄 Test error:', error);
            showStatus('Error testing backward compatibility: ' + error.message, 'error');
        });
    }

    // Test dock animation fix
    function testDockAnimationFix() {
        console.log('🏗️ Testing dock animation fix...');
        executeScript('$.evalFile(\"' + csInterface.getSystemPath(CSInterface.SystemPath.EXTENSION) + '/jsx/test_dock_fixed.jsx\"); testDockAnimationFixed();').then(result => {
            console.log('🏗️ Test result:', result);
            showStatus('Dock animation fix test completed', 'info');
        }).catch(error => {
            console.error('🏗️ Test error:', error);
            showStatus('Error testing dock animation fix: ' + error.message, 'error');
        });
    }

    // Test easing fix
    function testEasingFix() {
        console.log('🔧 Testing easing fix...');
        executeScript('$.evalFile(\"' + csInterface.getSystemPath(CSInterface.SystemPath.EXTENSION) + '/jsx/test_easing_fix.jsx\"); testEasingFix();').then(result => {
            console.log('🔧 Test result:', result);
            showStatus('Easing fix test completed', 'info');
        }).catch(error => {
            console.error('🔧 Test error:', error);
            showStatus('Error testing easing fix: ' + error.message, 'error');
        });
    }

    // Test moving square function
    function testMovingSquare() {
        console.log('🧪 Testing moving square...');
        executeScript('testSimpleMovingSquare()').then(result => {
            console.log('🧪 Moving square result:', result);
            showStatus('Test completed: ' + result, 'info');
        }).catch(error => {
            console.error('🧪 Moving square error:', error);
            showStatus('Test failed: ' + error.message, 'error');
        });
    }

    // Add new debug shape creation test
    function debugShapeCreation() {
        console.log('🔍 DEBUG: Testing shape creation step by step...');
        
        const debugScript = `
        try {
            // Load consolidated tools
            $.evalFile(File($.fileName).parent.fsName + "/jsx/ae_tools_consolidated.jsx");
            
            var results = [];
            results.push("🔍 DEBUG: Starting shape creation test...");
            
            // Step 1: Check project
            if (!app.project) {
                results.push("❌ No project found");
                JSON.stringify({success: false, message: "No project found", results: results});
            } else {
                results.push("✅ Project exists");
                
                // Step 2: Create composition
                var comp = app.project.items.addComp("Debug Test Comp", 1920, 1080, 1, 10, 30);
                comp.openInViewer();
                results.push("✅ Composition created: " + comp.name);
                
                // Step 3: Check active item
                var activeItem = app.project.activeItem;
                if (!activeItem || !(activeItem instanceof CompItem)) {
                    results.push("❌ No active composition");
                    JSON.stringify({success: false, message: "No active composition", results: results});
                } else {
                    results.push("✅ Active composition: " + activeItem.name);
                    
                    // Step 4: Test shape creation using our tool
                    var shapeResult = executeComprehensiveAITool("create_shape_layer", {
                        "shape": "rectangle",
                        "size": [200, 200],
                        "fillColor": [1, 0, 0]
                    });
                    
                    var parsedResult = JSON.parse(shapeResult);
                    results.push("🛠️ Shape tool result: " + (parsedResult.success ? "SUCCESS" : "FAILED"));
                    results.push("📝 Shape message: " + parsedResult.message);
                    
                    if (!parsedResult.success) {
                        // Manual debugging of shape creation
                        results.push("🔧 Manual debugging...");
                        
                        app.beginUndoGroup("Debug Manual Shape");
                        var shapeLayer = activeItem.layers.addShape();
                        results.push("✅ Shape layer created manually");
                        
                        var contents = shapeLayer.property("Contents");
                        results.push("✅ Contents property found");
                        
                        var shape = contents.addProperty("ADBE Vector Shape - Rect");
                        results.push("✅ Rectangle shape added");
                        
                        // Test property access methods
                        var sizeProp = null;
                        try {
                            sizeProp = shape.property("ADBE Vector Rect Size");
                            results.push("✅ ADBE Vector Rect Size found");
                        } catch (e) {
                            results.push("❌ ADBE Vector Rect Size failed: " + e.toString());
                            try {
                                sizeProp = shape.property("Size");
                                results.push("✅ Size property found as fallback");
                            } catch (e2) {
                                results.push("❌ Size property also failed: " + e2.toString());
                                
                                // List all properties
                                results.push("📋 Available properties:");
                                for (var i = 1; i <= shape.numProperties; i++) {
                                    var prop = shape.property(i);
                                    results.push("  " + i + ": " + prop.name + " (" + prop.matchName + ")");
                                }
                            }
                        }
                        
                        if (sizeProp) {
                            try {
                                sizeProp.setValue([200, 200]);
                                results.push("✅ Size set successfully");
                            } catch (e) {
                                results.push("❌ setValue failed: " + e.toString());
                            }
                        }
                        
                        app.endUndoGroup();
                    }
                    
                    JSON.stringify({success: true, message: "Debug completed", results: results});
                }
            }
            
        } catch (error) {
            JSON.stringify({success: false, message: "FATAL: " + error.toString(), results: ["💥 " + error.toString()]});
        }
        `;
        
        executeScript(debugScript).then(result => {
            console.log('🔍 Debug result:', result);
            const parsed = JSON.parse(result);
            
            // Display results in chat
            const chat = window.geminiChat;
            if (chat) {
                chat.addMessageToChat('🔍 **Debug Shape Creation Results:**', 'system');
                parsed.results.forEach(line => {
                    chat.addMessageToChat(line, 'system');
                });
                chat.addMessageToChat(`**Final Status:** ${parsed.success ? 'SUCCESS' : 'FAILED'} - ${parsed.message}`, 'system');
            }
            
            showStatus('Debug completed: ' + (parsed.success ? 'SUCCESS' : 'FAILED'), parsed.success ? 'success' : 'error');
        }).catch(error => {
            console.error('🔍 Debug error:', error);
            showStatus('Debug failed: ' + error.message, 'error');
        });
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Show corresponding content
                const targetContent = document.getElementById(targetTab + 'Tab');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Initialize Simple Chat when chat tab is opened
                if (targetTab === 'chat' && !window.simpleChatManager) {
                    console.log('🤖 Initializing Simple Chat Manager...');
                    window.simpleChatManager = new SimpleChatManager();
                }
                
                console.log('🔄 Switched to tab:', targetTab);
            });
        });
    }
    
    function setupManualToolTesting() {
        const executeBtn = document.getElementById('executeToolBtn');
        const clearBtn = document.getElementById('clearToolBtn');
        const catalogBtn = document.getElementById('getToolCatalogBtn');
        const toolInput = document.getElementById('toolInput');
        const toolResults = document.getElementById('toolResults');
        
        if (executeBtn) {
            executeBtn.addEventListener('click', async () => {
                const inputText = toolInput.value.trim();
                if (!inputText) {
                    showToolResult('Please enter a tool call JSON', 'error');
                    return;
                }
                
                try {
                    const toolCall = JSON.parse(inputText);
                    if (!toolCall.tool || !toolCall.parameters) {
                        showToolResult('Invalid format. Use: {"tool": "tool_name", "parameters": {...}}', 'error');
                        return;
                    }
                    
                    showToolResult('Executing tool: ' + toolCall.tool, 'info');
                    const result = await executeAITool(toolCall.tool, toolCall.parameters);
                    showToolResult(JSON.stringify(result, null, 2), result.success ? 'success' : 'error');
                    
                } catch (error) {
                    showToolResult('JSON Parse Error: ' + error.message, 'error');
                }
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                toolInput.value = '';
                toolResults.innerHTML = '';
            });
        }
        
        if (catalogBtn) {
            catalogBtn.addEventListener('click', async () => {
                showToolResult('Getting tool catalog...', 'info');
                const result = await executeAITool('get_tool_catalog', {});
                showToolResult(JSON.stringify(result, null, 2), result.success ? 'success' : 'error');
            });
        }
        
        function showToolResult(message, type) {
            if (toolResults) {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'results-output ' + type;
                resultDiv.textContent = message;
                toolResults.appendChild(resultDiv);
                toolResults.scrollTop = toolResults.scrollHeight;
            }
        }
    }
    
    // ========================================
    // SCRIPT GENERATOR FUNCTIONALITY
    // ========================================
    
    class ScriptGenerator {
        constructor() {
            this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
            
            // Try to get OpenAI key from global geminiChat instance if available
            let openaiKey = localStorage.getItem('openai_api_key');
            if (!openaiKey && window.geminiChat && window.geminiChat.openaiApiKey) {
                openaiKey = window.geminiChat.openaiApiKey;
            }
            this.openaiApiKey = openaiKey || null;
            
            this.selectedModel = localStorage.getItem('selected_model') || 'gemini';
            this.currentScript = '';
            this.isGenerating = false;
            
            // Context data
            this.projectContext = null;
            this.screenshots = [];
            
            // Initialize Enhanced RAG system and AI Agent
            this.enhancedRAG = new window.EnhancedRAG();
            this.aiAgent = new window.AIAgentWithRAG();
            
            console.log('🎬 ScriptGenerator: Initializing with AI Agent + RAG Tool...');
            this.initializeElements();
        }
        
        getCurrentApiKey() {
            if (this.selectedModel === 'gemini') {
                return this.geminiApiKey;
            } else {
                // Try to get OpenAI key from global geminiChat instance if available
                if (window.geminiChat && window.geminiChat.openaiApiKey) {
                    this.openaiApiKey = window.geminiChat.openaiApiKey;
                }
                return this.openaiApiKey;
            }
        }
        
        initializeElements() {
            this.scriptRequest = document.getElementById('scriptRequest');
            this.generateBtn = document.getElementById('generateScript');
            this.generatedScript = document.getElementById('generatedScript');
            this.runBtn = document.getElementById('runScript');
            this.copyBtn = document.getElementById('copyScript');
            this.clearBtn = document.getElementById('clearScript');
            this.scriptStatus = document.getElementById('scriptStatus');
            this.scriptResults = document.getElementById('scriptResults');
            
            // Model selector
            this.modelSelect = document.getElementById('scriptModelSelect');
            if (this.modelSelect) {
                this.modelSelect.value = this.selectedModel;
            }
            
            // Context elements
            this.exportProjectBtn = document.getElementById('exportProjectBtn');
            this.downloadJsonBtn = document.getElementById('downloadJsonBtn');
            this.screenshotUpload = document.getElementById('screenshotUpload');
            this.clearContextBtn = document.getElementById('clearContextBtn');
            this.contextPreview = document.getElementById('contextPreview');
            
            this.setupEventListeners();
        }
        
        setupEventListeners() {
            if (this.generateBtn) {
                this.generateBtn.addEventListener('click', () => this.generateScript());
            }
            
            if (this.runBtn) {
                this.runBtn.addEventListener('click', () => this.runScript());
            }
            
            if (this.copyBtn) {
                this.copyBtn.addEventListener('click', () => this.copyScript());
            }
            
            if (this.clearBtn) {
                this.clearBtn.addEventListener('click', () => this.clearAll());
            }
            
            // Enter key in request textarea
            if (this.scriptRequest) {
                this.scriptRequest.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        this.generateScript();
                    }
                });
            }

            // 🔄 Listen for model selection changes
            if (this.modelSelect) {
                this.modelSelect.addEventListener('change', (e) => {
                    this.selectedModel = e.target.value;
                    localStorage.setItem('selected_model', this.selectedModel);
                    console.log('🎬 ScriptGenerator: Model switched to', this.selectedModel);
                    
                    // Update global model selector if it exists
                    const globalModelSelect = document.getElementById('modelSelect');
                    if (globalModelSelect) {
                        globalModelSelect.value = this.selectedModel;
                    }
                    
                    // Refresh UI status immediately
                    this.updateStatus(`Ready (${this.selectedModel === 'gemini' ? 'Gemini' : 'OpenAI'})`, 'info');
                });
            }
            
            // 🔄 Listen for global model selection changes to keep in sync
            const globalModelSelect = document.getElementById('modelSelect');
            if (globalModelSelect) {
                // Set dropdown to current value if Script Generator tab is opened first
                globalModelSelect.value = this.selectedModel;

                globalModelSelect.addEventListener('change', (e) => {
                    this.selectedModel = e.target.value;
                    localStorage.setItem('selected_model', this.selectedModel);
                    
                    // Update script generator model selector if it exists
                    if (this.modelSelect) {
                        this.modelSelect.value = this.selectedModel;
                    }
                    
                    console.log('🎬 ScriptGenerator: Model switched to', this.selectedModel);
                    // Refresh UI status immediately
                    this.updateStatus(`Ready (${this.selectedModel === 'gemini' ? 'Gemini' : 'OpenAI'})`, 'info');
                });
            }

            // 🔧 Listen for changes in generated script textarea to enable buttons
            if (this.generatedScript) {
                this.generatedScript.addEventListener('input', () => {
                    const hasContent = this.generatedScript.value.trim().length > 0;
                    this.runBtn.disabled = !hasContent;
                    this.copyBtn.disabled = !hasContent;
                });
                
                // Also check on paste
                this.generatedScript.addEventListener('paste', () => {
                    // Use setTimeout to let paste complete first
                    setTimeout(() => {
                        const hasContent = this.generatedScript.value.trim().length > 0;
                        this.runBtn.disabled = !hasContent;
                        this.copyBtn.disabled = !hasContent;
                    }, 10);
                });
            }
            
            // Context controls
            if (this.exportProjectBtn) {
                this.exportProjectBtn.addEventListener('click', () => this.exportProjectContext());
            }
            
            if (this.downloadJsonBtn) {
                this.downloadJsonBtn.addEventListener('click', () => {
                    console.log('🔥 Download JSON button clicked!');
                    this.downloadProjectJson();
                });
            } else {
                console.warn('⚠️ Download JSON button not found during initialization');
            }
            
            if (this.screenshotUpload) {
                this.screenshotUpload.addEventListener('change', (e) => this.handleScreenshotUpload(e));
            }
            
            if (this.clearContextBtn) {
                this.clearContextBtn.addEventListener('click', () => this.clearContext());
            }
        }
        
        updateStatus(message, type = 'info') {
            if (this.scriptStatus) {
                this.scriptStatus.textContent = message;
                this.scriptStatus.className = `script-status-text ${type}`;
            }
        }
        
        showResult(message, type = 'info') {
            if (this.scriptResults) {
                this.scriptResults.innerHTML = message;
                this.scriptResults.className = `script-results-output ${type}`;
            }
        }
        
        async searchSuperMemory(query) {
            /**
             * Search SuperMemory for relevant AE scripting documentation
             * Using the correct API format from: https://supermemory.ai/docs/api-reference/search-memories/search-memories
             */
            const SUPERMEMORY_API_KEY = "sm_9EmnKGymb8eSiDpjMXjJPR_GcYFIWJsXYCWbTOgKBPaBoZwmjsBVozxEYwSdnfMYeSfiCOyDuaosoVaQaRusVcD";
            
            try {
                const response = await fetch('https://api.supermemory.ai/v3/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPERMEMORY_API_KEY}`
                    },
                    body: JSON.stringify({
                        q: query
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    return result.results || [];
                } else {
                    console.warn('SuperMemory search failed:', response.status);
                    return [];
                }
            } catch (error) {
                console.warn('SuperMemory search error:', error);
                return [];
            }
        }
        
        async generateScript() {
            const request = this.scriptRequest.value.trim();
            if (!request) {
                this.updateStatus('Please enter a description', 'error');
                return;
            }
            
            const currentApiKey = this.getCurrentApiKey();
            if (!currentApiKey) {
                const modelName = this.selectedModel === 'gemini' ? 'Gemini' : 'OpenAI';
                this.updateStatus('API key not configured', 'error');
                this.showResult(`Please configure your ${modelName} API key in the AI Assistant tab.`, 'error');
                return;
            }
            
            this.isGenerating = true;
            this.generateBtn.disabled = true;
            this.updateStatus('Starting AI Agent with RAG Tool...', 'generating');
            this.showResult('🤖 AI Agent analyzing request and calling RAG tool as needed...', 'info');
            
            try {
                // Build context information
                const contextInfo = this.buildContextPrompt();
                
                // Use AI Agent with iterative RAG tool calls, passing project JSON
                const result = await this.aiAgent.generateScriptWithIterativeRAG(request, contextInfo, this.projectContext);
                
                if (result.success) {
                    this.currentScript = result.script;
                    this.generatedScript.value = result.script;
                    
                    console.log('📄 Final script length:', result.script.length);
                    console.log('🔍 Script preview:', result.script.substring(0, 100) + '...');
                    
                    // Enable buttons
                    this.runBtn.disabled = false;
                    this.copyBtn.disabled = false;
                    
                    this.updateStatus('Script generated successfully!', 'ready');
                    
                    // Show detailed success message with AI Agent info
                    if (result.ragCalls > 0) {
                        this.showResult(`✅ **SCRIPT GENERATED SUCCESSFULLY!**\n\n🔧 **AI Agent Process:**\n- Made ${result.ragCalls} RAG tool calls for documentation research\n- Used documentation sources: ${result.sources.join(', ')}\n- Generated ${result.script.split('\n').length} lines of ExtendScript\n\n📄 **READY TO RUN:**\nClean ExtendScript has been extracted and is ready for execution.\nClick "Run Script" to execute ONLY the script code in After Effects.\n\n🔍 **Agent Analysis Summary:**\n${result.analysisPhase.substring(0, 200)}...`, 'success');
                    } else {
                        this.showResult(`⚠️ **SCRIPT GENERATED WITH WARNING!**\n\n🚨 AI Agent did not make any RAG documentation calls.\nThis may result in less accurate ExtendScript code.\n\n📄 Script is ready but may need manual review.\nClick "Run Script" to execute it in After Effects.`, 'warn');
                    }
                } else {
                    throw new Error(result.error || 'AI Agent generation failed');
                }
                
            } catch (error) {
                console.error('❌ AI Agent script generation error:', error);
                this.updateStatus('Generation failed', 'error');
                this.showResult(`Error generating script with AI Agent: ${error.message}`, 'error');
            } finally {
                this.isGenerating = false;
                this.generateBtn.disabled = false;
            }
        }
        
        cleanGeneratedScript(response) {
            // Remove markdown code blocks
            let cleaned = response.replace(/```(?:javascript|jsx|js)?\s*/gi, '').replace(/```\s*$/gm, '');
            
            // Remove any explanatory text before or after the script
            // Look for the first line that looks like ExtendScript (comments, function declarations, etc.)
            const lines = cleaned.split('\n');
            let startIndex = 0;
            let endIndex = lines.length - 1;
            
            // Find start of actual script
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('//') || 
                    line.startsWith('/*') || 
                    line.startsWith('(function') ||
                    line.startsWith('function') ||
                    line.startsWith('try') ||
                    line.startsWith('var ') ||
                    line.startsWith('app.') ||
                    line.startsWith('if (')) {
                    startIndex = i;
                    break;
                }
            }
            
            // Find end of actual script (remove trailing explanations)
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.endsWith(';') || 
                    line.endsWith('}') ||
                    line.endsWith('*/') ||
                    line.endsWith(')();')) {
                    endIndex = i;
                    break;
                }
            }
            
            return lines.slice(startIndex, endIndex + 1).join('\n').trim();
        }
        
        async callGeminiAPI(prompt) {
            const currentApiKey = this.getCurrentApiKey();
            let response;
            
            if (this.selectedModel === 'gemini') {
                const payload = {
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.3, // Lower temperature for more consistent code generation
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 80000,
                    }
                };
                
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });
            } else if (this.selectedModel === 'o4-mini') {
                const openaiPayload = {
                    model: "o4-mini",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_completion_tokens: 8000
                };
                
                response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentApiKey}`
                    },
                    body: JSON.stringify(openaiPayload)
                });
            }
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error ${response.status}: ${errorData}`);
            }
            
            const data = await response.json();
            
            if (this.selectedModel === 'gemini') {
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error('Unexpected Gemini API response format');
                }
            } else if (this.selectedModel === 'o4-mini') {
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content;
                } else {
                    throw new Error('Unexpected OpenAI API response format');
                }
            } else {
                throw new Error('Unknown model selected');
            }
        }
        
        async runScript() {
            // Always pull latest content from the textarea so user edits are respected
            this.currentScript = (this.generatedScript && this.generatedScript.value) ? this.generatedScript.value.trim() : '';

            if (!this.currentScript) {
                this.showResult('No script to run', 'error');
                return;
            }

            this.updateStatus('Running script...', 'generating');
            this.showResult('Executing script in After Effects...', 'info');

            try {
                // Use silent execution that won't show popups to user
                const result = await this.executeScriptSilent(this.currentScript);
                console.log('🎬 Script execution result:', result);

                // Try to parse the result to see if it's a JSON response
                let parsedResult;
                try {
                    parsedResult = JSON.parse(result);
                } catch (e) {
                    // Not JSON, treat as plain text
                    parsedResult = { success: true, message: result || 'Script executed successfully' };
                }

                if (parsedResult.success === false) {
                    this.updateStatus('Script failed', 'error');
                    this.showResult(`❌ Script Error: ${parsedResult.message || result}`, 'error');
                } else {
                    this.updateStatus('Script executed successfully!', 'ready');
                    this.showResult(`✅ Success: ${parsedResult.message || 'Script completed successfully'}`, 'success');
                }

            } catch (error) {
                console.error('❌ Script execution error:', error);
                this.updateStatus('Execution failed', 'error');
                this.showResult(`❌ Execution Error: ${error.message}`, 'error');
            }
        }

        // Silent script execution that catches errors without showing popups
        executeScriptSilent(script) {
            return new Promise((resolve) => {
                if (!isInCEP) {
                    console.warn('⚠️ Not in CEP environment, cannot execute script');
                    resolve('{"success": false, "message": "Not in CEP environment"}');
                    return;
                }

                // Execute the user script directly - it should handle its own error reporting
                csInterface.evalScript(script, (result) => {
                    console.log('🎬 Raw script result:', result);
                    
                    if (result === 'EvalScript error.') {
                        // Even evalScript errors should be handled silently
                        resolve('{"success": false, "message": "ExtendScript evaluation error - check script syntax"}');
                    } else if (!result || result.trim() === '') {
                        // Empty result means script ran but didn't return anything
                        resolve('{"success": true, "message": "Script executed successfully (no return value)"}');
                    } else {
                        // Try to parse the result - if it's valid JSON, use it; otherwise treat as success message
                        try {
                            const parsed = JSON.parse(result);
                            resolve(result); // Return the raw JSON string
                        } catch (e) {
                            // Not JSON, treat as success message
                            resolve(`{"success": true, "message": "Script completed: ${result}"}`);
                        }
                    }
                });
            });
        }
        
        copyScript() {
            // Use latest content from textarea so manual edits are copied
            this.currentScript = (this.generatedScript && this.generatedScript.value) ? this.generatedScript.value.trim() : '';

            if (!this.currentScript) {
                this.showResult('No script to copy', 'error');
                return;
            }
            
            // Try multiple copy methods
            this.tryMultipleCopyMethods(this.currentScript);
        }
        
        tryMultipleCopyMethods(text) {
            // Method 1: Modern clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showResult('✅ Script copied to clipboard!', 'success');
                }).catch((err) => {
                    this.tryLegacyCopy(text);
                });
                return;
            }
            
            // Method 2: Legacy copy
            this.tryLegacyCopy(text);
        }
        
        tryLegacyCopy(text) {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                textArea.style.opacity = '0';
                textArea.style.zIndex = '-1';
                
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                textArea.setSelectionRange(0, text.length);
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    this.showResult('✅ Script copied to clipboard!', 'success');
                } else {
                    this.showResult('❌ Could not copy to clipboard. Please manually copy from the text area.', 'error');
                }
                
            } catch (err) {
                this.showResult('❌ Copy failed. Please manually copy from the text area.', 'error');
            }
        }
        
        clearAll() {
            this.scriptRequest.value = '';
            this.generatedScript.value = '';
            this.currentScript = '';
            
            this.runBtn.disabled = true;
            this.copyBtn.disabled = true;
            
            this.updateStatus('Ready to generate', 'info');
            this.showResult('', 'info');
            this.scriptResults.innerHTML = '';
        }
        
        // Context Management Methods
        async exportProjectContext() {
            if (!isInCEP) {
                this.showResult('❌ Project export only works in After Effects', 'error');
                return;
            }
            
            this.updateStatus('Exporting project data...', 'generating');
            
            try {
                // Use CSInterface to load and execute the export script
                const extensionPath = csInterface.getSystemPath(CSInterface.SystemPath.EXTENSION);
                const exportScriptPath = extensionPath + '/jsx/export_project.jsx';
                
                // Load the script using evalFile and then execute it
                const loadAndExecuteScript = `
                    $.evalFile("${exportScriptPath}");
                    exportProjectData();
                `;
                
                csInterface.evalScript(loadAndExecuteScript, (result) => {
                    try {
                        const exportResult = JSON.parse(result);
                        if (exportResult.success) {
                            this.projectContext = exportResult.data;
                            this.updateContextPreview();
                            // Show download button
                            if (this.downloadJsonBtn) {
                                this.downloadJsonBtn.style.display = 'flex';
                                console.log('✅ Download button shown');
                            } else {
                                console.warn('⚠️ Download button not found when trying to show it');
                            }
                            this.updateStatus('Project exported successfully', 'ready');
                            this.showResult('✅ Project context captured! This will be included in your script generation. Click "Download JSON" to save the full data.', 'success');
                        } else {
                            throw new Error(exportResult.message);
                        }
                    } catch (error) {
                        console.error('Export parse error:', error);
                        this.showResult(`❌ Export failed: ${error.message}`, 'error');
                        this.updateStatus('Export failed', 'error');
                    }
                });
                
            } catch (error) {
                console.error('Export script load error:', error);
                this.showResult(`❌ Could not load export script: ${error.message}`, 'error');
                this.updateStatus('Export failed', 'error');
            }
        }
        
        handleScreenshotUpload(event) {
            const files = event.target.files;
            if (files.length === 0) return;
            
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                this.showResult('❌ Please select an image file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const screenshot = {
                    name: file.name,
                    data: e.target.result,
                    size: file.size,
                    type: file.type
                };
                
                this.screenshots.push(screenshot);
                this.updateContextPreview();
                this.showResult(`✅ Screenshot "${file.name}" added to context`, 'success');
            };
            
            reader.onerror = () => {
                this.showResult('❌ Failed to read image file', 'error');
            };
            
            reader.readAsDataURL(file);
            
            // Reset input
            event.target.value = '';
        }
        
        clearContext() {
            this.projectContext = null;
            this.screenshots = [];
            // Hide download button
            if (this.downloadJsonBtn) {
                this.downloadJsonBtn.style.display = 'none';
            }
            this.updateContextPreview();
            this.showResult('🗑️ Context cleared', 'info');
        }
        
        downloadProjectJson() {
            console.log('🔥 downloadProjectJson called');
            console.log('📄 Project context exists:', !!this.projectContext);
            
            if (!this.projectContext) {
                this.showResult('❌ No project data to download', 'error');
                return;
            }
            
            try {
                // Create a formatted JSON string with indentation for readability
                const jsonString = JSON.stringify(this.projectContext, null, 2);
                console.log('📄 JSON string length:', jsonString.length);
                
                // Set the filename
                const projectName = this.projectContext.name || 'project';
                const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `${safeProjectName}_${timestamp}.json`;
                
                // Method 1: Try CEP file system to save directly to Downloads folder
                if (isInCEP) {
                    try {
                        // Use a function approach to avoid string interpolation issues
                        const saveToDownloadsScript = `
                            function saveJsonToDownloads(jsonData, fileName) {
                                try {
                                    // Get the user's Downloads folder
                                    var downloadsFolder;
                                    if (Folder.fs === "Windows") {
                                        downloadsFolder = new Folder(Folder.userData.parent.fullName + "/Downloads");
                                    } else {
                                        downloadsFolder = new Folder(Folder.userData.parent.fullName + "/Downloads");
                                    }
                                    
                                    // Create Downloads folder if it doesn't exist
                                    if (!downloadsFolder.exists) {
                                        downloadsFolder.create();
                                    }
                                    
                                    // Create file in Downloads folder
                                    var file = new File(downloadsFolder.fullName + "/" + fileName);
                                    
                                    // Write JSON data to file
                                    file.open("w");
                                    file.write(jsonData);
                                    file.close();
                                    
                                    return JSON.stringify({
                                        success: true,
                                        message: "File saved to Downloads folder",
                                        path: file.fullName
                                    });
                                    
                                } catch (err) {
                                    return JSON.stringify({
                                        success: false,
                                        message: "Could not save to Downloads: " + err.toString()
                                    });
                                }
                            }
                            
                            // Call the function with the provided data
                            saveJsonToDownloads(${JSON.stringify(jsonString)}, ${JSON.stringify(filename)});
                        `;
                        
                        csInterface.evalScript(saveToDownloadsScript, (result) => {
                            try {
                                const saveResult = JSON.parse(result);
                                if (saveResult.success) {
                                    this.showResult(`✅ JSON saved to Downloads folder: ${saveResult.path}`, 'success');
                                    console.log('✅ CEP file save succeeded:', saveResult.path);
                                    return;
                                } else {
                                    console.warn('⚠️ CEP file save failed:', saveResult.message);
                                    // Fall back to browser download methods
                                    this.fallbackDownload(jsonString, filename);
                                }
                            } catch (parseError) {
                                console.warn('⚠️ CEP save result parse error:', parseError);
                                // Fall back to browser download methods
                                this.fallbackDownload(jsonString, filename);
                            }
                        });
                        
                        return; // Exit early, let the callback handle the rest
                        
                    } catch (cepError) {
                        console.warn('⚠️ CEP download method failed:', cepError);
                        // Fall through to browser methods
                    }
                }
                
                // If CEP method fails or not in CEP, use browser download methods
                this.fallbackDownload(jsonString, filename);
                
            } catch (error) {
                console.error('Download error:', error);
                this.showResult(`❌ Download failed: ${error.message}`, 'error');
            }
        }
        
        fallbackDownload(jsonString, filename) {
            let downloadSuccess = false;
            
            // Method 1: Modern Blob + URL.createObjectURL approach
            try {
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(url), 100);
                downloadSuccess = true;
                console.log('✅ Download method 1 (Blob) succeeded');
            } catch (blobError) {
                console.warn('⚠️ Blob download method failed:', blobError);
            }
            
            // Method 2: Data URI fallback
            if (!downloadSuccess) {
                try {
                    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
                    const link = document.createElement('a');
                    link.href = dataUri;
                    link.download = filename;
                    link.style.display = 'none';
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    downloadSuccess = true;
                    console.log('✅ Download method 2 (Data URI) succeeded');
                } catch (dataUriError) {
                    console.warn('⚠️ Data URI download method failed:', dataUriError);
                }
            }
            
            if (downloadSuccess) {
                this.showResult(`✅ JSON downloaded as "${filename}" (check your Downloads folder)`, 'success');
            } else {
                // Method 3: Copy to clipboard as last resort
                this.tryMultipleCopyMethods(jsonString);
                this.showResult(`⚠️ Download failed, but JSON data has been copied to clipboard. Save it as "${filename}"`, 'warn');
            }
        }
        
        updateContextPreview() {
            if (!this.contextPreview) return;
            
            let html = '';
            
            if (this.projectContext) {
                html += `
                    <div class="context-item">
                        <div class="context-item-header">📄 Project Data</div>
                        <div class="context-item-content">
                            Project: ${this.projectContext.name}<br>
                            Items: ${this.projectContext.numItems}<br>
                            Active: ${this.projectContext.activeItem || 'None'}<br>
                            Compositions: ${this.projectContext.items.filter(item => item.composition).length}
                        </div>
                    </div>
                `;
            }
            
            this.screenshots.forEach((screenshot, index) => {
                html += `
                    <div class="context-item">
                        <div class="context-item-header">📷 Screenshot ${index + 1}</div>
                        <div class="context-item-content">
                            ${screenshot.name} (${(screenshot.size / 1024).toFixed(1)}KB)
                            <img src="${screenshot.data}" class="screenshot-preview" alt="Screenshot">
                        </div>
                    </div>
                `;
            });
            
            this.contextPreview.innerHTML = html;
        }
        
        buildContextPrompt() {
            let contextPrompt = '';
            
            // Add critical project state instructions
            contextPrompt += `**🚨 CRITICAL PROJECT CONTEXT RULES:**\n`;
            contextPrompt += `- NEVER use hardcoded layer names like "MyLayer", "Text Layer 1", "Background", etc.\n`;
            contextPrompt += `- Work with ACTUAL project state described below\n`;
            contextPrompt += `- Use app.project.activeItem for current composition\n`;
            contextPrompt += `- Use comp.selectedLayers for selected layers when available\n`;
            contextPrompt += `- If no layers selected and request involves layers: work with existing layers via iteration\n`;
            contextPrompt += `- Always validate that layers/compositions exist before modifying them\n\n`;
            
            if (this.projectContext) {
                contextPrompt += `**ACTUAL PROJECT STATE:**\n`;
                contextPrompt += `Project: "${this.projectContext.name}"\n`;
                contextPrompt += `Items: ${this.projectContext.numItems}\n`;
                contextPrompt += `Active Item: ${this.projectContext.activeItem || 'None'}\n\n`;
                
                // Add composition details with emphasis on real layer names
                const compositions = this.projectContext.items.filter(item => item.composition);
                if (compositions.length > 0) {
                    contextPrompt += `**REAL COMPOSITIONS AND LAYERS:**\n`;
                    compositions.forEach(comp => {
                        const c = comp.composition;
                        contextPrompt += `- Composition: "${comp.name}" (${c.width}x${c.height}, ${c.duration}s, ${c.numLayers} layers)\n`;
                        
                        // Add actual layer names for reference
                        if (c.layers && c.layers.length > 0) {
                            contextPrompt += `  ACTUAL LAYER NAMES: `;
                            const layerNames = c.layers.slice(0, 8).map(l => `"${l.name}" (${l.type})`);
                            contextPrompt += layerNames.join(', ');
                            if (c.layers.length > 8) contextPrompt += `, +${c.layers.length - 8} more`;
                            contextPrompt += `\n`;
                            contextPrompt += `  → Use these real layer names or work with selectedLayers/layer iteration\n`;
                        }
                    });
                    contextPrompt += `\n`;
                }
            } else {
                contextPrompt += `**NO PROJECT CONTEXT AVAILABLE:**\n`;
                contextPrompt += `- Work with app.project.activeItem (current composition)\n`;
                contextPrompt += `- Use comp.selectedLayers if user mentions specific layers\n`;
                contextPrompt += `- Create new layers if request is about creating content\n\n`;
            }
            
            if (this.screenshots.length > 0) {
                contextPrompt += `**REFERENCE SCREENSHOTS:**\n`;
                contextPrompt += `User has provided ${this.screenshots.length} screenshot(s) for visual reference.\n`;
                contextPrompt += `Consider the visual elements and design shown in the screenshots when generating the script.\n\n`;
            }
            
            // Add final behavioral reminder
            contextPrompt += `**SCRIPT GENERATION BEHAVIOR:**\n`;
            contextPrompt += `- If user says "add effect to layer" → apply to selected layers or iterate through existing layers\n`;
            contextPrompt += `- If user says "animate the text" → work with existing text layers in the project\n`;
            contextPrompt += `- If user says "create new layer" → that's fine, create new layers as requested\n`;
            contextPrompt += `- Always include proper error checking for layer existence\n`;
            contextPrompt += `- Return JSON success/error messages, never use alert() or hardcoded examples\n\n`;
            
            return contextPrompt;
        }
    }
    
    function setupScriptGenerator() {
        window.scriptGenerator = new ScriptGenerator();
        console.log('✅ Script Generator initialized');
    }

    // ========================================
    // RAG TAB FUNCTIONALITY
    // ========================================
    
    class RAGDocumentationChat {
        constructor() {
            this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
            this.openaiApiKey = localStorage.getItem('openai_api_key') || '';
            this.claudeApiKey = localStorage.getItem('claude_api_key') || '';
            this.ragServerUrl = 'http://localhost:5002'; // Use port 5002 to avoid conflicts
            this.isInitialized = false;
            this.isProcessing = false;
            this.retryCount = 0;
            this.maxRetries = 3;
            this.projectContext = null;
            
            // Add conversation history tracking
            this.conversationHistory = [];
            this.maxHistoryLength = 20; // Keep last 20 messages (10 exchanges)
            
            this.initializeElements();
            this.setupEventListeners();
            this.updateContextPreview();
            this.autoInit();
        }

        getCurrentApiKey() {
            const model = this.ragModelSelect?.value || 'gemini';
            if (model === 'gemini') {
                return localStorage.getItem('gemini_api_key') || this.geminiApiKey;
            } else if (model === 'claude') {
                return localStorage.getItem('claude_api_key') || this.claudeApiKey;
            } else {
                return localStorage.getItem('openai_api_key') || this.openaiApiKey;
            }
        }
        
        getConversationContext() {
            // Build conversation context from history
            if (this.conversationHistory.length === 0) {
                return '';
            }
            
            let context = '\n\nPREVIOUS CONVERSATION CONTEXT:\n';
            
            // Get last 10 messages (5 exchanges) for context
            const recentHistory = this.conversationHistory.slice(-10);
            
            recentHistory.forEach((msg) => {
                const role = msg.role === 'user' ? 'User' : 'Assistant';
                // Truncate long messages to prevent context from becoming too large
                const truncatedContent = msg.content.length > 500 
                    ? msg.content.substring(0, 500) + '...' 
                    : msg.content;
                context += `${role}: ${truncatedContent}\n`;
            });
            
            context += '\nCURRENT QUESTION:\n';
            
            return context;
        }

        async autoInit() {
            // No auto-initialization - start in chat mode
            console.log('🔄 Starting in chat mode (RAG disabled)');
        }

        initializeElements() {
            this.ragStatus = document.getElementById('ragStatus');
            this.ragInitBtn = document.getElementById('ragInitBtn');
            this.ragDisableBtn = document.getElementById('ragDisableBtn');
            this.ragInput = document.getElementById('ragInput');
            this.sendRagQuery = document.getElementById('sendRagQuery');
            this.clearRagChat = document.getElementById('clearRagChat');
            this.ragChatMessages = document.getElementById('ragChatMessages');
            this.ragModelSelect = document.getElementById('ragModelSelect');
            this.ragResultsCount = document.getElementById('ragResultsCount');
            this.ragDebugToggle = document.getElementById('ragDebugToggle');
            this.ragReprocessBtn = document.getElementById('ragReprocessBtn');
            this.ragDebugInfo = document.getElementById('ragDebugInfo');
            this.ragDebugContent = document.getElementById('ragDebugContent');
            
            // Context elements
            this.selectRagCompositionsBtn = document.getElementById('selectRagCompositionsBtn');
            this.exportRagProjectBtn = document.getElementById('exportRagProjectBtn');
            this.attachRagJsonBtn = document.getElementById('attachRagJsonBtn');
            this.clearRagContextBtn = document.getElementById('clearRagContextBtn');
            this.ragContextPreview = document.getElementById('ragContextPreview');
            this.ragJsonFileInput = document.getElementById('ragJsonFileInput');
            
            // Composition selector elements
            this.ragCompositionSelector = document.getElementById('ragCompositionSelector');
            this.ragCompositionList = document.getElementById('ragCompositionList');
            this.ragSelectAllComps = document.getElementById('ragSelectAllComps');
            this.ragSelectNoneComps = document.getElementById('ragSelectNoneComps');
            this.ragExportSelectedComps = document.getElementById('ragExportSelectedComps');
            this.ragCancelCompSelection = document.getElementById('ragCancelCompSelection');
            
            // Debug elements
            this.ragRawDebugCheck = document.getElementById('ragRawDebugCheck');

            // Set initial state - start in running agent mode (intelligent RAG)
            if (this.ragInput) this.ragInput.disabled = false;
            if (this.sendRagQuery) this.sendRagQuery.disabled = false;
            this.updateStatus('Running Agent (intelligent mode)', 'ready');
            
            // Add welcome message
            this.addMessage('assistant', `
🤖 **After Effects AI Assistant with Running Agent**

I'm ready to help you with After Effects scripting questions! I use a **Running Agent** system that adapts based on available tools.

**Current Mode: Running Agent (intelligent mode)**
• Uses existing AI knowledge for After Effects questions
• Intelligent responses without documentation search
• Fast, direct answers for common questions
• Suggests when documentation search would be helpful

**Available Modes:**
🤖 **Intelligent Mode** (current): Fast responses using AI knowledge
🔧 **RAG-enabled Mode**: Click "Initialize RAG System" to enable:
  • Full access to RAG documentation tools
  • Iterative documentation research (up to 6 iterations)
  • Multi-query search (3-5 queries × 5 results each = up to 15 results per RAG call)
  • Automatic deduplication of results
  • Strategic RAG calls based on question complexity

**How Running Agent works:**
- **Without RAG**: Direct AI responses using training knowledge
- **With RAG**: Intelligent tool calls to search documentation when needed

Ask me anything about After Effects scripting!`);
        }

        setupEventListeners() {
            this.ragInitBtn?.addEventListener('click', () => this.initializeRAG());
            this.ragDisableBtn?.addEventListener('click', () => this.disableRAG());
            this.sendRagQuery?.addEventListener('click', () => this.sendQuery());
            this.clearRagChat?.addEventListener('click', () => this.clearChat());
            this.ragDebugToggle?.addEventListener('click', () => this.toggleDebug());
            this.ragReprocessBtn?.addEventListener('click', () => this.reprocessDocuments());
            
            // Context event listeners
            this.selectRagCompositionsBtn?.addEventListener('click', () => this.showCompositionSelector());
            this.exportRagProjectBtn?.addEventListener('click', () => this.exportProjectContext());
            this.attachRagJsonBtn?.addEventListener('click', () => this.attachJsonFile());
            this.clearRagContextBtn?.addEventListener('click', () => this.clearContext());
            this.ragJsonFileInput?.addEventListener('change', (e) => this.handleJsonFileUpload(e));
            
            // Composition selector events
            this.ragSelectAllComps?.addEventListener('click', () => this.selectAllCompositions());
            this.ragSelectNoneComps?.addEventListener('click', () => this.selectNoCompositions());
            this.ragExportSelectedComps?.addEventListener('click', () => this.exportSelectedCompositions());
            this.ragCancelCompSelection?.addEventListener('click', () => this.hideCompositionSelector());
            
            this.ragInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendQuery();
                }
            });
        }

        async initializeRAG() {
            this.updateStatus('Initializing RAG system...', 'processing');
            this.ragInitBtn.disabled = true;

            try {
                // Test connection to RAG server with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const response = await fetch(`${this.ragServerUrl}/health`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    this.isInitialized = true;
                    this.updateStatus('Running Agent (RAG-enabled mode)', 'ready');
                    this.ragInput.disabled = false;
                    this.sendRagQuery.disabled = false;
                    this.ragInitBtn.style.display = 'none';
                    this.ragDisableBtn.style.display = 'inline-block';
                    this.addMessage('assistant', '✅ RAG system initialized! Running Agent now has full access to documentation tools and will make strategic RAG calls when needed.');
                } else {
                    throw new Error(`Server responded with status ${response.status}`);
                }
            } catch (error) {
                console.error('RAG initialization error:', error);
                
                if (error.name === 'AbortError') {
                    this.updateStatus('Connection timeout - server not responding', 'error');
                    this.addMessage('assistant', '⏱️ Connection timeout. The RAG server is not responding.');
                } else if (error.message.includes('Failed to fetch')) {
                    this.updateStatus('RAG server not running', 'error');
                    this.addMessage('assistant', '❌ Could not connect to RAG server. Server appears to be offline.');
                } else {
                    this.updateStatus('RAG server error', 'error');
                    this.addMessage('assistant', `❌ RAG server error: ${error.message}`);
                }
                
                this.showServerInstructions();
            } finally {
                this.ragInitBtn.disabled = false;
            }
        }

        showServerInstructions() {
            this.addMessage('assistant', `
🚀 **To start the RAG server:**

**Step 1:** Open terminal in your extension directory:
\`\`\`
cd "/Users/ishanramrakhiani/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools"
\`\`\`

**Step 2:** Start the server:
\`\`\`
python start_script_generator_rag.py
\`\`\`

**Step 3:** Wait for this message:
\`✅ RAG server ready on port 5002\`

**Step 4:** Click "Initialize RAG System" button again

**Alternative - Manual server start:**
\`\`\`
python rag_server.py
\`\`\`

**Troubleshooting:**
• Make sure Python 3.7+ is installed: \`python --version\`
• Install requirements: \`pip install -r rag_server_requirements.txt\`
• Check port 5002 isn't in use: \`lsof -i :5002\`
• Verify server files exist in the directory
• Check firewall/antivirus isn't blocking localhost connections

**What the server does:**
The RAG server provides access to 70+ After Effects documentation files for strategic sequential search and comprehensive technical answers.`);
        }

        async checkServerStatus() {
            try {
                const response = await fetch(`${this.ragServerUrl}/health`, {
                    method: 'GET',
                    timeout: 2000
                });
                return { status: 'online', details: await response.text() };
            } catch (error) {
                if (error.message.includes('Failed to fetch')) {
                    return { status: 'offline', details: 'Server not running' };
                } else {
                    return { status: 'error', details: error.message };
                }
            }
        }

        async sendQuery() {
            const query = this.ragInput.value.trim();
            if (!query || this.isProcessing) return;

            this.addMessage('user', query);
            this.ragInput.value = '';
            this.isProcessing = true;

            try {
                // Add typing indicator
                this.addTypingIndicator();

                // Only use Running Agent if RAG is initialized, otherwise use direct chat
                if (this.isInitialized) {
                    await this.handleRunningAgent(query);
                } else {
                    await this.handleDirectChat(query);
                }

            } catch (error) {
                console.error('Query error:', error);
                this.removeTypingIndicator();
                this.addMessage('assistant', `❌ Error: ${error.message}`);
                this.updateStatus('Error occurred', 'error');
            } finally {
                this.isProcessing = false;
            }
        }

        async handleRAGQuery(query) {
            // Initialize session context
            const sessionContext = {
                originalQuery: query,
                plan: null,
                searchHistory: [],
                cumulativeResults: [],
                analysisSteps: [],
                startTime: Date.now()
            };

            // STEP 1: Generate strategic plan and initial queries
            this.updateStatus('🧠 Analyzing question and creating search strategy...', 'processing');
            const planResult = await this.generateSearchPlan(query);
            sessionContext.plan = planResult;
            
            console.log('📋 Generated search plan:', planResult);

            // Show the strategic plan to user
            this.addPlanMessage(planResult);

            // STEP 2: Execute sequential searches based on plan
            await this.executeSequentialSearches(sessionContext);

            if (sessionContext.cumulativeResults.length === 0) {
                throw new Error('No relevant documentation found across all search strategies');
            }

            // Show search completion summary
            this.addSearchCompletionMessage(sessionContext);

            // STEP 3: Generate comprehensive answer using all accumulated context
            this.updateStatus('🔍 Synthesizing comprehensive answer from all findings...', 'processing');
            const answer = await this.generateContextualAnswer(sessionContext);
            
            this.removeTypingIndicator();
            this.addMessage('assistant', answer, sessionContext.cumulativeResults);
            this.updateStatus('RAG system ready!', 'ready');

            // Show debug info if enabled
            if (this.ragDebugInfo.style.display !== 'none') {
                this.showSequentialDebugInfo(sessionContext);
            }
        }

        async handleRunningAgent(query) {
            const agentMode = this.isInitialized ? 'RAG-enabled' : 'intelligent';
            this.updateStatus(`🤖 Starting Running Agent (${agentMode} mode)...`, 'processing');
            
            try {
                // Use Running RAG Agent with different configurations
                const runningAgent = new RunningRAGAgent();
                
                // Set project context if available
                if (this.projectContext) {
                    runningAgent.setContext(this.buildContextPrompt());
                }
                
                // Configure agent based on RAG initialization status
                if (this.isInitialized) {
                    // RAG is initialized - agent has full tool access
                    runningAgent.ragToolEnabled = true;
                    console.log('🔧 Running Agent: RAG tools enabled');
                } else {
                    // RAG not initialized - agent uses intelligent tool calling
                    runningAgent.ragToolEnabled = false;
                    console.log('🤖 Running Agent: Intelligent mode (tools disabled)');
                }
                
                // Get selected model
                const selectedModel = this.ragModelSelect?.value || 'gemini';
                
                // Create streaming message placeholder
                const streamingMessageId = 'streaming_' + Date.now();
                this.addStreamingMessage(streamingMessageId);
                
                // Process with iterative RAG tool calls and streaming
                const agentResult = await runningAgent.processUserMessage(query, {
                    modelType: selectedModel,
                    onStream: (chunk, accumulated) => {
                        this.updateStreamingMessage(streamingMessageId, accumulated);
                    }
                });
                
                if (agentResult.success) {
                    this.removeTypingIndicator();
                    
                    // Show statistics
                    const modeLabel = this.isInitialized ? 'RAG-enabled' : 'intelligent';
                    const stats = `📊 **Running Agent (${modeLabel}):** ${agentResult.ragCallsMade} RAG calls → ${agentResult.totalQueries} queries → ${agentResult.uniqueResults} unique results from ${agentResult.sources.length} sources (${agentResult.iterations} iterations)`;
                    
                    // Replace streaming message with final result
                    this.finalizeStreamingMessage(streamingMessageId, `${stats}\n\n${agentResult.response}`, agentResult.sources);
                    this.updateStatus(`Running Agent ready (${modeLabel})!`, 'ready');
                    
                    // Show debug info if enabled
                    if (this.ragDebugInfo.style.display !== 'none') {
                        this.showRunningAgentDebug(agentResult);
                    }
                    
                    return;
                }
                
                // Fallback to regular chat if agent fails
                console.warn('Running Agent failed, falling back to direct chat');
                
                // Clean up streaming message if it exists
                const streamingMsg = document.getElementById(streamingMessageId);
                if (streamingMsg) {
                    streamingMsg.remove();
                }
                
            } catch (error) {
                console.error('Running Agent error:', error);
                
                // Clean up streaming message if it exists
                const streamingMsg = document.getElementById(streamingMessageId);
                if (streamingMsg) {
                    streamingMsg.remove();
                }
                // Continue to fallback
            }
            
            // FALLBACK: Direct AI conversation without RAG
            this.updateStatus('💭 Generating response...', 'processing');
            
            const contextPrompt = this.buildContextPrompt();
            const conversationContext = this.getConversationContext();
            const selectedModel = this.ragModelSelect.value;
            
            const prompt = `${contextPrompt}

You are an expert After Effects ExtendScript assistant. Answer the user's question directly and helpfully.
${conversationContext}
User Question: "${query}"

Provide a clear, helpful response. If the question is about After Effects scripting, provide specific guidance, code examples, and best practices.
Remember the context of our previous conversation and refer to it when relevant.`;

            let response;
            
            if (selectedModel === 'claude') {
                response = await this.callClaudeAPI(prompt);
            } else if (selectedModel === 'o4-mini') {
                response = await this.callOpenAIAPI(prompt);
            } else {
                // Default to Gemini
                response = await this.callGeminiAPI(prompt);
            }
            
            this.removeTypingIndicator();
            this.addMessage('assistant', response);
            this.updateStatus('Chat mode (RAG disabled)', 'ready');
        }

        async handleDirectChat(query) {
            console.log('💬 Direct Chat Mode (RAG not initialized)');
            this.updateStatus('💭 Generating response...', 'processing');
            
            const contextPrompt = this.buildContextPrompt();
            const conversationContext = this.getConversationContext();
            const selectedModel = this.ragModelSelect?.value || 'gemini';
            
            const prompt = `${contextPrompt}

You are an expert After Effects ExtendScript assistant. Respond naturally and helpfully to the user's message.

${conversationContext}
User Message: "${query}"

Instructions:
- For greetings (hi, hello, thanks), respond warmly and ask how you can help with After Effects
- For general questions, provide helpful information using your existing knowledge
- For technical questions, provide specific guidance and code examples
- Be conversational and helpful, not robotic
- Remember the context of our previous conversation

Respond naturally to the user's message.`;

            let response;
            
            if (selectedModel === 'claude') {
                response = await this.callClaudeAPI(prompt);
            } else if (selectedModel === 'o4-mini') {
                response = await this.callOpenAIAPI(prompt);
            } else {
                // Default to Gemini
                response = await this.callGeminiAPI(prompt);
            }
            
            this.removeTypingIndicator();
            this.addMessage('assistant', response);
            this.updateStatus('Chat ready', 'ready');
        }

        async callGeminiAPI(prompt) {
            const apiKey = this.getCurrentApiKey();
            if (!apiKey) {
                throw new Error('No Gemini API key found');
            }

            // Get selected model or use default
            const selectedModel = this.ragModelSelect?.value || 'gemini';
            const modelEndpoint = selectedModel === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp';

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2000,
                            topP: 0.8
                        }
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Gemini API Error:', errorText);
                    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
                    throw new Error('Invalid Gemini API response format');
                }
                
                return data.candidates[0].content.parts[0].text;
            } catch (error) {
                console.error('Gemini API call failed:', error);
                throw error;
            }
        }

        async callClaudeAPI(prompt) {
            const apiKey = this.getCurrentApiKey();
            if (!apiKey) {
                throw new Error('No Claude API key found. Please set your Claude API key first.');
            }

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Claude API error: ${errorData.error?.message || response.status}`);
            }

            const data = await response.json();
            return data.content[0].text;
        }

        async callOpenAIAPI(prompt) {
            // Note: This would require an OpenAI API key and proper CORS setup
            throw new Error('OpenAI API integration not yet implemented');
        }

        async generateSearchPlan(originalQuery) {
            const contextPrompt = this.buildContextPrompt();
            const planPrompt = `You are an AI search strategist for a local After Effects ExtendScript documentation database. Your task is to analyze the user's question and create a strategic set of search queries to retrieve the most relevant documentation.

**SEARCH CONTEXT:**
The search will be performed against a local vector database containing the official Adobe After Effects ExtendScript documentation in Markdown format. The search is keyword-based and works best with specific API terms, class names, method names, and property names.

${contextPrompt}

**USER QUESTION:** "${originalQuery}"

**TASK:** Create a strategic search plan with 4-5 specific queries that will comprehensively cover this topic.${this.projectContext ? '\n\n**IMPORTANT:** Consider the project context above when planning searches - focus on finding documentation that will help create scripts that work with the existing project structure.' : ''}

**RETURN FORMAT:** JSON object with this exact structure:
{
    "analysis": "Brief analysis of what the user wants to accomplish, in terms of scripting.",
    "strategy": "The approach for finding the most relevant API documentation for the task.", 
    "queries": [
        {
            "query": "keyword-based search query",
            "purpose": "What this query is designed to find in the scripting API docs.",
            "priority": "high/medium/low"
        }
    ],
    "expectedOutcome": "What specific information (classes, methods, properties) we expect to find to help the user."
}

**GUIDELINES FOR CREATING QUERIES:**
- **BE SPECIFIC:** Use exact After Effects terminology (e.g. \`CompItem\`, \`TextLayer\`, \`addProperty\`, \`setValueAtTime\`, \`sourceText\`, \`transform.position\`).
- **KEYWORD-FOCUSED:** Queries are simple, space-separated keywords. Think \`object method property\`.
- **NO WEB SEARCHING:** Do NOT use web search operators like \`site:\`, \`inurl:\`, or quotes for exact phrases. Do NOT add terms like "After Effects scripting" or "ExtendScript example" to the queries. The search is *only* on the local AE docs.
- **COMPLEMENTARY, NOT REPETITIVE:** Each query should target a different aspect of the scripting task (e.g., one for creation, one for modification, one for a related object).


**EXAMPLE GOOD PLAN for "create animated text layer":**
{
    "analysis": "User wants to programmatically create a text layer and then animate its properties.",
    "strategy": "First, find the method to create a TextLayer. Second, find the properties of that layer that can be animated. Third, find the method for setting keyframes.", 
    "queries": [
        {
            "query": "CompItem layers addText",
            "purpose": "Find the primary method for creating a new text layer within a composition.",
            "priority": "high"
        },
        {
            "query": "TextLayer sourceText TextDocument properties", 
            "purpose": "Find how to set the text content and style properties like font and color.",
            "priority": "high"
        },
        {
            "query": "Property setValueAtTime KeyframeEase animation",
            "purpose": "Find the core method for creating keyframes to animate any property.", 
            "priority": "medium"
        }
    ],
    "expectedOutcome": "The exact methods and properties needed to create a text layer, set its content, and animate its position or other transform properties."
}

Return ONLY the JSON object, with no additional commentary:`;

            try {
                const modelValue = this.ragModelSelect.value;
                const model = modelValue === 'gemini' ? 'gemini-2.5-pro' : 
                             modelValue === 'claude' ? 'claude-sonnet-4-20250514' : 'o4-mini';
                const startTime = Date.now();
                const showRawDebug = this.ragRawDebugCheck?.checked || false;
                
                if (showRawDebug) {
                    this.addMessage('assistant', `**⏱️ RAW DEBUG: Starting AI Plan Generation**\nModel: ${model}\nWaiting for response...`);
                    this.addMessage('assistant', `**📤 RAW DEBUG: Request Prompt**\n\`\`\`\n${planPrompt.substring(0, 1000)}${planPrompt.length > 1000 ? '...' : ''}\n\`\`\``);
                }
                
                let responseText;

                if (model.startsWith('gemini')) {
                    const currentApiKey = this.getCurrentApiKey();
                    const requestBody = {
                        contents: [{
                            parts: [{ text: planPrompt }]
                        }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 2000
                        }
                    };
                    
                    if (showRawDebug) {
                        this.addMessage('assistant', `**📤 RAW DEBUG: Gemini Request**\n\`\`\`\n${JSON.stringify(requestBody, null, 2).substring(0, 500)}...\n\`\`\``);
                    }
                    
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        if (showRawDebug) {
                            this.addMessage('assistant', `**❌ RAW DEBUG: Gemini Error Response**\nStatus: ${response.status}\n\`\`\`\n${errorText}\n\`\`\``);
                        }
                        throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
                    }

                    const data = await response.json();
                    if (showRawDebug) {
                        this.addMessage('assistant', `**📥 RAW DEBUG: Gemini Response**\n\`\`\`\n${JSON.stringify(data, null, 2).substring(0, 1000)}${JSON.stringify(data).length > 1000 ? '...' : ''}\n\`\`\``);
                    }
                    
                    // Check for response structure issues
                    const candidate = data.candidates?.[0];
                    if (!candidate) {
                        if (showRawDebug) {
                            this.addMessage('assistant', `**❌ RAW DEBUG: No candidates in response**`);
                        }
                        throw new Error('No candidates in Gemini response');
                    }
                    
                    if (candidate.finishReason === 'MAX_TOKENS') {
                        if (showRawDebug) {
                            this.addMessage('assistant', `**⚠️ RAW DEBUG: Response truncated due to MAX_TOKENS**`);
                        }
                        console.warn('Gemini response truncated due to MAX_TOKENS');
                    }
                    
                    if (!candidate.content?.parts?.[0]?.text) {
                        if (showRawDebug) {
                            this.addMessage('assistant', `**❌ RAW DEBUG: Missing content.parts[0].text in response**\nFinish reason: ${candidate.finishReason || 'unknown'}`);
                        }
                        throw new Error(`Gemini response missing text content. Finish reason: ${candidate.finishReason || 'unknown'}`);
                    }
                    
                    responseText = candidate.content.parts[0].text.trim();
                } else if (model === 'o4-mini') {
                    const currentApiKey = this.getCurrentApiKey();
                    if (!currentApiKey) {
                        throw new Error('OpenAI API key not found');
                    }

                    const openaiPayload = {
                        model: "o4-mini",
                        messages: [
                            {
                                role: "user",
                                content: planPrompt
                            }
                        ],
                        max_completion_tokens: 2000
                    };
                    
                    if (showRawDebug) {
                        this.addMessage('assistant', `**📤 RAW DEBUG: OpenAI Request**\n\`\`\`\n${JSON.stringify(openaiPayload, null, 2).substring(0, 500)}...\n\`\`\``);
                    }

                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${currentApiKey}`
                        },
                        body: JSON.stringify(openaiPayload)
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        if (showRawDebug) {
                            this.addMessage('assistant', `**❌ RAW DEBUG: OpenAI Error Response**\nStatus: ${response.status}\n\`\`\`\n${errorText}\n\`\`\``);
                        }
                        throw new Error(`OpenAI API Error ${response.status}: ${errorText}`);
                    }

                    const data = await response.json();
                    if (showRawDebug) {
                        this.addMessage('assistant', `**📥 RAW DEBUG: OpenAI Response**\n\`\`\`\n${JSON.stringify(data, null, 2).substring(0, 1000)}${JSON.stringify(data).length > 1000 ? '...' : ''}\n\`\`\``);
                    }
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        responseText = data.choices[0].message.content.trim();
                    } else {
                        throw new Error('Unexpected OpenAI API response format');
                    }
                } else if (model.startsWith('claude')) {
                    const currentApiKey = this.getCurrentApiKey();
                    if (!currentApiKey) {
                        throw new Error('Claude API key not found');
                    }

                    const claudePayload = {
                        model: "claude-sonnet-4-20250514",
                        max_tokens: 2000,
                        temperature: 0.2,
                        messages: [
                            {
                                role: "user",
                                content: planPrompt
                            }
                        ]
                    };
                    
                    if (showRawDebug) {
                        this.addMessage('assistant', `**📤 RAW DEBUG: Claude Request**\n\`\`\`\n${JSON.stringify(claudePayload, null, 2).substring(0, 500)}...\n\`\`\``);
                    }

                    const response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': currentApiKey,
                            'anthropic-version': '2023-06-01',
                            'anthropic-dangerous-direct-browser-access': 'true'
                        },
                        body: JSON.stringify(claudePayload)
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        if (showRawDebug) {
                            this.addMessage('assistant', `**❌ RAW DEBUG: Claude Error Response**\nStatus: ${response.status}\n\`\`\`\n${errorText}\n\`\`\``);
                        }
                        throw new Error(`Claude API Error ${response.status}: ${errorText}`);
                    }

                    const data = await response.json();
                    if (showRawDebug) {
                        this.addMessage('assistant', `**📥 RAW DEBUG: Claude Response**\n\`\`\`\n${JSON.stringify(data, null, 2).substring(0, 1000)}${JSON.stringify(data).length > 1000 ? '...' : ''}\n\`\`\``);
                    }
                    if (data.content && data.content[0] && data.content[0].text) {
                        responseText = data.content[0].text.trim();
                    } else {
                        throw new Error('Unexpected Claude API response format');
                    }
                }

                if (responseText) {
                    const responseTime = Date.now() - startTime;
                    console.log('🤖 AI Plan Response:', responseText);
                    
                    // DEBUG: Show AI response in UI
                    this.addMessage('assistant', `**🔍 DEBUG: AI Plan Response** (${responseTime}ms)\n\`\`\`\n${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}\n\`\`\``);
                    
                    // Try to extract JSON from response
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            const plan = JSON.parse(jsonMatch[0]);
                            if (plan.queries && Array.isArray(plan.queries)) {
                                console.log('✅ AI Plan Generated Successfully:', plan);
                                this.addMessage('assistant', `**✅ DEBUG: AI Plan Parsed Successfully!**\nFound ${plan.queries.length} queries in plan.`);
                                return plan;
                            } else {
                                console.warn('❌ Plan missing queries array:', plan);
                                this.addMessage('assistant', `**❌ DEBUG: Plan Missing Queries**\nPlan object: ${JSON.stringify(plan, null, 2)}`);
                            }
                        } catch (parseError) {
                            console.warn('❌ JSON Parse Error:', parseError);
                            this.addMessage('assistant', `**❌ DEBUG: JSON Parse Error**\nError: ${parseError.message}\nRaw JSON: ${jsonMatch[0].substring(0, 200)}...`);
                        }
                    } else {
                        console.warn('❌ No JSON found in response:', responseText);
                        this.addMessage('assistant', `**❌ DEBUG: No JSON Found**\nResponse doesn't contain valid JSON object.`);
                    }
                } else {
                    console.warn('❌ No response text received');
                    if (showRawDebug) {
                        this.addMessage('assistant', `**❌ RAW DEBUG: No Response Text**\nAPI call completed but no text content extracted.\nCheck previous raw response for details.`);
                    } else {
                        this.addMessage('assistant', `**❌ DEBUG: No Response**\nAPI call returned empty response.`);
                    }
                }

                console.log('🔄 Plan generation failed, using fallback...');
                this.addMessage('assistant', `**🔄 DEBUG: Using Fallback Plan**\nAI plan generation failed, switching to keyword-based fallback.`);
                return this.generateFallbackPlan(originalQuery);

            } catch (error) {
                const responseTime = Date.now() - startTime;
                console.warn('Error generating search plan:', error);
                this.addMessage('assistant', `**❌ DEBUG: API Error** (${responseTime}ms)\nError: ${error.message}`);
                this.addMessage('assistant', `**🔄 DEBUG: Using Fallback Plan**\nAPI call failed, switching to keyword-based fallback.`);
                return this.generateFallbackPlan(originalQuery);
            }
        }

        generateFallbackPlan(originalQuery) {
            console.log('🔄 Generating enhanced fallback plan for:', originalQuery);
            const questionLower = originalQuery.toLowerCase();
            
            const baseQueries = [];

            // Always start with the direct query
            baseQueries.push({
                query: originalQuery,
                purpose: "Direct answer to user's question",
                priority: "high"
            });

            // Enhanced keyword detection and query generation
            if (questionLower.includes('create') || questionLower.includes('add') || questionLower.includes('make')) {
                if (questionLower.includes('layer')) {
                    baseQueries.push({
                        query: "CompItem layers addText addSolid addShape addNull",
                        purpose: "Find layer creation methods and APIs", 
                        priority: "high"
                    });
                    baseQueries.push({
                        query: "Layer properties transform position scale rotation",
                        purpose: "Find layer property manipulation",
                        priority: "medium"
                    });
                }
                if (questionLower.includes('text')) {
                    baseQueries.push({
                        query: "TextLayer TextDocument font fontSize fillColor",
                        purpose: "Find text layer creation and styling",
                        priority: "high"
                    });
                    baseQueries.push({
                        query: "Source Text setValue textDocument properties",
                        purpose: "Find text content manipulation methods",
                        priority: "medium"
                    });
                }
                if (questionLower.includes('shape')) {
                    baseQueries.push({
                        query: "ShapeLayer pathGroup shape contents",
                        purpose: "Find shape layer creation methods",
                        priority: "high"
                    });
                }
                if (questionLower.includes('comp') || questionLower.includes('composition')) {
                    baseQueries.push({
                        query: "CompItem addComp width height frameRate duration",
                        purpose: "Find composition creation methods",
                        priority: "high"
                    });
                }
            }

            if (questionLower.includes('animate') || questionLower.includes('keyframe')) {
                baseQueries.push({
                    query: "Property setValueAtTime keyframe animation",
                    purpose: "Find animation and keyframe methods",
                    priority: "high"
                });
                baseQueries.push({
                    query: "KeyframeEase easeIn easeOut velocity influence",
                    purpose: "Find easing and interpolation options",
                    priority: "medium"
                });
            }

            if (questionLower.includes('property') || questionLower.includes('properties')) {
                baseQueries.push({
                    query: "Property PropertyGroup setValue getValue",
                    purpose: "Find property manipulation methods",
                    priority: "high"
                });
                baseQueries.push({
                    query: "propertyIndex matchName addProperty",
                    purpose: "Find property navigation and creation",
                    priority: "medium"
                });
            }

            if (questionLower.includes('effect') || questionLower.includes('effects')) {
                baseQueries.push({
                    query: "Effect Parade addProperty effects applyPreset",
                    purpose: "Find effect application methods",
                    priority: "high"
                });
            }

            if (questionLower.includes('render') || questionLower.includes('export')) {
                baseQueries.push({
                    query: "RenderQueue OutputModule renderQueueItem",
                    purpose: "Find rendering and export methods",
                    priority: "high"
                });
            }

            // If we don't have enough queries, add some general ones
            if (baseQueries.length < 3) {
                baseQueries.push({
                    query: "Project CompItem Layer properties methods",
                    purpose: "Find general After Effects object structure",
                    priority: "medium"
                });
                baseQueries.push({
                    query: "Application project activeItem selection",
                    purpose: "Find application and project context",
                    priority: "low"
                });
            }

            return {
                analysis: `Enhanced fallback analysis: User asking about ${originalQuery}. Detected keywords: ${questionLower.split(' ').filter(w => w.length > 3).join(', ')}`,
                strategy: "Multi-faceted documentation search with keyword-based query expansion",
                queries: baseQueries.slice(0, 5), // Max 5 queries
                expectedOutcome: "Comprehensive documentation coverage through strategic keyword expansion"
            };
        }

        async executeSequentialSearches(sessionContext) {
            const { plan, originalQuery } = sessionContext;
            let searchStep = 1;

            for (const queryPlan of plan.queries) {
                this.updateStatus(`🔍 Step ${searchStep}/${plan.queries.length}: ${queryPlan.purpose}...`, 'processing');
                
                // Show the search query being executed
                this.addSearchStepMessage(searchStep, queryPlan, plan.queries.length);
                
                // Perform the search - use dropdown value
                const topK = parseInt(this.ragResultsCount.value) || 5;
                const searchResults = await this.searchSingleQuery(queryPlan.query, topK);
                
                // Analyze what we found
                const analysis = await this.analyzeSearchResults(queryPlan, searchResults, sessionContext);
                
                // Show search results
                this.addSearchResultsMessage(searchStep, searchResults, analysis);
                
                // Update session context
                sessionContext.searchHistory.push({
                    step: searchStep,
                    queryPlan: queryPlan,
                    results: searchResults,
                    analysis: analysis,
                    timestamp: Date.now()
                });

                // Add unique results to cumulative
                this.addToCumulativeResults(searchResults, sessionContext, queryPlan);

                // Log progress
                console.log(`📚 Step ${searchStep} completed:`, {
                    query: queryPlan.query,
                    found: searchResults.length,
                    total: sessionContext.cumulativeResults.length,
                    analysis: analysis.summary
                });

                searchStep++;
            }
        }

        addSearchStepMessage(step, queryPlan, totalSteps) {
            const priorityIcon = queryPlan.priority === 'high' ? '🔥' : queryPlan.priority === 'medium' ? '⚡' : '💡';
            const message = `**🔍 Search Step ${step}/${totalSteps}**

${priorityIcon} **Priority:** ${queryPlan.priority}
🎯 **Purpose:** ${queryPlan.purpose}
📝 **Query:** "${queryPlan.query}"

Searching documentation...`;

            this.addMessage('assistant', message);
        }

        addPlanMessage(plan) {
            const message = `**🧠 Strategic Search Plan Generated**

📋 **Analysis:** ${plan.analysis}
🎯 **Strategy:** ${plan.strategy}
🎉 **Expected Outcome:** ${plan.expectedOutcome}

**📝 Search Queries Planned:**
${plan.queries.map((q, i) => {
    const priorityIcon = q.priority === 'high' ? '🔥' : q.priority === 'medium' ? '⚡' : '💡';
    return `${i + 1}. ${priorityIcon} "${q.query}" - ${q.purpose}`;
}).join('\n')}

Starting sequential searches...`;

            this.addMessage('assistant', message);
        }

        addSearchResultsMessage(step, results, analysis) {
            const confidenceIcon = analysis.confidence === 'high' ? '✅' : analysis.confidence === 'medium' ? '⚠️' : '❌';
            const message = `**📚 Step ${step} Results**

${confidenceIcon} **Found:** ${results.length} documentation sources
📊 **Confidence:** ${analysis.confidence}
💡 **Analysis:** ${analysis.summary}

**Sources found:**
${results.map(r => `• ${r.file}`).join('\n')}`;

            this.addMessage('assistant', message);
        }

        addSearchCompletionMessage(sessionContext) {
            const { searchHistory, cumulativeResults } = sessionContext;
            const totalTime = 0; // Remove timing dependency
            const avgConfidence = this.calculateAverageConfidence(searchHistory);
            
            const message = `**✅ Sequential Search Completed**

🕒 **Total Time:** N/A
📚 **Total Sources Found:** ${cumulativeResults.length} unique documents
📊 **Average Confidence:** ${avgConfidence}
🔍 **Search Steps:** ${searchHistory.length}

**📈 Search Performance:**
${searchHistory.map(step => 
    `Step ${step.step}: ${step.results.length} sources (${step.analysis.confidence} confidence)`
).join('\n')}

Now synthesizing comprehensive answer from all gathered documentation...`;

            this.addMessage('assistant', message);
        }

        calculateAverageConfidence(searchHistory) {
            const confidenceScores = searchHistory.map(step => {
                const conf = step.analysis.confidence;
                return conf === 'high' ? 3 : conf === 'medium' ? 2 : 1;
            });
            const avg = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
            return avg >= 2.5 ? 'high' : avg >= 1.5 ? 'medium' : 'low';
        }

        async analyzeSearchResults(queryPlan, results, sessionContext) {
            if (results.length === 0) {
                return {
                    summary: "No results found",
                    confidence: "low",
                    gaps: [`No documentation found for: ${queryPlan.query}`],
                    nextSuggestion: "Try broader or alternative search terms"
                };
            }

            // Simple analysis for now - could be enhanced with AI
            const analysis = {
                summary: `Found ${results.length} relevant sources`,
                confidence: results.length >= 3 ? "high" : results.length >= 1 ? "medium" : "low",
                gaps: [],
                nextSuggestion: results.length < 2 ? "May need additional searches" : "Good coverage achieved"
            };

            sessionContext.analysisSteps.push({
                step: sessionContext.searchHistory.length + 1,
                query: queryPlan.query,
                purpose: queryPlan.purpose,
                found: results.length,
                analysis: analysis
            });

            return analysis;
        }

        addToCumulativeResults(newResults, sessionContext, queryPlan) {
            const seenContent = new Set(sessionContext.cumulativeResults.map(r => r.content.substring(0, 200)));
            
            newResults.forEach(result => {
                const contentHash = result.content.substring(0, 200);
                if (!seenContent.has(contentHash) && result.content.length > 50) {
                    seenContent.add(contentHash);
                    result.sourceQuery = queryPlan.query;
                    result.sourcePurpose = queryPlan.purpose;
                    result.searchStep = sessionContext.searchHistory.length + 1;
                    sessionContext.cumulativeResults.push(result);
                }
            });
        }

        async generateRelatedQueries(userQuestion) {
            const queryGenerationPrompt = `You are a search query generator for After Effects ExtendScript documentation. Generate exactly 4 related search queries for comprehensive documentation coverage.

Original question: ${userQuestion}

Generate queries that cover:
1. Main objects/classes (Layer, CompItem, Property, etc.)
2. Specific methods and properties  
3. Alternative terminology and approaches
4. Implementation details and examples

CRITICAL: Return ONLY a valid JSON array with exactly 4 strings. No explanations, no markdown, just the JSON:

["query about main objects", "query about methods", "query about properties", "query about implementation"]`;

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: queryGenerationPrompt }]
                        }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 300
                        }
                    })
                });

                const data = await response.json();
                const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

                if (responseText) {
                    // Try to extract JSON from response
                    const jsonMatch = responseText.match(/\[.*?\]/s);
                    if (jsonMatch) {
                        const queries = JSON.parse(jsonMatch[0]);
                        if (Array.isArray(queries) && queries.every(q => typeof q === 'string')) {
                            return [userQuestion, ...queries.slice(0, 4)];
                        }
                    }
                }

                console.log('JSON parsing failed, using manual query generation...');
                return this.generateManualQueries(userQuestion);

            } catch (error) {
                console.warn('Error generating related queries:', error);
                return this.generateManualQueries(userQuestion);
            }
        }

        generateManualQueries(userQuestion) {
            const questionLower = userQuestion.toLowerCase();
            const baseQueries = [userQuestion];

            // Add common variations based on question content
            if (questionLower.includes('create') || questionLower.includes('add')) {
                if (questionLower.includes('layer')) {
                    baseQueries.push('add layer to composition');
                    baseQueries.push('layer creation methods');
                }
                if (questionLower.includes('shape')) {
                    baseQueries.push('shape layer properties');
                    baseQueries.push('addProperty shape');
                }
                if (questionLower.includes('text')) {
                    baseQueries.push('text layer methods');
                    baseQueries.push('TextLayer properties');
                }
            }

            if (questionLower.includes('property')) {
                baseQueries.push('property setValue getValue');
                baseQueries.push('PropertyGroup addProperty');
            }

            if (questionLower.includes('keyframe')) {
                baseQueries.push('setValueAtTime keyframe');
                baseQueries.push('Property keyframe methods');
            }

            // Add object-specific queries
            if (questionLower.includes('composition') || questionLower.includes('comp')) {
                baseQueries.push('CompItem methods properties');
            }

            if (questionLower.includes('effect')) {
                baseQueries.push('apply effect layer');
                baseQueries.push('effects property');
            }

            // Return unique queries up to 5
            const uniqueQueries = [...new Set(baseQueries)];
            return uniqueQueries.slice(0, 5);
        }

        async searchMultipleQueries(queries) {
            console.log(`🔍 Searching documentation with ${queries.length} queries...`);
            
            const topKPerQuery = Math.max(2, Math.floor(parseInt(this.ragResultsCount.value) / queries.length));
            const searchPromises = queries.map(query => 
                this.searchSingleQuery(query, topKPerQuery)
            );

            const allResults = await Promise.all(searchPromises);
            
            // Combine and deduplicate results
            const combinedDocs = [];
            const seenContent = new Set();
            const maxTotalDocs = parseInt(this.ragResultsCount.value) * 2; // Allow more docs for better context

            allResults.forEach((docs, queryIndex) => {
                docs.forEach(doc => {
                    const contentHash = doc.content.substring(0, 200);
                    if (!seenContent.has(contentHash) && doc.content.length > 50) {
                        seenContent.add(contentHash);
                        doc.sourceQuery = queries[queryIndex];
                        combinedDocs.push(doc);
                    }
                });
            });

            // Sort by relevance and limit results
            return combinedDocs.slice(0, maxTotalDocs);
        }

        async searchSingleQuery(query, topK = 5) {
            try {
                const response = await fetch(`${this.ragServerUrl}/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: query,
                        top_k: topK
                    })
                });

                if (!response.ok) {
                    console.warn(`RAG search failed for "${query}": ${response.status}`);
                    return [];
                }

                const data = await response.json();
                if (data.success && data.results) {
                    return data.results.map(result => ({
                        file: result.file || 'Unknown',
                        content: result.content || '',
                        rank: result.rank || 0
                    }));
                }

                return [];

            } catch (error) {
                console.warn(`Error searching documentation for "${query}":`, error);
                return [];
            }
        }

        async generateContextualAnswer(sessionContext) {
            const { originalQuery, plan, searchHistory, cumulativeResults, analysisSteps } = sessionContext;
            
            // Get conversation context
            const conversationContext = this.getConversationContext();
            
            // Build context with search journey
            const searchJourney = searchHistory.map((step, i) => 
                `STEP ${step.step}: ${step.queryPlan.purpose}\n` +
                `Query: "${step.queryPlan.query}"\n` + 
                `Found: ${step.results.length} sources\n` +
                `Analysis: ${step.analysis.summary}\n`
            ).join('\n');

            const documentationContext = cumulativeResults.map((doc, i) => {
                const stepInfo = doc.searchStep ? ` [Step ${doc.searchStep}]` : '';
                const purposeInfo = doc.sourcePurpose ? ` (${doc.sourcePurpose})` : '';
                return `=== DOCUMENTATION ${i + 1}: ${doc.file}${stepInfo}${purposeInfo} ===\n${doc.content}`;
            }).join('\n\n');

            const contextPrompt = this.buildContextPrompt();
            const prompt = `You are an expert After Effects ExtendScript developer. Answer the user's question using ONLY the provided documentation gathered through a strategic sequential search process.

${contextPrompt}
${conversationContext}
**ORIGINAL QUESTION:** "${originalQuery}"

**SEARCH STRATEGY EXECUTED:**
${plan.analysis}
Strategy: ${plan.strategy}
Expected Outcome: ${plan.expectedOutcome}

**SEARCH JOURNEY COMPLETED:**
${searchJourney}

**TOTAL DOCUMENTATION GATHERED (${cumulativeResults.length} sources):**
${documentationContext}

**SEARCH ANALYSIS SUMMARY:**
${analysisSteps.map(step => `• Step ${step.step}: ${step.purpose} → Found ${step.found} sources (${step.analysis.confidence} confidence)`).join('\n')}

**INSTRUCTIONS:**
1. Synthesize information from ALL documentation sources gathered through this strategic process
2. Provide a complete, accurate answer based ONLY on this systematically gathered documentation  
3. Reference the search journey when helpful to explain how information was found
4. If the question involves code, provide working ExtendScript examples
5. Mention relevant object names, methods, properties, and their relationships
6. Include multiple approaches if the documentation shows different ways
7. If any gaps remain after this comprehensive search, clearly state what's missing
8. Be practical and include real-world usage tips from the documentation
9. Show how different documentation sources complement each other
${this.projectContext ? '10. **USE THE PROJECT CONTEXT:** When generating scripts, use actual layer names, composition names, and items from the project context above - never use placeholder names like "MyLayer" or "TextLayer 1"' : ''}

Provide a comprehensive, well-structured answer:`;

            const modelValue = this.ragModelSelect.value;
            const model = modelValue === 'gemini' ? 'gemini-2.5-pro' : 
                         modelValue === 'claude' ? 'claude-sonnet-4-20250514' : 'o4-mini';
            
            if (model.startsWith('gemini')) {
                const currentApiKey = this.getCurrentApiKey();
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 4000
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Gemini API Error ${response.status}: ${errorData}`);
                }

                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
            } else if (model === 'o4-mini') {
                // OpenAI o4-mini API call (using same pattern as GeminiChat)
                const currentApiKey = this.getCurrentApiKey();
                if (!currentApiKey) {
                    throw new Error('OpenAI API key not found. Please add your OpenAI API key in localStorage as "openai_api_key"');
                }

                const openaiPayload = {
                    model: "o4-mini",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_completion_tokens: 4000
                };

                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentApiKey}`
                    },
                    body: JSON.stringify(openaiPayload)
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`OpenAI API Error ${response.status}: ${errorData}`);
                }

                const data = await response.json();
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content;
                } else {
                    throw new Error('Unexpected OpenAI API response format');
                }
            } else if (model.startsWith('claude')) {
                // Claude API call
                const currentApiKey = this.getCurrentApiKey();
                if (!currentApiKey) {
                    throw new Error('Claude API key not found. Please add your Claude API key in localStorage as "claude_api_key"');
                }

                const claudePayload = {
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4000,
                    temperature: 0.1,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                };

                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': currentApiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                    },
                    body: JSON.stringify(claudePayload)
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Claude API Error ${response.status}: ${errorData}`);
                }

                const data = await response.json();
                if (data.content && data.content[0] && data.content[0].text) {
                    return data.content[0].text;
                } else {
                    throw new Error('Unexpected Claude API response format');
                }
            } else {
                throw new Error('Unknown model selected');
            }
        }

        showSequentialDebugInfo(sessionContext) {
            // Safely extract properties with defaults
            const {
                originalQuery = 'Unknown query',
                plan = { strategy: 'Unknown', analysis: 'Unknown', expectedOutcome: 'Unknown' },
                searchHistory = [],
                cumulativeResults = [],
                analysisSteps = []
            } = sessionContext || {};
            
            const totalTime = 0; // Remove timing dependency
            
            const debugContent = `
<h5>🧠 Search Strategy Analysis</h5>
<p><strong>Original Query:</strong> "${originalQuery}"</p>
<p><strong>Strategy:</strong> ${plan.strategy}</p>
<p><strong>Analysis:</strong> ${plan.analysis}</p>
<p><strong>Expected Outcome:</strong> ${plan.expectedOutcome}</p>

<h5>🔍 Sequential Search Journey</h5>
<div class="debug-search-journey">
${searchHistory.map((step, i) => `
    <div class="debug-search-step">
        <h6>Step ${step.step}: ${step.queryPlan.purpose}</h6>
        <p><strong>Query:</strong> "${step.queryPlan.query}" (${step.queryPlan.priority} priority)</p>
        <p><strong>Found:</strong> ${step.results.length} sources</p>
        <p><strong>Analysis:</strong> ${step.analysis.summary} (${step.analysis.confidence} confidence)</p>
        <small>Sources: ${step.results.map(r => r.file).join(', ')}</small>
    </div>
`).join('')}
</div>

<h5>📚 Cumulative Documentation Gathered</h5>
<p><strong>Total Unique Sources:</strong> ${cumulativeResults.length}</p>
<div class="debug-sources">
${cumulativeResults.map((doc, i) => `
    <div class="debug-source-item">
        <strong>${i + 1}. ${doc.file}</strong>
        <br><small>Step ${doc.searchStep}: ${doc.sourcePurpose}</small>
        <br><small>Query: "${doc.sourceQuery}"</small>
        <br><small>Content: ${doc.content.length} chars</small>
    </div>
`).join('')}
</div>

<h5>📊 Search Performance Analysis</h5>
<div class="debug-performance">
${analysisSteps.map(step => `
    <div class="debug-analysis-step">
        <strong>Step ${step.step}:</strong> ${step.purpose} → ${step.found} sources (${step.analysis.confidence})
    </div>
`).join('')}
</div>

<h5>⚙️ Search Parameters & Timing</h5>
<p>Top-K per query: 4 sources</p>
<p>Total search steps: ${searchHistory.length}</p>
<p>Total execution time: N/A</p>
<p>Model: ${this.ragModelSelect.value}</p>
<p>Deduplication: Active (content-based)</p>
            `;
            
            this.ragDebugContent.innerHTML = debugContent;
        }

        showRunningAgentDebug(agentResult) {
            const debugContent = `
<h5>🤖 Running Agent Analysis</h5>
<p><strong>Total Iterations:</strong> ${agentResult.iterations}</p>
<p><strong>RAG Calls Made:</strong> ${agentResult.ragCallsMade}</p>
<p><strong>Total Queries Generated:</strong> ${agentResult.totalQueries}</p>
<p><strong>Unique Results Found:</strong> ${agentResult.uniqueResults}</p>
<p><strong>Sources Consulted:</strong> ${agentResult.sources.length}</p>

<h5>🔧 Tool Call Details</h5>
<div class="debug-tool-calls">
${agentResult.toolResults ? agentResult.toolResults.map((toolResult, i) => `
    <div class="debug-tool-call">
        <h6>Tool Call ${i + 1} (Iteration ${toolResult.iteration})</h6>
        <p><strong>Concept:</strong> "${toolResult.concept}"</p>
        <p><strong>Success:</strong> ${toolResult.result.success ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Queries Generated:</strong> ${toolResult.result.searchQueries?.length || 0}</p>
        <p><strong>Results Found:</strong> ${toolResult.result.resultCount || 0}</p>
        <p><strong>Sources:</strong> ${toolResult.result.sources?.length || 0}</p>
        <small>Time: ${toolResult.timestamp}</small>
        ${toolResult.result.searchQueries ? `
        <details>
            <summary>Generated Queries</summary>
            <ul>
                ${toolResult.result.searchQueries.map(query => `<li>${query}</li>`).join('')}
            </ul>
        </details>
        ` : ''}
    </div>
`).join('') : '<p>No tool results available</p>'}
</div>

<h5>📚 Documentation Sources</h5>
<div class="debug-sources">
${agentResult.sources.map((source, i) => `
    <div class="debug-source-item">
        <strong>${i + 1}. ${source}</strong>
    </div>
`).join('')}
</div>

<h5>⚙️ Agent Configuration</h5>
<p>Agent Type: Running Agent with Iterative RAG</p>
<p>Max Iterations: 6</p>
<p>Results per Query: 5</p>
<p>Max Results per RAG Call: 15</p>
<p>Deduplication: Active</p>
<p>Model: ${this.ragModelSelect.value}</p>
            `;
            
            this.ragDebugContent.innerHTML = debugContent;
        }

        formatCodeBlocks(content) {
            // First, handle triple backtick code blocks with language
            content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang || 'javascript';
                const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
                
                // Store the original code for copying (use base64 to avoid HTML attribute escaping issues)
                const originalCodeB64 = btoa(encodeURIComponent(code));
                
                // Escape HTML characters in code for display
                const escapedCode = code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                
                return `<div class="code-block-container">
                        <div class="code-block-header">
                            <span class="code-block-language">${language}</span>
                            <button class="copy-code-btn" onclick="window.ragDocChat.copyCode('${codeId}')">
                                📋 Copy
                            </button>
                        </div>
                        <pre><code id="${codeId}" data-original-code-b64="${originalCodeB64}">${escapedCode}</code></pre>
                    </div>`;
            });
            
            // Handle inline code (single backticks) - escape HTML but don't convert newlines
            content = content.replace(/`([^`]+)`/g, (match, code) => {
                const escapedCode = code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                return `<code>${escapedCode}</code>`;
            });
            
            // Handle remaining newlines (only outside of code blocks)
            content = content.replace(/\n/g, '<br>');
            
            return content;
        }

        copyCode(codeId) {
            const codeElement = document.getElementById(codeId);
            if (!codeElement) return;
            
            // Get the original code with proper newlines preserved
            let code = '';
            
            // First try to get from base64 encoded data attribute (preferred method)
            const codeB64 = codeElement.getAttribute('data-original-code-b64');
            if (codeB64) {
                try {
                    code = decodeURIComponent(atob(codeB64));
                } catch (e) {
                    console.warn('Failed to decode base64 code:', e);
                }
            }
            
            // Fallback to old method if base64 fails
            if (!code) {
                const legacyCode = codeElement.getAttribute('data-original-code');
                if (legacyCode) {
                    // Unescape the HTML entities from the data attribute
                    code = legacyCode
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'");
                }
            }
            
            // Final fallback: process the innerHTML to restore newlines
            if (!code) {
                code = codeElement.innerHTML
                    // Convert HTML entities back to regular characters
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    // Handle <br> tags that might be in there
                    .replace(/<br\s*\/?>/gi, '\n')
                    // Remove any remaining HTML tags
                    .replace(/<[^>]*>/g, '');
                
                // If that doesn't work, try textContent but ensure newlines
                if (!code || code.trim() === '') {
                    code = codeElement.textContent || codeElement.innerText || '';
                }
            }
            
            const button = codeElement.closest('.code-block-container').querySelector('.copy-code-btn');
            
            // Try to copy to clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(() => {
                    button.textContent = '✅ Copied!';
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.textContent = '📋 Copy';
                        button.classList.remove('copied');
                    }, 2000);
                }).catch(() => {
                    this.fallbackCopyCode(code, button);
                });
            } else {
                this.fallbackCopyCode(code, button);
            }
        }

        fallbackCopyCode(code, button) {
            // Fallback copy method
            const textArea = document.createElement('textarea');
            textArea.value = code;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                button.textContent = '✅ Copied!';
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = '📋 Copy';
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
                button.textContent = '❌ Failed';
                setTimeout(() => {
                    button.textContent = '📋 Copy';
                }, 2000);
            }
            
            document.body.removeChild(textArea);
        }

        addMessage(role, content, sources = null) {
            // Add to conversation history
            this.conversationHistory.push({
                role: role,
                content: content,
                timestamp: new Date().toISOString(),
                sources: sources
            });
            
            // Trim history to maintain max length
            if (this.conversationHistory.length > this.maxHistoryLength) {
                this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `rag-message ${role}`;
            
            let sourceInfo = '';
            if (sources && sources.length > 0) {
                sourceInfo = `
                    <div class="rag-sources">
                        <strong>📚 Sources:</strong>
                        ${sources.map(source => `<div class="rag-source-item">${typeof source === 'string' ? source : source.file || source}</div>`).join('')}
                    </div>`;
            }

            messageDiv.innerHTML = `
                <div class="rag-message-content">
                    <strong>${role === 'user' ? '👤 You' : '📖 AE Docs Assistant'}:</strong>
                    ${this.formatCodeBlocks(content)}
                    ${sourceInfo}
                </div>
            `;
            
            this.ragChatMessages.appendChild(messageDiv);
            this.ragChatMessages.scrollTop = this.ragChatMessages.scrollHeight;
        }

        addStreamingMessage(messageId) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'rag-message assistant';
            messageDiv.id = messageId;
            
            messageDiv.innerHTML = `
                <div class="rag-message-content">
                    <strong>📖 AE Docs Assistant:</strong>
                    <div class="streaming-content">
                        <span class="streaming-cursor">▌</span>
                    </div>
                </div>
            `;
            
            this.ragChatMessages.appendChild(messageDiv);
            this.ragChatMessages.scrollTop = this.ragChatMessages.scrollHeight;
        }

        updateStreamingMessage(messageId, content) {
            const messageDiv = document.getElementById(messageId);
            if (messageDiv) {
                const streamingContent = messageDiv.querySelector('.streaming-content');
                if (streamingContent) {
                    streamingContent.innerHTML = `${this.formatCodeBlocks(content)}<span class="streaming-cursor">▌</span>`;
                    this.ragChatMessages.scrollTop = this.ragChatMessages.scrollHeight;
                }
            }
        }

        finalizeStreamingMessage(messageId, finalContent, sources = null) {
            const messageDiv = document.getElementById(messageId);
            if (messageDiv) {
                // Add to conversation history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: finalContent,
                    timestamp: new Date().toISOString(),
                    sources: sources
                });
                
                // Trim history to maintain max length
                if (this.conversationHistory.length > this.maxHistoryLength) {
                    this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
                }
                
                let sourceInfo = '';
                if (sources && sources.length > 0) {
                    sourceInfo = `
                        <div class="rag-sources">
                            <strong>📚 Sources:</strong>
                            ${sources.map(source => `<div class="rag-source-item">${typeof source === 'string' ? source : source.file || source}</div>`).join('')}
                        </div>`;
                }

                messageDiv.innerHTML = `
                    <div class="rag-message-content">
                        <strong>📖 AE Docs Assistant:</strong>
                        ${this.formatCodeBlocks(finalContent)}
                        ${sourceInfo}
                    </div>
                `;
                
                this.ragChatMessages.scrollTop = this.ragChatMessages.scrollHeight;
            }
        }

        addTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'rag-typing-indicator';
            indicator.innerHTML = `
                <div class="rag-message-content">
                    <strong>📖 AE Docs Assistant:</strong>
                    <div class="rag-typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            this.ragChatMessages.appendChild(indicator);
            this.ragChatMessages.scrollTop = this.ragChatMessages.scrollHeight;
        }

        removeTypingIndicator() {
            const indicator = this.ragChatMessages.querySelector('.rag-typing-indicator');
            if (indicator) {
                indicator.remove();
            }
        }

        clearChat() {
            // Clear conversation history
            this.conversationHistory = [];
            
            this.ragChatMessages.innerHTML = `
                <div class="rag-message assistant">
                    <div class="rag-message-content">
                        <strong>📖 AE Docs Assistant:</strong> Chat cleared! Ask me anything about After Effects scripting.
                    </div>
                </div>
            `;
        }

        toggleDebug() {
            const isVisible = this.ragDebugInfo.style.display !== 'none';
            this.ragDebugInfo.style.display = isVisible ? 'none' : 'block';
            this.ragDebugToggle.textContent = isVisible ? '🔍' : '🔻';
        }

        async reprocessDocuments() {
            this.updateStatus('Reprocessing documents...', 'processing');
            try {
                const response = await fetch(`${this.ragServerUrl}/reprocess`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    this.addMessage('assistant', '✅ Documents reprocessed successfully!');
                    this.updateStatus('Ready', 'ready');
                } else {
                    throw new Error('Reprocessing failed');
                }
            } catch (error) {
                this.addMessage('assistant', '❌ Document reprocessing failed');
                this.updateStatus('Error', 'error');
            }
        }

        updateStatus(message, type) {
            this.ragStatus.textContent = message;
            this.ragStatus.className = `rag-status-text ${type}`;
        }

        async exportProjectContext() {
            try {
                const projectData = await new Promise((resolve, reject) => {
                    const csInterface = new CSInterface();
                    csInterface.evalScript('exportProjectToJSON()', (result) => {
                        if (result === 'undefined' || result === 'null' || result.startsWith('Error:')) {
                            reject(new Error(result || 'Failed to export project'));
                        } else {
                            resolve(result);
                        }
                    });
                });

                this.projectContext = JSON.parse(projectData);
                this.updateContextPreview();
                this.addMessage('assistant', '✅ Project context exported successfully! The AI now has access to your current project structure for more accurate script generation.');
                
            } catch (error) {
                console.error('Export error:', error);
                this.addMessage('assistant', `❌ Failed to export project: ${error.message}`);
            }
        }

        attachJsonFile() {
            this.ragJsonFileInput?.click();
        }

        handleJsonFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (!file.name.endsWith('.json')) {
                this.addMessage('assistant', '❌ Please select a JSON file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.projectContext = JSON.parse(e.target.result);
                    this.updateContextPreview();
                    this.addMessage('assistant', `✅ JSON file "${file.name}" attached successfully! The AI now has access to this project context.`);
                } catch (error) {
                    console.error('JSON parse error:', error);
                    this.addMessage('assistant', `❌ Error parsing JSON file: ${error.message}`);
                }
            };
            reader.readAsText(file);
        }

        clearContext() {
            this.projectContext = null;
            this.updateContextPreview();
            this.addMessage('assistant', '🗑️ Project context cleared.');
        }

        updateContextPreview() {
            if (!this.ragContextPreview) return;

            if (this.projectContext) {
                const summary = this.buildContextSummary();
                this.ragContextPreview.innerHTML = `
                    <div class="context-item">
                        <div class="context-item-header">📄 Project Context Loaded</div>
                        <div class="context-item-content">${summary}</div>
                    </div>
                `;
            } else {
                this.ragContextPreview.innerHTML = '<div class="context-preview" style="color: #888; font-style: italic;">No project context loaded</div>';
            }
        }

        buildContextSummary() {
            if (!this.projectContext) return 'No context available';

            const comps = this.projectContext.compositions?.length || 0;
            const items = this.projectContext.items?.length || 0;
            const layers = this.projectContext.compositions?.reduce((total, comp) => 
                total + (comp.layers?.length || 0), 0) || 0;

            return `
                <strong>Project:</strong> ${this.projectContext.projectName || 'Unnamed'}<br>
                <strong>Compositions:</strong> ${comps}<br>
                <strong>Items:</strong> ${items}<br>
                <strong>Total Layers:</strong> ${layers}<br>
                <strong>Active Comp:</strong> ${this.projectContext.activeComposition?.name || 'None'}
            `;
        }

        buildContextPrompt() {
            if (!this.projectContext) return '';

            return `
**CURRENT PROJECT CONTEXT:**
${JSON.stringify(this.projectContext, null, 2)}

**IMPORTANT CONTEXT RULES:**
1. Use ACTUAL layer names, composition names, and item names from the project context above
2. NEVER use placeholder names like "MyLayer", "MyComp", or "TextLayer 1"
3. Reference specific layers by their exact names from the project
4. If creating new layers, give them meaningful names
5. Work within the existing project structure when possible

`;
        }

        async showCompositionSelector() {
            try {
                // Get the list of compositions from After Effects
                const compositionsData = await new Promise((resolve, reject) => {
                    const csInterface = new CSInterface();
                    csInterface.evalScript('getCompositionList()', (result) => {
                        if (result === 'undefined' || result === 'null' || result.startsWith('Error:')) {
                            reject(new Error(result || 'Failed to get compositions'));
                        } else {
                            resolve(result);
                        }
                    });
                });

                const compositions = JSON.parse(compositionsData);
                this.populateCompositionList(compositions);
                this.ragCompositionSelector.style.display = 'block';
                
            } catch (error) {
                console.error('Error getting compositions:', error);
                this.addMessage('assistant', `❌ Failed to get compositions: ${error.message}`);
            }
        }

        populateCompositionList(compositions) {
            if (!compositions || compositions.length === 0) {
                this.ragCompositionList.innerHTML = '<div style="padding: 10px; color: #888;">No compositions found in project</div>';
                return;
            }

            this.ragCompositionList.innerHTML = '';
            
            compositions.forEach((comp, index) => {
                const compItem = document.createElement('div');
                compItem.className = 'composition-item';
                
                compItem.innerHTML = `
                    <input type="checkbox" id="comp_${index}" value="${comp.name}" ${comp.isActive ? 'checked' : ''}>
                    <div class="composition-item-info">
                        <div class="composition-item-name">${comp.name} ${comp.isActive ? '(Active)' : ''}</div>
                        <div class="composition-item-details">
                            ${comp.width}×${comp.height}, ${comp.duration.toFixed(2)}s, ${comp.layers} layers
                        </div>
                    </div>
                `;
                
                this.ragCompositionList.appendChild(compItem);
            });
        }

        selectAllCompositions() {
            const checkboxes = this.ragCompositionList.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = true);
        }

        selectNoCompositions() {
            const checkboxes = this.ragCompositionList.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = false);
        }

        async exportSelectedCompositions() {
            const checkboxes = this.ragCompositionList.querySelectorAll('input[type="checkbox"]:checked');
            const selectedComps = Array.from(checkboxes).map(cb => cb.value);
            
            if (selectedComps.length === 0) {
                this.addMessage('assistant', '❌ Please select at least one composition to export.');
                return;
            }

            try {
                const contextData = await new Promise((resolve, reject) => {
                    const csInterface = new CSInterface();
                    const compNamesJson = JSON.stringify(selectedComps);
                    csInterface.evalScript(`exportSelectedCompositionsToJSON(${compNamesJson})`, (result) => {
                        if (result === 'undefined' || result === 'null' || result.startsWith('Error:')) {
                            reject(new Error(result || 'Failed to export selected compositions'));
                        } else {
                            resolve(result);
                        }
                    });
                });

                this.projectContext = JSON.parse(contextData);
                this.updateContextPreview();
                this.hideCompositionSelector();
                
                const compCount = selectedComps.length;
                const compNames = selectedComps.length <= 3 
                    ? selectedComps.join(', ')
                    : `${selectedComps.slice(0, 3).join(', ')} and ${selectedComps.length - 3} more`;
                
                this.addMessage('assistant', `✅ Successfully exported ${compCount} composition${compCount === 1 ? '' : 's'}: ${compNames}. The AI now has access to this context for more accurate script generation.`);
                
            } catch (error) {
                console.error('Export error:', error);
                this.addMessage('assistant', `❌ Failed to export selected compositions: ${error.message}`);
            }
        }

        hideCompositionSelector() {
            this.ragCompositionSelector.style.display = 'none';
        }

        disableRAG() {
            try {
                // Reset the RAG system state
                this.isInitialized = false;
                this.isProcessing = false;
                
                // Update UI elements - keep input enabled for regular chat
                this.ragInput.disabled = false;
                this.sendRagQuery.disabled = false;
                this.ragDisableBtn.style.display = 'none';
                this.ragInitBtn.style.display = 'inline-block';
                
                // Clear any ongoing processes
                this.removeTypingIndicator();
                
                // Update status
                this.updateStatus('Running Agent (intelligent mode)', 'ready');
                
                // Add message to chat
                this.addMessage('assistant', '🔴 RAG system disabled. Running Agent is now in **intelligent mode** - using AI knowledge without documentation tools. Click "Initialize RAG System" to enable RAG-enabled mode.');
                
                console.log('RAG system disabled - chat mode active');
                
            } catch (error) {
                console.error('Error disabling RAG:', error);
                this.addMessage('assistant', `❌ Error disabling RAG: ${error.message}`);
            }
        }
    }

    function setupRAGTab() {
        window.ragDocChat = new RAGDocumentationChat();
        console.log('✅ RAG Documentation Chat initialized');
    }
    
    function initializeExtension() {
        console.log('🚀 Initializing extension...');
        
        // Update theme
        updateTheme();
        
        // Setup dock toggle
        setupDockToggle();
        
        // Setup tabs
        setupTabs();
        
        // Setup manual tool testing
        setupManualToolTesting();
        
        // Setup script generator
        setupScriptGenerator();
        
        // Setup RAG tab
        setupRAGTab();
        
        // Set up tool buttons
        setupToolButtonListeners();
        
        // Initialize Gemini Chat
        console.log('🤖 Initializing Gemini Chat...');
        window.geminiChat = new GeminiChat();
        
        console.log('✅ Extension initialization complete');
        showStatus('Extension ready', 'success');
    }

    function setupToolButtonListeners() {
        // All tool buttons have been removed - only chat interface remains
        console.log('✅ Tool buttons removed - using AI chat interface only');
    }

    // ========================================
    // DOCUMENT READY EVENT
    // ========================================
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM Content Loaded');
        
        // Small delay to ensure CEP is fully ready
        setTimeout(() => {
            initializeExtension();
        }, 100);
    });
    
    // For browser testing - immediate initialization if DOM already ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('📄 DOM Already Ready - Immediate Init');
        setTimeout(initializeExtension, 100);
    }
    
    console.log('🔥 SCRIPT END: main.js loaded successfully');
    
})(); 