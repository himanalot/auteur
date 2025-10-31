const WebSocket = require('ws');

console.log('🎯 Testing Direct Answer (Non-Autonomous)');
console.log('========================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let cleanResponse = '';
let hasCompleted = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected');
  
  // Try WITHOUT autonomous mode to see if we get a better answer
  const messageContent = 'What is a special code quality of layers in After Effects? Answer in exactly 5 words.';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Sending direct question (non-autonomous)...');
  
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
          cleanResponse += content;
          process.stdout.write('.');
        }
        break;
        
      case 'tool_call_start':
        console.log('\n🔧 Tool call made');
        break;
        
      case 'tool_call_complete':
        console.log('✅ Tool complete');
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Response Complete!');
        
        console.log('\n📝 Direct Response:');
        console.log('==================');
        console.log(cleanResponse.trim());
        console.log('==================');
        
        // Look for 5-word answers
        const sentences = cleanResponse.split(/[.!?\n]+/).filter(s => s.trim());
        const fiveWordSentences = sentences.filter(s => {
          const words = s.trim().split(/\s+/);
          return words.length === 5;
        });
        
        console.log('\n🎯 Exactly 5-word sentences:');
        fiveWordSentences.forEach((sentence, i) => {
          console.log(`   ${i+1}. "${sentence.trim()}"`);
        });
        
        // Show short sentences (5-8 words)
        const shortSentences = sentences.filter(s => {
          const words = s.trim().split(/\s+/);
          return words.length >= 3 && words.length <= 8;
        });
        
        console.log('\n📋 Short answers (3-8 words):');
        shortSentences.slice(-5).forEach((sentence, i) => {
          const wordCount = sentence.trim().split(/\s+/).length;
          console.log(`   ${i+1}. [${wordCount} words]: "${sentence.trim()}"`);
        });
        
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