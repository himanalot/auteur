use super::types::{ErrorContext, SourceLocation, ValidatorError, ErrorSeverity};

/// Builder for creating error contexts
#[derive(Debug, Default)]
pub struct ErrorContextBuilder {
    file: Option<String>,
    line: Option<usize>,
    column: Option<usize>,
    code_snippet: Option<String>,
    suggestion: Option<String>,
}

impl ErrorContextBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn file(mut self, file: String) -> Self {
        self.file = Some(file);
        self
    }

    pub fn line(mut self, line: usize) -> Self {
        self.line = Some(line);
        self
    }

    pub fn column(mut self, column: usize) -> Self {
        self.column = Some(column);
        self
    }

    pub fn code_snippet(mut self, snippet: String) -> Self {
        self.code_snippet = Some(snippet);
        self
    }

    pub fn suggestion(mut self, suggestion: Option<String>) -> Self {
        self.suggestion = suggestion;
        self
    }

    pub fn build(self) -> ErrorContext {
        ErrorContext {
            file: self.file,
            line: self.line,
            column: self.column,
            code_snippet: self.code_snippet,
            suggestion: self.suggestion,
        }
    }
}

impl ErrorContext {
    pub fn builder() -> ErrorContextBuilder {
        ErrorContextBuilder::new()
    }

    pub fn with_type_error(
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    ) -> ValidatorError {
        ValidatorError::Type {
            message,
            context,
            severity,
        }
    }

    pub fn with_method_error(
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    ) -> ValidatorError {
        ValidatorError::Method {
            message,
            context,
            severity,
        }
    }

    pub fn with_property_error(
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    ) -> ValidatorError {
        ValidatorError::Property {
            message,
            context,
            severity,
        }
    }

    pub fn with_performance_error(
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    ) -> ValidatorError {
        ValidatorError::Performance {
            message,
            context,
            severity,
        }
    }

    pub fn with_temporal_error(
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    ) -> ValidatorError {
        ValidatorError::Temporal {
            message,
            context,
            severity,
        }
    }

    pub fn with_best_practice_error(
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    ) -> ValidatorError {
        ValidatorError::BestPractice {
            message,
            context,
            severity,
        }
    }
}

/// Helper functions for creating common error types
pub trait ErrorFactory {
    fn expression_error(message: impl Into<String>, context: ErrorContext) -> ValidatorError {
        ValidatorError::Expression {
            message: message.into(),
            context,
            severity: ErrorSeverity::Error,
        }
    }

    fn type_error(
        message: impl Into<String>,
        context: ErrorContext,
        expected_type: impl Into<String>,
        actual_type: impl Into<String>,
    ) -> ValidatorError {
        ValidatorError::Type {
            message: format!("{} (expected: {}, actual: {})", message.into(), expected_type.into(), actual_type.into()),
            context,
            severity: ErrorSeverity::Error,
        }
    }

    fn scope_error(
        message: impl Into<String>,
        context: ErrorContext,
        variable: impl Into<String>,
    ) -> ValidatorError {
        ValidatorError::Scope {
            message: message.into(),
            context,
            variable: variable.into(),
            severity: ErrorSeverity::Error,
        }
    }

    fn method_error(
        message: impl Into<String>,
        context: ErrorContext,
        method_name: impl Into<String>,
    ) -> ValidatorError {
        ValidatorError::Method {
            message: format!("{} (method: {})", message.into(), method_name.into()),
            context,
            severity: ErrorSeverity::Error,
        }
    }

    fn property_error(
        message: impl Into<String>,
        context: ErrorContext,
        property_name: impl Into<String>,
    ) -> ValidatorError {
        ValidatorError::Property {
            message: format!("{} (property: {})", message.into(), property_name.into()),
            context,
            severity: ErrorSeverity::Error,
        }
    }

    fn performance_warning(
        message: impl Into<String>,
        context: ErrorContext,
        impact_level: impl Into<String>,
    ) -> ValidatorError {
        ValidatorError::Performance {
            message: format!("{} (impact: {})", message.into(), impact_level.into()),
            context,
            severity: ErrorSeverity::Warning,
        }
    }

    fn temporal_error(
        message: impl Into<String>,
        context: ErrorContext,
        frame_info: Option<String>,
    ) -> ValidatorError {
        ValidatorError::Temporal {
            message: format!("{} (frame info: {:?})", message.into(), frame_info),
            context,
            severity: ErrorSeverity::Error,
        }
    }

    fn best_practice_warning(
        message: impl Into<String>,
        context: ErrorContext,
        rule_id: impl Into<String>,
    ) -> ValidatorError {
        ValidatorError::BestPractice {
            message: format!("{} (rule: {})", message.into(), rule_id.into()),
            context,
            severity: ErrorSeverity::Warning,
        }
    }
}

/// Implement ErrorFactory for any type
impl<T> ErrorFactory for T {} 