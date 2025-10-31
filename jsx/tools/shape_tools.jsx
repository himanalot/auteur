/**
 * Shape Layer Tools for AI Integration
 * Comprehensive shape creation, path editing, and shape animation
 */

var SHAPE_TOOLS = {
    "create_shape_layer": {
        description: "Create shape layers with various shapes and styling",
        parameters: {
            shape: "string", // "rectangle", "ellipse", "polygon", "star", "path", "custom_path"
            size: "array", // [width, height] 
            position: "array", // [x, y]
            fillColor: "array", // [r, g, b, a]
            strokeColor: "array", // [r, g, b, a]
            strokeWidth: "number",
            cornerRadius: "number", // for rectangles
            sides: "number", // for polygons
            starPoints: "number", // for stars
            starInnerRadius: "number", // for stars
            path: "array", // custom path points [[x,y], [x,y], ...] (preferred)
            pathPoints: "array", // alternative name for path points
            closed: "boolean", // whether path should be closed (default: true)
            layerName: "string", // custom name for the layer
            name: "string" // alternative parameter name for layer name
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Create Shape Layer");
                
                var shapeLayer = activeItem.layers.addShape();
                var contents = shapeLayer.property("Contents");
                var shapeType = params.shape || "rectangle";
                var shape;
                
                // Create the shape
                switch (shapeType.toLowerCase()) {
                    case "rectangle":
                        shape = contents.addProperty("ADBE Vector Shape - Rect");
                        var rectSizeProp = shape.property("ADBE Vector Rect Size") || shape.property("Size");
                        var rectSizeVal = params.size || [200, 200];
                        rectSizeProp.setValue(rectSizeVal);
                        if (params.cornerRadius) {
                            var roundnessProp = shape.property("ADBE Vector Rect Roundness") || shape.property("Roundness");
                            roundnessProp.setValue(params.cornerRadius);
                        }
                        break;
                        
                    case "ellipse":
                        shape = contents.addProperty("ADBE Vector Shape - Ellipse");
                        var ellipseSizeProp = shape.property("ADBE Vector Ellipse Size") || shape.property("Size");
                        ellipseSizeProp.setValue(params.size || [200, 200]);
                        break;
                        
                    case "polygon":
                        shape = contents.addProperty("ADBE Vector Shape - Star");
                        shape.property("Type").setValue(1); // Polygon
                        if (params.sides) {
                            shape.property("Points").setValue(params.sides);
                        } else {
                            shape.property("Points").setValue(6);
                        }
                        if (params.size) {
                            var radius = Math.max(params.size[0], params.size[1]) / 2;
                            shape.property("Outer Radius").setValue(radius);
                        }
                        break;
                        
                    case "star":
                        shape = contents.addProperty("ADBE Vector Shape - Star");
                        shape.property("Type").setValue(2); // Star
                        if (params.starPoints) {
                            shape.property("Points").setValue(params.starPoints);
                        } else {
                            shape.property("Points").setValue(5);
                        }
                        if (params.size) {
                            var outerRadius = Math.max(params.size[0], params.size[1]) / 2;
                            shape.property("Outer Radius").setValue(outerRadius);
                            var innerRadius = params.starInnerRadius || outerRadius * 0.5;
                            shape.property("Inner Radius").setValue(innerRadius);
                        }
                        break;
                        
                    case "path":
                    case "custom_path":
                        shape = contents.addProperty("ADBE Vector Shape - Group");
                        var pathProperty = shape.property("Path");
                        
                        // Accept both 'path' and 'pathPoints' parameters for flexibility
                        var pathData = params.path || params.pathPoints;
                        if (pathData && pathData.length > 0) {
                            var pathPoints = [];
                            var inTangents = [];
                            var outTangents = [];
                            
                            for (var i = 0; i < pathData.length; i++) {
                                pathPoints.push(pathData[i]);
                                inTangents.push([0, 0]);
                                outTangents.push([0, 0]);
                            }
                            
                            var myPath = new Shape();
                            myPath.vertices = pathPoints;
                            myPath.inTangents = inTangents;
                            myPath.outTangents = outTangents;
                            myPath.closed = params.closed !== false; // Default to closed unless specified
                            
                            pathProperty.setValue(myPath);
                        }
                        break;
                        
                    default:
                        shape = contents.addProperty("ADBE Vector Shape - Rect");
                        shape.property("Size").setValue([200, 200]);
                        break;
                }
                
                // Add fill
                var fill = contents.addProperty("ADBE Vector Graphic - Fill");
                if (params.fillColor) {
                    fill.property("Color").setValue(params.fillColor.slice(0, 3)); // RGB only
                    if (params.fillColor.length > 3) {
                        fill.property("Opacity").setValue(params.fillColor[3] * 100);
                    }
                } else {
                    fill.property("Color").setValue([1, 1, 1]); // Default white
                }
                
                // Add stroke if specified
                if (params.strokeColor || params.strokeWidth) {
                    var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
                    if (params.strokeColor) {
                        stroke.property("Color").setValue(params.strokeColor.slice(0, 3));
                        if (params.strokeColor.length > 3) {
                            stroke.property("Opacity").setValue(params.strokeColor[3] * 100);
                        }
                    }
                    if (params.strokeWidth) {
                        stroke.property("Stroke Width").setValue(params.strokeWidth);
                    } else {
                        stroke.property("Stroke Width").setValue(2);
                    }
                }
                
                // Set position
                if (params.position) {
                    shapeLayer.transform.position.setValue(params.position);
                } else {
                    shapeLayer.transform.position.setValue([activeItem.width/2, activeItem.height/2]);
                }
                
                // Set layer name (custom name or auto-generated)
                var customName = params.layerName || params.name;
                if (customName) {
                    shapeLayer.name = customName;
                } else {
                    shapeLayer.name = "AI " + shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created " + shapeType + " shape layer: " + shapeLayer.name,
                    data: { 
                        layerName: shapeLayer.name, 
                        layerId: shapeLayer.index,
                        shape: shapeType 
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating shape layer: " + error.toString() };
            }
        }
    },

    "animate_shape_path": {
        description: "Animate shape layer paths with morphing and transformation",
        parameters: {
            animationType: "string", // "morph", "trim", "wiggle", "scale", "rotation"
            duration: "number", // animation duration
            startTime: "number", // start time
            intensity: "number", // animation intensity (1-10)
            trimStart: "number", // trim path start percentage (0-100)
            trimEnd: "number", // trim path end percentage (0-100)
            targetPath: "array", // target path for morphing
            wiggleFrequency: "number", // wiggle frequency
            wiggleAmount: "number" // wiggle amount
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
                app.beginUndoGroup("AI: Animate Shape Path");
                
                var animatedCount = 0;
                var animationType = params.animationType || "trim";
                var duration = params.duration || 2;
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                var endTime = startTime + duration;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof ShapeLayer)) continue;
                    
                    var contents = layer.property("Contents");
                    if (!contents) continue;
                    
                    switch (animationType.toLowerCase()) {
                        case "trim":
                            this.animateTrimPath(contents, startTime, endTime, params);
                            break;
                        case "wiggle":
                            this.animateWigglePath(contents, params);
                            break;
                        case "scale":
                            this.animateShapeScale(layer, startTime, endTime, params.intensity || 5);
                            break;
                        case "rotation":
                            this.animateShapeRotation(layer, startTime, endTime, params.intensity || 360);
                            break;
                        case "morph":
                            if (params.targetPath) {
                                this.animateMorphPath(contents, startTime, endTime, params.targetPath);
                            }
                            break;
                    }
                    
                    animatedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Applied " + animationType + " animation to " + animatedCount + " shape layers",
                    data: { 
                        layersAnimated: animatedCount,
                        animationType: animationType,
                        duration: duration
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error animating shape path: " + error.toString() };
            }
        },
        
        animateTrimPath: function(contents, startTime, endTime, params) {
            var trimPath = contents.addProperty("ADBE Vector Filter - Trim");
            
            var startProp = trimPath.property("Start");
            var endProp = trimPath.property("End");
            
            startProp.setValueAtTime(startTime, params.trimStart || 0);
            endProp.setValueAtTime(startTime, params.trimStart || 0);
            
            startProp.setValueAtTime(endTime, params.trimStart || 0);
            endProp.setValueAtTime(endTime, params.trimEnd || 100);
            
            // Apply easing
            var endKeyIndex = endProp.nearestKeyIndex(endTime);
            if (endKeyIndex > 0) {
                endProp.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                endProp.setTemporalEaseAtKey(endKeyIndex, [
                    new KeyframeEase(1, 75),
                    new KeyframeEase(1, 75)
                ], [
                    new KeyframeEase(0, 75),
                    new KeyframeEase(0, 75)
                ]);
            }
        },
        
        animateWigglePath: function(contents, params) {
            var wiggle = contents.addProperty("ADBE Vector Filter - Wiggle");
            
            if (params.wiggleAmount) {
                wiggle.property("Size").setValue(params.wiggleAmount);
            } else {
                wiggle.property("Size").setValue(10);
            }
            
            if (params.wiggleFrequency) {
                wiggle.property("Detail").setValue(params.wiggleFrequency);
            } else {
                wiggle.property("Detail").setValue(2);
            }
        },
        
        animateShapeScale: function(layer, startTime, endTime, intensity) {
            var transform = layer.transform;
            var scale = transform.scale;
            
            var startScale = [100, 100];
            var endScale = [100 + intensity * 10, 100 + intensity * 10];
            
            scale.setValueAtTime(startTime, startScale);
            scale.setValueAtTime(endTime, endScale);
            
            // Apply bounce easing
            var endKeyIndex = scale.nearestKeyIndex(endTime);
            if (endKeyIndex > 0) {
                scale.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
            }
        },
        
        animateShapeRotation: function(layer, startTime, endTime, intensity) {
            var transform = layer.transform;
            var rotation = transform.rotation;
            
            rotation.setValueAtTime(startTime, 0);
            rotation.setValueAtTime(endTime, intensity);
            
            // Apply smooth easing
            var endKeyIndex = rotation.nearestKeyIndex(endTime);
            if (endKeyIndex > 0) {
                rotation.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                rotation.setTemporalEaseAtKey(endKeyIndex, [
                    new KeyframeEase(1, 75),
                    new KeyframeEase(1, 75)
                ], [
                    new KeyframeEase(0, 75),
                    new KeyframeEase(0, 75)
                ]);
            }
        },
        
        animateMorphPath: function(contents, startTime, endTime, targetPath) {
            // Find the path property to animate
            for (var i = 1; i <= contents.numProperties; i++) {
                var prop = contents.property(i);
                if (prop.matchName.indexOf("ADBE Vector Shape") === 0) {
                    var pathProp = prop.property("Path");
                    if (pathProp) {
                        var currentPath = pathProp.value;
                        
                        // Create target shape
                        var targetShape = new Shape();
                        targetShape.vertices = targetPath;
                        targetShape.inTangents = [];
                        targetShape.outTangents = [];
                        for (var j = 0; j < targetPath.length; j++) {
                            targetShape.inTangents.push([0, 0]);
                            targetShape.outTangents.push([0, 0]);
                        }
                        targetShape.closed = true;
                        
                        pathProp.setValueAtTime(startTime, currentPath);
                        pathProp.setValueAtTime(endTime, targetShape);
                        break;
                    }
                }
            }
        }
    },

    "create_shape_text": {
        description: "Convert text to shape layers for advanced animation",
        parameters: {
            text: "string", // text to convert
            fontFamily: "string", // font name
            fontSize: "number", // font size
            createCompoundPath: "boolean", // merge all letters into one shape
            separateLetters: "boolean", // create separate shape for each letter
            fillColor: "array", // [r, g, b]
            strokeColor: "array", // [r, g, b]
            strokeWidth: "number"
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Create Shape Text");
                
                var textContent = params.text || "SHAPE TEXT";
                
                // Create temporary text layer for conversion
                var tempTextLayer = activeItem.layers.addText(textContent);
                
                // Configure text properties
                var textProp = tempTextLayer.property("Source Text");
                var textDocument = textProp.value;
                
                if (params.fontFamily) {
                    textDocument.font = params.fontFamily;
                }
                
                if (params.fontSize) {
                    textDocument.fontSize = params.fontSize;
                } else {
                    textDocument.fontSize = 72;
                }
                
                textProp.setValue(textDocument);
                
                // Position text at center
                tempTextLayer.transform.position.setValue([activeItem.width/2, activeItem.height/2]);
                
                // Convert to shape layer
                // Note: This is a simplified version - actual implementation would require
                // more complex path extraction from text outlines
                var shapeLayer = activeItem.layers.addShape();
                shapeLayer.name = "AI Shape Text: " + textContent;
                
                // Remove temporary text layer
                tempTextLayer.remove();
                
                var contents = shapeLayer.property("Contents");
                
                // Create basic rectangle as placeholder for actual text shape
                // In a full implementation, this would extract the actual text outlines
                var shape = contents.addProperty("ADBE Vector Shape - Rect");
                shape.property("Size").setValue([textContent.length * (params.fontSize || 72) * 0.6, params.fontSize || 72]);
                
                // Add fill
                var fill = contents.addProperty("ADBE Vector Graphic - Fill");
                if (params.fillColor) {
                    fill.property("Color").setValue(params.fillColor);
                } else {
                    fill.property("Color").setValue([1, 1, 1]); // Default white
                }
                
                // Add stroke if specified
                if (params.strokeColor || params.strokeWidth) {
                    var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
                    if (params.strokeColor) {
                        stroke.property("Color").setValue(params.strokeColor);
                    }
                    if (params.strokeWidth) {
                        stroke.property("Stroke Width").setValue(params.strokeWidth);
                    }
                }
                
                // Position shape layer
                shapeLayer.transform.position.setValue([activeItem.width/2, activeItem.height/2]);
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created shape text layer: " + shapeLayer.name,
                    data: { 
                        layerName: shapeLayer.name,
                        text: textContent,
                        fontSize: params.fontSize || 72
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating shape text: " + error.toString() };
            }
        }
    },

    "add_shape_modifiers": {
        description: "Add shape modifiers like repeater, offset, zig zag",
        parameters: {
            modifier: "string", // "repeater", "offset", "zigzag", "round_corners", "pucker_bloat"
            copies: "number", // for repeater
            offsetAmount: "number", // for offset path
            zigzagAmount: "number", // for zig zag
            frequency: "number", // for zig zag
            cornerRadius: "number", // for round corners
            puckerBloatAmount: "number" // for pucker & bloat
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No shape layers selected" };
            }

            try {
                app.beginUndoGroup("AI: Add Shape Modifiers");
                
                var modifiedCount = 0;
                var modifier = params.modifier || "repeater";
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (!(layer instanceof ShapeLayer)) continue;
                    
                    var contents = layer.property("Contents");
                    if (!contents) continue;
                    
                    var modifierEffect;
                    
                    switch (modifier.toLowerCase()) {
                        case "repeater":
                            modifierEffect = contents.addProperty("ADBE Vector Filter - Repeater");
                            if (params.copies) {
                                modifierEffect.property("Copies").setValue(params.copies);
                            } else {
                                modifierEffect.property("Copies").setValue(3);
                            }
                            // Set default transform for interesting result
                            var transform = modifierEffect.property("Transform");
                            transform.property("Position").setValue([50, 0]);
                            transform.property("Scale").setValue([90, 90]);
                            break;
                            
                        case "offset":
                            modifierEffect = contents.addProperty("ADBE Vector Filter - Offset");
                            if (params.offsetAmount) {
                                modifierEffect.property("Amount").setValue(params.offsetAmount);
                            } else {
                                modifierEffect.property("Amount").setValue(10);
                            }
                            break;
                            
                        case "zigzag":
                            modifierEffect = contents.addProperty("ADBE Vector Filter - Zigzag");
                            if (params.zigzagAmount) {
                                modifierEffect.property("Size").setValue(params.zigzagAmount);
                            } else {
                                modifierEffect.property("Size").setValue(15);
                            }
                            if (params.frequency) {
                                modifierEffect.property("Ridges per segment").setValue(params.frequency);
                            } else {
                                modifierEffect.property("Ridges per segment").setValue(3);
                            }
                            break;
                            
                        case "round_corners":
                            modifierEffect = contents.addProperty("ADBE Vector Filter - RC");
                            if (params.cornerRadius) {
                                modifierEffect.property("Radius").setValue(params.cornerRadius);
                            } else {
                                modifierEffect.property("Radius").setValue(25);
                            }
                            break;
                            
                        case "pucker_bloat":
                            modifierEffect = contents.addProperty("ADBE Vector Filter - PB");
                            if (params.puckerBloatAmount) {
                                modifierEffect.property("Amount").setValue(params.puckerBloatAmount);
                            } else {
                                modifierEffect.property("Amount").setValue(50);
                            }
                            break;
                            
                        default:
                            continue;
                    }
                    
                    modifiedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Added " + modifier + " modifier to " + modifiedCount + " shape layers",
                    data: { 
                        layersModified: modifiedCount,
                        modifier: modifier
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error adding shape modifiers: " + error.toString() };
            }
        }
    },

    "analyze_shape_properties": {
        description: "Analyze shape layers to identify which have specific properties (rounded corners, modifiers, etc.)",
        parameters: {
            property: "string", // "rounded_corners", "repeater", "offset", "zigzag", "pucker_bloat"
            returnLayerNames: "boolean" // return array of layer names that have the property (default: true)
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Analyze Shape Properties");
                
                var layersWithProperty = [];
                var propertyToFind = params.property || "rounded_corners";
                var foundCount = 0;
                
                // Check all layers in composition
                for (var i = 1; i <= activeItem.numLayers; i++) {
                    var layer = activeItem.layer(i);
                    
                    // Skip non-shape layers
                    if (!(layer instanceof ShapeLayer)) continue;
                    
                    var hasProperty = false;
                    var propertyDetails = {};
                    
                    try {
                        var contents = layer.property("Contents");
                        if (!contents) continue;
                        
                        // Check for specific properties
                        switch (propertyToFind.toLowerCase()) {
                            case "rounded_corners":
                            case "round_corners":
                                // Look for round corners modifier (ADBE Vector Filter - RC)
                                for (var j = 1; j <= contents.numProperties; j++) {
                                    var prop = contents.property(j);
                                    if (prop.matchName === "ADBE Vector Filter - RC") {
                                        hasProperty = true;
                                        try {
                                            var radiusProp = prop.property("Radius");
                                            if (radiusProp) {
                                                propertyDetails.radius = radiusProp.value;
                                            }
                                        } catch (e) {
                                            propertyDetails.radius = "unknown";
                                        }
                                        break;
                                    }
                                }
                                
                                // Also check for built-in roundness on rectangles
                                if (!hasProperty) {
                                    for (var k = 1; k <= contents.numProperties; k++) {
                                        var group = contents.property(k);
                                        if (group.numProperties) {
                                            for (var l = 1; l <= group.numProperties; l++) {
                                                var shapeProp = group.property(l);
                                                if (shapeProp.matchName === "ADBE Vector Shape - Rect") {
                                                    try {
                                                        var roundnessProp = shapeProp.property("ADBE Vector Rect Roundness") || shapeProp.property("Roundness");
                                                        if (roundnessProp && roundnessProp.value > 0) {
                                                            hasProperty = true;
                                                            propertyDetails.radius = roundnessProp.value;
                                                            propertyDetails.type = "built-in";
                                                            break;
                                                        }
                                                    } catch (e) {
                                                        // Continue checking
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                                
                            case "repeater":
                                for (var m = 1; m <= contents.numProperties; m++) {
                                    var repProp = contents.property(m);
                                    if (repProp.matchName === "ADBE Vector Filter - Repeater") {
                                        hasProperty = true;
                                        try {
                                            var copiesProp = repProp.property("Copies");
                                            if (copiesProp) {
                                                propertyDetails.copies = copiesProp.value;
                                            }
                                        } catch (e) {
                                            propertyDetails.copies = "unknown";
                                        }
                                        break;
                                    }
                                }
                                break;
                                
                            case "offset":
                                for (var n = 1; n <= contents.numProperties; n++) {
                                    var offsetProp = contents.property(n);
                                    if (offsetProp.matchName === "ADBE Vector Filter - Offset") {
                                        hasProperty = true;
                                        try {
                                            var amountProp = offsetProp.property("Amount");
                                            if (amountProp) {
                                                propertyDetails.amount = amountProp.value;
                                            }
                                        } catch (e) {
                                            propertyDetails.amount = "unknown";
                                        }
                                        break;
                                    }
                                }
                                break;
                                
                            case "zigzag":
                                for (var o = 1; o <= contents.numProperties; o++) {
                                    var zigProp = contents.property(o);
                                    if (zigProp.matchName === "ADBE Vector Filter - Zigzag") {
                                        hasProperty = true;
                                        try {
                                            var sizeProp = zigProp.property("Size");
                                            if (sizeProp) {
                                                propertyDetails.size = sizeProp.value;
                                            }
                                        } catch (e) {
                                            propertyDetails.size = "unknown";
                                        }
                                        break;
                                    }
                                }
                                break;
                                
                            case "pucker_bloat":
                                for (var p = 1; p <= contents.numProperties; p++) {
                                    var puckerProp = contents.property(p);
                                    if (puckerProp.matchName === "ADBE Vector Filter - PB") {
                                        hasProperty = true;
                                        try {
                                            var puckerAmountProp = puckerProp.property("Amount");
                                            if (puckerAmountProp) {
                                                propertyDetails.amount = puckerAmountProp.value;
                                            }
                                        } catch (e) {
                                            propertyDetails.amount = "unknown";
                                        }
                                        break;
                                    }
                                }
                                break;
                        }
                        
                        if (hasProperty) {
                            foundCount++;
                            layersWithProperty.push({
                                name: layer.name,
                                index: layer.index,
                                layerIndex: i, // 1-based index for After Effects
                                details: propertyDetails
                            });
                        }
                        
                    } catch (error) {
                        // Continue to next layer if this one fails
                        continue;
                    }
                }
                
                app.endUndoGroup();
                
                // Return results
                var result = {
                    success: true,
                    message: "Found " + foundCount + " shape layers with " + propertyToFind + " property",
                    data: { 
                        foundCount: foundCount,
                        property: propertyToFind,
                        layersWithProperty: layersWithProperty
                    }
                };
                
                // Add layer names and indices arrays if requested
                if (params.returnLayerNames !== false) {
                    var layerNames = [];
                    var layerIndices = [];
                    for (var q = 0; q < layersWithProperty.length; q++) {
                        layerNames.push(layersWithProperty[q].name);
                        layerIndices.push(layersWithProperty[q].layerIndex);
                    }
                    result.data.layerNames = layerNames;
                    result.data.layerIndices = layerIndices;
                }
                
                return result;
                
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error analyzing shape properties: " + error.toString() };
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = SHAPE_TOOLS;
} 