/**
 * Enhanced RAG System for AE Script Generator
 * Implements multi-query search and documentation synthesis
 */

class EnhancedRAG {
    constructor() {
        this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        this.ragServerUrl = 'http://localhost:5002'; // Python RAG server
        this.maxQueries = 5;
        this.maxDocsPerQuery = 5;
        this.maxTotalDocs = 15;
    }

    /**
     * Generate multiple related search queries using Gemini
     */
    async generateRelatedQueries(userQuestion) {
        const queryGenerationPrompt = `You are a search query generator for After Effects ExtendScript documentation. Generate exactly 4 related search queries for comprehensive documentation coverage.

Original question: ${userQuestion}

Generate queries that cover:
1. Main objects/classes (Layer, CompItem, Property, etc.)
2. Specific methods and properties
3. Alternative terminology 
4. Implementation details

CRITICAL: Return ONLY a valid JSON array with exactly 4 strings. No explanations, no markdown, just the JSON:

["query about main objects", "query about methods", "query about properties", "query about implementation"]`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: queryGenerationPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 300
                    }
                })
            });

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (responseText) {
                // Try to extract JSON from response
                const jsonMatch = responseText.match(/\[.*?\]/s);
                if (jsonMatch) {
                    const queries = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(queries) && queries.every(q => typeof q === 'string')) {
                        return [userQuestion, ...queries.slice(0, 4)];
                    }
                }
            }

            console.log('JSON parsing failed, using manual query generation...');
            return this.generateManualQueries(userQuestion);

        } catch (error) {
            console.warn('Error generating related queries:', error);
            return this.generateManualQueries(userQuestion);
        }
    }

    /**
     * Generate related queries manually as fallback
     */
    generateManualQueries(userQuestion) {
        const questionLower = userQuestion.toLowerCase();
        const baseQueries = [userQuestion];

        // Add common variations based on question content
        if (questionLower.includes('create') || questionLower.includes('add')) {
            if (questionLower.includes('layer')) {
                baseQueries.push('add layer to composition');
                baseQueries.push('layer creation methods');
            }
            if (questionLower.includes('shape')) {
                baseQueries.push('shape layer properties');
                baseQueries.push('addProperty shape');
            }
            if (questionLower.includes('text')) {
                baseQueries.push('text layer methods');
                baseQueries.push('TextLayer properties');
            }
        }

        if (questionLower.includes('property')) {
            baseQueries.push('property setValue getValue');
            baseQueries.push('PropertyGroup addProperty');
        }

        if (questionLower.includes('keyframe')) {
            baseQueries.push('setValueAtTime keyframe');
            baseQueries.push('Property keyframe methods');
        }

        // Add object-specific queries
        if (questionLower.includes('composition') || questionLower.includes('comp')) {
            baseQueries.push('CompItem methods properties');
        }

        if (questionLower.includes('effect')) {
            baseQueries.push('apply effect layer');
            baseQueries.push('effects property');
        }

        // Return unique queries up to 5
        const uniqueQueries = [...new Set(baseQueries)];
        return uniqueQueries.slice(0, 5);
    }

    /**
     * Search documentation using Python RAG server
     */
    async searchDocumentation(query, topK = 3) {
        try {
            const response = await fetch(`${this.ragServerUrl}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    top_k: topK
                })
            });

            if (!response.ok) {
                console.warn(`RAG search failed for "${query}": ${response.status}`);
                return [];
            }

            const data = await response.json();
            if (data.success && data.results) {
                return data.results.map(result => ({
                    file: result.file || 'Unknown',
                    content: result.content || '',
                    rank: result.rank || 0
                }));
            }

            return [];

        } catch (error) {
            console.warn(`Error searching documentation for "${query}":`, error);
            return [];
        }
    }

    /**
     * Search using multiple queries and combine results
     */
    async searchMultipleQueries(queries) {
        console.log(`🔍 Searching documentation with ${queries.length} queries...`);
        
        const searchPromises = queries.map(query => 
            this.searchDocumentation(query, this.maxDocsPerQuery)
        );

        const allResults = await Promise.all(searchPromises);
        
        // Combine and deduplicate results
        const combinedDocs = [];
        const seenContent = new Set();

        allResults.forEach((docs, queryIndex) => {
            docs.forEach(doc => {
                const contentHash = doc.content.substring(0, 200);
                if (!seenContent.has(contentHash) && doc.content.length > 50) {
                    seenContent.add(contentHash);
                    doc.sourceQuery = queries[queryIndex];
                    combinedDocs.push(doc);
                }
            });
        });

        // Sort by relevance and limit results
        return combinedDocs.slice(0, this.maxTotalDocs);
    }

    /**
     * Build documentation context for prompt
     */
    buildDocumentationContext(docs) {
        if (!docs || docs.length === 0) {
            return '=== NO RELEVANT DOCUMENTATION FOUND ===';
        }

        const contextSections = [];
        docs.forEach((doc, index) => {
            const queryInfo = doc.sourceQuery ? 
                ` (found via: ${doc.sourceQuery.substring(0, 40)}...)` : '';
            
            contextSections.push(`=== DOCUMENTATION SOURCE ${index + 1}: ${doc.file}${queryInfo} ===`);
            contextSections.push(doc.content);
            contextSections.push('=== END SOURCE ===\n');
        });

        return contextSections.join('\n');
    }

    /**
     * Main RAG search function for script generation
     */
    async searchForScriptGeneration(userRequest) {
        console.log('🧠 Starting enhanced RAG search...');
        
        try {
            // Step 1: Generate related queries
            const searchQueries = await this.generateRelatedQueries(userRequest);
            console.log(`📝 Generated ${searchQueries.length} search queries:`);
            searchQueries.forEach((query, i) => console.log(`  ${i + 1}. ${query}`));

            // Step 2: Search with multiple queries
            const relevantDocs = await this.searchMultipleQueries(searchQueries);
            console.log(`📚 Found ${relevantDocs.length} relevant documentation chunks`);

            // Step 3: Build documentation context
            const documentationContext = this.buildDocumentationContext(relevantDocs);

            return {
                success: true,
                searchQueries: searchQueries,
                documentCount: relevantDocs.length,
                documentationContext: documentationContext,
                sources: relevantDocs.map(doc => doc.file)
            };

        } catch (error) {
            console.error('❌ Enhanced RAG search failed:', error);
            return {
                success: false,
                error: error.message,
                searchQueries: [userRequest],
                documentCount: 0,
                documentationContext: '=== RAG SEARCH FAILED ===',
                sources: []
            };
        }
    }

    /**
     * Generate enhanced script using RAG context
     */
    async generateScriptWithRAG(userRequest, contextInfo = '') {
        console.log('🤖 Generating script with enhanced RAG...');

        // Get comprehensive documentation context
        const ragResult = await this.searchForScriptGeneration(userRequest);

        const systemPrompt = `You are an Expert ExtendScript developer for Adobe After Effects. Generate a complete, professional ExtendScript (.jsx) that accomplishes the user's request.

CRITICAL ERROR HANDLING RULE:
Always structure ExtendScript code with proper error handling that returns results to the output box instead of showing popups:

1. Wrap the main script logic in try-catch blocks
2. Move app.endUndoGroup() inside BOTH try and catch blocks
3. NEVER use alert(), confirm(), or any popup dialogs
4. ALWAYS use $.writeln() for output that should appear in the output box
5. Use $.writeln("ERROR: [specific error message]") for failures
6. Use $.writeln("SUCCESS: [description]") for successful operations
7. Alternative: Use JSON.stringify() for structured results (but still with $.writeln())

Template structure (Option 1 - $.writeln() Output):
\`\`\`javascript
app.beginUndoGroup("Script Name");

try {
    // Main script logic here
    
    app.endUndoGroup();
    
    // Success message for output box
    $.writeln("SUCCESS: Script completed successfully!");

} catch (err) {
    app.endUndoGroup();
    
    // Error message for output box
    $.writeln("ERROR: " + err.toString());
}
\`\`\`

Template structure (Option 2 - JSON Returns):
\`\`\`javascript
app.beginUndoGroup("Script Name");

try {
    // Main script logic here
    
    app.endUndoGroup();
    
    // Success message as LAST statement
    JSON.stringify({
        success: true,
        message: "Script completed successfully!"
    });

} catch (err) {
    app.endUndoGroup();
    
    // Error message as LAST statement  
    JSON.stringify({
        success: false,
        message: "Script Error: " + err.toString(),
        line: err.line || "unknown"
    });
}
\`\`\`

MANDATORY ANALYSIS PROCESS:

**STEP 1**: Read ALL DOCUMENTATION SOURCES below completely and carefully
**STEP 2**: Synthesize information from ALL relevant sources that relate to: ${userRequest}
**STEP 3**: If multiple sources provide information, combine them for a comprehensive answer
**STEP 4**: If no relevant documentation exists, clearly state this limitation

=== COMPREHENSIVE AFTER EFFECTS DOCUMENTATION CONTEXT ===
${ragResult.documentationContext}
=== END DOCUMENTATION CONTEXT ===

**SEARCH QUERIES USED:** ${ragResult.searchQueries.slice(0, 3).join(', ')}...

CRITICAL REQUIREMENTS:
1. Generate ONLY pure ExtendScript code - NO tool calls, NO JSON explanations
2. Use the error handling template above EXACTLY
3. Use proper After Effects API calls (app.project, CompItem, Layer, etc.)
4. Add detailed comments explaining each major section
5. Make it production-ready and professional quality
6. Reference the provided documentation for correct API usage, property names, and methods
7. If any documentation above contains information about effects, properties, methods, layers, or objects related to the question → BASE YOUR CODE ENTIRELY ON THE DOCUMENTATION
8. If multiple sources provide related information → SYNTHESIZE them into comprehensive code
9. If the documentation shows specific property names, method names, or syntax → USE EXACTLY THOSE NAMES
10. CITE which documentation sources you used in comments (e.g., "// Based on Source 1 and 3...")

${contextInfo}

USER REQUEST: "${userRequest}"

Generate the complete ExtendScript now:`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: systemPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.05,
                        maxOutputTokens: 4000,
                        topP: 0.7
                    }
                })
            });

            const data = await response.json();
            const generatedScript = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (generatedScript) {
                return {
                    success: true,
                    script: this.cleanGeneratedScript(generatedScript),
                    ragInfo: ragResult,
                    message: `Script generated using ${ragResult.documentCount} documentation sources`
                };
            } else {
                throw new Error('No script generated by AI');
            }

        } catch (error) {
            console.error('❌ Script generation failed:', error);
            return {
                success: false,
                error: error.message,
                ragInfo: ragResult
            };
        }
    }

    /**
     * Clean up generated script
     */
    cleanGeneratedScript(response) {
        // Remove markdown code blocks
        let cleaned = response.replace(/```(?:javascript|jsx|js)?\s*/gi, '').replace(/```\s*$/gm, '');
        
        // Remove any explanatory text before or after the script
        const lines = cleaned.split('\n');
        let startIndex = 0;
        let endIndex = lines.length - 1;
        
        // Find start of actual script
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('//') || 
                line.startsWith('/*') || 
                line.startsWith('(function') ||
                line.startsWith('function') ||
                line.startsWith('try') ||
                line.startsWith('var ') ||
                line.startsWith('app.') ||
                line.startsWith('if (')) {
                startIndex = i;
                break;
            }
        }
        
        // Find end of actual script
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.endsWith(';') || 
                line.endsWith('}') ||
                line.endsWith('*/') ||
                line.endsWith(')();')) {
                endIndex = i;
                break;
            }
        }
        
        return lines.slice(startIndex, endIndex + 1).join('\n').trim();
    }
}

// Export for use in main.js
window.EnhancedRAG = EnhancedRAG; 