app.beginUndoGroup("Apple Modal to Paper Airplane Animation");
$.writeln("⏳ Begin Undo Group: Apple Modal to Paper Airplane Animation");

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

    var centerX = comp.width / 2;
    var centerY = comp.height / 2;

    // Find existing modal elements
    var modalLayer = null;
    var titleLayer = null;
    var subtitleLayer = null;
    var cancelBtnLayer = null;
    var sendBtnLayer = null;
    var cancelTextLayer = null;
    var sendTextLayer = null;

    $.writeln("🔍 Finding existing modal elements...");
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var layerName = layer.name;
        $.writeln("   • Layer " + i + ": " + layerName);
        
        if (layerName === "iOS Modal") modalLayer = layer;
        else if (layerName === "Modal Title") titleLayer = layer;
        else if (layerName === "Modal Subtitle") subtitleLayer = layer;
        else if (layerName === "Cancel Button") cancelBtnLayer = layer;
        else if (layerName === "Send Button") sendBtnLayer = layer;
        else if (layerName === "Cancel Button Text") cancelTextLayer = layer;
        else if (layerName === "Send Button Text") sendTextLayer = layer;
    }

    if (!modalLayer) {
        $.writeln("❌ No iOS Modal layer found. Please run the modal creation script first.");
        alert("No iOS Modal layer found. Please run the modal creation script first.");
        throw new Error("No iOS Modal layer found");
    }

    // Update text with Apple-style content
    $.writeln("🍎 Adding Apple-style text...");
    
    // Update title with Apple-style text
    if (titleLayer) {
        $.writeln("   • Updating title with Apple-style text");
        var titleTextDoc = titleLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var td = titleTextDoc.value;
        td.text = "Send Message";
        td.fontSize = 20;
        td.fillColor = [0.1, 0.1, 0.1];
        td.font = "SFProDisplay-Medium"; // Apple's system font
        titleTextDoc.setValue(td);
    }

    // Update subtitle with Apple-style text
    if (subtitleLayer) {
        $.writeln("   • Updating subtitle with Apple-style text");
        var subtitleTextDoc = subtitleLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var sd = subtitleTextDoc.value;
        sd.text = "Your message will be sent securely using end-to-end encryption.";
        sd.fontSize = 13;
        sd.fillColor = [0.4, 0.4, 0.4];
        sd.font = "SFProText-Regular";
        subtitleTextDoc.setValue(sd);
    }

    // Add Apple-style body text
    $.writeln("   • Creating Apple-style body text");
    var bodyTextLayer = comp.layers.addText("This action cannot be undone. The recipient will receive your message immediately.");
    bodyTextLayer.name = "Modal Body Text";
    var bodyTextDoc = bodyTextLayer.property("ADBE Text Properties").property("ADBE Text Document");
    var btd = bodyTextDoc.value;
    btd.fontSize = 11;
    btd.fillColor = [0.6, 0.6, 0.6];
    btd.font = "SFProText-Regular";
    btd.justification = ParagraphJustification.CENTER_JUSTIFY;
    bodyTextDoc.setValue(btd);
    bodyTextLayer.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY + 20]);

    // Animation timing
    var clickTime = 2.0;        // When send button is clicked
    var animStartTime = 2.2;    // When modal starts folding
    var foldDuration = 1.0;     // How long the folding takes
    var flyStartTime = animStartTime + foldDuration; // When airplane starts flying
    var flyDuration = 1.5;      // How long the flight takes

    $.writeln("⚡ Setting up paper airplane animation...");

    // Create paper airplane shape (simple triangle)
    $.writeln("   • Creating paper airplane shape");
    var airplaneLayer = comp.layers.addShape();
    airplaneLayer.name = "Paper Airplane";
    var airplaneGroup = airplaneLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    airplaneGroup.name = "Airplane Shape";
    var airplaneVectors = airplaneGroup.property("ADBE Vectors Group");

    // Create triangle path for airplane
    var airplanePath = airplaneVectors.addProperty("ADBE Vector Shape - Group");
    var pathGroup = airplanePath.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group");
    var vertices = pathGroup.property("ADBE Vector Shape - Group");
    
    // Simplified: just create a triangle using a stroke
    var trianglePath = airplaneVectors.addProperty("ADBE Vector Shape - Group");
    var triangleStroke = airplaneVectors.addProperty("ADBE Vector Graphic - Stroke");
    triangleStroke.property("ADBE Vector Stroke Color").setValue([0.8, 0.8, 0.8]);
    triangleStroke.property("ADBE Vector Stroke Width").setValue(3);

    // Position airplane initially at modal center but invisible
    airplaneLayer.property("ADBE Transform Group").property("ADBE Position").setValue([centerX, centerY]);
    airplaneLayer.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);

    // MODAL FOLD ANIMATION
    $.writeln("   • Animating modal fold...");

    // All modal elements start visible, then animate out
    var modalElements = [modalLayer, titleLayer, subtitleLayer, bodyTextLayer, cancelBtnLayer, sendBtnLayer, cancelTextLayer, sendTextLayer];
    
    for (var j = 0; j < modalElements.length; j++) {
        var element = modalElements[j];
        if (!element) continue;

        var transform = element.property("ADBE Transform Group");
        var opacity = transform.property("ADBE Opacity");
        var scale = transform.property("ADBE Scale");
        var position = transform.property("ADBE Position");
        var rotation = transform.property("ADBE Rotation");

        // Set initial keyframes (normal state)
        opacity.setValueAtTime(animStartTime, 100);
        scale.setValueAtTime(animStartTime, [100, 100]);
        rotation.setValueAtTime(animStartTime, 0);

        // Fold animation - elements scale down and rotate
        var foldEndTime = animStartTime + foldDuration * 0.7; // Most folding happens in first 70%
        
        opacity.setValueAtTime(foldEndTime, 20); // Fade but don't disappear completely
        scale.setValueAtTime(foldEndTime, [20, 5]); // Flatten vertically, shrink horizontally
        rotation.setValueAtTime(foldEndTime, 15 + (j * 5)); // Each element rotates slightly differently

        // Final disappearance
        opacity.setValueAtTime(flyStartTime, 0);
        scale.setValueAtTime(flyStartTime, [5, 1]);
    }

    // PAPER AIRPLANE ANIMATION
    $.writeln("   • Animating paper airplane flight...");

    var airplaneTransform = airplaneLayer.property("ADBE Transform Group");
    var airplaneOpacity = airplaneTransform.property("ADBE Opacity");
    var airplanePosition = airplaneTransform.property("ADBE Position");
    var airplaneRotation = airplaneTransform.property("ADBE Rotation");
    var airplaneScale = airplaneTransform.property("ADBE Scale");

    // Airplane appears when modal finishes folding
    airplaneOpacity.setValueAtTime(flyStartTime - 0.1, 0);
    airplaneOpacity.setValueAtTime(flyStartTime, 100);
    airplaneScale.setValueAtTime(flyStartTime, [50, 50]); // Start small
    airplanePosition.setValueAtTime(flyStartTime, [centerX, centerY]);
    airplaneRotation.setValueAtTime(flyStartTime, -45); // Point toward exit

    // Airplane flies away (curved path)
    var flyEndTime = flyStartTime + flyDuration;
    var exitX = comp.width + 200; // Off screen right
    var exitY = centerY - 300;    // Upward trajectory

    // Curved flight path using bezier keyframes
    airplanePosition.setValueAtTime(flyStartTime, [centerX, centerY]);
    airplanePosition.setValueAtTime(flyStartTime + flyDuration * 0.3, [centerX + 200, centerY - 100]); // Arc up
    airplanePosition.setValueAtTime(flyStartTime + flyDuration * 0.7, [centerX + 400, centerY - 200]); // Continue arc
    airplanePosition.setValueAtTime(flyEndTime, [exitX, exitY]); // Exit off-screen

    // Add some rotation during flight for realism
    airplaneRotation.setValueAtTime(flyStartTime, -45);
    airplaneRotation.setValueAtTime(flyStartTime + flyDuration * 0.5, -30); // Level out slightly
    airplaneRotation.setValueAtTime(flyEndTime, -20);

    // Scale up slightly as it "flies away" (perspective effect)
    airplaneScale.setValueAtTime(flyStartTime, [50, 50]);
    airplaneScale.setValueAtTime(flyStartTime + flyDuration * 0.3, [70, 70]);
    airplaneScale.setValueAtTime(flyEndTime, [40, 40]); // Shrink as it gets distant

    // Fade out at the end
    airplaneOpacity.setValueAtTime(flyEndTime - 0.2, 100);
    airplaneOpacity.setValueAtTime(flyEndTime, 0);

    // Add easing to all keyframes for smooth animation
    $.writeln("   • Adding smooth easing...");
    
    // Helper function to add ease to keyframes
    function addEaseToProperty(property, startTime, endTime) {
        try {
            for (var k = 1; k <= property.numKeys; k++) {
                var keyTime = property.keyTime(k);
                if (keyTime >= startTime && keyTime <= endTime) {
                    property.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);
                    property.setTemporalEaseAtKey(k, [
                        new KeyframeEase(0.5, 75),
                        new KeyframeEase(0.5, 75)
                    ], [
                        new KeyframeEase(0.5, 75),
                        new KeyframeEase(0.5, 75)
                    ]);
                }
            }
        } catch (easeError) {
            $.writeln("Could not add easing to property: " + easeError.toString());
        }
    }

    // Apply easing to airplane animation
    addEaseToProperty(airplanePosition, flyStartTime, flyEndTime);
    addEaseToProperty(airplaneRotation, flyStartTime, flyEndTime);
    addEaseToProperty(airplaneScale, flyStartTime, flyEndTime);

    $.writeln("✅ Apple-style modal to paper airplane animation created successfully!");
    alert(
        "Apple-style modal animation created! 🍎✈️\n\n" +
        "Timeline:\n" +
        "• 2.0s: Send button click\n" +
        "• 2.2s: Modal starts folding\n" +
        "• 3.2s: Paper airplane appears and flies away\n" +
        "• 4.7s: Animation complete\n\n" +
        "Features:\n" +
        "• Apple-style typography and messaging\n" +
        "• Smooth folding animation\n" +
        "• Paper airplane flight with curved path\n" +
        "• Professional easing and timing"
    );

} catch (error) {
    $.writeln("❗ MAIN ERROR: " + error.toString());
    if (error.fileName) $.writeln("   File: " + error.fileName);
    if (error.line) $.writeln("   Line: " + error.line);
    alert("Error: " + error.toString());
} finally {
    app.endUndoGroup();
    $.writeln("⏹️ End Undo Group");
} 