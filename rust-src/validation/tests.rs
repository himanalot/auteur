#[cfg(disabled_test)]
#[allow(dead_code)]
mod tests {
    use super::super::*;
    use super::super::rules::{ValidationRule, PropertyValueType};
    use serde_json::json;

    #[test]
    fn test_property_validation() {
        // Test OneD property validation
        let rule = ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        };

        assert!(property::validate_property_value(&json!(50.0), &rule).is_ok());
        assert!(property::validate_property_value(&json!(-1.0), &rule).is_err());
        assert!(property::validate_property_value(&json!(101.0), &rule).is_err());
        assert!(property::validate_property_value(&json!("not a number"), &rule).is_err());

        // Test TwoD property validation
        let rule = ValidationRule {
            value_type: PropertyValueType::TwoD,
            array_size: Some(2),
            range_min: Some(-100.0),
            range_max: Some(100.0),
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        };

        assert!(property::validate_property_value(&json!([50.0, -50.0]), &rule).is_ok());
        assert!(property::validate_property_value(&json!([50.0]), &rule).is_err());
        assert!(property::validate_property_value(&json!([50.0, -50.0, 0.0]), &rule).is_err());
        assert!(property::validate_property_value(&json!([200.0, 50.0]), &rule).is_err());

        // Test Color property validation
        let rule = ValidationRule {
            value_type: PropertyValueType::Color,
            array_size: Some(4),
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        };

        assert!(property::validate_property_value(&json!([1.0, 0.5, 0.0, 1.0]), &rule).is_ok());
        assert!(property::validate_property_value(&json!([1.0, 0.5, 0.0]), &rule).is_err());
        assert!(property::validate_property_value(&json!([2.0, 0.5, 0.0, 1.0]), &rule).is_err());
    }

    #[test]
    fn test_temporal_ease() {
        // Valid 1D property test
        let in_ease = vec![json!({
            "influence": 50.0,
            "speed": 0.0
        })];
        let out_ease = vec![json!({
            "influence": 50.0,
            "speed": 0.0
        })];

        assert!(temporal::validate_temporal_ease(&PropertyValueType::OneD, &in_ease, &out_ease).is_ok());

        // Test 2D property with wrong number of ease values
        assert!(temporal::validate_temporal_ease(&PropertyValueType::TwoD, &in_ease, &out_ease).is_err());

        // Test 2D property with correct number of ease values
        let ease_2d_in = vec![
            json!({"influence": 50.0, "speed": 0.0}),
            json!({"influence": 50.0, "speed": 0.0})
        ];
        let ease_2d_out = vec![
            json!({"influence": 50.0, "speed": 0.0}),
            json!({"influence": 50.0, "speed": 0.0})
        ];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::TwoD, &ease_2d_in, &ease_2d_out).is_ok());

        // Test 3D property with correct number of ease values
        let ease_3d_in = vec![
            json!({"influence": 50.0, "speed": 0.0}),
            json!({"influence": 50.0, "speed": 0.0}),
            json!({"influence": 50.0, "speed": 0.0})
        ];
        let ease_3d_out = vec![
            json!({"influence": 50.0, "speed": 0.0}),
            json!({"influence": 50.0, "speed": 0.0}),
            json!({"influence": 50.0, "speed": 0.0})
        ];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::ThreeD, &ease_3d_in, &ease_3d_out).is_ok());

        // Test invalid influence values
        let invalid_influence_low = vec![json!({
            "influence": 0.0,  // Invalid: < 0.1
            "speed": 0.0
        })];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::OneD, &invalid_influence_low, &out_ease).is_err());

        let invalid_influence_high = vec![json!({
            "influence": 150.0,  // Invalid: > 100
            "speed": 0.0
        })];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::OneD, &invalid_influence_high, &out_ease).is_err());

        // Test missing required fields
        let missing_influence = vec![json!({
            "speed": 0.0
        })];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::OneD, &missing_influence, &out_ease).is_err());

        let missing_speed = vec![json!({
            "influence": 50.0
        })];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::OneD, &missing_speed, &out_ease).is_err());

        // Test invalid field types
        let invalid_influence_type = vec![json!({
            "influence": "50.0",  // String instead of number
            "speed": 0.0
        })];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::OneD, &invalid_influence_type, &out_ease).is_err());

        let invalid_speed_type = vec![json!({
            "influence": 50.0,
            "speed": "0.0"  // String instead of number
        })];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::OneD, &invalid_speed_type, &out_ease).is_err());

        // Test invalid array element type
        let invalid_array_element = vec![json!("not an object")];
        assert!(temporal::validate_temporal_ease(&PropertyValueType::OneD, &invalid_array_element, &out_ease).is_err());
    }

    #[test]
    fn test_expression_validation() {
        // Test basic expression validation
        let result = expression::validate_expression("transform.position[0] + 100");
        assert!(result.is_valid);
        assert!(result.syntax_errors.is_empty());

        // Test unbalanced parentheses
        let result = expression::validate_expression("transform.position[0] + (100");
        assert!(!result.is_valid);
        assert!(!result.syntax_errors.is_empty());

        // Test unsafe operations
        let result = expression::validate_expression("eval('alert(1)')");
        assert!(!result.safety_warnings.is_empty());

        // Test performance warnings
        let complex_expr = r#"
            var p1 = thisComp.layer(1).transform.position;
            var p2 = thisComp.layer(2).transform.position;
            var p3 = thisComp.layer(3).transform.position;
            var p4 = thisComp.layer(4).transform.position;
            var p5 = thisComp.layer(5).transform.position;
            Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
        "#;
        let result = expression::validate_expression(complex_expr);
        assert!(!result.performance_warnings.is_empty());
    }

    #[test]
    fn test_performance_metrics() {
        let expr = r#"
            var pos = thisComp.layer("Circle").transform.position;
            var scale = thisComp.layer("Circle").transform.scale;
            var rot = thisComp.layer("Circle").transform.rotation;
            
            for (var i = 0; i < 10; i++) {
                pos[0] = Math.sin(time * i) * 100;
                pos[1] = Math.cos(time * i) * 100;
            }
            
            [pos[0], pos[1]]
        "#;

        let metrics = performance::PerformanceMetrics::analyze(expr);
        assert!(metrics.layer_refs >= 3);
        assert!(metrics.property_refs >= 3);
        assert!(metrics.math_funcs >= 2);
        assert!(metrics.time_accesses >= 1);
        assert!(metrics.loop_count >= 1);
        assert!(!metrics.get_warnings().is_empty());
        assert!(!metrics.get_optimization_suggestions().is_empty());
    }

    #[test]
    fn test_text_document_validation() {
        let valid_doc = json!({
            "text": "Hello World",
            "font": "Arial",
            "fontSize": 12.0
        });

        let rule = ValidationRule {
            value_type: PropertyValueType::TextDocument,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        };

        assert!(property::validate_text_document(&valid_doc, &rule).is_ok());

        // Test missing required field
        let invalid_doc = json!({
            "font": "Arial",
            "fontSize": 12.0
        });
        assert!(property::validate_text_document(&invalid_doc, &rule).is_err());

        // Test invalid font size
        let invalid_doc = json!({
            "text": "Hello World",
            "font": "Arial",
            "fontSize": -12.0
        });
        assert!(property::validate_text_document(&invalid_doc, &rule).is_err());
    }

    #[test]
    fn test_marker_validation() {
        let valid_marker = json!({
            "comment": "Marker 1",
            "duration": 1.0
        });

        let rule = ValidationRule {
            value_type: PropertyValueType::Marker,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        };

        assert!(property::validate_marker(&valid_marker, &rule).is_ok());

        // Test missing required field
        let invalid_marker = json!({
            "duration": 1.0
        });
        assert!(property::validate_marker(&invalid_marker, &rule).is_err());

        // Test invalid duration
        let invalid_marker = json!({
            "comment": "Marker 1",
            "duration": -1.0
        });
        assert!(property::validate_marker(&invalid_marker, &rule).is_err());
    }

    #[test]
    fn test_shape_validation() {
        let valid_shape = json!({
            "vertices": [[0.0, 0.0], [100.0, 0.0], [100.0, 100.0], [0.0, 100.0]],
            "closed": true
        });

        let rule = ValidationRule {
            value_type: PropertyValueType::Shape,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        };

        assert!(property::validate_shape(&valid_shape, &rule).is_ok());

        // Test missing vertices
        let invalid_shape = json!({
            "closed": true
        });
        assert!(property::validate_shape(&invalid_shape, &rule).is_err());

        // Test invalid closed property
        let invalid_shape = json!({
            "vertices": [[0.0, 0.0], [100.0, 0.0], [100.0, 100.0], [0.0, 100.0]],
            "closed": "true"  // Should be boolean
        });
        assert!(property::validate_shape(&invalid_shape, &rule).is_err());
    }

    #[test]
    fn test_context_validation() {
        use crate::validation::context::{ValidationContext, ObjectContext};
        use serde_json::json;

        let mut context = ValidationContext::new();

        // Test 1: Simple variable assignment without context
        context.validate_assignment("myVar", &json!([1, 2, 3]), None).unwrap();
        assert!(matches!(context.get_variable_type("myVar"), Some(PropertyValueType::ThreeD)));

        // Test 2: Layer rotation assignment
        context.enter_context(ObjectContext::Layer);
        context.validate_assignment("rotation3D", &json!([90, 180, 270]), Some("rotation")).unwrap();
        assert!(matches!(context.get_variable_type("rotation3D"), Some(PropertyValueType::ThreeD)));

        // Test 3: Camera position must be 3D
        context.exit_context();
        context.enter_context(ObjectContext::Camera);
        let result = context.validate_assignment("camPos", &json!([100, 200]), Some("position"));
        assert!(result.is_err());  // Should fail because camera position must be 3D

        // Test 4: Valid camera position
        context.validate_assignment("camPos", &json!([100, 200, 300]), Some("position")).unwrap();
        assert!(matches!(context.get_variable_type("camPos"), Some(PropertyValueType::ThreeDSpatial)));
    }

    #[test]
    fn test_real_world_script() {
        use crate::validation::context::{ValidationContext, ObjectContext};
        use serde_json::json;

        let mut context = ValidationContext::new();
        
        // Simulate a typical AE script
        context.enter_context(ObjectContext::Layer);
        
        // This is fine - regular rotation
        context.validate_assignment("rotation", &json!(45), Some("rotation")).unwrap();
        
        // This is also fine - 3D rotation
        context.validate_assignment("rotation3D", &json!([90, 180, 270]), Some("rotation")).unwrap();
        
        // This would fail - rotation can't be 2D
        let result = context.validate_assignment("badRotation", &json!([90, 180]), Some("rotation"));
        assert!(result.is_err());
        
        // Position must be 2D or 3D
        context.validate_assignment("pos", &json!([100, 200]), Some("position")).unwrap();
        context.validate_assignment("pos3D", &json!([100, 200, 300]), Some("position")).unwrap();
        
        // This would fail - position can't be 1D
        let result = context.validate_assignment("badPos", &json!(100), Some("position"));
        assert!(result.is_err());
    }

    #[test]
    fn test_script_validation() {
        let script = r#"
            var comp = app.project.activeItem;
            var layer = comp.layer(1);
            layer.position.setTemporalEaseAtKey(1, [ease1], [ease2]);
        "#;
        // ... rest of the test ...
    }

    #[test]
    fn test_property_value_types() {
        // Test NoValue
        let rule = ValidationRule::simple(PropertyValueType::NoValue);
        assert!(validate_property_value(&json!(null), &rule).is_ok());
        assert!(validate_property_value(&json!(42), &rule).is_err());

        // Test ThreeDSpatial
        let rule = ValidationRule::simple(PropertyValueType::ThreeDSpatial);
        assert!(validate_property_value(&json!([10.0, 20.2, 0.0]), &rule).is_ok());
        assert!(validate_property_value(&json!([10.0, 20.2]), &rule).is_err());
        assert!(validate_property_value(&json!("not an array"), &rule).is_err());

        // Test TwoDSpatial
        let rule = ValidationRule::simple(PropertyValueType::TwoDSpatial);
        assert!(validate_property_value(&json!([5.1, 10.0]), &rule).is_ok());
        assert!(validate_property_value(&json!([5.1, 10.0, 15.0]), &rule).is_err());
        assert!(validate_property_value(&json!("not an array"), &rule).is_err());

        // Test Color
        let rule = ValidationRule::simple(PropertyValueType::Color);
        assert!(validate_property_value(&json!([0.8, 0.3, 0.1, 1.0]), &rule).is_ok());
        assert!(validate_property_value(&json!([0.8, 0.3, 0.1]), &rule).is_err());
        assert!(validate_property_value(&json!("not an array"), &rule).is_err());

        // Test LayerIndex
        let rule = ValidationRule::simple(PropertyValueType::LayerIndex);
        assert!(validate_property_value(&json!(0), &rule).is_ok());
        assert!(validate_property_value(&json!(1), &rule).is_ok());
        assert!(validate_property_value(&json!(-1), &rule).is_err());
        assert!(validate_property_value(&json!("not a number"), &rule).is_err());

        // Test MaskIndex
        let rule = ValidationRule::simple(PropertyValueType::MaskIndex);
        assert!(validate_property_value(&json!(0), &rule).is_ok());
        assert!(validate_property_value(&json!(1), &rule).is_ok());
        assert!(validate_property_value(&json!(-1), &rule).is_err());
        assert!(validate_property_value(&json!("not a number"), &rule).is_err());

        // TextDocument tests
        {
            let valid_doc = json!({
                "text": "Hello World",
                "font": "Arial",
                "fontSize": 12
            });
            let rule = ValidationRule::simple(PropertyValueType::TextDocument);
            assert!(property::validate_text_document(&valid_doc).is_ok());

            let invalid_doc = json!("not an object");
            assert!(property::validate_text_document(&invalid_doc).is_err());

            let invalid_doc = json!(42);
            assert!(property::validate_text_document(&invalid_doc).is_err());
        }

        // Marker tests
        {
            let valid_marker = json!({
                "comment": "Test marker",
                "duration": 1.0
            });
            let rule = ValidationRule::simple(PropertyValueType::Marker);
            assert!(property::validate_marker(&valid_marker, &rule).is_ok());

            let invalid_marker = json!("not an object");
            assert!(property::validate_marker(&invalid_marker, &rule).is_err());

            let invalid_marker = json!(42);
            assert!(property::validate_marker(&invalid_marker, &rule).is_err());
        }

        // Shape tests
        {
            let valid_shape = json!({
                "vertices": [[0, 0], [100, 0], [100, 100], [0, 100]],
                "closed": true
            });
            let rule = ValidationRule::simple(PropertyValueType::Shape);
            assert!(property::validate_shape(&valid_shape, &rule).is_ok());

            let invalid_shape = json!("not an object");
            assert!(property::validate_shape(&invalid_shape, &rule).is_err());

            let invalid_shape = json!(42);
            assert!(property::validate_shape(&invalid_shape, &rule).is_err());
        }
    }
} 