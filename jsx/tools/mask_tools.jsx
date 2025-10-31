/**
 * Mask Tools for AI Integration
 * Comprehensive masking, rotoscoping, and path operations
 */

var MASK_TOOLS = {
    "create_mask": {
        description: "Create masks on selected layers with various shapes",
        parameters: {
            shape: "string", // "rectangle", "ellipse", "polygon", "custom"
            size: "array", // [width, height]
            position: "array", // [x, y] relative to layer
            feather: "number", // mask feather in pixels
            opacity: "number", // mask opacity (0-100)
            mode: "string", // "add", "subtract", "intersect", "lighten", "darken", "difference"
            inverted: "boolean", // invert mask
            path: "array", // custom path points [[x,y], [x,y], ...]
            cornerRadius: "number" // for rounded rectangles
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected for masking" };
            }

            try {
                app.beginUndoGroup("AI: Create Mask");
                
                var maskedCount = 0;
                var shape = params.shape || "rectangle";
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    var mask = layer.Masks.addProperty("Mask");
                    var maskPath = mask.property("Mask Path");
                    var myShape = new Shape();
                    
                    // Create mask shape
                    switch (shape.toLowerCase()) {
                        case "rectangle":
                            var width = params.size ? params.size[0] : 200;
                            var height = params.size ? params.size[1] : 200;
                            var centerX = params.position ? params.position[0] : layer.width / 2;
                            var centerY = params.position ? params.position[1] : layer.height / 2;
                            
                            myShape.vertices = [
                                [centerX - width/2, centerY - height/2],
                                [centerX + width/2, centerY - height/2],
                                [centerX + width/2, centerY + height/2],
                                [centerX - width/2, centerY + height/2]
                            ];
                            myShape.closed = true;
                            
                            // Add corner radius if specified
                            if (params.cornerRadius) {
                                var radius = Math.min(params.cornerRadius, width/2, height/2);
                                myShape.inTangents = [
                                    [0, -radius], [radius, 0], [0, radius], [-radius, 0]
                                ];
                                myShape.outTangents = [
                                    [radius, 0], [0, radius], [-radius, 0], [0, -radius]
                                ];
                            } else {
                                myShape.inTangents = [[0,0], [0,0], [0,0], [0,0]];
                                myShape.outTangents = [[0,0], [0,0], [0,0], [0,0]];
                            }
                            break;
                            
                        case "ellipse":
                            var width = params.size ? params.size[0] : 200;
                            var height = params.size ? params.size[1] : 200;
                            var centerX = params.position ? params.position[0] : layer.width / 2;
                            var centerY = params.position ? params.position[1] : layer.height / 2;
                            
                            // Create ellipse with bezier curves
                            var radiusX = width / 2;
                            var radiusY = height / 2;
                            var tangentLength = 0.552284749831; // Magic number for circle approximation
                            
                            myShape.vertices = [
                                [centerX, centerY - radiusY],
                                [centerX + radiusX, centerY],
                                [centerX, centerY + radiusY],
                                [centerX - radiusX, centerY]
                            ];
                            myShape.inTangents = [
                                [-radiusX * tangentLength, 0],
                                [0, -radiusY * tangentLength],
                                [radiusX * tangentLength, 0],
                                [0, radiusY * tangentLength]
                            ];
                            myShape.outTangents = [
                                [radiusX * tangentLength, 0],
                                [0, radiusY * tangentLength],
                                [-radiusX * tangentLength, 0],
                                [0, -radiusY * tangentLength]
                            ];
                            myShape.closed = true;
                            break;
                            
                        case "polygon":
                            var sides = 6; // Default hexagon
                            var radius = params.size ? Math.max(params.size[0], params.size[1]) / 2 : 100;
                            var centerX = params.position ? params.position[0] : layer.width / 2;
                            var centerY = params.position ? params.position[1] : layer.height / 2;
                            
                            myShape.vertices = [];
                            myShape.inTangents = [];
                            myShape.outTangents = [];
                            
                            for (var j = 0; j < sides; j++) {
                                var angle = (j / sides) * 2 * Math.PI - Math.PI / 2;
                                var x = centerX + Math.cos(angle) * radius;
                                var y = centerY + Math.sin(angle) * radius;
                                myShape.vertices.push([x, y]);
                                myShape.inTangents.push([0, 0]);
                                myShape.outTangents.push([0, 0]);
                            }
                            myShape.closed = true;
                            break;
                            
                        case "custom":
                            if (params.path && params.path.length > 0) {
                                myShape.vertices = params.path;
                                myShape.inTangents = [];
                                myShape.outTangents = [];
                                for (var k = 0; k < params.path.length; k++) {
                                    myShape.inTangents.push([0, 0]);
                                    myShape.outTangents.push([0, 0]);
                                }
                                myShape.closed = true;
                            } else {
                                // Default to rectangle if no path provided
                                myShape.vertices = [
                                    [layer.width * 0.25, layer.height * 0.25],
                                    [layer.width * 0.75, layer.height * 0.25],
                                    [layer.width * 0.75, layer.height * 0.75],
                                    [layer.width * 0.25, layer.height * 0.75]
                                ];
                                myShape.inTangents = [[0,0], [0,0], [0,0], [0,0]];
                                myShape.outTangents = [[0,0], [0,0], [0,0], [0,0]];
                                myShape.closed = true;
                            }
                            break;
                    }
                    
                    maskPath.setValue(myShape);
                    
                    // Set mask properties
                    if (params.feather) {
                        mask.property("Mask Feather").setValue([params.feather, params.feather]);
                    }
                    
                    if (params.opacity !== undefined) {
                        mask.property("Mask Opacity").setValue(params.opacity);
                    } else {
                        mask.property("Mask Opacity").setValue(100);
                    }
                    
                    if (params.mode) {
                        var mode = MaskMode.ADD;
                        switch (params.mode.toLowerCase()) {
                            case "subtract": mode = MaskMode.SUBTRACT; break;
                            case "intersect": mode = MaskMode.INTERSECT; break;
                            case "lighten": mode = MaskMode.LIGHTEN; break;
                            case "darken": mode = MaskMode.DARKEN; break;
                            case "difference": mode = MaskMode.DIFFERENCE; break;
                        }
                        mask.property("Mask Mode").setValue(mode);
                    }
                    
                    if (params.inverted) {
                        mask.property("Mask Inverted").setValue(params.inverted);
                    }
                    
                    mask.name = "AI " + shape.charAt(0).toUpperCase() + shape.slice(1) + " Mask";
                    maskedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created " + shape + " masks on " + maskedCount + " layers",
                    data: { 
                        layersMasked: maskedCount,
                        maskShape: shape
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating mask: " + error.toString() };
            }
        }
    },

    "animate_mask": {
        description: "Animate mask properties and paths",
        parameters: {
            property: "string", // "path", "feather", "opacity", "expansion"
            startTime: "number", // start time
            endTime: "number", // end time
            startValue: "any", // starting value
            endValue: "any", // ending value
            maskIndex: "number", // which mask to animate (1-based)
            easing: "string", // easing type
            morphPath: "array" // target path for morphing
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
                app.beginUndoGroup("AI: Animate Mask");
                
                var animatedCount = 0;
                var property = params.property || "opacity";
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                var endTime = params.endTime !== undefined ? params.endTime : startTime + 2;
                var maskIndex = params.maskIndex || 1;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    if (layer.Masks.numProperties === 0) continue;
                    
                    var mask;
                    try {
                        mask = layer.Masks.property(maskIndex);
                    } catch (e) {
                        mask = layer.Masks.property(1); // Default to first mask
                    }
                    
                    if (!mask) continue;
                    
                    var maskProperty;
                    
                    switch (property.toLowerCase()) {
                        case "opacity":
                            maskProperty = mask.property("Mask Opacity");
                            maskProperty.setValueAtTime(startTime, params.startValue || 100);
                            maskProperty.setValueAtTime(endTime, params.endValue || 0);
                            break;
                            
                        case "feather":
                            maskProperty = mask.property("Mask Feather");
                            var startFeather = params.startValue || [0, 0];
                            var endFeather = params.endValue || [20, 20];
                            maskProperty.setValueAtTime(startTime, startFeather);
                            maskProperty.setValueAtTime(endTime, endFeather);
                            break;
                            
                        case "expansion":
                            maskProperty = mask.property("Mask Expansion");
                            maskProperty.setValueAtTime(startTime, params.startValue || 0);
                            maskProperty.setValueAtTime(endTime, params.endValue || 50);
                            break;
                            
                        case "path":
                            maskProperty = mask.property("Mask Path");
                            if (params.morphPath) {
                                var currentPath = maskProperty.value;
                                var targetShape = new Shape();
                                targetShape.vertices = params.morphPath;
                                targetShape.inTangents = [];
                                targetShape.outTangents = [];
                                for (var j = 0; j < params.morphPath.length; j++) {
                                    targetShape.inTangents.push([0, 0]);
                                    targetShape.outTangents.push([0, 0]);
                                }
                                targetShape.closed = true;
                                
                                maskProperty.setValueAtTime(startTime, currentPath);
                                maskProperty.setValueAtTime(endTime, targetShape);
                            }
                            break;
                    }
                    
                    // Apply easing if specified
                    if (params.easing && maskProperty) {
                        this.applyEasing(maskProperty, startTime, endTime, params.easing);
                    }
                    
                    animatedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Animated mask " + property + " on " + animatedCount + " layers",
                    data: { 
                        layersAnimated: animatedCount,
                        property: property,
                        duration: endTime - startTime
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error animating mask: " + error.toString() };
            }
        },
        
        applyEasing: function(property, startTime, endTime, easing) {
            var startKeyIndex = property.nearestKeyIndex(startTime);
            var endKeyIndex = property.nearestKeyIndex(endTime);
            
            if (startKeyIndex === 0 || endKeyIndex === 0) return;
            
            switch (easing.toLowerCase()) {
                case "easeinout":
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
                    break;
            }
        }
    },

    "copy_mask": {
        description: "Copy masks from one layer to selected layers",
        parameters: {
            sourceLayer: "string", // source layer name
            maskIndices: "array", // which masks to copy (1-based indices)
            copyKeyframes: "boolean", // copy mask animations
            replaceExisting: "boolean" // replace existing masks
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
                app.beginUndoGroup("AI: Copy Mask");
                
                var sourceLayer = null;
                
                // Find source layer
                if (params.sourceLayer) {
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        var layer = activeItem.layer(i);
                        if (layer.name === params.sourceLayer) {
                            sourceLayer = layer;
                            break;
                        }
                    }
                } else {
                    // Use first selected layer as source
                    sourceLayer = selectedLayers[0];
                }
                
                if (!sourceLayer) {
                    app.endUndoGroup();
                    return { success: false, message: "Source layer not found" };
                }
                
                if (sourceLayer.Masks.numProperties === 0) {
                    app.endUndoGroup();
                    return { success: false, message: "Source layer has no masks" };
                }
                
                var copiedCount = 0;
                var masksCopied = 0;
                
                for (var j = 0; j < selectedLayers.length; j++) {
                    var targetLayer = selectedLayers[j];
                    if (targetLayer === sourceLayer) continue;
                    
                    // Clear existing masks if requested
                    if (params.replaceExisting) {
                        while (targetLayer.Masks.numProperties > 0) {
                            targetLayer.Masks.property(1).remove();
                        }
                    }
                    
                    var layerMasksCopied = 0;
                    
                    // Copy specified masks or all masks
                    var maskIndices = params.maskIndices || [];
                    if (maskIndices.length === 0) {
                        // Copy all masks
                        for (var k = 1; k <= sourceLayer.Masks.numProperties; k++) {
                            maskIndices.push(k);
                        }
                    }
                    
                    for (var l = 0; l < maskIndices.length; l++) {
                        var maskIndex = maskIndices[l];
                        
                        try {
                            var sourceMask = sourceLayer.Masks.property(maskIndex);
                            if (!sourceMask) continue;
                            
                            var targetMask = targetLayer.Masks.addProperty("Mask");
                            
                            // Copy mask properties
                            this.copyMaskProperties(sourceMask, targetMask, params.copyKeyframes);
                            
                            targetMask.name = sourceMask.name + " Copy";
                            layerMasksCopied++;
                        } catch (e) {
                            // Mask index might not exist
                        }
                    }
                    
                    if (layerMasksCopied > 0) {
                        copiedCount++;
                        masksCopied += layerMasksCopied;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Copied " + masksCopied + " masks to " + copiedCount + " layers",
                    data: { 
                        sourceLayer: sourceLayer.name,
                        layersModified: copiedCount,
                        masksCopied: masksCopied
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error copying mask: " + error.toString() };
            }
        },
        
        copyMaskProperties: function(sourceMask, targetMask, copyKeyframes) {
            var properties = [
                "Mask Path",
                "Mask Feather", 
                "Mask Opacity",
                "Mask Expansion",
                "Mask Mode",
                "Mask Inverted"
            ];
            
            for (var i = 0; i < properties.length; i++) {
                try {
                    var sourceProp = sourceMask.property(properties[i]);
                    var targetProp = targetMask.property(properties[i]);
                    
                    if (sourceProp && targetProp && sourceProp.canSetValue && targetProp.canSetValue) {
                        if (copyKeyframes && sourceProp.numKeys > 0) {
                            // Copy keyframes
                            for (var j = 1; j <= sourceProp.numKeys; j++) {
                                var keyTime = sourceProp.keyTime(j);
                                var keyValue = sourceProp.keyValue(j);
                                targetProp.setValueAtTime(keyTime, keyValue);
                                
                                // Copy interpolation
                                try {
                                    var inInterp = sourceProp.keyInInterpolationType(j);
                                    var outInterp = sourceProp.keyOutInterpolationType(j);
                                    targetProp.setInterpolationTypeAtKey(j, inInterp, outInterp);
                                } catch (e) {
                                    // Interpolation might not be applicable
                                }
                            }
                        } else {
                            // Copy current value
                            targetProp.setValue(sourceProp.value);
                        }
                    }
                } catch (e) {
                    // Property might not exist or be settable
                }
            }
        }
    },

    "create_rotoscope_mask": {
        description: "Create rotoscoping mask with tracking points",
        parameters: {
            trackingPoints: "array", // array of [x, y] tracking points
            interpolationMethod: "string", // "linear", "bezier"
            autoKeyframe: "boolean", // auto-keyframe mask path
            smoothing: "number", // path smoothing amount (0-100)
            simplifyPath: "boolean" // simplify path to reduce points
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected for rotoscoping" };
            }

            try {
                app.beginUndoGroup("AI: Create Rotoscope Mask");
                
                var rotoscopedCount = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    var mask = layer.Masks.addProperty("Mask");
                    mask.name = "AI Rotoscope Mask";
                    
                    var maskPath = mask.property("Mask Path");
                    
                    if (params.trackingPoints && params.trackingPoints.length > 0) {
                        var myShape = new Shape();
                        myShape.vertices = params.trackingPoints;
                        myShape.inTangents = [];
                        myShape.outTangents = [];
                        
                        // Set up tangents based on interpolation method
                        for (var j = 0; j < params.trackingPoints.length; j++) {
                            if (params.interpolationMethod === "bezier") {
                                // Calculate smooth tangents
                                var prevPoint = params.trackingPoints[j > 0 ? j - 1 : params.trackingPoints.length - 1];
                                var nextPoint = params.trackingPoints[j < params.trackingPoints.length - 1 ? j + 1 : 0];
                                var currentPoint = params.trackingPoints[j];
                                
                                var tangentX = (nextPoint[0] - prevPoint[0]) * 0.25;
                                var tangentY = (nextPoint[1] - prevPoint[1]) * 0.25;
                                
                                myShape.inTangents.push([-tangentX, -tangentY]);
                                myShape.outTangents.push([tangentX, tangentY]);
                            } else {
                                myShape.inTangents.push([0, 0]);
                                myShape.outTangents.push([0, 0]);
                            }
                        }
                        
                        myShape.closed = true;
                        maskPath.setValue(myShape);
                    } else {
                        // Create default rotoscoping mask
                        var centerX = layer.width / 2;
                        var centerY = layer.height / 2;
                        var defaultShape = new Shape();
                        defaultShape.vertices = [
                            [centerX - 100, centerY - 100],
                            [centerX + 100, centerY - 100],
                            [centerX + 100, centerY + 100],
                            [centerX - 100, centerY + 100]
                        ];
                        defaultShape.inTangents = [[0,0], [0,0], [0,0], [0,0]];
                        defaultShape.outTangents = [[0,0], [0,0], [0,0], [0,0]];
                        defaultShape.closed = true;
                        maskPath.setValue(defaultShape);
                    }
                    
                    // Set up for animation
                    if (params.autoKeyframe) {
                        maskPath.setValueAtTime(activeItem.time, maskPath.value);
                    }
                    
                    // Apply smoothing if specified
                    if (params.smoothing) {
                        mask.property("Mask Feather").setValue([params.smoothing / 10, params.smoothing / 10]);
                    }
                    
                    rotoscopedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created rotoscope masks on " + rotoscopedCount + " layers",
                    data: { 
                        layersModified: rotoscopedCount,
                        trackingPoints: params.trackingPoints ? params.trackingPoints.length : 0
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating rotoscope mask: " + error.toString() };
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = MASK_TOOLS;
} 