#!/usr/bin/env python3
"""
Test real queries against the "Final Demo Project" data we just ingested
"""

from helix.client import Client, Query, init, call_tool
import json

client = Client(local=True)

class TestSpecificQuery(Query):
    """Try to query for specific data we know exists"""
    def __init__(self, query_name: str):
        super().__init__()
        self.query_name = query_name
    
    def query(self):
        if self.query_name == "find_hero":
            return [{"find": {"name": "Hero Composition"}}]
        elif self.query_name == "find_project":
            return [{"find": {"name": "Final Demo Project"}}]
        elif self.query_name == "find_compositions":
            return [{"find": {"type": "Composition"}}]
        else:
            return [{"scan": "all"}]
    
    def response(self, response):
        return response

def test_specific_data_queries():
    """Test queries for the specific data we just ingested"""
    try:
        print("🔍 Testing Queries Against 'Final Demo Project' Data...")
        print("=" * 60)
        
        # First confirm what data we have
        print("\n📊 Data Summary from last ingestion:")
        print("   - Project: Final Demo Project")
        print("   - 4 nodes created (Project + 2 Compositions + 1 FootageItem)")
        print("   - 4 edges created (containment relationships)")
        print("   - Items: Hero Composition, Hero_Background.mp4, Logo Animation")
        
        # Test 1: Try to find Hero Composition
        print("\n1. Searching for 'Hero Composition'...")
        hero_query = TestSpecificQuery("find_hero")
        hero_result = client.query(hero_query)
        print(f"   Hero Composition result: {hero_result}")
        
        # Test 2: Try to find the project
        print("\n2. Searching for 'Final Demo Project'...")
        proj_query = TestSpecificQuery("find_project") 
        proj_result = client.query(proj_query)
        print(f"   Project result: {proj_result}")
        
        # Test 3: Try to find all compositions
        print("\n3. Searching for all Compositions...")
        comp_query = TestSpecificQuery("find_compositions")
        comp_result = client.query(comp_query)
        print(f"   Compositions result: {comp_result}")
        
        # Test 4: Try a general scan
        print("\n4. General data scan...")
        scan_query = TestSpecificQuery("scan_all")
        scan_result = client.query(scan_query)
        print(f"   Scan result: {scan_result}")
        
        # Test 5: Try MCP tools with connection
        print("\n5. Testing MCP connection and tools...")
        try:
            # Initialize connection
            connection = client.query(init())
            print(f"   Init connection: {connection}")
            
            if connection and connection[0]:
                conn_id = connection[0]
                print(f"   ✅ Connection ID: {conn_id}")
                
                # Try to find compositions using MCP tool
                find_comp_payload = {
                    "connection_id": conn_id,
                    "tool": {
                        "tool_name": "n_from_type",
                        "args": {"node_type": "Composition"}
                    }
                }
                comp_mcp_result = client.query(call_tool(find_comp_payload))
                print(f"   MCP Compositions: {comp_mcp_result}")
                
                # Try to find the project using MCP tool
                find_proj_payload = {
                    "connection_id": conn_id,
                    "tool": {
                        "tool_name": "n_from_type", 
                        "args": {"node_type": "Project"}
                    }
                }
                proj_mcp_result = client.query(call_tool(find_proj_payload))
                print(f"   MCP Project: {proj_mcp_result}")
                
                # Try to find edges
                find_edges_payload = {
                    "connection_id": conn_id,
                    "tool": {
                        "tool_name": "e_from_type",
                        "args": {"edge_type": "CONTAINS"}
                    }
                }
                edges_result = client.query(call_tool(find_edges_payload))
                print(f"   MCP CONTAINS edges: {edges_result}")
                
        except Exception as e:
            print(f"   ❌ MCP connection error: {e}")
        
        # Test 6: Check our REST API endpoints
        print("\n6. Testing REST API queries...")
        import requests
        
        try:
            # Test find related
            related_response = requests.post("http://127.0.0.1:5004/find_related",
                                           json={"search_term": "Hero", "k": 3})
            print(f"   Find 'Hero': {related_response.json()}")
            
            # Test hierarchy walk
            hierarchy_response = requests.get("http://127.0.0.1:5004/walk_hierarchy/project_root?depth=3")
            print(f"   Walk hierarchy: {hierarchy_response.json()}")
            
        except Exception as e:
            print(f"   ❌ REST API error: {e}")
        
        print("\n✅ Real Data Query Test Complete!")
        
    except Exception as e:
        print(f"❌ Error testing real queries: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_specific_data_queries()