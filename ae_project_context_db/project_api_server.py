#!/usr/bin/env python3
"""
Simple REST API server for project context HelixDB instance
Adds endpoints to add and query project data
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from helix.client import Client, Query
import json

app = Flask(__name__)
CORS(app)

# Connect to our separate HelixDB instance on port 6970
client = Client(local=True, port=6970)

class AddProjectData(Query):
    def __init__(self, project_data):
        super().__init__()
        self.project_data = project_data
    
    def query(self):
        return self.project_data
    
    def response(self, response):
        return {"added": len(response)}

@app.route('/add_project_data', methods=['POST'])
def add_project_data():
    """Add After Effects project data to HelixDB"""
    try:
        data = request.json
        
        # Convert AE project data to HelixDB documents
        documents = []
        
        if 'project' in data:
            project = data['project']
            documents.append({
                "type": "document",
                "id": f"project_{project.get('name', 'unnamed').replace(' ', '_')}",
                "content": f"After Effects Project: {project.get('name', 'Unnamed Project')}",
                "metadata": {
                    "ae_type": "Project",
                    "name": project.get('name'),
                    "duration": project.get('duration'),
                    "frameRate": project.get('frameRate'),
                    "width": project.get('width'),
                    "height": project.get('height')
                }
            })
        
        if 'compositions' in data:
            for comp in data['compositions']:
                documents.append({
                    "type": "document",
                    "id": f"comp_{comp.get('name', 'unnamed').replace(' ', '_')}",
                    "content": f"Composition: {comp.get('name', 'Unnamed Composition')}",
                    "metadata": {
                        "ae_type": "Composition",
                        "name": comp.get('name'),
                        "duration": comp.get('duration'),
                        "frameRate": comp.get('frameRate'),
                        "width": comp.get('width'),
                        "height": comp.get('height'),
                        "layerCount": len(comp.get('layers', []))
                    }
                })
        
        if 'layers' in data:
            for layer in data['layers']:
                documents.append({
                    "type": "document",
                    "id": f"layer_{layer.get('name', 'unnamed').replace(' ', '_')}_{layer.get('index', 0)}",
                    "content": f"Layer: {layer.get('name', 'Unnamed Layer')} - {layer.get('type', 'Unknown')}",
                    "metadata": {
                        "ae_type": layer.get('type', 'Layer'),
                        "name": layer.get('name'),
                        "index": layer.get('index'),
                        "enabled": layer.get('enabled'),
                        "inPoint": layer.get('inPoint'),
                        "outPoint": layer.get('outPoint')
                    }
                })
        
        if 'footage' in data:
            for footage in data['footage']:
                documents.append({
                    "type": "document", 
                    "id": f"footage_{footage.get('name', 'unnamed').replace(' ', '_')}",
                    "content": f"Footage: {footage.get('name', 'Unnamed Footage')}",
                    "metadata": {
                        "ae_type": "FootageItem",
                        "name": footage.get('name'),
                        "file": footage.get('file'),
                        "duration": footage.get('duration'),
                        "width": footage.get('width'),
                        "height": footage.get('height')
                    }
                })
        
        # Add to HelixDB
        add_query = AddProjectData(documents)
        result = client.query(add_query)
        
        return jsonify({
            "success": True,
            "message": f"Added {len(documents)} project elements",
            "result": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/search_projects', methods=['GET'])
def search_projects():
    """Search for project elements"""
    try:
        ae_type = request.args.get('type', None)
        name = request.args.get('name', None)
        
        # For now, return a simple response since we need MCP for actual querying
        return jsonify({
            "success": True,
            "message": "Use MCP tools for querying",
            "mcp_endpoint": "http://localhost:6970/mcp/",
            "suggested_tools": ["n_from_type", "filter_items"]
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/add_sample_project', methods=['POST'])
def add_sample_project():
    """Add a sample AE project for testing"""
    try:
        sample_data = [
            {
                "type": "document",
                "id": "sample_project_1",
                "content": "Sample After Effects Project - Motion Graphics Demo with animated text and background video",
                "metadata": {
                    "ae_type": "Project",
                    "name": "Motion Graphics Demo",
                    "duration": 30.0,
                    "frameRate": 29.97,
                    "width": 1920,
                    "height": 1080
                }
            },
            {
                "type": "document",
                "id": "sample_comp_1", 
                "content": "Main Composition - Primary composition with title animation and background",
                "metadata": {
                    "ae_type": "Composition",
                    "name": "Main Comp",
                    "duration": 10.0,
                    "frameRate": 29.97,
                    "width": 1920,
                    "height": 1080,
                    "layerCount": 3
                }
            },
            {
                "type": "document",
                "id": "sample_text_1",
                "content": "Title Text Layer - Animated title displaying 'Welcome to After Effects'",
                "metadata": {
                    "ae_type": "TextLayer",
                    "name": "Title Text",
                    "text": "Welcome to After Effects",
                    "fontSize": 72.0,
                    "fontFamily": "Arial Bold",
                    "index": 1
                }
            }
        ]
        
        add_query = AddProjectData(sample_data)
        result = client.query(add_query)
        
        return jsonify({
            "success": True,
            "message": "Sample project added successfully",
            "elements_added": len(sample_data),
            "result": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/status', methods=['GET'])
def status():
    """Check server status"""
    return jsonify({
        "status": "running",
        "helix_port": 6970,
        "api_port": 6971,
        "endpoints": [
            "/add_project_data",
            "/search_projects", 
            "/add_sample_project",
            "/status"
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting Project Context API Server...")
    print("   ✅ HelixDB: http://localhost:6970")
    print("   ✅ API Server: http://localhost:6971")
    print("   ✅ Endpoints: /add_project_data, /add_sample_project, /status")
    app.run(host='0.0.0.0', port=6971, debug=True)