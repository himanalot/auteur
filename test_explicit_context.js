const WebSocket = require('ws');

console.log('🎯 Testing Explicit Context Autonomous Mode');
console.log('===========================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;
let contextAwarenessCount = 0;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected to live backend');
  
  // Test explicit context awareness
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: How do I create text layers in After Effects using ExtendScript?';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing explicit context autonomous mode...');
  console.log('Looking for search number awareness and non-repetitive behavior...');
  
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
          
          // Check for context awareness
          const contextPhrases = [
            'search 1', 'search 2', 'search 3', 'first search', 'second search', 'third search',
            'already searched', 'previous searches', 'completed', 'based on the', 'found that',
            'from my searches', 'search history', 'different query', 'more specific'
          ];
          
          contextPhrases.forEach(phrase => {
            if (content.toLowerCase().includes(phrase.toLowerCase())) {
              contextAwarenessCount++;
              if (contextAwarenessCount <= 5) { // Don't spam
                console.log(`\n🧠 CONTEXT: "${phrase}"`);
              }
            }
          });
          
          // Show clean content
          if (!content.includes('🔧') && 
              !content.includes('===') &&
              !content.includes('AUTONOMOUS AGENT UPDATE')) {
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
        console.log('\n\n🎉 Explicit Context Test Complete!');
        
        // Check for repetitive behavior
        const responses = response.split('🔧').filter(r => r.trim().length > 50);
        const uniqueStarts = new Set();
        responses.forEach(r => {
          const start = r.trim().substring(0, 50);
          uniqueStarts.add(start);
        });
        
        const repetitiveScore = responses.length - uniqueStarts.size;
        
        console.log('\n📊 Analysis:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Context awareness: ${contextAwarenessCount}`);
        console.log(`   Response length: ${response.length} chars`);
        console.log(`   Repetitive responses: ${repetitiveScore}`);
        
        if (contextAwarenessCount >= 3 && repetitiveScore <= 1 && toolCallCount >= 2) {
          console.log('\n🎉 SUCCESS: Explicit context autonomous mode working!');
          console.log('   ✅ Strong context awareness detected');
          console.log('   ✅ Minimal repetitive behavior');
          console.log('   ✅ Multiple autonomous searches');
        } else if (contextAwarenessCount >= 1 && toolCallCount >= 2) {
          console.log('\n✅ IMPROVED: Some context awareness working');
          console.log('   ✅ Some context awareness');
          console.log('   ✅ Multiple tool calls');
          if (repetitiveScore > 1) console.log('   ⚠️  Still some repetitive behavior');
        } else {
          console.log('\n❌ ISSUES: Context approach needs work');
          if (contextAwarenessCount === 0) console.log('   - No context awareness detected');
          if (repetitiveScore > 2) console.log('   - High repetitive behavior');
          if (toolCallCount < 2) console.log('   - Insufficient autonomous behavior');
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
    console.log(`📊 Partial results: ${toolCallCount} tool calls, ${contextAwarenessCount} context mentions`);
    ws.close();
    process.exit(1);
  }
}, 45000);