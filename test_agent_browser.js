// Test Running Agent in Browser Console
// Copy and paste this into your browser DevTools console

async function testRunningAgent() {
    console.log('🧪 Testing Running Agent System\n');
    
    // Test 1: Check if RAG server is running
    console.log('1️⃣ Testing RAG Server...');
    try {
        const ragResponse = await fetch('http://localhost:5002/health');
        if (ragResponse.ok) {
            console.log('✅ RAG server is running!');
        } else {
            console.log('❌ RAG server responded but with error:', ragResponse.status);
        }
    } catch (error) {
        console.log('❌ RAG server is NOT running!');
        console.log('   Run: python start_script_generator_rag.py');
    }
    
    // Test 2: Create and test Running Agent
    console.log('\n2️⃣ Testing Running Agent Class...');
    if (typeof RunningRAGAgent !== 'undefined') {
        console.log('✅ RunningRAGAgent class is available');
        
        const agent = new RunningRAGAgent();
        agent.ragToolEnabled = true;
        console.log('✅ Agent created with RAG tools enabled');
        
        // Test a simple query
        console.log('\n3️⃣ Testing agent with sample question...');
        const testResult = await agent.processUserMessage("How do I create a text layer?");
        
        console.log('\n📊 Results:');
        console.log(`   Success: ${testResult.success ? '✅' : '❌'}`);
        console.log(`   RAG Calls: ${testResult.ragCallsMade}`);
        console.log(`   Total Queries: ${testResult.totalQueries}`);
        console.log(`   Unique Results: ${testResult.uniqueResults}`);
        console.log(`   Iterations: ${testResult.iterations}`);
        console.log(`   Sources: ${testResult.sources.length}`);
        
        if (testResult.toolResults) {
            console.log('\n🔧 Tool Call Details:');
            testResult.toolResults.forEach((tool, i) => {
                console.log(`   Call ${i + 1}: "${tool.concept}" → ${tool.result.success ? '✅' : '❌'}`);
            });
        }
        
        console.log('\n📝 Response preview:');
        console.log(testResult.response.substring(0, 200) + '...');
        
    } else {
        console.log('❌ RunningRAGAgent class not found!');
        console.log('   Make sure you are in the AE Docs RAG tab');
    }
    
    // Test 3: Check RAG Documentation Chat
    console.log('\n4️⃣ Testing RAG Documentation Chat...');
    if (window.ragDocChat) {
        console.log('✅ RAG Documentation Chat instance found');
        console.log(`   Initialized: ${window.ragDocChat.isInitialized ? '✅' : '❌'}`);
    } else {
        console.log('❌ RAG Documentation Chat not initialized');
    }
}

// Run the test
testRunningAgent();