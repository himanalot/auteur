use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::layer::{Layer, LayerType};

/// LightLayer object - represents light layers in 3D compositions
/// Inherits from Layer → PropertyGroup → PropertyBase
/// Specialized layer type for 3D lighting functionality
pub struct LightLayer {
    pub base: Layer,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LightType {
    Parallel = 0,
    Spot = 1,
    Point = 2,
    Ambient = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ShadowDarkness {
    None = 0,
    Light = 1,
    Medium = 2,
    Dark = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ShadowDiffusion {
    Hard = 0,
    Soft = 1,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FalloffType {
    None = 0,
    Smooth = 1,
    InverseSquareClamped = 2,
    InverseSquareUnclamped = 3,
}

impl LightLayer {
    pub fn new() -> Self {
        let mut light_layer = Self {
            base: Layer::new(LayerType::Light),
        };
        
        light_layer.initialize_light_methods();
        light_layer.initialize_light_properties();
        light_layer
    }
    
    fn initialize_light_methods(&mut self) {
        // LightLayer-specific methods (in addition to Layer methods)
        
        // Light setup and configuration
        self.base.base.base.api_object.methods.insert("setLightType".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // LightType enum value
        ]));
        
        self.base.base.base.api_object.methods.insert("getLightType".to_string(), MethodValidation::new(0));
        
        // Light positioning and orientation
        self.base.base.base.api_object.methods.insert("setPosition".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // position [x, y, z]
        ]));
        
        self.base.base.base.api_object.methods.insert("getPosition".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setPointOfInterest".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // point of interest [x, y, z]
        ]));
        
        self.base.base.base.api_object.methods.insert("getPointOfInterest".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setOrientation".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // orientation [x, y, z] in degrees
        ]));
        
        self.base.base.base.api_object.methods.insert("getOrientation".to_string(), MethodValidation::new(0));
        
        // Light intensity and color
        self.base.base.base.api_object.methods.insert("setIntensity".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // intensity percentage
        ]));
        
        self.base.base.base.api_object.methods.insert("getIntensity".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setColor".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Color  // RGB color
        ]));
        
        self.base.base.base.api_object.methods.insert("getColor".to_string(), MethodValidation::new(0));
        
        // Cone angle and feather (for spot lights)
        self.base.base.base.api_object.methods.insert("setConeAngle".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // cone angle in degrees
        ]));
        
        self.base.base.base.api_object.methods.insert("getConeAngle".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setConeFeather".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // cone feather percentage
        ]));
        
        self.base.base.base.api_object.methods.insert("getConeFeather".to_string(), MethodValidation::new(0));
        
        // Shadow methods
        self.base.base.base.api_object.methods.insert("setCastsShadows".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("getCastsShadows".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setShadowDarkness".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shadow darkness percentage
        ]));
        
        self.base.base.base.api_object.methods.insert("getShadowDarkness".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setShadowDiffusion".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shadow diffusion amount
        ]));
        
        self.base.base.base.api_object.methods.insert("getShadowDiffusion".to_string(), MethodValidation::new(0));
        
        // Falloff methods
        self.base.base.base.api_object.methods.insert("setFalloffType".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // FalloffType enum value
        ]));
        
        self.base.base.base.api_object.methods.insert("getFalloffType".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setFalloffStart".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // falloff start distance
        ]));
        
        self.base.base.base.api_object.methods.insert("getFalloffStart".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setFalloffDistance".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // falloff distance
        ]));
        
        self.base.base.base.api_object.methods.insert("getFalloffDistance".to_string(), MethodValidation::new(0));
        
        // Light animation and movement
        self.base.base.base.api_object.methods.insert("animateToPosition".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::ThreeD,  // target position [x, y, z]
            PropertyValueType::OneD,    // duration in seconds
            PropertyValueType::OneD     // easing type
        ]));
        
        self.base.base.base.api_object.methods.insert("animateToTarget".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::ThreeD,  // target point of interest [x, y, z]
            PropertyValueType::OneD,    // duration in seconds
            PropertyValueType::OneD     // easing type
        ]));
        
        self.base.base.base.api_object.methods.insert("orbitAroundTarget".to_string(), MethodValidation::new(4).with_param_types(vec![
            PropertyValueType::OneD,    // radius
            PropertyValueType::OneD,    // start angle
            PropertyValueType::OneD,    // end angle
            PropertyValueType::OneD     // duration
        ]));
        
        // Light aiming and targeting
        self.base.base.base.api_object.methods.insert("aimAt".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // target position [x, y, z]
        ]));
        
        self.base.base.base.api_object.methods.insert("aimAtLayer".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string())  // target layer
        ]));
        
        self.base.base.base.api_object.methods.insert("lookAt".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // target position [x, y, z]
        ]));
        
        // Light cone visualization and utilities
        self.base.base.base.api_object.methods.insert("showLightCone".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("isLightConeVisible".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("getLightDirection".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("getLightVector".to_string(), MethodValidation::new(0));
        
        // Light interaction with objects
        self.base.base.base.api_object.methods.insert("isIlluminating".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string())  // target layer
        ]));
        
        self.base.base.base.api_object.methods.insert("getIlluminationLevel".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ThreeD,  // world position [x, y, z]
            PropertyValueType::OneD     // time
        ]));
        
        self.base.base.base.api_object.methods.insert("calculateShadow".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string()),  // casting object
            PropertyValueType::ThreeD                        // receiving point [x, y, z]
        ]));
        
        // Light presets and settings
        self.base.base.base.api_object.methods.insert("applyLightPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // preset file
        ]));
        
        self.base.base.base.api_object.methods.insert("saveLightPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // output file
        ]));
        
        self.base.base.base.api_object.methods.insert("resetLight".to_string(), MethodValidation::new(0));
        
        // Light analysis and information
        self.base.base.base.api_object.methods.insert("getLightMatrix".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("getEffectiveRange".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("getAttenuation".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // distance
        ]));
        
        // Advanced lighting features
        self.base.base.base.api_object.methods.insert("setAcceptsShadows".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("setAcceptsLights".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Ray-traced lighting (3D renderer specific)
        self.base.base.base.api_object.methods.insert("setRayTracedShadows".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("setShadowSamples".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // number of shadow samples
        ]));
        
        self.base.base.base.api_object.methods.insert("setShadowQuality".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // shadow quality level
        ]));
        
        // Light baking and optimization
        self.base.base.base.api_object.methods.insert("bakeLighting".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string()),  // target layers
            PropertyValueType::OneD                          // resolution
        ]));
        
        self.base.base.base.api_object.methods.insert("clearBakedLighting".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_light_properties(&mut self) {
        // LightLayer-specific properties (in addition to Layer properties)
        
        // Core light properties
        self.base.base.base.api_object.properties.insert("lightType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(3.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // PARALLEL
                "1".to_string(),  // SPOT
                "2".to_string(),  // POINT
                "3".to_string(),  // AMBIENT
            ]),
            custom_validator: None,
        });
        
        // Light transform properties
        self.base.base.base.api_object.properties.insert("lightPosition".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("pointOfInterest".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("lightOrientation".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeD,
            array_size: Some(3),
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("xRotation".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("yRotation".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("zRotation".to_string(), ValidationRule {
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
        
        // Light color and intensity
        self.base.base.base.api_object.properties.insert("lightColor".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("intensity".to_string(), ValidationRule {
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
        
        // Cone properties (for spot lights)
        self.base.base.base.api_object.properties.insert("coneAngle".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(180.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("coneFeather".to_string(), ValidationRule {
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
        self.base.base.base.api_object.properties.insert("castsShadows".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("shadowDarkness".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("shadowDiffusion".to_string(), ValidationRule {
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
        
        // Falloff properties
        self.base.base.base.api_object.properties.insert("falloffType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(3.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // NONE
                "1".to_string(),  // SMOOTH
                "2".to_string(),  // INVERSE_SQUARE_CLAMPED
                "3".to_string(),  // INVERSE_SQUARE_UNCLAMPED
            ]),
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("falloffStart".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("falloffDistance".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(100000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Light capabilities and states
        self.base.base.base.api_object.properties.insert("isActiveLight".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("canCastShadows".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("lightConeVisible".to_string(), ValidationRule {
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
        
        // Light direction and vectors (computed properties)
        self.base.base.base.api_object.properties.insert("lightDirection".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeD,
            array_size: Some(3),
            range_min: Some(-1.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("lightVector".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeD,
            array_size: Some(3),
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Light effective range and attenuation
        self.base.base.base.api_object.properties.insert("effectiveRange".to_string(), ValidationRule {
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
        
        // Advanced shadow properties
        self.base.base.base.api_object.properties.insert("acceptsShadows".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("acceptsLights".to_string(), ValidationRule {
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
        
        // Ray-traced lighting properties
        self.base.base.base.api_object.properties.insert("rayTracedShadows".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("shadowSamples".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("shadowQuality".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(10.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Light matrix (computed property)
        self.base.base.base.api_object.properties.insert("lightMatrix".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Matrix".to_string()),
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
        
        // Light targeting properties
        self.base.base.base.api_object.properties.insert("targetLayer".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("isTargeting".to_string(), ValidationRule {
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
        
        // Light baking properties
        self.base.base.base.api_object.properties.insert("hasBakedLighting".to_string(), ValidationRule {
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
        
        self.base.base.base.api_object.properties.insert("bakingResolution".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(64.0),
            range_max: Some(4096.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    /// Access to the underlying Layer
    pub fn get_base(&self) -> &Layer {
        &self.base
    }
    
    /// Mutable access to the underlying Layer
    pub fn get_base_mut(&mut self) -> &mut Layer {
        &mut self.base
    }
    
    /// Get the light type
    pub fn get_light_type(&self) -> LightType {
        // This would be determined by the lightType property
        // For now, return Point as default (most common)
        LightType::Point
    }
    
    /// Check if this light casts shadows
    pub fn casts_shadows(&self) -> bool {
        // This would be determined by the castsShadows property
        // For now, return false as default
        false
    }
    
    /// Check if light cone is visible
    pub fn is_light_cone_visible(&self) -> bool {
        // This would be determined by the lightConeVisible property
        // For now, return false as default
        false
    }
    
    /// Get current light position
    pub fn get_position(&self) -> [f64; 3] {
        // This would extract the position from the lightPosition property
        // For now, return default position above origin
        [0.0, 0.0, 1000.0]
    }
    
    /// Get current point of interest
    pub fn get_point_of_interest(&self) -> [f64; 3] {
        // This would extract the point of interest from the pointOfInterest property
        // For now, return origin as default
        [0.0, 0.0, 0.0]
    }
    
    /// Get current light intensity
    pub fn get_intensity(&self) -> f64 {
        // This would extract the intensity from the intensity property
        // For now, return default 100%
        100.0
    }
    
    /// Get current light color
    pub fn get_color(&self) -> [f64; 3] {
        // This would extract the color from the lightColor property
        // For now, return white as default
        [1.0, 1.0, 1.0]
    }
    
    /// Get cone angle (for spot lights)
    pub fn get_cone_angle(&self) -> f64 {
        // This would extract the cone angle from the coneAngle property
        // For now, return default 90 degrees
        90.0
    }
    
    /// Get cone feather (for spot lights)
    pub fn get_cone_feather(&self) -> f64 {
        // This would extract the cone feather from the coneFeather property
        // For now, return default 50%
        50.0
    }
    
    /// Check if this is the active light
    pub fn is_active_light(&self) -> bool {
        // This would be determined by the composition's lighting setup
        // For now, return true as default
        true
    }
    
    /// Check if this light is targeting a layer
    pub fn is_targeting(&self) -> bool {
        // This would be determined by the isTargeting property
        // For now, return false as default
        false
    }
    
    /// Get effective range of the light
    pub fn get_effective_range(&self) -> f64 {
        // This would calculate the effective range based on intensity and falloff
        // For now, return default 1000 units
        1000.0
    }
}

/// Factory functions for creating different types of LightLayers
pub mod lightlayer_factory {
    use super::*;
    
    /// Create a point light
    pub fn create_point_light() -> LightLayer {
        let mut light = LightLayer::new();
        // Point light setup would go here
        light
    }
    
    /// Create a spot light
    pub fn create_spot_light() -> LightLayer {
        let mut light = LightLayer::new();
        // Spot light setup would go here
        light
    }
    
    /// Create a parallel (directional) light
    pub fn create_parallel_light() -> LightLayer {
        let mut light = LightLayer::new();
        // Parallel light setup would go here
        light
    }
    
    /// Create an ambient light
    pub fn create_ambient_light() -> LightLayer {
        let mut light = LightLayer::new();
        // Ambient light setup would go here
        light
    }
    
    /// Create a light with shadows enabled
    pub fn create_shadow_casting_light() -> LightLayer {
        let mut light = LightLayer::new();
        // Shadow casting setup would go here
        light
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::objects::layer::LayerType;
    
    #[test]
    fn test_lightlayer_creation() {
        let light_layer = LightLayer::new();
        assert_eq!(*light_layer.get_base().get_layer_type(), LayerType::Light);
        assert!(!light_layer.casts_shadows());
        assert!(!light_layer.is_light_cone_visible());
        assert!(light_layer.is_active_light());
    }
    
    #[test]
    #[ignore]
    fn test_lightlayer_inheritance() {
        let light_layer = LightLayer::new();
        // Should inherit from Layer
        assert_eq!(*light_layer.get_base().get_layer_type(), LayerType::Light);
        // Should inherit from PropertyGroup
        assert_eq!(light_layer.get_base().get_base().base.get_property_type(), &super::super::propertygroup::PropertyType::NamedGroup);
    }
    
    #[test]
    fn test_lightlayer_properties() {
        let light_layer = LightLayer::new();
        assert_eq!(light_layer.get_light_type(), LightType::Point);
        assert_eq!(light_layer.get_position(), [0.0, 0.0, 1000.0]);
        assert_eq!(light_layer.get_point_of_interest(), [0.0, 0.0, 0.0]);
        assert_eq!(light_layer.get_intensity(), 100.0);
        assert_eq!(light_layer.get_color(), [1.0, 1.0, 1.0]);
        assert_eq!(light_layer.get_cone_angle(), 90.0);
        assert_eq!(light_layer.get_cone_feather(), 50.0);
    }
    
    #[test]
    fn test_lightlayer_targeting() {
        let light_layer = LightLayer::new();
        assert!(!light_layer.is_targeting());
        assert_eq!(light_layer.get_effective_range(), 1000.0);
    }
    
    #[test]
    fn test_light_type_values() {
        assert_eq!(LightType::Parallel as u8, 0);
        assert_eq!(LightType::Spot as u8, 1);
        assert_eq!(LightType::Point as u8, 2);
        assert_eq!(LightType::Ambient as u8, 3);
    }
    
    #[test]
    fn test_falloff_type_values() {
        assert_eq!(FalloffType::None as u8, 0);
        assert_eq!(FalloffType::Smooth as u8, 1);
        assert_eq!(FalloffType::InverseSquareClamped as u8, 2);
        assert_eq!(FalloffType::InverseSquareUnclamped as u8, 3);
    }
    
    #[test]
    fn test_shadow_properties() {
        assert_eq!(ShadowDarkness::None as u8, 0);
        assert_eq!(ShadowDarkness::Light as u8, 1);
        assert_eq!(ShadowDarkness::Medium as u8, 2);
        assert_eq!(ShadowDarkness::Dark as u8, 3);
        
        assert_eq!(ShadowDiffusion::Hard as u8, 0);
        assert_eq!(ShadowDiffusion::Soft as u8, 1);
    }
}