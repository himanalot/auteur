/**
 * Text Tools for AI Integration
 * Comprehensive text layer creation and modification
 */

var TEXT_TOOLS = {
    "create_text_layer": {
        description: "Create text layers with full formatting options",
        parameters: {
            text: "string", // text content
            fontFamily: "string", // font name
            fontSize: "number", // font size in pixels
            fontStyle: "string", // "Regular", "Bold", "Italic", "Bold Italic"
            fillColor: "array", // [r, g, b] values 0-1
            strokeColor: "array", // stroke color
            strokeWidth: "number", // stroke width
            position: "array", // [x, y] position
            justification: "string", // "left", "center", "right", "full"
            leading: "number", // line spacing
            tracking: "number", // character spacing
            baseline: "number", // baseline shift
            allCaps: "boolean",
            smallCaps: "boolean",
            superscript: "boolean",
            subscript: "boolean",
            fauxBold: "boolean",
            fauxItalic: "boolean"
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Create Text Layer");
                
                var textContent = params.text || "Sample Text";
                var textLayer = activeItem.layers.addText(textContent);
                
                var textProp = textLayer.property("Source Text");
                var textDocument = textProp.value;
                
                // Font properties
                if (params.fontFamily) {
                    textDocument.font = params.fontFamily;
                }
                
                if (params.fontSize) {
                    textDocument.fontSize = params.fontSize;
                } else {
                    textDocument.fontSize = 72; // Default size
                }
                
                if (params.fontStyle) {
                    textDocument.fontStyle = params.fontStyle;
                }
                
                // Colors
                if (params.fillColor) {
                    textDocument.fillColor = params.fillColor;
                    textDocument.applyFill = true;
                } else {
                    textDocument.fillColor = [1, 1, 1]; // Default white
                    textDocument.applyFill = true;
                }
                
                if (params.strokeColor && params.strokeWidth) {
                    textDocument.strokeColor = params.strokeColor;
                    textDocument.strokeWidth = params.strokeWidth;
                    textDocument.applyStroke = true;
                }
                
                // Justification
                if (params.justification) {
                    switch (params.justification.toLowerCase()) {
                        case "left":
                            textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;
                            break;
                        case "center":
                            textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
                            break;
                        case "right":
                            textDocument.justification = ParagraphJustification.RIGHT_JUSTIFY;
                            break;
                        case "full":
                            textDocument.justification = ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT;
                            break;
                    }
                }
                
                // Spacing
                if (params.leading) {
                    textDocument.leading = params.leading;
                }
                
                if (params.tracking) {
                    textDocument.tracking = params.tracking;
                }
                
                if (params.baseline) {
                    textDocument.baselineShift = params.baseline;
                }
                
                // Character formatting
                if (params.allCaps) {
                    textDocument.allCaps = params.allCaps;
                }
                
                if (params.smallCaps) {
                    textDocument.smallCaps = params.smallCaps;
                }
                
                if (params.superscript) {
                    textDocument.superscript = params.superscript;
                }
                
                if (params.subscript) {
                    textDocument.subscript = params.subscript;
                }
                
                if (params.fauxBold) {
                    textDocument.fauxBold = params.fauxBold;
                }
                
                if (params.fauxItalic) {
                    textDocument.fauxItalic = params.fauxItalic;
                }
                
                // Apply the text document
                textProp.setValue(textDocument);
                
                // Set position
                if (params.position && textLayer.transform && textLayer.transform.position) {
                    textLayer.transform.position.setValue(params.position);
                } else {
                    // Center by default
                    textLayer.transform.position.setValue([activeItem.width/2, activeItem.height/2]);
                }
                
                textLayer.name = "AI Text: " + (textContent.length > 20 ? textContent.substring(0, 20) + "..." : textContent);
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created text layer: " + textLayer.name,
                    data: { 
                        layerName: textLayer.name,
                        layerId: textLayer.index,
                        text: textContent,
                        fontSize: params.fontSize || 72
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating text layer: " + error.toString() };
            }
        }
    },

    "modify_text_content": {
        description: "Modify text content and properties of selected text layers",
        parameters: {
            newText: "string", // new text content
            fontSize: "number",
            fontFamily: "string",
            fillColor: "array",
            append: "boolean", // append to existing text
            prepend: "boolean" // prepend to existing text
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
                app.beginUndoGroup("AI: Modify Text Content");
                
                var modifiedCount = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    var textProp = layer.property("Source Text");
                    var textDocument = textProp.value;
                    
                    // Modify text content
                    if (params.newText !== undefined) {
                        if (params.append) {
                            textDocument.text = textDocument.text + params.newText;
                        } else if (params.prepend) {
                            textDocument.text = params.newText + textDocument.text;
                        } else {
                            textDocument.text = params.newText;
                        }
                    }
                    
                    // Modify properties
                    if (params.fontSize) {
                        textDocument.fontSize = params.fontSize;
                    }
                    
                    if (params.fontFamily) {
                        textDocument.font = params.fontFamily;
                    }
                    
                    if (params.fillColor) {
                        textDocument.fillColor = params.fillColor;
                        textDocument.applyFill = true;
                    }
                    
                    textProp.setValue(textDocument);
                    modifiedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Modified " + modifiedCount + " text layers",
                    data: { layersModified: modifiedCount }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error modifying text: " + error.toString() };
            }
        }
    },

    "animate_text_typewriter": {
        description: "Create typewriter effect on text layers",
        parameters: {
            duration: "number", // animation duration in seconds
            startTime: "number", // start time
            charactersPerSecond: "number", // typing speed
            randomize: "boolean", // randomize character appearance
            includeSpaces: "boolean" // include spaces in character count
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No text layers selected" };
            }

            try {
                app.beginUndoGroup("AI: Animate Text Typewriter");
                
                var animatedCount = 0;
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    var textProp = layer.property("Source Text");
                    var originalText = textProp.value.text;
                    var charCount = params.includeSpaces ? originalText.length : originalText.replace(/\s/g, "").length;
                    
                    var duration = params.duration || (charCount / (params.charactersPerSecond || 10));
                    var endTime = startTime + duration;
                    
                    // Create typewriter expression
                    var expression = "text = \"" + originalText.replace(/"/g, "\\\"") + "\";" +
                                   "startTime = " + startTime + ";" +
                                   "duration = " + duration + ";" +
                                   "if (time < startTime) {" +
                                   "  \"\";" +
                                   "} else if (time >= startTime + duration) {" +
                                   "  text;" +
                                   "} else {" +
                                   "  progress = (time - startTime) / duration;" +
                                   "  charCount = Math.floor(progress * text.length);";
                    
                    if (params.randomize) {
                        expression += "  seedRandom(1, true);" +
                                    "  result = \"\";" +
                                    "  for (i = 0; i < charCount; i++) {" +
                                    "    if (random() < 0.8) {" +
                                    "      result += text.charAt(i);" +
                                    "    } else {" +
                                    "      result += String.fromCharCode(Math.floor(random() * 26) + 65);" +
                                    "    }" +
                                    "  }" +
                                    "  result;";
                    } else {
                        expression += "  text.substr(0, charCount);";
                    }
                    
                    expression += "}";
                    
                    textProp.expression = expression;
                    animatedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Applied typewriter effect to " + animatedCount + " text layers",
                    data: { 
                        layersAnimated: animatedCount,
                        duration: params.duration,
                        startTime: startTime
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating typewriter effect: " + error.toString() };
            }
        }
    },

    "animate_text_scale_in": {
        description: "Animate text scaling in character by character",
        parameters: {
            duration: "number", // total animation duration
            startTime: "number", // start time
            overlap: "number", // overlap between characters (0-1)
            scaleFrom: "number", // starting scale percentage
            scaleTo: "number", // ending scale percentage
            randomizeOrder: "boolean" // randomize character animation order
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No text layers selected" };
            }

            try {
                app.beginUndoGroup("AI: Animate Text Scale In");
                
                var animatedCount = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    // Add Text Animator
                    var animator = layer.property("Text").property("Animators").addProperty("ADBE Text Animator");
                    animator.name = "AI Scale In";
                    
                    // Add Range Selector
                    var rangeSelector = animator.property("Selectors").addProperty("ADBE Text Selector");
                    
                    // Configure range selector
                    var start = rangeSelector.property("Start");
                    var end = rangeSelector.property("End");
                    var offset = rangeSelector.property("Offset");
                    
                    var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                    var duration = params.duration || 2;
                    var endTime = startTime + duration;
                    
                    // Animate range selector
                    end.setValueAtTime(startTime, 0);
                    end.setValueAtTime(endTime, 100);
                    
                    // Add scale property
                    var scaleProperty = animator.property("Properties").addProperty("ADBE Text Scale");
                    scaleProperty.setValue([params.scaleFrom || 0, params.scaleFrom || 0]);
                    
                    // Set up for scale animation
                    var scaleAnimator = scaleProperty.property("Scale");
                    scaleAnimator.setValue([params.scaleFrom || 0, params.scaleFrom || 0]);
                    
                    // Configure overlap
                    if (params.overlap) {
                        var overlap = Math.max(0, Math.min(100, params.overlap * 100));
                        rangeSelector.property("Advanced").property("Overlap").setValue(overlap);
                    }
                    
                    // Randomize order if requested
                    if (params.randomizeOrder) {
                        rangeSelector.property("Advanced").property("Random Order").setValue(true);
                        rangeSelector.property("Advanced").property("Random Seed").setValue(Math.floor(Math.random() * 1000));
                    }
                    
                    // Apply easing
                    var endKeyIndex = end.nearestKeyIndex(endTime);
                    if (endKeyIndex > 0) {
                        end.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                        end.setTemporalEaseAtKey(endKeyIndex, [
                            new KeyframeEase(1, 75),
                            new KeyframeEase(1, 75)
                        ], [
                            new KeyframeEase(0, 75),
                            new KeyframeEase(0, 75)
                        ]);
                    }
                    
                    animatedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Applied scale-in animation to " + animatedCount + " text layers",
                    data: { 
                        layersAnimated: animatedCount,
                        duration: params.duration || 2
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating scale-in animation: " + error.toString() };
            }
        }
    },

    "create_text_path": {
        description: "Create text along a path from a mask or shape",
        parameters: {
            pathLayer: "string", // layer containing the path
            pathProperty: "string", // mask or shape path property
            text: "string", // text content
            fontSize: "number",
            fontFamily: "string",
            fillColor: "array",
            reverse: "boolean", // reverse text direction
            perpendicular: "boolean", // perpendicular to path
            forceAlignment: "boolean" // force alignment to path
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Create Text Path");
                
                var pathLayer = null;
                
                // Find path layer
                if (params.pathLayer) {
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        var layer = activeItem.layer(i);
                        if (layer.name === params.pathLayer) {
                            pathLayer = layer;
                            break;
                        }
                    }
                }
                
                if (!pathLayer) {
                    app.endUndoGroup();
                    return { success: false, message: "Path layer not found: " + (params.pathLayer || "none specified") };
                }
                
                // Create text layer
                var textContent = params.text || "Text on Path";
                var textLayer = activeItem.layers.addText(textContent);
                
                // Configure text properties
                var textProp = textLayer.property("Source Text");
                var textDocument = textProp.value;
                
                if (params.fontSize) {
                    textDocument.fontSize = params.fontSize;
                }
                
                if (params.fontFamily) {
                    textDocument.font = params.fontFamily;
                }
                
                if (params.fillColor) {
                    textDocument.fillColor = params.fillColor;
                    textDocument.applyFill = true;
                }
                
                textProp.setValue(textDocument);
                
                // Add Path Text effect
                var pathTextEffect = textLayer.Effects.addProperty("ADBE Path Text");
                
                // Link to path
                var pathProperty = pathTextEffect.property("Path");
                var pathPropName = params.pathProperty || "Mask 1";
                
                if (pathPropName.toLowerCase().indexOf("mask") === 0) {
                    var maskNum = parseInt(pathPropName.replace(/\D/g, "")) || 1;
                    try {
                        pathProperty.setValue(pathLayer.mask(maskNum).maskPath);
                    } catch (e) {
                        app.endUndoGroup();
                        return { success: false, message: "Mask not found: " + pathPropName };
                    }
                } else {
                    // Try to link to shape path
                    try {
                        var shapePath = pathLayer.property("Contents").property(pathPropName);
                        pathProperty.setValue(shapePath);
                    } catch (e) {
                        app.endUndoGroup();
                        return { success: false, message: "Shape path not found: " + pathPropName };
                    }
                }
                
                // Configure path options
                if (params.reverse) {
                    pathTextEffect.property("Reverse Path").setValue(true);
                }
                
                if (params.perpendicular) {
                    pathTextEffect.property("Perpendicular To Path").setValue(true);
                }
                
                if (params.forceAlignment) {
                    pathTextEffect.property("Force Alignment").setValue(true);
                }
                
                textLayer.name = "AI Path Text: " + (textContent.length > 15 ? textContent.substring(0, 15) + "..." : textContent);
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created path text: " + textLayer.name,
                    data: { 
                        layerName: textLayer.name,
                        pathLayer: pathLayer.name,
                        text: textContent
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating path text: " + error.toString() };
            }
        }
    },

    "create_text_counter": {
        description: "Create animated number counter",
        parameters: {
            startValue: "number", // starting number
            endValue: "number", // ending number
            duration: "number", // animation duration
            startTime: "number", // start time
            decimalPlaces: "number", // number of decimal places
            prefix: "string", // text before number
            suffix: "string", // text after number
            fontSize: "number",
            fontFamily: "string",
            fillColor: "array",
            position: "array" // [x, y] position
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Create Text Counter");
                
                var startValue = params.startValue || 0;
                var endValue = params.endValue || 100;
                var duration = params.duration || 3;
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                var decimalPlaces = params.decimalPlaces || 0;
                var prefix = params.prefix || "";
                var suffix = params.suffix || "";
                
                // Create text layer
                var textLayer = activeItem.layers.addText(prefix + startValue.toFixed(decimalPlaces) + suffix);
                
                // Configure text properties
                var textProp = textLayer.property("Source Text");
                var textDocument = textProp.value;
                
                if (params.fontSize) {
                    textDocument.fontSize = params.fontSize;
                } else {
                    textDocument.fontSize = 72;
                }
                
                if (params.fontFamily) {
                    textDocument.font = params.fontFamily;
                }
                
                if (params.fillColor) {
                    textDocument.fillColor = params.fillColor;
                    textDocument.applyFill = true;
                } else {
                    textDocument.fillColor = [1, 1, 1];
                    textDocument.applyFill = true;
                }
                
                textProp.setValue(textDocument);
                
                // Create counter expression
                var expression = "startTime = " + startTime + ";" +
                               "duration = " + duration + ";" +
                               "startValue = " + startValue + ";" +
                               "endValue = " + endValue + ";" +
                               "prefix = \"" + prefix + "\";" +
                               "suffix = \"" + suffix + "\";" +
                               "decimalPlaces = " + decimalPlaces + ";" +
                               "" +
                               "if (time < startTime) {" +
                               "  currentValue = startValue;" +
                               "} else if (time >= startTime + duration) {" +
                               "  currentValue = endValue;" +
                               "} else {" +
                               "  progress = (time - startTime) / duration;" +
                               "  progress = ease(progress, progress, progress);" + // ease out
                               "  currentValue = startValue + (endValue - startValue) * progress;" +
                               "}" +
                               "" +
                               "prefix + currentValue.toFixed(decimalPlaces) + suffix;";
                
                textProp.expression = expression;
                
                // Set position
                if (params.position && textLayer.transform && textLayer.transform.position) {
                    textLayer.transform.position.setValue(params.position);
                } else {
                    textLayer.transform.position.setValue([activeItem.width/2, activeItem.height/2]);
                }
                
                textLayer.name = "AI Counter: " + startValue + " to " + endValue;
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created counter from " + startValue + " to " + endValue,
                    data: { 
                        layerName: textLayer.name,
                        startValue: startValue,
                        endValue: endValue,
                        duration: duration
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating counter: " + error.toString() };
            }
        }
    }
};

// Additional comprehensive text tools based on Adobe After Effects expressions API
var ADVANCED_TEXT_TOOLS = {
    "set_text_opacity": {
        description: "Set opacity for text layers with optional animation",
        parameters: {
            opacity: "number", // 0-100 opacity percentage
            animateToOpacity: "boolean", // animate to this opacity
            duration: "number", // animation duration in seconds
            startTime: "number", // animation start time
            easeType: "string" // "linear", "easeIn", "easeOut", "easeInOut"
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No text layers selected" };
            }

            try {
                app.beginUndoGroup("AI: Set Text Opacity");
                
                var modifiedCount = 0;
                var opacity = Math.max(0, Math.min(100, params.opacity || 100));
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    var opacityProp = layer.transform.opacity;
                    
                    if (params.animateToOpacity && params.duration) {
                        var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                        var currentOpacity = opacityProp.valueAtTime(startTime, false);
                        
                        opacityProp.setValueAtTime(startTime, currentOpacity);
                        opacityProp.setValueAtTime(startTime + params.duration, opacity);
                        
                        // Apply easing
                        if (params.easeType && opacityProp.numKeys >= 2) {
                            var lastKey = opacityProp.numKeys;
                            switch (params.easeType) {
                                case "easeIn":
                                    opacityProp.setTemporalEaseAtKey(lastKey, 
                                        [new KeyframeEase(0, 75)], 
                                        [new KeyframeEase(1, 75)]
                                    );
                                    break;
                                case "easeOut":
                                    opacityProp.setTemporalEaseAtKey(lastKey, 
                                        [new KeyframeEase(1, 75)], 
                                        [new KeyframeEase(0, 75)]
                                    );
                                    break;
                                case "easeInOut":
                                    opacityProp.setTemporalEaseAtKey(lastKey, 
                                        [new KeyframeEase(0.5, 75)], 
                                        [new KeyframeEase(0.5, 75)]
                                    );
                                    break;
                            }
                        }
                    } else {
                        opacityProp.setValue(opacity);
                    }
                    
                    modifiedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Set opacity to " + opacity + "% for " + modifiedCount + " text layers",
                    data: { 
                        layersModified: modifiedCount,
                        opacity: opacity,
                        animated: params.animateToOpacity || false
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error setting text opacity: " + error.toString() };
            }
        }
    },

    "set_text_position": {
        description: "Set position for text layers with optional animation",
        parameters: {
            position: "array", // [x, y] coordinates
            animateToPosition: "boolean", // animate to this position
            duration: "number", // animation duration
            startTime: "number", // animation start time
            easeType: "string", // easing type
            anchorPoint: "string" // "center", "topLeft", "topRight", "bottomLeft", "bottomRight"
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No text layers selected" };
            }

            if (!params.position || params.position.length < 2) {
                return { success: false, message: "Position array [x, y] required" };
            }

            try {
                app.beginUndoGroup("AI: Set Text Position");
                
                var modifiedCount = 0;
                var targetPosition = [params.position[0], params.position[1]];
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    // Adjust position based on anchor point
                    var adjustedPosition = targetPosition;
                    if (params.anchorPoint) {
                        var sourceRect = layer.sourceRectAtTime(activeItem.time, false);
                        switch (params.anchorPoint.toLowerCase()) {
                            case "topleft":
                                adjustedPosition = [targetPosition[0] - sourceRect.left, targetPosition[1] - sourceRect.top];
                                break;
                            case "topright":
                                adjustedPosition = [targetPosition[0] - sourceRect.left - sourceRect.width, targetPosition[1] - sourceRect.top];
                                break;
                            case "bottomleft":
                                adjustedPosition = [targetPosition[0] - sourceRect.left, targetPosition[1] - sourceRect.top - sourceRect.height];
                                break;
                            case "bottomright":
                                adjustedPosition = [targetPosition[0] - sourceRect.left - sourceRect.width, targetPosition[1] - sourceRect.top - sourceRect.height];
                                break;
                            case "center":
                            default:
                                adjustedPosition = [targetPosition[0] - sourceRect.left - sourceRect.width/2, targetPosition[1] - sourceRect.top - sourceRect.height/2];
                                break;
                        }
                    }
                    
                    var positionProp = layer.transform.position;
                    
                    if (params.animateToPosition && params.duration) {
                        var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                        var currentPosition = positionProp.valueAtTime(startTime, false);
                        
                        positionProp.setValueAtTime(startTime, currentPosition);
                        positionProp.setValueAtTime(startTime + params.duration, adjustedPosition);
                        
                        // Apply easing
                        if (params.easeType && positionProp.numKeys >= 2) {
                            var lastKey = positionProp.numKeys;
                            switch (params.easeType) {
                                case "easeIn":
                                    positionProp.setTemporalEaseAtKey(lastKey, 
                                        [new KeyframeEase(0, 75), new KeyframeEase(0, 75)], 
                                        [new KeyframeEase(1, 75), new KeyframeEase(1, 75)]
                                    );
                                    break;
                                case "easeOut":
                                    positionProp.setTemporalEaseAtKey(lastKey, 
                                        [new KeyframeEase(1, 75), new KeyframeEase(1, 75)], 
                                        [new KeyframeEase(0, 75), new KeyframeEase(0, 75)]
                                    );
                                    break;
                                case "easeInOut":
                                    positionProp.setTemporalEaseAtKey(lastKey, 
                                        [new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75)], 
                                        [new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75)]
                                    );
                                    break;
                            }
                        }
                    } else {
                        positionProp.setValue(adjustedPosition);
                    }
                    
                    modifiedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Set position for " + modifiedCount + " text layers",
                    data: { 
                        layersModified: modifiedCount,
                        position: targetPosition,
                        animated: params.animateToPosition || false
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error setting text position: " + error.toString() };
            }
        }
    },

    "set_text_alignment": {
        description: "Set text alignment and paragraph properties",
        parameters: {
            alignment: "string", // "left", "center", "right", "justify"
            verticalAlignment: "string", // "top", "center", "bottom"
            leading: "number", // line spacing
            tracking: "number", // character spacing
            autoLeading: "boolean", // enable auto leading
            paragraphSpacing: "number" // space between paragraphs
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No text layers selected" };
            }

            try {
                app.beginUndoGroup("AI: Set Text Alignment");
                
                var modifiedCount = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    var textProp = layer.property("Source Text");
                    var textDocument = textProp.value;
                    
                    // Set horizontal alignment
                    if (params.alignment) {
                        switch (params.alignment.toLowerCase()) {
                            case "left":
                                textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;
                                break;
                            case "center":
                                textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
                                break;
                            case "right":
                                textDocument.justification = ParagraphJustification.RIGHT_JUSTIFY;
                                break;
                            case "justify":
                                textDocument.justification = ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT;
                                break;
                        }
                    }
                    
                    // Set spacing properties
                    if (params.leading !== undefined) {
                        textDocument.leading = params.leading;
                        textDocument.autoLeading = false;
                    }
                    
                    if (params.autoLeading) {
                        textDocument.autoLeading = true;
                    }
                    
                    if (params.tracking !== undefined) {
                        textDocument.tracking = params.tracking;
                    }
                    
                    textProp.setValue(textDocument);
                    
                    // Handle vertical alignment by adjusting anchor point
                    if (params.verticalAlignment) {
                        var anchorPoint = layer.transform.anchorPoint;
                        var sourceRect = layer.sourceRectAtTime(activeItem.time, false);
                        
                        switch (params.verticalAlignment.toLowerCase()) {
                            case "top":
                                anchorPoint.setValue([sourceRect.left + sourceRect.width/2, sourceRect.top]);
                                break;
                            case "center":
                                anchorPoint.setValue([sourceRect.left + sourceRect.width/2, sourceRect.top + sourceRect.height/2]);
                                break;
                            case "bottom":
                                anchorPoint.setValue([sourceRect.left + sourceRect.width/2, sourceRect.top + sourceRect.height]);
                                break;
                        }
                    }
                    
                    modifiedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Set alignment for " + modifiedCount + " text layers",
                    data: { 
                        layersModified: modifiedCount,
                        alignment: params.alignment,
                        verticalAlignment: params.verticalAlignment
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error setting text alignment: " + error.toString() };
            }
        }
    },

    "set_text_style": {
        description: "Set advanced text styling properties using expressions API",
        parameters: {
            fontFamily: "string", // font name
            fontSize: "number", // font size
            fontStyle: "string", // "Regular", "Bold", "Italic", "Bold Italic"
            fillColor: "array", // [r, g, b] fill color (0-1)
            strokeColor: "array", // [r, g, b] stroke color (0-1)
            strokeWidth: "number", // stroke width
            applyFill: "boolean", // enable fill
            applyStroke: "boolean", // enable stroke
            allCaps: "boolean", // all capitals
            smallCaps: "boolean", // small capitals
            superscript: "boolean", // superscript
            subscript: "boolean", // subscript
            fauxBold: "boolean", // faux bold
            fauxItalic: "boolean", // faux italic
            baselineShift: "number", // baseline shift amount
            characterRange: "array" // [start, end] character range to apply to (optional)
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No text layers selected" };
            }

            try {
                app.beginUndoGroup("AI: Set Text Style");
                
                var modifiedCount = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    var textProp = layer.property("Source Text");
                    var textDocument = textProp.value;
                    
                    // Apply character range if specified
                    var startChar = params.characterRange ? params.characterRange[0] : 0;
                    var endChar = params.characterRange ? params.characterRange[1] : textDocument.text.length;
                    
                    // Font properties
                    if (params.fontFamily) {
                        if (params.characterRange) {
                            textDocument = textDocument.setFont(params.fontFamily, startChar, endChar);
                        } else {
                            textDocument.font = params.fontFamily;
                        }
                    }
                    
                    if (params.fontSize) {
                        if (params.characterRange) {
                            textDocument = textDocument.setFontSize(params.fontSize, startChar, endChar);
                        } else {
                            textDocument.fontSize = params.fontSize;
                        }
                    }
                    
                    if (params.fontStyle) {
                        textDocument.fontStyle = params.fontStyle;
                    }
                    
                    // Colors and stroke
                    if (params.fillColor) {
                        if (params.characterRange) {
                            textDocument = textDocument.setFillColor(params.fillColor, startChar, endChar);
                        } else {
                            textDocument.fillColor = params.fillColor;
                        }
                    }
                    
                    if (params.applyFill !== undefined) {
                        if (params.characterRange) {
                            textDocument = textDocument.setApplyFill(params.applyFill, startChar, endChar);
                        } else {
                            textDocument.applyFill = params.applyFill;
                        }
                    }
                    
                    if (params.strokeColor) {
                        if (params.characterRange) {
                            textDocument = textDocument.setStrokeColor(params.strokeColor, startChar, endChar);
                        } else {
                            textDocument.strokeColor = params.strokeColor;
                        }
                    }
                    
                    if (params.strokeWidth !== undefined) {
                        if (params.characterRange) {
                            textDocument = textDocument.setStrokeWidth(params.strokeWidth, startChar, endChar);
                        } else {
                            textDocument.strokeWidth = params.strokeWidth;
                        }
                    }
                    
                    if (params.applyStroke !== undefined) {
                        if (params.characterRange) {
                            textDocument = textDocument.setApplyStroke(params.applyStroke, startChar, endChar);
                        } else {
                            textDocument.applyStroke = params.applyStroke;
                        }
                    }
                    
                    // Character formatting
                    if (params.allCaps !== undefined) {
                        if (params.characterRange) {
                            textDocument = textDocument.setAllCaps(params.allCaps, startChar, endChar);
                        } else {
                            textDocument.allCaps = params.allCaps;
                        }
                    }
                    
                    if (params.smallCaps !== undefined) {
                        if (params.characterRange) {
                            textDocument = textDocument.setSmallCaps(params.smallCaps, startChar, endChar);
                        } else {
                            textDocument.smallCaps = params.smallCaps;
                        }
                    }
                    
                    if (params.fauxBold !== undefined) {
                        if (params.characterRange) {
                            textDocument = textDocument.setFauxBold(params.fauxBold, startChar, endChar);
                        } else {
                            textDocument.fauxBold = params.fauxBold;
                        }
                    }
                    
                    if (params.fauxItalic !== undefined) {
                        if (params.characterRange) {
                            textDocument = textDocument.setFauxItalic(params.fauxItalic, startChar, endChar);
                        } else {
                            textDocument.fauxItalic = params.fauxItalic;
                        }
                    }
                    
                    if (params.baselineShift !== undefined) {
                        if (params.characterRange) {
                            textDocument = textDocument.setBaselineShift(params.baselineShift, startChar, endChar);
                        } else {
                            textDocument.baselineShift = params.baselineShift;
                        }
                    }
                    
                    // Apply superscript/subscript
                    if (params.superscript !== undefined) {
                        textDocument.superscript = params.superscript;
                    }
                    
                    if (params.subscript !== undefined) {
                        textDocument.subscript = params.subscript;
                    }
                    
                    textProp.setValue(textDocument);
                    modifiedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Applied text styling to " + modifiedCount + " text layers",
                    data: { 
                        layersModified: modifiedCount,
                        characterRange: params.characterRange
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error setting text style: " + error.toString() };
            }
        }
    },

    "animate_text_properties": {
        description: "Animate text properties like scale, rotation, position with text animators",
        parameters: {
            property: "string", // "scale", "rotation", "position", "opacity", "tracking", "leading"
            startValue: "array", // starting value (array for multi-dimensional properties)
            endValue: "array", // ending value
            duration: "number", // animation duration
            startTime: "number", // animation start time
            animateBy: "string", // "character", "word", "line", "all"
            randomOrder: "boolean", // randomize animation order
            offset: "number", // offset between characters/words (0-100)
            easeType: "string" // easing type
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No text layers selected" };
            }

            try {
                app.beginUndoGroup("AI: Animate Text Properties");
                
                var animatedCount = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    // Add Text Animator
                    var animator = layer.property("Text").property("Animators").addProperty("ADBE Text Animator");
                    animator.name = "AI " + (params.property || "Property") + " Animation";
                    
                    // Add Range Selector
                    var rangeSelector = animator.property("Selectors").addProperty("ADBE Text Selector");
                    
                    // Configure range selector based on animate by
                    if (params.animateBy) {
                        var basedOn = rangeSelector.property("Advanced").property("Based On");
                        switch (params.animateBy.toLowerCase()) {
                            case "character":
                                basedOn.setValue(1); // Characters
                                break;
                            case "word":
                                basedOn.setValue(2); // Words
                                break;
                            case "line":
                                basedOn.setValue(3); // Lines
                                break;
                            case "all":
                            default:
                                basedOn.setValue(1); // Characters
                                break;
                        }
                    }
                    
                    // Set up range animation
                    var start = rangeSelector.property("Start");
                    var end = rangeSelector.property("End");
                    var offset = rangeSelector.property("Offset");
                    
                    var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                    var duration = params.duration || 2;
                    var endTime = startTime + duration;
                    
                    // Animate range selector
                    end.setValueAtTime(startTime, 0);
                    end.setValueAtTime(endTime, 100);
                    
                    // Set offset if specified
                    if (params.offset !== undefined) {
                        rangeSelector.property("Advanced").property("Offset").setValue(params.offset);
                    }
                    
                    // Randomize order if requested
                    if (params.randomOrder) {
                        rangeSelector.property("Advanced").property("Random Order").setValue(true);
                        rangeSelector.property("Advanced").property("Random Seed").setValue(Math.floor(Math.random() * 1000));
                    }
                    
                    // Add the appropriate property and set values
                    var animProperty;
                    switch ((params.property || "").toLowerCase()) {
                        case "scale":
                            animProperty = animator.property("Properties").addProperty("ADBE Text Scale");
                            var scaleValue = params.startValue || [0, 0];
                            animProperty.setValue(scaleValue);
                            break;
                            
                        case "rotation":
                            animProperty = animator.property("Properties").addProperty("ADBE Text Rotation");
                            var rotValue = params.startValue ? params.startValue[0] : 0;
                            animProperty.setValue(rotValue);
                            break;
                            
                        case "position":
                            animProperty = animator.property("Properties").addProperty("ADBE Text Position");
                            var posValue = params.startValue || [0, 0];
                            animProperty.setValue(posValue);
                            break;
                            
                        case "opacity":
                            animProperty = animator.property("Properties").addProperty("ADBE Text Opacity");
                            var opacityValue = params.startValue ? params.startValue[0] : 0;
                            animProperty.setValue(opacityValue);
                            break;
                            
                        case "tracking":
                            animProperty = animator.property("Properties").addProperty("ADBE Text Tracking Amount");
                            var trackingValue = params.startValue ? params.startValue[0] : 0;
                            animProperty.setValue(trackingValue);
                            break;
                            
                        default:
                            // Default to scale
                            animProperty = animator.property("Properties").addProperty("ADBE Text Scale");
                            animProperty.setValue(params.startValue || [0, 0]);
                            break;
                    }
                    
                    // Apply easing to range selector
                    if (params.easeType && end.numKeys >= 2) {
                        var lastKey = end.numKeys;
                        switch (params.easeType) {
                            case "easeIn":
                                end.setTemporalEaseAtKey(lastKey, 
                                    [new KeyframeEase(0, 75)], 
                                    [new KeyframeEase(1, 75)]
                                );
                                break;
                            case "easeOut":
                                end.setTemporalEaseAtKey(lastKey, 
                                    [new KeyframeEase(1, 75)], 
                                    [new KeyframeEase(0, 75)]
                                );
                                break;
                            case "easeInOut":
                                end.setTemporalEaseAtKey(lastKey, 
                                    [new KeyframeEase(0.5, 75)], 
                                    [new KeyframeEase(0.5, 75)]
                                );
                                break;
                        }
                    }
                    
                    animatedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Applied " + (params.property || "property") + " animation to " + animatedCount + " text layers",
                    data: { 
                        layersAnimated: animatedCount,
                        property: params.property,
                        duration: duration,
                        animateBy: params.animateBy
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error animating text properties: " + error.toString() };
            }
        }
    },

    "get_text_properties": {
        description: "Get detailed text properties and formatting information from selected text layers",
        parameters: {
            includeCharacterInfo: "boolean", // include per-character styling info
            includeAnimatorInfo: "boolean" // include text animator information
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No text layers selected" };
            }

            try {
                var textInfo = [];
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof TextLayer)) continue;
                    
                    var textProp = layer.property("Source Text");
                    var textDocument = textProp.value;
                    
                    var layerInfo = {
                        layerName: layer.name,
                        layerIndex: layer.index,
                        text: textDocument.text,
                        font: textDocument.font,
                        fontSize: textDocument.fontSize,
                        fontStyle: textDocument.fontStyle,
                        fillColor: textDocument.fillColor,
                        strokeColor: textDocument.strokeColor,
                        strokeWidth: textDocument.strokeWidth,
                        applyFill: textDocument.applyFill,
                        applyStroke: textDocument.applyStroke,
                        justification: textDocument.justification,
                        leading: textDocument.leading,
                        autoLeading: textDocument.autoLeading,
                        tracking: textDocument.tracking,
                        baselineShift: textDocument.baselineShift,
                        allCaps: textDocument.allCaps,
                        smallCaps: textDocument.smallCaps,
                        superscript: textDocument.superscript,
                        subscript: textDocument.subscript,
                        fauxBold: textDocument.fauxBold,
                        fauxItalic: textDocument.fauxItalic,
                        position: layer.transform.position.value,
                        anchorPoint: layer.transform.anchorPoint.value,
                        scale: layer.transform.scale.value,
                        rotation: layer.transform.rotation.value,
                        opacity: layer.transform.opacity.value
                    };
                    
                    // Get character-level styling if requested
                    if (params.includeCharacterInfo) {
                        layerInfo.characterStyles = [];
                        for (var c = 0; c < textDocument.text.length; c++) {
                            try {
                                var charStyle = textDocument.getStyleAt(c, activeItem.time);
                                layerInfo.characterStyles.push({
                                    character: textDocument.text.charAt(c),
                                    font: charStyle.font,
                                    fontSize: charStyle.fontSize,
                                    fillColor: charStyle.fillColor,
                                    strokeColor: charStyle.strokeColor
                                });
                            } catch (e) {
                                // Character styling not available
                            }
                        }
                    }
                    
                    // Get text animator information if requested
                    if (params.includeAnimatorInfo) {
                        layerInfo.animators = [];
                        try {
                            var textProperty = layer.property("Text");
                            var animators = textProperty.property("Animators");
                            for (var a = 1; a <= animators.numProperties; a++) {
                                var animator = animators.property(a);
                                layerInfo.animators.push({
                                    name: animator.name,
                                    enabled: animator.enabled,
                                    numProperties: animator.property("Properties").numProperties
                                });
                            }
                        } catch (e) {
                            // Animator info not available
                        }
                    }
                    
                    textInfo.push(layerInfo);
                }
                
                return {
                    success: true,
                    message: "Retrieved text properties for " + textInfo.length + " text layers",
                    data: { 
                        textLayers: textInfo,
                        totalLayers: textInfo.length
                    }
                };
            } catch (error) {
                return { success: false, message: "Error getting text properties: " + error.toString() };
            }
        }
    }
};

// Merge advanced tools with existing tools
for (var toolName in ADVANCED_TEXT_TOOLS) {
    TEXT_TOOLS[toolName] = ADVANCED_TEXT_TOOLS[toolName];
}

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = TEXT_TOOLS;
} 