const WebSocket = require('ws');

async function testShapesAndLayers() {
  console.log('🎯 Testing: Tell me about shapes and then tell me about layers');
  console.log('='.repeat(60));
  
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3002');
    let toolCallCount = 0;
    let updates = [];
    
    ws.on('open', () => {
      console.log('✅ Connected to fresh autonomous agent');
      
      ws.send(JSON.stringify({
        type: 'run_autonomous',
        userMessage: 'Tell me about shapes and then tell me about layers'
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        switch (msg.type) {
          case 'update':
            updates.push(msg.content);
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
              response: msg.response,
              updates
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
      resolve({ timeout: true, toolCallCount, updates });
    }, 60000);
  });
}

testShapesAndLayers()
  .then(result => {
    console.log('\n📊 Final Result:', result);
    process.exit(0);
  })
  .catch(console.error);