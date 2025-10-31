#!/usr/bin/env python3
"""
Test actual HelixDB queries against our ingested project data
"""

from helix.client import Client, Query
import json

client = Client(local=True)

class FindAllNodes(Query):
    """Find all nodes in the database"""
    def __init__(self):
        super().__init__()
    
    def query(self):
        return [{"action": "scan", "type": "node"}]
    
    def response(self, response):
        return response

class FindProjectsByType(Query):
    """Find nodes by type"""
    def __init__(self, node_type: str):
        super().__init__()
        self.node_type = node_type
    
    def query(self):
        return [{"filter": {"type": self.node_type}}]
    
    def response(self, response):
        return response

class SimpleNodeQuery(Query):
    """Very simple node query"""
    def __init__(self):
        super().__init__()
    
    def query(self):
        return [{"get_nodes": True}]
    
    def response(self, response):
        return response

def test_queries():
    """Test various query approaches"""
    try:
        print("🔍 Testing HelixDB Queries Against Ingested Data...")
        print("=" * 50)
        
        # Test 1: Simple scan
        print("\n1. Testing simple node scan...")
        query1 = FindAllNodes()
        result1 = client.query(query1)
        print(f"All nodes result: {result1}")
        
        # Test 2: Find by type
        print("\n2. Finding Composition nodes...")
        query2 = FindProjectsByType("Composition")
        result2 = client.query(query2)
        print(f"Composition nodes: {result2}")
        
        # Test 3: Find Project nodes
        print("\n3. Finding Project nodes...")
        query3 = FindProjectsByType("Project")
        result3 = client.query(query3)
        print(f"Project nodes: {result3}")
        
        # Test 4: Simple query
        print("\n4. Testing simple query...")
        query4 = SimpleNodeQuery()
        result4 = client.query(query4)
        print(f"Simple query result: {result4}")
        
        print("\n✅ Query Test Complete!")
        
    except Exception as e:
        print(f"❌ Error testing queries: {e}")
        import traceback
        traceback.print_exc()

def test_rest_api_queries():
    """Test our REST API query endpoints"""
    try:
        print("\n" + "=" * 50)
        print("🔍 Testing REST API Query Endpoints...")
        
        import requests
        
        # Test project summary
        print("\n1. Testing project summary...")
        response = requests.get("http://127.0.0.1:5004/project_summary")
        print(f"Project summary: {response.json()}")
        
        # Test finding related nodes
        print("\n2. Testing find related nodes...")
        response = requests.post("http://127.0.0.1:5004/find_related", 
                                json={"search_term": "Main Timeline", "k": 3})
        print(f"Related nodes: {response.json()}")
        
        # Test hierarchy walking
        print("\n3. Testing hierarchy walking...")
        response = requests.get("http://127.0.0.1:5004/walk_hierarchy/project_root?depth=2")
        print(f"Hierarchy walk: {response.json()}")
        
        # Test finding animations
        print("\n4. Testing animation detection...")
        response = requests.get("http://127.0.0.1:5004/find_animation")
        print(f"Animation nodes: {response.json()}")
        
        print("\n✅ REST API Query Test Complete!")
        
    except Exception as e:
        print(f"❌ Error testing REST API: {e}")

if __name__ == "__main__":
    test_queries()
    test_rest_api_queries()