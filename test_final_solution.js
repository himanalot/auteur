const WebSocket = require('ws');

console.log('🎯 Final Solution Test');
console.log('====================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
let hasCompleted = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected');
  
  // Test what Claude would say without any tools - just based on its knowledge
  const messageContent = 'What is a special characteristic of After Effects layers from a programming perspective? Answer in exactly 5 words. Do not search documentation, just answer from your knowledge.';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Testing Claude\'s direct knowledge...');
  
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
          process.stdout.write(content);
        }
        break;
        
      case 'tool_call_start':
        console.log('\n🔧 Tool call (unexpected!)');
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Direct Response Complete!');
        
        console.log('\n📝 Full Response:');
        console.log('=================');
        console.log(response.trim());
        console.log('=================');
        
        // Extract 5-word phrases
        const sentences = response.split(/[.!?]+/).filter(s => s.trim());
        const fiveWordSentences = sentences.filter(s => {
          const words = s.trim().split(/\s+/);
          return words.length === 5;
        });
        
        console.log('\n🎯 5-Word Answers Found:');
        fiveWordSentences.forEach((answer, i) => {
          console.log(`   ${i+1}. "${answer.trim()}"`);
        });
        
        // Show short answers
        const shortAnswers = sentences.filter(s => {
          const words = s.trim().split(/\s+/);
          return words.length >= 3 && words.length <= 8;
        });
        
        console.log('\n📋 Short Answers (3-8 words):');
        shortAnswers.slice(-5).forEach((answer, i) => {
          const wordCount = answer.trim().split(/\s+/).length;
          console.log(`   ${i+1}. [${wordCount} words]: "${answer.trim()}"`);
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
}, 20000);