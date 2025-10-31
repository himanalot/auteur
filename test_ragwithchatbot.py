#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple test script to see top chunks returned by ragwithchatbot.py search
"""

import sys
import os

# Add the backend directory to path
backend_path = os.path.join(os.path.dirname(__file__), 'official_docsforadobe_rag', 'backend')
sys.path.insert(0, backend_path)

def test_search_chunks():
    """Test the search_documentation function and show top chunks"""
    try:
        from ragwithchatbot import search_documentation
        
        print("TESTING SEARCH_DOCUMENTATION - TOP CHUNKS")
        print("=" * 60)
        
        # Single test query
        test_query = input("Enter your search query: ").strip()
        if not test_query:
            test_query = "how to create a text layer"
            print(f"Using default query: '{test_query}'")
        
        print(f"\nSearching for: '{test_query}'")
        print("-" * 60)
        
        # Get results
        results = search_documentation(test_query, top_k=5)
        
        if results:
            print(f"Found {len(results)} chunks:\n")
            
            for i, result in enumerate(results, 1):
                print(f"CHUNK {i}:")
                print(f"  File: {result['file']}")
                print(f"  Relevance Score: {result.get('relevance_score', 'N/A')}")
                print(f"  Content:")
                print(f"    {result['content']}")
                print(f"  Content Length: {len(result['content'])} chars")
                print("-" * 60)
        else:
            print("No results found")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_search_chunks() 