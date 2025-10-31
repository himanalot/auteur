/**
 * Script Execution Service
 * Handles ExtendScript execution, validation, error analysis, and file operations
 */

const fs = require('fs').promises;
const path = require('path');

class ScriptExecutorService {
  constructor() {
    this.scriptsDir = path.join(__dirname, '../../jsx/generated');
    this.ensureScriptsDirectory();
  }

  async ensureScriptsDirectory() {
    try {
      await fs.mkdir(this.scriptsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create scripts directory:', error);
    }
  }

  /**
   * Execute ExtendScript in After Effects
   */
  async executeExtendScript(script, description = '') {
    console.log('🚀 Executing ExtendScript:', description || 'User Script');
    
    try {
      // Add comprehensive error handling wrapper
      const wrappedScript = this.wrapScriptWithErrorHandling(script, description);
      
      // For now, simulate execution - in real implementation, this would use CSInterface
      // or another method to communicate with After Effects
      const result = await this.simulateExecution(wrappedScript);
      
      console.log('✅ Script execution completed');
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        logs: result.logs
      };
    } catch (error) {
      console.error('❌ Script execution failed:', error);
      return {
        success: false,
        error: error.message,
        output: null,
        executionTime: 0,
        logs: []
      };
    }
  }

  /**
   * Validate ExtendScript syntax and API usage
   */
  async validateScriptSyntax(script) {
    console.log('🔍 Validating script syntax...');
    
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Basic syntax validation
      this.checkBasicSyntax(script, validationResults);
      
      // AE API validation
      this.checkAEAPIUsage(script, validationResults);
      
      // Best practices validation
      this.checkBestPractices(script, validationResults);
      
      if (validationResults.errors.length > 0) {
        validationResults.isValid = false;
      }
      
      console.log(`✅ Validation complete: ${validationResults.isValid ? 'VALID' : 'INVALID'}`);
      console.log(`   Errors: ${validationResults.errors.length}, Warnings: ${validationResults.warnings.length}`);
      
      return validationResults;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Analyze execution errors and provide debugging insights
   */
  async analyzeError(errorMessage, script, lineNumber = null) {
    console.log('🔬 Analyzing error:', errorMessage.substring(0, 100) + '...');
    
    try {
      const analysis = {
        errorType: this.categorizeError(errorMessage),
        probableCause: this.identifyProbableCause(errorMessage, script),
        suggestedFixes: this.suggestFixes(errorMessage, script, lineNumber),
        codeContext: this.extractCodeContext(script, lineNumber),
        relatedDocumentation: this.findRelatedDocumentation(errorMessage),
        severity: this.assessErrorSeverity(errorMessage)
      };
      
      console.log(`✅ Error analysis complete: ${analysis.errorType} (${analysis.severity})`);
      return analysis;
    } catch (error) {
      console.error('❌ Error analysis failed:', error);
      return {
        errorType: 'UNKNOWN',
        probableCause: 'Unable to analyze error',
        suggestedFixes: ['Check script syntax and AE API usage'],
        codeContext: null,
        relatedDocumentation: [],
        severity: 'HIGH'
      };
    }
  }

  /**
   * Save script to filesystem with proper formatting
   */
  async saveScriptFile(script, filename, description = '') {
    console.log('💾 Saving script file:', filename);
    
    try {
      const formattedScript = this.formatScriptForSaving(script, description);
      const filepath = path.join(this.scriptsDir, `${filename}.jsx`);
      
      await fs.writeFile(filepath, formattedScript, 'utf8');
      
      console.log('✅ Script saved successfully:', filepath);
      return {
        success: true,
        filepath: filepath,
        filename: `${filename}.jsx`,
        size: formattedScript.length
      };
    } catch (error) {
      console.error('❌ Failed to save script:', error);
      return {
        success: false,
        error: error.message,
        filepath: null
      };
    }
  }

  /**
   * Wrap script with comprehensive error handling
   */
  wrapScriptWithErrorHandling(script, description) {
    const timestamp = new Date().toISOString();
    
    return `/**
 * Generated ExtendScript - ${description}
 * Generated at: ${timestamp}
 * 
 * This script includes comprehensive error handling and debugging output.
 */

$.writeln("⏳ Begin Undo Group: ${description}");
app.beginUndoGroup("${description}");

try {
    // Utility functions for safe property access
    function getProperty(obj, propName) {
        try {
            return obj.property(propName);
        } catch (e) {
            $.writeln("   ⚠️ Could not get property " + propName + ": " + e.toString());
            return null;
        }
    }

    function safePropertyAccess(obj, propPath) {
        try {
            var current = obj;
            var parts = propPath.split('.');
            for (var i = 0; i < parts.length; i++) {
                current = current[parts[i]];
                if (current === undefined || current === null) {
                    $.writeln("   ⚠️ Property path broken at: " + parts.slice(0, i + 1).join('.'));
                    return null;
                }
            }
            return current;
        } catch (e) {
            $.writeln("   ⚠️ Safe access failed for " + propPath + ": " + e.toString());
            return null;
        }
    }

    function validateComposition() {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            throw new Error("No active composition found. Please select a composition first.");
        }
        $.writeln("✅ Active composition: " + comp.name + " (" + comp.width + "x" + comp.height + ")");
        return comp;
    }

    // Main script execution
    $.writeln("🚀 Starting script execution: ${description}");
    
    ${script}
    
    $.writeln("✅ Script completed successfully!");

} catch (error) {
    $.writeln("❗ ERROR: " + error.toString());
    if (error.fileName) $.writeln("   File: " + error.fileName);
    if (error.line) $.writeln("   Line: " + error.line);
    if (error.stack) $.writeln("   Stack: " + error.stack);
    
    // Show user-friendly error dialog
    alert("Script Error: " + error.toString() + "\\n\\nCheck the ExtendScript Toolkit console for detailed information.");
} finally {
    app.endUndoGroup();
    $.writeln("⏹️ End Undo Group: ${description}");
}`;
  }

  /**
   * Simulate script execution (placeholder for real AE integration)
   */
  async simulateExecution(script) {
    // In real implementation, this would:
    // 1. Send script to After Effects via CSInterface
    // 2. Capture console output and errors
    // 3. Return execution results
    
    const startTime = Date.now();
    
    // Simulate various execution scenarios
    if (script.includes('throw new Error')) {
      return {
        success: false,
        output: null,
        error: 'Simulated script error for testing',
        executionTime: Date.now() - startTime,
        logs: ['Script started', 'Error occurred', 'Script terminated']
      };
    }
    
    return {
      success: true,
      output: 'Script executed successfully (simulated)',
      error: null,
      executionTime: Date.now() - startTime,
      logs: ['Script started', 'Operations completed', 'Script finished']
    };
  }

  /**
   * Check basic syntax issues
   */
  checkBasicSyntax(script, results) {
    // Check for common syntax errors
    const syntaxChecks = [
      {
        pattern: /\bfunction\s+\w+\s*\([^)]*\)\s*[^{]/,
        message: 'Function declaration missing opening brace'
      },
      {
        pattern: /\{[^}]*$/,
        message: 'Unclosed brace detected'
      },
      {
        pattern: /\([^)]*$/,
        message: 'Unclosed parenthesis detected'
      },
      {
        pattern: /["'][^"']*$/,
        message: 'Unclosed string literal detected'
      },
      {
        pattern: /\/\*[^*]*\*(?!\/).*$/,
        message: 'Unclosed comment block detected'
      }
    ];

    syntaxChecks.forEach(check => {
      if (check.pattern.test(script)) {
        results.errors.push({
          type: 'SYNTAX_ERROR',
          message: check.message,
          line: null
        });
      }
    });
  }

  /**
   * Check After Effects API usage
   */
  checkAEAPIUsage(script, results) {
    // Check for common AE API mistakes
    const apiChecks = [
      {
        pattern: /app\.project\.activeItem(?!\s*\&\&|\s*\|\||\s*\?|\s*instanceof)/,
        message: 'activeItem should be checked before use (might be null)',
        type: 'WARNING'
      },
      {
        pattern: /\.property\s*\(\s*["'][^"']+["']\s*\)(?!\s*\&\&|\s*\|\||\s*\?)/,
        message: 'Property access should be wrapped in try-catch',
        type: 'WARNING'
      },
      {
        pattern: /app\.beginUndoGroup\s*\([^)]*\)(?![^]*app\.endUndoGroup)/,
        message: 'beginUndoGroup without corresponding endUndoGroup',
        type: 'ERROR'
      }
    ];

    apiChecks.forEach(check => {
      if (check.pattern.test(script)) {
        const target = check.type === 'ERROR' ? results.errors : results.warnings;
        target.push({
          type: `AE_API_${check.type}`,
          message: check.message,
          line: null
        });
      }
    });
  }

  /**
   * Check best practices
   */
  checkBestPractices(script, results) {
    const practiceChecks = [
      {
        pattern: /alert\s*\(/,
        message: 'Consider using $.writeln() for debugging instead of alert()',
        suggestion: 'Replace alert() with $.writeln() for better debugging'
      },
      {
        pattern: /var\s+\w+\s*=\s*app\.project\.activeItem(?!\s*;[\s\S]*if\s*\()/,
        message: 'Should validate activeItem before using',
        suggestion: 'Add null check: if (!comp || !(comp instanceof CompItem)) { ... }'
      }
    ];

    practiceChecks.forEach(check => {
      if (check.pattern.test(script)) {
        results.warnings.push({
          type: 'BEST_PRACTICE',
          message: check.message,
          line: null
        });
        if (check.suggestion) {
          results.suggestions.push(check.suggestion);
        }
      }
    });
  }

  /**
   * Categorize error types
   */
  categorizeError(errorMessage) {
    const errorTypes = [
      { pattern: /syntax error/i, type: 'SYNTAX_ERROR' },
      { pattern: /undefined/i, type: 'UNDEFINED_REFERENCE' },
      { pattern: /null.*property/i, type: 'NULL_PROPERTY_ACCESS' },
      { pattern: /permission/i, type: 'PERMISSION_ERROR' },
      { pattern: /file.*not.*found/i, type: 'FILE_NOT_FOUND' },
      { pattern: /composition/i, type: 'COMPOSITION_ERROR' },
      { pattern: /layer/i, type: 'LAYER_ERROR' },
      { pattern: /property/i, type: 'PROPERTY_ERROR' }
    ];

    for (const errorType of errorTypes) {
      if (errorType.pattern.test(errorMessage)) {
        return errorType.type;
      }
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Identify probable cause of error
   */
  identifyProbableCause(errorMessage, script) {
    const causes = [
      {
        pattern: /activeItem.*null/i,
        cause: 'No composition is currently active or selected'
      },
      {
        pattern: /property.*undefined/i,
        cause: 'Attempting to access a property that does not exist on this object'
      },
      {
        pattern: /layer.*index/i,
        cause: 'Layer index is out of range or layer does not exist'
      },
      {
        pattern: /beginUndoGroup/i,
        cause: 'Undo group not properly closed or nested incorrectly'
      }
    ];

    for (const cause of causes) {
      if (cause.pattern.test(errorMessage)) {
        return cause.cause;
      }
    }

    return 'Error cause could not be determined automatically';
  }

  /**
   * Suggest fixes for common errors
   */
  suggestFixes(errorMessage, script, lineNumber) {
    const fixes = [];

    if (/activeItem.*null/i.test(errorMessage)) {
      fixes.push('Add composition validation: if (!comp || !(comp instanceof CompItem)) { throw new Error("Please select a composition"); }');
    }

    if (/property.*undefined/i.test(errorMessage)) {
      fixes.push('Wrap property access in try-catch or use null checking');
      fixes.push('Verify property name spelling and object hierarchy');
    }

    if (/layer.*index/i.test(errorMessage)) {
      fixes.push('Check layer count before accessing: if (layerIndex <= comp.numLayers) { ... }');
      fixes.push('Use layer iteration instead of direct indexing');
    }

    if (fixes.length === 0) {
      fixes.push('Check ExtendScript Toolkit console for detailed error information');
      fixes.push('Verify After Effects API documentation for correct usage');
    }

    return fixes;
  }

  /**
   * Extract code context around error line
   */
  extractCodeContext(script, lineNumber) {
    if (!lineNumber) return null;

    const lines = script.split('\n');
    const contextSize = 3;
    const start = Math.max(0, lineNumber - contextSize - 1);
    const end = Math.min(lines.length, lineNumber + contextSize);

    return {
      errorLine: lineNumber,
      context: lines.slice(start, end).map((line, index) => ({
        lineNumber: start + index + 1,
        code: line,
        isErrorLine: start + index + 1 === lineNumber
      }))
    };
  }

  /**
   * Find related documentation
   */
  findRelatedDocumentation(errorMessage) {
    const docSuggestions = [];

    if (/composition/i.test(errorMessage)) {
      docSuggestions.push('CompItem object documentation');
    }
    if (/layer/i.test(errorMessage)) {
      docSuggestions.push('Layer object documentation');
    }
    if (/property/i.test(errorMessage)) {
      docSuggestions.push('Property and PropertyGroup documentation');
    }

    return docSuggestions;
  }

  /**
   * Assess error severity
   */
  assessErrorSeverity(errorMessage) {
    if (/fatal|critical|crash/i.test(errorMessage)) return 'CRITICAL';
    if (/error|exception|fail/i.test(errorMessage)) return 'HIGH';
    if (/warning|deprecated/i.test(errorMessage)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Format script for saving with proper header
   */
  formatScriptForSaving(script, description) {
    const timestamp = new Date().toISOString();
    const header = `/**
 * ${description || 'Generated ExtendScript'}
 * 
 * Generated by Maximise AE Tools - AI Assistant
 * Created: ${timestamp}
 * 
 * This script includes comprehensive error handling and debugging.
 * Run in ExtendScript Toolkit or After Effects for best results.
 */

`;

    return header + script;
  }
}

module.exports = ScriptExecutorService;