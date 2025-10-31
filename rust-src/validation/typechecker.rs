use super::errors::{ValidatorError, ErrorContextBuilder, ErrorSeverity};
use super::rules::PropertyValueType;
use regex::Regex;
use std::collections::HashMap;

/// Type information for common After Effects objects and methods
pub struct TypeChecker {
    /// Maps object types to their methods and expected parameter types
    type_info: HashMap<String, HashMap<String, Vec<PropertyValueType>>>,
}

impl TypeChecker {
    pub fn new() -> Self {
        let mut type_info = HashMap::new();
        
        // Property methods
        let mut property_methods = HashMap::new();
        property_methods.insert("setValue".to_string(), vec![PropertyValueType::CustomValue]);
        property_methods.insert("setValueAtTime".to_string(), vec![
            PropertyValueType::OneD,          // time
            PropertyValueType::CustomValue    // value
        ]);
        property_methods.insert("setValueAtKey".to_string(), vec![
            PropertyValueType::OneD,          // key index
            PropertyValueType::CustomValue    // value
        ]);
        type_info.insert("Property".to_string(), property_methods);
        
        // Layer methods
        let mut layer_methods = HashMap::new();
        layer_methods.insert("duplicate".to_string(), vec![]);
        layer_methods.insert("remove".to_string(), vec![]);
        layer_methods.insert("moveToBeginning".to_string(), vec![]);
        layer_methods.insert("moveToEnd".to_string(), vec![]);
        type_info.insert("Layer".to_string(), layer_methods);
        
        // CompItem methods
        let mut comp_methods = HashMap::new();
        comp_methods.insert("duplicate".to_string(), vec![]);
        type_info.insert("CompItem".to_string(), comp_methods);
        
        Self { type_info }
    }
    
    /// Validates type usage in scripts
    pub fn validate_types(&self, script: &str, file_path: &str) -> Vec<ValidatorError> {
        let mut errors = Vec::new();
        
        // Check instanceof patterns
        self.validate_instanceof(script, file_path, &mut errors);
        
        // Check setValue type mismatches
        self.validate_set_value_types(script, file_path, &mut errors);
        
        // Check array dimension mismatches
        self.validate_array_dimensions(script, file_path, &mut errors);
        
        errors
    }
    
    /// Validates instanceof checks
    fn validate_instanceof(&self, script: &str, file_path: &str, errors: &mut Vec<ValidatorError>) {
        let instanceof_regex = Regex::new(r"(\w+)\s*instanceof\s*(\w+)").unwrap();
        
        for capture in instanceof_regex.captures_iter(script) {
            let var_name = &capture[1];
            let type_name = &capture[2];
            
            // Check for common mistakes
            match type_name {
                "Layer" if var_name.contains("comp") => {
                    let match_pos = capture.get(0).unwrap().start();
                    let line_num = script[..match_pos].lines().count();
                    
                    let context = ErrorContextBuilder::new()
                        .file(file_path.to_string())
                        .line(line_num)
                        .column(1)
                        .code_snippet(capture[0].to_string())
                        .suggestion(Some("Did you mean 'instanceof CompItem'?".to_string()))
                        .build();
                        
                    errors.push(ValidatorError::Type {
                        message: "Suspicious instanceof check - comp variable checked against Layer".to_string(),
                        context,
                        severity: ErrorSeverity::Warning,
                    });
                }
                "Comp" => {
                    let match_pos = capture.get(0).unwrap().start();
                    let line_num = script[..match_pos].lines().count();
                    
                    let context = ErrorContextBuilder::new()
                        .file(file_path.to_string())
                        .line(line_num)
                        .column(1)
                        .code_snippet(capture[0].to_string())
                        .suggestion(Some("Use 'CompItem' instead of 'Comp'".to_string()))
                        .build();
                        
                    errors.push(ValidatorError::Type {
                        message: "Invalid type name 'Comp' - should be 'CompItem'".to_string(),
                        context,
                        severity: ErrorSeverity::Error,
                    });
                }
                _ => {}
            }
        }
    }
    
    /// Validates setValue type usage
    fn validate_set_value_types(&self, script: &str, file_path: &str, errors: &mut Vec<ValidatorError>) {
        // Check for string values passed to numeric properties
        let opacity_string_regex = Regex::new(r#"opacity\.setValue\s*\(\s*["'](\d+%?)["']\s*\)"#).unwrap();
        
        for capture in opacity_string_regex.captures_iter(script) {
            let match_pos = capture.get(0).unwrap().start();
            let line_num = script[..match_pos].lines().count();
            let value_str = &capture[1];
            
            let context = ErrorContextBuilder::new()
                .file(file_path.to_string())
                .line(line_num)
                .column(1)
                .code_snippet(capture[0].to_string())
                .suggestion(Some(format!("Use numeric value: opacity.setValue({})", 
                    value_str.trim_end_matches('%'))))
                .build();
                
            errors.push(ValidatorError::Type {
                message: "opacity.setValue() expects a number (0-100), not a string".to_string(),
                context,
                severity: ErrorSeverity::Error,
            });
        }
        
        // Check for position setValue with wrong dimensions
        let position_regex = Regex::new(r#"position\.setValue\s*\(\s*\[([^\]]+)\]\s*\)"#).unwrap();
        
        for capture in position_regex.captures_iter(script) {
            let values_str = &capture[1];
            let values: Vec<&str> = values_str.split(',').collect();
            
            // Position can be 2D or 3D, but not 1D or 4D+
            if values.len() == 1 || values.len() > 3 {
                let match_pos = capture.get(0).unwrap().start();
                let line_num = script[..match_pos].lines().count();
                
                let context = ErrorContextBuilder::new()
                    .file(file_path.to_string())
                    .line(line_num)
                    .column(1)
                    .code_snippet(capture[0].to_string())
                    .suggestion(Some("position requires [x, y] or [x, y, z]".to_string()))
                    .build();
                    
                errors.push(ValidatorError::Type {
                    message: format!("position.setValue() expects 2D or 3D array, got {} dimensions", values.len()),
                    context,
                    severity: ErrorSeverity::Error,
                });
            }
        }
    }
    
    /// Validates array dimensions
    fn validate_array_dimensions(&self, script: &str, file_path: &str, errors: &mut Vec<ValidatorError>) {
        // Check for 3D values assigned to 2D properties
        let scale_2d_regex = Regex::new(r#"scale\.setValue\s*\(\s*\[([^\]]+)\]\s*\)"#).unwrap();
        
        for capture in scale_2d_regex.captures_iter(script) {
            let values_str = &capture[1];
            let values: Vec<&str> = values_str.split(',').collect();
            
            // Scale can be 2D or 3D depending on layer type
            // This is a heuristic check - we warn about potential issues
            if values.len() == 2 {
                // Check if all values are the same (common pattern)
                let trimmed_values: Vec<&str> = values.iter().map(|v| v.trim()).collect();
                if trimmed_values.len() == 2 && trimmed_values[0] == trimmed_values[1] {
                    let match_pos = capture.get(0).unwrap().start();
                    let line_num = script[..match_pos].lines().count();
                    
                    let context = ErrorContextBuilder::new()
                        .file(file_path.to_string())
                        .line(line_num)
                        .column(1)
                        .code_snippet(capture[0].to_string())
                        .suggestion(Some(format!("For 3D layers, use [{}]", 
                            vec![trimmed_values[0]; 3].join(", "))))
                        .build();
                        
                    errors.push(ValidatorError::Type {
                        message: "Scale value might need 3 dimensions for 3D layers".to_string(),
                        context,
                        severity: ErrorSeverity::Info,
                    });
                }
            }
        }
    }
}

/// Validates type usage in scripts
pub fn validate_type_usage(script: &str, file_path: &str) -> Vec<ValidatorError> {
    let checker = TypeChecker::new();
    checker.validate_types(script, file_path)
}