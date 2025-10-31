const fetch = require('node-fetch');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }

  /**
   * Stream a conversation with Gemini
   */
  async streamChat(prompt, options = {}) {
    const {
      model = 'gemini-2.0-flash-exp',
      temperature = 0.7,
      maxTokens = 8192,
      onContentDelta = () => {},
      onToolCall = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      const modelName = model === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp';
      
      const systemInstruction = this.getSystemPrompt(prompt);

      console.log(`🤖 Gemini request: ${prompt.substring(0, 100)}...`);

      const response = await fetch(`${this.baseURL}/${modelName}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemInstruction }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
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

      // Simulate streaming by sending content in chunks
      const chunkSize = 10;
      let fullContent = '';
      
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        fullContent += chunk;
        onContentDelta(chunk, fullContent);
        
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Parse tool calls from response
      const toolCalls = this.parseToolCalls(content);
      
      if (toolCalls.length > 0) {
        onToolCall(toolCalls);
      }

      console.log(`✅ Gemini response complete: ${content.length} chars, ${toolCalls.length} tools`);

      const result = {
        success: true,
        content: content.trim(),
        toolCalls: toolCalls,
        finalAnswer: toolCalls.length === 0 ? content.trim() : null
      };

      onComplete(result);
      return result;

    } catch (error) {
      console.error('❌ Gemini service error:', error);
      onError(error);
      throw error;
    }
  }

  /**
   * Generate final response using Gemini
   */
  async generateFinalResponse(prompt, options = {}) {
    const {
      model = 'gemini-2.0-flash-exp',
      temperature = 0.7,
      maxTokens = 8192,
      onContentDelta = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      const modelName = model === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp';
      
      console.log(`🤖 Gemini final response: ${prompt.substring(0, 100)}...`);

      const response = await fetch(`${this.baseURL}/${modelName}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
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

      // Simulate streaming by sending content in chunks
      const chunkSize = 15;
      let fullContent = '';
      
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        fullContent += chunk;
        onContentDelta(chunk, fullContent);
        
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      console.log(`✅ Gemini final response complete: ${content.length} chars`);

      const result = {
        success: true,
        content: content.trim()
      };

      onComplete(result);
      return result;

    } catch (error) {
      console.error('❌ Gemini final response error:', error);
      onError(error);
      throw error;
    }
  }

  /**
   * Parse tool calls from Gemini response
   */
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
                query: query,
                id: `gemini_tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              });
            }
            break;
          }
        }
      }
    }
    
    return toolCalls;
  }

  /**
   * Get system prompt for After Effects assistance
   */
  getSystemPrompt(userPrompt) {
    return `${userPrompt}

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
  }
}

module.exports = GeminiService;