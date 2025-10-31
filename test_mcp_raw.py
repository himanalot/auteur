#!/usr/bin/env python3
"""
Test raw MCP responses to understand the format
"""

import requests
import json

def test_mcp_raw():
    """Test raw MCP endpoints to understand response format"""
    print("🔍 Testing Raw MCP Endpoints...")
    print("=" * 50)
    
    # Test MCP init endpoint directly
    print("\n1. Testing /mcp/init endpoint...")
    try:
        response = requests.post("http://0.0.0.0:6969/mcp/init", json={})
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Raw response: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"JSON data: {data}")
                print(f"Data type: {type(data)}")
            except:
                print("Response is not JSON")
                
    except Exception as e:
        print(f"❌ Init endpoint error: {e}")
    
    # Test MCP call_tool endpoint
    print("\n2. Testing /mcp/call_tool endpoint...")
    try:
        # First get a connection
        init_response = requests.post("http://0.0.0.0:6969/mcp/init", json={})
        if init_response.status_code == 200:
            connection_data = init_response.text.strip()
            print(f"Connection data: {connection_data}")
            
            # Try to use the connection
            tool_payload = {
                "connection_id": connection_data,
                "tool": {
                    "tool_name": "n_from_type",
                    "args": {"node_type": "Project"}
                }
            }
            
            tool_response = requests.post("http://0.0.0.0:6969/mcp/call_tool", json=tool_payload)
            print(f"Tool status: {tool_response.status_code}")
            print(f"Tool response: {tool_response.text}")
            
    except Exception as e:
        print(f"❌ Call_tool endpoint error: {e}")
    
    print("\n✅ Raw MCP Testing Complete!")

if __name__ == "__main__":
    test_mcp_raw()