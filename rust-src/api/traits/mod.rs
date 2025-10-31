use crate::validation::rules::{ValidationRule, MethodValidation};
use serde_json::Value;

// Trait to define common functionality for API objects
pub trait ApiObjectTrait {
    fn validate(&self, property: &str, value: &Value) -> Result<(), String>;
    fn get_property(&self, name: &str) -> Option<&ValidationRule>;
    fn get_method(&self, name: &str) -> Option<&MethodValidation>;
}

pub trait Validatable {
    fn validate(&self) -> Result<(), String>;
}

pub trait PropertyAccessor {
    fn get_property(&self, name: &str) -> Option<&ValidationRule>;
    fn get_method(&self, name: &str) -> Option<&MethodValidation>;
}
