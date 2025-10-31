#!/usr/bin/env python3
"""
Simple RAG Search Script for After Effects Documentation
Uses the already processed data and HelixDB instance
"""

import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
from helix.client import Query, Client
from helix.instance import Instance
from helix.types import Payload

# Load environment variables
load_dotenv()

# Initialize Gemini client
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

client = genai.Client(api_key=api_key)

# Initialize HelixDB client
db = Client(local=True)

# Query classes for HelixDB
class search_docs_rag(Query):
    def __init__(self, query_vector, k=5):
        super().__init__()
        self.query_vector = query_vector
        self.k = k
    
    def query(self):
        return [{"query": self.query_vector, "k": self.k}]
    
    def response(self, response):
        return response

# Search function
def search_ae_docs(user_question, top_k=5):
    """Search the Adobe After Effects documentation using RAG"""
    try:
        print(f"🔍 Searching for: {user_question}")
        
        # Embed the user question
        result = client.models.embed_content(
            model="models/text-embedding-004",
            contents=user_question,
            config=types.EmbedContentConfig(task_type="QUESTION_ANSWERING")
        )
        
        # Extract the embedding
        query_embedding = result.embeddings[0].values
        
        # Search the docs
        # NOTE: there is a little bug in helixdb that is currently being fixed - the total chunks is hardcoded for now
        total_chunks = 748
        search_query = search_docs_rag(query_embedding, k=total_chunks)
        search_results = db.query(search_query)
        
        results_data = []
        
        if search_results and search_results[0]:
            all_results = search_results[0].get('embedding_edges', [])
            
            # NOTE: bug that is being fixed - the results are reversed for now (list is flipped currently in Rust implementation)
            reversed_results = list(reversed(all_results))
            top_results = reversed_results[:top_k]
            
            # Process the results
            for i, result in enumerate(top_results):
                chunk = result.get('chunk', 'No chunk content')
                if isinstance(chunk, list) and len(chunk) > 0:
                    chunk = chunk[0]
                
                subchapter_title = result.get('subchapter_title', 'Unknown file')
                if isinstance(subchapter_title, list) and len(subchapter_title) > 0:
                    subchapter_title = subchapter_title[0]
                
                result_data = {
                    'rank': i + 1,
                    'file': subchapter_title,
                    'content': chunk
                }
                results_data.append(result_data)
                
                print(f"Result {i+1}: {subchapter_title}")
                print(f"Content: {chunk}")
                print("─" * 80)
        else:
            print("No results found")
            
        return results_data
            
    except Exception as e:
        print(f"Error searching: {e}")
        import traceback
        traceback.print_exc()
        return []

def search_ae_docs_json(user_question, top_k=5):
    """Search and return results as JSON for integration with CEP extension"""
    try:
        # Embed the user question
        result = client.models.embed_content(
            model="models/text-embedding-004",
            contents=user_question,
            config=types.EmbedContentConfig(task_type="QUESTION_ANSWERING")
        )
        
        query_embedding = result.embeddings[0].values
        
        # Search the docs
        total_chunks = 748
        search_query = search_docs_rag(query_embedding, k=total_chunks)
        search_results = db.query(search_query)
        
        if search_results and search_results[0]:
            all_results = search_results[0].get('embedding_edges', [])
            reversed_results = list(reversed(all_results))
            top_results = reversed_results[:top_k]
            
            results = []
            for i, result in enumerate(top_results):
                chunk = result.get('chunk', 'No chunk content')
                if isinstance(chunk, list) and len(chunk) > 0:
                    chunk = chunk[0]
                
                subchapter_title = result.get('subchapter_title', 'Unknown file')
                if isinstance(subchapter_title, list) and len(subchapter_title) > 0:
                    subchapter_title = subchapter_title[0]
                
                results.append({
                    'rank': i + 1,
                    'file': subchapter_title,
                    'content': chunk
                })
            
            return {
                'success': True,
                'query': user_question,
                'results': results,
                'total_results': len(results)
            }
        else:
            return {
                'success': False,
                'query': user_question,
                'error': 'No results found',
                'results': []
            }
            
    except Exception as e:
        return {
            'success': False,
            'query': user_question,
            'error': str(e),
            'results': []
        }

if __name__ == "__main__":
    # Test search
    test_question = "How do I check if footage is missing in After Effects?"
    print("🚀 Testing After Effects Documentation RAG Search")
    print("=" * 60)
    
    results = search_ae_docs(test_question, top_k=3)
    
    print("\n" + "=" * 60)
    print("✅ Search completed!")
    print(f"Found {len(results)} relevant results")
