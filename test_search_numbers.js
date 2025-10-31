const WebSocket = require('ws');

console.log('🔍 Testing Search Number Awareness');
console.log('=================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected');
  
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: tell me about a special code quality of layers in 5 words maximum';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing search number awareness...');
  
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
          
          // Look for SEARCH #X patterns in real-time
          if (content.includes('SEARCH #')) {
            const match = content.match(/SEARCH #(\d+):/);
            if (match) {
              console.log(`\n🎯 Claude thinks this is SEARCH #${match[1]}`);
            }
          }
          
          // Only show clean content
          if (!content.includes('🔧') && 
              !content.includes('===') &&
              !content.includes('Model:') &&
              !content.includes('PropertyGroup.addProperty()')) {
            process.stdout.write(content);
          }
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log(`\n🔧 ACTUAL Tool Call ${toolCallCount}: ${msg.toolCalls?.map(tc => tc.query).join(', ')}`);
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Tool ${toolCallCount} complete`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Test Complete!');
        
        // Extract all SEARCH #X mentions
        const searchMatches = response.match(/SEARCH #(\d+):/g) || [];
        console.log('\n📊 Search Number Awareness:');
        console.log(`   SEARCH #X mentions found: ${searchMatches.length}`);
        console.log(`   Actual tool calls made: ${toolCallCount}`);
        
        searchMatches.forEach((match, i) => {
          console.log(`   ${i+1}. Found: ${match}`);
        });
        
        if (searchMatches.length !== toolCallCount) {
          console.log('❌ MISMATCH: Claude\'s awareness doesn\'t match actual tool calls!');
        } else {
          console.log('✅ MATCH: Claude is aware of iteration count');
        }
        
        console.log(`\n📝 Total response: ${response.length} chars`);
        
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

ws.on('error', () => process.exit(1));

setTimeout(() => {
  if (!hasCompleted) {
    console.log('\n⏰ Timeout');
    console.log(`📊 Partial results: ${toolCallCount} tool calls, ${response.length} chars`);
    ws.close();
    process.exit(0);
  }
}, 45000);