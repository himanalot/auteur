  async callAIWithTools(prompt, options = {}) {
    const { model = 'claude', onContentDelta, onToolCall } = options;
    
    if (model === 'claude') {
      const tools = this.claudeService.getDefaultTools();
      const systemPrompt = this.claudeService.getSystemPrompt(prompt);
      
      return await this.claudeService.streamChat(prompt, {
        systemPrompt,
        tools,
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

    const autonomousInstructions = isAutonomousMode ? `

You are Roo, a knowledgeable technical assistant focused on answering questions about After Effects ExtendScript development. 

You can analyze code, explain concepts, and access comprehensive After Effects documentation through search tools. Always answer the user's questions thoroughly using the available documentation search tools when you need specific information.

Use the search_ae_documentation tool when you need to find specific API details, code examples, or technical information about After Effects scripting. After searching, provide comprehensive answers based on what you've found.

` : `

<important>
You should proactively use the documentation search tool for most After Effects technical questions to provide accurate, detailed information with specific API details and code examples.

For simple questions like "hi", "hello", "thanks", respond directly without using tools.
For technical questions about After Effects, including specific terms, API names, effect names, property names (like "adbe glo2"), layers, effects, compositions, scripting, etc., you should search the documentation when you need specific details.

Default approach for technical questions:
- Search documentation when users mention specific After Effects terms or concepts that need verification
- Search multiple times with different queries to ensure comprehensive coverage
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
5. Focus on providing comprehensive answers using the search results, not on searching more
6. Stop searching once you have sufficient information to answer the user's question
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