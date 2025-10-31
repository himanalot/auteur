// Test script for Script Runner - has intentional errors
var comp = app.project.activeItem;

if (comp && comp instanceof CompItem) {
    // Error 1: Undefined variable
    var layer = comp.layers.addText(someUndefinedText);
    
    // Error 2: Wrong property access
    layer.position.setValue([comp.width / 2, comp.height / 2]);
    
    // Error 3: Missing null check
    var secondLayer = comp.layers[1];
    secondLayer.opacity.setValue(50);
    
    // Error 4: Wrong method name
    layer.addInvalidMethod();
} else {
    alert("Please open a composition first");
} 