#!/usr/bin/env python3
"""
MCP Server for After Effects Project Graph Walking
Provides intelligent graph traversal tools for autonomous agents
"""

from mcp.server.fastmcp import FastMCP
import helix
import json
import logging
from typing import Optional, List, Dict, Any, Tuple
import numpy as np

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MCP server
mcp = FastMCP("ae-graph-walker")

# HelixDB client
client = helix.Client(local=True, port=6969)

# Global connection ID for HelixDB session
current_connection_id = None

def get_connection():
    """Get or create HelixDB connection"""
    global current_connection_id
    if current_connection_id is None:
        current_connection_id = client.query(helix.init())[0]
        logger.info(f"Initialized HelixDB connection: {current_connection_id}")
    return current_connection_id

# ===== CORE WALKING TOOLS =====

@mcp.tool()
def walk_composition_hierarchy(composition_id: str, depth: int = 2) -> str:
    """
    Navigate composition → layers → properties hierarchy
    
    Args:
        composition_id: ID of the composition to explore
        depth: How deep to traverse (1=layers, 2=properties, 3=keyframes)
    
    Returns:
        JSON structure of composition hierarchy
    """
    try:
        connection_id = get_connection()
        
        result = {
            "composition": composition_id,
            "layers": [],
            "depth": depth
        }
        
        # Get all layers in this composition
        layers_query = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "out_step",
                "args": {
                    "edge_label": "contains",
                    "edge_type": "ae_layer"
                }
            }
        }
        
        # Start from composition node
        layers_response = client.query(helix.call_tool(layers_query))
        layers = json.loads(layers_response[0]) if layers_response else []
        
        for layer in layers:
            layer_info = {
                "id": layer.get("id"),
                "name": layer.get("name"),
                "type": layer.get("type"),
                "properties": layer.get("properties", {})
            }
            
            if depth >= 2:
                # Get layer properties
                layer_info["property_groups"] = _get_layer_properties(connection_id, layer.get("id"))
                
                if depth >= 3:
                    # Get keyframes for animated properties
                    layer_info["keyframes"] = _get_layer_keyframes(connection_id, layer.get("id"))
            
            result["layers"].append(layer_info)
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in walk_composition_hierarchy: {e}")
        return json.dumps({"error": str(e)})

@mcp.tool()
def walk_dependencies(node_id: str, direction: str = "both", max_depth: int = 3) -> str:
    """
    Find what depends on/influences a layer/property
    
    Args:
        node_id: ID of the node to analyze dependencies for
        direction: "incoming", "outgoing", or "both"
        max_depth: Maximum traversal depth
    
    Returns:
        JSON structure of dependency relationships
    """
    try:
        connection_id = get_connection()
        
        result = {
            "node_id": node_id,
            "dependencies": {
                "incoming": [],
                "outgoing": []
            }
        }
        
        if direction in ["incoming", "both"]:
            # Find what depends on this node
            incoming = _traverse_dependencies(connection_id, node_id, "incoming", max_depth)
            result["dependencies"]["incoming"] = incoming
        
        if direction in ["outgoing", "both"]:
            # Find what this node depends on
            outgoing = _traverse_dependencies(connection_id, node_id, "outgoing", max_depth)
            result["dependencies"]["outgoing"] = outgoing
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in walk_dependencies: {e}")
        return json.dumps({"error": str(e)})

@mcp.tool()
def walk_related_by_name(search_term: str, node_types: Optional[List[str]] = None, limit: int = 10) -> str:
    """
    Find similarly named elements using semantic search
    
    Args:
        search_term: Text to search for
        node_types: Optional list of node types to filter (e.g., ["ae_layer", "ae_effect"])
        limit: Maximum number of results
    
    Returns:
        JSON list of semantically similar nodes
    """
    try:
        connection_id = get_connection()
        
        # Generate embedding for search term (simulated for now)
        search_embedding = _generate_search_embedding(search_term)
        
        # Perform vector similarity search
        similar_nodes = _vector_similarity_search(
            connection_id, 
            search_embedding, 
            node_types, 
            limit
        )
        
        result = {
            "search_term": search_term,
            "node_types": node_types,
            "results": similar_nodes
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in walk_related_by_name: {e}")
        return json.dumps({"error": str(e)})

@mcp.tool()
def walk_effects_chain(layer_id: str, include_properties: bool = True) -> str:
    """
    Traverse effect stack and property relationships
    
    Args:
        layer_id: ID of the layer to analyze
        include_properties: Whether to include effect properties
    
    Returns:
        JSON structure of effects chain
    """
    try:
        connection_id = get_connection()
        
        result = {
            "layer_id": layer_id,
            "effects": []
        }
        
        # Get all effects on this layer
        effects_query = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "out_step",
                "args": {
                    "edge_label": "contains",
                    "edge_type": "ae_effect"
                }
            }
        }
        
        effects_response = client.query(helix.call_tool(effects_query))
        effects = json.loads(effects_response[0]) if effects_response else []
        
        for effect in effects:
            effect_info = {
                "id": effect.get("id"),
                "name": effect.get("name"),
                "match_name": effect.get("properties", {}).get("match_name"),
                "enabled": effect.get("properties", {}).get("enabled"),
                "category": effect.get("properties", {}).get("effect_category")
            }
            
            if include_properties:
                # Get effect properties
                effect_info["properties"] = _get_effect_properties(connection_id, effect.get("id"))
            
            result["effects"].append(effect_info)
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in walk_effects_chain: {e}")
        return json.dumps({"error": str(e)})

@mcp.tool()
def walk_expression_dependencies(property_id: str) -> str:
    """
    Follow expression references to other objects
    
    Args:
        property_id: ID of the property with expression
    
    Returns:
        JSON structure of expression dependencies
    """
    try:
        connection_id = get_connection()
        
        result = {
            "property_id": property_id,
            "expression": None,
            "references": []
        }
        
        # Get expression driving this property
        expr_query = {
            "connection_id": connection_id,
            "tool": {
                "tool_name": "in_step",
                "args": {
                    "edge_label": "drives_with_expression",
                    "edge_type": "ae_expression"
                }
            }
        }
        
        expr_response = client.query(helix.call_tool(expr_query))
        expressions = json.loads(expr_response[0]) if expr_response else []
        
        if expressions:
            expression = expressions[0]
            result["expression"] = {
                "id": expression.get("id"),
                "text": expression.get("properties", {}).get("expression_text"),
                "language": expression.get("properties", {}).get("language")
            }
            
            # Parse expression to find references
            expr_text = expression.get("properties", {}).get("expression_text", "")
            references = _parse_expression_references(connection_id, expr_text)
            result["references"] = references
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in walk_expression_dependencies: {e}")
        return json.dumps({"error": str(e)})

@mcp.tool()
def walk_time_relationships(time_seconds: float, composition_id: Optional[str] = None) -> str:
    """
    Find elements active/animated at specific time
    
    Args:
        time_seconds: Time to analyze
        composition_id: Optional composition to limit search
    
    Returns:
        JSON structure of time-based relationships
    """
    try:
        connection_id = get_connection()
        
        result = {
            "time_seconds": time_seconds,
            "composition_id": composition_id,
            "active_layers": [],
            "active_keyframes": [],
            "active_expressions": []
        }
        
        # Find layers active at this time
        active_layers = _find_layers_at_time(connection_id, time_seconds, composition_id)
        result["active_layers"] = active_layers
        
        # Find keyframes at this time
        active_keyframes = _find_keyframes_at_time(connection_id, time_seconds)
        result["active_keyframes"] = active_keyframes
        
        # Find expressions active at this time
        active_expressions = _find_expressions_at_time(connection_id, time_seconds)
        result["active_expressions"] = active_expressions
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in walk_time_relationships: {e}")
        return json.dumps({"error": str(e)})

# ===== CONTEXTUAL DISCOVERY TOOLS =====

@mcp.tool()
def find_similar_setups(reference_layer_id: str, similarity_threshold: float = 0.7) -> str:
    """
    Vector search for similar layer configurations
    
    Args:
        reference_layer_id: Layer to find similar setups for
        similarity_threshold: Minimum similarity score (0-1)
    
    Returns:
        JSON list of similar layer setups
    """
    try:
        connection_id = get_connection()
        
        # Get reference layer properties
        reference_layer = _get_layer_full_context(connection_id, reference_layer_id)
        
        # Find similar layers based on effects, properties, and structure
        similar_layers = _find_similar_layer_setups(
            connection_id, 
            reference_layer, 
            similarity_threshold
        )
        
        result = {
            "reference_layer": reference_layer_id,
            "similarity_threshold": similarity_threshold,
            "similar_setups": similar_layers
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in find_similar_setups: {e}")
        return json.dumps({"error": str(e)})

@mcp.tool()
def discover_unused_elements(project_id: str = "project_root") -> str:
    """
    Find disconnected/unused nodes in graph
    
    Args:
        project_id: Project to analyze
    
    Returns:
        JSON list of unused elements
    """
    try:
        connection_id = get_connection()
        
        result = {
            "project_id": project_id,
            "unused_footage": [],
            "unused_compositions": [],
            "unused_effects": [],
            "orphaned_properties": []
        }
        
        # Find unused footage items
        unused_footage = _find_unused_footage(connection_id)
        result["unused_footage"] = unused_footage
        
        # Find unused compositions
        unused_comps = _find_unused_compositions(connection_id)
        result["unused_compositions"] = unused_comps
        
        # Find effects that are disabled
        unused_effects = _find_disabled_effects(connection_id)
        result["unused_effects"] = unused_effects
        
        # Find properties without keyframes or expressions
        orphaned_props = _find_orphaned_properties(connection_id)
        result["orphaned_properties"] = orphaned_props
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in discover_unused_elements: {e}")
        return json.dumps({"error": str(e)})

@mcp.tool()
def trace_render_path(layer_id: str) -> str:
    """
    Follow the actual render dependency chain
    
    Args:
        layer_id: Layer to trace render path for
    
    Returns:
        JSON structure of render dependencies
    """
    try:
        connection_id = get_connection()
        
        result = {
            "layer_id": layer_id,
            "render_path": []
        }
        
        # Trace from layer to composition to render queue
        render_path = _trace_layer_render_path(connection_id, layer_id)
        result["render_path"] = render_path
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in trace_render_path: {e}")
        return json.dumps({"error": str(e)})

@mcp.tool()
def find_animation_patterns(pattern_type: str = "bounce", time_range: Optional[Tuple[float, float]] = None) -> str:
    """
    Discover keyframe/expression patterns
    
    Args:
        pattern_type: Type of pattern to find ("bounce", "ease", "linear", "custom")
        time_range: Optional time range to search within
    
    Returns:
        JSON list of matching animation patterns
    """
    try:
        connection_id = get_connection()
        
        result = {
            "pattern_type": pattern_type,
            "time_range": time_range,
            "matching_patterns": []
        }
        
        # Find keyframe sequences that match the pattern
        patterns = _find_keyframe_patterns(connection_id, pattern_type, time_range)
        result["matching_patterns"] = patterns
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in find_animation_patterns: {e}")
        return json.dumps({"error": str(e)})

# ===== HELPER FUNCTIONS =====

def _get_layer_properties(connection_id: str, layer_id: str) -> List[Dict]:
    """Get properties for a layer"""
    # Simulate property retrieval
    return [
        {"name": "Transform", "type": "PropertyGroup", "properties": []},
        {"name": "Opacity", "type": "Property", "value": 100, "keyframes": 0}
    ]

def _get_layer_keyframes(connection_id: str, layer_id: str) -> List[Dict]:
    """Get keyframes for a layer"""
    # Simulate keyframe retrieval
    return [
        {"property": "Position", "time": 0.0, "value": [960, 540]},
        {"property": "Position", "time": 2.0, "value": [1200, 540]}
    ]

def _traverse_dependencies(connection_id: str, node_id: str, direction: str, max_depth: int) -> List[Dict]:
    """Traverse dependency relationships"""
    # Simulate dependency traversal
    if direction == "incoming":
        return [{"id": "dependency_1", "relationship": "drives_with_expression"}]
    else:
        return [{"id": "source_1", "relationship": "uses_source"}]

def _generate_search_embedding(text: str) -> np.ndarray:
    """Generate embedding for search term"""
    # Simulate embedding generation
    return np.random.rand(768).astype(np.float32)

def _vector_similarity_search(connection_id: str, embedding: np.ndarray, node_types: Optional[List[str]], limit: int) -> List[Dict]:
    """Perform vector similarity search"""
    # Simulate vector search
    return [
        {"id": "similar_1", "name": "Similar Layer", "similarity": 0.85},
        {"id": "similar_2", "name": "Related Effect", "similarity": 0.78}
    ]

def _get_effect_properties(connection_id: str, effect_id: str) -> List[Dict]:
    """Get properties for an effect"""
    # Simulate effect property retrieval
    return [
        {"name": "Intensity", "value": 50, "keyframes": 2},
        {"name": "Color", "value": [1, 0, 0], "keyframes": 0}
    ]

def _parse_expression_references(connection_id: str, expression_text: str) -> List[Dict]:
    """Parse expression to find object references"""
    # Simulate expression parsing
    references = []
    if "thisComp.layer" in expression_text:
        references.append({"type": "layer_reference", "target": "layer_name"})
    if "effect(" in expression_text:
        references.append({"type": "effect_reference", "target": "effect_name"})
    return references

def _find_layers_at_time(connection_id: str, time_seconds: float, composition_id: Optional[str]) -> List[Dict]:
    """Find layers active at specific time"""
    # Simulate time-based layer search
    return [
        {"id": "layer_1", "name": "Active Layer", "in_point": 0, "out_point": 5}
    ]

def _find_keyframes_at_time(connection_id: str, time_seconds: float) -> List[Dict]:
    """Find keyframes at specific time"""
    # Simulate keyframe search
    return [
        {"property_id": "prop_1", "time": time_seconds, "value": [100, 200]}
    ]

def _find_expressions_at_time(connection_id: str, time_seconds: float) -> List[Dict]:
    """Find expressions active at specific time"""
    # Simulate expression search
    return [
        {"expression_id": "expr_1", "property": "Position", "active": True}
    ]

def _get_layer_full_context(connection_id: str, layer_id: str) -> Dict:
    """Get full context for a layer"""
    # Simulate full layer context retrieval
    return {
        "id": layer_id,
        "name": "Reference Layer",
        "effects": ["Blur", "Color Correction"],
        "properties": ["Transform", "Opacity"]
    }

def _find_similar_layer_setups(connection_id: str, reference_layer: Dict, threshold: float) -> List[Dict]:
    """Find layers with similar setups"""
    # Simulate similar setup search
    return [
        {"id": "similar_layer_1", "similarity": 0.85, "matching_aspects": ["effects", "properties"]}
    ]

def _find_unused_footage(connection_id: str) -> List[Dict]:
    """Find unused footage items"""
    return [{"id": "footage_1", "name": "Unused.mov", "reason": "no_layer_references"}]

def _find_unused_compositions(connection_id: str) -> List[Dict]:
    """Find unused compositions"""
    return [{"id": "comp_1", "name": "Unused Comp", "reason": "not_in_render_queue"}]

def _find_disabled_effects(connection_id: str) -> List[Dict]:
    """Find disabled effects"""
    return [{"id": "effect_1", "name": "Disabled Blur", "layer": "layer_1"}]

def _find_orphaned_properties(connection_id: str) -> List[Dict]:
    """Find properties without animation"""
    return [{"id": "prop_1", "name": "Static Property", "reason": "no_keyframes_or_expressions"}]

def _trace_layer_render_path(connection_id: str, layer_id: str) -> List[Dict]:
    """Trace render path for layer"""
    return [
        {"step": 1, "node": layer_id, "type": "Layer"},
        {"step": 2, "node": "comp_1", "type": "Composition"},
        {"step": 3, "node": "render_1", "type": "RenderQueueItem"}
    ]

def _find_keyframe_patterns(connection_id: str, pattern_type: str, time_range: Optional[Tuple[float, float]]) -> List[Dict]:
    """Find keyframe patterns"""
    return [
        {"property_id": "prop_1", "pattern": pattern_type, "confidence": 0.9, "keyframes": 4}
    ]

# ===== RESOURCE ENDPOINTS =====

@mcp.resource("project://{project_id}/graph_summary")
def project_graph_summary(project_id: str) -> str:
    """Get summary of project graph structure"""
    try:
        connection_id = get_connection()
        
        summary = {
            "project_id": project_id,
            "node_counts": {
                "compositions": 5,
                "layers": 25,
                "effects": 18,
                "properties": 150,
                "keyframes": 45
            },
            "edge_counts": {
                "contains": 200,
                "parents_to": 8,
                "uses_source": 20,
                "drives_with_expression": 12
            },
            "top_level_compositions": [
                {"id": "comp_1", "name": "Main Comp", "layers": 10},
                {"id": "comp_2", "name": "Intro", "layers": 5}
            ]
        }
        
        return json.dumps(summary, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})

@mcp.resource("project://{project_id}/schema")
def project_schema(project_id: str) -> str:
    """Get graph schema for project"""
    schema = {
        "node_types": list(client.node_types.values()) if hasattr(client, 'node_types') else [],
        "edge_types": list(client.edge_types.values()) if hasattr(client, 'edge_types') else [],
        "available_tools": [
            "walk_composition_hierarchy",
            "walk_dependencies", 
            "walk_related_by_name",
            "walk_effects_chain",
            "walk_expression_dependencies",
            "walk_time_relationships",
            "find_similar_setups",
            "discover_unused_elements",
            "trace_render_path",
            "find_animation_patterns"
        ]
    }
    return json.dumps(schema, indent=2)

if __name__ == "__main__":
    logger.info("Starting AE Graph Walker MCP Server")
    mcp.run()