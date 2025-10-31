#!/usr/bin/env python3
"""
Test what endpoints are actually available in HelixDB
"""

import requests
import json

def test_helix_endpoints():
    """Test various HelixDB endpoints to find what's available"""
    print("🔍 Testing HelixDB Endpoints...")
    print("=" * 40)
    
    base_url = "http://0.0.0.0:6969"
    
    # Known endpoints from server startup
    endpoints_to_test = [
        # From server logs
        "/load_docs_rag",
        "/get_chapter_content", 
        "/create_chapter",
        "/search_docs_rag",
        # MCP endpoints
        "/mcp/init",
        "/mcp/call_tool",
        "/mcp/next",
        "/mcp/schema_resource",
        # Common endpoints
        "/status",
        "/health",
        "/deploy",
        "/queries",
        "/submit",
        "/execute"
    ]
    
    working_endpoints = []
    
    for endpoint in endpoints_to_test:
        try:
            # Try GET first
            response = requests.get(f"{base_url}{endpoint}", timeout=2)
            if response.status_code != 404:
                print(f"✅ GET {endpoint}: {response.status_code}")
                working_endpoints.append(f"GET {endpoint}")
            else:
                # Try POST
                response = requests.post(f"{base_url}{endpoint}", json={}, timeout=2)
                if response.status_code != 404:
                    print(f"✅ POST {endpoint}: {response.status_code}")
                    working_endpoints.append(f"POST {endpoint}")
                else:
                    print(f"❌ {endpoint}: 404")
        except Exception as e:
            print(f"❌ {endpoint}: {e}")
    
    print(f"\n✅ Working endpoints found: {len(working_endpoints)}")
    for endpoint in working_endpoints:
        print(f"   {endpoint}")
    
    # Test the working endpoints
    if "/load_docs_rag" in [ep.split()[1] for ep in working_endpoints]:
        print(f"\n🔍 Testing load_docs_rag...")
        try:
            test_data = {
                "operation": "test",
                "data": "sample"
            }
            response = requests.post(f"{base_url}/load_docs_rag", json=test_data)
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
        except Exception as e:
            print(f"   Error: {e}")
    
    # Test create_chapter for query deployment
    if "/create_chapter" in [ep.split()[1] for ep in working_endpoints]:
        print(f"\n🔍 Testing create_chapter for query deployment...")
        try:
            chapter_data = {
                "chapter_index": 1,
                "title": "AddProjectExample",
                "content": """
                QUERY AddProjectExample() =>
                    project <- AddN<Project>({
                        name: "Test Project",
                        duration: 30.0
                    })
                    RETURN project
                """
            }
            response = requests.post(f"{base_url}/create_chapter", json=chapter_data)
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
        except Exception as e:
            print(f"   Error: {e}")

if __name__ == "__main__":
    test_helix_endpoints()