#[cfg(test)]
mod tests {
    use super::*;
    use super::super::typechecker::{Type, TypeChecker};

    #[test]
    fn test_validate_color_operations() {
        let mut result = validate_expression_syntax("rgbToHsl([1, 0, 0])");
        assert!(result.is_valid);

        result = validate_expression_syntax("rgbToHsl(1, 0, 0)");
        assert!(!result.is_valid);
        assert!(result.type_errors.iter().any(|e| e.contains("array parameters")));

        result = validate_expression_syntax("thisComp.layer(1).fill.color");
        assert!(result.is_valid);

        result = validate_expression_syntax("thisComp.layer(1).fill.color.alpha");
        assert!(!result.is_valid);
        assert!(result.type_errors.iter().any(|e| e.contains("alpha component")));
    }

    #[test]
    fn test_validate_temporal_expressions() {
        let mut result = validate_expression_syntax("valueAtTime(time - 1)");
        assert!(result.is_valid);

        result = validate_expression_syntax("valueAtTime(5)");
        assert!(!result.is_valid);
        assert!(result.type_errors.iter().any(|e| e.contains("time parameter")));

        result = validate_expression_syntax("velocityAtTime(time)");
        assert!(!result.is_valid);
        assert!(result.type_errors.iter().any(|e| e.contains("length()")));

        result = validate_expression_syntax("velocityAtTime(time).length");
        assert!(result.is_valid);
    }

    #[test]
    fn test_validate_controllers() {
        let mut result = validate_expression_syntax("effect(\"My Controller\")(\"Slider\")");
        assert!(result.is_valid);

        result = validate_expression_syntax("effect(\"\")(\"Slider\")");
        assert!(!result.is_valid);
        assert!(result.type_errors.iter().any(|e| e.contains("name cannot be empty")));

        result = validate_expression_syntax("effect(\"My Controller\")(\"InvalidType\")");
        assert!(!result.is_valid);
        assert!(result.type_errors.iter().any(|e| e.contains("Unknown controller parameter type")));
    }

    #[test]
    fn test_type_checker_vector_operations() {
        let checker = TypeChecker::new();
        let mut ctx = TypeContext::new(&Expression::new(""));

        // Test vector addition
        let result = checker.check_binary_op(
            "+",
            Type::Vector(2),
            Type::Vector(2),
            &mut ctx
        );
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), Type::Vector(2));

        // Test incompatible vector dimensions
        let result = checker.check_binary_op(
            "+",
            Type::Vector(2),
            Type::Vector(3),
            &mut ctx
        );
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("dimensions do not match"));
    }

    #[test]
    fn test_type_checker_color_operations() {
        let checker = TypeChecker::new();
        let mut ctx = TypeContext::new(&Expression::new(""));

        // Test color addition
        let result = checker.check_binary_op(
            "+",
            Type::Color,
            Type::Color,
            &mut ctx
        );
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), Type::Color);

        // Test color with number
        let result = checker.check_binary_op(
            "*",
            Type::Color,
            Type::Number,
            &mut ctx
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_type_checker_temporal_operations() {
        let checker = TypeChecker::new();
        
        // Test valueAtTime return type
        let value_at_time = checker.env.get("valueAtTime").unwrap();
        match value_at_time {
            Type::Method { return_type, .. } => {
                assert!(matches!(**return_type, Type::Temporal(_)));
            }
            _ => panic!("valueAtTime should be a method type"),
        }

        // Test velocityAtTime return type
        let velocity_at_time = checker.env.get("velocityAtTime").unwrap();
        match velocity_at_time {
            Type::Method { return_type, .. } => {
                match **return_type {
                    Type::Temporal(ref inner) => {
                        assert!(matches!(**inner, Type::Vector(2)));
                    }
                    _ => panic!("velocityAtTime should return a temporal vector"),
                }
            }
            _ => panic!("velocityAtTime should be a method type"),
        }
    }

    #[test]
    fn test_type_checker_controller_operations() {
        let checker = TypeChecker::new();
        let mut ctx = TypeContext::new(&Expression::new(""));

        // Test controller type creation
        let controller_type = Type::Controller {
            name: "My Controller".to_string(),
            value_type: Box::new(Type::Number),
        };

        // Test controller type matching
        assert!(checker.is_controller(&controller_type));
        assert!(!checker.is_controller(&Type::Number));
    }

    // ... existing tests ...
} 