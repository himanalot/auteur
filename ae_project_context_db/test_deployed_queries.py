#!/usr/bin/env python3
"""
Test deployed queries on HelixDB instance
"""

from helix.client import Client
import sys

def test_queries():
    """Test if our queries are deployed and working"""
    print("🔍 Testing Deployed Queries...")
    print("=" * 35)
    
    try:
        # Connect to our instance
        client = Client(local=True, port=6970)
        print("✅ Connected to HelixDB on port 6970")
        
        # Test each query
        queries_to_test = [
            "addSampleProject",
            "walkProjectHierarchy", 
            "findTextLayers",
            "getProjectStatistics",
            "findCompositionsByName"
        ]
        
        working_queries = []
        
        for query_name in queries_to_test:
            try:
                print(f"\n🧪 Testing {query_name}...")
                result = client.query(query_name, {})
                print(f"   ✅ {query_name}: SUCCESS")
                print(f"   📄 Result: {result}")
                working_queries.append(query_name)
            except Exception as e:
                print(f"   ❌ {query_name}: {e}")
        
        print(f"\n📊 Summary: {len(working_queries)}/{len(queries_to_test)} queries working")
        
        if working_queries:
            print("✅ Some queries are deployed and working!")
            return True
        else:
            print("❌ No queries are working - need to deploy properly")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_queries()