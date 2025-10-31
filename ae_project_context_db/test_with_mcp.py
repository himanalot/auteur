#!/usr/bin/env python3
"""
Test our deployed queries via MCP interface since that was working
"""

import requests
import json

BASE_URL = "http://localhost:6970"

def test_mcp_with_deployed_queries():
    """Test MCP and try to call our deployed queries"""
    print("🔍 Testing MCP with Deployed Queries...")
    print("=" * 45)
    
    try:
        # Get MCP connection
        print("1. Getting MCP connection...")
        init_response = requests.post(f"{BASE_URL}/mcp/init", json={})
        
        if init_response.status_code != 200:
            print(f"❌ MCP init failed: {init_response.status_code}")
            return False
        
        connection_id = init_response.json()
        print(f"✅ Connection ID: {connection_id}")
        
        # Try to call our deployed queries via MCP tools
        print("\n2. Testing deployed query calls...")
        
        # First test what we know works - n_from_type
        print("   Testing n_from_type for Project nodes...")
        project_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Project"}
            }
        }
        
        project_response = requests.post(f"{BASE_URL}/mcp/call_tool", json=project_payload)
        print(f"   Projects: {project_response.status_code} - {project_response.text}")
        
        # Try a custom query call
        print("\n   Testing custom query call...")
        custom_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "addSampleProject",
                "args": {}
            }
        }
        
        custom_response = requests.post(f"{BASE_URL}/mcp/call_tool", json=custom_payload)
        print(f"   addSampleProject: {custom_response.status_code} - {custom_response.text}")
        
        # If that doesn't work, let's manually add data and then test finding it
        print("\n3. Adding data manually via native API...")
        
        # Let's use a direct approach to add sample project data
        from helix.client import Client, Query
        
        client = Client(local=True, port=6970)
        
        # Create a simple query to add data
        class AddProjectData(Query):
            def __init__(self):
                super().__init__()
            
            def query(self):
                return [{
                    "type": "document",
                    "id": "sample_project_1",
                    "content": "Sample After Effects Project",
                    "metadata": {
                        "name": "Sample Project",
                        "type": "Project",
                        "duration": 30.0,
                        "frameRate": 29.97
                    }
                }, {
                    "type": "document", 
                    "id": "main_comp_1",
                    "content": "Main Composition",
                    "metadata": {
                        "name": "Main Comp",
                        "type": "Composition",
                        "duration": 10.0,
                        "layerCount": 2
                    }
                }]
            
            def response(self, response):
                return {"added": len(response)}
        
        add_query = AddProjectData()
        add_result = client.query(add_query)
        print(f"   ✅ Data added: {add_result}")
        
        # Now test finding the data via MCP
        print("\n4. Testing data discovery via MCP...")
        
        # Re-establish connection after adding data
        new_init = requests.post(f"{BASE_URL}/mcp/init", json={})
        new_connection_id = new_init.json()
        
        # Test finding projects again
        project_payload["connection_id"] = new_connection_id
        project_response2 = requests.post(f"{BASE_URL}/mcp/call_tool", json=project_payload)
        print(f"   Projects after data: {project_response2.status_code} - {project_response2.text}")
        
        # Test finding compositions
        comp_payload = {
            "connection_id": new_connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Composition"}
            }
        }
        
        comp_response = requests.post(f"{BASE_URL}/mcp/call_tool", json=comp_payload)
        print(f"   Compositions: {comp_response.status_code} - {comp_response.text}")
        
        print("\n✅ MCP Testing Complete!")
        return True
        
    except Exception as e:
        print(f"❌ Testing error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_mcp_with_deployed_queries()