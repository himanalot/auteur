const ClaudeService = require('./claude');
const GeminiService = require('./gemini');
const RAGService = require('./rag');

class AIRouterService {
  constructor() {
    this.claudeService = new ClaudeService();
    this.geminiService = new GeminiService();
    this.ragService = new RAGService();
    
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
