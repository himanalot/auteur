require('dotenv').config({ path: './backend/.env' });
const fetch = require('node-fetch');
const fs = require('fs');

async function testClaudeVariation(testName, requestData) {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('   System prompt:', requestData.system || 'None');
  console.log('   Messages:', requestData.messages.length);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      console.error('❌ Request failed:', response.status);
      return false;
    }

    const result = await response.json();
    const hasContent = result.content && result.content.length > 0;
    const textContent = hasContent ? result.content.find(block => block.type === 'text') : null;
    
    if (textContent) {
      console.log('✅ SUCCESS:', textContent.text.length, 'chars');
      console.log('   Preview:', textContent.text.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ FAILED: Empty content, usage:', result.usage.output_tokens, 'tokens');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function runVariationTests() {
  console.log('🔧 ===== CLAUDE VARIATION TESTS =====');
  
  // Load the original problematic request
  const savedData = JSON.parse(fs.readFileSync('claude_request_debug.json', 'utf8'));
  const originalRequest = savedData.claudeRequest;
  const toolResultContent = originalRequest.messages[2].content[0].content;
  
  const tests = [
    // Test 1: Exact original request
    {
      name: "Original problematic request",
      request: originalRequest
    },
    
    // Test 2: Remove system prompt
    {
      name: "No system prompt",
      request: {
        ...originalRequest,
        system: undefined
      }
    },
    
    // Test 3: Simple system prompt
    {
      name: "Simple system prompt",
      request: {
        ...originalRequest,
        system: "You are a helpful assistant."
      }
    },
    
    // Test 4: Only first 500 chars of tool result
    {
      name: "Truncated tool result (500 chars)",
      request: {
        ...originalRequest,
        messages: [
          originalRequest.messages[0],
          originalRequest.messages[1],
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: originalRequest.messages[2].content[0].tool_use_id,
              content: toolResultContent.substring(0, 500) + "..."
            }]
          }
        ]
      }
    },
    
    // Test 5: Minimal tool result
    {
      name: "Minimal tool result",
      request: {
        ...originalRequest,
        messages: [
          originalRequest.messages[0],
          originalRequest.messages[1],
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: originalRequest.messages[2].content[0].tool_use_id,
              content: "The Layer object provides access to layers in After Effects compositions."
            }]
          }
        ]
      }
    },
    
    // Test 6: Different user question
    {
      name: "Simpler user question",
      request: {
        ...originalRequest,
        messages: [
          {
            role: 'user',
            content: 'Tell me about layers in After Effects.'
          },
          originalRequest.messages[1],
          originalRequest.messages[2]
        ]
      }
    },
    
    // Test 7: Remove tool use history, just direct tool result
    {
      name: "Direct tool result only",
      request: {
        ...originalRequest,
        messages: [
          {
            role: 'user',
            content: 'What are layers in After Effects?'
          },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: originalRequest.messages[2].content[0].tool_use_id,
              content: "The Layer object provides access to layers in After Effects compositions. It has properties like name, enabled, and locked."
            }]
          }
        ]
      }
    },
    
    // Test 8: Plain text conversation (no tool results)
    {
      name: "Plain text conversation",
      request: {
        ...originalRequest,
        messages: [
          {
            role: 'user',
            content: 'What are layers in After Effects?'
          }
        ]
      }
    }
  ];
  
  const results = {};
  
  for (const test of tests) {
    const success = await testClaudeVariation(test.name, test.request);
    results[test.name] = success;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  console.log('\n📊 Test Results Summary:');
  for (const [testName, success] of Object.entries(results)) {
    console.log(`   ${success ? '✅' : '❌'} ${testName}`);
  }
  
  console.log('\n🔧 ===== END VARIATION TESTS =====');
}

runVariationTests();