// After Effects Project Context Graph Schema
// This schema defines the node and edge types for autonomous agents
// to navigate After Effects project structures intelligently

// === NODE TYPES ===

N::Project {
    name: String,
    duration: F64,
    frameRate: F64,
    width: I32,
    height: I32,
    created_at: String,
    file_path: String
}

N::Composition {
    name: String,
    duration: F64,
    frameRate: F64,
    width: I32,
    height: I32,
    startTime: F64,
    workAreaStart: F64,
    workAreaDuration: F64
}

N::TextLayer {
    name: String,
    index: I32,
    enabled: Boolean,
    inPoint: F64,
    outPoint: F64,
    startTime: F64,
    text: String,
    fontSize: F64,
    fontFamily: String
}

N::AVLayer {
    name: String,
    index: I32,
    enabled: Boolean,
    inPoint: F64,
    outPoint: F64,
    startTime: F64,
    source_name: String
}

N::ShapeLayer {
    name: String,
    index: I32,
    enabled: Boolean,
    inPoint: F64,
    outPoint: F64,
    startTime: F64
}

N::FootageItem {
    name: String,
    file_path: String,
    duration: F64,
    width: I32,
    height: I32,
    frameRate: F64
}

N::Effect {
    name: String,
    match_name: String,
    enabled: Boolean,
    index: I32
}

N::PropertyGroup {
    name: String,
    match_name: String,
    num_properties: I32
}

N::Property {
    name: String,
    match_name: String,
    property_value_type: String,
    current_value: String,
    expression_enabled: Boolean,
    num_keys: I32
}

N::Expression {
    expression_text: String,
    language: String,
    target_property: String
}

N::Keyframe {
    time: F64,
    value: String,
    property_path: String
}

N::RenderQueueItem {
    comp_name: String,
    status: String,
    log_type: String
}

N::Other {
    name: String,
    type_name: String,
    description: String
}

// === EDGE TYPES ===

E::CONTAINS_COMPOSITION {
    From: Project,
    To: Composition,
    Properties: {
        created_at: String
    }
}

E::CONTAINS {
    From: Composition,
    To: TextLayer,
    Properties: {
        relationship: String,
        index: I32,
        item_type: String
    }
}

E::CONTAINS_LAYER {
    From: TextLayer,
    To: PropertyGroup,
    Properties: {
        relationship: String,
        index: I32
    }
}

E::CONTAINS_PROPERTY {
    From: PropertyGroup,
    To: Property,
    Properties: {
        relationship: String,
        index: I32
    }
}

E::CONTAINS_EFFECT {
    From: TextLayer,
    To: Effect,
    Properties: {
        relationship: String,
        index: I32
    }
}

E::CONTAINS_OTHER {
    From: Other,
    To: Other,
    Properties: {
        relationship: String,
        index: I32,
        item_type: String
    }
}

E::HAS_LAYER {
    From: Composition,
    To: TextLayer,
    Properties: {
        layer_index: I32
    }
}

E::HAS_AV_LAYER {
    From: Composition,
    To: AVLayer,
    Properties: {
        layer_index: I32
    }
}

E::HAS_SHAPE_LAYER {
    From: Composition,
    To: ShapeLayer,
    Properties: {
        layer_index: I32
    }
}

E::USES_FOOTAGE {
    From: AVLayer,
    To: FootageItem,
    Properties: {
        usage_type: String
    }
}

E::HAS_EFFECT {
    From: TextLayer,
    To: Effect,
    Properties: {
        effect_index: I32
    }
}

E::HAS_AV_EFFECT {
    From: AVLayer,
    To: Effect,
    Properties: {
        effect_index: I32
    }
}

E::DEPENDS_ON {
    From: Composition,
    To: Composition,
    Properties: {
        dependency_type: String
    }
}

E::PARENTS_TO {
    From: TextLayer,
    To: TextLayer,
    Properties: {
        relationship: String
    }
}

E::USES_SOURCE {
    From: AVLayer,
    To: FootageItem,
    Properties: {
        relationship: String
    }
}

E::DRIVES_WITH_EXPRESSION {
    From: Expression,
    To: Property,
    Properties: {
        relationship: String
    }
}

E::HAS_KEYFRAME {
    From: Property,
    To: Keyframe,
    Properties: {
        keyframe_index: I32,
        relationship: String
    }
}

E::RENDERS {
    From: RenderQueueItem,
    To: Composition,
    Properties: {
        relationship: String
    }
}
