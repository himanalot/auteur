import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setIsProcessing, setStatus, setSelectedModel } from '../../store/appSlice';

const ScriptRunnerTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedModel, isProcessing, status } = useAppSelector((state) => state.app);
  const [script, setScript] = useState('// Paste your ExtendScript code here...\n// Example:\nvar comp = app.project.activeItem;\nif (comp && comp instanceof CompItem) {\n    var layer = comp.layers.addText(\'Hello World\');\n    layer.position.setValue([comp.width/2, comp.height/2]);\n}');
  const [results, setResults] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [fixedScript, setFixedScript] = useState('');
  const [showAiSection, setShowAiSection] = useState(false);

  const handleExecuteScript = async () => {
    if (!script.trim()) return;

    dispatch(setIsProcessing(true));
    dispatch(setStatus('Executing script...'));

    try {
      // Use the same executeScriptSilent pattern as the working Script Generator
      if (typeof window !== 'undefined' && (window as any).executeScriptSilent) {
        const result = await (window as any).executeScriptSilent(script);
        console.log('🎬 Script execution result:', result);

        // Try to parse the result to see if it's a JSON response
        let parsedResult;
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {
          // Not JSON, treat as plain text
          parsedResult = { success: true, message: result || 'Script executed successfully' };
        }

        if (parsedResult.success === false) {
          const errorResult = {
            success: false,
            error: parsedResult.message || result,
            timestamp: new Date().toISOString()
          };
          setResults(JSON.stringify(errorResult, null, 2));
          setShowAiSection(true);
          dispatch(setStatus('Script execution failed'));
        } else {
          const successResult = {
            success: true,
            output: parsedResult.message || 'Script executed successfully',
            timestamp: new Date().toISOString()
          };
          setResults(JSON.stringify(successResult, null, 2));
          dispatch(setStatus('Script executed successfully'));
        }
      } else {
        // Fallback if executeScriptSilent is not available
        const errorResult = {
          success: false,
          error: 'executeScriptSilent function not available - extension may not be properly loaded',
          timestamp: new Date().toISOString()
        };
        setResults(JSON.stringify(errorResult, null, 2));
        setShowAiSection(true);
        dispatch(setStatus('Execution failed'));
      }
      
      dispatch(setIsProcessing(false));
    } catch (error) {
      console.error('Script execution error:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setResults(JSON.stringify(errorResult, null, 2));
      setShowAiSection(true);
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Execution failed'));
    }
  };

  const handleClearScript = () => {
    setScript('');
    setResults('');
    setAnalysis('');
    setFixedScript('');
    setShowAiSection(false);
    dispatch(setStatus('Ready'));
  };

  const handleFeedToAI = async () => {
    if (!results) return;

    dispatch(setIsProcessing(true));
    dispatch(setStatus('Analyzing with AI...'));
    setShowAiSection(true);

    try {
      // This will be implemented with the actual AI analysis logic
      setTimeout(() => {
        const mockAnalysis = `
## Error Analysis

The script execution encountered issues. Here's what I found:

### Issues Identified:
1. **Syntax Error**: Missing semicolon on line 3
2. **API Usage**: Incorrect method call for layer creation
3. **Error Handling**: Missing try-catch blocks

### Recommendations:
- Add proper error handling with try-catch blocks
- Use correct After Effects API methods
- Add null checks for composition objects

### Performance Optimizations:
- Use app.beginUndoGroup() and app.endUndoGroup()
- Cache frequently used objects
- Minimize DOM manipulations`;

        const mockFixedScript = `// Fixed ExtendScript
app.beginUndoGroup("Fixed Script");

try {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        var textLayer = comp.layers.addText("Hello World");
        textLayer.position.setValue([comp.width/2, comp.height/2]);
        alert("Script executed successfully!");
    } else {
        alert("Please select a composition first");
    }
} catch (error) {
    alert("Error: " + error.toString());
}

app.endUndoGroup();`;

        setAnalysis(mockAnalysis);
        setFixedScript(mockFixedScript);
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Analysis complete'));
      }, 2000);
    } catch (error) {
      console.error('AI analysis error:', error);
      setAnalysis('Error analyzing script: ' + (error instanceof Error ? error.message : 'Unknown error'));
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Analysis failed'));
    }
  };

  const handleCopyResults = () => {
    if (results) {
      navigator.clipboard.writeText(results);
      dispatch(setStatus('Results copied to clipboard'));
    }
  };

  const handleCopyFixed = () => {
    if (fixedScript) {
      navigator.clipboard.writeText(fixedScript);
      dispatch(setStatus('Fixed script copied to clipboard'));
    }
  };

  const handleRunFixed = async () => {
    if (!fixedScript.trim()) return;

    dispatch(setIsProcessing(true));
    dispatch(setStatus('Running fixed script...'));

    try {
      // Use the same executeScriptSilent pattern for fixed script execution
      if (typeof window !== 'undefined' && (window as any).executeScriptSilent) {
        const result = await (window as any).executeScriptSilent(fixedScript);
        console.log('🎬 Fixed script execution result:', result);

        // Try to parse the result to see if it's a JSON response
        let parsedResult;
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {
          // Not JSON, treat as plain text
          parsedResult = { success: true, message: result || 'Fixed script executed successfully' };
        }

        if (parsedResult.success === false) {
          dispatch(setStatus('Fixed script execution failed'));
          // Could update results here if needed
        } else {
          dispatch(setStatus('Fixed script executed successfully'));
        }
      } else {
        dispatch(setStatus('executeScriptSilent function not available'));
      }
      
      dispatch(setIsProcessing(false));
    } catch (error) {
      console.error('Fixed script execution error:', error);
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Fixed execution failed'));
    }
  };

  return (
    <div id="runnerTab" className="tab-content">
      <div className="script-runner-container">
        <h3>🚀 Script Runner & Error Analyzer</h3>
        <p>Paste your ExtendScript code, run it in After Effects, and get AI-enhanced error analysis with documentation!</p>
        
        <div className="runner-input-section">
          <div className="runner-header-row">
            <label htmlFor="runnerScript">ExtendScript Code:</label>
            <div className="runner-controls">
              <button
                id="runnerExecute"
                className="runner-execute-btn"
                onClick={handleExecuteScript}
                disabled={isProcessing}
              >
                <span className="btn-icon">▶️</span>
                Run Script
              </button>
              <button
                id="runnerClear"
                className="runner-clear-btn"
                onClick={handleClearScript}
              >
                <span className="btn-icon">🗑️</span>
                Clear
              </button>
              <button
                id="runnerFeed"
                className="runner-feed-btn"
                onClick={handleFeedToAI}
                disabled={!results || isProcessing}
              >
                <span className="btn-icon">🤖</span>
                Feed to AI
              </button>
            </div>
          </div>
          
          <textarea
            id="runnerScript"
            className="runner-script-input"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={10}
          />
        </div>
        
        <div className="runner-results-section">
          <div className="runner-results-header">
            <label>Execution Results:</label>
            <div className="runner-result-controls">
              <span id="runnerStatus" className="runner-status">{status}</span>
              <button
                id="runnerCopyResults"
                className="runner-copy-btn"
                onClick={handleCopyResults}
                disabled={!results}
                title="Copy Results"
              >
                📋
              </button>
            </div>
          </div>
          <div id="runnerResults" className="runner-results-output">
            <pre>{results}</pre>
          </div>
        </div>
        
        <div
          className="runner-ai-section"
          id="runnerAiSection"
          style={{ display: showAiSection ? 'block' : 'none' }}
        >
          <div className="runner-ai-header">
            <label>AI Analysis & Fixed Script:</label>
            <div className="runner-ai-controls">
              <div className="runner-model-selector">
                <label htmlFor="runnerModelSelect">Model:</label>
                <select
                  id="runnerModelSelect"
                  className="model-dropdown"
                  value={selectedModel}
                  onChange={(e) => dispatch(setSelectedModel(e.target.value))}
                >
                  <option value="claude">Claude Sonnet 4</option>
                  <option value="gemini">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="o4-mini">OpenAI o4-mini</option>
                </select>
              </div>
              <button
                id="runnerCopyFixed"
                className="runner-copy-btn"
                onClick={handleCopyFixed}
                disabled={!fixedScript}
                title="Copy Fixed Script"
              >
                📋
              </button>
              <button
                id="runnerRunFixed"
                className="runner-run-btn"
                onClick={handleRunFixed}
                disabled={!fixedScript || isProcessing}
                title="Run Fixed Script"
              >
                ▶️
              </button>
            </div>
          </div>
          
          <div className="runner-ai-content">
            <div id="runnerAnalysis" className="runner-analysis">
              <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br>') }} />
            </div>
            <div className="runner-fixed-script-container">
              <label>Fixed Script:</label>
              <textarea
                id="runnerFixedScript"
                className="runner-fixed-script"
                value={fixedScript}
                onChange={(e) => setFixedScript(e.target.value)}
                rows={12}
                placeholder="AI-generated fixed script will appear here..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptRunnerTab;