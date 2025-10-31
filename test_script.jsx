// Test effect validation
var comp = app.project.activeItem;
var layer = comp.layers.addSolid([1, 1, 1], "White Solid", 1920, 1080, 1);

// Test 1: Misspelled effect name
var glow = layer.Effects.addProperty("ADBE Glo");  // Should suggest "ADBE Glow2"

// Test 2: Invalid property access
layer.nonexistentProperty = 100;  // Should show property documentation

// Test 3: Wrong parameter type
layer.transform.position.setValue("100");  // Should show position property needs array

// Test 4: Wrong array size
layer.transform.scale.setValue([100]);  // Should show scale needs [x, y]

// Test 5: Invalid temporal ease
var pos = layer.transform.position;
pos.setTemporalEaseAtKey(1, [{influence: 50}], [{influence: 50}]);  // Should show array size dependency

// Test 6: Invalid text property
var textLayer = comp.layers.addText("Hello");
var textProp = textLayer.property("Source Text");
var textDocument = textProp.value;
textDocument.fillColor = [1];  // Should show needs [r,g,b]

// Valid method calls
app.beginUndoGroup("Test Operation");

// Invalid method call
app.invalidMethod();

// Valid property access
var project = app.project;

// Invalid property access
var invalid = app.invalidProperty;

// ES6 features (should fail)
const myVar = 42;
let anotherVar = "test";
() => { return true; }

app.endUndoGroup(); 