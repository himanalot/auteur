#!/usr/bin/env python3
"""
Native HelixDB Project Graph Server for After Effects
Uses the proper HelixDB Python SDK with RESTful API
"""

import os
import json
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from project_graph_helix_native import (
    ingest_project_graph,
    walk_hierarchy,
    find_related_by_name,
    get_project_summary,
    clear_project_graph
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for CEP integration

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "service": "project_graph_native_server",
        "status": "healthy",
        "helix_sdk": "native"
    })

@app.route('/ingest_project', methods=['POST'])
def ingest_project():
    """Ingest AE project JSON into HelixDB native graph"""
    try:
        project_data = request.get_json()
        if not project_data:
            return jsonify({"success": False, "error": "No project data provided"}), 400
        
        result = ingest_project_graph(project_data)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to ingest project"
        }), 500

@app.route('/walk_hierarchy/<node_id>', methods=['GET'])
def walk_project_hierarchy(node_id):
    """Walk composition hierarchy from a node"""
    try:
        depth = int(request.args.get('depth', 3))
        result = walk_hierarchy(node_id, depth)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "node_id": node_id,
            "hierarchy": []
        }), 500

@app.route('/find_related', methods=['POST'])
def find_related():
    """Find nodes with similar names"""
    try:
        data = request.get_json()
        search_term = data.get('search_term', '')
        k = data.get('k', 5)
        
        if not search_term:
            return jsonify({"success": False, "error": "No search term provided"}), 400
        
        result = find_related_by_name(search_term, k)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "search_term": search_term if 'search_term' in locals() else "",
            "related_nodes": []
        }), 500

@app.route('/walk_dependencies/<node_id>', methods=['GET'])
def walk_dependencies(node_id):
    """Find dependencies of a node"""
    try:
        # Walk outbound USES relationships
        result = walk_hierarchy(node_id, 2)  # Shallow walk for dependencies
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "node_id": node_id,
            "dependencies": []
        }), 500

@app.route('/project_summary', methods=['GET'])
def project_summary():
    """Get project statistics and summary"""
    try:
        result = get_project_summary()
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "summary": {}
        }), 500

@app.route('/clear_graph', methods=['POST'])
def clear_graph():
    """Clear all project data"""
    try:
        result = clear_project_graph()
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to clear graph"
        }), 500

@app.route('/find_animation', methods=['GET'])
def find_animation():
    """Find animation patterns in the project"""
    try:
        # Find layers with keyframe animation
        result = find_related_by_name("keyframe", 10)
        return jsonify({
            "success": True,
            "animation_nodes": result.get("related_nodes", [])
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "animation_nodes": []
        }), 500

@app.route('/query_graph', methods=['POST'])
def query_graph():
    """Generic graph query endpoint"""
    try:
        data = request.get_json()
        query_type = data.get('query_type', 'search')
        params = data.get('params', {})
        
        if query_type == 'hierarchy':
            result = walk_hierarchy(params.get('node_id', 'project_root'), params.get('depth', 3))
        elif query_type == 'search':
            result = find_related_by_name(params.get('term', ''), params.get('k', 5))
        else:
            return jsonify({"success": False, "error": "Unknown query type"}), 400
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "result": None
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Native HelixDB Project Graph Server on port 5004")
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
    print("")
    print("🔗 Native HelixDB SDK Integration Ready!")
    
    app.run(host='127.0.0.1', port=5004, debug=True)