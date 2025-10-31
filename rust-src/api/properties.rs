use serde_json::Value;
use std::sync::Arc;

use crate::validation::context::ValidationContext;
use crate::validation::rules::PropertyValueType;
use super::types::{DocumentationInfo, ValidationInfo};

pub struct PropertyValidation {
    pub value_type: PropertyValueType,
    pub range: Option<(f64, f64)>,
    pub array_size: Option<usize>,
    pub temporal_dimensions: Option<Vec<usize>>,
    pub is_spatial: bool,
    pub requires_expression: bool,
    pub custom_validator: Option<Arc<dyn Fn(&Value, &ValidationContext) -> Result<(), String> + Send + Sync>>,
    pub documentation: Option<DocumentationInfo>,
    pub validation_info: Option<ValidationInfo>,
}

impl PropertyValidation {
    pub fn new(value_type: PropertyValueType) -> Self {
        PropertyValidation {
            value_type,
            range: None,
            array_size: None,
            temporal_dimensions: None,
            is_spatial: false,
            requires_expression: false,
            custom_validator: None,
            documentation: None,
            validation_info: None,
        }
    }

    pub fn with_range(mut self, min: f64, max: f64) -> Self {
        self.range = Some((min, max));
        self
    }

    pub fn with_array_size(mut self, size: usize) -> Self {
        self.array_size = Some(size);
        self
    }

    pub fn with_temporal_dimensions(mut self, dimensions: Vec<usize>) -> Self {
        self.temporal_dimensions = Some(dimensions);
        self
    }

    pub fn with_custom_validator(mut self, validator: Arc<dyn Fn(&Value, &ValidationContext) -> Result<(), String> + Send + Sync>) -> Self {
        self.custom_validator = Some(validator);
        self
    }

    pub fn with_documentation(mut self, documentation: DocumentationInfo) -> Self {
        self.documentation = Some(documentation);
        self
    }

    pub fn with_validation_info(mut self, validation_info: ValidationInfo) -> Self {
        self.validation_info = Some(validation_info);
        self
    }

    pub fn validate(&self, value: &Value, context: &ValidationContext) -> Result<(), String> {
        // Validate type
        if !self.validate_type(value) {
            return Err(format!("Invalid type for value: expected {:?}", self.value_type));
        }

        // Validate range if specified
        if let Some((min, max)) = self.range {
            if let Value::Number(num) = value {
                let val = num.as_f64().unwrap();
                if val < min || val > max {
                    return Err(format!("Value must be between {} and {}", min, max));
                }
            }
        }

        // Validate array size if specified
        if let Some(size) = self.array_size {
            if let Value::Array(arr) = value {
                if arr.len() != size {
                    return Err(format!("Array must have size {}", size));
                }
            }
        }

        // Run custom validator if present
        if let Some(ref validator) = self.custom_validator {
            validator(value, context)?;
        }

        Ok(())
    }

    fn validate_type(&self, value: &Value) -> bool {
        match (&self.value_type, value) {
            (PropertyValueType::NoValue, Value::Null) => true,
            (PropertyValueType::OneD, Value::Number(_)) => true,
            (PropertyValueType::TwoD, Value::Array(arr)) => arr.len() == 2,
            (PropertyValueType::ThreeD, Value::Array(arr)) => arr.len() == 3,
            (PropertyValueType::Color, Value::Array(arr)) => arr.len() == 4,
            (PropertyValueType::TextDocument, Value::String(_)) => true,
            (PropertyValueType::Shape, Value::Object(_)) => true,
            (PropertyValueType::LayerIndex, Value::Number(n)) => n.as_f64().map_or(false, |x| x >= 0.0),
            (PropertyValueType::MaskIndex, Value::Number(n)) => n.as_f64().map_or(false, |x| x >= 0.0),
            (PropertyValueType::Custom(_), _) => true, // Custom types need their own validation
            _ => false,
        }
    }
} 