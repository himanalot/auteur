require('dotenv').config({ path: './backend/.env' });
const fetch = require('node-fetch');

async function testToolResultFormat(testName, messages) {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  console.log(`\n🧪 Testing: ${testName}`);
  
  const requestData = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0.7,
    stream: false,
    system: "Answer based on the information provided.",
    messages: messages
  };
  
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

async function runToolResultFormatTests() {
  console.log('🔧 ===== TOOL RESULT FORMAT TESTS =====');
  
  const tests = [
    // Test 1: Plain text user message with documentation
    {
      name: "Plain text with documentation info",
      messages: [
        {
          role: 'user',
          content: 'What are layers in After Effects?'
        },
        {
          role: 'user', 
          content: 'Here is documentation: The Layer object provides access to layers in After Effects compositions.'
        }
      ]
    },
    
    // Test 2: Single user message with embedded documentation
    {
      name: "Single message with embedded documentation",
      messages: [
        {
          role: 'user',
          content: 'What are layers in After Effects? Here is documentation: The Layer object provides access to layers in After Effects compositions.'
        }
      ]
    },
    
    // Test 3: Assistant response followed by user with documentation
    {
      name: "Assistant search, then user with documentation",
      messages: [
        {
          role: 'user',
          content: 'What are layers in After Effects?'
        },
        {
          role: 'assistant',
          content: 'I\'ll search for information about layers in After Effects.'
        },
        {
          role: 'user',
          content: 'Here is the documentation: The Layer object provides access to layers in After Effects compositions.'
        }
      ]
    },
    
    // Test 4: Tool result format (the problematic one)
    {
      name: "Tool result format (problematic)",
      messages: [
        {
          role: 'user',
          content: 'What are layers in After Effects?'
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'I\'ll search for information about layers.'
            },
            {
              type: 'tool_use',
              id: 'test_id',
              name: 'search_docs',
              input: { query: 'layers' }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'test_id',
              content: 'The Layer object provides access to layers in After Effects compositions.'
            }
          ]
        }
      ]
    },
    
    // Test 5: Text block in user message (not tool_result)
    {
      name: "Text block in user message",
      messages: [
        {
          role: 'user',
          content: 'What are layers in After Effects?'
        },
        {
          role: 'assistant',
          content: 'I\'ll search for information about layers.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Here is documentation: The Layer object provides access to layers in After Effects compositions.'
            }
          ]
        }
      ]
    }
  ];
  
  const results = {};
  
  for (const test of tests) {
    const success = await testToolResultFormat(test.name, test.messages);
    results[test.name] = success;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  console.log('\n📊 Test Results Summary:');
  for (const [testName, success] of Object.entries(results)) {
    console.log(`   ${success ? '✅' : '❌'} ${testName}`);
  }
  
  console.log('\n🔧 ===== END TOOL RESULT FORMAT TESTS =====');
}

runToolResultFormatTests();