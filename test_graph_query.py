#!/usr/bin/env python3
"""
Test if we can query the After Effects project graph in HelixDB
"""

from helix.client import Client, Query

# Initialize HelixDB client
client = Client(local=True)

class TestGraphQuery(Query):
    """Simple query to test if our graph data exists"""
    def __init__(self):
        super().__init__()
    
    def query(self):
        # Return a simple query to see what's in the database
        return [{"action": "get_all_nodes"}]
    
    def response(self, response):
        return response

class FindProjectNodes(Query):
    """Find nodes of type Project"""
    def __init__(self):
        super().__init__()
    
    def query(self):
        return [{"find": {"type": "Project"}}]
    
    def response(self, response):
        return response

def test_graph_data():
    """Test if we can access our project graph data"""
    try:
        print("🔍 Testing Access to Project Graph Data...")
        
        # Test 1: Simple graph query
        print("\n1. Testing basic graph query...")
        query1 = TestGraphQuery()
        result1 = client.query(query1)
        print(f"Basic query result: {result1}")
        
        # Test 2: Find project nodes
        print("\n2. Looking for Project nodes...")
        query2 = FindProjectNodes() 
        result2 = client.query(query2)
        print(f"Project nodes result: {result2}")
        
        # Test 3: Use the native client methods we imported earlier
        print("\n3. Testing native client methods...")
        from helix.client import hnswsearch, hnswinsert
        
        # Try to see if there are any vectors in the database
        try:
            # Create a simple test vector
            test_vector = [0.1, 0.2, 0.3, 0.4, 0.5]
            search_query = hnswsearch(test_vector, k=5)
            search_result = client.query(search_query)
            print(f"Vector search result: {search_result}")
        except Exception as e:
            print(f"Vector search failed: {e}")
        
        print("\n✅ Graph Data Test Complete!")
        
    except Exception as e:
        print(f"❌ Error testing graph data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_graph_data()