#!/usr/bin/env python3
"""
HelixDB Project Graph System for After Effects - Phase 1 Enhanced
Uses proper HQL syntax with AddN<Type> and AddE<Type> operations
Follows official HelixDB documentation patterns
"""

import os
import json
import sys
from typing import Dict, List, Any, Optional
from helix.client import Client, Query

# Initialize HelixDB client using the helix-py SDK
db = Client(local=True)

class AddProjectNodes(Query):
    """Add project nodes using proper HQL AddN<Type> syntax"""
    def __init__(self, project_data: Dict[str, Any]):
        super().__init__()
        self.project_data = project_data
    
    def query(self) -> List[Any]:
        """Create nodes using proper HQL AddN<Type>({properties}) operations"""
        operations = []
        
        # Add project root using AddN<Project>
        project_info = self.project_data.get("project", {})
        operations.append({
            "operation": "AddN<Project>",
            "properties": {
                "id": "project_root",
                "name": project_info.get("name", "Untitled Project"),
                "duration": project_info.get("duration", 0),
                "frameRate": project_info.get("frameRate", 30),
                "width": project_info.get("width", 1920),
                "height": project_info.get("height", 1080)
            }
        })
        
        # Add project items using type-specific AddN operations
        for item in self.project_data.get("items", []):
            item_id = f"item_{item.get('id', 'unknown')}"
            item_type = item.get("type", "Item")
            
            # Use specific node types for different AE items
            if item_type == "Composition":
                operations.append({
                    "operation": "AddN<Composition>",
                    "properties": {
                        "id": item_id,
                        "name": item.get("name", "Unnamed Composition"),
                        "duration": item.get("duration", 0),
                        "frameRate": item.get("frameRate", 30),
                        "width": item.get("width", 1920),
                        "height": item.get("height", 1080),
                        "layerCount": len(item.get("layers", []))
                    }
                })
            elif item_type == "FootageItem":
                operations.append({
                    "operation": "AddN<FootageItem>",
                    "properties": {
                        "id": item_id,
                        "name": item.get("name", "Unnamed Footage"),
                        "file": item.get("file", ""),
                        "duration": item.get("duration", 0),
                        "width": item.get("width", 0),
                        "height": item.get("height", 0)
                    }
                })
            else:
                # Generic item type
                operations.append({
                    "operation": "AddN<Item>",
                    "properties": {
                        "id": item_id,
                        "name": item.get("name", "Unnamed Item"),
                        "type": item_type
                    }
                })
            
            # Add layers as child nodes if composition
            if item.get("layers"):
                for i, layer in enumerate(item["layers"]):
                    layer_id = f"{item_id}_layer_{i}"
                    layer_type = layer.get("type", "Layer")
                    
                    # Use specific layer types
                    if layer_type == "TextLayer":
                        operations.append({
                            "operation": "AddN<TextLayer>",
                            "properties": {
                                "id": layer_id,
                                "name": layer.get("name", f"Text Layer {i}"),
                                "index": layer.get("index", i),
                                "text": layer.get("text", ""),
                                "fontSize": layer.get("fontSize", 12),
                                "fontFamily": layer.get("fontFamily", "Arial")
                            }
                        })
                    elif layer_type == "AVLayer":
                        operations.append({
                            "operation": "AddN<AVLayer>",
                            "properties": {
                                "id": layer_id,
                                "name": layer.get("name", f"AV Layer {i}"),
                                "index": layer.get("index", i),
                                "source_id": layer.get("source_id"),
                                "enabled": layer.get("enabled", True),
                                "inPoint": layer.get("inPoint", 0),
                                "outPoint": layer.get("outPoint", 0)
                            }
                        })
                    else:
                        # Generic layer type
                        operations.append({
                            "operation": "AddN<Layer>",
                            "properties": {
                                "id": layer_id,
                                "name": layer.get("name", f"Layer {i}"),
                                "index": layer.get("index", i),
                                "type": layer_type
                            }
                        })
        
        return operations
    
    def response(self, response):
        return {"success": True, "nodes_created": len(response)}

class AddProjectEdges(Query):
    """Add relationships using proper HQL AddE<Type>::From()::To() syntax"""
    def __init__(self, project_data: Dict[str, Any]):
        super().__init__()
        self.project_data = project_data
    
    def query(self) -> List[Any]:
        """Create edges using proper HQL AddE<Type>({properties})::From(v1)::To(v2) operations"""
        operations = []
        
        # Project contains items using AddE<CONTAINS>
        for item in self.project_data.get("items", []):
            item_id = f"item_{item.get('id', 'unknown')}"
            operations.append({
                "operation": "AddE<CONTAINS>",
                "properties": {
                    "relationship": "project_item",
                    "created_at": "2024-01-01",
                    "item_type": item.get("type", "Item")
                },
                "from": "project_root",
                "to": item_id
            })
            
            # Composition contains layers using AddE<CONTAINS>
            if item.get("layers"):
                for i, layer in enumerate(item["layers"]):
                    layer_id = f"{item_id}_layer_{i}"
                    operations.append({
                        "operation": "AddE<CONTAINS>",
                        "properties": {
                            "relationship": "comp_layer",
                            "layer_index": i,
                            "layer_type": layer.get("type", "Layer")
                        },
                        "from": item_id,
                        "to": layer_id
                    })
                    
                    # Layer references source using AddE<USES>
                    if layer.get("source_id"):
                        source_id = f"item_{layer['source_id']}"
                        operations.append({
                            "operation": "AddE<USES>",
                            "properties": {
                                "relationship": "layer_source",
                                "usage_type": "source_reference"
                            },
                            "from": layer_id,
                            "to": source_id
                        })
            
            # Add dependency relationships for compositions
            if item.get("type") == "Composition" and item.get("usedIn"):
                for dep_id in item["usedIn"]:
                    dependent_id = f"item_{dep_id}"
                    operations.append({
                        "operation": "AddE<DEPENDS_ON>",
                        "properties": {
                            "relationship": "composition_dependency",
                            "dependency_type": "precomp"
                        },
                        "from": dependent_id,
                        "to": item_id
                    })
        
        return operations
    
    def response(self, response):
        return {"success": True, "edges_created": len(response)}

class WalkProjectHierarchy(Query):
    """Walk project hierarchy using proper HQL traversal syntax"""
    def __init__(self, start_node: str, depth: int = 3):
        super().__init__()
        self.start_node = start_node
        self.depth = depth
    
    def query(self) -> str:
        """Use HQL syntax: N<Project>(node_id)::Out<CONTAINS>."""
        return f"""
        QUERY WalkHierarchy({self.start_node}: ID) =>
            hierarchy <- N<Project>({self.start_node})::Out<CONTAINS>::RANGE(0, {self.depth})
            RETURN hierarchy::{{
                id: ID,
                name: name,
                type: type,
                children: _::Out<CONTAINS>::{{id: ID, name: name}}
            }}
        """
    
    def response(self, response):
        return response

class FindRelatedNodes(Query):
    """Find nodes using HQL WHERE conditions and filtering"""
    def __init__(self, search_term: str, k: int = 5):
        super().__init__()
        self.search_term = search_term
        self.k = k
    
    def query(self) -> str:
        """Use HQL syntax with WHERE conditions"""
        return f"""
        QUERY FindByName(term: String) =>
            matches <- N::WHERE(
                OR(
                    _::{{name}}::EQ("{self.search_term}"),
                    _::{{type}}::EQ("{self.search_term}")
                )
            )::RANGE(0, {self.k})
            RETURN matches::{{id: ID, name: name, type: type}}
        """
    
    def response(self, response):
        return response

def ingest_project_graph(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """Ingest AE project data into HelixDB as a native graph"""
    try:
        # Add nodes first
        nodes_query = AddProjectNodes(project_data)
        nodes_result = db.query(nodes_query)
        
        # Add edges second
        edges_query = AddProjectEdges(project_data)
        edges_result = db.query(edges_query)
        
        return {
            "success": True,
            "message": "Project graph created in HelixDB",
            "stats": {
                "nodes_created": len(project_data.get("items", [])) + 1,  # +1 for project root
                "edges_created": len([item for item in project_data.get("items", []) if item.get("layers")]) * 2
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to create project graph"
        }

def walk_hierarchy(node_id: str, depth: int = 3) -> Dict[str, Any]:
    """Walk the project hierarchy from a node"""
    try:
        query = WalkProjectHierarchy(node_id, depth)
        result = db.query(query)
        
        return {
            "success": True,
            "node_id": node_id,
            "hierarchy": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "node_id": node_id,
            "hierarchy": []
        }

def find_related_by_name(search_term: str, k: int = 5) -> Dict[str, Any]:
    """Find nodes with similar names"""
    try:
        query = FindRelatedNodes(search_term, k)
        result = db.query(query)
        
        return {
            "success": True,
            "search_term": search_term,
            "related_nodes": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "search_term": search_term,
            "related_nodes": []
        }

class GetProjectStats(Query):
    """Get project statistics using HQL aggregation"""
    def __init__(self):
        super().__init__()
    
    def query(self) -> str:
        """Use HQL COUNT aggregation to get statistics"""
        return """
        QUERY ProjectStatistics() =>
            project_count <- N<Project>::COUNT
            comp_count <- N<Composition>::COUNT
            layer_count <- N<Layer>::COUNT
            footage_count <- N<FootageItem>::COUNT
            RETURN {
                projects: project_count,
                compositions: comp_count,
                layers: layer_count,
                footage_items: footage_count
            }
        """
    
    def response(self, response):
        return response

def get_project_summary() -> Dict[str, Any]:
    """Get project statistics and summary"""
    try:
        # Use HQL-based query for statistics
        stats_query = GetProjectStats()
        result = db.query(stats_query)
        
        return {
            "success": True,
            "summary": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": {}
        }

class ClearProjectData(Query):
    """Clear project data using HQL DROP operations"""
    def __init__(self):
        super().__init__()
    
    def query(self) -> str:
        """Use HQL DROP to remove project nodes and edges"""
        return """
        QUERY ClearAll() =>
            DROP N<Project>
            DROP N<Composition>
            DROP N<Layer>
            DROP N<FootageItem>
            DROP E<CONTAINS>
            DROP E<USES>
            DROP E<DEPENDS_ON>
        """
    
    def response(self, response):
        return {"cleared": True}

def clear_project_graph() -> Dict[str, Any]:
    """Clear all project data from HelixDB"""
    try:
        # Use HQL-based query for clearing
        clear_query = ClearProjectData()
        result = db.query(clear_query)
        
        return {
            "success": True,
            "message": "Project graph cleared"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to clear project graph"
        }

if __name__ == "__main__":
    # Test the implementation
    test_project = {
        "project": {
            "name": "Test Project",
            "duration": 30.0
        },
        "items": [
            {
                "id": 1,
                "name": "Main Comp",
                "type": "Composition",
                "layers": [
                    {"name": "Text Layer", "type": "TextLayer", "index": 1},
                    {"name": "BG Layer", "type": "AVLayer", "index": 2, "source_id": 2}
                ]
            },
            {
                "id": 2,
                "name": "Background.mp4",
                "type": "FootageItem"
            }
        ]
    }
    
    # Test ingestion
    result = ingest_project_graph(test_project)
    print("Ingestion result:", json.dumps(result, indent=2))
    
    # Test hierarchy walking
    hierarchy = walk_hierarchy("project_root", 2)
    print("Hierarchy result:", json.dumps(hierarchy, indent=2))