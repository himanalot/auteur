const fetch = require('node-fetch');
const GraphNavigatorService = require('./graph-navigator');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-sonnet-4-20250514';
    this.graphNavigator = new GraphNavigatorService();
    
    if (!this.apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is required');
    }
  }

  /**
   * Stream a conversation with Claude, including tool support
   */
  async streamChat(prompt, options = {}) {
    const {
      systemPrompt = '',
      temperature = 0.7,
      maxTokens = 8192,
      tools = [],
      conversation = [], // NEW: Accept conversation history
      thinkingMode = 'enabled', // NEW: Configurable thinking mode
      onContentDelta = () => {},
      onToolCall = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    try {
      // Build messages from conversation history or single prompt
      let messages;
      if (conversation && conversation.length > 0) {
        // If prompt is empty and we have conversation, just use conversation
        if (!prompt || prompt.trim() === '') {
          messages = [...conversation];
        } else {
          messages = [...conversation, { role: 'user', content: prompt }];
        }
      } else {
        messages = [{ role: 'user', content: prompt }];
      }
      
      const requestBody = {
        model: this.model,
        max_tokens: maxTokens,
        temperature: thinkingMode === 'enabled' ? 1 : temperature, // Must be 1 when thinking is enabled
        stream: true,
        messages: messages
      };

      // Add thinking configuration if enabled
      if (thinkingMode === 'enabled') {
        requestBody.thinking = {
          type: 'enabled',
          budget_tokens: 16384
        };
      }

      // Add system prompt if provided
      if (systemPrompt) {
        requestBody.system = systemPrompt;
        console.log(`🧠 Using custom system prompt: ${systemPrompt.substring(0, 100)}...`);
      } else {
        console.log(`🧠 No system prompt provided, using Claude default`);
      }

      // Add tools if provided
      if (tools.length > 0) {
        requestBody.tools = tools;
      }

      console.log(`🤖 Claude request: ${prompt.substring(0, 100)}...`);
      console.log(`🧠 Thinking mode: ${thinkingMode}`);

      // Build headers - interleaved thinking should always be enabled for tool use
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04,interleaved-thinking-2025-05-14',
        'anthropic-dangerous-direct-browser-access': 'true'
      };

      console.log(`🔧 Interleaved thinking header: ${headers['anthropic-beta'].includes('interleaved-thinking') ? 'ENABLED' : 'DISABLED'}`);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorData}`);
      }

      return await this._processStream(response, {
        onContentDelta,
        onToolCall,
        onComplete,
        onError
      });

    } catch (error) {
      console.error('❌ Claude service error:', error);
      onError(error);
      throw error;
    }
  }

  /**
   * Stream a conversation with tool results - CONTEXT-AWARE HYBRID APPROACH
   * Builds up context of what Claude did and what results it got
   */
  async streamWithToolResults(originalMessages, toolResults, options = {}) {
    const {
      onContentDelta = () => {},
      onComplete = () => {},
      onError = () => {},
      iterationContext = null // NEW: Pass iteration context
    } = options;

    try {
      // Build context-aware prompt that tells Claude what it already did
      const originalQuestion = originalMessages[0]?.content || 'the user\'s question';
      
      // Create conversation history showing Claude's previous actions
      let contextHistory = '';
      if (iterationContext && iterationContext.toolCallHistory.length > 0) {
        console.log(`🧠 Building context: ${iterationContext.toolCallHistory.length} previous searches`);
        contextHistory = '\n\nPREVIOUS SEARCHES YOU COMPLETED:\n';
        iterationContext.toolCallHistory.forEach((call, i) => {
          contextHistory += `\nSearch ${i + 1}: You searched for "${call.query}"\n`;
          contextHistory += `Result: Found ${call.resultCount || 0} documentation sections\n`;
          contextHistory += `Status: ${call.success ? 'SUCCESS' : 'FAILED'}\n`;
        });
        contextHistory += `\nYou have now completed ${iterationContext.toolCallHistory.length} searches.\n`;
        console.log(`🧠 Context history built: ${contextHistory.length} chars`);
      } else {
        console.log(`🧠 No previous context available`);
      }
      
      // Current search results
      const currentSearchResults = toolResults.map((result, i) => {
        if (!result.success) {
          return `CURRENT SEARCH FAILED: ${result.error}`;
        }
        
        const content = result.documentation || result.content || 'No results found';
        console.log(`🔧 Tool result ${result.id}: SUCCESS - ${content.length} chars`);
        
        return `CURRENT SEARCH RESULTS:\nQuery: ${result.query || 'Unknown query'}\nFound: ${result.resultCount || 0} sections\n\n${content}`;
      }).join('\n\n');

      // Create context-aware synthesis prompt
      const synthesisPrompt = `You are continuing a research task. Here's what you need to know:

ORIGINAL TASK: ${originalQuestion}
${contextHistory}
LATEST SEARCH RESULTS:
${currentSearchResults}

Based on ALL your searches (both previous and current), provide a comprehensive answer to the user's question. 

${iterationContext && iterationContext.toolCallHistory.length >= 2 ? 
  'Since you have completed multiple searches, synthesize all the information into a final comprehensive answer.' :
  'You may continue searching if you need more specific information, or provide an answer based on what you found.'
}

Do not repeat raw documentation. Provide practical, helpful guidance.`;

      console.log(`🔧 Hybrid approach: ${toolResults.length} results as text content`);
      console.log(`🔧 Total content length: ${synthesisPrompt.length} chars`);

      const requestBody = {
        model: this.model,
        max_tokens: 8192,
        temperature: 1, // Must be 1 when thinking is enabled
        stream: true,
        system: 'You are an After Effects ExtendScript expert. Read the documentation provided and answer the user\'s question clearly and comprehensively. Provide practical guidance with examples.',
        messages: [{
          role: 'user',
          content: synthesisPrompt
        }],
        thinking: {
          type: 'enabled',
          budget_tokens: 16384
        }
      };
      
      // Minimal logging for debugging
      console.log(`🔧 Sending synthesis request to Claude: ${requestBody.messages[0].content.length} chars`);
      
      // IMPORTANT: Do not log debug context to avoid cluttering UI response

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'tools-2024-04-04,interleaved-thinking-2025-05-14',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Claude API error: ${response.status} - ${errorData}`);
        throw new Error(`Claude API error: ${response.status} - ${errorData}`);
      }
      
      console.log(`✅ Claude API response OK: ${response.status}`);

      return await this._processStream(response, {
        onContentDelta,
        onComplete,
        onError
      });

    } catch (error) {
      console.error('❌ Claude tool results error:', error);
      onError(error);
      throw error;
    }
  }

  /**
   * Process Claude's streaming response
   */
  async _processStream(response, callbacks) {
    const {
      onContentDelta,
      onToolCall,
      onComplete,
      onError
    } = callbacks;

    let fullContent = '';
    let thinkingContent = '';
    let stopReason = null;
    let toolUses = [];
    let toolUsesByIndex = {};
    let thinkingBlocks = [];
    
    // Track interleaved thinking
    let hasSeenToolUse = false;
    let thinkingAfterToolUse = false;

    try {
      // Handle Node.js stream (node-fetch) instead of browser ReadableStream
      let buffer = '';
      let hasReceivedContent = false;
      let streamEventCount = 0;

      response.body.on('data', (chunk) => {
        buffer += chunk.toString();
        streamEventCount++;
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              console.log('🔧 Stream completed with [DONE]');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                hasReceivedContent = true;
                fullContent += parsed.delta.text;
                
                // Filter out debug content before sending to UI
                const cleanText = parsed.delta.text
                  .replace(/🔧.*?=====\n/g, '')
                  .replace(/Model: claude-sonnet.*?\n/g, '')
                  .replace(/System Prompt:.*?\n\n/g, '');
                
                if (cleanText.trim()) {
                  onContentDelta(cleanText, fullContent);
                }
                
              } else if (parsed.type === 'content_block_delta' && parsed.delta?.thinking) {
                // Handle thinking content deltas
                thinkingContent += parsed.delta.thinking;
                if (hasSeenToolUse) {
                  thinkingAfterToolUse = true;
                  console.log('🧠🔧 INTERLEAVED THINKING DETECTED: Thinking after tool use');
                }
                console.log('🧠 Thinking delta:', parsed.delta.thinking.substring(0, 100) + '...');
                
                // Update thinking block content
                const currentBlock = thinkingBlocks.find(block => block.index === parsed.index);
                if (currentBlock) {
                  currentBlock.thinking += parsed.delta.thinking;
                  currentBlock.content += parsed.delta.thinking;
                }
                
              } else if (parsed.type === 'content_block_delta' && parsed.delta?.signature) {
                // Handle signature deltas for thinking blocks
                console.log('🧠 Signature delta received');
                const currentBlock = thinkingBlocks.find(block => block.index === parsed.index);
                if (currentBlock) {
                  if (!currentBlock.signature) currentBlock.signature = '';
                  currentBlock.signature += parsed.delta.signature;
                }
                
              } else if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'thinking') {
                if (hasSeenToolUse) {
                  thinkingAfterToolUse = true;
                  console.log('🧠🔧 INTERLEAVED THINKING START: New thinking block after tool use');
                } else {
                  console.log('🧠 EXTENDED THINKING START: Initial thinking block');
                }
                thinkingBlocks.push({
                  type: 'thinking',
                  thinking: '',
                  content: '',
                  index: parsed.index,
                  signature: null
                });
                
              } else if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                hasSeenToolUse = true;
                console.log('🔧 Tool start event:', parsed.content_block);
                
                const toolUse = {
                  id: parsed.content_block.id,
                  name: parsed.content_block.name,
                  input: parsed.content_block.input || {},
                  inputJson: '',
                  contentBlockIndex: parsed.index
                };
                
                toolUses.push(toolUse);
                toolUsesByIndex[parsed.index] = toolUse;
                
              } else if (parsed.type === 'content_block_delta') {
                const currentContentBlockIndex = parsed.index;
                const currentTool = toolUsesByIndex[currentContentBlockIndex];
                
                if (currentTool && parsed.delta?.type === 'input_json_delta') {
                  if (!currentTool.inputJson) {
                    currentTool.inputJson = '';
                  }
                  
                  currentTool.inputJson += parsed.delta.partial_json;
                  
                  try {
                    const parsedInput = JSON.parse(currentTool.inputJson);
                    currentTool.input = {...currentTool.input, ...parsedInput};
                  } catch (e) {
                    // JSON not complete yet, continue accumulating
                  }
                }
                
              } else if (parsed.type === 'content_block_stop') {
                console.log('🔧 Tool completed at index:', parsed.index);
                
              } else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                stopReason = parsed.delta.stop_reason;
                console.log('🔧 Stream stop reason:', stopReason);
              } else if (parsed.type === 'message_start') {
                console.log('🔧 Message start event:', parsed.message);
              } else if (parsed.type === 'message_stop') {
                console.log('🔧 Message stop event');
              } else {
                console.log('🔧 Other stream event:', parsed.type);
              }
              
            } catch (e) {
              console.log('🔧 Failed to parse stream data:', data.substring(0, 100));
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      });

      // Wait for stream to complete
      await new Promise((resolve, reject) => {
        response.body.on('end', () => {
          console.log(`🔧 Stream ended. Events: ${streamEventCount}, Content received: ${hasReceivedContent}, Content length: ${fullContent.length}`);
          resolve();
        });
        response.body.on('error', reject);
      });

      // Handle Claude 4's refusal stop reason
      if (stopReason === 'refusal') {
        throw new Error('Claude declined to generate content for safety reasons');
      }

      // Convert tool uses to our format and notify callback
      const toolCalls = toolUses.map(tool => ({
        name: tool.name,
        query: tool.input.query || '',
        id: tool.id,
        input: tool.input // Pass through all input parameters for graph tools
      }));

      if (toolCalls.length > 0) {
        onToolCall(toolCalls);
      }

      console.log(`✅ Claude response complete: ${fullContent.length} chars, ${toolCalls.length} tools`);
      
      // Report on thinking behavior
      if (thinkingContent.length > 0) {
        if (thinkingAfterToolUse) {
          console.log('🧠🔧 INTERLEAVED THINKING CONFIRMED: Thinking blocks appeared after tool use');
        } else if (hasSeenToolUse) {
          console.log('🧠 EXTENDED THINKING ONLY: Thinking only before tool use');
        } else {
          console.log('🧠 THINKING WITHOUT TOOLS: Extended thinking for non-tool response');
        }
      } else {
        console.log('🧠 NO THINKING DETECTED: Standard response mode');
      }
      
      // Check for empty content and provide fallback
      let finalContent = fullContent.trim();
      if (!finalContent && stopReason !== 'tool_use') {
        console.error(`❌ CRITICAL: Claude returned empty content! Stop reason: ${stopReason}`);
        finalContent = "I searched the documentation but encountered an issue processing the results. The search found relevant information but there was a problem generating the response. Please try asking your question again or rephrase it.";
      }
      
      const result = {
        success: true,
        content: finalContent,
        toolCalls: toolCalls,
        finalAnswer: toolCalls.length === 0 ? finalContent : null,
        stopReason: stopReason,
        thinking: thinkingContent.trim() || null,
        thinkingBlocks: thinkingBlocks
      };

      onComplete(result);
      return result;

    } catch (error) {
      console.error('❌ Claude stream processing error:', error);
      onError(error);
      throw error;
    }
  }

  /**
   * Get the default tools for After Effects documentation
   */
  getDefaultTools() {
    return [
      {
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
      },
      {
        name: 'exa_search',
        description: 'ESSENTIAL web search tool for finding current ExtendScript examples, tutorials, community solutions, and practical implementations. Use this frequently alongside documentation searches to get real-world code examples, troubleshooting tips, and modern best practices. This tool finds up-to-date information that complements the local documentation.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query for web information about ExtendScript or After Effects. Should be specific like "After Effects ExtendScript text layer animation tutorial" or "ExtendScript property animation examples".'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'analyze_video',
        description: 'Analyze video content using advanced AI vision models (Gemini 2.0/2.5). Use this tool when users ask questions about video content, need to understand what is happening in a video, want object detection, scene descriptions, motion analysis, or any visual understanding task. The tool can analyze pre-uploaded videos by their file ID.',
        input_schema: {
          type: 'object',
          properties: {
            file_id: {
              type: 'string',
              description: 'The Gemini file ID of the uploaded video (format: files/xxxxx). This is typically provided by the user or from a previous upload.'
            },
            question: {
              type: 'string',
              description: 'The specific question to ask about the video content. Be detailed and specific about what information you need from the video.'
            },
            model: {
              type: 'string',
              description: 'The Gemini model to use for video analysis. Options: "gemini-2.0-flash" (fastest), "gemini-2.5-flash" (balanced), "gemini-2.5-pro" (most capable). Default is "gemini-2.0-flash".',
              enum: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro']
            }
          },
          required: ['file_id', 'question']
        }
      },
      ...this.graphNavigator.getGraphTools()
    ];
  }

  /**
   * Get system prompt for After Effects assistance
   */
  getSystemPrompt(userPrompt) {
    return `You are an expert After Effects ExtendScript assistant. ${userPrompt}

Your responses are displayed directly to the user in a chat interface. Provide helpful, detailed answers with specific examples and practical guidance when available.

When using tools:
1. Provide brief updates between tool calls (1-2 sentences)
2. Synthesize information from documentation searches
3. Give clear, practical answers with code examples when relevant
4. Focus on being helpful and comprehensive`;
  }
}

module.exports = ClaudeService;