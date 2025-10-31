// Simple test to verify the backward compatibility fix works
function testSimpleMovingSquare() {
    try {
        // Load the consolidated tools
        $.evalFile(File($.fileName).parent.fsName + "/ae_tools_consolidated.jsx");
        
        console.log("🎯 Simple moving square test...");
        
        // Step 1: Create composition
        var compResult = executeComprehensiveAITool("create_composition", {
            "name": "SimpleMovingSquareTest",
            "preset": "HD"
        });
        console.log("1. Composition:", compResult.success ? "✅ Created" : "❌ Failed");
        
        // Step 2: Create shape layer
        var shapeResult = executeComprehensiveAITool("create_shape_layer", {
            "shape": "rectangle",
            "size": [100, 100],
            "fillColor": [1, 0, 0] // Red
        });
        console.log("2. Shape layer:", shapeResult.success ? "✅ Created" : "❌ Failed");
        
        // Step 3: Test the OLD format that AI was using
        console.log("3. Testing old keyframes format (what AI was sending)...");
        var oldFormatResult = executeComprehensiveAITool("animate_layer", {
            "property": "position", 
            "keyframes": [
                {"time": 0, "value": [100, 100]}, 
                {"time": 3, "value": [1820, 980]}
            ]
        });
        console.log("   Old format result:", oldFormatResult);
        
        // Step 4: Test the NEW format for comparison
        console.log("4. Testing new startValue/endValue format...");
        var newFormatResult = executeComprehensiveAITool("animate_layer", {
            "target_newest": true,
            "property": "scale",
            "startValue": [100, 100],
            "endValue": [150, 150],
            "startTime": 0,
            "endTime": 2
        });
        console.log("   New format result:", newFormatResult);
        
        if (oldFormatResult.success && newFormatResult.success) {
            return "✅ SUCCESS: Both old and new animation formats work!";
        } else {
            return "❌ FAILED: One or both formats failed";
        }
        
    } catch (error) {
        console.log("❌ Test failed:", error.toString());
        return "❌ Test failed: " + error.toString();
    }
} 