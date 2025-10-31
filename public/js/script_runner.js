// Script Runner - Execute ExtendScript and get AI-enhanced error analysis
class ScriptRunner {
    constructor() {
        this.csInterface = new CSInterface();
        this.isRunning = false;
        this.lastError = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Main elements
        this.scriptInput = document.getElementById('runnerScript');
        this.executeBtn = document.getElementById('runnerExecute');
        this.clearBtn = document.getElementById('runnerClear');
        this.feedBtn = document.getElementById('runnerFeed');
        
        // Results elements
        this.resultsOutput = document.getElementById('runnerResults');
        this.statusElement = document.getElementById('runnerStatus');
        this.copyResultsBtn = document.getElementById('runnerCopyResults');
        
        // AI analysis elements
        this.aiSection = document.getElementById('runnerAiSection');
        this.analysisDiv = document.getElementById('runnerAnalysis');
        this.fixedScriptTextarea = document.getElementById('runnerFixedScript');
        this.modelSelect = document.getElementById('runnerModelSelect');
        this.copyFixedBtn = document.getElementById('runnerCopyFixed');
        this.runFixedBtn = document.getElementById('runnerRunFixed');
    }

    attachEventListeners() {
        this.executeBtn.addEventListener('click', () => this.executeScript());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.feedBtn.addEventListener('click', () => this.feedToAI());
        this.copyResultsBtn.addEventListener('click', () => this.copyResults());
        this.copyFixedBtn.addEventListener('click', () => this.copyFixedScript());
        this.runFixedBtn.addEventListener('click', () => this.runFixedScript());
        
        // Enable/disable feed button based on script content and results
        this.scriptInput.addEventListener('input', () => this.updateFeedButton());
    }

    updateStatus(status, className = '') {
        this.statusElement.textContent = status;
        this.statusElement.className = `runner-status ${className}`;
    }

    updateFeedButton() {
        const hasScript = this.scriptInput.value.trim().length > 0;
        const hasError = this.lastError !== null;
        this.feedBtn.disabled = !(hasScript && hasError);
    }

    async executeScript() {
        const script = this.scriptInput.value.trim();
        if (!script) {
            this.showError('Please enter a script to execute.');
            return;
        }

        this.isRunning = true;
        this.updateStatus('Running...', 'running');
        this.executeBtn.disabled = true;
        this.lastError = null;
        this.resultsOutput.className = 'runner-results-output';
        this.resultsOutput.textContent = 'Executing script...';

        try {
            // Execute the script in After Effects
            const result = await this.executeInAfterEffects(script);
            
            if (result.success) {
                this.showSuccess(result.message || 'Script executed successfully!');
                this.lastError = null;
            } else {
                this.showError(result.error || 'Script execution failed.');
                this.lastError = {
                    script: script,
                    error: result.error,
                    line: result.line,
                    details: result.details,
                    executionTrace: this.extractExecutionTrace(result.error || result.details),
                    lineErrors: this.extractLineErrors(result.error || result.details),
                    errorContext: this.createErrorContext(script, result.line)
                };
            }
        } catch (error) {
            this.showError(`Execution error: ${error.message}`);
            this.lastError = {
                script: script,
                error: error.message,
                line: null,
                details: error.stack,
                executionTrace: this.extractExecutionTrace(error.stack),
                lineErrors: this.extractLineErrors(error.stack),
                errorContext: this.createErrorContext(script, null)
            };
        } finally {
            this.isRunning = false;
            this.executeBtn.disabled = false;
            this.updateFeedButton();
            this.copyResultsBtn.disabled = false;
        }
    }
    
    extractExecutionTrace(errorText) {
        // Extract execution trace from error message
        const traceMatch = errorText.match(/Execution trace: ([\d\s\->]+)/);
        if (traceMatch) {
            return traceMatch[1].split(' -> ').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
        }
        return [];
    }
    
    extractLineErrors(errorText) {
        // Extract line-specific errors from error message
        const lineErrors = [];
        
        // Split the error text into lines to analyze each part
        const lines = errorText.split('\n');
        
        // Look for ERROR: patterns in the output (the output is all concatenated into one line)
        // Split on "ERROR:" to find all errors
        const errorParts = errorText.split('ERROR:');
        
        // Debug: Show what we're working with
        console.log('Debug: Error parts found:', errorParts.length);
        errorParts.forEach((part, index) => {
            console.log(`Debug: Part ${index}:`, part.substring(0, 100) + '...');
        });
        
        errorParts.forEach((part, index) => {
            if (index === 0) return; // Skip the first part (before first ERROR:)
            
            // Extract the error message (everything before SUCCESS: or next ERROR:)
            let errorMsg = part.split('SUCCESS:')[0].trim();
            
            // Debug: Show what error message we extracted
            console.log(`Debug: Extracted error message:`, errorMsg);
            
            // Try to find context clues about which operation failed
            let contextLine = 'Unknown';
            if (errorMsg.indexOf('Gradient effect') !== -1) {
                contextLine = 'Gradient setup (around line 25-40)';
            } else if (errorMsg.indexOf('Noise effect') !== -1) {
                contextLine = 'Noise setup (around line 50-70)';
            } else if (errorMsg.indexOf('Text layer') !== -1) {
                contextLine = 'Text layer (around line 75-100)';
            } else if (errorMsg.indexOf('Circle creation') !== -1) {
                contextLine = 'Circle creation (around line 105-130)';
            }
            
            console.log(`Debug: Context line assigned:`, contextLine);
            
            lineErrors.push({
                line: contextLine,
                error: errorMsg,
                code: 'See script for context'
            });
        });
        
        // Also look for traditional line number patterns
        const patterns = [
            /Line (\d+): ([^\n]+)/g,
            /at line (\d+)/gi,
            /\(Line: (\d+)\)/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(errorText)) !== null) {
                const lineNum = parseInt(match[1]);
                const errorMsg = match[2] || 'Error at this line';
                
                // Avoid duplicates
                if (!lineErrors.find(e => e.line === lineNum)) {
                    lineErrors.push({
                        line: lineNum,
                        error: errorMsg,
                        code: 'See error context for code'
                    });
                }
            }
        });
        
        return lineErrors;
    }
    
    createErrorContext(script, errorLine) {
        // Create context around the error line
        const lines = script.split('\n');
        const context = {};
        
        // Try to extract line number from error if not provided
        if (!errorLine || isNaN(errorLine)) {
            const lastError = this.lastError;
            if (lastError && lastError.details) {
                const lineMatch = lastError.details.match(/line (\d+)/i);
                if (lineMatch) {
                    errorLine = parseInt(lineMatch[1]);
                }
            }
        }
        
        // If we have extracted line errors, create context for each
        if (this.lastError && this.lastError.lineErrors && this.lastError.lineErrors.length > 0) {
            context.multipleErrors = [];
            
            this.lastError.lineErrors.forEach(lineError => {
                let contextLines = [];
                
                // Find relevant sections based on error type
                if (lineError.error.indexOf('Gradient effect') !== -1) {
                    contextLines = this.findScriptSection(lines, 'gradient', 25, 40);
                } else if (lineError.error.indexOf('Circle creation') !== -1) {
                    contextLines = this.findScriptSection(lines, 'circle', 105, 130);
                } else if (lineError.error.indexOf('Noise effect') !== -1) {
                    contextLines = this.findScriptSection(lines, 'noise', 50, 70);
                } else if (lineError.error.indexOf('Text layer') !== -1) {
                    contextLines = this.findScriptSection(lines, 'text', 75, 100);
                }
                
                context.multipleErrors.push({
                    error: lineError.error,
                    section: lineError.line,
                    surroundingLines: contextLines
                });
            });
        }
        
        // Traditional single error context
        if (errorLine && !isNaN(errorLine)) {
            const lineNum = parseInt(errorLine);
            const start = Math.max(0, lineNum - 3);
            const end = Math.min(lines.length, lineNum + 3);
            
            context.errorLine = lineNum;
            context.surroundingLines = [];
            
            for (let i = start; i < end; i++) {
                context.surroundingLines.push({
                    number: i + 1,
                    code: lines[i] || '',
                    isError: (i + 1) === lineNum
                });
            }
        }
        
        return context;
    }
    
    findScriptSection(lines, keyword, startGuess, endGuess) {
        // Find the actual section in the script that matches the keyword
        const contextLines = [];
        let sectionFound = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line.indexOf(keyword) !== -1 || 
                (keyword === 'gradient' && line.indexOf('bgSolid') !== -1) ||
                (keyword === 'circle' && line.indexOf('shapeLayer') !== -1) ||
                (keyword === 'noise' && line.indexOf('fractalNoise') !== -1) ||
                (keyword === 'text' && line.indexOf('textLayer') !== -1)) {
                
                // Found the section, get surrounding lines
                const start = Math.max(0, i - 3);
                const end = Math.min(lines.length, i + 10);
                
                for (let j = start; j < end; j++) {
                    contextLines.push({
                        number: j + 1,
                        code: lines[j] || '',
                        isError: j === i
                    });
                }
                break;
            }
        }
        
        return contextLines;
    }
    
    instrumentScriptSafely(script) {
        // Add line tracking that's safe for existing try-catch blocks
        const lines = script.split('\n');
        const instrumentedLines = [];
        
        // Add tracking variables at the start
        instrumentedLines.push('var __currentLine = 1;');
        instrumentedLines.push('var __executionTrace = [];');
        instrumentedLines.push('var __lineErrors = [];');
        instrumentedLines.push('');
        
        let insideTryBlock = false;
        let braceCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const line = lines[i].trim();
            const originalLine = lines[i];
            
            // Skip empty lines and comments
            if (!line || line.indexOf('//') === 0 || line.indexOf('/*') === 0) {
                instrumentedLines.push(originalLine);
                continue;
            }
            
            // Track brace depth and try blocks
            if (line.indexOf('try') !== -1) {
                insideTryBlock = true;
            }
            if (line.indexOf('{') !== -1) {
                braceCount++;
            }
            if (line.indexOf('}') !== -1) {
                braceCount--;
                if (braceCount === 0) {
                    insideTryBlock = false;
                }
            }
            
            // Only add line tracking for executable lines (not control structures)
            if (this.isExecutableLine(line)) {
                instrumentedLines.push('__currentLine = ' + lineNum + '; __executionTrace.push(' + lineNum + ');');
            }
            
            instrumentedLines.push(originalLine);
        }
        
        return instrumentedLines.join('\n');
    }
    
    isExecutableLine(line) {
        // Check if this is an executable line that should be tracked
        const executablePatterns = [
            /var\s+\w+\s*=/, // Variable assignments
            /\w+\s*=/, // Assignments
            /\w+\.\w+\(/, // Method calls
            /app\./, // App calls
            /\$\.writeln/, // Output calls
            /return\s+/, // Return statements
            /throw\s+/, // Throw statements
        ];
        
        const nonExecutablePatterns = [
            /^\s*try\s*{/, // try blocks
            /^\s*catch\s*\(/, // catch blocks
            /^\s*finally\s*{/, // finally blocks
            /^\s*if\s*\(/, // if statements
            /^\s*else/, // else statements
            /^\s*for\s*\(/, // for loops
            /^\s*while\s*\(/, // while loops
            /^\s*}\s*$/, // closing braces
            /^\s*function\s+/, // function declarations
        ];
        
        // Skip non-executable lines
        if (nonExecutablePatterns.some(pattern => pattern.test(line))) {
            return false;
        }
        
        // Track executable lines
        return executablePatterns.some(pattern => pattern.test(line));
    }
    
    instrumentScript(script) {
        // Legacy method - keeping for compatibility
        return this.instrumentScriptSafely(script);
    }
    
    isControlStructure(line) {
        // Identify control structure keywords that should not be wrapped
        const controlPatterns = [
            /^\s*try\s*\{/,
            /^\s*catch\s*\(/,
            /^\s*finally\s*\{/,
            /^\s*}\s*catch/,
            /^\s*}\s*finally/,
            /^\s*if\s*\(/,
            /^\s*else\s*\{/,
            /^\s*else\s+if/,
            /^\s*for\s*\(/,
            /^\s*while\s*\(/,
            /^\s*do\s*\{/,
            /^\s*switch\s*\(/,
            /^\s*case\s+/,
            /^\s*default\s*:/,
            /^\s*}\s*$/,
            /^\s*\}\s*else/
        ];
        
        return controlPatterns.some(pattern => pattern.test(line));
    }
    
    isInTryCatchBlock(lines, currentIndex) {
        // Simple heuristic to detect if we're inside a try-catch block
        let tryCount = 0;
        let catchCount = 0;
        
        for (let i = 0; i < currentIndex; i++) {
            const line = lines[i].trim();
            if (/^\s*try\s*\{/.test(line)) tryCount++;
            if (/^\s*catch\s*\(/.test(line)) catchCount++;
        }
        
        // If we have more tries than catches, we're likely in a try block
        return tryCount > catchCount;
    }
    
    isInsideString(line) {
        // Simple check to avoid instrumenting inside string literals
        const stringPatterns = [
            /^\s*"[^"]*$/,  // Start of string
            /^[^"]*"$/,     // End of string
            /^\s*'[^']*$/,  // Start of string (single quotes)
            /^[^']*'$/      // End of string (single quotes)
        ];
        
        return stringPatterns.some(pattern => pattern.test(line));
    }
    
    isRiskyOperation(line) {
        // Identify potentially problematic operations
        const riskyPatterns = [
            /\.addProperty\(/,
            /\.setValue\(/,
            /\.setValueAtTime\(/,
            /\.property\(/,
            /\.Effects\./,
            /\.layers\./,
            /\.addComp\(/,
            /\.addSolid\(/,
            /\.addText\(/,
            /\.Masks\./,
            /\.openInViewer\(/,
            /app\.project/,
            /CompItem/,
            /LayerCollection/
        ];
        
        return riskyPatterns.some(pattern => pattern.test(line));
    }

    async executeInAfterEffects(script) {
        return new Promise((resolve) => {
            // Disable instrumentation temporarily to fix syntax error
            const instrumentedScript = script;
            
            // Wrap the script with error handling and output capture
            const wrappedScript = `
                (function() {
                    var capturedOutput = [];
                    var originalWriteln = $.writeln;
                    
                    // Override $.writeln to capture output
                    $.writeln = function(msg) {
                        capturedOutput.push(String(msg));
                        originalWriteln.call($, msg); // Still write to AE console
                    };
                    
                    try {
                        ${instrumentedScript}
                        
                        // Restore original $.writeln
                        $.writeln = originalWriteln;
                        
                        if (capturedOutput.length > 0) {
                            var output = capturedOutput.join("\\n");
                            // Check if output starts with ERROR: - if so, return as error
                            if (output.indexOf("ERROR:") === 0) {
                                return output;
                            } else {
                                return "SUCCESS: " + output;
                            }
                        } else {
                            return "SUCCESS: Script executed successfully (no output)";
                        }
                    } catch (error) {
                        // Restore original $.writeln
                        $.writeln = originalWriteln;
                        
                        var errorMsg = "ERROR: " + error.toString();
                        
                        // Basic error reporting with line context
                        if (error.line) {
                            errorMsg += " (Line: " + error.line + ")";
                        }
                        
                        if (capturedOutput.length > 0) {
                            errorMsg += "\\nOutput before error: " + capturedOutput.join("\\n");
                        }
                        return errorMsg;
                    }
                })();
            `;

            this.csInterface.evalScript(wrappedScript, (result) => {
                if (result.indexOf('SUCCESS:') === 0) {
                    resolve({
                        success: true,
                        message: result.substring(8).trim()
                    });
                } else if (result.indexOf('ERROR:') === 0) {
                    const errorMessage = result.substring(6).trim();
                    const lineMatch = errorMessage.match(/\(Line: (.+?)\)$/);
                    const line = lineMatch ? lineMatch[1] : null;
                    const cleanError = errorMessage.replace(/\(Line: .+?\)$/, '').trim();
                    
                    resolve({
                        success: false,
                        error: cleanError,
                        line: line,
                        details: errorMessage
                    });
                } else {
                    // Handle other cases
                    resolve({
                        success: true,
                        message: result || 'Script executed (no return value)'
                    });
                }
            });
        });
    }

    showSuccess(message) {
        this.updateStatus('Success', 'success');
        this.resultsOutput.className = 'runner-results-output success';
        this.resultsOutput.textContent = message;
    }

    showError(error) {
        this.updateStatus('Error', 'error');
        this.resultsOutput.className = 'runner-results-output error';
        
        // Adobe sometimes gives multi-line errors
        const formattedError = error
            .split('\n')
            .map(line => `<div>${line}</div>`)
            .join('');
        this.resultsOutput.innerHTML = formattedError;
    }

    clearAll() {
        this.scriptInput.value = '';
        this.resultsOutput.textContent = '';
        this.resultsOutput.className = 'runner-results-output';
        this.updateStatus('Ready', 'ready');
        this.lastError = null;
        this.updateFeedButton();
        this.copyResultsBtn.disabled = true;
        this.hideAISection();
    }

    copyResults() {
        const text = this.resultsOutput.textContent;
        if (text && text !== 'No results yet...') {
            navigator.clipboard.writeText(text).then(() => {
                // Visual feedback
                const originalText = this.copyResultsBtn.textContent;
                this.copyResultsBtn.textContent = '✓';
                setTimeout(() => {
                    this.copyResultsBtn.textContent = originalText;
                }, 1000);
            });
        }
    }

    async feedToAI() {
        if (!this.lastError) {
            this.showError('No error to analyze. Run a script first.');
            return;
        }

        this.feedBtn.disabled = true;
        this.feedBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
        
        try {
            await this.analyzeWithAI();
        } catch (error) {
            console.error('AI analysis failed:', error);
            this.analysisDiv.innerHTML = `<div class="error-line">AI analysis failed: ${error.message}</div>`;
        } finally {
            this.feedBtn.disabled = false;
            this.feedBtn.innerHTML = '<span class="btn-icon">🤖</span> Feed to AI';
        }
    }

    async analyzeWithAI() {
        const model = this.modelSelect.value;
        const { script, error, line, details } = this.lastError;

        // Show AI section
        this.showAISection();
        this.analysisDiv.innerHTML = '<div style="color: #FFC107;">🤖 Analyzing script and error...</div>';

        try {
            console.log('Starting AI analysis with model:', model);
            console.log('Error object:', this.lastError);
            
            // Debug: Show enhanced error context
            console.log('Enhanced error context:');
            console.log('- Line errors:', this.lastError.lineErrors);
            console.log('- Execution trace:', this.lastError.executionTrace);
            console.log('- Error context:', this.lastError.errorContext);
            
            // First, search for relevant documentation using RAG
            console.log('Searching for relevant documentation...');
            const relevantDocs = await this.searchRelevantDocumentation(this.lastError);
            console.log('Documentation search completed. Results length:', relevantDocs ? relevantDocs.length : 0);
            
            // Create detailed prompt for AI analysis with documentation context
            const prompt = this.createAnalysisPrompt(script, error, line, details, relevantDocs);
            console.log('Created analysis prompt. Length:', prompt.length);
            
            // Show enhanced context info in UI
            this.showEnhancedContextInfo();

            // Get AI analysis
            console.log('Calling AI with model:', model);
            const analysis = await this.callAI(prompt, model);
            console.log('AI analysis received. Length:', analysis ? analysis.length : 0);
            console.log('AI analysis preview:', analysis ? analysis.substring(0, 200) + '...' : 'No analysis');
            
            // Parse and display the analysis
            this.displayAnalysis(analysis);
        } catch (analysisError) {
            console.error('Analysis failed:', analysisError);
            
            try {
                console.warn('Attempting fallback analysis without RAG...');
                // Fallback to analysis without RAG
                const prompt = this.createAnalysisPrompt(script, error, line, details);
                const analysis = await this.callAI(prompt, model);
                this.displayAnalysis(analysis);
            } catch (fallbackError) {
                console.error('Fallback analysis also failed:', fallbackError);
                this.analysisDiv.innerHTML = `
                    <div class="error-line">❌ AI Analysis Failed</div>
                    <div class="documentation">
                        <strong>Error:</strong> ${analysisError.message}<br>
                        <strong>Fallback Error:</strong> ${fallbackError.message}<br>
                        <br>
                        Please check your API keys and try again.
                    </div>
                `;
            }
        }
    }

    async searchRelevantDocumentation(errorObj) {
        try {
            // Check if RAG system is available
            if (!window.EnhancedRAG) {
                console.log('RAG system not available, skipping documentation search');
                return '';
            }

            const ragSystem = new window.EnhancedRAG();
            
            // Create search queries based on the error and script content
            const searchQueries = await this.generateDocumentationSearchQueries(errorObj);
            
            let allResults = [];
            
            // Search for each query
            for (const query of searchQueries) {
                try {
                    const results = await ragSystem.searchDocumentation(query);
                    if (results && results.length > 0) {
                        allResults.push(...results.slice(0, 2)); // Take top 2 results per query
                    }
                } catch (searchError) {
                    console.warn(`Search failed for query "${query}":`, searchError);
                }
            }
            
            // Format the documentation context
            if (allResults.length > 0) {
                return this.formatDocumentationContext(allResults);
            }
            
            return '';
        } catch (error) {
            console.error('Documentation search failed:', error);
            return '';
        }
    }

    getLineContext(script, lineNumber, linesBefore = 2, linesAfter = 2) {
        if (!script || !lineNumber) return '';
        const lines = script.split('\\n');
        const start = Math.max(0, lineNumber - 1 - linesBefore);
        const end = Math.min(lines.length, lineNumber - 1 + linesAfter);
        const contextLines = lines.slice(start, end);
        
        let context = '';
        for (let i = 0; i < contextLines.length; i++) {
            const currentLineNum = start + i + 1;
            context += `${currentLineNum === lineNumber ? '>>>' : '   '} ${currentLineNum}: ${contextLines[i]}\\n`;
        }
        return context.trim();
    }

    async generateDocumentationSearchQueries(errorObj) {
        const { script, error, line, details } = errorObj;
        const model = this.modelSelect.value; // Use the selected model for query generation
        
        // Get specific line context for the LLM
        const lineContext = this.getLineContext(script, line);

        const prompt = `You are an expert After Effects ExtendScript search strategist. 
Your task is to analyze a script error and generate 2-3 highly specific, keyword-based search queries 
to find relevant official Adobe After Effects ExtendScript documentation. 
The search engine is a local vector database, so queries should be direct and technical, focusing on
API names, method names, property names, and core concepts.

**SCRIPT CONTEXT:**
\`\`\`javascript
${script}
\`\`\`

**ERROR DETAILS:**
- Error Message: ${error}
- Line Number: ${line || 'unknown'}
- Line Context:
\`\`\`javascript
${lineContext || 'Not available'}
\`\`\`
- Full Details: ${details || 'none'}

**TASK:**
Generate 2-3 search queries. Each query should be a concise string of keywords. 
Do NOT include phrases like "After Effects scripting" or "ExtendScript documentation".
Focus solely on the technical terms that will yield the most relevant API documentation for THIS SPECIFIC ERROR.

**RETURN FORMAT:**
Return only a JSON array of strings, like this:
["query 1", "query 2", "query 3"]

Example Good Queries:
- "CompItem addText method"
- "Layer transform position property"
- "footageItem fileSource"
- "app beginUndoGroup"
- "TextLayer sourceText"

Example Bad Queries (too vague or conversational):
- "how to fix undefined variable"
- "After Effects errors explained"
- "scripting guide"

Now, generate the queries for the given error:`;

        try {
            console.log("Generating RAG search queries with LLM...");
            const llmResponse = await this.callAI(prompt, model);
            
            // Attempt to parse JSON response
            const parsedResponse = JSON.parse(llmResponse);
            if (Array.isArray(parsedResponse) && parsedResponse.every(item => typeof item === 'string')) {
                console.log("LLM generated queries:", parsedResponse);
                return parsedResponse;
            } else {
                console.warn("LLM response was not an array of strings:", llmResponse);
                // Fallback to simple query generation if LLM returns unexpected format
                return this._generateSimpleQueries(script, error);
            }
        } catch (llmError) {
            console.error("Error generating queries with LLM, falling back to simple generation:", llmError);
            return this._generateSimpleQueries(script, error);
        }
    }

    // This is the fallback/original simple query generation logic
    _generateSimpleQueries(script, error) {
        const queries = [];
        
        // Extract API calls and objects from the script
        const apiMatches = script.match(/\\b(app|comp|layer|layers|position|setValue|addText|addShape|transform|opacity|Effects|content|addProperty|CompItem|AVLayer|TextLayer)\\b/g);
        if (apiMatches) {
            const uniqueApis = [...new Set(apiMatches)];
            queries.push(...uniqueApis.slice(0, 3).map(api => `${api} API documentation`));
        }
        
        // Add error-specific searches
        if (error.includes('undefined')) {
            queries.push('undefined variable error ExtendScript');
        }
        if (error.includes('null')) {
            queries.push('null reference error After Effects');
        }
        if (error.includes('property')) {
            queries.push('property access After Effects scripting');
        }
        if (error.includes('method')) {
            queries.push('method call After Effects API');
        }
        
        queries.push('error handling ExtendScript');
        queries.push('debugging After Effects scripts');
        
        return queries.slice(0, 5); // Limit to 5 queries
    }

    formatDocumentationContext(results) {
        if (!results || results.length === 0) return '';
        
        let context = '\n\n=== RELEVANT AFTER EFFECTS DOCUMENTATION ===\n\n';
        
        results.forEach((result, index) => {
            context += `**${index + 1}. ${result.title || 'Documentation'}**\n`;
            if (result.content) {
                // Truncate content to keep prompt manageable
                const truncatedContent = result.content.length > 500 
                    ? result.content.substring(0, 500) + '...' 
                    : result.content;
                context += `${truncatedContent}\n\n`;
            }
        });
        
        return context;
    }
    
    showEnhancedContextInfo() {
        const errorInfo = this.lastError || {};
        let contextInfo = '<div style="background: #1e1e1e; padding: 10px; margin-bottom: 10px; border-left: 3px solid #4CAF50; font-family: monospace; font-size: 12px;">';
        contextInfo += '<strong>🔍 Enhanced Error Context Passed to AI:</strong><br>';
        
        // Show complete error object for debugging
        contextInfo += '<div style="background: #2d2d2d; padding: 8px; margin: 5px 0; border-radius: 4px;">';
        contextInfo += '<strong>Debug - Complete Error Object:</strong><br>';
        contextInfo += `Script length: ${errorInfo.script ? errorInfo.script.length : 'N/A'} chars<br>`;
        contextInfo += `Error: ${errorInfo.error || 'N/A'}<br>`;
        contextInfo += `Line: ${errorInfo.line || 'N/A'}<br>`;
        contextInfo += `Details: ${errorInfo.details || 'N/A'}<br>`;
        contextInfo += '</div>';
        
        // Show line errors
        if (errorInfo.lineErrors && errorInfo.lineErrors.length > 0) {
            contextInfo += `<span style="color: #FF6B6B;">📍 Line-specific errors: ${errorInfo.lineErrors.length} found</span><br>`;
            errorInfo.lineErrors.forEach(lineError => {
                contextInfo += `   Line ${lineError.line}: ${lineError.error}<br>`;
            });
        } else {
            contextInfo += `<span style="color: #FFC107;">📍 Line-specific errors: None extracted</span><br>`;
        }
        
        // Show execution trace
        if (errorInfo.executionTrace && errorInfo.executionTrace.length > 0) {
            contextInfo += `<span style="color: #4CAF50;">🚀 Execution trace: ${errorInfo.executionTrace.join(' → ')}</span><br>`;
        } else {
            contextInfo += `<span style="color: #FFC107;">🚀 Execution trace: None available</span><br>`;
        }
        
        // Show error context
        if (errorInfo.errorContext && errorInfo.errorContext.multipleErrors) {
            contextInfo += `<span style="color: #2196F3;">📝 Error context: ${errorInfo.errorContext.multipleErrors.length} error sections found</span><br>`;
            errorInfo.errorContext.multipleErrors.forEach((errorSection, index) => {
                contextInfo += `<div style="background: #2d2d2d; padding: 5px; margin: 5px 0; font-size: 10px; border-left: 2px solid #FF6B6B;">`;
                contextInfo += `<strong>Error ${index + 1}: ${errorSection.error}</strong><br>`;
                contextInfo += `<em>Section: ${errorSection.section}</em><br>`;
                if (errorSection.surroundingLines && errorSection.surroundingLines.length > 0) {
                    errorSection.surroundingLines.forEach(line => {
                        const marker = line.isError ? '>>> ' : '    ';
                        const color = line.isError ? '#FF6B6B' : '#888';
                        contextInfo += `<span style="color: ${color};">${marker}${line.number}: ${line.code}</span><br>`;
                    });
                }
                contextInfo += '</div>';
            });
        } else if (errorInfo.errorContext && errorInfo.errorContext.surroundingLines) {
            contextInfo += `<span style="color: #2196F3;">📝 Error context: ${errorInfo.errorContext.surroundingLines.length} lines around error</span><br>`;
            contextInfo += '<div style="background: #2d2d2d; padding: 5px; margin: 5px 0; font-size: 10px;">';
            errorInfo.errorContext.surroundingLines.forEach(line => {
                const marker = line.isError ? '>>> ' : '    ';
                const color = line.isError ? '#FF6B6B' : '#888';
                contextInfo += `<span style="color: ${color};">${marker}${line.number}: ${line.code}</span><br>`;
            });
            contextInfo += '</div>';
        } else {
            contextInfo += `<span style="color: #FFC107;">📝 Error context: None available</span><br>`;
        }
        
        // Show what AI prompt sections are being created
        contextInfo += '<div style="background: #2d2d2d; padding: 8px; margin: 5px 0; border-radius: 4px;">';
        contextInfo += '<strong>AI Prompt Sections Created:</strong><br>';
        
        let lineSpecificSection = '';
        if (errorInfo.lineErrors && errorInfo.lineErrors.length > 0) {
            lineSpecificSection = `LINE-SPECIFIC ERRORS: ${errorInfo.lineErrors.length} errors`;
        }
        
        let executionTraceSection = '';
        if (errorInfo.executionTrace && errorInfo.executionTrace.length > 0) {
            executionTraceSection = `EXECUTION TRACE: ${errorInfo.executionTrace.join(' → ')}`;
        }
        
        let errorContextSection = '';
        if (errorInfo.errorContext && errorInfo.errorContext.multipleErrors) {
            errorContextSection = `ERROR CONTEXT: ${errorInfo.errorContext.multipleErrors.length} error sections`;
        } else if (errorInfo.errorContext && errorInfo.errorContext.surroundingLines) {
            errorContextSection = `ERROR CONTEXT: ${errorInfo.errorContext.surroundingLines.length} lines`;
        }
        
        contextInfo += `${lineSpecificSection || 'No line-specific errors'}<br>`;
        contextInfo += `${executionTraceSection || 'No execution trace'}<br>`;
        contextInfo += `${errorContextSection || 'No error context'}<br>`;
        
        // Debug: Show why error context might not be working
        contextInfo += '<br><strong>Debug Info:</strong><br>';
        contextInfo += `errorInfo.errorContext exists: ${!!errorInfo.errorContext}<br>`;
        if (errorInfo.errorContext) {
            contextInfo += `multipleErrors exists: ${!!errorInfo.errorContext.multipleErrors}<br>`;
            contextInfo += `surroundingLines exists: ${!!errorInfo.errorContext.surroundingLines}<br>`;
            
            // Show the actual error details structure
            contextInfo += `<br><strong>Error Details Debug:</strong><br>`;
            contextInfo += `Raw error length: ${errorInfo.details ? errorInfo.details.length : 'N/A'}<br>`;
            
            // Show how many parts we split the error into
            if (errorInfo.details) {
                const errorParts = errorInfo.details.split('ERROR:');
                contextInfo += `Error parts found: ${errorParts.length}<br>`;
                
                errorParts.forEach((part, index) => {
                    if (index === 0) return;
                    contextInfo += `Part ${index}: ${part.substring(0, 50)}...<br>`;
                });
            }
        }
        contextInfo += '</div>';
        
        contextInfo += '</div>';
        
        this.analysisDiv.innerHTML = contextInfo + '<div style="color: #FFC107;">🤖 Analyzing script and error...</div>';
    }

    createAnalysisPrompt(script, error, line, details, documentationContext = '') {
        const errorInfo = this.lastError || {};
        
        let lineSpecificSection = '';
        if (errorInfo.lineErrors && errorInfo.lineErrors.length > 0) {
            lineSpecificSection = `\n**LINE-SPECIFIC ERRORS:**\n`;
            errorInfo.lineErrors.forEach(lineError => {
                lineSpecificSection += `- **Line ${lineError.line}**: ${lineError.error}\n`;
                lineSpecificSection += `  Code: \`${lineError.code}\`\n`;
            });
        }
        
        let executionTraceSection = '';
        if (errorInfo.executionTrace && errorInfo.executionTrace.length > 0) {
            executionTraceSection = `\n**EXECUTION TRACE:**\nScript executed through lines: ${errorInfo.executionTrace.join(' → ')}\n`;
        }
        
        let errorContextSection = '';
        if (errorInfo.errorContext && errorInfo.errorContext.surroundingLines) {
            errorContextSection = `\n**ERROR CONTEXT:**\n`;
            errorInfo.errorContext.surroundingLines.forEach(contextLine => {
                const marker = contextLine.isError ? '>>> ' : '    ';
                errorContextSection += `${marker}${contextLine.number}: ${contextLine.code}\n`;
            });
        }
        
        return `You are an expert After Effects ExtendScript developer with deep knowledge of the Adobe After Effects scripting API. I have a script that failed to execute and need your expert analysis and fix.

**⚠️ CRITICAL AFTER EFFECTS EXTENDSCRIPT RULES - FOLLOW EXACTLY:**

**🔧 EXACT API NAMING (NO VARIATIONS ALLOWED):**
- Use \`app.project.activeItem\` NOT \`app.project.activeComp\` or \`app.activeComp\`
- Use \`addProperty("ADBE Fill")\` NOT \`addProperty("Fill")\`
- Use \`app.beginUndoGroup()\` NOT \`app.startUndoGroup()\`
- Use \`app.endUndoGroup()\` NOT \`app.finishUndoGroup()\`
- Use \`setValue([x, y])\` NOT \`setValue(x, y)\` for position/point properties
- Use \`sourceText.setValue()\` NOT \`text.setValue()\` for text layers
- Use \`property("ADBE Transform Group")\` NOT \`property("Transform")\`

**🔧 SYNTAX RULES (ES3 COMPATIBILITY):**
- ALWAYS use \`var\` declarations (NEVER use \`let\` or \`const\`)
- NEVER use arrow functions \`() => {}\`
- ALWAYS use \`function() {}\` syntax
- ALWAYS end statements with semicolons
- Use \`typeof variable !== "undefined"\` NOT \`variable !== undefined\`
- String concatenation: Use \`+\` operator, NOT template literals

**🔧 COMMON PROPERTY MATCH NAMES:**
- Position: \`"ADBE Position"\`
- Scale: \`"ADBE Scale"\`
- Rotation: \`"ADBE Rotate Z"\`
- Opacity: \`"ADBE Opacity"\`
- Fill Effect: \`"ADBE Fill"\`
- Stroke Effect: \`"ADBE Stroke"\`
- Transform Group: \`"ADBE Transform Group"\`

**🔧 NULL CHECKS AND TYPE VALIDATION:**
\`\`\`javascript
// ALWAYS check activeItem exists and type
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
    $.writeln("ERROR: No active composition");
    return;
}

// ALWAYS check layer exists before accessing
var layer = comp.layer(1);
if (!layer) {
    $.writeln("ERROR: Layer not found");
    return;
}
\`\`\`

**🔧 COMMON MISTAKES TO AVOID:**
❌ \`app.project.activeComp\` → ✅ \`app.project.activeItem\`
❌ \`layer.addProperty("Fill")\` → ✅ \`layer.property("ADBE Effect Parade").addProperty("ADBE Fill")\`
❌ \`layer.opacity = 50\` → ✅ \`layer.transform.opacity.setValue(50)\`
❌ \`position.setValue(100, 200)\` → ✅ \`position.setValue([100, 200])\`
❌ \`alert("message")\` → ✅ \`$.writeln("message")\`
❌ \`const myVar = 5\` → ✅ \`var myVar = 5\`

**🎨 COLOR ARRAY RULES:**
❌ \`fillColor.setValue([1, 0, 0, 1])\` → ✅ \`fillColor.setValue([1, 0, 0])\`
❌ \`textDoc.fillColor = [1, 0, 0, 1]\` → ✅ \`textDoc.fillColor = [1, 0, 0]\`
Rule: Most AE properties expect RGB (3 elements), not RGBA (4 elements)

**🧮 NUMERIC VALIDATION RULES:**
❌ \`position.setValue([comp.width/2, comp.height/2])\` → ✅ Always validate:
\`\`\`javascript
var centerX = Number(comp.width) / 2;
var centerY = Number(comp.height) / 2;
if (isNaN(centerX) || !isFinite(centerX) || isNaN(centerY) || !isFinite(centerY)) {
    throw new Error("Invalid center calculation");
}
position.setValue([centerX, centerY]);
\`\`\`

**🔗 PROPERTY CHAIN SAFETY:**
❌ \`layer.property("ADBE Root Vectors Group").property("ADBE Vector Group").property("ADBE Vector Fill Color")\`
✅ Validate each step:
\`\`\`javascript
var rootVectors = layer.property("ADBE Root Vectors Group");
if (!rootVectors) throw new Error("No root vectors group");
var vectorGroup = rootVectors.property("ADBE Vector Group");
if (!vectorGroup) throw new Error("No vector group");
var fillColor = vectorGroup.property("ADBE Vector Fill Color");
\`\`\`

**📝 TEXT DOCUMENT RULES:**
❌ \`layer.property("Source Text").value.text = "New Text"\` (Can't modify in place)
✅ Get-modify-set pattern:
\`\`\`javascript
var textDoc = layer.property("ADBE Text Properties").property("ADBE Text Document");
var td = textDoc.value;
td.text = "New Text";
td.fontSize = 16;
textDoc.setValue(td);
\`\`\`

**⚡ ANIMATION EASING RULES:**
Rule: Match ease object count to property dimensions
\`\`\`javascript
// 1D properties (opacity, rotation): 1 ease object
var ease1D = [new KeyframeEase(0.8, 90)];
opacityProp.setTemporalEaseAtKey(1, ease1D, ease1D);

// 2D properties (scale, position): 2 ease objects
var ease2D = [new KeyframeEase(0.8, 90), new KeyframeEase(0.8, 90)];
scaleProp.setTemporalEaseAtKey(1, ease2D, ease2D);
\`\`\`

**🎯 LAYER PROPERTY DIFFERENCES:**
Rule: Different layer types have different available properties
\`\`\`javascript
// Text layers may not have all transform properties
var transform = layer.property("ADBE Transform Group");
var rotation = transform ? transform.property("ADBE Rotate Z") : null;
if (rotation) {
    rotation.setValue(45);
} else {
    $.writeln("Rotation not available on " + layer.name);
}
\`\`\`

**🔄 UNDO GROUP RULES:**
❌ Forgetting undo grouping → ✅ Always wrap:
\`\`\`javascript
app.beginUndoGroup("My Script Action");
try {
    // All operations here
} catch (error) {
    $.writeln("ERROR: " + error.toString());
} finally {
    app.endUndoGroup(); // Always end, even on error
}
\`\`\`

**ANALYSIS REQUIRED:**

1. **🔍 Error Analysis**: What went wrong and why (be specific about the root cause)
2. **📍 Line-by-Line Issues**: Identify problematic lines with detailed explanations
3. **📚 Documentation References**: For each issue, provide relevant After Effects API documentation and correct usage patterns
4. **🔧 Fixed Script**: A completely corrected and improved version of the script
5. **💡 Best Practices**: Professional recommendations to prevent similar issues

**ORIGINAL SCRIPT:**
\`\`\`javascript
${script}
\`\`\`

**ERROR DETAILS:**
- **Error Message**: ${error}
- **Line Number**: ${line || 'unknown'}
- **Full Details**: ${details || 'none'}
${lineSpecificSection}${executionTraceSection}${errorContextSection}

${documentationContext}

**RESPONSE FORMAT REQUIREMENTS:**

Please format your response in HTML with these specific styling classes:
- Use <div class="error-line"> for error explanations and problems
- Use <div class="suggestion"> for fixes, improvements, and solutions
- Use <div class="documentation"> for API documentation references and usage examples
- Provide the complete fixed script in a code block with triple backticks followed by 'javascript'
- CRITICAL ERROR HANDLING: In the fixed script, follow these requirements:
  * NEVER use alert(), confirm(), or any popup dialogs
  * ALWAYS use \`$.writeln()\` for output that should appear in the output box
  * Wrap ALL operations in try-catch blocks
  * Use \`$.writeln("ERROR: [specific error message]")\` for any failures
  * Use \`$.writeln("SUCCESS: [description]")\` for successful operations
  * Example pattern: try { /* operations */ $.writeln("SUCCESS: Operation completed"); } catch (error) { $.writeln("ERROR: " + error.toString()); }

**QUALITY STANDARDS:**
- Be thorough and precise in your analysis
- Reference the provided documentation context for accurate API usage
- Ensure the fixed script follows After Effects scripting best practices
- Include error handling and null checks where appropriate
- Provide working, production-ready code that won't fail

Focus on delivering a professional-grade analysis with practical, actionable solutions backed by official After Effects API documentation.`;
    }

    async callAI(prompt, model) {
        // Use the same AI calling mechanism as other tabs
        if (model === 'gemini') {
            return await this.callGemini(prompt);
        } else if (model === 'claude') {
            return await this.callClaude(prompt);
        } else if (model === 'o4-mini') {
            return await this.callOpenAI(prompt);
        } else {
            throw new Error('Unsupported model');
        }
    }

    getCurrentApiKey() {
        const model = this.modelSelect.value;
        if (model === 'gemini') {
            return localStorage.getItem('gemini_api_key') || '';
        } else if (model === 'claude') {
            return localStorage.getItem('claude_api_key') || '';
        } else {
            // Try to get OpenAI key from global geminiChat instance if available
            let openaiKey = localStorage.getItem('openai_api_key');
            if (!openaiKey && window.geminiChat && window.geminiChat.openaiApiKey) {
                openaiKey = window.geminiChat.openaiApiKey;
            }
            return openaiKey;
        }
    }

    async callClaude(prompt) {
        const apiKey = this.getCurrentApiKey();
        if (!apiKey) {
            throw new Error('No Claude API key available');
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Claude API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async callGemini(prompt) {
        const apiKey = this.getCurrentApiKey();
        if (!apiKey) {
            throw new Error('No Gemini API key available');
        }

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4000,
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Gemini API Error ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Unexpected Gemini API response format');
        }
    }

    async callOpenAI(prompt) {
        const apiKey = this.getCurrentApiKey();
        if (!apiKey) {
            throw new Error('No OpenAI API key available');
        }

        const payload = {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert After Effects ExtendScript developer who provides detailed error analysis and fixes."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 4000
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`OpenAI API Error ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Unexpected OpenAI API response format');
        }
    }

    displayAnalysis(analysis) {
        console.log('Full AI Analysis Response:', analysis);
        
        // Multiple patterns to extract the fixed script
        let fixedScript = '';
        
        // Pattern 1: Look for the main script block (usually the largest one)
        const allCodeBlocks = analysis.match(/```(?:javascript|js)?\s*([\s\S]*?)```/g);
        if (allCodeBlocks && allCodeBlocks.length > 0) {
            // Find the longest code block (likely the full script)
            let longestBlock = '';
            allCodeBlocks.forEach(block => {
                const content = block.replace(/```(?:javascript|js)?\s*/, '').replace(/```$/, '').trim();
                if (content.length > longestBlock.length && content.includes('function') || content.includes('var ') || content.includes('app.')) {
                    longestBlock = content;
                }
            });
            fixedScript = longestBlock;
        }
        
        // Pattern 2: Look specifically for "FixED SCRIPT" or similar sections
        if (!fixedScript) {
            const fixedSectionMatch = analysis.match(/(?:FixED SCRIPT|FIXED SCRIPT|CORRECTED SCRIPT)[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/i);
            if (fixedSectionMatch) {
                fixedScript = fixedSectionMatch[1].trim();
            }
        }
        
        // Pattern 3: Look for function definitions or main script blocks
        if (!fixedScript) {
            const functionMatch = analysis.match(/```(?:javascript|js)?\s*(function[\s\S]*?)```/);
            if (functionMatch) {
                fixedScript = functionMatch[1].trim();
            }
        }

        // Display the analysis (remove all code blocks for main analysis display)
        const analysisWithoutCode = analysis.replace(/```(?:javascript|js)?[\s\S]*?```/g, '');
        
        // Always show the formatted analysis
        this.analysisDiv.innerHTML = this.formatAnalysis(analysisWithoutCode);

        // Set the fixed script
        if (fixedScript && fixedScript.length > 50) { // Ensure it's a substantial script, not just a snippet
            console.log('Extracted fixed script:', fixedScript.substring(0, 100) + '...');
            this.fixedScriptTextarea.value = fixedScript;
            this.copyFixedBtn.disabled = false;
            this.runFixedBtn.disabled = false;
        } else {
            console.warn('No substantial fixed script found. Available code blocks:', allCodeBlocks);
            this.fixedScriptTextarea.value = 'No complete fixed script found in AI response. Please check the analysis above for code snippets.';
            this.copyFixedBtn.disabled = true;
            this.runFixedBtn.disabled = true;
        }
    }

    formatAnalysis(analysis) {
        // Convert markdown-style formatting to HTML with our CSS classes
        let formatted = analysis
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // Wrap in paragraph tags
        formatted = '<p>' + formatted + '</p>';

        // Add CSS classes for better styling
        formatted = formatted
            .replace(/<p>(.*)Error(.*?)<\/p>/gi, '<div class="error-line">$1Error$2</div>')
            .replace(/<p>(.*)Fix(.*?)<\/p>/gi, '<div class="suggestion">$1Fix$2</div>')
            .replace(/<p>(.*)Documentation(.*?)<\/p>/gi, '<div class="documentation">$1Documentation$2</div>')
            .replace(/<p>(.*)API(.*?)<\/p>/gi, '<div class="documentation">$1API$2</div>');

        return formatted;
    }

    showAISection() {
        this.aiSection.style.display = 'block';
    }

    hideAISection() {
        this.aiSection.style.display = 'none';
        this.analysisDiv.innerHTML = '';
        this.fixedScriptTextarea.value = '';
        this.copyFixedBtn.disabled = true;
        this.runFixedBtn.disabled = true;
    }

    copyFixedScript() {
        const script = this.fixedScriptTextarea.value;
        if (script && script !== 'No fixed script provided by AI.') {
            navigator.clipboard.writeText(script).then(() => {
                // Visual feedback
                const originalText = this.copyFixedBtn.textContent;
                this.copyFixedBtn.textContent = '✓';
                setTimeout(() => {
                    this.copyFixedBtn.textContent = originalText;
                }, 1000);
            });
        }
    }

    async runFixedScript() {
        const script = this.fixedScriptTextarea.value;
        if (!script || script === 'No fixed script provided by AI.') {
            this.showError('No fixed script to run.');
            return;
        }

        // Set the fixed script in the main input and run it
        this.scriptInput.value = script;
        await this.executeScript();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a page with the script runner elements
    if (document.getElementById('runnerScript')) {
        window.scriptRunner = new ScriptRunner();
    }
}); 