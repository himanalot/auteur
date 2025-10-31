// Comprehensive test of documentation features

// Invalid methods - should show available methods
app.invalidMethod();
app.project.badMethod();

// Invalid properties - should show available properties  
app.badProperty;
app.project.invalidProperty;

// Invalid global function - should show available global functions
invalidGlobalFunction();

// Valid methods and properties for comparison
app.newProject();
app.project.save();
var activeComp = app.project.activeItem;
var version = app.version;

// Test with composition object
if (activeComp && activeComp instanceof CompItem) {
    activeComp.wrongMethod();  // Should show CompItem methods
    activeComp.badProperty;    // Should show CompItem properties
    activeComp.layers.addText('Hello World');  // Valid
} 

// Test basic app and project functionality
var myProject = app.project;
app.beginUndoGroup("Comprehensive Test");

// Create a new composition
var compWidth = 1920;
var compHeight = 1080;
var compDuration = 10;
var compFrameRate = 29.97;
var myComp = myProject.items.addComp("Test Composition", compWidth, compHeight, 1, compDuration, compFrameRate);

// Add a solid layer
var solidColor = [1, 0, 0];  // Red color
var solidLayer = myComp.layers.addSolid(solidColor, "Red Solid", compWidth, compHeight, 1, compDuration);
solidLayer.threeDLayer = true;

// Add text layer
var textLayer = myComp.layers.addText("Hello World");
var textProp = textLayer.property("Source Text");
var textDocument = textProp.value;
textDocument.fontSize = 72;
textDocument.fillColor = [1, 1, 1];
textDocument.font = "Arial";
textDocument.justification = ParagraphJustification.CENTER;
textProp.setValue(textDocument);

// Add shape layer and create a rectangle
var shapeLayer = myComp.layers.addShape();
var shapeGroup = shapeLayer.property("Contents").addProperty("ADBE Vector Group");
var rect = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
var rectSize = rect.property("Size");
rectSize.setValue([200, 200]);

// Add effects
var blurEffect = solidLayer.property("Effects").addProperty("ADBE Gaussian Blur 2");
blurEffect.property("Blurriness").setValue(20);

// Add keyframes for position animation
var position = solidLayer.property("Position");
position.setValueAtTime(0, [960, 540, 0]);
position.setValueAtTime(5, [1200, 540, 200]);

// Add camera and light
var myCamera = myComp.layers.addCamera("Main Camera", [960, 540]);
var myLight = myComp.layers.addLight("Main Light", [960, 540]);

// Test render queue
var renderItem = app.project.renderQueue.items.add(myComp);
var outputModule = renderItem.outputModule(1);
outputModule.applyTemplate("Best Settings");

// Test setTemporalEaseAtKey with incorrect dimensions
var comp = app.project.items.addComp("Test Comp", 1920, 1080, 1, 10, 30);
var layer = comp.layers.addSolid([1, 1, 1], "Solid", 1920, 1080, 1);

// Add keyframes to Scale (which is 2D)
layer.property("Scale").setValueAtTime(0, [100, 100]);
layer.property("Scale").setValueAtTime(5, [200, 200]);

// Create KeyframeEase objects
var easeIn = new KeyframeEase(0.5, 50);
var easeOut = new KeyframeEase(0.75, 85);

// This should fail validation since Scale is 2D but we're passing 3 ease objects
// Scale expects exactly 2 ease objects for both inTemporalEase and outTemporalEase
layer.property("Scale").setTemporalEaseAtKey(2, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);

// This should also fail validation since we're passing only 1 ease object for a 2D property
layer.property("Scale").setTemporalEaseAtKey(2, [easeIn], [easeOut]);

// Test with a 1D property (Opacity)
layer.property("Opacity").setValueAtTime(0, 0);
layer.property("Opacity").setValueAtTime(5, 100);

// This should fail validation since Opacity is 1D but we're passing 2 ease objects
layer.property("Opacity").setTemporalEaseAtKey(2, [easeIn, easeIn], [easeOut, easeOut]);

// This should be valid since Opacity is 1D and we're passing 1 ease object
layer.property("Opacity").setTemporalEaseAtKey(2, [easeIn], [easeOut]);

// End undo group
app.endUndoGroup(); 