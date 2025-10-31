const WebSocket = require('ws');

console.log('🎯 Testing Simple Direct Question');
console.log('================================');

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
  
  // Simple, direct question (no autonomous mode)
  const messageContent = 'Tell me one special characteristic of After Effects layers in exactly 5 words.';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Asking simple question...');
  
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
          
          // Only show clean content 
          if (!content.includes('🔧') && 
              !content.includes('===') &&
              !content.includes('Model:') &&
              !content.includes('System:') &&
              !content.includes('Messages:') &&
              !content.includes('Tool Results:') &&
              !content.includes('- toolu_') &&
              !content.includes('Max Tokens:') &&
              !content.includes('Temperature:') &&
              !content.includes('Role:') &&
              !content.includes('Input:') &&
              !content.includes('Tool Result') &&
              !content.includes('Content:') &&
              !content.includes('PropertyGroup.addProperty()') &&
              !content.includes('#### Description') &&
              !content.includes('| Parameter |')) {
            process.stdout.write(content);
          }
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
        
        // Look for the actual answer
        const lines = response.split('\n').filter(line => 
          !line.includes('🔧') && 
          !line.includes('===') &&
          !line.includes('Model:') &&
          !line.includes('System:') &&
          !line.includes('Messages:') &&
          !line.includes('Tool Results:') &&
          !line.includes('- toolu_') &&
          !line.includes('Max Tokens:') &&
          !line.includes('Temperature:') &&
          !line.includes('Role:') &&
          !line.includes('Input:') &&
          !line.includes('Tool Result') &&
          !line.includes('Content:') &&
          !line.includes('PropertyGroup.addProperty()') &&
          !line.includes('#### Description') &&
          !line.includes('| Parameter |') &&
          line.trim().length > 0
        );
        
        console.log('\n📝 Clean Lines:');
        lines.slice(-10).forEach((line, i) => {
          console.log(`   ${i+1}. ${line.trim()}`);
        });
        
        // Look for exactly 5-word answers
        const fiveWordAnswers = lines.filter(line => {
          const words = line.trim().split(/\s+/);
          return words.length === 5;
        });
        
        console.log('\n🎯 5-Word Answers:');
        fiveWordAnswers.forEach((answer, i) => {
          console.log(`   ${i+1}. "${answer.trim()}"`);
        });
        
        console.log('\n📊 Stats:');
        console.log(`   Total response: ${response.length} chars`);
        console.log(`   Clean lines: ${lines.length}`);
        console.log(`   5-word answers: ${fiveWordAnswers.length}`);
        
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