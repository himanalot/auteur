use regex::Regex;
use lazy_static::lazy_static;
use super::super::errors::{ValidatorError, ErrorContextBuilder, ErrorSeverity};
use super::super::performance::PerformanceMetrics;
use super::typechecker::{Type, TypeChecker};

lazy_static! {
    static ref LAYER_REF_RE: Regex = Regex::new(r"thisLayer|thisComp\.layer\(\s*['\x22]?[\w\s]+['\x22]?\s*\)").unwrap();
    static ref PROPERTY_REF_RE: Regex = Regex::new(r"\.(position|scale|rotation|opacity|transform|effect|color|fill|stroke)").unwrap();
    static ref MATH_FUNC_RE: Regex = Regex::new(r"\b(Math\.(abs|sin|cos|sqrt|pow|random)|random)\b").unwrap();
    static ref COLOR_FUNC_RE: Regex = Regex::new(r"\b(rgbToHsl|hslToRgb|hexToRgb|rgbToHex)\b").unwrap();
    static ref TEMPORAL_FUNC_RE: Regex = Regex::new(r"\b(valueAtTime|velocityAtTime|speedAtTime|temporalWiggle)\b").unwrap();
    static ref CONTROLLER_RE: Regex = Regex::new(r"effect\(['\x22](?P<name>[\w\s]+)['\x22]\)\(['\x22](?P<param>[\w\s]+)['\x22]\)").unwrap();
}

/// Result of validating an After Effects expression
#[derive(Debug)]
pub struct ExpressionValidationResult {
    pub is_valid: bool,
    pub syntax_errors: Vec<String>,
    pub safety_warnings: Vec<String>,
    pub performance_warnings: Vec<String>,
    pub optimization_suggestions: Vec<String>,
    pub type_errors: Vec<String>,
}

impl ExpressionValidationResult {
    pub fn new() -> Self {
        Self {
            is_valid: true,
            syntax_errors: Vec::new(),
            safety_warnings: Vec::new(),
            performance_warnings: Vec::new(),
            optimization_suggestions: Vec::new(),
            type_errors: Vec::new(),
        }
    }

    pub fn to_error(&self, source: &str) -> Option<ValidatorError> {
        if !self.is_valid {
            let context = ErrorContextBuilder::new()
                .file("expression".to_string())
                .line(1)
                .column(1)
                .code_snippet(source.to_string())
                .build();

            let mut messages = Vec::new();
            messages.extend(self.syntax_errors.iter().cloned());
            messages.extend(self.type_errors.iter().cloned());

            Some(ValidatorError::Expression {
                message: messages.join("\n"),
                context,
                severity: ErrorSeverity::Error,
            })
        } else if !self.safety_warnings.is_empty() || !self.performance_warnings.is_empty() {
            let context = ErrorContextBuilder::new()
                .file("expression".to_string())
                .line(1)
                .column(1)
                .code_snippet(source.to_string())
                .suggestion(Some(self.get_all_warnings().join("\n")))
                .build();

            Some(ValidatorError::Expression {
                message: "Warnings in expression".to_string(),
                context,
                severity: ErrorSeverity::Warning,
            })
        } else {
            None
        }
    }

    fn get_all_warnings(&self) -> Vec<String> {
        let mut warnings = Vec::new();
        warnings.extend(self.safety_warnings.iter().cloned());
        warnings.extend(self.performance_warnings.iter().cloned());
        warnings.extend(self.optimization_suggestions.iter().cloned());
        warnings
    }
}

/// Validates an After Effects expression for syntax, safety, and performance
pub fn validate_expression_syntax(expr: &str) -> ExpressionValidationResult {
    let mut result = ExpressionValidationResult::new();

    // Basic expression validation
    if expr.is_empty() {
        return result;  // Empty expressions are valid
    }

    // Check for balanced delimiters
    if let Err(e) = validate_balanced_delimiters(expr) {
        result.is_valid = false;
        result.syntax_errors.push(e);
    }

    // Check for common syntax errors
    if let Err(e) = validate_syntax(expr) {
        result.is_valid = false;
        result.syntax_errors.push(e);
    }

    // Check for unsafe operations
    if let Err(e) = validate_safety(expr) {
        result.safety_warnings.push(e);
    }

    // Validate color operations
    if let Err(e) = validate_color_operations(expr) {
        result.type_errors.push(e);
    }

    // Validate temporal expressions
    if let Err(e) = validate_temporal_expressions(expr) {
        result.type_errors.push(e);
    }

    // Validate expression controllers
    if let Err(e) = validate_controllers(expr) {
        result.type_errors.push(e);
    }

    // Performance analysis
    let metrics = PerformanceMetrics::analyze(expr);
    result.performance_warnings = metrics.get_warnings();
    result.optimization_suggestions = metrics.get_optimization_suggestions();

    result
}

fn validate_balanced_delimiters(expr: &str) -> Result<(), String> {
    let mut paren_count = 0;
    let mut bracket_count = 0;
    let mut brace_count = 0;
    let mut in_string = false;
    let mut string_char = ' ';

    for c in expr.chars() {
        match c {
            '\'' | '"' => {
                if !in_string {
                    in_string = true;
                    string_char = c;
                } else if c == string_char {
                    in_string = false;
                }
            }
            '(' if !in_string => paren_count += 1,
            ')' if !in_string => {
                paren_count -= 1;
                if paren_count < 0 {
                    return Err("Unmatched closing parenthesis".to_string());
                }
            }
            '[' if !in_string => bracket_count += 1,
            ']' if !in_string => {
                bracket_count -= 1;
                if bracket_count < 0 {
                    return Err("Unmatched closing bracket".to_string());
                }
            }
            '{' if !in_string => brace_count += 1,
            '}' if !in_string => {
                brace_count -= 1;
                if brace_count < 0 {
                    return Err("Unmatched closing brace".to_string());
                }
            }
            _ => {}
        }
    }

    if paren_count > 0 {
        return Err("Unmatched opening parenthesis".to_string());
    }
    if bracket_count > 0 {
        return Err("Unmatched opening bracket".to_string());
    }
    if brace_count > 0 {
        return Err("Unmatched opening brace".to_string());
    }

    Ok(())
}

fn validate_syntax(expr: &str) -> Result<(), String> {
    // Check for invalid property references
    if expr.contains("..") {
        return Err("Invalid property reference: contains '..'".to_string());
    }

    // Check for common typos in property names
    if expr.contains("possition") || expr.contains("rotaton") || expr.contains("scle") {
        return Err("Possible typo in property name".to_string());
    }

    // Check for invalid layer references
    if expr.contains("comp.layer()") || expr.contains("comp.layer('')") {
        return Err("Invalid layer reference: empty layer specifier".to_string());
    }

    // Check for semicolon usage
    let statements: Vec<&str> = expr.split(';').collect();
    if statements.len() > 1 {
        let last = statements.last().unwrap().trim();
        if !last.is_empty() && !last.starts_with("//") {
            return Err("Missing semicolon at the end of statement".to_string());
        }
    }

    Ok(())
}

fn validate_safety(expr: &str) -> Result<(), String> {
    let mut warnings = Vec::new();

    // Check for eval() usage
    if expr.contains("eval(") {
        warnings.push("Unsafe: eval() is not allowed in expressions");
    }

    // Check for global object access
    if expr.contains("window.") || expr.contains("document.") {
        warnings.push("Unsafe: access to global objects is not allowed");
    }

    // Check for __proto__ access
    if expr.contains("__proto__") {
        warnings.push("Unsafe: access to __proto__ is not allowed");
    }

    // Check for Function constructor
    if expr.contains("new Function") {
        warnings.push("Unsafe: Function constructor is not allowed");
    }

    if warnings.is_empty() {
        Ok(())
    } else {
        Err(warnings.join("\n"))
    }
}

/// Validate color operations in the expression
fn validate_color_operations(expr: &str) -> Result<(), String> {
    // Check for color function usage
    if COLOR_FUNC_RE.is_match(expr) {
        // Validate color parameters
        if expr.contains("rgbToHsl") || expr.contains("hslToRgb") {
            if !expr.contains("[") || !expr.contains("]") {
                return Err("Color functions expect array parameters".to_string());
            }
        }
    }

    // Check for color property access
    if expr.contains(".color") || expr.contains(".fill") || expr.contains(".stroke") {
        // Validate color component access
        if expr.contains(".alpha") && !expr.contains("[3]") {
            return Err("Use [3] to access alpha component of color".to_string());
        }
    }

    Ok(())
}

/// Validate temporal expressions
fn validate_temporal_expressions(expr: &str) -> Result<(), String> {
    if TEMPORAL_FUNC_RE.is_match(expr) {
        // Check for time parameter
        if !expr.contains("time") && !expr.contains("framesToTime") {
            return Err("Temporal functions require time parameter".to_string());
        }

        // Check for proper time offset usage
        if expr.contains("valueAtTime") {
            let time_offset = expr.contains("time -") || expr.contains("time +");
            if !time_offset && !expr.contains("thisComp.frameDuration") {
                return Err("Consider using time offset or frameDuration for smoother animation".to_string());
            }
        }

        // Check for velocity usage
        if expr.contains("velocityAtTime") && !expr.contains("length") {
            return Err("Consider using length() with velocityAtTime for speed calculation".to_string());
        }
    }

    Ok(())
}

/// Validate expression controllers
fn validate_controllers(expr: &str) -> Result<(), String> {
    for cap in CONTROLLER_RE.captures_iter(expr) {
        let name = cap.name("name").unwrap().as_str();
        let param = cap.name("param").unwrap().as_str();

        // Validate controller name
        if name.is_empty() {
            return Err("Expression controller name cannot be empty".to_string());
        }

        // Validate parameter name
        if param.is_empty() {
            return Err("Expression controller parameter cannot be empty".to_string());
        }

        // Check for common parameter names
        if !["Slider", "Angle", "Checkbox", "Color", "Point"].contains(&param) {
            return Err(format!("Unknown controller parameter type: {}", param));
        }
    }

    Ok(())
} 