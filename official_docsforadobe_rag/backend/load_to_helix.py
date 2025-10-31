#!/usr/bin/env python3
"""
Load pre-embedded Adobe After Effects documentation into HelixDB
Uses existing embeddings from processed_docs/embedded_docs.json
"""

import json
import os
from pathlib import Path
from collections import defaultdict
from helix.client import Query, Client

# Load existing embedded documents
DOCS_DIR = Path(__file__).parent / "processed_docs"
EMBEDDED_DOCS_FILE = DOCS_DIR / "embedded_docs.json"

print(f"Loading embedded documents from: {EMBEDDED_DOCS_FILE}")
with open(EMBEDDED_DOCS_FILE, "r", encoding="utf-8") as f:
    embedded_docs = json.load(f)

print(f"Loaded {len(embedded_docs)} embedded documents")

# Initialize HelixDB client
db = Client(local=True)
print("Connected to HelixDB")

# Define Query classes for the new schema
class load_chapter(Query):
    def __init__(self, chapter_index, title, content):
        super().__init__()
        self.chapter_index = chapter_index
        self.title = title
        self.content = content
    
    def query(self):
        return [{"chapter_index": self.chapter_index, "title": self.title, "content": self.content}]
    
    def response(self, response):
        return response

class load_embedding(Query):
    def __init__(self, subchapter_id, chunk, vector):
        super().__init__()
        self.subchapter_id = subchapter_id
        self.chunk = chunk
        self.vector = vector
    
    def query(self):
        return [{"subchapter_id": self.subchapter_id, "chunk": self.chunk, "vector": self.vector}]
    
    def response(self, response):
        return response

class search_docs_rag(Query):
    def __init__(self, query_vector, k=5):
        super().__init__()
        self.query_vector = query_vector
        self.k = k
    
    def query(self):
        return [{"query": self.query_vector, "k": self.k}]
    
    def response(self, response):
        return response

def load_all_data_to_helix(docs):
    """Load data into HelixDB using individual queries instead of nested loops"""
    print("Loading data to HelixDB using individual queries...")
    
    # Organize by category
    chapters_data = defaultdict(lambda: defaultdict(list))
    for doc in docs:
        category = doc['category']
        file_name = doc['path'].split('/')[-1]
        chapters_data[category][file_name].append({
            'chunk': doc['content'],
            'vector': doc['embedding']
        })
    
    # Track loaded subchapters for embedding association
    subchapter_map = {}
    
    # Load chapters and subchapters
    for chapter_idx, (category, files) in enumerate(chapters_data.items()):
        print(f"Loading Chapter {chapter_idx} ({category}): {len(files)} files")
        
        for file_name, chunks in files.items():
            # Load chapter and subchapter
            try:
                load_query = load_chapter(
                    chapter_index=chapter_idx,
                    title=file_name,
                    content=f"After Effects {category} documentation for {file_name}"
                )
                result = db.query(load_query)
                
                # Extract the subchapter node ID from the response
                subchapter_id = None
                if result and len(result) > 0:
                    if 'subchapter_node' in result[0]:
                        subchapter_node = result[0]['subchapter_node']
                        if isinstance(subchapter_node, dict) and 'id' in subchapter_node:
                            subchapter_id = subchapter_node['id']
                
                if subchapter_id:
                    subchapter_map[f"{chapter_idx}_{file_name}"] = subchapter_id
                    
                    # Load embeddings for this subchapter
                    for chunk_data in chunks:
                        embedding_query = load_embedding(
                            subchapter_id=subchapter_id,
                            chunk=chunk_data['chunk'],
                            vector=chunk_data['vector']
                        )
                        db.query(embedding_query)
                        
                    print(f"  Loaded {len(chunks)} chunks for {file_name}")
                else:
                    print(f"  Failed to load {file_name}")
                    
            except Exception as e:
                print(f"  Error loading {file_name}: {e}")
    
    return subchapter_map

def search_ae_docs(user_question, top_k=5):
    """Search the Adobe After Effects docs using vector similarity"""
    try:
        from google import genai
        from google.genai import types
        
        # Initialize Gemini client for embedding
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        client = genai.Client(api_key=api_key)
        
        # Embed the user question
        result = client.models.embed_content(
            model="models/text-embedding-004",
            contents=user_question,
            config=types.EmbedContentConfig(task_type="QUESTION_ANSWERING")
        )
        
        # Extract the embedding
        query_embedding = result.embeddings[0].values
        
        # Search the docs
        search_query = search_docs_rag(query_embedding, k=top_k)
        search_results = db.query(search_query)
        
        if search_results and search_results[0]:
            all_results = search_results[0].get('embedding_edges', [])
            
            # Print the results
            for i, result in enumerate(all_results):
                chunk = result.get('chunk', 'No chunk content')
                if isinstance(chunk, list) and len(chunk) > 0:
                    chunk = chunk[0]
                
                subchapter_title = result.get('subchapter_title', 'Unknown file')
                if isinstance(subchapter_title, list) and len(subchapter_title) > 0:
                    subchapter_title = subchapter_title[0]
                
                print(f"Result {i+1}: {subchapter_title}")
                print(f"Content: {chunk}")
                print("─" * 80)
        else:
            print("No results found")
            
    except Exception as e:
        print(f"Error searching: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Load all documents
    test_docs = embedded_docs  # Load all documents
    print(f"\nStarting to load {len(test_docs)} documents...")
    subchapter_mapping = load_all_data_to_helix(test_docs)
    print(f"\n✅ Successfully loaded {len(subchapter_mapping)} subchapters to HelixDB")
    
    if len(subchapter_mapping) > 0:
        # Test search
        print("\n" + "="*80)
        print("Testing search functionality:")
        search_ae_docs("ADBE Glo2 Glow effect layer", top_k=3)
    else:
        print("No data loaded, skipping search test")