# After Effects ExtendScript Validator Demo

This demonstrates how the validator would analyze the `test_script.jsx` file:

## Command Used
```bash
ae-validator test_script.jsx --warnings
```

## Expected Output

```
📁 test_script.jsx
❌ Errors:
  Unknown method 'invalidMethod' on object 'app' at line 12
  ExtendScript compatibility issue at line 21: Arrow functions are not supported in ExtendScript
  ExtendScript compatibility issue at line 60: ES6 classes are not supported in ExtendScript
  ExtendScript compatibility issue at line 66: ES6 modules are not supported in ExtendScript
  Unknown property 'unknownProperty' on object 'layer' at line 54
  Syntax error at line 40, column 1: Unclosed brace
  Syntax error at line 81, column 30: Unmatched closing parenthesis

⚠️  Warnings:
  Deprecated API 'timecodeFilmType' used at line 15: Use feetFramesFilmType instead
  Use generateRandomNumber() instead of Math.random() for better compatibility at line 18
  ExtendScript compatibility issue at line 26: let/const may not be supported in older ExtendScript versions
  ExtendScript compatibility issue at line 7: instanceof may not work as expected with some AE objects - check documentation
  ExtendScript compatibility issue at line 48: instanceof may not work as expected with some AE objects - check documentation

📊 Summary:
  Files checked: 1
  Files with errors: 1
  Total errors: 7
  Total warnings: 5
```

## Analysis Breakdown

### ✅ Valid Code Detected
- `app.project.activeItem` - Valid AE API
- `comp.layer(1)` - Valid CompItem method
- `layer.name = "Test Layer"` - Valid Layer property
- `alert("Hello from After Effects!")` - Valid global function
- `opacity.setValue(50)` - Valid Property method
- `generateRandomNumber()` - Recommended AE global function

### ❌ Errors Found
1. **Invalid API Usage**: `app.invalidMethod()` - Method doesn't exist
2. **ES6+ Features**: Arrow functions, classes, imports not supported
3. **Unknown Properties**: `layer.unknownProperty` - Property doesn't exist
4. **Syntax Errors**: Unmatched braces and parentheses

### ⚠️ Warnings Generated
1. **Deprecated APIs**: `timecodeFilmType` should be `feetFramesFilmType`
2. **Compatibility Issues**: `Math.random()`, `let/const`, `instanceof`

## JSON Output Example

```json
{
  "files": [
    {
      "file": "test_script.jsx",
      "is_valid": false,
      "errors": [
        "Unknown method 'invalidMethod' on object 'app' at line 12",
        "ExtendScript compatibility issue at line 21: Arrow functions are not supported in ExtendScript",
        "Syntax error at line 40, column 1: Unclosed brace"
      ],
      "warnings": [
        "Deprecated API 'timecodeFilmType' used at line 15: Use feetFramesFilmType instead",
        "Use generateRandomNumber() instead of Math.random() for better compatibility at line 18"
      ]
    }
  ],
  "summary": {
    "total_files": 1,
    "files_with_errors": 1,
    "total_errors": 7,
    "total_warnings": 5
  }
}
```

## Validator Features Demonstrated

### 1. Syntax Validation
- Detects unmatched braces, brackets, and parentheses
- Handles string literals and comments properly
- Reports exact line and column positions

### 2. API Validation
- Validates After Effects object methods and properties
- Recognizes inheritance (Layer → AVLayer)
- Checks global function availability

### 3. ExtendScript Compatibility
- Identifies ES6+ features that won't work
- Suggests alternatives for problematic code
- Warns about potential compatibility issues

### 4. Deprecated API Detection
- Flags old APIs with modern alternatives
- Provides helpful migration suggestions

## Integration Benefits

This validator can be integrated into:

- **CI/CD pipelines** for automated script validation
- **Code editors** for real-time error checking
- **Build systems** to catch issues before deployment
- **Code review processes** to ensure quality standards

The comprehensive analysis helps developers write more reliable After Effects scripts while maintaining compatibility across different AE versions. 