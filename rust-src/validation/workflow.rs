use super::errors::{ValidatorError, ErrorContextBuilder, ErrorSeverity};
use regex::Regex;

/// Validates After Effects workflow patterns in scripts
pub fn validate_workflow_patterns(script: &str, file_path: &str) -> Vec<ValidatorError> {
    let mut errors = Vec::new();
    
    // Check for undo group patterns
    validate_undo_groups(script, file_path, &mut errors);
    
    // Check for activeItem null checks
    validate_active_item_checks(script, file_path, &mut errors);
    
    // Check for array bounds
    validate_array_access(script, file_path, &mut errors);
    
    errors
}

/// Validates that scripts use proper undo group patterns
fn validate_undo_groups(script: &str, file_path: &str, errors: &mut Vec<ValidatorError>) {
    let begin_undo_regex = Regex::new(r"app\.beginUndoGroup\s*\(").unwrap();
    let end_undo_regex = Regex::new(r"app\.endUndoGroup\s*\(\s*\)").unwrap();
    
    let begin_count = begin_undo_regex.find_iter(script).count();
    let end_count = end_undo_regex.find_iter(script).count();
    
    // Check if script modifies the project but lacks undo groups
    let modifying_patterns = [
        r"\.add[A-Z]",           // addShape, addText, etc.
        r"\.setValue\s*\(",      // setValue calls
        r"\.setValueAtTime\s*\(",
        r"\.remove\s*\(",
        r"\.duplicate\s*\(",
        r"\.moveTo",
        r"\.applyPreset\s*\(",
        r"\.setExpression\s*\(",
    ];
    
    let mut has_modifications = false;
    for pattern in &modifying_patterns {
        let regex = Regex::new(pattern).unwrap();
        if regex.is_match(script) {
            has_modifications = true;
            break;
        }
    }
    
    // If script modifies the project but has no undo groups
    if has_modifications && begin_count == 0 {
        let context = ErrorContextBuilder::new()
            .file(file_path.to_string())
            .line(1)
            .column(1)
            .suggestion(Some("Add app.beginUndoGroup() at the start and app.endUndoGroup() at the end".to_string()))
            .build();
            
        errors.push(ValidatorError::Script {
            message: "Script modifies project but missing undo group".to_string(),
            context,
            severity: ErrorSeverity::Warning,
        });
    }
    
    // Check for mismatched undo groups
    if begin_count != end_count {
        let context = ErrorContextBuilder::new()
            .file(file_path.to_string())
            .line(1)
            .column(1)
            .suggestion(Some(format!("Found {} beginUndoGroup calls but {} endUndoGroup calls", begin_count, end_count)))
            .build();
            
        errors.push(ValidatorError::Script {
            message: "Mismatched undo group calls".to_string(),
            context,
            severity: ErrorSeverity::Error,
        });
    }
    
    // Check for endUndoGroup in try/catch blocks
    let try_catch_regex = Regex::new(r"try\s*\{[^}]*\}\s*catch").unwrap();
    let has_try_catch = try_catch_regex.is_match(script);
    
    if has_try_catch && begin_count > 0 {
        // Look for endUndoGroup in catch blocks
        let catch_with_end_regex = Regex::new(r"catch[^{]*\{[^}]*app\.endUndoGroup\s*\([^}]*\}").unwrap();
        let finally_with_end_regex = Regex::new(r"finally\s*\{[^}]*app\.endUndoGroup\s*\([^}]*\}").unwrap();
        
        if !catch_with_end_regex.is_match(script) && !finally_with_end_regex.is_match(script) {
            let context = ErrorContextBuilder::new()
                .file(file_path.to_string())
                .line(1)
                .column(1)
                .suggestion(Some("Add app.endUndoGroup() in catch or finally block to ensure cleanup".to_string()))
                .build();
                
            errors.push(ValidatorError::Script {
                message: "Missing endUndoGroup in error handling blocks".to_string(),
                context,
                severity: ErrorSeverity::Warning,
            });
        }
    }
}

/// Validates that activeItem is checked before use
fn validate_active_item_checks(script: &str, file_path: &str, errors: &mut Vec<ValidatorError>) {
    let active_item_use = Regex::new(r"app\.project\.activeItem\.").unwrap();
    let active_item_check = Regex::new(r"app\.project\.activeItem\s*(?:!==?\s*null|&&|\|\||instanceof)").unwrap();
    
    // Find all uses of activeItem
    let uses: Vec<_> = active_item_use.find_iter(script).collect();
    let checks: Vec<_> = active_item_check.find_iter(script).collect();
    
    if !uses.is_empty() && checks.is_empty() {
        // Find the first use for error reporting
        if let Some(first_use) = uses.first() {
            let line_num = script[..first_use.start()].lines().count();
            
            let context = ErrorContextBuilder::new()
                .file(file_path.to_string())
                .line(line_num)
                .column(1)
                .suggestion(Some("Add: if (app.project.activeItem) { ... }".to_string()))
                .build();
                
            errors.push(ValidatorError::Script {
                message: "Using app.project.activeItem without null check".to_string(),
                context,
                severity: ErrorSeverity::Warning,
            });
        }
    }
}

/// Validates array access patterns
fn validate_array_access(script: &str, file_path: &str, errors: &mut Vec<ValidatorError>) {
    // Look for direct array access without bounds checking
    let array_access_regex = Regex::new(r"\.layers\[(\d+)\]").unwrap();
    let bounds_check_regex = Regex::new(r"\.layers\.length|\.numLayers").unwrap();
    
    let array_accesses: Vec<_> = array_access_regex.find_iter(script).collect();
    let has_bounds_check = bounds_check_regex.is_match(script);
    
    if !array_accesses.is_empty() && !has_bounds_check {
        if let Some(first_access) = array_accesses.first() {
            let line_num = script[..first_access.start()].lines().count();
            
            let context = ErrorContextBuilder::new()
                .file(file_path.to_string())
                .line(line_num)
                .column(1)
                .suggestion(Some("Check layer count before accessing: if (comp.layers.length > index)".to_string()))
                .build();
                
            errors.push(ValidatorError::Script {
                message: "Accessing layers array without bounds check".to_string(),
                context,
                severity: ErrorSeverity::Warning,
            });
        }
    }
    
    // Check for hard-coded layer indices
    for capture in array_access_regex.captures_iter(script) {
        let index_str = &capture[1];
        if let Ok(index) = index_str.parse::<i32>() {
            if index > 10 {  // Arbitrary threshold for "suspiciously high" index
                let match_pos = capture.get(0).unwrap().start();
                let line_num = script[..match_pos].lines().count();
                
                let context = ErrorContextBuilder::new()
                    .file(file_path.to_string())
                    .line(line_num)
                    .column(1)
                    .suggestion(Some("Consider using layer names or iteration instead of hard-coded indices".to_string()))
                    .build();
                    
                errors.push(ValidatorError::Script {
                    message: format!("Hard-coded layer index {} may be fragile", index),
                    context,
                    severity: ErrorSeverity::Info,
                });
            }
        }
    }
}