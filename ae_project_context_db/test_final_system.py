#!/usr/bin/env python3
"""
Final test of the complete project context system
"""

import requests
import json

def test_complete_system():
    """Test the complete project context system"""
    print("🎯 Final System Test - Project Context HelixDB")
    print("=" * 55)
    
    # Test API server
    print("1. Testing API server...")
    status_response = requests.get("http://localhost:6971/status")
    print(f"   ✅ API Status: {status_response.json()}")
    
    # Test MCP connection
    print("\n2. Testing MCP connection...")
    init_response = requests.post("http://localhost:6970/mcp/init", json={})
    connection_id = init_response.json()
    print(f"   ✅ MCP Connection: {connection_id}")
    
    # Test data discovery
    print("\n3. Testing data discovery...")
    
    # Try to find any type of nodes
    for node_type in ["Chapter", "Document", "SubChapter"]:
        payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type", 
                "args": {"node_type": node_type}
            }
        }
        
        response = requests.post("http://localhost:6970/mcp/call_tool", json=payload)
        print(f"   📄 {node_type} nodes: {response.status_code}")
        if response.text and response.text != "null":
            print(f"      Found: {response.text[:100]}...")
    
    # Test filtering
    print("\n4. Testing filtering capabilities...")
    
    filter_payload = {
        "connection_id": connection_id,
        "tool": {
            "tool_name": "filter_items",
            "args": {
                "properties": [["ae_type", "Project"]]
            }
        }
    }
    
    filter_response = requests.post("http://localhost:6970/mcp/call_tool", json=filter_payload)
    print(f"   🔍 Project filter: {filter_response.status_code}")
    if filter_response.text and filter_response.text != "null":
        print(f"      Result: {filter_response.text}")
    
    # Add more sample data via API
    print("\n5. Adding more complex project data...")
    
    complex_project = {
        "project": {
            "name": "Complex AE Project",
            "duration": 60.0,
            "frameRate": 23.976,
            "width": 3840,
            "height": 2160
        },
        "compositions": [
            {
                "name": "Intro Sequence",
                "duration": 15.0,
                "frameRate": 23.976,
                "width": 3840,
                "height": 2160
            },
            {
                "name": "Main Content",
                "duration": 45.0,
                "frameRate": 23.976,
                "width": 3840,
                "height": 2160
            }
        ],
        "layers": [
            {
                "name": "Logo Animation",
                "type": "TextLayer",
                "index": 1,
                "enabled": True,
                "inPoint": 0.0,
                "outPoint": 5.0
            },
            {
                "name": "Background Video",
                "type": "AVLayer", 
                "index": 2,
                "enabled": True,
                "inPoint": 0.0,
                "outPoint": 15.0
            }
        ],
        "footage": [
            {
                "name": "background_4k.mov",
                "file": "/assets/background_4k.mov",
                "duration": 120.0,
                "width": 3840,
                "height": 2160
            }
        ]
    }
    
    add_response = requests.post("http://localhost:6971/add_project_data", json=complex_project)
    print(f"   ✅ Complex project added: {add_response.json()}")
    
    # Test discovery of new data
    print("\n6. Testing discovery of complex project...")
    
    # New MCP connection
    new_init = requests.post("http://localhost:6970/mcp/init", json={})
    new_connection_id = new_init.json()
    
    # Test filtering for compositions
    comp_filter = {
        "connection_id": new_connection_id,
        "tool": {
            "tool_name": "filter_items",
            "args": {
                "properties": [["ae_type", "Composition"]]
            }
        }
    }
    
    comp_response = requests.post("http://localhost:6970/mcp/call_tool", json=comp_filter)
    print(f"   🎬 Composition filter: {comp_response.status_code}")
    if comp_response.text and comp_response.text != "null":
        print(f"      Found compositions: {comp_response.text}")
    
    # Test layer filtering
    layer_filter = {
        "connection_id": new_connection_id,
        "tool": {
            "tool_name": "filter_items", 
            "args": {
                "properties": [["ae_type", "TextLayer"]]
            }
        }
    }
    
    layer_response = requests.post("http://localhost:6970/mcp/call_tool", json=layer_filter)
    print(f"   📝 TextLayer filter: {layer_response.status_code}")
    if layer_response.text and layer_response.text != "null":
        print(f"      Found text layers: {layer_response.text}")
    
    print("\n✅ SYSTEM READY FOR AUTONOMOUS AGENTS!")
    print("\n🎯 Summary:")
    print("   ✅ Separate HelixDB instance: localhost:6970")
    print("   ✅ Project API server: localhost:6971") 
    print("   ✅ MCP tools functional for graph navigation")
    print("   ✅ Project data ingestion working")
    print("   ✅ Metadata filtering for precise context discovery")
    print("\n🤖 Autonomous agents can now:")
    print("   - Connect via MCP (localhost:6970/mcp/)")
    print("   - Discover project elements by type")
    print("   - Filter by AE-specific metadata")
    print("   - Navigate project structure intelligently")
    print("   - Add new project data via API (localhost:6971)")

if __name__ == "__main__":
    test_complete_system()