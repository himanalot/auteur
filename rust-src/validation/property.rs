use super::rules::{ValidationRule, PropertyValueType};
use serde_json::Value;

pub fn validate_property_value(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    match &rule.value_type {
        PropertyValueType::NoValue => {
            if !value.is_null() {
                Err("Property does not store any value".to_string())
            } else {
                Ok(())
            }
        },
        PropertyValueType::OneD => validate_one_d(value, rule),
        PropertyValueType::TwoD | PropertyValueType::TwoDSpatial => validate_two_d(value, rule),
        PropertyValueType::ThreeD | PropertyValueType::ThreeDSpatial => validate_three_d(value, rule),
        PropertyValueType::Color => validate_color(value, rule),
        PropertyValueType::Marker => validate_marker(value, rule),
        PropertyValueType::LayerIndex => validate_layer_index(value),
        PropertyValueType::MaskIndex => validate_mask_index(value),
        PropertyValueType::Shape => validate_shape(value, rule),
        PropertyValueType::TextDocument => validate_text_document(value, rule),
        PropertyValueType::ArbText => validate_arb_text(value),
        PropertyValueType::CustomValue | PropertyValueType::Custom(_) => validate_custom(value, rule),
    }
}

pub fn validate_one_d(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    match value {
        Value::Number(n) => {
            if let Some(f) = n.as_f64() {
                validate_range(f, rule)?;
                Ok(())
            } else {
                Err("Value must be a number".to_string())
            }
        }
        _ => Err("Value must be a number".to_string()),
    }
}

pub fn validate_two_d(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    validate_array_size(value, 2)?;
    if let Value::Array(arr) = value {
        for v in arr {
            if let Value::Number(n) = v {
                if let Some(f) = n.as_f64() {
                    validate_range(f, rule)?;
                } else {
                    return Err("Array values must be numbers".to_string());
                }
            } else {
                return Err("Array values must be numbers".to_string());
            }
        }
        Ok(())
    } else {
        Err("Value must be an array".to_string())
    }
}

pub fn validate_three_d(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    validate_array_size(value, 3)?;
    if let Value::Array(arr) = value {
        for v in arr {
            if let Value::Number(n) = v {
                if let Some(f) = n.as_f64() {
                    validate_range(f, rule)?;
                } else {
                    return Err("Array values must be numbers".to_string());
                }
            } else {
                return Err("Array values must be numbers".to_string());
            }
        }
        Ok(())
    } else {
        Err("Value must be an array".to_string())
    }
}

pub fn validate_color(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    validate_array_size(value, 4)?;
    if let Value::Array(arr) = value {
        for v in arr {
            if let Value::Number(n) = v {
                if let Some(f) = n.as_f64() {
                    if f < 0.0 || f > 1.0 {
                        return Err("Color values must be between 0 and 1".to_string());
                    }
                } else {
                    return Err("Array values must be numbers".to_string());
                }
            } else {
                return Err("Array values must be numbers".to_string());
            }
        }
        Ok(())
    } else {
        Err("Value must be an array".to_string())
    }
}

pub fn validate_marker(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    if let Value::Object(_) = value {
        // Basic marker validation - could be expanded based on specific requirements
        Ok(())
    } else {
        Err("Marker value must be an object".to_string())
    }
}

pub fn validate_shape(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    if let Value::Object(_) = value {
        // Basic shape validation - could be expanded based on specific requirements
        Ok(())
    } else {
        Err("Shape value must be an object".to_string())
    }
}

pub fn validate_text_document(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    if let Value::Object(_) = value {
        // Basic text document validation - could be expanded based on specific requirements
        Ok(())
    } else {
        Err("TextDocument value must be an object".to_string())
    }
}

pub fn validate_arb_text(value: &Value) -> Result<(), String> {
    if let Value::String(_) = value {
        Ok(())
    } else {
        Err("Value must be a string".to_string())
    }
}

pub fn validate_layer_index(value: &Value) -> Result<(), String> {
    if let Value::Number(n) = value {
        if let Some(i) = n.as_i64() {
            if i >= 0 {
                Ok(())
            } else {
                Err("Layer index must be non-negative".to_string())
            }
        } else {
            Err("Layer index must be an integer".to_string())
        }
    } else {
        Err("Layer index must be a number".to_string())
    }
}

pub fn validate_mask_index(value: &Value) -> Result<(), String> {
    if let Value::Number(n) = value {
        if let Some(i) = n.as_i64() {
            if i >= 0 {
                Ok(())
            } else {
                Err("Mask index must be non-negative".to_string())
            }
        } else {
            Err("Mask index must be an integer".to_string())
        }
    } else {
        Err("Mask index must be a number".to_string())
    }
}

pub fn validate_custom(value: &Value, rule: &ValidationRule) -> Result<(), String> {
    if let Some(validator) = &rule.custom_validator {
        validator(value)
    } else {
        // If no custom validator is provided, accept any value
        Ok(())
    }
}

fn validate_array_size(value: &Value, expected_size: usize) -> Result<(), String> {
    if let Value::Array(arr) = value {
        if arr.len() == expected_size {
            Ok(())
        } else {
            Err(format!("Array must have exactly {} elements", expected_size))
        }
    } else {
        Err("Value must be an array".to_string())
    }
}

fn validate_range(value: f64, rule: &ValidationRule) -> Result<(), String> {
    if let Some(min) = rule.range_min {
        if value < min {
            return Err(format!("Value {} is less than minimum {}", value, min));
        }
    }
    if let Some(max) = rule.range_max {
        if value > max {
            return Err(format!("Value {} is greater than maximum {}", value, max));
        }
    }
    Ok(())
}

#[derive(Debug, Clone)]
pub struct PropertyValidation {
    pub value_type: PropertyValueType,
    pub range_min: Option<f64>,
    pub range_max: Option<f64>,
    pub array_size: Option<usize>,
    pub dimensions_separated: bool,
    pub pre_expression: bool,
}

impl PropertyValidation {
    pub fn new(value_type: PropertyValueType) -> Self {
        Self {
            value_type,
            range_min: None,
            range_max: None,
            array_size: None,
            dimensions_separated: false,
            pre_expression: false,
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

    pub fn with_separated_dimensions(mut self) -> Self {
        self.dimensions_separated = true;
        self
    }

    pub fn with_pre_expression(mut self) -> Self {
        self.pre_expression = true;
        self
    }

    pub fn validate_value(&self, value: &Value) -> Result<(), String> {
        // Handle separated dimensions first
        if self.dimensions_separated {
            match &self.value_type {
                PropertyValueType::ThreeD => {
                    if let Value::Array(arr) = value {
                        if arr.len() != 3 {
                            return Err("3D property requires [x, y, z] values when separated".to_string());
                        }
                        for v in arr {
                            if !v.is_number() {
                                return Err("3D property values must be numbers".to_string());
                            }
                        }
                    } else {
                        return Err("3D property requires an array value".to_string());
                    }
                }
                PropertyValueType::TwoD => {
                    if let Value::Array(arr) = value {
                        if arr.len() != 2 {
                            return Err("2D property requires [x, y] values when separated".to_string());
                        }
                        for v in arr {
                            if !v.is_number() {
                                return Err("2D property values must be numbers".to_string());
                            }
                        }
                    } else {
                        return Err("2D property requires an array value".to_string());
                    }
                }
                _ => ()
            }
            return Ok(());
        }

        // Regular property validation
        match (&self.value_type, value) {
            (PropertyValueType::OneD, Value::Number(n)) => {
                let val = n.as_f64().unwrap();
                if let Some(min) = self.range_min {
                    if val < min {
                        return Err(format!("Value must be >= {}", min));
                    }
                }
                if let Some(max) = self.range_max {
                    if val > max {
                        return Err(format!("Value must be <= {}", max));
                    }
                }
            }
            (PropertyValueType::Custom(type_name), Value::String(_)) if type_name == "String" => (),
            (PropertyValueType::Custom(type_name), Value::Bool(_)) if type_name == "Boolean" => (),
            (PropertyValueType::TwoD | PropertyValueType::ThreeD | PropertyValueType::ThreeDSpatial, Value::Array(arr)) => {
                if let Some(size) = self.array_size {
                    if arr.len() != size {
                        return Err(format!("Array must have exactly {} elements", size));
                    }
                }
            }
            (PropertyValueType::Custom(_), _) => (),
            _ => return Err(format!("Invalid value type for {:?}", self.value_type)),
        }

        Ok(())
    }
}