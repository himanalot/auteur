// Enhanced Test Runner with Detailed Reporting for Adobe After Effects API Tests
// Phase 5.1: Advanced test execution with comprehensive reporting, filtering, and analysis

use super::comprehensive::*;
use std::collections::HashMap;
use std::time::{Duration, Instant};
use std::fs::File;
use std::io::Write;
use std::path::Path;

/// Enhanced test execution configuration
#[derive(Debug, Clone)]
pub struct TestExecutionConfig {
    pub run_critical_only: bool,
    pub run_high_priority: bool,
    pub run_medium_priority: bool,
    pub run_low_priority: bool,
    pub categories_to_run: Vec<TestCategory>,
    pub exclude_categories: Vec<TestCategory>,
    pub max_execution_time_ms: Option<u64>,
    pub parallel_execution: bool,
    pub stop_on_first_failure: bool,
    pub verbose_output: bool,
    pub generate_html_report: bool,
    pub generate_json_report: bool,
    pub output_directory: String,
}

impl Default for TestExecutionConfig {
    fn default() -> Self {
        Self {
            run_critical_only: false,
            run_high_priority: true,
            run_medium_priority: true,
            run_low_priority: false,
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
            max_execution_time_ms: Some(300_000), // 5 minutes default
            parallel_execution: false,
            stop_on_first_failure: false,
            verbose_output: true,
            generate_html_report: true,
            generate_json_report: true,
            output_directory: "./test_reports".to_string(),
        }
    }
}

/// Detailed test execution result with enhanced metrics
#[derive(Debug, Clone)]
pub struct EnhancedTestResult {
    pub basic_result: ApiTestResult,
    pub execution_time: Duration,
    pub memory_usage_mb: Option<f64>,
    pub category: TestCategory,
    pub priority: TestPriority,
    pub retry_count: u32,
    pub extendscript_validation_details: Option<ExtendScriptValidationDetails>,
}

/// ExtendScript validation specific details
#[derive(Debug, Clone)]
pub struct ExtendScriptValidationDetails {
    pub script_length: usize,
    pub syntax_validation_time_ms: u64,
    pub api_validation_time_ms: u64,
    pub property_validations: u32,
    pub method_validations: u32,
    pub expression_validations: u32,
    pub detected_api_calls: Vec<String>,
}

/// Comprehensive test execution statistics
#[derive(Debug, Clone)]
pub struct TestExecutionStatistics {
    pub total_execution_time: Duration,
    pub total_tests_run: usize,
    pub tests_passed: usize,
    pub tests_failed: usize,
    pub tests_skipped: usize,
    pub category_breakdown: HashMap<TestCategory, CategoryStats>,
    pub priority_breakdown: HashMap<TestPriority, PriorityStats>,
    pub performance_metrics: PerformanceMetrics,
    pub api_coverage: APICoverageMetrics,
    pub error_analysis: ErrorAnalysis,
}

#[derive(Debug, Clone)]
pub struct CategoryStats {
    pub total_tests: usize,
    pub passed: usize,
    pub failed: usize,
    pub avg_execution_time_ms: f64,
    pub success_rate: f64,
}

#[derive(Debug, Clone)]
pub struct PriorityStats {
    pub total_tests: usize,
    pub passed: usize,
    pub failed: usize,
    pub avg_execution_time_ms: f64,
    pub success_rate: f64,
}

#[derive(Debug, Clone)]
pub struct PerformanceMetrics {
    pub fastest_test_ms: u64,
    pub slowest_test_ms: u64,
    pub avg_test_time_ms: f64,
    pub median_test_time_ms: f64,
    pub tests_over_threshold_ms: Vec<(String, u64)>, // Tests that took too long
    pub performance_distribution: HashMap<String, usize>, // Time ranges
}

#[derive(Debug, Clone)]
pub struct APICoverageMetrics {
    pub total_ae_apis_tested: usize,
    pub apis_by_category: HashMap<String, usize>,
    pub coverage_percentage: f64,
    pub missing_critical_apis: Vec<String>,
    pub newly_tested_apis: Vec<String>,
    pub deprecated_apis_found: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct ErrorAnalysis {
    pub common_error_patterns: HashMap<String, usize>,
    pub syntax_errors: usize,
    pub api_not_found_errors: usize,
    pub property_access_errors: usize,
    pub method_call_errors: usize,
    pub expression_errors: usize,
    pub timeout_errors: usize,
}

/// Enhanced Test Runner with advanced capabilities
pub struct EnhancedTestRunner {
    config: TestExecutionConfig,
    test_suite: ComprehensiveTestSuite,
    execution_start_time: Option<Instant>,
    results: Vec<EnhancedTestResult>,
}

impl EnhancedTestRunner {
    /// Create new enhanced test runner with configuration
    pub fn new(config: TestExecutionConfig) -> Self {
        Self {
            config,
            test_suite: create_comprehensive_test_suite(),
            execution_start_time: None,
            results: Vec::new(),
        }
    }

    /// Create runner with default configuration
    pub fn with_defaults() -> Self {
        Self::new(TestExecutionConfig::default())
    }

    /// Configure the test runner
    pub fn configure(mut self, config: TestExecutionConfig) -> Self {
        self.config = config;
        self
    }

    /// Run tests with the current configuration
    pub fn run_tests(&mut self) -> Result<TestExecutionStatistics, String> {
        self.execution_start_time = Some(Instant::now());
        
        if self.config.verbose_output {
            println!("🚀 Starting Enhanced Adobe After Effects API Test Execution");
            println!("📊 Configuration: {:?}", self.config);
        }

        // Filter tests based on configuration
        let filtered_tests = self.filter_tests()?;
        
        if self.config.verbose_output {
            println!("🔍 Filtered to {} tests based on configuration", filtered_tests.len());
        }

        // Execute tests
        self.execute_filtered_tests(filtered_tests)?;

        // Generate comprehensive statistics
        let statistics = self.generate_execution_statistics();

        // Generate reports
        if self.config.generate_html_report || self.config.generate_json_report {
            self.generate_reports(&statistics)?;
        }

        if self.config.verbose_output {
            println!("✅ Test execution completed successfully");
            self.print_summary(&statistics);
        }

        Ok(statistics)
    }

    /// Filter tests based on configuration
    fn filter_tests(&self) -> Result<Vec<&Box<dyn ComprehensiveApiTest>>, String> {
        let mut filtered_tests = Vec::new();

        for test in &self.test_suite.tests {
            // Filter by priority
            let priority_matches = match test.priority() {
                TestPriority::Critical => self.config.run_critical_only || 
                                        self.config.run_high_priority || 
                                        self.config.run_medium_priority || 
                                        self.config.run_low_priority,
                TestPriority::High => !self.config.run_critical_only && 
                                     (self.config.run_high_priority || 
                                      self.config.run_medium_priority || 
                                      self.config.run_low_priority),
                TestPriority::Medium => !self.config.run_critical_only && 
                                       !self.config.run_high_priority && 
                                       (self.config.run_medium_priority || 
                                        self.config.run_low_priority),
                TestPriority::Low => !self.config.run_critical_only && 
                                    !self.config.run_high_priority && 
                                    !self.config.run_medium_priority && 
                                    self.config.run_low_priority,
            };

            // Filter by category
            let category = test.category();
            let category_matches = self.config.categories_to_run.contains(&category) && 
                                  !self.config.exclude_categories.contains(&category);

            if priority_matches && category_matches {
                filtered_tests.push(test);
            }
        }

        if filtered_tests.is_empty() {
            return Err("No tests match the current configuration filters".to_string());
        }

        Ok(filtered_tests)
    }

    /// Execute the filtered tests
    fn execute_filtered_tests(&mut self, tests: Vec<&Box<dyn ComprehensiveApiTest>>) -> Result<(), String> {
        let total_tests = tests.len();
        let mut current_test = 0;

        for test in tests {
            current_test += 1;
            
            if self.config.verbose_output {
                println!("🧪 [{}/{}] Running: {} ({})", 
                    current_test, total_tests, test.test_name(), format!("{:?}", test.category()));
            }

            // Execute individual test with enhanced tracking
            let enhanced_results = self.execute_single_test(test)?;
            
            // Add results to collection
            self.results.extend(enhanced_results);

            // Check if we should stop on failure
            if self.config.stop_on_first_failure {
                let has_failures = self.results.iter().any(|r| !r.basic_result.success);
                if has_failures {
                    if self.config.verbose_output {
                        println!("❌ Stopping execution due to failure (stop_on_first_failure = true)");
                    }
                    break;
                }
            }

            // Check execution time limit
            if let Some(max_time_ms) = self.config.max_execution_time_ms {
                if let Some(start_time) = self.execution_start_time {
                    let elapsed = start_time.elapsed().as_millis() as u64;
                    if elapsed > max_time_ms {
                        if self.config.verbose_output {
                            println!("⏰ Stopping execution due to time limit ({}ms)", max_time_ms);
                        }
                        break;
                    }
                }
            }
        }

        Ok(())
    }

    /// Execute a single test with enhanced metrics
    fn execute_single_test(&self, test: &Box<dyn ComprehensiveApiTest>) -> Result<Vec<EnhancedTestResult>, String> {
        let mut enhanced_results = Vec::new();
        let test_start_time = Instant::now();

        // Run the actual test
        let basic_results = test.run_test();
        let test_execution_time = test_start_time.elapsed();

        // Convert basic results to enhanced results
        for basic_result in basic_results {
            let enhanced_result = EnhancedTestResult {
                execution_time: test_execution_time / basic_results.len() as u32, // Approximate per-test time
                memory_usage_mb: None, // Could be implemented with system monitoring
                category: test.category(),
                priority: test.priority(),
                retry_count: 0, // Could implement retry logic
                extendscript_validation_details: self.analyze_extendscript_validation(&basic_result),
                basic_result,
            };

            enhanced_results.push(enhanced_result);

            if self.config.verbose_output {
                let status = if enhanced_result.basic_result.success { "✅" } else { "❌" };
                println!("  {} {}: {} ({}ms)", 
                    status, 
                    enhanced_result.basic_result.test_name,
                    enhanced_result.basic_result.api_path,
                    enhanced_result.execution_time.as_millis());
            }
        }

        Ok(enhanced_results)
    }

    /// Analyze ExtendScript validation details
    fn analyze_extendscript_validation(&self, result: &ApiTestResult) -> Option<ExtendScriptValidationDetails> {
        // This would analyze the test execution for ExtendScript-specific metrics
        // For now, providing a basic implementation
        Some(ExtendScriptValidationDetails {
            script_length: 0, // Would be calculated from actual script
            syntax_validation_time_ms: result.performance_ms.unwrap_or(0) / 2,
            api_validation_time_ms: result.performance_ms.unwrap_or(0) / 2,
            property_validations: if result.api_path.contains(".") { 1 } else { 0 },
            method_validations: if result.api_path.contains("(") { 1 } else { 0 },
            expression_validations: 0,
            detected_api_calls: vec![result.api_path.clone()],
        })
    }

    /// Generate comprehensive execution statistics
    fn generate_execution_statistics(&self) -> TestExecutionStatistics {
        let total_execution_time = self.execution_start_time
            .map(|start| start.elapsed())
            .unwrap_or(Duration::from_secs(0));

        let total_tests_run = self.results.len();
        let tests_passed = self.results.iter().filter(|r| r.basic_result.success).count();
        let tests_failed = total_tests_run - tests_passed;
        let tests_skipped = 0; // Could implement skipping logic

        // Category breakdown
        let mut category_breakdown = HashMap::new();
        for category in [TestCategory::CoreFoundation, TestCategory::PropertySystem, 
                        TestCategory::LayerSystem, TestCategory::TextSystem,
                        TestCategory::EffectsRendering, TestCategory::AdvancedFeatures,
                        TestCategory::Integration, TestCategory::Performance] {
            let category_results: Vec<_> = self.results.iter()
                .filter(|r| r.category == category)
                .collect();
            
            if !category_results.is_empty() {
                let total = category_results.len();
                let passed = category_results.iter().filter(|r| r.basic_result.success).count();
                let failed = total - passed;
                let avg_time = category_results.iter()
                    .map(|r| r.execution_time.as_millis() as f64)
                    .sum::<f64>() / total as f64;
                let success_rate = (passed as f64 / total as f64) * 100.0;

                category_breakdown.insert(category, CategoryStats {
                    total_tests: total,
                    passed,
                    failed,
                    avg_execution_time_ms: avg_time,
                    success_rate,
                });
            }
        }

        // Priority breakdown
        let mut priority_breakdown = HashMap::new();
        for priority in [TestPriority::Critical, TestPriority::High, TestPriority::Medium, TestPriority::Low] {
            let priority_results: Vec<_> = self.results.iter()
                .filter(|r| r.priority == priority)
                .collect();
            
            if !priority_results.is_empty() {
                let total = priority_results.len();
                let passed = priority_results.iter().filter(|r| r.basic_result.success).count();
                let failed = total - passed;
                let avg_time = priority_results.iter()
                    .map(|r| r.execution_time.as_millis() as f64)
                    .sum::<f64>() / total as f64;
                let success_rate = (passed as f64 / total as f64) * 100.0;

                priority_breakdown.insert(priority, PriorityStats {
                    total_tests: total,
                    passed,
                    failed,
                    avg_execution_time_ms: avg_time,
                    success_rate,
                });
            }
        }

        // Performance metrics
        let execution_times: Vec<u64> = self.results.iter()
            .map(|r| r.execution_time.as_millis() as u64)
            .collect();
        
        let fastest_test_ms = execution_times.iter().min().cloned().unwrap_or(0);
        let slowest_test_ms = execution_times.iter().max().cloned().unwrap_or(0);
        let avg_test_time_ms = if !execution_times.is_empty() {
            execution_times.iter().sum::<u64>() as f64 / execution_times.len() as f64
        } else {
            0.0
        };

        // Calculate median
        let mut sorted_times = execution_times.clone();
        sorted_times.sort();
        let median_test_time_ms = if !sorted_times.is_empty() {
            if sorted_times.len() % 2 == 0 {
                (sorted_times[sorted_times.len() / 2 - 1] + sorted_times[sorted_times.len() / 2]) as f64 / 2.0
            } else {
                sorted_times[sorted_times.len() / 2] as f64
            }
        } else {
            0.0
        };

        // Tests over threshold (> 1000ms)
        let tests_over_threshold_ms: Vec<(String, u64)> = self.results.iter()
            .filter(|r| r.execution_time.as_millis() as u64 > 1000)
            .map(|r| (r.basic_result.test_name.clone(), r.execution_time.as_millis() as u64))
            .collect();

        // Performance distribution
        let mut performance_distribution = HashMap::new();
        for time in &execution_times {
            let range = match time {
                0..=50 => "0-50ms",
                51..=100 => "51-100ms",
                101..=500 => "101-500ms",
                501..=1000 => "501-1000ms",
                1001..=5000 => "1001-5000ms",
                _ => ">5000ms",
            };
            *performance_distribution.entry(range.to_string()).or_insert(0) += 1;
        }

        let performance_metrics = PerformanceMetrics {
            fastest_test_ms,
            slowest_test_ms,
            avg_test_time_ms,
            median_test_time_ms,
            tests_over_threshold_ms,
            performance_distribution,
        };

        // API Coverage metrics
        let total_ae_apis_tested = self.results.iter()
            .map(|r| &r.basic_result.api_path)
            .collect::<std::collections::HashSet<_>>()
            .len();

        let mut apis_by_category = HashMap::new();
        for result in &self.results {
            let category_name = format!("{:?}", result.category);
            *apis_by_category.entry(category_name).or_insert(0) += 1;
        }

        let api_coverage = APICoverageMetrics {
            total_ae_apis_tested,
            apis_by_category,
            coverage_percentage: 0.0, // Would calculate against known AE API count
            missing_critical_apis: Vec::new(), // Would be populated from API analysis
            newly_tested_apis: Vec::new(),
            deprecated_apis_found: Vec::new(),
        };

        // Error analysis
        let mut common_error_patterns = HashMap::new();
        let mut syntax_errors = 0;
        let mut api_not_found_errors = 0;
        let mut property_access_errors = 0;
        let mut method_call_errors = 0;
        let mut expression_errors = 0;
        let mut timeout_errors = 0;

        for result in &self.results {
            if !result.basic_result.success {
                if let Some(error_msg) = &result.basic_result.error_message {
                    // Categorize errors
                    if error_msg.contains("syntax") {
                        syntax_errors += 1;
                    } else if error_msg.contains("not found") || error_msg.contains("undefined") {
                        api_not_found_errors += 1;
                    } else if error_msg.contains("property") {
                        property_access_errors += 1;
                    } else if error_msg.contains("method") || error_msg.contains("function") {
                        method_call_errors += 1;
                    } else if error_msg.contains("expression") {
                        expression_errors += 1;
                    } else if error_msg.contains("timeout") {
                        timeout_errors += 1;
                    }

                    // Count common error patterns
                    let error_key = error_msg.split_whitespace().take(3).collect::<Vec<_>>().join(" ");
                    *common_error_patterns.entry(error_key).or_insert(0) += 1;
                }
            }
        }

        let error_analysis = ErrorAnalysis {
            common_error_patterns,
            syntax_errors,
            api_not_found_errors,
            property_access_errors,
            method_call_errors,
            expression_errors,
            timeout_errors,
        };

        TestExecutionStatistics {
            total_execution_time,
            total_tests_run,
            tests_passed,
            tests_failed,
            tests_skipped,
            category_breakdown,
            priority_breakdown,
            performance_metrics,
            api_coverage,
            error_analysis,
        }
    }

    /// Generate HTML and JSON reports
    fn generate_reports(&self, statistics: &TestExecutionStatistics) -> Result<(), String> {
        // Create output directory
        std::fs::create_dir_all(&self.config.output_directory)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;

        if self.config.generate_json_report {
            self.generate_json_report(statistics)?;
        }

        if self.config.generate_html_report {
            self.generate_html_report(statistics)?;
        }

        Ok(())
    }

    /// Generate JSON report
    fn generate_json_report(&self, statistics: &TestExecutionStatistics) -> Result<(), String> {
        let json_path = Path::new(&self.config.output_directory).join("test_report.json");
        
        // Simple JSON generation (in a real implementation, you'd use serde_json)
        let json_content = format!(r#"{{
    "summary": {{
        "total_tests": {},
        "passed": {},
        "failed": {},
        "success_rate": "{:.2}%",
        "execution_time_ms": {},
        "avg_test_time_ms": {:.2}
    }},
    "performance": {{
        "fastest_test_ms": {},
        "slowest_test_ms": {},
        "median_test_time_ms": {:.2}
    }},
    "coverage": {{
        "total_apis_tested": {},
        "coverage_percentage": {:.2}
    }}
}}"#, 
            statistics.total_tests_run,
            statistics.tests_passed,
            statistics.tests_failed,
            (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 100.0,
            statistics.total_execution_time.as_millis(),
            statistics.performance_metrics.avg_test_time_ms,
            statistics.performance_metrics.fastest_test_ms,
            statistics.performance_metrics.slowest_test_ms,
            statistics.performance_metrics.median_test_time_ms,
            statistics.api_coverage.total_ae_apis_tested,
            statistics.api_coverage.coverage_percentage
        );

        let mut file = File::create(json_path)
            .map_err(|e| format!("Failed to create JSON report: {}", e))?;
        
        file.write_all(json_content.as_bytes())
            .map_err(|e| format!("Failed to write JSON report: {}", e))?;

        Ok(())
    }

    /// Generate HTML report
    fn generate_html_report(&self, statistics: &TestExecutionStatistics) -> Result<(), String> {
        let html_path = Path::new(&self.config.output_directory).join("test_report.html");
        
        let html_content = format!(r#"<!DOCTYPE html>
<html>
<head>
    <title>Adobe After Effects API Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }}
        .summary {{ background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        .stat {{ display: inline-block; margin: 10px 20px 10px 0; }}
        .passed {{ color: #28a745; }}
        .failed {{ color: #dc3545; }}
        .performance {{ background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 3px; }}
        .category {{ margin: 15px 0; padding: 10px; border-left: 4px solid #007acc; }}
        table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
    <h1 class="header">🚀 Adobe After Effects API Test Report</h1>
    
    <div class="summary">
        <h2>📊 Test Execution Summary</h2>
        <div class="stat"><strong>Total Tests:</strong> {}</div>
        <div class="stat passed"><strong>Passed:</strong> {} ({:.1}%)</div>
        <div class="stat failed"><strong>Failed:</strong> {} ({:.1}%)</div>
        <div class="stat"><strong>Execution Time:</strong> {:.2}s</div>
        <div class="stat"><strong>APIs Tested:</strong> {}</div>
    </div>

    <div class="performance">
        <h3>⚡ Performance Metrics</h3>
        <p><strong>Average Test Time:</strong> {:.2}ms</p>
        <p><strong>Fastest Test:</strong> {}ms</p>
        <p><strong>Slowest Test:</strong> {}ms</p>
        <p><strong>Median Test Time:</strong> {:.2}ms</p>
    </div>

    <div class="category">
        <h3>📂 Category Breakdown</h3>
        <table>
            <tr><th>Category</th><th>Total</th><th>Passed</th><th>Failed</th><th>Success Rate</th><th>Avg Time (ms)</th></tr>
            {}
        </table>
    </div>

    <div class="category">
        <h3>🔥 Failed Tests</h3>
        {}
    </div>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        Generated on {} by Enhanced Adobe After Effects API Test Runner v1.0
    </footer>
</body>
</html>"#,
            statistics.total_tests_run,
            statistics.tests_passed,
            (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 100.0,
            statistics.tests_failed,
            (statistics.tests_failed as f64 / statistics.total_tests_run as f64) * 100.0,
            statistics.total_execution_time.as_secs_f64(),
            statistics.api_coverage.total_ae_apis_tested,
            statistics.performance_metrics.avg_test_time_ms,
            statistics.performance_metrics.fastest_test_ms,
            statistics.performance_metrics.slowest_test_ms,
            statistics.performance_metrics.median_test_time_ms,
            self.generate_category_table_html(&statistics.category_breakdown),
            self.generate_failed_tests_html(),
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
        );

        let mut file = File::create(html_path)
            .map_err(|e| format!("Failed to create HTML report: {}", e))?;
        
        file.write_all(html_content.as_bytes())
            .map_err(|e| format!("Failed to write HTML report: {}", e))?;

        Ok(())
    }

    fn generate_category_table_html(&self, category_breakdown: &HashMap<TestCategory, CategoryStats>) -> String {
        let mut html = String::new();
        for (category, stats) in category_breakdown {
            html.push_str(&format!(
                "<tr><td>{:?}</td><td>{}</td><td class=\"passed\">{}</td><td class=\"failed\">{}</td><td>{:.1}%</td><td>{:.2}</td></tr>",
                category, stats.total_tests, stats.passed, stats.failed, stats.success_rate, stats.avg_execution_time_ms
            ));
        }
        html
    }

    fn generate_failed_tests_html(&self) -> String {
        let failed_tests: Vec<_> = self.results.iter()
            .filter(|r| !r.basic_result.success)
            .collect();

        if failed_tests.is_empty() {
            return "<p class=\"passed\">🎉 All tests passed! No failures to report.</p>".to_string();
        }

        let mut html = String::from("<ul>");
        for test in failed_tests.iter().take(10) { // Limit to first 10 failures
            html.push_str(&format!(
                "<li><strong>{}</strong> ({}): {}</li>",
                test.basic_result.test_name,
                test.basic_result.api_path,
                test.basic_result.error_message.as_ref().unwrap_or(&"Unknown error".to_string())
            ));
        }
        if failed_tests.len() > 10 {
            html.push_str(&format!("<li><em>... and {} more failures</em></li>", failed_tests.len() - 10));
        }
        html.push_str("</ul>");
        html
    }

    /// Print execution summary to console
    fn print_summary(&self, statistics: &TestExecutionStatistics) {
        println!("\n=== 📊 ENHANCED TEST EXECUTION SUMMARY ===");
        println!("🧪 Total Tests: {}", statistics.total_tests_run);
        println!("✅ Passed: {} ({:.1}%)", 
                statistics.tests_passed, 
                (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 100.0);
        println!("❌ Failed: {} ({:.1}%)", 
                statistics.tests_failed,
                (statistics.tests_failed as f64 / statistics.total_tests_run as f64) * 100.0);
        println!("⏱️  Total Time: {:.2}s", statistics.total_execution_time.as_secs_f64());
        println!("🎯 APIs Tested: {}", statistics.api_coverage.total_ae_apis_tested);
        println!("⚡ Avg Test Time: {:.2}ms", statistics.performance_metrics.avg_test_time_ms);
        
        if self.config.generate_html_report || self.config.generate_json_report {
            println!("📋 Reports generated in: {}", self.config.output_directory);
        }
        
        println!("=== END SUMMARY ===\n");
    }
}

/// Utility functions for enhanced test runner
impl EnhancedTestRunner {
    /// Quick run with critical tests only
    pub fn run_critical_tests_only() -> Result<TestExecutionStatistics, String> {
        let config = TestExecutionConfig {
            run_critical_only: true,
            run_high_priority: false,
            run_medium_priority: false,
            run_low_priority: false,
            ..Default::default()
        };
        
        let mut runner = EnhancedTestRunner::new(config);
        runner.run_tests()
    }

    /// Quick run for CI/CD pipeline
    pub fn run_for_ci() -> Result<TestExecutionStatistics, String> {
        let config = TestExecutionConfig {
            run_critical_only: false,
            run_high_priority: true,
            run_medium_priority: true,
            run_low_priority: false,
            max_execution_time_ms: Some(120_000), // 2 minutes
            stop_on_first_failure: false,
            verbose_output: false,
            generate_html_report: true,
            generate_json_report: true,
            output_directory: "./ci_test_reports".to_string(),
            ..Default::default()
        };
        
        let mut runner = EnhancedTestRunner::new(config);
        runner.run_tests()
    }

    /// Comprehensive run for development
    pub fn run_comprehensive() -> Result<TestExecutionStatistics, String> {
        let config = TestExecutionConfig {
            run_critical_only: false,
            run_high_priority: true,
            run_medium_priority: true,
            run_low_priority: true,
            max_execution_time_ms: Some(600_000), // 10 minutes
            verbose_output: true,
            generate_html_report: true,
            generate_json_report: true,
            output_directory: "./comprehensive_test_reports".to_string(),
            ..Default::default()
        };
        
        let mut runner = EnhancedTestRunner::new(config);
        runner.run_tests()
    }
}

// Add chrono dependency placeholder for date formatting
mod chrono {
    pub struct Utc;
    impl Utc {
        pub fn now() -> Self { Self }
        pub fn format(&self, _fmt: &str) -> String {
            "2024-01-01 00:00:00 UTC".to_string() // Placeholder
        }
    }
}