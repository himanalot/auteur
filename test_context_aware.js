const WebSocket = require('ws');

console.log('🎯 Testing Context-Aware Autonomous Mode');
console.log('=========================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;
let contextAwarenessCount = 0;
let synthesisQuality = 0;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected to live backend');
  
  // Test with a request that should require multiple searches
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: How do I create different types of layers in After Effects using ExtendScript? Include examples for text, solid, and shape layers.';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing context-aware autonomous mode...');
  console.log('Looking for Claude to reference previous searches...');
  
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
          
          // Check for context awareness phrases
          const contextPhrases = [
            'previous search', 'already searched', 'earlier found', 'from my searches',
            'based on all', 'combining', 'from the searches', 'previous results',
            'completed multiple searches', 'have now completed', 'searches you completed'
          ];
          
          contextPhrases.forEach(phrase => {
            if (content.toLowerCase().includes(phrase.toLowerCase())) {
              contextAwarenessCount++;
              if (contextAwarenessCount <= 3) { // Don't spam
                console.log(`\n🧠 CONTEXT AWARENESS: "${phrase}"`);
              }
            }
          });
          
          // Check for synthesis quality indicators
          const synthesisIndicators = [
            'text layer', 'solid layer', 'shape layer', 'LayerCollection', 'addText', 'addSolid'
          ];
          
          synthesisIndicators.forEach(indicator => {
            if (content.toLowerCase().includes(indicator.toLowerCase())) {
              synthesisQuality++;
            }
          });
          
          // Show clean content (filter debug)
          if (!content.includes('🔧') && 
              !content.includes('===') &&
              !content.includes('PREVIOUS SEARCHES') &&
              !content.includes('CURRENT SEARCH RESULTS')) {
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
        console.log('\n\n🎉 Context-Aware Test Complete!');
        
        console.log('\n📊 Context Awareness Analysis:');
        console.log(`   Tool calls made: ${toolCallCount}`);
        console.log(`   Context awareness mentions: ${contextAwarenessCount}`);
        console.log(`   Synthesis quality score: ${synthesisQuality}`);
        console.log(`   Response length: ${response.length} chars`);
        
        // Evaluate results
        if (contextAwarenessCount >= 2 && synthesisQuality >= 5 && toolCallCount >= 3) {
          console.log('\n🎉 EXCELLENT: Context-aware autonomous mode is working!');
          console.log('   ✅ Claude references previous searches');
          console.log('   ✅ High-quality synthesis provided');
          console.log('   ✅ Multiple autonomous tool calls');
          console.log('   ✅ Comprehensive coverage of topic');
        } else if (contextAwarenessCount >= 1 && synthesisQuality >= 3) {
          console.log('\n✅ GOOD: Context awareness is working');
          console.log('   ✅ Some context awareness detected');
          console.log('   ✅ Reasonable synthesis quality');
          if (toolCallCount < 3) console.log('   ⚠️  Could use more autonomous searches');
        } else {
          console.log('\n❌ NEEDS IMPROVEMENT: Limited context awareness');
          if (contextAwarenessCount === 0) console.log('   - No context awareness detected');
          if (synthesisQuality < 3) console.log('   - Low synthesis quality');
          if (toolCallCount < 3) console.log('   - Insufficient autonomous behavior');
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
}, 60000);