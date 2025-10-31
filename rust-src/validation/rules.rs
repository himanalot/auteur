use std::collections::HashMap;
use serde_json::Value;
use std::fmt;

#[derive(Clone, PartialEq)]
pub enum PropertyValueType {
    NoValue,
    ThreeDSpatial,  // Array of three floating-point positional values
    ThreeD,         // Array of three floating-point quantitative values
    TwoDSpatial,    // Array of two floating-point positional values
    TwoD,           // Array of two floating-point quantitative values
    OneD,           // Single floating-point value
    Color,          // Array of 4 floating-point values [0.0..1.0]
    CustomValue,    // For custom property values
    Marker,         // MarkerValue object
    LayerIndex,     // Integer (0 means no layer)
    MaskIndex,      // Integer (0 means no mask)
    Shape,          // Shape object
    TextDocument,   // TextDocument object
    ArbText,        // Arbitrary text string
    Custom(String), // Custom property type with name
}

impl fmt::Debug for PropertyValueType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PropertyValueType::NoValue => write!(f, "NoValue"),
            PropertyValueType::ThreeDSpatial => write!(f, "ThreeDSpatial"),
            PropertyValueType::ThreeD => write!(f, "ThreeD"),
            PropertyValueType::TwoDSpatial => write!(f, "TwoDSpatial"),
            PropertyValueType::TwoD => write!(f, "TwoD"),
            PropertyValueType::OneD => write!(f, "OneD"),
            PropertyValueType::Color => write!(f, "Color"),
            PropertyValueType::CustomValue => write!(f, "CustomValue"),
            PropertyValueType::Marker => write!(f, "Marker"),
            PropertyValueType::LayerIndex => write!(f, "LayerIndex"),
            PropertyValueType::MaskIndex => write!(f, "MaskIndex"),
            PropertyValueType::Shape => write!(f, "Shape"),
            PropertyValueType::TextDocument => write!(f, "TextDocument"),
            PropertyValueType::ArbText => write!(f, "ArbText"),
            PropertyValueType::Custom(name) => write!(f, "Custom({})", name),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ArraySizeRule {
    pub parameter_name: String,
    pub property_value_type: PropertyValueType,
    pub required_size: usize,
    pub description: String,
}

#[derive(Debug, Clone)]
pub struct RangeValidation {
    pub parameter_name: String,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub description: String,
}

pub struct ValidationRule {
    pub value_type: PropertyValueType,
    pub array_size: Option<usize>,
    pub range_min: Option<f64>,
    pub range_max: Option<f64>,
    pub is_spatial: bool,
    pub can_vary_over_time: bool,
    pub dimensions_separated: bool,
    pub is_dropdown: bool,
    pub allowed_values: Option<Vec<String>>,
    pub custom_validator: Option<Box<dyn Fn(&Value) -> Result<(), String> + Send + Sync>>,
}

impl Clone for ValidationRule {
    fn clone(&self) -> Self {
        ValidationRule {
            value_type: self.value_type.clone(),
            array_size: self.array_size,
            range_min: self.range_min,
            range_max: self.range_max,
            is_spatial: self.is_spatial,
            can_vary_over_time: self.can_vary_over_time,
            dimensions_separated: self.dimensions_separated,
            is_dropdown: self.is_dropdown,
            allowed_values: self.allowed_values.clone(),
            custom_validator: None, // We can't clone function pointers
        }
    }
}

impl fmt::Debug for ValidationRule {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("ValidationRule")
            .field("value_type", &self.value_type)
            .field("array_size", &self.array_size)
            .field("range_min", &self.range_min)
            .field("range_max", &self.range_max)
            .field("is_spatial", &self.is_spatial)
            .field("can_vary_over_time", &self.can_vary_over_time)
            .field("dimensions_separated", &self.dimensions_separated)
            .field("is_dropdown", &self.is_dropdown)
            .field("allowed_values", &self.allowed_values)
            .field("custom_validator", &"<function>")
            .finish()
    }
}

impl ValidationRule {
    pub fn simple(value_type: PropertyValueType) -> Self {
        ValidationRule {
            value_type,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        }
    }

    pub fn with_range(mut self, min: f64, max: f64) -> Self {
        self.range_min = Some(min);
        self.range_max = Some(max);
        self
    }

    pub fn with_array_size(mut self, size: usize) -> Self {
        self.array_size = Some(size);
        self
    }

    pub fn with_spatial(mut self) -> Self {
        self.is_spatial = true;
        self
    }

    pub fn with_temporal(mut self) -> Self {
        self.can_vary_over_time = true;
        self
    }

    pub fn with_separated_dimensions(mut self) -> Self {
        self.dimensions_separated = true;
        self
    }

    pub fn with_dropdown(mut self, values: Vec<String>) -> Self {
        self.is_dropdown = true;
        self.allowed_values = Some(values);
        self
    }

    pub fn with_validator<F>(mut self, validator: F) -> Self
    where
        F: Fn(&Value) -> Result<(), String> + Send + Sync + 'static,
    {
        self.custom_validator = Some(Box::new(validator));
        self
    }

    pub fn validate(&self, value: &Value) -> Result<(), String> {
        // Use custom validator if available
        if let Some(ref validator) = self.custom_validator {
            return validator(value);
        }

        // Basic type validation based on value_type
        match &self.value_type {
            PropertyValueType::Custom(type_name) => {
                // For custom types, just ensure value is not null
                if value.is_null() {
                    Err(format!("Value cannot be null for type {}", type_name))
                } else {
                    Ok(())
                }
            }
            PropertyValueType::OneD => {
                if value.is_number() {
                    if let (Some(min), Some(max)) = (self.range_min, self.range_max) {
                        if let Some(num) = value.as_f64() {
                            if num < min || num > max {
                                return Err(format!("Value {} is outside range [{}, {}]", num, min, max));
                            }
                        }
                    }
                    Ok(())
                } else {
                    Err("Expected a number".to_string())
                }
            }
            PropertyValueType::TwoD | PropertyValueType::TwoDSpatial => {
                if let Some(arr) = value.as_array() {
                    if arr.len() == 2 && arr.iter().all(|v| v.is_number()) {
                        Ok(())
                    } else {
                        Err("Expected array of 2 numbers".to_string())
                    }
                } else {
                    Err("Expected array for 2D value".to_string())
                }
            }
            PropertyValueType::ThreeD | PropertyValueType::ThreeDSpatial => {
                if let Some(arr) = value.as_array() {
                    if arr.len() == 3 && arr.iter().all(|v| v.is_number()) {
                        Ok(())
                    } else {
                        Err("Expected array of 3 numbers".to_string())
                    }
                } else {
                    Err("Expected array for 3D value".to_string())
                }
            }
            PropertyValueType::Color => {
                if let Some(arr) = value.as_array() {
                    if arr.len() == 4 && arr.iter().all(|v| v.is_number()) {
                        // Validate color range [0.0, 1.0]
                        for v in arr {
                            if let Some(num) = v.as_f64() {
                                if num < 0.0 || num > 1.0 {
                                    return Err(format!("Color component {} is outside range [0.0, 1.0]", num));
                                }
                            }
                        }
                        Ok(())
                    } else {
                        Err("Expected array of 4 numbers for color value".to_string())
                    }
                } else {
                    Err("Expected array for color value".to_string())
                }
            }
            _ => Ok(()), // For other types, basic validation passes
        }
    }
}

#[derive(Debug, Clone)]
pub struct MethodValidation {
    pub param_count: usize,
    pub param_types: Vec<PropertyValueType>,
    pub optional_params: Vec<PropertyValueType>,
    pub array_sizes: Option<Vec<ArraySizeRule>>,
    pub param_ranges: Option<Vec<RangeValidation>>,
    pub property_type_requirements: Option<Vec<PropertyValueType>>,
    pub temporal_dimensions: Option<usize>,
    pub is_spatial: bool,
    pub requires_expression: bool,
}

impl MethodValidation {
    pub fn new(param_count: usize) -> Self {
        MethodValidation {
            param_count,
            param_types: Vec::new(),
            optional_params: Vec::new(),
            array_sizes: None,
            param_ranges: None,
            property_type_requirements: None,
            temporal_dimensions: None,
            is_spatial: false,
            requires_expression: false,
        }
    }

    pub fn with_param_types(mut self, types: Vec<PropertyValueType>) -> Self {
        self.param_types = types;
        self
    }
    
    pub fn with_optional_params(mut self, types: Vec<PropertyValueType>) -> Self {
        self.optional_params = types;
        self
    }

    pub fn with_array_sizes(mut self, sizes: Vec<ArraySizeRule>) -> Self {
        self.array_sizes = Some(sizes);
        self
    }

    pub fn with_param_ranges(mut self, ranges: Vec<RangeValidation>) -> Self {
        self.param_ranges = Some(ranges);
        self
    }

    pub fn with_spatial(mut self) -> Self {
        self.is_spatial = true;
        self
    }

    pub fn with_temporal_dimensions(mut self, dimensions: usize) -> Self {
        self.temporal_dimensions = Some(dimensions);
        self
    }

    pub fn requires_expression(mut self) -> Self {
        self.requires_expression = true;
        self
    }
} 