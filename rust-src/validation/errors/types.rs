use std::fmt;
use std::error::Error;

/// Represents the severity level of a validation error
#[derive(Debug, Clone, PartialEq, PartialOrd, Copy)]
pub enum ErrorSeverity {
    /// Informational message, not an error
    Info,
    /// Warning that might indicate a problem
    Warning,
    /// Error that should be fixed
    Error,
    /// Critical error that must be fixed
    Fatal,
}

/// Location in the source code where an error occurred
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceLocation {
    pub file: String,
    pub line: usize,
    pub column: usize,
}

/// Context information for an error
#[derive(Debug)]
pub struct ErrorContext {
    pub file: Option<String>,
    pub line: Option<usize>,
    pub column: Option<usize>,
    pub code_snippet: Option<String>,
    pub suggestion: Option<String>,
}

/// Main error type for the validator
#[derive(Debug)]
pub enum ValidatorError {
    /// Errors related to expression parsing and validation
    Expression {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    },
    /// Errors related to type checking
    Type {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    },
    /// Errors related to scope and variable access
    Scope {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
        variable: String,
    },
    /// Errors related to method calls
    Method {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    },
    /// Errors related to property access
    Property {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    },
    /// Performance-related issues
    Performance {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    },
    /// Temporal validation errors
    Temporal {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    },
    /// Best practices violations
    BestPractice {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    },
    /// Script-related errors
    Script {
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    },
}

impl fmt::Display for ValidatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ValidatorError::Expression { message, context, severity } => {
                write!(f, "{:?} at {}:{}: {}", 
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message
                )
            }
            ValidatorError::Type { message, context, severity } => {
                write!(f, "{:?} at {}:{}: {}",
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message
                )
            }
            ValidatorError::Scope { message, context, variable, severity } => {
                write!(f, "{:?} at {}:{}: {} (variable: {})",
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message,
                    variable
                )
            }
            ValidatorError::Method { message, context, severity } => {
                write!(f, "{:?} at {}:{}: {}",
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message
                )
            }
            ValidatorError::Property { message, context, severity } => {
                write!(f, "{:?} at {}:{}: {}",
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message
                )
            }
            ValidatorError::Performance { message, context, severity } => {
                write!(f, "{:?} at {}:{}: {}",
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message
                )
            }
            ValidatorError::Temporal { message, context, severity } => {
                write!(f, "{:?} at {}:{}: {}",
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message
                )
            }
            ValidatorError::BestPractice { message, context, severity } => {
                write!(f, "{:?} at {}:{}: {}",
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message
                )
            }
            ValidatorError::Script { message, context, severity } => {
                write!(f, "{:?} at {}:{}: {}",
                    severity,
                    context.line.unwrap_or(0),
                    context.column.unwrap_or(0),
                    message
                )
            }
        }
    }
}

impl Error for ValidatorError {}

/// Result type alias for validator operations
pub type ValidatorResult<T> = Result<T, ValidatorError>;

/// Collection of validation errors
#[derive(Debug, Default)]
pub struct ErrorCollection {
    errors: Vec<ValidatorError>,
}

impl ErrorCollection {
    pub fn new() -> Self {
        Self { errors: Vec::new() }
    }

    pub fn add(&mut self, error: ValidatorError) {
        self.errors.push(error);
    }

    pub fn has_errors(&self) -> bool {
        self.errors.iter().any(|e| matches!(
            e,
            ValidatorError::Expression { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. } |
            ValidatorError::Type { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. } |
            ValidatorError::Scope { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. } |
            ValidatorError::Method { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. } |
            ValidatorError::Property { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. } |
            ValidatorError::Performance { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. } |
            ValidatorError::Temporal { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. } |
            ValidatorError::BestPractice { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. } |
            ValidatorError::Script { severity: ErrorSeverity::Error | ErrorSeverity::Fatal, .. }
        ))
    }

    pub fn has_warnings(&self) -> bool {
        self.errors.iter().any(|e| matches!(
            e,
            ValidatorError::Expression { severity: ErrorSeverity::Warning, .. } |
            ValidatorError::Type { severity: ErrorSeverity::Warning, .. } |
            ValidatorError::Scope { severity: ErrorSeverity::Warning, .. } |
            ValidatorError::Method { severity: ErrorSeverity::Warning, .. } |
            ValidatorError::Property { severity: ErrorSeverity::Warning, .. } |
            ValidatorError::Performance { severity: ErrorSeverity::Warning, .. } |
            ValidatorError::Temporal { severity: ErrorSeverity::Warning, .. } |
            ValidatorError::BestPractice { severity: ErrorSeverity::Warning, .. } |
            ValidatorError::Script { severity: ErrorSeverity::Warning, .. }
        ))
    }

    pub fn errors(&self) -> impl Iterator<Item = &ValidatorError> {
        self.errors.iter()
    }
}

impl ValidatorError {
    pub fn get_context(&self) -> &ErrorContext {
        match self {
            ValidatorError::Expression { context, .. } |
            ValidatorError::Type { context, .. } |
            ValidatorError::Scope { context, .. } |
            ValidatorError::Property { context, .. } |
            ValidatorError::Method { context, .. } |
            ValidatorError::Performance { context, .. } |
            ValidatorError::Temporal { context, .. } |
            ValidatorError::BestPractice { context, .. } |
            ValidatorError::Script { context, .. } => context,
        }
    }

    pub fn get_severity(&self) -> ErrorSeverity {
        match self {
            ValidatorError::Expression { severity, .. } |
            ValidatorError::Type { severity, .. } |
            ValidatorError::Scope { severity, .. } |
            ValidatorError::Property { severity, .. } |
            ValidatorError::Method { severity, .. } |
            ValidatorError::Performance { severity, .. } |
            ValidatorError::Temporal { severity, .. } |
            ValidatorError::BestPractice { severity, .. } |
            ValidatorError::Script { severity, .. } => *severity,
        }
    }
    
    pub fn severity(&self) -> ErrorSeverity {
        self.get_severity()
    }

    pub fn get_message(&self) -> &str {
        match self {
            ValidatorError::Expression { message, .. } |
            ValidatorError::Type { message, .. } |
            ValidatorError::Scope { message, .. } |
            ValidatorError::Property { message, .. } |
            ValidatorError::Method { message, .. } |
            ValidatorError::Performance { message, .. } |
            ValidatorError::Temporal { message, .. } |
            ValidatorError::BestPractice { message, .. } |
            ValidatorError::Script { message, .. } => message,
        }
    }
} 