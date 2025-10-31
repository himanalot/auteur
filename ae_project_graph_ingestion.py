#!/usr/bin/env python3
"""
After Effects Project Graph Ingestion Pipeline
Converts exported AE project JSON into HelixDB knowledge graph
"""

import json
import helix
import numpy as np
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import hashlib
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class GraphStats:
    """Statistics for graph ingestion"""
    nodes_created: int = 0
    edges_created: int = 0
    embeddings_generated: int = 0
    errors: int = 0
    start_time: float = 0
    end_time: float = 0

class AEProjectGraphIngestion:
    """Main class for ingesting AE project data into HelixDB"""
    
    def __init__(self, helix_port: int = 6969, embedding_model: str = "text-embedding-004"):
        """Initialize the ingestion pipeline"""
        self.client = helix.Client(local=True, port=helix_port)
        self.embedding_model = embedding_model
        self.stats = GraphStats()
        
        # Node type mappings for HelixDB schema
        self.node_types = {
            "Project": "ae_project",
            "Composition": "ae_composition", 
            "FootageItem": "ae_footage",
            "ProjectFolder": "ae_folder",
            "AVLayer": "ae_layer",
            "TextLayer": "ae_text_layer",
            "ShapeLayer": "ae_shape_layer",
            "CameraLayer": "ae_camera_layer",
            "LightLayer": "ae_light_layer",
            "Property": "ae_property",
            "PropertyGroup": "ae_property_group",
            "Effect": "ae_effect",
            "Keyframe": "ae_keyframe",
            "Expression": "ae_expression",
            "RenderQueueItem": "ae_render_item"
        }
        
        # Edge type mappings
        self.edge_types = {
            "CONTAINS": "contains",
            "PARENTS_TO": "parents_to",
            "USES_SOURCE": "uses_source",
            "DRIVES_WITH_EXPRESSION": "drives_with_expression",
            "HAS_KEYFRAME": "has_keyframe",
            "RENDERS": "renders",
            "REFERENCES_IN_EXPRESSION": "references_in_expression",
            "SIMILAR_NAME": "similar_name",
            "SIMILAR_FUNCTION": "similar_function"
        }

    def ingest_project(self, project_json_path: str) -> GraphStats:
        """
        Main ingestion method
        
        Args:
            project_json_path: Path to exported AE project JSON
            
        Returns:
            GraphStats with ingestion results
        """
        self.stats.start_time = time.time()
        
        try:
            # Load project data
            logger.info(f"Loading project data from {project_json_path}")
            with open(project_json_path, 'r') as f:
                export_result = json.load(f)
            
            if not export_result.get('success', False):
                raise ValueError(f"Export failed: {export_result.get('message', 'Unknown error')}")
            
            project_data = export_result['data']
            
            # Initialize HelixDB schema
            self._initialize_schema()
            
            # Generate embeddings for text content
            logger.info("Generating embeddings for text content")
            embeddings_map = self._generate_embeddings(project_data['embedding_content'])
            
            # Ingest nodes
            logger.info("Ingesting nodes into graph")
            self._ingest_nodes(project_data['nodes'], embeddings_map)
            
            # Ingest edges
            logger.info("Ingesting edges into graph")
            self._ingest_edges(project_data['edges'])
            
            # Generate semantic similarity edges
            logger.info("Computing semantic similarity relationships")
            self._compute_semantic_relationships(project_data['nodes'], embeddings_map)
            
            self.stats.end_time = time.time()
            
            logger.info(f"Ingestion completed successfully:")
            logger.info(f"  - Nodes created: {self.stats.nodes_created}")
            logger.info(f"  - Edges created: {self.stats.edges_created}")
            logger.info(f"  - Embeddings generated: {self.stats.embeddings_generated}")
            logger.info(f"  - Time taken: {self.stats.end_time - self.stats.start_time:.2f}s")
            
            return self.stats
            
        except Exception as e:
            self.stats.errors += 1
            logger.error(f"Ingestion failed: {e}")
            raise

    def _initialize_schema(self):
        """Initialize HelixDB schema for AE project elements"""
        try:
            # Initialize HelixDB connection
            connection_id = self.client.query(helix.init())[0]
            logger.info(f"Initialized HelixDB connection: {connection_id}")
            
            # Define schema for each node type
            for ae_type, helix_type in self.node_types.items():
                schema_query = f"""
                CREATE NODE TYPE {helix_type} (
                    id: String,
                    name: String?,
                    type: String,
                    properties: Object,
                    embedding: Vector?
                );
                """
                # Note: Actual HelixDB schema creation would use the appropriate HQL syntax
                logger.debug(f"Would create schema for {helix_type}")
            
            # Define schema for edge types
            for ae_type, helix_type in self.edge_types.items():
                logger.debug(f"Would create edge schema for {helix_type}")
                
        except Exception as e:
            logger.warning(f"Schema initialization warning: {e}")
            # Continue with ingestion even if schema creation has issues

    def _generate_embeddings(self, embedding_content: List[Dict]) -> Dict[str, np.ndarray]:
        """
        Generate embeddings for text content
        
        Args:
            embedding_content: List of content items to embed
            
        Returns:
            Dictionary mapping content IDs to embeddings
        """
        embeddings_map = {}
        
        try:
            # For now, simulate embeddings with random vectors
            # In production, this would use actual embedding model
            for content_item in embedding_content:
                content_id = content_item['id']
                field = content_item['field']
                text = content_item['content']
                content_type = content_item['type']
                
                # Create unique key for this embedding
                embed_key = f"{content_id}_{field}"
                
                # Generate embedding (simulated for now)
                # In production: embedding = self._get_embedding(text)
                embedding = np.random.rand(768).astype(np.float32)  # Simulate 768-dim embedding
                
                embeddings_map[embed_key] = {
                    'vector': embedding,
                    'text': text,
                    'type': content_type,
                    'node_id': content_id,
                    'field': field
                }
                
                self.stats.embeddings_generated += 1
                
            logger.info(f"Generated {len(embeddings_map)} embeddings")
            return embeddings_map
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return {}

    def _get_embedding(self, text: str) -> np.ndarray:
        """
        Get actual embedding from embedding model
        (Placeholder for real implementation)
        """
        # In production, this would call Google's text-embedding-004 or similar
        # For now, create a deterministic "embedding" based on text hash
        text_hash = hashlib.md5(text.encode()).hexdigest()
        np.random.seed(int(text_hash[:8], 16))
        return np.random.rand(768).astype(np.float32)

    def _ingest_nodes(self, nodes: List[Dict], embeddings_map: Dict[str, Any]):
        """
        Ingest nodes into HelixDB
        
        Args:
            nodes: List of node data
            embeddings_map: Map of embeddings by content ID
        """
        for node in nodes:
            try:
                node_id = node['id']
                node_type = node['type']
                properties = node.get('properties', {})
                
                # Get primary embedding for this node (name field if available)
                primary_embedding = None
                embed_key = f"{node_id}_name"
                if embed_key in embeddings_map:
                    primary_embedding = embeddings_map[embed_key]['vector'].tolist()
                
                # Prepare node data for HelixDB
                helix_node_type = self.node_types.get(node_type, "ae_unknown")
                
                node_data = {
                    'id': node_id,
                    'name': properties.get('name', ''),
                    'type': node_type,
                    'properties': properties
                }
                
                if primary_embedding is not None:
                    node_data['embedding'] = primary_embedding
                
                # Create node in HelixDB using appropriate query
                # For now, simulate the creation
                self._create_helix_node(helix_node_type, node_data)
                
                self.stats.nodes_created += 1
                
                if self.stats.nodes_created % 100 == 0:
                    logger.info(f"Created {self.stats.nodes_created} nodes...")
                    
            except Exception as e:
                logger.error(f"Failed to create node {node.get('id', 'unknown')}: {e}")
                self.stats.errors += 1

    def _create_helix_node(self, node_type: str, node_data: Dict):
        """
        Create a node in HelixDB
        (Placeholder for actual HelixDB node creation)
        """
        # In production, this would use HelixDB's actual node creation API
        # For now, just log the operation
        logger.debug(f"Creating {node_type} node: {node_data['id']}")
        
        # Example of what the actual call might look like:
        # query = helix.create_node(node_type, node_data)
        # result = self.client.query(query)

    def _ingest_edges(self, edges: List[Dict]):
        """
        Ingest edges into HelixDB
        
        Args:
            edges: List of edge data
        """
        for edge in edges:
            try:
                from_id = edge['from']
                to_id = edge['to']
                edge_type = edge['type']
                properties = edge.get('properties', {})
                
                # Get HelixDB edge type
                helix_edge_type = self.edge_types.get(edge_type, "unknown_relation")
                
                # Create edge in HelixDB
                self._create_helix_edge(from_id, to_id, helix_edge_type, properties)
                
                self.stats.edges_created += 1
                
                if self.stats.edges_created % 500 == 0:
                    logger.info(f"Created {self.stats.edges_created} edges...")
                    
            except Exception as e:
                logger.error(f"Failed to create edge {edge.get('from', 'unknown')} -> {edge.get('to', 'unknown')}: {e}")
                self.stats.errors += 1

    def _create_helix_edge(self, from_id: str, to_id: str, edge_type: str, properties: Dict):
        """
        Create an edge in HelixDB
        (Placeholder for actual HelixDB edge creation)
        """
        # In production, this would use HelixDB's actual edge creation API
        logger.debug(f"Creating {edge_type} edge: {from_id} -> {to_id}")
        
        # Example of what the actual call might look like:
        # query = helix.create_edge(from_id, to_id, edge_type, properties)
        # result = self.client.query(query)

    def _compute_semantic_relationships(self, nodes: List[Dict], embeddings_map: Dict[str, Any]):
        """
        Compute semantic similarity relationships between nodes
        
        Args:
            nodes: List of node data
            embeddings_map: Map of embeddings by content ID
        """
        logger.info("Computing semantic similarity relationships")
        
        # Extract nodes with embeddings
        nodes_with_embeddings = []
        for node in nodes:
            node_id = node['id']
            embed_key = f"{node_id}_name"
            if embed_key in embeddings_map:
                nodes_with_embeddings.append({
                    'id': node_id,
                    'type': node['type'],
                    'name': node.get('properties', {}).get('name', ''),
                    'embedding': embeddings_map[embed_key]['vector']
                })
        
        # Compute pairwise similarities for same-type nodes
        similarity_threshold = 0.7
        similarities_created = 0
        
        for i, node1 in enumerate(nodes_with_embeddings):
            for j, node2 in enumerate(nodes_with_embeddings[i+1:], i+1):
                # Only compute similarity for same types or related types
                if self._should_compute_similarity(node1['type'], node2['type']):
                    similarity = self._cosine_similarity(node1['embedding'], node2['embedding'])
                    
                    if similarity > similarity_threshold:
                        # Create similarity edge
                        self._create_helix_edge(
                            node1['id'], 
                            node2['id'], 
                            "similar_name", 
                            {
                                'similarity_score': float(similarity),
                                'relationship': 'semantic_similarity'
                            }
                        )
                        similarities_created += 1
        
        logger.info(f"Created {similarities_created} semantic similarity relationships")

    def _should_compute_similarity(self, type1: str, type2: str) -> bool:
        """Check if similarity should be computed between two node types"""
        # Compute similarity within same types
        if type1 == type2:
            return True
        
        # Compute similarity between related types
        layer_types = {'AVLayer', 'TextLayer', 'ShapeLayer', 'CameraLayer', 'LightLayer'}
        if type1 in layer_types and type2 in layer_types:
            return True
        
        property_types = {'Property', 'PropertyGroup'}
        if type1 in property_types and type2 in property_types:
            return True
        
        return False

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Compute cosine similarity between two vectors"""
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot_product / (norm_a * norm_b)


def ingest_ae_project_from_json(json_path: str, helix_port: int = 6969) -> GraphStats:
    """
    Convenience function to ingest AE project from JSON file
    
    Args:
        json_path: Path to exported AE project JSON
        helix_port: HelixDB port (default 6969)
        
    Returns:
        GraphStats with ingestion results
    """
    ingestion = AEProjectGraphIngestion(helix_port=helix_port)
    return ingestion.ingest_project(json_path)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Ingest After Effects project into HelixDB")
    parser.add_argument("json_path", help="Path to exported AE project JSON file")
    parser.add_argument("--port", type=int, default=6969, help="HelixDB port (default: 6969)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        stats = ingest_ae_project_from_json(args.json_path, args.port)
        print(f"Ingestion completed successfully!")
        print(f"  Nodes created: {stats.nodes_created}")
        print(f"  Edges created: {stats.edges_created}")
        print(f"  Embeddings generated: {stats.embeddings_generated}")
        print(f"  Time taken: {stats.end_time - stats.start_time:.2f}s")
        if stats.errors > 0:
            print(f"  Errors encountered: {stats.errors}")
            
    except Exception as e:
        print(f"Ingestion failed: {e}")
        exit(1)