// Debug Shape Creation Test Script
// Run this directly in After Effects to identify the exact failure point

function debugShapeCreation() {
    try {
        console.log("🔍 DEBUG: Starting shape creation test...");
        
        // Step 1: Check if we have a project
        console.log("Step 1: Checking project...");
        if (!app.project) {
            console.log("❌ No project found");
            return "No project";
        }
        console.log("✅ Project exists");
        
        // Step 2: Create a composition
        console.log("Step 2: Creating composition...");
        var comp = app.project.items.addComp("Debug Test Comp", 1920, 1080, 1, 10, 30);
        comp.openInViewer();
        console.log("✅ Composition created: " + comp.name);
        
        // Step 3: Check active item
        console.log("Step 3: Checking active item...");
        var activeItem = app.project.activeItem;
        if (!activeItem) {
            console.log("❌ No active item");
            return "No active item";
        }
        if (!(activeItem instanceof CompItem)) {
            console.log("❌ Active item is not a composition");
            return "Not a composition";
        }
        console.log("✅ Active composition: " + activeItem.name);
        
        // Step 4: Begin undo group
        console.log("Step 4: Beginning undo group...");
        app.beginUndoGroup("Debug: Create Shape Layer");
        
        // Step 5: Add shape layer
        console.log("Step 5: Adding shape layer...");
        var shapeLayer = activeItem.layers.addShape();
        console.log("✅ Shape layer created: " + shapeLayer.name);
        
        // Step 6: Get contents property
        console.log("Step 6: Getting contents property...");
        var contents = shapeLayer.property("Contents");
        if (!contents) {
            console.log("❌ Contents property not found");
            app.endUndoGroup();
            return "No contents property";
        }
        console.log("✅ Contents property found");
        
        // Step 7: Add rectangle shape
        console.log("Step 7: Adding rectangle shape...");
        var shape = contents.addProperty("ADBE Vector Shape - Rect");
        if (!shape) {
            console.log("❌ Rectangle shape not created");
            app.endUndoGroup();
            return "Rectangle shape failed";
        }
        console.log("✅ Rectangle shape added");
        
        // Step 8: Test property access methods
        console.log("Step 8: Testing property access methods...");
        
        // Method 1: Try ADBE Vector Rect Size
        console.log("  Testing ADBE Vector Rect Size...");
        var sizeProp1 = null;
        try {
            sizeProp1 = shape.property("ADBE Vector Rect Size");
            console.log("  ✅ ADBE Vector Rect Size found");
        } catch (e) {
            console.log("  ❌ ADBE Vector Rect Size failed: " + e.toString());
        }
        
        // Method 2: Try Size
        console.log("  Testing Size...");
        var sizeProp2 = null;
        try {
            sizeProp2 = shape.property("Size");
            console.log("  ✅ Size found");
        } catch (e) {
            console.log("  ❌ Size failed: " + e.toString());
        }
        
        // Method 3: Try index access
        console.log("  Testing index access...");
        var sizeProp3 = null;
        try {
            sizeProp3 = shape.property(1); // First property is usually size
            console.log("  ✅ Index 1 found: " + (sizeProp3 ? sizeProp3.name : "null"));
        } catch (e) {
            console.log("  ❌ Index 1 failed: " + e.toString());
        }
        
        // List all properties
        console.log("  Listing all properties...");
        try {
            for (var i = 1; i <= shape.numProperties; i++) {
                var prop = shape.property(i);
                console.log("    Property " + i + ": " + prop.name + " (matchName: " + prop.matchName + ")");
            }
        } catch (e) {
            console.log("  ❌ Property listing failed: " + e.toString());
        }
        
        // Step 9: Try to set size with working property
        console.log("Step 9: Attempting to set size...");
        var workingProp = sizeProp1 || sizeProp2 || sizeProp3;
        if (workingProp) {
            try {
                workingProp.setValue([200, 200]);
                console.log("✅ Size set successfully");
            } catch (e) {
                console.log("❌ setValue failed: " + e.toString());
            }
        } else {
            console.log("❌ No working size property found");
        }
        
        // Step 10: Add fill
        console.log("Step 10: Adding fill...");
        try {
            var fill = contents.addProperty("ADBE Vector Graphic - Fill");
            fill.property("Color").setValue([1, 0, 0]); // Red
            console.log("✅ Fill added successfully");
        } catch (e) {
            console.log("❌ Fill failed: " + e.toString());
        }
        
        app.endUndoGroup();
        console.log("🎉 DEBUG: Test completed successfully!");
        return "SUCCESS";
        
    } catch (error) {
        app.endUndoGroup();
        console.log("💥 FATAL ERROR: " + error.toString());
        console.log("Error line: " + error.line);
        return "FATAL: " + error.toString();
    }
}

// Run the test
var result = debugShapeCreation();
alert("Debug Result: " + result); 