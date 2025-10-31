use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::propertybase::{PropertyBase, PropertyType};

/// Property object - represents a single property such as position or zoom
/// Inherits from PropertyBase
pub struct Property {
    pub base: PropertyBase,
}

impl Property {
    pub fn new() -> Self {
        let mut property = Self {
            base: PropertyBase::new(ObjectContext::Property("".to_string()), PropertyType::Property),
        };
        
        property.initialize_property_methods();
        property.initialize_property_properties();
        property
    }
    
    fn initialize_property_methods(&mut self) {
        // Property-specific methods (in addition to PropertyBase methods)
        
        // Core value manipulation methods
        self.base.api_object.methods.insert("setValue".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::CustomValue]));
        self.base.api_object.methods.insert("setValueAtTime".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,          // time
            PropertyValueType::CustomValue    // value
        ]));
        self.base.api_object.methods.insert("setValueAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,          // key index
            PropertyValueType::CustomValue    // value
        ]));
        self.base.api_object.methods.insert("setValuesAtTimes".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // times array
            PropertyValueType::Custom("Array".to_string())   // values array
        ]));
        
        // Value retrieval methods
        self.base.api_object.methods.insert("valueAtTime".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // time
            PropertyValueType::Custom("Boolean".to_string())  // preExpression
        ]));
        
        // Keyframe management methods
        self.base.api_object.methods.insert("addKey".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("removeKey".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("nearestKeyIndex".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        
        // Keyframe attribute getters
        self.base.api_object.methods.insert("keyTime".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keyValue".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keySelected".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keyLabel".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        
        // Interpolation methods
        self.base.api_object.methods.insert("keyInInterpolationType".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keyOutInterpolationType".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("setInterpolationTypeAtKey".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,                                      // key index
            PropertyValueType::Custom("KeyframeInterpolationType".to_string()),  // in type
            PropertyValueType::Custom("KeyframeInterpolationType".to_string())   // out type
        ]));
        self.base.api_object.methods.insert("isInterpolationTypeValid".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("KeyframeInterpolationType".to_string())]));
        
        // Temporal ease methods
        self.base.api_object.methods.insert("keyInTemporalEase".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keyOutTemporalEase".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("setTemporalEaseAtKey".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Array".to_string()),   // in temporal ease
            PropertyValueType::Custom("Array".to_string())    // out temporal ease
        ]));
        self.base.api_object.methods.insert("setTemporalContinuousAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Boolean".to_string())  // continuous
        ]));
        self.base.api_object.methods.insert("setTemporalAutoBezierAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Boolean".to_string())  // auto bezier
        ]));
        
        // Spatial tangent methods (for spatial properties)
        self.base.api_object.methods.insert("keyInSpatialTangent".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keyOutSpatialTangent".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("setSpatialTangentsAtKey".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Array".to_string()),   // in spatial tangent
            PropertyValueType::Custom("Array".to_string())    // out spatial tangent
        ]));
        self.base.api_object.methods.insert("setSpatialContinuousAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Boolean".to_string())  // continuous
        ]));
        self.base.api_object.methods.insert("setSpatialAutoBezierAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Boolean".to_string())  // auto bezier
        ]));
        
        // Roving and auto-bezier methods
        self.base.api_object.methods.insert("keyRoving".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("setRovingAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Boolean".to_string())  // roving
        ]));
        self.base.api_object.methods.insert("keyTemporalAutoBezier".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keyTemporalContinuous".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keySpatialAutoBezier".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keySpatialContinuous".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        
        // Selection methods
        self.base.api_object.methods.insert("setSelectedAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Boolean".to_string())  // selected
        ]));
        
        // Label methods
        self.base.api_object.methods.insert("setLabelAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // key index
            PropertyValueType::OneD   // label index
        ]));
        
        // Expression methods
        self.base.api_object.methods.insert("setExpression".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::ArbText]));
        self.base.api_object.methods.insert("setExpressionWithTime".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,   // time
            PropertyValueType::ArbText // expression
        ]));
        
        // Motion Graphics Template methods
        self.base.api_object.methods.insert("addToMotionGraphicsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::ArbText]));
        self.base.api_object.methods.insert("addToMotionGraphicsTemplateAs".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,                               // name
            PropertyValueType::Custom("MGTemplateType".to_string())  // type
        ]));
        self.base.api_object.methods.insert("canAddToMotionGraphicsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("MGTemplateType".to_string())]));
        
        // Enhanced MGT methods (After Effects 24.x)
        self.base.api_object.methods.insert("removeFromMotionGraphicsTemplate".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("isAddedToMotionGraphicsTemplate".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("motionGraphicsTemplateControlType".to_string(), MethodValidation::new(0));
        
        // Alternate source methods
        self.base.api_object.methods.insert("setAlternateSource".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("AVItem".to_string())]));
        
        // Separation methods (for multidimensional properties)
        self.base.api_object.methods.insert("getSeparationFollower".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        
        // Property parameter methods
        self.base.api_object.methods.insert("setPropertyParameters".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("Array".to_string())]));
        
        // Advanced keyframe methods
        self.base.api_object.methods.insert("keyInSpatialTangent".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("keyOutSpatialTangent".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("setSpatialTangentsAtKey".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,                           // key index
            PropertyValueType::Custom("Array".to_string()),   // in spatial tangent
            PropertyValueType::Custom("Array".to_string())    // out spatial tangent
        ]));
        
        // Enhanced separation dimension methods
        self.base.api_object.methods.insert("separateDimensions".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("getSeparationFollower".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("getSeparationLeader".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("rejoinDimensions".to_string(), MethodValidation::new(0));
        
        // Separation query methods
        self.base.api_object.methods.insert("canSeparateDimensions".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("getNumSeparatedDimensions".to_string(), MethodValidation::new(0));
        
        // Property linking and expressions
        self.base.api_object.methods.insert("pickWhip".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("Property".to_string())]));
        self.base.api_object.methods.insert("expressionFromCode".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::ArbText]));
        
        // Property value at specific time methods
        self.base.api_object.methods.insert("valueAtTime".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // time
            PropertyValueType::Custom("Boolean".to_string())  // preExpression
        ]));
        self.base.api_object.methods.insert("speedAtTime".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.base.api_object.methods.insert("velocityAtTime".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        
        // Property stream and layer reference
        self.base.api_object.methods.insert("propertyStream".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("containingLayer".to_string(), MethodValidation::new(0));
        
        // After Effects 24.x enhanced features
        self.base.api_object.methods.insert("setInterpolationTypeAtKey".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,                                      // key index
            PropertyValueType::Custom("KeyframeInterpolationType".to_string()),  // in type
            PropertyValueType::Custom("KeyframeInterpolationType".to_string())   // out type
        ]));
        self.base.api_object.methods.insert("isInterpolationTypeValid".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("KeyframeInterpolationType".to_string())]));
        
        // Property control and automation
        self.base.api_object.methods.insert("setValueAtKey".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,          // key index
            PropertyValueType::CustomValue    // value
        ]));
        self.base.api_object.methods.insert("setValuesAtTimes".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // times array
            PropertyValueType::Custom("Array".to_string())   // values array
        ]));
    }
    
    fn initialize_property_properties(&mut self) {
        // Read-only property type information
        self.base.api_object.properties.insert("propertyValueType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyValueType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "NO_VALUE".to_string(), "THREE_D_SPATIAL".to_string(), "THREE_D".to_string(),
                "TWO_D_SPATIAL".to_string(), "TWO_D".to_string(), "ONE_D".to_string(),
                "COLOR".to_string(), "CUSTOM_VALUE".to_string(), "MARKER".to_string(),
                "LAYER_INDEX".to_string(), "MASK_INDEX".to_string(), "SHAPE".to_string(),
                "TEXT_DOCUMENT".to_string()
            ]),
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("value".to_string(), ValidationRule {
            value_type: PropertyValueType::CustomValue,
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
        
        self.base.api_object.properties.insert("canVaryOverTime".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("isTimeVarying".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("isSpatial".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("numKeys".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("selectedKeys".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
        
        self.base.api_object.properties.insert("propertyIndex".to_string(), ValidationRule {
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
        
        // Expression properties
        self.base.api_object.properties.insert("expression".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("expressionEnabled".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("expressionError".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("canSetExpression".to_string(), ValidationRule {
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
        
        // Min/Max properties
        self.base.api_object.properties.insert("hasMin".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("hasMax".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("minValue".to_string(), ValidationRule {
            value_type: PropertyValueType::CustomValue,
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
        
        self.base.api_object.properties.insert("maxValue".to_string(), ValidationRule {
            value_type: PropertyValueType::CustomValue,
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
        
        // Dimension separation properties
        self.base.api_object.properties.insert("dimensionsSeparated".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("isSeparationLeader".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("isSeparationFollower".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("separationDimension".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(3.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("separationLeader".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Property".to_string()),
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
        
        // Dropdown effect properties
        self.base.api_object.properties.insert("isDropdownEffect".to_string(), ValidationRule {
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
        
        // Units and alternate source
        self.base.api_object.properties.insert("unitsText".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("canSetAlternateSource".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("alternateSource".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("AVItem".to_string()),
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
        
        self.base.api_object.properties.insert("essentialPropertySource".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("CompItem".to_string()),
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
        
        // Motion Graphics Template properties
        self.base.api_object.properties.insert("motionGraphicsTemplateControlType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("MGTemplateControlType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "SLIDER".to_string(),
                "ANGLE".to_string(),
                "COLOR".to_string(),
                "CHECKBOX".to_string(),
                "DROPDOWN".to_string(),
                "TEXT".to_string(),
                "SOURCE_TEXT".to_string(),
            ]),
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("isAddedToMotionGraphicsTemplate".to_string(), ValidationRule {
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
        
        // Advanced property information
        self.base.api_object.properties.insert("propertyStream".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyStream".to_string()),
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
        
        self.base.api_object.properties.insert("containingLayer".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Layer".to_string()),
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
        
        // Property hierarchy and referencing
        self.base.api_object.properties.insert("propertyPath".to_string(), ValidationRule {
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
        
        // Enhanced keyframe information  
        self.base.api_object.properties.insert("keyFrameInterpolationType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("KeyframeInterpolationType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "LINEAR".to_string(),
                "BEZIER".to_string(),
                "HOLD".to_string(),
                "NO_INTERPOLATION".to_string(),
            ]),
            custom_validator: None,
        });
    }
    
    /// Access to the underlying PropertyBase
    pub fn get_base(&self) -> &PropertyBase {
        &self.base
    }
    
    /// Mutable access to the underlying PropertyBase
    pub fn get_base_mut(&mut self) -> &mut PropertyBase {
        &mut self.base
    }
}