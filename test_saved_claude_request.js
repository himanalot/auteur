require('dotenv').config({ path: './backend/.env' });
const fetch = require('node-fetch');
const fs = require('fs');

// Load the saved request
async function testSavedClaudeRequest() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY not set');
    return;
  }

  console.log('🔧 ===== TESTING SAVED CLAUDE REQUEST =====\n');

  try {
    // Load the saved request
    const savedData = JSON.parse(fs.readFileSync('claude_request_debug.json', 'utf8'));
    const claudeRequest = savedData.claudeRequest;
    
    console.log('📝 Request Details:');
    console.log('   Timestamp:', savedData.timestamp);
    console.log('   Tool Call:', savedData.toolCall.name, '-', savedData.toolCall.query);
    console.log('   Tool Result Success:', savedData.toolResult.success);
    console.log('   Documentation Length:', savedData.toolResult.documentationLength);
    console.log('   Messages in Request:', claudeRequest.messages.length);
    console.log('   System Prompt:', claudeRequest.system);
    console.log('');

    console.log('📤 Sending exact saved request to Claude...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04'
      },
      body: JSON.stringify(claudeRequest)
    });

    if (!response.ok) {
      console.error('❌ Request failed:', response.status, await response.text());
      return;
    }

    const result = await response.json();
    console.log('📥 Claude Response:');
    console.log('   Stop reason:', result.stop_reason);
    console.log('   Content blocks:', result.content?.length || 0);
    console.log('   Usage:', result.usage);
    
    if (result.content && result.content.length > 0) {
      const textContent = result.content.find(block => block.type === 'text');
      if (textContent) {
        console.log('✅ SUCCESS: Claude responded with content');
        console.log('   Content length:', textContent.text.length);
        console.log('   Content preview:');
        console.log('   ---');
        console.log('   ' + textContent.text.substring(0, 500) + (textContent.text.length > 500 ? '...' : ''));
        console.log('   ---');
        
        // Save the successful response
        const responseData = {
          timestamp: new Date().toISOString(),
          originalRequest: savedData,
          claudeResponse: result,
          success: true,
          responseContent: textContent.text
        };
        
        fs.writeFileSync('claude_response_success.json', JSON.stringify(responseData, null, 2));
        console.log('💾 Response saved to claude_response_success.json');
        
      } else {
        console.log('❌ FAILED: No text content in response');
        console.log('   Full response:', JSON.stringify(result, null, 2));
      }
    } else {
      console.log('❌ FAILED: Empty content array');
      console.log('   Full response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n🔧 ===== END SAVED REQUEST TEST =====');
}

// Run the test
testSavedClaudeRequest();