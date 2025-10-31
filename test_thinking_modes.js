const WebSocket = require('ws');

async function testThinkingMode(mode) {
  console.log(`\n🧠 Testing ${mode.toUpperCase()} thinking mode`);
  console.log('='.repeat(50));
  
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3002');
    let toolCallCount = 0;
    let startTime = Date.now();
    
    ws.on('open', () => {
      console.log('✅ Connected to fresh autonomous agent');
      
      ws.send(JSON.stringify({
        type: 'run_autonomous',
        userMessage: 'Tell me about layer properties in 5 words',
        thinkingMode: mode
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
            console.log(`🔧 Tool calls: ${msg.toolCalls}`);
            break;
            
          case 'complete':
            const duration = Date.now() - startTime;
            console.log('\n✅ COMPLETED!');
            console.log(`Response: ${msg.response.substring(0, 100)}...`);
            console.log(`Tool calls: ${msg.toolCalls?.length || 0}`);
            console.log(`Duration: ${duration}ms`);
            
            ws.close();
            resolve({
              mode,
              toolCalls: msg.toolCalls?.length || 0,
              duration,
              response: msg.response
            });
            break;
            
          case 'error':
            console.error('❌ Error:', msg.error);
            ws.close();
            resolve({ mode, error: msg.error });
            break;
        }
      } catch (err) {
        console.error('Parse error:', err);
      }
    });

    setTimeout(() => {
      console.log('\n⏰ Test timeout');
      ws.close();
      resolve({ mode, timeout: true, toolCallCount });
    }, 20000);
  });
}

async function runComparison() {
  console.log('🎯 Testing Thinking Mode Comparison');
  console.log('='.repeat(70));
  
  const disabledResult = await testThinkingMode('disabled');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
  const enabledResult = await testThinkingMode('enabled');
  
  console.log('\n📊 COMPARISON RESULTS');
  console.log('='.repeat(50));
  console.log('Disabled (Standard):', {
    toolCalls: disabledResult.toolCalls,
    duration: disabledResult.duration + 'ms',
    error: disabledResult.error || 'none'
  });
  console.log('Enabled (Extended + Interleaved):', {
    toolCalls: enabledResult.toolCalls,
    duration: enabledResult.duration + 'ms', 
    error: enabledResult.error || 'none'
  });
  
  process.exit(0);
}

runComparison().catch(console.error);