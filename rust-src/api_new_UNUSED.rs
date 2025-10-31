use std::collections::{HashMap, HashSet};
use serde_json::Value;
use strsim;

use crate::data::match_names::{get_effect_match_names, get_layer_match_names, get_property_match_names};
use crate::validation::{ValidationRule, MethodValidation};
use crate::validation::rules::{PropertyValueType, ArraySizeRule, RangeValidation};
use crate::validation::property::validate_property_value;
use crate::validation::context::{ValidationContext, ObjectContext, TextValidationContext, EffectInfo};

pub struct ApiObject {
    methods: HashMap<String, MethodValidation>,
    properties: HashMap<String, ValidationRule>,
    object_type: ObjectContext,
    can_set_alternate_source: bool,
    alternate_source_type: Option<String>,
    text_validation: Option<TextValidationContext>,
    effects: HashMap<String, EffectInfo>,
}

impl ApiObject {
    pub fn new(object_type: ObjectContext) -> Self {
        ApiObject {
            methods: HashMap::new(),
            properties: HashMap::new(),
            object_type,
            can_set_alternate_source: false,
            alternate_source_type: None,
            text_validation: None,
            effects: HashMap::new(),
        }
    }

    pub fn validate_alternate_source(&self, value: &Value) -> Result<(), String> {
        if !self.can_set_alternate_source {
            return Err("This object does not support alternate sources".to_string());
        }

        if let Some(ref source_type) = self.alternate_source_type {
            if let Value::Object(obj) = value {
                if let Some(Value::String(ref typ)) = obj.get("type") {
                    if typ == source_type {
                        Ok(())
                    } else {
                        Err(format!("Invalid alternate source type. Expected {}, got {}", source_type, typ))
                    }
                } else {
                    Err("Alternate source must have a type property".to_string())
                }
            } else {
                Err("Alternate source must be an object".to_string())
            }
        } else {
            Ok(())
        }
    }

    pub fn validate_effect(&self, match_name: &str, context: &ValidationContext) -> Result<(), String> {
        if let Some(effect_info) = self.effects.get(match_name) {
            // Check if we're in the correct context
            if !context.is_in_effect_context(match_name) {
                return Err(format!("Effect {} can only be used in its own context", match_name));
            }

            // Effect is valid and we're in the right context
            Ok(())
        } else {
            Err(format!("Unknown effect match name: {}", match_name))
        }
    }
}

pub struct UnifiedApi {
    pub objects: HashMap<String, ApiObject>,
    global_functions: HashSet<String>,
    effect_match_names: HashSet<String>,
    layer_match_names: HashSet<String>,
    property_match_names: HashSet<String>,
    validation_context: ValidationContext,
}

impl ValidationRule {
    fn simple(value_type: PropertyValueType) -> Self {
        ValidationRule {
            value_type,
            range: None,
            custom_validator: None,
        }
    }

    fn with_range(mut self, min: f64, max: f64) -> Self {
        self.range = Some((min, max));
        self
    }
}

impl MethodValidation {
    fn simple(param_count: usize, param_types: Vec<String>) -> Self {
        MethodValidation {
            param_count,
            param_types,
            array_sizes: None,
            param_ranges: None,
            property_type_requirements: None,
            temporal_dimensions: None,
            is_spatial: false,
            requires_expression: false,
        }
    }
}

impl UnifiedApi {
    pub fn new() -> Self {
        let mut api = UnifiedApi {
            objects: HashMap::new(),
            global_functions: HashSet::new(),
            effect_match_names: HashSet::new(),
            layer_match_names: HashSet::new(),
            property_match_names: HashSet::new(),
            validation_context: ValidationContext::new(),
        };

        api.initialize_core_api();
        api.initialize_effect_match_names();
        api.initialize_layer_match_names();
        api.initialize_property_match_names();

        api
    }

    fn initialize_core_api(&mut self) {
        // Create API objects
        let mut app = ApiObject::new(ObjectContext::Application);
        let mut project = ApiObject::new(ObjectContext::Project);
        let mut comp = ApiObject::new(ObjectContext::CompItem);
        let mut layer = ApiObject::new(ObjectContext::Layer);
        let mut text_layer = ApiObject::new(ObjectContext::TextLayer);
        let mut shape_layer = ApiObject::new(ObjectContext::ShapeLayer);
        let mut property = ApiObject::new(ObjectContext::Property);
        let mut property_group = ApiObject::new(ObjectContext::PropertyGroup);
        let mut text_document = ApiObject::new(ObjectContext::TextDocument);
        let mut render_queue = ApiObject::new(ObjectContext::RenderQueue);
        let mut render_queue_item = ApiObject::new(ObjectContext::RenderQueueItem);
        let mut output_module = ApiObject::new(ObjectContext::OutputModule);
        let mut items = ApiObject::new(ObjectContext::ItemCollection);
        let mut layers = ApiObject::new(ObjectContext::LayerCollection);
        let mut effects = ApiObject::new(ObjectContext::EffectControls);
        let mut position = ApiObject::new(ObjectContext::Property);

        // Text properties
        text_document.properties.insert("text".to_string(), ValidationRule::simple(PropertyValueType::TextDocument));
        text_document.properties.insert("font".to_string(), ValidationRule::simple(PropertyValueType::TextDocument));
        text_document.properties.insert("fontSize".to_string(), ValidationRule::simple(PropertyValueType::OneD));
        text_document.properties.insert("fillColor".to_string(), ValidationRule::simple(PropertyValueType::Color));
        text_document.properties.insert("justification".to_string(), ValidationRule::simple(PropertyValueType::OneD));

        // Position properties
        position.properties.insert("position".to_string(), ValidationRule::simple(PropertyValueType::ThreeDSpatial));
        position.properties.insert("anchorPoint".to_string(), ValidationRule::simple(PropertyValueType::ThreeDSpatial));
        position.properties.insert("scale".to_string(), ValidationRule::simple(PropertyValueType::ThreeD));

        // Layer properties
        layer.properties.insert("index".to_string(), ValidationRule::simple(PropertyValueType::LayerIndex));
        layer.properties.insert("maskIndex".to_string(), ValidationRule::simple(PropertyValueType::MaskIndex));
        layer.properties.insert("name".to_string(), ValidationRule::simple(PropertyValueType::TextDocument));
        layer.properties.insert("parent".to_string(), ValidationRule::simple(PropertyValueType::OneD));
        layer.properties.insert("position".to_string(), ValidationRule::simple(PropertyValueType::ThreeDSpatial));
        layer.properties.insert("rotation".to_string(), ValidationRule::simple(PropertyValueType::OneD));
        layer.properties.insert("opacity".to_string(), ValidationRule::simple(PropertyValueType::OneD));
        layer.properties.insert("Effects".to_string(), ValidationRule::simple(PropertyValueType::Custom("Object".to_string())));
        layer.properties.insert("property".to_string(), ValidationRule::simple(PropertyValueType::Custom("Function".to_string())));

        // Add text layer methods
        text_layer.methods.extend(layer.methods.clone());
        text_layer.properties.extend(layer.properties.clone());
        text_layer.properties.insert("sourceText".to_string(), ValidationRule::simple(PropertyValueType::TextDocument));

        // Add shape layer methods
        shape_layer.methods.extend(layer.methods.clone());
        shape_layer.properties.extend(layer.properties.clone());
        shape_layer.properties.insert("Contents".to_string(), ValidationRule::simple(PropertyValueType::Shape));

        // Add property methods
        property.methods.insert("setValue".to_string(), MethodValidation::simple(1, vec!["Any".to_string()]));
        property.methods.insert("setValueAtTime".to_string(), MethodValidation::simple(2, vec!["Number".to_string(), "Any".to_string()]));
        property.methods.insert("addProperty".to_string(), MethodValidation::simple(1, vec!["String".to_string()]));
        property.methods.insert("setTemporalEaseAtKey".to_string(), MethodValidation {
            param_count: 3,
            param_types: vec![
                "Number".to_string(),  // keyIndex
                "Array".to_string(),   // inTemporalEase
                "Array".to_string(),   // outTemporalEase
            ],
            array_sizes: Some(vec![
                ArraySizeRule {
                    parameter_name: "inTemporalEase".to_string(),
                    property_value_type: PropertyValueType::TwoD,
                    required_size: 2,
                    description: "For 2D properties, array must contain exactly 2 KeyframeEase objects".to_string(),
                }
            ]),
            property_type_requirements: None,
            param_ranges: Some(vec![
                RangeValidation {
                    parameter_name: "keyIndex".to_string(),
                    min: Some(1.0),
                    max: None,
                    description: "Key index must be greater than 0".to_string(),
                }
            ]),
            temporal_dimensions: None,
            is_spatial: false,
            requires_expression: false,
        });

        // Add property properties
        property.properties.insert("value".to_string(), ValidationRule::simple(PropertyValueType::Custom("Any".to_string())));
        property.properties.insert("numKeys".to_string(), ValidationRule::simple(PropertyValueType::OneD));
        property.properties.insert("propertyIndex".to_string(), ValidationRule::simple(PropertyValueType::OneD));

        // Add property group methods
        property_group.methods.extend(property.methods.clone());
        property_group.properties.extend(property.properties.clone());

        // Add render queue methods
        render_queue.methods.insert("render".to_string(), MethodValidation::simple(0, vec![]));

        // Add render queue item methods
        render_queue_item.methods.insert("render".to_string(), MethodValidation::simple(0, vec![]));
        render_queue_item.methods.insert("outputModule".to_string(), MethodValidation::simple(1, vec!["Number".to_string()]));

        // Add output module methods
        output_module.methods.insert("applyTemplate".to_string(), MethodValidation::simple(1, vec!["String".to_string()]));

        // Add items collection methods
        items.methods.insert("addComp".to_string(), MethodValidation::simple(6, vec![
            "String".to_string(),
            "Number".to_string(),
            "Number".to_string(),
            "Number".to_string(),
            "Number".to_string(),
            "Number".to_string(),
        ]));
        items.methods.insert("add".to_string(), MethodValidation::simple(1, vec!["Object".to_string()]));

        // Add layers collection methods
        layers.methods.insert("addText".to_string(), MethodValidation::simple(1, vec!["String".to_string()]));
        layers.methods.insert("addShape".to_string(), MethodValidation::simple(0, vec![]));
        layers.methods.insert("addSolid".to_string(), MethodValidation::simple(6, vec![
            "Array".to_string(),
            "String".to_string(),
            "Number".to_string(),
            "Number".to_string(),
            "Number".to_string(),
            "Number".to_string(),
        ]));
        layers.methods.insert("addCamera".to_string(), MethodValidation::simple(2, vec!["String".to_string(), "Array".to_string()]));
        layers.methods.insert("addLight".to_string(), MethodValidation::simple(2, vec!["String".to_string(), "Array".to_string()]));

        // Add effects methods
        effects.methods.insert("addProperty".to_string(), MethodValidation::simple(1, vec!["String".to_string()]));

        // Store objects in the API
        self.objects.insert("Application".to_string(), app);
        self.objects.insert("Project".to_string(), project);
        self.objects.insert("CompItem".to_string(), comp);
        self.objects.insert("Layer".to_string(), layer);
        self.objects.insert("TextLayer".to_string(), text_layer);
        self.objects.insert("ShapeLayer".to_string(), shape_layer);
        self.objects.insert("Property".to_string(), property);
        self.objects.insert("PropertyGroup".to_string(), property_group);
        self.objects.insert("TextDocument".to_string(), text_document);
        self.objects.insert("RenderQueue".to_string(), render_queue);
        self.objects.insert("RenderQueueItem".to_string(), render_queue_item);
        self.objects.insert("OutputModule".to_string(), output_module);
        self.objects.insert("ItemCollection".to_string(), items);
        self.objects.insert("LayerCollection".to_string(), layers);
        self.objects.insert("EffectControls".to_string(), effects);
    }

    pub fn validate_method_call(&mut self, class_name: &str, method_name: &str, args: &[Value]) -> Result<(), String> {
        if let Some(api_obj) = self.objects.get(class_name) {
            if let Some(validation) = api_obj.methods.get(method_name) {
                // Enter the object's context for validation
                self.validation_context.enter_context(api_obj.object_type.clone());

                let result = if args.len() != validation.param_count {
                    Err(format!(
                        "Method {} expects {} arguments, got {}",
                        method_name,
                        validation.param_count,
                        args.len()
                    ))
                } else {
                    // Validate argument types
                    for (i, (arg, expected_type)) in args.iter().zip(validation.param_types.iter()).enumerate() {
                        match expected_type.as_str() {
                            "Number" => {
                                if !arg.is_number() {
                                    return Err(format!("Argument {} must be a number", i + 1));
                                }
                            }
                            "String" => {
                                if !arg.is_string() {
                                    return Err(format!("Argument {} must be a string", i + 1));
                                }
                            }
                            "Array" => {
                                if !arg.is_array() {
                                    return Err(format!("Argument {} must be an array", i + 1));
                                }
                            }
                            "Object" => {
                                if !arg.is_object() {
                                    return Err(format!("Argument {} must be an object", i + 1));
                                }
                            }
                            "Any" => {} // Any type is allowed
                            _ => {
                                return Err(format!("Unknown type requirement: {}", expected_type));
                            }
                        }
                    }

                    // Validate array sizes if required
                    if let Some(ref array_sizes) = validation.array_sizes {
                        for rule in array_sizes {
                            let arg_index = args.iter().position(|arg| {
                                if let Value::String(name) = arg {
                                    name == &rule.parameter_name
                                } else {
                                    false
                                }
                            }).ok_or_else(|| format!("Array size parameter {} not found", rule.parameter_name))?;

                            if let Value::Array(arr) = &args[arg_index] {
                                if arr.len() != rule.required_size {
                                    return Err(format!("{}", rule.description));
                                }
                            }
                        }
                    }

                    // Validate parameter ranges if required
                    if let Some(ref ranges) = validation.param_ranges {
                        for range in ranges {
                            let arg_index = args.iter().position(|arg| {
                                if let Value::String(name) = arg {
                                    name == &range.parameter_name
                                } else {
                                    false
                                }
                            }).ok_or_else(|| format!("Range parameter {} not found", range.parameter_name))?;

                            if let Value::Number(n) = &args[arg_index] {
                                let value = n.as_f64().unwrap();
                                if let Some(min) = range.min {
                                    if value < min {
                                        return Err(format!("{}", range.description));
                                    }
                                }
                                if let Some(max) = range.max {
                                    if value > max {
                                        return Err(format!("{}", range.description));
                                    }
                                }
                            }
                        }
                    }

                    Ok(())
                };

                // Exit the context after validation
                self.validation_context.exit_context();
                result
            } else {
                Err(format!("Method {} not found on {}", method_name, class_name))
            }
        } else {
            Err(format!("Class {} not found", class_name))
        }
    }

    pub fn validate_property_value(&self, class_name: &str, property_name: &str, value: &Value, _context: &ValidationContext) -> Result<(), String> {
        if let Some(api_obj) = self.objects.get(class_name) {
            if let Some(rule) = api_obj.properties.get(property_name) {
                validate_property_value(value, rule)
            } else {
                Err(format!("Property {} not found on {}", property_name, class_name))
            }
        } else {
            Err(format!("Class {} not found", class_name))
        }
    }

    fn validate_raw_property_value(&self, value: &Value, value_type: &PropertyValueType) -> Result<(), String> {
        match value_type {
            PropertyValueType::NoValue => {
                if !value.is_null() {
                    Err("Property does not store any value".to_string())
                } else {
                    Ok(())
                }
            },
            PropertyValueType::OneD => {
                if let Value::Number(_) = value {
                    Ok(())
                } else {
                    Err("Value must be a number".to_string())
                }
            },
            PropertyValueType::TwoD | PropertyValueType::TwoDSpatial => {
                if let Value::Array(arr) = value {
                    if arr.len() == 2 {
                        for v in arr {
                            if !v.is_number() {
                                return Err("Array elements must be numbers".to_string());
                            }
                        }
                        Ok(())
                    } else {
                        Err("Array must have exactly 2 elements".to_string())
                    }
                } else {
                    Err("Value must be an array".to_string())
                }
            },
            PropertyValueType::ThreeD | PropertyValueType::ThreeDSpatial => {
                if let Value::Array(arr) = value {
                    if arr.len() == 3 {
                        for v in arr {
                            if !v.is_number() {
                                return Err("Array elements must be numbers".to_string());
                            }
                        }
                        Ok(())
                    } else {
                        Err("Array must have exactly 3 elements".to_string())
                    }
                } else {
                    Err("Value must be an array".to_string())
                }
            },
            PropertyValueType::Color => {
                if let Value::Array(arr) = value {
                    if arr.len() == 4 {
                        for v in arr {
                            if let Value::Number(n) = v {
                                let val = n.as_f64().unwrap();
                                if val < 0.0 || val > 1.0 {
                                    return Err("Color values must be between 0.0 and 1.0".to_string());
                                }
                            } else {
                                return Err("Color values must be numbers".to_string());
                            }
                        }
                        Ok(())
                    } else {
                        Err("Color array must have exactly 4 elements (RGBA)".to_string())
                    }
                } else {
                    Err("Color value must be an array".to_string())
                }
            },
            PropertyValueType::Marker => {
                if let Value::Object(obj) = value {
                    if !obj.contains_key("comment") || !obj.contains_key("duration") {
                        Err("Marker must have comment and duration properties".to_string())
                    } else {
                        Ok(())
                    }
                } else {
                    Err("Marker value must be an object".to_string())
                }
            },
            PropertyValueType::LayerIndex => {
                if let Value::Number(n) = value {
                    let index = n.as_i64().ok_or("Layer index must be an integer")?;
                    if index >= 0 {
                        Ok(())
                    } else {
                        Err("Layer index must be non-negative".to_string())
                    }
                } else {
                    Err("Layer index must be a number".to_string())
                }
            },
            PropertyValueType::MaskIndex => {
                if let Value::Number(n) = value {
                    let index = n.as_i64().ok_or("Mask index must be an integer")?;
                    if index >= 0 {
                        Ok(())
                    } else {
                        Err("Mask index must be non-negative".to_string())
                    }
                } else {
                    Err("Mask index must be a number".to_string())
                }
            },
            PropertyValueType::Shape => {
                if let Value::Object(obj) = value {
                    if !obj.contains_key("vertices") {
                        Err("Shape must have vertices property".to_string())
                    } else {
                        Ok(())
                    }
                } else {
                    Err("Shape value must be an object".to_string())
                }
            },
            PropertyValueType::TextDocument => {
                if let Value::Object(obj) = value {
                    if !obj.contains_key("text") {
                        Err("TextDocument must have text property".to_string())
                    } else {
                        Ok(())
                    }
                } else {
                    Err("TextDocument value must be an object".to_string())
                }
            },
            PropertyValueType::CustomValue | PropertyValueType::Custom(_) => Ok(()),
        }
    }

    fn validate_expression_result(&self, value: &Value, value_type: &PropertyValueType) -> Result<(), String> {
        self.validate_raw_property_value(value, value_type)
    }

    fn initialize_effect_match_names(&mut self) {
        for name in get_effect_match_names() {
            self.effect_match_names.insert(name.to_string());
        }
    }

    fn initialize_layer_match_names(&mut self) {
        for name in get_layer_match_names() {
            self.layer_match_names.insert(name.to_string());
        }
    }

    fn initialize_property_match_names(&mut self) {
        for name in get_property_match_names() {
            self.property_match_names.insert(name.to_string());
        }
    }

    pub fn track_variable_assignment(&mut self, var_name: &str, value: &Value, target_property: Option<&str>) -> Result<(), String> {
        self.validation_context.track_variable_assignment(var_name, value, target_property)
    }
}

pub fn get_match_names() -> Vec<&'static str> {
    let mut names = Vec::new();
    names.extend(get_effect_match_names());
    names.extend(get_layer_match_names());
    names.extend(get_property_match_names());
    names
}

pub fn get_api_objects() -> HashMap<String, ApiObject> {
    UnifiedApi::new().objects
} 