#!/usr/bin/env python3
"""
Test basic MCP functionality directly with HelixDB
"""

from helix.client import Client, init, call_tool, next as helix_next
import json

# Project context HelixDB client  
client = Client(local=True)

def test_basic_mcp():
    """Test basic MCP functionality directly"""
    print("🔍 Testing Basic MCP Functionality...")
    print("=" * 50)
    
    try:
        # Step 1: Test MCP init directly
        print("\n1. Testing MCP init...")
        try:
            connection = client.query(init())
            print(f"✅ Init result: {connection}")
            if connection and len(connection) > 0:
                connection_id = connection[0]
                print(f"   Connection ID: {connection_id}")
            else:
                print("❌ No connection ID returned")
                return
        except Exception as e:
            print(f"❌ Init error: {e}")
            return
        
        # Step 2: Test n_from_type tool directly
        print("\n2. Testing n_from_type tool...")
        try:
            payload = {
                "connection_id": connection_id,
                "tool": {
                    "tool_name": "n_from_type",
                    "args": {"node_type": "Project"}
                }
            }
            nodes_result = client.query(call_tool(payload))
            print(f"✅ n_from_type result: {nodes_result}")
        except Exception as e:
            print(f"❌ n_from_type error: {e}")
        
        # Step 3: Test e_from_type tool directly  
        print("\n3. Testing e_from_type tool...")
        try:
            payload = {
                "connection_id": connection_id,
                "tool": {
                    "tool_name": "e_from_type",
                    "args": {"edge_type": "CONTAINS"}
                }
            }
            edges_result = client.query(call_tool(payload))
            print(f"✅ e_from_type result: {edges_result}")
        except Exception as e:
            print(f"❌ e_from_type error: {e}")
        
        # Step 4: Test next functionality
        print("\n4. Testing next functionality...")
        try:
            next_result = client.query(helix_next(connection_id))
            print(f"✅ Next result: {next_result}")
        except Exception as e:
            print(f"❌ Next error: {e}")
        
        print("\n✅ Basic MCP Testing Complete!")
        
    except Exception as e:
        print(f"❌ Overall MCP test error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_basic_mcp()