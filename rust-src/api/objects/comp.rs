use std::collections::HashMap;
use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

pub struct CompItem {
    api_object: ApiObject,
}

impl CompItem {
    pub fn new() -> Self {
        let mut comp_item = Self {
            api_object: ApiObject::new(ObjectContext::Comp),
        };
        
        comp_item.initialize_methods();
        comp_item.initialize_properties();
        comp_item
    }
    
    fn initialize_methods(&mut self) {
        // Basic composition methods
        self.api_object.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("layer".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("LayerSpec".to_string())
        ]));
        
        // Motion Graphics Templates (MOGRT) methods
        self.api_object.methods.insert("openInEssentialGraphics".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("exportAsMotionGraphicsTemplate".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("File".to_string()),     // output file
            PropertyValueType::Custom("Boolean".to_string())   // trim unused footage
        ]));
        
        // Composition operations
        self.api_object.methods.insert("saveFrameToPng".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                           // time
            PropertyValueType::Custom("File".to_string())      // output file
        ]));
        
        // Essential Properties methods
        self.api_object.methods.insert("motionGraphicsTemplateControllerCount".to_string(), MethodValidation::new(0));
        
        // Render and export
        self.api_object.methods.insert("queueInAME".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Basic composition properties
        self.api_object.properties.insert("name".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("width".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(30000.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("height".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(30000.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("pixelAspect".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.01),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("duration".to_string(), ValidationRule {
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
        
        // Collections
        self.api_object.properties.insert("layers".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("LayerCollection".to_string()),
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
        
        self.api_object.properties.insert("frameRate".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(120.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("frameDuration".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("workAreaStart".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("workAreaDuration".to_string(), ValidationRule {
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
        
        // Motion Graphics Template properties
        self.api_object.properties.insert("motionGraphicsTemplateName".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("motionGraphicsTemplateControllerCount".to_string(), ValidationRule {
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
        
        // Background properties
        self.api_object.properties.insert("bgColor".to_string(), ValidationRule {
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
        
        // Advanced properties
        self.api_object.properties.insert("shutterAngle".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(720.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("shutterPhase".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-360.0),
            range_max: Some(360.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("motionBlur".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("draft3d".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("frameBlending".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("preserveNestedFrameRate".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("preserveNestedResolution".to_string(), ValidationRule {
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
        
        // Layer management
        self.api_object.properties.insert("numLayers".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("activeCamera".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("CameraLayer".to_string()),
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
        
        // Color management
        self.api_object.properties.insert("displayColorSpace".to_string(), ValidationRule {
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
        
        // Resolution and downsampling
        self.api_object.properties.insert("resolutionFactor".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoD,
            array_size: Some(2),
            range_min: Some(0.25),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: Some(vec![
                "[1, 1]".to_string(),    // Full
                "[0.5, 0.5]".to_string(), // Half  
                "[0.25, 0.25]".to_string(), // Quarter
            ]),
            custom_validator: None,
        });
        
        // Markers
        self.api_object.properties.insert("markerProperty".to_string(), ValidationRule {
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
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

// Essential Graphics Panel support for MOGRT
pub struct EssentialProperty {
    api_object: ApiObject,
}

impl EssentialProperty {
    pub fn new() -> Self {
        let mut essential_property = Self {
            api_object: ApiObject::new(ObjectContext::Property("EssentialProperty".to_string())),
        };
        
        essential_property.initialize_methods();
        essential_property.initialize_properties();
        essential_property
    }
    
    fn initialize_methods(&mut self) {
        // Essential property management
        self.api_object.methods.insert("addToMotionGraphicsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("CompItem".to_string())
        ]));
        
        self.api_object.methods.insert("removeFromMotionGraphicsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("CompItem".to_string())
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Source property link
        self.api_object.properties.insert("essentialPropertySource".to_string(), ValidationRule {
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
        
        // Essential Graphics panel metadata
        self.api_object.properties.insert("essentialPropertyName".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("essentialPropertyComment".to_string(), ValidationRule {
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
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}