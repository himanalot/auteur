const WebSocket = require('ws');

async function testSimpleQuestion() {
  console.log('🎯 Testing Simple Question (should complete in 1 iteration)');
  console.log('='.repeat(60));
  
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3002');
    
    ws.on('open', () => {
      console.log('✅ Connected to fresh autonomous agent');
      
      ws.send(JSON.stringify({
        type: 'run_autonomous',
        userMessage: 'What are layers?'  // Simple question, should complete with 1 tool call
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        switch (msg.type) {
          case 'update':
            console.log(`📝 ${msg.content}`);
            break;
            
          case 'tool_calls':
            console.log(`🔧 Tool calls: ${msg.toolCalls}`);
            break;
            
          case 'complete':
            console.log('\n✅ COMPLETED!');
            console.log('Response:', msg.response.substring(0, 200) + '...');
            console.log(`Tool calls: ${msg.toolCalls.length}`);
            console.log(`Iterations: ${msg.iterations}`);
            
            ws.close();
            resolve({ success: true, ...msg });
            break;
            
          case 'error':
            console.error('❌ Error:', msg.error);
            ws.close();
            resolve({ error: msg.error });
            break;
        }
      } catch (err) {
        console.error('Parse error:', err);
      }
    });

    setTimeout(() => {
      console.log('\n⏰ Test timeout');
      ws.close();
      resolve({ timeout: true });
    }, 15000);
  });
}

testSimpleQuestion().then(console.log).catch(console.error);