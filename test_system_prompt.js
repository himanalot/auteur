const WebSocket = require('ws');

console.log('🔍 Testing System Prompt Instructions');
console.log('===================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let hasCompleted = false;
let foundSearchNumber = false;
let foundEndResponse = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected');
  
  const messageContent = 'What is a layer in After Effects?';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing system prompt compliance...');
  
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
          
          if (content.includes('SEARCH #')) {
            foundSearchNumber = true;
            console.log('✅ Found SEARCH #X instruction followed!');
          }
          
          if (content.includes('END_RESPONSE')) {
            foundEndResponse = true;
            console.log('✅ Found END_RESPONSE instruction followed!');
          }
          
          process.stdout.write(content);
        }
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Test Complete!');
        console.log('📊 System Prompt Compliance:');
        console.log(`   SEARCH #X found: ${foundSearchNumber ? '✅' : '❌'}`);
        console.log(`   END_RESPONSE found: ${foundEndResponse ? '✅' : '❌'}`);
        
        if (!foundSearchNumber && !foundEndResponse) {
          console.log('❌ CRITICAL: System prompt instructions are NOT being followed!');
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
    console.log(`   SEARCH #X found: ${foundSearchNumber ? '✅' : '❌'}`);
    console.log(`   END_RESPONSE found: ${foundEndResponse ? '✅' : '❌'}`);
    ws.close();
    process.exit(0);
  }
}, 20000);