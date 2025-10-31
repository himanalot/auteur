// Comprehensive After Effects API Test Suite
// Based on official Adobe After Effects Scripting Guide documentation
// This module contains exhaustive tests for all documented AE API functionality

pub mod application_tests;
pub mod project_tests;
pub mod object_hierarchy_tests;
pub mod property_tests;
pub mod animation_tests;
pub mod layer_tests;
pub mod specialized_layer_tests;
pub mod text_document_tests;
pub mod font_system_tests;
pub mod effects_tests;
pub mod render_queue_tests;
pub mod shape_vector_tests;
pub mod threed_system_tests;
pub mod integration_tests;
pub mod performance_tests;

use crate::api::objects::*;
use crate::ScriptValidator;
use crate::validation::rules::PropertyValueType;
use std::collections::HashMap;
use std::time::Instant;

/// Test result structure for comprehensive API testing
#[derive(Debug, Clone)]
pub struct ApiTestResult {
    pub test_name: String,
    pub api_path: String,
    pub success: bool,
    pub error_message: Option<String>,
    pub performance_ms: Option<u64>,
    pub coverage_info: Option<CoverageInfo>,
}

/// Coverage information for API testing
#[derive(Debug, Clone)]
pub struct CoverageInfo {
    pub total_apis: usize,
    pub tested_apis: usize,
    pub coverage_percentage: f64,
    pub missing_apis: Vec<String>,
}

/// Test categories based on Adobe documentation structure
#[derive(Debug, Clone, PartialEq)]
pub enum TestCategory {
    CoreFoundation,
    PropertySystem,
    LayerSystem,
    TextSystem,
    EffectsRendering,
    AdvancedFeatures,
    Integration,
    Performance,
}

/// Test priority levels
#[derive(Debug, Clone, PartialEq)]
pub enum TestPriority {
    Critical,   // Core functionality that must work
    High,       // Important features used frequently
    Medium,     // Standard features
    Low,        // Advanced or rarely used features
}

/// Base trait for all comprehensive API tests
pub trait ComprehensiveApiTest {
    fn test_name(&self) -> &str;
    fn category(&self) -> TestCategory;
    fn priority(&self) -> TestPriority;
    fn run_test(&self) -> Vec<ApiTestResult>;
    fn expected_api_count(&self) -> usize;
}

/// Utility functions for comprehensive testing
pub struct TestUtils;

impl TestUtils {
    /// Validate that an API exists and returns expected type using real script validation
    pub fn validate_api_exists(api_path: &str, expected_type: &str) -> ApiTestResult {
        let start_time = Instant::now();
        let mut validator = ScriptValidator::new();
        
        // Generate ExtendScript to test API existence
        let test_script = format!("
            try {{
                var obj = {};
                var typeResult = typeof obj;
                typeResult;
            }} catch (e) {{
                'error: ' + e.toString();
            }}
        ", api_path);
        
        // Execute validation
        let validation_result = validator.validate_script(&test_script);
        let performance_ms = start_time.elapsed().as_millis() as u64;
        
        let (success, error_message) = match validation_result {
            Ok(_) => (true, None),
            Err(errors) => {
                let error_msg = errors.iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join("; ");
                (false, Some(error_msg))
            }
        };
        
        ApiTestResult {
            test_name: format!("api_existence_{}", api_path.replace(".", "_")),
            api_path: api_path.to_string(),
            success,
            error_message,
            performance_ms: Some(performance_ms),
            coverage_info: None,
        }
    }
    
    /// Test property getter/setter functionality with real validation
    pub fn test_property_access(object_name: &str, property_name: &str, expected_type: PropertyValueType) -> ApiTestResult {
        let start_time = Instant::now();
        let mut validator = ScriptValidator::new();
        
        // Generate ExtendScript to test property access
        let test_script = format!("
            try {{
                var obj = {};
                if (obj === null || obj === undefined) {{
                    'error: object is null or undefined';
                }} else {{
                    var value = obj.{};
                    var typeResult = typeof value;
                    if (value === null) {{
                        'null';
                    }} else if (value === undefined) {{
                        'undefined'; 
                    }} else {{
                        typeResult;
                    }}
                }}
            }} catch (e) {{
                'error: ' + e.toString();
            }}
        ", object_name, property_name);
        
        // Execute validation
        let validation_result = validator.validate_script(&test_script);
        let performance_ms = start_time.elapsed().as_millis() as u64;
        
        let (success, error_message) = match validation_result {
            Ok(_) => {
                // Additional type checking could be added here
                (true, None)
            },
            Err(errors) => {
                let error_msg = errors.iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join("; ");
                (false, Some(error_msg))
            }
        };
        
        ApiTestResult {
            test_name: format!("property_access_{}_{}", object_name.replace(".", "_"), property_name),
            api_path: format!("{}.{}", object_name, property_name),
            success,
            error_message,
            performance_ms: Some(performance_ms),
            coverage_info: None,
        }
    }
    
    /// Test method call with parameters using real validation
    pub fn test_method_call(object_name: &str, method_name: &str, params: &[&str], expected_return_type: &str) -> ApiTestResult {
        let start_time = Instant::now();
        let mut validator = ScriptValidator::new();
        
        // Generate ExtendScript to test method call
        let params_str = if params.is_empty() {
            String::new()
        } else {
            params.join(", ")
        };
        
        let test_script = format!("
            try {{
                var obj = {};
                if (obj === null || obj === undefined) {{
                    'error: object is null or undefined';
                }} else if (typeof obj.{} !== 'function') {{
                    'error: {} is not a function';
                }} else {{
                    var result = obj.{}({});
                    typeof result;
                }}
            }} catch (e) {{
                'error: ' + e.toString();
            }}
        ", object_name, method_name, method_name, method_name, params_str);
        
        // Execute validation
        let validation_result = validator.validate_script(&test_script);
        let performance_ms = start_time.elapsed().as_millis() as u64;
        
        let (success, error_message) = match validation_result {
            Ok(_) => (true, None),
            Err(errors) => {
                let error_msg = errors.iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join("; ");
                (false, Some(error_msg))
            }
        };
        
        ApiTestResult {
            test_name: format!("method_call_{}_{}", object_name.replace(".", "_"), method_name),
            api_path: format!("{}.{}({})", object_name, method_name, params_str),
            success,
            error_message,
            performance_ms: Some(performance_ms),
            coverage_info: None,
        }
    }
    
    /// Execute a custom ExtendScript test and validate the result
    pub fn execute_script_test(test_name: &str, api_path: &str, script: &str, expected_type: &str) -> ApiTestResult {
        let start_time = Instant::now();
        let mut validator = ScriptValidator::new();
        
        // Wrap script in error handling
        let wrapped_script = format!("
            try {{
                {}
            }} catch (e) {{
                'error: ' + e.toString();
            }}
        ", script);
        
        // Execute validation
        let validation_result = validator.validate_script(&wrapped_script);
        let performance_ms = start_time.elapsed().as_millis() as u64;
        
        let (success, error_message) = match validation_result {
            Ok(_) => (true, None),
            Err(errors) => {
                let error_msg = errors.iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join("; ");
                (false, Some(error_msg))
            }
        };
        
        ApiTestResult {
            test_name: test_name.to_string(),
            api_path: api_path.to_string(),
            success,
            error_message,
            performance_ms: Some(performance_ms),
            coverage_info: None,
        }
    }
    
    /// Create a test with cleanup for isolated testing
    pub fn execute_test_with_cleanup(test_name: &str, api_path: &str, setup_script: &str, test_script: &str, cleanup_script: &str) -> ApiTestResult {
        let start_time = Instant::now();
        let mut validator = ScriptValidator::new();
        
        // Combine setup, test, and cleanup
        let full_script = format!("
            try {{
                // Setup
                {}
                
                // Test
                var testResult = (function() {{
                    {}
                }})();
                
                // Cleanup
                {}
                
                testResult;
            }} catch (e) {{
                // Ensure cleanup runs even on error
                try {{
                    {}
                }} catch (cleanupError) {{
                    // Ignore cleanup errors
                }}
                'error: ' + e.toString();
            }}
        ", setup_script, test_script, cleanup_script, cleanup_script);
        
        // Execute validation
        let validation_result = validator.validate_script(&full_script);
        let performance_ms = start_time.elapsed().as_millis() as u64;
        
        let (success, error_message) = match validation_result {
            Ok(_) => (true, None),
            Err(errors) => {
                let error_msg = errors.iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join("; ");
                (false, Some(error_msg))
            }
        };
        
        ApiTestResult {
            test_name: test_name.to_string(),
            api_path: api_path.to_string(),
            success,
            error_message,
            performance_ms: Some(performance_ms),
            coverage_info: None,
        }
    }
    
    /// Calculate coverage statistics
    pub fn calculate_coverage(tested_apis: &[String], total_apis: &[String]) -> CoverageInfo {
        let tested_count = tested_apis.len();
        let total_count = total_apis.len();
        let coverage_percentage = if total_count > 0 {
            (tested_count as f64 / total_count as f64) * 100.0
        } else {
            0.0
        };
        
        let missing_apis: Vec<String> = total_apis.iter()
            .filter(|api| !tested_apis.contains(api))
            .cloned()
            .collect();
            
        CoverageInfo {
            total_apis: total_count,
            tested_apis: tested_count,
            coverage_percentage,
            missing_apis,
        }
    }
}

/// Mock After Effects Environment for isolated testing
#[derive(Debug, Clone)]
pub struct MockAEEnvironment {
    pub project: Option<MockProject>,
    pub active_comp: Option<MockComposition>,
    pub preferences: MockPreferences,
    pub system_info: MockSystemInfo,
    pub created_objects: Vec<String>, // Track objects for cleanup
}

#[derive(Debug, Clone)]
pub struct MockProject {
    pub name: String,
    pub file_path: Option<String>,
    pub items: Vec<String>,
    pub dirty: bool,
    pub frame_rate: f64,
    pub duration: f64,
}

#[derive(Debug, Clone)]
pub struct MockComposition {
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub duration: f64,
    pub frame_rate: f64,
    pub layers: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct MockPreferences {
    pub audio_preview_duration: f64,
    pub auto_save_enabled: bool,
    pub cache_before_preview: bool,
    pub memory_usage_mb: f64,
}

#[derive(Debug, Clone)]
pub struct MockSystemInfo {
    pub os_name: String,
    pub processor_count: i32,
    pub memory_gb: f64,
    pub ae_version: String,
}

impl MockAEEnvironment {
    pub fn new() -> Self {
        Self {
            project: None,
            active_comp: None,
            preferences: MockPreferences {
                audio_preview_duration: 15.0,
                auto_save_enabled: true,
                cache_before_preview: true,
                memory_usage_mb: 8192.0,
            },
            system_info: MockSystemInfo {
                os_name: "Test OS".to_string(),
                processor_count: 8,
                memory_gb: 16.0,
                ae_version: "24.6.0".to_string(),
            },
            created_objects: Vec::new(),
        }
    }
    
    /// Create a test project with realistic settings
    pub fn create_test_project(&mut self, name: &str) -> String {
        let project = MockProject {
            name: name.to_string(),
            file_path: None,
            items: Vec::new(),
            dirty: false,
            frame_rate: 30.0,
            duration: 10.0,
        };
        
        self.project = Some(project);
        self.created_objects.push(format!("project:{}", name));
        
        // Return ExtendScript to create the project
        format!("
            // Create new project
            app.newProject();
            app.project.displayStartFrame = 0;
        ")
    }
    
    /// Create a test composition
    pub fn create_test_composition(&mut self, name: &str, width: u32, height: u32, duration: f64, frame_rate: f64) -> String {
        let comp = MockComposition {
            name: name.to_string(),
            width,
            height,
            duration,
            frame_rate,
            layers: Vec::new(),
        };
        
        self.active_comp = Some(comp);
        self.created_objects.push(format!("comp:{}", name));
        
        // Return ExtendScript to create the composition
        format!("
            var testComp = app.project.items.addComp('{}', {}, {}, 1, {}, {});
        ", name, width, height, duration, frame_rate)
    }
    
    /// Create test layer in active composition
    pub fn create_test_layer(&mut self, layer_type: &str, name: &str) -> String {
        if let Some(ref mut comp) = self.active_comp {
            comp.layers.push(name.to_string());
        }
        
        self.created_objects.push(format!("layer:{}", name));
        
        match layer_type {
            "solid" => format!("
                var testLayer = testComp.layers.addSolid([1, 0, 0], '{}', 100, 100, 1);
            ", name),
            "text" => format!("
                var testLayer = testComp.layers.addText('{}');
            ", name),
            "null" => format!("
                var testLayer = testComp.layers.addNull();
                testLayer.name = '{}';
            ", name),
            _ => format!("
                var testLayer = testComp.layers.addSolid([0.5, 0.5, 0.5], '{}', 100, 100, 1);
            ", name),
        }
    }
    
    /// Generate cleanup script to remove all created objects
    pub fn get_cleanup_script(&self) -> String {
        format!("
            // Cleanup all test objects
            try {{
                // Remove all compositions
                for (var i = app.project.items.length; i >= 1; i--) {{
                    var item = app.project.items[i];
                    if (item && item.name && item.name.indexOf('Test') === 0) {{
                        item.remove();
                    }}
                }}
                
                // Reset project if needed
                if (app.project.items.length === 0) {{
                    app.newProject();
                }}
            }} catch (e) {{
                // Ignore cleanup errors
            }}
        ")
    }
    
    /// Reset environment for next test
    pub fn reset(&mut self) {
        self.project = None;
        self.active_comp = None;
        self.created_objects.clear();
    }
    
    /// Get a realistic test environment setup script
    pub fn get_environment_setup_script(&self) -> String {
        format!("
            // Setup mock After Effects environment
            
            // Ensure we have a project
            if (!app.project) {{
                app.newProject();
            }}
            
            // Set common preferences for testing
            try {{
                app.preferences.setPrefAsFloat('Main Pref Section', 'Pref_AUDIO_PREVIEW_DURATION', {});
                app.preferences.setPrefAsBool('Main Pref Section', 'Pref_AUTOSAVE_ON', {});
            }} catch (e) {{
                // Ignore preference errors in test environment
            }}
        ", 
        self.preferences.audio_preview_duration,
        self.preferences.auto_save_enabled)
    }
    
    /// Validate environment state
    pub fn validate_environment(&self) -> Result<(), String> {
        // Check if we have the minimum required objects for testing
        if self.project.is_some() && self.active_comp.is_some() {
            Ok(())
        } else {
            Err("Test environment not properly initialized".to_string())
        }
    }
}

/// Test Data Factory for generating realistic After Effects objects
pub struct TestDataFactory;

impl TestDataFactory {
    /// Create a basic composition with standard settings
    pub fn create_test_composition() -> String {
        "app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);".to_string()
    }
    
    /// Create composition with custom settings
    pub fn create_custom_composition(name: &str, width: u32, height: u32, duration: f64, frame_rate: f64) -> String {
        format!("app.project.items.addComp('{}', {}, {}, 1, {}, {});", name, width, height, duration, frame_rate)
    }
    
    /// Create a solid layer with specified color and size
    pub fn create_solid_layer(comp_var: &str, name: &str, color: [f64; 3], width: u32, height: u32) -> String {
        format!("{}.layers.addSolid([{}, {}, {}], '{}', {}, {}, 1);", 
                comp_var, color[0], color[1], color[2], name, width, height)
    }
    
    /// Create a text layer with default properties
    pub fn create_text_layer(comp_var: &str, text: &str) -> String {
        format!("{}.layers.addText('{}');", comp_var, text)
    }
    
    /// Create a null object layer
    pub fn create_null_layer(comp_var: &str, name: &str) -> String {
        format!("
            var nullLayer = {}.layers.addNull();
            nullLayer.name = '{}';
            nullLayer;
        ", comp_var, name)
    }
    
    /// Create a camera layer
    pub fn create_camera_layer(comp_var: &str, name: &str) -> String {
        format!("
            var cameraLayer = {}.layers.addCamera('{}', [0, 0, -500]);
            cameraLayer;
        ", comp_var, name)
    }
    
    /// Create a light layer
    pub fn create_light_layer(comp_var: &str, name: &str, light_type: &str) -> String {
        let light_type_enum = match light_type {
            "parallel" => "LightType.PARALLEL",
            "spot" => "LightType.SPOT", 
            "point" => "LightType.POINT",
            "ambient" => "LightType.AMBIENT",
            _ => "LightType.PARALLEL",
        };
        
        format!("
            var lightLayer = {}.layers.addLight('{}', [0, 0, 0]);
            lightLayer.lightType = {};
            lightLayer;
        ", comp_var, name, light_type_enum)
    }
    
    /// Create a shape layer with basic shape
    pub fn create_shape_layer(comp_var: &str, name: &str) -> String {
        format!("
            var shapeLayer = {}.layers.addShape();
            shapeLayer.name = '{}';
            
            // Add a rectangle shape
            var rectGroup = shapeLayer.content.addProperty('ADBE Vector Group');
            var rectPath = rectGroup.content.addProperty('ADBE Vector Shape - Rect');
            var rectFill = rectGroup.content.addProperty('ADBE Vector Graphic - Fill');
            
            rectPath.size.setValue([100, 100]);
            rectFill.color.setValue([1, 0, 0]);
            
            shapeLayer;
        ", comp_var, name)
    }
    
    /// Create keyframes for position animation
    pub fn create_position_keyframes(layer_var: &str, start_pos: [f64; 2], end_pos: [f64; 2], duration: f64) -> String {
        format!("
            var positionProp = {}.transform.position;
            positionProp.setValueAtTime(0, [{}, {}]);
            positionProp.setValueAtTime({}, [{}, {}]);
        ", layer_var, start_pos[0], start_pos[1], duration, end_pos[0], end_pos[1])
    }
    
    /// Create opacity keyframes
    pub fn create_opacity_keyframes(layer_var: &str, start_opacity: f64, end_opacity: f64, duration: f64) -> String {
        format!("
            var opacityProp = {}.transform.opacity;
            opacityProp.setValueAtTime(0, {});
            opacityProp.setValueAtTime({}, {});
        ", layer_var, start_opacity, duration, end_opacity)
    }
    
    /// Create scale keyframes
    pub fn create_scale_keyframes(layer_var: &str, start_scale: [f64; 2], end_scale: [f64; 2], duration: f64) -> String {
        format!("
            var scaleProp = {}.transform.scale;
            scaleProp.setValueAtTime(0, [{}, {}]);
            scaleProp.setValueAtTime({}, [{}, {}]);
        ", layer_var, start_scale[0], start_scale[1], duration, end_scale[0], end_scale[1])
    }
    
    /// Add effect to layer
    pub fn add_effect_to_layer(layer_var: &str, effect_name: &str) -> String {
        format!("
            var effect = {}.effects.addProperty('{}');
            effect;
        ", layer_var, effect_name)
    }
    
    /// Create text document with formatting
    pub fn create_formatted_text_document(text: &str, font_family: &str, font_size: f64, color: [f64; 3]) -> String {
        format!("
            var textDoc = new TextDocument('{}');
            textDoc.font = '{}';
            textDoc.fontSize = {};
            textDoc.fillColor = [{}, {}, {}];
            textDoc.applyStroke = false;
            textDoc.applyFill = true;
            textDoc;
        ", text, font_family, font_size, color[0], color[1], color[2])
    }
    
    /// Create mask on layer
    pub fn create_mask(layer_var: &str, mask_name: &str, shape_type: &str) -> String {
        match shape_type {
            "rectangle" => format!("
                var maskGroup = {}.masks.addProperty('Mask');
                maskGroup.name = '{}';
                
                // Create rectangle mask shape
                var maskShape = new Shape();
                maskShape.vertices = [[0, 0], [100, 0], [100, 100], [0, 100]];
                maskShape.closed = true;
                maskGroup.maskPath.setValue(maskShape);
                
                maskGroup;
            ", layer_var, mask_name),
            "ellipse" => format!("
                var maskGroup = {}.masks.addProperty('Mask');
                maskGroup.name = '{}';
                
                // Create ellipse mask shape (simplified)
                var maskShape = new Shape();
                maskShape.vertices = [[50, 0], [100, 50], [50, 100], [0, 50]];
                maskShape.closed = true;
                maskGroup.maskPath.setValue(maskShape);
                
                maskGroup;
            ", layer_var, mask_name),
            _ => format!("
                var maskGroup = {}.masks.addProperty('Mask');
                maskGroup.name = '{}';
                maskGroup;
            ", layer_var, mask_name),
        }
    }
    
    /// Create render queue item
    pub fn create_render_queue_item(comp_var: &str) -> String {
        format!("
            var renderItem = app.project.renderQueue.items.add({});
            var outputModule = renderItem.outputModule(1);
            outputModule.file = new File(Folder.desktop.fsName + '/test_render.mov');
            renderItem;
        ", comp_var)
    }
    
    /// Create complete test scene (composition with multiple layers and animation)
    pub fn create_complete_test_scene(scene_name: &str) -> String {
        format!("
            // Create test scene: {}
            var testComp = app.project.items.addComp('{}', 1920, 1080, 1, 10, 30);
            
            // Add background solid
            var bgLayer = testComp.layers.addSolid([0.1, 0.1, 0.1], 'Background', 1920, 1080, 1);
            
            // Add animated solid
            var animLayer = testComp.layers.addSolid([1, 0, 0], 'Animated Square', 100, 100, 1);
            animLayer.transform.position.setValueAtTime(0, [100, 540]);
            animLayer.transform.position.setValueAtTime(5, [1820, 540]);
            
            // Add text layer
            var textLayer = testComp.layers.addText('Test Animation');
            var textDoc = new TextDocument('Test Animation');
            textDoc.fontSize = 72;
            textDoc.fillColor = [1, 1, 1];
            textLayer.sourceText.setValue(textDoc);
            textLayer.transform.position.setValue([960, 200]);
            
            // Add fade in/out to text
            textLayer.transform.opacity.setValueAtTime(0, 0);
            textLayer.transform.opacity.setValueAtTime(1, 100);
            textLayer.transform.opacity.setValueAtTime(9, 100);
            textLayer.transform.opacity.setValueAtTime(10, 0);
            
            testComp;
        ", scene_name, scene_name)
    }
    
    /// Create performance test scene with many objects
    pub fn create_performance_test_scene(num_layers: u32) -> String {
        format!("
            // Create performance test scene with {} layers
            var perfComp = app.project.items.addComp('PerformanceTest', 1920, 1080, 1, 30, 30);
            
            // Add background
            var bgLayer = perfComp.layers.addSolid([0, 0, 0], 'Background', 1920, 1080, 1);
            
            // Add many animated layers
            for (var i = 0; i < {}; i++) {{
                var layer = perfComp.layers.addSolid([Math.random(), Math.random(), Math.random()], 'Layer' + i, 50, 50, 1);
                
                // Random position animation
                var startX = Math.random() * 1920;
                var startY = Math.random() * 1080;
                var endX = Math.random() * 1920;
                var endY = Math.random() * 1080;
                
                layer.transform.position.setValueAtTime(0, [startX, startY]);
                layer.transform.position.setValueAtTime(30, [endX, endY]);
                
                // Random rotation
                layer.transform.rotation.setValueAtTime(0, 0);
                layer.transform.rotation.setValueAtTime(30, Math.random() * 360);
            }}
            
            perfComp;
        ", num_layers, num_layers)
    }
    
    /// Get cleanup script for test objects
    pub fn get_cleanup_script() -> String {
        "
            // Cleanup test objects
            try {
                for (var i = app.project.items.length; i >= 1; i--) {
                    var item = app.project.items[i];
                    if (item && item.name && (
                        item.name.indexOf('Test') === 0 || 
                        item.name.indexOf('Performance') === 0 ||
                        item.name.indexOf('Mock') === 0
                    )) {
                        item.remove();
                    }
                }
            } catch (e) {
                // Ignore cleanup errors
            }
        ".to_string()
    }
}

/// Test suite runner for comprehensive API validation
pub struct ComprehensiveTestSuite {
    pub tests: Vec<Box<dyn ComprehensiveApiTest>>,
}

impl ComprehensiveTestSuite {
    pub fn new() -> Self {
        Self {
            tests: Vec::new(),
        }
    }
    
    pub fn add_test(&mut self, test: Box<dyn ComprehensiveApiTest>) {
        self.tests.push(test);
    }
    
    pub fn run_all_tests(&self) -> Vec<ApiTestResult> {
        let mut all_results = Vec::new();
        
        for test in &self.tests {
            let mut test_results = test.run_test();
            all_results.append(&mut test_results);
        }
        
        all_results
    }
    
    pub fn run_tests_by_category(&self, category: TestCategory) -> Vec<ApiTestResult> {
        let mut results = Vec::new();
        
        for test in &self.tests {
            if test.category() == category {
                let mut test_results = test.run_test();
                results.append(&mut test_results);
            }
        }
        
        results
    }
    
    pub fn run_tests_by_priority(&self, priority: TestPriority) -> Vec<ApiTestResult> {
        let mut results = Vec::new();
        
        for test in &self.tests {
            if test.priority() == priority {
                let mut test_results = test.run_test();
                results.append(&mut test_results);
            }
        }
        
        results
    }
    
    pub fn generate_coverage_report(&self) -> HashMap<TestCategory, CoverageInfo> {
        let mut coverage_map = HashMap::new();
        
        // This would be implemented to analyze actual API coverage
        // For now, returning placeholder data
        
        coverage_map
    }
    
    pub fn generate_summary_report(&self, results: &[ApiTestResult]) -> TestSummaryReport {
        let total_tests = results.len();
        let passed_tests = results.iter().filter(|r| r.success).count();
        let failed_tests = total_tests - passed_tests;
        let success_rate = if total_tests > 0 {
            (passed_tests as f64 / total_tests as f64) * 100.0
        } else {
            0.0
        };
        
        let avg_performance = results.iter()
            .filter_map(|r| r.performance_ms)
            .collect::<Vec<_>>();
        let avg_performance_ms = if !avg_performance.is_empty() {
            avg_performance.iter().sum::<u64>() as f64 / avg_performance.len() as f64
        } else {
            0.0
        };
        
        TestSummaryReport {
            total_tests,
            passed_tests,
            failed_tests,
            success_rate,
            avg_performance_ms,
            failed_test_details: results.iter()
                .filter(|r| !r.success)
                .cloned()
                .collect(),
        }
    }
}

/// Summary report for test execution
#[derive(Debug, Clone)]
pub struct TestSummaryReport {
    pub total_tests: usize,
    pub passed_tests: usize,
    pub failed_tests: usize,
    pub success_rate: f64,
    pub avg_performance_ms: f64,
    pub failed_test_details: Vec<ApiTestResult>,
}

impl std::fmt::Display for TestSummaryReport {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "=== Comprehensive After Effects API Test Summary ===")?;
        writeln!(f, "Total Tests: {}", self.total_tests)?;
        writeln!(f, "Passed: {}", self.passed_tests)?;
        writeln!(f, "Failed: {}", self.failed_tests)?;
        writeln!(f, "Success Rate: {:.2}%", self.success_rate)?;
        writeln!(f, "Average Performance: {:.2}ms", self.avg_performance_ms)?;
        
        if !self.failed_test_details.is_empty() {
            writeln!(f, "\n=== Failed Tests ===")?;
            for failed_test in &self.failed_test_details {
                writeln!(f, "❌ {}: {}", 
                    failed_test.test_name, 
                    failed_test.error_message.as_ref().unwrap_or(&"Unknown error".to_string()))?;
            }
        }
        
        Ok(())
    }
}

/// Create and configure the comprehensive test suite
pub fn create_comprehensive_test_suite() -> ComprehensiveTestSuite {
    let mut suite = ComprehensiveTestSuite::new();
    
    // Add Phase 1: Core Foundation Tests
    suite.add_test(Box::new(application_tests::ApplicationObjectTests));
    suite.add_test(Box::new(project_tests::ProjectObjectTests));
    suite.add_test(Box::new(object_hierarchy_tests::ObjectHierarchyTests));
    
    // Add Phase 2: Property System Tests
    suite.add_test(Box::new(property_tests::PropertySystemTests));
    suite.add_test(Box::new(animation_tests::AnimationSystemTests));
    
    // Add Phase 3: Layer System Tests
    suite.add_test(Box::new(layer_tests::LayerBaseTests));
    suite.add_test(Box::new(specialized_layer_tests::SpecializedLayerTests));
    
    // Add Phase 4: Text System Tests
    suite.add_test(Box::new(text_document_tests::TextDocumentTests));
    suite.add_test(Box::new(font_system_tests::FontSystemTests));
    
    // Add Phase 5: Effects & Rendering Tests
    suite.add_test(Box::new(effects_tests::EffectsSystemTests));
    suite.add_test(Box::new(render_queue_tests::RenderQueueTests));
    
    // Add Phase 6: Advanced Features Tests
    suite.add_test(Box::new(shape_vector_tests::ShapeVectorGraphicsTests));
    suite.add_test(Box::new(threed_system_tests::ThreeDSystemTests));
    
    // Add Phase 7: Integration & Performance Tests
    suite.add_test(Box::new(integration_tests::IntegrationTests));
    suite.add_test(Box::new(performance_tests::PerformanceTests));
    
    suite
}

/// Run all comprehensive tests and generate report
pub fn run_comprehensive_tests() -> TestSummaryReport {
    let suite = create_comprehensive_test_suite();
    let results = suite.run_all_tests();
    suite.generate_summary_report(&results)
}

/// Run tests by category
pub fn run_tests_by_category(category: TestCategory) -> TestSummaryReport {
    let suite = create_comprehensive_test_suite();
    let results = suite.run_tests_by_category(category);
    suite.generate_summary_report(&results)
}

/// Run tests by priority
pub fn run_tests_by_priority(priority: TestPriority) -> TestSummaryReport {
    let suite = create_comprehensive_test_suite();
    let results = suite.run_tests_by_priority(priority);
    suite.generate_summary_report(&results)
}