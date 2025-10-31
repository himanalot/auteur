// HelixDB Query Definitions for After Effects Project Graph

// Find all project nodes
QUERY find_projects() =>
  project <- N {type: "Project"}
RETURN project

// Find all composition nodes  
QUERY find_compositions() =>
  comp <- N {type: "Composition"}
RETURN comp

// Find all layers in a composition
QUERY find_layers_in_comp(comp_id: String) =>
  comp <- N {id: comp_id}
  comp -> layer VIA CONTAINS
RETURN layer

// Walk project hierarchy
QUERY walk_project_hierarchy() =>
  project <- N {type: "Project"}
  project -> item VIA CONTAINS
  item -> layer VIA CONTAINS
RETURN project, item, layer

// Find nodes by name
QUERY find_by_name(node_name: String) =>
  node <- N {name: node_name}
RETURN node

// Find all relationships of type CONTAINS
QUERY find_contains_edges() =>
  source -> target VIA CONTAINS
RETURN source, target

// Find all footage items
QUERY find_footage() =>
  footage <- N {type: "FootageItem"}
RETURN footage

// Find layers that use a specific source
QUERY find_layers_using_source(source_id: String) =>
  layer <- N 
  layer -> source VIA USES
  source <- N {id: source_id}
RETURN layer

// Get project statistics
QUERY project_stats() =>
  project <- N {type: "Project"}
  comp <- N {type: "Composition"}  
  footage <- N {type: "FootageItem"}
RETURN project, comp, footage