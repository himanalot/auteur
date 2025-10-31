const WebSocket = require('ws');

async function testMessage(label, message) {
  return new Promise((resolve) => {
    console.log(`\n🎯 Testing ${label}`);
    console.log('='.repeat(50));
    
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
      chatHistory.push({ role: 'user', content: message });
      
      console.log('📤 Sending:', message);
      
      ws.send(JSON.stringify({
        type: 'chat_start',
        data: {
          message: message,
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
            
          case 'chat_complete':
            hasCompleted = true;
            console.log(`\n📊 ${label} Result: ${toolCallCount} tool calls`);
            ws.close();
            resolve(toolCallCount);
            break;
            
          case 'error':
            console.error('❌ Error:', msg.error);
            ws.close();
            resolve(-1);
            break;
        }
      } catch (err) {
        // Ignore parse errors
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      resolve(-1);
    });

    setTimeout(() => {
      if (!hasCompleted) {
        console.log(`\n⏰ ${label} Timeout - ${toolCallCount} tool calls`);
        ws.close();
        resolve(toolCallCount);
      }
    }, 30000);
  });
}

async function runComparison() {
  console.log('🎯 Testing Message Content Impact');
  console.log('='.repeat(70));
  
  // Test 1: Regular message
  const regularResult = await testMessage(
    'Regular Message', 
    'Tell me about a specific aspect of layers in 5 words'
  );
  
  // Wait a moment between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Same content with autonomous prefix
  const autonomousResult = await testMessage(
    'Autonomous Message', 
    'AUTONOMOUS AGENT MODE: Tell me about a specific aspect of layers in 5 words'
  );
  
  console.log('\n🎯 COMPARISON RESULTS');
  console.log('='.repeat(50));
  console.log(`Regular message:    ${regularResult} tool calls`);
  console.log(`Autonomous message: ${autonomousResult} tool calls`);
  
  if (regularResult === autonomousResult) {
    console.log('✅ SAME: Message content doesn\'t affect tool call count');
  } else {
    console.log('❌ DIFFERENT: Message content affects tool call count');
    console.log('The "AUTONOMOUS AGENT MODE:" prefix is causing the difference');
  }
  
  process.exit(0);
}

runComparison().catch(console.error);