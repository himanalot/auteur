const WebSocket = require('ws');

console.log('🤖 Testing Improved Autonomous Mode');
console.log('==================================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let response = '';
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
  
  console.log('📤 Testing improved autonomous prompting...');
  
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
          
          // Only show clean content (not debug)
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
              !content.includes('Content:')) {
            process.stdout.write(content);
          }
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log(`\n\n🔧 Tool Call ${toolCallCount}: ${msg.toolCalls?.map(tc => tc.name).join(', ')}`);
        console.log(`📋 Query: ${msg.toolCalls?.map(tc => tc.query).join(', ')}`);
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Tool ${toolCallCount} completed (${msg.result?.resultCount || 0} results)`);
        console.log('💬 Claude should now provide update on what it learned...\n');
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Autonomous task completed!');
        
        // Extract clean response (filter out debug content)
        const lines = response.split('\n');
        const cleanLines = lines.filter(line => 
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
        
        console.log('\n📄 Clean Response Summary:');
        console.log('==========================');
        cleanLines.slice(-10).forEach((line, i) => {
          if (line.trim()) {
            console.log(`${i+1}. ${line.trim()}`);
          }
        });
        
        // Look for the 5-word answer
        const shortAnswers = cleanLines.filter(line => {
          const words = line.trim().split(/\s+/);
          return words.length <= 8 && words.length >= 3;
        });
        
        console.log('\n🎯 Short Answers Found:');
        shortAnswers.slice(-5).forEach((answer, i) => {
          const wordCount = answer.trim().split(/\s+/).length;
          console.log(`   ${i+1}. [${wordCount} words]: "${answer.trim()}"`);
        });
        
        console.log('\n📊 Final Stats:');
        console.log(`   Tool calls: ${toolCallCount}`);
        console.log(`   Response length: ${response.length} chars`);
        console.log(`   Clean lines: ${cleanLines.length}`);
        
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
    console.log('\n⏰ Test still running after 45 seconds');
    console.log('📊 Current progress:');
    console.log(`   Tool calls: ${toolCallCount}`);
    console.log(`   Response length: ${response.length} chars`);
    ws.close();
    process.exit(0);
  }
}, 45000);