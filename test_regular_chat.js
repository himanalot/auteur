const WebSocket = require('ws');

console.log('🎯 Testing Regular Chat (Non-Autonomous)');
console.log('=========================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
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
  
  // Test regular chat (NO autonomous mode prefix)
  const messageContent = 'Tell me about a specific aspect of layers in 5 words';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Sending regular chat request:', messageContent);
  
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
      case 'tool_call_start':
        toolCallCount++;
        console.log(`🔧 Tool Call ${toolCallCount}: ${msg.toolCalls?.map(tc => tc.query).join(', ')}`);
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Tool ${toolCallCount} complete`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n🎉 Regular Chat Complete!');
        
        console.log(`📊 Tool calls made: ${toolCallCount}`);
        
        if (toolCallCount === 1) {
          console.log('✅ EXPECTED: Regular chat made exactly 1 tool call');
        } else {
          console.log(`❌ UNEXPECTED: Regular chat made ${toolCallCount} tool calls (should be 1)`);
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
}, 30000);