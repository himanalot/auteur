use super::parser::{Token, Expression};
use super::super::errors::{ValidatorError, ErrorContextBuilder, ErrorSeverity};
use std::collections::HashMap;

/// Represents the type of a value in an After Effects expression
#[derive(Debug, Clone, PartialEq)]
pub enum Type {
    /// Number type (float)
    Number,
    /// String type
    String,
    /// Boolean type
    Boolean,
    /// Array type with element type
    Array(Box<Type>),
    /// Object type with property types
    Object(HashMap<String, Type>),
    /// Property type (e.g., position, scale)
    Property(String),
    /// Method type with parameter types and return type
    Method {
        params: Vec<Type>,
        return_type: Box<Type>,
    },
    /// Color type (RGBA)
    Color,
    /// Vector type with dimension
    Vector(usize),
    /// Temporal type (for time-based expressions)
    Temporal(Box<Type>),
    /// Expression Controller type
    Controller {
        name: String,
        value_type: Box<Type>,
    },
    /// Any type (used for dynamic typing)
    Any,
}

/// Type checker for After Effects expressions
pub struct TypeChecker {
    /// Type environment mapping identifiers to their types
    env: HashMap<String, Type>,
}

impl TypeChecker {
    pub fn new() -> Self {
        let mut env = HashMap::new();
        
        // Add built-in types
        env.insert("time".to_string(), Type::Number);
        env.insert("index".to_string(), Type::Number);
        env.insert("name".to_string(), Type::String);
        env.insert("value".to_string(), Type::Any);
        
        // Add common property types with more specific types
        env.insert("position".to_string(), Type::Vector(2));
        env.insert("scale".to_string(), Type::Vector(2));
        env.insert("rotation".to_string(), Type::Number);
        env.insert("opacity".to_string(), Type::Number);
        env.insert("color".to_string(), Type::Color);
        env.insert("fill".to_string(), Type::Color);
        env.insert("stroke".to_string(), Type::Color);
        
        // Add temporal methods
        env.insert(
            "valueAtTime".to_string(),
            Type::Method {
                params: vec![Type::Number],
                return_type: Box::new(Type::Temporal(Box::new(Type::Any))),
            },
        );
        env.insert(
            "velocityAtTime".to_string(),
            Type::Method {
                params: vec![Type::Number],
                return_type: Box::new(Type::Temporal(Box::new(Type::Vector(2)))),
            },
        );

        // Add color methods
        env.insert(
            "rgbToHsl".to_string(),
            Type::Method {
                params: vec![Type::Color],
                return_type: Box::new(Type::Color),
            },
        );
        env.insert(
            "hslToRgb".to_string(),
            Type::Method {
                params: vec![Type::Color],
                return_type: Box::new(Type::Color),
            },
        );

        // Add common math methods
        env.insert(
            "linear".to_string(),
            Type::Method {
                params: vec![Type::Number, Type::Number, Type::Number, Type::Number],
                return_type: Box::new(Type::Number),
            },
        );
        env.insert(
            "ease".to_string(),
            Type::Method {
                params: vec![Type::Number, Type::Number, Type::Number, Type::Number],
                return_type: Box::new(Type::Number),
            },
        );

        Self { env }
    }

    /// Check types in an expression
    pub fn check(&self, expr: &Expression) -> Result<Type, ValidatorError> {
        let mut ctx = TypeContext::new(expr);
        self.check_tokens(&expr.tokens, &mut ctx)
    }

    /// Check types in a sequence of tokens
    fn check_tokens(&self, tokens: &[Token], ctx: &mut TypeContext) -> Result<Type, ValidatorError> {
        if tokens.is_empty() {
            return Ok(Type::Any);
        }

        let mut pos = 0;
        let mut current_type = self.check_token(&tokens[pos], ctx)?;

        pos += 1;
        while pos < tokens.len() {
            match &tokens[pos] {
                Token::PropertyAccess => {
                    pos += 1;
                    if pos >= tokens.len() {
                        return Err(ctx.error("Expected property name after '.'"));
                    }
                    current_type = self.check_property_access(current_type, &tokens[pos], ctx)?;
                    pos += 1;
                }
                Token::BinaryOp(op) => {
                    pos += 1;
                    if pos >= tokens.len() {
                        return Err(ctx.error("Expected expression after operator"));
                    }
                    let right_type = self.check_token(&tokens[pos], ctx)?;
                    current_type = self.check_binary_op(op, current_type, right_type, ctx)?;
                    pos += 1;
                }
                Token::LParen => {
                    if let Type::Method { params, return_type } = current_type {
                        pos += 1;
                        let args = self.collect_arguments(tokens, &mut pos, ctx)?;
                        if args.len() != params.len() {
                            return Err(ctx.error(&format!(
                                "Expected {} arguments, found {}",
                                params.len(),
                                args.len()
                            )));
                        }
                        for (arg, param_type) in args.iter().zip(params.iter()) {
                            if !self.types_match(arg, param_type) {
                                return Err(ctx.error(&format!(
                                    "Type mismatch: expected {:?}, found {:?}",
                                    param_type,
                                    arg
                                )));
                            }
                        }
                        current_type = *return_type;
                    } else {
                        return Err(ctx.error("Cannot call non-method type"));
                    }
                }
                _ => return Err(ctx.error("Unexpected token")),
            }
        }

        Ok(current_type)
    }

    /// Check the type of a single token
    fn check_token(&self, token: &Token, ctx: &mut TypeContext) -> Result<Type, ValidatorError> {
        match token {
            Token::Number(_) => Ok(Type::Number),
            Token::String(_) => Ok(Type::String),
            Token::Boolean(_) => Ok(Type::Boolean),
            Token::Array(elements) => {
                if elements.is_empty() {
                    Ok(Type::Array(Box::new(Type::Any)))
                } else {
                    let element_type = self.check_token(&elements[0], ctx)?;
                    for element in &elements[1..] {
                        let t = self.check_token(element, ctx)?;
                        if !self.types_match(&t, &element_type) {
                            return Err(ctx.error("Inconsistent array element types"));
                        }
                    }
                    Ok(Type::Array(Box::new(element_type)))
                }
            }
            Token::Object(properties) => {
                let mut prop_types = HashMap::new();
                for (key, value) in properties {
                    prop_types.insert(key.clone(), self.check_token(value, ctx)?);
                }
                Ok(Type::Object(prop_types))
            }
            Token::Identifier(name) => {
                self.env.get(name)
                    .cloned()
                    .ok_or_else(|| ctx.error(&format!("Unknown identifier: {}", name)))
            }
            _ => Err(ctx.error("Unexpected token")),
        }
    }

    /// Check property access
    fn check_property_access(
        &self,
        obj_type: Type,
        prop_token: &Token,
        ctx: &mut TypeContext,
    ) -> Result<Type, ValidatorError> {
        if let Token::Identifier(prop_name) = prop_token {
            match obj_type {
                Type::Object(properties) => {
                    properties.get(prop_name)
                        .cloned()
                        .ok_or_else(|| ctx.error(&format!("Unknown property: {}", prop_name)))
                }
                Type::Any => Ok(Type::Any),
                _ => Err(ctx.error("Cannot access properties of non-object type")),
            }
        } else {
            Err(ctx.error("Expected property name"))
        }
    }

    /// Check binary operator with enhanced type checking
    fn check_binary_op(
        &self,
        op: &str,
        left: Type,
        right: Type,
        ctx: &mut TypeContext,
    ) -> Result<Type, ValidatorError> {
        match op {
            "+" | "-" | "*" | "/" => {
                if self.is_numeric(&left) && self.is_numeric(&right) {
                    Ok(Type::Number)
                } else if self.is_vector(&left) && self.is_vector(&right) {
                    if self.vectors_compatible(&left, &right) {
                        Ok(left)
                    } else {
                        Err(ctx.error("Vector dimensions do not match"))
                    }
                } else if self.is_color(&left) && self.is_color(&right) {
                    Ok(Type::Color)
                } else {
                    Err(ctx.error("Invalid operand types for arithmetic operator"))
                }
            }
            "==" | "!=" | "<" | ">" | "<=" | ">=" => {
                if self.types_match(&left, &right) {
                    Ok(Type::Boolean)
                } else {
                    Err(ctx.error("Type mismatch in comparison"))
                }
            }
            "&&" | "||" => {
                if matches!(left, Type::Boolean) && matches!(right, Type::Boolean) {
                    Ok(Type::Boolean)
                } else {
                    Err(ctx.error("Boolean operator requires boolean operands"))
                }
            }
            _ => Err(ctx.error("Unknown operator")),
        }
    }

    /// Collect method call arguments
    fn collect_arguments(
        &self,
        tokens: &[Token],
        pos: &mut usize,
        ctx: &mut TypeContext,
    ) -> Result<Vec<Type>, ValidatorError> {
        let mut args = Vec::new();
        let mut arg_tokens = Vec::new();

        while *pos < tokens.len() {
            match &tokens[*pos] {
                Token::RParen => {
                    if !arg_tokens.is_empty() {
                        args.push(self.check_tokens(&arg_tokens, ctx)?);
                    }
                    *pos += 1;
                    return Ok(args);
                }
                Token::Comma => {
                    if !arg_tokens.is_empty() {
                        args.push(self.check_tokens(&arg_tokens, ctx)?);
                        arg_tokens.clear();
                    }
                    *pos += 1;
                }
                _ => {
                    arg_tokens.push(tokens[*pos].clone());
                    *pos += 1;
                }
            }
        }

        Err(ctx.error("Unterminated method call"))
    }

    /// Check if a type is numeric
    fn is_numeric(&self, t: &Type) -> bool {
        matches!(t, Type::Number | Type::Any)
    }

    /// Check if two types match (considering Any as compatible with everything)
    fn types_match(&self, t1: &Type, t2: &Type) -> bool {
        t1 == t2 || matches!(t1, Type::Any) || matches!(t2, Type::Any)
    }

    /// Check if a type is a color type
    fn is_color(&self, t: &Type) -> bool {
        matches!(t, Type::Color)
    }

    /// Check if a type is a vector type
    fn is_vector(&self, t: &Type) -> bool {
        matches!(t, Type::Vector(_))
    }

    /// Check if a type is temporal
    fn is_temporal(&self, t: &Type) -> bool {
        matches!(t, Type::Temporal(_))
    }

    /// Check if a type is a controller
    fn is_controller(&self, t: &Type) -> bool {
        matches!(t, Type::Controller { .. })
    }

    /// Get the dimension of a vector type
    fn vector_dimension(&self, t: &Type) -> Option<usize> {
        match t {
            Type::Vector(dim) => Some(*dim),
            _ => None,
        }
    }

    /// Check if two vector types are compatible
    fn vectors_compatible(&self, t1: &Type, t2: &Type) -> bool {
        match (t1, t2) {
            (Type::Vector(d1), Type::Vector(d2)) => d1 == d2,
            _ => false,
        }
    }
}

/// Context for type checking
struct TypeContext<'a> {
    expr: &'a Expression,
}

impl<'a> TypeContext<'a> {
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

        ValidatorError::Type {
            message: message.to_string(),
            context,
            severity: ErrorSeverity::Error,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::parser::ExpressionParser;

    fn check_expr(source: &str) -> Result<Type, ValidatorError> {
        let mut parser = ExpressionParser::new(source.to_string());
        let expr = parser.parse().unwrap();
        let checker = TypeChecker::new();
        checker.check(&expr)
    }

    #[test]
    fn test_check_number() {
        assert_eq!(check_expr("42.5").unwrap(), Type::Number);
    }

    #[test]
    fn test_check_string() {
        assert_eq!(check_expr("\"hello\"").unwrap(), Type::String);
    }

    #[test]
    fn test_check_boolean() {
        assert_eq!(check_expr("true").unwrap(), Type::Boolean);
    }

    #[test]
    fn test_check_array() {
        let result = check_expr("[1, 2, 3]").unwrap();
        assert!(matches!(result, Type::Array(t) if *t == Type::Number));
    }

    #[test]
    fn test_check_property_access() {
        assert_eq!(check_expr("position").unwrap(), Type::Vector(2));
    }

    #[test]
    fn test_check_method_call() {
        assert_eq!(check_expr("valueAtTime(0)").unwrap(), Type::Temporal(Box::new(Type::Any)));
    }
} 