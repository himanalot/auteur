// After Effects Project Context Queries
// These queries enable autonomous agents to navigate AE project graphs intelligently

// === PROJECT OPERATIONS ===

QUERY CreateProject(name: String, duration: F64, frameRate: F64, width: I32, height: I32, file_path: String) =>
    project <- AddN<Project>({
        name: name, 
        duration: duration, 
        frameRate: frameRate, 
        width: width, 
        height: height, 
        created_at: "now", 
        file_path: file_path
    })
    RETURN project

QUERY GetAllProjects() =>
    projects <- N<Project>
    RETURN projects

QUERY GetProjectByName(project_name: String) =>
    project <- N<Project>::WHERE(_::{name}::EQ(project_name))
    RETURN project

// === COMPOSITION OPERATIONS ===

QUERY CreateComposition(name: String, duration: F64, frameRate: F64, width: I32, height: I32) =>
    comp <- AddN<Composition>({
        name: name,
        duration: duration,
        frameRate: frameRate,
        width: width,
        height: height,
        startTime: 0.0,
        workAreaStart: 0.0,
        workAreaDuration: duration
    })
    RETURN comp

QUERY AddCompositionToProject(project_id: ID, comp_id: ID) =>
    project <- N<Project>(project_id)
    comp <- N<Composition>(comp_id)
    AddE<CONTAINS_COMPOSITION>::From(project)::To(comp)
    RETURN "success"

QUERY GetProjectCompositions(project_id: ID) =>
    compositions <- N<Project>(project_id)::Out<CONTAINS_COMPOSITION>
    RETURN compositions

// === LAYER OPERATIONS ===

QUERY CreateTextLayer(name: String, index: I32, text: String, fontSize: F64) =>
    layer <- AddN<TextLayer>({
        name: name,
        index: index,
        enabled: true,
        inPoint: 0.0,
        outPoint: 10.0,
        startTime: 0.0,
        text: text,
        fontSize: fontSize,
        fontFamily: "Arial"
    })
    RETURN layer

QUERY CreateAVLayer(name: String, index: I32, source_name: String) =>
    layer <- AddN<AVLayer>({
        name: name,
        index: index,
        enabled: true,
        inPoint: 0.0,
        outPoint: 10.0,
        startTime: 0.0,
        source_name: source_name
    })
    RETURN layer

QUERY AddLayerToComposition(comp_id: ID, layer_id: ID, layer_index: I32) =>
    comp <- N<Composition>(comp_id)
    layer <- N<TextLayer>(layer_id)
    AddE<HAS_LAYER>({layer_index: layer_index})::From(comp)::To(layer)
    RETURN "success"

QUERY GetCompositionLayers(comp_id: ID) =>
    layers <- N<Composition>(comp_id)::Out<HAS_LAYER>
    RETURN layers

QUERY GetCompositionTextLayers(comp_id: ID) =>
    text_layers <- N<Composition>(comp_id)::Out<HAS_LAYER>
    RETURN text_layers

// === FOOTAGE OPERATIONS ===

QUERY CreateFootageItem(name: String, file_path: String, duration: F64, width: I32, height: I32, frameRate: F64) =>
    footage <- AddN<FootageItem>({
        name: name,
        file_path: file_path,
        duration: duration,
        width: width,
        height: height,
        frameRate: frameRate
    })
    RETURN footage

QUERY LinkLayerToFootage(layer_id: ID, footage_id: ID) =>
    layer <- N<AVLayer>(layer_id)
    footage <- N<FootageItem>(footage_id)
    AddE<USES_FOOTAGE>({usage_type: "source"})::From(layer)::To(footage)
    RETURN "success"

// === GRAPH TRAVERSAL FOR AUTONOMOUS AGENTS ===

QUERY WalkProjectHierarchy(project_id: ID) =>
    project <- N<Project>(project_id)
    compositions <- project::Out<CONTAINS_COMPOSITION>
    layers <- compositions::Out<HAS_LAYER>
    RETURN layers

QUERY FindTextLayersByContent(search_text: String) =>
    text_layers <- N<TextLayer>::WHERE(_::{text}::EQ(search_text))
    RETURN text_layers

QUERY GetLayerDependencies(layer_id: ID) =>
    layer <- N<AVLayer>(layer_id)
    footage <- layer::Out<USES_FOOTAGE>
    effects <- layer::Out<HAS_AV_EFFECT>
    RETURN footage

QUERY AnalyzeProjectStructure(project_id: ID) =>
    project <- N<Project>(project_id)
    compositions <- project::Out<CONTAINS_COMPOSITION>
    all_layers <- compositions::Out<HAS_LAYER>
    text_layers <- compositions::Out<HAS_LAYER>
    av_layers <- compositions::Out<HAS_AV_LAYER>
    RETURN all_layers

// === MISSING NODE CREATION QUERIES ===

QUERY CreatePropertyGroup(name: String, match_name: String, num_properties: I32) =>
    prop_group <- AddN<PropertyGroup>({
        name: name,
        match_name: match_name,
        num_properties: num_properties
    })
    RETURN prop_group

QUERY CreateProperty(name: String, match_name: String, property_value_type: String, current_value: String) =>
    prop <- AddN<Property>({
        name: name,
        match_name: match_name,
        property_value_type: property_value_type,
        current_value: current_value,
        expression_enabled: false,
        num_keys: 0
    })
    RETURN prop

QUERY CreateEffect(name: String, match_name: String, enabled: Boolean, index: I32) =>
    effect <- AddN<Effect>({
        name: name,
        match_name: match_name,
        enabled: enabled,
        index: index
    })
    RETURN effect

QUERY CreateExpression(expression_text: String, language: String, target_property: String) =>
    expr <- AddN<Expression>({
        expression_text: expression_text,
        language: language,
        target_property: target_property
    })
    RETURN expr

QUERY CreateKeyframe(time: F64, value: String, property_path: String) =>
    keyframe <- AddN<Keyframe>({
        time: time,
        value: value,
        property_path: property_path
    })
    RETURN keyframe

QUERY CreateRenderQueueItem(comp_name: String, status: String, log_type: String) =>
    rq_item <- AddN<RenderQueueItem>({
        comp_name: comp_name,
        status: status,
        log_type: log_type
    })
    RETURN rq_item

// === GENERAL EDGE CREATION QUERIES ===

QUERY AddContainsEdge(from_id: ID, to_id: ID, relationship: String) =>
    from_node <- N<Other>(from_id)
    to_node <- N<Other>(to_id)
    AddE<CONTAINS_OTHER>({relationship: relationship, index: 0, item_type: "general"})::From(from_node)::To(to_node)
    RETURN "success"

QUERY AddParentsToEdge(from_id: ID, to_id: ID, relationship: String) =>
    from_node <- N<TextLayer>(from_id)
    to_node <- N<TextLayer>(to_id)
    AddE<PARENTS_TO>({relationship: relationship})::From(from_node)::To(to_node)
    RETURN "success"

QUERY AddUsesSourceEdge(from_id: ID, to_id: ID, relationship: String) =>
    from_node <- N<AVLayer>(from_id)
    to_node <- N<FootageItem>(to_id)
    AddE<USES_SOURCE>({relationship: relationship})::From(from_node)::To(to_node)
    RETURN "success"

QUERY AddDrivesWithExpressionEdge(from_id: ID, to_id: ID, relationship: String) =>
    from_node <- N<Expression>(from_id)
    to_node <- N<Property>(to_id)
    AddE<DRIVES_WITH_EXPRESSION>({relationship: relationship})::From(from_node)::To(to_node)
    RETURN "success"

QUERY AddHasKeyframeEdge(from_id: ID, to_id: ID, keyframe_index: I32, relationship: String) =>
    from_node <- N<Property>(from_id)
    to_node <- N<Keyframe>(to_id)
    AddE<HAS_KEYFRAME>({keyframe_index: keyframe_index, relationship: relationship})::From(from_node)::To(to_node)
    RETURN "success"

QUERY AddRendersEdge(from_id: ID, to_id: ID, relationship: String) =>
    from_node <- N<RenderQueueItem>(from_id)
    to_node <- N<Composition>(to_id)
    AddE<RENDERS>({relationship: relationship})::From(from_node)::To(to_node)
    RETURN "success"

// === GENERAL NAVIGATION QUERIES ===

QUERY GetContainedNodes(node_id: ID) =>
    contained <- N<Composition>(node_id)::Out<CONTAINS>
    RETURN contained

QUERY GetAllCompositions() =>
    compositions <- N<Composition>
    RETURN compositions
    
QUERY GetAllTextLayers() =>
    layers <- N<TextLayer>
    RETURN layers

QUERY WalkContainmentTree(root_id: ID) =>
    root <- N<Composition>(root_id)
    level1 <- root::Out<CONTAINS>
    RETURN level1
