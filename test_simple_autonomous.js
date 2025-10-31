const WebSocket = require('ws');

console.log('🎯 Testing Simple Autonomous Mode');
console.log('=================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;
let synthesisCount = 0;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected to live backend');
  
  // Test simple autonomous mode with conversation flow
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: How do I create and manipulate different types of layers in After Effects using ExtendScript?';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing simple autonomous mode...');
  console.log('Should naturally continue until Claude provides final answer...');
  
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
    
    switch (msg.type) {
      case 'content_delta':
        if (msg.content || msg.delta) {
          const content = msg.content || msg.delta;
          response += content;
          
          // Check for synthesis indicators
          if (content.includes('Based on') || 
              content.includes('different types') ||
              content.includes('layer creation') ||
              content.includes('comprehensive') ||
              content.includes('ExtendScript')) {
            synthesisCount++;
          }
          
          // Show clean content only
          if (!content.includes('🔧') && !content.includes('===')) {
            process.stdout.write(content);
          }
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log(`\n🔧 Tool Call ${toolCallCount}: ${msg.toolCalls?.map(tc => tc.query).join(', ')}`);
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Tool ${toolCallCount} complete`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Simple Autonomous Test Complete!');
        
        console.log('\n📊 Results:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Synthesis quality: ${synthesisCount}`);
        console.log(`   Response length: ${response.length} chars`);
        
        if (toolCallCount >= 3 && synthesisCount >= 2 && response.length > 1000) {
          console.log('\n🎉 EXCELLENT: Simple autonomous mode working perfectly!');
          console.log('   ✅ Multiple autonomous tool calls');
          console.log('   ✅ Natural conversation flow');
          console.log('   ✅ Quality synthesis');
          console.log('   ✅ Comprehensive response');
        } else if (toolCallCount >= 2 && response.length > 500) {
          console.log('\n✅ GOOD: Autonomous mode working well');
          console.log('   ✅ Multiple tool calls');
          console.log('   ✅ Reasonable response quality');
        } else {
          console.log('\n❌ NEEDS WORK: Issues detected');
          if (toolCallCount < 2) console.log('   - Not enough autonomous behavior');
          if (synthesisCount < 1) console.log('   - Low synthesis quality');
          if (response.length < 500) console.log('   - Response too brief');
        }
        
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
  console.error('❌ WebSocket error:', error);
  process.exit(1);
});

setTimeout(() => {
  if (!hasCompleted) {
    console.log('\n⏰ Timeout');
    console.log(`📊 Partial results: ${toolCallCount} tool calls, ${response.length} chars`);
    ws.close();
    process.exit(1);
  }
}, 60000);