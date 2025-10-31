pub mod rules;
pub mod property;
pub mod temporal;
pub mod expression;
pub mod performance;
pub mod context;
pub mod text;
pub mod parser;
pub mod errors;
pub mod script;
pub mod workflow;
pub mod typechecker;

#[cfg(test)]
mod tests;

pub use rules::{ValidationRule, MethodValidation};
pub use property::validate_property_value;
pub use temporal::validate_temporal_ease;
pub use expression::{validate_expression_syntax, ExpressionValidationResult};
pub use performance::PerformanceMetrics;
pub use context::{ValidationContext, ObjectContext, TextValidationContext, EffectInfo};
pub use text::validate_text_document;
pub use errors::{ValidatorError, ErrorSeverity};
pub use script::{validate_script, ScriptValidationResult};
pub use workflow::validate_workflow_patterns;
pub use typechecker::validate_type_usage;

/// Main entry point for validating After Effects scripts
pub fn validate_ae_script(script: &str, file_path: &str) -> ScriptValidationResult {
    validate_script(script, file_path)
}

/// Main entry point for validating After Effects expressions
pub fn validate_ae_expression(expr: &str) -> ExpressionValidationResult {
    validate_expression_syntax(expr)
} 