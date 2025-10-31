// TEST SCRIPT - Multiple Line Errors
// This script has intentional errors to test the line-specific error reporting

app.beginUndoGroup("Test Line Errors");

try {
    // Line 8: This should work
    var comp = app.project.items.addComp("TEST_COMP", 1920, 1080, 1.0, 5.0, 30);
    
    // Line 11: This should cause an error - invalid effect name
    var solid = comp.layers.addSolid([1, 0, 0], "Test Solid", 1920, 1080, 1.0, 5.0);
    var badEffect = solid.Effects.addProperty("INVALID_EFFECT_NAME");
    
    // Line 15: This won't execute because of the error above
    var textLayer = comp.layers.addText("Test Text");
    
    app.endUndoGroup();
    $.writeln("SUCCESS: Test completed");
        
} catch (error) {
    app.endUndoGroup();
    $.writeln("ERROR: " + error.toString());
}