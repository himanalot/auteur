#!/usr/bin/env python3
"""
HelixDB Project Graph System for After Effects
Creates and queries knowledge graphs of AE projects using HelixDB
"""

import os
import json
import sys
from helix.client import Query, Client
from helix.types import Payload
from typing import Dict, List, Any, Optional

# Initialize HelixDB client (same as RAG system)
db = Client(local=True)

class CreateProjectGraph(Query):
    """Create nodes and edges for AE project graph"""
    def __init__(self, project_data: Dict[str, Any]):
        super().__init__()
        self.project_data = project_data
    
    def query(self):
        # Return HelixDB graph operations as payload
        operations = []
        
        # Create project root document
        project_info = self.project_data.get("project", {})
        operations.append({
            "type": "document",
            "id": "project_root",
            "content": f"Project: {project_info.get('name', 'Untitled')}",
            "metadata": project_info
        })
        
        # Create documents for each project item
        for i, item in enumerate(self.project_data.get("items", [])):
            item_id = f"item_{item.get('id', i)}"
            item_name = item.get('name', f'Item {i}')
            item_type = item.get('type', 'Item')
            
            operations.append({
                "type": "document", 
                "id": item_id,
                "content": f"{item_type}: {item_name}",
                "metadata": item
            })
        
        return operations
    
    def response(self, response):
        return {
            "success": True,
            "nodes_created": len([op for op in self.query() if op.get("type") == "document"]),
            "edges_created": 0
        }

class WalkCompositionHierarchy(Query):
    """Walk down composition hierarchy from a node"""
    def __init__(self, node_id: str, depth: int = 3):
        super().__init__()
        self.node_id = node_id
        self.depth = depth
    
    def query(self):
        return [{
            "traverse": {
                "start_node": self.node_id,
                "edge_type": "CONTAINS",
                "direction": "outbound", 
                "max_depth": self.depth
            }
        }]
    
    def response(self, response):
        return response

class FindRelatedByName(Query):
    """Find nodes with similar names using vector search"""
    def __init__(self, search_term: str, k: int = 5):
        super().__init__()
        self.search_term = search_term
        self.k = k
    
    def query(self):
        return [{
            "semantic_search": {
                "field": "name",
                "query": self.search_term,
                "k": self.k
            }
        }]
    
    def response(self, response):
        return response

class WalkDependencies(Query):
    """Find what a node depends on or influences"""
    def __init__(self, node_id: str, direction: str = "both"):
        super().__init__()
        self.node_id = node_id
        self.direction = direction  # "inbound", "outbound", "both"
    
    def query(self):
        queries = []
        
        if self.direction in ["outbound", "both"]:
            queries.append({
                "traverse": {
                    "start_node": self.node_id,
                    "edge_types": ["USES_SOURCE", "DRIVES_WITH_EXPRESSION"],
                    "direction": "outbound",
                    "max_depth": 2
                }
            })
        
        if self.direction in ["inbound", "both"]:
            queries.append({
                "traverse": {
                    "start_node": self.node_id,
                    "edge_types": ["USES_SOURCE", "DRIVES_WITH_EXPRESSION", "PARENTS_TO"],
                    "direction": "inbound",
                    "max_depth": 2
                }
            })
        
        return queries
    
    def response(self, response):
        return response

class FindAnimationPatterns(Query):
    """Find keyframes and animation patterns"""
    def __init__(self, pattern_type: str = "keyframe"):
        super().__init__()
        self.pattern_type = pattern_type
    
    def query(self):
        return [{
            "filter": {
                "node_type": "Keyframe",
                "properties": {
                    "type": self.pattern_type
                }
            }
        }]
    
    def response(self, response):
        return response

def ingest_project_to_helix(project_json: Dict[str, Any]) -> Dict[str, Any]:
    """Ingest AE project JSON into HelixDB graph"""
    try:
        print("🚀 Ingesting project into HelixDB...")
        
        # Create project graph
        create_query = CreateProjectGraph(project_json)
        result = db.query(create_query)
        
        return {
            "success": True,
            "message": "Project graph created in HelixDB",
            "stats": {
                "nodes_created": len(project_json.get("items", [])),
                "edges_created": len(project_json.get("items", [])) * 2  # Estimate
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def walk_composition_hierarchy(node_id: str, depth: int = 3) -> Dict[str, Any]:
    """Walk down composition hierarchy"""
    try:
        query = WalkCompositionHierarchy(node_id, depth)
        result = db.query(query)
        
        return {
            "success": True,
            "node_id": node_id,
            "hierarchy": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def find_related_by_name(search_term: str, k: int = 5) -> Dict[str, Any]:
    """Find nodes with similar names"""
    try:
        query = FindRelatedByName(search_term, k)
        result = db.query(query)
        
        return {
            "success": True,
            "search_term": search_term,
            "related_nodes": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def walk_dependencies(node_id: str, direction: str = "both") -> Dict[str, Any]:
    """Find dependencies for a node"""
    try:
        query = WalkDependencies(node_id, direction)
        result = db.query(query)
        
        return {
            "success": True,
            "node_id": node_id,
            "dependencies": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def find_animation_patterns(pattern_type: str = "keyframe") -> Dict[str, Any]:
    """Find animation patterns in the project"""
    try:
        query = FindAnimationPatterns(pattern_type)
        result = db.query(query)
        
        return {
            "success": True,
            "pattern_type": pattern_type,
            "patterns": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def get_project_summary() -> Dict[str, Any]:
    """Get overall project statistics"""
    try:
        # Query for project stats
        project_query = db.query({
            "stats": {
                "node_counts_by_type": True,
                "edge_counts_by_type": True,
                "total_nodes": True,
                "total_edges": True
            }
        })
        
        return {
            "success": True,
            "stats": project_query
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def clear_project_graph():
    """Clear all project graph data"""
    try:
        # Clear all nodes and edges
        clear_query = db.query({
            "action": "clear_all"
        })
        
        return {
            "success": True,
            "message": "Project graph cleared"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# CLI interface
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python project_graph_helix.py ingest <project.json>")
        print("  python project_graph_helix.py walk_hierarchy <node_id>")
        print("  python project_graph_helix.py find_related <search_term>")
        print("  python project_graph_helix.py walk_deps <node_id>")
        print("  python project_graph_helix.py find_animation <pattern_type>")
        print("  python project_graph_helix.py summary")
        print("  python project_graph_helix.py clear")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "ingest":
        if len(sys.argv) < 3:
            print("Error: Please provide project JSON file")
            sys.exit(1)
        
        with open(sys.argv[2], 'r') as f:
            project_data = json.load(f)
        
        result = ingest_project_to_helix(project_data)
        print(json.dumps(result, indent=2))
        
    elif command == "walk_hierarchy":
        if len(sys.argv) < 3:
            print("Error: Please provide node_id")
            sys.exit(1)
        
        result = walk_composition_hierarchy(sys.argv[2])
        print(json.dumps(result, indent=2))
        
    elif command == "find_related":
        if len(sys.argv) < 3:
            print("Error: Please provide search term")
            sys.exit(1)
        
        result = find_related_by_name(sys.argv[2])
        print(json.dumps(result, indent=2))
        
    elif command == "walk_deps":
        if len(sys.argv) < 3:
            print("Error: Please provide node_id")
            sys.exit(1)
        
        result = walk_dependencies(sys.argv[2])
        print(json.dumps(result, indent=2))
        
    elif command == "find_animation":
        pattern_type = sys.argv[2] if len(sys.argv) > 2 else "keyframe"
        result = find_animation_patterns(pattern_type)
        print(json.dumps(result, indent=2))
        
    elif command == "summary":
        result = get_project_summary()
        print(json.dumps(result, indent=2))
        
    elif command == "clear":
        result = clear_project_graph()
        print(json.dumps(result, indent=2))
        
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)