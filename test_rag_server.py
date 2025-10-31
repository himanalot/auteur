#!/usr/bin/env python3
"""
Test script for RAG server functionality
"""

import requests
import json
import time

def test_rag_server():
    """Test RAG server endpoints"""
    base_url = "http://localhost:5002"
    
    print("🧪 Testing RAG Server\n")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1️⃣ Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is healthy!")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Server returned status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server!")
        print("   Make sure to run: python start_script_generator_rag.py")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test 2: Search endpoint
    print("\n2️⃣ Testing search endpoint...")
    test_queries = [
        "TextLayer creation methods",
        "Property setValueAtTime keyframe",
        "CompItem layers add"
    ]
    
    for query in test_queries:
        print(f"\n   Testing query: '{query}'")
        try:
            response = requests.post(
                f"{base_url}/search",
                json={"query": query, "top_k": 5},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    results = data.get("results", [])
                    print(f"   ✅ Found {len(results)} results")
                    for i, result in enumerate(results[:2]):  # Show first 2
                        print(f"      {i+1}. {result.get('file', 'Unknown')}")
                        print(f"         Preview: {result.get('content', '')[:100]}...")
                else:
                    print(f"   ❌ Search failed: {data.get('error', 'Unknown error')}")
            else:
                print(f"   ❌ Server error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Test 3: Multi-query simulation (what Enhanced RAG does)
    print("\n3️⃣ Testing multi-query search (Enhanced RAG simulation)...")
    multi_queries = [
        "TextLayer addText composition",
        "TextLayer font properties",
        "TextLayer sourceText formatting",
        "TextLayer text styling"
    ]
    
    all_results = []
    seen_files = set()
    
    for query in multi_queries:
        try:
            response = requests.post(
                f"{base_url}/search",
                json={"query": query, "top_k": 5},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    results = data.get("results", [])
                    for result in results:
                        file_name = result.get('file', 'Unknown')
                        if file_name not in seen_files:
                            all_results.append(result)
                            seen_files.add(file_name)
        except:
            pass
    
    print(f"\n   📊 Multi-query results:")
    print(f"      Total queries: {len(multi_queries)}")
    print(f"      Unique results: {len(all_results)}")
    print(f"      Unique sources: {len(seen_files)}")
    
    print("\n" + "=" * 50)
    print("✅ RAG Server Test Complete!")

if __name__ == "__main__":
    test_rag_server()