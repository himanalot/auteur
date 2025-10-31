#!/usr/bin/env python3
"""
Test the MCP server functionality via stdio
"""

import subprocess
import json
import sys
import time

def test_mcp_server():
    """Test the MCP server tools"""
    try:
        print("🔍 Testing HelixDB MCP Server...")
        print("=" * 50)
        
        # First, ensure we have project data
        print("\n1. Ensuring project data exists...")
        import requests
        ingest_response = requests.post("http://127.0.0.1:5004/ingest_project", 
                                      json={
                                          "project": {"name": "MCP Test Project", "duration": 15},
                                          "items": [
                                              {"id": 1, "name": "Main Comp", "type": "Composition", 
                                               "layers": [
                                                   {"name": "Text Layer", "type": "TextLayer", "index": 1},
                                                   {"name": "Video Layer", "type": "AVLayer", "index": 2, "source_id": 2}
                                               ]},
                                              {"id": 2, "name": "Video.mp4", "type": "FootageItem"}
                                          ]
                                      })
        print(f"Data ingestion: {ingest_response.json()}")
        
        # Start MCP server process
        print("\n2. Starting MCP server...")
        
        # Use mcp run to test the server
        cmd = [sys.executable, "mcp_server.py"]
        
        # Try to call MCP tools directly
        print("\n3. Testing MCP tools directly...")
        
        # Import the MCP functions
        from mcp_server import init_connection, out_step, n_from_type, e_from_type
        
        # Test init
        print("   Testing init_connection...")
        try:
            connection_id = init_connection()
            print(f"   ✅ Connection ID: {connection_id}")
            
            # Test finding nodes by type
            print("   Testing n_from_type (Composition)...")
            comp_result = n_from_type(connection_id, "Composition")
            print(f"   Composition result: {comp_result}")
            
            # Test finding edges
            print("   Testing e_from_type (CONTAINS)...")
            edge_result = e_from_type(connection_id, "CONTAINS")
            print(f"   Edge result: {edge_result}")
            
            # Test traversal
            print("   Testing out_step...")
            step_result = out_step(connection_id, "CONTAINS", "CONTAINS")
            print(f"   Step result: {step_result}")
            
        except Exception as e:
            print(f"   ❌ MCP tool error: {e}")
        
        print("\n✅ MCP Server Test Complete!")
        
    except Exception as e:
        print(f"❌ Error testing MCP server: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_mcp_server()