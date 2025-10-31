use super::super::errors::{ValidatorError, ErrorContextBuilder, ErrorSeverity};
use serde_json::Value;
use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    static ref TOOL_CALL_RE: Regex = Regex::new(r#"executeComprehensiveAITool\s*\(\s*["']([^"']+)["']\s*,\s*({[^}]+}|\[[^\]]+\]|[^,)]+)\s*\)"#).unwrap();
    static ref TOOL_LIST_RE: Regex = Regex::new(r#"getComprehensiveAITools\(\s*\)"#).unwrap();
    static ref CATEGORY_CHECK_RE: Regex = Regex::new(r#"detectToolCategory\s*\(\s*["']([^"']+)["']\s*\)"#).unwrap();
}

#[derive(Debug)]
pub struct ToolUsage {
    pub tool_name: String,
    pub parameters: String,
    pub line_number: usize,
    pub column: usize,
}

pub fn analyze_tool_usage(script: &str) -> Vec<ToolUsage> {
    let mut usages = Vec::new();
    
    for (line_num, line) in script.lines().enumerate() {
        for cap in TOOL_CALL_RE.captures_iter(line) {
            let tool_name = cap[1].to_string();
            let parameters = cap[2].to_string();
            let column = cap.get(0).unwrap().start();
            
            usages.push(ToolUsage {
                tool_name,
                parameters,
                line_number: line_num + 1,
                column,
            });
        }
    }
    
    usages
}

pub fn validate_tool_parameters(usage: &ToolUsage) -> Result<(), ValidatorError> {
    // Try to parse parameters as JSON
    if usage.parameters.starts_with('{') {
        match serde_json::from_str::<Value>(&usage.parameters) {
            Ok(_) => Ok(()),
            Err(e) => {
                let context = ErrorContextBuilder::new()
                    .line(usage.line_number)
                    .column(usage.column)
                    .code_snippet(format!("executeComprehensiveAITool('{}', {})", 
                                        usage.tool_name, usage.parameters))
                    .suggestion(Some("Fix JSON parameter syntax".to_string()))
                    .build();

                Err(ValidatorError::Script {
                    message: format!("Invalid JSON parameters: {}", e),
                    context,
                    severity: ErrorSeverity::Error,
                })
            }
        }
    } else {
        // For non-JSON parameters, check basic syntax
        validate_basic_parameter_syntax(&usage.parameters, usage)
    }
}

fn validate_basic_parameter_syntax(params: &str, usage: &ToolUsage) -> Result<(), ValidatorError> {
    // Check for common syntax issues in non-JSON parameters
    if params.contains("undefined") || params.contains("null") {
        let context = ErrorContextBuilder::new()
            .line(usage.line_number)
            .column(usage.column)
            .code_snippet(format!("executeComprehensiveAITool('{}', {})", 
                                usage.tool_name, params))
            .suggestion(Some("Replace undefined/null with proper parameter value".to_string()))
            .build();

        return Err(ValidatorError::Script {
            message: "Parameter contains undefined or null value".to_string(),
            context,
            severity: ErrorSeverity::Warning,
        });
    }

    // Check for array syntax
    if params.starts_with('[') && !params.ends_with(']') {
        let context = ErrorContextBuilder::new()
            .line(usage.line_number)
            .column(usage.column)
            .code_snippet(format!("executeComprehensiveAITool('{}', {})", 
                                usage.tool_name, params))
            .suggestion(Some("Fix array parameter syntax".to_string()))
            .build();

        return Err(ValidatorError::Script {
            message: "Invalid array parameter syntax".to_string(),
            context,
            severity: ErrorSeverity::Error,
        });
    }

    Ok(())
}

pub fn check_tool_dependencies(script: &str) -> Vec<ValidatorError> {
    let mut errors = Vec::new();
    let mut has_tool_list_check = false;
    
    // Check if script verifies tool availability
    for cap in TOOL_LIST_RE.captures_iter(script) {
        has_tool_list_check = true;
        break;
    }

    // Find all tool usages
    let usages = analyze_tool_usage(script);
    
    // If using tools but not checking availability
    if !usages.is_empty() && !has_tool_list_check {
        let context = ErrorContextBuilder::new()
            .suggestion(Some("Add getComprehensiveAITools() check before using tools".to_string()))
            .build();

        errors.push(ValidatorError::Script {
            message: "Script uses tools without checking availability".to_string(),
            context,
            severity: ErrorSeverity::Warning,
        });
    }

    // Check category detection usage
    for usage in &usages {
        let category_check = format!("detectToolCategory('{}')", usage.tool_name);
        if !script.contains(&category_check) {
            let context = ErrorContextBuilder::new()
                .line(usage.line_number)
                .column(usage.column)
                .code_snippet(format!("executeComprehensiveAITool('{}', {})", 
                                    usage.tool_name, usage.parameters))
                .suggestion(Some(format!("Add detectToolCategory('{}') check", usage.tool_name)))
                .build();

            errors.push(ValidatorError::Script {
                message: format!("Tool '{}' used without category detection", usage.tool_name),
                context,
                severity: ErrorSeverity::Warning,
            });
        }
    }

    errors
} 