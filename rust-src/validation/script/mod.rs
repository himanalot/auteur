use super::errors::{ValidatorError, ErrorContextBuilder, ErrorSeverity};
use super::expression::validate_expression_syntax;
use super::workflow::validate_workflow_patterns;
use super::typechecker::validate_type_usage;

mod tool_analysis;
use tool_analysis::{analyze_tool_usage, validate_tool_parameters, check_tool_dependencies};

/// Represents a script validation result
#[derive(Debug)]
pub struct ScriptValidationResult {
    pub is_valid: bool,
    pub errors: Vec<ValidatorError>,
    pub warnings: Vec<ValidatorError>,
}

impl ScriptValidationResult {
    pub fn new() -> Self {
        Self {
            is_valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
        }
    }

    pub fn add_error(&mut self, error: ValidatorError) {
        self.is_valid = false;
        self.errors.push(error);
    }

    pub fn add_warning(&mut self, warning: ValidatorError) {
        self.warnings.push(warning);
    }
}

/// Validates an ExtendScript/JavaScript file for common issues and tool usage patterns
pub fn validate_script(script: &str, file_path: &str) -> ScriptValidationResult {
    let mut result = ScriptValidationResult::new();

    // Validate basic script structure
    validate_script_structure(script, file_path, &mut result);

    // Validate tool usage patterns
    validate_tool_usage_patterns(script, file_path, &mut result);

    // Validate expressions within the script
    validate_script_expressions(script, file_path, &mut result);
    
    // Validate workflow patterns
    for error in validate_workflow_patterns(script, file_path) {
        match error.severity() {
            ErrorSeverity::Error => result.add_error(error),
            _ => result.add_warning(error),
        }
    }
    
    // Validate type usage
    for error in validate_type_usage(script, file_path) {
        match error.severity() {
            ErrorSeverity::Error => result.add_error(error),
            _ => result.add_warning(error),
        }
    }

    result
}

fn validate_script_structure(script: &str, file_path: &str, result: &mut ScriptValidationResult) {
    // Check for missing semicolons
    for (line_num, line) in script.lines().enumerate() {
        let line = line.trim();
        if !line.is_empty() && !line.ends_with(';') && !line.ends_with('{') && !line.ends_with('}') 
            && !line.starts_with("//") && !line.starts_with("/*") && !line.ends_with("*/") {
            let context = ErrorContextBuilder::new()
                .file(file_path.to_string())
                .line(line_num + 1)
                .column(line.len())
                .code_snippet(line.to_string())
                .suggestion(Some("Add a semicolon at the end of the statement".to_string()))
                .build();

            result.add_warning(ValidatorError::Script {
                message: "Missing semicolon".to_string(),
                context,
                severity: ErrorSeverity::Warning,
            });
        }
    }

    // Check for balanced braces
    let mut brace_count = 0;
    let mut in_string = false;
    let mut string_char = ' ';
    let mut last_open_brace_line = 0;

    for (line_num, line) in script.lines().enumerate() {
        for (col, c) in line.chars().enumerate() {
            match c {
                '\'' | '"' => {
                    if !in_string {
                        in_string = true;
                        string_char = c;
                    } else if c == string_char {
                        in_string = false;
                    }
                }
                '{' if !in_string => {
                    brace_count += 1;
                    last_open_brace_line = line_num + 1;
                }
                '}' if !in_string => {
                    brace_count -= 1;
                    if brace_count < 0 {
                        let context = ErrorContextBuilder::new()
                            .file(file_path.to_string())
                            .line(line_num + 1)
                            .column(col + 1)
                            .code_snippet(line.to_string())
                            .build();

                        result.add_error(ValidatorError::Script {
                            message: "Unmatched closing brace".to_string(),
                            context,
                            severity: ErrorSeverity::Error,
                        });
                        brace_count = 0; // Reset to avoid cascading errors
                    }
                }
                _ => {}
            }
        }
    }

    if brace_count > 0 {
        let context = ErrorContextBuilder::new()
            .file(file_path.to_string())
            .line(last_open_brace_line)
            .column(1)
            .suggestion(Some("Add closing brace(s) to match opening brace".to_string()))
            .build();

        result.add_error(ValidatorError::Script {
            message: format!("Missing {} closing brace(s)", brace_count),
            context,
            severity: ErrorSeverity::Error,
        });
    }
}

fn validate_tool_usage_patterns(script: &str, file_path: &str, result: &mut ScriptValidationResult) {
    // Analyze tool usage
    let usages = analyze_tool_usage(script);
    
    // Validate each tool usage
    for usage in &usages {
        if let Err(error) = validate_tool_parameters(usage) {
            result.add_error(error);
        }
    }

    // Check tool dependencies and category detection
    for error in check_tool_dependencies(script) {
        match error {
            ValidatorError::Script { severity: ErrorSeverity::Error, .. } => {
                result.add_error(error);
            }
            _ => {
                result.add_warning(error);
            }
        }
    }
}

fn validate_script_expressions(script: &str, file_path: &str, result: &mut ScriptValidationResult) {
    // Find expressions in the script (typically in .expression assignments)
    let expr_pattern = regex::Regex::new(r#"\.expression\s*=\s*["']([^"']+)["']"#).unwrap();
    
    for cap in expr_pattern.captures_iter(script) {
        let expression = &cap[1];
        if let Some(validation_error) = validate_expression_syntax(expression).to_error(expression) {
            result.add_error(validation_error);
        }
    }
} 