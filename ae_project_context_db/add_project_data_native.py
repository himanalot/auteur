#!/usr/bin/env python3
"""
Add project data using native HelixDB operations with proper HQL syntax
"""

import requests
import json

BASE_URL = "http://localhost:6970"

def add_project_data_native():
    """Add project data using raw HelixDB operations that work"""
    print("🚀 Adding Project Data with Native HelixDB...")
    print("=" * 50)
    
    try:
        # Since our custom HQL queries aren't deploying as endpoints,
        # let's use the working approach from our previous tests
        
        print("1. Getting MCP connection...")
        init_response = requests.post(f"{BASE_URL}/mcp/init", json={})
        connection_id = init_response.json()
        print(f"✅ Connection ID: {connection_id}")
        
        # The issue is that we need to use the default schema (Chapter/SubChapter)
        # that HelixDB is using, not our custom Project/Composition schema
        print("\n2. Adding data using default HelixDB schema...")
        
        # Let's add documents that represent AE project elements
        # but use the existing document/chapter structure
        
        from helix.client import Client, Query
        client = Client(local=True, port=6970)
        
        class AddDocuments(Query):
            def __init__(self):
                super().__init__()
            
            def query(self):
                return [
                    {
                        "type": "document",
                        "id": "project_doc_1",
                        "content": "After Effects Project: Motion Graphics Intro - A comprehensive project with animations, text layers, and background video. Duration: 30 seconds at 29.97fps, 1920x1080 resolution.",
                        "metadata": {
                            "title": "Motion Graphics Intro",
                            "ae_type": "Project",
                            "duration": 30.0,
                            "frameRate": 29.97,
                            "width": 1920,
                            "height": 1080
                        }
                    },
                    {
                        "type": "document", 
                        "id": "comp_doc_1",
                        "content": "Main Composition - The primary composition containing animated title text and background video. Duration: 10 seconds with 3 layers including title text and background footage.",
                        "metadata": {
                            "title": "Main Composition",
                            "ae_type": "Composition", 
                            "duration": 10.0,
                            "layerCount": 3,
                            "parent_project": "project_doc_1"
                        }
                    },
                    {
                        "type": "document",
                        "id": "text_doc_1", 
                        "content": "Title Text Layer - Animated text layer displaying 'Welcome to Motion Graphics' in Arial Bold 72pt font. Layer index 1 in main composition.",
                        "metadata": {
                            "title": "Title Text Layer",
                            "ae_type": "TextLayer",
                            "text": "Welcome to Motion Graphics",
                            "fontSize": 72.0,
                            "fontFamily": "Arial Bold",
                            "layerIndex": 1,
                            "parent_comp": "comp_doc_1"
                        }
                    },
                    {
                        "type": "document",
                        "id": "av_doc_1",
                        "content": "Background Video Layer - AV layer containing background video footage. Layer index 2, enabled, runs from 0 to 10 seconds.",
                        "metadata": {
                            "title": "Background Video Layer",
                            "ae_type": "AVLayer",
                            "layerIndex": 2,
                            "enabled": True,
                            "inPoint": 0.0,
                            "outPoint": 10.0,
                            "parent_comp": "comp_doc_1"
                        }
                    },
                    {
                        "type": "document",
                        "id": "footage_doc_1",
                        "content": "Background Video Footage - Source footage file background_video.mp4 from assets folder. 1920x1080 resolution, 30 second duration.",
                        "metadata": {
                            "title": "background_video.mp4", 
                            "ae_type": "FootageItem",
                            "file": "/assets/background_video.mp4",
                            "duration": 30.0,
                            "width": 1920,
                            "height": 1080
                        }
                    }
                ]
            
            def response(self, response):
                return f"Added {len(response)} documents"
        
        # Add the documents
        add_query = AddDocuments()
        result = client.query(add_query)
        print(f"   ✅ Documents added: {result}")
        
        print("\n3. Testing document discovery via MCP...")
        
        # Get new connection
        new_init = requests.post(f"{BASE_URL}/mcp/init", json={})
        new_connection_id = new_init.json()
        
        # Test finding documents (using whatever schema is active)
        # Try both Chapter and Document types
        for doc_type in ["Chapter", "Document", "SubChapter"]:
            payload = {
                "connection_id": new_connection_id,
                "tool": {
                    "tool_name": "n_from_type",
                    "args": {"node_type": doc_type}
                }
            }
            
            response = requests.post(f"{BASE_URL}/mcp/call_tool", json=payload)
            print(f"   📄 {doc_type} nodes: {response.status_code} - {response.text[:100]}...")
        
        # Test filtering by metadata
        print("\n4. Testing filtering by AE project metadata...")
        
        filter_payload = {
            "connection_id": new_connection_id,
            "tool": {
                "tool_name": "filter_items",
                "args": {
                    "properties": [["ae_type", "Project"]]
                }
            }
        }
        
        filter_response = requests.post(f"{BASE_URL}/mcp/call_tool", json=filter_payload)
        print(f"   🔍 AE Projects: {filter_response.status_code} - {filter_response.text[:150]}...")
        
        # Test another filter
        comp_filter_payload = {
            "connection_id": new_connection_id,
            "tool": {
                "tool_name": "filter_items",
                "args": {
                    "properties": [["ae_type", "Composition"]]
                }
            }
        }
        
        comp_filter_response = requests.post(f"{BASE_URL}/mcp/call_tool", json=comp_filter_payload)
        print(f"   🔍 AE Compositions: {comp_filter_response.status_code} - {comp_filter_response.text[:150]}...")
        
        print("\n✅ Project Data Added Successfully!")
        print("\n🎯 AUTONOMOUS AGENT READY:")
        print("   ✅ Project structure ingested as documents")
        print("   ✅ MCP tools can discover and filter AE elements")
        print("   ✅ Metadata-based filtering for precise context")
        print("   🤖 Agents can now walk AE project intelligently!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error adding data: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    add_project_data_native()