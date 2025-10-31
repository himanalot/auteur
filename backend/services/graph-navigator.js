const fetch = require('node-fetch');

class GraphNavigatorService {
  constructor() {
    this.baseUrl = process.env.GRAPH_NAVIGATOR_URL || 'http://127.0.0.1:5003';
    this.sessionId = 'ai_agent_session';
  }

  /**
   * Initialize connection to HelixDB
   */
  async init() {
    try {
      console.log(`🔗 Attempting to connect to Graph Navigator at ${this.baseUrl}/init`);
      const response = await fetch(`${this.baseUrl}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sessionId })
      });
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Graph Navigator init result:`, result);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.connection_id;
    } catch (error) {
      console.error('❌ Failed to initialize HelixDB connection:', error);
      console.error('🔍 Full error details:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Get next results from current query
   */
  async next() {
    try {
      const response = await fetch(`${this.baseUrl}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sessionId })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.result;
    } catch (error) {
      console.error('Graph next error:', error);
      throw error;
    }
  }

  /**
   * Step outward through edges of given label and type
   */
  async outStep(edgeLabel, edgeType = null) {
    try {
      const response = await fetch(`${this.baseUrl}/out_step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          edge_label: edgeLabel,
          edge_type: edgeType
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.result;
    } catch (error) {
      console.error('Graph out step error:', error);
      throw error;
    }
  }

  /**
   * Step outward through edges of given label (any type)
   */
  async outEStep(edgeLabel) {
    // Use outStep with no edge_type for same functionality
    return this.outStep(edgeLabel, null);
  }

  /**
   * Step inward through edges of given label and type
   */
  async inStep(edgeLabel, edgeType = null) {
    try {
      const response = await fetch(`${this.baseUrl}/in_step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          edge_label: edgeLabel,
          edge_type: edgeType
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.result;
    } catch (error) {
      console.error('Graph in step error:', error);
      throw error;
    }
  }

  /**
   * Step inward through edges of given label (any type)
   */
  async inEStep(edgeLabel) {
    // Use inStep with no edge_type for same functionality
    return this.inStep(edgeLabel, null);
  }

  /**
   * Get nodes of specific type
   */
  async nFromType(nodeType) {
    try {
      const response = await fetch(`${this.baseUrl}/nodes_by_type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          node_type: nodeType
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.result;
    } catch (error) {
      console.error('Graph nodes by type error:', error);
      throw error;
    }
  }

  /**
   * Get edges of specific type
   */
  async eFromType(edgeType) {
    try {
      const response = await fetch(`${this.baseUrl}/edges_by_type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          edge_type: edgeType
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.result;
    } catch (error) {
      console.error('Graph edges by type error:', error);
      throw error;
    }
  }

  /**
   * Filter current nodes based on properties or traversals
   */
  async filterItems(properties = null, filterTraversals = null) {
    try {
      const response = await fetch(`${this.baseUrl}/filter_items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          properties: properties,
          filter_traversals: filterTraversals
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.result;
    } catch (error) {
      console.error('Graph filter items error:', error);
      throw error;
    }
  }

  /**
   * Get schema for current connection
   */
  async getSchema() {
    try {
      const response = await fetch(`${this.baseUrl}/schema?session_id=${this.sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.schema;
    } catch (error) {
      console.error('Graph get schema error:', error);
      throw error;
    }
  }

  /**
   * Get tool definitions for Claude
   */
  getGraphTools() {
    return [
      {
        name: 'graph_init',
        description: 'Initialize connection to the After Effects project graph database. Start here before navigating the graph.',
        input_schema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'graph_out_step',
        description: 'Navigate outward from current nodes through edges with specified label and optional type. Use to traverse containment relationships like CONTAINS, or specific relationships like USES_SOURCE.',
        input_schema: {
          type: 'object',
          properties: {
            edge_label: {
              type: 'string',
              description: 'The edge label to traverse (e.g., "CONTAINS", "USES_SOURCE", "HAS_KEYFRAME")'
            },
            edge_type: {
              type: 'string',
              description: 'Optional specific edge type to filter by'
            }
          },
          required: ['edge_label']
        }
      },
      {
        name: 'graph_in_step',
        description: 'Navigate inward to current nodes through edges with specified label and optional type. Use to find parent containers or dependencies.',
        input_schema: {
          type: 'object',
          properties: {
            edge_label: {
              type: 'string',
              description: 'The edge label to traverse backwards (e.g., "CONTAINS", "USES_SOURCE")'
            },
            edge_type: {
              type: 'string',
              description: 'Optional specific edge type to filter by'
            }
          },
          required: ['edge_label']
        }
      },
      {
        name: 'graph_nodes_by_type',
        description: 'Get all nodes of a specific type from the graph. Use to find all projects, compositions, layers, effects, etc.',
        input_schema: {
          type: 'object',
          properties: {
            node_type: {
              type: 'string',
              description: 'The node type to find (e.g., "Project", "Composition", "TextLayer", "Effect", "Property")'
            }
          },
          required: ['node_type']
        }
      },
      {
        name: 'graph_filter_items',
        description: 'Filter current nodes based on properties or additional traversal conditions. Use to narrow down results based on node properties.',
        input_schema: {
          type: 'object',
          properties: {
            properties: {
              type: 'array',
              description: 'Array of [property_name, property_value] tuples to filter by',
              items: {
                type: 'array',
                minItems: 2,
                maxItems: 2
              }
            },
            filter_traversals: {
              type: 'array',
              description: 'Array of traversal conditions for complex filtering'
            }
          }
        }
      },
      {
        name: 'graph_get_schema',
        description: 'Get the complete schema of the graph database showing all available node types, edge types, and their properties.',
        input_schema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'graph_next',
        description: 'Get next batch of results from the current query. Use when results are paginated.',
        input_schema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];
  }
}

module.exports = GraphNavigatorService;