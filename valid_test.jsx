// Test basic app and project functionality
var myProject = app.project;
app.beginUndoGroup("Valid Test");

// Create a new composition
var compWidth = 1920;
var compHeight = 1080;
var compDuration = 10;
var compFrameRate = 29.97;
var myComp = myProject.items.addComp("Test Composition", compWidth, compHeight, 1, compDuration, compFrameRate);

// Add a solid layer
var solidColor = [1, 0, 0];  // Red color
var solidLayer = myComp.layers.addSolid(solidColor, "Red Solid", compWidth, compHeight, 1, compDuration);

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
var blurEffect = solidLayer.Effects.addProperty("ADBE Gaussian Blur 2");
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

// End undo group
app.endUndoGroup(); 