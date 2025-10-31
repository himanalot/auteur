import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setIsProcessing, setStatus, setSelectedModel } from '../../store/appSlice';

const ScriptGeneratorTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedModel, isProcessing, status } = useAppSelector((state) => state.app);
  const [scriptRequest, setScriptRequest] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [contextPreview, setContextPreview] = useState('');
  const [projectJson, setProjectJson] = useState<string | null>(null);

  const handleGenerateScript = async () => {
    if (!scriptRequest.trim()) return;

    dispatch(setIsProcessing(true));
    dispatch(setStatus('Generating script...'));

    try {
      // This will be implemented with the actual script generation logic
      // For now, just a placeholder response
      setTimeout(() => {
        const placeholder = `// Generated ExtendScript for: ${scriptRequest}
// This is a placeholder - actual implementation needed

app.beginUndoGroup("Generated Script");

try {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        // Script implementation would go here
        alert("Script execution placeholder");
    } else {
        alert("Please select a composition first");
    }
} catch (error) {
    alert("Error: " + error.toString());
}

app.endUndoGroup();`;
        
        setGeneratedScript(placeholder);
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Script generated'));
      }, 2000);
    } catch (error) {
      console.error('Script generation error:', error);
      setGeneratedScript('// Error generating script: ' + (error instanceof Error ? error.message : 'Unknown error'));
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Generation failed'));
    }
  };

  const handleRunScript = async () => {
    if (!generatedScript.trim()) return;

    dispatch(setIsProcessing(true));
    dispatch(setStatus('Running script...'));

    try {
      // Use the same executeScriptSilent pattern as the working Script Generator
      if (typeof window !== 'undefined' && (window as any).executeScriptSilent) {
        const result = await (window as any).executeScriptSilent(generatedScript);
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
          dispatch(setStatus('Script execution failed'));
          // Update results display if there's a results element
          const resultsElement = document.getElementById('scriptResults');
          if (resultsElement) {
            resultsElement.innerHTML = `❌ Script Error: ${parsedResult.message || result}`;
            resultsElement.className = 'script-results-output error';
          }
        } else {
          dispatch(setStatus('Script executed successfully'));
          // Update results display if there's a results element
          const resultsElement = document.getElementById('scriptResults');
          if (resultsElement) {
            resultsElement.innerHTML = `✅ Success: ${parsedResult.message || 'Script completed successfully'}`;
            resultsElement.className = 'script-results-output success';
          }
        }
      } else {
        dispatch(setStatus('executeScriptSilent function not available'));
        const resultsElement = document.getElementById('scriptResults');
        if (resultsElement) {
          resultsElement.innerHTML = '❌ executeScriptSilent function not available - extension may not be properly loaded';
          resultsElement.className = 'script-results-output error';
        }
      }
      
      dispatch(setIsProcessing(false));
    } catch (error) {
      console.error('Script execution error:', error);
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Execution failed'));
      const resultsElement = document.getElementById('scriptResults');
      if (resultsElement) {
        resultsElement.innerHTML = `❌ Execution Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        resultsElement.className = 'script-results-output error';
      }
    }
  };

  const handleCopyScript = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
      dispatch(setStatus('Script copied to clipboard'));
    }
  };

  const handleClearScript = () => {
    setGeneratedScript('');
    dispatch(setStatus('Script cleared'));
  };

  const handleExportProject = async () => {
    dispatch(setIsProcessing(true));
    dispatch(setStatus('Exporting project...'));

    try {
      // This will be implemented with the actual project export logic
      setTimeout(() => {
        const mockProject = {
          name: 'Mock Project',
          compositions: [
            { name: 'Main Comp', width: 1920, height: 1080, duration: 10 },
            { name: 'Sub Comp', width: 1280, height: 720, duration: 5 }
          ],
          layers: [
            { name: 'Background', type: 'solid' },
            { name: 'Text Layer', type: 'text' }
          ]
        };
        
        setProjectJson(JSON.stringify(mockProject, null, 2));
        setContextPreview('Project exported successfully');
        dispatch(setIsProcessing(false));
        dispatch(setStatus('Project exported'));
      }, 1000);
    } catch (error) {
      console.error('Project export error:', error);
      setContextPreview('Error exporting project: ' + (error instanceof Error ? error.message : 'Unknown error'));
      dispatch(setIsProcessing(false));
      dispatch(setStatus('Export failed'));
    }
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          setContextPreview(`Screenshot uploaded: ${file.name}`);
          dispatch(setStatus('Screenshot added'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearContext = () => {
    setContextPreview('');
    setProjectJson(null);
    dispatch(setStatus('Context cleared'));
  };

  return (
    <div id="scriptTab" className="tab-content">
      <div className="script-generator-container">
        <h3>🎬 Script Generator</h3>
        <p>Describe what you want to create and the AI Agent will generate a complete ExtendScript using RAG tool calls for documentation!</p>
        
        <div className="script-input-section">
          <div className="script-header-row">
            <label htmlFor="scriptRequest">What do you want to create?</label>
            <div className="script-model-selector">
              <label htmlFor="scriptModelSelect">Model:</label>
              <select
                id="scriptModelSelect"
                className="model-dropdown"
                value={selectedModel}
                onChange={(e) => dispatch(setSelectedModel(e.target.value))}
              >
                <option value="gemini">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="o4-mini">OpenAI o4-mini</option>
              </select>
            </div>
          </div>
          
          <textarea
            id="scriptRequest"
            className="script-request"
            placeholder="Example: Create 5 colorful squares that bounce around the screen with different speeds and sizes. Add some particle effects and make them glow when they hit the edges."
            value={scriptRequest}
            onChange={(e) => setScriptRequest(e.target.value)}
            rows={4}
          />
          
          <div className="context-section">
            <label>Project Context (optional):</label>
            <div className="context-controls">
              <button
                id="exportProjectBtn"
                className="context-btn"
                onClick={handleExportProject}
                disabled={isProcessing}
              >
                <span className="btn-icon">📄</span>
                Export Project JSON
              </button>
              <button
                id="downloadJsonBtn"
                className="context-btn"
                style={{ display: projectJson ? 'inline-block' : 'none' }}
                onClick={() => {
                  if (projectJson) {
                    const blob = new Blob([projectJson], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'project.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                <span className="btn-icon">⬇️</span>
                Download JSON
              </button>
              <label htmlFor="screenshotUpload" className="context-btn">
                <span className="btn-icon">📷</span>
                Add Screenshot
                <input
                  type="file"
                  id="screenshotUpload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleScreenshotUpload}
                />
              </label>
              <button
                id="clearContextBtn"
                className="context-btn"
                onClick={handleClearContext}
              >
                <span className="btn-icon">🗑️</span>
                Clear Context
              </button>
            </div>
            <div id="contextPreview" className="context-preview">
              {contextPreview}
            </div>
          </div>
          
          <button
            id="generateScript"
            className="generate-btn"
            onClick={handleGenerateScript}
            disabled={isProcessing || !scriptRequest.trim()}
          >
            🪄 Generate Script
          </button>
        </div>
        
        <div className="script-output-section">
          <div className="script-header">
            <label htmlFor="generatedScript">Generated ExtendScript:</label>
            <div className="script-actions">
              <button
                id="runScript"
                className="run-btn"
                onClick={handleRunScript}
                disabled={isProcessing || !generatedScript.trim()}
              >
                ▶️ Run Script
              </button>
              <button
                id="copyScript"
                className="copy-btn"
                onClick={handleCopyScript}
                disabled={!generatedScript.trim()}
              >
                📋 Copy
              </button>
              <button
                id="clearScript"
                className="clear-btn"
                onClick={handleClearScript}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          <textarea
            id="generatedScript"
            className="generated-script"
            placeholder="Generated ExtendScript will appear here..."
            value={generatedScript}
            onChange={(e) => setGeneratedScript(e.target.value)}
            rows={15}
          />
        </div>
        
        <div className="script-status">
          <span id="scriptStatus" className="script-status-text">{status}</span>
        </div>
        
        <div className="script-results">
          <h4>Execution Results:</h4>
          <div id="scriptResults" className="script-results-output">
            {/* Results will be populated after script execution */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptGeneratorTab;