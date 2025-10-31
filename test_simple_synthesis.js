const WebSocket = require('ws');

console.log('🎯 Testing Simple Synthesis (Non-Autonomous)');
console.log('=============================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let hasCompleted = false;
let hasSynthesis = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected');
  
  // Test regular (non-autonomous) mode to verify synthesis works
  const messageContent = 'What are the main properties of After Effects layers that scripters use?';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing simple synthesis...');
  
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
              content.includes('main properties') ||
              content.includes('scripters commonly use') ||
              content.includes('Key properties')) {
            hasSynthesis = true;
            console.log('✅ Synthesis detected!');
          }
          
          process.stdout.write(content);
        }
        break;
        
      case 'tool_call_start':
        console.log(`\n🔧 Tool Call: ${msg.toolCalls?.map(tc => tc.query).join(', ')}`);
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Tool complete`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Simple Synthesis Test Complete!');
        
        // Analysis
        const hasDocumentationEcho = response.includes('=== DOCUMENTATION SEARCH') ||
                                   response.includes('PropertyGroup.addProperty()');
        
        console.log('\n📊 Results:');
        console.log(`   Response length: ${response.length} chars`);
        console.log(`   Contains synthesis: ${hasSynthesis ? '✅' : '❌'}`);
        console.log(`   Contains doc echo: ${hasDocumentationEcho ? '❌' : '✅'}`);
        
        if (hasSynthesis && !hasDocumentationEcho) {
          console.log('🎉 SUCCESS: Hybrid approach is working!');
        } else if (hasDocumentationEcho) {
          console.log('❌ ISSUE: Still echoing documentation');
        } else if (!hasSynthesis) {
          console.log('❌ ISSUE: No synthesis detected');
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
    ws.close();
    process.exit(0);
  }
}, 30000);