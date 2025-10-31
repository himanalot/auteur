const fetch = require('node-fetch');
const ScriptExecutorService = require('./script-executor');
const GraphNavigatorService = require('./graph-navigator');
const GeminiVideoService = require('./gemini-video');

class RAGService {
  constructor() {
    this.ragServerUrl = process.env.RAG_SERVER_URL || 'http://localhost:5002';
    this.maxDocsPerQuery = 5;
    this.cache = new Map();
    this.scriptExecutor = new ScriptExecutorService();
    this.graphNavigator = new GraphNavigatorService();
    this.videoService = new GeminiVideoService();

    // Initialize Exa client if API key is available
    this.exaApiKey = process.env.EXA_API_KEY;
    if (this.exaApiKey) {
      try {
        const { Exa } = require('exa-js');
        this.exaClient = new Exa(this.exaApiKey);
        console.log('✅ Exa client initialized successfully');
      } catch (error) {
        console.warn('⚠️ Failed to initialize Exa client:', error.message);
        this.exaClient = null;
      }
    } else {
      console.warn('⚠️ EXA_API_KEY not found in environment variables');
      this.exaClient = null;
    }
  }

  /**
   * Execute a tool call - now handles both documentation search and script operations
   */
  async executeToolCall(toolCall) {
    console.log(`🔧 Executing tool: ${toolCall.name}`);
    console.log(`🔍 Tool call parameters:`, JSON.stringify(toolCall, null, 2));
    
    try {
      switch (toolCall.name) {
        case 'search_ae_documentation':
          return await this.searchDocumentation(toolCall.query);
          
        case 'exa_search':
          return await this.exaSearch(toolCall.query);

        case 'analyze_video':
          return await this.analyzeVideo(
            toolCall.file_id || toolCall.input?.file_id,
            toolCall.question || toolCall.input?.question,
            toolCall.model || toolCall.input?.model || 'gemini-2.0-flash'
          );

        case 'execute_extendscript':
          const executeResult = await this.scriptExecutor.executeExtendScript(
            toolCall.script, 
            toolCall.description || 'AI Generated Script'
          );
          return {
            success: executeResult.success,
            content: executeResult.success 
              ? `Script executed successfully!\n\nOutput: ${executeResult.output}\nExecution time: ${executeResult.executionTime}ms\nLogs: ${executeResult.logs.join(', ')}`
              : `Script execution failed: ${executeResult.error}`,
            documentation: executeResult.success ? executeResult.output : executeResult.error,
            resultCount: 1,
            toolType: 'script_execution'
          };
          
          
        case 'analyze_error':
          const analysisResult = await this.scriptExecutor.analyzeError(
            toolCall.error_message,
            toolCall.script,
            toolCall.line_number
          );
          return {
            success: true,
            content: this.formatErrorAnalysis(analysisResult),
            documentation: this.formatErrorAnalysis(analysisResult),
            resultCount: 1,
            toolType: 'error_analysis'
          };
          
        case 'save_script_file':
          const saveResult = await this.scriptExecutor.saveScriptFile(
            toolCall.script,
            toolCall.filename,
            toolCall.description
          );
          return {
            success: saveResult.success,
            content: saveResult.success 
              ? `Script saved successfully!\n\nFile: ${saveResult.filename}\nPath: ${saveResult.filepath}\nSize: ${saveResult.size} bytes`
              : `Failed to save script: ${saveResult.error}`,
            documentation: saveResult.success ? `Script saved as ${saveResult.filename}` : saveResult.error,
            resultCount: 1,
            toolType: 'file_operation'
          };

        case 'graph_init':
          const initResult = await this.graphNavigator.init();
          return {
            success: true,
            content: `Graph database connection initialized successfully!\n\nConnection ID: ${JSON.stringify(initResult, null, 2)}`,
            documentation: `HelixDB connection established with ID: ${JSON.stringify(initResult, null, 2)}`,
            resultCount: 1,
            toolType: 'graph_navigation'
          };

        case 'graph_out_step':
          const edgeLabel = toolCall.edge_label || toolCall.input?.edge_label || (toolCall.input && Object.values(toolCall.input)[0]);
          const edgeType = toolCall.edge_type || toolCall.input?.edge_type;
          if (!edgeLabel) {
            console.log('🔍 Tool call structure:', JSON.stringify(toolCall, null, 2));
            throw new Error('edge_label parameter is required');
          }
          const outStepResult = await this.graphNavigator.outStep(edgeLabel, edgeType);
          return {
            success: true,
            content: `Navigated outward through "${edgeLabel}" edges\n\nResult: ${JSON.stringify(outStepResult, null, 2)}`,
            documentation: JSON.stringify(outStepResult, null, 2),
            resultCount: 1,
            toolType: 'graph_navigation'
          };

        case 'graph_in_step':
          const inEdgeLabel = toolCall.edge_label || toolCall.input?.edge_label || (toolCall.input && Object.values(toolCall.input)[0]);
          const inEdgeType = toolCall.edge_type || toolCall.input?.edge_type;
          if (!inEdgeLabel) {
            console.log('🔍 Tool call structure:', JSON.stringify(toolCall, null, 2));
            throw new Error('edge_label parameter is required');
          }
          const inStepResult = await this.graphNavigator.inStep(inEdgeLabel, inEdgeType);
          return {
            success: true,
            content: `Navigated inward through "${inEdgeLabel}" edges\n\nResult: ${JSON.stringify(inStepResult, null, 2)}`,
            documentation: JSON.stringify(inStepResult, null, 2),
            resultCount: 1,
            toolType: 'graph_navigation'
          };

        case 'graph_nodes_by_type':
          const nodeType = toolCall.node_type || toolCall.input?.node_type || (toolCall.input && Object.values(toolCall.input)[0]);
          if (!nodeType) {
            console.log('🔍 Tool call structure:', JSON.stringify(toolCall, null, 2));
            throw new Error('node_type parameter is required');
          }
          const nodesByTypeResult = await this.graphNavigator.nFromType(nodeType);
          return {
            success: true,
            content: `Found nodes of type "${nodeType}"\n\nResult: ${JSON.stringify(nodesByTypeResult, null, 2)}`,
            documentation: JSON.stringify(nodesByTypeResult, null, 2),
            resultCount: 1,
            toolType: 'graph_navigation'
          };

        case 'graph_filter_items':
          const filterResult = await this.graphNavigator.filterItems(
            toolCall.properties,
            toolCall.filter_traversals
          );
          return {
            success: true,
            content: `Filtered current nodes\n\nResult: ${JSON.stringify(filterResult, null, 2)}`,
            documentation: JSON.stringify(filterResult, null, 2),
            resultCount: 1,
            toolType: 'graph_navigation'
          };

        case 'graph_get_schema':
          const schemaResult = await this.graphNavigator.getSchema();
          return {
            success: true,
            content: `Retrieved graph database schema\n\nSchema: ${JSON.stringify(schemaResult, null, 2)}`,
            documentation: JSON.stringify(schemaResult, null, 2),
            resultCount: 1,
            toolType: 'graph_navigation'
          };

        case 'graph_next':
          const nextResult = await this.graphNavigator.next();
          return {
            success: true,
            content: `Retrieved next batch of results\n\nResult: ${JSON.stringify(nextResult, null, 2)}`,
            documentation: JSON.stringify(nextResult, null, 2),
            resultCount: 1,
            toolType: 'graph_navigation'
          };
          
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolCall.name}`,
            content: `Error: Unknown tool "${toolCall.name}"`,
            documentation: '',
            sources: [],
            query: toolCall.query || 'unknown',
            resultCount: 0,
            searchQueries: []
          };
      }
    } catch (error) {
      console.error(`❌ Tool execution failed for ${toolCall.name}:`, error);
      return {
        success: false,
        error: error.message,
        content: `Tool execution error: ${error.message}`,
        documentation: '',
        sources: [],
        query: toolCall.query || 'unknown',
        resultCount: 0,
        searchQueries: []
      };
    }
  }

  /**
   * Search documentation using the existing RAG system
   */
  async searchDocumentation(query, context = '') {
    const cacheKey = `${query}|${context}`.substring(0, 100);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`📋 Using cached result for: ${query.substring(0, 50)}...`);
      return this.cache.get(cacheKey);
    }

    try {
      console.log(`🔍 RAG search: ${query.substring(0, 50)}...`);
      
      // Call the existing Python RAG server
      const response = await fetch(`${this.ragServerUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          top_k: this.maxDocsPerQuery,
          context: context
        })
      });

      if (!response.ok) {
        throw new Error(`RAG server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`📊 RAG Result: ${data.total_results || 0} docs found`);
        console.log(`📊 RAG Response has results array: ${!!data.results}`);
        console.log(`📊 RAG Results array length: ${data.results ? data.results.length : 0}`);
        
        if (data.results && data.results.length > 0) {
          console.log(`📊 First result has content: ${!!data.results[0].content}`);
          console.log(`📊 First result content length: ${data.results[0].content ? data.results[0].content.length : 0}`);
          console.log(`📊 First result content preview: ${data.results[0].content ? data.results[0].content.substring(0, 100) + '...' : 'NO CONTENT'}`);
        }
        
        // Extract documentation content from results array
        let documentation = data.results ? 
          data.results.map(result => result.content).join('\n\n---\n\n') : '';
        
        console.log(`📊 Final documentation length: ${documentation.length}`);
        
        // Truncate documentation if it's too large (Claude has issues with very large tool results)
        const MAX_DOCUMENTATION_LENGTH = 8000; // ~2000 tokens, leaving room for conversation
        if (documentation.length > MAX_DOCUMENTATION_LENGTH) {
          console.log(`⚠️ Documentation too large (${documentation.length} chars), truncating to ${MAX_DOCUMENTATION_LENGTH} chars`);
          
          // Try to truncate at a section boundary if possible
          const truncated = documentation.substring(0, MAX_DOCUMENTATION_LENGTH);
          const lastSectionBreak = truncated.lastIndexOf('\n\n---\n\n');
          
          if (lastSectionBreak > MAX_DOCUMENTATION_LENGTH * 0.7) {
            // If we can find a good section break point, use it
            documentation = truncated.substring(0, lastSectionBreak) + '\n\n[... Additional documentation available but truncated for brevity ...]';
          } else {
            // Otherwise just truncate and add a note
            documentation = truncated + '\n\n[... Documentation truncated. Search for more specific terms for additional details ...]';
          }
          
          console.log(`📊 Truncated documentation length: ${documentation.length}`);
        }
        
        console.log(`📊 Final documentation preview: ${documentation.substring(0, 200)}...`);
        
        // Extract sources from results array
        const sources = data.results ? 
          data.results.map(result => result.file) : [];
        
        const result = {
          success: true,
          documentation: documentation,
          sources: sources,
          query: query,
          resultCount: data.total_results || 0,
          searchQueries: [query] // RAG server doesn't return multiple queries, so use original
        };

        // Cache the result
        this.cache.set(cacheKey, result);
        return result;

      } else {
        console.warn(`⚠️ RAG search failed: ${data.error}`);
        return {
          success: false,
          error: data.error || 'RAG search failed',
          documentation: '',
          sources: [],
          query: query,
          resultCount: 0,
          searchQueries: []
        };
      }

    } catch (error) {
      console.error('❌ RAG service error:', error);
      
      // Return error response that matches expected structure
      return {
        success: false,
        error: error.message || 'Unknown error during documentation search',
        documentation: '',
        sources: [],
        query: query,
        resultCount: 0,
        searchQueries: []
      };
    }
  }

  /**
   * Enhanced multi-query search (mimics the frontend enhanced RAG)
   */
  async searchDocumentationEnhanced(question, context = '') {
    try {
      console.log(`🔍 Enhanced RAG search: ${question.substring(0, 50)}...`);
      
      // Generate related queries using a simple approach
      const queries = this.generateRelatedQueries(question);
      const allResults = [];
      const allSources = [];
      let totalDocs = 0;
      
      // Search with each query
      for (const query of queries) {
        const result = await this.searchDocumentation(query, context);
        if (result.success) {
          allResults.push(result.documentation);
          allSources.push(...(result.sources || []));
          totalDocs += result.resultCount;
        }
      }
      
      // Combine and deduplicate documentation
      const combinedDocs = allResults.join('\n\n---\n\n');
      const uniqueSources = [...new Set(allSources)];
      
      console.log(`📊 Enhanced RAG Result: ${queries.length} queries, ${totalDocs} total docs`);
      
      const result = {
        success: true,
        documentation: combinedDocs,
        sources: uniqueSources,
        query: question,
        resultCount: totalDocs,
        searchQueries: queries
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ Enhanced RAG service error:', error);
      return {
        success: false,
        error: error.message,
        documentation: '',
        sources: [],
        query: question,
        resultCount: 0,
        searchQueries: []
      };
    }
  }

  /**
   * Search the web using Exa AI for ExtendScript and After Effects information
   */
  async exaSearch(query) {
    const cacheKey = `exa_${query}`.substring(0, 100);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`📋 Using cached Exa result for: ${query.substring(0, 50)}...`);
      return this.cache.get(cacheKey);
    }

    if (!this.exaClient) {
      return {
        success: false,
        error: 'Web search not available. Please check EXA_API_KEY environment variable.',
        documentation: '🌐 **Web search service is not configured.** External search capabilities are currently unavailable.',
        sources: [],
        query: query,
        resultCount: 0,
        searchQueries: [query]
      };
    }

    try {
      console.log(`🌐 Exa search: ${query.substring(0, 50)}...`);
      
      // Perform search with content retrieval and highlights
      const searchResult = await this.exaClient.searchAndContents(query, {
        type: 'auto',
        highlights: true,
        numResults: 5
      });
      
      if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
        return {
          success: true,
          documentation: '🌐 **No relevant web results found** for this query. Try searching with different terms or check the local documentation.',
          sources: [],
          query: query,
          resultCount: 0,
          searchQueries: [query]
        };
      }
      
      // Format the results for consumption
      let documentation = '';
      const sources = [];
      
      searchResult.results.forEach((result, index) => {
        sources.push(result.url);
        
        documentation += `**Web Result ${index + 1}:** ${result.title}\n`;
        documentation += `🌐 Source: ${result.url}\n\n`;
        
        if (result.highlights && result.highlights.length > 0) {
          documentation += '**Key Information:**\n';
          result.highlights.forEach(highlight => {
            documentation += `• ${highlight}\n`;
          });
          documentation += '\n';
        }
        
        if (result.text) {
          // Truncate content to avoid overwhelming the context
          const truncatedText = result.text.length > 800 
            ? result.text.substring(0, 800) + '...'
            : result.text;
          documentation += `**Content:**\n${truncatedText}\n\n`;
        }
        
        documentation += '---\n\n';
      });
      
      const result = {
        success: true,
        documentation: documentation,
        sources: sources,
        query: query,
        resultCount: searchResult.results.length,
        searchQueries: [query]
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      console.log(`🌐 Exa Result: ${searchResult.results.length} web results found`);
      return result;
      
    } catch (error) {
      console.error('❌ Web search error:', error);
      return {
        success: false,
        error: error.message || 'Web search failed',
        documentation: `🌐 **Web search encountered an error:** ${error.message}. Please try again or use local documentation search.`,
        sources: [],
        query: query,
        resultCount: 0,
        searchQueries: [query]
      };
    }
  }

  /**
   * Analyze video content using Gemini video understanding
   */
  async analyzeVideo(fileId, question, model = 'gemini-2.0-flash') {
    console.log(`🎥 Analyzing video with Gemini: ${fileId}`);
    console.log(`❓ Question: ${question}`);
    console.log(`🤖 Model: ${model}`);

    try {
      // Call the Gemini video service
      const result = await this.videoService.chatWithVideo(
        question,
        [{ fileId, mimeType: 'video/mp4' }],
        model,
        [] // No conversation history for tool calls
      );

      if (result.success) {
        return {
          success: true,
          documentation: result.response,
          content: result.response,
          sources: [{
            title: `Video Analysis (${fileId})`,
            url: fileId,
            type: 'video'
          }],
          query: question,
          resultCount: 1,
          toolType: 'video_analysis'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Video analysis failed',
          documentation: `❌ **Video analysis failed:** ${result.error}`,
          sources: [],
          query: question,
          resultCount: 0,
          toolType: 'video_analysis'
        };
      }
    } catch (error) {
      console.error('❌ Video analysis error:', error);
      return {
        success: false,
        error: error.message || 'Video analysis failed',
        documentation: `❌ **Video analysis error:** ${error.message}. The video may not be ready or the file ID may be invalid.`,
        sources: [],
        query: question,
        resultCount: 0,
        toolType: 'video_analysis'
      };
    }
  }

  /**
   * Generate related search queries for comprehensive coverage
   */
  generateRelatedQueries(question) {
    const queries = [question];
    
    // Add some basic variations
    const words = question.toLowerCase().split(' ');
    
    // If question mentions specific terms, add broader categories
    if (words.includes('layer')) {
      queries.push('Layer object properties methods');
    }
    if (words.includes('comp') || words.includes('composition')) {
      queries.push('CompItem composition properties');
    }
    if (words.includes('effect')) {
      queries.push('effects application properties');
    }
    if (words.includes('text')) {
      queries.push('TextDocument text layer properties');
    }
    if (words.includes('animation') || words.includes('keyframe')) {
      queries.push('keyframe animation properties');
    }
    
    // Limit to max 4 queries to avoid overwhelming
    return queries.slice(0, 4);
  }

  /**
   * Test connection to RAG server
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.ragServerUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test connection',
          top_k: 1
        })
      });

      return {
        success: response.ok,
        status: response.status,
        url: this.ragServerUrl
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: this.ragServerUrl
      };
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ RAG cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 100 // We could add a max size limit
    };
  }

  /**
   * Format validation results for display
   */
  formatValidationResult(validationResult) {
    let output = `Script Validation Results:\n`;
    output += `Status: ${validationResult.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
    
    if (validationResult.errors.length > 0) {
      output += `Errors (${validationResult.errors.length}):\n`;
      validationResult.errors.forEach((error, index) => {
        output += `${index + 1}. [${error.type}] ${error.message}`;
        if (error.line) output += ` (Line ${error.line})`;
        output += `\n`;
      });
      output += `\n`;
    }
    
    if (validationResult.warnings.length > 0) {
      output += `Warnings (${validationResult.warnings.length}):\n`;
      validationResult.warnings.forEach((warning, index) => {
        output += `${index + 1}. [${warning.type}] ${warning.message}`;
        if (warning.line) output += ` (Line ${warning.line})`;
        output += `\n`;
      });
      output += `\n`;
    }
    
    if (validationResult.suggestions.length > 0) {
      output += `Suggestions:\n`;
      validationResult.suggestions.forEach((suggestion, index) => {
        output += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    return output;
  }

  /**
   * Format error analysis results for display
   */
  formatErrorAnalysis(analysisResult) {
    let output = `Error Analysis Results:\n\n`;
    
    output += `Error Type: ${analysisResult.errorType}\n`;
    output += `Severity: ${analysisResult.severity}\n\n`;
    
    output += `Probable Cause:\n${analysisResult.probableCause}\n\n`;
    
    if (analysisResult.suggestedFixes.length > 0) {
      output += `Suggested Fixes:\n`;
      analysisResult.suggestedFixes.forEach((fix, index) => {
        output += `${index + 1}. ${fix}\n`;
      });
      output += `\n`;
    }
    
    if (analysisResult.codeContext) {
      output += `Code Context (around line ${analysisResult.codeContext.errorLine}):\n`;
      analysisResult.codeContext.context.forEach(line => {
        const marker = line.isErrorLine ? '>>> ' : '    ';
        output += `${marker}${line.lineNumber}: ${line.code}\n`;
      });
      output += `\n`;
    }
    
    if (analysisResult.relatedDocumentation.length > 0) {
      output += `Related Documentation:\n`;
      analysisResult.relatedDocumentation.forEach((doc, index) => {
        output += `${index + 1}. ${doc}\n`;
      });
    }
    
    return output;
  }
}

module.exports = RAGService;