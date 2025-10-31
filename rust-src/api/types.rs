use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArraySizeRule {
    pub parameter_name: String,
    pub property_value_type: String,
    pub required_size: usize,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RangeValidation {
    pub parameter_name: String,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub valid_range: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyTypeConstraint {
    pub method_name: String,
    pub allowed_property_types: Vec<String>,
    pub error_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionInfo {
    pub since_version: Option<String>,
    pub deprecated: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExampleInfo {
    pub code: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentationInfo {
    pub description: String,
    pub version_info: VersionInfo,
    pub examples: Vec<ExampleInfo>,
    pub file_reference: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParameterInfo {
    pub name: String,
    pub param_type: String,
    pub description: String,
    pub required: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationInfo {
    pub array_size_requirements: Option<Vec<ArraySizeRule>>,
    pub property_type_constraints: Option<Vec<PropertyTypeConstraint>>,
    pub range_validations: Option<Vec<RangeValidation>>,
    pub temporal_dimensions: Option<Vec<usize>>,
    pub is_spatial: bool,
    pub requires_expression: bool,
} 