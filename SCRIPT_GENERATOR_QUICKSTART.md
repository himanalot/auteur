# Script Generator Quick Start Guide

Get up and running with the AI-powered Script Generator in 5 minutes!

## 🚀 Quick Setup

### 1. Start the RAG System
```bash
# Navigate to your extension directory
cd "/Users/[YOUR_USERNAME]/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools"

# Start the Script Generator RAG system
python3 start_script_generator_rag.py
```

You'll see:
```
🎬 SCRIPT GENERATOR RAG SYSTEM STARTUP
═══════════════════════════════════════
✅ RAG backend system working correctly
🚀 Starting Script Generator RAG Server...
🌐 Server will run at: http://127.0.0.1:5002
```

### 2. Open After Effects
1. Launch After Effects
2. Go to **Window > Extensions > Maximise AE Tools**
3. Click the **Script Generator** tab

### 3. Generate Your First Script
Type a request like:
- "Create animated text that says Hello World"
- "Make a bouncing red circle"
- "Create 5 layers and animate them in sequence"

Watch the AI Agent work:
```
🤖 AI Agent analyzing request and calling RAG tool as needed...
🔧 RAG Call: "How to create TextLayer"
🔧 RAG Call: "How to animate opacity property"
✅ Script generated using 2 RAG tool calls!
```

### 4. Run the Script
Click **"Run Script"** and watch After Effects execute your generated code!

## 🎯 Example Requests

### Simple Requests
- "Create a red solid layer"
- "Add text that says 'Welcome'"
- "Make the selected layer fade out"

### Animation Requests  
- "Create bouncing ball animation"
- "Animate text sliding in from left"
- "Make a logo reveal with glow effect"

### Complex Requests
- "Create 3 text layers and animate them to appear in sequence"
- "Build a lower third with animated background"
- "Create particle-like animation with 20 small circles"

## 🔧 How It Works Behind the Scenes

```
Your Request: "Create animated logo reveal"
    ↓
AI Agent: "I need to research logo import, scale animation, and effects"
    ↓
RAG Calls:
├─ "How to import footage into composition"
├─ "How to animate scale property with keyframes"  
├─ "How to apply glow effects to layer"
└─ "How to sequence animations"
    ↓
Documentation Found → Script Generated → Ready to Run!
```

## 🎬 Advanced Features

### Context Awareness
The AI Agent understands your current After Effects state:
- Active composition
- Selected layers
- Project structure

### Progressive Research
Each RAG call builds on previous knowledge:
1. First call: Learn basic object creation
2. Second call: Learn property animation  
3. Third call: Learn advanced effects
4. Result: Comprehensive, accurate script

### Source Citations
Generated scripts include comments showing which documentation was used:
```javascript
// Based on textlayer.md documentation
var textLayer = comp.layers.addText("Hello World");

// Based on property.md keyframe methods
textLayer.property("Opacity").setValueAtTime(0, 0);
```

## 🚨 Troubleshooting

### "RAG Tool error: Connection refused"
**Fix**: Make sure the RAG server is running
```bash
python3 start_script_generator_rag.py
```
**Check**: `curl http://127.0.0.1:5002/health`

### "No RAG tool calls made"
**Cause**: Normal! Simple requests don't need documentation
**Example**: "Set variable to 5" doesn't require AE docs

### "Script error when running"
**Fix**: Check the console for specific ExtendScript errors
**Tip**: Generated scripts include error handling with JSON feedback

### Error Handling Design
The system enforces **NO popup alerts** - all errors appear in the extension interface:
```javascript
// Scripts use this pattern to show errors in extension
JSON.stringify({
    success: false,
    message: "Script Error: " + err.toString(),
    line: err.line || "unknown"
});
```
**Never**: alert() popups or return statements outside functions  
**Always**: JSON error responses that display in the extension

## 🎯 Tips for Better Results

### Be Specific
❌ "Make animation"  
✅ "Create text that bounces 3 times and fades out"

### Include Details
❌ "Add effects"  
✅ "Add glow effect with blue color and soft edges"

### Mention Timing
❌ "Animate the layer"  
✅ "Animate the layer over 2 seconds with ease in-out"

### Reference After Effects Concepts
✅ "Create shape layer with ellipse"  
✅ "Add expression to position property"  
✅ "Set keyframes at 1 second intervals"

## 🎬 Ready to Create!

The Script Generator with AI Agent + RAG provides:

✅ **Documentation-accurate code** - Uses real AE API methods  
✅ **Context-aware generation** - Understands your project state  
✅ **Progressive research** - Builds knowledge through multiple searches  
✅ **Source transparency** - Shows which docs were used  
✅ **Error handling** - Scripts include proper error management  

**Start generating professional ExtendScript code with natural language requests!** 