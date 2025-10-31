const WebSocket = require('ws');

console.log('🎯 Testing Simple Chat Autonomous Mode');
console.log('=====================================');

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
  console.log('✅ Connected');
  
  // Test autonomous mode exactly as Simple Chat would send it
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: What are the key properties that After Effects scripters commonly use for layer manipulation?';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing Simple Chat autonomous mode...');
  
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
              content.includes('key properties') ||
              content.includes('commonly use') ||
              content.includes('scripters') ||
              content.includes('layer manipulation')) {
            if (!hasSynthesis) {
              hasSynthesis = true;
              console.log('✅ Synthesis detected!');
            }
          }
          
          // Filter out any remaining debug content
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
        console.log('\n\n🎉 Simple Chat Autonomous Mode Test Complete!');
        
        // Analysis
        const hasDocumentationEcho = response.includes('=== DOCUMENTATION SEARCH') ||
                                   response.includes('PropertyGroup.addProperty()') ||
                                   response.includes('PropertyBase object');
        
        const hasGoodSynthesis = hasSynthesis && response.length > 1000;
        
        console.log('\n📊 Results:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Response length: ${response.length} chars`);
        console.log(`   Contains synthesis: ${hasSynthesis ? '✅' : '❌'}`);
        console.log(`   Good synthesis (>1K chars): ${hasGoodSynthesis ? '✅' : '❌'}`);
        console.log(`   Contains doc echo: ${hasDocumentationEcho ? '❌' : '✅'}`);
        
        if (hasGoodSynthesis && !hasDocumentationEcho && toolCallCount >= 3) {
          console.log('🎉 SUCCESS: Simple Chat autonomous mode is working perfectly!');
          console.log('   ✅ Multiple tool calls made');
          console.log('   ✅ Comprehensive synthesis provided');
          console.log('   ✅ No raw documentation echoing');
        } else if (hasDocumentationEcho) {
          console.log('❌ ISSUE: Still echoing raw documentation');
        } else if (!hasSynthesis) {
          console.log('❌ ISSUE: No synthesis detected');
        } else if (toolCallCount < 3) {
          console.log('❌ ISSUE: Not enough autonomous tool calls');
        } else {
          console.log('❓ PARTIAL: Some issues detected');
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
}, 60000); // Longer timeout for autonomous mode