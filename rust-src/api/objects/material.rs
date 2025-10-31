use std::collections::HashMap;
use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

pub struct MaterialOptionsObject {
    api_object: ApiObject,
}

impl MaterialOptionsObject {
    pub fn new() -> Self {
        let mut material_object = Self {
            api_object: ApiObject::new(ObjectContext::Property("MaterialOptions".to_string())),
        };
        
        material_object.initialize_properties();
        material_object
    }
    
    fn initialize_properties(&mut self) {
        // Material Options properties for 3D layers
        
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
        
        // Casts Shadows
        self.api_object.properties.insert("castsShadows".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("OnOff".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "ON".to_string(),
                "OFF".to_string(),
                "ONLY".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Light Transmission
        self.api_object.properties.insert("lightTransmission".to_string(), ValidationRule {
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
        
        // Ambient
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
        
        // Diffuse
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
        
        // Specular Intensity
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
        
        // Specular Shininess
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
        
        // Metal
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
        
        // Reflection Intensity
        self.api_object.properties.insert("reflectionIntensity".to_string(), ValidationRule {
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
        
        // Reflection Sharpness
        self.api_object.properties.insert("reflectionSharpness".to_string(), ValidationRule {
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
        
        // Reflection Rolloff
        self.api_object.properties.insert("reflectionRolloff".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(10.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Transparency
        self.api_object.properties.insert("transparency".to_string(), ValidationRule {
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
        
        // Transparency Rolloff
        self.api_object.properties.insert("transparencyRolloff".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(10.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Index of Refraction
        self.api_object.properties.insert("indexOfRefraction".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(5.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Appears in Reflections
        self.api_object.properties.insert("appearsInReflections".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("OnOff".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "ON".to_string(),
                "OFF".to_string(),
                "ONLY".to_string(),
            ]),
            custom_validator: None,
        });
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

// Material presets
pub struct MaterialPresets;

impl MaterialPresets {
    pub fn get_presets() -> Vec<&'static str> {
        vec![
            "Plastic Shiny",
            "Plastic Dull",
            "Metal Basic",
            "Metal Polished",
            "Glass",
            "Glass Frosted",
            "Wood",
            "Rubber",
            "Concrete",
            "Fabric",
        ]
    }
    
    pub fn get_preset_values(preset: &str) -> Option<MaterialPresetValues> {
        match preset {
            "Plastic Shiny" => Some(MaterialPresetValues {
                ambient: 0.0,
                diffuse: 65.0,
                specular: 50.0,
                shininess: 80.0,
                metal: 0.0,
                reflection_intensity: 20.0,
                reflection_sharpness: 90.0,
            }),
            "Plastic Dull" => Some(MaterialPresetValues {
                ambient: 0.0,
                diffuse: 80.0,
                specular: 15.0,
                shininess: 20.0,
                metal: 0.0,
                reflection_intensity: 5.0,
                reflection_sharpness: 50.0,
            }),
            "Metal Basic" => Some(MaterialPresetValues {
                ambient: 0.0,
                diffuse: 40.0,
                specular: 80.0,
                shininess: 50.0,
                metal: 100.0,
                reflection_intensity: 60.0,
                reflection_sharpness: 90.0,
            }),
            "Metal Polished" => Some(MaterialPresetValues {
                ambient: 0.0,
                diffuse: 30.0,
                specular: 100.0,
                shininess: 90.0,
                metal: 100.0,
                reflection_intensity: 80.0,
                reflection_sharpness: 100.0,
            }),
            "Glass" => Some(MaterialPresetValues {
                ambient: 0.0,
                diffuse: 10.0,
                specular: 100.0,
                shininess: 95.0,
                metal: 0.0,
                reflection_intensity: 100.0,
                reflection_sharpness: 100.0,
            }),
            "Glass Frosted" => Some(MaterialPresetValues {
                ambient: 0.0,
                diffuse: 20.0,
                specular: 60.0,
                shininess: 40.0,
                metal: 0.0,
                reflection_intensity: 40.0,
                reflection_sharpness: 20.0,
            }),
            "Wood" => Some(MaterialPresetValues {
                ambient: 0.0,
                diffuse: 85.0,
                specular: 10.0,
                shininess: 15.0,
                metal: 0.0,
                reflection_intensity: 15.0,
                reflection_sharpness: 30.0,
            }),
            "Rubber" => Some(MaterialPresetValues {
                ambient: 0.0,
                diffuse: 90.0,
                specular: 5.0,
                shininess: 10.0,
                metal: 0.0,
                reflection_intensity: 5.0,
                reflection_sharpness: 20.0,
            }),
            _ => None,
        }
    }
}

pub struct MaterialPresetValues {
    pub ambient: f32,
    pub diffuse: f32,
    pub specular: f32,
    pub shininess: f32,
    pub metal: f32,
    pub reflection_intensity: f32,
    pub reflection_sharpness: f32,
}