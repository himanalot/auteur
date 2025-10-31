// @target aftereffects
(function() {
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
            var position = heroLayer.property("Transform").property("Position");
            var scale    = heroLayer.property("Transform").property("Scale");
            var opacity  = heroLayer.property("Transform").property("Opacity");
            var rotation = heroLayer.property("Transform").property("Rotation");

            // Clear all existing keyframes
            var props = [position, scale, opacity, rotation];
            for (var p = 0; p < props.length; p++) {
                var pr = props[p];
                while (pr.numKeys > 0) {
                    pr.removeKey(1);
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
            setKeyframes(opacity,  [t0, t1, t3], [0, 100, 100]);
            setKeyframes(rotation, [t0, t1, t2, t3], [-10, 20, 10, 0]);
            results.push("SUCCESS: Keyframes set");

            // Build ease objects - KeyframeEase(speed, influence)
            var easeIn  = new KeyframeEase(0, 50);
            var easeOut = new KeyframeEase(0, 50);

            // Helper function to get property dimensions
            function getPropertyDimension(prop) {
                try {
                    var val = prop.value;
                    if (Array.isArray(val)) {
                        return val.length;
                    }
                    return 1;
                } catch (e) {
                    return 1; // Default to 1D if we can't determine
                }
            }

            // Helper to create ease arrays of correct dimension
            function createEaseArray(ease, dimension) {
                var arr = [];
                for (var i = 0; i < dimension; i++) {
                    arr.push(ease);
                }
                return arr;
            }

            // Apply easing with correct array dimensions per property
            var props = [
                { prop: position, name: "Position" },
                { prop: scale, name: "Scale" },
                { prop: opacity, name: "Opacity" },
                { prop: rotation, name: "Rotation" }
            ];

            for (var i = 0; i < props.length; i++) {
                var prop = props[i].prop;
                var dim = getPropertyDimension(prop);
                var easeInArray = createEaseArray(easeIn, dim);
                var easeOutArray = createEaseArray(easeOut, dim);
                
                for (var k = 1; k <= prop.numKeys; k++) {
                    try {
                        prop.setTemporalEaseAtKey(k, easeInArray, easeOutArray);
                    } catch (e) {
                        results.push("WARNING: Could not set ease for " + props[i].name + " at key " + k + ": " + e.toString());
                    }
                }
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
})(); 