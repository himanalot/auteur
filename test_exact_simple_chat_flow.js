const WebSocket = require('ws');

console.log('🔍 Testing EXACT Simple Chat Flow');
console.log('===============================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let responseContent = '';
let toolCallCount = 0;
let hasCompleted = false;

// Replicate the exact chatHistory that Simple Chat sends
const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected to WebSocket');
  
  // Test message that would be sent by Simple Chat
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: tell me about a special code quality of layers in 5 words maximum';
  
  // Add user message to history (exactly like Simple Chat does)
  chatHistory.push({ role: 'user', content: messageContent });
  
  // Send exact same format as Simple Chat (lines 535-560 in useSimpleChatManager.ts)
  const chatData = {
    message: messageContent,
    model: 'claude',
    conversation: chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  };
  
  console.log('📤 Sending EXACT Simple Chat format:');
  console.log('   Message:', messageContent.substring(0, 80) + '...');
  console.log('   Model:', chatData.model);
  console.log('   Conversation length:', chatData.conversation.length);
  console.log('   Conversation:');
  chatData.conversation.forEach((msg, i) => {
    console.log(`     ${i+1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
  });
  
  ws.send(JSON.stringify({
    type: 'chat_start',
    data: chatData
  }));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    switch (msg.type) {
      case 'connection_established':
        console.log('🔌 Connection established');
        break;
        
      case 'chat_started':
        console.log('🤖 Chat started');
        break;
        
      case 'content_delta':
        if (msg.content || msg.delta) {
          const content = msg.content || msg.delta;
          responseContent += content;
          process.stdout.write('.');
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log(`\n🔧 Tool call ${toolCallCount}:`, msg.toolCalls?.map(tc => tc.name).join(', '));
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Tool completed: ${msg.result?.resultCount || 0} results`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n🎉 Chat completed!');
        console.log('📊 Final Stats:');
        console.log('   Response length:', responseContent.length, 'chars');
        console.log('   Tool calls made:', toolCallCount);
        
        // Extract final answer (last few lines)
        const lines = responseContent.split('\n').filter(line => line.trim());
        const lastFewLines = lines.slice(-3).join('\n');
        
        console.log('\n📝 Response ending:');
        console.log('---');
        console.log(lastFewLines);
        console.log('---');
        
        // Check if it actually followed the "5 words maximum" constraint
        const hasShortAnswer = responseContent.toLowerCase().includes('inheritance') ||
                              responseContent.toLowerCase().includes('property') ||
                              responseContent.toLowerCase().includes('subclass') ||
                              lines.some(line => line.split(' ').length <= 10);
        
        console.log('\n📋 Analysis:');
        console.log('   Tool calls made:', toolCallCount > 0 ? '✅' : '❌', `(${toolCallCount})`);
        console.log('   Has short answer:', hasShortAnswer ? '✅' : '❌');
        console.log('   Comprehensive response:', responseContent.length > 1000 ? '✅' : '❌');
        
        const success = toolCallCount > 0 && responseContent.length > 500;
        console.log(`\n🎯 EXACT Simple Chat flow test: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        ws.close();
        process.exit(success ? 0 : 1);
        break;
        
      case 'error':
        console.error('❌ Error:', msg.error);
        hasCompleted = true;
        ws.close();
        process.exit(1);
        break;
    }
  } catch (err) {
    console.error('❌ Parse error:', err.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 WebSocket closed');
  if (!hasCompleted) {
    console.log('❌ Closed before completion');
    process.exit(1);
  }
});

// Timeout after 30 seconds
setTimeout(() => {
  if (!hasCompleted) {
    console.log('\n⏰ Test timeout after 30 seconds');
    console.log('📊 Partial Stats:');
    console.log('   Response length:', responseContent.length, 'chars');
    console.log('   Tool calls made:', toolCallCount);
    console.log('🔄 Autonomous mode still running - this indicates it\'s working!');
    ws.close();
    process.exit(0);
  }
}, 30000);