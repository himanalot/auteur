#!/usr/bin/env python3
"""
Debug what endpoints are actually available on our separate HelixDB instance
"""

import requests
import json

BASE_URL = "http://localhost:6970"

def debug_available_endpoints():
    """Check what endpoints are actually available"""
    print("🔍 Debugging Available Endpoints on Port 6970...")
    print("=" * 55)
    
    # Test common endpoints
    endpoints_to_test = [
        # Our custom queries
        "/addSampleProject",
        "/walkProjectHierarchy", 
        "/findTextLayers",
        "/getProjectStatistics",
        "/findCompositionsByName",
        "/findLayersUsingFootage",
        # MCP endpoints (we know these work)
        "/mcp/init",
        "/mcp/call_tool",
        "/mcp/next",
        "/mcp/schema_resource",
        # Common HelixDB endpoints
        "/load_docs_rag",
        "/create_chapter", 
        "/get_chapter_content",
        "/search_docs_rag",
        # Other possible endpoints
        "/deploy",
        "/queries",
        "/execute",
        "/status"
    ]
    
    working_endpoints = []
    
    for endpoint in endpoints_to_test:
        try:
            # Try POST first
            response = requests.post(f"{BASE_URL}{endpoint}", json={}, timeout=2)
            if response.status_code != 404:
                print(f"✅ POST {endpoint}: {response.status_code}")
                working_endpoints.append(f"POST {endpoint}")
                if len(response.text) < 200:
                    print(f"   Response: {response.text}")
            else:
                # Try GET
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=2)
                if response.status_code != 404:
                    print(f"✅ GET {endpoint}: {response.status_code}")
                    working_endpoints.append(f"GET {endpoint}")
                else:
                    print(f"❌ {endpoint}: 404")
        except Exception as e:
            print(f"❌ {endpoint}: {e}")
    
    print(f"\n📊 Summary: {len(working_endpoints)} working endpoints found")
    
    # Test MCP functionality more thoroughly
    print(f"\n🔍 Testing MCP functionality...")
    try:
        # Test MCP init
        init_response = requests.post(f"{BASE_URL}/mcp/init", json={})
        if init_response.status_code == 200:
            connection_id = init_response.json()
            print(f"✅ MCP Connection: {connection_id}")
            
            # Test available MCP tools
            mcp_tools = ["n_from_type", "e_from_type", "out_step", "in_step", "filter_items"]
            
            for tool in mcp_tools:
                test_payload = {
                    "connection_id": connection_id,
                    "tool": {
                        "tool_name": tool,
                        "args": {"node_type": "Project"} if "type" in tool else {}
                    }
                }
                
                tool_response = requests.post(f"{BASE_URL}/mcp/call_tool", json=test_payload)
                print(f"   {tool}: {tool_response.status_code} - {tool_response.text[:50]}...")
        
    except Exception as e:
        print(f"❌ MCP testing error: {e}")
    
    # Check if we can see what's actually in the database
    print(f"\n🔍 Checking database contents...")
    try:
        init_response = requests.post(f"{BASE_URL}/mcp/init", json={})
        connection_id = init_response.json()
        
        # Try to find any nodes
        search_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Chapter"}  # The default schema type
            }
        }
        
        search_response = requests.post(f"{BASE_URL}/mcp/call_tool", json=search_payload)
        print(f"   Chapters found: {search_response.status_code} - {search_response.text}")
        
        # Try SubChapter too
        search_payload["tool"]["args"]["node_type"] = "SubChapter"
        search_response2 = requests.post(f"{BASE_URL}/mcp/call_tool", json=search_payload)
        print(f"   SubChapters found: {search_response2.status_code} - {search_response2.text}")
        
    except Exception as e:
        print(f"❌ Database content check error: {e}")
    
    print(f"\n💡 INSIGHT: The separate HelixDB instance is running but:")
    print(f"   ✅ MCP tools are working")
    print(f"   ❌ Our custom HQL queries aren't deployed as endpoints") 
    print(f"   ⚠️  It's using the default Chapter/SubChapter schema")
    print(f"   🎯 We need to properly deploy our Project/Composition schema!")

if __name__ == "__main__":
    debug_available_endpoints()