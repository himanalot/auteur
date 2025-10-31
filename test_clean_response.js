const WebSocket = require('ws');

console.log('🎯 Testing Clean Response (No Debug Clutter)');
console.log('=============================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let cleanResponse = '';
let toolCallCount = 0;
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
  
  console.log('📤 Sending autonomous request...');
  
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
          // Show real-time response (not debug clutter)
          if (!content.includes('🔧') && !content.includes('===')) {
            process.stdout.write('.');
          }
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log(`\n🔧 Tool ${toolCallCount}:`, msg.toolCalls?.map(tc => tc.name).join(', '));
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Complete (${msg.result?.resultCount || 0} results)`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Response Complete!');
        
        // Filter out debug sections to get clean response
        const lines = cleanResponse.split('\n');
        const cleanLines = lines.filter(line => 
          !line.includes('🔧') && 
          !line.includes('===') &&
          !line.includes('Model:') &&
          !line.includes('Max Tokens:') &&
          !line.includes('Temperature:') &&
          !line.includes('System Prompt:') &&
          !line.includes('Messages (') &&
          !line.includes('Role:') &&
          !line.includes('Tool:') &&
          !line.includes('Input:') &&
          !line.includes('Tool Result') &&
          line.trim().length > 0
        );
        
        console.log('📝 Clean Response:');
        console.log('==================');
        cleanLines.forEach((line, i) => {
          if (line.trim()) {
            console.log(line.trim());
          }
        });
        console.log('==================');
        
        // Look for the final short answer
        const shortLines = cleanLines.filter(line => {
          const words = line.trim().split(/\s+/);
          return words.length <= 8 && words.length >= 2 && line.trim().length > 5;
        });
        
        if (shortLines.length > 0) {
          console.log('\n🎯 Potential Final Answers:');
          shortLines.slice(-5).forEach((line, i) => {
            const wordCount = line.trim().split(/\s+/).length;
            console.log(`   ${i+1}. [${wordCount} words]: "${line.trim()}"`);
          });
        }
        
        console.log('\n📊 Stats:');
        console.log('   Tool calls:', toolCallCount);
        console.log('   Total response length:', cleanResponse.length);
        console.log('   Clean response lines:', cleanLines.length);
        
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
    console.log('\n⏰ Timeout - showing partial clean response...');
    
    const lines = cleanResponse.split('\n');
    const cleanLines = lines.filter(line => 
      !line.includes('🔧') && 
      !line.includes('===') &&
      line.trim().length > 0
    ).slice(-10);
    
    console.log('📄 Last 10 clean lines:');
    cleanLines.forEach((line, i) => {
      console.log(`   ${i+1}. ${line.trim()}`);
    });
    
    ws.close();
    process.exit(0);
  }
}, 45000);