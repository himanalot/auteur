import React, { useEffect, useRef } from 'react';

// Extend Window interface to include the setup function
declare global {
  interface Window {
    setupOriginalScriptGenerator: () => void;
    originalScriptGenerator: any;
  }
}

const OriginalScriptGeneratorTab: React.FC = () => {
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the original script generator when component mounts
    if (tabRef.current && window.setupOriginalScriptGenerator) {
      console.log('✅ Setting up Original Script Generator Tab');
      window.setupOriginalScriptGenerator();
    }
  }, []);

  return (
    <div ref={tabRef} id="originalScriptTab" className="tab-content">
      <div className="script-generator-container">
        <h3>🎬 Original Script Generator (Working Version)</h3>
        <p>This is the exact working version of the script generator from the previous commit.</p>
        
        <div className="script-input-section">
          <div className="script-header-row">
            <label htmlFor="originalScriptRequest">What do you want to create?</label>
            <div className="script-model-selector">
              <label htmlFor="originalScriptModelSelect">Model:</label>
              <select id="originalScriptModelSelect" className="model-dropdown">
                <option value="gemini">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="o4-mini">OpenAI o4-mini</option>
              </select>
            </div>
          </div>
          
          <textarea
            id="originalScriptRequest"
            className="script-request"
            placeholder="Example: Create 5 colorful squares that bounce around the screen with different speeds and sizes. Add some particle effects and make them glow when they hit the edges."
            rows={4}
          />
          
          <div className="context-section">
            <label>Project Context (optional):</label>
            <div className="context-controls">
              <button id="originalExportProjectBtn" className="context-btn">
                <span className="btn-icon">📄</span>
                Export Project JSON
              </button>
              <button id="originalDownloadJsonBtn" className="context-btn" style={{ display: 'none' }}>
                <span className="btn-icon">⬇️</span>
                Download JSON
              </button>
              <label htmlFor="originalScreenshotUpload" className="context-btn">
                <span className="btn-icon">📷</span>
                Add Screenshot
                <input
                  type="file"
                  id="originalScreenshotUpload"
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </label>
              <button id="originalClearContextBtn" className="context-btn">
                <span className="btn-icon">🗑️</span>
                Clear Context
              </button>
            </div>
            <div id="originalContextPreview" className="context-preview"></div>
          </div>
          
          <button id="originalGenerateScript" className="generate-btn">
            🪄 Generate Script
          </button>
        </div>
        
        <div className="script-output-section">
          <div className="script-header">
            <label htmlFor="originalGeneratedScript">Generated ExtendScript:</label>
            <div className="script-actions">
              <button id="originalRunScript" className="run-btn">
                ▶️ Run Script
              </button>
              <button id="originalCopyScript" className="copy-btn">
                📋 Copy
              </button>
              <button id="originalClearScript" className="clear-btn">
                🗑️ Clear
              </button>
            </div>
          </div>
          <textarea
            id="originalGeneratedScript"
            className="generated-script"
            placeholder="Generated ExtendScript will appear here..."
            rows={15}
          />
        </div>
        
        <div className="script-status">
          <span id="originalScriptStatus" className="script-status-text">Ready</span>
        </div>
        
        <div className="script-results">
          <h4>Execution Results:</h4>
          <div id="originalScriptResults" className="script-results-output">
            {/* Results will be populated after script execution */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OriginalScriptGeneratorTab;