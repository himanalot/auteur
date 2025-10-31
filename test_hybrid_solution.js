const WebSocket = require('ws');

console.log('🎯 Testing Hybrid Solution');
console.log('==========================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected');
  
  // Test autonomous mode with a clear question
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: What are the main properties of After Effects layers that scripters use?';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing hybrid approach...');
  
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
          
          // Filter out debug content
          if (!content.includes('🔧') && 
              !content.includes('===') &&
              !content.includes('Model:') &&
              !content.includes('DOCUMENTATION SEARCH')) {
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
        console.log('\n\n🎉 Hybrid Solution Test Complete!');
        
        // Check for synthesis vs echoing
        const hasSynthesis = response.includes('Based on') || 
                            response.includes('According to') ||
                            response.includes('The main') ||
                            response.includes('Key properties');
        
        const hasEchoing = response.includes('=== DOCUMENTATION SEARCH') ||
                          response.includes('PropertyGroup.addProperty()') ||
                          response.includes('Layer.property()');
        
        console.log('\n📊 Analysis:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Response length: ${response.length} chars`);
        console.log(`   Contains synthesis: ${hasSynthesis ? '✅' : '❌'}`);
        console.log(`   Contains echoing: ${hasEchoing ? '❌' : '✅'}`);
        
        if (hasSynthesis && !hasEchoing) {
          console.log('🎉 SUCCESS: Claude is now synthesizing instead of echoing!');
        } else if (hasEchoing) {
          console.log('❌ PARTIAL: Still some echoing detected');
        } else {
          console.log('❓ UNCLEAR: Need to review response manually');
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

ws.on('error', () => process.exit(1));

setTimeout(() => {
  if (!hasCompleted) {
    console.log('\n⏰ Timeout');
    console.log(`📊 Partial results: ${toolCallCount} tool calls, ${response.length} chars`);
    ws.close();
    process.exit(0);
  }
}, 45000);