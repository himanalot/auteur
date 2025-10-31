const WebSocket = require('ws');

console.log('🧪 Testing WebSocket connection to ws://localhost:3001/api/chat/stream...');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  
  // Send a test message
  const testMessage = {
    type: 'chat_start',
    data: {
      message: 'Hello from test client',
      model: 'claude',
      conversation: []
    }
  };
  
  console.log('📤 Sending test message...');
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data);
    console.log('📨 Received:', parsed);
  } catch (e) {
    console.log('📨 Received (raw):', data.toString());
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket closed: ${code} ${reason}`);
  process.exit(0);
});

// Close after 5 seconds
setTimeout(() => {
  console.log('⏰ Test complete, closing connection...');
  ws.close();
}, 5000);