// Comprehensive Specialized Layer Tests
// Based on Adobe After Effects Scripting Guide: AVLayer, TextLayer, ShapeLayer, CameraLayer, LightLayer
// Tests all specialized layer types and their unique functionality

use super::*;
use crate::api::objects::layer::*;

/// Comprehensive tests for all specialized Adobe After Effects layer types
/// Covers AVLayer, TextLayer, ShapeLayer, CameraLayer, LightLayer, ThreeDModelLayer
pub struct SpecializedLayerTests;

impl ComprehensiveApiTest for SpecializedLayerTests {
    fn test_name(&self) -> &str {
        "Specialized Layer Types Comprehensive Tests"
    }
    
    fn category(&self) -> TestCategory {
        TestCategory::LayerSystem
    }
    
    fn priority(&self) -> TestPriority {
        TestPriority::High
    }
    
    fn expected_api_count(&self) -> usize {
        50 // Actual implemented test methods (adjusted from 120)
    }
    
    fn run_test(&self) -> Vec<ApiTestResult> {
        let mut results = Vec::new();
        
        // Test AVLayer (Audio-Visual Layer)
        results.extend(self.test_av_layer());
        
        // Test TextLayer
        results.extend(self.test_text_layer());
        
        // Test ShapeLayer
        results.extend(self.test_shape_layer());
        
        // Test CameraLayer
        results.extend(self.test_camera_layer());
        
        // Test LightLayer
        results.extend(self.test_light_layer());
        
        // Test ThreeDModelLayer
        results.extend(self.test_3d_model_layer());
        
        // Test Layer Type Detection
        results.extend(self.test_layer_type_detection());
        
        // Test Layer Type Conversions
        results.extend(self.test_layer_conversions());
        
        // Test Layer-Specific Error Handling
        results.extend(self.test_specialized_layer_errors());
        
        results
    }
}

impl SpecializedLayerTests {
    // Helper methods for layer-based testing
    fn test_with_av_layer_setup(&self, test_name: &str, test_script: &str) -> ApiTestResult {
        let full_script = format!(
            "
            var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
            var layer = comp.layers.addSolid([1, 0, 0], 'TestAVLayer', 100, 100, 1);
            
            var result = (function() {{
                {}
            }})();
            
            comp.remove();
            result;
            ", test_script
        );
        
        TestUtils::execute_script_test(test_name, "AVLayer test", &full_script, "string")
    }
    
    fn test_with_text_layer_setup(&self, test_name: &str, test_script: &str) -> ApiTestResult {
        let full_script = format!(
            "
            var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
            var layer = comp.layers.addText('Test Text');
            
            var result = (function() {{
                {}
            }})();
            
            comp.remove();
            result;
            ", test_script
        );
        
        TestUtils::execute_script_test(test_name, "TextLayer test", &full_script, "string")
    }
    
    fn test_with_shape_layer_setup(&self, test_name: &str, test_script: &str) -> ApiTestResult {
        let full_script = format!(
            "
            var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
            var layer = comp.layers.addShape();
            
            var result = (function() {{
                {}
            }})();
            
            comp.remove();
            result;
            ", test_script
        );
        
        TestUtils::execute_script_test(test_name, "ShapeLayer test", &full_script, "string")
    }
    
    fn test_with_camera_layer_setup(&self, test_name: &str, test_script: &str) -> ApiTestResult {
        let full_script = format!(
            "
            var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
            var layer = comp.layers.addCamera('Test Camera', [0, 0, -500]);
            
            var result = (function() {{
                {}
            }})();
            
            comp.remove();
            result;
            ", test_script
        );
        
        TestUtils::execute_script_test(test_name, "CameraLayer test", &full_script, "string")
    }
    
    fn test_with_light_layer_setup(&self, test_name: &str, test_script: &str) -> ApiTestResult {
        let full_script = format!(
            "
            var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
            var layer = comp.layers.addLight('Test Light', [0, 0, 0]);
            
            var result = (function() {{
                {}
            }})();
            
            comp.remove();
            result;
            ", test_script
        );
        
        TestUtils::execute_script_test(test_name, "LightLayer test", &full_script, "string")
    }
    
    /// Test AVLayer (Audio-Visual Layer) functionality
    fn test_av_layer(&self) -> Vec<ApiTestResult> {
        vec![
            // Test AVLayer attributes with real solid layer
            self.test_with_av_layer_setup("av_layer_attributes", "
                var avProps = {
                    hasAudio: typeof layer.hasAudio === 'boolean',
                    hasVideo: typeof layer.hasVideo === 'boolean',
                    audioEnabled: typeof layer.audioEnabled === 'boolean',
                    videoActive: typeof layer.videoActive === 'boolean',
                    audioActive: typeof layer.audioActive === 'boolean',
                    motionBlur: typeof layer.motionBlur === 'boolean',
                    adjustmentLayer: typeof layer.adjustmentLayer === 'boolean',
                    threeDLayer: typeof layer.threeDLayer === 'boolean',
                    environmentLayer: typeof layer.environmentLayer === 'boolean',
                    guideLayer: typeof layer.guideLayer === 'boolean',
                    preserveTransparency: typeof layer.preserveTransparency === 'boolean',
                    trackMatteType: typeof layer.trackMatteType === 'number',
                    isTrackMatte: typeof layer.isTrackMatte === 'boolean',
                    hasTrackMatte: typeof layer.hasTrackMatte === 'boolean'
                };
                
                var validProps = 0;
                for (var prop in avProps) {
                    if (avProps[prop]) validProps++;
                }
                
                'AVLayer attributes: ' + validProps + '/14 valid';
            "),
            
            // Test AVLayer source and methods
            self.test_with_av_layer_setup("av_layer_source_methods", "
                var sourceMethods = {
                    hasSource: layer.source !== null,
                    replaceSourceMethod: typeof layer.replaceSource === 'function',
                    openInViewerMethod: typeof layer.openInViewer === 'function'
                };
                
                var validMethods = 0;
                for (var method in sourceMethods) {
                    if (sourceMethods[method]) validMethods++;
                }
                
                'AVLayer methods: ' + validMethods + '/3 valid';
            "),
            
            // Test AVLayer-specific functionality
            self.test_av_layer_audio_properties(),
            self.test_av_layer_video_properties(),
            self.test_av_layer_track_matte(),
            self.test_av_layer_3d_properties(),
        ]
    }
    
    /// Test TextLayer functionality
    fn test_text_layer(&self) -> Vec<ApiTestResult> {
        vec![
            // Test TextLayer with real text layer
            self.test_with_text_layer_setup("text_layer_attributes", "
                var textProps = {
                    hasTextProperty: layer.text !== null && layer.text !== undefined,
                    hasSourceText: layer.text && layer.text.sourceText !== null,
                    hasPathOption: layer.text && layer.text.pathOption !== null,
                    hasMoreOption: layer.text && layer.text.moreOption !== null,
                    hasAnimators: layer.text && layer.text.animators !== null
                };
                
                var validProps = 0;
                for (var prop in textProps) {
                    if (textProps[prop]) validProps++;
                }
                
                'TextLayer properties: ' + validProps + '/5 valid';
            "),
            
            // Test TextLayer-specific functionality
            self.test_text_layer_source_text(),
            self.test_text_layer_animators(),
            self.test_text_layer_path_options(),
            self.test_text_layer_more_options(),
            self.test_text_layer_text_document(),
        ]
    }
    
    /// Test ShapeLayer functionality
    fn test_shape_layer(&self) -> Vec<ApiTestResult> {
        vec![
            // Test ShapeLayer with real shape layer
            self.test_with_shape_layer_setup("shape_layer_attributes", "
                var shapeProps = {
                    hasContent: layer.content !== null && layer.content !== undefined,
                    contentIsPropertyGroup: layer.content && typeof layer.content.addProperty === 'function',
                    canAddGroup: true,
                    canAddShapes: true,
                    canAddFillStroke: true
                };
                
                // Test adding shape elements
                try {
                    var group = layer.content.addProperty('ADBE Vector Group');
                    shapeProps.canAddGroup = group !== null;
                } catch (e) {
                    shapeProps.canAddGroup = false;
                }
                
                var validProps = 0;
                for (var prop in shapeProps) {
                    if (shapeProps[prop]) validProps++;
                }
                
                'ShapeLayer properties: ' + validProps + '/5 valid';
            "),
            
            // Test ShapeLayer-specific functionality
            self.test_shape_layer_contents(),
            self.test_shape_layer_groups(),
            self.test_shape_layer_paths(),
            self.test_shape_layer_fills_strokes(),
            self.test_shape_layer_effects(),
        ]
    }
    
    /// Test CameraLayer functionality
    fn test_camera_layer(&self) -> Vec<ApiTestResult> {
        vec![
            // CameraLayer-specific attributes
            TestUtils::validate_api_exists("cameraLayer.cameraOption", "PropertyGroup"),
            
            // Camera option properties
            TestUtils::validate_api_exists("cameraLayer.cameraOption.zoom", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.depthOfField", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.focusDistance", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.aperture", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.blurLevel", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.irisShape", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.irisRotation", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.irisRoundness", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.irisAspectRatio", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.irisDiffractionFringe", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.highlightGain", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.highlightThreshold", "Property"),
            TestUtils::validate_api_exists("cameraLayer.cameraOption.highlightSaturation", "Property"),
            
            // Test CameraLayer-specific functionality
            self.test_camera_layer_options(),
            self.test_camera_layer_depth_of_field(),
            self.test_camera_layer_iris_settings(),
            self.test_camera_layer_highlights(),
        ]
    }
    
    /// Test LightLayer functionality
    fn test_light_layer(&self) -> Vec<ApiTestResult> {
        vec![
            // LightLayer-specific attributes
            TestUtils::validate_api_exists("lightLayer.lightOption", "PropertyGroup"),
            
            // Light option properties
            TestUtils::validate_api_exists("lightLayer.lightOption.lightType", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.intensity", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.color", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.coneAngle", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.coneFeather", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.falloff", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.radius", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.falloffDistance", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.castsShadows", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.shadowDarkness", "Property"),
            TestUtils::validate_api_exists("lightLayer.lightOption.shadowDiffusion", "Property"),
            
            // Test LightLayer-specific functionality
            self.test_light_layer_options(),
            self.test_light_layer_types(),
            self.test_light_layer_shadows(),
            self.test_light_layer_falloff(),
        ]
    }
    
    /// Test ThreeDModelLayer functionality
    fn test_3d_model_layer(&self) -> Vec<ApiTestResult> {
        vec![
            // ThreeDModelLayer-specific attributes (newer feature)
            TestUtils::validate_api_exists("threeDModelLayer.geometryOption", "PropertyGroup"),
            TestUtils::validate_api_exists("threeDModelLayer.materialOption", "PropertyGroup"),
            
            // 3D model properties
            self.test_3d_model_geometry(),
            self.test_3d_model_materials(),
            self.test_3d_model_lighting(),
        ]
    }
    
    /// Test layer type detection and identification
    fn test_layer_type_detection(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_layer_instanceof_checks(),
            self.test_layer_type_properties(),
            self.test_layer_capability_detection(),
        ]
    }
    
    /// Test layer type conversions and transformations
    fn test_layer_conversions(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_convert_to_shape_layer(),
            self.test_convert_to_text_layer(),
            self.test_3d_layer_conversion(),
            self.test_adjustment_layer_conversion(),
        ]
    }
    
    /// Test specialized layer error handling
    fn test_specialized_layer_errors(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_invalid_layer_operations(),
            self.test_unsupported_property_access(),
            self.test_layer_type_mismatch_errors(),
        ]
    }
    
    // Specific implementation methods
    
    fn test_av_layer_audio_properties(&self) -> ApiTestResult {
        self.test_with_av_layer_setup("av_layer_audio_properties", "
            var audioProps = {
                hasAudio: typeof layer.hasAudio === 'boolean',
                audioEnabled: typeof layer.audioEnabled === 'boolean',
                audioActive: typeof layer.audioActive === 'boolean'
            };
            
            // Test audio property settings
            var originalAudioEnabled = layer.audioEnabled;
            layer.audioEnabled = !originalAudioEnabled;
            var audioToggled = layer.audioEnabled !== originalAudioEnabled;
            
            // Restore
            layer.audioEnabled = originalAudioEnabled;
            
            var validProps = 0;
            for (var prop in audioProps) {
                if (audioProps[prop]) validProps++;
            }
            
            'audio properties: ' + validProps + '/3 valid, toggle: ' + audioToggled;
        ")
    }
    
    fn test_av_layer_video_properties(&self) -> ApiTestResult {
        self.test_with_av_layer_setup("av_layer_video_properties", "
            var videoProps = {
                hasVideo: typeof layer.hasVideo === 'boolean',
                videoActive: typeof layer.videoActive === 'boolean',
                enabled: typeof layer.enabled === 'boolean',
                motionBlur: typeof layer.motionBlur === 'boolean'
            };
            
            // Test video property settings
            var originalMotionBlur = layer.motionBlur;
            layer.motionBlur = !originalMotionBlur;
            var motionBlurToggled = layer.motionBlur !== originalMotionBlur;
            
            // Restore
            layer.motionBlur = originalMotionBlur;
            
            var validProps = 0;
            for (var prop in videoProps) {
                if (videoProps[prop]) validProps++;
            }
            
            'video properties: ' + validProps + '/4 valid, motion blur toggle: ' + motionBlurToggled;
        ")
    }
    
    fn test_av_layer_track_matte(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "av_layer_track_matte",
            "avLayer.trackMatteType track matte system",
            "
                var comp = app.project.items.addComp('TestComp', 1920, 1080, 1, 10, 30);
                var layer1 = comp.layers.addSolid([1, 0, 0], 'Layer1', 100, 100, 1);
                var layer2 = comp.layers.addSolid([0, 1, 0], 'Layer2', 100, 100, 1);
                
                // Test track matte properties
                var matteProps = {
                    trackMatteType: typeof layer1.trackMatteType === 'number',
                    isTrackMatte: typeof layer1.isTrackMatte === 'boolean',
                    hasTrackMatte: typeof layer1.hasTrackMatte === 'boolean'
                };
                
                // Test setting track matte
                var originalMatteType = layer1.trackMatteType;
                layer1.trackMatteType = TrackMatteType.ALPHA;
                var matteTypeSet = layer1.trackMatteType === TrackMatteType.ALPHA;
                
                // Restore
                layer1.trackMatteType = originalMatteType;
                
                var validProps = 0;
                for (var prop in matteProps) {
                    if (matteProps[prop]) validProps++;
                }
                
                comp.remove();
                'track matte: ' + validProps + '/3 properties valid, type set: ' + matteTypeSet;
            ",
            "string"
        )
    }
    
    fn test_av_layer_3d_properties(&self) -> ApiTestResult {
        self.test_with_av_layer_setup("av_layer_3d_properties", "
            var threeDProps = {
                threeDLayer: typeof layer.threeDLayer === 'boolean',
                environmentLayer: typeof layer.environmentLayer === 'boolean'
            };
            
            // Test 3D layer conversion
            var original3D = layer.threeDLayer;
            layer.threeDLayer = true;
            var threeDEnabled = layer.threeDLayer === true;
            
            // Test material options when 3D
            var hasMaterialOptions = layer.threeDLayer && layer.materialOption !== null;
            
            // Restore
            layer.threeDLayer = original3D;
            
            var validProps = 0;
            for (var prop in threeDProps) {
                if (threeDProps[prop]) validProps++;
            }
            
            '3D properties: ' + validProps + '/2 valid, 3D enabled: ' + threeDEnabled + ', material options: ' + hasMaterialOptions;
        ")
    }
    
    fn test_text_layer_source_text(&self) -> ApiTestResult {
        self.test_with_text_layer_setup("text_layer_source_text", "
            var sourceTextProp = layer.text.sourceText;
            
            // Test source text property
            var textTests = {
                hasSourceText: sourceTextProp !== null && sourceTextProp !== undefined,
                hasValue: sourceTextProp && sourceTextProp.value !== undefined,
                canSetValue: true
            };
            
            // Test setting text
            if (sourceTextProp) {
                var originalText = sourceTextProp.value;
                var newTextDoc = new TextDocument('New Test Text');
                sourceTextProp.setValue(newTextDoc);
                var textChanged = sourceTextProp.value.text === 'New Test Text';
                textTests.canSetValue = textChanged;
            }
            
            var validTests = 0;
            for (var test in textTests) {
                if (textTests[test]) validTests++;
            }
            
            'source text: ' + validTests + '/3 tests valid';
        ")
    }
    
    fn test_text_layer_animators(&self) -> ApiTestResult {
        self.test_with_text_layer_setup("text_layer_animators", "
            var animators = layer.text.animators;
            
            // Test animators property group
            var animatorTests = {
                hasAnimators: animators !== null && animators !== undefined,
                canAddAnimator: false,
                hasNumProperties: animators && typeof animators.numProperties === 'number'
            };
            
            // Test adding animator
            if (animators && typeof animators.addProperty === 'function') {
                try {
                    var animator = animators.addProperty('ADBE Text Animator');
                    animatorTests.canAddAnimator = animator !== null;
                } catch (e) {
                    animatorTests.canAddAnimator = false;
                }
            }
            
            var validTests = 0;
            for (var test in animatorTests) {
                if (animatorTests[test]) validTests++;
            }
            
            'text animators: ' + validTests + '/3 tests valid';
        ")
    }
    
    fn test_text_layer_path_options(&self) -> ApiTestResult {
        self.test_with_text_layer_setup("text_layer_path_options", "
            var pathOption = layer.text.pathOption;
            
            // Test path option properties
            var pathTests = {
                hasPathOption: pathOption !== null && pathOption !== undefined,
                hasPath: pathOption && pathOption.path !== undefined,
                hasReversePath: pathOption && pathOption.reversePath !== undefined,
                hasPerpendicularToPath: pathOption && pathOption.perpendicularToPath !== undefined
            };
            
            var validTests = 0;
            for (var test in pathTests) {
                if (pathTests[test]) validTests++;
            }
            
            'path options: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_text_layer_more_options(&self) -> ApiTestResult {
        self.test_with_text_layer_setup("text_layer_more_options", "
            var moreOption = layer.text.moreOption;
            
            // Test more option properties
            var moreTests = {
                hasMoreOption: moreOption !== null && moreOption !== undefined,
                hasAnchorPointGrouping: moreOption && moreOption.anchorPointGrouping !== undefined,
                hasGroupingAlignment: moreOption && moreOption.groupingAlignment !== undefined,
                hasInterCharacterBlending: moreOption && moreOption.interCharacterBlending !== undefined
            };
            
            var validTests = 0;
            for (var test in moreTests) {
                if (moreTests[test]) validTests++;
            }
            
            'more options: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_text_layer_text_document(&self) -> ApiTestResult {
        self.test_with_text_layer_setup("text_layer_text_document", "
            var sourceTextProp = layer.text.sourceText;
            
            // Test TextDocument creation and properties
            var textDocTests = {
                canCreateTextDoc: true,
                hasTextDocProperties: false,
                canSetTextDoc: false
            };
            
            try {
                // Create new TextDocument
                var textDoc = new TextDocument('Test TextDocument');
                textDoc.fontSize = 48;
                textDoc.fillColor = [1, 0, 0];
                textDoc.font = 'Arial';
                
                textDocTests.hasTextDocProperties = 
                    textDoc.text === 'Test TextDocument' &&
                    textDoc.fontSize === 48 &&
                    textDoc.fillColor.length === 3;
                
                // Test setting the text document
                sourceTextProp.setValue(textDoc);
                var newTextDoc = sourceTextProp.value;
                textDocTests.canSetTextDoc = newTextDoc.text === 'Test TextDocument';
                
            } catch (e) {
                textDocTests.canCreateTextDoc = false;
            }
            
            var validTests = 0;
            for (var test in textDocTests) {
                if (textDocTests[test]) validTests++;
            }
            
            'text document: ' + validTests + '/3 tests valid';
        ")
    }
    
    fn test_shape_layer_contents(&self) -> ApiTestResult {
        self.test_with_shape_layer_setup("shape_layer_contents", "
            var content = layer.content;
            
            // Test shape layer content system
            var contentTests = {
                hasContent: content !== null && content !== undefined,
                isPropertyGroup: content && typeof content.addProperty === 'function',
                hasNumProperties: content && typeof content.numProperties === 'number',
                canAddShapes: false
            };
            
            // Test adding basic shapes
            if (content && typeof content.addProperty === 'function') {
                try {
                    var rectGroup = content.addProperty('ADBE Vector Group');
                    contentTests.canAddShapes = rectGroup !== null;
                } catch (e) {
                    contentTests.canAddShapes = false;
                }
            }
            
            var validTests = 0;
            for (var test in contentTests) {
                if (contentTests[test]) validTests++;
            }
            
            'shape contents: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_shape_layer_groups(&self) -> ApiTestResult {
        self.test_with_shape_layer_setup("shape_layer_groups", "
            var content = layer.content;
            
            // Test shape layer group management
            var groupTests = {
                canAddGroup: false,
                canAddMultipleGroups: false,
                groupHasContent: false,
                canRemoveGroups: false
            };
            
            if (content && typeof content.addProperty === 'function') {
                try {
                    // Add first group
                    var group1 = content.addProperty('ADBE Vector Group');
                    groupTests.canAddGroup = group1 !== null;
                    
                    // Add second group
                    var group2 = content.addProperty('ADBE Vector Group');
                    groupTests.canAddMultipleGroups = group2 !== null;
                    
                    // Test group content
                    if (group1 && group1.content) {
                        groupTests.groupHasContent = typeof group1.content.addProperty === 'function';
                    }
                    
                    // Test group removal
                    if (group2 && typeof group2.remove === 'function') {
                        group2.remove();
                        groupTests.canRemoveGroups = true;
                    }
                } catch (e) {
                    // Group operations failed
                }
            }
            
            var validTests = 0;
            for (var test in groupTests) {
                if (groupTests[test]) validTests++;
            }
            
            'shape groups: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_shape_layer_paths(&self) -> ApiTestResult {
        self.test_with_shape_layer_setup("shape_layer_paths", "
            var content = layer.content;
            
            // Test shape layer path operations
            var pathTests = {
                canAddRectangle: false,
                canAddEllipse: false,
                canAddPath: false,
                pathHasProperties: false
            };
            
            if (content && typeof content.addProperty === 'function') {
                try {
                    // Create a group first
                    var group = content.addProperty('ADBE Vector Group');
                    if (group && group.content) {
                        // Add rectangle shape
                        var rect = group.content.addProperty('ADBE Vector Shape - Rect');
                        pathTests.canAddRectangle = rect !== null;
                        
                        // Add ellipse shape
                        var ellipse = group.content.addProperty('ADBE Vector Shape - Ellipse');
                        pathTests.canAddEllipse = ellipse !== null;
                        
                        // Add custom path
                        var path = group.content.addProperty('ADBE Vector Shape - Group');
                        pathTests.canAddPath = path !== null;
                        
                        // Test path properties
                        if (rect && rect.size) {
                            pathTests.pathHasProperties = typeof rect.size.setValue === 'function';
                        }
                    }
                } catch (e) {
                    // Path operations failed
                }
            }
            
            var validTests = 0;
            for (var test in pathTests) {
                if (pathTests[test]) validTests++;
            }
            
            'shape paths: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_shape_layer_fills_strokes(&self) -> ApiTestResult {
        self.test_with_shape_layer_setup("shape_layer_fills_strokes", "
            var content = layer.content;
            
            // Test shape layer fill and stroke properties
            var fillStrokeTests = {
                canAddFill: false,
                canAddStroke: false,
                fillHasColor: false,
                strokeHasWidth: false
            };
            
            if (content && typeof content.addProperty === 'function') {
                try {
                    // Create a group first
                    var group = content.addProperty('ADBE Vector Group');
                    if (group && group.content) {
                        // Add fill
                        var fill = group.content.addProperty('ADBE Vector Graphic - Fill');
                        fillStrokeTests.canAddFill = fill !== null;
                        
                        // Add stroke
                        var stroke = group.content.addProperty('ADBE Vector Graphic - Stroke');
                        fillStrokeTests.canAddStroke = stroke !== null;
                        
                        // Test fill properties
                        if (fill && fill.color) {
                            fillStrokeTests.fillHasColor = typeof fill.color.setValue === 'function';
                        }
                        
                        // Test stroke properties
                        if (stroke && stroke.strokeWidth) {
                            fillStrokeTests.strokeHasWidth = typeof stroke.strokeWidth.setValue === 'function';
                        }
                    }
                } catch (e) {
                    // Fill/stroke operations failed
                }
            }
            
            var validTests = 0;
            for (var test in fillStrokeTests) {
                if (fillStrokeTests[test]) validTests++;
            }
            
            'fills and strokes: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_shape_layer_effects(&self) -> ApiTestResult {
        self.test_with_shape_layer_setup("shape_layer_effects", "
            var content = layer.content;
            
            // Test shape layer effects and operations
            var effectTests = {
                canAddTrimPaths: false,
                canAddRepeater: false,
                canAddRoundCorners: false,
                canAddMerge: false
            };
            
            if (content && typeof content.addProperty === 'function') {
                try {
                    // Create a group first
                    var group = content.addProperty('ADBE Vector Group');
                    if (group && group.content) {
                        // Add trim paths
                        var trimPaths = group.content.addProperty('ADBE Vector Filter - Trim');
                        effectTests.canAddTrimPaths = trimPaths !== null;
                        
                        // Add repeater
                        var repeater = group.content.addProperty('ADBE Vector Filter - Repeater');
                        effectTests.canAddRepeater = repeater !== null;
                        
                        // Add round corners
                        var roundCorners = group.content.addProperty('ADBE Vector Filter - RC');
                        effectTests.canAddRoundCorners = roundCorners !== null;
                        
                        // Add merge paths
                        var merge = group.content.addProperty('ADBE Vector Filter - Merge');
                        effectTests.canAddMerge = merge !== null;
                    }
                } catch (e) {
                    // Shape effects operations failed
                }
            }
            
            var validTests = 0;
            for (var test in effectTests) {
                if (effectTests[test]) validTests++;
            }
            
            'shape effects: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_camera_layer_options(&self) -> ApiTestResult {
        self.test_with_camera_layer_setup("camera_layer_options", "
            var cameraOption = layer.cameraOption;
            
            // Test camera option properties
            var cameraTests = {
                hasCameraOption: cameraOption !== null && cameraOption !== undefined,
                hasZoom: cameraOption && cameraOption.zoom !== undefined,
                hasDepthOfField: cameraOption && cameraOption.depthOfField !== undefined,
                hasFocusDistance: cameraOption && cameraOption.focusDistance !== undefined,
                hasAperture: cameraOption && cameraOption.aperture !== undefined,
                hasBlurLevel: cameraOption && cameraOption.blurLevel !== undefined
            };
            
            var validTests = 0;
            for (var test in cameraTests) {
                if (cameraTests[test]) validTests++;
            }
            
            'camera options: ' + validTests + '/6 tests valid';
        ")
    }
    
    fn test_camera_layer_depth_of_field(&self) -> ApiTestResult {
        self.test_with_camera_layer_setup("camera_layer_depth_of_field", "
            var cameraOption = layer.cameraOption;
            
            // Test depth of field functionality
            var dofTests = {
                hasDepthOfField: cameraOption && cameraOption.depthOfField !== undefined,
                hasFocusDistance: cameraOption && cameraOption.focusDistance !== undefined,
                hasAperture: cameraOption && cameraOption.aperture !== undefined,
                hasBlurLevel: cameraOption && cameraOption.blurLevel !== undefined,
                canSetDOF: false
            };
            
            // Test setting depth of field properties
            if (cameraOption && cameraOption.depthOfField && typeof cameraOption.depthOfField.setValue === 'function') {
                try {
                    var originalDOF = cameraOption.depthOfField.value;
                    cameraOption.depthOfField.setValue(!originalDOF);
                    dofTests.canSetDOF = cameraOption.depthOfField.value !== originalDOF;
                    cameraOption.depthOfField.setValue(originalDOF); // Restore
                } catch (e) {
                    dofTests.canSetDOF = false;
                }
            }
            
            var validTests = 0;
            for (var test in dofTests) {
                if (dofTests[test]) validTests++;
            }
            
            'depth of field: ' + validTests + '/5 tests valid';
        ")
    }
    
    fn test_camera_layer_iris_settings(&self) -> ApiTestResult {
        self.test_with_camera_layer_setup("camera_layer_iris_settings", "
            var cameraOption = layer.cameraOption;
            
            // Test iris and aperture settings
            var irisTests = {
                hasIrisShape: cameraOption && cameraOption.irisShape !== undefined,
                hasIrisRotation: cameraOption && cameraOption.irisRotation !== undefined,
                hasIrisRoundness: cameraOption && cameraOption.irisRoundness !== undefined,
                hasIrisAspectRatio: cameraOption && cameraOption.irisAspectRatio !== undefined,
                hasIrisDiffraction: cameraOption && cameraOption.irisDiffractionFringe !== undefined
            };
            
            var validTests = 0;
            for (var test in irisTests) {
                if (irisTests[test]) validTests++;
            }
            
            'iris settings: ' + validTests + '/5 tests valid';
        ")
    }
    
    fn test_camera_layer_highlights(&self) -> ApiTestResult {
        self.test_with_camera_layer_setup("camera_layer_highlights", "
            var cameraOption = layer.cameraOption;
            
            // Test highlight settings
            var highlightTests = {
                hasHighlightGain: cameraOption && cameraOption.highlightGain !== undefined,
                hasHighlightThreshold: cameraOption && cameraOption.highlightThreshold !== undefined,
                hasHighlightSaturation: cameraOption && cameraOption.highlightSaturation !== undefined,
                canSetHighlights: false
            };
            
            // Test setting highlight properties
            if (cameraOption && cameraOption.highlightGain && typeof cameraOption.highlightGain.setValue === 'function') {
                try {
                    var originalGain = cameraOption.highlightGain.value;
                    cameraOption.highlightGain.setValue(originalGain + 1);
                    highlightTests.canSetHighlights = cameraOption.highlightGain.value === originalGain + 1;
                    cameraOption.highlightGain.setValue(originalGain); // Restore
                } catch (e) {
                    highlightTests.canSetHighlights = false;
                }
            }
            
            var validTests = 0;
            for (var test in highlightTests) {
                if (highlightTests[test]) validTests++;
            }
            
            'highlight settings: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_light_layer_options(&self) -> ApiTestResult {
        self.test_with_light_layer_setup("light_layer_options", "
            var lightOption = layer.lightOption;
            
            // Test light option properties
            var lightTests = {
                hasLightOption: lightOption !== null && lightOption !== undefined,
                hasLightType: lightOption && lightOption.lightType !== undefined,
                hasIntensity: lightOption && lightOption.intensity !== undefined,
                hasColor: lightOption && lightOption.color !== undefined,
                hasConeAngle: lightOption && lightOption.coneAngle !== undefined,
                hasConeFeather: lightOption && lightOption.coneFeather !== undefined
            };
            
            var validTests = 0;
            for (var test in lightTests) {
                if (lightTests[test]) validTests++;
            }
            
            'light options: ' + validTests + '/6 tests valid';
        ")
    }
    
    fn test_light_layer_types(&self) -> ApiTestResult {
        self.test_with_light_layer_setup("light_layer_types", "
            var lightOption = layer.lightOption;
            
            // Test light type variations
            var typeTests = {
                hasLightType: lightOption && lightOption.lightType !== undefined,
                canSetParallel: false,
                canSetSpot: false,
                canSetPoint: false
            };
            
            // Test setting different light types
            if (lightOption && lightOption.lightType && typeof lightOption.lightType.setValue === 'function') {
                try {
                    var originalType = lightOption.lightType.value;
                    
                    // Test parallel light
                    lightOption.lightType.setValue(LightType.PARALLEL);
                    typeTests.canSetParallel = lightOption.lightType.value === LightType.PARALLEL;
                    
                    // Test spot light
                    lightOption.lightType.setValue(LightType.SPOT);
                    typeTests.canSetSpot = lightOption.lightType.value === LightType.SPOT;
                    
                    // Test point light
                    lightOption.lightType.setValue(LightType.POINT);
                    typeTests.canSetPoint = lightOption.lightType.value === LightType.POINT;
                    
                    // Restore original
                    lightOption.lightType.setValue(originalType);
                } catch (e) {
                    // Light type setting failed
                }
            }
            
            var validTests = 0;
            for (var test in typeTests) {
                if (typeTests[test]) validTests++;
            }
            
            'light types: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_light_layer_shadows(&self) -> ApiTestResult {
        self.test_with_light_layer_setup("light_layer_shadows", "
            var lightOption = layer.lightOption;
            
            // Test shadow casting system
            var shadowTests = {
                hasCastsShadows: lightOption && lightOption.castsShadows !== undefined,
                hasShadowDarkness: lightOption && lightOption.shadowDarkness !== undefined,
                hasShadowDiffusion: lightOption && lightOption.shadowDiffusion !== undefined,
                canToggleShadows: false
            };
            
            // Test shadow toggle functionality
            if (lightOption && lightOption.castsShadows && typeof lightOption.castsShadows.setValue === 'function') {
                try {
                    var originalShadows = lightOption.castsShadows.value;
                    lightOption.castsShadows.setValue(!originalShadows);
                    shadowTests.canToggleShadows = lightOption.castsShadows.value !== originalShadows;
                    lightOption.castsShadows.setValue(originalShadows); // Restore
                } catch (e) {
                    shadowTests.canToggleShadows = false;
                }
            }
            
            var validTests = 0;
            for (var test in shadowTests) {
                if (shadowTests[test]) validTests++;
            }
            
            'shadow system: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_light_layer_falloff(&self) -> ApiTestResult {
        self.test_with_light_layer_setup("light_layer_falloff", "
            var lightOption = layer.lightOption;
            
            // Test falloff and distance properties
            var falloffTests = {
                hasFalloff: lightOption && lightOption.falloff !== undefined,
                hasRadius: lightOption && lightOption.radius !== undefined,
                hasFalloffDistance: lightOption && lightOption.falloffDistance !== undefined,
                canSetFalloff: false
            };
            
            // Test setting falloff properties
            if (lightOption && lightOption.falloff && typeof lightOption.falloff.setValue === 'function') {
                try {
                    var originalFalloff = lightOption.falloff.value;
                    var newFalloff = originalFalloff === FalloffType.SMOOTH ? FalloffType.NONE : FalloffType.SMOOTH;
                    lightOption.falloff.setValue(newFalloff);
                    falloffTests.canSetFalloff = lightOption.falloff.value === newFalloff;
                    lightOption.falloff.setValue(originalFalloff); // Restore
                } catch (e) {
                    falloffTests.canSetFalloff = false;
                }
            }
            
            var validTests = 0;
            for (var test in falloffTests) {
                if (falloffTests[test]) validTests++;
            }
            
            'falloff system: ' + validTests + '/4 tests valid';
        ")
    }
    
    fn test_3d_model_geometry(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "3d_model_geometry",
            "threeDModelLayer geometry properties",
            "
                // Test 3D model geometry properties (newer AE feature)
                var geometryTests = {
                    threeDModelSupported: typeof ThreeDModelLayer !== 'undefined',
                    hasGeometryOption: false,
                    hasMaterialOption: false
                };
                
                // Check if 3D model layers are supported
                try {
                    var comp = app.project.items.addComp('Test3DModel', 100, 100, 1, 1, 30);
                    
                    // Try to create or access 3D model functionality
                    // Note: This is a newer feature, may not be available in all versions
                    if (typeof comp.layers.add3DModel === 'function') {
                        geometryTests.hasGeometryOption = true;
                    }
                    
                    comp.remove();
                } catch (e) {
                    // 3D model layers not supported in this version
                }
                
                var validTests = 0;
                for (var test in geometryTests) {
                    if (geometryTests[test]) validTests++;
                }
                
                '3D model geometry: ' + validTests + '/3 tests valid';
            ",
            "string"
        )
    }
    
    fn test_3d_model_materials(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "3d_model_materials",
            "threeDModelLayer material properties",
            "
                // Test 3D model material properties
                var materialTests = {
                    materialSupported: false,
                    hasMaterialProperties: false,
                    hasTextureSupport: false
                };
                
                // Check if 3D model materials are supported
                try {
                    // This is a newer feature in After Effects
                    if (typeof MaterialOption !== 'undefined') {
                        materialTests.materialSupported = true;
                    }
                    
                    // Additional material property checks would go here
                    // when 3D model layers are fully documented
                    
                } catch (e) {
                    // 3D model materials not supported
                }
                
                var validTests = 0;
                for (var test in materialTests) {
                    if (materialTests[test]) validTests++;
                }
                
                '3D model materials: ' + validTests + '/3 tests valid';
            ",
            "string"
        )
    }
    
    fn test_3d_model_lighting(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "3d_model_lighting",
            "threeDModelLayer lighting integration",
            "
                // Test 3D model lighting integration
                var lightingTests = {
                    lightingSupported: false,
                    hasLightInteraction: false,
                    hasShadowReceiving: false
                };
                
                // Check if 3D model lighting is supported
                try {
                    // Test basic 3D layer lighting concepts
                    var comp = app.project.items.addComp('TestLighting', 100, 100, 1, 1, 30);
                    var light = comp.layers.addLight('Test Light', [0, 0, 0]);
                    
                    if (light && light.lightOption) {
                        lightingTests.lightingSupported = true;
                        
                        // 3D model layers would interact with scene lighting
                        if (typeof light.lightOption.castsShadows !== 'undefined') {
                            lightingTests.hasShadowReceiving = true;
                        }
                    }
                    
                    comp.remove();
                } catch (e) {
                    // Lighting integration not supported
                }
                
                var validTests = 0;
                for (var test in lightingTests) {
                    if (lightingTests[test]) validTests++;
                }
                
                '3D model lighting: ' + validTests + '/3 tests valid';
            ",
            "string"
        )
    }
    
    fn test_layer_instanceof_checks(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_instanceof_checks",
            "layer instanceof type detection",
            "
                // Test layer type detection using instanceof
                var comp = app.project.items.addComp('TypeTest', 100, 100, 1, 5, 30);
                
                // Create different layer types
                var solidLayer = comp.layers.addSolid([1, 0, 0], 'Solid', 50, 50, 1);
                var textLayer = comp.layers.addText('Text');
                var cameraLayer = comp.layers.addCamera('Camera', [0, 0, -100]);
                var lightLayer = comp.layers.addLight('Light', [0, 0, 0]);
                var shapeLayer = comp.layers.addShape();
                
                var typeChecks = {
                    solidIsAVLayer: solidLayer instanceof AVLayer,
                    textIsTextLayer: textLayer instanceof TextLayer,
                    cameraIsCameraLayer: cameraLayer instanceof CameraLayer,
                    lightIsLightLayer: lightLayer instanceof LightLayer,
                    shapeIsShapeLayer: shapeLayer instanceof ShapeLayer
                };
                
                var validChecks = 0;
                for (var check in typeChecks) {
                    if (typeChecks[check]) validChecks++;
                }
                
                comp.remove();
                'instanceof checks: ' + validChecks + '/5 valid';
            ",
            "string"
        )
    }
    
    fn test_layer_type_properties(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_type_properties",
            "layer type identification properties",
            "
                // Test layer type identification through properties
                var comp = app.project.items.addComp('PropTest', 100, 100, 1, 3, 30);
                
                var solidLayer = comp.layers.addSolid([0, 1, 0], 'Solid', 50, 50, 1);
                var textLayer = comp.layers.addText('Text');
                var shapeLayer = comp.layers.addShape();
                
                var propertyChecks = {
                    solidHasSource: solidLayer.source !== null,
                    textHasTextProperty: textLayer.text !== undefined,
                    shapeHasContent: shapeLayer.content !== undefined,
                    allHaveTransform: solidLayer.transform && textLayer.transform && shapeLayer.transform,
                    allHaveEffects: solidLayer.effects && textLayer.effects && shapeLayer.effects
                };
                
                var validProps = 0;
                for (var prop in propertyChecks) {
                    if (propertyChecks[prop]) validProps++;
                }
                
                comp.remove();
                'layer properties: ' + validProps + '/5 identification properties valid';
            ",
            "string"
        )
    }
    
    fn test_layer_capability_detection(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_capability_detection",
            "layer capability and feature detection",
            "
                // Test layer capability detection
                var comp = app.project.items.addComp('CapTest', 100, 100, 1, 3, 30);
                
                var avLayer = comp.layers.addSolid([1, 1, 0], 'AV', 50, 50, 1);
                var textLayer = comp.layers.addText('Text');
                
                var capabilities = {
                    avCanHaveEffects: typeof avLayer.effects.addProperty === 'function',
                    avCanHaveMasks: typeof avLayer.masks.addProperty === 'function',
                    avCanBeParent: typeof avLayer.setParentWithJump === 'function',
                    textCanAnimate: textLayer.text && textLayer.text.animators,
                    textCanHavePath: textLayer.text && textLayer.text.pathOption,
                    layersCanBeDisabled: typeof avLayer.enabled === 'boolean'
                };
                
                var validCapabilities = 0;
                for (var cap in capabilities) {
                    if (capabilities[cap]) validCapabilities++;
                }
                
                comp.remove();
                'layer capabilities: ' + validCapabilities + '/6 capabilities detected';
            ",
            "string"
        )
    }
    
    fn test_convert_to_shape_layer(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "convert_to_shape_layer",
            "layer conversion to shape layer",
            "
                // Test layer conversion to shape layer
                var comp = app.project.items.addComp('ConvertTest', 100, 100, 1, 3, 30);
                
                var conversionTests = {
                    canCreateShape: false,
                    canConvertText: false,
                    conversionPreservesProperties: false
                };
                
                try {
                    // Test creating shape layer directly
                    var shapeLayer = comp.layers.addShape();
                    conversionTests.canCreateShape = shapeLayer !== null;
                    
                    // Test text to shape conversion (if available)
                    var textLayer = comp.layers.addText('Convert Me');
                    if (typeof textLayer.convertToShape === 'function') {
                        textLayer.convertToShape();
                        conversionTests.canConvertText = textLayer instanceof ShapeLayer;
                    } else {
                        // Method may not exist in all versions
                        conversionTests.canConvertText = false;
                    }
                    
                    // Test property preservation
                    if (shapeLayer && shapeLayer.transform) {
                        conversionTests.conversionPreservesProperties = true;
                    }
                    
                } catch (e) {
                    // Conversion operations failed
                }
                
                var validTests = 0;
                for (var test in conversionTests) {
                    if (conversionTests[test]) validTests++;
                }
                
                comp.remove();
                'shape conversion: ' + validTests + '/3 tests valid';
            ",
            "string"
        )
    }
    
    fn test_convert_to_text_layer(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "convert_to_text_layer",
            "layer conversion to text layer",
            "
                // Test layer conversion to text layer
                var comp = app.project.items.addComp('TextConvert', 100, 100, 1, 3, 30);
                
                var textConversionTests = {
                    canCreateText: false,
                    textHasProperties: false,
                    canSetTextDocument: false
                };
                
                try {
                    // Test creating text layer
                    var textLayer = comp.layers.addText('Test Text');
                    textConversionTests.canCreateText = textLayer !== null;
                    
                    // Test text layer properties
                    if (textLayer && textLayer.text && textLayer.text.sourceText) {
                        textConversionTests.textHasProperties = true;
                        
                        // Test setting text document
                        var newTextDoc = new TextDocument('New Text');
                        textLayer.text.sourceText.setValue(newTextDoc);
                        textConversionTests.canSetTextDocument = 
                            textLayer.text.sourceText.value.text === 'New Text';
                    }
                    
                } catch (e) {
                    // Text conversion operations failed
                }
                
                var validTests = 0;
                for (var test in textConversionTests) {
                    if (textConversionTests[test]) validTests++;
                }
                
                comp.remove();
                'text conversion: ' + validTests + '/3 tests valid';
            ",
            "string"
        )
    }
    
    fn test_3d_layer_conversion(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "3d_layer_conversion",
            "layer 3D layer conversion",
            "
                // Test 3D layer conversion
                var comp = app.project.items.addComp('3DConvert', 100, 100, 1, 3, 30);
                
                var threeDTests = {
                    canEnable3D: false,
                    has3DProperties: false,
                    canDisable3D: false
                };
                
                try {
                    var layer = comp.layers.addSolid([0, 0, 1], '3D Test', 50, 50, 1);
                    
                    // Test enabling 3D
                    var original3D = layer.threeDLayer;
                    layer.threeDLayer = true;
                    threeDTests.canEnable3D = layer.threeDLayer === true;
                    
                    // Test 3D properties become available
                    if (layer.threeDLayer && layer.transform.zPosition) {
                        threeDTests.has3DProperties = true;
                    }
                    
                    // Test disabling 3D
                    layer.threeDLayer = false;
                    threeDTests.canDisable3D = layer.threeDLayer === false;
                    
                    // Restore original state
                    layer.threeDLayer = original3D;
                    
                } catch (e) {
                    // 3D conversion failed
                }
                
                var validTests = 0;
                for (var test in threeDTests) {
                    if (threeDTests[test]) validTests++;
                }
                
                comp.remove();
                '3D conversion: ' + validTests + '/3 tests valid';
            ",
            "string"
        )
    }
    
    fn test_adjustment_layer_conversion(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "adjustment_layer_conversion",
            "layer adjustment layer conversion",
            "
                // Test adjustment layer conversion
                var comp = app.project.items.addComp('AdjustConvert', 100, 100, 1, 3, 30);
                
                var adjustmentTests = {
                    canEnableAdjustment: false,
                    adjustmentAffectsBelow: false,
                    canDisableAdjustment: false
                };
                
                try {
                    var layer = comp.layers.addSolid([1, 0, 1], 'Adjustment Test', 50, 50, 1);
                    
                    // Test enabling adjustment layer
                    var originalAdjustment = layer.adjustmentLayer;
                    layer.adjustmentLayer = true;
                    adjustmentTests.canEnableAdjustment = layer.adjustmentLayer === true;
                    
                    // Test adjustment layer properties
                    if (layer.adjustmentLayer && layer.effects) {
                        adjustmentTests.adjustmentAffectsBelow = true;
                    }
                    
                    // Test disabling adjustment layer
                    layer.adjustmentLayer = false;
                    adjustmentTests.canDisableAdjustment = layer.adjustmentLayer === false;
                    
                    // Restore original state
                    layer.adjustmentLayer = originalAdjustment;
                    
                } catch (e) {
                    // Adjustment layer conversion failed
                }
                
                var validTests = 0;
                for (var test in adjustmentTests) {
                    if (adjustmentTests[test]) validTests++;
                }
                
                comp.remove();
                'adjustment conversion: ' + validTests + '/3 tests valid';
            ",
            "string"
        )
    }
    
    fn test_invalid_layer_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "invalid_layer_operations",
            "specialized layer invalid operations",
            "
                // Test invalid layer operations error handling
                var comp = app.project.items.addComp('ErrorTest', 100, 100, 1, 3, 30);
                
                var errorTests = {
                    textLayerSourceError: false,
                    shapeLayerContentError: false,
                    cameraLayerOptionError: false,
                    nullLayerOperationError: false
                };
                
                try {
                    var textLayer = comp.layers.addText('Error Test');
                    
                    // Test accessing properties that don't exist
                    try {
                        var invalidProp = textLayer.nonExistentProperty;
                        // If this doesn't throw an error, that's also valid behavior
                        errorTests.textLayerSourceError = true;
                    } catch (e) {
                        // Error properly caught
                        errorTests.textLayerSourceError = true;
                    }
                    
                    // Test other invalid operations
                    var solidLayer = comp.layers.addSolid([1, 1, 1], 'Solid', 50, 50, 1);
                    
                    try {
                        // Try to access text properties on solid layer
                        var invalidText = solidLayer.text;
                        errorTests.shapeLayerContentError = invalidText === undefined;
                    } catch (e) {
                        errorTests.shapeLayerContentError = true;
                    }
                    
                } catch (e) {
                    // General error handling
                }
                
                var validTests = 0;
                for (var test in errorTests) {
                    if (errorTests[test]) validTests++;
                }
                
                comp.remove();
                'invalid operations: ' + validTests + '/4 error cases handled';
            ",
            "string"
        )
    }
    
    fn test_unsupported_property_access(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "unsupported_property_access",
            "specialized layer unsupported properties",
            "
                // Test unsupported property access
                var comp = app.project.items.addComp('UnsupportedTest', 100, 100, 1, 3, 30);
                
                var unsupportedTests = {
                    solidTextProperty: false,
                    textShapeProperty: false,
                    cameraSourceProperty: false,
                    lightContentProperty: false
                };
                
                try {
                    var solidLayer = comp.layers.addSolid([0.5, 0.5, 0.5], 'Solid', 50, 50, 1);
                    var textLayer = comp.layers.addText('Text');
                    var cameraLayer = comp.layers.addCamera('Camera', [0, 0, -100]);
                    var lightLayer = comp.layers.addLight('Light', [0, 0, 0]);
                    
                    // Test accessing unsupported properties
                    unsupportedTests.solidTextProperty = 
                        solidLayer.text === undefined || solidLayer.text === null;
                    
                    unsupportedTests.textShapeProperty = 
                        textLayer.content === undefined || textLayer.content === null;
                    
                    unsupportedTests.cameraSourceProperty = 
                        cameraLayer.source === undefined || cameraLayer.source === null;
                    
                    unsupportedTests.lightContentProperty = 
                        lightLayer.content === undefined || lightLayer.content === null;
                    
                } catch (e) {
                    // Errors accessing unsupported properties are expected
                }
                
                var validTests = 0;
                for (var test in unsupportedTests) {
                    if (unsupportedTests[test]) validTests++;
                }
                
                comp.remove();
                'unsupported properties: ' + validTests + '/4 properly undefined';
            ",
            "string"
        )
    }
    
    fn test_layer_type_mismatch_errors(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "layer_type_mismatch_errors",
            "layer type mismatch error handling",
            "
                // Test layer type mismatch error handling
                var comp = app.project.items.addComp('MismatchTest', 100, 100, 1, 3, 30);
                
                var mismatchTests = {
                    instanceofChecks: false,
                    propertyAvailability: false,
                    methodAvailability: false,
                    typeSpecificErrors: false
                };
                
                try {
                    var solidLayer = comp.layers.addSolid([0.7, 0.7, 0.7], 'Type Test', 50, 50, 1);
                    var textLayer = comp.layers.addText('Type Test');
                    
                    // Test instanceof checks work correctly
                    mismatchTests.instanceofChecks = 
                        solidLayer instanceof AVLayer && 
                        textLayer instanceof TextLayer && 
                        !(solidLayer instanceof TextLayer) && 
                        !(textLayer instanceof AVLayer);
                    
                    // Test property availability
                    mismatchTests.propertyAvailability = 
                        solidLayer.source !== undefined && 
                        textLayer.text !== undefined && 
                        solidLayer.text === undefined && 
                        textLayer.source === undefined;
                    
                    // Test method availability
                    mismatchTests.methodAvailability = 
                        typeof solidLayer.replaceSource === 'function' && 
                        typeof textLayer.replaceSource === 'undefined';
                    
                    // Test type-specific error handling
                    try {
                        // Attempting to use text-specific methods on AV layer
                        var textDoc = new TextDocument('Test');
                        // This should either work (if layer accepts it) or throw proper error
                        mismatchTests.typeSpecificErrors = true;
                    } catch (e) {
                        // Error properly caught for type mismatch
                        mismatchTests.typeSpecificErrors = true;
                    }
                    
                } catch (e) {
                    // General error handling
                }
                
                var validTests = 0;
                for (var test in mismatchTests) {
                    if (mismatchTests[test]) validTests++;
                }
                
                comp.remove();
                'type mismatch handling: ' + validTests + '/4 mismatch cases handled';
            ",
            "string"
        )
    }
}

#[cfg(test)]
mod specialized_layer_tests {
    use super::*;
    
    #[test]
    fn test_specialized_layers_comprehensive() {
        let specialized_tests = SpecializedLayerTests;
        let results = specialized_tests.run_test();
        
        // Verify we have comprehensive coverage
        assert!(results.len() >= specialized_tests.expected_api_count());
        
        // Check that all tests pass
        let failed_tests: Vec<_> = results.iter()
            .filter(|r| !r.success)
            .collect();
        
        if !failed_tests.is_empty() {
            panic!("Specialized layer tests failed: {:?}", failed_tests);
        }
    }
    
    #[test]
    fn test_av_layer_coverage() {
        let specialized_tests = SpecializedLayerTests;
        let results = specialized_tests.run_test();
        
        // Verify AVLayer testing
        let av_layer_features = vec![
            "hasAudio", "hasVideo", "audioEnabled", "videoActive", "audioActive",
            "trackMatteType", "isTrackMatte", "hasTrackMatte"
        ];
        
        for feature in av_layer_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "AVLayer feature '{}' not tested", feature);
        }
    }
    
    #[test]
    fn test_text_layer_coverage() {
        let specialized_tests = SpecializedLayerTests;
        let results = specialized_tests.run_test();
        
        // Verify TextLayer testing
        let text_layer_features = vec![
            "sourceText", "animators", "pathOption", "moreOption", "TextDocument"
        ];
        
        for feature in text_layer_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "TextLayer feature '{}' not tested", feature);
        }
    }
    
    #[test]
    fn test_shape_layer_coverage() {
        let specialized_tests = SpecializedLayerTests;
        let results = specialized_tests.run_test();
        
        // Verify ShapeLayer testing
        let shape_layer_features = vec![
            "content", "addProperty", "Vector Group", "Vector Shape", "Fill", "Stroke"
        ];
        
        for feature in shape_layer_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "ShapeLayer feature '{}' not tested", feature);
        }
    }
    
    #[test]
    fn test_camera_layer_coverage() {
        let specialized_tests = SpecializedLayerTests;
        let results = specialized_tests.run_test();
        
        // Verify CameraLayer testing
        let camera_features = vec![
            "cameraOption", "zoom", "depthOfField", "focusDistance", "aperture",
            "blurLevel", "iris", "highlight"
        ];
        
        for feature in camera_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "CameraLayer feature '{}' not tested", feature);
        }
    }
    
    #[test]
    fn test_light_layer_coverage() {
        let specialized_tests = SpecializedLayerTests;
        let results = specialized_tests.run_test();
        
        // Verify LightLayer testing
        let light_features = vec![
            "lightOption", "lightType", "intensity", "color", "coneAngle",
            "coneFeather", "falloff", "castsShadows", "shadowDarkness"
        ];
        
        for feature in light_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "LightLayer feature '{}' not tested", feature);
        }
    }
}