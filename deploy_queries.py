#!/usr/bin/env python3
"""
Deploy HQL queries to HelixDB so they can be executed
"""

import requests
import json
from typing import Dict, Any

# HelixDB deployment endpoint
HELIX_URL = "http://0.0.0.0:6969"

def deploy_query(query_name: str, query_definition: str) -> bool:
    """Deploy a single query to HelixDB"""
    try:
        # Use the HelixDB deployment endpoint
        deployment_data = {
            "name": query_name,
            "query": query_definition
        }
        
        response = requests.post(f"{HELIX_URL}/deploy", json=deployment_data)
        
        if response.status_code == 200:
            print(f"✅ Deployed query: {query_name}")
            return True
        else:
            print(f"❌ Failed to deploy {query_name}: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error deploying {query_name}: {e}")
        return False

def deploy_all_project_queries():
    """Deploy all After Effects project queries"""
    print("🚀 Deploying After Effects Project Queries to HelixDB...")
    print("=" * 60)
    
    # Query 1: Add Project Example
    add_project_query = """
    QUERY AddProjectExample() =>
        project <- AddN<Project>({
            name: "HQL Test Project",
            duration: 30.0,
            frameRate: 29.97,
            width: 1920,
            height: 1080
        })
        
        main_comp <- AddN<Composition>({
            name: "Main Composition", 
            duration: 10.0,
            frameRate: 29.97,
            width: 1920,
            height: 1080,
            layerCount: 2
        })
        
        text_layer <- AddN<TextLayer>({
            name: "Title Text",
            index: 1,
            text: "Welcome to HQL Testing",
            fontSize: 48.0,
            fontFamily: "Arial Bold"
        })
        
        bg_footage <- AddN<FootageItem>({
            name: "background.mp4",
            file: "/assets/background.mp4",
            duration: 30.0,
            width: 1920,
            height: 1080
        })
        
        av_layer <- AddN<AVLayer>({
            name: "Background Layer",
            index: 2,
            source_id: "bg_footage_id",
            enabled: true,
            inPoint: 0.0,
            outPoint: 10.0
        })
        
        project_contains_comp <- AddE<CONTAINS>({
            relationship: "project_item",
            item_type: "Composition"
        })::From(project)::To(main_comp)
        
        comp_contains_text <- AddE<CONTAINS>({
            relationship: "comp_layer",
            item_type: "TextLayer"
        })::From(main_comp)::To(text_layer)
        
        comp_contains_av <- AddE<CONTAINS>({
            relationship: "comp_layer",
            item_type: "AVLayer"
        })::From(main_comp)::To(av_layer)
        
        av_uses_footage <- AddE<USES>({
            relationship: "layer_source",
            usage_type: "source_reference"
        })::From(av_layer)::To(bg_footage)
        
        RETURN {
            project: project,
            composition: main_comp,
            text_layer: text_layer,
            av_layer: av_layer,
            footage: bg_footage
        }
    """
    
    # Query 2: Walk Project Hierarchy
    walk_hierarchy_query = """
    QUERY WalkProjectHierarchy() =>
        projects <- N<Project>
        project_structure <- projects::Out<CONTAINS>
        layer_details <- project_structure::Out<CONTAINS>
        
        RETURN projects::{
            project_name: name,
            compositions: _::Out<CONTAINS>::WHERE(_::{item_type}::EQ("Composition"))::{
                comp_name: name,
                duration: duration,
                layers: _::Out<CONTAINS>::{
                    layer_name: name,
                    layer_index: index,
                    layer_type: item_type
                }
            }
        }
    """
    
    # Query 3: Find Text Layers
    find_text_layers_query = """
    QUERY FindTextLayers() =>
        text_layers <- N<TextLayer>
        RETURN text_layers::{
            name: name,
            text_content: text,
            font: fontFamily,
            size: fontSize,
            in_composition: _::In<CONTAINS>::{comp_name: name}
        }
    """
    
    # Query 4: Get Project Statistics
    project_stats_query = """
    QUERY ProjectStatistics() =>
        project_count <- N<Project>::COUNT
        comp_count <- N<Composition>::COUNT
        text_layer_count <- N<TextLayer>::COUNT
        av_layer_count <- N<AVLayer>::COUNT
        footage_count <- N<FootageItem>::COUNT
        
        RETURN {
            projects: project_count,
            compositions: comp_count,
            text_layers: text_layer_count,
            av_layers: av_layer_count,
            footage_items: footage_count
        }
    """
    
    # Deploy all queries
    queries = [
        ("AddProjectExample", add_project_query),
        ("WalkProjectHierarchy", walk_hierarchy_query),
        ("FindTextLayers", find_text_layers_query),
        ("ProjectStatistics", project_stats_query)
    ]
    
    deployed_count = 0
    for query_name, query_def in queries:
        if deploy_query(query_name, query_def):
            deployed_count += 1
    
    print(f"\n✅ Deployed {deployed_count}/{len(queries)} queries successfully!")
    
    if deployed_count == len(queries):
        print("🎯 All queries deployed! Testing execution...")
        return test_deployed_queries()
    else:
        print("⚠️  Some queries failed to deploy")
        return False

def test_deployed_queries():
    """Test the deployed queries"""
    print("\n🔍 Testing Deployed Queries...")
    print("=" * 40)
    
    # Test 1: Execute AddProjectExample to create data
    print("\n1. Executing AddProjectExample...")
    try:
        response = requests.post(f"{HELIX_URL}/AddProjectExample", json={})
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Execute WalkProjectHierarchy
    print("\n2. Executing WalkProjectHierarchy...")
    try:
        response = requests.post(f"{HELIX_URL}/WalkProjectHierarchy", json={})
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Execute FindTextLayers
    print("\n3. Executing FindTextLayers...")
    try:
        response = requests.post(f"{HELIX_URL}/FindTextLayers", json={})
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Execute ProjectStatistics
    print("\n4. Executing ProjectStatistics...")
    try:
        response = requests.post(f"{HELIX_URL}/ProjectStatistics", json={})
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 5: Test MCP with deployed data
    print("\n5. Testing MCP with deployed data...")
    test_mcp_with_data()
    
    return True

def test_mcp_with_data():
    """Test MCP tools with the deployed data"""
    try:
        # Get MCP connection
        init_response = requests.post(f"{HELIX_URL}/mcp/init", json={})
        if init_response.status_code != 200:
            print(f"   ❌ MCP init failed: {init_response.status_code}")
            return
        
        connection_id = init_response.json()
        print(f"   ✅ MCP Connection: {connection_id}")
        
        # Test finding projects
        project_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "Project"}
            }
        }
        
        project_response = requests.post(f"{HELIX_URL}/mcp/call_tool", json=project_payload)
        print(f"   Projects found: {project_response.status_code} - {project_response.text[:100]}...")
        
        # Test finding text layers
        text_payload = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "n_from_type",
                "args": {"node_type": "TextLayer"}
            }
        }
        
        text_response = requests.post(f"{HELIX_URL}/mcp/call_tool", json=text_payload)
        print(f"   Text layers found: {text_response.status_code} - {text_response.text[:100]}...")
        
    except Exception as e:
        print(f"   ❌ MCP test error: {e}")

if __name__ == "__main__":
    deploy_all_project_queries()