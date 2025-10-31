const WebSocket = require('ws');

async function testFreshTabReasoning() {
  console.log('🎯 Testing Fresh Autonomous Tab with Reasoning');
  console.log('='.repeat(60));
  
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3002');
    let toolCallCount = 0;
    let iterations = [];
    
    ws.on('open', () => {
      console.log('✅ Connected to fresh autonomous agent');
      
      ws.send(JSON.stringify({
        type: 'run_autonomous',
        userMessage: 'Tell me about layer properties in 5 words'
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
            toolCallCount += msg.toolCalls.length;
            console.log(`🔧 Tool calls (${msg.toolCalls.length}):`, msg.toolCalls);
            break;
            
          case 'complete':
            console.log('\n✅ COMPLETED!');
            console.log('Final response:');
            console.log(msg.response);
            console.log(`\nTotal tool calls: ${msg.toolCalls?.length || 0}`);
            console.log(`Iterations: ${msg.iterations}`);
            
            ws.close();
            resolve({
              toolCalls: msg.toolCalls?.length || 0,
              iterations: msg.iterations,
              response: msg.response
            });
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

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      resolve({ error: error.message });
    });

    setTimeout(() => {
      console.log('\n⏰ Test timeout');
      ws.close();
      resolve({ timeout: true, toolCallCount });
    }, 30000);
  });
}

testFreshTabReasoning()
  .then(result => {
    console.log('\n📊 Final Result:', result);
    process.exit(0);
  })
  .catch(console.error);