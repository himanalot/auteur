#!/usr/bin/env python3
"""
After Effects Graph Context Integration
Integrates AE project graph walking with autonomous agent workflow
"""

import json
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
import tempfile

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AEGraphContextManager:
    """
    Manages AE project context using HelixDB knowledge graph
    Provides intelligent context discovery for autonomous agents
    """
    
    def __init__(self, project_root_path: str, helix_port: int = 6969):
        """
        Initialize the context manager
        
        Args:
            project_root_path: Path to AE project extension root
            helix_port: HelixDB port
        """
        self.project_root = project_root_path
        self.helix_port = helix_port
        self.current_project_graph = None
        self.last_export_time = None
        self.context_cache = {}
        
        # MCP tools interface
        self.mcp_tools = None
        self._initialize_mcp_connection()
    
    def _initialize_mcp_connection(self):
        """Initialize connection to MCP graph walking tools"""
        try:
            # In production, this would establish actual MCP connection
            # For now, simulate the connection
            logger.info("Initializing MCP graph walking tools connection")
            self.mcp_tools = "simulated_mcp_connection"
        except Exception as e:
            logger.error(f"Failed to initialize MCP connection: {e}")
            self.mcp_tools = None

    async def ensure_project_graph_current(self) -> bool:
        """
        Ensure the project graph is current with AE project state
        
        Returns:
            True if graph is current, False if update failed
        """
        try:
            # Check if project has been modified since last export
            needs_update = await self._check_project_needs_update()
            
            if needs_update:
                logger.info("Project has changed, updating graph...")
                success = await self._update_project_graph()
                return success
            
            return True
            
        except Exception as e:
            logger.error(f"Error ensuring project graph current: {e}")
            return False

    async def _check_project_needs_update(self) -> bool:
        """Check if AE project has been modified since last graph export"""
        # In production, this would check AE project modification time
        # For now, simulate checking
        return self.current_project_graph is None

    async def _update_project_graph(self) -> bool:
        """Export current AE project and update graph database"""
        try:
            # Step 1: Export project structure from AE
            export_success = await self._export_ae_project()
            if not export_success:
                return False
            
            # Step 2: Ingest into HelixDB
            ingest_success = await self._ingest_project_graph()
            if not ingest_success:
                return False
            
            # Step 3: Update cached metadata
            self.last_export_time = datetime.now()
            logger.info("Project graph updated successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update project graph: {e}")
            return False

    async def _export_ae_project(self) -> bool:
        """Execute AE project export script"""
        try:
            # In production, this would call the AE ExtendScript
            export_script_path = os.path.join(self.project_root, "jsx", "export_project_for_graph.jsx")
            
            # Simulate script execution
            logger.info(f"Executing AE export script: {export_script_path}")
            
            # The actual implementation would use CEP's CSInterface to execute:
            # csInterface.evalScript(export_script_content, callback)
            
            # For now, simulate successful export
            self.current_project_graph = {
                "export_time": datetime.now().isoformat(),
                "nodes": 150,
                "edges": 400,
                "compositions": 5,
                "layers": 25
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to export AE project: {e}")
            return False

    async def _ingest_project_graph(self) -> bool:
        """Ingest exported project into HelixDB"""
        try:
            # In production, this would call the ingestion pipeline
            ingestion_script = os.path.join(self.project_root, "ae_project_graph_ingestion.py")
            
            logger.info(f"Ingesting project graph via: {ingestion_script}")
            
            # Simulate successful ingestion
            return True
            
        except Exception as e:
            logger.error(f"Failed to ingest project graph: {e}")
            return False

    async def get_context_for_task(self, task_description: str, current_selection: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Get relevant project context for a specific task
        
        Args:
            task_description: Natural language description of the task
            current_selection: Current AE selection (layer, composition, etc.)
        
        Returns:
            Dictionary containing relevant context for the task
        """
        try:
            # Ensure graph is current
            graph_ready = await self.ensure_project_graph_current()
            if not graph_ready:
                return {"error": "Could not update project graph", "context": {}}
            
            context = {
                "task": task_description,
                "selection": current_selection,
                "relevant_elements": {},
                "relationships": {},
                "suggestions": []
            }
            
            # Start context discovery from current selection
            if current_selection:
                context["relevant_elements"] = await self._discover_context_from_selection(current_selection)
            
            # Use semantic search to find task-relevant elements
            semantic_context = await self._semantic_context_discovery(task_description)
            context["relevant_elements"].update(semantic_context)
            
            # Discover relationships between relevant elements
            context["relationships"] = await self._discover_element_relationships(
                list(context["relevant_elements"].keys())
            )
            
            # Generate task-specific suggestions
            context["suggestions"] = await self._generate_task_suggestions(
                task_description, context["relevant_elements"], context["relationships"]
            )
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting context for task: {e}")
            return {"error": str(e), "context": {}}

    async def _discover_context_from_selection(self, selection: Dict) -> Dict[str, Any]:
        """Discover context starting from current AE selection"""
        try:
            selection_type = selection.get("type", "unknown")
            selection_id = selection.get("id", "")
            
            context = {}
            
            if selection_type == "layer":
                # Get layer hierarchy and dependencies
                layer_context = await self._get_layer_context(selection_id)
                context[selection_id] = layer_context
                
            elif selection_type == "composition":
                # Get composition contents and relationships
                comp_context = await self._get_composition_context(selection_id)
                context[selection_id] = comp_context
                
            elif selection_type == "property":
                # Get property dependencies and animation
                prop_context = await self._get_property_context(selection_id)
                context[selection_id] = prop_context
            
            return context
            
        except Exception as e:
            logger.error(f"Error discovering context from selection: {e}")
            return {}

    async def _get_layer_context(self, layer_id: str) -> Dict[str, Any]:
        """Get comprehensive context for a layer"""
        try:
            if not self.mcp_tools:
                return {"error": "MCP tools not available"}
            
            context = {
                "type": "layer",
                "id": layer_id,
                "hierarchy": {},
                "dependencies": {},
                "effects": {},
                "properties": {},
                "similar_layers": []
            }
            
            # Get layer hierarchy (parent composition, child properties)
            # In production: context["hierarchy"] = await mcp_walk_composition_hierarchy(layer_id)
            context["hierarchy"] = {
                "composition": "comp_1",
                "index": 2,
                "parent_layer": None,
                "child_properties": ["Transform", "Opacity", "Effects"]
            }
            
            # Get dependencies (what this layer depends on/influences)
            # In production: context["dependencies"] = await mcp_walk_dependencies(layer_id)
            context["dependencies"] = {
                "source": "footage_item_1",
                "influenced_by": [],
                "influences": ["comp_2_layer_5"]
            }
            
            # Get effects chain
            # In production: context["effects"] = await mcp_walk_effects_chain(layer_id)
            context["effects"] = {
                "effect_count": 2,
                "effects": ["Gaussian Blur", "Color Correction"]
            }
            
            # Find similar layer setups
            # In production: context["similar_layers"] = await mcp_find_similar_setups(layer_id)
            context["similar_layers"] = [
                {"id": "layer_5", "similarity": 0.85, "reason": "similar_effects"}
            ]
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting layer context: {e}")
            return {"error": str(e)}

    async def _get_composition_context(self, comp_id: str) -> Dict[str, Any]:
        """Get comprehensive context for a composition"""
        try:
            context = {
                "type": "composition",
                "id": comp_id,
                "layers": {},
                "usage": {},
                "render_info": {}
            }
            
            # Get composition hierarchy
            # In production: context["layers"] = await mcp_walk_composition_hierarchy(comp_id, depth=2)
            context["layers"] = {
                "layer_count": 5,
                "layer_types": {"text": 2, "av": 2, "shape": 1},
                "animated_layers": 3
            }
            
            # Find composition usage
            # In production: context["usage"] = await mcp_walk_dependencies(comp_id, direction="incoming")
            context["usage"] = {
                "used_in_comps": ["main_comp"],
                "in_render_queue": True
            }
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting composition context: {e}")
            return {"error": str(e)}

    async def _get_property_context(self, property_id: str) -> Dict[str, Any]:
        """Get comprehensive context for a property"""
        try:
            context = {
                "type": "property",
                "id": property_id,
                "animation": {},
                "expressions": {},
                "relationships": {}
            }
            
            # Get animation data
            context["animation"] = {
                "keyframe_count": 4,
                "animation_type": "ease_in_out",
                "duration": 2.0
            }
            
            # Get expression dependencies
            # In production: context["expressions"] = await mcp_walk_expression_dependencies(property_id)
            context["expressions"] = {
                "has_expression": True,
                "references": ["comp_1_layer_3_position"]
            }
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting property context: {e}")
            return {"error": str(e)}

    async def _semantic_context_discovery(self, task_description: str) -> Dict[str, Any]:
        """Use semantic search to find task-relevant elements"""
        try:
            if not self.mcp_tools:
                return {}
            
            # Extract keywords from task description
            keywords = self._extract_task_keywords(task_description)
            
            relevant_elements = {}
            
            for keyword in keywords:
                # In production: results = await mcp_walk_related_by_name(keyword)
                # Simulate semantic search results
                if keyword.lower() in ["animate", "animation"]:
                    relevant_elements["animated_properties"] = {
                        "type": "property_group",
                        "count": 8,
                        "items": ["position", "scale", "rotation", "opacity"]
                    }
                elif keyword.lower() in ["text", "title"]:
                    relevant_elements["text_layers"] = {
                        "type": "layer_group", 
                        "count": 3,
                        "items": ["main_title", "subtitle", "credits"]
                    }
                elif keyword.lower() in ["effect", "blur", "color"]:
                    relevant_elements["effects"] = {
                        "type": "effect_group",
                        "count": 12,
                        "categories": ["blur", "color", "distort"]
                    }
            
            return relevant_elements
            
        except Exception as e:
            logger.error(f"Error in semantic context discovery: {e}")
            return {}

    def _extract_task_keywords(self, task_description: str) -> List[str]:
        """Extract relevant keywords from task description"""
        # Simple keyword extraction - in production, this could use NLP
        keywords = []
        
        task_lower = task_description.lower()
        
        # Animation keywords
        if any(word in task_lower for word in ["animate", "move", "scale", "rotate", "fade"]):
            keywords.append("animation")
        
        # Text keywords
        if any(word in task_lower for word in ["text", "title", "subtitle", "font"]):
            keywords.append("text")
        
        # Effect keywords
        if any(word in task_lower for word in ["effect", "blur", "color", "glow", "shadow"]):
            keywords.append("effect")
        
        # Layer keywords
        if any(word in task_lower for word in ["layer", "footage", "image", "video"]):
            keywords.append("layer")
        
        return keywords

    async def _discover_element_relationships(self, element_ids: List[str]) -> Dict[str, Any]:
        """Discover relationships between relevant elements"""
        try:
            relationships = {
                "dependencies": [],
                "hierarchies": [],
                "temporal": [],
                "semantic": []
            }
            
            # For each pair of elements, check for relationships
            for i, elem1 in enumerate(element_ids):
                for elem2 in element_ids[i+1:]:
                    # In production: relationship = await mcp_check_relationship(elem1, elem2)
                    # Simulate relationship discovery
                    relationships["dependencies"].append({
                        "from": elem1,
                        "to": elem2,
                        "type": "influences",
                        "strength": 0.7
                    })
            
            return relationships
            
        except Exception as e:
            logger.error(f"Error discovering element relationships: {e}")
            return {}

    async def _generate_task_suggestions(self, task_description: str, relevant_elements: Dict, relationships: Dict) -> List[Dict]:
        """Generate task-specific suggestions based on context"""
        try:
            suggestions = []
            
            task_lower = task_description.lower()
            
            # Animation suggestions
            if "animate" in task_lower and "animated_properties" in relevant_elements:
                suggestions.append({
                    "type": "animation",
                    "suggestion": "Use existing animated properties as reference",
                    "elements": relevant_elements["animated_properties"]["items"],
                    "confidence": 0.8
                })
            
            # Text suggestions
            if "text" in task_lower and "text_layers" in relevant_elements:
                suggestions.append({
                    "type": "text_styling",
                    "suggestion": "Apply consistent styling with existing text layers",
                    "elements": relevant_elements["text_layers"]["items"],
                    "confidence": 0.9
                })
            
            # Effect suggestions
            if "effect" in task_lower and "effects" in relevant_elements:
                suggestions.append({
                    "type": "effect_chain",
                    "suggestion": "Consider similar effect combinations",
                    "elements": relevant_elements["effects"]["categories"],
                    "confidence": 0.7
                })
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error generating task suggestions: {e}")
            return []

    def get_context_summary(self) -> Dict[str, Any]:
        """Get summary of current project graph state"""
        try:
            if not self.current_project_graph:
                return {"status": "no_graph", "message": "No project graph loaded"}
            
            return {
                "status": "ready",
                "last_export": self.last_export_time.isoformat() if self.last_export_time else None,
                "graph_stats": self.current_project_graph,
                "mcp_tools_available": self.mcp_tools is not None,
                "cache_size": len(self.context_cache)
            }
            
        except Exception as e:
            logger.error(f"Error getting context summary: {e}")
            return {"status": "error", "message": str(e)}

# ===== INTEGRATION WITH EXISTING WORKFLOW =====

class AEGraphEnhancedAgent:
    """
    Enhanced autonomous agent with AE project graph context awareness
    """
    
    def __init__(self, project_root: str):
        self.context_manager = AEGraphContextManager(project_root)
        self.task_history = []
    
    async def process_task_with_context(self, task_description: str, current_selection: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Process a task with intelligent context discovery
        
        Args:
            task_description: What the user wants to accomplish
            current_selection: Current AE selection state
        
        Returns:
            Enhanced task processing result with context
        """
        try:
            # Get intelligent context for this task
            context = await self.context_manager.get_context_for_task(
                task_description, current_selection
            )
            
            # Enhance task processing with context
            result = {
                "task": task_description,
                "context": context,
                "recommendations": self._generate_recommendations(task_description, context),
                "script_suggestions": self._generate_script_suggestions(task_description, context),
                "timestamp": datetime.now().isoformat()
            }
            
            # Store in task history for learning
            self.task_history.append(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing task with context: {e}")
            return {"error": str(e)}
    
    def _generate_recommendations(self, task: str, context: Dict) -> List[str]:
        """Generate actionable recommendations based on context"""
        recommendations = []
        
        if context.get("suggestions"):
            for suggestion in context["suggestions"]:
                recommendations.append(f"Consider: {suggestion['suggestion']}")
        
        if context.get("relevant_elements"):
            recommendations.append("Relevant project elements have been identified for your task")
        
        return recommendations
    
    def _generate_script_suggestions(self, task: str, context: Dict) -> List[str]:
        """Generate specific script suggestions based on context"""
        suggestions = []
        
        # Based on context, suggest specific ExtendScript approaches
        if "text" in task.lower():
            suggestions.append("Use TextLayer properties for text manipulation")
        
        if "animate" in task.lower():
            suggestions.append("Set keyframes using property.setValueAtTime()")
        
        return suggestions

# ===== USAGE EXAMPLE =====

async def example_usage():
    """Example of how to use the graph context integration"""
    project_root = "/Users/ishanramrakhiani/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools"
    
    # Initialize enhanced agent
    agent = AEGraphEnhancedAgent(project_root)
    
    # Simulate user task with current selection
    current_selection = {
        "type": "layer",
        "id": "comp_1_layer_2",
        "name": "Main Title",
        "layer_type": "TextLayer"
    }
    
    task = "Animate this text layer to bounce when the ball hits the ground"
    
    # Process task with intelligent context
    result = await agent.process_task_with_context(task, current_selection)
    
    print("Enhanced Task Processing Result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(example_usage())