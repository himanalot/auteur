use std::collections::HashMap;
use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

pub struct CameraLayer {
    api_object: ApiObject,
}

impl CameraLayer {
    pub fn new() -> Self {
        let mut camera_object = Self {
            api_object: ApiObject::new(ObjectContext::Camera),
        };
        
        camera_object.initialize_methods();
        camera_object.initialize_properties();
        camera_object
    }
    
    fn initialize_methods(&mut self) {
        // Camera-specific methods
        self.api_object.methods.insert("lookAt".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ThreeD,  // point of interest
            PropertyValueType::OneD     // duration
        ]));
        
        self.api_object.methods.insert("autoOrient".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("AutoOrientType".to_string())
        ]));
        
        self.api_object.methods.insert("setDepthOfField".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Camera presets
        self.api_object.methods.insert("applyPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // preset name
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // CameraLayer inherits all AVLayer and Layer properties
        // Add Camera-specific properties
        
        // Camera Options property group
        self.api_object.properties.insert("cameraOption".to_string(), ValidationRule {
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
        
        // Core camera properties
        self.api_object.properties.insert("zoom".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(100000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("depthOfField".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("focusDistance".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("aperture".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(5120.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("blurLevel".to_string(), ValidationRule {
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
        
        // Iris properties
        self.api_object.properties.insert("irisShape".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("IrisShape".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "SQUARE".to_string(),
                "TRIANGLE".to_string(),
                "PENTAGON".to_string(),
                "HEXAGON".to_string(),
                "HEPTAGON".to_string(),
                "OCTAGON".to_string(),
                "NONAGON".to_string(),
                "DECAGON".to_string(),
            ]),
            custom_validator: None,
        });
        
        self.api_object.properties.insert("irisRotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-180.0),
            range_max: Some(180.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("irisRoundness".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("irisAspectRatio".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("irisDiffractionFringe".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("highlightGain".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("highlightThreshold".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("highlightSaturation".to_string(), ValidationRule {
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
        
        // Read-only camera type
        self.api_object.properties.insert("active".to_string(), ValidationRule {
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
        
        // Point of Interest
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
        
        // Auto-orientation
        self.api_object.properties.insert("autoOrient".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("AutoOrientType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "NO_AUTO_ORIENT".to_string(),
                "ALONG_PATH".to_string(),
                "CAMERA_OR_POINT_OF_INTEREST".to_string(),
            ]),
            custom_validator: None,
        });
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

// Camera preset definitions
pub struct CameraPresets;

impl CameraPresets {
    pub fn get_presets() -> Vec<&'static str> {
        vec![
            "15mm",
            "20mm",
            "24mm", 
            "28mm",
            "35mm",
            "50mm",
            "80mm",
            "135mm",
            "200mm",
            "300mm",
            "Comp Camera",
        ]
    }
    
    pub fn get_preset_settings(preset: &str) -> Option<CameraPresetSettings> {
        match preset {
            "15mm" => Some(CameraPresetSettings {
                zoom: 1181.1,
                angle_of_view: Some(100.39),
                focal_length: Some(15.0),
            }),
            "20mm" => Some(CameraPresetSettings {
                zoom: 1574.8,
                angle_of_view: Some(84.26),
                focal_length: Some(20.0),
            }),
            "24mm" => Some(CameraPresetSettings {
                zoom: 1889.8,
                angle_of_view: Some(73.74),
                focal_length: Some(24.0),
            }),
            "28mm" => Some(CameraPresetSettings {
                zoom: 2204.7,
                angle_of_view: Some(65.47),
                focal_length: Some(28.0),
            }),
            "35mm" => Some(CameraPresetSettings {
                zoom: 2755.9,
                angle_of_view: Some(54.43),
                focal_length: Some(35.0),
            }),
            "50mm" => Some(CameraPresetSettings {
                zoom: 3937.0,
                angle_of_view: Some(39.60),
                focal_length: Some(50.0),
            }),
            "80mm" => Some(CameraPresetSettings {
                zoom: 6299.2,
                angle_of_view: Some(25.21),
                focal_length: Some(80.0),
            }),
            "135mm" => Some(CameraPresetSettings {
                zoom: 10629.9,
                angle_of_view: Some(15.01),
                focal_length: Some(135.0),
            }),
            "200mm" => Some(CameraPresetSettings {
                zoom: 15748.0,
                angle_of_view: Some(10.14),
                focal_length: Some(200.0),
            }),
            _ => None,
        }
    }
}

pub struct CameraPresetSettings {
    pub zoom: f32,
    pub angle_of_view: Option<f32>,
    pub focal_length: Option<f32>,
}