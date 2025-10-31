#!/usr/bin/env python3
"""
Test HelixDB MCP functionality for After Effects project graphs
"""

from helix.client import Client, init, call_tool, next as helix_next
import sys

# Initialize HelixDB client
client = Client(local=True)

def test_mcp_graph_walking():
    """Test the MCP graph walking functionality"""
    try:
        print("🔍 Testing HelixDB MCP Graph Walking...")
        
        # Initialize a connection
        print("\n1. Initializing connection...")
        init_result = client.query(init())
        print(f"Init result: {init_result}")
        
        if not init_result or not init_result[0]:
            print("❌ Failed to initialize connection")
            return
        
        connection_id = init_result[0]
        print(f"✅ Connection ID: {connection_id}")
        
        # Try to find nodes by type
        print("\n2. Finding Composition nodes...")
        comp_result = client.query(call_tool({
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Composition"}
            }
        }))
        print(f"Composition nodes: {comp_result}")
        
        # Try to find Project nodes
        print("\n3. Finding Project nodes...")
        project_result = client.query(call_tool({
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type", 
                "args": {"node_type": "Project"}
            }
        }))
        print(f"Project nodes: {project_result}")
        
        # Try to find CONTAINS edges
        print("\n4. Finding CONTAINS edges...")
        contains_result = client.query(call_tool({
            "connection_id": connection_id,
            "tool": {
                "tool_name": "e_from_type",
                "args": {"edge_type": "CONTAINS"}
            }
        }))
        print(f"CONTAINS edges: {contains_result}")
        
        # Try traversing outbound from project root
        print("\n5. Traversing outbound from project...")
        out_result = client.query(call_tool({
            "connection_id": connection_id,
            "tool": {
                "tool_name": "out_step",
                "args": {
                    "edge_label": "CONTAINS",
                    "edge_type": "CONTAINS"
                }
            }
        }))
        print(f"Outbound traversal: {out_result}")
        
        print("\n✅ MCP Graph Walking Test Complete!")
        
    except Exception as e:
        print(f"❌ Error testing MCP: {e}")
        import traceback
        traceback.print_exc()

def test_basic_helix_operations():
    """Test basic HelixDB operations"""
    try:
        print("🔍 Testing basic HelixDB operations...")
        
        # Test a simple query
        result = client.query("test_query", {})
        print(f"Test query result: {result}")
        
    except Exception as e:
        print(f"❌ Error with basic operations: {e}")

if __name__ == "__main__":
    print("🚀 Starting HelixDB MCP Tests")
    print("=" * 50)
    
    # Test basic operations first
    test_basic_helix_operations()
    
    print("\n" + "=" * 50)
    
    # Test MCP graph walking
    test_mcp_graph_walking()