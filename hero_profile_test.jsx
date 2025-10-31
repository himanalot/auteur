function animateHeroProfile() {
    var results = [];
    
    try {
        // Get the active composition
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            results.push("ERROR: No active composition found");
            return results;
        }
        results.push("SUCCESS: Active composition found – " + comp.name);

        // Find the Hero_Profile layer
        var heroLayer = null;
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === "Hero_Profile") {
                heroLayer = comp.layer(i);
                break;
            }
        }
        if (!heroLayer) {
            results.push("ERROR: Hero_Profile layer not found");
            return results;
        }
        results.push("SUCCESS: Hero_Profile layer found at index " + heroLayer.index);

        // Begin undo group
        app.beginUndoGroup("Animate Hero Profile");
        results.push("SUCCESS: Undo group started");

        // Grab transform properties
        var position = heroLayer.property("Position");
        var scale    = heroLayer.property("Scale");
        var opacity  = heroLayer.property("Opacity");
        var rotation = heroLayer.property("Rotation");

        // Clear all existing keyframes
        var props = [position, scale, opacity, rotation];
        for (var p = 0; p < props.length; p++) {
            var pr = props[p];
            for (var k = pr.numKeys; k >= 1; k--) {
                pr.removeKey(k);
            }
        }
        results.push("SUCCESS: All existing keyframes cleared");

        // Timing
        var t0 = heroLayer.inPoint;
        var t1 = t0 + 0.3;
        var t2 = t0 + 0.7;
        var t3 = t0 + 1.0;

        // Helper to set multiple keyframes
        function setKeyframes(pr, times, vals) {
            for (var i = 0; i < times.length; i++) {
                pr.setValueAtTime(times[i], vals[i]);
            }
        }

        // Keyframes
        setKeyframes(position, [t0, t1, t2, t3], [
            [comp.width/2, comp.height/2 + 100],
            [comp.width/2, comp.height/2 - 20],
            [comp.width/2, comp.height/2 + 5],
            [comp.width/2, comp.height/2]
        ]);
        setKeyframes(scale,    [t0, t1, t3], [[60,60], [110,110], [100,100]]);
        setKeyframes(opacity,  [t0, t1, t3], [0,     100,      100    ]);
        setKeyframes(rotation, [t0, t1, t2, t3], [-10, 20, 10, 0]);
        results.push("SUCCESS: Keyframes set");

        // Build ease objects - KeyframeEase(speed, influence)
        var easeIn  = new KeyframeEase(0, 50);
        var easeOut = new KeyframeEase(0, 50);

        // Apply easing with correct array dimensions per property type

        // Position (2D) - requires array of 2 KeyframeEase objects
        var ease2D_in  = [easeIn, easeIn];
        var ease2D_out = [easeOut, easeOut];
        for (var k = 1; k <= position.numKeys; k++) {
            position.setTemporalEaseAtKey(k, ease2D_in, ease2D_out);
        }

        // Scale (2D) - requires array of 2 KeyframeEase objects
        for (var k = 1; k <= scale.numKeys; k++) {
            scale.setTemporalEaseAtKey(k, ease2D_in, ease2D_out);
        }

        // Opacity (1D) - requires array of 1 KeyframeEase object
        var ease1D_in  = [easeIn];
        var ease1D_out = [easeOut];
        for (var k = 1; k <= opacity.numKeys; k++) {
            opacity.setTemporalEaseAtKey(k, ease1D_in, ease1D_out);
        }

        // Rotation (1D) - requires array of 1 KeyframeEase object
        for (var k = 1; k <= rotation.numKeys; k++) {
            rotation.setTemporalEaseAtKey(k, ease1D_in, ease1D_out);
        }
        results.push("SUCCESS: Easing applied");

        // End undo group
        app.endUndoGroup();
        results.push("SUCCESS: Undo group completed");
        results.push("SUCCESS: Hero_Profile animation completed successfully");

    } catch (err) {
        results.push("ERROR: " + err.toString());
        try { app.endUndoGroup(); } catch (e) {}
    }

    return results;
}

// Execute and show results
var animationResults = animateHeroProfile();
alert("ANIMATION RESULTS:\n" + animationResults.join("\n")); 