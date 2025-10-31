const WebSocket = require('ws');

console.log('🎯 Getting ONLY the Final Answer');
console.log('===============================');

const ws = new WebSocket('ws://localhost:3001/api/chat/stream');
let fullResponse = '';
let actualClaudeResponse = '';
let isReceivingContent = false;
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
  
  console.log('📤 Asking for 5-word answer about layer qualities...');
  
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
          fullResponse += content;
          
          // Only collect content that looks like actual Claude response (not debug)
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
            actualClaudeResponse += content;
            process.stdout.write('.');
          }
        }
        break;
        
      case 'tool_call_start':
        toolCallCount++;
        console.log(`\n🔧 Tool ${toolCallCount} started`);
        break;
        
      case 'tool_call_complete':
        console.log(`✅ Tool ${toolCallCount} complete`);
        break;
        
      case 'chat_complete':
        hasCompleted = true;
        console.log('\n\n🎉 Chat Complete!');
        
        console.log('\n📝 Actual Claude Response (filtered):');
        console.log('====================================');
        console.log(actualClaudeResponse.trim());
        console.log('====================================');
        
        // Try to extract the final short answer
        const sentences = actualClaudeResponse.split(/[.!?]+/).filter(s => s.trim());
        const shortSentences = sentences.filter(s => {
          const words = s.trim().split(/\s+/);
          return words.length <= 10 && words.length >= 2;
        });
        
        console.log('\n🎯 Short sentences (potential answers):');
        shortSentences.forEach((sentence, i) => {
          const wordCount = sentence.trim().split(/\s+/).length;
          console.log(`   ${i+1}. [${wordCount} words]: "${sentence.trim()}"`);
        });
        
        // Show the last few words of the actual response
        const lastWords = actualClaudeResponse.trim().split(/\s+/).slice(-10).join(' ');
        console.log('\n📄 Last 10 words of response:');
        console.log(`   "${lastWords}"`);
        
        console.log('\n📊 Stats:');
        console.log('   Tool calls made:', toolCallCount);
        console.log('   Full response length:', fullResponse.length);
        console.log('   Filtered response length:', actualClaudeResponse.length);
        
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
    console.log('\n⏰ Timeout - showing what we captured...');
    console.log('\n📝 Filtered Claude Response so far:');
    console.log('===================================');
    console.log(actualClaudeResponse.trim());
    console.log('===================================');
    
    ws.close();
    process.exit(0);
  }
}, 45000);