require('dotenv').config({ path: './backend/.env' });
const fetch = require('node-fetch');

async function testFullContentToolResults() {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  console.log('🔧 ===== TESTING FULL CONTENT TOOL RESULTS =====\n');
  
  try {
    // Step 1: Get a tool call from Claude
    const initialRequest = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.7,
      stream: false,
      system: 'You are an AI assistant helping with After Effects ExtendScript development.',
      messages: [{
        role: 'user',
        content: 'What are the different types of layers in After Effects? Please search for comprehensive documentation.'
      }],
      tools: [{
        name: 'search_ae_documentation',
        description: 'Search After Effects documentation',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            }
          },
          required: ['query']
        }
      }]
    };

    console.log('📤 Getting tool call from Claude...');
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

    const result1 = await response1.json();
    const toolUse = result1.content?.find(block => block.type === 'tool_use');
    
    if (!toolUse) {
      console.error('❌ No tool use found');
      return;
    }

    console.log(`✅ Tool call received: ${toolUse.name}`);

    // Step 2: Get full documentation from RAG
    const ragResponse = await fetch('http://127.0.0.1:5002/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: toolUse.input.query,
        top_k: 5
      })
    });

    const ragResult = await ragResponse.json();
    const fullDocumentation = ragResult.results.map(r => r.content).join('\n\n');
    
    console.log(`📚 RAG returned ${ragResult.results.length} results`);
    console.log(`📏 Full documentation length: ${fullDocumentation.length} characters`);

    // Step 3: Test with FULL content in tool_result
    const fullContentRequest = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.7,
      stream: false,
      system: 'You are an AI assistant helping with After Effects ExtendScript development. Provide comprehensive responses based on tool results.',
      messages: [
        { role: 'user', content: 'What are the different types of layers in After Effects? Please search for comprehensive documentation.' },
        { role: 'assistant', content: result1.content },
        {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: fullDocumentation  // FULL CONTENT - NO TRUNCATION
          }]
        }
      ]
    };

    console.log('📤 Testing with FULL content in tool_result...');
    console.log(`📏 Sending ${fullDocumentation.length} characters to Claude`);

    const response2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04'
      },
      body: JSON.stringify(fullContentRequest)
    });

    if (!response2.ok) {
      console.error('❌ Request failed:', response2.status, await response2.text());
      return;
    }

    const result2 = await response2.json();
    
    console.log('\n📥 Claude Response:');
    console.log('   Stop reason:', result2.stop_reason);
    console.log('   Content blocks:', result2.content?.length || 0);
    console.log('   Usage:', result2.usage);
    
    if (result2.content && result2.content.length > 0) {
      const textContent = result2.content.find(block => block.type === 'text');
      if (textContent) {
        console.log('✅ SUCCESS: Claude responded with full content');
        console.log('   Response length:', textContent.text.length);
        console.log('   Input tokens:', result2.usage.input_tokens);
        console.log('   Output tokens:', result2.usage.output_tokens);
        
        // Analyze response quality
        const hasDocQuotes = textContent.text.includes('Layer object') || textContent.text.includes('AVLayer');
        const hasCodeExamples = textContent.text.includes('app.project') || textContent.text.includes('layer(');
        const isComprehensive = textContent.text.length > 1000;
        
        console.log('\n📋 Response Analysis:');
        console.log(`   Has documentation quotes: ${hasDocQuotes ? '✅' : '❌'}`);
        console.log(`   Has code examples: ${hasCodeExamples ? '✅' : '❌'}`);
        console.log(`   Comprehensive length: ${isComprehensive ? '✅' : '❌'}`);
        
        console.log('\n📝 Response preview:');
        console.log('---');
        console.log(textContent.text.substring(0, 500) + '...');
        console.log('---');
        
        console.log(`\n🎯 CONCLUSION: Full content tool_result works! No need for artificial limits.`);
        
      } else {
        console.log('❌ FAILED: No text content');
      }
    } else {
      console.log('❌ FAILED: Empty response');
      console.log('Full response:', JSON.stringify(result2, null, 2));
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }

  console.log('\n🔧 ===== END FULL CONTENT TEST =====');
}

testFullContentToolResults();