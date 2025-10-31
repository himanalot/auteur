// Advanced Reporting with Coverage and Performance Analysis
// Phase 5.2: Comprehensive analysis, trending, and detailed insights for Adobe After Effects API tests

use super::comprehensive::*;
use super::enhanced_test_runner::*;
use std::collections::{HashMap, BTreeMap};
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::time::Duration;

/// Advanced analysis and reporting system for test results
pub struct AdvancedReportingEngine {
    pub api_database: AdobeAfterEffectsApiDatabase,
    pub performance_analyzer: PerformanceAnalyzer,
    pub coverage_analyzer: CoverageAnalyzer,
    pub trend_analyzer: TrendAnalyzer,
    pub report_generator: ReportGenerator,
}

/// Comprehensive Adobe After Effects API database for coverage analysis
#[derive(Debug, Clone)]
pub struct AdobeAfterEffectsApiDatabase {
    pub total_documented_apis: usize,
    pub apis_by_category: HashMap<String, Vec<String>>,
    pub apis_by_version: HashMap<String, Vec<String>>,
    pub deprecated_apis: Vec<String>,
    pub experimental_apis: Vec<String>,
    pub critical_apis: Vec<String>,
    pub performance_sensitive_apis: Vec<String>,
}

impl AdobeAfterEffectsApiDatabase {
    /// Create database with known Adobe After Effects APIs
    pub fn new() -> Self {
        let mut apis_by_category = HashMap::new();
        
        // Application APIs
        apis_by_category.insert("Application".to_string(), vec![
            "app.project".to_string(),
            "app.activeItem".to_string(),
            "app.version".to_string(),
            "app.buildName".to_string(),
            "app.buildNumber".to_string(),
            "app.language".to_string(),
            "app.preferences".to_string(),
            "app.settings".to_string(),
            "app.newProject".to_string(),
            "app.open".to_string(),
            "app.quit".to_string(),
            "app.scheduleTask".to_string(),
            "app.cancelTask".to_string(),
            "app.parseSwatchFile".to_string(),
            "app.watchFolder".to_string(),
            "app.endWatchFolder".to_string(),
            "app.purge".to_string(),
            "app.executeCommand".to_string(),
            "app.findMenuCommandId".to_string(),
            "app.activate".to_string(),
            "app.pauseUpdates".to_string(),
            "app.resumeUpdates".to_string(),
        ]);

        // Project APIs  
        apis_by_category.insert("Project".to_string(), vec![
            "project.items".to_string(),
            "project.numItems".to_string(),
            "project.activeItem".to_string(),
            "project.file".to_string(),
            "project.rootFolder".to_string(),
            "project.save".to_string(),
            "project.saveWithDialog".to_string(),
            "project.close".to_string(),
            "project.bitsPerChannel".to_string(),
            "project.transparencyGridThumbnails".to_string(),
            "project.workingSpace".to_string(),
            "project.workingGamma".to_string(),
            "project.linearizeWorkingSpace".to_string(),
            "project.compensateForSceneReferredProfiles".to_string(),
            "project.displayColorManagement".to_string(),
            "project.renderQueue".to_string(),
            "project.importFile".to_string(),
            "project.importFileWithDialog".to_string(),
            "project.importPlaceholder".to_string(),
            "project.removeUnusedFootage".to_string(),
            "project.reduceProject".to_string(),
            "project.consolidateFootage".to_string(),
            "project.autoFixExpressions".to_string(),
        ]);

        // Layer APIs
        apis_by_category.insert("Layer".to_string(), vec![
            "layer.name".to_string(),
            "layer.index".to_string(),
            "layer.parent".to_string(),
            "layer.time".to_string(),
            "layer.startTime".to_string(),
            "layer.inPoint".to_string(),
            "layer.outPoint".to_string(),
            "layer.duration".to_string(),
            "layer.stretch".to_string(),
            "layer.enabled".to_string(),
            "layer.solo".to_string(),
            "layer.shy".to_string(),
            "layer.locked".to_string(),
            "layer.hasVideo".to_string(),
            "layer.hasAudio".to_string(),
            "layer.active".to_string(),
            "layer.nullLayer".to_string(),
            "layer.selectedProperties".to_string(),
            "layer.comment".to_string(),
            "layer.label".to_string(),
            "layer.source".to_string(),
            "layer.width".to_string(),
            "layer.height".to_string(),
            "layer.quality".to_string(),
            "layer.effectsActive".to_string(),
            "layer.motionBlur".to_string(),
            "layer.threeDLayer".to_string(),
            "layer.threeDPerChar".to_string(),
            "layer.environmentLayer".to_string(),
            "layer.guideLayer".to_string(),
            "layer.adjustmentLayer".to_string(),
            "layer.preserveTransparency".to_string(),
            "layer.blendingMode".to_string(),
            "layer.trackMatteType".to_string(),
            "layer.isTrackMatte".to_string(),
            "layer.hasTrackMatte".to_string(),
            "layer.transform".to_string(),
            "layer.effects".to_string(),
            "layer.mask".to_string(),
            "layer.geometryOption".to_string(),
            "layer.materialOption".to_string(),
            "layer.audioLevels".to_string(),
            "layer.timeRemapping".to_string(),
            "layer.marker".to_string(),
            "layer.duplicate".to_string(),
            "layer.copyToComp".to_string(),
            "layer.remove".to_string(),
            "layer.moveToBeginning".to_string(),
            "layer.moveToEnd".to_string(),
            "layer.moveBefore".to_string(),
            "layer.moveAfter".to_string(),
            "layer.setParentWithJump".to_string(),
            "layer.preCompose".to_string(),
            "layer.openInEssentialGraphics".to_string(),
        ]);

        // Property APIs
        apis_by_category.insert("Property".to_string(), vec![
            "property.name".to_string(),
            "property.matchName".to_string(),
            "property.propertyIndex".to_string(),
            "property.parentProperty".to_string(),
            "property.propertyDepth".to_string(),
            "property.propertyType".to_string(),
            "property.selected".to_string(),
            "property.active".to_string(),
            "property.enabled".to_string(),
            "property.elided".to_string(),
            "property.isModified".to_string(),
            "property.canSetEnabled".to_string(),
            "property.value".to_string(),
            "property.hasMin".to_string(),
            "property.hasMax".to_string(),
            "property.minValue".to_string(),
            "property.maxValue".to_string(),
            "property.isSpatial".to_string(),
            "property.isTemporal".to_string(),
            "property.numKeys".to_string(),
            "property.unitsText".to_string(),
            "property.expression".to_string(),
            "property.expressionEnabled".to_string(),
            "property.expressionError".to_string(),
            "property.canVaryOverTime".to_string(),
            "property.isTimeVarying".to_string(),
            "property.dimensionsSeparated".to_string(),
            "property.isSeparationFollower".to_string(),
            "property.isSeparationLeader".to_string(),
            "property.separationDimension".to_string(),
            "property.separationLeader".to_string(),
            "property.setValue".to_string(),
            "property.setValueAtTime".to_string(),
            "property.setValueAtKey".to_string(),
            "property.valueAtTime".to_string(),
            "property.velocityAtTime".to_string(),
            "property.speedAtTime".to_string(),
            "property.keyInTemporalEase".to_string(),
            "property.keyOutTemporalEase".to_string(),
            "property.keyInSpatialTangent".to_string(),
            "property.keyOutSpatialTangent".to_string(),
            "property.keyInInterpolationType".to_string(),
            "property.keyOutInterpolationType".to_string(),
            "property.keyRoving".to_string(),
            "property.keySelected".to_string(),
            "property.keyTime".to_string(),
            "property.keyValue".to_string(),
            "property.addKey".to_string(),
            "property.removeKey".to_string(),
            "property.nearestKeyIndex".to_string(),
            "property.keyTimes".to_string(),
            "property.keyValues".to_string(),
            "property.setExpression".to_string(),
            "property.duplicate".to_string(),
            "property.moveTo".to_string(),
            "property.copyTo".to_string(),
            "property.remove".to_string(),
            "property.propertyGroup".to_string(),
            "property.setSeparationFollower".to_string(),
        ]);

        // Effects APIs
        apis_by_category.insert("Effects".to_string(), vec![
            "effects.addProperty".to_string(),
            "effects.canAddProperty".to_string(),
            "effects.property".to_string(),
            "effects.numProperties".to_string(),
            "effect.name".to_string(),
            "effect.matchName".to_string(),
            "effect.enabled".to_string(),
            "effect.active".to_string(),
            "effect.property".to_string(),
            "effect.numProperties".to_string(),
            "effect.remove".to_string(),
            "effect.moveTo".to_string(),
            "effect.copyTo".to_string(),
            "effect.duplicate".to_string(),
        ]);

        // Text APIs
        apis_by_category.insert("Text".to_string(), vec![
            "textLayer.sourceText".to_string(),
            "textLayer.text".to_string(),
            "textLayer.font".to_string(),
            "textLayer.fontSize".to_string(),
            "textLayer.applyFill".to_string(),
            "textLayer.applyStroke".to_string(),
            "textLayer.fillColor".to_string(),
            "textLayer.strokeColor".to_string(),
            "textLayer.strokeWidth".to_string(),
            "textLayer.strokeOverFill".to_string(),
            "textLayer.justification".to_string(),
            "textLayer.tracking".to_string(),
            "textLayer.leading".to_string(),
            "textLayer.baselineShift".to_string(),
            "textLayer.fauxBold".to_string(),
            "textLayer.fauxItalic".to_string(),
            "textLayer.allCaps".to_string(),
            "textLayer.smallCaps".to_string(),
            "textLayer.superscript".to_string(),
            "textLayer.subscript".to_string(),
            "textLayer.verticalScale".to_string(),
            "textLayer.horizontalScale".to_string(),
            "textLayer.tsume".to_string(),
        ]);

        // Render Queue APIs
        apis_by_category.insert("RenderQueue".to_string(), vec![
            "renderQueue.items".to_string(),
            "renderQueue.numItems".to_string(),
            "renderQueue.canQueueInAME".to_string(),
            "renderQueue.queueInAME".to_string(),
            "renderQueue.render".to_string(),
            "renderQueue.pauseRendering".to_string(),
            "renderQueue.stopRendering".to_string(),
            "renderQueue.showWindow".to_string(),
            "renderQueueItem.comp".to_string(),
            "renderQueueItem.status".to_string(),
            "renderQueueItem.startTime".to_string(),
            "renderQueueItem.elapsedSeconds".to_string(),
            "renderQueueItem.timeSpanStart".to_string(),
            "renderQueueItem.timeSpanDuration".to_string(),
            "renderQueueItem.skipFrames".to_string(),
            "renderQueueItem.render".to_string(),
            "renderQueueItem.duplicate".to_string(),
            "renderQueueItem.remove".to_string(),
            "renderQueueItem.saveAsTemplate".to_string(),
            "renderQueueItem.applyTemplate".to_string(),
            "renderQueueItem.outputModule".to_string(),
            "renderQueueItem.outputModules".to_string(),
            "renderQueueItem.numOutputModules".to_string(),
        ]);

        Self {
            total_documented_apis: 500, // Estimated total AE API count
            apis_by_category,
            apis_by_version: HashMap::new(),
            deprecated_apis: vec![
                "app.enableRedrawRegions".to_string(),
                "app.isRenderEngine".to_string(),
                "layer.collapseTransformation".to_string(),
                "project.xmpPacket".to_string(),
            ],
            experimental_apis: vec![
                "app.scheduleTask".to_string(),
                "layer.openInEssentialGraphics".to_string(),
                "project.autoFixExpressions".to_string(),
            ],
            critical_apis: vec![
                "app.project".to_string(),
                "app.activeItem".to_string(),
                "project.items".to_string(),
                "layer.transform".to_string(),
                "property.setValue".to_string(),
                "property.setValueAtTime".to_string(),
                "effects.addProperty".to_string(),
                "layer.duplicate".to_string(),
                "renderQueue.render".to_string(),
            ],
            performance_sensitive_apis: vec![
                "property.valueAtTime".to_string(),
                "property.velocityAtTime".to_string(),
                "renderQueue.render".to_string(),
                "layer.duplicate".to_string(),
                "effects.addProperty".to_string(),
                "project.save".to_string(),
                "app.purge".to_string(),
            ],
        }
    }

    /// Get total number of APIs in a category
    pub fn get_category_api_count(&self, category: &str) -> usize {
        self.apis_by_category.get(category).map(|apis| apis.len()).unwrap_or(0)
    }

    /// Check if an API is critical
    pub fn is_critical_api(&self, api_path: &str) -> bool {
        self.critical_apis.iter().any(|critical| api_path.contains(critical))
    }

    /// Check if an API is performance sensitive
    pub fn is_performance_sensitive(&self, api_path: &str) -> bool {
        self.performance_sensitive_apis.iter().any(|sensitive| api_path.contains(sensitive))
    }

    /// Check if an API is deprecated
    pub fn is_deprecated_api(&self, api_path: &str) -> bool {
        self.deprecated_apis.iter().any(|deprecated| api_path.contains(deprecated))
    }
}

/// Advanced performance analysis for test results
#[derive(Debug)]
pub struct PerformanceAnalyzer;

impl PerformanceAnalyzer {
    /// Analyze performance trends across test categories
    pub fn analyze_category_performance(&self, results: &[EnhancedTestResult]) -> CategoryPerformanceAnalysis {
        let mut category_stats = HashMap::new();

        for result in results {
            let category = format!("{:?}", result.category);
            let entry = category_stats.entry(category).or_insert(CategoryPerformanceData {
                execution_times: Vec::new(),
                success_count: 0,
                failure_count: 0,
                total_api_calls: 0,
            });

            entry.execution_times.push(result.execution_time.as_millis() as f64);
            entry.total_api_calls += 1;
            
            if result.basic_result.success {
                entry.success_count += 1;
            } else {
                entry.failure_count += 1;
            }
        }

        // Calculate statistics for each category
        let mut analysis = HashMap::new();
        for (category, data) in category_stats {
            let avg_time = data.execution_times.iter().sum::<f64>() / data.execution_times.len() as f64;
            let min_time = data.execution_times.iter().fold(f64::INFINITY, |a, &b| a.min(b));
            let max_time = data.execution_times.iter().fold(0.0, |a, &b| a.max(b));
            
            // Calculate percentiles
            let mut sorted_times = data.execution_times.clone();
            sorted_times.sort_by(|a, b| a.partial_cmp(b).unwrap());
            let p50 = sorted_times[sorted_times.len() / 2];
            let p95 = sorted_times[(sorted_times.len() as f64 * 0.95) as usize];
            let p99 = sorted_times[(sorted_times.len() as f64 * 0.99) as usize];

            analysis.insert(category, CategoryPerformanceStats {
                avg_execution_time_ms: avg_time,
                min_execution_time_ms: min_time,
                max_execution_time_ms: max_time,
                p50_execution_time_ms: p50,
                p95_execution_time_ms: p95,
                p99_execution_time_ms: p99,
                success_rate: data.success_count as f64 / data.total_api_calls as f64,
                total_api_calls: data.total_api_calls,
                performance_score: Self::calculate_performance_score(avg_time, data.success_count as f64 / data.total_api_calls as f64),
            });
        }

        CategoryPerformanceAnalysis { category_stats: analysis }
    }

    /// Calculate performance score (0-100) based on speed and success rate
    fn calculate_performance_score(avg_time_ms: f64, success_rate: f64) -> f64 {
        let time_score = (1000.0 - avg_time_ms.min(1000.0)) / 1000.0 * 100.0; // 0-100 based on speed
        let success_score = success_rate * 100.0; // 0-100 based on success rate
        (time_score * 0.3 + success_score * 0.7).max(0.0).min(100.0) // Weighted score
    }

    /// Identify performance bottlenecks
    pub fn identify_bottlenecks(&self, results: &[EnhancedTestResult]) -> PerformanceBottlenecks {
        let mut slow_apis = Vec::new();
        let mut failing_apis = Vec::new();
        let mut inconsistent_apis = Vec::new();

        // Group results by API path
        let mut api_groups: HashMap<String, Vec<&EnhancedTestResult>> = HashMap::new();
        for result in results {
            api_groups.entry(result.basic_result.api_path.clone()).or_default().push(result);
        }

        for (api_path, api_results) in api_groups {
            let avg_time = api_results.iter()
                .map(|r| r.execution_time.as_millis() as f64)
                .sum::<f64>() / api_results.len() as f64;
            
            let success_rate = api_results.iter()
                .filter(|r| r.basic_result.success)
                .count() as f64 / api_results.len() as f64;

            let time_variance = {
                let times: Vec<f64> = api_results.iter()
                    .map(|r| r.execution_time.as_millis() as f64)
                    .collect();
                let variance = times.iter()
                    .map(|t| (t - avg_time).powi(2))
                    .sum::<f64>() / times.len() as f64;
                variance.sqrt()
            };

            // Identify bottlenecks
            if avg_time > 500.0 {
                slow_apis.push(BottleneckInfo {
                    api_path: api_path.clone(),
                    severity: if avg_time > 2000.0 { "Critical".to_string() } else { "High".to_string() },
                    avg_execution_time_ms: avg_time,
                    details: format!("Average execution time: {:.2}ms", avg_time),
                });
            }

            if success_rate < 0.8 {
                failing_apis.push(BottleneckInfo {
                    api_path: api_path.clone(),
                    severity: if success_rate < 0.5 { "Critical".to_string() } else { "High".to_string() },
                    avg_execution_time_ms: avg_time,
                    details: format!("Success rate: {:.1}%", success_rate * 100.0),
                });
            }

            if time_variance > avg_time * 0.5 {
                inconsistent_apis.push(BottleneckInfo {
                    api_path: api_path.clone(),
                    severity: "Medium".to_string(),
                    avg_execution_time_ms: avg_time,
                    details: format!("High variance: {:.2}ms std dev", time_variance),
                });
            }
        }

        // Sort by severity and performance impact
        slow_apis.sort_by(|a, b| b.avg_execution_time_ms.partial_cmp(&a.avg_execution_time_ms).unwrap());
        failing_apis.sort_by(|a, b| a.severity.cmp(&b.severity));

        PerformanceBottlenecks {
            slow_apis: slow_apis.into_iter().take(10).collect(),
            failing_apis: failing_apis.into_iter().take(10).collect(),
            inconsistent_apis: inconsistent_apis.into_iter().take(10).collect(),
        }
    }

    /// Generate performance recommendations
    pub fn generate_recommendations(&self, bottlenecks: &PerformanceBottlenecks) -> Vec<PerformanceRecommendation> {
        let mut recommendations = Vec::new();

        for slow_api in &bottlenecks.slow_apis {
            if slow_api.avg_execution_time_ms > 2000.0 {
                recommendations.push(PerformanceRecommendation {
                    priority: "High".to_string(),
                    api_path: slow_api.api_path.clone(),
                    issue: "Extremely slow execution".to_string(),
                    recommendation: "Consider optimizing script validation or reducing test complexity".to_string(),
                    estimated_impact: "20-50% performance improvement".to_string(),
                });
            }
        }

        for failing_api in &bottlenecks.failing_apis {
            if failing_api.severity == "Critical" {
                recommendations.push(PerformanceRecommendation {
                    priority: "Critical".to_string(),
                    api_path: failing_api.api_path.clone(),
                    issue: "High failure rate".to_string(),
                    recommendation: "Review API implementation and add better error handling".to_string(),
                    estimated_impact: "Significantly improved test reliability".to_string(),
                });
            }
        }

        recommendations
    }
}

/// Advanced coverage analysis for API testing
#[derive(Debug)]
pub struct CoverageAnalyzer;

impl CoverageAnalyzer {
    /// Analyze API coverage against known After Effects APIs
    pub fn analyze_api_coverage(&self, results: &[EnhancedTestResult], api_db: &AdobeAfterEffectsApiDatabase) -> APICoverageAnalysisDetailed {
        let tested_apis: std::collections::HashSet<String> = results.iter()
            .map(|r| r.basic_result.api_path.clone())
            .collect();

        let mut coverage_by_category = HashMap::new();
        let mut missing_critical_apis = Vec::new();
        let mut untested_apis = Vec::new();

        for (category, category_apis) in &api_db.apis_by_category {
            let tested_in_category = category_apis.iter()
                .filter(|api| tested_apis.iter().any(|tested| tested.contains(*api)))
                .count();
            
            let coverage_percentage = (tested_in_category as f64 / category_apis.len() as f64) * 100.0;
            
            coverage_by_category.insert(category.clone(), APICategoryCoverage {
                total_apis: category_apis.len(),
                tested_apis: tested_in_category,
                coverage_percentage,
                missing_apis: category_apis.iter()
                    .filter(|api| !tested_apis.iter().any(|tested| tested.contains(*api)))
                    .cloned()
                    .collect(),
            });

            // Find missing critical APIs
            for api in category_apis {
                if api_db.is_critical_api(api) && !tested_apis.iter().any(|tested| tested.contains(api)) {
                    missing_critical_apis.push(api.clone());
                }
                
                if !tested_apis.iter().any(|tested| tested.contains(api)) {
                    untested_apis.push(api.clone());
                }
            }
        }

        let overall_coverage = (tested_apis.len() as f64 / api_db.total_documented_apis as f64) * 100.0;

        APICoverageAnalysisDetailed {
            overall_coverage_percentage: overall_coverage,
            total_documented_apis: api_db.total_documented_apis,
            total_tested_apis: tested_apis.len(),
            coverage_by_category,
            missing_critical_apis,
            untested_apis: untested_apis.into_iter().take(50).collect(), // Limit to top 50
            deprecated_apis_tested: tested_apis.iter()
                .filter(|api| api_db.is_deprecated_api(api))
                .cloned()
                .collect(),
            experimental_apis_tested: tested_apis.iter()
                .filter(|api| api_db.experimental_apis.iter().any(|exp| api.contains(exp)))
                .cloned()
                .collect(),
        }
    }

    /// Generate coverage improvement recommendations
    pub fn generate_coverage_recommendations(&self, coverage: &APICoverageAnalysisDetailed) -> Vec<CoverageRecommendation> {
        let mut recommendations = Vec::new();

        // Critical API recommendations
        if !coverage.missing_critical_apis.is_empty() {
            recommendations.push(CoverageRecommendation {
                priority: "Critical".to_string(),
                category: "Critical APIs".to_string(),
                recommendation: format!("Add tests for {} critical APIs", coverage.missing_critical_apis.len()),
                apis_to_test: coverage.missing_critical_apis.iter().take(5).cloned().collect(),
                estimated_effort: "High".to_string(),
                business_impact: "Essential for core functionality validation".to_string(),
            });
        }

        // Category-specific recommendations
        for (category, cat_coverage) in &coverage.coverage_by_category {
            if cat_coverage.coverage_percentage < 50.0 {
                recommendations.push(CoverageRecommendation {
                    priority: "High".to_string(),
                    category: category.clone(),
                    recommendation: format!("Improve {} coverage from {:.1}% to 80%+", category, cat_coverage.coverage_percentage),
                    apis_to_test: cat_coverage.missing_apis.iter().take(10).cloned().collect(),
                    estimated_effort: "Medium".to_string(),
                    business_impact: format!("Better validation of {} functionality", category),
                });
            } else if cat_coverage.coverage_percentage < 80.0 {
                recommendations.push(CoverageRecommendation {
                    priority: "Medium".to_string(),
                    category: category.clone(),
                    recommendation: format!("Complete {} coverage from {:.1}% to 95%+", category, cat_coverage.coverage_percentage),
                    apis_to_test: cat_coverage.missing_apis.iter().take(5).cloned().collect(),
                    estimated_effort: "Low".to_string(),
                    business_impact: format!("Comprehensive {} validation", category),
                });
            }
        }

        recommendations
    }
}

/// Trend analysis for tracking test performance over time
#[derive(Debug)]
pub struct TrendAnalyzer {
    pub historical_data: Vec<HistoricalTestRun>,
}

impl TrendAnalyzer {
    pub fn new() -> Self {
        Self {
            historical_data: Vec::new(),
        }
    }

    /// Add a test run to historical data
    pub fn add_test_run(&mut self, timestamp: String, statistics: TestExecutionStatistics) {
        self.historical_data.push(HistoricalTestRun {
            timestamp,
            total_tests: statistics.total_tests_run,
            passed_tests: statistics.tests_passed,
            failed_tests: statistics.tests_failed,
            avg_execution_time_ms: statistics.performance_metrics.avg_test_time_ms,
            total_execution_time_ms: statistics.total_execution_time.as_millis() as f64,
            api_coverage_percentage: statistics.api_coverage.coverage_percentage,
        });
    }

    /// Analyze performance trends
    pub fn analyze_trends(&self) -> TrendAnalysis {
        if self.historical_data.len() < 2 {
            return TrendAnalysis {
                performance_trend: "Insufficient data".to_string(),
                success_rate_trend: "Insufficient data".to_string(),
                coverage_trend: "Insufficient data".to_string(),
                recommendations: Vec::new(),
            };
        }

        let recent = &self.historical_data[self.historical_data.len() - 1];
        let previous = &self.historical_data[self.historical_data.len() - 2];

        // Calculate trends
        let perf_change = ((recent.avg_execution_time_ms - previous.avg_execution_time_ms) / previous.avg_execution_time_ms) * 100.0;
        let success_change = ((recent.passed_tests as f64 / recent.total_tests as f64) - 
                             (previous.passed_tests as f64 / previous.total_tests as f64)) * 100.0;
        let coverage_change = recent.api_coverage_percentage - previous.api_coverage_percentage;

        let performance_trend = if perf_change.abs() < 5.0 {
            "Stable".to_string()
        } else if perf_change > 0.0 {
            format!("Slower ({:+.1}%)", perf_change)
        } else {
            format!("Faster ({:+.1}%)", perf_change)
        };

        let success_rate_trend = if success_change.abs() < 2.0 {
            "Stable".to_string()
        } else if success_change > 0.0 {
            format!("Improving ({:+.1}%)", success_change)
        } else {
            format!("Declining ({:+.1}%)", success_change)
        };

        let coverage_trend = if coverage_change.abs() < 1.0 {
            "Stable".to_string()
        } else if coverage_change > 0.0 {
            format!("Increasing ({:+.1}%)", coverage_change)
        } else {
            format!("Decreasing ({:+.1}%)", coverage_change)
        };

        TrendAnalysis {
            performance_trend,
            success_rate_trend,
            coverage_trend,
            recommendations: self.generate_trend_recommendations(perf_change, success_change, coverage_change),
        }
    }

    fn generate_trend_recommendations(&self, perf_change: f64, success_change: f64, coverage_change: f64) -> Vec<String> {
        let mut recommendations = Vec::new();

        if perf_change > 10.0 {
            recommendations.push("Performance is declining significantly - investigate slow tests".to_string());
        }

        if success_change < -5.0 {
            recommendations.push("Success rate is declining - review recent API changes".to_string());
        }

        if coverage_change < -2.0 {
            recommendations.push("API coverage is decreasing - add tests for new APIs".to_string());
        }

        if recommendations.is_empty() {
            recommendations.push("Test suite performance is stable".to_string());
        }

        recommendations
    }
}

/// Comprehensive report generator
#[derive(Debug)]
pub struct ReportGenerator;

impl ReportGenerator {
    /// Generate executive summary report
    pub fn generate_executive_summary(&self, 
        statistics: &TestExecutionStatistics,
        coverage: &APICoverageAnalysisDetailed,
        performance: &CategoryPerformanceAnalysis,
        bottlenecks: &PerformanceBottlenecks,
        trends: &TrendAnalysis) -> String {
        
        format!(r#"
# 🚀 Adobe After Effects API Test Suite - Executive Summary

## 📊 Overall Health Score: {}

### Key Metrics
- **Test Success Rate**: {:.1}%
- **API Coverage**: {:.1}%
- **Performance Score**: {:.1}/100
- **Total Tests Executed**: {}
- **Execution Time**: {:.2}s

### 🎯 Critical Findings

#### ✅ Strengths
{}

#### ⚠️ Areas for Improvement
{}

#### 🔥 Critical Issues
{}

### 📈 Trends
- **Performance**: {}
- **Success Rate**: {}
- **Coverage**: {}

### 🚀 Next Steps
{}

---
*Generated by Advanced Adobe After Effects API Test Analysis Engine*
"#,
            self.calculate_overall_health_score(statistics, coverage, performance),
            (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 100.0,
            coverage.overall_coverage_percentage,
            self.calculate_overall_performance_score(performance),
            statistics.total_tests_run,
            statistics.total_execution_time.as_secs_f64(),
            self.format_strengths(statistics, coverage, performance),
            self.format_improvement_areas(coverage, bottlenecks),
            self.format_critical_issues(bottlenecks),
            trends.performance_trend,
            trends.success_rate_trend,
            trends.coverage_trend,
            self.format_next_steps(coverage, bottlenecks)
        )
    }

    fn calculate_overall_health_score(&self, statistics: &TestExecutionStatistics, coverage: &APICoverageAnalysisDetailed, performance: &CategoryPerformanceAnalysis) -> String {
        let success_score = (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 40.0;
        let coverage_score = (coverage.overall_coverage_percentage / 100.0) * 30.0;
        let performance_score = (self.calculate_overall_performance_score(performance) / 100.0) * 30.0;
        
        let overall = success_score + coverage_score + performance_score;
        
        match overall as u32 {
            90..=100 => "🟢 Excellent (90+)".to_string(),
            80..=89 => "🟡 Good (80-89)".to_string(),
            70..=79 => "🟠 Fair (70-79)".to_string(),
            _ => "🔴 Needs Improvement (<70)".to_string(),
        }
    }

    fn calculate_overall_performance_score(&self, performance: &CategoryPerformanceAnalysis) -> f64 {
        if performance.category_stats.is_empty() {
            return 0.0;
        }
        
        performance.category_stats.values()
            .map(|stats| stats.performance_score)
            .sum::<f64>() / performance.category_stats.len() as f64
    }

    fn format_strengths(&self, statistics: &TestExecutionStatistics, coverage: &APICoverageAnalysisDetailed, performance: &CategoryPerformanceAnalysis) -> String {
        let mut strengths = Vec::new();
        
        if statistics.tests_passed as f64 / statistics.total_tests_run as f64 > 0.95 {
            strengths.push("Excellent test success rate (95%+)");
        }
        
        if coverage.overall_coverage_percentage > 80.0 {
            strengths.push("High API coverage");
        }
        
        if performance.category_stats.values().any(|stats| stats.performance_score > 85.0) {
            strengths.push("Strong performance in key areas");
        }
        
        if strengths.is_empty() {
            "• Test framework is operational".to_string()
        } else {
            strengths.iter().map(|s| format!("• {}", s)).collect::<Vec<_>>().join("\n")
        }
    }

    fn format_improvement_areas(&self, coverage: &APICoverageAnalysisDetailed, bottlenecks: &PerformanceBottlenecks) -> String {
        let mut areas = Vec::new();
        
        if coverage.overall_coverage_percentage < 70.0 {
            areas.push(format!("Low API coverage ({:.1}%)", coverage.overall_coverage_percentage));
        }
        
        if !bottlenecks.slow_apis.is_empty() {
            areas.push(format!("{} APIs with slow performance", bottlenecks.slow_apis.len()));
        }
        
        if !coverage.missing_critical_apis.is_empty() {
            areas.push(format!("{} critical APIs not tested", coverage.missing_critical_apis.len()));
        }
        
        if areas.is_empty() {
            "• No major improvement areas identified".to_string()
        } else {
            areas.iter().map(|a| format!("• {}", a)).collect::<Vec<_>>().join("\n")
        }
    }

    fn format_critical_issues(&self, bottlenecks: &PerformanceBottlenecks) -> String {
        let mut issues = Vec::new();
        
        for failing_api in &bottlenecks.failing_apis {
            if failing_api.severity == "Critical" {
                issues.push(format!("API failure: {}", failing_api.api_path));
            }
        }
        
        for slow_api in &bottlenecks.slow_apis {
            if slow_api.severity == "Critical" {
                issues.push(format!("Performance issue: {}", slow_api.api_path));
            }
        }
        
        if issues.is_empty() {
            "• No critical issues detected".to_string()
        } else {
            issues.iter().map(|i| format!("• {}", i)).collect::<Vec<_>>().join("\n")
        }
    }

    fn format_next_steps(&self, coverage: &APICoverageAnalysisDetailed, bottlenecks: &PerformanceBottlenecks) -> String {
        let mut steps = Vec::new();
        
        if !coverage.missing_critical_apis.is_empty() {
            steps.push("1. Add tests for missing critical APIs");
        }
        
        if !bottlenecks.failing_apis.is_empty() {
            steps.push("2. Fix failing API tests");
        }
        
        if !bottlenecks.slow_apis.is_empty() {
            steps.push("3. Optimize slow-performing tests");
        }
        
        if coverage.overall_coverage_percentage < 80.0 {
            steps.push("4. Expand API coverage to 80%+");
        }
        
        if steps.is_empty() {
            steps.push("1. Maintain current test quality");
            steps.push("2. Monitor for new API additions");
        }
        
        steps.join("\n")
    }

    /// Generate detailed technical report
    pub fn generate_detailed_report(&self, output_dir: &str, 
        statistics: &TestExecutionStatistics,
        coverage: &APICoverageAnalysisDetailed,
        performance: &CategoryPerformanceAnalysis,
        bottlenecks: &PerformanceBottlenecks) -> Result<(), String> {
        
        // Create detailed HTML report
        let html_content = self.generate_detailed_html_report(statistics, coverage, performance, bottlenecks);
        let html_path = Path::new(output_dir).join("detailed_analysis_report.html");
        let mut html_file = File::create(html_path)
            .map_err(|e| format!("Failed to create detailed HTML report: {}", e))?;
        html_file.write_all(html_content.as_bytes())
            .map_err(|e| format!("Failed to write detailed HTML report: {}", e))?;

        // Create coverage CSV report
        let csv_content = self.generate_coverage_csv_report(coverage);
        let csv_path = Path::new(output_dir).join("api_coverage_analysis.csv");
        let mut csv_file = File::create(csv_path)
            .map_err(|e| format!("Failed to create CSV report: {}", e))?;
        csv_file.write_all(csv_content.as_bytes())
            .map_err(|e| format!("Failed to write CSV report: {}", e))?;

        // Create performance JSON report
        let json_content = self.generate_performance_json_report(performance, bottlenecks);
        let json_path = Path::new(output_dir).join("performance_analysis.json");
        let mut json_file = File::create(json_path)
            .map_err(|e| format!("Failed to create JSON report: {}", e))?;
        json_file.write_all(json_content.as_bytes())
            .map_err(|e| format!("Failed to write JSON report: {}", e))?;

        Ok(())
    }

    fn generate_detailed_html_report(&self, statistics: &TestExecutionStatistics, coverage: &APICoverageAnalysisDetailed, performance: &CategoryPerformanceAnalysis, bottlenecks: &PerformanceBottlenecks) -> String {
        format!(r#"<!DOCTYPE html>
<html>
<head>
    <title>Adobe After Effects API - Detailed Analysis Report</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f7fa; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }}
        .metric-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }}
        .metric-card {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }}
        .metric-value {{ font-size: 2.5em; font-weight: bold; margin: 10px 0; }}
        .metric-label {{ font-size: 1.1em; opacity: 0.9; }}
        .section {{ margin: 40px 0; }}
        .section h2 {{ color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #34495e; color: white; }}
        .critical {{ color: #e74c3c; font-weight: bold; }}
        .warning {{ color: #f39c12; font-weight: bold; }}
        .success {{ color: #27ae60; font-weight: bold; }}
        .chart-placeholder {{ background: #ecf0f1; height: 300px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin: 20px 0; }}
        .recommendation {{ background: #e8f6f3; border-left: 4px solid #1abc9c; padding: 15px; margin: 10px 0; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Adobe After Effects API - Advanced Analysis Report</h1>
            <p>Comprehensive test coverage, performance analysis, and recommendations</p>
        </div>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">{:.1}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{:.1}%</div>
                <div class="metric-label">API Coverage</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{:.1}s</div>
                <div class="metric-label">Execution Time</div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 API Coverage Analysis</h2>
            <table>
                <tr><th>Category</th><th>Total APIs</th><th>Tested</th><th>Coverage</th><th>Status</th></tr>
                {}
            </table>
        </div>

        <div class="section">
            <h2>⚡ Performance Analysis by Category</h2>
            <table>
                <tr><th>Category</th><th>Avg Time (ms)</th><th>Success Rate</th><th>Performance Score</th><th>Status</th></tr>
                {}
            </table>
        </div>

        <div class="section">
            <h2>🔍 Performance Bottlenecks</h2>
            <h3>Slow APIs</h3>
            <table>
                <tr><th>API Path</th><th>Avg Time (ms)</th><th>Severity</th><th>Details</th></tr>
                {}
            </table>
            
            <h3>Failing APIs</h3>
            <table>
                <tr><th>API Path</th><th>Severity</th><th>Details</th></tr>
                {}
            </table>
        </div>

        <div class="section">
            <h2>📋 Recommendations</h2>
            {}
        </div>

        <footer style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center; color: #7f8c8d;">
            <p>Generated by Advanced Adobe After Effects API Test Analysis Engine</p>
            <p>Report Date: {}</p>
        </footer>
    </div>
</body>
</html>"#,
            (statistics.tests_passed as f64 / statistics.total_tests_run as f64) * 100.0,
            coverage.overall_coverage_percentage,
            statistics.total_tests_run,
            statistics.total_execution_time.as_secs_f64(),
            self.generate_coverage_table_rows(coverage),
            self.generate_performance_table_rows(performance),
            self.generate_bottleneck_slow_table_rows(bottlenecks),
            self.generate_bottleneck_failing_table_rows(bottlenecks),
            self.generate_recommendations_html(coverage, bottlenecks),
            "2024-01-01 00:00:00 UTC"
        )
    }

    fn generate_coverage_table_rows(&self, coverage: &APICoverageAnalysisDetailed) -> String {
        coverage.coverage_by_category.iter()
            .map(|(category, cat_coverage)| {
                let status_class = if cat_coverage.coverage_percentage >= 80.0 { "success" } 
                                   else if cat_coverage.coverage_percentage >= 60.0 { "warning" } 
                                   else { "critical" };
                format!(
                    "<tr><td>{}</td><td>{}</td><td>{}</td><td class=\"{}\">{:.1}%</td><td class=\"{}\">{}</td></tr>",
                    category,
                    cat_coverage.total_apis,
                    cat_coverage.tested_apis,
                    status_class,
                    cat_coverage.coverage_percentage,
                    status_class,
                    if cat_coverage.coverage_percentage >= 80.0 { "Good" } 
                    else if cat_coverage.coverage_percentage >= 60.0 { "Fair" } 
                    else { "Poor" }
                )
            })
            .collect::<Vec<_>>()
            .join("")
    }

    fn generate_performance_table_rows(&self, performance: &CategoryPerformanceAnalysis) -> String {
        performance.category_stats.iter()
            .map(|(category, stats)| {
                let time_class = if stats.avg_execution_time_ms <= 100.0 { "success" } 
                                else if stats.avg_execution_time_ms <= 500.0 { "warning" } 
                                else { "critical" };
                let score_class = if stats.performance_score >= 80.0 { "success" } 
                                 else if stats.performance_score >= 60.0 { "warning" } 
                                 else { "critical" };
                format!(
                    "<tr><td>{}</td><td class=\"{}\">{:.1}</td><td class=\"success\">{:.1}%</td><td class=\"{}\">{:.1}</td><td class=\"{}\">{}</td></tr>",
                    category,
                    time_class,
                    stats.avg_execution_time_ms,
                    stats.success_rate * 100.0,
                    score_class,
                    stats.performance_score,
                    score_class,
                    if stats.performance_score >= 80.0 { "Excellent" } 
                    else if stats.performance_score >= 60.0 { "Good" } 
                    else { "Needs Work" }
                )
            })
            .collect::<Vec<_>>()
            .join("")
    }

    fn generate_bottleneck_slow_table_rows(&self, bottlenecks: &PerformanceBottlenecks) -> String {
        bottlenecks.slow_apis.iter()
            .map(|api| {
                let class = if api.severity == "Critical" { "critical" } else { "warning" };
                format!(
                    "<tr><td>{}</td><td class=\"{}\">{:.1}</td><td class=\"{}\">{}</td><td>{}</td></tr>",
                    api.api_path,
                    class,
                    api.avg_execution_time_ms,
                    class,
                    api.severity,
                    api.details
                )
            })
            .collect::<Vec<_>>()
            .join("")
    }

    fn generate_bottleneck_failing_table_rows(&self, bottlenecks: &PerformanceBottlenecks) -> String {
        bottlenecks.failing_apis.iter()
            .map(|api| {
                let class = if api.severity == "Critical" { "critical" } else { "warning" };
                format!(
                    "<tr><td>{}</td><td class=\"{}\">{}</td><td>{}</td></tr>",
                    api.api_path,
                    class,
                    api.severity,
                    api.details
                )
            })
            .collect::<Vec<_>>()
            .join("")
    }

    fn generate_recommendations_html(&self, coverage: &APICoverageAnalysisDetailed, bottlenecks: &PerformanceBottlenecks) -> String {
        let mut recommendations = Vec::new();

        if !coverage.missing_critical_apis.is_empty() {
            recommendations.push(format!(
                "<div class=\"recommendation\"><strong>Critical:</strong> Add tests for {} critical APIs: {}</div>",
                coverage.missing_critical_apis.len(),
                coverage.missing_critical_apis.iter().take(3).cloned().collect::<Vec<_>>().join(", ")
            ));
        }

        if !bottlenecks.slow_apis.is_empty() {
            recommendations.push(format!(
                "<div class=\"recommendation\"><strong>Performance:</strong> Optimize {} slow APIs, starting with: {}</div>",
                bottlenecks.slow_apis.len(),
                bottlenecks.slow_apis.iter().take(2).map(|api| &api.api_path).collect::<Vec<_>>().join(", ")
            ));
        }

        if coverage.overall_coverage_percentage < 80.0 {
            recommendations.push(format!(
                "<div class=\"recommendation\"><strong>Coverage:</strong> Increase overall API coverage from {:.1}% to 80%+</div>",
                coverage.overall_coverage_percentage
            ));
        }

        if recommendations.is_empty() {
            recommendations.push("<div class=\"recommendation\"><strong>Status:</strong> Test suite is performing well. Continue monitoring and maintenance.</div>".to_string());
        }

        recommendations.join("")
    }

    fn generate_coverage_csv_report(&self, coverage: &APICoverageAnalysisDetailed) -> String {
        let mut csv = String::from("Category,Total APIs,Tested APIs,Coverage Percentage,Missing APIs\n");
        
        for (category, cat_coverage) in &coverage.coverage_by_category {
            csv.push_str(&format!(
                "{},{},{},{:.2},\"{}\"\n",
                category,
                cat_coverage.total_apis,
                cat_coverage.tested_apis,
                cat_coverage.coverage_percentage,
                cat_coverage.missing_apis.join("; ")
            ));
        }
        
        csv
    }

    fn generate_performance_json_report(&self, performance: &CategoryPerformanceAnalysis, bottlenecks: &PerformanceBottlenecks) -> String {
        format!(r#"{{
    "performance_analysis": {{
        "category_performance": [
            {}
        ],
        "bottlenecks": {{
            "slow_apis": [
                {}
            ],
            "failing_apis": [
                {}
            ]
        }}
    }}
}}"#,
            performance.category_stats.iter()
                .map(|(category, stats)| format!(r#"{{
                    "category": "{}",
                    "avg_execution_time_ms": {:.2},
                    "success_rate": {:.4},
                    "performance_score": {:.2},
                    "total_api_calls": {}
                }}"#, category, stats.avg_execution_time_ms, stats.success_rate, stats.performance_score, stats.total_api_calls))
                .collect::<Vec<_>>()
                .join(",\n            "),
            bottlenecks.slow_apis.iter()
                .map(|api| format!(r#"{{
                    "api_path": "{}",
                    "avg_execution_time_ms": {:.2},
                    "severity": "{}",
                    "details": "{}"
                }}"#, api.api_path, api.avg_execution_time_ms, api.severity, api.details))
                .collect::<Vec<_>>()
                .join(",\n                "),
            bottlenecks.failing_apis.iter()
                .map(|api| format!(r#"{{
                    "api_path": "{}",
                    "severity": "{}",
                    "details": "{}"
                }}"#, api.api_path, api.severity, api.details))
                .collect::<Vec<_>>()
                .join(",\n                ")
        )
    }
}

impl AdvancedReportingEngine {
    /// Create new advanced reporting engine
    pub fn new() -> Self {
        Self {
            api_database: AdobeAfterEffectsApiDatabase::new(),
            performance_analyzer: PerformanceAnalyzer,
            coverage_analyzer: CoverageAnalyzer,
            trend_analyzer: TrendAnalyzer::new(),
            report_generator: ReportGenerator,
        }
    }

    /// Generate comprehensive analysis from test results
    pub fn generate_comprehensive_analysis(&mut self, results: &[EnhancedTestResult], output_dir: &str) -> Result<ComprehensiveAnalysisReport, String> {
        // Convert to statistics
        let execution_time = results.iter()
            .map(|r| r.execution_time)
            .fold(Duration::from_secs(0), |acc, d| acc + d);
        
        let statistics = TestExecutionStatistics {
            total_execution_time: execution_time,
            total_tests_run: results.len(),
            tests_passed: results.iter().filter(|r| r.basic_result.success).count(),
            tests_failed: results.iter().filter(|r| !r.basic_result.success).count(),
            tests_skipped: 0,
            category_breakdown: HashMap::new(),
            priority_breakdown: HashMap::new(),
            performance_metrics: PerformanceMetrics {
                fastest_test_ms: results.iter().map(|r| r.execution_time.as_millis() as u64).min().unwrap_or(0),
                slowest_test_ms: results.iter().map(|r| r.execution_time.as_millis() as u64).max().unwrap_or(0),
                avg_test_time_ms: results.iter().map(|r| r.execution_time.as_millis() as f64).sum::<f64>() / results.len() as f64,
                median_test_time_ms: 0.0,
                tests_over_threshold_ms: Vec::new(),
                performance_distribution: HashMap::new(),
            },
            api_coverage: APICoverageMetrics {
                total_ae_apis_tested: results.iter().map(|r| &r.basic_result.api_path).collect::<std::collections::HashSet<_>>().len(),
                apis_by_category: HashMap::new(),
                coverage_percentage: 0.0,
                missing_critical_apis: Vec::new(),
                newly_tested_apis: Vec::new(),
                deprecated_apis_found: Vec::new(),
            },
            error_analysis: ErrorAnalysis {
                common_error_patterns: HashMap::new(),
                syntax_errors: 0,
                api_not_found_errors: 0,
                property_access_errors: 0,
                method_call_errors: 0,
                expression_errors: 0,
                timeout_errors: 0,
            },
        };

        // Perform analyses
        let coverage_analysis = self.coverage_analyzer.analyze_api_coverage(results, &self.api_database);
        let performance_analysis = self.performance_analyzer.analyze_category_performance(results);
        let bottlenecks = self.performance_analyzer.identify_bottlenecks(results);
        let performance_recommendations = self.performance_analyzer.generate_recommendations(&bottlenecks);
        let coverage_recommendations = self.coverage_analyzer.generate_coverage_recommendations(&coverage_analysis);
        
        // Add to trend analysis
        self.trend_analyzer.add_test_run("2024-01-01T00:00:00Z".to_string(), statistics.clone());
        let trend_analysis = self.trend_analyzer.analyze_trends();

        // Generate reports
        let executive_summary = self.report_generator.generate_executive_summary(
            &statistics, &coverage_analysis, &performance_analysis, &bottlenecks, &trend_analysis
        );

        self.report_generator.generate_detailed_report(output_dir, &statistics, &coverage_analysis, &performance_analysis, &bottlenecks)?;

        Ok(ComprehensiveAnalysisReport {
            executive_summary,
            coverage_analysis,
            performance_analysis,
            bottlenecks,
            performance_recommendations,
            coverage_recommendations,
            trend_analysis,
        })
    }
}

// Supporting data structures
#[derive(Debug)]
pub struct CategoryPerformanceData {
    pub execution_times: Vec<f64>,
    pub success_count: usize,
    pub failure_count: usize,
    pub total_api_calls: usize,
}

#[derive(Debug)]
pub struct CategoryPerformanceStats {
    pub avg_execution_time_ms: f64,
    pub min_execution_time_ms: f64,
    pub max_execution_time_ms: f64,
    pub p50_execution_time_ms: f64,
    pub p95_execution_time_ms: f64,
    pub p99_execution_time_ms: f64,
    pub success_rate: f64,
    pub total_api_calls: usize,
    pub performance_score: f64,
}

#[derive(Debug)]
pub struct CategoryPerformanceAnalysis {
    pub category_stats: HashMap<String, CategoryPerformanceStats>,
}

#[derive(Debug)]
pub struct BottleneckInfo {
    pub api_path: String,
    pub severity: String,
    pub avg_execution_time_ms: f64,
    pub details: String,
}

#[derive(Debug)]
pub struct PerformanceBottlenecks {
    pub slow_apis: Vec<BottleneckInfo>,
    pub failing_apis: Vec<BottleneckInfo>,
    pub inconsistent_apis: Vec<BottleneckInfo>,
}

#[derive(Debug)]
pub struct PerformanceRecommendation {
    pub priority: String,
    pub api_path: String,
    pub issue: String,
    pub recommendation: String,
    pub estimated_impact: String,
}

#[derive(Debug)]
pub struct APICategoryCoverage {
    pub total_apis: usize,
    pub tested_apis: usize,
    pub coverage_percentage: f64,
    pub missing_apis: Vec<String>,
}

#[derive(Debug)]
pub struct APICoverageAnalysisDetailed {
    pub overall_coverage_percentage: f64,
    pub total_documented_apis: usize,
    pub total_tested_apis: usize,
    pub coverage_by_category: HashMap<String, APICategoryCoverage>,
    pub missing_critical_apis: Vec<String>,
    pub untested_apis: Vec<String>,
    pub deprecated_apis_tested: Vec<String>,
    pub experimental_apis_tested: Vec<String>,
}

#[derive(Debug)]
pub struct CoverageRecommendation {
    pub priority: String,
    pub category: String,
    pub recommendation: String,
    pub apis_to_test: Vec<String>,
    pub estimated_effort: String,
    pub business_impact: String,
}

#[derive(Debug)]
pub struct HistoricalTestRun {
    pub timestamp: String,
    pub total_tests: usize,
    pub passed_tests: usize,
    pub failed_tests: usize,
    pub avg_execution_time_ms: f64,
    pub total_execution_time_ms: f64,
    pub api_coverage_percentage: f64,
}

#[derive(Debug)]
pub struct TrendAnalysis {
    pub performance_trend: String,
    pub success_rate_trend: String,
    pub coverage_trend: String,
    pub recommendations: Vec<String>,
}

#[derive(Debug)]
pub struct ComprehensiveAnalysisReport {
    pub executive_summary: String,
    pub coverage_analysis: APICoverageAnalysisDetailed,
    pub performance_analysis: CategoryPerformanceAnalysis,
    pub bottlenecks: PerformanceBottlenecks,
    pub performance_recommendations: Vec<PerformanceRecommendation>,
    pub coverage_recommendations: Vec<CoverageRecommendation>,
    pub trend_analysis: TrendAnalysis,
}

/// Utility functions for advanced reporting
impl AdvancedReportingEngine {
    /// Quick analysis for CI/CD pipelines
    pub fn generate_ci_analysis(&mut self, results: &[EnhancedTestResult]) -> Result<String, String> {
        let report = self.generate_comprehensive_analysis(results, "./ci_reports")?;
        
        let success_rate = (results.iter().filter(|r| r.basic_result.success).count() as f64 / results.len() as f64) * 100.0;
        let critical_issues = report.bottlenecks.failing_apis.iter()
            .filter(|api| api.severity == "Critical")
            .count();

        if success_rate < 95.0 || critical_issues > 0 {
            Ok(format!("❌ BUILD FAILED: Success rate {:.1}%, {} critical issues", success_rate, critical_issues))
        } else if success_rate < 98.0 {
            Ok(format!("⚠️ BUILD PASSED WITH WARNINGS: Success rate {:.1}%", success_rate))
        } else {
            Ok(format!("✅ BUILD PASSED: Success rate {:.1}%, excellent quality", success_rate))
        }
    }

    /// Performance benchmark comparison
    pub fn compare_with_baseline(&self, current_results: &[EnhancedTestResult], baseline_results: &[EnhancedTestResult]) -> String {
        let current_avg = current_results.iter()
            .map(|r| r.execution_time.as_millis() as f64)
            .sum::<f64>() / current_results.len() as f64;
        
        let baseline_avg = baseline_results.iter()
            .map(|r| r.execution_time.as_millis() as f64)
            .sum::<f64>() / baseline_results.len() as f64;

        let change = ((current_avg - baseline_avg) / baseline_avg) * 100.0;

        if change.abs() < 5.0 {
            format!("📊 Performance: Stable ({:+.1}% vs baseline)", change)
        } else if change > 0.0 {
            format!("📈 Performance: Slower ({:+.1}% vs baseline)", change)
        } else {
            format!("📉 Performance: Faster ({:+.1}% vs baseline)", change)
        }
    }
}