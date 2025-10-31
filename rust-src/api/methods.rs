use serde_json::Value;
use std::sync::Arc;

use crate::validation::context::ValidationContext;
use crate::validation::rules::PropertyValueType;
use super::types::{ValidationInfo, ParameterInfo, DocumentationInfo};

pub struct MethodValidation {
    pub param_count: usize,
    pub param_types: Vec<PropertyValueType>,
    pub array_sizes: Option<Vec<usize>>,
    pub param_ranges: Option<Vec<(f64, f64)>>,
    pub property_type_requirements: Option<Vec<PropertyValueType>>,
    pub temporal_dimensions: Option<Vec<usize>>,
    pub is_spatial: bool,
    pub requires_expression: bool,
    pub custom_validator: Option<Arc<dyn Fn(&[Value], &ValidationContext) -> Result<(), String> + Send + Sync>>,
    pub documentation: Option<DocumentationInfo>,
    pub parameters: Vec<ParameterInfo>,
    pub validation_info: Option<ValidationInfo>,
}

impl MethodValidation {
    pub fn new(param_count: usize) -> Self {
        MethodValidation {
            param_count,
            param_types: Vec::new(),
            array_sizes: None,
            param_ranges: None,
            property_type_requirements: None,
            temporal_dimensions: None,
            is_spatial: false,
            requires_expression: false,
            custom_validator: None,
            documentation: None,
            parameters: Vec::new(),
            validation_info: None,
        }
    }

    pub fn with_param_types(mut self, types: Vec<PropertyValueType>) -> Self {
        self.param_types = types;
        self
    }

    pub fn with_array_sizes(mut self, sizes: Vec<usize>) -> Self {
        self.array_sizes = Some(sizes);
        self
    }

    pub fn with_param_ranges(mut self, ranges: Vec<(f64, f64)>) -> Self {
        self.param_ranges = Some(ranges);
        self
    }

    pub fn with_property_type_requirements(mut self, types: Vec<PropertyValueType>) -> Self {
        self.property_type_requirements = Some(types);
        self
    }

    pub fn with_temporal_dimensions(mut self, dimensions: Vec<usize>) -> Self {
        self.temporal_dimensions = Some(dimensions);
        self
    }

    pub fn with_custom_validator(mut self, validator: Arc<dyn Fn(&[Value], &ValidationContext) -> Result<(), String> + Send + Sync>) -> Self {
        self.custom_validator = Some(validator);
        self
    }

    pub fn with_documentation(mut self, documentation: DocumentationInfo) -> Self {
        self.documentation = Some(documentation);
        self
    }

    pub fn with_parameters(mut self, parameters: Vec<ParameterInfo>) -> Self {
        self.parameters = parameters;
        self
    }

    pub fn with_validation_info(mut self, validation_info: ValidationInfo) -> Self {
        self.validation_info = Some(validation_info);
        self
    }

    pub fn validate(&self, args: &[Value], context: &ValidationContext) -> Result<(), String> {
        // Validate argument count
        if args.len() != self.param_count {
            return Err(format!("Expected {} arguments, got {}", self.param_count, args.len()));
        }

        // Validate argument types
        for (i, (arg, expected_type)) in args.iter().zip(self.param_types.iter()).enumerate() {
            if !self.validate_argument_type(arg, expected_type) {
                return Err(format!("Argument {} has invalid type", i + 1));
            }
        }

        // Validate array sizes if specified
        if let Some(ref sizes) = self.array_sizes {
            for (i, (arg, &size)) in args.iter().zip(sizes.iter()).enumerate() {
                if let Value::Array(arr) = arg {
                    if arr.len() != size {
                        return Err(format!("Array argument {} must have size {}", i + 1, size));
                    }
                }
            }
        }

        // Validate ranges if specified
        if let Some(ref ranges) = self.param_ranges {
            for (i, (arg, range)) in args.iter().zip(ranges.iter()).enumerate() {
                if let Value::Number(num) = arg {
                    let val = num.as_f64().unwrap();
                    if val < range.0 || val > range.1 {
                        return Err(format!("Argument {} must be between {} and {}", i + 1, range.0, range.1));
                    }
                }
            }
        }

        // Run custom validator if present
        if let Some(ref validator) = self.custom_validator {
            validator(args, context)?;
        }

        Ok(())
    }

    fn validate_argument_type(&self, value: &Value, expected_type: &PropertyValueType) -> bool {
        match (value, expected_type) {
            (Value::Number(_), PropertyValueType::OneD) => true,
            (Value::Array(_), PropertyValueType::TwoD) => true,
            (Value::Array(_), PropertyValueType::ThreeD) => true,
            (Value::String(_), PropertyValueType::TextDocument) => true,
            (Value::Object(_), PropertyValueType::Shape) => true,
            (Value::Number(_), PropertyValueType::LayerIndex) => true,
            (Value::Number(_), PropertyValueType::MaskIndex) => true,
            (Value::Array(_), PropertyValueType::Color) => true,
            _ => false,
        }
    }
} 