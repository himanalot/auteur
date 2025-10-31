use super::super::errors::{ValidatorError, ErrorContext, ErrorContextBuilder, ErrorSeverity};
use serde_json::Value;
use std::collections::HashMap;

/// Represents a token in an After Effects expression
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    /// Identifier (variable name, function name, etc.)
    Identifier(String),
    /// Numeric literal
    Number(f64),
    /// String literal
    String(String),
    /// Boolean literal
    Boolean(bool),
    /// Array literal
    Array(Vec<Token>),
    /// Object literal
    Object(HashMap<String, Token>),
    /// Property access (.)
    PropertyAccess,
    /// Method call
    MethodCall {
        name: String,
        arguments: Vec<Token>,
    },
    /// Binary operator
    BinaryOp(String),
    /// Unary operator
    UnaryOp(String),
    /// Left parenthesis
    LParen,
    /// Right parenthesis
    RParen,
    /// Left bracket
    LBracket,
    /// Right bracket
    RBracket,
    /// Left brace
    LBrace,
    /// Right brace
    RBrace,
    /// Comma
    Comma,
    /// Semicolon
    Semicolon,
    /// Colon
    Colon,
}

/// Represents a parsed expression
#[derive(Debug)]
pub struct Expression {
    /// The tokens that make up the expression
    pub tokens: Vec<Token>,
    /// The source code of the expression
    pub source: String,
    /// The location of the expression in the source code
    pub location: (usize, usize),
}

/// Parser for After Effects expressions
pub struct ExpressionParser {
    /// The source code being parsed
    source: String,
    /// Current position in the source code
    pos: usize,
    /// Current line number
    line: usize,
    /// Current column number
    column: usize,
    /// The tokens that make up the expression
    tokens: Vec<Token>,
    /// Current index in the tokens
    current: usize,
}

impl ExpressionParser {
    pub fn new(source: String) -> Self {
        Self {
            source,
            pos: 0,
            line: 1,
            column: 1,
            tokens: Vec::new(),
            current: 0,
        }
    }

    /// Parse an expression
    pub fn parse(&mut self) -> Result<Expression, ValidatorError> {
        self.tokenize()?;
        self.parse_tokens()?;
        Ok(Expression {
            tokens: self.tokens.clone(),
            source: self.source.clone(),
            location: (self.line, self.column),
        })
    }

    /// Tokenize the source code
    fn tokenize(&mut self) -> Result<(), ValidatorError> {
        let mut chars = self.source.chars().peekable();
        let mut current_token = String::new();

        while let Some(c) = chars.next() {
            match c {
                '(' => self.tokens.push(Token::LParen),
                ')' => self.tokens.push(Token::RParen),
                '[' => self.tokens.push(Token::LBracket),
                ']' => self.tokens.push(Token::RBracket),
                '{' => self.tokens.push(Token::LBrace),
                '}' => self.tokens.push(Token::RBrace),
                '.' => self.tokens.push(Token::PropertyAccess),
                ',' => self.tokens.push(Token::Comma),
                ';' => self.tokens.push(Token::Semicolon),
                ':' => self.tokens.push(Token::Colon),
                '+' | '-' | '*' | '/' | '%' | '=' | '!' | '<' | '>' | '&' | '|' => {
                    current_token.push(c);
                    while let Some(&next) = chars.peek() {
                        if "+-*/%=!<>&|".contains(next) {
                            current_token.push(chars.next().unwrap());
                        } else {
                            break;
                        }
                    }
                    self.tokens.push(Token::BinaryOp(current_token.clone()));
                    current_token.clear();
                }
                '"' | '\'' => {
                    let quote = c;
                    while let Some(ch) = chars.next() {
                        if ch == quote {
                            break;
                        }
                        current_token.push(ch);
                    }
                    self.tokens.push(Token::String(current_token.clone()));
                    current_token.clear();
                }
                c if c.is_ascii_digit() || c == '.' => {
                    current_token.push(c);
                    while let Some(&next) = chars.peek() {
                        if next.is_ascii_digit() || next == '.' {
                            current_token.push(chars.next().unwrap());
                        } else {
                            break;
                        }
                    }
                    if let Ok(num) = current_token.parse::<f64>() {
                        self.tokens.push(Token::Number(num));
                    } else {
                        let context = ErrorContextBuilder::new()
                            .file("expression".to_string())
                            .line(self.line)
                            .column(self.column)
                            .code_snippet(self.source.clone())
                            .suggestion(Some("Check number format".to_string()))
                            .build();

                        return Err(ValidatorError::Expression {
                            message: format!("Invalid number format: {}", current_token),
                            context,
                            severity: ErrorSeverity::Error,
                        });
                    }
                    current_token.clear();
                }
                c if c.is_ascii_alphabetic() || c == '_' => {
                    current_token.push(c);
                    while let Some(&next) = chars.peek() {
                        if next.is_ascii_alphanumeric() || next == '_' {
                            current_token.push(chars.next().unwrap());
                        } else {
                            break;
                        }
                    }
                    self.tokens.push(Token::Identifier(current_token.clone()));
                    current_token.clear();
                }
                c if c.is_whitespace() => continue,
                _ => {
                    let context = ErrorContextBuilder::new()
                        .file("expression".to_string())
                        .line(self.line)
                        .column(self.column)
                        .code_snippet(self.source.clone())
                        .suggestion(Some("Remove invalid character".to_string()))
                        .build();

                    return Err(ValidatorError::Expression {
                        message: format!("Invalid character: {}", c),
                        context,
                        severity: ErrorSeverity::Error,
                    });
                }
            }
        }

        Ok(())
    }

    /// Parse the tokens
    fn parse_tokens(&mut self) -> Result<(), ValidatorError> {
        while self.current < self.tokens.len() {
            self.parse_expression()?;
        }
        Ok(())
    }

    /// Parse an expression
    fn parse_expression(&mut self) -> Result<(), ValidatorError> {
        match &self.tokens[self.current] {
            Token::Identifier(_) => {
                self.current += 1;
                if self.current < self.tokens.len() {
                    match &self.tokens[self.current] {
                        Token::LParen => self.parse_function_call()?,
                        Token::PropertyAccess => self.parse_property_access()?,
                        _ => (),
                    }
                }
            }
            Token::Number(_) | Token::String(_) => {
                self.current += 1;
            }
            Token::BinaryOp(_) => {
                self.current += 1;
                self.parse_expression()?;
            }
            Token::LParen => {
                self.current += 1;
                self.parse_expression()?;
                self.expect_token(Token::RParen)?;
            }
            Token::LBracket => {
                self.current += 1;
                self.parse_array()?;
            }
            Token::LBrace => {
                self.current += 1;
                self.parse_object()?;
            }
            token => {
                let context = ErrorContextBuilder::new()
                    .file("expression".to_string())
                    .line(self.line)
                    .column(self.column)
                    .code_snippet(self.source.clone())
                    .suggestion(Some("Check expression syntax".to_string()))
                    .build();

                return Err(ValidatorError::Expression {
                    message: format!("Unexpected token: {:?}", token),
                    context,
                    severity: ErrorSeverity::Error,
                });
            }
        }
        Ok(())
    }

    /// Parse a function call
    fn parse_function_call(&mut self) -> Result<(), ValidatorError> {
        self.expect_token(Token::LParen)?;
        while self.current < self.tokens.len() && !matches!(self.tokens[self.current], Token::RParen) {
            self.parse_expression()?;
            if matches!(self.tokens[self.current], Token::Comma) {
                self.current += 1;
            }
        }
        self.expect_token(Token::RParen)?;
        Ok(())
    }

    /// Parse a property access
    fn parse_property_access(&mut self) -> Result<(), ValidatorError> {
        self.expect_token(Token::PropertyAccess)?;
        self.expect_token_type(TokenType::Identifier)?;
        Ok(())
    }

    /// Parse an array
    fn parse_array(&mut self) -> Result<(), ValidatorError> {
        while self.current < self.tokens.len() && !matches!(self.tokens[self.current], Token::RBracket) {
            self.parse_expression()?;
            if matches!(self.tokens[self.current], Token::Comma) {
                self.current += 1;
            }
        }
        self.expect_token(Token::RBracket)?;
        Ok(())
    }

    /// Parse an object
    fn parse_object(&mut self) -> Result<(), ValidatorError> {
        while self.current < self.tokens.len() && !matches!(self.tokens[self.current], Token::RBrace) {
            self.expect_token_type(TokenType::Identifier)?;
            self.expect_token(Token::Colon)?;
            self.parse_expression()?;
            if matches!(self.tokens[self.current], Token::Comma) {
                self.current += 1;
            }
        }
        self.expect_token(Token::RBrace)?;
        Ok(())
    }

    /// Expect a token
    fn expect_token(&mut self, expected: Token) -> Result<(), ValidatorError> {
        if self.current >= self.tokens.len() {
            let context = ErrorContextBuilder::new()
                .file("expression".to_string())
                .line(self.line)
                .column(self.column)
                .code_snippet(self.source.clone())
                .suggestion(Some(format!("Expected {:?}", expected)))
                .build();

            return Err(ValidatorError::Expression {
                message: format!("Unexpected end of expression, expected {:?}", expected),
                context,
                severity: ErrorSeverity::Error,
            });
        }

        if self.tokens[self.current] != expected {
            let context = ErrorContextBuilder::new()
                .file("expression".to_string())
                .line(self.line)
                .column(self.column)
                .code_snippet(self.source.clone())
                .suggestion(Some(format!("Expected {:?}", expected)))
                .build();

            return Err(ValidatorError::Expression {
                message: format!("Expected {:?}, found {:?}", expected, self.tokens[self.current]),
                context,
                severity: ErrorSeverity::Error,
            });
        }

        self.current += 1;
        Ok(())
    }

    /// Expect a token type
    fn expect_token_type(&mut self, token_type: TokenType) -> Result<(), ValidatorError> {
        if self.current >= self.tokens.len() {
            let context = ErrorContextBuilder::new()
                .file("expression".to_string())
                .line(self.line)
                .column(self.column)
                .code_snippet(self.source.clone())
                .suggestion(Some(format!("Expected {:?}", token_type)))
                .build();

            return Err(ValidatorError::Expression {
                message: format!("Unexpected end of expression, expected {:?}", token_type),
                context,
                severity: ErrorSeverity::Error,
            });
        }

        match (&self.tokens[self.current], token_type) {
            (Token::Identifier(_), TokenType::Identifier) => {
                self.current += 1;
                Ok(())
            }
            _ => {
                let context = ErrorContextBuilder::new()
                    .file("expression".to_string())
                    .line(self.line)
                    .column(self.column)
                    .code_snippet(self.source.clone())
                    .suggestion(Some(format!("Expected {:?}", token_type)))
                    .build();

                Err(ValidatorError::Expression {
                    message: format!("Expected {:?}, found {:?}", token_type, self.tokens[self.current]),
                    context,
                    severity: ErrorSeverity::Error,
                })
            }
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum TokenType {
    Identifier,
}

pub fn parse_expression(source: &str) -> Result<Expression, ValidatorError> {
    let mut parser = ExpressionParser::new(source.to_string());
    parser.parse()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_number() {
        let mut parser = ExpressionParser::new("42.5".to_string());
        let expr = parser.parse().unwrap();
        assert_eq!(expr.tokens, vec![Token::Number(42.5)]);
    }

    #[test]
    fn test_parse_string() {
        let mut parser = ExpressionParser::new("\"hello\"".to_string());
        let expr = parser.parse().unwrap();
        assert_eq!(expr.tokens, vec![Token::String("hello".to_string())]);
    }

    #[test]
    fn test_parse_identifier() {
        let mut parser = ExpressionParser::new("position".to_string());
        let expr = parser.parse().unwrap();
        assert_eq!(expr.tokens, vec![Token::Identifier("position".to_string())]);
    }

    #[test]
    fn test_parse_property_access() {
        let mut parser = ExpressionParser::new("layer.position".to_string());
        let expr = parser.parse().unwrap();
        assert_eq!(expr.tokens, vec![
            Token::Identifier("layer".to_string()),
            Token::PropertyAccess,
            Token::Identifier("position".to_string()),
        ]);
    }

    #[test]
    fn test_parse_method_call() {
        let mut parser = ExpressionParser::new("transform.position.valueAtTime(time)".to_string());
        let expr = parser.parse().unwrap();
        assert_eq!(expr.tokens, vec![
            Token::Identifier("transform".to_string()),
            Token::PropertyAccess,
            Token::Identifier("position".to_string()),
            Token::PropertyAccess,
            Token::Identifier("valueAtTime".to_string()),
            Token::LParen,
            Token::Identifier("time".to_string()),
            Token::RParen,
        ]);
    }
} 