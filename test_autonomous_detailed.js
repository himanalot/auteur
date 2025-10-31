const WebSocket = require('ws');

async function testAutonomousDetailed() {
  return new Promise((resolve) => {
    console.log('🎯 Testing Autonomous Mode - Detailed Analysis');
    console.log('='.repeat(70));
    
    const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
    let toolCallCount = 0;
    let responses = [];
    let hasCompleted = false;

    const chatHistory = [
      {
        role: 'assistant',
        content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation."
      }
    ];

    ws.on('open', () => {
      console.log('✅ Connected to backend');
      const message = 'AUTONOMOUS AGENT MODE: Tell me about a specific aspect of layers in 5 words';
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
            console.log(`\n🔧 Tool Call ${toolCallCount}:`);
            console.log('Query:', msg.toolCalls?.map(tc => tc.query).join(', '));
            break;
            
          case 'tool_result':
            console.log('📊 Tool Result:', {
              success: msg.success,
              resultCount: msg.resultCount
            });
            break;
            
          case 'content_delta':
            // Accumulate response content
            if (!responses[toolCallCount - 1]) {
              responses[toolCallCount - 1] = '';
            }
            responses[toolCallCount - 1] += msg.content || '';
            break;
            
          case 'chat_complete':
            hasCompleted = true;
            console.log(`\n📊 FINAL RESULTS:`);
            console.log(`Total tool calls: ${toolCallCount}`);
            console.log(`Responses captured: ${responses.length}`);
            
            responses.forEach((response, index) => {
              if (response && response.trim()) {
                console.log(`\nResponse ${index + 1}:`);
                console.log(response.trim().substring(0, 200) + '...');
              }
            });
            
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
        console.log(`\n⏰ Timeout - ${toolCallCount} tool calls captured`);
        ws.close();
        resolve(toolCallCount);
      }
    }, 30000);
  });
}

testAutonomousDetailed().catch(console.error);