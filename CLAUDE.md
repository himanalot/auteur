# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive Adobe After Effects CEP extension that combines multiple technologies:

1. **CEP Extension** - React/TypeScript frontend with Adobe ExtendScript backend
2. **Autonomous AI Agent System** - Self-directed AI that iteratively calls tools until task completion
3. **Rust Script Validator** - ExtendScript syntax and API validation tool
4. **AI-Powered RAG Systems** - Multiple documentation-driven script generation systems
5. **After Effects API Documentation** - Comprehensive AE scripting reference

## Current Development Focus

**Autonomous AI Agent Implementation**: We are building an AI agent that can:
- Reason through complex After Effects tasks autonomously
- Make decisions about tool usage and task completion
- Execute multi-step workflows without human intervention
- Evaluate its own progress and determine when tasks are sufficiently complete

## Build and Development Commands

### JavaScript/TypeScript (CEP Extension)
```bash
# Build the extension
npm run build

# Watch for changes during development
npm run watch

# Lint JSX files
npm run validate

# Fix linting issues
npm run lint-fix

# Install extension to Adobe CEP folder
npm run install-dev

# Enable CEP debug mode
npm run debug
```

### Rust (Script Validator)
```bash
# Build the validator
cargo build --release

# Run tests
cargo test

# Run the validator on a script
./target/release/ae-validator script.jsx

# Run with options
./target/release/ae-validator -r ./jsx/ -w -v
```

### Python (RAG Systems)
```bash
# Install dependencies
pip3 install -r requirements.txt
pip3 install -r rag_server_requirements.txt

# Start Enhanced RAG system
python3 start_rag_server.py

# Start AI Agent RAG system
python3 start_ai_agent_rag.py

# Start Script Generator RAG system
python3 start_script_generator_rag.py

# Start HelixDB backend (required for RAG)
cd official_docsforadobe_rag/backend
python3 ragwithchatbot.py
```

## Architecture Overview

### Multi-Language System
- **Frontend**: React/TypeScript (Modern component-based CEP panel interface)
- **Backend**: Node.js/Express + WebSocket (Real-time AI agent communication)
- **ExtendScript**: Adobe JSX files for AE automation
- **Validator**: Rust (fast ExtendScript validation)
- **AI Systems**: Python (RAG documentation search and script generation)

### Key Components

#### 1. React Frontend (`/src/`, `/build/`)
- **SimpleChatTab.tsx**: React-based chat interface with autonomous agent capabilities
- **useSimpleChatManager.ts**: Hook managing AI agent state, WebSocket communication, and tool calling
- **AIChatTab.tsx**: Legacy vanilla JavaScript chat interface (maintained for compatibility)
- **MainInterface.tsx**: Tab-based navigation system

#### 2. ExtendScript Backend (`/jsx/`)
- **jsx/ae_tools.jsx**: 63+ ExtendScript tools organized in 9 categories  
- **jsx/tools/**: Modular tool implementations (animation, composition, text, etc.)

#### 3. Node.js WebSocket Server (`/backend/`)
- **server.js**: Express server with WebSocket support for real-time agent communication
- **services/ai-router.js**: Routes AI requests to Claude/Gemini with tool calling
- **services/rag.js**: Documentation search integration

#### 4. Rust Validator (`/rust-src/`)
- **Comprehensive API**: 15-20% implementation of AE scripting API
- **Validation Engine**: Syntax, property, and method validation
- **Match Names**: 1000+ effect, layer, and property identifiers
- **Performance**: Fast validation for large codebases

#### 5. AI RAG Systems (`/official_docsforadobe_rag/`, Python files)
- **Enhanced RAG**: Multi-query documentation search
- **AI Agent RAG**: Dynamic tool-driven documentation lookup
- **HelixDB Backend**: Document embedding and retrieval system

#### 6. Documentation (`/after-effects-scripting-guide/`, `/ae-scripting-docs/`)
- **Comprehensive AE API**: Complete scripting reference
- **Implementation Gap**: ~80% of documented APIs not yet in Rust validator

### Data Flow Patterns

#### Autonomous Agent Workflow
```
User Request → Agent Planning → Iterative Tool Calling → Progress Evaluation → Completion Decision → Final Response
```

#### Real-time Communication Flow
```
React Frontend ↔ WebSocket ↔ Node.js Backend ↔ AI Models (Claude/Gemini) ↔ RAG Systems
```

#### Script Generation → Validation → Execution
```
User Request → RAG Search → Script Generation → Rust Validation → AE Execution
```

## Critical Development Notes

### ExtendScript Requirements
- **Target**: ES3 compatibility (After Effects constraint)
- **No Modern JS**: No arrow functions, classes, let/const, etc.
- **Undo Groups**: Always wrap operations in `app.beginUndoGroup()` / `app.endUndoGroup()`
- **Error Handling**: Use JSON.stringify() for error responses, NOT alert()

### RAG System Dependencies
- **HelixDB Server**: Must run on `http://0.0.0.0:6969`
- **Flask Bridge**: Runs on `http://127.0.0.1:5002`
- **Sequential Startup**: HelixDB first, then Flask server

### Rust Validator Limitations
- **API Coverage**: Only 15-20% of full AE scripting API implemented
- **Missing Areas**: Text system, shapes, masks, 3D, effects validation, expressions
- **Match Names**: Comprehensive but validation logic incomplete

## Testing

### Manual Testing
- **CEP Extension**: Test in After Effects with `Window > Extensions > Maximise AE Tools`
- **Validator**: Test with sample JSX files in `/jsx/` directory
- **RAG Systems**: Test with curl commands to Flask endpoints

### Test Files
- **Valid Scripts**: `simple_valid.jsx`, `valid_test.jsx`
- **Invalid Scripts**: `debug_test.jsx`, `comprehensive_test.jsx`
- **Tool Tests**: Individual tool JSX files for each category

## Extension Installation

### Development Setup
1. Copy extension to: `~/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools/`
2. Run `npm run debug` to enable CEP debug mode
3. Restart After Effects
4. Access via `Window > Extensions > Maximise AE Tools`

### Production Packaging
- Use Adobe ZXP Packager or similar tool
- Include all files except `node_modules`, `target`, and Python cache

## Common Issues

### CEP Extension
- **Debug Mode**: Must be enabled for development
- **Cross-Origin**: RAG systems require CORS configuration
- **API Keys**: Gemini API key required for AI features

### Rust Validator
- **Compilation**: Requires stable Rust toolchain
- **Dependencies**: May need system libraries on some platforms
- **API Gaps**: Many validation rules not implemented

### RAG Systems
- **Server Order**: Start HelixDB backend before Flask bridge
- **Dependencies**: Multiple Python packages with specific versions
- **Documentation**: Embedding process required for first run

## Key Files to Understand

### Architecture
- `src/lib.rs` - Rust validator entry point
- `js/main.js` - CEP extension main logic
- `jsx/ae_tools.jsx` - ExtendScript tools registry

### Configuration
- `package.json` - Node.js dependencies and scripts
- `Cargo.toml` - Rust dependencies and build config
- `CSXS/manifest.xml` - CEP extension manifest

### Documentation
- `README.md` - Main project documentation
- `README_AI_AGENT_RAG.md` - AI Agent system details
- `README_ENHANCED_RAG.md` - Enhanced RAG system details

## Development Workflow

1. **React Frontend Changes**: Edit `/src/` files, run `npm run build`, copy to extension root
2. **Backend Changes**: Edit `/jsx/` files, test in After Effects
3. **WebSocket Server**: Edit `/backend/` files, restart Node.js server
4. **Validator Changes**: Edit `/rust-src/` files, run `cargo build`
5. **RAG Changes**: Edit Python files, restart servers
6. **Documentation**: Update markdown files and activity log

## Activity Tracking

**All development activities must be logged in `docs/activity.md`**:
- Include every user prompt and assistant response
- Document all code changes and their reasoning
- Track architectural decisions and their impacts
- Log debugging processes and solutions
- Maintain comprehensive development history

## Future Enhancement Areas

### High Priority
- **Text System**: Complete TextDocument API implementation in Rust
- **Shape Layers**: Full shape layer validation
- **Expression Engine**: Expression syntax validation

### Medium Priority
- **3D Functionality**: Camera and light layer validation
- **Effects System**: Per-effect parameter validation
- **Mask System**: Complete mask property validation

### Low Priority
- **Render Queue**: Output module validation
- **Import/Export**: File format validation
- **Performance**: Optimization for large projects

## Deployment Notes

### Build Process Reminder
- **Always copy latest built JS file after building**:
  - Bash command to update main.js after build: 
    ```bash
    cp build/static/js/main.ea300781.js js/main.js
    ```
  - Ensure this is done after every build to keep extension updated to match browser requirements