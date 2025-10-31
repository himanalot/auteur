// Test ExtendScript with various issues for the Rust validator
// This script intentionally contains multiple types of errors

// Missing app.beginUndoGroup()
var comp = app.project.activeItem;

// Type checking issue - checking against wrong type
if (comp instanceof Layer) {  // Should be CompItem
    alert("This is wrong!");
}

// Undefined variable usage
someUndefinedVariable.doSomething();

// Incorrect method call
comp.layers.addInvalidMethod();  // addInvalidMethod doesn't exist

// Property access on potentially null object
var layer = comp.layers[1];
layer.transform.position.setValue([100, 100]);  // layer could be undefined

// Incorrect property type
layer.opacity.setValue("50%");  // Should be number, not string

// Missing error handling
try {
    var newLayer = comp.layers.addShape();
    newLayer.name = "Test Layer";
    // Missing app.endUndoGroup() in try block
} catch (err) {
    // Missing app.endUndoGroup() in catch block
    alert("Error: " + err.toString());
}

// Temporal expression issues
layer.transform.position.expression = "time * invalidFunction()";  // invalidFunction doesn't exist

// Color value issues
var solidLayer = comp.layers.addSolid([1, 0, 0, 1], "Red Solid", 1920, 1080, 1);
solidLayer.source.mainSource.color = "red";  // Should be array, not string

// Effect application issues
var effect = layer.Effects.addProperty("Nonexistent Effect");  // Effect doesn't exist
effect.property("Amount").setValue(150);  // Property might not exist

// Keyframe issues
layer.transform.scale.setValueAtTime(0, [100, 100, 100]);  // 2D property with 3D value

// Shape layer issues
var shapeLayer = comp.layers.addShape();
var shapeGroup = shapeLayer.content.addProperty("ADBE Vector Group");
var rectangle = shapeGroup.content.addProperty("ADBE Vector Shape - Rect");
rectangle.size.setValue([100]);  // Should be 2D array, not 1D

// Text layer issues
var textLayer = comp.layers.addText("Sample Text");
textLayer.text.sourceText.setValue("New Text");  // Missing TextDocument wrapper

// 3D layer issues
layer.threeDLayer = true;
layer.transform.zPosition.setValue([100, 200]);  // Should be single number, not array

// Performance issues - nested loops without optimization
for (var i = 1; i <= comp.layers.length; i++) {
    for (var j = 1; j <= comp.layers.length; j++) {
        for (var k = 1; k <= comp.layers.length; k++) {
            // Expensive nested operation
            comp.layers[i].transform.position.valueAtTime(j * k);
        }
    }
}

// Memory leak - creating many objects without cleanup
var largeArray = [];
for (var i = 0; i < 10000; i++) {
    largeArray.push(comp.layers.addNull());
}

// Deprecated method usage (if we track those)
comp.bgColor = [0.5, 0.5, 0.5];  // Deprecated way to set background

// Missing return statement in function
function createLayer() {
    var layer = comp.layers.addShape();
    layer.name = "New Shape";
    // Missing return statement
}

// Scope issues
function testScope() {
    var localVar = "test";
}
alert(localVar);  // localVar is out of scope

// Type conversion issues
var frameRate = comp.frameRate;
var duration = frameRate + " seconds";  // Mixing number and string

// Missing null checks
var activeComp = app.project.activeItem;
activeComp.layers.addText();  // activeComp might be null

// Incorrect use of expressions
layer.transform.rotation.expression = "wiggle(1, 30)";  // Missing semicolon in expression context

// Invalid property paths
layer.property("Transform").property("InvalidProperty").setValue(100);

// Missing app.endUndoGroup() at the end
// Script ends without proper cleanup 