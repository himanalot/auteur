/**
 * Debug Scale Issue - Minimal Test
 * This will help us see exactly what's happening with the scale animation
 */

function debugScaleIssue() {
    try {
        $.writeln("\n=== DEBUGGING SCALE ANIMATION ISSUE ===");
        
        // Create composition
        var comp = COMPREHENSIVE_TOOLS["create_composition"].execute({
            name: "Debug Scale",
            width: 1920,
            height: 1080,
            duration: 5,
            frameRate: 30
        });
        
        if (!comp.success) {
            alert("Failed to create composition");
            return;
        }
        
        // Create rectangle
        var rect = COMPREHENSIVE_TOOLS["create_shape_layer"].execute({
            shape: "rectangle",
            width: 100,
            height: 100,
            fillColor: [1, 0, 0, 1]
        });
        
        if (!rect.success) {
            alert("Failed to create rectangle");
            return;
        }
        
        $.writeln("✅ Setup complete - now testing scale animation");
        
        // Test scale animation with layer_name (this should work based on the error message)
        $.writeln("\n--- TESTING SCALE ANIMATION WITH LAYER_NAME ---");
        var result = COMPREHENSIVE_TOOLS["animate_layer"].execute({
            layer_name: "AI Rectangle",
            property: "scale",
            startValue: [50, 100],
            endValue: [100, 100],
            startTime: 0,
            endTime: 2,
            easing: "easeOut"
        });
        
        $.writeln("\n=== RESULT ===");
        $.writeln("Success: " + result.success);
        $.writeln("Message: " + result.message);
        if (result.data) {
            $.writeln("Data: " + JSON.stringify(result.data));
        }
        
        if (result.success) {
            alert("✅ Scale animation worked!");
        } else {
            alert("❌ Scale animation failed: " + result.message);
        }
        
    } catch (error) {
        alert("Test error: " + error.toString());
        $.writeln("Test error: " + error.toString());
    }
}

// Run the test
debugScaleIssue(); 