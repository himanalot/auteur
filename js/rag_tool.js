/**
 * RAG Documentation Tool for AI Agent
 * Provides on-demand documentation lookup for the main AI agent
 */

class RAGDocumentationTool {
    constructor() {
        this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        this.ragServerUrl = 'http://localhost:5002';
        this.maxDocsPerQuery = 5; // Updated to return 5 per query
        this.cache = new Map(); // Cache frequent queries
        this.enhancedRAG = new EnhancedRAG(); // Use existing multi-query system
    }

    /**
     * Search documentation using enhanced multi-query system
     */
    async searchDocumentation(question, context = '') {
        const cacheKey = `${question}|${context}`.substring(0, 100);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            console.log(`📋 Using cached result for: ${question.substring(0, 50)}...`);
            return this.cache.get(cacheKey);
        }

        try {
            console.log(`🔍 RAG Tool multi-query search: ${question.substring(0, 50)}...`);
            
            // Use existing enhanced RAG system that does multi-query + deduplication
            const enhancedQuery = context ? `${question} Context: ${context}` : question;
            const ragResult = await this.enhancedRAG.searchForScriptGeneration(enhancedQuery);
            
            if (ragResult.success) {
                console.log(`📊 RAG Result: ${ragResult.searchQueries.length} queries, ${ragResult.documentCount} docs found`);
                
                const result = {
                    success: true,
                    documentation: ragResult.documentationContext,
                    sources: ragResult.sources || [],
                    query: question,
                    resultCount: ragResult.documentCount || 0,
                    searchQueries: ragResult.searchQueries || []
                };

                // Cache the result
                this.cache.set(cacheKey, result);
                return result;

            } else {
                return {
                    success: false,
                    error: ragResult.error || 'No relevant documentation found',
                    documentation: '',
                    sources: [],
                    query: question,
                    resultCount: 0,
                    searchQueries: []
                };
            }

        } catch (error) {
            console.warn(`RAG Tool error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                documentation: '',
                sources: [],
                query: question,
                resultCount: 0,
                searchQueries: []
            };
        }
    }

    /**
     * Format the tool call result for the main agent
     */
    formatToolResult(result) {
        if (result.success) {
            return {
                tool: 'rag_documentation',
                success: true,
                content: result.documentation,
                // Keep both direct access and metadata for compatibility
                searchQueries: result.searchQueries || [],
                resultCount: result.resultCount || 0,
                sources: result.sources || [],
                metadata: {
                    sources: result.sources,
                    query: result.query,
                    resultCount: result.resultCount,
                    searchQueries: result.searchQueries
                }
            };
        } else {
            return {
                tool: 'rag_documentation',
                success: false,
                error: result.error,
                content: 'No documentation available for this query.',
                searchQueries: [],
                resultCount: 0,
                sources: [],
                metadata: {
                    query: result.query,
                    searchQueries: [],
                    resultCount: 0
                }
            };
        }
    }

    /**
     * Main tool interface - call this from the agent
     */
    async call(question, context = '', projectJSON = null) {
        // Enhance context with project JSON insights if available
        let enhancedContext = context;
        if (projectJSON) {
            const projectInsights = this.extractProjectInsights(projectJSON);
            enhancedContext = `${context}\n\nProject Insights: ${projectInsights}`;
        }
        
        const result = await this.searchDocumentation(question, enhancedContext);
        return this.formatToolResult(result);
    }

    /**
     * Extract relevant insights from project JSON for RAG context
     */
    extractProjectInsights(projectJSON) {
        const insights = [];
        
        if (projectJSON.items) {
            const comps = projectJSON.items.filter(item => item.composition);
            const layerTypes = new Set();
            const layerNames = [];
            
            comps.forEach(comp => {
                if (comp.composition && comp.composition.layers) {
                    comp.composition.layers.forEach(layer => {
                        layerTypes.add(layer.type);
                        if (layerNames.length < 10) { // Limit to first 10 layer names
                            layerNames.push(layer.name);
                        }
                    });
                }
            });
            
            if (layerTypes.size > 0) {
                insights.push(`Layer types in project: ${Array.from(layerTypes).join(', ')}`);
            }
            
            if (layerNames.length > 0) {
                insights.push(`Some layer names: ${layerNames.join(', ')}`);
            }
        }
        
        return insights.join('. ');
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
        console.log('📋 RAG Tool cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()).slice(0, 5) // First 5 keys
        };
    }
}

/**
 * Running AI Agent with Iterative RAG Tool Calls
 * Uses RAG tool dynamically during conversation/script generation
 */

class RunningRAGAgent {
    constructor() {
        this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        this.ragTool = new RAGDocumentationTool();
        this.conversationHistory = [];
        this.currentContext = '';
        this.maxIterations = 3;
        this.currentIteration = 0;
        this.toolResults = [];
        this.ragToolEnabled = false; // Set by main.js based on RAG initialization
    }

    /**
     * Process user message with running agent and iterative tool calls
     */
    async processUserMessage(userMessage, options = {}) {
        console.log('🤖 Starting Running Agent with iterative RAG calls...');
        
        this.currentIteration = 0;
        this.toolResults = [];
        this.onStream = options.onStream || null;
        this.modelType = options.modelType || 'gemini-2.0-flash-exp';
        
        let agentPrompt;
        
        if (this.ragToolEnabled) {
            // RAG is initialized - agent has full tool access
            agentPrompt = `You are an expert After Effects ExtendScript assistant. You operate in a CEP extension environment.

You are helping a USER with After Effects scripting and automation tasks. Each time the USER sends a message, you have access to comprehensive After Effects documentation via RAG tool calls, but you should only use them when actually needed.

USER REQUEST: "${userMessage}"

Your main goal is to follow the USER's request completely and naturally. Only use RAG documentation tools when you genuinely need specific technical information that you're not confident about.

<communication>
Respond naturally and conversationally. For greetings, casual conversation, and general questions, just respond directly without any tool calls.
</communication>

<tool_calling>
You have RAG documentation tools at your disposal. Follow these rules:
1. **ONLY use RAG tools when you need specific After Effects API documentation that you're not confident about**
2. **NEVER use RAG tools for greetings, casual conversation, or general questions**
3. **For simple "hi", "hello", "thanks" - respond directly and warmly**
4. **For general questions about After Effects - use your existing knowledge**
5. **For specific technical questions - make focused RAG calls only if needed**
6. **Use the format: [RAG_CALL]specific technical concept[/RAG_CALL]**
7. **If you make a plan, follow it immediately - don't wait for user confirmation**
8. **Keep RAG calls minimal and focused - typically 1-3 calls maximum**
</tool_calling>

<maximize_understanding>
Analyze the user's request first:
- **Simple social interaction**: Respond directly, no tools needed
- **General After Effects question**: Use your knowledge, maybe 1 focused RAG call if uncertain
- **Specific technical implementation**: Use targeted RAG calls for specific APIs/methods you need to verify
- **Complex scripting task**: Use multiple focused RAG calls for specific technical details

Be THOROUGH in your analysis but EFFICIENT in your tool usage.
</maximize_understanding>

<making_code_changes>
When generating ExtendScript code:
1. Use proper error handling with try/catch blocks
2. Include app.beginUndoGroup() and app.endUndoGroup()
3. Return JSON results instead of alerts
4. Follow ES3 compatibility requirements
5. Use proper After Effects API methods
</making_code_changes>

Respond naturally to: "${userMessage}"

If this is a simple greeting or casual conversation, just respond warmly and ask how you can help with After Effects. If it's a technical question, decide whether you need documentation lookup or can answer with your existing knowledge.`;
        } else {
            // RAG not initialized - intelligent mode without tools
            agentPrompt = `You are a running AI agent helping with After Effects scripting questions.

USER REQUEST: "${userMessage}"

INTELLIGENT RESPONSE MODE:
- RAG documentation tools are not available
- Use your existing knowledge of After Effects ExtendScript
- Provide helpful, accurate responses based on your training
- If you need specific API documentation, mention that RAG tools would help
- Be honest about limitations when you're not certain

RESPONSE STRATEGY:
- Answer directly using your After Effects knowledge
- Provide code examples where appropriate
- Suggest best practices and common approaches
- If complex documentation lookup is needed, recommend initializing RAG system

Provide a helpful response for: "${userMessage}"`;
        }

        let agentResponse = await this.callGemini(agentPrompt);
        
        // Agent loop with iterative RAG calls (only if RAG tools are enabled)
        if (this.ragToolEnabled) {
            const maxTotalRAGCalls = 10; // Prevent runaway RAG calls
            
            while (this.currentIteration < this.maxIterations && this.toolResults.length < maxTotalRAGCalls) {
                const toolCallsFound = await this.processRAGToolCalls(agentResponse);
                
                if (toolCallsFound === 0) {
                    console.log('✅ Running Agent completed research - no more concepts to explore');
                    break;
                }
                
                if (this.toolResults.length >= maxTotalRAGCalls) {
                    console.warn(`⚠️ Reached maximum RAG calls limit (${maxTotalRAGCalls}). Stopping to prevent runaway behavior.`);
                    break;
                }
                
                agentResponse = await this.continueAgentReasoning(agentResponse);
                this.currentIteration++;
            }
        } else {
            // No RAG tools available - single response mode
            console.log('🤖 Running Agent: Single response mode (no RAG tools)');
        }
        
        const finalResponse = await this.generateFinalResponse(userMessage, agentResponse);
        
        // Calculate statistics
        const totalQueries = this.toolResults.reduce((sum, result) => {
            const queries = result.result.searchQueries || [];
            return sum + queries.length;
        }, 0);
        
        const uniqueResults = this.toolResults.reduce((sum, result) => {
            const count = result.result.resultCount || 0;
            return sum + count;
        }, 0);
        
        const allSources = this.extractAllSources();
        
        console.log(`📊 Final Statistics: ${this.toolResults.length} calls → ${totalQueries} queries → ${uniqueResults} results from ${allSources.length} sources`);
        
        return {
            success: true,
            response: finalResponse,
            ragCallsMade: this.toolResults.length,
            totalQueries: totalQueries,
            uniqueResults: uniqueResults,
            iterations: this.currentIteration,
            sources: allSources,
            toolResults: this.toolResults // Include for debugging
        };
    }

    /**
     * Process RAG tool calls in agent response
     */
    async processRAGToolCalls(agentResponse) {
        const toolCallRegex = /\[RAG_CALL\](.*?)\[\/RAG_CALL\]/gs;
        const matches = [...agentResponse.matchAll(toolCallRegex)];
        
        // Limit tool calls per iteration to prevent runaway behavior
        const maxToolCallsPerIteration = 5;
        const limitedMatches = matches.slice(0, maxToolCallsPerIteration);
        
        if (matches.length > maxToolCallsPerIteration) {
            console.warn(`⚠️ Limited RAG calls from ${matches.length} to ${maxToolCallsPerIteration} for iteration ${this.currentIteration + 1}`);
        }
        
        console.log(`🔧 Processing ${limitedMatches.length} RAG tool calls in iteration ${this.currentIteration + 1}`);
        
        for (const match of limitedMatches) {
            const concept = match[1].trim();
            console.log(`📚 RAG Concept: ${concept.substring(0, 60)}...`);
            
            // Call RAG tool (uses existing enhanced multi-query system)
            const toolResult = await this.ragTool.call(concept, this.currentContext);
            
            this.toolResults.push({
                iteration: this.currentIteration + 1,
                concept: concept,
                result: toolResult,
                timestamp: new Date().toISOString()
            });
            
            // Log statistics
            if (toolResult.success) {
                console.log(`📊 RAG Stats: ${toolResult.searchQueries?.length || 0} queries → ${toolResult.resultCount || 0} unique results`);
                console.log(`   Sources: ${toolResult.sources?.length || 0} files`);
            } else {
                console.log(`❌ RAG Call Failed: ${toolResult.error}`);
            }
            
            // Replace tool call with comprehensive results
            const replacement = toolResult.success ? 
                `\n=== COMPREHENSIVE DOCUMENTATION (${toolResult.searchQueries?.length || 0} queries, ${toolResult.resultCount} results) ===\n${toolResult.content}\n=== END DOCUMENTATION ===\n` :
                `\n=== NO DOCUMENTATION FOUND ===\nConcept: ${concept}\nError: ${toolResult.error}\n=== END ===\n`;
            
            agentResponse = agentResponse.replace(match[0], replacement);
        }
        
        return limitedMatches.length;
    }

    /**
     * Continue agent reasoning with accumulated documentation
     */
    async continueAgentReasoning(currentResponse) {
        const continuePrompt = `Based on the documentation I've gathered so far:

${currentResponse}

CONTINUE RUNNING AGENT REASONING:
- What additional concepts or topics do I need to research?
- Are there gaps in my understanding that require more specific RAG calls?
- Do I have enough information to provide a complete answer now?
- Should I drill down into specific aspects I discovered?

If you need more information, make additional [RAG_CALL]specific concept[/RAG_CALL].
If you have sufficient information, provide your analysis and prepare for final response.

Remember: Each RAG call generates multiple queries automatically and returns comprehensive results.`;

        return await this.callGemini(continuePrompt);
    }

    /**
     * Generate final comprehensive response
     */
    async generateFinalResponse(originalQuestion, agentAnalysis) {
        const finalPrompt = `Generate a comprehensive response to the user's question based on all the documentation gathered through iterative research.

ORIGINAL QUESTION: "${originalQuestion}"

AGENT ANALYSIS WITH DOCUMENTATION:
${agentAnalysis}

FINAL RESPONSE REQUIREMENTS:
- Provide complete, accurate answer using all the documentation gathered
- Include specific code examples where relevant
- Cite sources from the documentation
- Make it practical and actionable
- Format clearly with proper structure
- Show the depth of research performed

Generate the final comprehensive response now:`;

        // Use streaming if callback provided
        return await this.callGemini(finalPrompt, this.onStream);
    }

    /**
     * Extract all unique sources from tool results
     */
    extractAllSources() {
        const allSources = new Set();
        this.toolResults.forEach(result => {
            if (result.result.success && result.result.sources) {
                result.result.sources.forEach(source => {
                    // Handle both string sources and object sources
                    const sourceFile = typeof source === 'string' ? source : source.file || source;
                    allSources.add(sourceFile);
                });
            }
        });
        return Array.from(allSources);
    }

    /**
     * Call Gemini API with streaming support
     */
    async callGemini(prompt, onStream = null) {
        try {
            const model = this.modelType || 'gemini-2.0-flash-exp';
            const modelEndpoint = model === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp';
            
            if (onStream) {
                // Streaming mode
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:streamGenerateContent?key=${this.geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 4000,
                            topP: 0.8
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Gemini API error: ${response.status}`);
                }

                // Process streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedText = '';
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        
                        try {
                            const json = JSON.parse(line);
                            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                accumulatedText += text;
                                if (onStream) {
                                    onStream(text, accumulatedText);
                                }
                            }
                        } catch (e) {
                            // Some lines might not be valid JSON
                            console.warn('Stream parse error:', e);
                        }
                    }
                }

                return accumulatedText;
            } else {
                // Non-streaming mode (original)
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${this.geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 4000,
                            topP: 0.8
                        }
                    })
                });

                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }

        } catch (error) {
            console.error('❌ Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Set project context for the agent
     */
    setContext(projectContext) {
        this.currentContext = projectContext;
        console.log('🎬 Running Agent context updated');
    }

    /**
     * Reset agent state
     */
    reset() {
        this.conversationHistory = [];
        this.currentContext = '';
        this.toolResults = [];
        this.currentIteration = 0;
        this.ragTool.clearCache();
        console.log('🔄 Running Agent reset');
    }
}

/**
 * AI Agent with RAG Tool Integration (Legacy)
 * Uses RAG tool dynamically during script generation
 */

class AIAgentWithRAG {
    constructor() {
        this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        this.ragTool = new RAGDocumentationTool();
        this.conversationHistory = [];
        this.currentContext = '';
    }

    /**
     * Set project context for the agent
     */
    setContext(projectContext) {
        this.currentContext = projectContext;
        console.log('🎬 Agent context updated');
    }

    /**
     * Call Gemini with tool calling capabilities
     */
    async callGeminiWithTools(prompt, availableTools = ['rag_documentation']) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4000,
                        topP: 0.8
                    }
                })
            });

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text;

        } catch (error) {
            console.error('❌ Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Process tool calls in agent response
     */
    async processToolCalls(agentResponse) {
        const toolCallRegex = /\[RAG_CALL\](.*?)\[\/RAG_CALL\]/gs;
        let processedResponse = agentResponse;
        const toolResults = [];

        let match;
        while ((match = toolCallRegex.exec(agentResponse)) !== null) {
            const toolQuery = match[1].trim();
            console.log(`🔧 Agent calling RAG tool: ${toolQuery.substring(0, 50)}...`);
            
            // Call the RAG tool with project JSON access
            const toolResult = await this.ragTool.call(toolQuery, this.currentContext, this.projectJSON);
            toolResults.push(toolResult);

            // Replace the tool call with the result
            const replacement = toolResult.success ? 
                `\n=== DOCUMENTATION FOUND ===\n${toolResult.content}\n=== END DOCUMENTATION ===\n` :
                `\n=== NO DOCUMENTATION FOUND ===\nQuery: ${toolQuery}\nError: ${toolResult.error}\n=== END ===\n`;

            processedResponse = processedResponse.replace(match[0], replacement);
        }

        return {
            response: processedResponse,
            toolResults: toolResults
        };
    }

    /**
     * Generate script using iterative RAG tool calls
     */
    async generateScriptWithIterativeRAG(userRequest, projectContext = '', projectJSON = null) {
        this.setContext(projectContext);
        this.projectJSON = projectJSON; // Store structured project data
        
        console.log('🤖 Starting AI Agent with iterative RAG...');
        if (projectJSON) {
            console.log('📊 AI Agent has access to structured project JSON with', projectJSON.items?.length || 0, 'items');
        }

        const systemPrompt = `You are an Expert ExtendScript developer for Adobe After Effects with access to a RAG documentation tool.

RAG TOOL USAGE STRATEGY:
1. START with your existing ExtendScript knowledge as the foundation
2. Use RAG calls to SUPPLEMENT and VERIFY specific API details when uncertain
3. Call RAG for complex or uncommon operations: [RAG_CALL]specific question about AE API[/RAG_CALL]
4. COMBINE your knowledge with RAG findings for comprehensive solutions
5. Focus RAG calls on areas where you lack confidence or need verification
6. Generate PERFECT ExtendScript code using BOTH your knowledge AND documentation insights

STRATEGIC RAG CALLS (Use when you need verification or lack confidence):
- Complex layer operations → [RAG_CALL]How to work with specific layer types in After Effects[/RAG_CALL]
- Uncommon APIs → [RAG_CALL]How to use [specific API] in After Effects[/RAG_CALL]
- Text formatting details → [RAG_CALL]TextLayer font and formatting properties[/RAG_CALL]
- Effects parameters → [RAG_CALL]How to set effect properties and match names[/RAG_CALL]
- Advanced animation → [RAG_CALL]KeyframeEase and temporal properties[/RAG_CALL]
- Shape layer specifics → [RAG_CALL]Shape layer content and property access[/RAG_CALL]

BALANCE: Use your ExtendScript expertise for standard operations, RAG for verification and complex details.

CRITICAL PROJECT CONTEXT RULES:
- NEVER hardcode layer names, composition names, or specific values
- Use the actual project state provided in PROJECT CONTEXT
- If no specific layers/comps mentioned, work with activeItem and selected layers
- Generate code that works with the CURRENT project state, not imaginary layers
- If user says "add effect to layer", work with currently selected layers or prompt user to select
- Use app.project.activeItem for current composition
- Use comp.selectedLayers for selected layers when appropriate

**CRITICAL EXTENDSCRIPT API RULES:**
- NEVER use "new Color()" - Color is not a constructor in After Effects
- Use color arrays instead: [red, green, blue] with values 0-1 (e.g., [1, 0, 0] for red)
- For RGB 0-255 values, divide by 255: [255/255, 128/255, 0/255]
- NEVER use "new Point()" - use arrays instead: [x, y]
- NEVER use "new Vector()" - use arrays instead: [x, y, z]
- Use proper After Effects API methods - research via RAG calls for any object creation

**CRITICAL ERROR HANDLING RULE:**
Always structure ExtendScript code with proper error handling that returns JSON results instead of showing popups:

1. Wrap the main script logic in try-catch blocks
2. Move app.endUndoGroup() inside BOTH try and catch blocks
3. End each block with a JSON.stringify() call as the LAST statement
4. NEVER use alert() - always return JSON error messages instead

FINAL OUTPUT RULES:
- Generate ONLY pure ExtendScript code in final response
- NEVER use try/catch blocks that would show popup alerts
- Include detailed comments citing documentation sources
- Make code work with ACTUAL project state, not fictional layer names
- Follow this EXACT structure (NO return statements, NO alert popups, NO function wrappers):

**CRITICAL STRUCTURE REQUIREMENTS:**
1. NEVER wrap scripts in functions like (function() { ... })() or IIFE patterns
2. NEVER use intermediate result variables that get returned
3. NEVER add trailing statements like "result;" or "return result;"
4. app.beginUndoGroup() MUST be the FIRST line (before try block)
5. JSON.stringify() MUST be the LAST statement in each block

\`\`\`javascript
app.beginUndoGroup("Script Name");

try {
    // Get current project state
    if (!app.project) {
        throw new Error("No active project found");
    }
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        throw new Error("No active composition found");
    }
    
    // Main script logic here using REAL project elements
    
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

**FORBIDDEN PATTERNS - NEVER USE:**
❌ (function() { ... })();  // IIFE wrapper causes syntax errors
❌ var result = { ... }; result = JSON.stringify(result);  // Intermediate variables
❌ return JSON.stringify(...);  // Return statements outside functions  
❌ result;  // Trailing variable references
❌ try { ... } catch(e) { ... } result;  // Statements after try-catch

CRITICAL: Generate clean, direct ExtendScript without wrappers, intermediate variables, or trailing statements.

PROJECT CONTEXT: ${projectContext}

${projectJSON ? `
**STRUCTURED PROJECT DATA AVAILABLE:**
You have access to complete project JSON data via this.projectJSON including:
- Exact layer names, types, and properties
- Composition details (dimensions, duration, frame rate)
- Current selections and active items
- Layer hierarchy and parent-child relationships

Use this structured data to:
1. Make more targeted RAG queries (e.g., "How to animate TextLayer properties" if you see TextLayers)
2. Generate code that works with actual layer names and properties
3. Handle the specific layer types and effects present in the project
4. Reference real composition settings and layer configurations
` : ''}

USER REQUEST: ${userRequest}

IMPORTANT: 
- If you have structured project JSON, use it to make smarter RAG queries
- Generate code that works with the CURRENT project state described above
- Do not use fictional layer names like "MyLayer" or hardcoded values
- Use real layer names and properties from the project data when available

WORKFLOW:
1. Analyze the user request using your ExtendScript knowledge
2. Identify what you can implement with existing knowledge vs. what needs verification
3. Make targeted RAG calls ONLY for areas where you need clarification or verification
4. Combine your expertise with RAG insights to generate the complete solution

You have strong ExtendScript knowledge - use it! Make RAG calls strategically for verification and complex details.`;

        try {
            // Phase 1: Agent analyzes and makes RAG calls
            console.log('🔍 Phase 1: Agent analysis and MANDATORY RAG tool calls...');
            let agentResponse = await this.callGeminiWithTools(systemPrompt);
            
            // Check for RAG calls - strategic use, not mandatory
            const ragCallCount = (agentResponse.match(/\[RAG_CALL\]/g) || []).length;
            console.log(`🔧 Agent made ${ragCallCount} RAG calls in Phase 1`);
            
            // Only prompt for RAG calls if the request seems complex and no calls were made
            if (ragCallCount === 0 && (
                userRequest.toLowerCase().includes('effect') ||
                userRequest.toLowerCase().includes('complex') ||
                userRequest.toLowerCase().includes('advanced') ||
                userRequest.toLowerCase().includes('specific') ||
                userRequest.toLowerCase().includes('format') ||
                userRequest.toLowerCase().includes('property') ||
                userRequest.length > 100
            )) {
                console.log('💡 Complex request detected, suggesting RAG verification...');
                const suggestRagPrompt = `Your request seems complex and might benefit from documentation verification.

Consider making strategic RAG calls to verify specific API details for: "${userRequest}"

If you're confident in your ExtendScript knowledge for this request, proceed with code generation.
If you need verification on specific APIs or properties, make targeted RAG calls using: [RAG_CALL]specific question[/RAG_CALL]`;
                
                const ragResponse = await this.callGeminiWithTools(suggestRagPrompt);
                agentResponse = agentResponse + '\n\n' + ragResponse;
            }

            // Process any tool calls in the response
            const processed = await this.processToolCalls(agentResponse);
            agentResponse = processed.response;

            // Phase 2: Generate final script with all documentation
            console.log('🛠️ Phase 2: Generating final script...');
            const finalPrompt = `Based on all the documentation gathered above, now generate the complete ExtendScript code.

**ABSOLUTE REQUIREMENT: GENERATE PERFECT CODE**
Your generated code will be executed EXACTLY as written with NO post-processing, cleaning, or modifications. Every character you output must be syntactically correct ExtendScript that runs without errors.

**CRITICAL ERROR HANDLING RULE:**
Always structure ExtendScript code with proper error handling that returns JSON results instead of showing popups:

1. Wrap the main script logic in try-catch blocks
2. Move app.endUndoGroup() inside BOTH try and catch blocks
3. End each block with a JSON.stringify() call as the LAST statement
4. NEVER use alert() - always return JSON error messages instead

CRITICAL REQUIREMENTS:
- Use your strong ExtendScript knowledge as the primary foundation
- Supplement with any documentation findings from RAG calls above
- Generate clean, production-ready ExtendScript using standard After Effects APIs
- NEVER use try/catch blocks that would show popup alerts
- Make it a complete, runnable script
- NEVER use "return" statements outside of function definitions
- NEVER use alert() popups - errors must appear in extension interface

**IMPLEMENTATION APPROACH:**
- Apply standard ExtendScript patterns you know (layer.property(), comp.layers.addText(), etc.)
- Use common After Effects APIs confidently (TextLayer font setting, property animation, etc.)
- Incorporate any specific details from RAG documentation when available
- Focus on working, functional code that leverages your existing expertise

**CRITICAL STRUCTURE REQUIREMENTS:**
1. NEVER wrap scripts in IIFE patterns like (function() { ... })()
2. NEVER use intermediate result variables like var result = {...}; result = JSON.stringify(result);
3. NEVER add trailing statements after try-catch blocks
4. app.beginUndoGroup() MUST be the FIRST line before try block
5. JSON.stringify() calls MUST be direct, not assigned to variables
6. NO statements after the closing } of the catch block

**FORBIDDEN PATTERNS:**
❌ (function() { try { ... } catch(e) { ... } result; })();
❌ var result = {...}; result = JSON.stringify(result);
❌ try { ... } catch(e) { ... } return result;
❌ try { ... } catch(e) { ... } result;
❌ Any wrapper functions or trailing variable references

**CRITICAL EXTENDSCRIPT API RULES - ZERO TOLERANCE FOR ERRORS:**
❌ NEVER use "new Color()" - THIS WILL CAUSE RUNTIME ERROR: "Color does not have a constructor"
❌ NEVER use "new Point()" or "new Vector()" - THESE DO NOT EXIST IN AFTER EFFECTS
❌ NEVER use incorrect constructors or non-existent API methods
✅ ALWAYS use color arrays: [red, green, blue] with values 0-1 (e.g., [1, 0, 0] for red)
✅ For RGB 0-255: ALWAYS divide by 255 (e.g., [255/255, 128/255, 0/255])
✅ ALWAYS use arrays for coordinates: [x, y] or [x, y, z]
✅ ALWAYS verify API existence through RAG documentation before using ANY method or constructor

ABSOLUTELY CRITICAL - PROJECT CONTEXT COMPLIANCE:
- Work with the ACTUAL project state: ${projectContext}
- NEVER use generic, precoded layer names like "MyLayer", "Text Layer 1", etc. Use info that actually pertains to the project state.
- If the request is about layers, use selectedLayers or iterate through existing layers
- If the request is about effects, apply to selected layers or the first layer if none selected
- Generate code that will actually work when run on the current project
- No fictional examples or placeholder values

USER REQUEST: ${userRequest}

Generate the final ExtendScript that works with the REAL project state now:

${agentResponse}`;

            const finalScript = await this.callGeminiWithTools(finalPrompt);

            return {
                success: true,
                script: this.cleanGeneratedScript(finalScript),
                analysisPhase: agentResponse,
                toolResults: processed.toolResults,
                ragCalls: processed.toolResults.length,
                sources: this.extractUniqueSources(processed.toolResults)
            };

        } catch (error) {
            console.error('❌ AI Agent error:', error);
            return {
                success: false,
                error: error.message,
                ragCalls: 0,
                sources: []
            };
        }
    }

    /**
     * Extract unique documentation sources from tool results
     */
    extractUniqueSources(toolResults) {
        const sources = new Set();
        toolResults.forEach(result => {
            if (result.success && result.metadata.sources) {
                result.metadata.sources.forEach(source => sources.add(source));
            }
        });
        return Array.from(sources);
    }

    /**
     * Clean generated script code - extract only the executable ExtendScript
     */
    cleanGeneratedScript(response) {
        console.log('🧹 Cleaning script from AI response...');
        
        // First, try to find script within code blocks
        const codeBlockRegex = /```(?:javascript|jsx|js)?\s*([\s\S]*?)```/gi;
        const codeBlocks = [];
        let match;
        
        while ((match = codeBlockRegex.exec(response)) !== null) {
            codeBlocks.push(match[1].trim());
        }
        
        // If we found code blocks, use the largest one (likely the main script)
        let scriptContent = '';
        if (codeBlocks.length > 0) {
            scriptContent = codeBlocks.reduce((longest, current) => 
                current.length > longest.length ? current : longest, '');
            console.log('📄 Found script in code block');
        } else {
            // No code blocks, try to extract script from response
            scriptContent = response;
            console.log('📄 No code blocks found, processing full response');
        }
        
        // Clean up the content
        const lines = scriptContent.split('\n');
        let cleanedLines = [];
        let inScript = false;
        let scriptStarted = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines at start
            if (!scriptStarted && line === '') continue;
            
            // Skip RAG analysis text
            if (line.includes('=== DOCUMENTATION') || 
                line.includes('RAG Call:') ||
                line.includes('Agent Analysis:') ||
                line.includes('Based on') ||
                line.includes('I need to research') ||
                line.includes('Let me search') ||
                line.includes('documentation found')) {
                continue;
            }
            
            // Detect script start
            if (!inScript && (
                line.startsWith('app.beginUndoGroup') ||
                line.startsWith('try {') ||
                line.startsWith('function ') ||
                line.startsWith('var ') ||
                line.startsWith('//') ||
                line.startsWith('/*')
            )) {
                inScript = true;
                scriptStarted = true;
            }
            
            // Add script lines
            if (inScript) {
                cleanedLines.push(lines[i]); // Keep original indentation
            }
            
            // Check for script end
            if (inScript && (
                line.includes('JSON.stringify') ||
                (line.endsWith('}') && line.includes('catch')) ||
                line === '}' ||
                line.endsWith('});')
            )) {
                // Continue to capture any remaining lines of the script
                continue;
            }
        }
        
        let finalScript = cleanedLines.join('\n').trim();
        
        // Minimal cleaning - only extract script content, no code modifications
        
        // Script extracted without modifications - AI should generate correct code
        
        console.log('✅ Script cleaned, length:', finalScript.length);
        return finalScript;
    }

    /**
     * Clear conversation history and cache
     */
    reset() {
        this.conversationHistory = [];
        this.currentContext = '';
        this.ragTool.clearCache();
        console.log('🔄 AI Agent reset');
    }
}

// Export for use in main.js
window.RAGDocumentationTool = RAGDocumentationTool;
window.RunningRAGAgent = RunningRAGAgent;
window.AIAgentWithRAG = AIAgentWithRAG; 