#!/usr/bin/env python3
"""
Flask server for HelixDB Project Graph integration
Provides REST API for project graph operations
"""

import os
import json
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from project_graph_helix import (
    ingest_project_to_helix,
    walk_composition_hierarchy,
    find_related_by_name,
    walk_dependencies,
    find_animation_patterns,
    get_project_summary,
    clear_project_graph
)

app = Flask(__name__)
CORS(app)  # Enable CORS for CEP integration

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "project_graph_server"})

@app.route('/ingest_project', methods=['POST'])
def ingest_project():
    """Ingest AE project JSON into HelixDB"""
    try:
        project_data = request.get_json()
        if not project_data:
            return jsonify({"success": False, "error": "No project data provided"}), 400
        
        result = ingest_project_to_helix(project_data)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/walk_hierarchy/<node_id>', methods=['GET'])
def walk_hierarchy(node_id):
    """Walk composition hierarchy from a node"""
    try:
        depth = request.args.get('depth', 3, type=int)
        result = walk_composition_hierarchy(node_id, depth)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/find_related', methods=['POST'])
def find_related():
    """Find nodes with similar names"""
    try:
        data = request.get_json()
        search_term = data.get('search_term')
        k = data.get('k', 5)
        
        if not search_term:
            return jsonify({"success": False, "error": "search_term required"}), 400
        
        result = find_related_by_name(search_term, k)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/walk_dependencies/<node_id>', methods=['GET'])
def walk_deps(node_id):
    """Find dependencies for a node"""
    try:
        direction = request.args.get('direction', 'both')
        result = walk_dependencies(node_id, direction)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/find_animation', methods=['GET'])
def find_animation():
    """Find animation patterns"""
    try:
        pattern_type = request.args.get('pattern_type', 'keyframe')
        result = find_animation_patterns(pattern_type)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/project_summary', methods=['GET'])
def project_summary():
    """Get project statistics"""
    try:
        result = get_project_summary()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/clear_graph', methods=['POST'])
def clear_graph():
    """Clear all project graph data"""
    try:
        result = clear_project_graph()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/query_graph', methods=['POST'])
def query_graph():
    """Generic graph query endpoint"""
    try:
        data = request.get_json()
        query_type = data.get('query_type')
        params = data.get('params', {})
        
        if query_type == 'walk_hierarchy':
            result = walk_composition_hierarchy(
                params.get('node_id'),
                params.get('depth', 3)
            )
        elif query_type == 'find_related':
            result = find_related_by_name(
                params.get('search_term'),
                params.get('k', 5)
            )
        elif query_type == 'walk_dependencies':
            result = walk_dependencies(
                params.get('node_id'),
                params.get('direction', 'both')
            )
        elif query_type == 'find_animation':
            result = find_animation_patterns(
                params.get('pattern_type', 'keyframe')
            )
        elif query_type == 'summary':
            result = get_project_summary()
        else:
            return jsonify({"success": False, "error": f"Unknown query type: {query_type}"}), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    
    print(f"🚀 Starting Project Graph Server on port {port}")
    print("📋 Available endpoints:")
    print("  POST /ingest_project - Ingest AE project JSON")
    print("  GET  /walk_hierarchy/<node_id> - Walk composition hierarchy")
    print("  POST /find_related - Find similar named nodes")
    print("  GET  /walk_dependencies/<node_id> - Find dependencies")
    print("  GET  /find_animation - Find animation patterns")
    print("  GET  /project_summary - Get project statistics")
    print("  POST /clear_graph - Clear all graph data")
    print("  POST /query_graph - Generic query endpoint")
    print("  GET  /health - Health check")
    print("\n🔗 HelixDB Integration Ready!")
    
    app.run(host='127.0.0.1', port=port, debug=True)