use super::rules::ValidationRule;

pub fn validate_text_document(doc: &serde_json::Value, rule: &ValidationRule) -> Result<(), String> {
    match doc {
        serde_json::Value::Object(obj) => {
            // Validate text color
            if let Some(color) = obj.get("fillColor") {
                validate_color_value(color)?;
            }
            
            // Add other text document validations as needed
            Ok(())
        }
        _ => Err("TextDocument must be an object".to_string())
    }
}

fn validate_color_value(color: &serde_json::Value) -> Result<(), String> {
    match color {
        serde_json::Value::Array(arr) => {
            if arr.len() != 3 {
                return Err("Color must have exactly 3 components (RGB)".to_string());
            }
            
            for component in arr {
                match component {
                    serde_json::Value::Number(n) => {
                        let value = n.as_f64().unwrap();
                        if value < 0.0 || value > 1.0 {
                            return Err("Color components must be between 0.0 and 1.0".to_string());
                        }
                    }
                    _ => return Err("Color components must be numbers".to_string())
                }
            }
            Ok(())
        }
        _ => Err("Color must be an array".to_string())
    }
} 