# HelixDB-Powered After Effects Project Graph System Implementation Plan

Based on the HelixDB HQL documentation and the existing MCP tools, here's the comprehensive implementation plan:

## Implementation Plan for HelixDB-Powered After Effects Project Graph System

### **Phase 1: Data Ingestion Enhancement**
- **Upgrade project_graph_helix_native.py** to use proper HQL syntax instead of raw operations
- Replace current AddProjectNodes/AddProjectEdges with proper `AddN<Type>` and `AddE<Type>` operations
- Use HQL schema definitions for AE project elements:
  - `AddN<Project>`, `AddN<Composition>`, `AddN<Layer>`, `AddN<FootageItem>`
  - `AddE<CONTAINS>`, `AddE<USES>`, `AddE<REFERENCES>`

### **Phase 2: MCP Integration Strategy**
- **Keep existing mcp_server.py** as-is (it's the official HelixDB MCP server)
- **Create AE-specific MCP wrapper functions** that use the existing tools but with AE project semantics
- Build high-level agent tools like:
  - `find_compositions_in_project(connection_id, project_name)`
  - `walk_composition_hierarchy(connection_id, comp_name, depth)`
  - `find_layers_using_footage(connection_id, footage_name)`

### **Phase 3: Agent Integration**
- **Modify ProjectGraphTab.tsx** to use MCP tools instead of REST API
- When agents need project context, they'll:
  1. Call `init()` to get connection_id
  2. Use `n_from_type(connection_id, "Project")` to find projects
  3. Use `out_step(connection_id, "CONTAINS", "Composition")` to walk hierarchy
  4. Use `filter_items()` to find specific elements

### **Phase 4: Smart Graph Walking**
- Create **semantic search functions** that combine:
  - `n_from_type()` for type-based discovery
  - `filter_items()` with property conditions for precise filtering
  - `out_step()/in_step()` for relationship traversal
- Build **context-aware tools** like:
  - "Find all text layers that use Arial font"
  - "Get composition dependencies for rendering"
  - "Find unused assets in project"

### **Key Advantages:**
1. **Leverage existing MCP infrastructure** - no need to rebuild what HelixDB provides
2. **Connection-based state management** - agents maintain traversal context
3. **Type-safe graph operations** - HQL ensures schema compliance
4. **Intelligent discovery** - agents walk graphs instead of processing massive JSON

### **Implementation Order:**
1. Update data ingestion with proper HQL
2. Test MCP server with our project data
3. Build AE-specific wrapper functions
4. Integrate with autonomous agents
5. Add semantic search capabilities

## HelixDB HQL Summary for After Effects Project Graphs

### **Data Creation:**
- **AddN<Type>({properties})** - Create nodes (Project, Composition, Layer, etc.)
- **AddE<Type>({properties})::From(v1)::To(v2)** - Create relationships (CONTAINS, USES, etc.)

### **Data Retrieval:**
- **N<Type>** - Select nodes by type
- **E<Type>** - Select edges by type

### **Graph Traversal:**
- **Out<EdgeType>** - Follow outgoing relationships
- **In<EdgeType>** - Follow incoming relationships
- **OutE<EdgeType>** - Get outgoing edge details
- **InE<EdgeType>** - Get incoming edge details

### **Filtering:**
- **WHERE()** - Filter by conditions (EQ, GT, LT, etc.)
- **AND/OR** - Combine multiple conditions
- **EXISTS()** - Check if traversal has results
- **RANGE(start, end)** - Limit results

### **Property Operations:**
- **::{property}** - Access specific properties
- **::!{property}** - Exclude properties
- **::{new_name: old_name}** - Rename properties
- **::UPDATE({properties})** - Modify existing properties

### **Aggregation:**
- **COUNT** - Count elements in traversal

## Available HelixDB MCP Tools

### Connection Management:
- **`init()`** - Initialize a new connection, returns connection_id
- **`next(connection_id)`** - Get next item in current traversal

### Graph Traversal:
- **`out_step(connection_id, edge_label, edge_type)`** - Step outward along edges
- **`in_step(connection_id, edge_label, edge_type)`** - Step inward along edges  
- **`out_e_step(connection_id, edge_label)`** - Step outward by edge label only
- **`in_e_step(connection_id, edge_label)`** - Step inward by edge label only

### Node/Edge Discovery:
- **`n_from_type(connection_id, node_type)`** - Find nodes by type
- **`e_from_type(connection_id, edge_type)`** - Find edges by type

### Filtering:
- **`filter_items(connection_id, properties, filter_traversals)`** - Filter items by properties and traversals

### Schema:
- **`schema_resource(connection_id)`** - Get schema for connection (MCP resource, not tool)

## Key Implementation Notes

### **Connection-Based Traversal System:**
1. You `init()` to get a connection_id
2. Use traversal tools to walk the graph 
3. Use `next()` to iterate through results
4. All operations maintain state via the connection_id

### **For Autonomous Agents:**
This approach uses HelixDB's strengths while building AE-specific abstractions that autonomous agents can easily use. Agents will walk graphs intelligently instead of processing massive JSON dumps, enabling precise context discovery through graph relationships.