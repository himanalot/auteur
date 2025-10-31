#!/usr/bin/env python3
"""
RAG Query System for After Effects Extension
Provides intelligent tool recommendations based on user queries
"""

import json
import asyncio
import sqlite3
import pickle
import numpy as np
from typing import List, Dict, Any, Optional
from pathlib import Path
import openai
import re
from dataclasses import dataclass

@dataclass
class ToolRecommendation:
    """Represents a tool recommendation with context"""
    tool_name: str
    confidence: float
    reasoning: str
    documentation_context: str
    parameters_hint: Dict[str, Any]
    workflow_steps: List[str]

class RAGQuerySystem:
    def __init__(self, openai_api_key: str, db_path: str = "ae_docs_vectors.db"):
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.db_path = db_path
        self.embedding_model = "text-embedding-3-small"
        
        # Load tool mappings
        self.tool_mappings = self.load_tool_mappings()
        
    def load_tool_mappings(self) -> Dict[str, Any]:
        """Load tool mappings and workflow patterns"""
        return {
            # Animation tools
            "animate": {
                "tools": ["animate_layer", "add_keyframes", "set_layer_property"],
                "keywords": ["animate", "animation", "move", "motion", "tween", "keyframe"],
                "workflows": ["create_layer -> animate_layer", "select_layer -> animate_layer"]
            },
            
            # Layer creation
            "create": {
                "tools": ["create_shape_layer", "create_text_layer", "add_layer"],
                "keywords": ["create", "make", "new", "add", "generate"],
                "workflows": ["create_composition -> create_layer"]
            },
            
            # Shape operations
            "shape": {
                "tools": ["create_shape_layer", "add_shape_modifiers", "animate_shape_properties"],
                "keywords": ["shape", "rectangle", "circle", "ellipse", "polygon", "star"],
                "workflows": ["create_shape_layer -> add_shape_modifiers"]
            },
            
            # Text operations
            "text": {
                "tools": ["create_text_layer", "animate_text_typewriter", "set_text_style"],
                "keywords": ["text", "title", "subtitle", "typewriter", "font"],
                "workflows": ["create_text_layer -> set_text_style -> animate_text_typewriter"]
            },
            
            # Effects
            "effect": {
                "tools": ["apply_effect", "animate_effect_property", "remove_effects"],
                "keywords": ["effect", "blur", "glow", "shadow", "distort"],
                "workflows": ["select_layer -> apply_effect -> animate_effect_property"]
            },
            
            # Project management
            "project": {
                "tools": ["create_composition", "save_project", "import_file"],
                "keywords": ["project", "composition", "comp", "import", "save"],
                "workflows": ["create_project -> create_composition"]
            }
        }
    
    async def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for query text"""
        try:
            response = await asyncio.to_thread(
                self.client.embeddings.create,
                model=self.embedding_model,
                input=text.replace('\n', ' ')[:8000]
            )
            return np.array(response.data[0].embedding, dtype=np.float32)
        except Exception as e:
            print(f"❌ Error getting embedding: {e}")
            return np.zeros(1536, dtype=np.float32)
    
    async def search_documentation(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search documentation using vector similarity"""
        query_embedding = await self.get_embedding(query)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM chunks')
        results = cursor.fetchall()
        
        similarities = []
        for row in results:
            chunk_embedding = pickle.loads(row[4])  # embedding column
            similarity = np.dot(query_embedding, chunk_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
            )
            
            similarities.append({
                'id': row[0],
                'document_id': row[1],
                'content': row[3],
                'similarity': float(similarity),
                'metadata': json.loads(row[5])
            })
        
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        conn.close()
        
        return similarities[:top_k]
    
    def extract_intent(self, query: str) -> Dict[str, Any]:
        """Extract user intent from query"""
        query_lower = query.lower()
        
        # Extract action words
        action_words = []
        for category, info in self.tool_mappings.items():
            for keyword in info["keywords"]:
                if keyword in query_lower:
                    action_words.append((category, keyword))
        
        # Extract object references
        objects = []
        object_patterns = [
            r'\b(layer|shape|text|circle|rectangle|square|line)\b',
            r'\b(effect|blur|glow|shadow)\b',
            r'\b(animation|motion|movement)\b',
            r'\b(composition|comp|project)\b'
        ]
        
        for pattern in object_patterns:
            matches = re.findall(pattern, query_lower)
            objects.extend(matches)
        
        # Extract parameters/values
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', query)
        colors = re.findall(r'\b(?:red|blue|green|yellow|black|white|orange|purple)\b', query_lower)
        
        return {
            'actions': action_words,
            'objects': objects,
            'numbers': numbers,
            'colors': colors,
            'original_query': query
        }
    
    async def recommend_tools(self, query: str) -> List[ToolRecommendation]:
        """Generate tool recommendations based on query"""
        # Extract intent
        intent = self.extract_intent(query)
        
        # Search documentation for context
        doc_results = await self.search_documentation(query, top_k=3)
        
        recommendations = []
        
        # Generate recommendations based on intent
        for category, keyword in intent['actions']:
            category_info = self.tool_mappings[category]
            
            for tool_name in category_info["tools"]:
                # Calculate confidence based on keyword match and doc similarity
                confidence = 0.5  # Base confidence
                
                # Boost confidence for exact keyword matches
                if keyword in query.lower():
                    confidence += 0.3
                
                # Boost confidence if documentation context supports this tool
                doc_context = ""
                if doc_results:
                    best_doc = doc_results[0]
                    if best_doc['similarity'] > 0.7:
                        confidence += 0.2
                        doc_context = best_doc['content'][:200] + "..."
                
                # Generate reasoning
                reasoning = f"Detected '{keyword}' intent. "
                if intent['objects']:
                    reasoning += f"Working with: {', '.join(intent['objects'])}. "
                if intent['numbers']:
                    reasoning += f"Values mentioned: {', '.join(intent['numbers'])}. "
                
                # Generate parameter hints
                parameters_hint = self.generate_parameter_hints(tool_name, intent)
                
                # Generate workflow steps
                workflow_steps = self.generate_workflow_steps(category_info["workflows"], tool_name)
                
                recommendation = ToolRecommendation(
                    tool_name=tool_name,
                    confidence=min(confidence, 1.0),
                    reasoning=reasoning,
                    documentation_context=doc_context,
                    parameters_hint=parameters_hint,
                    workflow_steps=workflow_steps
                )
                
                recommendations.append(recommendation)
        
        # Sort by confidence and return top recommendations
        recommendations.sort(key=lambda x: x.confidence, reverse=True)
        return recommendations[:5]  # Return top 5
    
    def generate_parameter_hints(self, tool_name: str, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Generate parameter hints based on intent"""
        hints = {}
        
        # Common parameter patterns
        if intent['numbers']:
            if tool_name in ['animate_layer', 'create_shape_layer']:
                if len(intent['numbers']) >= 2:
                    hints['size'] = [float(intent['numbers'][0]), float(intent['numbers'][1])]
                elif len(intent['numbers']) == 1:
                    hints['duration'] = float(intent['numbers'][0])
        
        if intent['colors']:
            if tool_name in ['create_shape_layer', 'create_text_layer']:
                color_map = {
                    'red': [1, 0, 0], 'blue': [0, 0, 1], 'green': [0, 1, 0],
                    'yellow': [1, 1, 0], 'black': [0, 0, 0], 'white': [1, 1, 1]
                }
                for color in intent['colors']:
                    if color in color_map:
                        hints['fillColor'] = color_map[color]
                        break
        
        if intent['objects']:
            if 'circle' in intent['objects'] or 'ellipse' in intent['objects']:
                hints['shape'] = 'ellipse'
            elif 'rectangle' in intent['objects'] or 'square' in intent['objects']:
                hints['shape'] = 'rectangle'
        
        return hints
    
    def generate_workflow_steps(self, workflows: List[str], tool_name: str) -> List[str]:
        """Generate workflow steps for the tool"""
        steps = []
        
        # Find relevant workflow
        for workflow in workflows:
            if tool_name in workflow:
                workflow_steps = workflow.split(' -> ')
                for i, step in enumerate(workflow_steps):
                    if step == tool_name:
                        # Include previous steps as prerequisites
                        if i > 0:
                            steps.extend([f"Prerequisite: {workflow_steps[j]}" for j in range(i)])
                        steps.append(f"Execute: {tool_name}")
                        # Include next steps as suggestions
                        if i < len(workflow_steps) - 1:
                            steps.extend([f"Consider next: {workflow_steps[j]}" for j in range(i+1, len(workflow_steps))])
                break
        
        if not steps:
            steps = [f"Execute: {tool_name}"]
        
        return steps
    
    async def query(self, user_query: str) -> Dict[str, Any]:
        """Main query interface"""
        print(f"🔍 Processing query: '{user_query}'")
        
        # Get recommendations
        recommendations = await self.recommend_tools(user_query)
        
        # Get documentation context
        doc_context = await self.search_documentation(user_query, top_k=2)
        
        # Format response
        response = {
            'query': user_query,
            'recommendations': [
                {
                    'tool': rec.tool_name,
                    'confidence': rec.confidence,
                    'reasoning': rec.reasoning,
                    'parameters': rec.parameters_hint,
                    'workflow': rec.workflow_steps
                }
                for rec in recommendations
            ],
            'documentation_context': [
                {
                    'content': doc['content'][:150] + "...",
                    'similarity': doc['similarity'],
                    'source': doc.get('metadata', {}).get('document_id', 'Unknown')
                }
                for doc in doc_context
            ],
            'suggested_workflow': self.generate_suggested_workflow(recommendations)
        }
        
        return response
    
    def generate_suggested_workflow(self, recommendations: List[ToolRecommendation]) -> List[str]:
        """Generate a suggested workflow from recommendations"""
        if not recommendations:
            return []
        
        # Use the highest confidence recommendation's workflow
        best_rec = recommendations[0]
        workflow = []
        
        for step in best_rec.workflow_steps:
            if step.startswith('Prerequisite:'):
                workflow.append(step.replace('Prerequisite: ', '1. '))
            elif step.startswith('Execute:'):
                workflow.append(step.replace('Execute: ', '2. '))
            elif step.startswith('Consider next:'):
                workflow.append(step.replace('Consider next: ', '3. '))
        
        return workflow

async def main():
    """Test the RAG query system"""
    import os
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Please set OPENAI_API_KEY environment variable")
        return
    
    # Test queries
    test_queries = [
        "create a red circle that moves to the right",
        "add a blur effect to the text layer",
        "make a new composition with animated shapes",
        "create typewriter text animation",
        "animate layer opacity from 100 to 0"
    ]
    
    rag_system = RAGQuerySystem(api_key)
    
    for query in test_queries:
        print(f"\n{'='*50}")
        result = await rag_system.query(query)
        
        print(f"Query: {result['query']}")
        print(f"Top recommendation: {result['recommendations'][0]['tool']} (confidence: {result['recommendations'][0]['confidence']:.2f})")
        print(f"Reasoning: {result['recommendations'][0]['reasoning']}")
        print(f"Suggested workflow: {' -> '.join(result['suggested_workflow'])}")

if __name__ == "__main__":
    asyncio.run(main()) 