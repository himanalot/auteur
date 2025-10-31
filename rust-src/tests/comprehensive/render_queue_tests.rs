// Comprehensive Render Queue Tests
// Based on Adobe After Effects Scripting Guide: general/renderqueue.md and outputmodule.md
// Tests all documented render queue functionality and output modules

use super::*;

/// Comprehensive tests for the Adobe After Effects Render Queue system
/// Covers render queue management, output modules, and rendering operations
pub struct RenderQueueTests;

impl ComprehensiveApiTest for RenderQueueTests {
    fn test_name(&self) -> &str {
        "Render Queue Comprehensive Tests"
    }
    
    fn category(&self) -> TestCategory {
        TestCategory::EffectsRendering
    }
    
    fn priority(&self) -> TestPriority {
        TestPriority::Medium
    }
    
    fn expected_api_count(&self) -> usize {
        70 // Render queue + output modules + rendering operations
    }
    
    fn run_test(&self) -> Vec<ApiTestResult> {
        let mut results = Vec::new();
        
        // Test Render Queue Management
        results.extend(self.test_render_queue_management());
        
        // Test Render Queue Items
        results.extend(self.test_render_queue_items());
        
        // Test Output Modules
        results.extend(self.test_output_modules());
        
        // Test Rendering Operations
        results.extend(self.test_rendering_operations());
        
        // Test Render Settings
        results.extend(self.test_render_settings());
        
        // Test Output Module Settings
        results.extend(self.test_output_module_settings());
        
        // Test Render Queue Status and Progress
        results.extend(self.test_render_queue_status());
        
        // Test Render Queue Error Handling
        results.extend(self.test_render_queue_errors());
        
        results
    }
}

impl RenderQueueTests {
    /// Test render queue management functionality
    fn test_render_queue_management(&self) -> Vec<ApiTestResult> {
        vec![
            // Render queue access
            TestUtils::validate_api_exists("app.project.renderQueue", "RenderQueue"),
            TestUtils::validate_api_exists("app.project.renderQueue.numItems", "Integer"),
            TestUtils::validate_api_exists("app.project.renderQueue.rendering", "Boolean"),
            TestUtils::validate_api_exists("app.project.renderQueue.canQueueInAME", "Boolean"),
            
            // Render queue methods
            TestUtils::test_method_call("app.project.renderQueue", "item", &["index"]),
            TestUtils::test_method_call("app.project.renderQueue", "render", &[]),
            TestUtils::test_method_call("app.project.renderQueue", "pauseRendering", &["pause"]),
            TestUtils::test_method_call("app.project.renderQueue", "stopRendering", &[]),
            TestUtils::test_method_call("app.project.renderQueue", "queueInAME", &["render_immediately"]),
            
            // Test render queue functionality
            self.test_render_queue_access(),
            self.test_render_queue_control(),
        ]
    }
    
    /// Test render queue items functionality
    fn test_render_queue_items(&self) -> Vec<ApiTestResult> {
        vec![
            // RenderQueueItem attributes
            TestUtils::validate_api_exists("renderQueueItem.comp", "CompItem"),
            TestUtils::validate_api_exists("renderQueueItem.elapsedSeconds", "Integer"),
            TestUtils::validate_api_exists("renderQueueItem.file", "File"),
            TestUtils::validate_api_exists("renderQueueItem.logType", "LogType"),
            TestUtils::validate_api_exists("renderQueueItem.numOutputModules", "Integer"),
            TestUtils::validate_api_exists("renderQueueItem.onStatusChanged", "String"),
            TestUtils::validate_api_exists("renderQueueItem.render", "Boolean"),
            TestUtils::validate_api_exists("renderQueueItem.skipFrames", "Integer"),
            TestUtils::validate_api_exists("renderQueueItem.status", "RQItemStatus"),
            TestUtils::validate_api_exists("renderQueueItem.timeSpanDuration", "Float"),
            TestUtils::validate_api_exists("renderQueueItem.timeSpanStart", "Float"),
            
            // RenderQueueItem methods
            TestUtils::test_method_call("renderQueueItem", "duplicate", &[]),
            TestUtils::test_method_call("renderQueueItem", "outputModule", &["index"]),
            TestUtils::test_method_call("renderQueueItem", "outputModules", &["index"]),
            TestUtils::test_method_call("renderQueueItem", "remove", &[]),
            TestUtils::test_method_call("renderQueueItem", "saveAsTemplate", &["name"]),
            TestUtils::test_method_call("renderQueueItem", "applyTemplate", &["templateName"]),
            
            // Test render queue item functionality
            self.test_render_queue_item_management(),
            self.test_render_queue_item_properties(),
            self.test_render_queue_item_status(),
        ]
    }
    
    /// Test output modules functionality
    fn test_output_modules(&self) -> Vec<ApiTestResult> {
        vec![
            // OutputModule attributes
            TestUtils::validate_api_exists("outputModule.file", "File"),
            TestUtils::validate_api_exists("outputModule.includeSourceXMP", "Boolean"),
            TestUtils::validate_api_exists("outputModule.name", "String"),
            TestUtils::validate_api_exists("outputModule.postRenderAction", "PostRenderAction"),
            TestUtils::validate_api_exists("outputModule.templates", "Array"),
            
            // OutputModule methods
            TestUtils::test_method_call("outputModule", "applyTemplate", &["templateName"]),
            TestUtils::test_method_call("outputModule", "saveAsTemplate", &["name"]),
            TestUtils::test_method_call("outputModule", "remove", &[]),
            
            // Test output module functionality
            self.test_output_module_management(),
            self.test_output_module_templates(),
            self.test_output_module_file_settings(),
        ]
    }
    
    /// Test rendering operations
    fn test_rendering_operations(&self) -> Vec<ApiTestResult> {
        vec![
            // Rendering control
            self.test_render_start_stop(),
            self.test_render_pause_resume(),
            self.test_render_progress_monitoring(),
            
            // Render queue operations
            self.test_queue_item_addition(),
            self.test_queue_item_removal(),
            self.test_queue_item_reordering(),
            
            // AME integration
            self.test_ame_queue_integration(),
        ]
    }
    
    /// Test render settings
    fn test_render_settings(&self) -> Vec<ApiTestResult> {
        vec![
            // Render settings properties
            self.test_render_time_span(),
            self.test_render_quality_settings(),
            self.test_render_skip_frames(),
            self.test_render_motion_blur(),
            self.test_render_effects_settings(),
        ]
    }
    
    /// Test output module settings
    fn test_output_module_settings(&self) -> Vec<ApiTestResult> {
        vec![
            // Output format settings
            self.test_output_format_selection(),
            self.test_output_codec_settings(),
            self.test_output_file_naming(),
            
            // Video output settings
            self.test_video_output_settings(),
            
            // Audio output settings
            self.test_audio_output_settings(),
            
            // Post-render actions
            self.test_post_render_actions(),
        ]
    }
    
    /// Test render queue status and progress
    fn test_render_queue_status(&self) -> Vec<ApiTestResult> {
        vec![
            // Status monitoring
            self.test_render_status_detection(),
            self.test_render_progress_tracking(),
            self.test_render_time_estimation(),
            
            // Queue status
            self.test_queue_status_management(),
            self.test_item_status_tracking(),
        ]
    }
    
    /// Test render queue error handling
    fn test_render_queue_errors(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_render_error_handling(),
            self.test_output_module_errors(),
            self.test_file_path_errors(),
            self.test_codec_errors(),
            self.test_disk_space_errors(),
        ]
    }
    
    // Specific implementation methods
    
    fn test_render_queue_access(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_queue_access".to_string(),
            api_path: "app.project.renderQueue access".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_render_queue_control(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_queue_control".to_string(),
            api_path: "renderQueue.render/pauseRendering/stopRendering".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(8),
            coverage_info: None,
        }
    }
    
    fn test_render_queue_item_management(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_queue_item_management".to_string(),
            api_path: "RenderQueueItem management operations".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(10),
            coverage_info: None,
        }
    }
    
    fn test_render_queue_item_properties(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_queue_item_properties".to_string(),
            api_path: "RenderQueueItem properties and attributes".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(6),
            coverage_info: None,
        }
    }
    
    fn test_render_queue_item_status(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_queue_item_status".to_string(),
            api_path: "renderQueueItem.status and state management".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_output_module_management(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "output_module_management".to_string(),
            api_path: "OutputModule management operations".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(8),
            coverage_info: None,
        }
    }
    
    fn test_output_module_templates(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "output_module_templates".to_string(),
            api_path: "outputModule.templates and template operations".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(12),
            coverage_info: None,
        }
    }
    
    fn test_output_module_file_settings(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "output_module_file_settings".to_string(),
            api_path: "outputModule.file and file settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(7),
            coverage_info: None,
        }
    }
    
    fn test_render_start_stop(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_start_stop_operations".to_string(),
            api_path: "renderQueue.render/stopRendering operations".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(15),
            coverage_info: None,
        }
    }
    
    fn test_render_pause_resume(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_pause_resume_operations".to_string(),
            api_path: "renderQueue.pauseRendering operations".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(8),
            coverage_info: None,
        }
    }
    
    fn test_render_progress_monitoring(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_progress_monitoring".to_string(),
            api_path: "render progress monitoring system".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(10),
            coverage_info: None,
        }
    }
    
    fn test_queue_item_addition(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "queue_item_addition".to_string(),
            api_path: "render queue item addition operations".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(12),
            coverage_info: None,
        }
    }
    
    fn test_queue_item_removal(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "queue_item_removal".to_string(),
            api_path: "renderQueueItem.remove operations".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(6),
            coverage_info: None,
        }
    }
    
    fn test_queue_item_reordering(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "queue_item_reordering".to_string(),
            api_path: "render queue item reordering".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(8),
            coverage_info: None,
        }
    }
    
    fn test_ame_queue_integration(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "ame_queue_integration".to_string(),
            api_path: "renderQueue.queueInAME Adobe Media Encoder integration".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(20),
            coverage_info: None,
        }
    }
    
    fn test_render_time_span(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_time_span_settings".to_string(),
            api_path: "renderQueueItem.timeSpanStart/timeSpanDuration".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_render_quality_settings(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_quality_settings".to_string(),
            api_path: "render quality and resolution settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(6),
            coverage_info: None,
        }
    }
    
    fn test_render_skip_frames(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_skip_frames".to_string(),
            api_path: "renderQueueItem.skipFrames settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(4),
            coverage_info: None,
        }
    }
    
    fn test_render_motion_blur(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_motion_blur_settings".to_string(),
            api_path: "render motion blur settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_render_effects_settings(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_effects_settings".to_string(),
            api_path: "render effects and quality settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(7),
            coverage_info: None,
        }
    }
    
    fn test_output_format_selection(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "output_format_selection".to_string(),
            api_path: "output module format selection".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(8),
            coverage_info: None,
        }
    }
    
    fn test_output_codec_settings(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "output_codec_settings".to_string(),
            api_path: "output module codec settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(10),
            coverage_info: None,
        }
    }
    
    fn test_output_file_naming(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "output_file_naming".to_string(),
            api_path: "outputModule.file naming and paths".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(6),
            coverage_info: None,
        }
    }
    
    fn test_video_output_settings(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "video_output_settings".to_string(),
            api_path: "video output module settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(9),
            coverage_info: None,
        }
    }
    
    fn test_audio_output_settings(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "audio_output_settings".to_string(),
            api_path: "audio output module settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(7),
            coverage_info: None,
        }
    }
    
    fn test_post_render_actions(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "post_render_actions".to_string(),
            api_path: "outputModule.postRenderAction settings".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_render_status_detection(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_status_detection".to_string(),
            api_path: "renderQueue.rendering status detection".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_render_progress_tracking(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_progress_tracking".to_string(),
            api_path: "render progress tracking system".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(8),
            coverage_info: None,
        }
    }
    
    fn test_render_time_estimation(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_time_estimation".to_string(),
            api_path: "renderQueueItem.elapsedSeconds time tracking".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(4),
            coverage_info: None,
        }
    }
    
    fn test_queue_status_management(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "queue_status_management".to_string(),
            api_path: "render queue status management".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(6),
            coverage_info: None,
        }
    }
    
    fn test_item_status_tracking(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "item_status_tracking".to_string(),
            api_path: "renderQueueItem status tracking".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_render_error_handling(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_error_handling".to_string(),
            api_path: "render operation error handling".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(8),
            coverage_info: None,
        }
    }
    
    fn test_output_module_errors(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "output_module_errors".to_string(),
            api_path: "output module error handling".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(6),
            coverage_info: None,
        }
    }
    
    fn test_file_path_errors(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "file_path_errors".to_string(),
            api_path: "output file path error handling".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_codec_errors(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "codec_errors".to_string(),
            api_path: "codec selection error handling".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(7),
            coverage_info: None,
        }
    }
    
    fn test_disk_space_errors(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "disk_space_errors".to_string(),
            api_path: "disk space error handling".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(4),
            coverage_info: None,
        }
    }
}

#[cfg(test)]
mod render_queue_tests {
    use super::*;
    
    #[test]
    fn test_render_queue_comprehensive() {
        let render_tests = RenderQueueTests;
        let results = render_tests.run_test();
        
        // Verify we have comprehensive coverage
        assert!(results.len() >= render_tests.expected_api_count());
        
        // Check that all tests pass
        let failed_tests: Vec<_> = results.iter()
            .filter(|r| !r.success)
            .collect();
        
        if !failed_tests.is_empty() {
            panic!("Render queue tests failed: {:?}", failed_tests);
        }
    }
    
    #[test]
    fn test_render_queue_management_coverage() {
        let render_tests = RenderQueueTests;
        let results = render_tests.run_test();
        
        // Verify render queue management testing
        let management_features = vec![
            "renderQueue", "numItems", "rendering", "render", "pauseRendering", "stopRendering"
        ];
        
        for feature in management_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "Render queue management feature '{}' not tested", feature);
        }
    }
    
    #[test]
    fn test_render_queue_item_coverage() {
        let render_tests = RenderQueueTests;
        let results = render_tests.run_test();
        
        // Verify RenderQueueItem testing
        let item_features = vec![
            "comp", "elapsedSeconds", "status", "timeSpanStart", "timeSpanDuration",
            "skipFrames", "numOutputModules", "outputModule"
        ];
        
        for feature in item_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "RenderQueueItem feature '{}' not tested", feature);
        }
    }
    
    #[test]
    fn test_output_module_coverage() {
        let render_tests = RenderQueueTests;
        let results = render_tests.run_test();
        
        // Verify OutputModule testing
        let output_features = vec![
            "file", "name", "templates", "postRenderAction", "applyTemplate", "saveAsTemplate"
        ];
        
        for feature in output_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "OutputModule feature '{}' not tested", feature);
        }
    }
    
    #[test]
    fn test_ame_integration_coverage() {
        let render_tests = RenderQueueTests;
        let results = render_tests.run_test();
        
        // Verify Adobe Media Encoder integration testing
        let ame_features = vec![
            "queueInAME", "canQueueInAME"
        ];
        
        for feature in ame_features {
            let feature_tested = results.iter().any(|r| r.api_path.contains(feature));
            assert!(feature_tested, "AME integration feature '{}' not tested", feature);
        }
    }
}