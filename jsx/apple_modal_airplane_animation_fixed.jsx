/**
 * Apple-Style Modal to Paper Airplane Animation - FIXED VERSION
 * Creates an Apple-style modal interface and animates it transforming into a paper airplane
 * 
 * Features:
 * - Apple-style typography and messaging
 * - Smooth modal folding animation 
 * - Paper airplane flight with curved path
 * - Professional easing and timing
 * - Robust error handling and property validation
 */

$.writeln("⏳ Begin Undo Group: Apple Modal to Paper Airplane Animation");
app.beginUndoGroup("Apple Modal to Paper Airplane Animation");

try {
    // Get the active composition
    $.writeln("🔍 Checking active item...");
    var comp = app.project.activeItem;

    if (!(comp && comp instanceof CompItem)) {
        throw new Error("Please select a composition first!");
    }

    $.writeln("✅ Active composition: " + comp.name);

    // Get composition center
    var centerX = comp.width / 2;
    var centerY = comp.height / 2;

    // Find existing modal elements (from previous script)
    $.writeln("🔍 Finding existing modal elements...");
    var modalLayer = null;
    var titleLayer = null;
    var subtitleLayer = null;
    var cancelBtnLayer = null;
    var sendBtnLayer = null;
    var cancelTextLayer = null;
    var sendTextLayer = null;

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        $.writeln("   • Layer " + i + ": " + layer.name);
        
        if (layer.name.indexOf("iOS Modal") !== -1) modalLayer = layer;
        else if (layer.name.indexOf("Modal Title") !== -1) titleLayer = layer;
        else if (layer.name.indexOf("Modal Subtitle") !== -1) subtitleLayer = layer;
        else if (layer.name.indexOf("Cancel Button") !== -1 && layer.name.indexOf("Text") === -1) cancelBtnLayer = layer;
        else if (layer.name.indexOf("Send Button") !== -1 && layer.name.indexOf("Text") === -1) sendBtnLayer = layer;
        else if (layer.name.indexOf("Cancel Button Text") !== -1) cancelTextLayer = layer;
        else if (layer.name.indexOf("Send Button Text") !== -1) sendTextLayer = layer;
    }

    // Helper function to safely get properties
    function getProperty(layer, propName) {
        try {
            return layer.property(propName);
        } catch (e) {
            $.writeln("   ⚠️ Could not get property " + propName + " on " + layer.name);
            return null;
        }
    }

    // Helper function to get transform properties safely
    function getTransformProperties(layer) {
        try {
            var transform = getProperty(layer, "ADBE Transform Group");
            if (!transform) {
                $.writeln("   ❌ No transform group on " + layer.name);
                return null;
            }

            var transformProps = {
                transform: transform,
                position: getProperty(transform, "ADBE Position"),
                scale: getProperty(transform, "ADBE Scale"),
                rotation: getProperty(transform, "ADBE Rotation"),
                opacity: getProperty(transform, "ADBE Opacity")
            };

            // For text layers, rotation might not be available by default
            // Try to enable it if it's missing
            if (!transformProps.rotation && layer instanceof TextLayer) {
                try {
                    $.writeln("   • Rotation property missing on text layer, attempting to enable...");
                    // Sometimes we need to access the property differently for text layers
                    transformProps.rotation = transform.property("ADBE Rotate Z");
                    if (!transformProps.rotation) {
                        transformProps.rotation = transform.property("Rotation");
                    }
                } catch (rotError) {
                    $.writeln("   ⚠️ Could not enable rotation on text layer: " + rotError.toString());
                }
            }

            return transformProps;
        } catch (e) {
            $.writeln("   ❌ Failed to get transform properties for " + layer.name + ": " + e.toString());
            return null;
        }
    }

    // Update text with bigger, bolder, black styling
    $.writeln("🍎 Adding bold black modal text...");
    
    // Update title with bigger, bolder, black text
    if (titleLayer) {
        $.writeln("   • Updating title with bold black styling");
        try {
            var titleTextProps = getProperty(titleLayer, "ADBE Text Properties");
            if (titleTextProps) {
                var titleTextDoc = getProperty(titleTextProps, "ADBE Text Document");
                if (titleTextDoc) {
                    var td = titleTextDoc.value;
                    td.text = "Send iMessage?";
                    td.fontSize = 28;  // Bigger
                    td.fillColor = [0.0, 0.0, 0.0];  // Pure black
                    td.font = "Arial-BoldMT";  // Bold font
                    td.justification = ParagraphJustification.CENTER_JUSTIFY;
                    titleTextDoc.setValue(td);
                    $.writeln("   ✅ Title updated successfully");
                }
            }
        } catch (titleError) {
            $.writeln("   ⚠️ Title update failed: " + titleError.toString());
        }
    }

    // Update subtitle with bigger, bolder, black text
    if (subtitleLayer) {
        $.writeln("   • Updating subtitle with bold black styling");
        try {
            var subtitleTextProps = getProperty(subtitleLayer, "ADBE Text Properties");
            if (subtitleTextProps) {
                var subtitleTextDoc = getProperty(subtitleTextProps, "ADBE Text Document");
                if (subtitleTextDoc) {
                    var sd = subtitleTextDoc.value;
                    sd.text = "Your message will be delivered securely and instantly.";
                    sd.fontSize = 18;  // Bigger
                    sd.fillColor = [0.0, 0.0, 0.0];  // Pure black
                    sd.font = "Arial-BoldMT";  // Bold font
                    sd.justification = ParagraphJustification.CENTER_JUSTIFY;
                    subtitleTextDoc.setValue(sd);
                    $.writeln("   ✅ Subtitle updated successfully");
                }
            }
        } catch (subtitleError) {
            $.writeln("   ⚠️ Subtitle update failed: " + subtitleError.toString());
        }
    }

    // Add bigger, bolder, black body text
    $.writeln("   • Creating bold black body text");
    try {
        var bodyTextLayer = comp.layers.addText("Message will appear in the conversation immediately and cannot be unsent.");
        bodyTextLayer.name = "Modal Body Text";
        var bodyTextProps = getProperty(bodyTextLayer, "ADBE Text Properties");
        if (bodyTextProps) {
            var bodyTextDoc = getProperty(bodyTextProps, "ADBE Text Document");
            if (bodyTextDoc) {
                var btd = bodyTextDoc.value;
                btd.fontSize = 16;  // Bigger
                btd.fillColor = [0.0, 0.0, 0.0];  // Pure black
                btd.font = "Arial-BoldMT";  // Bold font
                btd.justification = ParagraphJustification.CENTER_JUSTIFY;
                bodyTextDoc.setValue(btd);
                
                var bodyTransformProps = getTransformProperties(bodyTextLayer);
                if (bodyTransformProps && bodyTransformProps.position) {
                    bodyTransformProps.position.setValue([centerX, centerY + 35]);  // Adjust spacing for bigger text
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
    var airplaneLayer;
    
    try {
        // Try triangle arrow first
        airplaneLayer = comp.layers.addText("►");
        airplaneLayer.name = "Paper Airplane";
        
        var airplaneTextProps = getProperty(airplaneLayer, "ADBE Text Properties");
        if (airplaneTextProps) {
            var airplaneTextDoc = getProperty(airplaneTextProps, "ADBE Text Document");
            if (airplaneTextDoc) {
                var atd = airplaneTextDoc.value;
                atd.fontSize = 60;  // Make it bigger
                atd.fillColor = [0.2, 0.5, 1.0];  // Blue color for visibility
                atd.justification = ParagraphJustification.CENTER_JUSTIFY;
                atd.font = "Arial-BoldMT";  // Use a reliable font
                airplaneTextDoc.setValue(atd);
            }
        }
    } catch (textError) {
        $.writeln("   ⚠️ Triangle text failed, trying solid square: " + textError.toString());
        try {
            // Fallback to solid square
            airplaneLayer = comp.layers.addText("■");
            airplaneLayer.name = "Paper Airplane";
            
            var airplaneTextProps2 = getProperty(airplaneLayer, "ADBE Text Properties");
            if (airplaneTextProps2) {
                var airplaneTextDoc2 = getProperty(airplaneTextProps2, "ADBE Text Document");
                if (airplaneTextDoc2) {
                    var atd2 = airplaneTextDoc2.value;
                    atd2.fontSize = 40;
                    atd2.fillColor = [1.0, 0.3, 0.3];  // Red color for visibility
                    atd2.justification = ParagraphJustification.CENTER_JUSTIFY;
                    airplaneTextDoc2.setValue(atd2);
                }
            }
        } catch (fallbackError) {
            $.writeln("   ❌ Both text methods failed: " + fallbackError.toString());
            throw fallbackError;
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
            $.writeln("   ❌ Failed to get airplane transform properties after retry");
        }
    }

    // Move airplane to top layer so it's visible above everything
    airplaneLayer.moveToBeginning();
    $.writeln("   • Moved airplane to top layer for visibility");

    // MODAL FOLD ANIMATION
    $.writeln("   • Animating modal fold...");

    // All modal elements start visible, then animate out
    var modalElements = [modalLayer, titleLayer, subtitleLayer, bodyTextLayer, cancelBtnLayer, sendBtnLayer, cancelTextLayer, sendTextLayer];
    
    for (var j = 0; j < modalElements.length; j++) {
        var element = modalElements[j];
        if (!element) continue;

        $.writeln("   • Processing " + element.name + "...");
        
        var transformProps = getTransformProperties(element);
        if (!transformProps) {
            $.writeln("     ⚠️ No transform properties found on " + element.name);
            continue;
        }

        // Get element's current position for center animation
        var currentPos = [centerX, centerY]; // Default to center
        if (transformProps.position) {
            try {
                currentPos = transformProps.position.value;
            } catch (posError) {
                $.writeln("     ⚠️ Could not get current position for " + element.name);
            }
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
            if (transformProps.position) {
                transformProps.position.setValueAtTime(animStartTime, currentPos);
            }

            // Fast initial animation (first 40% of duration)
            var fastEndTime = animStartTime + foldDuration * 0.4;
            // Slower final animation (remaining 60%)
            var foldEndTime = animStartTime + foldDuration;
            
            // Text elements fade away quickly
            if (element.name.indexOf("Text") !== -1 || element.name.indexOf("Modal") === 0) {
                if (transformProps.opacity) {
                    transformProps.opacity.setValueAtTime(fastEndTime, 0); // Text disappears fast
                }
                if (transformProps.scale) {
                    transformProps.scale.setValueAtTime(fastEndTime, [80, 80]);
                    transformProps.scale.setValueAtTime(foldEndTime, [20, 20]);
                }
            }
            // Buttons animate toward center with two-phase easing
            else if (element.name.indexOf("Button") !== -1) {
                if (transformProps.opacity) {
                    transformProps.opacity.setValueAtTime(fastEndTime, 60); // Fade gradually
                    transformProps.opacity.setValueAtTime(foldEndTime, 0); // Final disappearance
                }
                if (transformProps.scale) {
                    transformProps.scale.setValueAtTime(fastEndTime, [40, 40]); // Fast shrink to 40%
                    transformProps.scale.setValueAtTime(foldEndTime, [5, 5]); // Slow shrink to 5%
                }
                if (transformProps.position) {
                    // Animate toward center of modal
                    var centerX_modal = centerX;
                    var centerY_modal = centerY;
                    transformProps.position.setValueAtTime(fastEndTime, [
                        currentPos[0] + (centerX_modal - currentPos[0]) * 0.8, // 80% toward center fast
                        currentPos[1] + (centerY_modal - currentPos[1]) * 0.8
                    ]);
                    transformProps.position.setValueAtTime(foldEndTime, [centerX_modal, centerY_modal]); // Final center position
                }
            }
            // Other elements (modal background, etc.)
            else {
                if (transformProps.opacity) {
                    transformProps.opacity.setValueAtTime(foldEndTime, 10); // Very faint
                    transformProps.opacity.setValueAtTime(flyStartTime, 0); // Final disappearance
                }
                if (transformProps.scale) {
                    transformProps.scale.setValueAtTime(foldEndTime, [30, 5]); // Flatten vertically, shrink horizontally
                    transformProps.scale.setValueAtTime(flyStartTime, [5, 1]);
                }
            }
            
            if (transformProps.rotation) {
                transformProps.rotation.setValueAtTime(foldEndTime, 10 + (j * 3)); // Each element rotates slightly differently
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

    // Check if we have the essential properties (rotation is optional)
    if (airplaneTransformProps && 
        airplaneTransformProps.opacity && 
        airplaneTransformProps.position && 
        airplaneTransformProps.scale) {
        
        try {
            // Airplane appears when modal finishes folding
            airplaneTransformProps.opacity.setValueAtTime(flyStartTime - 0.1, 0);
            airplaneTransformProps.opacity.setValueAtTime(flyStartTime, 100);
            airplaneTransformProps.scale.setValueAtTime(flyStartTime, [80, 80]); // Start bigger so it's more visible
            airplaneTransformProps.position.setValueAtTime(flyStartTime, [centerX, centerY]);
            
            $.writeln("   • Airplane will appear at time " + flyStartTime + "s at position [" + centerX + ", " + centerY + "]");
            $.writeln("   • Airplane layer index: " + airplaneLayer.index);
            $.writeln("   • Airplane layer enabled: " + airplaneLayer.enabled);
            
            // Add rotation if available
            if (airplaneTransformProps.rotation) {
                airplaneTransformProps.rotation.setValueAtTime(flyStartTime, -45); // Point toward exit
            }

            // Airplane flies away (curved path)
            var flyEndTime = flyStartTime + flyDuration;
            var exitX = comp.width + 200; // Off screen right
            var exitY = centerY - 300;    // Upward trajectory

            // Curved flight path using multiple keyframes
            airplaneTransformProps.position.setValueAtTime(flyStartTime, [centerX, centerY]);
            airplaneTransformProps.position.setValueAtTime(flyStartTime + flyDuration * 0.3, [centerX + 200, centerY - 100]); // Arc up
            airplaneTransformProps.position.setValueAtTime(flyStartTime + flyDuration * 0.7, [centerX + 400, centerY - 200]); // Continue arc
            airplaneTransformProps.position.setValueAtTime(flyEndTime, [exitX, exitY]); // Exit off-screen

            // Add some rotation during flight for realism (if rotation is available)
            if (airplaneTransformProps.rotation) {
                airplaneTransformProps.rotation.setValueAtTime(flyStartTime, -45);
                airplaneTransformProps.rotation.setValueAtTime(flyStartTime + flyDuration * 0.5, -30); // Level out slightly
                airplaneTransformProps.rotation.setValueAtTime(flyEndTime, -20);
            }

            // Scale up slightly as it "flies away" (perspective effect)
            airplaneTransformProps.scale.setValueAtTime(flyStartTime, [80, 80]);
            airplaneTransformProps.scale.setValueAtTime(flyStartTime + flyDuration * 0.3, [100, 100]);
            airplaneTransformProps.scale.setValueAtTime(flyEndTime, [60, 60]); // Shrink as it gets distant

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
                    var propName = property.name || "unknown";
                    for (var k = 1; k <= property.numKeys; k++) {
                        var keyTime = property.keyTime(k);
                        if (keyTime >= startTime && keyTime <= endTime) {
                            try {
                                property.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);
                                
                                // Determine number of ease objects needed based on property value type
                                var easeIn, easeOut;
                                var propType = property.propertyValueType;
                                
                                // Check what the current ease looks like to determine dimensions
                                var currentEase = property.keyInTemporalEase(k);
                                var numDimensions = currentEase.length;
                                
                                if (numDimensions === 1) {
                                    // 1D properties (like opacity, rotation) need 1 ease object
                                    easeIn = [new KeyframeEase(0.5, 75)];
                                    easeOut = [new KeyframeEase(0.5, 75)];
                                } else if (numDimensions === 2) {
                                    // 2D properties need 2 ease objects
                                    easeIn = [new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75)];
                                    easeOut = [new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75)];
                                } else if (numDimensions === 3) {
                                    // 3D properties need 3 ease objects  
                                    easeIn = [new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75)];
                                    easeOut = [new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75)];
                                } else {
                                    $.writeln("   ⚠️ Unexpected dimension count for " + propName + ": " + numDimensions);
                                    continue;
                                }
                                
                                property.setTemporalEaseAtKey(k, easeIn, easeOut);
                            } catch (keyEaseError) {
                                $.writeln("   ⚠️ Could not set ease for " + propName + " key " + k + ": " + keyEaseError.toString());
                            }
                        }
                    }
                } catch (easeError) {
                    $.writeln("Could not add easing to property: " + easeError.toString());
                }
            }

            // Apply easing to airplane animation
            addEaseToProperty(airplaneTransformProps.position, flyStartTime, flyEndTime);
            if (airplaneTransformProps.rotation) {
                addEaseToProperty(airplaneTransformProps.rotation, flyStartTime, flyEndTime);
            }
            addEaseToProperty(airplaneTransformProps.scale, flyStartTime, flyEndTime);

            $.writeln("   ✅ Smooth easing applied");

            // Add custom easing to modal elements for smoother animation
            $.writeln("   • Adding custom ease to modal elements...");
            for (var m = 0; m < modalElements.length; m++) {
                var modalElement = modalElements[m];
                if (!modalElement) continue;
                
                var modalTransformProps = getTransformProperties(modalElement);
                if (modalTransformProps) {
                    // Custom easing function for fast-then-slow animation
                    function addCustomEaseToProperty(property, startTime, endTime, isButton) {
                        if (!property || property.numKeys === 0) return;
                        
                        try {
                            for (var k = 1; k <= property.numKeys; k++) {
                                var keyTime = property.keyTime(k);
                                if (keyTime >= startTime && keyTime <= endTime) {
                                    property.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);
                                    
                                    // Check dimensions
                                    var currentEase = property.keyInTemporalEase(k);
                                    var numDimensions = currentEase.length;
                                    
                                    var easeIn, easeOut;
                                    if (isButton && keyTime < startTime + (endTime - startTime) * 0.4) {
                                        // Fast ease for first 40% (buttons moving to center)
                                        if (numDimensions === 1) {
                                            easeIn = [new KeyframeEase(0.8, 90)];  // Fast in
                                            easeOut = [new KeyframeEase(0.2, 30)]; // Slow out
                                        } else if (numDimensions === 2) {
                                            easeIn = [new KeyframeEase(0.8, 90), new KeyframeEase(0.8, 90)];
                                            easeOut = [new KeyframeEase(0.2, 30), new KeyframeEase(0.2, 30)];
                                        } else {
                                            easeIn = [new KeyframeEase(0.8, 90), new KeyframeEase(0.8, 90), new KeyframeEase(0.8, 90)];
                                            easeOut = [new KeyframeEase(0.2, 30), new KeyframeEase(0.2, 30), new KeyframeEase(0.2, 30)];
                                        }
                                    } else {
                                        // Smooth ease for final phase
                                        if (numDimensions === 1) {
                                            easeIn = [new KeyframeEase(0.3, 60)];
                                            easeOut = [new KeyframeEase(0.7, 80)];
                                        } else if (numDimensions === 2) {
                                            easeIn = [new KeyframeEase(0.3, 60), new KeyframeEase(0.3, 60)];
                                            easeOut = [new KeyframeEase(0.7, 80), new KeyframeEase(0.7, 80)];
                                        } else {
                                            easeIn = [new KeyframeEase(0.3, 60), new KeyframeEase(0.3, 60), new KeyframeEase(0.3, 60)];
                                            easeOut = [new KeyframeEase(0.7, 80), new KeyframeEase(0.7, 80), new KeyframeEase(0.7, 80)];
                                        }
                                    }
                                    
                                    property.setTemporalEaseAtKey(k, easeIn, easeOut);
                                }
                            }
                        } catch (customEaseError) {
                            $.writeln("   ⚠️ Custom ease failed for " + (property.name || "unknown") + ": " + customEaseError.toString());
                        }
                    }
                    
                    var isButton = modalElement.name.indexOf("Button") !== -1;
                    if (modalTransformProps.position) {
                        addCustomEaseToProperty(modalTransformProps.position, animStartTime, flyStartTime, isButton);
                    }
                    if (modalTransformProps.scale) {
                        addCustomEaseToProperty(modalTransformProps.scale, animStartTime, flyStartTime, isButton);
                    }
                    if (modalTransformProps.opacity) {
                        addCustomEaseToProperty(modalTransformProps.opacity, animStartTime, flyStartTime, false);
                    }
                }
            }
            $.writeln("   ✅ Custom easing applied to modal elements");

        } catch (airplaneError) {
            $.writeln("❗ Airplane animation failed: " + airplaneError.toString());
            // Don't throw error - continue with modal animation only
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

    // Set composition time to see the airplane appear
    comp.time = flyStartTime + 0.5; // Set time to middle of airplane flight
    $.writeln("   • Set composition time to " + (flyStartTime + 0.5) + "s to show airplane");
    
    $.writeln("✅ Apple-style modal animation created successfully!");
    
    // Check if airplane animation was successful (rotation is optional)
    var airplaneSuccess = airplaneTransformProps && 
                         airplaneTransformProps.opacity && 
                         airplaneTransformProps.position && 
                         airplaneTransformProps.scale;
    
    if (airplaneSuccess) {
        var rotationNote = airplaneTransformProps.rotation ? "" : "\n• Note: Airplane flies without rotation due to text layer limitations";
        alert(
            "iMessage Modal Animation Created! 📱✈️\n\n" +
            "Timeline:\n" +
            "• 2.0s: Send button click\n" +
            "• 2.2s: Modal starts folding with custom easing\n" +
            "• 3.2s: Paper airplane appears and flies away\n" +
            "• 4.7s: Animation complete\n\n" +
            "Features:\n" +
            "• iMessage-style text and messaging\n" +
            "• Text fades away quickly\n" +
            "• Buttons animate toward center\n" +
            "• Fast-then-slow easing curves\n" +
            "• Professional two-phase animation\n" +
            "• Paper airplane flight with curved path" +
            rotationNote
        );
    } else {
        alert(
            "iMessage Modal Animation Created! 📱\n\n" +
            "Timeline:\n" +
            "• 2.0s: Send button click\n" +
            "• 2.2s: Modal starts folding with custom easing\n" +
            "• 3.2s: Modal fold complete\n\n" +
            "Features:\n" +
            "• iMessage-style text and messaging\n" +
            "• Text fades away quickly\n" +
            "• Buttons animate toward center\n" +
            "• Fast-then-slow easing curves\n" +
            "• Professional two-phase animation\n\n" +
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