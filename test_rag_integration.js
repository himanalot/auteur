// Test RAG Integration
// Paste this in browser console to test

async function testRAGIntegration() {
    console.log('🧪 Testing RAG Integration\n');
    
    // Test 1: Test EnhancedRAG directly
    console.log('1️⃣ Testing EnhancedRAG...');
    if (typeof EnhancedRAG !== 'undefined') {
        const enhancedRAG = new EnhancedRAG();
        const result = await enhancedRAG.searchForScriptGeneration("How to create text layer");
        
        console.log('EnhancedRAG Result:');
        console.log(`  Success: ${result.success}`);
        console.log(`  Queries: ${result.searchQueries?.length || 0}`);
        console.log(`  Document Count: ${result.documentCount || 0}`);
        console.log(`  Sources: ${result.sources?.length || 0}`);
    }
    
    // Test 2: Test RAGDocumentationTool
    console.log('\n2️⃣ Testing RAGDocumentationTool...');
    if (typeof RAGDocumentationTool !== 'undefined') {
        const ragTool = new RAGDocumentationTool();
        const result = await ragTool.searchDocumentation("How to create text layer");
        
        console.log('RAGDocumentationTool Result:');
        console.log(`  Success: ${result.success}`);
        console.log(`  Search Queries: ${result.searchQueries?.length || 0}`);
        console.log(`  Result Count: ${result.resultCount || 0}`);
        console.log(`  Sources: ${result.sources?.length || 0}`);
    }
    
    // Test 3: Test full Running Agent
    console.log('\n3️⃣ Testing RunningRAGAgent...');
    if (typeof RunningRAGAgent !== 'undefined') {
        const agent = new RunningRAGAgent();
        agent.ragToolEnabled = true;
        
        // Override maxIterations for quick test
        agent.maxIterations = 1;
        
        const result = await agent.processUserMessage("How to create text layer");
        
        console.log('RunningRAGAgent Result:');
        console.log(`  Success: ${result.success}`);
        console.log(`  RAG Calls Made: ${result.ragCallsMade}`);
        console.log(`  Total Queries: ${result.totalQueries}`);
        console.log(`  Unique Results: ${result.uniqueResults}`);
        console.log(`  Sources: ${result.sources?.length || 0}`);
        
        // Show tool results
        if (result.toolResults && result.toolResults.length > 0) {
            console.log('\n  Tool Results:');
            result.toolResults.forEach((tool, i) => {
                console.log(`    ${i+1}. "${tool.concept}"`);
                console.log(`       Queries: ${tool.result.searchQueries?.length || 0}`);
                console.log(`       Results: ${tool.result.resultCount || 0}`);
            });
        }
    }
}

testRAGIntegration();