use std::collections::HashMap;
use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

pub struct LightLayer {
    api_object: ApiObject,
}

impl LightLayer {
    pub fn new() -> Self {
        let mut light_object = Self {
            api_object: ApiObject::new(ObjectContext::Light),
        };
        
        light_object.initialize_methods();
        light_object.initialize_properties();
        light_object
    }
    
    fn initialize_methods(&mut self) {
        // Light-specific methods
        self.api_object.methods.insert("setLightType".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("LightType".to_string())
        ]));
        
        self.api_object.methods.insert("castsShadows".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.api_object.methods.insert("shadowDarkness".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD
        ]));
        
        self.api_object.methods.insert("shadowDiffusion".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // LightLayer inherits all AVLayer and Layer properties
        // Add Light-specific properties
        
        // Light Options property group
        self.api_object.properties.insert("lightOption".to_string(), ValidationRule {
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
        
        // Light type
        self.api_object.properties.insert("lightType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("LightType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "PARALLEL".to_string(),
                "SPOT".to_string(),
                "POINT".to_string(),
                "AMBIENT".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Core light properties
        self.api_object.properties.insert("intensity".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(200.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("color".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("coneAngle".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(180.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("coneFeather".to_string(), ValidationRule {
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
        
        // Shadow properties
        self.api_object.properties.insert("castsShadows".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("shadowDarkness".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("shadowDiffusion".to_string(), ValidationRule {
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
        
        // Falloff properties (for Point and Spot lights)
        self.api_object.properties.insert("falloffType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FalloffType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "NONE".to_string(),
                "SMOOTH".to_string(),
                "INVERSE_SQUARE_CLAMPED".to_string(),
            ]),
            custom_validator: None,
        });
        
        self.api_object.properties.insert("falloffStart".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("falloffDistance".to_string(), ValidationRule {
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
        
        // Point of Interest (for non-ambient lights)
        self.api_object.properties.insert("pointOfInterest".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeD,
            array_size: Some(3),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Accepts Shadows
        self.api_object.properties.insert("acceptsShadows".to_string(), ValidationRule {
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
        
        // Accepts Lights
        self.api_object.properties.insert("acceptsLights".to_string(), ValidationRule {
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
        
        // Ambient property (affects diffuse)
        self.api_object.properties.insert("ambient".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-100.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Diffuse property
        self.api_object.properties.insert("diffuse".to_string(), ValidationRule {
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
        
        // Specular properties
        self.api_object.properties.insert("specular".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("shininess".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("metal".to_string(), ValidationRule {
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
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

// Light type specific validation
pub struct LightTypeValidator;

impl LightTypeValidator {
    pub fn validate_property_for_type(light_type: &str, property: &str) -> Result<(), String> {
        match (light_type, property) {
            ("AMBIENT", "coneAngle") | 
            ("AMBIENT", "coneFeather") |
            ("AMBIENT", "pointOfInterest") => {
                Err(format!("Property '{}' is not valid for ambient lights", property))
            }
            ("PARALLEL", "coneAngle") | 
            ("PARALLEL", "coneFeather") |
            ("PARALLEL", "falloffStart") |
            ("PARALLEL", "falloffDistance") => {
                Err(format!("Property '{}' is not valid for parallel lights", property))
            }
            ("POINT", "coneAngle") | 
            ("POINT", "coneFeather") => {
                Err(format!("Property '{}' is not valid for point lights", property))
            }
            _ => Ok(())
        }
    }
}