#!/usr/bin/env python3
"""
Test the actual MCP tools that HelixDB provides built-in
"""

from helix.client import Client, init, call_tool, next as helix_next, schema_resource
import json

client = Client(local=True)

def test_mcp_builtin_tools():
    """Test the built-in MCP tools in HelixDB"""
    try:
        print("🔍 Testing HelixDB Built-in MCP Tools...")
        print("=" * 50)
        
        # Step 1: Initialize connection
        print("\n1. Initializing graph connection...")
        init_result = client.query(init())
        print(f"Init result: {init_result}")
        
        if not init_result or not init_result[0]:
            print("❌ Failed to initialize - stopping here")
            return
            
        connection_id = init_result[0]
        print(f"✅ Connection ID: {connection_id}")
        
        # Step 2: Get schema information
        print("\n2. Getting schema information...")
        try:
            schema_result = client.query(schema_resource(connection_id))
            print(f"Schema: {schema_result}")
        except Exception as e:
            print(f"Schema failed: {e}")
        
        # Step 3: Find nodes by type (n_from_type)
        print("\n3. Finding Composition nodes...")
        comp_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Composition"}
            }
        }
        comp_result = client.query(call_tool(comp_payload))
        print(f"Composition nodes: {comp_result}")
        
        # Step 4: Find Project nodes
        print("\n4. Finding Project nodes...")
        proj_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type", 
                "args": {"node_type": "Project"}
            }
        }
        proj_result = client.query(call_tool(proj_payload))
        print(f"Project nodes: {proj_result}")
        
        # Step 5: Find edges by type (e_from_type)
        print("\n5. Finding CONTAINS edges...")
        edge_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "e_from_type",
                "args": {"edge_type": "CONTAINS"}
            }
        }
        edge_result = client.query(call_tool(edge_payload))
        print(f"CONTAINS edges: {edge_result}")
        
        # Step 6: Try traversal (out_step)
        print("\n6. Traversing outbound from project root...")
        out_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "out_step",
                "args": {
                    "edge_label": "CONTAINS",
                    "edge_type": "CONTAINS"
                }
            }
        }
        out_result = client.query(call_tool(out_payload))
        print(f"Outbound traversal: {out_result}")
        
        # Step 7: Filter items
        print("\n7. Filtering items by properties...")
        filter_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "filter_items",
                "args": {
                    "properties": [("type", "Composition")]
                }
            }
        }
        filter_result = client.query(call_tool(filter_payload))
        print(f"Filtered items: {filter_result}")
        
        print("\n✅ MCP Built-in Tools Test Complete!")
        
    except Exception as e:
        print(f"❌ Error testing MCP tools: {e}")
        import traceback
        traceback.print_exc()

def test_direct_tool_calls():
    """Test calling tools directly without connection"""
    try:
        print("\n" + "=" * 50)
        print("🔍 Testing Direct Tool Calls...")
        
        # Try direct tool calls (might work without connection)
        print("\n1. Direct n_from_type call...")
        direct_payload = {
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Project"}
            }
        }
        direct_result = client.query(call_tool(direct_payload))
        print(f"Direct result: {direct_result}")
        
    except Exception as e:
        print(f"❌ Error with direct calls: {e}")

if __name__ == "__main__":
    test_mcp_builtin_tools()
    test_direct_tool_calls()