#!/usr/bin/env python3
"""
Flask server to bridge JavaScript frontend with Python RAG system
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json

# Add the backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'official_docsforadobe_rag', 'backend'))

try:
    from ragwithchatbot import search_documentation
    print("✅ Successfully imported RAG system")
except ImportError as e:
    print(f"❌ Failed to import RAG system: {e}")
    search_documentation = None

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/search', methods=['POST'])
def search_endpoint():
    """Search endpoint for RAG queries"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing query parameter'
            }), 400
        
        query = data['query']
        top_k = data.get('top_k', 5)
        
        print(f"🔍 Searching for: {query} (top_k={top_k})")
        
        if search_documentation is None:
            return jsonify({
                'success': False,
                'error': 'RAG system not available'
            }), 500
        
        # Search the documentation
        results = search_documentation(query, top_k=top_k)
        
        # Format results for JavaScript consumption
        formatted_results = []
        for i, result in enumerate(results):
            formatted_results.append({
                'rank': i + 1,
                'file': result.get('file', 'Unknown'),
                'content': result.get('content', ''),
                'relevance_score': result.get('relevance_score', 0)
            })
        
        return jsonify({
            'success': True,
            'query': query,
            'results': formatted_results,
            'total_results': len(formatted_results)
        })
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'rag_available': search_documentation is not None
    })

@app.route('/generate_queries', methods=['POST'])
def generate_queries_endpoint():
    """Generate related queries endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing query parameter'
            }), 400
        
        # For now, just return the original query
        # This could be enhanced to use the Python RAG system's query generation
        original_query = data['query']
        
        # Simple manual query generation similar to JavaScript version
        queries = [original_query]
        query_lower = original_query.lower()
        
        if 'create' in query_lower or 'add' in query_lower:
            if 'layer' in query_lower:
                queries.extend(['add layer to composition', 'layer creation methods'])
            if 'shape' in query_lower:
                queries.extend(['shape layer properties', 'addProperty shape'])
            if 'text' in query_lower:
                queries.extend(['text layer methods', 'TextLayer properties'])
        
        if 'property' in query_lower:
            queries.extend(['property setValue getValue', 'PropertyGroup addProperty'])
        
        if 'keyframe' in query_lower:
            queries.extend(['setValueAtTime keyframe', 'Property keyframe methods'])
        
        # Remove duplicates and limit to 5
        unique_queries = list(dict.fromkeys(queries))[:5]
        
        return jsonify({
            'success': True,
            'original_query': original_query,
            'generated_queries': unique_queries
        })
        
    except Exception as e:
        print(f"❌ Query generation error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting RAG Server...")
    print("📚 RAG System Available:", search_documentation is not None)
    
    # Run on port 5002 with debug mode
    app.run(host='127.0.0.1', port=5002, debug=True) 