/**
 * Debug RAG Statistics - Run this in browser console to test
 */

async function debugRAGStatistics() {
    console.log('🔍 Debug RAG Statistics Fix');
    
    // Test 1: Check RAGDocumentationTool result format
    console.log('\n1️⃣ Testing RAGDocumentationTool.formatToolResult...');
    
    if (typeof RAGDocumentationTool !== 'undefined') {
        const ragTool = new RAGDocumentationTool();
        
        // Mock a successful search result
        const mockSearchResult = {
            success: true,
            documentation: 'Sample documentation content',
            sources: ['file1.md', 'file2.md'],
            query: 'test query',
            resultCount: 5,
            searchQueries: ['query1', 'query2', 'query3']
        };
        
        const formattedResult = ragTool.formatToolResult(mockSearchResult);
        
        console.log('Formatted Tool Result Structure:');
        console.log('- tool:', formattedResult.tool);
        console.log('- success:', formattedResult.success);
        console.log('- searchQueries:', formattedResult.searchQueries?.length || 0);
        console.log('- resultCount:', formattedResult.resultCount || 0);
        console.log('- sources:', formattedResult.sources?.length || 0);
        console.log('- metadata.searchQueries:', formattedResult.metadata?.searchQueries?.length || 0);
        console.log('- metadata.resultCount:', formattedResult.metadata?.resultCount || 0);
        
        // Test 2: Mock RunningRAGAgent statistics calculation
        console.log('\n2️⃣ Testing RunningRAGAgent statistics calculation...');
        
        // Mock tool results array like RunningRAGAgent would have
        const mockToolResults = [
            {
                iteration: 1,
                concept: 'text layers',
                result: formattedResult,
                timestamp: new Date().toISOString()
            },
            {
                iteration: 1,
                concept: 'composition creation',
                result: {
                    ...formattedResult,
                    searchQueries: ['comp query1', 'comp query2'],
                    resultCount: 3
                },
                timestamp: new Date().toISOString()
            }
        ];
        
        // Calculate statistics like RunningRAGAgent does
        const ragCallsMade = mockToolResults.length;
        const totalQueries = mockToolResults.reduce((sum, result) => {
            const queries = result.result.searchQueries || [];
            return sum + queries.length;
        }, 0);
        const uniqueResults = mockToolResults.reduce((sum, result) => {
            const count = result.result.resultCount || 0;
            return sum + count;
        }, 0);
        
        console.log('Statistics Calculation:');
        console.log('- RAG calls made:', ragCallsMade);
        console.log('- Total queries:', totalQueries);
        console.log('- Unique results:', uniqueResults);
        
        // Expected: 2 calls, 5 queries (3+2), 8 results (5+3)
        const expected = { calls: 2, queries: 5, results: 8 };
        const actual = { calls: ragCallsMade, queries: totalQueries, results: uniqueResults };
        
        console.log('Expected:', expected);
        console.log('Actual:', actual);
        
        if (actual.calls === expected.calls && 
            actual.queries === expected.queries && 
            actual.results === expected.results) {
            console.log('✅ Statistics calculation WORKING correctly!');
        } else {
            console.log('❌ Statistics calculation FAILED!');
        }
        
    } else {
        console.log('❌ RAGDocumentationTool not available');
    }
    
    // Test 3: Test with real RunningRAGAgent if available
    console.log('\n3️⃣ Testing with RunningRAGAgent...');
    
    if (typeof RunningRAGAgent !== 'undefined') {
        const agent = new RunningRAGAgent();
        console.log('RunningRAGAgent available for testing');
        console.log('Methods available:', Object.getOwnPropertyNames(RunningRAGAgent.prototype));
    } else {
        console.log('❌ RunningRAGAgent not available');
    }
    
    console.log('\n🔍 Debug complete!');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    debugRAGStatistics();
} else {
    console.log('Run debugRAGStatistics() in browser console');
}