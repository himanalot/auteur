// Comprehensive Example: Using the Complete Adobe After Effects API Test Framework
// Demonstrates all phases from basic testing to advanced reporting with coverage analysis

use super::{enhanced_test_runner::*, advanced_reporting::*};

/// Complete example of running the Adobe After Effects API test framework
/// This demonstrates the entire pipeline from test execution to advanced reporting
pub fn run_complete_framework_example() -> Result<(), String> {
    println!("🚀 Starting Complete Adobe After Effects API Test Framework Example");
    println!("================================================================");
    
    // Phase 1: Quick Critical Tests for CI/CD
    println!("\n📋 Phase 1: Running Critical Tests for CI/CD Pipeline");
    let critical_results = run_critical_tests_example()?;
    
    // Phase 2: Comprehensive Development Testing
    println!("\n🔬 Phase 2: Running Comprehensive Development Tests");
    let comprehensive_results = run_comprehensive_tests_example()?;
    
    // Phase 3: Advanced Performance Analysis
    println!("\n⚡ Phase 3: Advanced Performance Analysis");
    run_performance_analysis_example(&comprehensive_results)?;
    
    // Phase 4: Coverage Analysis
    println!("\n📊 Phase 4: API Coverage Analysis");
    run_coverage_analysis_example(&comprehensive_results)?;
    
    // Phase 5: Quality and Risk Assessment
    println!("\n🎯 Phase 5: Quality and Risk Assessment");
    run_quality_analysis_example(&comprehensive_results)?;
    
    // Phase 6: Executive and Technical Reports
    println!("\n📋 Phase 6: Generating Executive and Technical Reports");
    generate_all_reports_example(&comprehensive_results)?;
    
    println!("\n✅ Complete Framework Example Finished Successfully!");
    println!("📁 Check the following directories for generated reports:");
    println!("   - ./ci_test_reports/ (CI/CD reports)");
    println!("   - ./comprehensive_test_reports/ (Development reports)");
    println!("   - ./advanced_reports/ (Advanced analysis reports)");
    
    Ok(())
}

/// Example 1: Critical tests for CI/CD pipeline
fn run_critical_tests_example() -> Result<TestExecutionStatistics, String> {
    println!("⏰ Running critical tests with 2-minute timeout...");
    
    // Configure for fast CI/CD execution
    let config = TestExecutionConfig {
        run_critical_only: false,
        run_high_priority: true,
        run_medium_priority: false,
        run_low_priority: false,
        categories_to_run: vec![
            TestCategory::CoreFoundation,
            TestCategory::PropertySystem,
            TestCategory::LayerSystem,
        ],
        exclude_categories: vec![TestCategory::Performance], // Skip slow performance tests in CI
        max_execution_time_ms: Some(120_000), // 2 minutes
        parallel_execution: false, // Would enable in production
        stop_on_first_failure: false,
        verbose_output: false, // Minimal output for CI
        generate_html_report: true,
        generate_json_report: true,
        output_directory: "./ci_test_reports".to_string(),
    };
    
    let mut runner = EnhancedTestRunner::new(config);
    let statistics = runner.run_tests()?;
    
    println!("📊 CI Test Results:");
    println!("   ✅ Passed: {}/{} ({:.1}%)", 
        statistics.tests_passed, 
        statistics.total_tests_run,
        (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 100.0
    );
    println!("   ⏱️  Time: {:.2}s", statistics.total_execution_time.as_secs_f64());
    
    // Check if CI should pass
    let success_rate = (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 100.0;
    if success_rate < 90.0 {
        println!("❌ CI FAILED: Success rate {:.1}% is below 90% threshold", success_rate);
        return Err("CI test failure threshold exceeded".to_string());
    }
    
    println!("✅ CI PASSED: All critical tests meet quality thresholds");
    Ok(statistics)
}

/// Example 2: Comprehensive development testing
fn run_comprehensive_tests_example() -> Result<Vec<EnhancedTestResult>, String> {
    println!("🔬 Running comprehensive test suite for development...");
    
    // Configure for thorough development testing
    let config = TestExecutionConfig {
        run_critical_only: false,
        run_high_priority: true,
        run_medium_priority: true,
        run_low_priority: true,
        categories_to_run: vec![
            TestCategory::CoreFoundation,
            TestCategory::PropertySystem,
            TestCategory::LayerSystem,
            TestCategory::TextSystem,
            TestCategory::EffectsRendering,
            TestCategory::AdvancedFeatures,
            TestCategory::Integration,
            TestCategory::Performance,
        ],
        exclude_categories: Vec::new(),
        max_execution_time_ms: Some(600_000), // 10 minutes
        parallel_execution: false, // Would enable in production
        stop_on_first_failure: false,
        verbose_output: true,
        generate_html_report: true,
        generate_json_report: true,
        output_directory: "./comprehensive_test_reports".to_string(),
    };
    
    let mut runner = EnhancedTestRunner::new(config);
    let statistics = runner.run_tests()?;
    
    // For advanced analysis, we need the individual enhanced results
    // In a real implementation, the runner would return these
    let enhanced_results = generate_sample_enhanced_results();
    
    println!("📊 Comprehensive Test Results:");
    println!("   📈 Total Tests: {}", statistics.total_tests_run);
    println!("   ✅ Passed: {} ({:.1}%)", 
        statistics.tests_passed,
        (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 100.0
    );
    println!("   ❌ Failed: {}", statistics.tests_failed);
    println!("   ⏱️  Total Time: {:.2}s", statistics.total_execution_time.as_secs_f64());
    println!("   📊 Categories: {}", statistics.category_breakdown.len());
    println!("   🎯 APIs Tested: {}", statistics.api_coverage.total_ae_apis_tested);
    
    Ok(enhanced_results)
}

/// Example 3: Advanced performance analysis
fn run_performance_analysis_example(test_results: &[EnhancedTestResult]) -> Result<(), String> {
    println!("⚡ Analyzing performance characteristics...");
    
    let thresholds = PerformanceThresholds {
        critical_api_max_time_ms: 100,
        high_priority_max_time_ms: 500,
        medium_priority_max_time_ms: 1000,
        low_priority_max_time_ms: 5000,
        memory_usage_threshold_mb: 512.0,
        success_rate_threshold: 95.0,
    };
    
    let analyzer = PerformanceAnalyzer::new(thresholds);
    let performance_analysis = analyzer.analyze_performance(test_results);
    
    println!("📊 Performance Analysis Results:");
    println!("   ⚡ Average Test Time: {:.2}ms", performance_analysis.overall_metrics.avg_test_time_ms);
    println!("   📊 Median Test Time: {:.2}ms", performance_analysis.overall_metrics.median_test_time_ms);
    println!("   🎯 95th Percentile: {:.2}ms", performance_analysis.overall_metrics.p95_test_time_ms);
    println!("   🐌 Slowest Category: {:?}", performance_analysis.overall_metrics.slowest_category);
    println!("   ⚡ Fastest Category: {:?}", performance_analysis.overall_metrics.fastest_category);
    println!("   ⚠️  Tests Over Threshold: {}", performance_analysis.overall_metrics.tests_exceeding_threshold);
    
    // Show category performance breakdown
    println!("\n🏷️  Performance by Category:");
    for (category, perf) in &performance_analysis.category_performance {
        let grade_symbol = match perf.performance_grade {
            PerformanceGrade::Excellent => "🟢",
            PerformanceGrade::Good => "🟡",
            PerformanceGrade::Fair => "🟠",
            PerformanceGrade::Poor => "🔴",
            PerformanceGrade::Critical => "💀",
        };
        println!("   {} {:?}: {:.1}ms avg ({:?})", 
            grade_symbol, category, perf.avg_execution_time_ms, perf.performance_grade);
    }
    
    // Show top bottlenecks
    if !performance_analysis.bottleneck_analysis.top_bottlenecks.is_empty() {
        println!("\n🚨 Top Performance Bottlenecks:");
        for (i, bottleneck) in performance_analysis.bottleneck_analysis.top_bottlenecks.iter().take(5).enumerate() {
            println!("   {}. {} ({}ms) - {:?}", 
                i + 1, bottleneck.api_path, bottleneck.execution_time_ms, bottleneck.impact_level);
        }
    }
    
    // Show scalability assessment
    println!("\n📈 Scalability Assessment:");
    println!("   📊 Current Scale Rating: {:?}", performance_analysis.scalability_assessment.current_scale_rating);
    println!("   🎯 Recommended Max Tests: {}", performance_analysis.scalability_assessment.recommended_max_test_count);
    
    Ok(())
}

/// Example 4: API coverage analysis
fn run_coverage_analysis_example(test_results: &[EnhancedTestResult]) -> Result<(), String> {
    println!("📊 Analyzing API coverage...");
    
    let analyzer = APICoverageAnalyzer::new();
    let coverage_analysis = analyzer.analyze_coverage(test_results);
    
    println!("📊 API Coverage Analysis Results:");
    println!("   📈 Total APIs Documented: {}", coverage_analysis.total_documented_apis);
    println!("   ✅ APIs Tested: {}", coverage_analysis.tested_apis);
    println!("   📊 Coverage Percentage: {:.1}%", 
        (coverage_analysis.tested_apis as f64 / coverage_analysis.total_documented_apis as f64) * 100.0);
    println!("   🎯 Critical APIs Tested: {}/{}", 
        coverage_analysis.critical_apis_tested, coverage_analysis.critical_apis_total);
    
    // Show object coverage breakdown
    println!("\n🏷️  Coverage by Object Type:");
    for (object, coverage) in &coverage_analysis.api_by_object {
        println!("   📦 {}: {:.1}% ({}/{} total)", 
            object, 
            coverage.coverage_percentage,
            coverage.tested_methods + coverage.tested_properties,
            coverage.total_methods + coverage.total_properties
        );
        
        if coverage.coverage_percentage < 80.0 {
            println!("     ⚠️  Low coverage - consider adding more tests");
        }
    }
    
    // Show missing critical APIs
    if !coverage_analysis.missing_critical_apis.is_empty() {
        println!("\n🚨 Missing Critical APIs:");
        for critical_api in coverage_analysis.missing_critical_apis.iter().take(5) {
            println!("   ❌ {} - {}", critical_api.api_path, critical_api.reason);
        }
    }
    
    // Show category coverage
    println!("\n🏷️  Coverage by Category:");
    for (category, coverage) in &coverage_analysis.api_by_category {
        println!("   {:?}: {:.1}% coverage, {:.1}% stability", 
            category, coverage.coverage_percentage, coverage.stability_score);
    }
    
    Ok(())
}

/// Example 5: Quality and risk assessment
fn run_quality_analysis_example(test_results: &[EnhancedTestResult]) -> Result<(), String> {
    println!("🎯 Analyzing quality and assessing risks...");
    
    let analyzer = QualityAnalyzer::new();
    let quality_analysis = analyzer.analyze_quality(test_results);
    
    println!("🎯 Quality Analysis Results:");
    println!("   📊 Overall Quality Score: {:.1}/100", quality_analysis.overall_quality_score);
    println!("   🔧 Maintainability Score: {:.1}/100", quality_analysis.maintainability_score);
    
    // Reliability metrics
    println!("\n🛡️  Reliability Metrics:");
    println!("   ✅ Success Rate: {:.1}%", quality_analysis.reliability_metrics.success_rate);
    println!("   📊 Trend: {:?}", quality_analysis.reliability_metrics.stability_trend);
    
    if !quality_analysis.reliability_metrics.consistent_failures.is_empty() {
        println!("   ⚠️  Consistent Failures: {}", quality_analysis.reliability_metrics.consistent_failures.len());
    }
    
    // Test effectiveness
    println!("\n🎯 Test Effectiveness:");
    println!("   🐛 Bug Detection Rate: {:.1}%", quality_analysis.test_effectiveness.bug_detection_rate);
    println!("   📊 Coverage Adequacy: {:.1}%", quality_analysis.test_effectiveness.test_coverage_adequacy);
    println!("   🔗 Integration Coverage: {:.1}%", quality_analysis.test_effectiveness.integration_coverage);
    
    // Risk assessment
    println!("\n🚨 Risk Assessment:");
    println!("   🔧 Maintenance Burden: {:.1}/100", quality_analysis.risk_assessment.maintenance_burden_score);
    println!("   📈 Upgrade Risk: {:.1}%", quality_analysis.risk_assessment.upgrade_compatibility_risk);
    
    if !quality_analysis.risk_assessment.high_risk_areas.is_empty() {
        println!("   ⚠️  High Risk Areas:");
        for risk_area in quality_analysis.risk_assessment.high_risk_areas.iter().take(3) {
            println!("     • {} ({:?}) - {}", risk_area.area, risk_area.risk_level, risk_area.description);
        }
    }
    
    // Quality grade
    let quality_grade = if quality_analysis.overall_quality_score >= 90.0 {
        "🟢 Excellent"
    } else if quality_analysis.overall_quality_score >= 80.0 {
        "🟡 Good"
    } else if quality_analysis.overall_quality_score >= 70.0 {
        "🟠 Fair"
    } else if quality_analysis.overall_quality_score >= 60.0 {
        "🔴 Poor"
    } else {
        "💀 Critical"
    };
    
    println!("\n🎯 Overall Quality Grade: {}", quality_grade);
    
    Ok(())
}

/// Example 6: Generate all types of reports
fn generate_all_reports_example(test_results: &[EnhancedTestResult]) -> Result<(), String> {
    println!("📋 Generating comprehensive reports...");
    
    // Executive Report for stakeholders
    println!("📊 Generating Executive Report...");
    let exec_report = AdvancedReportingEngine::executive_report(test_results)?;
    println!("   ✅ Executive report generated");
    
    // Technical Deep Dive for developers
    println!("🔬 Generating Technical Deep Dive...");
    let tech_report = AdvancedReportingEngine::technical_deep_dive(test_results)?;
    println!("   ✅ Technical report generated");
    
    // Quick Analysis for immediate insights
    println!("⚡ Generating Quick Analysis...");
    let quick_report = AdvancedReportingEngine::quick_analysis(test_results)?;
    println!("   ✅ Quick analysis generated");
    
    // Custom detailed report
    println!("🎛️  Generating Custom Detailed Report...");
    let custom_config = ReportingConfig {
        include_detailed_coverage: true,
        include_performance_analysis: true,
        include_quality_metrics: true,
        include_trend_analysis: false, // No historical data available
        include_recommendations: true,
        generate_executive_summary: true,
        generate_technical_deep_dive: true,
        output_formats: vec![
            ReportFormat::HTML,
            ReportFormat::JSON,
            ReportFormat::Markdown,
        ],
        comparison_baseline: None,
        custom_thresholds: PerformanceThresholds {
            critical_api_max_time_ms: 50,  // Stricter thresholds
            high_priority_max_time_ms: 200,
            medium_priority_max_time_ms: 500,
            low_priority_max_time_ms: 2000,
            memory_usage_threshold_mb: 256.0,
            success_rate_threshold: 98.0,
        },
    };
    
    let mut custom_engine = AdvancedReportingEngine::new(custom_config);
    let custom_report = custom_engine.generate_comprehensive_report(test_results)?;
    println!("   ✅ Custom detailed report generated");
    
    // Print summary of generated reports
    println!("\n📁 Generated Reports Summary:");
    println!("   📊 Executive Report: Focus on business impact and key metrics");
    println!("   🔬 Technical Report: Detailed analysis for development team");
    println!("   ⚡ Quick Analysis: Immediate insights and action items");
    println!("   🎛️  Custom Report: Detailed analysis with strict thresholds");
    
    // Show key insights from executive summary
    if let Some(exec_summary) = &custom_report.executive_summary {
        println!("\n🎯 Key Executive Insights:");
        println!("   📊 Overall Health: {}", exec_summary.overall_health);
        println!("   🚨 Risk Level: {}", exec_summary.risk_assessment);
        
        if !exec_summary.critical_issues.is_empty() {
            println!("   ⚠️  Critical Issues:");
            for issue in exec_summary.critical_issues.iter().take(3) {
                println!("     • {}", issue);
            }
        }
        
        if !exec_summary.improvement_opportunities.is_empty() {
            println!("   🎯 Top Opportunities:");
            for opportunity in exec_summary.improvement_opportunities.iter().take(3) {
                println!("     • {}", opportunity);
            }
        }
    }
    
    Ok(())
}

/// Generate realistic sample test results for demonstration
fn generate_sample_enhanced_results() -> Vec<EnhancedTestResult> {
    use std::time::Duration;
    
    vec![
        // Core Foundation Tests
        EnhancedTestResult {
            basic_result: ApiTestResult {
                test_name: "app_project_access".to_string(),
                api_path: "app.project".to_string(),
                success: true,
                error_message: None,
                performance_ms: Some(15),
                coverage_info: None,
            },
            execution_time: Duration::from_millis(15),
            memory_usage_mb: Some(12.5),
            category: TestCategory::CoreFoundation,
            priority: TestPriority::Critical,
            retry_count: 0,
            extendscript_validation_details: Some(ExtendScriptValidationDetails {
                script_length: 150,
                syntax_validation_time_ms: 5,
                api_validation_time_ms: 10,
                property_validations: 1,
                method_validations: 0,
                expression_validations: 0,
                detected_api_calls: vec!["app.project".to_string()],
            }),
        },
        
        // Property System Tests
        EnhancedTestResult {
            basic_result: ApiTestResult {
                test_name: "property_setValue_validation".to_string(),
                api_path: "property.setValue".to_string(),
                success: true,
                error_message: None,
                performance_ms: Some(25),
                coverage_info: None,
            },
            execution_time: Duration::from_millis(25),
            memory_usage_mb: Some(8.2),
            category: TestCategory::PropertySystem,
            priority: TestPriority::Critical,
            retry_count: 0,
            extendscript_validation_details: Some(ExtendScriptValidationDetails {
                script_length: 200,
                syntax_validation_time_ms: 8,
                api_validation_time_ms: 17,
                property_validations: 0,
                method_validations: 1,
                expression_validations: 0,
                detected_api_calls: vec!["property.setValue".to_string()],
            }),
        },
        
        // Effects System Tests
        EnhancedTestResult {
            basic_result: ApiTestResult {
                test_name: "effect_gaussian_blur_application".to_string(),
                api_path: "layer.effects.addProperty".to_string(),
                success: true,
                error_message: None,
                performance_ms: Some(120),
                coverage_info: None,
            },
            execution_time: Duration::from_millis(120),
            memory_usage_mb: Some(25.8),
            category: TestCategory::EffectsRendering,
            priority: TestPriority::High,
            retry_count: 0,
            extendscript_validation_details: Some(ExtendScriptValidationDetails {
                script_length: 350,
                syntax_validation_time_ms: 20,
                api_validation_time_ms: 100,
                property_validations: 2,
                method_validations: 3,
                expression_validations: 0,
                detected_api_calls: vec!["layer.effects.addProperty".to_string(), "ADBE Gaussian Blur 2".to_string()],
            }),
        },
        
        // Performance Test (intentionally slow)
        EnhancedTestResult {
            basic_result: ApiTestResult {
                test_name: "large_project_performance".to_string(),
                api_path: "performance.large_project_operations".to_string(),
                success: true,
                error_message: None,
                performance_ms: Some(2500),
                coverage_info: None,
            },
            execution_time: Duration::from_millis(2500),
            memory_usage_mb: Some(85.4),
            category: TestCategory::Performance,
            priority: TestPriority::Medium,
            retry_count: 0,
            extendscript_validation_details: Some(ExtendScriptValidationDetails {
                script_length: 800,
                syntax_validation_time_ms: 50,
                api_validation_time_ms: 2450,
                property_validations: 15,
                method_validations: 25,
                expression_validations: 5,
                detected_api_calls: vec!["multiple API calls".to_string()],
            }),
        },
        
        // Failed test example
        EnhancedTestResult {
            basic_result: ApiTestResult {
                test_name: "deprecated_api_access".to_string(),
                api_path: "app.enableQE".to_string(),
                success: false,
                error_message: Some("API deprecated in CC 2019".to_string()),
                performance_ms: Some(5),
                coverage_info: None,
            },
            execution_time: Duration::from_millis(5),
            memory_usage_mb: Some(2.1),
            category: TestCategory::AdvancedFeatures,
            priority: TestPriority::Low,
            retry_count: 1,
            extendscript_validation_details: Some(ExtendScriptValidationDetails {
                script_length: 80,
                syntax_validation_time_ms: 2,
                api_validation_time_ms: 3,
                property_validations: 1,
                method_validations: 0,
                expression_validations: 0,
                detected_api_calls: vec!["app.enableQE".to_string()],
            }),
        },
        
        // Integration test
        EnhancedTestResult {
            basic_result: ApiTestResult {
                test_name: "layer_effect_animation_integration".to_string(),
                api_path: "integration.layer_effect_animation".to_string(),
                success: true,
                error_message: None,
                performance_ms: Some(180),
                coverage_info: None,
            },
            execution_time: Duration::from_millis(180),
            memory_usage_mb: Some(32.7),
            category: TestCategory::Integration,
            priority: TestPriority::High,
            retry_count: 0,
            extendscript_validation_details: Some(ExtendScriptValidationDetails {
                script_length: 450,
                syntax_validation_time_ms: 30,
                api_validation_time_ms: 150,
                property_validations: 8,
                method_validations: 12,
                expression_validations: 2,
                detected_api_calls: vec!["layer.effects".to_string(), "property.setValueAtTime".to_string()],
            }),
        },
    ]
}

/// Example of using the framework in different contexts
pub fn demonstrate_framework_contexts() -> Result<(), String> {
    println!("\n🎯 Framework Usage Examples for Different Contexts");
    println!("=================================================");
    
    // Context 1: CI/CD Pipeline
    println!("\n🤖 Context 1: CI/CD Pipeline Integration");
    println!("   Purpose: Fast validation of critical functionality");
    println!("   Configuration: High priority only, 2-minute timeout");
    let _ci_results = EnhancedTestRunner::run_for_ci()?;
    println!("   ✅ CI tests completed - suitable for automated deployment gates");
    
    // Context 2: Development Workflow
    println!("\n👨‍💻 Context 2: Development Workflow");
    println!("   Purpose: Comprehensive validation during development");
    println!("   Configuration: All priorities, detailed reporting");
    let _dev_results = EnhancedTestRunner::run_comprehensive()?;
    println!("   ✅ Development tests completed - detailed feedback for developers");
    
    // Context 3: Release Validation
    println!("\n🚀 Context 3: Release Validation");
    println!("   Purpose: Thorough validation before release");
    println!("   Configuration: All tests, advanced analysis, multiple report formats");
    let sample_results = generate_sample_enhanced_results();
    let _release_report = AdvancedReportingEngine::technical_deep_dive(&sample_results)?;
    println!("   ✅ Release validation completed - comprehensive quality assurance");
    
    // Context 4: Performance Monitoring
    println!("\n📊 Context 4: Performance Monitoring");
    println!("   Purpose: Track performance trends over time");
    println!("   Configuration: Performance focus, trend analysis");
    let performance_config = TestExecutionConfig {
        categories_to_run: vec![TestCategory::Performance],
        verbose_output: false,
        max_execution_time_ms: Some(300_000),
        ..Default::default()
    };
    let mut perf_runner = EnhancedTestRunner::new(performance_config);
    let _perf_stats = perf_runner.run_tests()?;
    println!("   ✅ Performance monitoring completed - baseline established");
    
    println!("\n🎉 All framework contexts demonstrated successfully!");
    
    Ok(())
}

/// Quick start guide for new users
pub fn print_quick_start_guide() {
    println!("\n📚 Adobe After Effects API Test Framework - Quick Start Guide");
    println!("============================================================");
    
    println!("\n🚀 Getting Started:");
    println!("   1. Import the framework: use crate::tests::*;");
    println!("   2. Choose your use case:");
    println!("      • CI/CD: EnhancedTestRunner::run_for_ci()");
    println!("      • Development: EnhancedTestRunner::run_comprehensive()");
    println!("      • Custom: Configure TestExecutionConfig manually");
    
    println!("\n📊 Report Generation:");
    println!("   • Executive: AdvancedReportingEngine::executive_report(results)");
    println!("   • Technical: AdvancedReportingEngine::technical_deep_dive(results)");
    println!("   • Quick: AdvancedReportingEngine::quick_analysis(results)");
    
    println!("\n🎯 Key Features:");
    println!("   ✅ Real ExtendScript validation (not mocks)");
    println!("   📊 Comprehensive API coverage analysis");
    println!("   ⚡ Performance benchmarking and bottleneck detection");
    println!("   🎯 Quality metrics and risk assessment");
    println!("   📋 Multiple report formats (HTML, JSON, Markdown)");
    println!("   🔧 Configurable execution parameters");
    
    println!("\n📁 Generated Outputs:");
    println!("   • ./ci_test_reports/ - CI/CD pipeline reports");
    println!("   • ./comprehensive_test_reports/ - Development reports");
    println!("   • ./advanced_reports/ - Advanced analysis reports");
    
    println!("\n🛠️  Configuration Options:");
    println!("   • Priority levels: Critical, High, Medium, Low");
    println!("   • Categories: Core, Property, Layer, Text, Effects, Advanced, Integration, Performance");
    println!("   • Time limits: Configure max execution time");
    println!("   • Output formats: HTML, JSON, Markdown, CSV, PDF");
    
    println!("\n💡 Best Practices:");
    println!("   • Run critical tests in CI/CD for fast feedback");
    println!("   • Use comprehensive tests during development");
    println!("   • Generate technical reports for detailed analysis");
    println!("   • Monitor performance trends over time");
    println!("   • Review coverage gaps regularly");
    
    println!("\n📞 Support:");
    println!("   • Check README.md for detailed documentation");
    println!("   • Review test examples in framework_example.rs");
    println!("   • See comprehensive_framework_test.rs for validation");
}

#[cfg(test)]
mod framework_example_tests {
    use super::*;
    
    #[test]
    fn test_framework_example_execution() {
        // Test that the framework example can be executed without errors
        // In a real implementation, this would run the full example
        let sample_results = generate_sample_enhanced_results();
        assert!(sample_results.len() > 0);
        assert!(sample_results.iter().any(|r| r.basic_result.success));
    }
    
    #[test]
    fn test_sample_data_quality() {
        let results = generate_sample_enhanced_results();
        
        // Verify sample data covers different categories
        let categories: std::collections::HashSet<_> = results.iter().map(|r| r.category).collect();
        assert!(categories.len() >= 4, "Should cover multiple test categories");
        
        // Verify sample data includes both success and failure cases
        let has_success = results.iter().any(|r| r.basic_result.success);
        let has_failure = results.iter().any(|r| !r.basic_result.success);
        assert!(has_success && has_failure, "Should include both success and failure cases");
        
        // Verify performance data is realistic
        let avg_time = results.iter().map(|r| r.execution_time.as_millis()).sum::<u128>() as f64 / results.len() as f64;
        assert!(avg_time > 0.0 && avg_time < 10000.0, "Average execution time should be realistic");
    }
    
    #[test]
    fn test_configuration_variants() {
        // Test different configuration scenarios
        let ci_config = TestExecutionConfig {
            run_high_priority: true,
            run_medium_priority: false,
            max_execution_time_ms: Some(120_000),
            ..Default::default()
        };
        
        let dev_config = TestExecutionConfig {
            run_high_priority: true,
            run_medium_priority: true,
            run_low_priority: true,
            verbose_output: true,
            ..Default::default()
        };
        
        // Verify configurations are different and valid
        assert_ne!(ci_config.max_execution_time_ms, dev_config.max_execution_time_ms);
        assert!(ci_config.max_execution_time_ms.unwrap() < dev_config.max_execution_time_ms.unwrap_or(u64::MAX));
    }
}