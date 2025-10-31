/**
 * AI Chat - Direct Documentation Access
 * Chat with Gemini 2.0 Flash loaded with full After Effects documentation
 * No RAG search needed - instant responses with complete context
 */

class AIChatAgent {
    constructor() {
        this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        this.conversationHistory = [];
        this.docsLoaded = false;
        this.fullDocumentation = '';
        this.projectContext = '';
        this.isProcessing = false;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Main elements
        this.loadDocsBtn = document.getElementById('loadDocsBtn');
        this.sendChatMessageBtn = document.getElementById('sendChatMessage');
        this.chatMessageInput = document.getElementById('chatMessage');
        this.conversationContainer = document.getElementById('chatConversationMessages');
        this.generateChatScriptBtn = document.getElementById('generateChatScript');
        
        // Script generation elements
        this.chatGeneratedScript = document.getElementById('chatGeneratedScript');
        this.runChatScriptBtn = document.getElementById('runChatScript');
        this.fixChatScriptBtn = document.getElementById('fixChatScript');
        this.copyChatScriptBtn = document.getElementById('copyChatScript');
        this.clearChatScriptBtn = document.getElementById('clearChatScript');
        
        // Status elements
        this.chatStatus = document.getElementById('chatStatus');
        this.docsStatus = document.getElementById('docsStatus');
        this.chatResults = document.getElementById('chatResults');
        
        // Control elements
        this.clearChatConvoBtn = document.getElementById('clearChatConvo');
        this.exportChatProjectBtn = document.getElementById('exportChatProjectBtn');
        this.clearChatContextBtn = document.getElementById('clearChatContextBtn');
        this.chatContextPreview = document.getElementById('chatContextPreview');
        
        // Debug element finding
        console.log('🔍 AI Chat elements found:');
        console.log('- loadDocsBtn:', !!this.loadDocsBtn);
        console.log('- chatGeneratedScript:', !!this.chatGeneratedScript);
        console.log('- generateChatScriptBtn:', !!this.generateChatScriptBtn);
        console.log('- runChatScriptBtn:', !!this.runChatScriptBtn);
        console.log('- fixChatScriptBtn:', !!this.fixChatScriptBtn);
        
        if (!this.chatGeneratedScript) {
            console.error('❌ chatGeneratedScript element not found! Looking for ID: chatGeneratedScript');
        } else {
            // Ensure script textarea is always editable
            this.chatGeneratedScript.removeAttribute('readonly');
            this.chatGeneratedScript.removeAttribute('disabled');
            this.chatGeneratedScript.style.pointerEvents = 'auto';
            this.chatGeneratedScript.style.cursor = 'text';
            console.log('✅ Script textarea set to fully editable');
        }
    }

    setupEventListeners() {
        this.loadDocsBtn.addEventListener('click', () => this.loadDocumentation());
        this.sendChatMessageBtn.addEventListener('click', () => this.sendMessage());
        this.chatMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.generateChatScriptBtn.addEventListener('click', () => this.generateScript());
        this.runChatScriptBtn.addEventListener('click', () => this.runScript());
        this.fixChatScriptBtn.addEventListener('click', () => this.fixScript());
        this.copyChatScriptBtn.addEventListener('click', () => this.copyScript());
        this.clearChatScriptBtn.addEventListener('click', () => this.clearScript());
        
        this.clearChatConvoBtn.addEventListener('click', () => this.clearConversation());
        this.exportChatProjectBtn.addEventListener('click', () => this.exportProject());
        this.clearChatContextBtn.addEventListener('click', () => this.clearContext());
    }

    async loadDocumentation() {
        this.updateStatus('Loading After Effects documentation...', '📚 Loading...');
        this.loadDocsBtn.disabled = true;
        
        try {
            // Load ALL documentation files from official_docsforadobe_rag/docs/
            const docFiles = [
                // Root level
                'official_docsforadobe_rag/docs/index.md',
                
                // General
                'official_docsforadobe_rag/docs/general/application.md',
                'official_docsforadobe_rag/docs/general/globals.md', 
                'official_docsforadobe_rag/docs/general/project.md',
                'official_docsforadobe_rag/docs/general/system.md',
                
                // Introduction
                'official_docsforadobe_rag/docs/introduction/javascript.md',
                'official_docsforadobe_rag/docs/introduction/objectmodel.md',
                'official_docsforadobe_rag/docs/introduction/overview.md',
                'official_docsforadobe_rag/docs/introduction/changelog.md',
                'official_docsforadobe_rag/docs/introduction/classhierarchy.md',
                
                // Item
                'official_docsforadobe_rag/docs/item/avitem.md',
                'official_docsforadobe_rag/docs/item/compitem.md',
                'official_docsforadobe_rag/docs/item/folderitem.md',
                'official_docsforadobe_rag/docs/item/footageitem.md',
                'official_docsforadobe_rag/docs/item/item.md',
                'official_docsforadobe_rag/docs/item/itemcollection.md',
                
                // Layer
                'official_docsforadobe_rag/docs/layer/layer.md',
                'official_docsforadobe_rag/docs/layer/layercollection.md',
                'official_docsforadobe_rag/docs/layer/lightlayer.md',
                'official_docsforadobe_rag/docs/layer/shapelayer.md',
                'official_docsforadobe_rag/docs/layer/textlayer.md',
                'official_docsforadobe_rag/docs/layer/threedmodellayer.md',
                'official_docsforadobe_rag/docs/layer/avlayer.md',
                'official_docsforadobe_rag/docs/layer/cameralayer.md',
                
                // Property
                'official_docsforadobe_rag/docs/property/propertygroup.md',
                'official_docsforadobe_rag/docs/property/maskpropertygroup.md',
                'official_docsforadobe_rag/docs/property/property.md',
                'official_docsforadobe_rag/docs/property/propertybase.md',
                
                // Text
                'official_docsforadobe_rag/docs/text/composedlinerange.md',
                'official_docsforadobe_rag/docs/text/fontobject.md',
                'official_docsforadobe_rag/docs/text/fontsobject.md',
                'official_docsforadobe_rag/docs/text/paragraphrange.md',
                'official_docsforadobe_rag/docs/text/textdocument.md',
                'official_docsforadobe_rag/docs/text/characterrange.md',
                
                // Matchnames
                'official_docsforadobe_rag/docs/matchnames/layer/shapelayer.md',
                'official_docsforadobe_rag/docs/matchnames/layer/textlayer.md',
                'official_docsforadobe_rag/docs/matchnames/layer/3dlayer.md',
                'official_docsforadobe_rag/docs/matchnames/layer/avlayer.md',
                'official_docsforadobe_rag/docs/matchnames/layer/cameralayer.md',
                'official_docsforadobe_rag/docs/matchnames/layer/layerstyles.md',
                'official_docsforadobe_rag/docs/matchnames/layer/lightlayer.md',
                'official_docsforadobe_rag/docs/matchnames/effects/firstparty.md',
                
                // Other
                'official_docsforadobe_rag/docs/other/collection.md',
                'official_docsforadobe_rag/docs/other/importoptions.md',
                'official_docsforadobe_rag/docs/other/keyframeease.md',
                'official_docsforadobe_rag/docs/other/markervalue.md',
                'official_docsforadobe_rag/docs/other/preferences.md',
                'official_docsforadobe_rag/docs/other/settings.md',
                'official_docsforadobe_rag/docs/other/shape.md',
                'official_docsforadobe_rag/docs/other/view.md',
                'official_docsforadobe_rag/docs/other/viewer.md',
                'official_docsforadobe_rag/docs/other/viewoptions.md',
                
                // Render Queue
                'official_docsforadobe_rag/docs/renderqueue/omcollection.md',
                'official_docsforadobe_rag/docs/renderqueue/outputmodule.md',
                'official_docsforadobe_rag/docs/renderqueue/renderqueue.md',
                'official_docsforadobe_rag/docs/renderqueue/renderqueueitem.md',
                'official_docsforadobe_rag/docs/renderqueue/rqitemcollection.md',
                
                // Sources
                'official_docsforadobe_rag/docs/sources/filesource.md',
                'official_docsforadobe_rag/docs/sources/footagesource.md',
                'official_docsforadobe_rag/docs/sources/placeholdersource.md',
                'official_docsforadobe_rag/docs/sources/solidsource.md'
            ];

            const docContents = [];
            let loadedCount = 0;

            for (const file of docFiles) {
                try {
                    const response = await fetch(file);
                    if (response.ok) {
                        const content = await response.text();
                        docContents.push(`=== ${file} ===\n${content}\n`);
                        loadedCount++;
                        this.updateStatus(`Loading documentation... ${loadedCount}/${docFiles.length}`, '📚 Loading...');
                    }
                } catch (error) {
                    console.warn(`Failed to load ${file}:`, error);
                }
            }

            this.fullDocumentation = docContents.join('\n');
            this.docsLoaded = true;
            
            this.updateStatus('Ready to chat!', '📚 Docs: Loaded');
            this.sendChatMessageBtn.disabled = false;
            this.generateChatScriptBtn.disabled = false;
            this.loadDocsBtn.disabled = false;
            this.loadDocsBtn.textContent = '🔄 Reload Docs';
            
            this.addMessage('assistant', '✅ Documentation loaded successfully! I now have access to the complete After Effects scripting documentation. Ask me anything or describe what script you need!');
            
        } catch (error) {
            console.error('Failed to load documentation:', error);
            this.updateStatus('Failed to load documentation', '❌ Error');
            this.loadDocsBtn.disabled = false;
        }
    }

    async sendMessage() {
        if (!this.docsLoaded) {
            alert('Please load documentation first!');
            return;
        }

        const message = this.chatMessageInput.value.trim();
        if (!message || this.isProcessing) return;

        this.addMessage('user', message);
        this.chatMessageInput.value = '';
        this.isProcessing = true;
        this.updateStatus('Processing...', null);

        try {
            const response = await this.callGeminiWithDocs(message);
            this.addMessage('assistant', response);
            this.updateStatus('Ready to chat!', null);
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('assistant', '❌ Sorry, I encountered an error. Please try again.');
            this.updateStatus('Error - Ready to retry', null);
        } finally {
            this.isProcessing = false;
        }
    }

    async generateScript() {
        if (!this.docsLoaded) {
            alert('Please load documentation first!');
            return;
        }

        const lastUserMessage = this.getLastUserMessage();
        if (!lastUserMessage) {
            alert('Please send a message describing what script you need first!');
            return;
        }
        
        // Re-check elements if not found initially
        if (!this.chatGeneratedScript) {
            console.log('🔄 Re-initializing elements...');
            this.initializeElements();
            
            if (!this.chatGeneratedScript) {
                alert('Script output area not found. Please refresh the page and try again.');
                return;
            }
        }

        this.updateStatus('Generating script...', null);
        this.generateChatScriptBtn.disabled = true;

        try {
            const scriptPrompt = `Based on our conversation and the After Effects documentation I have loaded, generate a complete ExtendScript for the user's request.

**ABSOLUTE REQUIREMENT: GENERATE PERFECT CODE**
Your generated code will be executed EXACTLY as written with NO post-processing. Every character must be syntactically correct ExtendScript.

**CRITICAL STRUCTURE REQUIREMENTS:**
1. NEVER wrap scripts in IIFE patterns like (function() { ... })()
2. app.beginUndoGroup() MUST be the FIRST line before try block
3. JSON.stringify() calls MUST be direct, not assigned to variables
4. NO statements after the closing } of the catch block


**REQUIRED STRUCTURE:**
\`\`\`javascript
app.beginUndoGroup("Script Name");

try {
    // Main script logic using standard After Effects APIs
    // Use your documentation knowledge for correct method names and parameters
    
    app.endUndoGroup();
    
    // Success message as LAST statement - NO variables, direct call
    JSON.stringify({
        success: true,
        message: "Script completed successfully!"
    });

} catch (err) {
    app.endUndoGroup();
    
    // Error message as LAST statement - NO variables, direct call
    JSON.stringify({
        success: false,
        message: "Script Error: " + err.toString(),
        line: err.line || "unknown"
    });
}
\`\`\`

${this.projectContext ? `**PROJECT CONTEXT:**\n${this.projectContext}\n\n` : ''}

**USER REQUEST:** ${lastUserMessage}

Generate the complete ExtendScript now:`;

            const script = await this.callGeminiWithDocs(scriptPrompt);
            
            console.log('🤖 Raw AI response:', script);
            
            // Extract script from response - try multiple patterns
            let extractedScript = script;
            
            // Try to find code blocks
            const codeBlockMatch = script.match(/```(?:javascript|jsx|js|extendscript)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
                extractedScript = codeBlockMatch[1].trim();
                console.log('✅ Found code block');
            } else {
                // Try to find script between common markers
                const scriptStartMatch = script.match(/(?:script|code|extendscript)[\s\S]*?:\s*([\s\S]*)/i);
                if (scriptStartMatch) {
                    extractedScript = scriptStartMatch[1].trim();
                    console.log('✅ Found script after marker');
                } else {
                    console.log('⚠️ No code block found, using full response');
                    extractedScript = script.trim();
                }
            }
            
            console.log('🤖 Extracted script:', extractedScript);
            console.log('🤖 Script textarea element:', this.chatGeneratedScript);
            
            if (!this.chatGeneratedScript) {
                console.error('❌ Script textarea element not found!');
                this.addMessage('assistant', '❌ Error: Script output area not found. Please refresh the page.');
                return;
            }
            
            this.chatGeneratedScript.value = extractedScript;
            this.runChatScriptBtn.disabled = false;
            this.fixChatScriptBtn.disabled = false;
            this.copyChatScriptBtn.disabled = false;
            
            console.log('✅ Script set in textarea, length:', this.chatGeneratedScript.value.length);
            
            this.addMessage('assistant', '✅ Script generated! Check the script output area below.');
            this.updateStatus('Script ready to run!', null);
            
        } catch (error) {
            console.error('Script generation error:', error);
            this.addMessage('assistant', '❌ Failed to generate script. Please try again.');
            this.updateStatus('Script generation failed', null);
        } finally {
            this.generateChatScriptBtn.disabled = false;
        }
    }

    async callGeminiWithDocs(message) {
        const systemPrompt = `You are an expert After Effects ExtendScript developer with complete access to the After Effects scripting documentation. You can answer questions, provide guidance, and generate scripts.

**COMPLETE AFTER EFFECTS DOCUMENTATION:**
${this.fullDocumentation}

**CONVERSATION HISTORY:**
${this.conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

**CRITICAL GUIDELINES:**
1. Use the loaded documentation to provide accurate, detailed answers
2. When generating code, ensure it follows proper ExtendScript syntax
3. NEVER use "new Color()" - use color arrays like [1, 0, 0] instead
4. Provide working, tested patterns from the documentation
5. Include proper error handling in scripts
6. Be conversational and helpful

${this.projectContext ? `**PROJECT CONTEXT:**\n${this.projectContext}\n\n` : ''}

**USER MESSAGE:** ${message}

Respond helpfully using your complete documentation knowledge:`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemPrompt }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 4000,
                    topP: 0.8
                }
            })
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    }

    addMessage(role, content) {
        this.conversationHistory.push({ role, content });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-conversation-message ${role}`;
        
        const icon = role === 'user' ? '👤' : '🤖';
        const label = role === 'user' ? 'You' : 'AE Expert';
        
        messageDiv.innerHTML = `
            <div class="chat-conversation-message-content">
                <strong>${icon} ${label}:</strong> ${content.replace(/\n/g, '<br>')}
            </div>
        `;
        
        this.conversationContainer.appendChild(messageDiv);
        this.conversationContainer.scrollTop = this.conversationContainer.scrollHeight;
    }

    getLastUserMessage() {
        for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
            if (this.conversationHistory[i].role === 'user') {
                return this.conversationHistory[i].content;
            }
        }
        return null;
    }

    async runScript() {
        const script = this.chatGeneratedScript.value.trim();
        if (!script) return;

        this.updateStatus('Running script...', null);
        this.runChatScriptBtn.disabled = true;

        try {
            const csInterface = new CSInterface();
            const result = await new Promise((resolve) => {
                csInterface.evalScript(script, (result) => {
                    resolve(result);
                });
            });

            this.chatResults.innerHTML = `<div class="result-success">${result}</div>`;
            this.updateStatus('Script executed!', null);
        } catch (error) {
            this.chatResults.innerHTML = `<div class="result-error">Error: ${error.message}</div>`;
            this.updateStatus('Script execution failed', null);
        } finally {
            this.runChatScriptBtn.disabled = false;
        }
    }

    async fixScript() {
        const currentScript = this.chatGeneratedScript.value.trim();
        if (!currentScript) {
            alert('No script to fix. Generate a script first.');
            return;
        }

        if (!this.docsLoaded) {
            alert('Please load documentation first!');
            return;
        }

        // Get error message from results if available
        const errorElement = this.chatResults.querySelector('.result-error');
        const errorMessage = errorElement ? errorElement.textContent : 'Script has errors that need fixing';

        this.updateStatus('Fixing script...', null);
        this.fixChatScriptBtn.disabled = true;

        try {
            const fixPrompt = `I have an ExtendScript that has errors. Please analyze the script and the error message, then provide a corrected version.

**CURRENT SCRIPT WITH ERRORS:**
\`\`\`javascript
${currentScript}
\`\`\`

**ERROR MESSAGE:**
${errorMessage}

**ABSOLUTE REQUIREMENT: GENERATE PERFECT FIXED CODE**
Your corrected code will be executed EXACTLY as written with NO post-processing. Every character must be syntactically correct ExtendScript.

**CRITICAL STRUCTURE REQUIREMENTS:**
1. NEVER wrap scripts in IIFE patterns like (function() { ... })()
2. app.beginUndoGroup() MUST be the FIRST line before try block
3. JSON.stringify() calls MUST be direct, not assigned to variables
4. NO statements after the closing } of the catch block

**CRITICAL EXTENDSCRIPT API RULES - THESE CAUSE RUNTIME ERRORS:**
❌ NEVER use "new Color()" - THIS CONSTRUCTOR DOES NOT EXIST
❌ NEVER use "new Point()" or "new Vector()" - THESE CONSTRUCTORS DO NOT EXIST  
❌ NEVER use "new Shape()" - THIS CONSTRUCTOR DOES NOT EXIST
❌ NEVER try to create vector shapes with vertices arrays - THIS IS UNRELIABLE
❌ NEVER use .vertices property on shapes - THIS DOES NOT EXIST
❌ NEVER use .closed property on shapes - THIS DOES NOT EXIST
❌ NEVER use addProperty("ADBE Vector Shape - Ellipse") - TOO COMPLEX, USE SOLIDS
❌ NEVER try to manually create Shape objects - THEY DON'T WORK

✅ ALWAYS use color arrays: [red, green, blue] with values 0-1 (e.g., [1, 0, 0] for red)
✅ ALWAYS use arrays for coordinates: [x, y] or [x, y, z]
✅ ALWAYS use addSolid() for simple shapes instead of complex vector creation
✅ ALWAYS use solid layers with effects rather than attempting complex vector shapes
✅ For circles/shapes: Use solid layers and add Corner Pin effect or masks
✅ Use layer.property().setValue() syntax for setting values
✅ Use Effects.addProperty() with simple, proven match names

**REQUIRED STRUCTURE:**
\`\`\`javascript
app.beginUndoGroup("Script Name");

try {
    // Fixed script logic using standard After Effects APIs
    
    app.endUndoGroup();
    
    // Success message as LAST statement - NO variables, direct call
    JSON.stringify({
        success: true,
        message: "Script completed successfully!"
    });

} catch (err) {
    app.endUndoGroup();
    
    // Error message as LAST statement - NO variables, direct call
    JSON.stringify({
        success: false,
        message: "Script Error: " + err.toString(),
        line: err.line || "unknown"
    });
}
\`\`\`

Please provide ONLY the corrected ExtendScript that fixes the identified issues:`;

            const fixedScript = await this.callGeminiWithDocs(fixPrompt);
            
            console.log('🔧 Raw fix response:', fixedScript);
            
            // Extract script from response - try multiple patterns
            let extractedScript = fixedScript;
            
            // Try to find code blocks
            const codeBlockMatch = fixedScript.match(/```(?:javascript|jsx|js|extendscript)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
                extractedScript = codeBlockMatch[1].trim();
                console.log('✅ Found fixed code block');
            } else {
                console.log('⚠️ No code block found in fix, using full response');
                extractedScript = fixedScript.trim();
            }
            
            console.log('🔧 Extracted fixed script:', extractedScript);
            
            // Update the script textarea with fixed version
            this.chatGeneratedScript.value = extractedScript;
            
            // Clear previous error results
            this.chatResults.innerHTML = '';
            
            this.addMessage('assistant', '🔧 Script has been fixed! The corrected version is now in the script area. Try running it again.');
            this.updateStatus('Script fixed and ready to test!', null);
            
        } catch (error) {
            console.error('Script fix error:', error);
            this.addMessage('assistant', '❌ Failed to fix script. Please try manually correcting the issues.');
            this.updateStatus('Script fix failed', null);
        } finally {
            this.fixChatScriptBtn.disabled = false;
        }
    }

    copyScript() {
        const script = this.chatGeneratedScript.value;
        navigator.clipboard.writeText(script).then(() => {
            this.updateStatus('Script copied to clipboard!', null);
        });
    }

    clearScript() {
        this.chatGeneratedScript.value = '';
        this.runChatScriptBtn.disabled = true;
        this.fixChatScriptBtn.disabled = true;
        this.copyChatScriptBtn.disabled = true;
        this.chatResults.innerHTML = '';
    }

    clearConversation() {
        this.conversationHistory = [];
        this.conversationContainer.innerHTML = `
            <div class="chat-conversation-message assistant">
                <div class="chat-conversation-message-content">
                    <strong>🤖 AE Expert:</strong> Conversation cleared! ${this.docsLoaded ? 'I still have the documentation loaded and ready to help.' : 'Please load documentation to get started.'}
                </div>
            </div>
        `;
    }

    async exportProject() {
        this.updateStatus('Exporting project context...', null);
        try {
            const csInterface = new CSInterface();
            const result = await new Promise((resolve) => {
                csInterface.evalScript('buildContextPrompt()', (result) => {
                    resolve(result);
                });
            });

            this.projectContext = result;
            this.chatContextPreview.innerHTML = `<pre>${result.substring(0, 200)}...</pre>`;
            this.updateStatus('Project context loaded!', null);
        } catch (error) {
            this.updateStatus('Failed to export project context', null);
        }
    }

    clearContext() {
        this.projectContext = '';
        this.chatContextPreview.innerHTML = '';
        this.updateStatus('Project context cleared', null);
    }

    updateStatus(chatText, docsText) {
        if (chatText) this.chatStatus.textContent = chatText;
        if (docsText) this.docsStatus.textContent = docsText;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are in DOM
    setTimeout(() => {
        console.log('🤖 Initializing AI Chat Agent...');
        window.aiChatAgent = new AIChatAgent();
    }, 500);
}); 