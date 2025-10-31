use std::fmt::Write;
use super::types::{ErrorCollection, ValidatorError, ErrorSeverity, ErrorContext};
use serde_json::json;

/// Formats for error output
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputFormat {
    /// Plain text output
    Text,
    /// JSON output
    Json,
    /// HTML output
    Html,
}

/// Configuration for error reporting
#[derive(Debug, Clone)]
pub struct ReportConfig {
    /// Output format
    pub format: OutputFormat,
    /// Whether to include code snippets
    pub show_snippets: bool,
    /// Whether to include suggestions
    pub show_suggestions: bool,
    /// Minimum severity level to report
    pub min_severity: ErrorSeverity,
    /// Maximum number of errors to show
    pub max_errors: Option<usize>,
}

impl Default for ReportConfig {
    fn default() -> Self {
        Self {
            format: OutputFormat::Text,
            show_snippets: true,
            show_suggestions: true,
            min_severity: ErrorSeverity::Warning,
            max_errors: None,
        }
    }
}

/// Generates a formatted error report
pub struct ErrorReporter {
    pub config: ErrorReportConfig,
}

#[derive(Debug, Clone)]
pub struct ErrorReportConfig {
    pub min_severity: ErrorSeverity,
    pub format: ErrorFormat,
    pub include_suggestions: bool,
    pub show_snippets: bool,
    pub show_suggestions: bool,
    pub max_errors: Option<usize>,
}

#[derive(Debug, Clone)]
pub enum ErrorFormat {
    Text,
    Json,
    Html,
}

impl ErrorReporter {
    pub fn new(config: ErrorReportConfig) -> Self {
        Self { config }
    }

    pub fn report(&self, errors: &ErrorCollection) -> String {
        match self.config.format {
            ErrorFormat::Text => self.text_report(errors),
            ErrorFormat::Json => self.json_report(errors),
            ErrorFormat::Html => self.html_report(errors),
        }
    }

    fn text_report(&self, errors: &ErrorCollection) -> String {
        let mut output = String::new();
        let mut error_count = 0;

        for error in errors.errors() {
            if !self.should_report_error(error) {
                continue;
            }

            if let Some(max) = self.config.max_errors {
                if error_count >= max {
                    writeln!(output, "\n... and {} more errors", 
                        errors.errors().count() - error_count).unwrap();
                    break;
                }
            }

            writeln!(output, "\n{}", error).unwrap();

            if self.config.show_snippets {
                if let Some(snippet) = self.format_snippet(error) {
                    writeln!(output, "\n{}", snippet).unwrap();
                }
            }

            if self.config.show_suggestions {
                if let Some(suggestion) = self.get_suggestion(error) {
                    writeln!(output, "\nSuggestion: {}", suggestion).unwrap();
                }
            }

            error_count += 1;
        }

        if error_count == 0 {
            writeln!(output, "No errors found.").unwrap();
        } else {
            writeln!(output, "\nFound {} error(s)", error_count).unwrap();
        }

        output
    }

    fn json_report(&self, errors: &ErrorCollection) -> String {
        let mut error_list = Vec::new();
        let mut error_count = 0;

        for error in errors.errors() {
            if !self.should_report_error(error) {
                continue;
            }

            if let Some(max) = self.config.max_errors {
                if error_count >= max {
                    break;
                }
            }

            let error_json = match error {
                ValidatorError::Expression { message, context, severity } => {
                    json!({
                        "type": "expression",
                        "message": message,
                        "severity": format!("{:?}", severity),
                        "location": {
                            "file": context.file.clone(),
                            "line": context.line,
                            "column": context.column
                        },
                        "snippet": self.config.show_snippets.then(|| context.code_snippet.clone()),
                        "suggestion": self.config.show_suggestions.then(|| context.suggestion.clone())
                    })
                }
                // Add similar match arms for other error types...
                _ => json!({
                    "type": "other",
                    "message": format!("{}", error)
                })
            };

            error_list.push(error_json);
            error_count += 1;
        }

        let report = json!({
            "errors": error_list,
            "total": error_count
        });

        serde_json::to_string_pretty(&report).unwrap()
    }

    fn html_report(&self, errors: &ErrorCollection) -> String {
        let mut output = String::from(
            "<!DOCTYPE html>\n<html>\n<head>\n<style>\n\
            .error { color: red; }\n\
            .warning { color: orange; }\n\
            .info { color: blue; }\n\
            .snippet { background: #f5f5f5; padding: 10px; margin: 10px 0; }\n\
            .suggestion { color: green; }\n\
            </style>\n</head>\n<body>\n"
        );

        let mut error_count = 0;

        for error in errors.errors() {
            if !self.should_report_error(error) {
                continue;
            }

            if let Some(max) = self.config.max_errors {
                if error_count >= max {
                    writeln!(output, "<p>... and {} more errors</p>", 
                        errors.errors().count() - error_count).unwrap();
                    break;
                }
            }

            let severity_class = match self.get_severity(error) {
                ErrorSeverity::Error | ErrorSeverity::Fatal => "error",
                ErrorSeverity::Warning => "warning",
                ErrorSeverity::Info => "info",
            };

            writeln!(output, "<div class=\"{}\">", severity_class).unwrap();
            writeln!(output, "<p>{}</p>", html_escape::encode_text(&error.to_string())).unwrap();

            if self.config.show_snippets {
                if let Some(snippet) = self.format_snippet(error) {
                    writeln!(output, "<pre class=\"snippet\">{}</pre>", 
                        html_escape::encode_text(&snippet)).unwrap();
                }
            }

            if self.config.show_suggestions {
                if let Some(suggestion) = self.get_suggestion(error) {
                    writeln!(output, "<p class=\"suggestion\">Suggestion: {}</p>", 
                        html_escape::encode_text(&suggestion)).unwrap();
                }
            }

            writeln!(output, "</div>").unwrap();
            error_count += 1;
        }

        if error_count == 0 {
            writeln!(output, "<p>No errors found.</p>").unwrap();
        } else {
            writeln!(output, "<p>Found {} error(s)</p>", error_count).unwrap();
        }

        output.push_str("</body>\n</html>");
        output
    }

    fn should_report_error(&self, error: &ValidatorError) -> bool {
        let severity = self.get_severity(error);
        severity >= self.config.min_severity
    }

    fn get_severity(&self, error: &ValidatorError) -> ErrorSeverity {
        match error {
            ValidatorError::Expression { severity, .. } => *severity,
            ValidatorError::Type { severity, .. } => *severity,
            ValidatorError::Scope { severity, .. } => *severity,
            ValidatorError::Method { severity, .. } => *severity,
            ValidatorError::Property { severity, .. } => *severity,
            ValidatorError::Performance { severity, .. } => *severity,
            ValidatorError::Temporal { severity, .. } => *severity,
            ValidatorError::BestPractice { severity, .. } => *severity,
            ValidatorError::Script { severity, .. } => *severity,
        }
    }

    fn format_snippet(&self, error: &ValidatorError) -> Option<String> {
        match error {
            ValidatorError::Expression { context, .. } |
            ValidatorError::Type { context, .. } |
            ValidatorError::Scope { context, .. } |
            ValidatorError::Method { context, .. } |
            ValidatorError::Property { context, .. } |
            ValidatorError::Performance { context, .. } |
            ValidatorError::Temporal { context, .. } |
            ValidatorError::BestPractice { context, .. } |
            ValidatorError::Script { context, .. } => {
                context.code_snippet.clone()
            }
        }
    }

    fn get_suggestion(&self, error: &ValidatorError) -> Option<String> {
        match error {
            ValidatorError::Expression { context, .. } |
            ValidatorError::Type { context, .. } |
            ValidatorError::Scope { context, .. } |
            ValidatorError::Method { context, .. } |
            ValidatorError::Property { context, .. } |
            ValidatorError::Performance { context, .. } |
            ValidatorError::Temporal { context, .. } |
            ValidatorError::BestPractice { context, .. } |
            ValidatorError::Script { context, .. } => {
                context.suggestion.clone()
            }
        }
    }
}

 