# Maximise AE Tools

A powerful Adobe After Effects CEP extension that integrates AI-powered automation with Google Gemini API for natural language control of After Effects.

## Features

### 🤖 AI Chat Integration
- **Natural Language Interface**: Chat with AI to control After Effects using plain English
- **Intelligent Tool Calling**: AI automatically selects and executes the right tools based on your requests
- **Context-Aware Responses**: AI understands your current project state and provides relevant suggestions

### 🛠️ Comprehensive Tool Collection (63+ Tools)
The extension includes a comprehensive collection of 63+ AI-powered tools organized into 9 categories:

#### 🎬 Project Tools (10 tools)
- **create_project**: Create new After Effects projects with templates
- **save_project**: Save projects with optional paths and save-as functionality  
- **import_file**: Import various file types (footage, compositions, sequences)
- **create_folder**: Create organizational folders with parent/child relationships
- **organize_project**: Auto-organize items by type with subfolders
- **remove_unused_footage**: Clean up unused project items
- **consolidate_footage**: Merge duplicate footage items
- **create_proxy**: Generate proxy files for footage
- **reduce_project**: Trim project to specific compositions and dependencies
- **collect_files**: Gather all project files into destination folder

#### 🎨 Composition Tools (8 tools)
- **create_composition**: Create compositions with presets (HD, 4K, Square, Vertical, Cinema, Social Media formats)
- **duplicate_composition**: Clone compositions with optional renaming
- **set_composition_settings**: Modify dimensions, frame rate, background, work area, motion blur settings
- **trim_composition_to_work_area**: Adjust duration to match work area
- **crop_composition_to_region**: Crop with automatic layer adjustment
- **add_composition_marker**: Add timed markers with comments, chapters, web links
- **save_frame_as_image**: Export frames in various formats (PNG, JPEG, TIFF)
- **create_comp_from_layers**: Generate new compositions from selected layers

#### 📐 Layer Tools (6 tools)
- **add_layer**: Create all layer types (solid, adjustment, null, text, shape, camera, light) with full configuration
- **duplicate_layers**: Multi-duplicate with time/position/scale/rotation/opacity offsets
- **set_layer_properties**: Comprehensive property control (opacity, scale, position, rotation, blend modes, quality, 3D, motion blur)
- **organize_layers**: Sort by alphabetical, type, label, duration with null grouping
- **align_layers**: Align to composition or selection with horizontal/vertical distribution
- **parent_layers**: Set up parent-child relationships with null creation

#### 🎬 Animation Tools (5 tools)
- **animate_layer**: Full keyframe animation with custom easing (75% influence curves), hold keyframes, roving, continuous bezier
- **add_expression**: Apply expressions with preset library (wiggle, bounce, loop, overshoot, pendulum, scale bounce)
- **create_motion_path**: Animate along mask/shape paths with auto-orientation and direction control
- **sequence_layers**: Time-sequence layers with overlap and crossfade options
- **create_camera_movement**: Generate camera animations (dolly, pan, tilt, orbit, zoom) with intensity control

#### 🎨 Effects Tools (4 tools)
- **apply_effect**: Comprehensive effects application with 100+ effect match names across all categories
- **remove_effects**: Remove by name, index, or all effects
- **copy_effects**: Transfer effects between layers with keyframe preservation
- **animate_effect_property**: Animate specific effect parameters with easing

#### 📝 Text Tools (12 tools)
- **create_text_layer**: Full text formatting (font, size, style, colors, justification, spacing, character formatting)
- **modify_text_content**: Edit existing text with append/prepend options
- **animate_text_typewriter**: Create typewriter effects with randomization
- **animate_text_scale_in**: Character-by-character scale animations with text animators
- **create_text_path**: Text along paths from masks/shapes
- **create_text_counter**: Animated number counters with prefixes/suffixes
- **set_text_opacity**: Set opacity with optional animation and easing
- **set_text_position**: Position text layers with anchor point alignment and animation
- **set_text_alignment**: Horizontal/vertical alignment and paragraph spacing controls
- **set_text_style**: Advanced styling with character-range support and expressions API
- **animate_text_properties**: Text animators for scale, rotation, position, opacity, tracking
- **get_text_properties**: Retrieve detailed text formatting and animator information

#### 🎬 Render Tools (6 tools)
- **add_to_render_queue**: Queue compositions with format, quality, resolution, timing settings
- **start_render**: Begin rendering with error handling and background options
- **export_frame**: Single frame export in multiple formats
- **create_proxy**: Generate proxy renders at various scales
- **clear_render_queue**: Clean up completed/failed items
- **batch_render_compositions**: Multi-composition rendering with templates

#### 🔷 Shape Tools (4 tools)
- **create_shape_layer**: Generate shapes (rectangle, ellipse, polygon, star, custom paths) with styling
- **animate_shape_path**: Shape animations (morph, trim, wiggle, scale, rotation)
- **create_shape_text**: Convert text to shape layers for advanced animation
- **add_shape_modifiers**: Apply repeater, offset, zig zag, round corners, pucker & bloat

#### 🎭 Mask Tools (4 tools)
- **create_mask**: Generate masks (rectangle, ellipse, polygon, custom paths) with feathering, opacity, blend modes
- **animate_mask**: Animate mask properties and path morphing
- **copy_mask**: Transfer masks between layers with keyframe preservation
- **create_rotoscope_mask**: Professional rotoscoping tools with tracking points

#### 🔧 Utility Tools (4 tools)
- **get_tool_list**: List all available tools with descriptions and category filtering
- **get_project_status**: Get comprehensive project information (compositions, footage, render queue status)
- **get_available_tool_count**: Count total available tools
- **detect_tool_category**: Categorize tools by functionality

### 🎨 Manual Tools Panel
Traditional button-based interface for quick access to common functions:
- Composition creation (Standard HD, 4K)
- Layer management (Add null, adjustment layer)
- Organization tools (Center anchor points, distribute layers)
- Animation helpers (Ease keyframes, sequence layers)
- Text and motion graphics tools
- Export and render utilities

### 🎬 Script Generator with AI Agent + RAG
- **Documentation-Driven Code Generation**: AI Agent searches After Effects documentation in real-time
- **Dynamic RAG Tool Calls**: Agent makes targeted documentation searches as needed during script generation
- **Accurate ExtendScript**: Generated code uses exact API methods and patterns from official docs
- **Progressive Research**: Multiple focused queries build comprehensive understanding
- **Source Citations**: Comments in generated code show which documentation was used

#### How the Script Generator Works:
1. **User Request**: Describe what you want to create in natural language
2. **Agent Analysis**: AI Agent breaks down the request into technical components
3. **RAG Tool Calls**: Agent searches documentation for each component:
   - "How to create TextLayer in After Effects"
   - "How to animate position property with keyframes"
   - "How to set keyframe easing for bounce effect"
4. **Documentation Integration**: Agent synthesizes information from all searches
5. **Script Generation**: Complete ExtendScript using documented methods and patterns

#### Quick Start:
```bash
# Start the RAG system for Script Generator
python3 start_script_generator_rag.py
```

Then use the Script Generator tab in the extension!

### 🎨 Dark Theme Support
- Matches After Effects interface
- Seamless integration with Adobe ecosystem

## Installation

1. Download the extension files
2. Copy to your CEP extensions folder:
   - **Windows**: `%APPDATA%\Adobe\CEP\extensions\`
   - **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/`
3. Restart After Effects
4. Enable the extension: Window > Extensions > Maximise AE Tools

## Usage

### AI Chat
1. Enter your Gemini API key (default key provided)
2. Start chatting in natural language:
   - "Create a 4K composition with a red solid layer"
   - "Animate the selected layer to move from left to right"
   - "Add a glow effect to all text layers"
   - "Export the current frame as PNG"

### Manual Tools
Click any button in the tools panel for immediate execution.

## AI Tool Calling Examples

The AI can understand and execute complex requests:

```
User: "Create a new composition, add some text that says 'Hello World', and animate it to fade in over 2 seconds"

AI Response: I'll help you create a composition with animated text. Let me:
1. Create a new composition
2. Add a text layer with "Hello World"  
3. Animate it to fade in over 2 seconds

[Executes: create_composition, create_text_layer, animate_layer]
```

```
User: "I need to organize my messy project and render the main comp"

AI Response: I'll clean up your project and set up rendering:
1. Organize project items into folders by type
2. Remove unused footage
3. Add your main composition to the render queue

[Executes: organize_project, remove_unused_footage, add_to_render_queue]
```

### Script Generator Examples

The Script Generator creates complete, documentation-accurate ExtendScript:

```
User: "Create a bouncing ball animation"

AI Agent Process:
🤖 Analyzing request... Need to research shape creation and animation
🔧 RAG Call: "How to create shape layer in After Effects"
🔧 RAG Call: "How to animate position property with keyframes"  
🔧 RAG Call: "How to set keyframe easing for bounce effect"
📚 Found documentation from: shapelayer.md, property.md, keyframe.md

Generated ExtendScript:
// Creates bouncing ball animation
// Based on documentation from shapelayer.md, property.md
app.beginUndoGroup("Bouncing Ball");
try {
    var comp = app.project.activeItem;
    var shapeLayer = comp.layers.addShape();
    var ellipse = shapeLayer.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
    // ... complete ExtendScript with proper API calls
    app.endUndoGroup();
    JSON.stringify({success: true, message: "Bouncing ball created!"});
} catch (err) {
    app.endUndoGroup();
    JSON.stringify({success: false, message: "Error: " + err.toString()});
}
```

## Technical Features

- **ExtendScript Integration**: Direct After Effects scripting
- **Comprehensive Tool Registry**: 63 tools across 9 categories
- **Parameter Validation**: Intelligent parameter filling when not provided
- **Error Handling**: Robust error reporting and recovery
- **Undo Support**: Proper After Effects undo/redo integration
- **Batch Operations**: Multi-layer and multi-composition support

## Development

Built with:
- **Frontend**: HTML5, CSS3, JavaScript (CEP)
- **Backend**: Adobe ExtendScript (JSX)
- **AI Integration**: Google Gemini API
- **Architecture**: Modular tool system with comprehensive registry

## License

Licensed under the MIT License. See LICENSE file for details.

## Support

For issues, feature requests, or contributions, please visit the project repository. 

# After Effects ExtendScript Validator

A comprehensive code validity checker for After Effects ExtendScript files written in Rust. This tool validates `.jsx` and `.jsxbin` files for syntax errors, API usage, and ExtendScript compatibility issues.

## Features

- ✅ **Syntax Validation**: Checks for balanced braces, brackets, and parentheses
- 🔍 **API Validation**: Validates After Effects object properties and methods
- ⚠️ **Compatibility Checks**: Identifies ExtendScript incompatible features (ES6+)
- 📊 **Detailed Reporting**: Line-by-line error and warning reporting
- 🚀 **Fast Performance**: Built in Rust for speed and reliability
- 📁 **Directory Support**: Recursively validate entire project directories
- 🔧 **Multiple Output Formats**: Text and JSON output options

## Installation

### From Source

```bash
git clone <repository-url>
cd ae-script-validator
cargo build --release
```

The binary will be available at `target/release/ae-validator`.

### Using Cargo

```bash
cargo install ae-script-validator
```

## Usage

### Validate a Single File

```bash
ae-validator script.jsx
```

### Validate All Files in a Directory

```bash
ae-validator -r /path/to/scripts/
```

### Show Warnings

```bash
ae-validator -w script.jsx
```

### JSON Output

```bash
ae-validator -j script.jsx
```

### Verbose Mode

```bash
ae-validator -v -r /path/to/scripts/
```

## Command Line Options

- `input`: Input file or directory to validate (required)
- `-r, --recursive`: Recursively validate all .jsx files in directory
- `-w, --warnings`: Show warnings in addition to errors
- `-v, --verbose`: Verbose output (shows files with no issues)
- `-j, --json`: Output results in JSON format
- `-h, --help`: Show help information

## Validation Features

### Syntax Checking

- Balanced braces `{}`
- Balanced parentheses `()`
- Balanced brackets `[]`
- Proper string and comment handling

### After Effects API Validation

Based on the official After Effects Scripting documentation:

- **Application object** (`app`) properties and methods
- **Project object** properties and methods
- **Layer objects** (Layer, AVLayer, etc.) properties and methods
- **Property objects** for animations and effects
- **CompItem objects** for compositions
- **Global functions** (alert, confirm, generateRandomNumber, etc.)

### ExtendScript Compatibility

Identifies modern JavaScript features not supported in ExtendScript:

- ❌ Arrow functions (`=>`)
- ❌ ES6 classes
- ❌ ES6 modules (import/export)
- ⚠️ let/const declarations (limited support)
- ⚠️ instanceof usage (may not work as expected)
- ⚠️ Math.random() usage (suggests generateRandomNumber())

### Deprecated API Detection

- Identifies deprecated After Effects APIs
- Provides suggestions for modern alternatives

## Example Output

### Text Output

```
📁 script.jsx
❌ Errors:
  Unknown method 'invalidMethod' on object 'app' at line 5
  Syntax error at line 12, column 15: Unmatched closing brace

⚠️  Warnings:
  Use generateRandomNumber() instead of Math.random() for better compatibility at line 8
  Deprecated API 'timecodeFilmType' used at line 15: Use feetFramesFilmType instead

📊 Summary:
  Files checked: 1
  Files with errors: 1
  Total errors: 2
  Total warnings: 2
```

### JSON Output

```json
{
  "files": [
    {
      "file": "script.jsx",
      "is_valid": false,
      "errors": [
        "Unknown method 'invalidMethod' on object 'app' at line 5",
        "Syntax error at line 12, column 15: Unmatched closing brace"
      ],
      "warnings": [
        "Use generateRandomNumber() instead of Math.random() for better compatibility at line 8"
      ]
    }
  ],
  "summary": {
    "total_files": 1,
    "files_with_errors": 1,
    "total_errors": 2,
    "total_warnings": 1
  }
}
```

## Supported After Effects Objects

The validator includes definitions for core After Effects objects:

- `app` (Application)
- `Project`
- `Layer` (base class)
- `AVLayer` 
- `Property`
- `CompItem`
- `RenderQueue`
- And many more...

## Integration

### CI/CD Integration

Use in continuous integration:

```yaml
name: Validate AE Scripts
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install ae-validator
        run: cargo install ae-script-validator
      - name: Validate scripts
        run: ae-validator -r ./scripts --json
```

### VS Code Integration

The JSON output format makes it easy to integrate with editors and IDEs for real-time validation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Adding New API Definitions

To add support for new After Effects objects or methods:

1. Update `src/api.rs` with new object definitions
2. Add appropriate validation logic
3. Include tests for the new functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on official Adobe After Effects Scripting documentation
- Built with Rust for performance and reliability
- Inspired by the need for better ExtendScript development tools 