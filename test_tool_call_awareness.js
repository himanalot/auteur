const WebSocket = require('ws');

console.log('🎯 Testing Tool Call Context Awareness');
console.log('=====================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let toolCallCount = 0;
let hasCompleted = false;
let iterationMentions = [];

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected to live backend');
  
  // Test with explicit instruction to mention tool call numbers
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: Research layer properties in After Effects. IMPORTANT: Before each tool call, explicitly say "This is my search number X" where X is the number (1, 2, 3, etc.). After getting results, say "I just completed search number X".';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing tool call context awareness...');
  console.log('Looking for: "search number 1", "search number 2", etc.');
  
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
          
          // Look for iteration awareness phrases
          const searchNumberMatch = content.match(/(?:search number|tool call|iteration)\s*(\d+)/gi);
          if (searchNumberMatch) {
            searchNumberMatch.forEach(match => {
              iterationMentions.push(match);
              console.log(`\n🎯 ITERATION AWARENESS: "${match}"`);
            });
          }
          
          // Look for "This is my" patterns
          if (content.includes('This is my')) {
            console.log(`\n🎯 AWARENESS PHRASE: "${content.trim()}"`);
          }
          
          // Filter out debug content
          if (!content.includes('🔧') && 
              !content.includes('===') &&
              !content.includes('Model:') &&
              !content.includes('PropertyGroup.addProperty()')) {
            process.stdout.write(content);
          }
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log(`\n🔧 ACTUAL Tool Call ${toolCallCount}: ${msg.toolCalls?.map(tc => tc.query).join(', ')}`);
        break;
        
      case 'tool_call_complete':
        console.log(`✅ ACTUAL Tool ${toolCallCount} complete`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Tool Call Awareness Test Complete!');
        
        console.log('\n📊 Context Awareness Analysis:');
        console.log(`   Actual tool calls made: ${toolCallCount}`);
        console.log(`   Iteration mentions found: ${iterationMentions.length}`);
        console.log(`   Response length: ${response.length} chars`);
        
        console.log('\n📝 Iteration Mentions:');
        iterationMentions.forEach((mention, i) => {
          console.log(`   ${i+1}. "${mention}"`);
        });
        
        // Analysis
        if (iterationMentions.length === 0) {
          console.log('\n❌ CRITICAL: Claude has NO awareness of tool call iteration numbers');
          console.log('   - This confirms the original hypothesis');
          console.log('   - Claude cannot track what tool call number it\'s on');
          console.log('   - Context is lost between tool calls within same message group');
        } else if (iterationMentions.length === toolCallCount * 2) {
          console.log('\n✅ PERFECT: Claude has full awareness of iteration context');
          console.log('   - Mentioned iteration numbers correctly');
          console.log('   - Tracks context between tool calls');
        } else if (iterationMentions.length > 0) {
          console.log('\n⚠️  PARTIAL: Claude has some awareness but inconsistent');
          console.log(`   - Expected: ${toolCallCount * 2} mentions (before/after each tool call)`);
          console.log(`   - Found: ${iterationMentions.length} mentions`);
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
    console.log(`📊 Partial results: ${toolCallCount} tool calls, ${iterationMentions.length} mentions`);
    ws.close();
    process.exit(1);
  }
}, 45000);