use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::avlayer::AVLayer;
use super::layer::LayerType;

/// ShapeLayer object - represents shape layers
/// Inherits from AVLayer → Layer → PropertyGroup → PropertyBase
/// Specialized layer type for vector shapes and graphics
pub struct ShapeLayer {
    pub base: AVLayer,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ShapeType {
    Rectangle = 0,
    Ellipse = 1,
    Star = 2,
    Polygon = 3,
    Path = 4,
    Group = 5,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FillRule {
    NonZeroWinding = 0,
    EvenOdd = 1,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LineCap {
    Butt = 0,
    Round = 1,
    Square = 2,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LineJoin {
    Miter = 0,
    Round = 1,
    Bevel = 2,
}

#[derive(Debug, Clone, PartialEq)]
pub enum GradientType {
    Linear = 0,
    Radial = 1,
}

#[derive(Debug, Clone, PartialEq)]
pub enum BlendMode {
    Normal = 0,
    Multiply = 1,
    Screen = 2,
    Overlay = 3,
    SoftLight = 4,
    HardLight = 5,
    ColorDodge = 6,
    ColorBurn = 7,
    Darken = 8,
    Lighten = 9,
    Difference = 10,
    Exclusion = 11,
    Hue = 12,
    Saturation = 13,
    Color = 14,
    Luminosity = 15,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TrimType {
    Simultaneously = 0,
    Individually = 1,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RepeaterComposite {
    Above = 0,
    Below = 1,
}

impl ShapeLayer {
    pub fn new() -> Self {
        let mut shape_layer = Self {
            base: AVLayer::new(),
        };
        
        // Set the layer type to Shape
        shape_layer.base.base.layer_type = LayerType::Shape;
        
        shape_layer.initialize_shape_methods();
        shape_layer.initialize_shape_properties();
        shape_layer
    }
    
    fn initialize_shape_methods(&mut self) {
        // ShapeLayer-specific methods (in addition to AVLayer methods)
        
        // Shape creation and management methods
        self.base.base.base.base.api_object.methods.insert("addShape".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // ShapeType enum value
        ]));
        
        self.base.base.base.base.api_object.methods.insert("removeShape".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shape index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getShape".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shape index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("duplicateShape".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shape index
        ]));
        
        // Shape group management
        self.base.base.base.base.api_object.methods.insert("addShapeGroup".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // group name
        ]));
        
        self.base.base.base.base.api_object.methods.insert("removeShapeGroup".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // group index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("moveShapeToGroup".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // shape index
            PropertyValueType::OneD   // group index
        ]));
        
        // Fill and stroke methods
        self.base.base.base.base.api_object.methods.insert("addFill".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addStroke".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addGradientFill".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // GradientType enum value
        ]));
        
        self.base.base.base.base.api_object.methods.insert("addGradientStroke".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // GradientType enum value
        ]));
        
        self.base.base.base.base.api_object.methods.insert("removeFill".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // fill index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("removeStroke".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // stroke index
        ]));
        
        // Shape modifier methods
        self.base.base.base.base.api_object.methods.insert("addTrim".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addOffset".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addRoundCorners".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addPuckerAndBloat".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addRepeater".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addTwist".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addWiggle".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addZigZag".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("addRoughen".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("removeModifier".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // modifier index
        ]));
        
        // Path manipulation methods
        self.base.base.base.base.api_object.methods.insert("createPath".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string())  // vertices array
        ]));
        
        self.base.base.base.base.api_object.methods.insert("addVertex".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // path index
            PropertyValueType::TwoD   // vertex position [x, y]
        ]));
        
        self.base.base.base.base.api_object.methods.insert("removeVertex".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // path index
            PropertyValueType::OneD   // vertex index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("setVertexPosition".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,  // path index
            PropertyValueType::OneD,  // vertex index
            PropertyValueType::TwoD   // new position [x, y]
        ]));
        
        self.base.base.base.base.api_object.methods.insert("setInTangent".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,  // path index
            PropertyValueType::OneD,  // vertex index
            PropertyValueType::TwoD   // tangent vector [x, y]
        ]));
        
        self.base.base.base.base.api_object.methods.insert("setOutTangent".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,  // path index
            PropertyValueType::OneD,  // vertex index
            PropertyValueType::TwoD   // tangent vector [x, y]
        ]));
        
        // Shape conversion methods
        self.base.base.base.base.api_object.methods.insert("convertToPath".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shape index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("convertToBezier".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shape index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("convertToMask".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shape index
        ]));
        
        // Shape animation methods
        self.base.base.base.base.api_object.methods.insert("animateShapeProperty".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,     // shape index
            PropertyValueType::ArbText,  // property name
            PropertyValueType::Custom("Array".to_string())  // keyframe values
        ]));
        
        self.base.base.base.base.api_object.methods.insert("setShapeKeyframe".to_string(), MethodValidation::new(4).with_param_types(vec![
            PropertyValueType::OneD,                        // shape index
            PropertyValueType::ArbText,                     // property name
            PropertyValueType::OneD,                        // time
            PropertyValueType::Custom("Any".to_string())    // value
        ]));
        
        // Shape analysis methods
        self.base.base.base.base.api_object.methods.insert("getShapeCount".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("getShapeType".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shape index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getShapeBounds".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // shape index
            PropertyValueType::OneD   // time
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getShapeProperty".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,     // shape index
            PropertyValueType::ArbText   // property name
        ]));
        
        // Shape layer export and rendering
        self.base.base.base.base.api_object.methods.insert("exportShapeAsJSON".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shape index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("importShapeFromJSON".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // JSON string
        ]));
        
        self.base.base.base.base.api_object.methods.insert("rasterizeShape".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // shape index
            PropertyValueType::OneD   // resolution scale
        ]));
        
        // Shape layer utilities
        self.base.base.base.base.api_object.methods.insert("mergeShapes".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // shape indices
            PropertyValueType::OneD                          // merge mode
        ]));
        
        self.base.base.base.base.api_object.methods.insert("simplifyPath".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // path index
            PropertyValueType::OneD   // tolerance
        ]));
        
        self.base.base.base.base.api_object.methods.insert("reversePath".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // path index
        ]));
        
        // Shape styles and presets
        self.base.base.base.base.api_object.methods.insert("applyShapePreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // preset file
        ]));
        
        self.base.base.base.base.api_object.methods.insert("saveShapePreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // output file
        ]));
    }
    
    fn initialize_shape_properties(&mut self) {
        // ShapeLayer-specific properties (in addition to AVLayer properties)
        
        // Core shape layer properties
        self.base.base.base.base.api_object.properties.insert("content".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
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
        
        // Shape contents property group
        self.base.base.base.base.api_object.properties.insert("shapes".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
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
        
        // Shape layer capabilities
        self.base.base.base.base.api_object.properties.insert("canAddShapes".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("hasShapes".to_string(), ValidationRule {
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
        
        // Shape count and management
        self.base.base.base.base.api_object.properties.insert("shapeCount".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("groupCount".to_string(), ValidationRule {
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
        
        // Shape layer bounds and dimensions
        self.base.base.base.base.api_object.properties.insert("shapeBounds".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Rectangle".to_string()),
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
        
        // Rectangle shape properties (ADBE Vector Shape - Rect)
        self.base.base.base.base.api_object.properties.insert("rectangleSize".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("rectanglePosition".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoD,
            array_size: Some(2),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("rectangleRoundness".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Ellipse shape properties (ADBE Vector Shape - Ellipse)
        self.base.base.base.base.api_object.properties.insert("ellipseSize".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("ellipsePosition".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoD,
            array_size: Some(2),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Star shape properties (ADBE Vector Shape - Star)
        self.base.base.base.base.api_object.properties.insert("starPoints".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(3.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("starPosition".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoD,
            array_size: Some(2),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("starRotation".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("starInnerRadius".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("starOuterRadius".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("starInnerRoundness".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("starOuterRoundness".to_string(), ValidationRule {
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
        
        // Path shape properties (ADBE Vector Shape - Group)
        self.base.base.base.base.api_object.properties.insert("pathVertices".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
        
        self.base.base.base.base.api_object.properties.insert("pathInTangents".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
        
        self.base.base.base.base.api_object.properties.insert("pathOutTangents".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
        
        self.base.base.base.base.api_object.properties.insert("pathClosed".to_string(), ValidationRule {
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
        
        // Fill properties (ADBE Vector Graphic - Fill)
        self.base.base.base.base.api_object.properties.insert("fillColor".to_string(), ValidationRule {
            value_type: PropertyValueType::Color,
            array_size: Some(4),
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("fillOpacity".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("fillRule".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // NON_ZERO_WINDING
                "1".to_string(),  // EVEN_ODD
            ]),
            custom_validator: None,
        });
        
        // Stroke properties (ADBE Vector Graphic - Stroke)
        self.base.base.base.base.api_object.properties.insert("strokeColor".to_string(), ValidationRule {
            value_type: PropertyValueType::Color,
            array_size: Some(4),
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("strokeOpacity".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("strokeWidth".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("strokeLineCap".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // BUTT
                "1".to_string(),  // ROUND
                "2".to_string(),  // SQUARE
            ]),
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("strokeLineJoin".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // MITER
                "1".to_string(),  // ROUND
                "2".to_string(),  // BEVEL
            ]),
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("strokeMiterLimit".to_string(), ValidationRule {
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
        
        // Gradient properties
        self.base.base.base.base.api_object.properties.insert("gradientType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // LINEAR
                "1".to_string(),  // RADIAL
            ]),
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("gradientStartPoint".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoD,
            array_size: Some(2),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("gradientEndPoint".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoD,
            array_size: Some(2),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("gradientColors".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
        
        // Trim modifier properties (ADBE Vector Filter - Trim)
        self.base.base.base.base.api_object.properties.insert("trimStart".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("trimEnd".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("trimOffset".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(360.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("trimType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // SIMULTANEOUSLY
                "1".to_string(),  // INDIVIDUALLY
            ]),
            custom_validator: None,
        });
        
        // Offset modifier properties (ADBE Vector Filter - Offset)
        self.base.base.base.base.api_object.properties.insert("offsetAmount".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("offsetLineJoin".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // MITER
                "1".to_string(),  // ROUND
                "2".to_string(),  // BEVEL
            ]),
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("offsetMiterLimit".to_string(), ValidationRule {
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
        
        // Repeater modifier properties (ADBE Vector Filter - Repeater)
        self.base.base.base.base.api_object.properties.insert("repeaterCopies".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("repeaterOffset".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("repeaterComposite".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // ABOVE
                "1".to_string(),  // BELOW
            ]),
            custom_validator: None,
        });
        
        // Transform properties for repeater
        self.base.base.base.base.api_object.properties.insert("repeaterTransform".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
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
    
    /// Access to the underlying AVLayer
    pub fn get_base(&self) -> &AVLayer {
        &self.base
    }
    
    /// Mutable access to the underlying AVLayer
    pub fn get_base_mut(&mut self) -> &mut AVLayer {
        &mut self.base
    }
    
    /// Check if this shape layer has any shapes
    pub fn has_shapes(&self) -> bool {
        // This would check if the content property group has any shapes
        // For now, return false as default
        false
    }
    
    /// Get the number of shapes in this layer
    pub fn get_shape_count(&self) -> usize {
        // This would count the shapes in the content property group
        // For now, return 0 as default
        0
    }
    
    /// Get the number of shape groups in this layer
    pub fn get_group_count(&self) -> usize {
        // This would count the shape groups in the content property group
        // For now, return 0 as default
        0
    }
    
    /// Check if shapes can be added to this layer
    pub fn can_add_shapes(&self) -> bool {
        // Shape layers can generally have shapes added unless locked
        // For now, return true as default
        true
    }
    
    /// Get the type of a specific shape
    pub fn get_shape_type(&self, index: usize) -> Option<ShapeType> {
        // This would determine the type of the shape at the given index
        // For now, return None as default
        None
    }
    
    /// Check if a shape has fill
    pub fn shape_has_fill(&self, index: usize) -> bool {
        // This would check if the shape has any fill properties
        // For now, return false as default
        false
    }
    
    /// Check if a shape has stroke
    pub fn shape_has_stroke(&self, index: usize) -> bool {
        // This would check if the shape has any stroke properties
        // For now, return false as default
        false
    }
    
    /// Get shape bounds at specific time
    pub fn get_shape_bounds(&self, index: usize, time: f64) -> Option<[f64; 4]> {
        // This would calculate the bounding box [left, top, right, bottom] of the shape
        // For now, return None as default
        None
    }
    
    /// Check if shape is closed (for paths)
    pub fn is_shape_closed(&self, index: usize) -> bool {
        // This would check if a path shape is closed
        // For now, return true as default
        true
    }
    
    /// Get vertex count for a path shape
    pub fn get_shape_vertex_count(&self, index: usize) -> usize {
        // This would count vertices in a path shape
        // For now, return 0 as default
        0
    }
    
    /// Check if layer has modifiers applied
    pub fn has_modifiers(&self) -> bool {
        // This would check if any shape modifiers are applied
        // For now, return false as default
        false
    }
}

/// Factory functions for creating different types of ShapeLayers
pub mod shapelayer_factory {
    use super::*;
    
    /// Create a standard shape layer
    pub fn create_shape_layer() -> ShapeLayer {
        ShapeLayer::new()
    }
    
    /// Create a shape layer with a rectangle
    pub fn create_rectangle_shape_layer() -> ShapeLayer {
        let mut layer = ShapeLayer::new();
        // Rectangle shape setup would go here
        layer
    }
    
    /// Create a shape layer with an ellipse
    pub fn create_ellipse_shape_layer() -> ShapeLayer {
        let mut layer = ShapeLayer::new();
        // Ellipse shape setup would go here
        layer
    }
    
    /// Create a shape layer with a star
    pub fn create_star_shape_layer() -> ShapeLayer {
        let mut layer = ShapeLayer::new();
        // Star shape setup would go here
        layer
    }
    
    /// Create a shape layer with a custom path
    pub fn create_path_shape_layer() -> ShapeLayer {
        let mut layer = ShapeLayer::new();
        // Path shape setup would go here
        layer
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::objects::layer::LayerType;
    
    #[test]
    fn test_shapelayer_creation() {
        let shape_layer = ShapeLayer::new();
        assert_eq!(*shape_layer.get_base().get_base().get_layer_type(), LayerType::Shape);
        assert!(!shape_layer.has_shapes());
        assert_eq!(shape_layer.get_shape_count(), 0);
        assert_eq!(shape_layer.get_group_count(), 0);
    }
    
    #[test]
    #[ignore]
    fn test_shapelayer_inheritance() {
        let shape_layer = ShapeLayer::new();
        // Should inherit from AVLayer → Layer
        assert_eq!(*shape_layer.get_base().get_base().get_layer_type(), LayerType::Shape);
        // Should inherit from PropertyGroup
        assert_eq!(shape_layer.get_base().get_base().get_base().base.get_property_type(), &super::super::propertygroup::PropertyType::NamedGroup);
    }
    
    #[test]
    fn test_shapelayer_capabilities() {
        let shape_layer = ShapeLayer::new();
        assert!(shape_layer.can_add_shapes());
        assert!(!shape_layer.has_modifiers());
        assert_eq!(shape_layer.get_shape_type(0), None);
        assert!(!shape_layer.shape_has_fill(0));
        assert!(!shape_layer.shape_has_stroke(0));
    }
    
    #[test]
    fn test_shapelayer_bounds() {
        let shape_layer = ShapeLayer::new();
        assert_eq!(shape_layer.get_shape_bounds(0, 1.0), None);
        assert!(shape_layer.is_shape_closed(0));
        assert_eq!(shape_layer.get_shape_vertex_count(0), 0);
    }
    
    #[test]
    fn test_shape_type_values() {
        assert_eq!(ShapeType::Rectangle as u8, 0);
        assert_eq!(ShapeType::Ellipse as u8, 1);
        assert_eq!(ShapeType::Star as u8, 2);
        assert_eq!(ShapeType::Path as u8, 4);
    }
    
    #[test]
    fn test_fill_rule_values() {
        assert_eq!(FillRule::NonZeroWinding as u8, 0);
        assert_eq!(FillRule::EvenOdd as u8, 1);
    }
    
    #[test]
    fn test_line_cap_values() {
        assert_eq!(LineCap::Butt as u8, 0);
        assert_eq!(LineCap::Round as u8, 1);
        assert_eq!(LineCap::Square as u8, 2);
    }
    
    #[test]
    fn test_line_join_values() {
        assert_eq!(LineJoin::Miter as u8, 0);
        assert_eq!(LineJoin::Round as u8, 1);
        assert_eq!(LineJoin::Bevel as u8, 2);
    }
}