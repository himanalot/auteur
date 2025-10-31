/**
 * Original Script Generator - Exact Working Copy
 * This is a standalone copy of the working script generator from commit 120532e
 */

// Global variables needed for script execution
var isInCEP = typeof CSInterface !== 'undefined';
var csInterface = typeof CSInterface !== 'undefined' ? new CSInterface() : null;

class OriginalScriptGenerator {
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
        
        console.log('🎬 OriginalScriptGenerator: Initializing with AI Agent + RAG Tool...');
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
        // Use original- prefix to avoid conflicts
        this.scriptRequest = document.getElementById('originalScriptRequest');
        this.generateBtn = document.getElementById('originalGenerateScript');
        this.generatedScript = document.getElementById('originalGeneratedScript');
        this.runBtn = document.getElementById('originalRunScript');
        this.copyBtn = document.getElementById('originalCopyScript');
        this.clearBtn = document.getElementById('originalClearScript');
        this.scriptStatus = document.getElementById('originalScriptStatus');
        this.scriptResults = document.getElementById('originalScriptResults');
        
        // Model selector
        this.modelSelect = document.getElementById('originalScriptModelSelect');
        if (this.modelSelect) {
            this.modelSelect.value = this.selectedModel;
        }
        
        // Context elements
        this.exportProjectBtn = document.getElementById('originalExportProjectBtn');
        this.downloadJsonBtn = document.getElementById('originalDownloadJsonBtn');
        this.screenshotUpload = document.getElementById('originalScreenshotUpload');
        this.clearContextBtn = document.getElementById('originalClearContextBtn');
        this.contextPreview = document.getElementById('originalContextPreview');
        
        this.setupEventListeners();
        
        // Add a test script for immediate testing
        if (this.generatedScript) {
            this.generatedScript.value = 'alert("Hello from Original Script Generator!");';
            this.runBtn.disabled = false;
            this.copyBtn.disabled = false;
        }
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

        // Listen for model selection changes
        if (this.modelSelect) {
            this.modelSelect.addEventListener('change', (e) => {
                this.selectedModel = e.target.value;
                localStorage.setItem('selected_model', this.selectedModel);
                console.log('🎬 OriginalScriptGenerator: Model switched to', this.selectedModel);
                
                // Refresh UI status immediately
                this.updateStatus(`Ready (${this.selectedModel === 'gemini' ? 'Gemini' : 'OpenAI'})`, 'info');
            });
        }

        // Listen for changes in generated script textarea to enable buttons
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
    
    buildContextPrompt() {
        let contextInfo = '';
        
        if (this.projectContext) {
            contextInfo += `\n\n**PROJECT CONTEXT:**\n`;
            contextInfo += `- Project Name: ${this.projectContext.name || 'Unknown'}\n`;
            contextInfo += `- Compositions: ${this.projectContext.items ? this.projectContext.items.filter(item => item.type === 'composition').length : 0}\n`;
            contextInfo += `- Total Items: ${this.projectContext.items ? this.projectContext.items.length : 0}\n`;
            
            if (this.projectContext.items && this.projectContext.items.length > 0) {
                contextInfo += `- Available Items:\n`;
                this.projectContext.items.slice(0, 5).forEach(item => {
                    contextInfo += `  • ${item.name} (${item.type})\n`;
                });
            }
        }
        
        if (this.screenshots.length > 0) {
            contextInfo += `\n**SCREENSHOTS:** ${this.screenshots.length} image(s) provided for reference\n`;
        }
        
        return contextInfo;
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
            if (!isInCEP || !csInterface) {
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
        if (!isInCEP || !csInterface) {
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
    
    updateContextPreview() {
        if (!this.contextPreview) return;
        
        let preview = '';
        if (this.projectContext) {
            preview += `📄 Project: ${this.projectContext.name || 'Unknown'}\n`;
            preview += `📁 ${this.projectContext.items ? this.projectContext.items.length : 0} items\n`;
        }
        
        if (this.screenshots.length > 0) {
            preview += `📷 ${this.screenshots.length} screenshot(s)\n`;
        }
        
        this.contextPreview.textContent = preview;
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
        if (!this.projectContext) {
            this.showResult('❌ No project data to download', 'error');
            return;
        }
        
        try {
            // Create a formatted JSON string with indentation for readability
            const jsonString = JSON.stringify(this.projectContext, null, 2);
            
            // Set the filename
            const projectName = this.projectContext.name || 'project';
            const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${safeProjectName}_${timestamp}.json`;
            
            // Create download link
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showResult(`✅ Project JSON downloaded: ${filename}`, 'success');
            
        } catch (error) {
            console.error('Download error:', error);
            this.showResult(`❌ Download failed: ${error.message}`, 'error');
        }
    }
}

// Initialize the original script generator when the page loads
function setupOriginalScriptGenerator() {
    window.originalScriptGenerator = new OriginalScriptGenerator();
    console.log('✅ Original Script Generator initialized');
}

// Export for global use
window.setupOriginalScriptGenerator = setupOriginalScriptGenerator;