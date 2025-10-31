# After Effects Script Validator - Expected Behavior

## ✅ Should Catch (High Priority)

### 1. **Workflow Issues**
- Missing `app.beginUndoGroup()` at script start
- Missing `app.endUndoGroup()` in try/catch blocks
- Scripts that don't end with proper cleanup

### 2. **Type Safety Issues**
- Wrong instanceof checks (`comp instanceof Layer` should be `CompItem`)
- Type mismatches in setValue calls (`setValue("50%")` vs `setValue(50)`)
- Array dimension mismatches (3D values for 2D properties)

### 3. **Null Safety Issues**
- Accessing properties without null checks (`comp.layers[1]` could be undefined)
- Using `app.project.activeItem` without checking if it exists

### 4. **Invalid API Usage**
- Non-existent methods (`addInvalidMethod()`)
- Non-existent properties (`InvalidProperty`)
- Invalid effect names in `addProperty()`
- Undefined variables (`someUndefinedVariable`)

### 5. **Scope Issues**
- Variables used outside their scope
- Function parameters not matching usage

### 6. **Performance Issues**
- Deeply nested loops (3+ levels)
- Large array operations without optimization
- Excessive object creation in loops

### 7. **Expression Issues**
- Invalid functions in expressions (`invalidFunction()`)
- Syntax errors in expression strings

## ❌ Should NOT Flag as Errors

### 1. **Valid AE API Calls**
- `layers.addShape()` - Valid method
- `layers.addText()` - Valid method  
- `layers.addSolid()` - Valid method
- `position.setValue()` - Valid method
- `opacity.setValue()` - Valid method

### 2. **Valid Property Access**
- `comp.layers` - Valid property
- `layer.transform` - Valid property
- `layer.Effects` - Valid property (note: case-sensitive)
- `textLayer.text.sourceText` - Valid property chain

### 3. **Valid Object Patterns**
- Array access with proper bounds checking
- Method chaining on valid objects
- Standard JavaScript operations

## 🔧 Current Issues with Validator

### 1. **Over-aggressive API Validation**
The validator is flagging valid AE methods as invalid. This suggests:
- Incomplete API definitions in the Rust code
- Missing method registrations for core AE objects
- Case sensitivity issues (`Effects` vs `effects`)

### 2. **Missing Critical Validations**
The validator is not catching important issues:
- Workflow pattern validation (undo groups)
- Type checking for method parameters
- Null safety analysis
- Scope analysis

### 3. **Suggested Improvements**

#### Fix API Definitions
```rust
// Ensure these are properly defined:
- CompItem.layers.addShape()
- CompItem.layers.addText() 
- CompItem.layers.addSolid()
- Property.setValue()
- Layer.transform, Layer.opacity, etc.
```

#### Add Workflow Validation
```rust
// Check for required patterns:
- Script starts with app.beginUndoGroup()
- Try/catch blocks have endUndoGroup() in both branches
- Script ends with proper cleanup
```

#### Add Type Validation
```rust
// Validate parameter types:
- setValue() expects numbers for opacity
- setValue() expects arrays for position
- Check array dimensions match property type
```

#### Add Null Safety
```rust
// Check for potential null access:
- comp.layers[index] bounds checking
- activeItem null checking
- Property existence validation
```

## 🎯 Priority Order for Fixes

1. **Fix over-aggressive API validation** (blocking valid code)
2. **Add workflow validation** (critical for AE scripts)
3. **Add type safety** (prevents runtime errors)
4. **Add null safety** (prevents crashes)
5. **Add performance analysis** (optimization suggestions)
6. **Add expression validation** (advanced feature)

This should make the validator much more useful and accurate for real After Effects development! 