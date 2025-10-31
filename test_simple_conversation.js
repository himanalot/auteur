const WebSocket = require('ws');

console.log('🎯 Testing Simple Conversation History Approach');
console.log('===============================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;
let contextPhrases = 0;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected to live backend');
  
  // Test WITHOUT autonomous mode - just regular tool use
  const messageContent = 'How do I create text layers in After Effects using ExtendScript? Please search for specific information.';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing simple tool use with conversation history...');
  
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
          
          // Look for good conversation flow
          if (content.includes('found') || 
              content.includes('searched') ||
              content.includes('based on') ||
              content.includes('according to')) {
            contextPhrases++;
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
        console.log('\n\n🎉 Simple Conversation Test Complete!');
        
        console.log('\n📊 Results:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Context phrases: ${contextPhrases}`);
        console.log(`   Response length: ${response.length} chars`);
        
        if (toolCallCount >= 1 && contextPhrases >= 1 && response.length > 500) {
          console.log('\n✅ SUCCESS: Basic tool use with conversation history works!');
          console.log('   ✅ Tool calls executed');
          console.log('   ✅ Context maintained');
          console.log('   ✅ Good response quality');
          console.log('\n💡 Now the autonomous mode just needs to use this same pattern');
        } else {
          console.log('\n❌ ISSUE: Basic conversation not working properly');
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
    ws.close();
    process.exit(1);
  }
}, 30000);