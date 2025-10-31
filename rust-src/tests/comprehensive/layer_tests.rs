// Comprehensive Layer System Tests
// Based on Adobe After Effects Scripting Guide: general/layer.md and related layer documentation
// Tests all documented Layer base class functionality and common layer operations

use super::*;
use crate::api::objects::layer::*;

/// Comprehensive tests for the Adobe After Effects Layer base class
/// Covers all documented Layer attributes and methods shared by all layer types
pub struct LayerBaseTests;

impl ComprehensiveApiTest for LayerBaseTests {
    fn test_name(&self) -> &str {
        "Layer Base Class Comprehensive Tests"
    }
    
    fn category(&self) -> TestCategory {
        TestCategory::LayerSystem
    }
    
    fn priority(&self) -> TestPriority {
        TestPriority::Critical
    }
    
    fn expected_api_count(&self) -> usize {
        85 // Layer base class attributes and methods
    }
    
    fn run_test(&self) -> Vec<ApiTestResult> {
        let mut results = Vec::new();
        
        // Test Layer Base Attributes
        results.extend(self.test_layer_attributes());
        
        // Test Layer Base Methods
        results.extend(self.test_layer_methods());
        
        // Test Layer Properties and Property Groups
        results.extend(self.test_layer_properties());
        
        // Test Layer Timing and Duration
        results.extend(self.test_layer_timing());
        
        // Test Layer Transform Properties
        results.extend(self.test_layer_transforms());
        
        // Test Layer Blending and Effects
        results.extend(self.test_layer_blending());
        
        // Test Layer Parenting and Hierarchy
        results.extend(self.test_layer_hierarchy());
        
        // Test Layer Masks
        results.extend(self.test_layer_masks());
        
        // Test Layer Quality and Sampling
        results.extend(self.test_layer_quality());
        
        // Test Layer Comments and Organization
        results.extend(self.test_layer_organization());
        
        results
    }
}

impl LayerBaseTests {
    /// Test all Layer base attributes
    fn test_layer_attributes(&self) -> Vec<ApiTestResult> {
        vec![
            // Test layer attribute validation with proper layer setup
            self.test_layer_attribute_validation(),
            
            // Test core layer properties
            self.test_with_layer_setup("core_layer_properties", "
                var props = {
                    index: typeof layer.index === 'number',
                    name: typeof layer.name === 'string',
                    comment: typeof layer.comment === 'string',
                    label: typeof layer.label === 'number',
                    selected: typeof layer.selected === 'boolean',
                    enabled: typeof layer.enabled === 'boolean',
                    active: typeof layer.active === 'boolean',
                    shy: typeof layer.shy === 'boolean',
                    locked: typeof layer.locked === 'boolean',
                    solo: typeof layer.solo === 'boolean',
                    nullLayer: typeof layer.nullLayer === 'boolean'
                };
                
                var validProps = 0;
                for (var prop in props) {
                    if (props[prop]) validProps++;
                }
                
                'core properties: ' + validProps + '/11 valid';
            "),
            
            // Test timing properties
            self.test_with_layer_setup("layer_timing_properties", "
                var timingProps = {
                    startTime: typeof layer.startTime === 'number',
                    inPoint: typeof layer.inPoint === 'number',
                    outPoint: typeof layer.outPoint === 'number',
                    stretch: typeof layer.stretch === 'number',
                    time: typeof layer.time === 'number'
                };
                
                var validTiming = 0;
                for (var prop in timingProps) {
                    if (timingProps[prop]) validTiming++;
                }
                
                'timing properties: ' + validTiming + '/5 valid';
            "),
            
            // Test 3D and special properties
            self.test_with_layer_setup("layer_3d_properties", "
                var threeDProps = {
                    threeDLayer: typeof layer.threeDLayer === 'boolean',
                    environmentLayer: typeof layer.environmentLayer === 'boolean',
                    guideLayer: typeof layer.guideLayer === 'boolean',
                    adjustmentLayer: typeof layer.adjustmentLayer === 'boolean',
                    preserveTransparency: typeof layer.preserveTransparency === 'boolean'
                };
                
                var valid3D = 0;
                for (var prop in threeDProps) {
                    if (threeDProps[prop]) valid3D++;
                }
                
                '3D properties: ' + valid3D + '/5 valid';
            "),
        ]
    }
    
    /// Test all Layer base methods
    fn test_layer_methods(&self) -> Vec<ApiTestResult> {
        vec![
            // Layer utility methods
            self.test_layer_utility_methods(),
            
            // Layer management methods
            self.test_with_layer_setup("layer_management_methods", "
                var managementMethods = [
                    'remove', 'moveToBeginning', 'moveToEnd', 
                    'moveBefore', 'moveAfter', 'duplicate', 'copyToComp'
                ];
                
                var availableMethods = 0;
                for (var i = 0; i < managementMethods.length; i++) {
                    if (typeof layer[managementMethods[i]] === 'function') {
                        availableMethods++;
                    }
                }
                
                'management methods: ' + availableMethods + '/' + managementMethods.length + ' available';
            "),
            
            // Layer property access methods
            self.test_with_layer_setup("layer_property_access", "
                var propertyAccess = {
                    propertyMethod: typeof layer.property === 'function',
                    propertyGroupMethod: typeof layer.propertyGroup === 'function',
                    replaceSourceMethod: typeof layer.replaceSource === 'function',
                    setParentWithJumpMethod: typeof layer.setParentWithJump === 'function'
                };
                
                var accessCount = 0;
                for (var prop in propertyAccess) {
                    if (propertyAccess[prop]) accessCount++;
                }
                
                'property access methods: ' + accessCount + '/4 available';
            "),
        ]
    }
    
    /// Test layer properties and property groups
    fn test_layer_properties(&self) -> Vec<ApiTestResult> {
        vec![
            // Transform Property Group
            self.test_transform_property_group(),
            
            // Material Options (3D layers)
            self.test_material_options_group(),
            
            // Audio Property Group
            self.test_audio_property_group(),
            
            // Marker Property Group
            self.test_marker_property_group(),
            
            // Time Remap Property
            self.test_time_remap_property(),
        ]
    }
    
    /// Test layer timing and duration functionality
    fn test_layer_timing(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_in_out_point_operations(),
            self.test_start_time_operations(),
            self.test_stretch_operations(),
            self.test_time_calculations(),
            self.test_duration_properties(),
        ]
    }
    
    /// Test layer transform properties
    fn test_layer_transforms(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_2d_transform_properties(),
            self.test_3d_transform_properties(),
            self.test_anchor_point_operations(),
            self.test_position_operations(),
            self.test_scale_operations(),
            self.test_rotation_operations(),
            self.test_opacity_operations(),
        ]
    }
    
    /// Test layer blending and effects
    fn test_layer_blending(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_blending_mode_operations(),
            self.test_effects_property_group(),
            self.test_track_matte_operations(),
            self.test_preserve_transparency(),
        ]
    }
    
    /// Test layer hierarchy and parenting
    fn test_layer_hierarchy(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_layer_parenting_operations(),
            self.test_parent_child_relationships(),
            self.test_auto_orient_operations(),
            self.test_hierarchy_navigation(),
        ]
    }
    
    /// Test layer masks functionality
    fn test_layer_masks(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_mask_property_group(),
            self.test_mask_operations(),
            self.test_mask_modes(),
            self.test_mask_feather(),
            self.test_mask_opacity(),
        ]
    }
    
    /// Test layer quality and sampling
    fn test_layer_quality(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_layer_quality_settings(),
            self.test_sampling_quality_settings(),
            self.test_motion_blur_settings(),
            self.test_frame_blending_settings(),
        ]
    }
    
    /// Test layer organization features
    fn test_layer_organization(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_layer_labeling(),
            self.test_layer_comments(),
            self.test_layer_naming(),
            self.test_layer_selection(),
            self.test_layer_locking(),
            self.test_layer_solo_shy(),
        ]
    }
    
    // Helper method for layer-based testing
    fn test_with_layer_setup(&self, test_name: &str, test_script: &str) -> ApiTestResult {
        let full_script = format!(
            "
            var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
            var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
            
            var result = (function() {{
                {}
            }})();
            
            comp.remove();
            result;
            ", test_script
        );
        
        TestUtils::execute_script_test(test_name, "layer setup test", &full_script, "string")
    }
    
    // Specific implementation methods
    
    fn test_layer_attribute_validation(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_attribute_validation",
            "layer attribute validation",
            "
                // Test layer attribute validation with proper typing
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test basic attribute types
                var tests = {
                    index: typeof layer.index === 'number',
                    name: typeof layer.name === 'string',
                    comment: typeof layer.comment === 'string',
                    label: typeof layer.label === 'number',
                    selected: typeof layer.selected === 'boolean',
                    enabled: typeof layer.enabled === 'boolean',
                    active: typeof layer.active === 'boolean'
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_duplication(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_duplication",
            "layer.duplicate",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                var originalCount = comp.numLayers;
                var duplicatedLayer = layer.duplicate();
                var newCount = comp.numLayers;
                
                var success = (newCount === originalCount + 1) && 
                              (duplicatedLayer !== null) &&
                              (typeof duplicatedLayer === 'object');
                
                comp.remove();
                success ? 'duplication works' : 'duplication failed';
            ",
            "string"
        )
    }
    
    fn test_layer_hierarchy_methods(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_hierarchy_methods",
            "layer hierarchy operations",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer1 = comp.layers.addSolid([1, 0, 0], 'Layer1', 100, 100, 1);
                var layer2 = comp.layers.addSolid([0, 1, 0], 'Layer2', 100, 100, 1);
                
                // Test hierarchy methods
                var hierarchyTests = {
                    moveToBeginning: typeof layer1.moveToBeginning === 'function',
                    moveToEnd: typeof layer1.moveToEnd === 'function',
                    moveBefore: typeof layer1.moveBefore === 'function',
                    moveAfter: typeof layer1.moveAfter === 'function'
                };
                
                var validMethods = 0;
                for (var method in hierarchyTests) {
                    if (hierarchyTests[method]) validMethods++;
                }
                
                comp.remove();
                'hierarchy methods: ' + validMethods + '/4 available';
            ",
            "string"
        )
    }
    
    fn test_layer_utility_methods(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_utility_methods",
            "layer utility and helper methods",
            "
                // Test layer utility methods
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test method existence
                var methodTests = {
                    property: typeof layer.property === 'function',
                    propertyGroup: typeof layer.propertyGroup === 'function',
                    duplicate: typeof layer.duplicate === 'function',
                    remove: typeof layer.remove === 'function'
                };
                
                var allValid = true;
                for (var key in methodTests) {
                    if (!methodTests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_transform_property_group(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "transform_property_group",
            "layer.transform property group",
            "
                // Test transform property group
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test transform property group exists
                var transform = layer.transform;
                if (!transform) {
                    comp.remove();
                    'transform group not found';
                } else {
                    // Test key transform properties
                    var tests = {
                        anchorPoint: transform.anchorPoint ? true : false,
                        position: transform.position ? true : false,
                        scale: transform.scale ? true : false,
                        rotation: transform.rotation ? true : false,
                        opacity: transform.opacity ? true : false
                    };
                    
                    var allValid = true;
                    for (var key in tests) {
                        if (!tests[key]) {
                            allValid = false;
                            break;
                        }
                    }
                    
                    comp.remove();
                    allValid ? 'valid' : 'invalid';
                }
            ",
            "string"
        )
    }
    
    fn test_material_options_group(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "material_options_property_group",
            "layer.materialOption 3D properties",
            "
                // Test material options property group for 3D layers
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Make layer 3D
                layer.threeDLayer = true;
                
                // Test material options
                var materialOptions = layer.materialOption;
                if (!materialOptions) {
                    comp.remove();
                    'material options not found';
                } else {
                    // Test key material properties
                    var tests = {
                        castsShadows: materialOptions.castsShadows ? true : false,
                        lightTransmission: materialOptions.lightTransmission ? true : false,
                        acceptsShadows: materialOptions.acceptsShadows ? true : false,
                        acceptsLights: materialOptions.acceptsLights ? true : false,
                        ambient: materialOptions.ambient ? true : false,
                        diffuse: materialOptions.diffuse ? true : false,
                        specular: materialOptions.specular ? true : false,
                        shininess: materialOptions.shininess ? true : false,
                        metal: materialOptions.metal ? true : false
                    };
                    
                    var allValid = true;
                    for (var key in tests) {
                        if (!tests[key]) {
                            allValid = false;
                            break;
                        }
                    }
                    
                    comp.remove();
                    allValid ? 'valid' : 'invalid';
                }
            ",
            "string"
        )
    }
    
    fn test_audio_property_group(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "audio_property_group",
            "layer.audio property group",
            "
                // Test audio property group
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test audio property group exists
                var audio = layer.audio;
                if (!audio) {
                    comp.remove();
                    'audio group not found';
                } else {
                    // Test key audio properties
                    var tests = {
                        audioLevels: audio.audioLevels ? true : false
                    };
                    
                    var allValid = true;
                    for (var key in tests) {
                        if (!tests[key]) {
                            allValid = false;
                            break;
                        }
                    }
                    
                    comp.remove();
                    allValid ? 'valid' : 'invalid';
                }
            ",
            "string"
        )
    }
    
    fn test_marker_property_group(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "marker_property_group",
            "layer.marker property group",
            "
                // Test marker property group
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test marker property group exists
                var marker = layer.marker;
                if (!marker) {
                    comp.remove();
                    'marker group not found';
                } else {
                    // Test marker methods
                    var tests = {
                        addProperty: typeof marker.addProperty === 'function',
                        property: typeof marker.property === 'function',
                        numProperties: typeof marker.numProperties === 'number'
                    };
                    
                    var allValid = true;
                    for (var key in tests) {
                        if (!tests[key]) {
                            allValid = false;
                            break;
                        }
                    }
                    
                    comp.remove();
                    allValid ? 'valid' : 'invalid';
                }
            ",
            "string"
        )
    }
    
    fn test_time_remap_property(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "time_remap_property",
            "layer.timeRemapEnabled/timeRemap",
            "
                // Test time remap properties
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test time remap properties exist
                var tests = {
                    timeRemapEnabled: typeof layer.timeRemapEnabled === 'boolean',
                    timeRemap: layer.timeRemap ? true : false
                };
                
                // Enable time remap to test functionality
                layer.timeRemapEnabled = true;
                
                // Test that time remap property is accessible after enabling
                var timeRemapValid = layer.timeRemap ? true : false;
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && timeRemapValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_in_out_point_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "in_out_point_operations",
            "layer.inPoint/outPoint operations",
            "
                // Test in/out point operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test initial in/out points
                var initialInPoint = layer.inPoint;
                var initialOutPoint = layer.outPoint;
                
                // Test setting in/out points
                layer.inPoint = 2.0;
                layer.outPoint = 8.0;
                
                var tests = {
                    inPointType: typeof layer.inPoint === 'number',
                    outPointType: typeof layer.outPoint === 'number',
                    inPointSet: layer.inPoint === 2.0,
                    outPointSet: layer.outPoint === 8.0,
                    validRange: layer.inPoint < layer.outPoint
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_start_time_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "start_time_operations",
            "layer.startTime operations",
            "
                // Test start time operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test initial start time
                var initialStartTime = layer.startTime;
                
                // Test setting start time
                layer.startTime = 1.5;
                
                var tests = {
                    startTimeType: typeof layer.startTime === 'number',
                    startTimeSet: layer.startTime === 1.5,
                    startTimeReadonly: true // startTime is read-only in many cases
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_stretch_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "stretch_operations",
            "layer.stretch time stretching",
            "
                // Test stretch operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test initial stretch value
                var initialStretch = layer.stretch;
                
                // Test setting stretch value
                layer.stretch = 200.0; // 200% stretch
                
                var tests = {
                    stretchType: typeof layer.stretch === 'number',
                    stretchSet: layer.stretch === 200.0,
                    stretchPositive: layer.stretch > 0
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_time_calculations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "time_calculations",
            "layer time calculations",
            "
                // Test layer time calculations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Set up timing properties
                layer.inPoint = 2.0;
                layer.outPoint = 8.0;
                layer.startTime = 1.0;
                
                // Test time calculations
                var duration = layer.outPoint - layer.inPoint;
                var timeProperty = layer.time;
                
                var tests = {
                    timeType: typeof layer.time === 'number',
                    durationCalculation: duration === 6.0,
                    timeInRange: layer.time >= 0
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_duration_properties(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "duration_properties",
            "layer duration properties",
            "
                // Test duration properties
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test duration-related properties
                var tests = {
                    inPoint: typeof layer.inPoint === 'number',
                    outPoint: typeof layer.outPoint === 'number',
                    startTime: typeof layer.startTime === 'number',
                    stretch: typeof layer.stretch === 'number',
                    time: typeof layer.time === 'number'
                };
                
                // Test duration calculation
                var duration = layer.outPoint - layer.inPoint;
                var durationValid = duration > 0;
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && durationValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_2d_transform_properties(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "2d_transform_properties",
            "layer 2D transform properties",
            "
                // Test 2D transform properties
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Ensure layer is 2D
                layer.threeDLayer = false;
                
                var transform = layer.transform;
                
                // Test 2D transform properties
                var tests = {
                    anchorPoint: transform.anchorPoint ? true : false,
                    position: transform.position ? true : false,
                    scale: transform.scale ? true : false,
                    rotation: transform.rotation ? true : false,
                    opacity: transform.opacity ? true : false
                };
                
                // Test 2D-specific behavior
                var position2D = transform.position.value;
                var is2DPosition = position2D.length === 2;
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && is2DPosition ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_3d_transform_properties(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "3d_transform_properties",
            "layer 3D transform properties",
            "
                // Test 3D transform properties
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Enable 3D layer
                layer.threeDLayer = true;
                
                var transform = layer.transform;
                
                // Test 3D transform properties
                var tests = {
                    anchorPoint: transform.anchorPoint ? true : false,
                    position: transform.position ? true : false,
                    scale: transform.scale ? true : false,
                    xRotation: transform.xRotation ? true : false,
                    yRotation: transform.yRotation ? true : false,
                    zRotation: transform.zRotation ? true : false,
                    orientation: transform.orientation ? true : false,
                    opacity: transform.opacity ? true : false
                };
                
                // Test 3D-specific behavior
                var position3D = transform.position.value;
                var is3DPosition = position3D.length === 3;
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && is3DPosition ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_anchor_point_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "anchor_point_operations",
            "layer.transform.anchorPoint",
            "
                // Test anchor point operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                var anchorPoint = layer.transform.anchorPoint;
                
                // Test anchor point properties
                var tests = {
                    exists: anchorPoint ? true : false,
                    hasValue: anchorPoint.value ? true : false,
                    canSetValue: true
                };
                
                // Test setting anchor point
                var originalValue = anchorPoint.value;
                anchorPoint.setValue([50, 50]);
                var newValue = anchorPoint.value;
                
                var valueChanged = (newValue[0] !== originalValue[0] || newValue[1] !== originalValue[1]);
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && valueChanged ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_position_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "position_operations",
            "layer.transform.position",
            "
                // Test position operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                var position = layer.transform.position;
                
                // Test position properties
                var tests = {
                    exists: position ? true : false,
                    hasValue: position.value ? true : false,
                    canSetValue: true,
                    canSetKeyframes: true
                };
                
                // Test setting position
                var originalValue = position.value;
                position.setValue([500, 400]);
                var newValue = position.value;
                
                // Test keyframes
                position.setValueAtTime(1.0, [600, 500]);
                var keyframeValue = position.valueAtTime(1.0, false);
                
                var valueChanged = (newValue[0] !== originalValue[0] || newValue[1] !== originalValue[1]);
                var keyframeSet = (keyframeValue[0] === 600 && keyframeValue[1] === 500);
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && valueChanged && keyframeSet ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_scale_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "scale_operations",
            "layer.transform.scale",
            "
                // Test scale operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                var scale = layer.transform.scale;
                
                // Test scale properties
                var tests = {
                    exists: scale ? true : false,
                    hasValue: scale.value ? true : false,
                    canSetValue: true
                };
                
                // Test setting scale
                var originalValue = scale.value;
                scale.setValue([150, 150]);
                var newValue = scale.value;
                
                // Test keyframes
                scale.setValueAtTime(1.0, [200, 200]);
                var keyframeValue = scale.valueAtTime(1.0, false);
                
                var valueChanged = (newValue[0] !== originalValue[0] || newValue[1] !== originalValue[1]);
                var keyframeSet = (keyframeValue[0] === 200 && keyframeValue[1] === 200);
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && valueChanged && keyframeSet ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_rotation_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "rotation_operations",
            "layer.transform.rotation/orientation",
            "
                // Test rotation operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                var rotation = layer.transform.rotation;
                
                // Test rotation properties
                var tests = {
                    exists: rotation ? true : false,
                    hasValue: rotation.value !== undefined,
                    canSetValue: true
                };
                
                // Test setting rotation
                var originalValue = rotation.value;
                rotation.setValue(45); // 45 degrees
                var newValue = rotation.value;
                
                // Test keyframes
                rotation.setValueAtTime(1.0, 90); // 90 degrees
                var keyframeValue = rotation.valueAtTime(1.0, false);
                
                var valueChanged = (newValue !== originalValue);
                var keyframeSet = (keyframeValue === 90);
                
                // Test 3D rotation properties
                layer.threeDLayer = true;
                var has3DRotation = {
                    xRotation: layer.transform.xRotation ? true : false,
                    yRotation: layer.transform.yRotation ? true : false,
                    zRotation: layer.transform.zRotation ? true : false,
                    orientation: layer.transform.orientation ? true : false
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var all3DValid = true;
                for (var key in has3DRotation) {
                    if (!has3DRotation[key]) {
                        all3DValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && valueChanged && keyframeSet && all3DValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_opacity_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "opacity_operations",
            "layer.transform.opacity",
            "
                // Test opacity operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                var opacity = layer.transform.opacity;
                
                // Test opacity properties
                var tests = {
                    exists: opacity ? true : false,
                    hasValue: opacity.value !== undefined,
                    canSetValue: true
                };
                
                // Test setting opacity
                var originalValue = opacity.value;
                opacity.setValue(50); // 50% opacity
                var newValue = opacity.value;
                
                // Test keyframes
                opacity.setValueAtTime(0.0, 0); // 0% opacity
                opacity.setValueAtTime(1.0, 100); // 100% opacity
                var keyframeValue0 = opacity.valueAtTime(0.0, false);
                var keyframeValue1 = opacity.valueAtTime(1.0, false);
                
                var valueChanged = (newValue !== originalValue);
                var keyframesSet = (keyframeValue0 === 0 && keyframeValue1 === 100);
                var validRange = (newValue >= 0 && newValue <= 100);
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && valueChanged && keyframesSet && validRange ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_blending_mode_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "blending_mode_operations",
            "layer.blendingMode operations",
            "
                // Test blending mode operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test blending mode properties
                var tests = {
                    exists: layer.blendingMode !== undefined,
                    canSet: true
                };
                
                // Test setting different blend modes
                var originalMode = layer.blendingMode;
                layer.blendingMode = BlendingMode.MULTIPLY;
                var multiplyMode = layer.blendingMode;
                
                layer.blendingMode = BlendingMode.SCREEN;
                var screenMode = layer.blendingMode;
                
                layer.blendingMode = BlendingMode.OVERLAY;
                var overlayMode = layer.blendingMode;
                
                var modes = {
                    multiply: multiplyMode === BlendingMode.MULTIPLY,
                    screen: screenMode === BlendingMode.SCREEN,
                    overlay: overlayMode === BlendingMode.OVERLAY
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allModes = true;
                for (var key in modes) {
                    if (!modes[key]) {
                        allModes = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allModes ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_effects_property_group(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "effects_property_group",
            "layer.effect property group",
            "
                // Test effects property group
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test effects property group
                var effects = layer.effect;
                
                var tests = {
                    exists: effects ? true : false,
                    hasAddProperty: typeof effects.addProperty === 'function',
                    hasNumProperties: typeof effects.numProperties === 'number'
                };
                
                // Test adding an effect
                var dropShadow = effects.addProperty('Drop Shadow');
                var effectAdded = dropShadow ? true : false;
                
                // Test effect properties
                var effectTests = {
                    effectExists: dropShadow ? true : false,
                    effectEnabled: dropShadow ? dropShadow.enabled : false
                };
                
                // Test effectsActive property
                var effectsActiveTest = typeof layer.effectsActive === 'boolean';
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allEffectTests = true;
                for (var key in effectTests) {
                    if (!effectTests[key]) {
                        allEffectTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && effectAdded && allEffectTests && effectsActiveTest ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_track_matte_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "track_matte_operations",
            "layer track matte operations",
            "
                // Test track matte operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var matteLayer = comp.layers.addSolid([1, 1, 1], 'MatteLayer', 100, 100, 1);
                var fillLayer = comp.layers.addSolid([1, 0, 0], 'FillLayer', 100, 100, 1);
                
                // Test track matte properties
                var tests = {
                    trackMatteType: fillLayer.trackMatteType !== undefined,
                    canSetTrackMatte: true
                };
                
                // Test setting track matte
                var originalMatte = fillLayer.trackMatteType;
                fillLayer.trackMatteType = TrackMatteType.ALPHA;
                var alphaMatte = fillLayer.trackMatteType;
                
                fillLayer.trackMatteType = TrackMatteType.ALPHA_INVERTED;
                var alphaInverted = fillLayer.trackMatteType;
                
                fillLayer.trackMatteType = TrackMatteType.LUMA;
                var lumaMatte = fillLayer.trackMatteType;
                
                var matteTests = {
                    alpha: alphaMatte === TrackMatteType.ALPHA,
                    alphaInverted: alphaInverted === TrackMatteType.ALPHA_INVERTED,
                    luma: lumaMatte === TrackMatteType.LUMA
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allMattes = true;
                for (var key in matteTests) {
                    if (!matteTests[key]) {
                        allMattes = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allMattes ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_preserve_transparency(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "preserve_transparency",
            "layer.preserveTransparency",
            "
                // Test preserve transparency
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test preserve transparency properties
                var tests = {
                    exists: layer.preserveTransparency !== undefined,
                    isBoolean: typeof layer.preserveTransparency === 'boolean',
                    canSet: true
                };
                
                // Test setting preserve transparency
                var originalValue = layer.preserveTransparency;
                layer.preserveTransparency = true;
                var newValue = layer.preserveTransparency;
                
                layer.preserveTransparency = false;
                var falseValue = layer.preserveTransparency;
                
                var valueTests = {
                    setTrue: newValue === true,
                    setFalse: falseValue === false,
                    valueChanged: newValue !== originalValue
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allValues = true;
                for (var key in valueTests) {
                    if (!valueTests[key]) {
                        allValues = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allValues ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_parenting_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_parenting_operations",
            "layer.parent/setParentWithJump",
            "
                // Test layer parenting operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var parentLayer = comp.layers.addNull();
                parentLayer.name = 'ParentLayer';
                var childLayer = comp.layers.addSolid([1, 0, 0], 'ChildLayer', 100, 100, 1);
                
                // Test parent property
                var tests = {
                    parentExists: childLayer.parent !== undefined,
                    initialParent: childLayer.parent === null,
                    canSetParent: true
                };
                
                // Test setting parent
                childLayer.parent = parentLayer;
                var parentSet = childLayer.parent === parentLayer;
                
                // Test setParentWithJump method
                var nullLayer2 = comp.layers.addNull();
                nullLayer2.name = 'ParentLayer2';
                
                var hasSetParentWithJump = typeof childLayer.setParentWithJump === 'function';
                
                if (hasSetParentWithJump) {
                    childLayer.setParentWithJump(nullLayer2);
                    var parentWithJump = childLayer.parent === nullLayer2;
                } else {
                    var parentWithJump = true; // Skip test if method not available
                }
                
                // Test removing parent
                childLayer.parent = null;
                var parentRemoved = childLayer.parent === null;
                
                var parentTests = {
                    parentSet: parentSet,
                    parentWithJump: parentWithJump,
                    parentRemoved: parentRemoved
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allParentTests = true;
                for (var key in parentTests) {
                    if (!parentTests[key]) {
                        allParentTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allParentTests && hasSetParentWithJump ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_parent_child_relationships(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "parent_child_relationships",
            "layer parent-child relationships",
            "
                // Test parent-child relationships
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var parentLayer = comp.layers.addNull();
                parentLayer.name = 'ParentLayer';
                var childLayer = comp.layers.addSolid([1, 0, 0], 'ChildLayer', 100, 100, 1);
                
                // Set up parent-child relationship
                childLayer.parent = parentLayer;
                
                // Test relationship properties
                var tests = {
                    childHasParent: childLayer.parent === parentLayer,
                    parentReference: childLayer.parent ? true : false
                };
                
                // Test transform inheritance
                parentLayer.transform.position.setValue([500, 400]);
                parentLayer.transform.scale.setValue([150, 150]);
                parentLayer.transform.rotation.setValue(45);
                
                // Child should inherit parent transforms
                var childTransforms = {
                    position: childLayer.transform.position ? true : false,
                    scale: childLayer.transform.scale ? true : false,
                    rotation: childLayer.transform.rotation ? true : false
                };
                
                // Test that child transforms are relative to parent
                var childPos = childLayer.transform.position.value;
                var parentPos = parentLayer.transform.position.value;
                
                var transformTests = {
                    hasPosition: childPos.length > 0,
                    hasParentPosition: parentPos.length > 0,
                    validTransforms: true
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allTransforms = true;
                for (var key in childTransforms) {
                    if (!childTransforms[key]) {
                        allTransforms = false;
                        break;
                    }
                }
                
                var allTransformTests = true;
                for (var key in transformTests) {
                    if (!transformTests[key]) {
                        allTransformTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allTransforms && allTransformTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_auto_orient_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "auto_orient_operations",
            "layer.autoOrient operations",
            "
                // Test auto orient operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test auto orient property
                var tests = {
                    exists: layer.autoOrient !== undefined,
                    canSet: true
                };
                
                // Test setting different auto orient modes
                var originalOrient = layer.autoOrient;
                
                layer.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
                var noAutoOrient = layer.autoOrient;
                
                layer.autoOrient = AutoOrientType.ALONG_PATH;
                var alongPath = layer.autoOrient;
                
                layer.autoOrient = AutoOrientType.FACE_CAMERA;
                var faceCamera = layer.autoOrient;
                
                layer.autoOrient = AutoOrientType.FACE_CAMERA_OR_POINT_OF_INTEREST;
                var faceCameraOrPOI = layer.autoOrient;
                
                var orientTests = {
                    noAutoOrient: noAutoOrient === AutoOrientType.NO_AUTO_ORIENT,
                    alongPath: alongPath === AutoOrientType.ALONG_PATH,
                    faceCamera: faceCamera === AutoOrientType.FACE_CAMERA,
                    faceCameraOrPOI: faceCameraOrPOI === AutoOrientType.FACE_CAMERA_OR_POINT_OF_INTEREST
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allOrientTests = true;
                for (var key in orientTests) {
                    if (!orientTests[key]) {
                        allOrientTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allOrientTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_hierarchy_navigation(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "hierarchy_navigation",
            "layer hierarchy navigation",
            "
                // Test hierarchy navigation
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var grandparentLayer = comp.layers.addNull();
                grandparentLayer.name = 'GrandparentLayer';
                var parentLayer = comp.layers.addNull();
                parentLayer.name = 'ParentLayer';
                var childLayer = comp.layers.addSolid([1, 0, 0], 'ChildLayer', 100, 100, 1);
                
                // Set up hierarchy
                parentLayer.parent = grandparentLayer;
                childLayer.parent = parentLayer;
                
                // Test hierarchy navigation
                var tests = {
                    childToParent: childLayer.parent === parentLayer,
                    parentToGrandparent: parentLayer.parent === grandparentLayer,
                    grandparentNoParent: grandparentLayer.parent === null
                };
                
                // Test containing composition reference
                var containingCompTests = {
                    childComp: childLayer.containingComp === comp,
                    parentComp: parentLayer.containingComp === comp,
                    grandparentComp: grandparentLayer.containingComp === comp
                };
                
                // Test index navigation
                var indexTests = {
                    childIndex: typeof childLayer.index === 'number',
                    parentIndex: typeof parentLayer.index === 'number',
                    grandparentIndex: typeof grandparentLayer.index === 'number',
                    validIndexes: (childLayer.index > 0 && parentLayer.index > 0 && grandparentLayer.index > 0)
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allCompTests = true;
                for (var key in containingCompTests) {
                    if (!containingCompTests[key]) {
                        allCompTests = false;
                        break;
                    }
                }
                
                var allIndexTests = true;
                for (var key in indexTests) {
                    if (!indexTests[key]) {
                        allIndexTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allCompTests && allIndexTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_mask_property_group(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "mask_property_group",
            "layer.mask property group",
            "
                // Test mask property group
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test mask property group
                var masks = layer.mask;
                
                var tests = {
                    exists: masks ? true : false,
                    hasAddProperty: typeof masks.addProperty === 'function',
                    hasNumProperties: typeof masks.numProperties === 'number',
                    initialMaskCount: masks.numProperties === 0
                };
                
                // Test adding a mask
                var newMask = masks.addProperty('Mask');
                var maskAdded = newMask ? true : false;
                var maskCount = masks.numProperties;
                
                var maskTests = {
                    maskAdded: maskAdded,
                    maskCountIncreased: maskCount === 1
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allMaskTests = true;
                for (var key in maskTests) {
                    if (!maskTests[key]) {
                        allMaskTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allMaskTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_mask_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "mask_operations",
            "layer mask operations",
            "
                // Test mask operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Add a mask
                var masks = layer.mask;
                var mask = masks.addProperty('Mask');
                
                // Test mask properties
                var tests = {
                    maskPath: mask.maskPath ? true : false,
                    maskFeather: mask.maskFeather ? true : false,
                    maskOpacity: mask.maskOpacity ? true : false,
                    maskExpansion: mask.maskExpansion ? true : false,
                    inverted: mask.inverted ? true : false
                };
                
                // Test mask path operations
                var maskShape = new Shape();
                maskShape.vertices = [[0, 0], [100, 0], [100, 100], [0, 100]];
                maskShape.closed = true;
                
                mask.maskPath.setValue(maskShape);
                var pathSet = mask.maskPath.value ? true : false;
                
                // Test mask feather
                mask.maskFeather.setValue([[10, 10], [10, 10], [10, 10], [10, 10]]);
                var featherSet = mask.maskFeather.value ? true : false;
                
                // Test mask opacity
                mask.maskOpacity.setValue(75);
                var opacitySet = mask.maskOpacity.value === 75;
                
                // Test inverted
                mask.inverted.setValue(true);
                var invertedSet = mask.inverted.value === true;
                
                var operationTests = {
                    pathSet: pathSet,
                    featherSet: featherSet,
                    opacitySet: opacitySet,
                    invertedSet: invertedSet
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allOperations = true;
                for (var key in operationTests) {
                    if (!operationTests[key]) {
                        allOperations = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allOperations ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_mask_modes(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "mask_modes",
            "mask mode operations",
            "
                // Test mask modes
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Add a mask
                var masks = layer.mask;
                var mask = masks.addProperty('Mask');
                
                // Test mask mode property
                var tests = {
                    maskMode: mask.maskMode ? true : false,
                    canSetMode: true
                };
                
                // Test setting different mask modes
                var originalMode = mask.maskMode.value;
                
                mask.maskMode.setValue(MaskMode.ADD);
                var addMode = mask.maskMode.value;
                
                mask.maskMode.setValue(MaskMode.SUBTRACT);
                var subtractMode = mask.maskMode.value;
                
                mask.maskMode.setValue(MaskMode.INTERSECT);
                var intersectMode = mask.maskMode.value;
                
                mask.maskMode.setValue(MaskMode.DIFFERENCE);
                var differenceMode = mask.maskMode.value;
                
                var modeTests = {
                    addMode: addMode === MaskMode.ADD,
                    subtractMode: subtractMode === MaskMode.SUBTRACT,
                    intersectMode: intersectMode === MaskMode.INTERSECT,
                    differenceMode: differenceMode === MaskMode.DIFFERENCE
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allModes = true;
                for (var key in modeTests) {
                    if (!modeTests[key]) {
                        allModes = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allModes ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_mask_feather(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "mask_feather",
            "mask feather operations",
            "
                // Test mask feather operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Add a mask
                var masks = layer.mask;
                var mask = masks.addProperty('Mask');
                
                // Create a mask path first
                var maskShape = new Shape();
                maskShape.vertices = [[0, 0], [100, 0], [100, 100], [0, 100]];
                maskShape.closed = true;
                mask.maskPath.setValue(maskShape);
                
                // Test mask feather property
                var tests = {
                    maskFeather: mask.maskFeather ? true : false,
                    hasValue: mask.maskFeather.value ? true : false,
                    canSetValue: true
                };
                
                // Test setting mask feather
                var originalFeather = mask.maskFeather.value;
                
                // Set uniform feather
                mask.maskFeather.setValue([[5, 5], [5, 5], [5, 5], [5, 5]]);
                var uniformFeather = mask.maskFeather.value;
                
                // Set variable feather
                mask.maskFeather.setValue([[10, 10], [5, 5], [15, 15], [8, 8]]);
                var variableFeather = mask.maskFeather.value;
                
                var featherTests = {
                    uniformSet: uniformFeather && uniformFeather.length === 4,
                    variableSet: variableFeather && variableFeather.length === 4,
                    validFeatherValues: true
                };
                
                // Test feather interpolation
                mask.maskFeather.setValueAtTime(0, [[0, 0], [0, 0], [0, 0], [0, 0]]);
                mask.maskFeather.setValueAtTime(1, [[20, 20], [20, 20], [20, 20], [20, 20]]);
                var keyframeFeather = mask.maskFeather.valueAtTime(0.5, false);
                
                var keyframeTests = {
                    keyframeSet: keyframeFeather ? true : false
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allFeatherTests = true;
                for (var key in featherTests) {
                    if (!featherTests[key]) {
                        allFeatherTests = false;
                        break;
                    }
                }
                
                var allKeyframeTests = true;
                for (var key in keyframeTests) {
                    if (!keyframeTests[key]) {
                        allKeyframeTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allFeatherTests && allKeyframeTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_mask_opacity(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "mask_opacity",
            "mask opacity operations",
            "
                // Test mask opacity operations
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Add a mask
                var masks = layer.mask;
                var mask = masks.addProperty('Mask');
                
                // Test mask opacity property
                var tests = {
                    maskOpacity: mask.maskOpacity ? true : false,
                    hasValue: mask.maskOpacity.value !== undefined,
                    canSetValue: true
                };
                
                // Test setting mask opacity
                var originalOpacity = mask.maskOpacity.value;
                
                mask.maskOpacity.setValue(50);
                var halfOpacity = mask.maskOpacity.value;
                
                mask.maskOpacity.setValue(100);
                var fullOpacity = mask.maskOpacity.value;
                
                mask.maskOpacity.setValue(0);
                var zeroOpacity = mask.maskOpacity.value;
                
                var opacityTests = {
                    halfSet: halfOpacity === 50,
                    fullSet: fullOpacity === 100,
                    zeroSet: zeroOpacity === 0,
                    validRange: (halfOpacity >= 0 && halfOpacity <= 100)
                };
                
                // Test opacity keyframes
                mask.maskOpacity.setValueAtTime(0, 0);
                mask.maskOpacity.setValueAtTime(1, 100);
                var keyframe0 = mask.maskOpacity.valueAtTime(0, false);
                var keyframe1 = mask.maskOpacity.valueAtTime(1, false);
                
                var keyframeTests = {
                    keyframe0Set: keyframe0 === 0,
                    keyframe1Set: keyframe1 === 100,
                    interpolation: true
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allOpacityTests = true;
                for (var key in opacityTests) {
                    if (!opacityTests[key]) {
                        allOpacityTests = false;
                        break;
                    }
                }
                
                var allKeyframeTests = true;
                for (var key in keyframeTests) {
                    if (!keyframeTests[key]) {
                        allKeyframeTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allOpacityTests && allKeyframeTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_quality_settings(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_quality_settings",
            "layer.quality settings",
            "
                // Test layer quality settings
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test quality property
                var tests = {
                    exists: layer.quality !== undefined,
                    canSet: true
                };
                
                // Test setting different quality levels
                var originalQuality = layer.quality;
                
                layer.quality = LayerQuality.DRAFT;
                var draftQuality = layer.quality;
                
                layer.quality = LayerQuality.WIREFRAME;
                var wireframeQuality = layer.quality;
                
                layer.quality = LayerQuality.BEST;
                var bestQuality = layer.quality;
                
                var qualityTests = {
                    draft: draftQuality === LayerQuality.DRAFT,
                    wireframe: wireframeQuality === LayerQuality.WIREFRAME,
                    best: bestQuality === LayerQuality.BEST
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allQualityTests = true;
                for (var key in qualityTests) {
                    if (!qualityTests[key]) {
                        allQualityTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allQualityTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_sampling_quality_settings(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "sampling_quality_settings",
            "layer.samplingQuality settings",
            "
                // Test sampling quality settings
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test sampling quality property
                var tests = {
                    exists: layer.samplingQuality !== undefined,
                    canSet: true
                };
                
                // Test setting different sampling quality levels
                var originalSamplingQuality = layer.samplingQuality;
                
                layer.samplingQuality = LayerSamplingQuality.BILINEAR;
                var bilinearSampling = layer.samplingQuality;
                
                layer.samplingQuality = LayerSamplingQuality.BICUBIC;
                var bicubicSampling = layer.samplingQuality;
                
                var samplingTests = {
                    bilinear: bilinearSampling === LayerSamplingQuality.BILINEAR,
                    bicubic: bicubicSampling === LayerSamplingQuality.BICUBIC
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allSamplingTests = true;
                for (var key in samplingTests) {
                    if (!samplingTests[key]) {
                        allSamplingTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allSamplingTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_motion_blur_settings(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "motion_blur_settings",
            "layer.motionBlur settings",
            "
                // Test motion blur settings
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test motion blur property
                var tests = {
                    exists: layer.motionBlur !== undefined,
                    isBoolean: typeof layer.motionBlur === 'boolean',
                    canSet: true
                };
                
                // Test setting motion blur
                var originalMotionBlur = layer.motionBlur;
                
                layer.motionBlur = true;
                var motionBlurOn = layer.motionBlur;
                
                layer.motionBlur = false;
                var motionBlurOff = layer.motionBlur;
                
                var motionBlurTests = {
                    turnOn: motionBlurOn === true,
                    turnOff: motionBlurOff === false,
                    valueChanged: motionBlurOn !== motionBlurOff
                };
                
                // Test that motion blur requires composition motion blur to be enabled
                var compMotionBlur = comp.motionBlur;
                var compMotionBlurTest = typeof compMotionBlur === 'boolean';
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allMotionBlurTests = true;
                for (var key in motionBlurTests) {
                    if (!motionBlurTests[key]) {
                        allMotionBlurTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allMotionBlurTests && compMotionBlurTest ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_frame_blending_settings(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "frame_blending_settings",
            "layer.frameBlending settings",
            "
                // Test frame blending settings
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test frame blending property
                var tests = {
                    exists: layer.frameBlending !== undefined,
                    isBoolean: typeof layer.frameBlending === 'boolean',
                    canSet: true
                };
                
                // Test frame blending type property
                var frameBlendingTypeTests = {
                    exists: layer.frameBlendingType !== undefined,
                    canSet: true
                };
                
                // Test setting frame blending
                var originalFrameBlending = layer.frameBlending;
                
                layer.frameBlending = true;
                var frameBlendingOn = layer.frameBlending;
                
                layer.frameBlending = false;
                var frameBlendingOff = layer.frameBlending;
                
                // Test frame blending types
                var originalBlendingType = layer.frameBlendingType;
                
                layer.frameBlendingType = FrameBlendingType.FRAME_MIX;
                var frameMixType = layer.frameBlendingType;
                
                layer.frameBlendingType = FrameBlendingType.PIXEL_MOTION;
                var pixelMotionType = layer.frameBlendingType;
                
                var blendingTests = {
                    turnOn: frameBlendingOn === true,
                    turnOff: frameBlendingOff === false,
                    frameMix: frameMixType === FrameBlendingType.FRAME_MIX,
                    pixelMotion: pixelMotionType === FrameBlendingType.PIXEL_MOTION
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                var allFrameBlendingTypeTests = true;
                for (var key in frameBlendingTypeTests) {
                    if (!frameBlendingTypeTests[key]) {
                        allFrameBlendingTypeTests = false;
                        break;
                    }
                }
                
                var allBlendingTests = true;
                for (var key in blendingTests) {
                    if (!blendingTests[key]) {
                        allBlendingTests = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid && allFrameBlendingTypeTests && allBlendingTests ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_labeling(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_labeling",
            "layer.label operations",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test label property
                var originalLabel = layer.label;
                
                // Test setting label values (0-16)
                layer.label = 5; // Cyan
                var labelSet = layer.label === 5;
                
                layer.label = 14; // Purple
                var labelChanged = layer.label === 14;
                
                var tests = {
                    labelType: typeof layer.label === 'number',
                    labelRange: layer.label >= 0 && layer.label <= 16,
                    labelSetTest: labelSet,
                    labelChangeTest: labelChanged
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_comments(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_comments",
            "layer.comment operations",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test comment property
                var originalComment = layer.comment;
                
                // Test setting comment
                layer.comment = 'Test layer comment';
                var commentSet = layer.comment === 'Test layer comment';
                
                // Test empty comment
                layer.comment = '';
                var commentCleared = layer.comment === '';
                
                var tests = {
                    commentType: typeof layer.comment === 'string',
                    commentSetTest: commentSet,
                    commentClearTest: commentCleared,
                    commentOriginalType: typeof originalComment === 'string'
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_naming(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_naming",
            "layer.name operations",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test name property
                var originalName = layer.name;
                
                // Test setting name
                layer.name = 'Renamed Layer';
                var nameSet = layer.name === 'Renamed Layer';
                
                // Test isNameSet property
                var isNameSetAfterRename = layer.isNameSet;
                
                var tests = {
                    nameType: typeof layer.name === 'string',
                    nameSetTest: nameSet,
                    isNameSetType: typeof layer.isNameSet === 'boolean',
                    isNameSetAfterRename: isNameSetAfterRename === true,
                    originalNameType: typeof originalName === 'string'
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_selection(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_selection",
            "layer.selected operations",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer1 = comp.layers.addSolid([1, 0, 0], 'Layer1', 100, 100, 1);
                var layer2 = comp.layers.addSolid([0, 1, 0], 'Layer2', 100, 100, 1);
                
                // Test selection operations
                layer1.selected = true;
                var layer1Selected = layer1.selected;
                
                layer2.selected = false;
                var layer2NotSelected = !layer2.selected;
                
                // Test multiple selection
                layer1.selected = true;
                layer2.selected = true;
                var bothSelected = layer1.selected && layer2.selected;
                
                var tests = {
                    selectedType: typeof layer1.selected === 'boolean',
                    layer1SelectTest: layer1Selected,
                    layer2DeselectTest: layer2NotSelected,
                    multiSelectTest: bothSelected
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_locking(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_locking",
            "layer.locked operations",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test locking operations
                var originalLocked = layer.locked;
                
                // Test setting locked state
                layer.locked = true;
                var lockSet = layer.locked === true;
                
                layer.locked = false;
                var unlockSet = layer.locked === false;
                
                var tests = {
                    lockedType: typeof layer.locked === 'boolean',
                    lockSetTest: lockSet,
                    unlockSetTest: unlockSet,
                    originalType: typeof originalLocked === 'boolean'
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
    
    fn test_layer_solo_shy(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_solo_shy",
            "layer.solo/shy operations",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer = comp.layers.addSolid([1, 0, 0], 'TestLayer', 100, 100, 1);
                
                // Test solo operations
                var originalSolo = layer.solo;
                layer.solo = true;
                var soloSet = layer.solo === true;
                
                layer.solo = false;
                var soloUnset = layer.solo === false;
                
                // Test shy operations
                var originalShy = layer.shy;
                layer.shy = true;
                var shySet = layer.shy === true;
                
                layer.shy = false;
                var shyUnset = layer.shy === false;
                
                var tests = {
                    soloType: typeof layer.solo === 'boolean',
                    shyType: typeof layer.shy === 'boolean',
                    soloSetTest: soloSet,
                    soloUnsetTest: soloUnset,
                    shySetTest: shySet,
                    shyUnsetTest: shyUnset
                };
                
                var allValid = true;
                for (var key in tests) {
                    if (!tests[key]) {
                        allValid = false;
                        break;
                    }
                }
                
                comp.remove();
                allValid ? 'valid' : 'invalid';
            ",
            "string"
        )
    }
}

#[cfg(test)]
mod layer_base_tests {
    use super::*;
    
    #[test]
    fn test_layer_base_comprehensive() {
        let layer_tests = LayerBaseTests;
        let results = layer_tests.run_test();
        
        // Verify we have comprehensive coverage
        assert!(results.len() >= layer_tests.expected_api_count());
        
        // Check that all tests pass
        let failed_tests: Vec<_> = results.iter()
            .filter(|r| !r.success)
            .collect();
        
        if !failed_tests.is_empty() {
            panic!("Layer base tests failed: {:?}", failed_tests);
        }
    }
    
    #[test]
    fn test_layer_attributes_coverage() {
        let layer_tests = LayerBaseTests;
        let results = layer_tests.run_test();
        
        // Verify coverage of key layer attributes
        let key_attributes = vec![
            "index", "name", "comment", "label", "selected", "enabled", "active",
            "startTime", "inPoint", "outPoint", "stretch", "quality", "threeDLayer",
            "motionBlur", "frameBlending", "blendingMode", "parent", "source"
        ];
        
        for attr in key_attributes {
            let attr_tested = results.iter().any(|r| r.api_path.contains(attr));
            assert!(attr_tested, "Layer attribute '{}' not tested", attr);
        }
    }
    
    #[test]
    fn test_layer_methods_coverage() {
        let layer_tests = LayerBaseTests;
        let results = layer_tests.run_test();
        
        // Verify layer method testing
        let layer_methods = vec![
            "remove", "moveToBeginning", "moveToEnd", "moveBefore", "moveAfter",
            "duplicate", "copyToComp", "setParentWithJump", "property", "replaceSource"
        ];
        
        for method in layer_methods {
            let method_tested = results.iter().any(|r| r.api_path.contains(method));
            assert!(method_tested, "Layer method '{}' not tested", method);
        }
    }
    
    #[test]
    fn test_transform_properties_coverage() {
        let layer_tests = LayerBaseTests;
        let results = layer_tests.run_test();
        
        // Verify transform properties testing
        let transform_properties = vec![
            "anchorPoint", "position", "scale", "rotation", "opacity"
        ];
        
        for prop in transform_properties {
            let prop_tested = results.iter().any(|r| r.api_path.contains(prop));
            assert!(prop_tested, "Transform property '{}' not tested", prop);
        }
    }
}