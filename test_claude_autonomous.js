const WebSocket = require('ws');

console.log('🎯 Testing Claude Autonomous Mode (Live)');
console.log('========================================');

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
  
  // Test autonomous mode specifically with Claude
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: What are the main methods for creating layers in After Effects using ExtendScript?';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing Claude autonomous mode...');
  
  ws.send(JSON.stringify({
    type: 'chat_start',
    data: {
      message: messageContent,
      model: 'claude',  // Explicitly use Claude
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
          
          // Count synthesis phrases (good indicators)
          if (content.includes('Based on') || 
              content.includes('The main methods') ||
              content.includes('After Effects provides') ||
              content.includes('key approaches') ||
              content.includes('ExtendScript offers')) {
            synthesisCount++;
            if (synthesisCount === 1) {
              console.log('✅ Synthesis language detected!');
            }
          }
          
          // Filter out debug content and only show clean synthesis
          if (!content.includes('🔧') && 
              !content.includes('===') &&
              !content.includes('Model:') &&
              !content.includes('PropertyGroup.addProperty()') &&
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
        console.log('\n\n🎉 Claude Autonomous Mode Test Complete!');
        
        // Calculate metrics
        const cleanLength = response.replace(/🔧.*?=====/g, '').replace(/PropertyGroup\.addProperty\(\)/g, '').length;
        const hasDocEcho = response.includes('PropertyGroup.addProperty()') || response.includes('=== DOCUMENTATION SEARCH');
        const hasGoodSynthesis = synthesisCount > 0 && cleanLength > 500;
        
        console.log('\n📊 Final Results:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Total response: ${response.length} chars`);
        console.log(`   Clean response: ${cleanLength} chars`);
        console.log(`   Synthesis phrases: ${synthesisCount}`);
        console.log(`   Good synthesis: ${hasGoodSynthesis ? '✅' : '❌'}`);
        console.log(`   Documentation echo: ${hasDocEcho ? '❌' : '✅'}`);
        
        if (toolCallCount >= 3 && hasGoodSynthesis && !hasDocEcho) {
          console.log('\n🎉 PERFECT: Claude autonomous mode is working flawlessly!');
          console.log('   ✅ Multiple autonomous searches');
          console.log('   ✅ Synthesis responses provided');
          console.log('   ✅ No raw documentation echoing');
          console.log('   ✅ Comprehensive helpful content');
        } else if (toolCallCount >= 3 && hasGoodSynthesis) {
          console.log('\n✅ GOOD: Claude autonomous mode is mostly working');
          console.log('   ✅ Multiple autonomous searches');
          console.log('   ✅ Synthesis responses provided');
          if (hasDocEcho) console.log('   ⚠️  Some documentation echoing detected');
        } else {
          console.log('\n❌ NEEDS WORK: Some issues detected');
          if (toolCallCount < 3) console.log('   - Not enough autonomous tool calls');
          if (!hasGoodSynthesis) console.log('   - Insufficient synthesis');
          if (hasDocEcho) console.log('   - Raw documentation echoing');
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
    // Ignore parse errors - focus on testing
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
}, 45000); // Longer timeout for full autonomous workflow