# Development Documentation - Maximise AE Tools

## Overview
This document provides comprehensive development information for the After Effects AI Tool Calling Extension, including architecture, implementation details, and the comprehensive tool system.

## Architecture

### Comprehensive AI Tool Calling System

The extension now features a complete comprehensive AI tool calling system with **63 tools across 9 categories**, solving the previous ExtendScript `#include` limitations through a consolidated approach.

#### Tool Organization

**Consolidated Architecture:**
- `jsx/ae_tools_consolidated.jsx` - Single file containing all 57 tools
- `jsx/ae_tools_comprehensive.jsx` - Original modular registry (legacy)
- Individual tool files in `jsx/tools/` - Modular source files (for development)

#### Tool Categories and Counts

1. **Project Tools (10 tools)**
   - create_project, save_project, import_file, create_folder
   - organize_project, remove_unused_footage, consolidate_footage
   - create_proxy, reduce_project, collect_files

2. **Composition Tools (8 tools)**
   - create_composition, duplicate_composition, set_composition_settings
   - trim_composition_to_work_area, crop_composition_to_region
   - add_composition_marker, save_frame_as_image, create_comp_from_layers

3. **Layer Tools (6 tools)**
   - add_layer, duplicate_layers, set_layer_properties
   - organize_layers, align_layers, parent_layers

4. **Animation Tools (5 tools)**
   - animate_layer, add_expression, create_motion_path
   - sequence_layers, create_camera_movement

5. **Effects Tools (4 tools)**
   - apply_effect, remove_effects, copy_effects, animate_effect_property

6. **Text Tools (12 tools)**
- create_text_layer, modify_text_content, animate_text_typewriter
- animate_text_scale_in, create_text_path, create_text_counter
- set_text_opacity, set_text_position, set_text_alignment
- set_text_style, animate_text_properties, get_text_properties

7. **Render Tools (6 tools)**
   - add_to_render_queue, start_render, export_frame
   - create_proxy, clear_render_queue, batch_render_compositions

8. **Shape Tools (4 tools)**
   - create_shape_layer, animate_shape_path, create_shape_text, add_shape_modifiers

9. **Mask Tools (4 tools)**
   - create_mask, animate_mask, copy_mask, create_rotoscope_mask

10. **Utility Tools (4 tools)**
    - get_tool_list, get_project_status, get_available_tool_count, detect_tool_category

### Technical Implementation

#### Tool Registry System

**Main Registry Object:**
```javascript
var AE_TOOLS_COMPREHENSIVE = {};
```

**Tool Structure:**
```javascript
"tool_name": {
    description: "Tool description for AI understanding",
    parameters: {
        param1: "type", // Parameter definitions
        param2: "type"
    },
    execute: function(params) {
        // Tool implementation
        return {
            success: boolean,
            message: "Result message", 
            data: {} // Optional result data
        };
    }
}
```

#### Integration Points

**JavaScript Layer (main.js):**
```javascript
// Load consolidated tools
await executeScript('$.evalFile("' + csInterface.getSystemPath(SystemPath.EXTENSION) + '/jsx/ae_tools_consolidated.jsx")');

// Execute tools
var script = 'executeComprehensiveAITool("' + toolName + '", ' + paramString + ')';
```

**ExtendScript Functions:**
- `executeComprehensiveAITool(toolName, parameters)` - Main execution function
- `getComprehensiveAITools()` - Returns JSON string of all available tools
- `detectToolCategory(toolName)` - Categorizes tools for organization

### Tool Development Patterns

#### Standard Tool Template
```javascript
"tool_name": {
    description: "Clear description of what the tool does",
    parameters: {
        requiredParam: "string",
        optionalParam: "number", // with defaults in implementation
        booleanParam: "boolean"
    },
    execute: function(params) {
        // Validate active composition if needed
        var activeItem = app.project.activeItem;
        if (!activeItem || !(activeItem instanceof CompItem)) {
            return { success: false, message: "No active composition found" };
        }

        try {
            app.beginUndoGroup("AI: Tool Name");
            
            // Tool implementation here
            var result = performToolAction(params);
            
            app.endUndoGroup();
            return {
                success: true,
                message: "Tool executed successfully",
                data: result
            };
        } catch (error) {
            app.endUndoGroup();
            return { success: false, message: "Error: " + error.toString() };
        }
    }
}
```

#### Error Handling Standards
- Always use `app.beginUndoGroup()` and `app.endUndoGroup()`
- Return consistent result objects with `success`, `message`, and optional `data`
- Provide descriptive error messages for debugging
- Validate required inputs before execution

#### Parameter Handling
- Use intelligent defaults when parameters are not provided
- Support flexible parameter types (arrays for positions, strings for names)
- Validate parameter ranges and types where appropriate
- Support both simple and complex parameter structures

### AI Integration

#### Tool Calling Flow
```
User Request → AI Processing → Tool Selection → Parameter Extraction → 
Tool Execution → Result Processing → User Feedback
```

#### Tool Selection Logic
The AI uses tool descriptions and parameter definitions to:
1. Understand user intent
2. Select appropriate tools
3. Fill in missing parameters with intelligent defaults
4. Execute tools in logical sequence for complex requests

#### Context Awareness
- Tools can access current project state
- Active composition detection
- Selected layers consideration
- Time context awareness

### Performance Considerations

#### Optimization Strategies
- **Single File Loading**: Consolidated file eliminates multiple file loads
- **Efficient Tool Registry**: Direct object property access
- **Minimal Parameter Validation**: Performance-critical paths optimized
- **Batch Operations**: Multiple layer/composition support in single tools

#### Memory Management
- Tools designed for minimal memory footprint
- Automatic cleanup in error conditions
- Efficient parameter passing between JavaScript and ExtendScript

### Development Workflow

#### Adding New Tools

1. **Define in Individual Module** (optional, for development):
   ```
   jsx/tools/category_tools.jsx
   ```

2. **Add to Consolidated File**:
   Add tool definition to appropriate category in `jsx/ae_tools_consolidated.jsx`

3. **Update Tool Registry**:
   Tool is automatically available through the comprehensive registry

4. **Test Integration**:
   Test through AI chat interface and manual execution

#### Testing Strategies
- **Unit Testing**: Individual tool execution
- **Integration Testing**: AI tool calling flow
- **User Scenario Testing**: Complex multi-tool workflows
- **Error Path Testing**: Invalid parameters and edge cases

### API Reference

#### Main Functions
- `executeComprehensiveAITool(toolName, parameters)` - Execute any tool
- `getComprehensiveAITools()` - Get all available tools (JSON)
- `getProjectTools()` - Get project-specific tools
- `getLayerTools()` - Get layer-specific tools
- `detectToolCategory(toolName)` - Get tool category

#### Parameter Types
- `"string"` - Text values
- `"number"` - Numeric values  
- `"boolean"` - True/false values
- `"array"` - Arrays for positions, colors, etc.
- `"object"` - Complex parameter objects

### Troubleshooting

#### Common Issues

**Tool Not Found:**
- Verify tool name in consolidated file
- Check tool registry loading
- Validate tool definition syntax

**Parameter Errors:**
- Check parameter types match definitions
- Verify required parameters are provided
- Test with minimal parameter sets

**Execution Failures:**
- Check After Effects context (active comp, selected layers)
- Verify ExtendScript permissions
- Review undo group handling

#### Debug Tools
- Built-in debug console with tool execution logging
- Tool list discovery via `get_tool_list`
- Project status via `get_project_status`

### Future Development

#### Extension Possibilities
- Additional tool categories (3D, audio, expressions)
- Enhanced parameter validation
- Tool dependency management
- Workflow template system
- Performance monitoring and optimization

#### AI Enhancement Opportunities
- Context-aware parameter suggestion
- Tool usage analytics for optimization
- Enhanced error recovery strategies
- Multi-step workflow automation

This comprehensive system provides a robust foundation for AI-powered After Effects automation with 57 tools covering all major workflow areas.

## 🏗️ Project Structure

```
Maximise AE Tools/
├── CSXS/
│   └── manifest.xml          # Extension configuration & metadata
├── css/
│   └── styles.css           # UI styling & theming
├── js/
│   ├── libs/
│   │   └── CSInterface.js   # CEP communication library
│   └── main.js              # Extension logic & event handling
├── jsx/
│   └── hostscript.jsx       # After Effects scripting functions
├── icons/                   # Extension icons (23x23 PNG)
│   ├── icon-normal.png
│   ├── icon-rollover.png
│   ├── icon-dark-normal.png
│   └── icon-dark-rollover.png
├── index.html              # Main UI interface
├── package.json            # Project metadata & scripts
├── .debug                  # CEP debug configuration
└── README.md              # User documentation
```

## 🛠️ Development Setup

### Prerequisites
- Adobe After Effects 2025 or later
- Node.js (for development scripts)
- Text editor or IDE
- Basic knowledge of HTML, CSS, JavaScript, and After Effects scripting

### Installation for Development

1. **Clone/Download the project**
2. **Enable CEP debug mode:**
   ```bash
   npm run debug
   ```
3. **Install to AE extensions folder:**
   ```bash
   npm run install-dev
   ```
4. **Restart After Effects**

### Development Workflow

1. **Make changes** to HTML, CSS, or JavaScript files
2. **Copy updated files** to the CEP extensions directory
3. **Reload the extension** in After Effects:
   - Close and reopen the extension panel
   - Or restart After Effects for manifest changes

## 🎨 Adding New Features

### 1. Adding a New UI Element

**Step 1: Update HTML** (`index.html`)
```html
<div class="section">
    <h2>New Tool Category</h2>
    <button id="newTool" class="btn btn-primary">New Tool</button>
</div>
```

**Step 2: Add CSS Styling** (`css/styles.css`)
```css
#newTool {
    /* Custom styling if needed */
}
```

**Step 3: Add Event Handler** (`js/main.js`)
```javascript
// In bindEvents function
document.getElementById('newTool').addEventListener('click', executeNewTool);

// Add function
function executeNewTool() {
    var script = 'newToolFunction()';
    executeScript(script, 'New tool executed', 'Failed to execute new tool');
}
```

**Step 4: Implement AE Function** (`jsx/hostscript.jsx`)
```javascript
function newToolFunction() {
    try {
        app.beginUndoGroup("New Tool Operation");
        
        // Your After Effects scripting code here
        var activeItem = app.project.activeItem;
        if (activeItem && activeItem instanceof CompItem) {
            // Do something with the composition
        }
        
        app.endUndoGroup();
        return "Success";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}
```

### 2. Customizing the UI Theme

**Colors and Styling** (`css/styles.css`)
```css
:root {
    --primary-color: #3498db;
    --secondary-color: #95a5a6;
    --background-color: #2c3e50;
    --text-color: #ecf0f1;
}

/* Update color schemes */
.btn-primary {
    background: linear-gradient(135deg, var(--primary-color), #2980b9);
}
```

### 3. Adding Input Controls

**HTML:**
```html
<div class="input-group">
    <label for="customValue">Custom Value:</label>
    <input type="number" id="customValue" value="100" min="0" max="1000">
    <input type="range" id="customSlider" min="0" max="100" value="50">
</div>
```

**JavaScript:**
```javascript
function getCustomValue() {
    return document.getElementById('customValue').value;
}
```

## 🔧 Technical Details

### CEP Communication Flow

1. **UI Event** → JavaScript handler in `main.js`
2. **JavaScript** → Calls `csInterface.evalScript()` with JSX function name
3. **JSX Script** → Executes in After Effects scripting environment
4. **Return Value** → Sent back to JavaScript for UI feedback

### Error Handling Pattern

```javascript
// JavaScript side
function executeScript(script, successMsg, errorMsg) {
    csInterface.evalScript(script, function(result) {
        if (result === 'undefined' || result === '' || result.indexOf('Error') === 0) {
            showStatus(errorMsg || 'Operation failed', 'error');
        } else {
            showStatus(successMsg || 'Operation completed successfully', 'success');
        }
    });
}

// JSX side
function anyFunction() {
    try {
        app.beginUndoGroup("Operation Name");
        // Your code here
        app.endUndoGroup();
        return "Success";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}
```

### After Effects API References

**Common Objects:**
- `app.project.activeItem` - Currently active composition
- `activeItem.selectedLayers` - Selected layers array
- `layer.transform.position` - Layer position property
- `layer.transform.scale` - Layer scale property
- `layer.transform.opacity` - Layer opacity property

**Useful Methods:**
- `app.beginUndoGroup()` / `app.endUndoGroup()` - Undo grouping
- `activeItem.layers.addNull()` - Add null object
- `activeItem.layers.addText()` - Add text layer
- `prop.setValueAtTime()` - Set keyframes
- `prop.setTemporalEaseAtKey()` - Set easing

## 🧪 Testing & Debugging

### Debug Console Access

1. **Right-click** in the extension panel
2. **Select "Inspect"** or "Debug"
3. **Open Console tab** for JavaScript errors
4. **Check Network tab** for resource loading issues

### Common Issues

**Extension doesn't appear:**
- Check CEP debug mode is enabled
- Verify manifest.xml syntax
- Ensure correct After Effects version compatibility

**Blank panel:**
- Check HTML file path in manifest
- Verify CSS and JavaScript file references
- Look for console errors

**JSX functions fail:**
- Check After Effects Info panel for script errors
- Verify function names match between JS and JSX
- Ensure proper error handling

### Performance Tips

1. **Minimize DOM updates** - Batch UI changes
2. **Use efficient selectors** - Cache DOM elements
3. **Optimize JSX loops** - Avoid unnecessary iterations
4. **Handle large datasets** - Implement progress feedback

## 📦 Building & Distribution

### Creating a ZXP Package

1. **Use Adobe's ZXP Packager** or similar tool
2. **Include all necessary files** (exclude .DS_Store, development files)
3. **Sign the package** for distribution
4. **Test installation** on clean After Effects installation

### Version Management

1. **Update version** in `manifest.xml`
2. **Update version** in `package.json`
3. **Document changes** in `CHANGELOG.md`
4. **Tag release** in version control

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/new-tool`)
3. **Test thoroughly** in After Effects
4. **Follow coding standards** (comments, error handling)
5. **Submit pull request** with detailed description

## 📚 Resources

- [Adobe CEP Documentation](https://github.com/Adobe-CEP/CEP-Resources)
- [After Effects Scripting Guide](https://ae-scripting.docsforadobe.dev/)
- [ExtendScript Toolkit](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ExtendScript-Toolkit)
- [CEP Samples](https://github.com/Adobe-CEP/Samples)

---

**Happy coding! 🚀** 

# After Effects Script Validator Implementation Plan

## Core Components to Implement

### 1. Expression Validation Engine
- [ ] Expression parser
- [ ] Type checker
- [ ] Scope validation
- [ ] Property access validation
- [ ] Method call validation
- [ ] Expression-specific error types

### 2. Script Analysis
- [ ] Performance analysis
  - [ ] Time complexity estimation
  - [ ] Memory usage analysis
  - [ ] Loop detection
  - [ ] Resource usage tracking
- [ ] Temporal validation
  - [ ] Timeline consistency
  - [ ] Keyframe validation
  - [ ] Animation timing checks
- [ ] Best practices checker
  - [ ] Code style
  - [ ] Common pitfalls
  - [ ] Performance recommendations

### 3. Documentation System
- [ ] API documentation generator
- [ ] Code examples
- [ ] Validation rule documentation
- [ ] Error message documentation
- [ ] Integration with existing AE docs

### 4. Error Handling
- [ ] Custom error types
- [ ] Error context
- [ ] Recovery suggestions
- [ ] Error reporting format

### 5. CLI Interface
- [ ] Command line arguments
- [ ] Configuration file support
- [ ] Output formatting
- [ ] Interactive mode

### 6. Advanced Data Structures
- [ ] Symbol table
- [ ] Type system
- [ ] Dependency graph
- [ ] Call graph

## Implementation Order

1. Error Handling (foundation for other components)
2. Expression Validation (core functionality)
3. Script Analysis (builds on expression validation)
4. Documentation System (can be built incrementally)
5. CLI Interface (user-facing layer)
6. Advanced Data Structures (optimization phase)

## Module Structure

```
src/
  validation/
    expression/
      parser.rs
      typechecker.rs
      scope.rs
    analysis/
      performance.rs
      temporal.rs
      best_practices.rs
    errors/
      types.rs
      context.rs
      reporting.rs
  cli/
    args.rs
    config.rs
    output.rs
  documentation/
    generator.rs
    examples.rs
    messages.rs
  data_structures/
    symbol_table.rs
    type_system.rs
    dependency_graph.rs
```

## Current Status
Starting implementation of error handling system as foundation. 