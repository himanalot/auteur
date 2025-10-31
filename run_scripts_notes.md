# Run Scripts Implementation Notes

## How Script Execution Works in the Extension

This document explains how the "Run Script" functionality works in the Script Generator tab, based on the existing implementation.

## Core Implementation

### Main Function: `runScript()`

**Location**: `/js/main.js` in the `ScriptGenerator` class

```javascript
async runScript() {
    // Always pull latest content from the textarea so user edits are respected
    this.currentScript = (this.generatedScript && this.generatedScript.value) ? this.generatedScript.value.trim() : '';

    if (!this.currentScript) {
        this.showResult('No script to run', 'error');
        return;
    }

    this.updateStatus('Running script...', 'generating');
    this.showResult('Executing script in After Effects...', 'info');

    try {
        // Use silent execution that won't show popups to user
        const result = await this.executeScriptSilent(this.currentScript);
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
            this.updateStatus('Script failed', 'error');
            this.showResult(`❌ Script Error: ${parsedResult.message || result}`, 'error');
        } else {
            this.updateStatus('Script executed successfully!', 'ready');
            this.showResult(`✅ Success: ${parsedResult.message || 'Script completed successfully'}`, 'success');
        }

    } catch (error) {
        console.error('❌ Script execution error:', error);
        this.updateStatus('Execution failed', 'error');
        this.showResult(`❌ Execution Error: ${error.message}`, 'error');
    }
}
```

### Script Execution Engine: `executeScriptSilent()`

```javascript
executeScriptSilent(script) {
    return new Promise((resolve) => {
        if (!isInCEP) {
            console.warn('⚠️ Not in CEP environment, cannot execute script');
            resolve('{"success": false, "message": "Not in CEP environment"}');
            return;
        }

        // Execute the user script directly - it should handle its own error reporting
        csInterface.evalScript(script, (result) => {
            console.log('🎬 Raw script result:', result);
            
            if (result === 'EvalScript error.') {
                // Even evalScript errors should be handled silently
                resolve('{"success": false, "message": "ExtendScript evaluation error - check script syntax"}');
            } else if (!result || result.trim() === '') {
                // Empty result means script ran but didn't return anything
                resolve('{"success": true, "message": "Script executed successfully (no return value)"}');
            } else {
                // Try to parse the result - if it's valid JSON, use it; otherwise treat as success message
                try {
                    const parsed = JSON.parse(result);
                    resolve(result); // Return the raw JSON string
                } catch (e) {
                    // Not JSON, treat as success message
                    resolve(`{"success": true, "message": "Script completed: ${result}"}`);
                }
            }
        });
    });
}
```

## Key Components

### 1. CEP Infrastructure
- **CSInterface**: Adobe's interface for CEP extensions
- **Environment Check**: `isInCEP` ensures we're running in After Effects
- **Direct Communication**: Uses `csInterface.evalScript()` to execute ExtendScript

### 2. UI Elements
- **Script Textarea**: `generatedScript` element contains the script code
- **Run Button**: `runScript` button triggers execution
- **Status Display**: `scriptStatus` shows current operation status
- **Results Display**: `scriptResults` shows execution results

### 3. Event Handling
```javascript
if (this.runBtn) {
    this.runBtn.addEventListener('click', () => this.runScript());
}
```

## Execution Flow

1. **User Interaction**: User clicks "Run Script" button
2. **Script Retrieval**: Gets current content from textarea (respects user edits)
3. **Validation**: Checks if script exists and is not empty
4. **UI Updates**: Shows "Running script..." status
5. **Script Execution**: Calls `executeScriptSilent()` with the script
6. **CEP Communication**: Uses `csInterface.evalScript()` to send script to After Effects
7. **Result Processing**: Handles response from After Effects
8. **UI Feedback**: Updates status and shows results

## Result Handling

### Success Cases
- **Empty Result**: Script ran but returned nothing (normal for alerts)
- **JSON Result**: Structured response from tools
- **Text Result**: Plain text response from script

### Error Cases
- **No CEP Environment**: Extension not running in After Effects
- **EvalScript Error**: Syntax or runtime errors in ExtendScript
- **Exception Handling**: JavaScript errors during execution

## UI Status Updates

### Status Types
- `info`: General information (blue)
- `generating`: Processing (orange)
- `ready`: Success (green)
- `error`: Error (red)

### Methods
```javascript
updateStatus(message, type = 'info') {
    if (this.scriptStatus) {
        this.scriptStatus.textContent = message;
        this.scriptStatus.className = `script-status-text ${type}`;
    }
}

showResult(message, type = 'info') {
    if (this.scriptResults) {
        this.scriptResults.innerHTML = message;
        this.scriptResults.className = `script-results-output ${type}`;
    }
}
```

## Script Types Supported

### 1. Simple Scripts
```javascript
alert("Hello World");
```
- Shows alert in After Effects
- Returns empty result (success)

### 2. Complex Scripts
```javascript
var comp = app.project.items.addComp("Test", 1920, 1080, 1, 10, 30);
comp.openInViewer();
```
- Creates composition
- Returns empty result (success)

### 3. Tool-Based Scripts
```javascript
JSON.stringify({
    success: true,
    message: "Tool executed successfully"
});
```
- Returns structured JSON
- Parsed and displayed appropriately

## Error Handling Strategy

### Silent Execution
- Uses `executeScriptSilent()` to avoid popup errors
- Handles errors gracefully without interrupting user experience
- Provides clear feedback through UI instead of alerts

### Comprehensive Error Checking
1. **Environment**: Checks if running in CEP
2. **Script Content**: Validates script exists
3. **Execution**: Catches runtime errors
4. **Parsing**: Handles JSON parse errors
5. **UI Updates**: Always provides user feedback

## Best Practices

### 1. User Edit Respect
- Always pulls latest content from textarea
- Allows users to modify generated scripts before running

### 2. Asynchronous Execution
- Uses async/await for non-blocking execution
- Provides immediate UI feedback

### 3. Error Recovery
- Doesn't crash on errors
- Provides helpful error messages
- Maintains UI consistency

### 4. Debugging Support
- Comprehensive console logging
- Clear error messages
- Status tracking throughout execution

## Integration Points

### HTML Elements
```html
<button id="runScript" class="run-btn">▶️ Run Script</button>
<textarea id="generatedScript" class="generated-script"></textarea>
<span id="scriptStatus" class="script-status-text">Ready</span>
<div id="scriptResults" class="script-results-output"></div>
```

### CSS Classes
- `.run-btn`: Button styling
- `.generated-script`: Textarea styling
- `.script-status-text`: Status text with type-based coloring
- `.script-results-output`: Results display with type-based styling

## Summary

The script execution system provides a robust, user-friendly way to run ExtendScript code in After Effects. It handles both simple scripts (like alerts) and complex operations, provides clear feedback, and maintains a consistent user experience even when errors occur.

The key to its success is the combination of:
1. **Silent execution** to avoid popup errors
2. **Comprehensive error handling** at every step
3. **Clear UI feedback** for all operations
4. **Respect for user edits** in the script content
5. **Proper CEP integration** using Adobe's CSInterface