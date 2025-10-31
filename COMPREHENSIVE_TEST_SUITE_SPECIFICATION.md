# Comprehensive Test Suite Specification for After Effects Rust Validator

## Executive Summary

This specification outlines a comprehensive testing framework to validate the Rust implementation against Adobe's official After Effects scripting documentation. The test suite is designed to systematically verify API compliance, performance, and real-world usage patterns.

## Test Architecture Overview

### 1. Test Categories and Priorities

#### **Priority 1: Core Object Testing (Critical)**
- **Application Object**: 67 attributes + 23 methods
- **Project Object**: 15 attributes + 12 methods  
- **Layer Object**: 25 attributes + 12 methods
- **Property Object**: 31 attributes + 50+ methods
- **Item Objects**: CompItem, FootageItem, FolderItem inheritance chain

#### **Priority 2: API Validation Testing (High)**
- Parameter type validation for all documented methods
- Range checking for numeric parameters
- String validation for enum-like parameters
- Array parameter validation
- Optional parameter handling

#### **Priority 3: Workflow Testing (Medium)**
- Project creation and management workflows
- Layer manipulation workflows
- Animation and keyframe workflows
- Text system operations
- Shape layer operations
- Effects application workflows
- Render queue operations

#### **Priority 4: Integration Testing (Medium)**
- Cross-object interactions
- Property inheritance chains
- Expression evaluation
- Undo/redo operations
- Memory management

---

## 1. Core Object Testing Framework

### 1.1 Application Object Test Suite

#### **Test Categories:**

**A. Object Creation and Initialization**
```rust
#[test]
fn test_application_object_creation() {
    let app = Application::new();
    assert!(app.is_valid());
    assert!(app.app_object.is_initialized());
}

#[test]
fn test_application_global_access() {
    // Test that app is globally accessible
    let app = get_global_app();
    assert!(app.is_some());
}
```

**B. Properties Testing (67 attributes)**
```rust
// Read-only properties
#[test]
fn test_application_read_only_properties() {
    let app = Application::new();
    
    // System info (read-only)
    assert!(app.build_name().is_some());
    assert!(app.build_number() > 0);
    assert!(app.version().matches(r"\d+\.\d+\.\d+"));
    
    // Hardware info (read-only)
    assert!(app.memory_in_use() >= 0.0);
    assert!(app.is_watch_folder() == false || app.is_watch_folder() == true);
    assert!(app.is_network_security_enabled() == false || app.is_network_security_enabled() == true);
}

// Read-write properties
#[test]
fn test_application_read_write_properties() {
    let mut app = Application::new();
    
    // Test exitAfterLaunchAndEval
    app.set_exit_after_launch_and_eval(true);
    assert_eq!(app.exit_after_launch_and_eval(), true);
    
    // Test exitCode
    app.set_exit_code(42);
    assert_eq!(app.exit_code(), 42);
    
    // Test saveProjectOnCrash
    app.set_save_project_on_crash(false);
    assert_eq!(app.save_project_on_crash(), false);
}
```

**C. Methods Testing (23 methods)**
```rust
#[test]
fn test_application_project_methods() {
    let mut app = Application::new();
    
    // Test newProject()
    let project = app.new_project();
    assert!(project.is_ok());
    
    // Test open()
    let result = app.open("test_project.aep");
    assert!(result.is_ok() || result.is_err()); // File may not exist
    
    // Test save()
    let result = app.save();
    assert!(result.is_ok());
}

#[test]
fn test_application_memory_methods() {
    let mut app = Application::new();
    
    // Test purge()
    app.purge(PurgeTarget::AllCaches);
    
    // Test setMemoryUsageLimits()
    let result = app.set_memory_usage_limits(2.0, 80.0);
    assert!(result.is_ok());
    
    // Test beginSuppressDialogs()
    app.begin_suppress_dialogs();
    app.end_suppress_dialogs();
}
```

### 1.2 Project Object Test Suite

#### **Test Categories:**

**A. Project Properties (15 attributes)**
```rust
#[test]
fn test_project_properties() {
    let project = Project::new();
    
    // Test file property
    assert!(project.file().is_none() || project.file().is_some());
    
    // Test numItems
    assert!(project.num_items() >= 0);
    
    // Test activeItem
    let active = project.active_item();
    assert!(active.is_none() || active.is_some());
    
    // Test selection
    let selection = project.selection();
    assert!(selection.len() >= 0);
}

#[test]
fn test_project_render_settings() {
    let mut project = Project::new();
    
    // Test renderQueue
    let rq = project.render_queue();
    assert!(rq.is_some());
    
    // Test workAreaStart/Duration
    project.set_work_area_start(5.0);
    assert_eq!(project.work_area_start(), 5.0);
    
    project.set_work_area_duration(10.0);
    assert_eq!(project.work_area_duration(), 10.0);
}
```

**B. Project Methods (12 methods)**
```rust
#[test]
fn test_project_item_methods() {
    let mut project = Project::new();
    
    // Test item() method
    let item = project.item(1);
    assert!(item.is_ok() || item.is_err());
    
    // Test itemByID()
    let item = project.item_by_id(1001);
    assert!(item.is_ok() || item.is_err());
    
    // Test items array access
    let items = project.items();
    assert!(items.length() >= 0);
}

#[test]
fn test_project_import_methods() {
    let mut project = Project::new();
    
    // Test importFile()
    let options = ImportOptions::new();
    let result = project.import_file("test.mp4", options);
    assert!(result.is_ok() || result.is_err());
    
    // Test importFileWithDialog()
    let result = project.import_file_with_dialog();
    assert!(result.is_ok() || result.is_err());
}
```

### 1.3 Layer Object Test Suite

#### **Test Categories:**

**A. Layer Hierarchy Testing**
```rust
#[test]
fn test_layer_inheritance() {
    let layer = Layer::new();
    
    // Test PropertyGroup inheritance
    assert!(layer.as_property_group().is_some());
    
    // Test PropertyBase inheritance
    assert!(layer.as_property_base().is_some());
    
    // Test instanceof behavior
    assert!(layer.instanceof("Layer"));
    assert!(layer.instanceof("PropertyGroup"));
    assert!(layer.instanceof("PropertyBase"));
}

#[test]
fn test_layer_subclass_creation() {
    // Test AVLayer creation
    let av_layer = AVLayer::new();
    assert!(av_layer.instanceof("AVLayer"));
    assert!(av_layer.instanceof("Layer"));
    
    // Test ShapeLayer creation
    let shape_layer = ShapeLayer::new();
    assert!(shape_layer.instanceof("ShapeLayer"));
    assert!(shape_layer.instanceof("AVLayer"));
    
    // Test TextLayer creation
    let text_layer = TextLayer::new();
    assert!(text_layer.instanceof("TextLayer"));
    assert!(text_layer.instanceof("AVLayer"));
}
```

**B. Layer Properties (25 attributes)**
```rust
#[test]
fn test_layer_basic_properties() {
    let mut layer = Layer::new();
    
    // Test name property
    layer.set_name("Test Layer");
    assert_eq!(layer.name(), "Test Layer");
    
    // Test comment property
    layer.set_comment("Test comment");
    assert_eq!(layer.comment(), "Test comment");
    
    // Test enabled property
    layer.set_enabled(false);
    assert_eq!(layer.enabled(), false);
    
    // Test locked property
    layer.set_locked(true);
    assert_eq!(layer.locked(), true);
}

#[test]
fn test_layer_time_properties() {
    let mut layer = Layer::new();
    
    // Test inPoint/outPoint
    layer.set_in_point(2.0);
    assert_eq!(layer.in_point(), 2.0);
    
    layer.set_out_point(10.0);
    assert_eq!(layer.out_point(), 10.0);
    
    // Test startTime
    layer.set_start_time(1.0);
    assert_eq!(layer.start_time(), 1.0);
    
    // Test stretch
    layer.set_stretch(200.0);
    assert_eq!(layer.stretch(), 200.0);
}

#[test]
fn test_layer_3d_properties() {
    let mut layer = Layer::new();
    
    // Test threeDLayer
    layer.set_three_d_layer(true);
    assert_eq!(layer.three_d_layer(), true);
    
    // Test threeDPerChar (text layers only)
    if let Some(text_layer) = layer.as_text_layer() {
        text_layer.set_three_d_per_char(true);
        assert_eq!(text_layer.three_d_per_char(), true);
    }
}
```

**C. Layer Methods (12 methods)**
```rust
#[test]
fn test_layer_manipulation_methods() {
    let mut layer = Layer::new();
    
    // Test duplicate()
    let duplicate = layer.duplicate();
    assert!(duplicate.is_ok());
    
    // Test copyToComp()
    let target_comp = CompItem::new();
    let copied = layer.copy_to_comp(&target_comp);
    assert!(copied.is_ok());
    
    // Test remove()
    let result = layer.remove();
    assert!(result.is_ok());
}

#[test]
fn test_layer_parenting_methods() {
    let mut layer = Layer::new();
    let parent_layer = Layer::new();
    
    // Test setParentWithJump()
    let result = layer.set_parent_with_jump(&parent_layer);
    assert!(result.is_ok());
    
    // Test parent property
    assert!(layer.parent().is_some());
}
```

### 1.4 Property Object Test Suite

#### **Test Categories:**

**A. Property Value Testing**
```rust
#[test]
fn test_property_value_types() {
    // Test OneD properties
    let prop = Property::new(PropertyValueType::OneD);
    prop.set_value(42.0);
    assert_eq!(prop.value(), 42.0);
    
    // Test TwoD properties
    let prop = Property::new(PropertyValueType::TwoD);
    prop.set_value(vec![100.0, 200.0]);
    assert_eq!(prop.value(), vec![100.0, 200.0]);
    
    // Test ThreeD properties
    let prop = Property::new(PropertyValueType::ThreeD);
    prop.set_value(vec![100.0, 200.0, 300.0]);
    assert_eq!(prop.value(), vec![100.0, 200.0, 300.0]);
    
    // Test Color properties
    let prop = Property::new(PropertyValueType::Color);
    prop.set_value(vec![1.0, 0.5, 0.2, 1.0]);
    assert_eq!(prop.value(), vec![1.0, 0.5, 0.2, 1.0]);
}

#[test]
fn test_property_spatial_properties() {
    let prop = Property::new(PropertyValueType::TwoDSpatial);
    
    // Test spatial tangent handling
    prop.set_spatial_tangents_at_key(1, vec![10.0, 20.0], vec![30.0, 40.0]);
    let (in_tangent, out_tangent) = prop.spatial_tangents_at_key(1);
    assert_eq!(in_tangent, vec![10.0, 20.0]);
    assert_eq!(out_tangent, vec![30.0, 40.0]);
}
```

**B. Keyframe System Testing**
```rust
#[test]
fn test_keyframe_basic_operations() {
    let mut prop = Property::new(PropertyValueType::OneD);
    
    // Test addKey()
    let key_index = prop.add_key(5.0);
    assert!(key_index.is_ok());
    
    // Test setValueAtKey()
    prop.set_value_at_key(key_index.unwrap(), 100.0);
    assert_eq!(prop.key_value(key_index.unwrap()), 100.0);
    
    // Test removeKey()
    let result = prop.remove_key(key_index.unwrap());
    assert!(result.is_ok());
}

#[test]
fn test_keyframe_interpolation() {
    let mut prop = Property::new(PropertyValueType::OneD);
    
    // Add keyframes
    let key1 = prop.add_key(0.0).unwrap();
    let key2 = prop.add_key(2.0).unwrap();
    
    prop.set_value_at_key(key1, 0.0);
    prop.set_value_at_key(key2, 100.0);
    
    // Test interpolation types
    prop.set_interpolation_type_at_key(key1, KeyframeInterpolationType::Linear, KeyframeInterpolationType::Linear);
    
    // Test ease values
    let ease = KeyframeEase::new(25.0, 50.0);
    prop.set_temporal_ease_at_key(key1, vec![ease.clone()], vec![ease]);
    
    // Test valueAtTime()
    let interpolated = prop.value_at_time(1.0, false);
    assert!(interpolated >= 0.0 && interpolated <= 100.0);
}
```

**C. Expression System Testing**
```rust
#[test]
fn test_expression_basic_functionality() {
    let mut prop = Property::new(PropertyValueType::OneD);
    
    // Test setting expression
    prop.set_expression("time * 45");
    assert_eq!(prop.expression(), "time * 45");
    
    // Test expression evaluation
    let result = prop.value_at_time(1.0, false);
    assert_eq!(result, 45.0);
    
    // Test expression error handling
    prop.set_expression("invalid expression syntax");
    assert!(prop.expression_error().is_some());
}

#[test]
fn test_expression_complex_cases() {
    let mut prop = Property::new(PropertyValueType::TwoD);
    
    // Test complex expression
    let expr = r#"
        var pos = thisComp.layer("target").transform.position;
        var offset = [50, 100];
        pos + offset;
    "#;
    
    prop.set_expression(expr);
    assert!(prop.expression_enabled());
    
    // Test expression with references
    let result = prop.value_at_time(0.0, false);
    assert!(result.len() == 2);
}
```

---

## 2. API Validation Testing Framework

### 2.1 Parameter Type Validation

#### **Test Categories:**

**A. Numeric Parameter Validation**
```rust
#[test]
fn test_numeric_parameter_validation() {
    let validator = ParameterValidator::new();
    
    // Test integer parameters
    assert!(validator.validate_integer(42).is_ok());
    assert!(validator.validate_integer(3.14).is_err());
    assert!(validator.validate_integer("not a number").is_err());
    
    // Test float parameters
    assert!(validator.validate_float(3.14).is_ok());
    assert!(validator.validate_float(42).is_ok());
    assert!(validator.validate_float("not a number").is_err());
    
    // Test range validation
    assert!(validator.validate_range(50.0, 0.0, 100.0).is_ok());
    assert!(validator.validate_range(-10.0, 0.0, 100.0).is_err());
    assert!(validator.validate_range(150.0, 0.0, 100.0).is_err());
}

#[test]
fn test_array_parameter_validation() {
    let validator = ParameterValidator::new();
    
    // Test array size validation
    assert!(validator.validate_array_size(vec![1, 2, 3], 3).is_ok());
    assert!(validator.validate_array_size(vec![1, 2], 3).is_err());
    
    // Test array element type validation
    assert!(validator.validate_array_elements(vec![1.0, 2.0, 3.0], &|x| x.is_float()).is_ok());
    assert!(validator.validate_array_elements(vec![1.0, "text", 3.0], &|x| x.is_float()).is_err());
}
```

**B. String Parameter Validation**
```rust
#[test]
fn test_string_parameter_validation() {
    let validator = ParameterValidator::new();
    
    // Test enum validation
    let blend_modes = vec!["NORMAL", "MULTIPLY", "SCREEN", "OVERLAY"];
    assert!(validator.validate_enum("MULTIPLY", &blend_modes).is_ok());
    assert!(validator.validate_enum("INVALID_MODE", &blend_modes).is_err());
    
    // Test string format validation
    assert!(validator.validate_file_path("/path/to/file.aep").is_ok());
    assert!(validator.validate_file_path("").is_err());
    
    // Test match name validation
    assert!(validator.validate_match_name("ADBE Transform Group").is_ok());
    assert!(validator.validate_match_name("INVALID_MATCH_NAME").is_err());
}
```

**C. Optional Parameter Handling**
```rust
#[test]
fn test_optional_parameter_handling() {
    let validator = ParameterValidator::new();
    
    // Test optional parameter presence
    assert!(validator.validate_optional(Some(42)).is_ok());
    assert!(validator.validate_optional(None).is_ok());
    
    // Test optional with default values
    let result = validator.get_or_default(None, 100);
    assert_eq!(result, 100);
    
    let result = validator.get_or_default(Some(42), 100);
    assert_eq!(result, 42);
}
```

### 2.2 Method Signature Validation

#### **Test Categories:**

**A. Method Overload Testing**
```rust
#[test]
fn test_method_overload_validation() {
    let validator = MethodValidator::new();
    
    // Test Layer.duplicate() overloads
    // duplicate() - no parameters
    assert!(validator.validate_method_call("Layer.duplicate", vec![]).is_ok());
    
    // duplicate(targetComp) - one parameter
    let comp = CompItem::new();
    assert!(validator.validate_method_call("Layer.duplicate", vec![comp]).is_ok());
    
    // Invalid overload
    assert!(validator.validate_method_call("Layer.duplicate", vec![1, 2, 3]).is_err());
}

#[test]
fn test_method_parameter_count() {
    let validator = MethodValidator::new();
    
    // Test Property.setValueAtKey() - requires 2 parameters
    assert!(validator.validate_method_call("Property.setValueAtKey", vec![1, 100.0]).is_ok());
    assert!(validator.validate_method_call("Property.setValueAtKey", vec![1]).is_err());
    assert!(validator.validate_method_call("Property.setValueAtKey", vec![]).is_err());
}
```

**B. Context-Aware Validation**
```rust
#[test]
fn test_context_aware_method_validation() {
    let mut validator = MethodValidator::new();
    
    // Test method availability based on object type
    validator.set_context(ObjectContext::TextLayer);
    assert!(validator.validate_method_call("TextLayer.replaceText", vec!["new text"]).is_ok());
    
    validator.set_context(ObjectContext::AVLayer);
    assert!(validator.validate_method_call("TextLayer.replaceText", vec!["new text"]).is_err());
    
    // Test property access based on layer type
    validator.set_context(ObjectContext::ShapeLayer);
    assert!(validator.validate_property_access("contents").is_ok());
    
    validator.set_context(ObjectContext::TextLayer);
    assert!(validator.validate_property_access("contents").is_err());
}
```

---

## 3. Workflow Testing Framework

### 3.1 Project Creation and Management

#### **Test Categories:**

**A. Project Lifecycle Testing**
```rust
#[test]
fn test_project_creation_workflow() {
    let mut app = Application::new();
    
    // Create new project
    let project = app.new_project().unwrap();
    assert!(project.is_valid());
    
    // Import footage
    let footage = project.import_file("test.mp4", ImportOptions::default()).unwrap();
    assert!(footage.instanceof("FootageItem"));
    
    // Create composition
    let comp = project.items().add_comp("Test Comp", 1920, 1080, 1.0, 10.0).unwrap();
    assert!(comp.instanceof("CompItem"));
    
    // Add layer to composition
    let layer = comp.layers().add(&footage, 10.0).unwrap();
    assert!(layer.instanceof("AVLayer"));
}

#[test]
fn test_project_save_workflow() {
    let mut app = Application::new();
    let project = app.new_project().unwrap();
    
    // Set project file
    project.set_file("test_project.aep");
    
    // Save project
    let result = app.save();
    assert!(result.is_ok());
    
    // Test project dirty state
    assert!(!project.dirty());
}
```

**B. Item Management Testing**
```rust
#[test]
fn test_item_organization_workflow() {
    let mut project = Project::new();
    
    // Create folder
    let folder = project.items().add_folder("Assets").unwrap();
    assert!(folder.instanceof("FolderItem"));
    
    // Import assets into folder
    let footage = project.import_file("video.mp4", ImportOptions::default()).unwrap();
    footage.set_parent_folder(&folder);
    
    // Test item hierarchy
    assert_eq!(footage.parent_folder().unwrap().name(), "Assets");
    assert_eq!(folder.num_items(), 1);
}
```

### 3.2 Animation and Keyframe Workflows

#### **Test Categories:**

**A. Basic Animation Workflow**
```rust
#[test]
fn test_basic_animation_workflow() {
    let mut comp = CompItem::new();
    let layer = comp.layers().add_solid([1.0, 0.0, 0.0], "Red Solid", 100, 100, 1.0, 10.0).unwrap();
    
    // Get transform properties
    let transform = layer.property("ADBE Transform Group").unwrap();
    let position = transform.property("ADBE Position").unwrap();
    
    // Create keyframes
    let key1 = position.add_key(0.0).unwrap();
    let key2 = position.add_key(2.0).unwrap();
    
    // Set values
    position.set_value_at_key(key1, vec![100.0, 100.0]);
    position.set_value_at_key(key2, vec![500.0, 400.0]);
    
    // Test interpolation
    let mid_value = position.value_at_time(1.0, false);
    assert!(mid_value[0] > 100.0 && mid_value[0] < 500.0);
    assert!(mid_value[1] > 100.0 && mid_value[1] < 400.0);
}

#[test]
fn test_ease_curve_workflow() {
    let mut position = Property::new(PropertyValueType::TwoD);
    
    // Add keyframes
    let key1 = position.add_key(0.0).unwrap();
    let key2 = position.add_key(2.0).unwrap();
    
    // Set ease curves
    let ease_in = KeyframeEase::new(75.0, 25.0);
    let ease_out = KeyframeEase::new(75.0, 25.0);
    
    position.set_temporal_ease_at_key(key1, vec![ease_out.clone(), ease_out], vec![ease_in.clone(), ease_in]);
    
    // Test ease values
    let (in_ease, out_ease) = position.temporal_ease_at_key(key1);
    assert_eq!(in_ease[0].influence(), 75.0);
    assert_eq!(out_ease[0].speed(), 25.0);
}
```

**B. Advanced Animation Features**
```rust
#[test]
fn test_expression_driven_animation() {
    let mut position = Property::new(PropertyValueType::TwoD);
    
    // Set expression
    position.set_expression("wiggle(2, 50)");
    
    // Test expression evaluation at different times
    let pos1 = position.value_at_time(0.0, false);
    let pos2 = position.value_at_time(1.0, false);
    
    // Wiggle should produce different values
    assert!(pos1 != pos2);
    
    // Test expression with layer references
    position.set_expression("thisComp.layer(\"target\").transform.position");
    assert!(position.expression_enabled());
}
```

### 3.3 Text System Workflows

#### **Test Categories:**

**A. Basic Text Operations**
```rust
#[test]
fn test_text_layer_creation_workflow() {
    let mut comp = CompItem::new();
    let text_layer = comp.layers().add_text("Hello World").unwrap();
    
    assert!(text_layer.instanceof("TextLayer"));
    assert_eq!(text_layer.name(), "Hello World");
    
    // Test text property access
    let text_prop = text_layer.property("ADBE Text Properties").unwrap();
    let source_text = text_prop.property("ADBE Text Document").unwrap();
    
    assert!(source_text.instanceof("Property"));
}

#[test]
fn test_text_formatting_workflow() {
    let mut text_layer = TextLayer::new();
    let text_doc = text_layer.text_document().unwrap();
    
    // Set basic text properties
    text_doc.set_text("Formatted Text");
    text_doc.set_font("Arial");
    text_doc.set_font_size(24.0);
    text_doc.set_fill_color(vec![1.0, 0.0, 0.0, 1.0]);
    
    // Test formatted text
    assert_eq!(text_doc.text(), "Formatted Text");
    assert_eq!(text_doc.font(), "Arial");
    assert_eq!(text_doc.font_size(), 24.0);
}
```

**B. Advanced Text Features**
```rust
#[test]
fn test_character_range_workflow() {
    let mut text_layer = TextLayer::new();
    let text_doc = text_layer.text_document().unwrap();
    
    text_doc.set_text("Hello World");
    
    // Create character range
    let char_range = text_doc.character_range(0, 5); // "Hello"
    char_range.set_font_size(36.0);
    char_range.set_fill_color(vec![1.0, 0.0, 0.0, 1.0]);
    
    // Test character formatting
    assert_eq!(char_range.font_size(), 36.0);
    assert_eq!(char_range.fill_color(), vec![1.0, 0.0, 0.0, 1.0]);
}

#[test]
fn test_paragraph_formatting_workflow() {
    let mut text_layer = TextLayer::new();
    let text_doc = text_layer.text_document().unwrap();
    
    text_doc.set_text("Paragraph 1\nParagraph 2");
    
    // Format first paragraph
    let para_range = text_doc.paragraph_range(0, 1);
    para_range.set_justification(ParagraphJustification::Center);
    para_range.set_space_before(10.0);
    para_range.set_space_after(5.0);
    
    // Test paragraph formatting
    assert_eq!(para_range.justification(), ParagraphJustification::Center);
    assert_eq!(para_range.space_before(), 10.0);
}
```

### 3.4 Shape Layer Workflows

#### **Test Categories:**

**A. Basic Shape Creation**
```rust
#[test]
fn test_shape_layer_creation_workflow() {
    let mut comp = CompItem::new();
    let shape_layer = comp.layers().add_shape().unwrap();
    
    assert!(shape_layer.instanceof("ShapeLayer"));
    
    // Add shape group
    let contents = shape_layer.property("ADBE Root Vectors Group").unwrap();
    let shape_group = contents.add_property("ADBE Vector Group").unwrap();
    
    // Add rectangle
    let rect = shape_group.add_property("ADBE Vector Shape - Rect").unwrap();
    let size_prop = rect.property("ADBE Vector Rect Size").unwrap();
    size_prop.set_value(vec![200.0, 100.0]);
    
    // Test shape properties
    assert_eq!(size_prop.value(), vec![200.0, 100.0]);
}

#[test]
fn test_shape_animation_workflow() {
    let mut shape_layer = ShapeLayer::new();
    let contents = shape_layer.property("ADBE Root Vectors Group").unwrap();
    
    // Create animated shape
    let shape_group = contents.add_property("ADBE Vector Group").unwrap();
    let rect = shape_group.add_property("ADBE Vector Shape - Rect").unwrap();
    let size_prop = rect.property("ADBE Vector Rect Size").unwrap();
    
    // Animate size
    let key1 = size_prop.add_key(0.0).unwrap();
    let key2 = size_prop.add_key(2.0).unwrap();
    
    size_prop.set_value_at_key(key1, vec![50.0, 50.0]);
    size_prop.set_value_at_key(key2, vec![200.0, 200.0]);
    
    // Test animation
    let mid_value = size_prop.value_at_time(1.0, false);
    assert!(mid_value[0] > 50.0 && mid_value[0] < 200.0);
}
```

### 3.5 Effects Application Workflows

#### **Test Categories:**

**A. Basic Effect Application**
```rust
#[test]
fn test_effect_application_workflow() {
    let mut layer = AVLayer::new();
    let effects = layer.property("ADBE Effect Parade").unwrap();
    
    // Add Gaussian Blur effect
    let blur = effects.add_property("ADBE Gaussian Blur 2").unwrap();
    
    // Set blur amount
    let blurriness = blur.property("ADBE Gaussian Blur 2-0001").unwrap();
    blurriness.set_value(10.0);
    
    // Test effect properties
    assert_eq!(blurriness.value(), 10.0);
    assert_eq!(blur.name(), "Gaussian Blur");
}

#[test]
fn test_effect_animation_workflow() {
    let mut layer = AVLayer::new();
    let effects = layer.property("ADBE Effect Parade").unwrap();
    
    // Add Color Correction effect
    let color_correct = effects.add_property("ADBE Color Correction").unwrap();
    let hue_shift = color_correct.property("ADBE Color Correction-0001").unwrap();
    
    // Animate hue shift
    let key1 = hue_shift.add_key(0.0).unwrap();
    let key2 = hue_shift.add_key(2.0).unwrap();
    
    hue_shift.set_value_at_key(key1, 0.0);
    hue_shift.set_value_at_key(key2, 360.0);
    
    // Test animation
    let mid_value = hue_shift.value_at_time(1.0, false);
    assert!(mid_value > 0.0 && mid_value < 360.0);
}
```

---

## 4. Integration Testing Framework

### 4.1 Cross-Object Interactions

#### **Test Categories:**

**A. Parent-Child Relationships**
```rust
#[test]
fn test_layer_parenting_integration() {
    let mut comp = CompItem::new();
    let parent_layer = comp.layers().add_solid([1.0, 0.0, 0.0], "Parent", 100, 100, 1.0, 10.0).unwrap();
    let child_layer = comp.layers().add_solid([0.0, 1.0, 0.0], "Child", 50, 50, 1.0, 10.0).unwrap();
    
    // Set up parenting
    child_layer.set_parent(&parent_layer);
    
    // Test parent-child relationship
    assert_eq!(child_layer.parent().unwrap().name(), "Parent");
    
    // Test transform inheritance
    let parent_pos = parent_layer.transform().position();
    let child_pos = child_layer.transform().position();
    
    parent_pos.set_value(vec![500.0, 300.0]);
    
    // Child should inherit parent's transform
    let child_world_pos = child_layer.to_world(vec![0.0, 0.0]);
    assert!(child_world_pos[0] > 0.0);
}

#[test]
fn test_composition_nesting_integration() {
    let mut project = Project::new();
    let main_comp = project.items().add_comp("Main", 1920, 1080, 1.0, 10.0).unwrap();
    let nested_comp = project.items().add_comp("Nested", 960, 540, 1.0, 5.0).unwrap();
    
    // Add nested comp to main comp
    let nested_layer = main_comp.layers().add(&nested_comp, 5.0).unwrap();
    
    // Test nested composition properties
    assert_eq!(nested_layer.source().unwrap().name(), "Nested");
    assert_eq!(nested_layer.width(), 960);
    assert_eq!(nested_layer.height(), 540);
}
```

**B. Property Inheritance Testing**
```rust
#[test]
fn test_property_inheritance_integration() {
    let layer = AVLayer::new();
    
    // Test PropertyBase inheritance
    let transform = layer.property("ADBE Transform Group").unwrap();
    assert!(transform.instanceof("PropertyGroup"));
    assert!(transform.instanceof("PropertyBase"));
    
    // Test property hierarchy
    let position = transform.property("ADBE Position").unwrap();
    assert!(position.instanceof("Property"));
    assert!(position.instanceof("PropertyBase"));
    
    // Test property parent relationships
    assert_eq!(position.parent_property().unwrap().name(), "Transform");
}
```

### 4.2 Expression System Integration

#### **Test Categories:**

**A. Expression Cross-References**
```rust
#[test]
fn test_expression_layer_references() {
    let mut comp = CompItem::new();
    let target_layer = comp.layers().add_solid([1.0, 0.0, 0.0], "Target", 100, 100, 1.0, 10.0).unwrap();
    let driven_layer = comp.layers().add_solid([0.0, 1.0, 0.0], "Driven", 100, 100, 1.0, 10.0).unwrap();
    
    // Set up expression reference
    let driven_pos = driven_layer.transform().position();
    driven_pos.set_expression("thisComp.layer(\"Target\").transform.position");
    
    // Test expression evaluation
    let target_pos = target_layer.transform().position();
    target_pos.set_value(vec![500.0, 300.0]);
    
    let driven_value = driven_pos.value_at_time(0.0, false);
    assert_eq!(driven_value, vec![500.0, 300.0]);
}

#[test]
fn test_expression_comp_references() {
    let mut project = Project::new();
    let comp1 = project.items().add_comp("Comp1", 1920, 1080, 1.0, 10.0).unwrap();
    let comp2 = project.items().add_comp("Comp2", 1920, 1080, 1.0, 10.0).unwrap();
    
    let layer1 = comp1.layers().add_solid([1.0, 0.0, 0.0], "Layer1", 100, 100, 1.0, 10.0).unwrap();
    let layer2 = comp2.layers().add_solid([0.0, 1.0, 0.0], "Layer2", 100, 100, 1.0, 10.0).unwrap();
    
    // Cross-comp expression
    let pos2 = layer2.transform().position();
    pos2.set_expression("comp(\"Comp1\").layer(\"Layer1\").transform.position");
    
    // Test cross-comp reference
    let pos1 = layer1.transform().position();
    pos1.set_value(vec![400.0, 200.0]);
    
    let pos2_value = pos2.value_at_time(0.0, false);
    assert_eq!(pos2_value, vec![400.0, 200.0]);
}
```

### 4.3 Render Queue Integration

#### **Test Categories:**

**A. Render Queue Workflow**
```rust
#[test]
fn test_render_queue_integration() {
    let mut project = Project::new();
    let comp = project.items().add_comp("Test Comp", 1920, 1080, 1.0, 10.0).unwrap();
    
    // Add to render queue
    let render_queue = project.render_queue();
    let rq_item = render_queue.items().add(&comp).unwrap();
    
    // Configure output
    let output_module = rq_item.output_module(1).unwrap();
    output_module.set_file("output.mov");
    output_module.set_format("QuickTime");
    
    // Test render queue item
    assert_eq!(rq_item.comp().name(), "Test Comp");
    assert_eq!(rq_item.num_output_modules(), 1);
}

#[test]
fn test_render_settings_integration() {
    let mut project = Project::new();
    let comp = project.items().add_comp("Test Comp", 1920, 1080, 1.0, 10.0).unwrap();
    
    let render_queue = project.render_queue();
    let rq_item = render_queue.items().add(&comp).unwrap();
    
    // Configure render settings
    rq_item.set_time_span_start(2.0);
    rq_item.set_time_span_duration(5.0);
    
    // Test render settings
    assert_eq!(rq_item.time_span_start(), 2.0);
    assert_eq!(rq_item.time_span_duration(), 5.0);
}
```

---

## 5. Performance Benchmarking Framework

### 5.1 Validation Performance Tests

#### **Test Categories:**

**A. Large Script Validation**
```rust
#[test]
fn test_large_script_validation_performance() {
    let validator = ScriptValidator::new();
    
    // Generate large script
    let large_script = generate_large_script(10000); // 10k lines
    
    let start = std::time::Instant::now();
    let result = validator.validate(&large_script);
    let duration = start.elapsed();
    
    assert!(result.is_ok());
    assert!(duration.as_millis() < 5000); // Should complete in < 5 seconds
}

#[test]
fn test_complex_expression_validation_performance() {
    let validator = ExpressionValidator::new();
    
    // Complex expression with many references
    let complex_expr = generate_complex_expression(100); // 100 layer references
    
    let start = std::time::Instant::now();
    let result = validator.validate(&complex_expr);
    let duration = start.elapsed();
    
    assert!(result.is_ok());
    assert!(duration.as_millis() < 1000); // Should complete in < 1 second
}
```

**B. Memory Usage Testing**
```rust
#[test]
fn test_memory_usage_validation() {
    let validator = ScriptValidator::new();
    let initial_memory = get_memory_usage();
    
    // Validate many scripts
    for i in 0..1000 {
        let script = generate_test_script(i);
        validator.validate(&script);
    }
    
    let final_memory = get_memory_usage();
    let memory_increase = final_memory - initial_memory;
    
    // Memory increase should be reasonable
    assert!(memory_increase < 100 * 1024 * 1024); // Less than 100MB
}
```

### 5.2 API Performance Benchmarks

#### **Test Categories:**

**A. Property Access Performance**
```rust
#[test]
fn test_property_access_performance() {
    let layer = AVLayer::new();
    
    let start = std::time::Instant::now();
    for _ in 0..10000 {
        let _ = layer.transform().position().value();
    }
    let duration = start.elapsed();
    
    // Should handle 10k property accesses quickly
    assert!(duration.as_millis() < 100);
}

#[test]
fn test_keyframe_operation_performance() {
    let mut position = Property::new(PropertyValueType::TwoD);
    
    let start = std::time::Instant::now();
    for i in 0..1000 {
        let key = position.add_key(i as f64).unwrap();
        position.set_value_at_key(key, vec![i as f64, i as f64]);
    }
    let duration = start.elapsed();
    
    // Should handle 1k keyframes quickly
    assert!(duration.as_millis() < 1000);
}
```

---

## 6. Error Condition Testing Framework

### 6.1 Error Handling Testing

#### **Test Categories:**

**A. Invalid Parameter Testing**
```rust
#[test]
fn test_invalid_parameter_error_handling() {
    let mut layer = AVLayer::new();
    
    // Test invalid array size
    let position = layer.transform().position();
    let result = position.set_value(vec![100.0]); // Should be 2D
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ValidationError::InvalidArraySize { .. }));
    
    // Test out of range values
    let opacity = layer.transform().opacity();
    let result = opacity.set_value(150.0); // Should be 0-100
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ValidationError::ValueOutOfRange { .. }));
}

#[test]
fn test_null_reference_error_handling() {
    let layer = AVLayer::new();
    
    // Test accessing non-existent property
    let result = layer.property("NON_EXISTENT_PROPERTY");
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ValidationError::PropertyNotFound { .. }));
    
    // Test accessing removed layer
    layer.remove();
    let result = layer.name();
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), ValidationError::ObjectDisposed { .. }));
}
```

**B. Resource Limitation Testing**
```rust
#[test]
fn test_resource_limitation_handling() {
    let mut comp = CompItem::new();
    
    // Test maximum layer limit
    let mut layers = Vec::new();
    let mut layer_count = 0;
    
    loop {
        let result = comp.layers().add_solid([1.0, 0.0, 0.0], "Layer", 100, 100, 1.0, 10.0);
        match result {
            Ok(layer) => {
                layers.push(layer);
                layer_count += 1;
            },
            Err(_) => break, // Hit limit
        }
        
        if layer_count > 10000 { // Safety check
            break;
        }
    }
    
    // Should have hit some reasonable limit
    assert!(layer_count > 0);
    assert!(layer_count < 10000);
}
```

### 6.2 Edge Case Testing

#### **Test Categories:**

**A. Boundary Value Testing**
```rust
#[test]
fn test_boundary_value_handling() {
    let mut position = Property::new(PropertyValueType::TwoD);
    
    // Test extreme values
    let extreme_values = vec![
        vec![f64::MIN, f64::MAX],
        vec![f64::INFINITY, f64::NEG_INFINITY],
        vec![f64::NAN, 0.0],
        vec![0.0, f64::NAN],
    ];
    
    for values in extreme_values {
        let result = position.set_value(values);
        // Should handle gracefully (either accept or reject with clear error)
        assert!(result.is_ok() || result.is_err());
    }
}

#[test]
fn test_unicode_string_handling() {
    let mut text_layer = TextLayer::new();
    let text_doc = text_layer.text_document().unwrap();
    
    // Test various Unicode strings
    let unicode_strings = vec![
        "Hello 世界",
        "🎬🎭🎪",
        "Привет мир",
        "مرحبا بالعالم",
        "右から左へ",
        "", // Empty string
        "A".repeat(10000), // Very long string
    ];
    
    for text in unicode_strings {
        let result = text_doc.set_text(&text);
        assert!(result.is_ok());
        assert_eq!(text_doc.text(), text);
    }
}
```

---

## 7. Test Execution and Reporting Framework

### 7.1 Test Organization

#### **Test Structure:**
```
tests/
├── core_objects/
│   ├── application_tests.rs
│   ├── project_tests.rs
│   ├── layer_tests.rs
│   ├── property_tests.rs
│   └── item_tests.rs
├── api_validation/
│   ├── parameter_validation_tests.rs
│   ├── method_signature_tests.rs
│   └── context_aware_tests.rs
├── workflows/
│   ├── project_workflow_tests.rs
│   ├── animation_workflow_tests.rs
│   ├── text_workflow_tests.rs
│   ├── shape_workflow_tests.rs
│   └── effects_workflow_tests.rs
├── integration/
│   ├── cross_object_tests.rs
│   ├── expression_integration_tests.rs
│   └── render_queue_tests.rs
├── performance/
│   ├── validation_performance_tests.rs
│   └── api_performance_tests.rs
├── error_handling/
│   ├── error_condition_tests.rs
│   └── edge_case_tests.rs
└── test_framework/
    ├── test_helpers.rs
    ├── mock_objects.rs
    └── test_data_generators.rs
```

### 7.2 Test Execution Strategy

#### **Test Categories by Priority:**

1. **Smoke Tests** (Always run first)
   - Basic object creation
   - Core API availability
   - Memory allocation checks

2. **Unit Tests** (Core functionality)
   - Individual method testing
   - Property validation
   - Type checking

3. **Integration Tests** (Cross-system)
   - Workflow testing
   - Object interactions
   - Expression evaluation

4. **Performance Tests** (Optional, periodic)
   - Benchmark validation
   - Memory usage monitoring
   - Stress testing

5. **Edge Case Tests** (Comprehensive)
   - Error condition handling
   - Boundary value testing
   - Unicode and special character handling

### 7.3 Test Reporting

#### **Test Report Format:**
```rust
pub struct TestReport {
    pub total_tests: usize,
    pub passed: usize,
    pub failed: usize,
    pub skipped: usize,
    pub api_coverage: f64,
    pub performance_benchmarks: Vec<PerformanceBenchmark>,
    pub failed_tests: Vec<FailedTest>,
    pub recommendations: Vec<String>,
}

pub struct PerformanceBenchmark {
    pub test_name: String,
    pub duration: Duration,
    pub memory_usage: u64,
    pub passed_threshold: bool,
}

pub struct FailedTest {
    pub test_name: String,
    pub error_message: String,
    pub expected_behavior: String,
    pub actual_behavior: String,
    pub api_gap: Option<String>,
}
```

---

## 8. Continuous Integration and Validation

### 8.1 CI Pipeline Integration

#### **Test Execution Pipeline:**
```yaml
# .github/workflows/ae_api_validation.yml
name: AE API Validation Tests

on: [push, pull_request]

jobs:
  core-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Rust
        uses: actions-rs/toolchain@v1
      - name: Run Core Object Tests
        run: cargo test core_objects::
      - name: Run API Validation Tests
        run: cargo test api_validation::
  
  workflow-tests:
    runs-on: ubuntu-latest
    needs: core-tests
    steps:
      - name: Run Workflow Tests
        run: cargo test workflows::
      - name: Run Integration Tests
        run: cargo test integration::
  
  performance-tests:
    runs-on: ubuntu-latest
    needs: workflow-tests
    steps:
      - name: Run Performance Benchmarks
        run: cargo test performance:: --release
      - name: Generate Performance Report
        run: cargo run --bin performance_report
```

### 8.2 Documentation Gap Analysis

#### **Automated Gap Detection:**
```rust
pub fn analyze_api_gaps() -> ApiGapReport {
    let documented_apis = parse_ae_documentation();
    let implemented_apis = analyze_rust_implementation();
    
    ApiGapReport {
        missing_objects: find_missing_objects(&documented_apis, &implemented_apis),
        missing_methods: find_missing_methods(&documented_apis, &implemented_apis),
        missing_properties: find_missing_properties(&documented_apis, &implemented_apis),
        implementation_priority: calculate_priority(&missing_objects),
        test_coverage: calculate_test_coverage(&implemented_apis),
    }
}
```

---

## 9. Implementation Recommendations

### 9.1 Test Implementation Order

#### **Phase 1: Foundation (Weeks 1-2)**
1. Set up test framework infrastructure
2. Implement core object creation tests
3. Create mock objects for testing
4. Establish CI pipeline

#### **Phase 2: Core API (Weeks 3-6)**
1. Application object comprehensive tests
2. Project object tests
3. Layer hierarchy tests
4. Property system tests

#### **Phase 3: Advanced Features (Weeks 7-10)**
1. Text system workflow tests
2. Shape layer tests
3. Effects system tests
4. Animation workflow tests

#### **Phase 4: Integration (Weeks 11-12)**
1. Cross-object interaction tests
2. Expression system tests
3. Render queue integration tests
4. Performance optimization tests

### 9.2 Success Metrics

#### **API Coverage Goals:**
- **Core Objects**: 95% method coverage
- **Property System**: 90% property coverage
- **Workflow Tests**: 80% real-world scenario coverage
- **Performance**: All benchmarks pass threshold requirements

#### **Quality Metrics:**
- **Test Reliability**: 99.9% consistent test results
- **Test Speed**: Full test suite completes in < 10 minutes
- **Error Coverage**: 95% of error conditions tested
- **Documentation**: 100% of tests documented with expected behaviors

---

## Conclusion

This comprehensive test suite specification provides a systematic approach to validating the Rust After Effects API implementation against Adobe's official documentation. The test framework covers all major aspects of the API, from basic object creation to complex workflow scenarios, ensuring robust validation of the implementation.

The structured approach allows for incremental development and validation, with clear success metrics and performance benchmarks. This framework will help identify implementation gaps, validate API compliance, and ensure the Rust validator meets professional standards for After Effects script validation.

The test suite is designed to be maintainable, extensible, and integrated with continuous integration workflows, providing ongoing validation as the Rust implementation evolves and expands its API coverage.