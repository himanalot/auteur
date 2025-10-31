// TEST SCRIPT - Enhanced Context Demo
// This script has an intentional error to show the enhanced context system

app.beginUndoGroup("Test Enhanced Context");

try {
    // Line 7: This should work
    var comp = app.project.items.addComp("TEST_COMP", 1920, 1080, 1.0, 5.0, 30);
    
    // Line 10: This should work
    var solid = comp.layers.addSolid([1, 0, 0], "Test Solid", 1920, 1080, 1.0, 5.0);
    
    // Line 13: This should cause an error - invalid effect name
    var badEffect = solid.Effects.addProperty("INVALID_EFFECT_NAME");
    
    // Line 16: This won't execute because of the error above
    var textLayer = comp.layers.addText("Test Text");
    
    app.endUndoGroup();
    $.writeln("SUCCESS: Test completed");
        
} catch (error) {
    app.endUndoGroup();
    $.writeln("ERROR: " + error.toString());
}