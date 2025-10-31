use std::collections::HashMap;
use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::propertygroup::PropertyGroup;
use super::propertybase::PropertyType;
use super::app::ApiObject;

/// Adobe After Effects Mask Modes
#[derive(Debug, Clone, PartialEq)]
pub enum MaskMode {
    None,
    Add,
    Subtract,
    Intersect,
    Lighten,
    Darken,
    Difference,
}

impl MaskMode {
    pub fn from_string(mode: &str) -> Option<Self> {
        match mode.to_uppercase().as_str() {
            "NONE" => Some(MaskMode::None),
            "ADD" => Some(MaskMode::Add),
            "SUBTRACT" => Some(MaskMode::Subtract),
            "INTERSECT" => Some(MaskMode::Intersect),
            "LIGHTEN" => Some(MaskMode::Lighten),
            "DARKEN" => Some(MaskMode::Darken),
            "DIFFERENCE" => Some(MaskMode::Difference),
            _ => None,
        }
    }

    pub fn to_string(&self) -> String {
        match self {
            MaskMode::None => "NONE".to_string(),
            MaskMode::Add => "ADD".to_string(),
            MaskMode::Subtract => "SUBTRACT".to_string(),
            MaskMode::Intersect => "INTERSECT".to_string(),
            MaskMode::Lighten => "LIGHTEN".to_string(),
            MaskMode::Darken => "DARKEN".to_string(),
            MaskMode::Difference => "DIFFERENCE".to_string(),
        }
    }
}

/// Adobe After Effects Mask Motion Blur
#[derive(Debug, Clone, PartialEq)]
pub enum MaskMotionBlur {
    SameAsLayer,
    On,
    Off,
}

impl MaskMotionBlur {
    pub fn from_string(blur: &str) -> Option<Self> {
        match blur.to_uppercase().as_str() {
            "SAME_AS_LAYER" => Some(MaskMotionBlur::SameAsLayer),
            "ON" => Some(MaskMotionBlur::On),
            "OFF" => Some(MaskMotionBlur::Off),
            _ => None,
        }
    }

    pub fn to_string(&self) -> String {
        match self {
            MaskMotionBlur::SameAsLayer => "SAME_AS_LAYER".to_string(),
            MaskMotionBlur::On => "ON".to_string(),
            MaskMotionBlur::Off => "OFF".to_string(),
        }
    }
}

/// Represents a 2D point with in and out tangent handles for Bezier curves
#[derive(Debug, Clone, PartialEq)]
pub struct MaskVertex {
    pub position: [f64; 2],
    pub in_tangent: [f64; 2],
    pub out_tangent: [f64; 2],
}

impl MaskVertex {
    pub fn new(x: f64, y: f64) -> Self {
        Self {
            position: [x, y],
            in_tangent: [0.0, 0.0],
            out_tangent: [0.0, 0.0],
        }
    }

    pub fn with_tangents(x: f64, y: f64, in_x: f64, in_y: f64, out_x: f64, out_y: f64) -> Self {
        Self {
            position: [x, y],
            in_tangent: [in_x, in_y],
            out_tangent: [out_x, out_y],
        }
    }
}

/// Represents a complete mask shape with vertices and properties
#[derive(Debug, Clone)]
pub struct MaskShape {
    pub vertices: Vec<MaskVertex>,
    pub closed: bool,
    pub feather_falloff_type: i32,
}

impl MaskShape {
    pub fn new() -> Self {
        Self {
            vertices: Vec::new(),
            closed: true,
            feather_falloff_type: 1, // Linear falloff
        }
    }

    pub fn with_vertices(vertices: Vec<MaskVertex>, closed: bool) -> Self {
        Self {
            vertices,
            closed,
            feather_falloff_type: 1,
        }
    }

    /// Add a vertex to the shape
    pub fn add_vertex(&mut self, vertex: MaskVertex) {
        self.vertices.push(vertex);
    }

    /// Insert a vertex at a specific index
    pub fn insert_vertex(&mut self, index: usize, vertex: MaskVertex) {
        if index <= self.vertices.len() {
            self.vertices.insert(index, vertex);
        }
    }

    /// Remove a vertex at a specific index
    pub fn remove_vertex(&mut self, index: usize) -> Option<MaskVertex> {
        if index < self.vertices.len() {
            Some(self.vertices.remove(index))
        } else {
            None
        }
    }

    /// Get the number of vertices
    pub fn vertex_count(&self) -> usize {
        self.vertices.len()
    }

    /// Calculate the bounding box of the shape
    pub fn bounding_box(&self) -> Option<[f64; 4]> {
        if self.vertices.is_empty() {
            return None;
        }

        let mut min_x = self.vertices[0].position[0];
        let mut max_x = self.vertices[0].position[0];
        let mut min_y = self.vertices[0].position[1];
        let mut max_y = self.vertices[0].position[1];

        for vertex in &self.vertices {
            min_x = min_x.min(vertex.position[0]);
            max_x = max_x.max(vertex.position[0]);
            min_y = min_y.min(vertex.position[1]);
            max_y = max_y.max(vertex.position[1]);
        }

        Some([min_x, min_y, max_x, max_y])
    }

    /// Transform the shape by a transformation matrix
    pub fn transform(&mut self, matrix: &[f64; 9]) {
        for vertex in &mut self.vertices {
            let x = vertex.position[0];
            let y = vertex.position[1];
            
            vertex.position[0] = matrix[0] * x + matrix[1] * y + matrix[2];
            vertex.position[1] = matrix[3] * x + matrix[4] * y + matrix[5];

            // Transform tangents (vectors, so no translation)
            let in_x = vertex.in_tangent[0];
            let in_y = vertex.in_tangent[1];
            vertex.in_tangent[0] = matrix[0] * in_x + matrix[1] * in_y;
            vertex.in_tangent[1] = matrix[3] * in_x + matrix[4] * in_y;

            let out_x = vertex.out_tangent[0];
            let out_y = vertex.out_tangent[1];
            vertex.out_tangent[0] = matrix[0] * out_x + matrix[1] * out_y;
            vertex.out_tangent[1] = matrix[3] * out_x + matrix[4] * out_y;
        }
    }
}

/// MaskPath object - represents the path/shape of a mask
/// Inherits from Property and provides shape manipulation
pub struct MaskPath {
    pub api_object: ApiObject,
}

impl MaskPath {
    pub fn new() -> Self {
        let mut mask_path = Self {
            api_object: ApiObject::new(ObjectContext::Property("MaskPath".to_string())),
        };
        
        mask_path.initialize_methods();
        mask_path.initialize_properties();
        mask_path
    }
    
    fn initialize_methods(&mut self) {
        // Path creation and manipulation methods
        self.api_object.methods.insert("createPath".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // vertices
            PropertyValueType::Custom("Array".to_string()),  // inTangents
            PropertyValueType::Custom("Array".to_string()),  // outTangents
        ]));
        
        self.api_object.methods.insert("setPath".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // vertices
            PropertyValueType::Custom("Array".to_string()),  // inTangents
            PropertyValueType::Custom("Array".to_string()),  // outTangents
        ]));

        // Path interpolation and animation
        self.api_object.methods.insert("interpolate".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::Shape,  // otherPath
            PropertyValueType::OneD,   // amount (0.0 to 1.0)
            PropertyValueType::Custom("Boolean".to_string()),  // matchVertexCount
        ]));

        // Vertex manipulation
        self.api_object.methods.insert("addVertex".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::TwoDSpatial,  // position
            PropertyValueType::OneD,         // index
        ]));

        self.api_object.methods.insert("removeVertex".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD,  // index
        ]));

        self.api_object.methods.insert("setVertexPosition".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,         // index
            PropertyValueType::TwoDSpatial,  // position
        ]));

        self.api_object.methods.insert("setVertexTangents".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,         // index
            PropertyValueType::TwoDSpatial,  // inTangent
            PropertyValueType::TwoDSpatial,  // outTangent
        ]));

        // Path analysis
        self.api_object.methods.insert("getVertexCount".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("getBoundingBox".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("getLength".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("getArea".to_string(), MethodValidation::new(0));

        // Path operations
        self.api_object.methods.insert("reverse".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("simplify".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD,  // tolerance
        ]));

        // Standard property methods
        self.api_object.methods.insert("getValue".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("setValue".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Shape
        ]));
        self.api_object.methods.insert("getValueAtTime".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // time
        ]));
        self.api_object.methods.insert("setValueAtTime".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,   // time
            PropertyValueType::Shape   // value
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Path structure properties
        self.api_object.properties.insert("vertices".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("inTangents".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("outTangents".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("closed".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });

        self.api_object.properties.insert("featherFalloffType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(3.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "1".to_string(), // Linear
                "2".to_string(), // Smooth
                "3".to_string(), // Sharp
            ]),
            custom_validator: None,
        });
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

/// Mask object - represents a complete mask with all properties
/// Inherits from PropertyGroup → PropertyBase
pub struct Mask {
    pub base: PropertyGroup,
}

impl Mask {
    pub fn new() -> Self {
        let mut mask = Self {
            base: PropertyGroup::new(ObjectContext::Mask, PropertyType::IndexedGroup),
        };
        
        mask.initialize_mask_methods();
        mask.initialize_mask_properties();
        mask
    }
    
    fn initialize_mask_methods(&mut self) {
        // Mask-specific methods (in addition to PropertyGroup/PropertyBase methods)
        
        // Mask creation and manipulation
        self.base.base.api_object.methods.insert("resetMask".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("setMaskMode".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("MaskMode".to_string()),
        ]));
        
        // Shape creation factory methods
        self.base.base.api_object.methods.insert("createRectangle".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,         // width
            PropertyValueType::OneD,         // height
            PropertyValueType::TwoDSpatial,  // center
        ]));
        
        self.base.base.api_object.methods.insert("createEllipse".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,         // width
            PropertyValueType::OneD,         // height
            PropertyValueType::TwoDSpatial,  // center
        ]));

        self.base.base.api_object.methods.insert("createPolygon".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,         // radius
            PropertyValueType::OneD,         // sides
            PropertyValueType::TwoDSpatial,  // center
        ]));

        self.base.base.api_object.methods.insert("createStar".to_string(), MethodValidation::new(5).with_param_types(vec![
            PropertyValueType::OneD,         // outerRadius
            PropertyValueType::OneD,         // innerRadius
            PropertyValueType::OneD,         // points
            PropertyValueType::OneD,         // rotation
            PropertyValueType::TwoDSpatial,  // center
        ]));

        self.base.base.api_object.methods.insert("createCustomPath".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // vertices array
        ]));

        // Mask property manipulation
        self.base.base.api_object.methods.insert("setOpacity".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD,  // opacity (0-100)
        ]));

        self.base.base.api_object.methods.insert("setFeather".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // featherX
            PropertyValueType::OneD,  // featherY
        ]));

        self.base.base.api_object.methods.insert("setExpansion".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD,  // expansion amount
        ]));

        self.base.base.api_object.methods.insert("invertMask".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("lockMask".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string()),
        ]));

        // Animation and tracking
        self.base.base.api_object.methods.insert("trackMask".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // startTime
            PropertyValueType::OneD,  // endTime
        ]));

        self.base.base.api_object.methods.insert("interpolateToMask".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Mask".to_string()),  // targetMask
            PropertyValueType::OneD,                         // interpolationAmount
        ]));

        // Transformation methods
        self.base.base.api_object.methods.insert("translate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::TwoDSpatial,  // offset
        ]));

        self.base.base.api_object.methods.insert("scale".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::TwoDSpatial,  // scaleFactors
            PropertyValueType::TwoDSpatial,  // center
        ]));

        self.base.base.api_object.methods.insert("rotate".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,         // angle (degrees)
            PropertyValueType::TwoDSpatial,  // center
        ]));

        self.base.base.api_object.methods.insert("transform".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Matrix".to_string()),  // transformation matrix
        ]));

        // Utility methods
        self.base.base.api_object.methods.insert("applyPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText,  // preset name
        ]));

        self.base.base.api_object.methods.insert("copyFrom".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Mask".to_string()),  // source mask
        ]));

        self.base.base.api_object.methods.insert("exportToPath".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("importFromPath".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Shape,  // path data
        ]));
    }
    
    fn initialize_mask_properties(&mut self) {
        // Core mask properties
        self.base.base.api_object.properties.insert("maskMode".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("MaskMode".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "NONE".to_string(),
                "ADD".to_string(),
                "SUBTRACT".to_string(),
                "INTERSECT".to_string(),
                "LIGHTEN".to_string(),
                "DARKEN".to_string(),
                "DIFFERENCE".to_string(),
            ]),
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("maskPath".to_string(), ValidationRule {
            value_type: PropertyValueType::Shape,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("maskOpacity".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("maskFeather".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoD,
            array_size: Some(2),
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("maskExpansion".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });

        // Advanced mask properties
        self.base.base.api_object.properties.insert("maskVertexFeather".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("inverted".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("locked".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("rotoBezier".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("maskMotionBlur".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("MaskMotionBlur".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "SAME_AS_LAYER".to_string(),
                "ON".to_string(),
                "OFF".to_string(),
            ]),
            custom_validator: None,
        });

        // Color and visual properties
        self.base.base.api_object.properties.insert("color".to_string(), ValidationRule {
            value_type: PropertyValueType::Color,
            array_size: Some(3),
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });

        // Read-only identification properties
        self.base.base.api_object.properties.insert("maskIndex".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });

        self.base.base.api_object.properties.insert("maskName".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });

        // Tracking and automation properties
        self.base.base.api_object.properties.insert("trackMatte".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    /// Access to the underlying PropertyGroup
    pub fn get_base(&self) -> &PropertyGroup {
        &self.base
    }
    
    /// Mutable access to the underlying PropertyGroup  
    pub fn get_base_mut(&mut self) -> &mut PropertyGroup {
        &mut self.base
    }
}

/// MaskCollection object - manages multiple masks on a layer
/// Represents the "Masks" property group in After Effects
pub struct MaskCollection {
    pub base: PropertyGroup,
}

impl MaskCollection {
    pub fn new() -> Self {
        let mut mask_collection = Self {
            base: PropertyGroup::new(ObjectContext::Collection, PropertyType::IndexedGroup),
        };
        
        mask_collection.initialize_collection_methods();
        mask_collection.initialize_collection_properties();
        mask_collection
    }
    
    fn initialize_collection_methods(&mut self) {
        // Mask creation methods
        self.base.base.api_object.methods.insert("addProperty".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // name (always "ADBE Mask Atom")
        ]));

        self.base.base.api_object.methods.insert("addMask".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("addMaskWithShape".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Shape
        ]));

        self.base.base.api_object.methods.insert("addRectangleMask".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,         // width
            PropertyValueType::OneD,         // height
            PropertyValueType::TwoDSpatial,  // center
        ]));

        self.base.base.api_object.methods.insert("addEllipseMask".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,         // width
            PropertyValueType::OneD,         // height
            PropertyValueType::TwoDSpatial,  // center
        ]));

        self.base.base.api_object.methods.insert("addPolygonMask".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,         // radius
            PropertyValueType::OneD,         // sides
            PropertyValueType::TwoDSpatial,  // center
        ]));

        self.base.base.api_object.methods.insert("addStarMask".to_string(), MethodValidation::new(5).with_param_types(vec![
            PropertyValueType::OneD,         // outerRadius
            PropertyValueType::OneD,         // innerRadius
            PropertyValueType::OneD,         // points
            PropertyValueType::OneD,         // rotation
            PropertyValueType::TwoDSpatial,  // center
        ]));

        // Mask access and manipulation
        self.base.base.api_object.methods.insert("mask".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // mask index
        ]));

        self.base.base.api_object.methods.insert("maskByName".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // mask name
        ]));

        // Bulk operations
        self.base.base.api_object.methods.insert("removeAll".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("duplicateAll".to_string(), MethodValidation::new(0));

        self.base.base.api_object.methods.insert("invertAll".to_string(), MethodValidation::new(0));

        self.base.base.api_object.methods.insert("setAllModes".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("MaskMode".to_string()),
        ]));

        // Collection management
        self.base.base.api_object.methods.insert("reorderMasks".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // new order indices
        ]));

        self.base.base.api_object.methods.insert("combineMasks".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // mask indices
            PropertyValueType::Custom("MaskMode".to_string()), // combine mode
        ]));

        // Import/Export
        self.base.base.api_object.methods.insert("exportMasks".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("importMasks".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // mask data array
        ]));
    }
    
    fn initialize_collection_properties(&mut self) {
        // Collection information properties
        self.base.base.api_object.properties.insert("numProperties".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });

        self.base.base.api_object.properties.insert("numMasks".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });

        // Collection state properties
        self.base.base.api_object.properties.insert("allMasksInverted".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });

        self.base.base.api_object.properties.insert("allMasksLocked".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    /// Access to the underlying PropertyGroup
    pub fn get_base(&self) -> &PropertyGroup {
        &self.base
    }
    
    /// Mutable access to the underlying PropertyGroup  
    pub fn get_base_mut(&mut self) -> &mut PropertyGroup {
        &mut self.base
    }
}

/// Mask factory - provides convenient methods for creating common mask shapes
pub struct MaskFactory;

impl MaskFactory {
    /// Create a rectangular mask shape
    pub fn create_rectangle(width: f64, height: f64, center: [f64; 2]) -> MaskShape {
        let half_width = width / 2.0;
        let half_height = height / 2.0;
        
        let vertices = vec![
            MaskVertex::new(center[0] - half_width, center[1] - half_height), // Top-left
            MaskVertex::new(center[0] + half_width, center[1] - half_height), // Top-right
            MaskVertex::new(center[0] + half_width, center[1] + half_height), // Bottom-right
            MaskVertex::new(center[0] - half_width, center[1] + half_height), // Bottom-left
        ];
        
        MaskShape::with_vertices(vertices, true)
    }
    
    /// Create an elliptical mask shape using Bezier approximation
    pub fn create_ellipse(width: f64, height: f64, center: [f64; 2]) -> MaskShape {
        let a = width / 2.0;
        let b = height / 2.0;
        let k = 0.5522847498; // Magic number for Bezier circle approximation
        
        let vertices = vec![
            MaskVertex::with_tangents(
                center[0], center[1] - b,      // Top
                -a * k, 0.0,                   // In tangent
                a * k, 0.0                     // Out tangent
            ),
            MaskVertex::with_tangents(
                center[0] + a, center[1],      // Right
                0.0, -b * k,                   // In tangent
                0.0, b * k                     // Out tangent
            ),
            MaskVertex::with_tangents(
                center[0], center[1] + b,      // Bottom
                a * k, 0.0,                    // In tangent
                -a * k, 0.0                    // Out tangent
            ),
            MaskVertex::with_tangents(
                center[0] - a, center[1],      // Left
                0.0, b * k,                    // In tangent
                0.0, -b * k                    // Out tangent
            ),
        ];
        
        MaskShape::with_vertices(vertices, true)
    }

    /// Create a regular polygon mask shape
    pub fn create_polygon(radius: f64, sides: u32, center: [f64; 2], rotation: f64) -> MaskShape {
        if sides < 3 {
            return MaskShape::new();
        }

        let mut vertices = Vec::new();
        let angle_step = 2.0 * std::f64::consts::PI / sides as f64;
        let rotation_rad = rotation.to_radians();

        for i in 0..sides {
            let angle = (i as f64) * angle_step + rotation_rad;
            let x = center[0] + radius * angle.cos();
            let y = center[1] + radius * angle.sin();
            vertices.push(MaskVertex::new(x, y));
        }

        MaskShape::with_vertices(vertices, true)
    }

    /// Create a star mask shape
    pub fn create_star(outer_radius: f64, inner_radius: f64, points: u32, center: [f64; 2], rotation: f64) -> MaskShape {
        if points < 2 {
            return MaskShape::new();
        }

        let mut vertices = Vec::new();
        let angle_step = std::f64::consts::PI / points as f64;
        let rotation_rad = rotation.to_radians();

        for i in 0..(points * 2) {
            let angle = (i as f64) * angle_step + rotation_rad;
            let radius = if i % 2 == 0 { outer_radius } else { inner_radius };
            let x = center[0] + radius * angle.cos();
            let y = center[1] + radius * angle.sin();
            vertices.push(MaskVertex::new(x, y));
        }

        MaskShape::with_vertices(vertices, true)
    }

    /// Create a heart-shaped mask
    pub fn create_heart(size: f64, center: [f64; 2]) -> MaskShape {
        let scale = size / 100.0;
        let mut vertices = Vec::new();

        // Heart shape using parametric equations
        let steps = 16;
        for i in 0..steps {
            let t = (i as f64) * 2.0 * std::f64::consts::PI / (steps as f64);
            let x = 16.0 * t.sin().powi(3);
            let y = 13.0 * t.cos() - 5.0 * (2.0 * t).cos() - 2.0 * (3.0 * t).cos() - (4.0 * t).cos();
            
            vertices.push(MaskVertex::new(
                center[0] + x * scale,
                center[1] - y * scale // Negative to flip vertically
            ));
        }

        MaskShape::with_vertices(vertices, true)
    }

    /// Create a rounded rectangle mask shape
    pub fn create_rounded_rectangle(width: f64, height: f64, corner_radius: f64, center: [f64; 2]) -> MaskShape {
        let half_width = width / 2.0;
        let half_height = height / 2.0;
        let radius = corner_radius.min(half_width).min(half_height);
        
        // Corner offset for bezier handles (approximation for rounded corners)
        let handle_offset = radius * 0.5522847498;

        let vertices = vec![
            // Top edge
            MaskVertex::with_tangents(
                center[0] - half_width + radius, center[1] - half_height,
                -handle_offset, 0.0,
                handle_offset, 0.0
            ),
            MaskVertex::with_tangents(
                center[0] + half_width - radius, center[1] - half_height,
                -handle_offset, 0.0,
                handle_offset, 0.0
            ),
            // Top-right corner
            MaskVertex::with_tangents(
                center[0] + half_width, center[1] - half_height + radius,
                0.0, -handle_offset,
                0.0, handle_offset
            ),
            // Right edge
            MaskVertex::with_tangents(
                center[0] + half_width, center[1] + half_height - radius,
                0.0, -handle_offset,
                0.0, handle_offset
            ),
            // Bottom-right corner
            MaskVertex::with_tangents(
                center[0] + half_width - radius, center[1] + half_height,
                handle_offset, 0.0,
                -handle_offset, 0.0
            ),
            // Bottom edge
            MaskVertex::with_tangents(
                center[0] - half_width + radius, center[1] + half_height,
                handle_offset, 0.0,
                -handle_offset, 0.0
            ),
            // Bottom-left corner
            MaskVertex::with_tangents(
                center[0] - half_width, center[1] + half_height - radius,
                0.0, handle_offset,
                0.0, -handle_offset
            ),
            // Left edge
            MaskVertex::with_tangents(
                center[0] - half_width, center[1] - half_height + radius,
                0.0, handle_offset,
                0.0, -handle_offset
            ),
        ];

        MaskShape::with_vertices(vertices, true)
    }
}

/// Mask animation utilities for interpolation and tracking
pub struct MaskAnimationUtils;

impl MaskAnimationUtils {
    /// Interpolate between two mask shapes
    pub fn interpolate_shapes(shape1: &MaskShape, shape2: &MaskShape, amount: f64) -> Option<MaskShape> {
        if shape1.vertices.len() != shape2.vertices.len() {
            return None; // Cannot interpolate shapes with different vertex counts
        }

        let amount = amount.clamp(0.0, 1.0);
        let mut interpolated_vertices = Vec::new();

        for (v1, v2) in shape1.vertices.iter().zip(shape2.vertices.iter()) {
            let interpolated_vertex = MaskVertex {
                position: [
                    v1.position[0] + (v2.position[0] - v1.position[0]) * amount,
                    v1.position[1] + (v2.position[1] - v1.position[1]) * amount,
                ],
                in_tangent: [
                    v1.in_tangent[0] + (v2.in_tangent[0] - v1.in_tangent[0]) * amount,
                    v1.in_tangent[1] + (v2.in_tangent[1] - v1.in_tangent[1]) * amount,
                ],
                out_tangent: [
                    v1.out_tangent[0] + (v2.out_tangent[0] - v1.out_tangent[0]) * amount,
                    v1.out_tangent[1] + (v2.out_tangent[1] - v1.out_tangent[1]) * amount,
                ],
            };
            interpolated_vertices.push(interpolated_vertex);
        }

        Some(MaskShape::with_vertices(interpolated_vertices, shape1.closed))
    }

    /// Match vertex count between two shapes by adding or removing vertices
    pub fn match_vertex_count(source: &MaskShape, target_count: usize) -> MaskShape {
        let mut result = source.clone();
        
        while result.vertices.len() < target_count {
            // Add vertices by subdividing edges
            let insert_index = result.vertices.len() / 2;
            if let Some(new_vertex) = Self::subdivide_edge(&result, insert_index) {
                result.insert_vertex(insert_index + 1, new_vertex);
            } else {
                break;
            }
        }

        while result.vertices.len() > target_count && result.vertices.len() > 3 {
            // Remove vertices by finding the least significant ones
            if let Some(remove_index) = Self::find_least_significant_vertex(&result) {
                result.remove_vertex(remove_index);
            } else {
                break;
            }
        }

        result
    }

    /// Subdivide an edge by adding a vertex at the midpoint
    fn subdivide_edge(shape: &MaskShape, index: usize) -> Option<MaskVertex> {
        if shape.vertices.is_empty() {
            return None;
        }

        let next_index = (index + 1) % shape.vertices.len();
        let v1 = &shape.vertices[index];
        let v2 = &shape.vertices[next_index];

        Some(MaskVertex {
            position: [
                (v1.position[0] + v2.position[0]) / 2.0,
                (v1.position[1] + v2.position[1]) / 2.0,
            ],
            in_tangent: [
                (v1.in_tangent[0] + v2.in_tangent[0]) / 2.0,
                (v1.in_tangent[1] + v2.in_tangent[1]) / 2.0,
            ],
            out_tangent: [
                (v1.out_tangent[0] + v2.out_tangent[0]) / 2.0,
                (v1.out_tangent[1] + v2.out_tangent[1]) / 2.0,
            ],
        })
    }

    /// Find the vertex that contributes least to the shape's definition
    fn find_least_significant_vertex(shape: &MaskShape) -> Option<usize> {
        if shape.vertices.len() <= 3 {
            return None;
        }

        let mut min_significance = f64::INFINITY;
        let mut least_significant_index = 0;

        for i in 0..shape.vertices.len() {
            let prev_index = if i == 0 { shape.vertices.len() - 1 } else { i - 1 };
            let next_index = (i + 1) % shape.vertices.len();

            let prev = &shape.vertices[prev_index];
            let curr = &shape.vertices[i];
            let next = &shape.vertices[next_index];

            // Calculate the significance based on the angle deviation
            let angle1 = (curr.position[1] - prev.position[1]).atan2(curr.position[0] - prev.position[0]);
            let angle2 = (next.position[1] - curr.position[1]).atan2(next.position[0] - curr.position[0]);
            let angle_diff = (angle2 - angle1).abs();
            let significance = angle_diff.min(2.0 * std::f64::consts::PI - angle_diff);

            if significance < min_significance {
                min_significance = significance;
                least_significant_index = i;
            }
        }

        Some(least_significant_index)
    }

    /// Apply tracking data to a mask shape
    pub fn apply_tracking_data(shape: &mut MaskShape, tracking_offset: [f64; 2], _scale: f64, _rotation: f64) {
        // Simple translation tracking (more complex tracking would involve scale and rotation)
        for vertex in &mut shape.vertices {
            vertex.position[0] += tracking_offset[0];
            vertex.position[1] += tracking_offset[1];
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mask_mode_conversion() {
        assert_eq!(MaskMode::from_string("ADD"), Some(MaskMode::Add));
        assert_eq!(MaskMode::from_string("SUBTRACT"), Some(MaskMode::Subtract));
        assert_eq!(MaskMode::from_string("INVALID"), None);
        
        assert_eq!(MaskMode::Add.to_string(), "ADD");
        assert_eq!(MaskMode::Intersect.to_string(), "INTERSECT");
    }

    #[test]
    fn test_mask_vertex_creation() {
        let vertex = MaskVertex::new(100.0, 200.0);
        assert_eq!(vertex.position, [100.0, 200.0]);
        assert_eq!(vertex.in_tangent, [0.0, 0.0]);
        assert_eq!(vertex.out_tangent, [0.0, 0.0]);

        let vertex_with_tangents = MaskVertex::with_tangents(100.0, 200.0, 10.0, 20.0, 30.0, 40.0);
        assert_eq!(vertex_with_tangents.position, [100.0, 200.0]);
        assert_eq!(vertex_with_tangents.in_tangent, [10.0, 20.0]);
        assert_eq!(vertex_with_tangents.out_tangent, [30.0, 40.0]);
    }

    #[test]
    fn test_mask_shape_creation() {
        let mut shape = MaskShape::new();
        assert_eq!(shape.vertex_count(), 0);
        assert!(shape.closed);

        shape.add_vertex(MaskVertex::new(0.0, 0.0));
        shape.add_vertex(MaskVertex::new(100.0, 0.0));
        shape.add_vertex(MaskVertex::new(100.0, 100.0));
        
        assert_eq!(shape.vertex_count(), 3);
        
        let bounding_box = shape.bounding_box().unwrap();
        assert_eq!(bounding_box, [0.0, 0.0, 100.0, 100.0]);
    }

    #[test]
    fn test_mask_factory_rectangle() {
        let rect = MaskFactory::create_rectangle(200.0, 100.0, [250.0, 150.0]);
        assert_eq!(rect.vertex_count(), 4);
        assert!(rect.closed);
        
        let bbox = rect.bounding_box().unwrap();
        assert_eq!(bbox, [150.0, 100.0, 350.0, 200.0]);
    }

    #[test]
    fn test_mask_factory_ellipse() {
        let ellipse = MaskFactory::create_ellipse(200.0, 100.0, [250.0, 150.0]);
        assert_eq!(ellipse.vertex_count(), 4);
        assert!(ellipse.closed);
        
        // Check that all tangents are non-zero (curved shape)
        for vertex in &ellipse.vertices {
            assert!(vertex.in_tangent != [0.0, 0.0] || vertex.out_tangent != [0.0, 0.0]);
        }
    }

    #[test]
    fn test_mask_factory_polygon() {
        let triangle = MaskFactory::create_polygon(100.0, 3, [0.0, 0.0], 0.0);
        assert_eq!(triangle.vertex_count(), 3);
        
        let hexagon = MaskFactory::create_polygon(100.0, 6, [0.0, 0.0], 0.0);
        assert_eq!(hexagon.vertex_count(), 6);
    }

    #[test]
    fn test_mask_factory_star() {
        let star = MaskFactory::create_star(100.0, 50.0, 5, [0.0, 0.0], 0.0);
        assert_eq!(star.vertex_count(), 10); // 5 points = 10 vertices (outer + inner)
    }

    #[test]
    fn test_mask_shape_transformation() {
        let mut shape = MaskFactory::create_rectangle(100.0, 100.0, [0.0, 0.0]);
        
        // Identity matrix should not change the shape
        let identity = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
        let original_bbox = shape.bounding_box().unwrap();
        shape.transform(&identity);
        assert_eq!(shape.bounding_box().unwrap(), original_bbox);
        
        // Translation matrix
        let translation = [1.0, 0.0, 50.0, 0.0, 1.0, 25.0, 0.0, 0.0, 1.0];
        shape.transform(&translation);
        let new_bbox = shape.bounding_box().unwrap();
        assert_eq!(new_bbox[0], original_bbox[0] + 50.0);
        assert_eq!(new_bbox[1], original_bbox[1] + 25.0);
    }

    #[test]
    fn test_mask_animation_interpolation() {
        let shape1 = MaskFactory::create_rectangle(100.0, 100.0, [0.0, 0.0]);
        let shape2 = MaskFactory::create_rectangle(200.0, 200.0, [50.0, 50.0]);
        
        let interpolated = MaskAnimationUtils::interpolate_shapes(&shape1, &shape2, 0.5).unwrap();
        
        // At 50% interpolation, should be halfway between the two shapes
        let bbox = interpolated.bounding_box().unwrap();
        assert!((bbox[2] - bbox[0] - 150.0).abs() < 0.01); // Width should be 150
        assert!((bbox[3] - bbox[1] - 150.0).abs() < 0.01); // Height should be 150
    }

    #[test]
    fn test_mask_vertex_count_matching() {
        let triangle = MaskFactory::create_polygon(100.0, 3, [0.0, 0.0], 0.0);
        let matched = MaskAnimationUtils::match_vertex_count(&triangle, 6);
        
        assert_eq!(matched.vertex_count(), 6);
    }

    #[test]
    fn test_mask_objects_creation() {
        let mask = Mask::new();
        assert!(mask.get_base().base.api_object.methods.contains_key("resetMask"));
        assert!(mask.get_base().base.api_object.properties.contains_key("maskMode"));
        
        let mask_path = MaskPath::new();
        assert!(mask_path.get_api_object().methods.contains_key("createPath"));
        assert!(mask_path.get_api_object().properties.contains_key("vertices"));
        
        let mask_collection = MaskCollection::new();
        assert!(mask_collection.get_base().base.api_object.methods.contains_key("addMask"));
        assert!(mask_collection.get_base().base.api_object.properties.contains_key("numMasks"));
    }
}