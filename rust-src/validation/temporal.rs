use super::rules::{ValidationRule, PropertyValueType};
use serde_json::Value;

pub fn validate_temporal_ease(property_type: &PropertyValueType, in_ease: &[Value], out_ease: &[Value]) -> Result<(), String> {
    let required_dimensions = match property_type {
        PropertyValueType::OneD => 1,
        PropertyValueType::TwoD | PropertyValueType::TwoDSpatial => 2,
        PropertyValueType::ThreeD | PropertyValueType::ThreeDSpatial => 3,
        PropertyValueType::Color => 4,
        PropertyValueType::NoValue | PropertyValueType::CustomValue | PropertyValueType::Marker |
        PropertyValueType::LayerIndex | PropertyValueType::MaskIndex | PropertyValueType::Shape |
        PropertyValueType::TextDocument | PropertyValueType::ArbText | PropertyValueType::Custom(_) => {
            return Err("Property type does not support temporal easing".to_string());
        }
    };

    // Validate in_ease
    if in_ease.len() != required_dimensions {
        return Err(format!("In-ease must have {} keyframe(s) for this property type", required_dimensions));
    }

    // Validate out_ease
    if out_ease.len() != required_dimensions {
        return Err(format!("Out-ease must have {} keyframe(s) for this property type", required_dimensions));
    }

    // Validate each ease keyframe
    for ease in in_ease.iter().chain(out_ease.iter()) {
        validate_ease_keyframe(ease)?;
    }

    Ok(())
}

fn validate_ease_keyframe(keyframe: &Value) -> Result<(), String> {
    match keyframe {
        Value::Object(obj) => {
            // Validate required fields
            if !obj.contains_key("influence") || !obj.contains_key("speed") {
                return Err("Ease keyframe must have influence and speed properties".to_string());
            }

            // Validate influence (0..100)
            match obj.get("influence") {
                Some(Value::Number(n)) => {
                    let influence = n.as_f64().ok_or("Invalid influence format")?;
                    if influence < 0.0 || influence > 100.0 {
                        return Err("Influence must be between 0 and 100".to_string());
                    }
                }
                _ => return Err("Influence must be a number".to_string())
            }

            // Validate speed (must be positive)
            match obj.get("speed") {
                Some(Value::Number(n)) => {
                    let speed = n.as_f64().ok_or("Invalid speed format")?;
                    if speed < 0.0 {
                        return Err("Speed must be non-negative".to_string());
                    }
                }
                _ => return Err("Speed must be a number".to_string())
            }

            Ok(())
        }
        _ => Err("Ease keyframe must be an object".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_valid_one_d_ease() {
        let in_ease = vec![json!({
            "influence": 50.0,
            "speed": 10.0
        })];
        let out_ease = vec![json!({
            "influence": 50.0,
            "speed": 10.0
        })];
        assert!(validate_temporal_ease(&PropertyValueType::OneD, &in_ease, &out_ease).is_ok());
    }

    #[test]
    fn test_valid_two_d_ease() {
        let in_ease = vec![
            json!({"influence": 50.0, "speed": 10.0}),
            json!({"influence": 50.0, "speed": 10.0})
        ];
        let out_ease = vec![
            json!({"influence": 50.0, "speed": 10.0}),
            json!({"influence": 50.0, "speed": 10.0})
        ];
        assert!(validate_temporal_ease(&PropertyValueType::TwoD, &in_ease, &out_ease).is_ok());
    }

    #[test]
    fn test_valid_three_d_ease() {
        let in_ease = vec![
            json!({"influence": 50.0, "speed": 10.0}),
            json!({"influence": 50.0, "speed": 10.0}),
            json!({"influence": 50.0, "speed": 10.0})
        ];
        let out_ease = vec![
            json!({"influence": 50.0, "speed": 10.0}),
            json!({"influence": 50.0, "speed": 10.0}),
            json!({"influence": 50.0, "speed": 10.0})
        ];
        assert!(validate_temporal_ease(&PropertyValueType::ThreeD, &in_ease, &out_ease).is_ok());
    }

    #[test]
    fn test_invalid_property_type() {
        let ease = vec![json!({"influence": 50.0, "speed": 10.0})];
        assert!(validate_temporal_ease(&PropertyValueType::TextDocument, &ease, &ease).is_err());
    }

    #[test]
    fn test_invalid_dimension_count() {
        let one_d = vec![json!({"influence": 50.0, "speed": 10.0})];
        let two_d = vec![
            json!({"influence": 50.0, "speed": 10.0}),
            json!({"influence": 50.0, "speed": 10.0})
        ];
        assert!(validate_temporal_ease(&PropertyValueType::TwoD, &one_d, &one_d).is_err());
        assert!(validate_temporal_ease(&PropertyValueType::OneD, &two_d, &two_d).is_err());
    }

    #[test]
    fn test_invalid_influence() {
        let in_ease = vec![json!({"influence": -1.0, "speed": 10.0})];
        let out_ease = vec![json!({"influence": 50.0, "speed": 10.0})];
        assert!(validate_temporal_ease(&PropertyValueType::OneD, &in_ease, &out_ease).is_err());

        let in_ease = vec![json!({"influence": 101.0, "speed": 10.0})];
        assert!(validate_temporal_ease(&PropertyValueType::OneD, &in_ease, &out_ease).is_err());
    }

    #[test]
    fn test_invalid_speed() {
        let in_ease = vec![json!({"influence": 50.0, "speed": -1.0})];
        let out_ease = vec![json!({"influence": 50.0, "speed": 10.0})];
        assert!(validate_temporal_ease(&PropertyValueType::OneD, &in_ease, &out_ease).is_err());
    }

    #[test]
    fn test_missing_fields() {
        let in_ease = vec![json!({"influence": 50.0})];
        let out_ease = vec![json!({"influence": 50.0, "speed": 10.0})];
        assert!(validate_temporal_ease(&PropertyValueType::OneD, &in_ease, &out_ease).is_err());

        let in_ease = vec![json!({"speed": 10.0})];
        assert!(validate_temporal_ease(&PropertyValueType::OneD, &in_ease, &out_ease).is_err());
    }
} 