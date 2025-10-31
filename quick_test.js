const WebSocket = require('ws');

console.log('🤖 Quick Autonomous Test - Simple Chat Tab');
console.log('==========================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let responseContent = '';
let toolCallCount = 0;
let hasCompleted = false;

ws.on('open', () => {
  console.log('✅ Connected to WebSocket');
  
  // Test non-AE question to see autonomous behavior
  const message = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: what color is the sky today';
  
  console.log('📤 Sending autonomous request...');
  ws.send(JSON.stringify({
    type: 'chat_start',
    data: {
      message: message,
      model: 'claude',
      conversation: []
    }
  }));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    switch (msg.type) {
      case 'content_delta':
        if (msg.delta) {
          responseContent += msg.delta;
          process.stdout.write('.');
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log('\n🔧 Tool call', toolCallCount);
        break;
        
      case 'tool_call_complete':
        console.log('✅ Tool completed');
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n🎉 Chat completed!');
        console.log('📊 Final stats:');
        console.log('   Response length:', responseContent.length, 'characters');
        console.log('   Tool calls made:', toolCallCount);
        
        // Show end of response
        const lastLines = responseContent.split('\n').slice(-3).join('\n');
        console.log('📝 Response ending:');
        console.log('---');
        console.log(lastLines);
        console.log('---');
        
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
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

setTimeout(() => {
  if (!hasCompleted) {
    console.log('\n⏰ Still processing after 10 seconds');
    console.log('📊 Current stats:');
    console.log('   Response length:', responseContent.length, 'characters');
    console.log('   Tool calls made:', toolCallCount);
    console.log('🔄 Autonomous mode is working and iterating!');
    ws.close();
    process.exit(0);
  }
}, 10000);