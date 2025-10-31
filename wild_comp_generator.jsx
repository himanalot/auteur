// WILD COMP GENERATOR
// Creates a psychedelic animated composition with multiple crazy effects

app.beginUndoGroup("Wild Comp Generator");

try {
        // Create new composition
        var comp = app.project.items.addComp("WILD_MADNESS", 1920, 1080, 1.0, 10.0, 30);
        
        // Create background gradient
        var bgSolid = comp.layers.addSolid([0.1, 0.1, 0.2], "Background", 1920, 1080, 1.0, 10.0);
        var gradientEffect = bgSolid.Effects.addProperty("ADBE Ramp");
        gradientEffect.property("ADBE Ramp-0001").setValue([960, 200]); // Start point
        gradientEffect.property("ADBE Ramp-0002").setValue([960, 880]); // End point
        gradientEffect.property("ADBE Ramp-0003").setValue([0.8, 0.1, 0.9, 1]); // Start color (Purple)
        gradientEffect.property("ADBE Ramp-0004").setValue([0.1, 0.8, 0.9, 1]); // End color (Cyan)
        gradientEffect.property("ADBE Ramp-0005").setValue(1); // Ramp shape (Linear)
        
        // Animate gradient by rotating the layer
        var bgRotation = bgSolid.property("ADBE Transform Group").property("ADBE Rotate Z");
        bgRotation.setValueAtTime(0, 0);
        bgRotation.setValueAtTime(10, 720); // Two full rotations
        bgRotation.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR);
        bgRotation.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR);
        
        // Create fractal noise overlay
        var noiseSolid = comp.layers.addSolid([1, 1, 1], "Noise", 1920, 1080, 1.0, 10.0);
        var fractalNoise = noiseSolid.Effects.addProperty("ADBE Fractal Noise");
        fractalNoise.property("ADBE Fractal Noise-0001").setValue(1); // Fractal Type: Basic
        fractalNoise.property("ADBE Fractal Noise-0002").setValue(200); // Contrast
        fractalNoise.property("ADBE Fractal Noise-0003").setValue(50); // Brightness
        
        // Animate fractal noise evolution
        var evolution = fractalNoise.property("ADBE Fractal Noise-0007");
        evolution.setValueAtTime(0, 0);
        evolution.setValueAtTime(10, 1440); // 4 full rotations
        evolution.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR);
        evolution.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR);
        
        // Set blend mode for noise
        noiseSolid.blendingMode = BlendingMode.OVERLAY;
        noiseSolid.opacity.setValue(30);
        
        // Create spinning text
        var textLayer = comp.layers.addText("WILD MADNESS");
        var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var textDoc = textProp.value;
        textDoc.fontSize = 120;
        textDoc.fillColor = [1, 1, 1];
        textDoc.font = "Arial-Bold";
        textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        textProp.setValue(textDoc);
        
        // Position text in center
        textLayer.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540]);
        
        // Animate text rotation
        var textRotation = textLayer.property("ADBE Transform Group").property("ADBE Rotate Z");
        textRotation.setValueAtTime(0, 0);
        textRotation.setValueAtTime(10, 1800); // 5 full rotations
        textRotation.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR);
        textRotation.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR);
        
        // Animate text scale with easing
        var textScale = textLayer.property("ADBE Transform Group").property("ADBE Scale");
        textScale.setValueAtTime(0, [50, 50]);
        textScale.setValueAtTime(2, [150, 150]);
        textScale.setValueAtTime(4, [75, 75]);
        textScale.setValueAtTime(6, [200, 200]);
        textScale.setValueAtTime(8, [100, 100]);
        textScale.setValueAtTime(10, [50, 50]);
        
        // Add glow effect to text
        var textGlow = textLayer.Effects.addProperty("ADBE Glow");
        textGlow.property("ADBE Glow-0001").setValue([1, 0.5, 0, 1]); // Glow color (orange)
        textGlow.property("ADBE Glow-0002").setValue(5); // Glow intensity
        textGlow.property("ADBE Glow-0003").setValue(50); // Glow radius
        
        // Animate glow color
        var glowColor = textGlow.property("ADBE Glow-0001");
        glowColor.setValueAtTime(0, [1, 0, 0, 1]); // Red
        glowColor.setValueAtTime(1.67, [1, 1, 0, 1]); // Yellow
        glowColor.setValueAtTime(3.33, [0, 1, 0, 1]); // Green
        glowColor.setValueAtTime(5, [0, 1, 1, 1]); // Cyan
        glowColor.setValueAtTime(6.67, [0, 0, 1, 1]); // Blue
        glowColor.setValueAtTime(8.33, [1, 0, 1, 1]); // Magenta
        glowColor.setValueAtTime(10, [1, 0, 0, 1]); // Red again
        
        // Create orbiting circles
        for (var i = 0; i < 8; i++) {
            var angle = (i * 45) * Math.PI / 180;
            var radius = 300;
            
            var circle = comp.layers.addSolid([Math.random(), Math.random(), Math.random()], "Circle_" + i, 100, 100, 1.0, 10.0);
            
            // Make it circular with mask
            var mask = circle.Masks.addProperty("ADBE Mask Atom");
            mask.property("ADBE Mask Shape").setValue(createCirclePath(50, 50, 40));
            mask.property("ADBE Mask Feather").setValue([10, 10]);
            
            // Animate position in orbit
            var position = circle.property("ADBE Transform Group").property("ADBE Position");
            for (var t = 0; t <= 10; t += 0.1) {
                var orbitAngle = angle + (t * 0.5);
                var x = 960 + Math.cos(orbitAngle) * radius;
                var y = 540 + Math.sin(orbitAngle) * radius;
                position.setValueAtTime(t, [x, y]);
            }
            
            // Animate scale pulsing
            var scale = circle.property("ADBE Transform Group").property("ADBE Scale");
            scale.setValueAtTime(0, [50, 50]);
            scale.setValueAtTime(1, [150, 150]);
            scale.setValueAtTime(2, [50, 50]);
            scale.expression = "s = [50, 50]; s + [50, 50] * Math.sin(time * 5)";
            
            // Add glow effect
            var glow = circle.Effects.addProperty("ADBE Glow");
            glow.property("ADBE Glow-0001").setValue([Math.random(), Math.random(), Math.random(), 1]);
            glow.property("ADBE Glow-0002").setValue(5); // Glow intensity
            glow.property("ADBE Glow-0003").setValue(50); // Glow radius
        }
        
        // Create particle burst effect
        var particleComp = app.project.items.addComp("Particles", 1920, 1080, 1.0, 10.0, 30);
        for (var p = 0; p < 50; p++) {
            var particle = particleComp.layers.addSolid([Math.random(), Math.random(), Math.random()], "Particle_" + p, 10, 10, 1.0, 10.0);
            
            var startX = 960 + (Math.random() - 0.5) * 100;
            var startY = 540 + (Math.random() - 0.5) * 100;
            var endX = startX + (Math.random() - 0.5) * 1000;
            var endY = startY + (Math.random() - 0.5) * 1000;
            
            var particlePos = particle.property("ADBE Transform Group").property("ADBE Position");
            particlePos.setValueAtTime(0, [startX, startY]);
            particlePos.setValueAtTime(10, [endX, endY]);
            
            var particleOpacity = particle.property("ADBE Transform Group").property("ADBE Opacity");
            particleOpacity.setValueAtTime(0, 100);
            particleOpacity.setValueAtTime(8, 100);
            particleOpacity.setValueAtTime(10, 0);
        }
        
        // Add particle comp to main comp
        var particleLayer = comp.layers.add(particleComp);
        particleLayer.blendingMode = BlendingMode.ADD;
        
        // Create pulsing vignette
        var vignette = comp.layers.addSolid([0, 0, 0], "Vignette", 1920, 1080, 1.0, 10.0);
        var vignetteMask = vignette.Masks.addProperty("ADBE Mask Atom");
        vignetteMask.property("ADBE Mask Shape").setValue(createCirclePath(960, 540, 400));
        vignetteMask.inverted = true;
        vignetteMask.property("ADBE Mask Feather").setValue([200, 200]);
        
        // Animate vignette opacity
        var vignetteOpacity = vignette.property("ADBE Transform Group").property("ADBE Opacity");
        vignetteOpacity.expression = "50 + 30 * Math.sin(time * 3)";
        
        // Open comp in viewer
        comp.openInViewer();
        
    app.endUndoGroup();
    $.writeln("SUCCESS: Wild composition created with " + comp.layers.length + " layers of pure madness!");
        
} catch (error) {
    app.endUndoGroup();
    $.writeln("ERROR: " + error.toString());
}

// Helper function to create circular path
function createCirclePath(centerX, centerY, radius) {
    var path = new Shape();
    path.vertices = [];
    path.inTangents = [];
    path.outTangents = [];
    path.closed = true;
    
    var numPoints = 8;
    for (var i = 0; i < numPoints; i++) {
        var angle = (i * 2 * Math.PI) / numPoints;
        var x = centerX + Math.cos(angle) * radius;
        var y = centerY + Math.sin(angle) * radius;
        
        path.vertices.push([x, y]);
        
        var tangentLength = radius * 0.552;
        var inTangentX = -Math.sin(angle) * tangentLength;
        var inTangentY = Math.cos(angle) * tangentLength;
        var outTangentX = Math.sin(angle) * tangentLength;
        var outTangentY = -Math.cos(angle) * tangentLength;
        
        path.inTangents.push([inTangentX, inTangentY]);
        path.outTangents.push([outTangentX, outTangentY]);
    }
    
    return path;
}

