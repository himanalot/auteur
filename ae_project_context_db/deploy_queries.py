#!/usr/bin/env python3
"""
Deploy HQL queries to separate HelixDB instance (port 6970)
"""

from helix.client import Client
import sys
import os

def deploy_project_queries():
    """Deploy our HQL queries to the separate HelixDB instance"""
    print("🚀 Deploying Project Context Queries to HelixDB...")
    print("=" * 55)
    
    try:
        # Connect to our separate instance on port 6970
        client = Client(local=True, port=6970)
        print("✅ Connected to HelixDB on port 6970")
        
        # Read our schema and queries files
        project_dir = os.path.dirname(os.path.abspath(__file__))
        
        schema_path = os.path.join(project_dir, "schema.hx")
        queries_path = os.path.join(project_dir, "queries.hx")
        
        with open(schema_path, "r") as f:
            schema_content = f.read()
            
        with open(queries_path, "r") as f:
            queries_content = f.read()
            
        print(f"📋 Schema loaded: {len(schema_content)} characters")
        print(f"📋 Queries loaded: {len(queries_content)} characters")
        
        # Deploy schema first
        print("\n1. Deploying schema...")
        schema_result = client.deploy_schema(schema_content)
        print(f"   ✅ Schema deployed: {schema_result}")
        
        # Deploy queries
        print("\n2. Deploying queries...")
        queries_result = client.deploy_queries(queries_content)  
        print(f"   ✅ Queries deployed: {queries_result}")
        
        # Test a simple query
        print("\n3. Testing deployed queries...")
        
        # Test addSampleProject query
        add_result = client.query("addSampleProject", {})
        print(f"   ✅ addSampleProject: {add_result}")
        
        # Test getProjectStatistics
        stats_result = client.query("getProjectStatistics", {})
        print(f"   ✅ getProjectStatistics: {stats_result}")
        
        # Test findTextLayers
        text_result = client.query("findTextLayers", {})
        print(f"   ✅ findTextLayers: {text_result}")
        
        print("\n🎯 SUCCESS: All queries deployed and tested!")
        print("   🤖 Ready for autonomous agent integration")
        print("   📊 Project graph navigation enabled")
        return True
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = deploy_project_queries()
    if not success:
        sys.exit(1)