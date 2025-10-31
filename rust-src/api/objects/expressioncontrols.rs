use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

/// Base struct for all expression control effects
pub struct ExpressionControl {
    api_object: ApiObject,
}

impl ExpressionControl {
    pub fn new(control_type: &str) -> Self {
        let mut control = Self {
            api_object: ApiObject::new(ObjectContext::Property(format!("ExpressionControl::{}", control_type))),
        };
        
        control.initialize_base_properties();
        control
    }
    
    fn initialize_base_properties(&mut self) {
        // All expression controls have these common properties
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
        
        self.api_object.properties.insert("enabled".to_string(), ValidationRule {
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
}

/// 3D Point Control - ADBE Point3D Control
pub struct Point3DControl {
    base: ExpressionControl,
}

impl Point3DControl {
    pub fn new() -> Self {
        let mut control = Self {
            base: ExpressionControl::new("Point3D"),
        };
        
        control.initialize_properties();
        control
    }
    
    fn initialize_properties(&mut self) {
        // 3D Point property
        self.base.api_object.properties.insert("3D Point".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeDSpatial,
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
    }
}

/// Angle Control - ADBE Angle Control
pub struct AngleControl {
    base: ExpressionControl,
}

impl AngleControl {
    pub fn new() -> Self {
        let mut control = Self {
            base: ExpressionControl::new("Angle"),
        };
        
        control.initialize_properties();
        control
    }
    
    fn initialize_properties(&mut self) {
        // Angle property
        self.base.api_object.properties.insert("Angle".to_string(), ValidationRule {
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
    }
}

/// Checkbox Control - ADBE Checkbox Control
pub struct CheckboxControl {
    base: ExpressionControl,
}

impl CheckboxControl {
    pub fn new() -> Self {
        let mut control = Self {
            base: ExpressionControl::new("Checkbox"),
        };
        
        control.initialize_properties();
        control
    }
    
    fn initialize_properties(&mut self) {
        // Checkbox property
        self.base.api_object.properties.insert("Checkbox".to_string(), ValidationRule {
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
    }
}

/// Color Control - ADBE Color Control
pub struct ColorControl {
    base: ExpressionControl,
}

impl ColorControl {
    pub fn new() -> Self {
        let mut control = Self {
            base: ExpressionControl::new("Color"),
        };
        
        control.initialize_properties();
        control
    }
    
    fn initialize_properties(&mut self) {
        // Color property
        self.base.api_object.properties.insert("Color".to_string(), ValidationRule {
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
    }
}

/// Dropdown Control - ADBE Dropdown Control
pub struct DropdownControl {
    base: ExpressionControl,
}

impl DropdownControl {
    pub fn new() -> Self {
        let mut control = Self {
            base: ExpressionControl::new("Dropdown"),
        };
        
        control.initialize_properties();
        control.initialize_methods();
        control
    }
    
    fn initialize_properties(&mut self) {
        // Menu property
        self.base.api_object.properties.insert("Menu".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    fn initialize_methods(&mut self) {
        // Dropdown has special methods for menu management
        self.base.api_object.methods.insert("setPropertyParameters".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Array".to_string())  // menu items
            ]));
    }
}

/// Layer Control - ADBE Layer Control
pub struct LayerControl {
    base: ExpressionControl,
}

impl LayerControl {
    pub fn new() -> Self {
        let mut control = Self {
            base: ExpressionControl::new("Layer"),
        };
        
        control.initialize_properties();
        control
    }
    
    fn initialize_properties(&mut self) {
        // Layer property
        self.base.api_object.properties.insert("Layer".to_string(), ValidationRule {
            value_type: PropertyValueType::LayerIndex,
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
    }
}

/// Point Control - ADBE Point Control
pub struct PointControl {
    base: ExpressionControl,
}

impl PointControl {
    pub fn new() -> Self {
        let mut control = Self {
            base: ExpressionControl::new("Point"),
        };
        
        control.initialize_properties();
        control
    }
    
    fn initialize_properties(&mut self) {
        // Point property
        self.base.api_object.properties.insert("Point".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoDSpatial,
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
    }
}

/// Slider Control - ADBE Slider Control
pub struct SliderControl {
    base: ExpressionControl,
}

impl SliderControl {
    pub fn new() -> Self {
        let mut control = Self {
            base: ExpressionControl::new("Slider"),
        };
        
        control.initialize_properties();
        control
    }
    
    fn initialize_properties(&mut self) {
        // Slider property
        self.base.api_object.properties.insert("Slider".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: None,  // Can be set by user
            range_max: None,  // Can be set by user
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
}

/// Factory function to create expression control based on match name
pub fn create_expression_control(match_name: &str) -> Option<ExpressionControl> {
    match match_name {
        "ADBE Point3D Control" => Some(Point3DControl::new().base),
        "ADBE Angle Control" => Some(AngleControl::new().base),
        "ADBE Checkbox Control" => Some(CheckboxControl::new().base),
        "ADBE Color Control" => Some(ColorControl::new().base),
        "ADBE Dropdown Control" => Some(DropdownControl::new().base),
        "ADBE Layer Control" => Some(LayerControl::new().base),
        "ADBE Point Control" => Some(PointControl::new().base),
        "ADBE Slider Control" => Some(SliderControl::new().base),
        _ => None,
    }
}