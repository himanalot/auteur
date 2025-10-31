// Main test module for the After Effects API validator
// Includes comprehensive tests and the existing validation tests

pub mod comprehensive;
pub mod comprehensive_framework_test;
pub mod enhanced_test_runner;
pub mod advanced_reporting;
pub mod framework_example;

// Re-export comprehensive test types
pub use comprehensive::*;
pub use enhanced_test_runner::*;
pub use advanced_reporting::*;
pub use framework_example::*;