const WebSocket = require('ws');

console.log('🎯 Testing Live Autonomous Mode');
console.log('==============================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;
let hasSynthesis = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected to live backend');
  
  // Test autonomous mode with Gemini (since Claude API key not available)
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: Explain how to create and manipulate text layers in After Effects using ExtendScript';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing live autonomous mode with Gemini...');
  
  ws.send(JSON.stringify({
    type: 'chat_start',
    data: {
      message: messageContent,
      model: 'gemini',  // Use Gemini since Claude API key not available
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
          if (content.includes('text layer') || 
              content.includes('ExtendScript') ||
              content.includes('After Effects') ||
              content.includes('create') ||
              content.includes('manipulate')) {
            if (!hasSynthesis) {
              hasSynthesis = true;
              console.log('✅ Synthesis detected!');
            }
          }
          
          // Show clean content
          process.stdout.write(content);
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
        console.log('\n\n🎉 Live Autonomous Mode Test Complete!');
        
        console.log('\n📊 Results:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Response length: ${response.length} chars`);
        console.log(`   Contains synthesis: ${hasSynthesis ? '✅' : '❌'}`);
        
        if (toolCallCount >= 3 && hasSynthesis && response.length > 1000) {
          console.log('🎉 SUCCESS: Live autonomous mode is working!');
          console.log('   ✅ Multiple autonomous tool calls');
          console.log('   ✅ Synthesis responses detected');
          console.log('   ✅ Comprehensive output');
        } else {
          console.log('❌ ISSUE: Some problems detected');
          if (toolCallCount < 3) console.log('   - Not enough tool calls');
          if (!hasSynthesis) console.log('   - No synthesis detected');
          if (response.length < 1000) console.log('   - Response too short');
        }
        
        ws.close();
        process.exit(0);
        break;
        
      case 'error':
        console.error('❌ Error:', msg.error);
        ws.close();
        process.exit(1);
        break;
        
      default:
        if (msg.type !== 'connection_established' && msg.type !== 'chat_started') {
          console.log(`📨 ${msg.type}`);
        }
    }
  } catch (err) {
    console.error('Parse error:', err);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  process.exit(1);
});

setTimeout(() => {
  if (!hasCompleted) {
    console.log('\n⏰ Timeout - backend may not be running');
    console.log('Please start the backend with: CLAUDE_API_KEY=your_key node backend/server.js');
    ws.close();
    process.exit(1);
  }
}, 10000);