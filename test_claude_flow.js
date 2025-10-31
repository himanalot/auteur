require('dotenv').config({ path: './backend/.env' });
const fetch = require('node-fetch');

// Simulate the exact Claude API flow
async function testClaudeToolFlow() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY not set');
    return;
  }

  console.log('🔧 ===== SIMULATING CLAUDE TOOL FLOW =====\n');

  // Step 1: Initial request with tool
  console.log('1️⃣ STEP 1: Initial Claude request with tool available');
  const initialRequest = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0.7,
    stream: false, // Use non-streaming for easier testing
    system: 'You are an AI assistant helping with After Effects ExtendScript development.',
    messages: [{
      role: 'user',
      content: 'tell me about layers'
    }],
    tools: [{
      name: 'search_ae_documentation',
      description: 'Search the comprehensive After Effects ExtendScript documentation database for specific API information, code examples, property names, method signatures, and technical details.',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query for After Effects documentation.'
          }
        },
        required: ['query']
      }
    }]
  };

  console.log('📤 Sending initial request...');
  
  try {
    const response1 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04'
      },
      body: JSON.stringify(initialRequest)
    });

    if (!response1.ok) {
      console.error('❌ Initial request failed:', response1.status, await response1.text());
      return;
    }

    const result1 = await response1.json();
    console.log('📥 Initial response received:');
    console.log('   Content blocks:', result1.content?.length || 0);
    console.log('   Stop reason:', result1.stop_reason);
    
    // Look for tool calls
    const toolUse = result1.content?.find(block => block.type === 'tool_use');
    if (!toolUse) {
      console.log('❌ No tool use found in response');
      console.log('   Full response:', JSON.stringify(result1, null, 2));
      return;
    }

    console.log('🔧 Tool call found:');
    console.log('   Name:', toolUse.name);
    console.log('   ID:', toolUse.id);
    console.log('   Input:', JSON.stringify(toolUse.input));

    // Step 2: Execute tool using actual RAG server
    console.log('\n2️⃣ STEP 2: Executing tool call against actual RAG server');
    
    let toolResult;
    try {
      const ragResponse = await fetch('http://127.0.0.1:5002/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: toolUse.input.query,
          top_k: 5
        })
      });

      if (!ragResponse.ok) {
        throw new Error(`RAG server error: ${ragResponse.status}`);
      }

      const ragResult = await ragResponse.json();
      
      const fullDocumentation = ragResult.results && ragResult.results.length > 0 ? 
        ragResult.results.map(r => r.content).join('\n\n') : 
        'No documentation found';
      
      // Truncate content to test if length is the issue
      const maxContentLength = 1500;
      const truncatedDocumentation = fullDocumentation.length > maxContentLength ? 
        fullDocumentation.substring(0, maxContentLength) + '\n\n[Content truncated due to length...]' :
        fullDocumentation;
      
      toolResult = {
        success: ragResult.success || false,
        resultCount: ragResult.results ? ragResult.results.length : 0,
        documentation: truncatedDocumentation,
        query: toolUse.input.query
      };
      
      console.log('✅ RAG server tool execution complete');
      console.log('   RAG Success:', ragResult.success);
      console.log('   RAG Results count:', ragResult.results ? ragResult.results.length : 0);
      console.log('   Tool result count:', toolResult.resultCount);
      console.log('   Documentation length:', toolResult.documentation.length);
      console.log('   Documentation preview:', toolResult.documentation.substring(0, 200) + '...');
      
    } catch (error) {
      console.error('❌ RAG server connection failed:', error);
      toolResult = {
        success: false,
        resultCount: 0,
        documentation: 'RAG server connection failed',
        query: toolUse.input.query,
        error: error.message
      };
    }

    // Step 3: Send tool results back to Claude
    console.log('\n3️⃣ STEP 3: Sending tool results back to Claude');

    // Build the exact message format Claude expects
    const toolResultRequest = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.7,
      stream: false,
      system: 'Answer the user question based on the tool results provided. Keep your response concise but helpful.',
      messages: [
        {
          role: 'user',
          content: 'What are the different types of layers in After Effects? Please quote specific documentation about Layer, AVLayer, and TextLayer objects with their exact descriptions and properties.'
        },
        {
          role: 'assistant',
          content: result1.content
        },
        {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: toolResult.documentation
          }]
        }
      ]
    };

    console.log('📤 Sending tool results request...');
    console.log('   Messages:', toolResultRequest.messages.length);
    console.log('   Tool result length:', toolResult.documentation.length);
    
    // Save the complete request to a file for later analysis
    const fs = require('fs');
    const savedRequest = {
      timestamp: new Date().toISOString(),
      toolCall: {
        name: toolUse.name,
        id: toolUse.id,
        query: toolUse.input.query
      },
      toolResult: {
        success: toolResult.success,
        resultCount: toolResult.resultCount,
        documentationLength: toolResult.documentation.length,
        documentation: toolResult.documentation
      },
      claudeRequest: toolResultRequest,
      notes: "This is the complete request that causes Claude to return empty content"
    };
    
    fs.writeFileSync('claude_request_debug.json', JSON.stringify(savedRequest, null, 2));
    console.log('💾 Complete request saved to claude_request_debug.json for analysis');
    
    console.log('   Full request body:', JSON.stringify(toolResultRequest, null, 2));

    const response2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04'
      },
      body: JSON.stringify(toolResultRequest)
    });

    if (!response2.ok) {
      console.error('❌ Tool results request failed:', response2.status, await response2.text());
      return;
    }

    const result2 = await response2.json();
    console.log('\n📥 Tool results response received:');
    console.log('   Stop reason:', result2.stop_reason);
    console.log('   Content blocks:', result2.content?.length || 0);
    
    if (result2.content && result2.content.length > 0) {
      const textContent = result2.content.find(block => block.type === 'text');
      if (textContent) {
        console.log('✅ SUCCESS: Claude responded with content');
        console.log('   Content length:', textContent.text.length);
        console.log('   Content preview:', textContent.text.substring(0, 200) + '...');
      } else {
        console.log('❌ FAILED: No text content in response');
        console.log('   Full response:', JSON.stringify(result2, null, 2));
      }
    } else {
      console.log('❌ FAILED: Empty content array');
      console.log('   Full response:', JSON.stringify(result2, null, 2));
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  }

  console.log('\n🔧 ===== END CLAUDE TOOL FLOW TEST =====');
}

// Run the test
testClaudeToolFlow();