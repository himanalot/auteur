pub mod parser;
pub mod scope;
pub mod validation;
pub mod typechecker;

use super::errors::ValidatorError;
pub use validation::{ExpressionValidationResult, validate_expression_syntax};

/// Validates an After Effects expression
pub fn validate_expression(source: &str) -> Result<(), ValidatorError> {
    // First validate the expression syntax
    let validation_result = validate_expression_syntax(source);
    if !validation_result.is_valid {
        if let Some(error) = validation_result.to_error(source) {
            return Err(error);
        }
    }

    // Parse the expression
    parser::parse_expression(source)?;

    // Validate scope
    scope::validate_scope(source)?;

    Ok(())
} 