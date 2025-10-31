const WebSocket = require('ws');

console.log('🎯 Getting Final Answer Test');
console.log('==========================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let fullResponse = '';
let hasCompleted = false;

const chatHistory = [
  {
    role: 'assistant',
    content: "Hi! I'm an AI assistant with access to the complete After Effects ExtendScript documentation. I can help you with scripting, automation, API questions, and debugging. What would you like to work on?"
  }
];

ws.on('open', () => {
  console.log('✅ Connected');
  
  const messageContent = 'AUTONOMOUS AGENT MODE: Execute this task autonomously with multiple steps and tool calls as needed: tell me about a special code quality of layers in 5 words maximum';
  chatHistory.push({ role: 'user', content: messageContent });
  
  console.log('📤 Sending request for 5-word answer...');
  
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
          fullResponse += (msg.content || msg.delta);
        }
        break;
        
      case 'tool_call_start':
        process.stdout.write('🔧');
        break;
        
      case 'tool_call_complete':
        process.stdout.write('✅');
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Complete! Looking for final answer...');
        
        // Try to find the actual 5-word answer in the response
        const lines = fullResponse.split('\n');
        
        // Look for short lines that might be the answer
        const shortLines = lines.filter(line => {
          const words = line.trim().split(/\s+/);
          return words.length <= 8 && words.length >= 3 && 
                 !line.includes('🔧') && 
                 !line.includes('===') &&
                 line.trim().length > 10;
        });
        
        console.log('📝 Potential 5-word answers found:');
        shortLines.forEach((line, i) => {
          const wordCount = line.trim().split(/\s+/).length;
          console.log(`   ${i+1}. [${wordCount} words]: ${line.trim()}`);
        });
        
        // Show the very end of the response
        const lastLines = lines.slice(-10).filter(l => l.trim()).slice(-5);
        console.log('\n📄 Last 5 lines of response:');
        lastLines.forEach((line, i) => {
          console.log(`   ${i+1}. ${line.trim()}`);
        });
        
        // Total stats
        console.log('\n📊 Response Stats:');
        console.log('   Total length:', fullResponse.length, 'chars');
        console.log('   Total lines:', lines.length);
        console.log('   Non-empty lines:', lines.filter(l => l.trim()).length);
        
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
    console.log('\n⏰ Timeout - analyzing partial response...');
    
    const lines = fullResponse.split('\n');
    const lastLines = lines.slice(-5).filter(l => l.trim());
    
    console.log('📄 Last few lines captured:');
    lastLines.forEach((line, i) => {
      console.log(`   ${i+1}. ${line.trim()}`);
    });
    
    ws.close();
    process.exit(0);
  }
}, 45000);