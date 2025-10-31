import React, { useState } from 'react';

declare global {
  interface Window {
    executeScriptSilent: (script: string) => Promise<any>;
  }
}

const ScriptTestTab: React.FC = () => {
  const [script, setScript] = useState(`app.beginUndoGroup("Test Script");

var executionLog = [];

// Helper function for logging that displays messages in execution result
function logStep(message) {
    executionLog.push(message);
    $.writeln(message);
}

// Start logging
logStep("⏳ Begin Undo Group: Test Script");

try {
    logStep("🚀 Starting test...");
    logStep("📊 This is a test message");
    logStep("✅ Test completed successfully!");
    
} catch (error) {
    logStep("❗ ERROR: " + error.toString());
    
} finally {
    app.endUndoGroup();
    logStep("⏹️ End Undo Group: Test Script");
    logStep("🏁 Script execution complete");
}

// Return the execution log as JSON
JSON.stringify({
    success: true,
    message: "Script execution complete",
    executionLog: executionLog.join("\\n")
});`);
  
  const [result, setResult] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const executeScript = async () => {
    if (!script.trim()) {
      setResult('❌ Please enter a script to execute');
      return;
    }

    setIsExecuting(true);
    setResult('🔄 Executing script...');

    try {
      const startTime = Date.now();
      const scriptResult = await window.executeScriptSilent(script);
      const executionTime = Date.now() - startTime;

      let resultText = `📊 Execution Result:\n`;
      resultText += `✅ Script executed successfully!\n\n`;
      resultText += `Result: ${scriptResult || 'No return value'}\n`;
      resultText += `Execution time: ${executionTime}ms\n\n`;
      
      // Try to parse if it's JSON
      try {
        const parsed = JSON.parse(scriptResult);
        if (parsed.executionLog) {
          resultText += `📋 Execution Log:\n${parsed.executionLog}\n\n`;
        }
        if (parsed.success !== undefined) {
          resultText += `Status: ${parsed.success ? 'Success' : 'Failed'}\n`;
        }
        if (parsed.message) {
          resultText += `Message: ${parsed.message}\n`;
        }
      } catch (e) {
        // Not JSON, just show the result as is
        if (scriptResult && scriptResult !== 'undefined') {
          resultText += `Output: ${scriptResult}\n`;
        }
      }

      setResult(resultText);
    } catch (error) {
      const errorText = `❌ Script execution failed!\n\nError: ${error}\n\nThis could be due to:\n• Syntax errors in the script\n• Missing After Effects context\n• ExtendScript API issues`;
      setResult(errorText);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearResult = () => {
    setResult('');
  };

  const loadTestScript = () => {
    setScript(`app.beginUndoGroup("Create New Composition");

var executionLog = [];

// Helper function for logging that displays messages in execution result
function logStep(message) {
    executionLog.push(message);
    $.writeln(message);
}

// Start logging
logStep("⏳ Begin Undo Group: Create New Composition");

try {
    // Configuration for the new composition
    var compName = "Test Composition";
    var compWidth = 1920;
    var compHeight = 1080;
    var pixelAspect = 1.0;
    var duration = 10.0; // 10 seconds
    var frameRate = 30.0; // 30 fps
    
    logStep("🚀 Creating new composition...");
    logStep("📐 Settings:");
    logStep("   • Name: " + compName);
    logStep("   • Dimensions: " + compWidth + "x" + compHeight);
    logStep("   • Pixel Aspect: " + pixelAspect);
    logStep("   • Duration: " + duration + " seconds");
    logStep("   • Frame Rate: " + frameRate + " fps");
    
    // Create the new composition
    var newComp = app.project.items.addComp(compName, compWidth, compHeight, pixelAspect, duration, frameRate);
    
    if (newComp) {
        logStep("✅ Composition created successfully!");
        logStep("📊 Composition details:");
        logStep("   • ID: " + newComp.id);
        logStep("   • Name: " + newComp.name);
        logStep("   • Width: " + newComp.width + " pixels");
        logStep("   • Height: " + newComp.height + " pixels");
        logStep("   • Duration: " + newComp.duration + " seconds");
        logStep("   • Frame Rate: " + newComp.frameRate + " fps");
        
        // Open the composition in the viewer
        try {
            newComp.openInViewer();
            logStep("👁️ Composition opened in viewer");
        } catch (viewerError) {
            logStep("⚠️ Could not open composition in viewer: " + viewerError.toString());
        }
        
        logStep("🎬 New composition is ready for use!");
        
    } else {
        throw new Error("Failed to create composition - addComp returned null");
    }
    
} catch (error) {
    logStep("❗ ERROR: " + error.toString());
    if (error.fileName) logStep("   📄 File: " + error.fileName);
    if (error.line) logStep("   📍 Line: " + error.line);
    
} finally {
    app.endUndoGroup();
    logStep("⏹️ End Undo Group: Create New Composition");
    logStep("🏁 Script execution complete");
}

// Return the execution log as JSON
JSON.stringify({
    success: true,
    message: "Script execution complete",
    executionLog: executionLog.join("\\n")
});`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            🧪 Script Test
          </h2>
          <div className="flex gap-2">
            <button
              onClick={loadTestScript}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Load Test Script
            </button>
            <button
              onClick={clearResult}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Clear Result
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Script Input */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              📝 ExtendScript Code
            </label>
            <button
              onClick={executeScript}
              disabled={isExecuting}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                isExecuting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isExecuting ? '🔄 Executing...' : '🚀 Execute Script'}
            </button>
          </div>
          
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="flex-1 w-full p-3 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none min-h-0"
            placeholder="Paste your ExtendScript code here..."
          />
        </div>

        {/* Result Display */}
        <div className="flex-1 flex flex-col min-w-0">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📊 Execution Result
          </label>
          
          <div className="flex-1 w-full p-3 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg 
                        bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                        overflow-auto whitespace-pre-wrap min-h-0">
            {result || 'Execute a script to see results here...'}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 This tab tests $.writeln() output capture. Use logStep() functions in your scripts to see detailed execution logs.
        </p>
      </div>
    </div>
  );
};

export default ScriptTestTab;