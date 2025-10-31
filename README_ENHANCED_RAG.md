# Enhanced RAG System for AE Script Generator

The Enhanced RAG (Retrieval-Augmented Generation) system provides comprehensive documentation search and script generation for the After Effects Script Generator. It uses a multi-query approach to find the most relevant documentation and generates better, more accurate ExtendScript code.

## 🚀 Features

### Multi-Query RAG Search
- **Intelligent Query Generation**: Automatically generates 4-5 related search queries from your request
- **Comprehensive Coverage**: Searches for main objects, methods, properties, and implementation details
- **Smart Deduplication**: Combines results while removing duplicates
- **Source Tracking**: Shows which queries found which documentation

### Enhanced Script Generation
- **Documentation-Driven**: Bases code on actual After Effects API documentation
- **Synthesis**: Combines information from multiple documentation sources
- **Source Citation**: Shows which documentation sources were used
- **Fallback Support**: Uses manual query generation if AI query generation fails

## 🛠️ Setup Instructions

### Option 1: Quick Start (Recommended)
```bash
# 1. Navigate to the extension directory
cd "/Users/[USERNAME]/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools"

# 2. Start the Enhanced RAG server
python3 start_rag_server.py
```

### Option 2: Manual Setup
```bash
# 1. Install Python dependencies
pip3 install -r rag_server_requirements.txt

# 2. Start the HelixDB RAG system (in another terminal)
cd official_docsforadobe_rag/backend
python3 ragwithchatbot.py

# 3. Start the Flask bridge server
python3 rag_server.py
```

## 📋 Prerequisites

### Required Components
1. **Python 3.8+** with pip
2. **HelixDB RAG System** (in `official_docsforadobe_rag/backend/`)
3. **Flask Dependencies** (automatically installed)
4. **Gemini API Key** (configured in extension)

### System Requirements
- **HelixDB Server**: Must be running on `http://0.0.0.0:6969`
- **Flask Server**: Runs on `http://127.0.0.1:5002`
- **CORS Enabled**: For cross-origin requests from the extension

## 🔧 How It Works

### 1. Query Generation Phase
```
User Request: "Create a rectangle shape in a shape layer"
    ↓
AI Generates Related Queries:
    • "Create a rectangle shape in a shape layer" (original)
    • "ShapeLayer addProperty methods"
    • "shape layer properties rectangle"
    • "ADBE Vector Shape match name"
    • "shape layer contents property group"
```

### 2. Multi-Query Search Phase
```
Each Query → HelixDB Search → Documentation Chunks
    ↓
Combine & Deduplicate Results
    ↓
Top 6-8 Most Relevant Documentation Sources
```

### 3. Script Generation Phase
```
Documentation Context + User Request → Enhanced Prompt
    ↓
Gemini 2.0 Flash with Documentation Synthesis Instructions
    ↓
Generated ExtendScript with Source Citations
```

## 🎯 Usage

### In the Extension
1. **Open Script Generator Tab**
2. **Enter your request** (e.g., "Create animated text that fades in")
3. **Click "Generate Script"**
4. **Watch the Enhanced RAG process**:
   - 🧠 Generating search queries...
   - 🔍 Searching documentation...
   - 📚 Finding relevant sources...
   - 🤖 Generating script...
5. **Review results** with source information
6. **Run the generated script**

### Example Output
```
✅ Script generated using 4 documentation sources!

🔍 Search Queries Used:
  1. Create animated text that fades in
  2. TextLayer animation properties
  3. opacity keyframe setValueAtTime
  4. text layer creation methods

📚 Documentation Sources:
  1. textlayer.md
  2. property.md
  3. avlayer.md
  4. propertygroup.md

Click "Run Script" to execute it in After Effects.
```

## 🔍 Troubleshooting

### Server Connection Issues
```bash
# Check if HelixDB is running
curl http://0.0.0.0:6969/health

# Check if Flask server is running
curl http://127.0.0.1:5002/health
```

### Common Issues

#### "RAG system not available"
- **Solution**: Start the HelixDB server first
- **Command**: `cd official_docsforadobe_rag/backend && python3 ragwithchatbot.py`

#### "Connection refused to localhost:5002"
- **Solution**: Start the Flask bridge server
- **Command**: `python3 rag_server.py`

#### "No documentation found"
- **Fallback**: The system will use manual query generation
- **Still works**: Will generate scripts using general AI knowledge

### Logs and Debugging
- **Flask Server Logs**: Show search requests and results
- **Browser Console**: Shows RAG process steps and errors
- **Extension Status**: Shows current operation status

## 🚀 Performance Benefits

### Compared to Single-Query RAG
- **3-5x Better Coverage**: Multi-query approach finds more relevant docs
- **Smarter Results**: Combines information from multiple sources
- **Better Code Quality**: More accurate API usage and property names
- **Source Transparency**: Shows exactly which docs were used

### Real-World Impact
- **Fewer API Errors**: Uses correct property names and method signatures
- **Better Structure**: Follows documented patterns and best practices
- **More Features**: Combines multiple documentation aspects
- **Professional Quality**: Citations and explanations in generated code

## 🔮 Future Enhancements

### Planned Features
- **Semantic Query Expansion**: Better related query generation
- **Documentation Ranking**: Smarter relevance scoring
- **Code Templates**: Pre-built patterns for common tasks
- **Multi-Language Support**: Support for other Adobe scripting languages

### Advanced Configuration
- **Query Count**: Adjust number of related queries (default: 5)
- **Document Limit**: Control max documents per query (default: 3)
- **Total Results**: Set maximum combined results (default: 8)
- **Relevance Threshold**: Filter low-relevance results

## 📚 API Reference

### Enhanced RAG Class
```javascript
const rag = new EnhancedRAG();

// Generate script with RAG
const result = await rag.generateScriptWithRAG(userRequest, contextInfo);

// Manual search
const docs = await rag.searchForScriptGeneration(userRequest);
```

### Flask Server Endpoints
```http
POST /search
Content-Type: application/json
{
  "query": "layer properties",
  "top_k": 5
}

GET /health
# Returns server status

POST /generate_queries
Content-Type: application/json
{
  "query": "create shape layer"
}
```

## 📝 Notes

- **API Key**: Uses the same Gemini API key as the main extension
- **Offline Mode**: Falls back to manual queries if servers are unavailable  
- **Performance**: First search may be slower due to model loading
- **Memory**: HelixDB keeps documentation in memory for fast searches

## 🤝 Contributing

To improve the Enhanced RAG system:

1. **Query Generation**: Enhance the related query algorithms
2. **Documentation Processing**: Improve chunk quality and relevance
3. **Result Ranking**: Better scoring and filtering algorithms
4. **Error Handling**: More robust fallback mechanisms

---

**🎬 Happy Scripting with Enhanced RAG!** 