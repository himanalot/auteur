const ClaudeService = require('./claude');
const RAGService = require('./rag');

class AutonomousContinuousService {
  constructor() {
    this.claudeService = new ClaudeService();
    this.ragService = new RAGService();
  }

  /**
   * Handle autonomous mode as one continuous conversation
   * Continues until Claude naturally stops making tool calls
   */
  async handleAutonomousChat(message, options = {}) {
    const {
      model = 'claude',
      onContentDelta = () => {},
      onToolCall = () => {},
      onToolResult = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      console.log('🤖🤖🤖 NEW AUTONOMOUS CONTINUOUS SERVICE CALLED 🤖🤖🤖');
      console.log('🤖 Starting autonomous continuous conversation');
      
      // Remove the "AUTONOMOUS AGENT MODE:" prefix so Claude doesn't see it
      const cleanMessage = message.replace('AUTONOMOUS AGENT MODE: ', '');
      
      // Start with the user's message
      let conversationHistory = [
        { role: 'user', content: cleanMessage }
      ];
      
      let allToolCalls = [];
      let continuousContent = '';
      
      // Continue until Claude stops making tool calls
      while (true) {
        console.log(`🔄 Conversation turn ${conversationHistory.length / 2 + 1}`);
        
        // Call Claude with current conversation history
        const response = await this.claudeService.streamChat('', {
          systemPrompt: this.buildSystemPrompt(),
          tools: this.claudeService.getDefaultTools(),
          conversation: conversationHistory,
          thinkingMode: 'disabled', // MUST disable thinking for tool use to avoid format errors
          onContentDelta: (delta, full) => {
            continuousContent = full;
            onContentDelta(delta, full);
          },
          onToolCall: (toolCalls) => {
            console.log(`🔧 Claude wants to make ${toolCalls.length} tool calls`);
            onToolCall(toolCalls);
          }
        });

        if (!response.success) {
          onError(new Error(response.error));
          return;
        }

        // Add Claude's response to conversation history
        const assistantContent = [];
        
        // Add text content if any
        if (response.content && response.content.trim()) {
          assistantContent.push({
            type: 'text',
            text: response.content.trim()
          });
        }

        // If Claude made tool calls, execute them and continue
        if (response.toolCalls && response.toolCalls.length > 0) {
          console.log(`🔧 Executing ${response.toolCalls.length} tool calls`);
          
          // Add tool calls to assistant message
          response.toolCalls.forEach(tc => {
            assistantContent.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: { query: tc.query }
            });
          });
          
          // Add assistant message with tool calls
          conversationHistory.push({
            role: 'assistant',
            content: assistantContent
          });

          // Execute all tool calls
          const toolResults = [];
          for (const toolCall of response.toolCalls) {
            console.log(`🔧 Executing: ${toolCall.name} - ${toolCall.query}`);
            
            const toolResult = await this.ragService.executeToolCall(toolCall);
            toolResult.id = toolCall.id;
            toolResults.push(toolResult);
            
            // Notify callback
            onToolResult(toolCall, toolResult);
            
            // Track all tool calls
            allToolCalls.push({
              toolCall,
              result: toolResult,
              timestamp: new Date().toISOString()
            });
          }

          // Add tool results to conversation
          toolResults.forEach(result => {
            conversationHistory.push({
              role: 'user',
              content: [{
                type: 'tool_result',
                tool_use_id: result.id,
                content: result.documentation || result.content || 'No content'
              }]
            });
          });

          // Continue the loop - Claude will see the tool results and decide what to do next
          
        } else {
          // No tool calls - Claude is done
          console.log('✅ Claude finished - no more tool calls needed');
          
          // Add final assistant message if there's content
          if (assistantContent.length > 0) {
            conversationHistory.push({
              role: 'assistant',
              content: assistantContent
            });
          }
          
          // Complete the conversation
          onComplete({
            success: true,
            content: response.content || continuousContent,
            toolCalls: allToolCalls,
            conversationHistory
          });
          
          break;
        }
      }
      
    } catch (error) {
      console.error('❌ Autonomous continuous error:', error);
      onError(error);
    }
  }

  /**
   * Build system prompt for autonomous mode
   */
  buildSystemPrompt() {
    return `You are an AI assistant helping with After Effects ExtendScript development.

You have access to comprehensive After Effects documentation through the search_ae_documentation tool.

For technical questions about After Effects:
1. Use the search tool when you need specific API details
2. After searching, provide a comprehensive answer based on the documentation
3. Stop when you have sufficient information to answer the user's question
4. Only make additional searches if the first search was insufficient

Respond naturally and helpfully. Use tools when needed, then provide your final answer.`;
  }
}

module.exports = AutonomousContinuousService;