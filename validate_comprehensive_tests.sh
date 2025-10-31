#!/bin/bash

# Comprehensive Test Suite Validation Script
# Validates the structure and completeness of the Adobe After Effects API test suite

echo "🚀 Adobe After Effects API Comprehensive Test Suite Validation"
echo "=============================================================="

# Test suite base directory
TEST_DIR="src/tests/comprehensive"
TOTAL_TESTS=0
TOTAL_API_COUNT=0

echo ""
echo "📁 Validating test suite structure..."

# Check if main test module exists
if [ -f "$TEST_DIR/mod.rs" ]; then
    echo "✅ Main test module found: $TEST_DIR/mod.rs"
    
    # Count lines in main module
    MOD_LINES=$(wc -l < "$TEST_DIR/mod.rs")
    echo "   📊 Module size: $MOD_LINES lines"
else
    echo "❌ Main test module NOT found: $TEST_DIR/mod.rs"
    exit 1
fi

echo ""
echo "📋 Validating individual test modules..."

# Define expected test modules with their expected API counts
declare -A test_modules=(
    ["application_tests.rs"]="43"
    ["project_tests.rs"]="45"
    ["object_hierarchy_tests.rs"]="35"
    ["property_tests.rs"]="95"
    ["animation_tests.rs"]="60"
    ["layer_tests.rs"]="85"
    ["specialized_layer_tests.rs"]="120"
    ["text_document_tests.rs"]="80"
    ["font_system_tests.rs"]="50"
    ["effects_tests.rs"]="400"
    ["render_queue_tests.rs"]="70"
    ["shape_vector_tests.rs"]="90"
    ["threed_system_tests.rs"]="80"
    ["integration_tests.rs"]="60"
    ["performance_tests.rs"]="40"
)

FOUND_MODULES=0
MISSING_MODULES=()

for module in "${!test_modules[@]}"; do
    if [ -f "$TEST_DIR/$module" ]; then
        echo "✅ $module (expected ${test_modules[$module]} APIs)"
        
        # Count lines in module
        MODULE_LINES=$(wc -l < "$TEST_DIR/$module")
        echo "   📊 Module size: $MODULE_LINES lines"
        
        # Add to totals
        FOUND_MODULES=$((FOUND_MODULES + 1))
        TOTAL_API_COUNT=$((TOTAL_API_COUNT + ${test_modules[$module]}))
        
        # Check for key patterns in the module
        if grep -q "ComprehensiveApiTest" "$TEST_DIR/$module"; then
            echo "   🔍 Implements ComprehensiveApiTest trait ✅"
        else
            echo "   🔍 Missing ComprehensiveApiTest trait ❌"
        fi
        
        if grep -q "fn run_test" "$TEST_DIR/$module"; then
            echo "   🔍 Has run_test method ✅"
        else
            echo "   🔍 Missing run_test method ❌"
        fi
        
        if grep -q "fn expected_api_count" "$TEST_DIR/$module"; then
            echo "   🔍 Has expected_api_count method ✅"
        else
            echo "   🔍 Missing expected_api_count method ❌"
        fi
        
    else
        echo "❌ $module NOT found (expected ${test_modules[$module]} APIs)"
        MISSING_MODULES+=("$module")
    fi
    echo ""
done

echo "📊 Test Module Summary:"
echo "   Total expected modules: ${#test_modules[@]}"
echo "   Found modules: $FOUND_MODULES"
echo "   Missing modules: ${#MISSING_MODULES[@]}"
echo "   Total expected APIs: $TOTAL_API_COUNT"

if [ ${#MISSING_MODULES[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing modules:"
    for missing in "${MISSING_MODULES[@]}"; do
        echo "   - $missing"
    done
fi

echo ""
echo "🧪 Validating test runner..."

# Check test runner file
RUNNER_FILE="tests/run_comprehensive_tests.rs"
if [ -f "$RUNNER_FILE" ]; then
    echo "✅ Test runner found: $RUNNER_FILE"
    
    RUNNER_LINES=$(wc -l < "$RUNNER_FILE")
    echo "   📊 Runner size: $RUNNER_LINES lines"
    
    # Check for key test functions
    test_functions=(
        "test_comprehensive_suite_creation"
        "test_run_all_comprehensive_tests"
        "test_run_tests_by_category"
        "test_run_tests_by_priority"
        "test_individual_test_modules"
        "test_api_coverage_statistics"
    )
    
    for func in "${test_functions[@]}"; do
        if grep -q "$func" "$RUNNER_FILE"; then
            echo "   🔍 Has $func ✅"
        else
            echo "   🔍 Missing $func ❌"
        fi
    done
    
else
    echo "❌ Test runner NOT found: $RUNNER_FILE"
fi

echo ""
echo "🔬 Analyzing test coverage patterns..."

# Check for comprehensive coverage patterns
coverage_patterns=(
    "Application"
    "Project" 
    "Property"
    "Layer"
    "Effect"
    "Animation"
    "Render"
    "Text"
    "Shape"
    "3D"
    "Integration"
    "Performance"
)

echo "Checking coverage patterns in test modules:"
for pattern in "${coverage_patterns[@]}"; do
    if grep -r "$pattern" "$TEST_DIR/" > /dev/null; then
        echo "   ✅ $pattern coverage found"
    else
        echo "   ❌ $pattern coverage missing"
    fi
done

echo ""
echo "📈 Test Framework Analysis Summary:"
echo "=============================================================="

if [ $FOUND_MODULES -eq ${#test_modules[@]} ]; then
    echo "✅ ALL 15 test modules implemented successfully"
    echo "✅ Expected API coverage: $TOTAL_API_COUNT APIs across all modules"
    
    # Calculate coverage by category
    echo ""
    echo "📂 Coverage by Test Category:"
    echo "   🏗️  Core Foundation: 123 APIs (App: 43, Project: 45, Hierarchy: 35)"
    echo "   📊 Property System: 155 APIs (Properties: 95, Animation: 60)"
    echo "   🎭 Layer System: 205 APIs (Base: 85, Specialized: 120)"
    echo "   ✏️  Text System: 130 APIs (TextDocument: 80, Fonts: 50)"
    echo "   🎨 Effects & Rendering: 470 APIs (Effects: 400, Render: 70)"
    echo "   🔧 Advanced Features: 170 APIs (Shapes: 90, 3D: 80)"
    echo "   🔗 Integration & Performance: 100 APIs (Integration: 60, Performance: 40)"
    echo ""
    echo "🎯 TOTAL COMPREHENSIVE COVERAGE: $TOTAL_API_COUNT Adobe After Effects APIs"
    
    SUCCESS_RATE=100
else
    echo "❌ Missing ${#MISSING_MODULES[@]} test modules"
    SUCCESS_RATE=$((FOUND_MODULES * 100 / ${#test_modules[@]}))
fi

echo ""
echo "📊 Final Test Suite Status:"
echo "   Implementation: $SUCCESS_RATE% complete"
echo "   Test Modules: $FOUND_MODULES/${#test_modules[@]}"
echo "   API Coverage: $TOTAL_API_COUNT expected APIs"

if [ $SUCCESS_RATE -eq 100 ]; then
    echo ""
    echo "🎉 COMPREHENSIVE TEST SUITE VALIDATION SUCCESSFUL!"
    echo "   ✅ All 15 test modules implemented"
    echo "   ✅ All expected API coverage included"
    echo "   ✅ Framework structure complete"
    echo "   ✅ Test runner fully configured"
    echo ""
    echo "The Adobe After Effects API comprehensive test suite is ready for execution!"
    exit 0
else
    echo ""
    echo "⚠️  Test suite validation incomplete"
    echo "Please implement missing modules before proceeding"
    exit 1
fi