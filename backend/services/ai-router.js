const ClaudeService = require('./claude');
const GeminiService = require('./gemini');
const GeminiVideoService = require('./gemini-video');
const RAGService = require('./rag');
const AutonomousContinuousService = require('./autonomous-continuous');

class AIRouterService {
  constructor() {
    this.claudeService = new ClaudeService();
    this.geminiService = new GeminiService();
    this.geminiVideoService = new GeminiVideoService();
    this.ragService = new RAGService();
    this.autonomousService = new AutonomousContinuousService();
    
    this.maxIterations = 1;
    this.maxToolCallsPerIteration = 5;
    this.maxTotalToolCalls = 10;
    this._shouldContinueAutonomous = false;
  }

  /**
   * Handle autonomous chat as one continuous conversation flow
   * Continues until Claude stops making tool calls naturally
   */
  async handleAutonomousChat(message, options = {}) {
    const {
      model = 'claude',
      conversation = [],
      onContentDelta = () => {},
      onToolCall = () => {},
      onToolResult = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      console.log(`🤖 Autonomous Chat: Using simple chat pattern (autonomous = simple for now)`);
      
      // For now, just use the working simple chat pattern
      // The only difference is that autonomous "could" continue if Claude makes more tool calls
      // But for simplicity, let's start with just the working pattern
      return await this.handleSimpleChat(message, options);
      
    } catch (error) {
      console.error('❌ Autonomous Chat error:', error);
      onError(error);
    }
  }

  /**
   * Handle simple (non-autonomous) chat with the original working pattern
   */
  async handleSimpleChat(message, options = {}) {
    const {
      model = 'claude',
      conversation = [],
      onContentDelta = () => {},
      onToolCall = () => {},
      onToolResult = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      console.log(`📝 Simple Chat: Starting with ${model}`);
      
      // Build conversation context
      const conversationPrompt = this.buildConversation(message, [], 1);
      
      let toolCallsData = [];
      let fullResponse = '';
      
      // Single iteration for simple chat
      const decision = await this.callAIWithTools(conversationPrompt, {
        model,
        onContentDelta: (delta, full) => {
          fullResponse = full;
          onContentDelta(delta, full);
        },
        onToolCall: (toolCalls) => {
          onToolCall(toolCalls);
        }
      });
      
      if (!decision.success) {
        onError(new Error(decision.error));
        return;
      }
      
      // If there's content but no tool calls, we're done
      if (decision.content && !decision.toolCalls?.length) {
        onComplete({
          success: true,
          content: decision.content,
          toolCalls: []
        });
        return;
      }
      
      // Execute tool calls if any
      if (decision.toolCalls && decision.toolCalls.length > 0) {
        const toolResults = [];
        
        for (let i = 0; i < Math.min(decision.toolCalls.length, 5); i++) {
          const toolCall = decision.toolCalls[i];
          console.log(`📝 Simple Chat: Executing tool: ${toolCall.name} with query: ${toolCall.query}`);
          
          // Execute tool call
          const toolResult = await this.ragService.executeToolCall(toolCall);
          console.log('📝 Simple Chat: Tool result:', {
            success: toolResult.success,
            resultCount: toolResult.resultCount,
            error: toolResult.error
          });
          
          // Add ID from AI's tool call for proper response
          toolResult.id = toolCall.id;
          toolResults.push(toolResult);
          
          // Notify callback
          onToolResult(toolCall, toolResult);
          
          // Add to tool calls data
          toolCallsData.push({
            iteration: 1,
            toolCall,
            result: toolResult,
            timestamp: new Date().toISOString()
          });
        }
        
        // Process tool results (original working pattern)
        if (toolResults.length > 0) {
          console.log('📝 Simple Chat: Processing tool results...');
          
          // Build message history for Claude tool results call
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
            content: message
          }, {
            role: 'assistant',
            content: assistantContent
          }];
          
          const followUpResult = await this.claudeService.streamWithToolResults(originalMessages, toolResults, {
            onContentDelta: (delta, full) => {
              // Combine with existing content if needed
              const displayContent = fullResponse.trim() ? 
                fullResponse + '\n\n' + full : 
                full;
              onContentDelta(delta, displayContent);
            },
            onComplete: (result) => {
              const finalContent = fullResponse.trim() ? 
                fullResponse + '\n\n' + result.content : 
                result.content;
              
              onComplete({
                success: true,
                content: finalContent,
                toolCalls: toolCallsData
              });
            },
            onError: onError
          });
          
          return; // Claude handles the completion
        }
      }
      
      // Fallback completion
      onComplete({
        success: true,
        content: fullResponse || 'I completed the task but did not generate a specific response.',
        toolCalls: toolCallsData
      });
      
    } catch (error) {
      console.error('❌ Simple Chat error:', error);
      onError(error);
    }
  }

  /**
   * Main entry point for chat conversations
   */
  /**
   * Main entry point for chat conversations
   */
  async streamChat(message, options = {}) {
    const {
      model = 'claude',
      conversation = [],
      onContentDelta = () => {},
      onToolCall = () => {},
      onToolResult = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      console.log(`🎯 AI Router: Starting chat with ${model}`);
      console.log(`🎯 AI Router: Message preview: "${message.substring(0, 100)}..."`);
      
      // Check if this is an autonomous agent request
      const isAutonomousMode = message.includes('AUTONOMOUS AGENT MODE:');
      console.log(`🎯 AI Router: Contains 'AUTONOMOUS AGENT MODE:': ${isAutonomousMode}`);
      
      if (isAutonomousMode) {
        console.log('🤖 AUTONOMOUS MODE DETECTED - Using new continuous autonomous service');
        return await this.autonomousService.handleAutonomousChat(message, options);
      } else {
        console.log('📝 Regular chat mode detected - using simple chat handler');
        return await this.handleSimpleChat(message, options);
      }
      
    } catch (error) {
      console.error('❌ AI Router error:', error);
      onError(error);
    }
  }

  async callAIWithTools(prompt, options = {}) {
    const { model = 'claude', onContentDelta, onToolCall } = options;
    
    if (model === 'claude') {
      const tools = this.claudeService.getDefaultTools();
      const systemPrompt = this.claudeService.getSystemPrompt(prompt);
      
      return await this.claudeService.streamChat(prompt, {
        systemPrompt,
        tools,
        thinkingMode: 'disabled', // Disable thinking for tool use to avoid format issues
        onContentDelta,
        onToolCall,
        onComplete: (result) => result,
        onError: (error) => ({ success: false, error: error.message })
      });
    } else {
      // Gemini or other models
      return await this.geminiService.streamChat(prompt, {
        model: model === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp',
        onContentDelta,
        onToolCall,
        onComplete: (result) => result,
        onError: (error) => ({ success: false, error: error.message })
      });
    }
  }

  /**
   * Call AI for final response generation
   */
  async callAIFinal(prompt, model = 'claude', options = {}) {
    const { onContentDelta, onComplete, onError } = options;
    
    if (model === 'claude') {
      return await this.claudeService.streamChat(prompt, {
        systemPrompt: '',
        tools: [],
        onContentDelta,
        onComplete,
        onError
      });
    } else {
      return await this.geminiService.generateFinalResponse(prompt, {
        model: model === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp',
        onContentDelta,
        onComplete,
        onError
      });
    }
  }

  /**
   * Build conversation from history array for autonomous mode
   */
  buildConversationFromHistory(conversationHistory) {
    return conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Build conversation context
   */
  buildConversation(userMessage, toolResults = [], iteration = 1) {
    // Check if this is autonomous agent mode
    const isAutonomousMode = userMessage.includes('AUTONOMOUS AGENT MODE:');
    
    const baseSystemPrompt = `You are Cursor, an AI assistant paired with a human software engineer. You are helping them with After Effects ExtendScript development.

You have access to a comprehensive After Effects documentation search tool that can find specific API information, code examples, and technical details.`;

    const autonomousInstructions = `

<important>
You should proactively use the documentation search tool for most After Effects technical questions to provide accurate, detailed information with specific API details and code examples.

For simple questions like "hi", "hello", "thanks", respond directly without using tools.
For technical questions about After Effects, including specific terms, API names, effect names, property names (like "adbe glo2"), layers, effects, compositions, scripting, etc., you should search the documentation when you need specific details.

Default approach for technical questions:
- Search documentation when users mention specific After Effects terms or concepts that need verification
- Provide specific API details, code examples, and accurate information from the documentation
- If you can't find something after searching, then mention it wasn't found in the documentation
</important>`;

    const toolInstructions = `

<tool_instructions>
Use the search_ae_documentation tool for After Effects technical questions when you need specific details. Examples:
- User asks about "layers" → Search for layer creation, layer properties, layer types
- User asks about "effects" → Search for adding effects, effect properties, effect removal  
- User asks about "adbe glo2" → Search for "adbe glo2", "glow effect", "effect match names"
- User asks about specific terms → Search for that exact term and related concepts
- User asks for help with After Effects scripting → Search for relevant APIs and examples

When using the search_ae_documentation tool:
1. Search strategically - only when you need specific API details you don't already have
2. The search results provide you with documentation content that the user cannot see - use this information to give comprehensive answers
3. After each search, IMMEDIATELY incorporate the results into your response based on the documentation content you receive
4. The user only sees your final response, not the search results themselves, so synthesize the information clearly
5. STOP after your first search if it provides sufficient information to answer the question
6. Only make additional searches if the first search was completely insufficient
7. Prioritize quality synthesis of results over quantity of searches
</tool_instructions>`;

    const systemPrompt = baseSystemPrompt + autonomousInstructions + toolInstructions + `

Current message: ${userMessage}

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

  /**
   * Build final conversation with tool results
   */
  buildFinalConversation(userMessage, toolResults = []) {
    return `You are an expert After Effects ExtendScript assistant. Based on the documentation searches performed, provide a comprehensive and helpful response.

User's question: ${userMessage}

Documentation found:
${toolResults.map(tr => {
  return `
Query: ${tr.toolCall.query}
${tr.result && tr.result.success ? `Documentation: ${tr.result.documentation || tr.result.content || 'No content available'}` : 'No results found'}
`;
}).join('\n')}

Provide a complete, helpful response based on the documentation found. Include specific code examples and API references when relevant.`;
  }

  /**
   * Handle video chat with uploaded videos
   */
  async handleVideoChat(message, options = {}) {
    const {
      videoFiles = [],
      model = 'gemini-2.5-flash',
      conversation = [],
      onContentDelta = () => {},
      onToolCall = () => {},
      onToolResult = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      console.log(`🎥 Video Chat: Starting with ${videoFiles.length} videos using ${model}`);
      
      // Use GeminiVideoService for video understanding with tool support
      const result = await this.geminiVideoService.chatWithVideo(
        message, 
        videoFiles, 
        model, 
        conversation,
        this.ragService // Pass RAG service for tool calling
      );

      if (!result.success) {
        throw new Error(result.error || 'Video chat failed');
      }

      // Simulate streaming for consistency with other methods
      const content = result.content;
      const chunkSize = 20;
      let fullContent = '';
      
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        fullContent += chunk;
        onContentDelta(chunk, fullContent);
        
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      console.log(`✅ Video Chat complete: ${content.length} chars`);

      const finalResult = {
        success: true,
        content: content,
        model: model,
        usage: result.usage || {},
        finishReason: result.finishReason || 'stop'
      };

      onComplete(finalResult);
      return finalResult;

    } catch (error) {
      console.error('❌ Video Chat error:', error);
      onError(error);
      throw error;
    }
  }

  /**
   * Handle video upload
   */
  async handleVideoUpload(filePath, originalName, mimeType, frameRate = 1) {
    try {
      console.log('📹 AI Router: Uploading video through GeminiVideoService');
      
      const result = await this.geminiVideoService.uploadVideo(
        filePath, 
        originalName, 
        mimeType, 
        frameRate
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Video upload failed');
      }
      
      console.log('✅ AI Router: Video uploaded successfully:', result.fileId);
      return result;
      
    } catch (error) {
      console.error('❌ AI Router: Video upload error:', error);
      throw error;
    }
  }

  /**
   * Check video file state
   */
  async checkVideoState(fileId) {
    try {
      return await this.geminiVideoService.checkFileState(fileId);
    } catch (error) {
      console.error('❌ AI Router: Video state check error:', error);
      throw error;
    }
  }

  /**
   * Delete video file
   */
  async deleteVideo(fileId) {
    try {
      return await this.geminiVideoService.deleteFile(fileId);
    } catch (error) {
      console.error('❌ AI Router: Video delete error:', error);
      throw error;
    }
  }

  /**
   * Get supported video models
   */
  getSupportedVideoModels() {
    return this.geminiVideoService.getSupportedModels();
  }

  /**
   * Test all services
   */
  async testServices() {
    const results = {
      rag: await this.ragService.testConnection(),
      claude: { success: !!process.env.CLAUDE_API_KEY },
      gemini: { success: !!process.env.GEMINI_API_KEY }
    };
    
    return results;
  }
}

module.exports = AIRouterService;