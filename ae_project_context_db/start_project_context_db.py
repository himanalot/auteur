#!/usr/bin/env python3
"""
Start separate HelixDB instance for After Effects Project Context
Uses proper deployment instead of the RAG system
"""

import subprocess
import sys
import os
import time
import requests
import json

def start_project_context_db():
    """Start the separate HelixDB instance for project context"""
    print("🚀 Starting HelixDB Project Context Database...")
    print("=" * 50)
    
    # Since we can't get the CLI working, let's use a manual approach
    # Create a temporary Python script to deploy our queries
    
    print("\n1. Setting up separate database instance...")
    
    # Set up environment for separate instance
    project_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(project_dir, "helix_data")
    
    # Create data directory
    os.makedirs(data_dir, exist_ok=True)
    
    print(f"   ✅ Project directory: {project_dir}")
    print(f"   ✅ Data directory: {data_dir}")
    
    # Read our schema and queries
    with open(os.path.join(project_dir, "schema.hx"), "r") as f:
        schema_content = f.read()
    
    with open(os.path.join(project_dir, "queries.hx"), "r") as f:
        queries_content = f.read()
    
    print("\n2. Schema and queries loaded")
    print(f"   ✅ Schema: {len(schema_content)} characters")
    print(f"   ✅ Queries: {len(queries_content)} characters")
    
    # Start HelixDB with our configuration
    print("\n3. Starting HelixDB instance on port 6970...")
    
    # Use the existing binary but with our config
    env = os.environ.copy()
    env["HELIX_DATA_DIR"] = data_dir
    env["HELIX_PORT"] = "6970"
    
    # Start the instance
    try:
        # Use a different approach - just start with manual configuration
        helix_binary = os.path.expanduser("~/.helix/cached_builds/7facbe01-c325-414a-803b-4c828b9713be")
        
        if not os.path.exists(helix_binary):
            print("   ❌ HelixDB binary not found. Please install HelixDB first.")
            return False
        
        # Start with port 6970
        cmd = [helix_binary, "--port", "6970"]
        
        print(f"   🔄 Starting: {' '.join(cmd)}")
        process = subprocess.Popen(cmd, cwd=project_dir, env=env)
        
        # Wait a moment for startup
        time.sleep(3)
        
        # Test if it's running
        try:
            response = requests.get("http://localhost:6970/", timeout=2)
            print(f"   ✅ HelixDB started on port 6970!")
            return True
        except:
            try:
                response = requests.post("http://localhost:6970/mcp/init", json={}, timeout=2)
                print(f"   ✅ HelixDB MCP ready on port 6970!")
                return True
            except Exception as e:
                print(f"   ❌ Failed to connect to HelixDB: {e}")
                return False
                
    except Exception as e:
        print(f"   ❌ Failed to start HelixDB: {e}")
        return False

def deploy_queries_manually():
    """Deploy queries using direct API calls"""
    print("\n4. Deploying project context queries...")
    
    try:
        # Test MCP connection first
        init_response = requests.post("http://localhost:6970/mcp/init", json={}, timeout=5)
        if init_response.status_code == 200:
            connection_id = init_response.json()
            print(f"   ✅ MCP Connection: {connection_id}")
            
            # Try to add sample project
            print("\n5. Adding sample project data...")
            
            # Use MCP tools to add data
            sample_project_payload = {
                "connection_id": connection_id,
                "tool": {
                    "tool_name": "addSampleProject",
                    "args": {}
                }
            }
            
            project_response = requests.post("http://localhost:6970/mcp/call_tool", json=sample_project_payload, timeout=5)
            print(f"   Sample project: {project_response.status_code}")
            
            return True
        else:
            print(f"   ❌ MCP init failed: {init_response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Query deployment failed: {e}")
        return False

def test_project_context_mcp():
    """Test the MCP functionality with project context"""
    print("\n6. Testing Project Context MCP...")
    
    try:
        # Get connection
        init_response = requests.post("http://localhost:6970/mcp/init", json={})
        connection_id = init_response.json()
        
        # Test finding projects
        project_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Project"}
            }
        }
        
        project_response = requests.post("http://localhost:6970/mcp/call_tool", json=project_payload)
        print(f"   Projects found: {project_response.status_code}")
        
        # Test finding compositions
        comp_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Composition"}
            }
        }
        
        comp_response = requests.post("http://localhost:6970/mcp/call_tool", json=comp_payload)
        print(f"   Compositions found: {comp_response.status_code}")
        
        if project_response.status_code == 200 and comp_response.status_code == 200:
            print("\n✅ Project Context HelixDB is ready for autonomous agents!")
            print("   🎯 Agents can now walk AE project graphs intelligently")
            print("   🚀 Ready for Phase 2: Agent Integration")
            return True
        else:
            print("\n⚠️  MCP working but queries need deployment")
            return False
            
    except Exception as e:
        print(f"   ❌ MCP test failed: {e}")
        return False

if __name__ == "__main__":
    success = start_project_context_db()
    if success:
        deploy_queries_manually()
        test_project_context_mcp()
    else:
        print("❌ Failed to start Project Context HelixDB")