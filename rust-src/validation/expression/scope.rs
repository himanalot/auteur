use std::collections::HashMap;
use super::super::errors::{ValidatorError, ErrorContextBuilder, ErrorSeverity};
use super::parser::Expression;
use regex;

/// Represents a scope in an After Effects expression
#[derive(Debug, Clone, PartialEq, Copy)]
pub enum ScopeType {
    Global,
    Function,
    Block,
}

#[derive(Debug, Clone)]
pub struct Scope {
    pub scope_type: ScopeType,
    /// Variables defined in this scope
    pub variables: HashMap<String, String>, // Variable name -> Type
    /// Parent scope (if any)
    pub parent: Option<Box<Scope>>,
}

impl Scope {
    pub fn new(scope_type: ScopeType) -> Self {
        Self {
            scope_type,
            variables: HashMap::new(),
            parent: None,
        }
    }

    pub fn with_parent(scope_type: ScopeType, parent: Scope) -> Self {
        Self {
            scope_type,
            variables: HashMap::new(),
            parent: Some(Box::new(parent)),
        }
    }

    /// Create a new child scope
    pub fn create_child(&self) -> Self {
        Self {
            scope_type: self.scope_type,
            variables: HashMap::new(),
            parent: Some(Box::new(self.clone())),
        }
    }

    /// Add a variable to the current scope
    pub fn add_variable(&mut self, name: String, type_name: String) {
        self.variables.insert(name, type_name);
    }
    
    /// Declare a variable (alias for add_variable for compatibility)
    pub fn declare_variable(&mut self, name: String, type_name: String) {
        self.add_variable(name, type_name);
    }

    /// Look up a variable in the current scope and parent scopes
    pub fn lookup_variable(&self, name: &str) -> Option<&String> {
        self.variables.get(name).or_else(|| {
            self.parent.as_ref().and_then(|parent| parent.lookup_variable(name))
        })
    }
}

/// Scope validator for After Effects expressions
pub struct ScopeValidator {
    /// Current scope
    current_scope: Scope,
    source: String,
}

impl ScopeValidator {
    pub fn new() -> Self {
        let global_scope = Scope::new(ScopeType::Global);
        Self {
            current_scope: global_scope,
            source: String::new(),
        }
    }

    pub fn validate_scope(&mut self, source: &str) -> Result<(), ValidatorError> {
        self.source = source.to_string();
        
        // Add built-in After Effects objects and functions to global scope
        self.add_builtin_globals();
        
        // Validate variable declarations and usage
        self.validate_variables()?;
        
        Ok(())
    }

    fn add_builtin_globals(&mut self) {
        // Add After Effects built-in objects
        self.current_scope.declare_variable("thisComp".to_string(), "Composition".to_string());
        self.current_scope.declare_variable("thisLayer".to_string(), "Layer".to_string());
        self.current_scope.declare_variable("time".to_string(), "Number".to_string());
        self.current_scope.declare_variable("index".to_string(), "Number".to_string());
        
        // Add Math functions
        self.current_scope.declare_variable("Math".to_string(), "Math".to_string());
        
        // Add common functions
        self.current_scope.declare_variable("linear".to_string(), "Function".to_string());
        self.current_scope.declare_variable("ease".to_string(), "Function".to_string());
        self.current_scope.declare_variable("random".to_string(), "Function".to_string());
    }

    fn validate_variables(&self) -> Result<(), ValidatorError> {
        // Simple regex to find variable usage
        let var_pattern = regex::Regex::new(r"\b([a-zA-Z_]\w*)\b").unwrap();
        
        for cap in var_pattern.captures_iter(&self.source) {
            let var_name = &cap[1];
            
            // Skip if it's a JavaScript keyword
            if is_javascript_keyword(var_name) {
                continue;
            }
            
            // Check if variable exists in scope
            if !self.current_scope.lookup_variable(var_name).is_some() {
                let context = ErrorContextBuilder::new()
                    .code_snippet(self.source.clone())
                    .suggestion(Some(format!("Declare variable '{}' before use", var_name)))
                    .build();

                return Err(ValidatorError::Scope {
                    message: format!("Undefined variable: {}", var_name),
                    context,
                    severity: ErrorSeverity::Error,
                    variable: var_name.to_string(),
                });
            }
        }
        
        Ok(())
    }

    /// Enter a new scope
    pub fn enter_scope(&mut self) {
        let new_scope = self.current_scope.create_child();
        self.current_scope = new_scope;
    }

    /// Exit the current scope
    pub fn exit_scope(&mut self) {
        if let Some(parent) = self.current_scope.parent.take() {
            self.current_scope = *parent;
        }
    }

    /// Add a variable to the current scope
    pub fn add_variable(&mut self, name: String, type_name: String) {
        self.current_scope.add_variable(name, type_name);
    }
}

fn is_javascript_keyword(word: &str) -> bool {
    matches!(word,
        "break" | "case" | "catch" | "class" | "const" | "continue" | "debugger" |
        "default" | "delete" | "do" | "else" | "export" | "extends" | "false" |
        "finally" | "for" | "function" | "if" | "import" | "in" | "instanceof" |
        "new" | "null" | "return" | "super" | "switch" | "this" | "throw" |
        "true" | "try" | "typeof" | "var" | "void" | "while" | "with" | "yield"
    )
}

pub fn validate_scope(source: &str) -> Result<(), ValidatorError> {
    let mut validator = ScopeValidator::new();
    validator.validate_scope(source)
}

/// Context for scope validation
struct ValidationContext<'a> {
    expr: &'a Expression,
}

impl<'a> ValidationContext<'a> {
    fn new(expr: &'a Expression) -> Self {
        Self { expr }
    }

    fn error(&self, message: &str) -> ValidatorError {
        let (line, column) = self.expr.location;
        let context = ErrorContextBuilder::new()
            .file("expression".to_string())
            .line(line)
            .column(column)
            .code_snippet(self.expr.source.clone())
            .build();

        ValidatorError::Scope {
            message: message.to_string(),
            context,
            variable: String::new(),
            severity: ErrorSeverity::Error,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::parser::ExpressionParser;

    fn validate_expr(source: &str) -> Result<(), ValidatorError> {
        let mut parser = ExpressionParser::new(source.to_string());
        let _expr = parser.parse().unwrap();
        let mut validator = ScopeValidator::new();
        validator.validate_scope(source)
    }

    #[test]
    fn test_validate_builtin_variable() {
        assert!(validate_expr("time").is_ok());
    }

    #[test]
    fn test_validate_builtin_property() {
        assert!(validate_expr("position").is_ok());
    }

    #[test]
    fn test_validate_undefined_variable() {
        assert!(validate_expr("undefinedVar").is_err());
    }

    #[test]
    fn test_validate_property_access() {
        assert!(validate_expr("thisLayer.position").is_ok());
    }

    #[test]
    fn test_validate_method_call() {
        assert!(validate_expr("transform.position.valueAtTime(time)").is_ok());
    }

    #[test]
    fn test_validate_scoped_variable() {
        let mut validator = ScopeValidator::new();
        validator.add_variable("customVar".to_string(), "Number".to_string());
        let mut parser = ExpressionParser::new("customVar".to_string());
        let expr = parser.parse().unwrap();
        assert!(validator.validate_scope("customVar").is_ok());
    }
} 