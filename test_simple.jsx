// Valid calls
app.beginUndoGroup("Test");
var project = app.project;
app.endUndoGroup();

// Invalid calls  
app.invalidMethod();
var invalid = app.invalidProperty;

// ES6 features (should fail)
const test = 42;
let another = "hello";
var arrow = () => { return true; } 