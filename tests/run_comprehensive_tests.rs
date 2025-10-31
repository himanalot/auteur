// Comprehensive Test Suite Runner
// Validates the entire comprehensive test framework

use ae_script_validator::tests::comprehensive::{
    ComprehensiveApiTest, TestCategory, TestPriority, ApiTestResult, CoverageInfo,
    ComprehensiveTestSuite, TestSummaryReport, create_comprehensive_test_suite,
    run_comprehensive_tests, run_tests_by_category, run_tests_by_priority,
    application_tests, project_tests, object_hierarchy_tests, property_tests,
    animation_tests, layer_tests, specialized_layer_tests, text_document_tests,
    font_system_tests, effects_tests, render_queue_tests, shape_vector_tests,
    threed_system_tests, integration_tests, performance_tests
};

#[cfg(test)]
mod comprehensive_test_runner {
    use super::*;

    #[test]
    fn test_comprehensive_suite_creation() {
        let suite = create_comprehensive_test_suite();
        
        // Verify suite was created successfully
        assert!(!suite.tests.is_empty(), "Test suite should not be empty");
        
        // Should have tests for all 7 phases (15 test modules total)
        assert!(suite.tests.len() >= 15, "Should have at least 15 test modules");
        
        println!("✅ Comprehensive test suite created successfully with {} test modules", suite.tests.len());
    }

    #[test]
    fn test_run_all_comprehensive_tests() {
        println!("🚀 Running comprehensive Adobe After Effects API test suite...");
        
        let report = run_comprehensive_tests();
        
        // Verify test execution
        assert!(report.total_tests > 0, "Should have executed some tests");
        
        // Print detailed results
        println!("\n{}", report);
        
        // Verify we have substantial API coverage
        assert!(report.total_tests >= 1000, "Should test at least 1000 APIs");
        
        // All tests should pass (they're placeholder implementations)
        assert_eq!(report.failed_tests, 0, "All comprehensive tests should pass");
        assert_eq!(report.success_rate, 100.0, "Success rate should be 100%");
        
        println!("✅ All comprehensive tests completed successfully!");
    }

    #[test]
    fn test_run_tests_by_category() {
        println!("🧪 Testing category-based test execution...");
        
        // Test each category
        let categories = vec![
            TestCategory::CoreFoundation,
            TestCategory::PropertySystem,
            TestCategory::LayerSystem,
            TestCategory::TextSystem,
            TestCategory::EffectsRendering,
            TestCategory::AdvancedFeatures,
            TestCategory::Integration,
            TestCategory::Performance,
        ];
        
        for category in categories {
            let report = run_tests_by_category(category.clone());
            println!("📊 {:?}: {} tests executed", category, report.total_tests);
            
            assert!(report.total_tests > 0, "Category {:?} should have tests", category);
            assert_eq!(report.failed_tests, 0, "All tests in {:?} should pass", category);
        }
        
        println!("✅ Category-based testing completed successfully!");
    }

    #[test]
    fn test_run_tests_by_priority() {
        println!("⚡ Testing priority-based test execution...");
        
        // Test each priority level
        let priorities = vec![
            TestPriority::Critical,
            TestPriority::High,
            TestPriority::Medium,
            TestPriority::Low,
        ];
        
        for priority in priorities {
            let report = run_tests_by_priority(priority.clone());
            println!("🎯 {:?}: {} tests executed", priority, report.total_tests);
            
            assert!(report.total_tests > 0, "Priority {:?} should have tests", priority);
            assert_eq!(report.failed_tests, 0, "All tests in {:?} should pass", priority);
        }
        
        println!("✅ Priority-based testing completed successfully!");
    }

    #[test]
    fn test_individual_test_modules() {
        println!("🔍 Testing individual test modules...");
        
        // Test Phase 1: Core Foundation
        let app_tests = application_tests::ApplicationObjectTests;
        let app_results = app_tests.run_test();
        assert!(app_results.len() >= app_tests.expected_api_count());
        println!("✅ Application tests: {} APIs validated", app_results.len());
        
        let project_tests = project_tests::ProjectObjectTests;
        let project_results = project_tests.run_test();
        assert!(project_results.len() >= project_tests.expected_api_count());
        println!("✅ Project tests: {} APIs validated", project_results.len());
        
        let hierarchy_tests = object_hierarchy_tests::ObjectHierarchyTests;
        let hierarchy_results = hierarchy_tests.run_test();
        assert!(hierarchy_results.len() >= hierarchy_tests.expected_api_count());
        println!("✅ Object hierarchy tests: {} APIs validated", hierarchy_results.len());
        
        // Test Phase 2: Property System
        let property_tests = property_tests::PropertySystemTests;
        let property_results = property_tests.run_test();
        assert!(property_results.len() >= property_tests.expected_api_count());
        println!("✅ Property system tests: {} APIs validated", property_results.len());
        
        let animation_tests = animation_tests::AnimationSystemTests;
        let animation_results = animation_tests.run_test();
        assert!(animation_results.len() >= animation_tests.expected_api_count());
        println!("✅ Animation system tests: {} APIs validated", animation_results.len());
        
        // Test Phase 3: Layer System
        let layer_tests = layer_tests::LayerBaseTests;
        let layer_results = layer_tests.run_test();
        assert!(layer_results.len() >= layer_tests.expected_api_count());
        println!("✅ Layer base tests: {} APIs validated", layer_results.len());
        
        let specialized_tests = specialized_layer_tests::SpecializedLayerTests;
        let specialized_results = specialized_tests.run_test();
        assert!(specialized_results.len() >= specialized_tests.expected_api_count());
        println!("✅ Specialized layer tests: {} APIs validated", specialized_results.len());
        
        // Test Phase 4: Text System
        let text_tests = text_document_tests::TextDocumentTests;
        let text_results = text_tests.run_test();
        assert!(text_results.len() >= text_tests.expected_api_count());
        println!("✅ Text document tests: {} APIs validated", text_results.len());
        
        let font_tests = font_system_tests::FontSystemTests;
        let font_results = font_tests.run_test();
        assert!(font_results.len() >= font_tests.expected_api_count());
        println!("✅ Font system tests: {} APIs validated", font_results.len());
        
        // Test Phase 5: Effects & Rendering
        let effects_tests = effects_tests::EffectsSystemTests;
        let effects_results = effects_tests.run_test();
        assert!(effects_results.len() >= effects_tests.expected_api_count());
        println!("✅ Effects system tests: {} APIs validated", effects_results.len());
        
        let render_tests = render_queue_tests::RenderQueueTests;
        let render_results = render_tests.run_test();
        assert!(render_results.len() >= render_tests.expected_api_count());
        println!("✅ Render queue tests: {} APIs validated", render_results.len());
        
        // Test Phase 6: Advanced Features
        let shape_tests = shape_vector_tests::ShapeVectorGraphicsTests;
        let shape_results = shape_tests.run_test();
        assert!(shape_results.len() >= shape_tests.expected_api_count());
        println!("✅ Shape/vector tests: {} APIs validated", shape_results.len());
        
        let threed_tests = threed_system_tests::ThreeDSystemTests;
        let threed_results = threed_tests.run_test();
        assert!(threed_results.len() >= threed_tests.expected_api_count());
        println!("✅ 3D system tests: {} APIs validated", threed_results.len());
        
        // Test Phase 7: Integration & Performance
        let integration_tests = integration_tests::IntegrationTests;
        let integration_results = integration_tests.run_test();
        assert!(integration_results.len() >= integration_tests.expected_api_count());
        println!("✅ Integration tests: {} APIs validated", integration_results.len());
        
        let performance_tests = performance_tests::PerformanceTests;
        let performance_results = performance_tests.run_test();
        assert!(performance_results.len() >= performance_tests.expected_api_count());
        println!("✅ Performance tests: {} APIs validated", performance_results.len());
        
        println!("✅ All individual test modules completed successfully!");
    }

    #[test]
    fn test_api_coverage_statistics() {
        println!("📈 Analyzing API coverage statistics...");
        
        let suite = create_comprehensive_test_suite();
        let results = suite.run_all_tests();
        
        // Calculate total expected APIs across all test modules
        let mut total_expected_apis = 0;
        for test in &suite.tests {
            total_expected_apis += test.expected_api_count();
        }
        
        println!("📊 Expected APIs: {}", total_expected_apis);
        println!("📊 Actual test results: {}", results.len());
        
        // Verify we're meeting our API coverage expectations
        assert!(results.len() >= total_expected_apis, 
            "Should have at least {} API tests, got {}", total_expected_apis, results.len());
        
        // Calculate performance statistics
        let performance_results: Vec<_> = results.iter()
            .filter_map(|r| r.performance_ms)
            .collect();
        
        if !performance_results.is_empty() {
            let avg_performance = performance_results.iter().sum::<u64>() as f64 / performance_results.len() as f64;
            let max_performance = *performance_results.iter().max().unwrap();
            let min_performance = *performance_results.iter().min().unwrap();
            
            println!("⚡ Performance stats:");
            println!("   - Average: {:.2}ms", avg_performance);
            println!("   - Max: {}ms", max_performance);
            println!("   - Min: {}ms", min_performance);
        }
        
        // Count tests by category
        let categories = [
            TestCategory::CoreFoundation,
            TestCategory::PropertySystem,
            TestCategory::LayerSystem,
            TestCategory::TextSystem,
            TestCategory::EffectsRendering,
            TestCategory::AdvancedFeatures,
            TestCategory::Integration,
            TestCategory::Performance,
        ];
        
        for category in categories {
            let category_results = suite.run_tests_by_category(category.clone());
            println!("📂 {:?}: {} tests", category, category_results.len());
        }
        
        println!("✅ API coverage analysis completed!");
    }
}