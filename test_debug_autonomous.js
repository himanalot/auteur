const WebSocket = require('ws');

console.log('🎯 Testing Debug Autonomous Mode');
console.log('=================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let messageCount = 0;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation."
  }
];

ws.on('open', () => {
  console.log('✅ Connected to backend for debug test');
  
  // Send minimal autonomous request
  const messageContent = 'AUTONOMOUS AGENT MODE: How do I add text layers in After Effects?';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Sending autonomous request...');
  
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
    messageCount++;
    
    console.log(`Message ${messageCount}: ${msg.type}`);
    
    if (msg.type === 'tool_call_start') {
      console.log(`🔧 Tool call: ${msg.toolCalls?.map(tc => tc.query).join(', ')}`);
    }
    
    if (msg.type === 'tool_call_complete') {
      console.log('✅ Tool complete');
    }
    
    if (msg.type === 'chat_complete') {
      console.log('🎉 Chat complete - closing');
      ws.close();
      process.exit(0);
    }
    
    if (msg.type === 'error') {
      console.error('❌ Error:', msg.error);
      ws.close();
      process.exit(1);
    }
  } catch (err) {
    // Ignore parse errors
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  process.exit(1);
});

// Exit after reasonable time
setTimeout(() => {
  console.log('\n⏰ Test timeout');
  ws.close();
  process.exit(0);
}, 30000);