use std::fs;
use ae_script_validator::ScriptValidator;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: {} <script_file>", args[0]);
        std::process::exit(1);
    }

    let ignore_errors = args.contains(&"--ignore-errors".to_string());
    let script_path = if ignore_errors {
        &args[2]
    } else {
        &args[1]
    };

    let script = match fs::read_to_string(script_path) {
        Ok(content) => content,
        Err(e) => {
            eprintln!("Error reading file: {}", e);
            std::process::exit(1);
        }
    };

    let mut validator = ScriptValidator::new();
    match validator.validate_script(&script) {
        Ok(_) => println!("Script validation successful!"),
        Err(errors) => {
            for error in errors {
                eprintln!("Validation error at line {}, column {}: {}", error.line, error.column, error.message);
                if let Some(suggestion) = error.suggestion {
                    eprintln!("\nSuggestion: {}\n", suggestion);
                }
            }
            if !ignore_errors {
                std::process::exit(1);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ae_script_validator::ScriptValidator;

    #[test]
    fn test_validator_with_sample_scripts() {
        let mut validator = ScriptValidator::new();

        // Test a valid script
        let valid_script = r#"
            var comp = app.project.activeItem;
            if (comp instanceof CompItem) {
                var layer = comp.layers.addShape();
                var transform = layer.transform;
                transform.position.setValue([100, 100]);
                transform.scale.setValue([50, 50]);
            }
        "#;
        assert!(validator.validate_script(valid_script).is_ok());

        // Test an invalid script
        let invalid_script = r#"
            var comp = app.project.activeItem;
            if (comp instanceof CompItem) {
                var layer = comp.layers.addShape();
                layer.nonexistentMethod();
            }
        "#;
        assert!(validator.validate_script(invalid_script).is_err());
    }
} 