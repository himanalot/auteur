use super::rules::{ValidationRule, PropertyValueType};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug)]
pub struct ValidationContext {
    // Track variable assignments and their inferred types
    variable_types: HashMap<String, PropertyValueType>,
    // Track property assignments to validate against correct types
    property_assignments: Vec<PropertyAssignment>,
    // Track the current object context (e.g., inside a layer, property, etc.)
    current_context: Vec<ObjectContext>,
    // Track project settings
    pub project_bpc: u8,
    pub ae_version: String,
}

#[derive(Debug)]
struct PropertyAssignment {
    target_property: String,  // e.g., "rotation", "position"
    target_object: String,    // e.g., "layer", "camera"
    value: Value,
}

#[derive(Debug, Clone)]
pub enum ObjectContext {
    App,
    Project,
    Item,
    Layer,
    AVLayer,
    TextLayer,
    ShapeLayer,
    Camera,
    Light,
    Text,
    Shape,
    Property(String),
    Effect(String),
    Transform,
    LayerCollection,
    ItemCollection,
    Comp,
    KeyframeEase,
    TextDocument,
    CharacterRange,
    ShapeGroup,
    VectorShape,
    Fill,
    Stroke,
    Mask,
    CameraOptions,
    LightOptions,
    EffectControls,
    RenderQueue,
    RenderQueueItem,
    OutputModule,
    OMCollection,
    Collection,
    Custom(String),
    MarkerValue,
    System,
    Preferences,
    File,
    Folder,
    ImportOptions,
    ExportSettings,
    FootageSource,
    AudioOptions,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AutoKernType {
    NoAutoKern,
    MetricKern,
    OpticalKern,
}

#[derive(Debug, Clone, PartialEq)]
pub enum BaselineDirection {
    WithStream,
    VerticalRotated,
    VerticalCrossStream,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FontCapsOption {
    NormalCaps,
    SmallCaps,
    AllCaps,
    AllSmallCaps,
}

#[derive(Debug, Clone)]
pub struct EffectInfo {
    pub name: String,
    pub bpc: u8,
    pub gpu_version: Option<String>,
    pub category: String,
}

#[derive(Debug, Clone)]
pub struct TextValidationContext {
    pub auto_kern_type: Option<AutoKernType>,
    pub baseline_direction: Option<BaselineDirection>,
    pub font_caps_option: Option<FontCapsOption>,
    pub mixed_values: bool,
}

impl ValidationContext {
    pub fn new() -> Self {
        ValidationContext {
            variable_types: HashMap::new(),
            property_assignments: Vec::new(),
            current_context: Vec::new(),
            project_bpc: 8,
            ae_version: "2025".to_string(),
        }
    }

    pub fn validate_assignment(&mut self, var_name: &str, value: &Value, target_property: Option<&str>) -> Result<(), String> {
        match target_property {
            // If we're assigning directly to a property, validate against that property's requirements
            Some(prop_name) => {
                if let Some(context) = self.current_context.last() {
                    match context {
                        ObjectContext::Layer => {
                            match prop_name {
                                "rotation" => {
                                    // Layer rotation can be 1D or 3D depending on the layer type
                                    match value {
                                        Value::Number(_) => {
                                            self.variable_types.insert(var_name.to_string(), PropertyValueType::OneD);
                                            Ok(())
                                        }
                                        Value::Array(arr) if arr.len() == 3 => {
                                            self.variable_types.insert(var_name.to_string(), PropertyValueType::ThreeD);
                                            Ok(())
                                        }
                                        _ => Err("Layer rotation must be a number or [x, y, z] array".to_string())
                                    }
                                }
                                "position" => {
                                    // Position is always 2D or 3D spatial
                                    match value {
                                        Value::Array(arr) => {
                                            match arr.len() {
                                                2 => {
                                                    self.variable_types.insert(var_name.to_string(), PropertyValueType::TwoDSpatial);
                                                    Ok(())
                                                }
                                                3 => {
                                                    self.variable_types.insert(var_name.to_string(), PropertyValueType::ThreeDSpatial);
                                                    Ok(())
                                                }
                                                _ => Err("Position must be a 2D or 3D array".to_string())
                                            }
                                        }
                                        _ => Err("Position must be an array".to_string())
                                    }
                                }
                                "color" => {
                                    // Color is always a 4D array [r,g,b,a]
                                    match value {
                                        Value::Array(arr) if arr.len() == 4 => {
                                            self.variable_types.insert(var_name.to_string(), PropertyValueType::Color);
                                            Ok(())
                                        }
                                        _ => Err("Color must be a 4D array [r,g,b,a]".to_string())
                                    }
                                }
                                "scale" => {
                                    // Scale can be uniform (1D) or per-dimension (2D/3D)
                                    match value {
                                        Value::Number(_) => {
                                            self.variable_types.insert(var_name.to_string(), PropertyValueType::OneD);
                                            Ok(())
                                        }
                                        Value::Array(arr) => {
                                            match arr.len() {
                                                2 => {
                                                    self.variable_types.insert(var_name.to_string(), PropertyValueType::TwoD);
                                                    Ok(())
                                                }
                                                3 => {
                                                    self.variable_types.insert(var_name.to_string(), PropertyValueType::ThreeD);
                                                    Ok(())
                                                }
                                                _ => Err("Scale must be a number or [x, y] or [x, y, z] array".to_string())
                                            }
                                        }
                                        _ => Err("Scale must be a number or array".to_string())
                                    }
                                }
                                _ => Ok(()) // Other properties would be handled similarly
                            }
                        }
                        ObjectContext::Camera => {
                            // Camera-specific property validation
                            match prop_name {
                                "pointOfInterest" | "position" => {
                                    // Camera spatial properties are always 3D
                                    match value {
                                        Value::Array(arr) if arr.len() == 3 => {
                                            self.variable_types.insert(var_name.to_string(), PropertyValueType::ThreeDSpatial);
                                            Ok(())
                                        }
                                        _ => Err("Camera spatial properties must be [x, y, z] arrays".to_string())
                                    }
                                }
                                _ => Ok(())
                            }
                        }
                        _ => Ok(()) // Handle other contexts
                    }
                } else {
                    // No context - can only do basic type inference
                    self.infer_type_from_value(var_name, value)
                }
            }
            // If it's just a variable assignment, do basic type inference
            None => self.infer_type_from_value(var_name, value)
        }
    }

    fn infer_type_from_value(&mut self, var_name: &str, value: &Value) -> Result<(), String> {
        match value {
            Value::Number(_) => {
                self.variable_types.insert(var_name.to_string(), PropertyValueType::OneD);
                Ok(())
            }
            Value::Array(arr) => {
                match arr.len() {
                    2 => {
                        self.variable_types.insert(var_name.to_string(), PropertyValueType::TwoD);
                        Ok(())
                    }
                    3 => {
                        // Note: Without context, we can't know if it's spatial or not
                        self.variable_types.insert(var_name.to_string(), PropertyValueType::ThreeD);
                        Ok(())
                    }
                    4 => {
                        // Might be a color
                        if arr.iter().all(|v| {
                            if let Value::Number(n) = v {
                                n.as_f64().unwrap_or(2.0) >= 0.0 && n.as_f64().unwrap_or(2.0) <= 1.0
                            } else {
                                false
                            }
                        }) {
                            self.variable_types.insert(var_name.to_string(), PropertyValueType::Color);
                        }
                        Ok(())
                    }
                    _ => Err(format!("Unexpected array length: {}", arr.len()))
                }
            }
            Value::String(_) => {
                self.variable_types.insert(var_name.to_string(), PropertyValueType::ArbText);
                Ok(())
            }
            _ => Ok(()) // Handle other types as needed
        }
    }

    pub fn enter_context(&mut self, context: ObjectContext) {
        self.current_context.push(context);
    }

    pub fn exit_context(&mut self) {
        self.current_context.pop();
    }

    pub fn get_variable_type(&self, var_name: &str) -> Option<&PropertyValueType> {
        self.variable_types.get(var_name)
    }
}

impl TextValidationContext {
    pub fn new() -> Self {
        Self {
            auto_kern_type: None,
            baseline_direction: None,
            font_caps_option: None,
            mixed_values: false,
        }
    }

    pub fn validate_auto_kern(&self, value: &str) -> Result<(), String> {
        match value {
            "NO_AUTO_KERN" => Ok(()),
            "METRIC_KERN" => Ok(()),
            "OPTICAL_KERN" => Ok(()),
            _ => Err("Invalid auto kern type".to_string())
        }
    }
    
    pub fn validate_baseline_direction(&self, value: &str) -> Result<(), String> {
        match value {
            "BASELINE_WITH_STREAM" => Ok(()),
            "BASELINE_VERTICAL_ROTATED" => Ok(()),
            "BASELINE_VERTICAL_CROSS_STREAM" => Ok(()),
            _ => Err("Invalid baseline direction".to_string())
        }
    }

    pub fn validate_font_caps(&self, value: &str) -> Result<(), String> {
        match value {
            "FONT_NORMAL_CAPS" => Ok(()),
            "FONT_SMALL_CAPS" => Ok(()),
            "FONT_ALL_CAPS" => Ok(()),
            "FONT_ALL_SMALL_CAPS" => Ok(()),
            _ => Err("Invalid font caps option".to_string())
        }
    }
} 