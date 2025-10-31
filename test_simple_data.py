#!/usr/bin/env python3
"""
Test if we can verify our data exists in HelixDB with the simplest possible approach
"""

from helix.client import Client, Query
import json

client = Client(local=True)

class ListEverything(Query):
    """Try to list everything in the database"""
    def __init__(self):
        super().__init__()
    
    def query(self):
        # Return the simplest possible query
        return [{}]
    
    def response(self, response):
        return response

def test_data_existence():
    """Test if our data actually exists"""
    try:
        print("🔍 Testing if our project data exists in HelixDB...")
        print("=" * 50)
        
        # Confirm ingestion worked
        print("\n1. Re-confirming data ingestion...")
        
        import requests
        ingest_response = requests.post("http://127.0.0.1:5004/ingest_project", 
                                      json={
                                          "project": {"name": "Simple Test", "duration": 10},
                                          "items": [{"id": 1, "name": "Test Item", "type": "Composition"}]
                                      })
        print(f"Ingestion result: {ingest_response.json()}")
        
        # Try the simplest query possible
        print("\n2. Testing simplest possible query...")
        query = ListEverything()
        result = client.query(query)
        print(f"Simple query result: {result}")
        
        # Try to see what endpoints are actually available
        print("\n3. Checking available endpoints...")
        try:
            # Test if there are any available endpoints
            import requests
            endpoints_to_test = [
                "http://0.0.0.0:6969/status",
                "http://0.0.0.0:6969/health", 
                "http://0.0.0.0:6969/list",
                "http://0.0.0.0:6969/queries",
                "http://0.0.0.0:6969/nodes",
                "http://0.0.0.0:6969/edges"
            ]
            
            for endpoint in endpoints_to_test:
                try:
                    resp = requests.get(endpoint, timeout=1)
                    print(f"✅ {endpoint}: {resp.status_code}")
                except:
                    print(f"❌ {endpoint}: No response")
                    
        except Exception as e:
            print(f"Endpoint test failed: {e}")
        
        print("\n✅ Data Existence Test Complete!")
        
    except Exception as e:
        print(f"❌ Error testing data existence: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_data_existence()