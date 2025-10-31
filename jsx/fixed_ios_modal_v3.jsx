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

    // Validate composition dimensions with extra checks
    $.writeln("📏 Raw dimensions: width=" + comp.width + ", height=" + comp.height);
    if (!comp.width || !comp.height || comp.width <= 0 || comp.height <= 0 || isNaN(comp.width) || isNaN(comp.height)) {
        $.writeln("❌ Invalid composition dimensions");
        alert("Composition has invalid dimensions");
        throw new Error("Invalid composition dimensions");
    }
    $.writeln("📐 Composition dimensions: " + comp.width + "x" + comp.height);

    // Calculate center position with validation
    var centerX = Number(comp.width) / 2;
    var centerY = Number(comp.height) / 2;
    
    $.writeln("🧮 Center calculation: " + comp.width + "/2 = " + centerX);
    $.writeln("🧮 Center calculation: " + comp.height + "/2 = " + centerY);
    
    if (isNaN(centerX) || isNaN(centerY) || !isFinite(centerX) || !isFinite(centerY)) {
        $.writeln("❌ Invalid center calculation");
        alert("Center position calculation failed");
        throw new Error("Center position calculation failed");
    }
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
        $.writeln("✅ Modal layer created successfully");
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
    
    $.writeln("📐 Setting modal rectangle properties...");
    sizeProp.setValue([400, 250]);
    posProp.setValue([0, 0]);
    rndProp.setValue(20);

    var fillProp = bgVectors.addProperty("ADBE Vector Graphic - Fill");
    var fillColorProp = fillProp.property("ADBE Vector Fill Color");
    $.writeln("🎨 Setting modal background color...");
    fillColorProp.setValue([0.95, 0.95, 0.95]); // Fixed: 3-element RGB array

    // Center modal with extra validation
    $.writeln("📍 Preparing to center modal...");
    var centerPos = [centerX, centerY];
    $.writeln("📍 Center position array: [" + centerPos[0] + ", " + centerPos[1] + "]");
    
    // Validate the position array
    if (!centerPos || centerPos.length !== 2 || isNaN(centerPos[0]) || isNaN(centerPos[1])) {
        $.writeln("❌ Invalid center position array");
        centerPos = [960, 540]; // Fallback position
        $.writeln("🔄 Using fallback position: [" + centerPos[0] + ", " + centerPos[1] + "]");
    }
    
    try {
        $.writeln("📍 Setting modal position...");
        var transformGroup = modalLayer.property("ADBE Transform Group");
        var positionProp = transformGroup.property("ADBE Position");
        positionProp.setValue(centerPos);
        $.writeln("✅ Modal positioned successfully");
    } catch (posError) {
        $.writeln("❌ Position error: " + posError.toString());
        throw posError;
    }

    // Create rainbow gradient background using solid + effect
    $.writeln("⚙️ Creating Rainbow Background layer...");
    try {
        var gradientBg = comp.layers.addSolid([1, 0.5, 0], "Rainbow Background", comp.width, comp.height, 1.0);
        gradientBg.moveAfter(modalLayer);

        // Add gradient ramp effect
        $.writeln("🌈 Adding gradient ramp effect...");
        var gradientEffect = gradientBg.property("ADBE Effect Parade").addProperty("ADBE Ramp");
        
        // Fixed: Use proper 2-element arrays for points and 3-element arrays for colors
        gradientEffect.property("ADBE Ramp-0001").setValue([0, 0]); // Start Point
        gradientEffect.property("ADBE Ramp-0002").setValue([comp.width, comp.height]); // End Point
        gradientEffect.property("ADBE Ramp-0003").setValue([1, 0, 0]); // Start Color (Red) - 3 elements
        gradientEffect.property("ADBE Ramp-0004").setValue([0.5, 0, 1]); // End Color (Purple) - 3 elements
        gradientEffect.property("ADBE Ramp-0005").setValue(1); // Linear ramp
        
        $.writeln("✅ Gradient background created successfully");
    } catch (gradientError) {
        $.writeln("⚠️ Gradient creation failed: " + gradientError.toString());
        // Continue without gradient
    }

    // Button creation helper function
    function createButton(name, x, y, w, h, bgColor, textColor, label) {
        $.writeln("🔧 Creating button: " + name + " at [" + x + ", " + y + "]");
        
        // Validate button position
        if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
            $.writeln("❌ Invalid button position for " + name);
            x = centerX; // Use center as fallback
            y = centerY;
        }
        
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
        
        // Fixed: Ensure bgColor is 3-element RGB array
        var buttonFillColor = [bgColor[0], bgColor[1], bgColor[2]]; // Remove alpha if present
        $.writeln("   Setting button fill color: [" + buttonFillColor[0] + ", " + buttonFillColor[1] + ", " + buttonFillColor[2] + "]");
        f.property("ADBE Vector Fill Color").setValue(buttonFillColor);
        
        btn.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        
        // Create text
        var txt = comp.layers.addText(label);
        txt.name = name + " Text";
        var textDoc = txt.property("ADBE Text Properties").property("ADBE Text Document");
        var td = textDoc.value;
        td.fontSize = 16;
        
        // Fixed: Ensure textColor is 3-element RGB array
        var textFillColor = [textColor[0], textColor[1], textColor[2]]; // Remove alpha if present
        $.writeln("   Setting text fill color: [" + textFillColor[0] + ", " + textFillColor[1] + ", " + textFillColor[2] + "]");
        td.fillColor = textFillColor;
        
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        textDoc.setValue(td);
        txt.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        
        $.writeln("✅ Button " + name + " created successfully");
        return btn;
    }

    // Create buttons with validated positions and fixed color arrays
    $.writeln("⚙️ Creating Cancel Button...");
    var cancelX = centerX - 80;
    var cancelY = centerY + 60;
    $.writeln("   Cancel position: [" + cancelX + ", " + cancelY + "]");
    // Fixed: Use 3-element RGB arrays instead of 4-element RGBA
    var cancelBtn = createButton("Cancel Button", cancelX, cancelY, 120, 44, [0.9, 0.9, 0.9], [0.3, 0.3, 0.3], "Cancel");

    $.writeln("⚙️ Creating Send Button...");
    var sendX = centerX + 80;
    var sendY = centerY + 60;
    $.writeln("   Send position: [" + sendX + ", " + sendY + "]");
    // Fixed: Use 3-element RGB arrays instead of 4-element RGBA
    var sendBtn = createButton("Send Button", sendX, sendY, 120, 44, [0, 0.48, 1], [1, 1, 1], "Send");

    // Add click animation to Send button
    try {
        $.writeln("⏱️ Adding click animation to Send Button...");
        var sendFillColor = sendBtn.property("ADBE Root Vectors Group")
                                   .property("ADBE Vector Group")
                                   .property("ADBE Vectors Group")
                                   .property("ADBE Vector Graphic - Fill")
                                   .property("ADBE Vector Fill Color");
        
        // Fixed: Use 3-element RGB arrays for animation colors
        var normalColor = [0, 0.48, 1];
        var clickColor = [0, 0.35, 0.8];
        var startTime = 2.0;
        var duration = 0.15;
        
        sendFillColor.setValueAtTime(startTime, normalColor);
        sendFillColor.setValueAtTime(startTime + duration/2, clickColor);
        sendFillColor.setValueAtTime(startTime + duration, normalColor);
        $.writeln("✅ Click animation added successfully");
    } catch (animError) {
        $.writeln("⚠️ Animation error: " + animError.toString());
    }

    // Handle text layers
    $.writeln("✏️ Setting up modal text...");
    var titleFound = false;
    var subtitleFound = false;
    
    for (var j = 1; j <= comp.numLayers; j++) {
        var lyr = comp.layer(j);
        if (lyr.name === "Modal Title") {
            $.writeln("   • Updating existing 'Modal Title'");
            try {
                var titleTextDoc = lyr.property("ADBE Text Properties").property("ADBE Text Document");
                var td = titleTextDoc.value;
                td.text = "Confirm Action";
                td.fontSize = 18;
                td.fillColor = [0.2, 0.2, 0.2]; // Fixed: 3-element RGB
                titleTextDoc.setValue(td);
                lyr.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY - 40]);
                titleFound = true;
            } catch (titleError) {
                $.writeln("⚠️ Title update error: " + titleError.toString());
            }
        }
        if (lyr.name === "Modal Subtitle" || lyr.name === "Modal Body") {
            $.writeln("   • Updating existing 'Modal Subtitle'");
            try {
                var subtitleTextDoc = lyr.property("ADBE Text Properties").property("ADBE Text Document");
                var sd = subtitleTextDoc.value;
                sd.text = "Are you sure you want to proceed?";
                sd.fontSize = 14;
                sd.fillColor = [0.5, 0.5, 0.5]; // Fixed: 3-element RGB
                subtitleTextDoc.setValue(sd);
                lyr.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY - 10]);
                subtitleFound = true;
            } catch (subtitleError) {
                $.writeln("⚠️ Subtitle update error: " + subtitleError.toString());
            }
        }
    }
    
    // Create missing text layers
    if (!titleFound) {
        $.writeln("   • Creating new Modal Title");
        try {
            var titleLayer = comp.layers.addText("Confirm Action");
            titleLayer.name = "Modal Title";
            var titleTextDoc = titleLayer.property("ADBE Text Properties").property("ADBE Text Document");
            var td = titleTextDoc.value;
            td.fontSize = 18;
            td.fillColor = [0.2, 0.2, 0.2]; // Fixed: 3-element RGB
            td.justification = ParagraphJustification.CENTER_JUSTIFY;
            titleTextDoc.setValue(td);
            titleLayer.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY - 40]);
        } catch (newTitleError) {
            $.writeln("⚠️ New title creation error: " + newTitleError.toString());
        }
    }
    
    if (!subtitleFound) {
        $.writeln("   • Creating new Modal Subtitle");
        try {
            var subtitleLayer = comp.layers.addText("Are you sure you want to proceed?");
            subtitleLayer.name = "Modal Subtitle";
            var subtitleTextDoc = subtitleLayer.property("ADBE Text Properties").property("ADBE Text Document");
            var sd = subtitleTextDoc.value;
            sd.fontSize = 14;
            sd.fillColor = [0.5, 0.5, 0.5]; // Fixed: 3-element RGB
            sd.justification = ParagraphJustification.CENTER_JUSTIFY;
            subtitleTextDoc.setValue(sd);
            subtitleLayer.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY - 10]);
        } catch (newSubtitleError) {
            $.writeln("⚠️ New subtitle creation error: " + newSubtitleError.toString());
        }
    }

    $.writeln("✅ iOS modal with buttons created successfully!");
    alert(
        "iOS modal with buttons created successfully!\n\n" +
        "Features:\n" +
        "- Modal background with rounded corners\n" +
        "- Rainbow gradient background\n" +
        "- Cancel and Send buttons with proper styling\n" +
        "- Click animation on Send button\n" +
        "- Title and subtitle text\n" +
        "- iOS-style design"
    );

} catch (error) {
    $.writeln("❗ MAIN ERROR: " + error.toString());
    if (error.fileName) $.writeln("   File: " + error.fileName);
    if (error.line) $.writeln("   Line: " + error.line);
    if (error.stack) $.writeln("   Stack: " + error.stack);
    alert("Error: " + error.toString());
} finally {
    app.endUndoGroup();
    $.writeln("⏹️ End Undo Group");
} 