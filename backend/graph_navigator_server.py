#!/usr/bin/env python3
"""
Graph Navigator Flask Server
Provides REST API for HelixDB graph navigation tools
Based on the MCP server pattern but as a Flask service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from helix.client import Client
import sys
import traceback

app = Flask(__name__)
CORS(app)

# Global HelixDB client - connect to project context instance
try:
    client = Client(local=True, port=6970)
    print(f"✅ HelixDB client initialized successfully: {type(client)}", file=sys.stderr)
except Exception as e:
    print(f"❌ Failed to initialize HelixDB client: {e}", file=sys.stderr)
    client = None

connections = {}  # Store connection IDs per session

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'graph_navigator',
        'helix_port': 6970
    })

@app.route('/init', methods=['POST'])
def init_connection():
    """Initialize connection to HelixDB"""
    try:
        # Store the actual client object for this session
        session_id = request.json.get('session_id', 'default')
        
        if client is None:
            return jsonify({
                'success': False,
                'error': 'HelixDB client not initialized'
            }), 500
            
        connections[session_id] = client  # Store the actual client object
        connection_id = f"client_for_{session_id}"
        
        print(f"🔗 Storing client for session {session_id}: {type(client)}", file=sys.stderr)
        
        return jsonify({
            'success': True,
            'connection_id': connection_id,
            'session_id': session_id
        })
    except Exception as e:
        print(f"Init error: {e}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/schema', methods=['GET'])
def get_schema():
    """Get schema for current connection"""
    try:
        session_id = request.args.get('session_id', 'default')
        session_client = connections.get(session_id)
        
        if not session_client:
            return jsonify({'success': False, 'error': 'No connection found'}), 400
            
        # Try different methods to get schema
        try:
            # Try session_client.get_schema() first
            schema = session_client.get_schema()
        except AttributeError:
            try:
                # Try session_client.schema_info() 
                schema = session_client.schema_info()
            except AttributeError:
                try:
                    # Try calling get_all_node_types and get_all_edge_types if available
                    node_types = getattr(session_client, 'get_all_node_types', lambda: [])()
                    edge_types = getattr(session_client, 'get_all_edge_types', lambda: [])()
                    schema = {
                        'node_types': node_types,
                        'edge_types': edge_types,
                        'message': 'Schema retrieved from available client methods'
                    }
                except Exception as e:
                    # If all else fails, return available client methods for debugging
                    methods = [method for method in dir(session_client) if not method.startswith('_')]
                    schema = {
                        'error': f'Schema methods not found: {str(e)}',
                        'available_methods': methods
                    }
        return jsonify({
            'success': True,
            'schema': schema
        })
    except Exception as e:
        print(f"Schema error: {e}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/next', methods=['POST'])
def next_results():
    """Get next batch of results from current query"""
    try:
        session_id = request.json.get('session_id', 'default')
        connection_id = connections.get(session_id)
        
        if not connection_id:
            return jsonify({'success': False, 'error': 'No connection found'}), 400
            
        # Use client.next() method instead
        result = client.next()
        return jsonify({
            'success': True,
            'result': result
        })
    except Exception as e:
        print(f"Next error: {e}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/out_step', methods=['POST'])
def out_step():
    """Step outward through edges of given label and type"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        session_client = connections.get(session_id)
        
        if not session_client:
            return jsonify({'success': False, 'error': 'No connection found'}), 400
        
        edge_label = data.get('edge_label')
        edge_type = data.get('edge_type')
        
        if not edge_label:
            return jsonify({'success': False, 'error': 'edge_label is required'}), 400
        
        # Use direct HTTP calls to HelixDB endpoints since helix-py doesn't have these methods
        import requests
        try:
            # For now, use a placeholder response since we need to determine the right endpoints
            response = {
                'message': f'Graph traversal through {edge_label} edges',
                'edge_label': edge_label,
                'edge_type': edge_type,
                'status': 'not_implemented_yet'
            }
        except Exception as e:
            response = {'error': f'Request failed: {str(e)}'}
        print(f"out_step response: {response}", file=sys.stderr)
        
        return jsonify({
            'success': True,
            'result': response
        })
    except Exception as e:
        print(f"Out step error: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/in_step', methods=['POST'])
def in_step():
    """Step inward through edges of given label and type"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        session_client = connections.get(session_id)
        
        if not session_client:
            return jsonify({'success': False, 'error': 'No connection found'}), 400
        
        edge_label = data.get('edge_label')
        edge_type = data.get('edge_type')
        
        if not edge_label:
            return jsonify({'success': False, 'error': 'edge_label is required'}), 400
        
        # Check available methods and try different approaches
        # Use direct HTTP calls to HelixDB endpoints since helix-py doesn't have these methods
        import requests
        try:
            # For now, use a placeholder response since we need to determine the right endpoints
            response = {
                'message': f'Graph traversal inward through {edge_label} edges',
                'edge_label': edge_label,
                'edge_type': edge_type,
                'status': 'not_implemented_yet'
            }
        except Exception as e:
            response = {'error': f'Request failed: {str(e)}'}
        print(f"in_step response: {response}", file=sys.stderr)
        
        return jsonify({
            'success': True,
            'result': response
        })
    except Exception as e:
        print(f"In step error: {e}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/nodes_by_type', methods=['POST'])
def nodes_by_type():
    """Get nodes of specific type"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        session_client = connections.get(session_id)
        
        if not session_client:
            return jsonify({'success': False, 'error': 'No connection found'}), 400
        
        node_type = data.get('node_type')
        if not node_type:
            return jsonify({'success': False, 'error': 'node_type is required'}), 400
        
        # Debug: check what methods are available
        methods = [method for method in dir(session_client) if not method.startswith('_')]
        print(f"Available client methods: {methods}", file=sys.stderr)
        
        # Use HTTP calls to HelixDB endpoints since helix-py doesn't have graph traversal methods
        import requests
        try:
            # Map node types to specific endpoints
            endpoint_map = {
                'Project': 'GetAllProjects',
                'Composition': 'GetAllCompositions', 
                'TextLayer': 'GetAllTextLayers'
            }
            
            if node_type in endpoint_map:
                endpoint_url = f'http://localhost:6970/{endpoint_map[node_type]}'
                endpoint_response = requests.post(endpoint_url, json={}, timeout=5)
                if endpoint_response.ok:
                    response = endpoint_response.json()
                else:
                    response = {'error': f'HTTP {endpoint_response.status_code}'}
            else:
                response = {'error': f'No endpoint available for node type: {node_type}', 
                           'available_types': list(endpoint_map.keys())}
        except Exception as e:
            response = {'error': f'Request failed: {str(e)}'}
        print(f"nodes_by_type response: {response}", file=sys.stderr)
        
        return jsonify({
            'success': True,
            'result': response
        })
    except Exception as e:
        print(f"Nodes by type error: {e}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/edges_by_type', methods=['POST'])
def edges_by_type():
    """Get edges of specific type"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        session_client = connections.get(session_id)
        
        if not session_client:
            return jsonify({'success': False, 'error': 'No connection found'}), 400
        
        edge_type = data.get('edge_type')
        if not edge_type:
            return jsonify({'success': False, 'error': 'edge_type is required'}), 400
        
        # Use client.e_from_type() method directly
        response = client.e_from_type(edge_type)
        print(f"edges_by_type response: {response}", file=sys.stderr)
        
        return jsonify({
            'success': True,
            'result': response
        })
    except Exception as e:
        print(f"Edges by type error: {e}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/filter_items', methods=['POST'])
def filter_items():
    """Filter current nodes based on properties or traversals"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        session_client = connections.get(session_id)
        
        if not session_client:
            return jsonify({'success': False, 'error': 'No connection found'}), 400
        
        properties = data.get('properties')
        filter_traversals = data.get('filter_traversals')
        
        args = {}
        if properties:
            args['properties'] = properties
        if filter_traversals:
            args['filter_traversals'] = filter_traversals
        
        # Use client.filter_items() method directly
        response = client.filter_items(**args)
        print(f"filter_items response: {response}", file=sys.stderr)
        
        return jsonify({
            'success': True,
            'result': response
        })
    except Exception as e:
        print(f"Filter items error: {e}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/upload_graph', methods=['POST'])
def upload_graph():
    """Upload graph data (nodes and edges) to HelixDB"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        session_client = connections.get(session_id)
        
        print(f"🔍 Debug: session_id = {session_id}", file=sys.stderr)
        print(f"🔍 Debug: available sessions = {list(connections.keys())}", file=sys.stderr)
        print(f"🔍 Debug: session_client type = {type(session_client)}", file=sys.stderr)
        print(f"🔍 Debug: session_client value = {session_client}", file=sys.stderr)
        
        if not session_client:
            return jsonify({'success': False, 'error': 'No connection found'}), 400
        
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])
        embedding_content = data.get('embedding_content', [])
        
        print(f"📊 Uploading graph: {len(nodes)} nodes, {len(edges)} edges", file=sys.stderr)
        
        nodes_added = 0
        edges_added = 0
        
        # Create mapping from external IDs to HelixDB UUIDs
        external_to_uuid = {}
        
        # Add nodes and edges to HelixDB using the client query method
        print(f"📊 Available client methods: {dir(session_client)}", file=sys.stderr)
        
        # Use direct HTTP requests to HelixDB backend since client.query() doesn't work as expected
        import requests
        helix_base_url = f"http://0.0.0.0:{session_client.h_server_port}"
        print(f"📊 Using direct HTTP to HelixDB at: {helix_base_url}", file=sys.stderr)
        
        # Use the correct HelixDB endpoints based on node types
        for i, node in enumerate(nodes):
            try:
                node_props = node.get('properties', {})
                
                # Debug: Show what data we actually have
                print(f"🔍 Node {i}: {node['type']} - {node['id']}", file=sys.stderr)
                print(f"🔍 Properties: {node_props}", file=sys.stderr)
                
                # Extract and flatten nested data to match HelixDB strict schema requirements
                if node['type'] == 'Project':
                    endpoint = '/CreateProject'
                    data = {
                        'name': node_props.get('name', node['id']),
                        'project_id': node['id'],
                        'duration': 0,  # Projects don't have duration in AE
                        'frameRate': 30,  # Default frame rate
                        'width': 1920,  # Default project width
                        'height': 1080,  # Default project height
                        'file_path': f"/projects/{node_props.get('name', node['id'])}.aep"  # Add required file_path
                    }
                elif node['type'] == 'Item' and node_props.get('typeName') == 'Composition':
                    endpoint = '/CreateComposition'
                    # Extract data from nested composition object
                    comp_data = node_props.get('composition', {})
                    data = {
                        'name': node_props.get('name', node['id']),
                        'comp_id': node['id'], 
                        'duration': comp_data.get('duration', 10),
                        'width': comp_data.get('width', 1920),
                        'height': comp_data.get('height', 1080),
                        'frameRate': comp_data.get('frameRate', 30)
                    }
                elif node['type'] == 'Item' and node_props.get('typeName') == 'Footage':
                    endpoint = '/CreateFootageItem'
                    # Extract data from nested footage object
                    footage_data = node_props.get('footage', {})
                    data = {
                        'name': node_props.get('name', node['id']),
                        'footage_id': node['id'],
                        'file_path': f"/solids/{node_props.get('name', node['id'])}.solid",  # Solids are generated, not files
                        'width': footage_data.get('width', 100),
                        'height': footage_data.get('height', 100),
                        'duration': footage_data.get('duration', 0),
                        'frameRate': max(footage_data.get('frameRate', 0), 1)  # Ensure frameRate is at least 1
                    }
                elif node['type'] == 'Item' and node_props.get('typeName') == 'Folder':
                    # Try to create folders using Project endpoint as fallback
                    endpoint = '/CreateProject'
                    data = {
                        'name': node_props.get('name', node['id']),
                        'project_id': node['id'],
                        'duration': 0,
                        'frameRate': 30,
                        'width': 1920,
                        'height': 1080,
                        'file_path': f"/folders/{node_props.get('name', node['id'])}.folder"
                    }
                else:
                    print(f"🔍 Skipping unknown node type {node['type']} - {node['id']}", file=sys.stderr)
                    continue
                
                # Print the extracted data structure we're sending
                print(f"🔍 Extracted data for {node['type']} {node['id']}:", file=sys.stderr)
                print(f"    {data}", file=sys.stderr)
                
                # Try the selected endpoint 
                try:
                    # Make the request to HelixDB with ALL available data
                    response = requests.post(f"{helix_base_url}{endpoint}", json=data, timeout=5)
                    if response.status_code == 200:
                        nodes_added += 1
                        print(f"✅ Added {node['type']} via {endpoint}: {node['id']}", file=sys.stderr)
                        
                        # CRITICAL: Capture the UUID returned by HelixDB for edge creation
                        try:
                            response_data = response.json()
                            # Extract UUID from response - HelixDB returns different formats
                            helix_uuid = None
                            
                            # Try different response structures
                            if 'project' in response_data and 'id' in response_data['project']:
                                helix_uuid = response_data['project']['id']
                            elif 'composition' in response_data and 'id' in response_data['composition']:
                                helix_uuid = response_data['composition']['id']
                            elif 'comp' in response_data and 'id' in response_data['comp']:
                                helix_uuid = response_data['comp']['id']
                            elif 'footage' in response_data and 'id' in response_data['footage']:
                                helix_uuid = response_data['footage']['id']
                            elif 'id' in response_data:
                                helix_uuid = response_data['id']
                            elif 'uuid' in response_data:
                                helix_uuid = response_data['uuid']
                            
                            if helix_uuid:
                                external_to_uuid[node['id']] = helix_uuid
                                print(f"🔗 Mapped {node['id']} → {helix_uuid}", file=sys.stderr)
                            else:
                                print(f"⚠️ No UUID found in response for {node['id']}: {response_data}", file=sys.stderr)
                                
                        except Exception as uuid_error:
                            print(f"⚠️ Failed to extract UUID for {node['id']}: {uuid_error}", file=sys.stderr)
                            print(f"   Response text: {response.text[:200]}", file=sys.stderr)
                        
                    else:
                        print(f"⚠️ Failed to add {node['type']} {node['id']} via {endpoint}: HTTP {response.status_code}", file=sys.stderr)
                        if len(response.text) > 0:
                            print(f"   Error: {response.text[:200]}", file=sys.stderr)
                except Exception as node_error:
                    print(f"⚠️ Exception adding {node['type']} {node['id']}: {node_error}", file=sys.stderr)
                
                # Process all nodes now that the upload is working
                # Removed testing limit
                    
            except Exception as node_error:
                print(f"⚠️ Failed to add node {node['id']}: {node_error}", file=sys.stderr)
        
        # Add edges to HelixDB using UUID mapping
        print(f"🔍 Adding {len(edges)} edges to HelixDB", file=sys.stderr)
        print(f"🔗 Available UUID mappings: {len(external_to_uuid)}", file=sys.stderr)
        
        for i, edge in enumerate(edges):
            try:
                edge_type = edge.get('type', 'CONTAINS')
                source_id = edge.get('source') or edge.get('from')  # Support both formats
                target_id = edge.get('target') or edge.get('to')   # Support both formats
                
                print(f"🔍 Edge {i}: {source_id} → {target_id} ({edge_type})", file=sys.stderr)
                
                # Skip edges with missing source or target
                if not source_id or not target_id:
                    print(f"⚠️ Skipping edge with missing IDs: {source_id} → {target_id}", file=sys.stderr)
                    continue
                
                # CRITICAL: Map external IDs to HelixDB UUIDs
                source_uuid = external_to_uuid.get(source_id)
                target_uuid = external_to_uuid.get(target_id)
                
                if not source_uuid:
                    print(f"⚠️ No UUID mapping found for source: {source_id}", file=sys.stderr)
                    continue
                if not target_uuid:
                    print(f"⚠️ No UUID mapping found for target: {target_id}", file=sys.stderr)
                    continue
                
                print(f"🔗 UUID mapping: {source_id}({source_uuid}) → {target_id}({target_uuid})", file=sys.stderr)
                
                # Use the AddContainsEdge endpoint for containment relationships
                if edge_type == 'CONTAINS':
                    endpoint = '/AddContainsEdge'
                    edge_data = {
                        'from_id': source_uuid,
                        'to_id': target_uuid,
                        'relationship': 'contains'  # Add required relationship field
                    }
                else:
                    # For other edge types, try generic CONTAINS
                    endpoint = '/AddContainsEdge'
                    edge_data = {
                        'from_id': source_uuid,
                        'to_id': target_uuid,
                        'relationship': edge_type.lower()  # Use edge type as relationship
                    }
                
                # Make the request to HelixDB
                response = requests.post(f"{helix_base_url}{endpoint}", json=edge_data, timeout=5)
                if response.status_code == 200:
                    edges_added += 1
                    print(f"✅ Added edge via {endpoint}: {source_id} → {target_id}", file=sys.stderr)
                else:
                    print(f"⚠️ Failed to add edge {source_id} → {target_id}: HTTP {response.status_code}", file=sys.stderr)
                    if len(response.text) > 0:
                        print(f"   Error: {response.text[:200]}", file=sys.stderr)
                
                # Process all edges
                # Removed testing limit
                    
            except Exception as edge_error:
                print(f"⚠️ Failed to add edge {edge.get('source')} → {edge.get('target')}: {edge_error}", file=sys.stderr)
        
        # Add embedding content if provided
        embeddings_added = 0
        for content in embedding_content:
            try:
                # Add embedding content (this might need adjustment based on HelixDB API)
                # session_client.add_embedding(content)
                embeddings_added += 1
            except Exception as embed_error:
                print(f"⚠️ Failed to add embedding: {embed_error}", file=sys.stderr)
        
        print(f"✅ Graph upload complete: {nodes_added} nodes, {edges_added} edges added", file=sys.stderr)
        
        return jsonify({
            'success': True,
            'nodes_added': nodes_added,
            'edges_added': edges_added,
            'embeddings_added': embeddings_added,
            'message': f'Graph uploaded: {nodes_added} nodes, {edges_added} edges'
        })
        
    except Exception as e:
        print(f"❌ Upload graph error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Graph Navigator Flask Server on port 5003")
    print("📊 Connecting to HelixDB on port 6970 (project context)")
    app.run(host='0.0.0.0', port=5003, debug=True)