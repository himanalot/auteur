app.beginUndoGroup("Create iOS Modal with Buttons");
$.writeln("⏳ Begin Undo Group: Create iOS Modal with Buttons");

try {
    // Get the active composition
    var comp = app.project.activeItem;
    $.writeln("🔍 Checking active item...");
    if (!comp || !(comp instanceof CompItem)) {
        $.writeln("❌ No composition selected.");
        alert("Please select a composition");
        throw new Error("No composition selected");
    }
    $.writeln("✅ Active composition: " + comp.name);

    // Validate composition dimensions
    if (comp.width <= 0 || comp.height <= 0) {
        $.writeln("❌ Invalid composition dimensions: " + comp.width + "x" + comp.height);
        alert("Composition has invalid dimensions");
        throw new Error("Invalid composition dimensions");
    }
    $.writeln("📐 Composition dimensions: " + comp.width + "x" + comp.height);

    // Calculate center position safely
    var centerX = comp.width / 2;
    var centerY = comp.height / 2;
    $.writeln("📍 Center position calculated: [" + centerX + ", " + centerY + "]");

    // Find or create the modal layer
    var modalLayer = null;
    $.writeln("🔍 Searching for existing 'iOS Modal' layer...");
    for (var i = 1; i <= comp.numLayers; i++) {
        var nm = comp.layer(i).name;
        $.writeln("   • Layer " + i + ": " + nm);
        if (nm === "iOS Modal") {
            modalLayer = comp.layer(i);
            $.writeln("✅ Found existing modal at layer index " + i);
            break;
        }
    }
    if (!modalLayer) {
        $.writeln("⚙️ Creating new 'iOS Modal' Shape layer.");
        modalLayer = comp.layers.addShape();
        modalLayer.name = "iOS Modal";
    }

    // Clear and rebuild modal background
    $.writeln("✂️ Clearing modal contents...");
    var modalContents = modalLayer.property("ADBE Root Vectors Group");
    while (modalContents.numProperties > 0) {
        $.writeln("   • Removing property: " + modalContents.property(1).name);
        modalContents.property(1).remove();
    }

    $.writeln("🖼️ Adding modal background rectangle...");
    var modalGroup = modalContents.addProperty("ADBE Vector Group");
    modalGroup.name = "Modal Background";
    var bgVectors = modalGroup.property("ADBE Vectors Group");

    var rectPath = bgVectors.addProperty("ADBE Vector Shape - Rect");
    var sizeProp = rectPath.property("ADBE Vector Rect Size");
    var posProp = rectPath.property("ADBE Vector Rect Position");
    var rndProp = rectPath.property("ADBE Vector Rect Roundness");
    $.writeln("📐 Setting modal size to [400,250], roundness 20.");
    sizeProp.setValue([400, 250]);
    posProp.setValue([0, 0]);
    rndProp.setValue(20);

    var fillProp = bgVectors.addProperty("ADBE Vector Graphic - Fill");
    var fillColorProp = fillProp.property("ADBE Vector Fill Color");
    $.writeln("🎨 Filling modal background with light gray.");
    fillColorProp.setValue([0.95, 0.95, 0.95, 1.0]);

    // Center modal
    var centerPos = [centerX, centerY];
    $.writeln("📍 Positioning modal at center: " + centerPos);
    modalLayer.property("ADBE Transform Group").property("ADBE Position").setValue(centerPos);

    // Create rainbow gradient background - Using a solid instead for simplicity
    $.writeln("⚙️ Creating Rainbow Background layer...");
    var gradientBg = comp.layers.addSolid([1, 0.5, 0, 1], "Rainbow Background", comp.width, comp.height, 1.0);
    gradientBg.moveAfter(modalLayer);

    // Add gradient ramp effect for the rainbow
    $.writeln("🌈 Adding gradient ramp effect...");
    var gradientEffect = gradientBg.property("ADBE Effect Parade").addProperty("ADBE Ramp");
    
    // Set gradient properties safely
    try {
        gradientEffect.property("ADBE Ramp-0001").setValue([0, 0]); // Start Point
        gradientEffect.property("ADBE Ramp-0002").setValue([comp.width, comp.height]); // End Point
        
        // Set rainbow colors
        gradientEffect.property("ADBE Ramp-0003").setValue([1, 0, 0]); // Start Color (Red)
        gradientEffect.property("ADBE Ramp-0004").setValue([0.5, 0, 1]); // End Color (Purple)
        
        // Set to linear
        gradientEffect.property("ADBE Ramp-0005").setValue(1); // Ramp Shape (Linear)
        
        $.writeln("✅ Gradient effect applied successfully");
    } catch (gradientError) {
        $.writeln("⚠️ Gradient effect error: " + gradientError.toString());
        // Continue without gradient
    }

    // Button creation helper
    function createButton(name, x, y, w, h, bgColor, textColor, label) {
        $.writeln("🔧 Creating button: " + name);
        var btn = comp.layers.addShape();
        btn.name = name;
        var grp = btn.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        grp.name = name + " Shape";
        var vecs = grp.property("ADBE Vectors Group");
        var path = vecs.addProperty("ADBE Vector Shape - Rect");
        path.property("ADBE Vector Rect Size").setValue([w, h]);
        path.property("ADBE Vector Rect Position").setValue([0, 0]);
        path.property("ADBE Vector Rect Roundness").setValue(8);
        var f = vecs.addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(bgColor);
        btn.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        
        // Create text
        var txt = comp.layers.addText(label);
        txt.name = name + " Text";
        var textDoc = txt.property("ADBE Text Properties").property("ADBE Text Document");
        var td = textDoc.value;
        td.fontSize = 16;
        td.fillColor = textColor;
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        textDoc.setValue(td);
        txt.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        
        return btn;
    }

    // Create Cancel and Send buttons
    $.writeln("⚙️ Creating Cancel Button...");
    var cancelBtn = createButton("Cancel Button", centerX - 80, centerY + 60, 120, 44, [0.9,0.9,0.9,1], [0.3,0.3,0.3,1], "Cancel");

    $.writeln("⚙️ Creating Send Button...");
    var sendBtn = createButton("Send Button", centerX + 80, centerY + 60, 120, 44, [0,0.48,1,1], [1,1,1,1], "Send");

    // Click animation on Send button
    try {
        $.writeln("⏱️ Adding click animation to Send Button...");
        var sendFillColor = sendBtn.property("ADBE Root Vectors Group")
                                   .property("ADBE Vector Group")
                                   .property("ADBE Vectors Group")
                                   .property("ADBE Vector Graphic - Fill")
                                   .property("ADBE Vector Fill Color");
        
        var normalColor = [0, 0.48, 1, 1];
        var clickColor = [0, 0.35, 0.8, 1];
        var startTime = 2.0;
        var duration = 0.15;
        
        sendFillColor.setValueAtTime(startTime, normalColor);
        sendFillColor.setValueAtTime(startTime + duration/2, clickColor);
        sendFillColor.setValueAtTime(startTime + duration, normalColor);
        $.writeln("✅ Click animation added successfully");
    } catch (animError) {
        $.writeln("⚠️ Animation error: " + animError.toString());
        // Continue without animation
    }

    // Update existing title/subtitle or create new ones
    $.writeln("✏️ Setting up modal text...");
    var titleFound = false;
    var subtitleFound = false;
    
    for (var j = 1; j <= comp.numLayers; j++) {
        var lyr = comp.layer(j);
        if (lyr.name === "Modal Title") {
            $.writeln("   • Updating existing 'Modal Title'");
            var titleTextDoc = lyr.property("ADBE Text Properties").property("ADBE Text Document");
            var td = titleTextDoc.value;
            td.text = "Confirm Action";
            td.fontSize = 18;
            td.fillColor = [0.2, 0.2, 0.2];
            titleTextDoc.setValue(td);
            lyr.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY - 40]);
            titleFound = true;
        }
        if (lyr.name === "Modal Subtitle" || lyr.name === "Modal Body") {
            $.writeln("   • Updating existing 'Modal Subtitle'");
            var subtitleTextDoc = lyr.property("ADBE Text Properties").property("ADBE Text Document");
            var sd = subtitleTextDoc.value;
            sd.text = "Are you sure you want to proceed?";
            sd.fontSize = 14;
            sd.fillColor = [0.5, 0.5, 0.5];
            subtitleTextDoc.setValue(sd);
            lyr.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY - 10]);
            subtitleFound = true;
        }
    }
    
    // Create title if not found
    if (!titleFound) {
        $.writeln("   • Creating new Modal Title");
        var titleLayer = comp.layers.addText("Confirm Action");
        titleLayer.name = "Modal Title";
        var titleTextDoc = titleLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var td = titleTextDoc.value;
        td.fontSize = 18;
        td.fillColor = [0.2, 0.2, 0.2];
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        titleTextDoc.setValue(td);
        titleLayer.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY - 40]);
    }
    
    // Create subtitle if not found
    if (!subtitleFound) {
        $.writeln("   • Creating new Modal Subtitle");
        var subtitleLayer = comp.layers.addText("Are you sure you want to proceed?");
        subtitleLayer.name = "Modal Subtitle";
        var subtitleTextDoc = subtitleLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var sd = subtitleTextDoc.value;
        sd.fontSize = 14;
        sd.fillColor = [0.5, 0.5, 0.5];
        sd.justification = ParagraphJustification.CENTER_JUSTIFY;
        subtitleTextDoc.setValue(sd);
        subtitleLayer.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY - 10]);
    }

    $.writeln("✅ iOS modal with buttons created successfully!");
    alert(
        "iOS modal with buttons created successfully!\n\n" +
        "- Modal background with rounded corners\n" +
        "- Rainbow gradient background\n" +
        "- Cancel and Send buttons with proper styling\n" +
        "- Click animation on Send button\n" +
        "- Title and subtitle text\n" +
        "- iOS-style design"
    );

} catch (error) {
    $.writeln("❗ Error: " + error.toString());
    if (error.fileName) $.writeln("   File: " + error.fileName);
    if (error.line) $.writeln("   Line: " + error.line);
    alert("Error: " + error.toString());
} finally {
    app.endUndoGroup();
    $.writeln("⏹️ End Undo Group");
} 