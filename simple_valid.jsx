// Simple valid After Effects script
app.project.save();

// Get active composition
var comp = app.project.activeItem;
if (comp && comp instanceof CompItem) {
    alert("Active composition: " + comp.name);
    
    // Add a layer
    var textLayer = comp.layers.addText("Hello World");
    textLayer.property("Position").setValue([comp.width/2, comp.height/2]);
}

// Check if file exists
if (isValid(app.project.file)) {
    alert("Project has been saved");
} 