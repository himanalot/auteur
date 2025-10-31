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

    // Helper function for safe property access
    function getProperty(layer, propName) {
        try {
            var prop = layer.property(propName);
            return prop || null;
        } catch (e) {
            $.writeln("   ⚠️ Property '" + propName + "' not found on " + layer.name);
            return null;
        }
    }

    // Helper function for safe transform properties
    function getTransformProperties(layer) {
        var transform = getProperty(layer, "ADBE Transform Group");
        if (!transform) {
            $.writeln("   ❌ No transform group on " + layer.name);
            return null;
        }

        return {
            transform: transform,
            position: getProperty(transform, "ADBE Position"),
            scale: getProperty(transform, "ADBE Scale"),
            rotation: getProperty(transform, "ADBE Rotation"),
            opacity: getProperty(transform, "ADBE Opacity")
        };
    }

    // Update text with Apple-style content
    $.writeln("🍎 Adding Apple-style text...");
    
    // Update title with Apple-style text
    if (titleLayer) {
        $.writeln("   • Updating title with Apple-style text");
        try {
            var titleTextProps = getProperty(titleLayer, "ADBE Text Properties");
            if (titleTextProps) {
                var titleTextDoc = getProperty(titleTextProps, "ADBE Text Document");
                if (titleTextDoc) {
                    var td = titleTextDoc.value;
                    td.text = "Send Message";
                    td.fontSize = 20;
                    td.fillColor = [0.1, 0.1, 0.1];
                    titleTextDoc.setValue(td);
                    $.writeln("   ✅ Title updated successfully");
                }
            }
        } catch (titleError) {
            $.writeln("   ⚠️ Title update failed: " + titleError.toString());
        }
    }

    // Update subtitle with Apple-style text
    if (subtitleLayer) {
        $.writeln("   • Updating subtitle with Apple-style text");
        try {
            var subtitleTextProps = getProperty(subtitleLayer, "ADBE Text Properties");
            if (subtitleTextProps) {
                var subtitleTextDoc = getProperty(subtitleTextProps, "ADBE Text Document");
                if (subtitleTextDoc) {
                    var sd = subtitleTextDoc.value;
                    sd.text = "Your message will be sent securely using end-to-end encryption.";
                    sd.fontSize = 13;
                    sd.fillColor = [0.4, 0.4, 0.4];
                    subtitleTextDoc.setValue(sd);
                    $.writeln("   ✅ Subtitle updated successfully");
                }
            }
        } catch (subtitleError) {
            $.writeln("   ⚠️ Subtitle update failed: " + subtitleError.toString());
        }
    }

    // Add Apple-style body text
    $.writeln("   • Creating Apple-style body text");
    try {
        var bodyTextLayer = comp.layers.addText("This action cannot be undone. The recipient will receive your message immediately.");
        bodyTextLayer.name = "Modal Body Text";
        var bodyTextProps = getProperty(bodyTextLayer, "ADBE Text Properties");
        if (bodyTextProps) {
            var bodyTextDoc = getProperty(bodyTextProps, "ADBE Text Document");
            if (bodyTextDoc) {
                var btd = bodyTextDoc.value;
                btd.fontSize = 11;
                btd.fillColor = [0.6, 0.6, 0.6];
                btd.justification = ParagraphJustification.CENTER_JUSTIFY;
                bodyTextDoc.setValue(btd);
                
                var bodyTransformProps = getTransformProperties(bodyTextLayer);
                if (bodyTransformProps && bodyTransformProps.position) {
                    bodyTransformProps.position.setValue([centerX, centerY + 20]);
                }
                $.writeln("   ✅ Body text created successfully");
            }
        }
    } catch (bodyError) {
        $.writeln("   ⚠️ Body text creation failed: " + bodyError.toString());
    }

    // Animation timing
    var clickTime = 2.0;        // When send button is clicked
    var animStartTime = 2.2;    // When modal starts folding
    var foldDuration = 1.0;     // How long the folding takes
    var flyStartTime = animStartTime + foldDuration; // When airplane starts flying
    var flyDuration = 1.5;      // How long the flight takes

    $.writeln("⚡ Setting up paper airplane animation...");

    // Create paper airplane using TEXT (much simpler and more reliable)
    $.writeln("   • Creating paper airplane using text symbol");
    var airplaneLayer = comp.layers.addText("✈");
    airplaneLayer.name = "Paper Airplane";
    
    var airplaneTextProps = getProperty(airplaneLayer, "ADBE Text Properties");
    if (airplaneTextProps) {
        var airplaneTextDoc = getProperty(airplaneTextProps, "ADBE Text Document");
        if (airplaneTextDoc) {
            var atd = airplaneTextDoc.value;
            atd.fontSize = 40;
            atd.fillColor = [0.7, 0.7, 0.7];
            atd.justification = ParagraphJustification.CENTER_JUSTIFY;
            airplaneTextDoc.setValue(atd);
        }
    }

    // Position airplane initially at modal center but invisible
    var airplaneTransformProps = getTransformProperties(airplaneLayer);
    if (airplaneTransformProps) {
        if (airplaneTransformProps.position) {
            airplaneTransformProps.position.setValue([centerX, centerY]);
        }
        if (airplaneTransformProps.opacity) {
            airplaneTransformProps.opacity.setValue(0);
        }
        $.writeln("   ✅ Paper airplane created successfully using text symbol");
    } else {
        $.writeln("   ⚠️ Could not get airplane transform properties on first try, retrying...");
        // Sometimes transform properties aren't immediately available, try again
        airplaneTransformProps = getTransformProperties(airplaneLayer);
        if (airplaneTransformProps) {
            if (airplaneTransformProps.position) {
                airplaneTransformProps.position.setValue([centerX, centerY]);
            }
            if (airplaneTransformProps.opacity) {
                airplaneTransformProps.opacity.setValue(0);
            }
            $.writeln("   ✅ Paper airplane created successfully using text symbol (retry)");
        } else {
            $.writeln("   ❌ Failed to get airplane transform properties");
        }
    }

    // MODAL FOLD ANIMATION
    $.writeln("   • Animating modal fold...");

    // All modal elements start visible, then animate out
    var modalElements = [modalLayer, titleLayer, subtitleLayer, cancelBtnLayer, sendBtnLayer, cancelTextLayer, sendTextLayer];
    
    for (var j = 0; j < modalElements.length; j++) {
        var element = modalElements[j];
        if (!element) continue;

        $.writeln("   • Processing " + element.name + "...");
        
        var transformProps = getTransformProperties(element);
        if (!transformProps) {
            $.writeln("     ⚠️ No transform properties found on " + element.name);
            continue;
        }

        try {
            // Set initial keyframes (normal state) - only if properties exist
            if (transformProps.opacity) {
                transformProps.opacity.setValueAtTime(animStartTime, 100);
            }
            if (transformProps.scale) {
                transformProps.scale.setValueAtTime(animStartTime, [100, 100]);
            }
            if (transformProps.rotation) {
                transformProps.rotation.setValueAtTime(animStartTime, 0);
            }

            // Fold animation - elements scale down and rotate
            var foldEndTime = animStartTime + foldDuration * 0.7; // Most folding happens in first 70%
            
            if (transformProps.opacity) {
                transformProps.opacity.setValueAtTime(foldEndTime, 20); // Fade but don't disappear completely
                transformProps.opacity.setValueAtTime(flyStartTime, 0); // Final disappearance
            }
            if (transformProps.scale) {
                transformProps.scale.setValueAtTime(foldEndTime, [20, 5]); // Flatten vertically, shrink horizontally
                transformProps.scale.setValueAtTime(flyStartTime, [5, 1]);
            }
            if (transformProps.rotation) {
                transformProps.rotation.setValueAtTime(foldEndTime, 15 + (j * 5)); // Each element rotates slightly differently
            }
            
            $.writeln("     ✅ Animated: " + element.name);
        } catch (elementError) {
            $.writeln("     ⚠️ Could not animate " + element.name + ": " + elementError.toString());
        }
    }

    // PAPER AIRPLANE ANIMATION
    $.writeln("   • Animating paper airplane flight...");

    // Re-check transform properties before animation
    if (!airplaneTransformProps) {
        $.writeln("   • Retrying to get airplane transform properties for animation...");
        airplaneTransformProps = getTransformProperties(airplaneLayer);
    }

    if (airplaneTransformProps && 
        airplaneTransformProps.opacity && 
        airplaneTransformProps.position && 
        airplaneTransformProps.rotation && 
        airplaneTransformProps.scale) {
        
        try {
            // Airplane appears when modal finishes folding
            airplaneTransformProps.opacity.setValueAtTime(flyStartTime - 0.1, 0);
            airplaneTransformProps.opacity.setValueAtTime(flyStartTime, 100);
            airplaneTransformProps.scale.setValueAtTime(flyStartTime, [50, 50]); // Start small
            airplaneTransformProps.position.setValueAtTime(flyStartTime, [centerX, centerY]);
            airplaneTransformProps.rotation.setValueAtTime(flyStartTime, -45); // Point toward exit

            // Airplane flies away (curved path)
            var flyEndTime = flyStartTime + flyDuration;
            var exitX = comp.width + 200; // Off screen right
            var exitY = centerY - 300;    // Upward trajectory

            // Curved flight path using multiple keyframes
            airplaneTransformProps.position.setValueAtTime(flyStartTime, [centerX, centerY]);
            airplaneTransformProps.position.setValueAtTime(flyStartTime + flyDuration * 0.3, [centerX + 200, centerY - 100]); // Arc up
            airplaneTransformProps.position.setValueAtTime(flyStartTime + flyDuration * 0.7, [centerX + 400, centerY - 200]); // Continue arc
            airplaneTransformProps.position.setValueAtTime(flyEndTime, [exitX, exitY]); // Exit off-screen

            // Add some rotation during flight for realism
            airplaneTransformProps.rotation.setValueAtTime(flyStartTime, -45);
            airplaneTransformProps.rotation.setValueAtTime(flyStartTime + flyDuration * 0.5, -30); // Level out slightly
            airplaneTransformProps.rotation.setValueAtTime(flyEndTime, -20);

            // Scale up slightly as it "flies away" (perspective effect)
            airplaneTransformProps.scale.setValueAtTime(flyStartTime, [50, 50]);
            airplaneTransformProps.scale.setValueAtTime(flyStartTime + flyDuration * 0.3, [70, 70]);
            airplaneTransformProps.scale.setValueAtTime(flyEndTime, [40, 40]); // Shrink as it gets distant

            // Fade out at the end
            airplaneTransformProps.opacity.setValueAtTime(flyEndTime - 0.2, 100);
            airplaneTransformProps.opacity.setValueAtTime(flyEndTime, 0);

            $.writeln("   ✅ Paper airplane flight animation created");

            // Add easing to all keyframes for smooth animation
            $.writeln("   • Adding smooth easing...");
            
            // Helper function to add ease to keyframes
            function addEaseToProperty(property, startTime, endTime) {
                if (!property) return;
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
            addEaseToProperty(airplaneTransformProps.position, flyStartTime, flyEndTime);
            addEaseToProperty(airplaneTransformProps.rotation, flyStartTime, flyEndTime);
            addEaseToProperty(airplaneTransformProps.scale, flyStartTime, flyEndTime);

            $.writeln("   ✅ Smooth easing applied");

        } catch (airplaneError) {
            $.writeln("❗ Airplane animation failed: " + airplaneError.toString());
            throw airplaneError;
        }
    } else {
        $.writeln("❗ Could not access airplane transform properties");
        $.writeln("   • airplaneTransformProps exists: " + (airplaneTransformProps ? "yes" : "no"));
        if (airplaneTransformProps) {
            $.writeln("   • opacity exists: " + (airplaneTransformProps.opacity ? "yes" : "no"));
            $.writeln("   • position exists: " + (airplaneTransformProps.position ? "yes" : "no"));
            $.writeln("   • rotation exists: " + (airplaneTransformProps.rotation ? "yes" : "no"));
            $.writeln("   • scale exists: " + (airplaneTransformProps.scale ? "yes" : "no"));
        }
        
        // Try to continue with available properties or skip airplane animation
        $.writeln("   • Skipping airplane animation due to missing transform properties");
        $.writeln("   ✅ Modal fold animation completed successfully (airplane animation skipped)");
    }

    $.writeln("✅ Apple-style modal animation created successfully!");
    
    // Check if airplane animation was successful
    var airplaneSuccess = airplaneTransformProps && 
                         airplaneTransformProps.opacity && 
                         airplaneTransformProps.position && 
                         airplaneTransformProps.rotation && 
                         airplaneTransformProps.scale;
    
    if (airplaneSuccess) {
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
            "• Professional easing and timing\n" +
            "• Robust property validation"
        );
    } else {
        alert(
            "Apple-style modal animation created! 🍎\n\n" +
            "Timeline:\n" +
            "• 2.0s: Send button click\n" +
            "• 2.2s: Modal starts folding\n" +
            "• 3.2s: Modal fold complete\n\n" +
            "Features:\n" +
            "• Apple-style typography and messaging\n" +
            "• Smooth folding animation\n" +
            "• Professional easing and timing\n" +
            "• Robust property validation\n\n" +
            "Note: Paper airplane animation was skipped due to property access issues."
        );
    }

} catch (error) {
    $.writeln("❗ MAIN ERROR: " + error.toString());
    if (error.fileName) $.writeln("   File: " + error.fileName);
    if (error.line) $.writeln("   Line: " + error.line);
    alert("Error: " + error.toString());
} finally {
    app.endUndoGroup();
    $.writeln("⏹️ End Undo Group");
} 