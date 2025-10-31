#!/usr/bin/env python3
"""
Separate HelixDB client for After Effects Project Context
Uses port 6970 to avoid conflict with documentation RAG system
"""

from helix.client import Client, Query
import json
from typing import Dict, List, Any

# Create client for project context HelixDB (using default port 6969)
project_db = Client(local=True)

class ProjectContextQuery(Query):
    """Test basic connectivity to project context HelixDB"""
    def __init__(self):
        super().__init__()
    
    def query(self) -> str:
        return """
        QUERY TestConnection() =>
            test <- "connection_test"
            RETURN test
        """
    
    def response(self, response):
        return response

def test_project_context_db():
    """Test the separate project context HelixDB instance"""
    print("🔍 Testing Separate HelixDB Instance for Project Context...")
    print("=" * 60)
    
    try:
        print("\n1. Testing connection to project context DB (port 6970)...")
        test_query = ProjectContextQuery()
        result = project_db.query(test_query)
        print(f"✅ Connection successful: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("   🔧 Need to start separate HelixDB instance on port 6970")
        return False

if __name__ == "__main__":
    test_project_context_db()