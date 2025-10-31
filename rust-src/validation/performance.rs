use regex::Regex;
use lazy_static::lazy_static;
use std::collections::HashMap;

lazy_static! {
    static ref LAYER_REF_RE: Regex = Regex::new(r"thisLayer|thisComp\.layer\(\s*['\x22]?[\w\s]+['\x22]?\s*\)").unwrap();
    static ref PROPERTY_REF_RE: Regex = Regex::new(r"\.(position|scale|rotation|opacity|transform|effect|sourceRectAtTime|mask|property|value|valueAtTime)").unwrap();
    static ref MATH_FUNC_RE: Regex = Regex::new(r"\b(Math\.(abs|sin|cos|sqrt|pow|random|round|floor|ceil)|random)\b").unwrap();
    static ref TIME_ACCESS_RE: Regex = Regex::new(r"\b(time|timeToFrames|framesToTime|key|valueAtTime|velocityAtTime)\b").unwrap();
    static ref LOOP_RE: Regex = Regex::new(r"\b(for|while|do)\b").unwrap();
    static ref ARRAY_METHOD_RE: Regex = Regex::new(r"\.(map|filter|reduce|forEach|every|some)\b").unwrap();
}

#[derive(Debug)]
pub struct PerformanceMetrics {
    pub layer_refs: usize,
    pub property_refs: usize,
    pub math_funcs: usize,
    pub time_accesses: usize,
    pub loop_count: usize,
    pub array_methods: usize,
    pub expression_length: usize,
    pub nested_calls: usize,
}

impl PerformanceMetrics {
    pub fn analyze(expr: &str) -> Self {
        PerformanceMetrics {
            layer_refs: LAYER_REF_RE.find_iter(expr).count(),
            property_refs: PROPERTY_REF_RE.find_iter(expr).count(),
            math_funcs: MATH_FUNC_RE.find_iter(expr).count(),
            time_accesses: TIME_ACCESS_RE.find_iter(expr).count(),
            loop_count: LOOP_RE.find_iter(expr).count(),
            array_methods: ARRAY_METHOD_RE.find_iter(expr).count(),
            expression_length: expr.len(),
            nested_calls: count_nested_calls(expr),
        }
    }

    pub fn get_warnings(&self) -> Vec<String> {
        let mut warnings = Vec::new();
        
        // Layer reference checks
        if self.layer_refs > 3 {
            warnings.push(format!(
                "Expression uses {} layer references. Consider caching layer references in variables.",
                self.layer_refs
            ));
        }

        // Property reference checks
        if self.property_refs > 5 {
            warnings.push(format!(
                "Expression uses {} property references. Consider caching property values.",
                self.property_refs
            ));
        }

        // Math function checks
        if self.math_funcs > 8 {
            warnings.push(format!(
                "Expression uses {} math functions. Consider pre-calculating values where possible.",
                self.math_funcs
            ));
        }

        // Time access checks
        if self.time_accesses > 4 {
            warnings.push(format!(
                "Expression accesses time {} times. Cache time-based calculations where possible.",
                self.time_accesses
            ));
        }

        // Loop checks
        if self.loop_count > 1 {
            warnings.push("Multiple loops detected. Consider optimizing or combining loops.".to_string());
        }

        // Array method checks
        if self.array_methods > 2 {
            warnings.push("Multiple array methods detected. Consider using traditional loops for better performance.".to_string());
        }

        // Expression length checks
        if self.expression_length > 500 {
            warnings.push("Expression is very long. Consider breaking into smaller, reusable functions.".to_string());
        }

        // Nested call checks
        if self.nested_calls > 3 {
            warnings.push(format!(
                "Expression has {} levels of nested function calls. Consider flattening the structure.",
                self.nested_calls
            ));
        }

        warnings
    }

    pub fn get_optimization_suggestions(&self) -> Vec<String> {
        let mut suggestions = Vec::new();

        if self.layer_refs > 3 {
            suggestions.push("var layer = thisComp.layer(1); // Cache layer reference".to_string());
        }

        if self.property_refs > 5 {
            suggestions.push("var pos = transform.position.value; // Cache property value".to_string());
        }

        if self.time_accesses > 4 {
            suggestions.push("var t = time; // Cache time value".to_string());
        }

        if self.loop_count > 1 {
            suggestions.push("// Combine loops:\nvar result = 0;\nfor (var i = 0; i < n; i++) {\n    // Handle multiple operations here\n}".to_string());
        }

        suggestions
    }
}

fn count_nested_calls(expr: &str) -> usize {
    let mut max_depth: usize = 0;
    let mut current_depth: usize = 0;
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
            '(' if !in_string => {
                current_depth += 1;
                max_depth = max_depth.max(current_depth);
            }
            ')' if !in_string => {
                current_depth = current_depth.saturating_sub(1);
            }
            _ => {}
        }
    }

    max_depth
} 