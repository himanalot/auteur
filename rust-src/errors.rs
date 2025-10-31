use std::fmt;

#[derive(Debug, Clone)]
pub struct ValidationError {
    pub message: String,
    pub line: usize,
    pub column: usize,
    pub level: ErrorLevel,
    pub suggestion: Option<String>,
}

impl ValidationError {
    pub fn new(message: &str, line: usize, column: usize, level: ErrorLevel, suggestion: Option<String>) -> Self {
        ValidationError {
            message: message.to_string(),
            line,
            column,
            level,
            suggestion,
        }
    }
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ValidationError {}

#[derive(Debug, Clone)]
pub enum ErrorLevel {
    Error,
    Warning,
} 