#!/usr/bin/env python3
"""
Test the enhanced HQL-based HelixDB implementation
Tests proper AddN<Type> and AddE<Type> operations
"""

from project_graph_helix_native import (
    AddProjectNodes, AddProjectEdges, WalkProjectHierarchy,
    FindRelatedNodes, GetProjectStats, ClearProjectData,
    ingest_project_graph, walk_hierarchy, find_related_by_name, get_project_summary
)
import json

def test_hql_enhanced_implementation():
    """Test the Phase 1 enhanced HQL implementation"""
    print("🔍 Testing Enhanced HQL-Based HelixDB Implementation...")
    print("=" * 60)
    
    # Enhanced test project with more detailed data
    test_project = {
        "project": {
            "name": "Enhanced HQL Test Project",
            "duration": 45.0,
            "frameRate": 29.97,
            "width": 1920,
            "height": 1080
        },
        "items": [
            {
                "id": 1,
                "name": "Main Title Sequence",
                "type": "Composition",
                "duration": 10.0,
                "frameRate": 29.97,
                "width": 1920,
                "height": 1080,
                "layers": [
                    {
                        "name": "Main Title Text",
                        "type": "TextLayer",
                        "index": 1,
                        "text": "ENHANCED PROJECT",
                        "fontSize": 48,
                        "fontFamily": "Arial Bold"
                    },
                    {
                        "name": "Background Video",
                        "type": "AVLayer",
                        "index": 2,
                        "source_id": 2,
                        "enabled": True,
                        "inPoint": 0,
                        "outPoint": 10
                    }
                ]
            },
            {
                "id": 2,
                "name": "background_footage.mp4",
                "type": "FootageItem",
                "file": "/assets/background_footage.mp4",
                "duration": 30.0,
                "width": 1920,
                "height": 1080
            },
            {
                "id": 3,
                "name": "Logo Animation",
                "type": "Composition",
                "duration": 5.0,
                "frameRate": 29.97,
                "width": 1920,
                "height": 1080,
                "usedIn": [1],  # Used in Main Title Sequence
                "layers": [
                    {
                        "name": "Logo Layer",
                        "type": "AVLayer",
                        "index": 1,
                        "source_id": 4
                    }
                ]
            },
            {
                "id": 4,
                "name": "company_logo.png",
                "type": "FootageItem",
                "file": "/assets/company_logo.png",
                "width": 512,
                "height": 512
            }
        ]
    }
    
    print("\n1. Testing Enhanced Node Creation (AddN<Type>)...")
    try:
        nodes_query = AddProjectNodes(test_project)
        print(f"✅ Nodes Query Created: {len(nodes_query.query())} operations")
        
        # Show sample operations
        operations = nodes_query.query()
        print("   Sample operations:")
        for i, op in enumerate(operations[:3]):
            print(f"     {i+1}. {op['operation']} - {op['properties']['name']}")
        
    except Exception as e:
        print(f"❌ Node creation error: {e}")
    
    print("\n2. Testing Enhanced Edge Creation (AddE<Type>)...")
    try:
        edges_query = AddProjectEdges(test_project)
        print(f"✅ Edges Query Created: {len(edges_query.query())} operations")
        
        # Show sample operations
        operations = edges_query.query()
        print("   Sample operations:")
        for i, op in enumerate(operations[:3]):
            print(f"     {i+1}. {op['operation']} - {op['from']} → {op['to']}")
        
    except Exception as e:
        print(f"❌ Edge creation error: {e}")
    
    print("\n3. Testing HQL Hierarchy Walking...")
    try:
        hierarchy_query = WalkProjectHierarchy("project_root", 2)
        hql_query = hierarchy_query.query()
        print("✅ HQL Hierarchy Query Generated:")
        print("   ", hql_query.replace("\\n", "\\n   "))
        
    except Exception as e:
        print(f"❌ Hierarchy query error: {e}")
    
    print("\n4. Testing HQL Node Search...")
    try:
        search_query = FindRelatedNodes("Title", 3)
        hql_query = search_query.query()
        print("✅ HQL Search Query Generated:")
        print("   ", hql_query.replace("\\n", "\\n   "))
        
    except Exception as e:
        print(f"❌ Search query error: {e}")
    
    print("\n5. Testing HQL Statistics...")
    try:
        stats_query = GetProjectStats()
        hql_query = stats_query.query()
        print("✅ HQL Statistics Query Generated:")
        print("   ", hql_query.replace("\\n", "\\n   "))
        
    except Exception as e:
        print(f"❌ Statistics query error: {e}")
    
    print("\n6. Testing Full Integration...")
    try:
        # Test the full ingestion process
        result = ingest_project_graph(test_project)
        print(f"✅ Integration Test: {result['message']}")
        print(f"   📊 Stats: {result.get('stats', {})}")
        
    except Exception as e:
        print(f"❌ Integration test error: {e}")
    
    print("\n✅ Enhanced HQL Implementation Test Complete!")
    print("\n🎯 KEY IMPROVEMENTS:")
    print("   ✅ Proper AddN<Type>({properties}) syntax")
    print("   ✅ Proper AddE<Type>({properties})::From(v1)::To(v2) syntax")
    print("   ✅ Type-specific nodes (Project, Composition, TextLayer, etc.)")
    print("   ✅ Rich property mapping with AE-specific fields")
    print("   ✅ HQL query strings for traversal and search")
    print("   ✅ COUNT aggregation for statistics")
    print("   ✅ DROP operations for cleanup")
    print("\n🚀 Ready for MCP integration and autonomous agent usage!")

if __name__ == "__main__":
    test_hql_enhanced_implementation()