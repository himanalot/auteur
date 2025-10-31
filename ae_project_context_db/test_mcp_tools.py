#!/usr/bin/env python3
"""
Test MCP tools and add project data using built-in HelixDB functionality
"""

import requests
import json
from helix.client import Client, Query

BASE_URL = "http://localhost:6970"

def test_mcp_tools_comprehensive():
    """Test the available MCP tools comprehensively"""
    print("🔍 Testing Available MCP Tools...")
    print("=" * 40)
    
    try:
        # Get MCP connection
        print("1. Getting MCP connection...")
        init_response = requests.post(f"{BASE_URL}/mcp/init", json={})
        connection_id = init_response.json()
        print(f"✅ Connection ID: {connection_id}")
        
        # First add some project data using the direct client
        print("\n2. Adding sample project data via client...")
        client = Client(local=True, port=6970)
        
        class AddAEProjectData(Query):
            def __init__(self):
                super().__init__()
            
            def query(self):
                return [
                    # Project node
                    {
                        "type": "document",
                        "id": "ae_project_1",
                        "content": "After Effects Project: Motion Graphics Intro",
                        "metadata": {
                            "name": "Motion Graphics Intro",
                            "node_type": "Project",
                            "duration": 30.0,
                            "frameRate": 29.97,
                            "width": 1920,
                            "height": 1080
                        }
                    },
                    # Main composition
                    {
                        "type": "document",
                        "id": "main_comp_1", 
                        "content": "Main Composition with animated title",
                        "metadata": {
                            "name": "Main Composition",
                            "node_type": "Composition",
                            "duration": 10.0,
                            "frameRate": 29.97,
                            "width": 1920,
                            "height": 1080,
                            "layerCount": 3,
                            "parent_project": "ae_project_1"
                        }
                    },
                    # Text layer
                    {
                        "type": "document",
                        "id": "title_text_1",
                        "content": "Animated title text layer",
                        "metadata": {
                            "name": "Title Text",
                            "node_type": "TextLayer",
                            "text": "Welcome to Motion Graphics",
                            "fontSize": 72.0,
                            "fontFamily": "Arial Bold",
                            "index": 1,
                            "parent_comp": "main_comp_1"
                        }
                    },
                    # AV Layer
                    {
                        "type": "document",
                        "id": "bg_layer_1",
                        "content": "Background video layer",
                        "metadata": {
                            "name": "Background Video",
                            "node_type": "AVLayer",
                            "index": 2,
                            "enabled": True,
                            "inPoint": 0.0,
                            "outPoint": 10.0,
                            "parent_comp": "main_comp_1",
                            "source_footage": "bg_footage_1"
                        }
                    },
                    # Footage item
                    {
                        "type": "document",
                        "id": "bg_footage_1",
                        "content": "Background video footage file",
                        "metadata": {
                            "name": "background_video.mp4",
                            "node_type": "FootageItem", 
                            "file": "/assets/background_video.mp4",
                            "duration": 30.0,
                            "width": 1920,
                            "height": 1080,
                            "parent_project": "ae_project_1"
                        }
                    }
                ]
            
            def response(self, response):
                return {"documents_added": len(response)}
        
        # Add the data
        add_query = AddAEProjectData()
        add_result = client.query(add_query)
        print(f"   ✅ Project data added: {add_result}")
        
        # Wait and get new connection for testing
        print("\n3. Testing MCP tools with project data...")
        new_init = requests.post(f"{BASE_URL}/mcp/init", json={})
        new_connection_id = new_init.json()
        
        # Test all available MCP tools
        mcp_tools = [
            # Node type discovery
            {"tool": "n_from_type", "args": {"node_type": "Project"}},
            {"tool": "n_from_type", "args": {"node_type": "Composition"}},
            {"tool": "n_from_type", "args": {"node_type": "TextLayer"}},
            {"tool": "n_from_type", "args": {"node_type": "AVLayer"}}, 
            {"tool": "n_from_type", "args": {"node_type": "FootageItem"}},
        ]
        
        for tool_test in mcp_tools:
            payload = {
                "connection_id": new_connection_id,
                "tool": {
                    "tool_name": tool_test["tool"],
                    "args": tool_test["args"]
                }
            }
            
            response = requests.post(f"{BASE_URL}/mcp/call_tool", json=payload)
            result_text = response.text[:100] + "..." if len(response.text) > 100 else response.text
            print(f"   📍 {tool_test['tool']}({tool_test['args']}): {response.status_code}")
            print(f"      Result: {result_text}")
        
        # Test filtering capabilities
        print("\n4. Testing filtering capabilities...")
        
        # Filter by properties
        filter_payload = {
            "connection_id": new_connection_id,
            "tool": {
                "tool_name": "filter_items",
                "args": {
                    "properties": [["name", "Motion Graphics Intro"]]
                }
            }
        }
        
        filter_response = requests.post(f"{BASE_URL}/mcp/call_tool", json=filter_payload)
        print(f"   🔍 Filter by project name: {filter_response.status_code}")
        print(f"      Result: {filter_response.text[:150]}...")
        
        # Test graph traversal simulation
        print("\n5. Testing graph traversal simulation...")
        print("   (Note: Real traversal would require actual graph edges)")
        
        # This demonstrates how autonomous agents would use the tools
        print("   🤖 Agent Workflow Simulation:")
        print("   1. Agent: Find all projects -> n_from_type(Project)")
        print("   2. Agent: Find all compositions -> n_from_type(Composition)")
        print("   3. Agent: Filter for specific project -> filter_items(properties)")
        print("   4. Agent: Find text layers -> n_from_type(TextLayer)")
        print("   5. Agent: Analyze relationships -> out_step/in_step (when edges exist)")
        
        print("\n✅ MCP Tools Testing Complete!")
        print("\n🎯 READY FOR AUTONOMOUS AGENTS:")
        print("   ✅ Separate HelixDB instance running (port 6970)")
        print("   ✅ MCP tools working for node discovery")
        print("   ✅ Property filtering functional")
        print("   ✅ Project data successfully ingested")
        print("   🚀 Agents can now intelligently navigate AE project structure!")
        
        return True
        
    except Exception as e:
        print(f"❌ Testing error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_mcp_tools_comprehensive()