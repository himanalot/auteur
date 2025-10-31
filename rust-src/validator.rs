use crate::api::UnifiedApi;
use crate::errors::{ValidationError, ErrorLevel};
use regex::Regex;

pub struct ScriptValidator {
    api: UnifiedApi,
}

impl ScriptValidator {
    pub fn new() -> Self {
        ScriptValidator {
            api: UnifiedApi::new(),
        }
    }

    pub fn validate_script(&mut self, script: &str) -> Result<(), Vec<ValidationError>> {
        let mut errors = Vec::new();

        if let Err(e) = self.validate_syntax(script) {
            errors.push(e);
        }

        errors.extend(self.validate_api_usage(script));
        errors.extend(self.validate_match_names(script));
        errors.extend(self.validate_es6_features(script));

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    fn validate_syntax(&self, script: &str) -> Result<(), ValidationError> {
        // Basic syntax validation
        if !script.contains(";") {
            return Err(ValidationError::new(
                "Missing semicolons",
                0,
                0,
                ErrorLevel::Error,
                Some("Add semicolons at the end of statements".to_string()),
            ));
        }
        Ok(())
    }

    fn validate_api_usage(&mut self, script: &str) -> Vec<ValidationError> {
        let mut errors = Vec::new();

        // Method call validation
        let method_call_re = Regex::new(r"(?m)(\w+)\.(\w+)\(").unwrap();
        for cap in method_call_re.captures_iter(script) {
            let class_name = &cap[1];
            let method_name = &cap[2];
            
            if !self.api.validate_method(class_name, method_name) {
                // Get line and column information
                let full_match = cap.get(0).unwrap();
                let line = script[..full_match.start()].lines().count();
                let last_newline = script[..full_match.start()].rfind('\n').unwrap_or(0);
                let column = full_match.start() - last_newline;
                
                errors.push(ValidationError::new(
                    &format!("Invalid method call: {}.{}", class_name, method_name),
                    line,
                    column,
                    ErrorLevel::Error,
                    Some(format!("Check documentation for valid methods of {}", class_name)),
                ));
            }
        }

        // Property access validation (simple pattern, we'll filter out method calls)
        let property_access_re = Regex::new(r"(\w+)\.(\w+)").unwrap();
        for cap in property_access_re.captures_iter(script) {
            let class_name = &cap[1];
            let property_name = &cap[2];
            
            // Skip if this looks like a method call (followed by parentheses)
            let end_pos = cap.get(0).unwrap().end();
            if end_pos < script.len() {
                let remaining = &script[end_pos..];
                if remaining.trim_start().starts_with('(') {
                    continue; // This is a method call, skip it
                }
            }
            
            if let Err(_) = self.api.validate_property_access(class_name, property_name, None) {
                // Get line and column information
                let full_match = cap.get(0).unwrap();
                let line = script[..full_match.start()].lines().count();
                let last_newline = script[..full_match.start()].rfind('\n').unwrap_or(0);
                let column = full_match.start() - last_newline;
                
                errors.push(ValidationError::new(
                    &format!("Invalid property access: {}.{}", class_name, property_name),
                    line,
                    column,
                    ErrorLevel::Error,
                    Some(format!("Check documentation for valid properties of {}", class_name)),
                ));
            }
        }

        errors
    }

    fn validate_match_names(&self, script: &str) -> Vec<ValidationError> {
        let mut errors = Vec::new();

        // Match name validation with fuzzy matching suggestions
        
        // Effect match names - look for patterns like property("ADBE Effect Name")
        let effect_match_re = Regex::new(r#"property\s*\(\s*["']([^"']+)["']\s*\)"#).unwrap();
        for cap in effect_match_re.captures_iter(script) {
            let match_name = &cap[1];
            
            // Check if it's a valid effect match name
            if match_name.starts_with("ADBE") || match_name.starts_with("CC") || 
               match_name.starts_with("APC") || match_name.starts_with("VISINF") ||
               match_name.starts_with("CS") || match_name.starts_with("ISL") ||
               match_name.starts_with("SYNTHAP") || match_name.starts_with("CINEMA") ||
               match_name.starts_with("EXtractoR") || match_name.starts_with("IDentifier") ||
               match_name.starts_with("Keylight") {
                
                if !self.api.validate_effect_match_name(match_name) && 
                   !self.api.validate_property_match_name(match_name) &&
                   !self.api.validate_layer_match_name(match_name) {
                    
                    // Try to find suggestions using fuzzy matching
                    let suggestion = self.api.suggest_effect_match_name(match_name)
                        .or_else(|| self.api.suggest_property_match_name(match_name))
                        .or_else(|| self.api.suggest_layer_match_name(match_name));
                    
                    let error_msg = if let Some(suggestion) = suggestion {
                        suggestion
                    } else {
                        format!("Invalid match name: '{}'\n\nThis match name is not recognized. Please check the After Effects documentation for valid match names.", match_name)
                    };
                    
                    // Get line and column information
                    let full_match = cap.get(0).unwrap();
                    let line = script[..full_match.start()].lines().count();
                    let last_newline = script[..full_match.start()].rfind('\n').unwrap_or(0);
                    let column = full_match.start() - last_newline;
                    
                    errors.push(ValidationError::new(
                        &error_msg,
                        line,
                        column,
                        ErrorLevel::Error,
                        Some("Use a valid match name from the After Effects documentation".to_string()),
                    ));
                }
            }
        }

        // Layer type validation - look for patterns like layers.add("Layer Type")
        let layer_type_re = Regex::new(r#"layers\.add\w*\s*\(\s*["']([^"']+)["']\s*\)"#).unwrap();
        for cap in layer_type_re.captures_iter(script) {
            let layer_type = &cap[1];
            
            if layer_type.starts_with("ADBE") {
                if !self.api.validate_layer_match_name(layer_type) {
                    let suggestion = self.api.suggest_layer_match_name(layer_type);
                    
                    let error_msg = if let Some(suggestion) = suggestion {
                        suggestion
                    } else {
                        format!("Invalid layer type: '{}'\n\nThis layer type is not recognized.", layer_type)
                    };
                    
                    // Get line and column information
                    let full_match = cap.get(0).unwrap();
                    let line = script[..full_match.start()].lines().count();
                    let last_newline = script[..full_match.start()].rfind('\n').unwrap_or(0);
                    let column = full_match.start() - last_newline;
                    
                    errors.push(ValidationError::new(
                        &error_msg,
                        line,
                        column,
                        ErrorLevel::Error,
                        Some("Use a valid layer type match name".to_string()),
                    ));
                }
            }
        }

        errors
    }

    fn validate_es6_features(&self, script: &str) -> Vec<ValidationError> {
        let mut errors = Vec::new();

        // Check for ES6 features that might not be supported
        let es6_features = vec![
            ("=>", "Arrow functions"),
            ("let", "let keyword"),
            ("const", "const keyword"),
            ("class", "class keyword"),
            ("`", "Template literals"),
        ];

        for (feature, name) in es6_features {
            if script.contains(feature) {
                // Get line and column information
                let pos = script.find(feature).unwrap();
                let line = script[..pos].lines().count();
                let last_newline = script[..pos].rfind('\n').unwrap_or(0);
                let column = pos - last_newline;
                
                errors.push(ValidationError::new(
                    &format!("ES6 feature '{}' is not supported in ExtendScript", name),
                    line,
                    column,
                    ErrorLevel::Error,
                    Some("Use ES5 syntax instead".to_string()),
                ));
            }
        }

        errors
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_temporal_ease() {
        let mut validator = ScriptValidator::new();
        
        // Test valid 1D property
        let script = r#"
            var prop = layer.property("Opacity");
            prop.setTemporalEaseAtKey(1, [{influence: 50, speed: 0}], [{influence: 50, speed: 0}]);
        "#;
        assert!(validator.validate_script(script).is_ok());
        
        // Test invalid 2D property
        let script = r#"
            var prop = layer.property("Position");
            prop.setTemporalEaseAtKey(1, [{influence: 50, speed: 0}], [{influence: 50, speed: 0}]);
        "#;
        assert!(validator.validate_script(script).is_err());
    }

    #[test]
    fn test_validate_text_properties() {
        let mut validator = ScriptValidator::new();
        
        // Test valid text color
        let script = r#"
            var textLayer = comp.layers.addText("Hello");
            var textProp = textLayer.property("Source Text");
            var textDocument = textProp.value;
            textDocument.fillColor = [1, 0, 0];
        "#;
        assert!(validator.validate_script(script).is_ok());
        
        // Test invalid text color
        let script = r#"
            var textLayer = comp.layers.addText("Hello");
            var textProp = textLayer.property("Source Text");
            var textDocument = textProp.value;
            textDocument.fillColor = [1, 0];  // Missing blue component
        "#;
        assert!(validator.validate_script(script).is_err());
    }
}