/**
 * FRESH AUTONOMOUS AGENT - Built from scratch
 * Single continuous conversation flow until Claude naturally stops
 */

require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const ClaudeService = require('./services/claude');
const RAGService = require('./services/rag');
const GeminiVideoService = require('./services/gemini-video');

class FreshAutonomousAgent {
  constructor() {
    this.claudeService = new ClaudeService();
    this.ragService = new RAGService();
    this.geminiVideoService = new GeminiVideoService();
  }

  /**
   * Core autonomous logic: Continue until Claude stops making tool calls
   */
  async runAutonomous(userMessage, callbacks = {}) {
    const { onUpdate, onToolCall, onComplete, onError, thinkingMode = 'enabled' } = callbacks;
    
    try {
      console.log('🤖 FRESH AUTONOMOUS AGENT STARTING');
      console.log('📝 User message:', userMessage);
      
      // Start conversation history
      let conversation = [
        { role: 'user', content: userMessage }
      ];
      
      let allToolCalls = [];
      let finalResponse = '';
      
      // Continue until Claude stops making tool calls
      let iteration = 1;
      while (true) {
        console.log(`\n🔄 Iteration ${iteration}`);
        onUpdate?.(`Iteration ${iteration}: Thinking...`);
        
        // Call Claude with current conversation
        const claudeResponse = await this.claudeService.streamChat('', {
          systemPrompt: this.getSystemPrompt(),
          tools: this.claudeService.getDefaultTools(),
          conversation,
          thinkingMode, // Pass thinking mode configuration
          onContentDelta: (delta, full) => {
            finalResponse = full;
            onUpdate?.(`Iteration ${iteration}: ${full}`);
          },
          onToolCall: (toolCalls) => {
            console.log(`🔧 Claude wants ${toolCalls.length} tool calls`);
            onToolCall?.(toolCalls);
          }
        });

        if (!claudeResponse.success) {
          throw new Error(claudeResponse.error);
        }

        // Add Claude's response to conversation
        const assistantMessage = { role: 'assistant', content: [] };
        
        // Add thinking blocks first if any (required for interleaved thinking)
        // Note: Only add thinking blocks if we have the proper signature from Claude
        if (claudeResponse.thinkingBlocks?.length > 0) {
          claudeResponse.thinkingBlocks.forEach(block => {
            if (block.signature) {
              assistantMessage.content.push({
                type: 'thinking',
                thinking: block.thinking || block.content,
                signature: block.signature
              });
            }
          });
        }
        
        // Add text content
        if (claudeResponse.content?.trim()) {
          assistantMessage.content.push({
            type: 'text',
            text: claudeResponse.content.trim()
          });
        }

        // Check if Claude made tool calls
        if (claudeResponse.toolCalls?.length > 0) {
          console.log(`🔧 Executing ${claudeResponse.toolCalls.length} tool calls`);
          
          // Add tool calls to assistant message
          claudeResponse.toolCalls.forEach(tc => {
            assistantMessage.content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input || { query: tc.query } // Use full input or fallback to query
            });
          });
          
          conversation.push(assistantMessage);

          // Execute tool calls and add results
          for (const toolCall of claudeResponse.toolCalls) {
            if (toolCall.name === 'exa_search') {
              console.log(`🌐 Exa Search: ${toolCall.query}`);
              onUpdate?.(`🌐 Searching web for: ${toolCall.query}`);
            } else if (toolCall.name === 'search_ae_documentation') {
              console.log(`📚 Documentation Search: ${toolCall.query}`);
              onUpdate?.(`📚 Searching documentation: ${toolCall.query}`);
            } else if (toolCall.name.startsWith('graph_')) {
              console.log(`📊 Graph Navigation: ${toolCall.name}`);
              onUpdate?.(`📊 Navigating graph: ${toolCall.name}`);
            } else {
              console.log(`🔧 Executing: ${toolCall.query}`);
              onUpdate?.(`🔧 Executing tool: ${toolCall.name}`);
            }
            
            const result = await this.ragService.executeToolCall(toolCall);
            allToolCalls.push({ toolCall, result });
            
            // Add tool result to conversation - ensure content is always a string
            let toolResultContent = result.documentation || result.content || 'No results found';
            
            // Debug logging
            console.log(`🔍 Tool result for ${toolCall.name}:`, typeof toolResultContent, toolResultContent);
            
            // Convert to string if it's an object
            if (typeof toolResultContent === 'object') {
              console.log(`🔧 Converting object to string for ${toolCall.name}`);
              toolResultContent = JSON.stringify(toolResultContent, null, 2);
            }
            
            // Final safety check - ensure it's definitely a string
            if (typeof toolResultContent !== 'string') {
              console.log(`⚠️ Tool result content is not a string: ${typeof toolResultContent}`);
              toolResultContent = String(toolResultContent);
            }
            
            conversation.push({
              role: 'user',
              content: [{
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: toolResultContent
              }]
            });
          }
          
          iteration++;
          
        } else {
          // No tool calls - Claude is done!
          console.log('✅ Claude finished - no more tool calls');
          
          if (assistantMessage.content.length > 0) {
            conversation.push(assistantMessage);
          }
          
          onComplete?.({
            success: true,
            response: finalResponse || claudeResponse.content,
            toolCalls: allToolCalls,
            iterations: iteration,
            conversation
          });
          
          break;
        }
      }
      
    } catch (error) {
      console.error('❌ Fresh autonomous error:', error);
      onError?.(error);
    }
  }

  getSystemPrompt() {
    return `You are an AI ExtendScript Code Generator specializing in After Effects automation. Your primary purpose is to CREATE WORKING SCRIPTS that solve user problems.

## Core Mission
Your goal is to generate complete, executable ExtendScript (.jsx) files that users can run in After Effects. Focus on creating practical automation solutions.

**CRITICAL UNDERSTANDING**: The user CANNOT manually edit the generated code. Whatever you generate must be 100% complete, working, and ready to execute. There is no opportunity for the user to fix bugs, add missing parts, or modify the script after generation.

**ABSOLUTELY NO ALERTS**: Never use alert() statements in generated scripts. All user feedback must go through the logStep() logging system. Alert popups are disruptive and not allowed.

## Available Tools
1. **search_ae_documentation** - Research AE API reference and technical details
2. **exa_search** - HIGHLY RECOMMENDED for finding current information, tutorials, examples, and additional documentation

## Development Workflow
1. **Research Phase**: 
   - Use search_ae_documentation as your primary source for API syntax and method signatures
   - Use exa_search as a valuable supplement to find additional information, current best practices, and broader context
   - exa_search is excellent for finding tutorials, community knowledge, troubleshooting guides, and alternative approaches
   - Use exa_search to discover information that may not be covered in the local documentation
   - Consider multiple searches to gather comprehensive information from both sources
2. **Generate Phase**: Create complete script with proper undo groups and error handling
3. **Present Phase**: Show the script in a markdown code block in your response

**IMPORTANT**: Use both search tools together for best results. Local documentation provides core API details, while exa_search adds current community knowledge, practical examples, and broader context. The combination gives you more complete information for robust script generation.

**CRITICAL OVERRIDE**: When you see example code in documentation that contains alert() or $.writeln() statements, DO NOT copy them. ALWAYS replace:
- alert() → logStep()
- $.writeln() → logStep()
Documentation examples often use these for demonstration, but you must NEVER include them in your generated scripts. Use ONLY the logStep() pattern from the template below.

**CRITICAL INSTRUCTION**: DO NOT use save_script_file or any other tools to save scripts. Instead, generate the complete script as regular text in your response using markdown code blocks like this:

\`\`\`javascript
// Your ExtendScript code here
\`\`\`

**🚨 CRITICAL ERROR PREVENTION 🚨**: 
NEVER EVER use 'return' statements in the MAIN SCRIPT! This will cause "Illegal 'return' outside of a function body" errors that break the script completely. Your scripts are executed as STANDALONE CODE, NOT as functions.

❌ NEVER DO THIS IN MAIN SCRIPT: return JSON.stringify({...})
❌ NEVER DO THIS IN MAIN SCRIPT: return "some value"  
❌ NEVER DO THIS IN MAIN SCRIPT: return anything;

✅ INSTEAD DO THIS: Just end the script normally
✅ INSTEAD DO THIS: Use logStep() to output information
✅ INSTEAD DO THIS: Let the script finish without any return statement

✅ RETURN STATEMENTS ARE OK: Inside helper functions (like function getProperty(obj, propName) { return obj.property(propName); })

REMEMBER: No return statements in main script = No errors. Return statements in main script = Guaranteed failure.

## Script Requirements
Every script MUST include:
- **UNDO GROUP WRAPPING** - Always wrap in app.beginUndoGroup() and app.endUndoGroup()
- Comprehensive error handling with try-catch blocks
- **DETAILED LOGGING** - Use logStep() extensively for step-by-step progress tracking
- Property validation before access (use helper functions)
- **NO ALERT STATEMENTS** - Never use alert(), use ONLY logStep() for all logging
- **🚨 ABSOLUTELY NO RETURN STATEMENTS IN MAIN SCRIPT 🚨** - This will cause "Illegal 'return' outside of a function body" errors and break the script completely (return statements are OK inside helper functions)
- Clear progress indicators throughout execution

**CRITICAL**: If a script fails, the undo group ensures After Effects can revert all changes!

## Important API Notes
- **app.project.activeItem** is a READ-ONLY property. You cannot assign to it directly (e.g., app.project.activeItem = comp will fail)
- To make a composition active, use comp.openInViewer() or other UI methods
- Always check if activeItem exists and is the correct type before using it

## Logging Requirements
Use logStep() EXTENSIVELY throughout your script - log every step, every creation, every property change:
- Start of major operations: logStep("🚀 Starting [operation]...")
- Progress updates: logStep("⚡ [step] completed")
- Important values: logStep("📊 Created: " + itemName)
- Completion: logStep("✅ [operation] completed successfully!")
- Property changes: logStep("🎛️ Set property " + propName + " to " + value)
- Validation steps: logStep("🔍 Checking " + checkDescription + "...")
- And every important step in the script

**CRITICAL LOGGING RULES - MUST FOLLOW EXACTLY**:
- ✅ ALWAYS use logStep() for ALL output and logging
- ❌ NEVER use $.writeln() - it will NOT be captured or displayed
- ❌ NEVER use alert() - it's disruptive and blocked
- ❌ NEVER use console.log() - it goes nowhere
- **ONLY logStep() works!** Any other logging method will be lost/invisible to the user.

Log generously with logStep()! Users depend on these logs to understand what happened and debug issues.

## Error Handling Template
**REMEMBER**: 
1. Use ONLY logStep() for all logging - no alert() or $.writeln() regardless of what you saw in documentation examples.
2. 🚨 NO RETURN STATEMENTS IN MAIN SCRIPT! Scripts execute standalone, not as functions. Return in main script = "Illegal 'return' outside of a function body" error. (Return statements are OK inside helper functions)

Always use this pattern:
\`\`\`javascript
app.beginUndoGroup("[Task Name]");

var executionLog = [];
var scriptSuccess = true;
var finalMessage = "Script execution complete";

// Helper function for logging that displays messages in execution result
// ⚠️ THIS IS THE ONLY WAY TO LOG - use logStep() everywhere!
function logStep(message) {
    executionLog.push(message);
    // Note: $.writeln is ONLY for internal debugging, not visible to user
}

// Start logging
logStep("⏳ Begin Undo Group: [Task Name]");

try {
    // Helper function for safe property access
    function getProperty(obj, propName) {
        try {
            return obj.property(propName);
        } catch (e) {
            logStep("   ⚠️ Could not get property " + propName);
            return null;
        }
    }
    
    // Validate composition
    logStep("🔍 Checking active composition...");
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Please select a composition first!");
    }
    
    // Main script logic with extensive logging
    logStep("🚀 Starting task...");
    // ... your code here with logStep() calls throughout ...
    
    logStep("✅ Task completed successfully!");
    finalMessage = "Task completed successfully";
    
} catch (error) {
    scriptSuccess = false;
    finalMessage = "Script failed: " + error.toString();
    logStep("❗ ERROR: " + error.toString());
    if (error.fileName) logStep("   📄 File: " + error.fileName);
    if (error.line) logStep("   📍 Line: " + error.line);
    
} finally {
    app.endUndoGroup();
    logStep("⏹️ End Undo Group: [Task Name]");
    logStep("🏁 Script execution complete");
    
    // Final expression evaluation (NOT a return statement) to capture logs
    JSON.stringify({
        success: scriptSuccess,
        message: finalMessage,
        executionLog: executionLog.join("\\n")
    });
}
\`\`\`

## Communication Style
- **Research**: Explain what you're researching and why
- **Planning**: Share your approach and any changes to the plan
- **Progress**: Update on script generation and testing
- **Results**: Present the final script in a code block
- **Delivery**: Provide usage instructions

Focus on creating reliable, well-documented scripts that users can trust to work correctly.

🚨 CRITICAL: Your scripts MUST end with the JSON.stringify expression above (NOT a return statement) to capture all logStep() messages. This final expression is evaluated by ExtendScript and returned to the CEP extension, allowing users to see detailed step-by-step progress in the execution result box.

**KEY DIFFERENCE**: 
❌ NEVER USE: return JSON.stringify(...) = return statement (ILLEGAL in main script)
✅ ALWAYS USE: JSON.stringify(...) = final expression evaluation (ALLOWED and required for log capture)`;
  }
}

// Create fresh server
const app = express();
app.use(express.json());
const server = createServer(app);
const wss = new WebSocketServer({ server });

const agent = new FreshAutonomousAgent();

// Add REST API endpoint for graph chat
app.post('/api/chat', async (req, res) => {
  const { message, useGraphNavigation, projectData } = req.body;
  
  // Set headers for streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    console.log('🤖 Graph Chat Request:', message);
    
    // Use the regular fresh autonomous agent but with graph context
    const enhancedMessage = `${message}

Project context: You have access to an After Effects project with ${projectData?.stats?.total_nodes || 0} nodes and ${projectData?.stats?.total_edges || 0} edges loaded in the graph database.`;

    await agent.runAutonomous(enhancedMessage, {
      thinkingMode: 'enabled',
      onUpdate: (update) => {
        res.write(`data: ${JSON.stringify({ content: update })}\n\n`);
      },
      
      onComplete: (result) => {
        res.write(`data: ${JSON.stringify({ content: result.response, complete: true })}\n\n`);
        res.end();
      },
      
      onError: (error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    });
    
  } catch (error) {
    console.error('❌ Graph chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

wss.on('connection', (ws) => {
  console.log('🔌 Fresh autonomous WebSocket connected');
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'run_autonomous') {
        console.log('🤖 Running fresh autonomous agent');
        console.log('🧠 Thinking mode:', message.thinkingMode || 'enabled');
        
        await agent.runAutonomous(message.userMessage, {
          thinkingMode: message.thinkingMode || 'enabled',
          onUpdate: (update) => {
            ws.send(JSON.stringify({
              type: 'update',
              content: update
            }));
          },
          
          onToolCall: (toolCalls) => {
            ws.send(JSON.stringify({
              type: 'tool_calls',
              toolCalls: toolCalls.map(tc => {
                let badge = '🔧';
                if (tc.name === 'exa_search') {
                  badge = '🌐';
                } else if (tc.name === 'search_ae_documentation') {
                  badge = '📚';
                } else if (tc.name.startsWith('graph_')) {
                  badge = '📊';
                }
                return `${badge} ${tc.query || tc.name}`;
              })
            }));
          },
          
          onComplete: (result) => {
            ws.send(JSON.stringify({
              type: 'complete',
              ...result
            }));
          },
          
          onError: (error) => {
            ws.send(JSON.stringify({
              type: 'error',
              error: error.message
            }));
          }
        });
        
      } else if (message.type === 'project_video_chat') {
        console.log('🎥 Running Gemini video understanding');
        console.log('📹 Video files:', message.videoFiles?.length || 0);
        
        try {
          // Send real-time status updates
          ws.send(JSON.stringify({
            type: 'video_content_delta',
            content: 'Initializing Gemini video understanding...'
          }));
          
          // Use Gemini video service directly
          const videoFiles = message.videoFiles || [];
          
          if (videoFiles.length === 0) {
            throw new Error('No video files provided for analysis');
          }
          
          // Find video files with valid paths
          const validVideoFiles = videoFiles.filter(file => file.filePath && file.hasVideo);
          
          if (validVideoFiles.length === 0) {
            throw new Error('No valid video files found. Please select layers with video content.');
          }
          
          ws.send(JSON.stringify({
            type: 'video_content_delta',
            content: `Found ${validVideoFiles.length} video file(s). Uploading to Gemini...`
          }));
          
          // Upload videos to Gemini Files API first
          const uploadedFiles = [];
          for (const videoFile of validVideoFiles) {
            ws.send(JSON.stringify({
              type: 'video_content_delta',
              content: `Uploading ${videoFile.layerName}...`
            }));
            
            const uploadResult = await agent.geminiVideoService.uploadVideoSimple(
              videoFile.filePath,
              videoFile.layerName || `Video_${Date.now()}`, // Use layer name or fallback
              'video/mp4' // Default MIME type - could be enhanced to detect actual type
            );
            
            if (uploadResult.success) {
              ws.send(JSON.stringify({
                type: 'video_content_delta',
                content: `✅ ${videoFile.layerName} processed and ready for analysis`
              }));
              
              uploadedFiles.push({
                fileId: uploadResult.fileId,
                mimeType: 'video/mp4',
                layerName: videoFile.layerName
              });
              
            } else {
              ws.send(JSON.stringify({
                type: 'video_content_delta',
                content: `❌ Failed to upload ${videoFile.layerName}: ${uploadResult.error}`
              }));
            }
          }
          
          if (uploadedFiles.length === 0) {
            throw new Error('No videos were successfully uploaded to Gemini');
          }
          
          ws.send(JSON.stringify({
            type: 'video_content_delta',
            content: `Processing ${uploadedFiles.length} video(s) with Gemini...`
          }));
          
          // Chat with Gemini using uploaded files
          const response = await agent.geminiVideoService.chatWithVideo(
            message.message, 
            uploadedFiles,
            'gemini-2.0-flash', // Model as string parameter
            [], // Conversation history 
            agent.ragService // RAG service for tool calling
          );
          
          // Send final response
          ws.send(JSON.stringify({
            type: 'video_complete',
            content: response.content,
            model: 'gemini'
          }));
          
        } catch (error) {
          console.error('❌ Gemini video error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
        
      } else if (message.type === 'comp_layer_chat') {
        console.log('🎬 Running autonomous agent with composition layer analysis');
        console.log('📹 Selected layers:', message.layers?.length || 0);
        
        // Create enhanced message with layer context
        const layerContext = message.layers.map(layer => {
          let description = `Layer ${layer.layerId}: "${layer.layerName}" (${layer.layerType})`;
          if (layer.sourceName) {
            description += ` - Source: ${layer.sourceName}`;
          }
          if (layer.hasVideo) {
            description += ` - HAS VIDEO`;
          }
          if (layer.width > 0) {
            description += ` - ${layer.width}x${layer.height}`;
          }
          if (layer.filePath) {
            description += ` - File: ${layer.filePath}`;
          }
          return description;
        }).join('\n');
        
        const enhancedMessage = `${message.message}

COMPOSITION LAYER CONTEXT:
The user has selected these layers from their active After Effects composition for analysis:
${layerContext}

Please analyze these layers and provide insights. You have access to all your usual tools including documentation search, web search, and ExtendScript execution. Focus on how these layers relate to After Effects workflows, layer management, and automation possibilities. Pay special attention to any video layers (marked with "HAS VIDEO").`;
        
        await agent.runAutonomous(enhancedMessage, {
          thinkingMode: 'enabled',
          onUpdate: (update) => {
            ws.send(JSON.stringify({
              type: 'video_content_delta',
              content: update
            }));
          },
          
          onToolCall: (toolCalls) => {
            ws.send(JSON.stringify({
              type: 'tool_calls',
              toolCalls: toolCalls.map(tc => {
                let badge = '🔧';
                if (tc.name === 'exa_search') {
                  badge = '🌐';
                } else if (tc.name === 'search_ae_documentation') {
                  badge = '📚';
                } else if (tc.name.startsWith('graph_')) {
                  badge = '📊';
                }
                return `${badge} ${tc.query || tc.name}`;
              })
            }));
          },
          
          onComplete: (result) => {
            ws.send(JSON.stringify({
              type: 'video_complete',
              content: result.response,
              model: 'claude'
            }));
          },
          
          onError: (error) => {
            ws.send(JSON.stringify({
              type: 'error',
              error: error.message
            }));
          }
        });

      } else if (message.type === 'processed_video_chat') {
        console.log('🎬 Running processed video chat');
        console.log('📹 File ID:', message.fileId);
        console.log('💬 Message:', message.message);

        // Use the pre-processed video file directly with full URI
        const videoFiles = [{
          fileId: message.fileId,
          mimeType: 'video/quicktime',
          layerName: 'Processed Video'
        }];

        ws.send(JSON.stringify({
          type: 'video_content_delta',
          content: `🎬 Using processed video file ${message.fileId}...`
        }));

        // Enhance the user message for better video understanding
        const enhancedMessage = `Analyze this video in detail. Pay attention to:
- What specific actions are being performed
- What software/interface is being shown
- Any text, UI elements, or specific features visible
- The timeline and sequence of events
- Technical details about what's happening

User question: ${message.message}

Provide a comprehensive, detailed analysis.`;

        // Chat with Gemini using the already processed file
        const response = await agent.geminiVideoService.chatWithVideo(
          enhancedMessage, 
          videoFiles,
          message.model || 'gemini-2.0-flash',
          [], // Conversation history 
          agent.ragService // RAG service for tool calling
        );

        console.log('🎬 Response received:', JSON.stringify(response, null, 2));

        // Send final response
        ws.send(JSON.stringify({
          type: 'video_complete',
          content: response.content || response.response || response.text || response,
          model: message.model || 'gemini-2.0-flash'
        }));
      }
      
    } catch (err) {
      console.error('❌ Fresh autonomous message error:', err);
      ws.send(JSON.stringify({
        type: 'error',
        error: err.message
      }));
    }
  });
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🤖 Fresh Autonomous Agent running on port ${PORT}`);
});

module.exports = FreshAutonomousAgent;