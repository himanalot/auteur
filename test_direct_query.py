#!/usr/bin/env python3
"""
Test direct HelixDB queries to see if we can access the graph data
"""

from helix.client import Client
import json

# Initialize HelixDB client
client = Client(local=True)

def test_direct_queries():
    """Test direct database queries"""
    try:
        print("🔍 Testing Direct HelixDB Queries...")
        
        # Try to query for any existing data
        print("\n1. Testing raw query interface...")
        
        # Let's first see what the client can actually do
        print(f"Client methods: {[m for m in dir(client) if not m.startswith('_')]}")
        
        # Try a simple query using the actual helix query interface
        try:
            # This should show us what queries are available
            result = client.query("help")
            print(f"Help result: {result}")
        except Exception as e:
            print(f"Help query failed: {e}")
        
        # Try listing available queries
        try:
            result = client.query("list")
            print(f"List result: {result}")
        except Exception as e:
            print(f"List query failed: {e}")
            
        # Try to see if there's any data in the database
        try:
            result = client.query("show_all")
            print(f"Show all result: {result}")
        except Exception as e:
            print(f"Show all query failed: {e}")
            
        print("\n✅ Direct Query Test Complete!")
        
    except Exception as e:
        print(f"❌ Error with direct queries: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_direct_queries()