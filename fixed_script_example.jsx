app.beginUndoGroup("Create Complex macOS Scene");

try {
    // Create a new project if one doesn't exist
    if (!app.project) {
        app.newProject();
    }

    // Define composition settings
    var compName = "macOS Scene with Planets";
    var compWidth = 1920;
    var compHeight = 1080;
    var compDuration = 10; // seconds
    var compFrameRate = 29.97;

    // Create a new composition
    var myComp = app.project.items.addComp(compName, compWidth, compHeight, 1, compDuration, compFrameRate);

    // Create space background
    var spaceLayer = myComp.layers.addSolid([0.02, 0.02, 0.1], "Space Background", compWidth, compHeight, 1);
    spaceLayer.moveToEnd();

    // Add noise for stars
    var noise = spaceLayer.Effects.addProperty("ADBE Fractal Noise");
    noise.property("Fractal Type").setValue(1);
    noise.property("Noise Type").setValue(1);
    noise.property("Contrast").setValue(200);
    noise.property("Brightness").setValue(-60);
    noise.property("Evolution").expression = "time * 10";

    // Create macOS Dock as a solid layer with rounded corners
    var dockHeight = 80;
    var dockWidth = compWidth * 0.6;
    var dockLayer = myComp.layers.addSolid([0.2, 0.2, 0.2], "macOS Dock", dockWidth, dockHeight, 1);
    dockLayer.property("Position").setValue([compWidth / 2, compHeight - dockHeight / 2 - 20]);
    
    // Add rounded corners effect
    var roundedCorners = dockLayer.Effects.addProperty("ADBE Corner Pin");
    
    // Animate dock expansion
    var dockScale = dockLayer.property("Scale");
    dockScale.setValueAtTime(0, [0, 100]);
    dockScale.setValueAtTime(1, [100, 100]);

    // Create Application Icons using solid layers
    var numIcons = 6;
    var iconSize = 50;
    var startX = compWidth / 2 - (numIcons * iconSize) / 2;
    
    for (var i = 0; i < numIcons; i++) {
        var iconX = startX + (i * iconSize) + iconSize / 2;
        var iconY = compHeight - dockHeight / 2 - 20;
        
        // Create icon as solid
        var iconColor = [Math.random(), Math.random(), Math.random()];
        var icon = myComp.layers.addSolid(iconColor, "App Icon " + (i + 1), iconSize, iconSize, 1);
        icon.property("Position").setValue([iconX, iconY]);
        
        // Add rounded corners to make it look like an app icon
        var iconCorners = icon.Effects.addProperty("ADBE Corner Pin");
        
        // Spring animation - starts small, bounces up
        var iconScale = icon.property("Scale");
        var delay = i * 0.1; // Stagger the animations
        iconScale.setValueAtTime(delay, [0, 0]);
        iconScale.setValueAtTime(delay + 0.3, [120, 120]);
        iconScale.setValueAtTime(delay + 0.5, [90, 90]);
        iconScale.setValueAtTime(delay + 0.7, [100, 100]);
        
        // Add glow effect
        var glow = icon.Effects.addProperty("ADBE Glo2");
        glow.property("Glow Radius").setValue(5);
        glow.property("Glow Intensity").setValue(0.8);
    }

    // Create growing plants background using fractal noise
    var plantsLayer = myComp.layers.addSolid([0.1, 0.4, 0.1], "Growing Plants", compWidth, compHeight, 1);
    plantsLayer.moveAfter(spaceLayer);
    plantsLayer.blendingMode = BlendingMode.OVERLAY;
    
    var plantNoise = plantsLayer.Effects.addProperty("ADBE Fractal Noise");
    plantNoise.property("Fractal Type").setValue(6); // Swirly
    plantNoise.property("Complexity").setValue(4);
    plantNoise.property("Brightness").setValue(-30);
    plantNoise.property("Contrast").setValue(150);
    
    // Animate plant growth
    var plantTransform = plantNoise.property("Transform");
    var plantScale = plantTransform.property("Scale");
    plantScale.setValueAtTime(0, [50, 50]);
    plantScale.setValueAtTime(5, [200, 200]);
    
    var plantEvolution = plantNoise.property("Evolution");
    plantEvolution.expression = "time * 30";

    // Create orbiting planets
    var centerX = compWidth / 2;
    var centerY = compHeight / 3;
    
    // Planet 1 - Large blue planet
    var planet1 = myComp.layers.addSolid([0.2, 0.5, 1], "Planet 1", 80, 80, 1);
    var planet1Pos = planet1.property("Position");
    planet1Pos.expression = 
        "centerX = " + centerX + ";\n" +
        "centerY = " + centerY + ";\n" +
        "radius = 200;\n" +
        "speed = 0.5;\n" +
        "angle = time * speed;\n" +
        "x = centerX + Math.cos(angle) * radius;\n" +
        "y = centerY + Math.sin(angle) * radius * 0.6;\n" +
        "[x, y]";
    
    // Add atmosphere glow
    var planet1Glow = planet1.Effects.addProperty("ADBE Glo2");
    planet1Glow.property("Glow Radius").setValue(20);
    planet1Glow.property("Glow Intensity").setValue(1.2);
    planet1Glow.property("Glow Colors").setValue([0.3, 0.7, 1]);

    // Planet 2 - Smaller red planet
    var planet2 = myComp.layers.addSolid([1, 0.3, 0.2], "Planet 2", 50, 50, 1);
    var planet2Pos = planet2.property("Position");
    planet2Pos.expression = 
        "centerX = " + centerX + ";\n" +
        "centerY = " + centerY + ";\n" +
        "radius = 120;\n" +
        "speed = 1.2;\n" +
        "angle = time * speed + 3.14;\n" +
        "x = centerX + Math.cos(angle) * radius;\n" +
        "y = centerY + Math.sin(angle) * radius * 0.4;\n" +
        "[x, y]";
    
    var planet2Glow = planet2.Effects.addProperty("ADBE Glo2");
    planet2Glow.property("Glow Radius").setValue(15);
    planet2Glow.property("Glow Intensity").setValue(1.0);
    planet2Glow.property("Glow Colors").setValue([1, 0.5, 0.3]);

    // Planet 3 - Small moon
    var moon = myComp.layers.addSolid([0.8, 0.8, 0.7], "Moon", 25, 25, 1);
    var moonPos = moon.property("Position");
    moonPos.expression = 
        "centerX = " + centerX + ";\n" +
        "centerY = " + centerY + ";\n" +
        "radius = 80;\n" +
        "speed = 2.5;\n" +
        "angle = time * speed;\n" +
        "x = centerX + Math.cos(angle) * radius;\n" +
        "y = centerY + Math.sin(angle) * radius * 0.3;\n" +
        "[x, y]";

    // Add title text
    var titleLayer = myComp.layers.addText("macOS Space Garden");
    var titleText = titleLayer.property("Source Text");
    var titleDoc = titleText.value;
    titleDoc.fontSize = 48;
    titleDoc.fillColor = [1, 1, 1];
    titleDoc.font = "Arial-BoldMT";
    titleText.setValue(titleDoc);
    
    titleLayer.property("Position").setValue([compWidth / 2, 100]);
    
    // Animate title appearance
    var titleOpacity = titleLayer.property("Opacity");
    titleOpacity.setValueAtTime(0, 0);
    titleOpacity.setValueAtTime(2, 100);

    app.endUndoGroup();
    
    JSON.stringify({
        success: true,
        message: "macOS space garden composition created successfully!"
    });

} catch (err) {
    app.endUndoGroup();
    
    JSON.stringify({
        success: false,
        message: "Script Error: " + err.toString(),
        line: err.line || "unknown"
    });
}