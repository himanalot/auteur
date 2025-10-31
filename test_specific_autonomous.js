const WebSocket = require('ws');

console.log('🎯 Testing Specific Autonomous Request');
console.log('====================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation."
  }
];

ws.on('open', () => {
  console.log('✅ Connected to backend');
  
  // Test specific request
  const messageContent = 'AUTONOMOUS AGENT MODE: Tell me about a specific aspect of layers in 5 words';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Sending autonomous request:', messageContent);
  
  ws.send(JSON.stringify({
    type: 'chat_start',
    data: {
      message: messageContent,
      model: 'claude',
      conversation: chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }
  }));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    switch (msg.type) {
      case 'content_delta':
        if (msg.content || msg.delta) {
          const content = msg.content || msg.delta;
          response += content;
          
          // Show clean content only (no debug markers)
          if (!content.includes('🔧') && 
              !content.includes('===') &&
              !content.includes('AUTONOMOUS AGENT UPDATE')) {
            process.stdout.write(content);
          }
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log(`\n🔧 Tool Call ${toolCallCount}: ${msg.toolCalls?.map(tc => tc.query).join(', ')}`);
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Tool ${toolCallCount} complete`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Autonomous Test Complete!');
        
        console.log('\n📊 Results:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Response length: ${response.length} chars`);
        
        // Extract the final answer
        const cleanResponse = response.replace(/🔧.*?\n/g, '').trim();
        console.log(`\n📝 Final Response:`);
        console.log(`"${cleanResponse}"`);
        
        // Check if it's close to 5 words
        const wordCount = cleanResponse.split(/\s+/).filter(w => w.length > 0).length;
        console.log(`\n📊 Word count: ${wordCount} words`);
        
        if (wordCount <= 7 && toolCallCount >= 1) {
          console.log('✅ SUCCESS: Concise autonomous response with tool use!');
        } else if (toolCallCount >= 1) {
          console.log('✅ GOOD: Autonomous tool use working, response length could be refined');
        } else {
          console.log('❌ ISSUE: No tool calls made');
        }
        
        ws.close();
        process.exit(0);
        break;
        
      case 'error':
        console.error('❌ Error:', msg.error);
        ws.close();
        process.exit(1);
        break;
    }
  } catch (err) {
    // Ignore parse errors
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  process.exit(1);
});

setTimeout(() => {
  if (!hasCompleted) {
    console.log('\n⏰ Timeout');
    console.log(`📊 Partial results: ${toolCallCount} tool calls`);
    ws.close();
    process.exit(1);
  }
}, 45000);