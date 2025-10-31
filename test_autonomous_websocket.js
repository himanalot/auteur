const WebSocket = require('ws');

async function testAutonomousMode() {
  console.log('🤖 ===== TESTING AUTONOMOUS MODE VIA WEBSOCKET =====\n');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
    let responseContent = '';
    let toolCallCount = 0;
    let isComplete = false;

    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Send autonomous agent request
      const autonomousMessage = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: Tell me about layers in After Effects with specific documentation quotes and examples.';
      
      console.log('🤖 Sending autonomous request...');
      ws.send(JSON.stringify({
        type: 'chat_start',
        data: {
          message: autonomousMessage,
          model: 'claude',
          conversation: []
        }
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received: ${message.type}`);
        
        switch (message.type) {
          case 'connection_established':
            console.log('🔌 Connection established');
            break;
            
          case 'chat_started':
            console.log('🤖 Chat started');
            break;
            
          case 'content_delta':
            if (message.delta) {
              responseContent += message.delta;
              process.stdout.write('.'); // Progress indicator
            }
            break;
            
          case 'tool_call_start':
            toolCallCount++;
            console.log(`\n🔧 Tool call ${toolCallCount}:`, message.toolCalls?.map(tc => tc.name).join(', '));
            break;
            
          case 'tool_call_complete':
            console.log(`✅ Tool completed: ${message.toolCall?.name} - ${message.result?.resultCount || 0} results`);
            break;
            
          case 'chat_complete':
            isComplete = true;
            console.log('\n🎉 Chat completed!');
            console.log(`📊 Final response length: ${responseContent.length} characters`);
            console.log(`🔧 Total tool calls: ${toolCallCount}`);
            
            if (responseContent.length > 500) {
              console.log('\n📝 Response preview:');
              console.log('---');
              console.log(responseContent.substring(0, 800) + (responseContent.length > 800 ? '...' : ''));
              console.log('---');
            }
            
            // Analyze response quality
            const hasDocumentationQuotes = responseContent.includes('Layer object') || 
                                         responseContent.includes('AVLayer object') ||
                                         responseContent.includes('app.project.item');
            const hasCodeExamples = responseContent.includes('layer.') || 
                                  responseContent.includes('Layer.') ||
                                  responseContent.includes('layer(');
            const isComprehensive = responseContent.length > 1000;
            
            console.log('\n📋 Response Analysis:');
            console.log(`   Tool calls made: ${toolCallCount > 0 ? '✅' : '❌'} (${toolCallCount})`);
            console.log(`   Has documentation quotes: ${hasDocumentationQuotes ? '✅' : '❌'}`);
            console.log(`   Has code examples: ${hasCodeExamples ? '✅' : '❌'}`);
            console.log(`   Comprehensive length: ${isComprehensive ? '✅' : '❌'} (${responseContent.length} chars)`);
            
            const success = toolCallCount > 0 && hasDocumentationQuotes && responseContent.length > 500;
            console.log(`\n🎯 Autonomous mode test: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
            
            ws.close();
            resolve(success);
            break;
            
          case 'error':
            console.error('❌ Error:', message.error);
            ws.close();
            reject(new Error(message.error));
            break;
        }
      } catch (err) {
        console.error('❌ Message parse error:', err);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      reject(error);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket disconnected');
      if (!isComplete) {
        reject(new Error('WebSocket closed before completion'));
      }
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!isComplete) {
        console.log('⏰ Test timeout - closing connection');
        ws.close();
        reject(new Error('Test timeout'));
      }
    }, 60000);
  });
}

// Run the test
testAutonomousMode()
  .then((success) => {
    console.log('\n🔧 ===== AUTONOMOUS MODE TEST COMPLETE =====');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 ===== AUTONOMOUS MODE TEST FAILED =====');
    process.exit(1);
  });