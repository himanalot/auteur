# RAG Pipeline for After Effects Extension

This RAG (Retrieval-Augmented Generation) pipeline provides intelligent tool recommendations for the After Effects extension by leveraging the official After Effects scripting documentation.

## 🚀 Overview

The pipeline consists of three main components:

1. **Scraper** (`python/scraper.py`) - Scrapes the AE scripting documentation
2. **Embedder** (`python/embedder.py`) - Generates vector embeddings using OpenAI's text-embedding-3-small
3. **Query System** (`python/rag_query.py`) - Provides intelligent tool recommendations

## 📋 Prerequisites

### Required Software
- Python 3.8 or higher
- OpenAI API key
- Internet connection for scraping

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Set OpenAI API Key
```bash
export OPENAI_API_KEY='your-openai-api-key-here'
```

## 🏃‍♂️ Quick Start

### Option 1: Run Complete Pipeline
```bash
python run_pipeline.py
```

This will:
1. Scrape ~150 pages from the AE docs
2. Generate embeddings for all content
3. Test the RAG system with sample queries

### Option 2: Run Individual Steps

**Scrape only:**
```bash
python run_pipeline.py --scrape-only --max-pages 200
```

**Generate embeddings only:**
```bash
python run_pipeline.py --embed-only
```

**Test RAG system only:**
```bash
python run_pipeline.py --test-only
```

## 📊 Pipeline Details

### 1. Documentation Scraping

The scraper (`python/scraper.py`) crawls https://ae-scripting.docsforadobe.dev/ and extracts:

- **Content**: Main documentation text, code examples, properties
- **Metadata**: Page titles, sections, URLs, timestamps
- **Structure**: Hierarchical organization of documentation

**Features:**
- Async scraping with rate limiting
- Automatic URL discovery
- Content deduplication
- Structured metadata extraction

**Output:** `ae_docs_scraped.json` (~10-50MB depending on content)

### 2. Vector Embedding

The embedder (`python/embedder.py`) processes scraped content:

- **Chunking**: Splits large documents into ~1000 token chunks with overlap
- **Embedding**: Uses OpenAI's `text-embedding-3-small` (1536 dimensions)
- **Storage**: SQLite database with vector similarity search

**Features:**
- Intelligent text chunking
- Batch processing with rate limiting
- SQLite storage with indexes
- Metadata preservation

**Output:** `ae_docs_vectors.db` (SQLite database)

### 3. RAG Query System

The query system (`python/rag_query.py`) provides intelligent recommendations:

- **Intent Extraction**: Analyzes user queries for actions, objects, parameters
- **Tool Mapping**: Maps intents to specific AE tools and workflows
- **Context Search**: Vector similarity search through documentation
- **Confidence Scoring**: Ranks recommendations by relevance

**Example Query:**
```python
query = "create a red circle that moves to the right"

# Returns:
{
  "query": "create a red circle that moves to the right",
  "recommendations": [
    {
      "tool": "create_shape_layer",
      "confidence": 0.85,
      "reasoning": "Detected 'create' intent. Working with: circle.",
      "parameters": {
        "shape": "ellipse",
        "fillColor": [1, 0, 0]
      },
      "workflow": [
        "1. create_composition",
        "2. create_shape_layer", 
        "3. animate_layer"
      ]
    }
  ]
}
```

## 🛠️ Configuration

### Scraper Settings
```python
# In python/scraper.py
class AEDocscraper:
    def __init__(self, base_url="https://ae-scripting.docsforadobe.dev/"):
        self.rate_limit_delay = 1.0  # Seconds between requests
```

### Embedding Settings
```python
# In python/embedder.py
class AEEmbeddingPipeline:
    def __init__(self):
        self.embedding_model = "text-embedding-3-small"
        self.max_chunk_size = 1000  # Tokens per chunk
        self.chunk_overlap = 100    # Token overlap
```

### Tool Mappings
Edit `load_tool_mappings()` in `python/rag_query.py` to customize tool categories and workflows.

## 📁 File Structure

```
├── python/
│   ├── scraper.py          # Documentation scraper
│   ├── embedder.py         # Embedding pipeline  
│   └── rag_query.py        # Query system
├── run_pipeline.py         # Main pipeline runner
├── requirements.txt        # Python dependencies
├── README_RAG.md          # This documentation
├── ae_docs_scraped.json   # Scraped content (generated)
└── ae_docs_vectors.db     # Vector database (generated)
```

## 🔍 Testing the System

### Sample Queries
```python
test_queries = [
    "create a red circle that moves to the right",
    "add a blur effect to my text",
    "animate layer opacity from 100 to 0",
    "make a new composition with shapes", 
    "create typewriter text animation"
]
```

### Expected Output
Each query returns:
- **Tool recommendations** with confidence scores
- **Parameter hints** extracted from the query
- **Workflow suggestions** for multi-step processes
- **Documentation context** supporting the recommendation

## ⚙️ Integration with Extension

### JavaScript Integration
```javascript
// In your extension's JavaScript
class RAGHelper {
    constructor() {
        this.pythonPath = "python"; // Adjust path as needed
        this.scriptPath = "./python/rag_query.py";
    }
    
    async getToolRecommendations(userQuery) {
        // Call Python RAG system
        const result = await this.callPythonScript(userQuery);
        return JSON.parse(result);
    }
    
    async callPythonScript(query) {
        // Implementation depends on your CEP environment
        // Could use Node.js child_process or CEP's file system
    }
}
```

### Real-time Suggestions
The RAG system can provide:
- **Auto-complete** for tool functions
- **Parameter suggestions** based on context
- **Workflow recommendations** for complex tasks
- **Documentation links** for learning

## 🎯 Performance

### Typical Performance:
- **Scraping**: ~150 pages in 3-5 minutes
- **Embedding**: ~500 chunks in 2-3 minutes  
- **Query Response**: <1 second per query
- **Database Size**: ~10-20MB for full docs

### Optimization Tips:
- Use `--max-pages` to limit scraping for testing
- Cache embeddings - only re-run when docs change
- Consider using lighter embedding models for faster responses

## 🐛 Troubleshooting

### Common Issues:

**"OpenAI API key not found"**
```bash
export OPENAI_API_KEY='your-key-here'
# or add to your shell profile
```

**"Module not found"**
```bash
pip install -r requirements.txt
```

**"Rate limit exceeded"**
- The scraper includes delays, but you may need to increase `rate_limit_delay`
- OpenAI has rate limits on embedding API

**"Empty results"**
- Check that scraping completed successfully
- Verify the vector database was created
- Test with simple queries first

### Debug Mode:
```python
# Add to any script for debugging
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🚀 Next Steps

1. **Run the pipeline** to generate your knowledge base
2. **Test with your own queries** to verify accuracy
3. **Integrate with your extension** using the query API
4. **Customize tool mappings** for your specific workflow
5. **Set up periodic updates** to keep docs current

## 📚 Additional Resources

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [After Effects Scripting Guide](https://ae-scripting.docsforadobe.dev/)
- [CEP Extension Development](https://github.com/Adobe-CEP/CEP-Resources)

## 🤝 Contributing

To improve the RAG pipeline:
1. **Add more tool mappings** in `rag_query.py`
2. **Enhance intent extraction** with better NLP
3. **Optimize chunking strategy** for better context
4. **Add support for other documentation sources**

---

💡 **Pro Tip**: Start with a smaller scrape (`--max-pages 50`) to test the pipeline quickly, then run the full scrape once everything is working! 