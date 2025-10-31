use std::collections::HashMap;
use crate::validation::rules::{ValidationRule, PropertyValueType};

// Keyframe interpolation types
#[derive(Debug, Clone, PartialEq)]
pub enum KeyframeInterpolationType {
    Linear,
    Bezier,
    Hold,
    Continuous,
    Auto,
}

// Temporal ease structure
#[derive(Debug, Clone)]
pub struct KeyframeTemporal {
    pub speed: f32,
    pub influence: f32,
}

impl KeyframeTemporal {
    pub fn new(speed: f32, influence: f32) -> Self {
        Self { speed, influence }
    }
    
    pub fn default_ease() -> Self {
        Self {
            speed: 0.0,
            influence: 16.66667,
        }
    }
    
    pub fn validate(&self) -> Result<(), String> {
        if self.influence < 0.0 || self.influence > 100.0 {
            return Err("Temporal ease influence must be between 0 and 100".to_string());
        }
        Ok(())
    }
}

// Spatial tangent structure for position properties
#[derive(Debug, Clone)]
pub struct SpatialTangent {
    pub x: f32,
    pub y: f32,
    pub z: Option<f32>,
}

impl SpatialTangent {
    pub fn new_2d(x: f32, y: f32) -> Self {
        Self { x, y, z: None }
    }
    
    pub fn new_3d(x: f32, y: f32, z: f32) -> Self {
        Self { x, y, z: Some(z) }
    }
}

// Advanced interpolation validator
pub struct InterpolationValidator;

impl InterpolationValidator {
    pub fn validate_interpolation_type(
        property_type: &PropertyValueType,
        interp_type: &KeyframeInterpolationType,
    ) -> Result<(), String> {
        match property_type {
            PropertyValueType::Marker => {
                if *interp_type != KeyframeInterpolationType::Hold {
                    return Err("Marker properties only support Hold interpolation".to_string());
                }
            }
            PropertyValueType::Custom(name) if name == "Boolean" => {
                if *interp_type != KeyframeInterpolationType::Hold {
                    return Err("Boolean properties only support Hold interpolation".to_string());
                }
            }
            PropertyValueType::LayerIndex | PropertyValueType::MaskIndex => {
                if *interp_type != KeyframeInterpolationType::Hold {
                    return Err("Index properties only support Hold interpolation".to_string());
                }
            }
            PropertyValueType::TextDocument => {
                if *interp_type != KeyframeInterpolationType::Hold {
                    return Err("TextDocument properties only support Hold interpolation".to_string());
                }
            }
            _ => {
                // Other property types support all interpolation types
            }
        }
        Ok(())
    }
    
    pub fn validate_temporal_ease(
        property_type: &PropertyValueType,
        ease: &KeyframeTemporal,
    ) -> Result<(), String> {
        ease.validate()?;
        
        // Check if property type supports temporal easing
        match property_type {
            PropertyValueType::Marker |
            PropertyValueType::LayerIndex |
            PropertyValueType::MaskIndex |
            PropertyValueType::TextDocument => {
                return Err("This property type does not support temporal easing".to_string());
            }
            PropertyValueType::Custom(name) if name == "Boolean" => {
                return Err("Boolean properties do not support temporal easing".to_string());
            }
            _ => Ok(())
        }
    }
    
    pub fn validate_spatial_tangent(
        property_type: &PropertyValueType,
        tangent: &SpatialTangent,
    ) -> Result<(), String> {
        match property_type {
            PropertyValueType::TwoD | PropertyValueType::TwoDSpatial => {
                if tangent.z.is_some() {
                    return Err("2D properties cannot have z-component in spatial tangents".to_string());
                }
            }
            PropertyValueType::ThreeD | PropertyValueType::ThreeDSpatial => {
                if tangent.z.is_none() {
                    return Err("3D properties must have z-component in spatial tangents".to_string());
                }
            }
            _ => {
                return Err("This property type does not support spatial tangents".to_string());
            }
        }
        Ok(())
    }
}

// Interpolation helpers for different property types
pub struct InterpolationHelpers;

impl InterpolationHelpers {
    pub fn get_default_temporal_ease() -> Vec<KeyframeTemporal> {
        vec![KeyframeTemporal::default_ease()]
    }
    
    pub fn get_default_temporal_ease_multidim(dimensions: usize) -> Vec<KeyframeTemporal> {
        (0..dimensions).map(|_| KeyframeTemporal::default_ease()).collect()
    }
    
    pub fn calculate_bezier_influence(speed: f32, key_distance: f32) -> f32 {
        // Calculate appropriate influence based on speed and keyframe distance
        let base_influence = 16.66667;
        let speed_factor = (speed.abs() / 1000.0).min(2.0);
        let distance_factor = (key_distance / 30.0).min(2.0); // Assuming 30fps
        
        base_influence * (1.0 + speed_factor) * distance_factor
    }
    
    pub fn validate_roving_keyframe(
        property_type: &PropertyValueType,
        is_spatial: bool,
    ) -> Result<(), String> {
        if !is_spatial {
            return Err("Roving keyframes are only valid for spatial properties".to_string());
        }
        
        match property_type {
            PropertyValueType::TwoDSpatial | PropertyValueType::ThreeDSpatial => Ok(()),
            _ => Err("Property type does not support roving keyframes".to_string()),
        }
    }
}

// Expression interpolation validator
pub struct ExpressionInterpolation;

impl ExpressionInterpolation {
    pub fn validate_expression_with_keyframes(
        has_expression: bool,
        num_keyframes: usize,
    ) -> Result<(), String> {
        if has_expression && num_keyframes > 0 {
            // Expressions can override keyframes, this is valid
            Ok(())
        } else {
            Ok(())
        }
    }
    
    pub fn can_interpolate_expression_result(property_type: &PropertyValueType) -> bool {
        match property_type {
            PropertyValueType::OneD |
            PropertyValueType::TwoD |
            PropertyValueType::ThreeD |
            PropertyValueType::TwoDSpatial |
            PropertyValueType::ThreeDSpatial |
            PropertyValueType::Color => true,
            _ => false,
        }
    }
}

// Advanced easing curves
pub struct EasingCurves;

impl EasingCurves {
    pub fn linear(t: f32) -> f32 {
        t
    }
    
    pub fn ease_in(t: f32) -> f32 {
        t * t
    }
    
    pub fn ease_out(t: f32) -> f32 {
        1.0 - (1.0 - t) * (1.0 - t)
    }
    
    pub fn ease_in_out(t: f32) -> f32 {
        if t < 0.5 {
            2.0 * t * t
        } else {
            1.0 - (-2.0 * t + 2.0).powi(2) / 2.0
        }
    }
    
    pub fn cubic_bezier(t: f32, p1: f32, p2: f32) -> f32 {
        let t2 = t * t;
        let t3 = t2 * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;
        let mt3 = mt2 * mt;
        
        mt3 + 3.0 * mt2 * t * p1 + 3.0 * mt * t2 * p2 + t3
    }
}

// Motion path interpolation
pub struct MotionPathInterpolation;

impl MotionPathInterpolation {
    pub fn validate_auto_orient(
        property_type: &PropertyValueType,
        is_spatial: bool,
    ) -> Result<(), String> {
        if !is_spatial {
            return Err("Auto-orient is only valid for spatial properties".to_string());
        }
        
        match property_type {
            PropertyValueType::TwoDSpatial | PropertyValueType::ThreeDSpatial => Ok(()),
            _ => Err("Property type does not support auto-orient".to_string()),
        }
    }
    
    pub fn calculate_path_tangent_angle(
        prev_pos: &[f32],
        next_pos: &[f32],
    ) -> Result<f32, String> {
        if prev_pos.len() < 2 || next_pos.len() < 2 {
            return Err("Position arrays must have at least 2 components".to_string());
        }
        
        let dx = next_pos[0] - prev_pos[0];
        let dy = next_pos[1] - prev_pos[1];
        
        Ok(dy.atan2(dx).to_degrees())
    }
}

// Graph editor helper functions
pub struct GraphEditorHelpers;

impl GraphEditorHelpers {
    pub fn get_value_graph_range(
        property_type: &PropertyValueType,
        values: &[f32],
    ) -> (f32, f32) {
        let min = values.iter().fold(f32::INFINITY, |a, &b| a.min(b));
        let max = values.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
        
        // Add some padding for better visualization
        let range = max - min;
        let padding = range * 0.1;
        
        (min - padding, max + padding)
    }
    
    pub fn get_speed_graph_range(speeds: &[f32]) -> (f32, f32) {
        let max_speed = speeds.iter().fold(0.0f32, |a, &b| a.max(b.abs()));
        (-max_speed * 1.2, max_speed * 1.2)
    }
    
    pub fn snap_to_grid(value: f32, grid_size: f32) -> f32 {
        (value / grid_size).round() * grid_size
    }
}

// Interpolation properties for the Property object
pub fn get_interpolation_properties() -> HashMap<String, ValidationRule> {
    let mut props = HashMap::new();
    
    // Keyframe interpolation properties
    props.insert("keyInInterpolationType".to_string(), ValidationRule {
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
            "CONTINUOUS".to_string(),
            "AUTO".to_string(),
        ]),
        custom_validator: None,
    });
    
    props.insert("keyOutInterpolationType".to_string(), ValidationRule {
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
            "CONTINUOUS".to_string(),
            "AUTO".to_string(),
        ]),
        custom_validator: None,
    });
    
    // Temporal ease properties
    props.insert("keyInTemporalEase".to_string(), ValidationRule {
        value_type: PropertyValueType::Custom("Array<KeyframeTemporal>".to_string()),
        array_size: None,
        range_min: None,
        range_max: None,
        is_spatial: false,
        can_vary_over_time: false,
        dimensions_separated: false,
        is_dropdown: false,
        allowed_values: None,
        custom_validator: Some(Box::new(|value| {
            // Validate temporal ease array structure
            Ok(())
        })),
    });
    
    props.insert("keyOutTemporalEase".to_string(), ValidationRule {
        value_type: PropertyValueType::Custom("Array<KeyframeTemporal>".to_string()),
        array_size: None,
        range_min: None,
        range_max: None,
        is_spatial: false,
        can_vary_over_time: false,
        dimensions_separated: false,
        is_dropdown: false,
        allowed_values: None,
        custom_validator: Some(Box::new(|value| {
            // Validate temporal ease array structure
            Ok(())
        })),
    });
    
    // Spatial tangent properties
    props.insert("keyInSpatialTangent".to_string(), ValidationRule {
        value_type: PropertyValueType::Custom("Array".to_string()),
        array_size: None,
        range_min: None,
        range_max: None,
        is_spatial: true,
        can_vary_over_time: false,
        dimensions_separated: false,
        is_dropdown: false,
        allowed_values: None,
        custom_validator: Some(Box::new(|value| {
            // Validate spatial tangent array structure
            Ok(())
        })),
    });
    
    props.insert("keyOutSpatialTangent".to_string(), ValidationRule {
        value_type: PropertyValueType::Custom("Array".to_string()),
        array_size: None,
        range_min: None,
        range_max: None,
        is_spatial: true,
        can_vary_over_time: false,
        dimensions_separated: false,
        is_dropdown: false,
        allowed_values: None,
        custom_validator: Some(Box::new(|value| {
            // Validate spatial tangent array structure
            Ok(())
        })),
    });
    
    // Auto-bezier and continuous properties
    props.insert("keyTemporalAutoBezier".to_string(), ValidationRule {
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
    
    props.insert("keyTemporalContinuous".to_string(), ValidationRule {
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
    
    props.insert("keySpatialAutoBezier".to_string(), ValidationRule {
        value_type: PropertyValueType::Custom("Boolean".to_string()),
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
    
    props.insert("keySpatialContinuous".to_string(), ValidationRule {
        value_type: PropertyValueType::Custom("Boolean".to_string()),
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
    
    // Roving keyframe property
    props.insert("keyRoving".to_string(), ValidationRule {
        value_type: PropertyValueType::Custom("Boolean".to_string()),
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
    
    props
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_temporal_ease_validation() {
        let valid_ease = KeyframeTemporal::new(100.0, 50.0);
        assert!(valid_ease.validate().is_ok());
        
        let invalid_ease = KeyframeTemporal::new(100.0, 150.0);
        assert!(invalid_ease.validate().is_err());
    }
    
    #[test]
    fn test_interpolation_type_validation() {
        // Marker properties should only support Hold
        let result = InterpolationValidator::validate_interpolation_type(
            &PropertyValueType::Marker,
            &KeyframeInterpolationType::Bezier,
        );
        assert!(result.is_err());
        
        // OneD properties should support all interpolation types
        let result = InterpolationValidator::validate_interpolation_type(
            &PropertyValueType::OneD,
            &KeyframeInterpolationType::Bezier,
        );
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_easing_curves() {
        assert_eq!(EasingCurves::linear(0.5), 0.5);
        assert_eq!(EasingCurves::ease_in(0.5), 0.25);
        assert_eq!(EasingCurves::ease_out(0.5), 0.75);
    }
}