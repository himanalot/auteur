/**
 * Animation Tools for AI Integration
 * Comprehensive keyframing, expressions, and motion control
 */

var ANIMATION_TOOLS = {
    "animate_layer": {
        description: "Create keyframe animations on layer properties",
        parameters: {
            property: "string", // "position", "scale", "rotation", "opacity", "anchorPoint"
            startValue: "array", // starting value
            endValue: "array", // ending value
            startTime: "number", // start time in seconds
            endTime: "number", // end time in seconds
            easing: "string", // "linear", "easeIn", "easeOut", "easeInOut", "custom"
            easingInfluence: "number", // 0-100, influence for ease handles
            hold: "boolean", // create hold keyframe
            roving: "boolean", // roving keyframes for spatial properties
            continuous: "boolean", // continuous bezier
            autoBezier: "boolean", // auto bezier
            layer_name: "string",
            layer_index: "number",
            layer_type: "string",
            target_newest: "boolean",
            target_all: "boolean",
            auto_select: "boolean"
        },
        execute: function(params) {
            // Debug: Log received parameters
            $.writeln("🔍 animate_layer received params: " + JSON.stringify(params));
            
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            // -----------------------------------------------------------------
            // INTELLIGENT TARGETING
            // -----------------------------------------------------------------
            var targetLayers = [];

            // Helper – add unique layer
            function addLayerUnique(l) {
                if (l && targetLayers.indexOf(l) === -1) targetLayers.push(l);
            }

            // layer_name (exact match)
            if (params.layer_name) {
                for (var ln = 1; ln <= activeItem.numLayers; ln++) {
                    var lyr = activeItem.layer(ln);
                    if (lyr.name === params.layer_name) {
                        addLayerUnique(lyr);
                        break;
                    }
                }
            }

            // layer_index (1-based)
            if (params.layer_index !== undefined) {
                var idx = parseInt(params.layer_index, 10);
                if (!isNaN(idx) && idx >= 1 && idx <= activeItem.numLayers) {
                    addLayerUnique(activeItem.layer(idx));
                }
            }

            // layer_type (shape, text, null, solid, camera, light)
            if (params.layer_type) {
                var lt = params.layer_type.toLowerCase();
                for (var ltIdx = 1; ltIdx <= activeItem.numLayers; ltIdx++) {
                    var ltr = activeItem.layer(ltIdx);
                    var matches = (lt === "shape" && ltr instanceof ShapeLayer) ||
                                   (lt === "text" && ltr instanceof TextLayer) ||
                                   (lt === "null" && ltr.nullLayer) ||
                                   (lt === "solid" && ltr instanceof AVLayer && ltr.source && ltr.source.mainSource instanceof SolidSource) ||
                                   (lt === "camera" && ltr instanceof CameraLayer) ||
                                   (lt === "light" && ltr instanceof LightLayer);
                    if (matches) addLayerUnique(ltr);
                }
            }

            // target_newest (topmost layer)
            if (params.target_newest) {
                addLayerUnique(activeItem.layer(1)); // AE ordering: 1 is top
            }

            // target_all
            if (params.target_all) {
                for (var alIdx = 1; alIdx <= activeItem.numLayers; alIdx++) {
                    addLayerUnique(activeItem.layer(alIdx));
                }
            }

            // auto_select: if nothing gathered yet, fall back to selected or single layer
            if (targetLayers.length === 0) {
                if (params.auto_select && activeItem.numLayers === 1) {
                    addLayerUnique(activeItem.layer(1));
                } else if (activeItem.selectedLayers.length > 0) {
                    for (var s = 0; s < activeItem.selectedLayers.length; s++) {
                        addLayerUnique(activeItem.selectedLayers[s]);
                    }
                }
            }

            if (targetLayers.length === 0) {
                // Debug info about available layers
                var availableLayers = [];
                for (var debugIdx = 1; debugIdx <= activeItem.numLayers; debugIdx++) {
                    var debugLayer = activeItem.layer(debugIdx);
                    availableLayers.push({
                        index: debugIdx,
                        name: debugLayer.name,
                        type: debugLayer instanceof ShapeLayer ? "shape" : 
                              debugLayer instanceof TextLayer ? "text" : 
                              debugLayer.nullLayer ? "null" : "other",
                        enabled: debugLayer.enabled,
                        locked: debugLayer.locked
                    });
                }
                return { 
                    success: false, 
                    message: "No layers targeted for animation! Please specify: target_newest: true, auto_select: true, layer_name: 'LayerName', or layer_index: 1. Available layers: " + JSON.stringify(availableLayers)
                };
            }

            // Ensure layers are selected for visual feedback / downstream tools
            for (var selIdx = 0; selIdx < targetLayers.length; selIdx++) {
                targetLayers[selIdx].selected = true;
            }

            try {
                app.beginUndoGroup("AI: Animate Layer");
                
                var animatedCount = 0;
                var propertyName = params.property || "position";
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                var endTime = params.endTime !== undefined ? params.endTime : startTime + 2;
                var easing = params.easing || "easeInOut";
                
                for (var i = 0; i < targetLayers.length; i++) {
                    var layer = targetLayers[i];
                    var property = this.getLayerProperty(layer, propertyName);
                    
                    if (!property) {
                        $.writeln("⚠️ Property '" + propertyName + "' not found on layer '" + layer.name + "'");
                        continue;
                    }
                    
                    $.writeln("✅ Found property '" + propertyName + "' on layer '" + layer.name + "'");
                    
                    // Set start keyframe
                    property.setValueAtTime(startTime, params.startValue || property.value);
                    
                    // Set end keyframe
                    property.setValueAtTime(endTime, params.endValue || property.value);
                    
                    // Apply easing
                    this.applyEasing(property, startTime, endTime, easing, params.easingInfluence);
                    
                    // Apply additional keyframe settings
                    if (params.hold) {
                        this.setKeyframeInterpolation(property, startTime, KeyframeInterpolationType.HOLD);
                    }
                    
                    if (params.roving && property.isSpatial) {
                        this.setKeyframeRoving(property, startTime, true);
                        this.setKeyframeRoving(property, endTime, true);
                    }
                    
                    if (params.continuous && property.isSpatial) {
                        this.setKeyframeContinuous(property, startTime, true);
                        this.setKeyframeContinuous(property, endTime, true);
                    }
                    
                    if (params.autoBezier) {
                        this.setKeyframeAutoBezier(property, startTime, true);
                        this.setKeyframeAutoBezier(property, endTime, true);
                    }
                    
                    animatedCount++;
                }
                
                app.endUndoGroup();
                
                // Return failure if no layers were actually animated
                if (animatedCount === 0) {
                    return {
                        success: false,
                        message: "No layers were animated! Property '" + propertyName + "' may not exist or layers were not properly targeted.",
                        data: { 
                            layersAnimated: animatedCount, 
                            property: propertyName,
                            duration: endTime - startTime,
                            easing: easing
                        }
                    };
                }
                
                return {
                    success: true,
                    message: "Animated " + propertyName + " on " + animatedCount + " layers from " + startTime.toFixed(2) + "s to " + endTime.toFixed(2) + "s",
                    data: { 
                        layersAnimated: animatedCount, 
                        property: propertyName,
                        duration: endTime - startTime,
                        easing: easing
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error animating layers: " + error.toString() };
            }
        },
        
        getLayerProperty: function(layer, propertyName) {
            if (!layer.transform) return null;
            
            switch (propertyName.toLowerCase()) {
                case "position": return layer.transform.position;
                case "scale": return layer.transform.scale;
                case "rotation": return layer.transform.rotation;
                case "opacity": return layer.transform.opacity;
                case "anchorpoint": return layer.transform.anchorPoint;
                case "xrotation": return layer.transform.xRotation;
                case "yrotation": return layer.transform.yRotation;
                case "zrotation": return layer.transform.zRotation;
                case "orientation": return layer.transform.orientation;
                default: 
                    // Try to find custom property
                    try {
                        return layer.property(propertyName);
                    } catch (e) {
                        return null;
                    }
            }
        },
        
        applyEasing: function(property, startTime, endTime, easing, influence) {
            var startKeyIndex = property.nearestKeyIndex(startTime);
            var endKeyIndex = property.nearestKeyIndex(endTime);
            
            if (startKeyIndex === 0 || endKeyIndex === 0) return;
            
            var influenceValue = influence || 75;
            
            switch (easing.toLowerCase()) {
                case "linear":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.LINEAR);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.LINEAR);
                    break;
                    
                case "easein":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setTemporalEaseAtKey(startKeyIndex, [
                        new KeyframeEase(0, influenceValue),
                        new KeyframeEase(0, influenceValue)
                    ], [
                        new KeyframeEase(1, influenceValue),
                        new KeyframeEase(1, influenceValue)
                    ]);
                    break;
                    
                case "easeout":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setTemporalEaseAtKey(endKeyIndex, [
                        new KeyframeEase(1, influenceValue),
                        new KeyframeEase(1, influenceValue)
                    ], [
                        new KeyframeEase(0, influenceValue),
                        new KeyframeEase(0, influenceValue)
                    ]);
                    break;
                    
                case "easeinout":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setTemporalEaseAtKey(startKeyIndex, [
                        new KeyframeEase(0, influenceValue),
                        new KeyframeEase(0, influenceValue)
                    ], [
                        new KeyframeEase(1, influenceValue),
                        new KeyframeEase(1, influenceValue)
                    ]);
                    property.setTemporalEaseAtKey(endKeyIndex, [
                        new KeyframeEase(1, influenceValue),
                        new KeyframeEase(1, influenceValue)
                    ], [
                        new KeyframeEase(0, influenceValue),
                        new KeyframeEase(0, influenceValue)
                    ]);
                    break;
            }
        },
        
        setKeyframeInterpolation: function(property, time, interpolationType) {
            var keyIndex = property.nearestKeyIndex(time);
            if (keyIndex > 0) {
                property.setInterpolationTypeAtKey(keyIndex, interpolationType);
            }
        },
        
        setKeyframeRoving: function(property, time, roving) {
            var keyIndex = property.nearestKeyIndex(time);
            if (keyIndex > 0 && property.isSpatial) {
                property.setRovingAtKey(keyIndex, roving);
            }
        },
        
        setKeyframeContinuous: function(property, time, continuous) {
            var keyIndex = property.nearestKeyIndex(time);
            if (keyIndex > 0 && property.isSpatial) {
                property.setContinuousAtKey(keyIndex, continuous);
            }
        },
        
        setKeyframeAutoBezier: function(property, time, autoBezier) {
            var keyIndex = property.nearestKeyIndex(time);
            if (keyIndex > 0) {
                property.setAutoBezierAtKey(keyIndex, autoBezier);
            }
        }
    },

    "add_expression": {
        description: "Add expressions to layer properties",
        parameters: {
            property: "string", // property name
            expression: "string", // expression code
            preset: "string" // preset expression name
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected" };
            }

            try {
                app.beginUndoGroup("AI: Add Expression");
                
                var expressionAdded = 0;
                var propertyName = params.property || "position";
                var expression = params.expression;
                
                // Use preset expression if specified
                if (params.preset) {
                    expression = this.getPresetExpression(params.preset);
                }
                
                if (!expression) {
                    app.endUndoGroup();
                    return { success: false, message: "No expression provided" };
                }
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    var property = this.getLayerProperty(layer, propertyName);
                    
                    if (property && property.canSetExpression) {
                        property.expression = expression;
                        expressionAdded++;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Added expression to " + propertyName + " on " + expressionAdded + " layers",
                    data: { 
                        layersModified: expressionAdded,
                        property: propertyName,
                        expression: expression.substring(0, 50) + "..."
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error adding expression: " + error.toString() };
            }
        },
        
        getLayerProperty: function(layer, propertyName) {
            // Same as animate_layer's getLayerProperty
            if (!layer.transform) return null;
            
            switch (propertyName.toLowerCase()) {
                case "position": return layer.transform.position;
                case "scale": return layer.transform.scale;
                case "rotation": return layer.transform.rotation;
                case "opacity": return layer.transform.opacity;
                case "anchorpoint": return layer.transform.anchorPoint;
                default: 
                    try {
                        return layer.property(propertyName);
                    } catch (e) {
                        return null;
                    }
            }
        },
        
        getPresetExpression: function(presetName) {
            var presets = {
                "wiggle": "wiggle(2, 50)",
                "bounce": "amp = 0.1;\nfreq = 2.0;\ndecay = 2.0;\nn = 0;\nif (numKeys > 0){\nn = nearestKey(time).index;\nif (key(n).time > time){\nn--;\n}\n}\nif (n == 0){\nt = 0;\n}else{\nt = time - key(n).time;\n}\nif (n > 0){\nv = velocityAtTime(key(n).time - thisComp.frameDuration/10);\nvalue + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\n}else{\nvalue\n}",
                "loop": "loopOut()",
                "loop_in": "loopIn()",
                "loop_pingpong": "loopOut('pingpong')",
                "time": "time",
                "index": "index",
                "random": "random(100)",
                "smooth": "smooth()",
                "inertia": "smooth(width, samples, t)",
                "overshoot": "// Overshoot\namp = .1; //amount of overshoot\nfreq = 2; //speed of overshoot\nif(numKeys > 0){\nn = nearestKey(time).index;\nif(key(n).time > time) n--;\nif(n > 0){\nt = time - key(n).time;\nvalue + (value - key(n).value)*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(t);\n}else value\n}else value",
                "pendulum": "freq = 1;\namp = 45;\nMath.sin(time * freq) * amp",
                "scale_bounce": "s = [100,100];\nif(numKeys > 0){\nn = nearestKey(time).index;\nif(key(n).time > time){\nn--;\n}\n}\nif(n == 0){\nt = 0;\n} else {\nt = time - key(n).time;\n}\nif(n > 0 && t < 1){\nv = velocityAtTime(key(n).time - thisComp.frameDuration/10);\namp = .05;\nfreq = 4.0;\ndecay = 8.0;\ns + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\n} else {\ns\n}"
            };
            return presets[presetName.toLowerCase()];
        }
    },

    "create_motion_path": {
        description: "Create motion path animation from a mask or bezier path",
        parameters: {
            pathLayer: "string", // layer name containing the path
            pathProperty: "string", // "mask1", "mask2", etc. or shape path
            duration: "number", // animation duration in seconds
            startTime: "number", // start time
            autoOrient: "boolean", // auto-orient along path
            reverse: "boolean", // reverse direction
            firstVertex: "number", // starting vertex (0-1)
            lastVertex: "number" // ending vertex (0-1)
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected for motion path" };
            }

            try {
                app.beginUndoGroup("AI: Create Motion Path");
                
                var pathLayer = null;
                var pathProperty = null;
                
                // Find path layer
                if (params.pathLayer) {
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        var layer = activeItem.layer(i);
                        if (layer.name === params.pathLayer) {
                            pathLayer = layer;
                            break;
                        }
                    }
                } else {
                    // Use first selected layer as path source
                    pathLayer = selectedLayers[0];
                }
                
                if (!pathLayer) {
                    app.endUndoGroup();
                    return { success: false, message: "Path layer not found" };
                }
                
                // Find path property
                var pathPropName = params.pathProperty || "Mask 1";
                try {
                    if (pathPropName.toLowerCase().indexOf("mask") === 0) {
                        var maskNum = parseInt(pathPropName.replace(/\D/g, "")) || 1;
                        pathProperty = pathLayer.mask(maskNum).maskPath;
                    } else {
                        pathProperty = pathLayer.property(pathPropName);
                    }
                } catch (e) {
                    app.endUndoGroup();
                    return { success: false, message: "Path property not found: " + pathPropName };
                }
                
                if (!pathProperty) {
                    app.endUndoGroup();
                    return { success: false, message: "Invalid path property" };
                }
                
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                var duration = params.duration || 3;
                var endTime = startTime + duration;
                var pathsCreated = 0;
                
                // Apply motion path to selected layers
                for (var j = 0; j < selectedLayers.length; j++) {
                    var layer = selectedLayers[j];
                    if (layer === pathLayer) continue; // Skip the path layer itself
                    
                    if (!layer.transform || !layer.transform.position) continue;
                    
                    // Create expression for motion path
                    var expression = "pathLayer = thisComp.layer(\"" + pathLayer.name + "\");" +
                                   "pathProp = pathLayer.mask(\"" + pathPropName + "\").maskPath;" +
                                   "duration = " + duration + ";" +
                                   "startTime = " + startTime + ";" +
                                   "progress = (time - startTime) / duration;" +
                                   "if (progress < 0) progress = 0;" +
                                   "if (progress > 1) progress = 1;";
                    
                    if (params.reverse) {
                        expression += "progress = 1 - progress;";
                    }
                    
                    if (params.firstVertex !== undefined || params.lastVertex !== undefined) {
                        var first = params.firstVertex || 0;
                        var last = params.lastVertex || 1;
                        expression += "progress = " + first + " + progress * (" + last + " - " + first + ");";
                    }
                    
                    expression += "pathProp.pointOnPath(progress, time);";
                    
                    layer.transform.position.expression = expression;
                    
                    // Auto-orient if requested
                    if (params.autoOrient && layer.transform.rotation) {
                        var orientExpression = "pathLayer = thisComp.layer(\"" + pathLayer.name + "\");" +
                                             "pathProp = pathLayer.mask(\"" + pathPropName + "\").maskPath;" +
                                             "duration = " + duration + ";" +
                                             "startTime = " + startTime + ";" +
                                             "progress = (time - startTime) / duration;" +
                                             "if (progress < 0) progress = 0;" +
                                             "if (progress > 1) progress = 1;";
                        
                        if (params.reverse) {
                            orientExpression += "progress = 1 - progress;";
                        }
                        
                        orientExpression += "pathProp.tangentOnPath(progress, time);" +
                                          "radiansToDegrees(Math.atan2(tan[1], tan[0]));";
                        
                        layer.transform.rotation.expression = orientExpression;
                    }
                    
                    pathsCreated++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created motion path animation on " + pathsCreated + " layers using " + pathLayer.name,
                    data: { 
                        layersAnimated: pathsCreated,
                        pathLayer: pathLayer.name,
                        duration: duration,
                        autoOrient: params.autoOrient
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating motion path: " + error.toString() };
            }
        }
    },

    "sequence_layers": {
        description: "Sequence selected layers in time with optional overlap",
        parameters: {
            duration: "number", // duration per layer
            overlap: "number", // overlap time in seconds
            startTime: "number", // starting time
            reverse: "boolean", // reverse order
            crossFade: "boolean", // add opacity crossfades
            fadeTime: "number" // crossfade duration
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected for sequencing" };
            }

            try {
                app.beginUndoGroup("AI: Sequence Layers");
                
                var duration = params.duration || 2;
                var overlap = params.overlap || 0;
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                var fadeTime = params.fadeTime || 0.5;
                var sequencedCount = 0;
                
                // Sort layers by current position or reverse if requested
                var layersToSequence = selectedLayers.slice();
                if (params.reverse) {
                    layersToSequence.reverse();
                }
                
                var currentTime = startTime;
                
                for (var i = 0; i < layersToSequence.length; i++) {
                    var layer = layersToSequence[i];
                    
                    // Set layer timing
                    layer.startTime = currentTime;
                    layer.outPoint = currentTime + duration;
                    
                    // Add crossfade if requested
                    if (params.crossFade && layer.transform && layer.transform.opacity) {
                        // Fade in
                        layer.transform.opacity.setValueAtTime(currentTime, 0);
                        layer.transform.opacity.setValueAtTime(currentTime + fadeTime, 100);
                        
                        // Fade out
                        layer.transform.opacity.setValueAtTime(currentTime + duration - fadeTime, 100);
                        layer.transform.opacity.setValueAtTime(currentTime + duration, 0);
                        
                        // Apply ease
                        var fadeInKey = layer.transform.opacity.nearestKeyIndex(currentTime + fadeTime);
                        var fadeOutKey = layer.transform.opacity.nearestKeyIndex(currentTime + duration - fadeTime);
                        
                        if (fadeInKey > 0) {
                            layer.transform.opacity.setInterpolationTypeAtKey(fadeInKey, KeyframeInterpolationType.BEZIER);
                        }
                        if (fadeOutKey > 0) {
                            layer.transform.opacity.setInterpolationTypeAtKey(fadeOutKey, KeyframeInterpolationType.BEZIER);
                        }
                    }
                    
                    currentTime += duration - overlap;
                    sequencedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Sequenced " + sequencedCount + " layers with " + duration + "s duration" + 
                            (overlap > 0 ? " and " + overlap + "s overlap" : ""),
                    data: { 
                        layersSequenced: sequencedCount,
                        duration: duration,
                        overlap: overlap,
                        totalDuration: currentTime - startTime + overlap,
                        crossFade: params.crossFade
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error sequencing layers: " + error.toString() };
            }
        }
    },

    "create_camera_movement": {
        description: "Create camera movement animations",
        parameters: {
            movementType: "string", // "dolly", "pan", "tilt", "orbit", "zoom"
            intensity: "number", // movement intensity (1-10)
            duration: "number", // animation duration
            startTime: "number", // start time
            target: "string", // target layer name for orbit/focus
            smooth: "boolean" // smooth movement
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Create Camera Movement");
                
                // Find or create camera
                var camera = null;
                for (var i = 1; i <= activeItem.numLayers; i++) {
                    var layer = activeItem.layer(i);
                    if (layer instanceof CameraLayer) {
                        camera = layer;
                        break;
                    }
                }
                
                if (!camera) {
                    camera = activeItem.layers.addCamera("AI Camera", [activeItem.width/2, activeItem.height/2]);
                }
                
                var movementType = params.movementType || "dolly";
                var intensity = params.intensity || 5;
                var duration = params.duration || 3;
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                var endTime = startTime + duration;
                
                var movements = {
                    "dolly": function() {
                        var startPos = camera.transform.position.value;
                        var endPos = [startPos[0], startPos[1], startPos[2] - (intensity * 50)];
                        camera.transform.position.setValueAtTime(startTime, startPos);
                        camera.transform.position.setValueAtTime(endTime, endPos);
                    },
                    
                    "pan": function() {
                        var startPos = camera.transform.position.value;
                        var endPos = [startPos[0] + (intensity * 20), startPos[1], startPos[2]];
                        camera.transform.position.setValueAtTime(startTime, startPos);
                        camera.transform.position.setValueAtTime(endTime, endPos);
                    },
                    
                    "tilt": function() {
                        var startPos = camera.transform.position.value;
                        var endPos = [startPos[0], startPos[1] + (intensity * 20), startPos[2]];
                        camera.transform.position.setValueAtTime(startTime, startPos);
                        camera.transform.position.setValueAtTime(endTime, endPos);
                    },
                    
                    "zoom": function() {
                        if (camera.zoom) {
                            var startZoom = camera.zoom.value;
                            var endZoom = startZoom + (intensity * 10);
                            camera.zoom.setValueAtTime(startTime, startZoom);
                            camera.zoom.setValueAtTime(endTime, endZoom);
                        }
                    },
                    
                    "orbit": function() {
                        var centerPoint = [activeItem.width/2, activeItem.height/2, 0];
                        var radius = intensity * 50;
                        
                        camera.transform.position.expression = 
                            "centerPoint = [" + centerPoint.join(",") + "];" +
                            "radius = " + radius + ";" +
                            "angle = ((time - " + startTime + ") / " + duration + ") * 2 * Math.PI;" +
                            "x = centerPoint[0] + Math.cos(angle) * radius;" +
                            "z = centerPoint[2] + Math.sin(angle) * radius;" +
                            "[x, centerPoint[1], z];";
                    }
                };
                
                if (movements[movementType]) {
                    movements[movementType]();
                    
                    // Apply smooth easing if requested
                    if (params.smooth) {
                        this.applySmoothEasing(camera.transform.position, startTime, endTime);
                        if (camera.zoom && movementType === "zoom") {
                            this.applySmoothEasing(camera.zoom, startTime, endTime);
                        }
                    }
                } else {
                    app.endUndoGroup();
                    return { success: false, message: "Unknown camera movement type: " + movementType };
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created " + movementType + " camera movement with intensity " + intensity,
                    data: { 
                        cameraName: camera.name,
                        movementType: movementType,
                        intensity: intensity,
                        duration: duration
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating camera movement: " + error.toString() };
            }
        },
        
        applySmoothEasing: function(property, startTime, endTime) {
            var startKeyIndex = property.nearestKeyIndex(startTime);
            var endKeyIndex = property.nearestKeyIndex(endTime);
            
            if (startKeyIndex > 0 && endKeyIndex > 0) {
                property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.BEZIER);
                property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                
                property.setTemporalEaseAtKey(startKeyIndex, [
                    new KeyframeEase(0, 75),
                    new KeyframeEase(0, 75)
                ], [
                    new KeyframeEase(1, 75),
                    new KeyframeEase(1, 75)
                ]);
                
                property.setTemporalEaseAtKey(endKeyIndex, [
                    new KeyframeEase(1, 75),
                    new KeyframeEase(1, 75)
                ], [
                    new KeyframeEase(0, 75),
                    new KeyframeEase(0, 75)
                ]);
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = ANIMATION_TOOLS;
} 