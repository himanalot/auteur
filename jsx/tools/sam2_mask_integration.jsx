/**
 * SAM2 Mask Integration for After Effects
 * Applies AI-generated mask contours from SAM2 to After Effects layers
 */

var SAM2_MASK_TOOLS = {
    "apply_sam2_mask": {
        description: "Apply SAM2-generated mask contours to selected layers",
        parameters: {
            maskContours: "array", // Array of [x, y] contour points from SAM2
            maskMode: "string", // "add", "subtract", "intersect", "lighten", "darken", "difference"
            feather: "number", // Mask feather in pixels
            opacity: "number", // Mask opacity (0-100)
            inverted: "boolean", // Invert mask
            smooth: "boolean", // Use RotoBezier for smooth curves
            name: "string" // Custom mask name
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected for SAM2 masking" };
            }

            if (!params.maskContours || params.maskContours.length < 3) {
                return { success: false, message: "SAM2 mask contours not provided or insufficient points" };
            }

            try {
                app.beginUndoGroup("AI: Apply SAM2 Mask");
                
                var maskedCount = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    // Create new mask
                    var mask = layer.Masks.addProperty("Mask");
                    var maskPath = mask.property("Mask Path");
                    
                    // Create shape from SAM2 contours
                    var myShape = new Shape();
                    myShape.vertices = params.maskContours;
                    myShape.closed = true;
                    
                    // Set tangents based on smooth parameter
                    myShape.inTangents = [];
                    myShape.outTangents = [];
                    
                    if (params.smooth) {
                        // Use RotoBezier for automatic smooth curves
                        for (var j = 0; j < params.maskContours.length; j++) {
                            myShape.inTangents.push([0, 0]);
                            myShape.outTangents.push([0, 0]);
                        }
                        mask.rotoBezier = true;
                    } else {
                        // Calculate smooth tangents manually for better control
                        for (var k = 0; k < params.maskContours.length; k++) {
                            var prevIndex = (k - 1 + params.maskContours.length) % params.maskContours.length;
                            var nextIndex = (k + 1) % params.maskContours.length;
                            
                            var prevPoint = params.maskContours[prevIndex];
                            var currentPoint = params.maskContours[k];
                            var nextPoint = params.maskContours[nextIndex];
                            
                            // Calculate smooth tangent vectors
                            var tangentX = (nextPoint[0] - prevPoint[0]) * 0.25;
                            var tangentY = (nextPoint[1] - prevPoint[1]) * 0.25;
                            
                            myShape.inTangents.push([-tangentX, -tangentY]);
                            myShape.outTangents.push([tangentX, tangentY]);
                        }
                    }
                    
                    // Apply the shape to the mask
                    maskPath.setValue(myShape);
                    
                    // Set mask properties
                    if (params.feather !== undefined) {
                        mask.property("Mask Feather").setValue([params.feather, params.feather]);
                    } else {
                        mask.property("Mask Feather").setValue([2, 2]); // Default soft feather
                    }
                    
                    if (params.opacity !== undefined) {
                        mask.property("Mask Opacity").setValue(params.opacity);
                    } else {
                        mask.property("Mask Opacity").setValue(100);
                    }
                    
                    // Set mask mode
                    var mode = MaskMode.ADD;
                    if (params.maskMode) {
                        switch (params.maskMode.toLowerCase()) {
                            case "subtract": mode = MaskMode.SUBTRACT; break;
                            case "intersect": mode = MaskMode.INTERSECT; break;
                            case "lighten": mode = MaskMode.LIGHTEN; break;
                            case "darken": mode = MaskMode.DARKEN; break;
                            case "difference": mode = MaskMode.DIFFERENCE; break;
                        }
                    }
                    mask.maskMode = mode;
                    
                    // Set inverted if specified
                    if (params.inverted) {
                        mask.inverted = params.inverted;
                    }
                    
                    // Set mask name
                    var maskName = params.name || "SAM2 AI Mask";
                    mask.name = maskName;
                    
                    maskedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Applied SAM2 masks to " + maskedCount + " layers with " + params.maskContours.length + " contour points",
                    data: { 
                        layersMasked: maskedCount,
                        contourPoints: params.maskContours.length,
                        maskMode: params.maskMode || "add",
                        smooth: params.smooth || false
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error applying SAM2 mask: " + error.toString() };
            }
        }
    },

    "batch_apply_sam2_masks": {
        description: "Apply multiple SAM2 masks from video frames to layers",
        parameters: {
            maskSequence: "array", // Array of frame masks: [{frame: 0, contours: [[x,y]...]}, ...]
            startFrame: "number", // Starting frame number
            frameRate: "number", // Composition frame rate for timing
            maskMode: "string", // Mask mode for all masks
            feather: "number", // Feather for all masks
            animated: "boolean", // Create animated mask path
            layerName: "string" // Target specific layer by name
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            if (!params.maskSequence || params.maskSequence.length === 0) {
                return { success: false, message: "No SAM2 mask sequence provided" };
            }

            try {
                app.beginUndoGroup("AI: Apply SAM2 Mask Sequence");
                
                var targetLayer = null;
                
                // Find target layer
                if (params.layerName) {
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        var layer = activeItem.layer(i);
                        if (layer.name === params.layerName) {
                            targetLayer = layer;
                            break;
                        }
                    }
                } else {
                    // Use first selected layer
                    var selectedLayers = activeItem.selectedLayers;
                    if (selectedLayers.length > 0) {
                        targetLayer = selectedLayers[0];
                    }
                }
                
                if (!targetLayer) {
                    app.endUndoGroup();
                    return { success: false, message: "No target layer found" };
                }
                
                var frameRate = params.frameRate || activeItem.frameRate;
                var startFrame = params.startFrame || 0;
                var masksApplied = 0;
                
                if (params.animated && params.maskSequence.length > 1) {
                    // Create single animated mask
                    var mask = targetLayer.Masks.addProperty("Mask");
                    var maskPath = mask.property("Mask Path");
                    mask.name = "SAM2 Animated Mask";
                    
                    // Set mask properties
                    var mode = MaskMode.ADD;
                    if (params.maskMode) {
                        switch (params.maskMode.toLowerCase()) {
                            case "subtract": mode = MaskMode.SUBTRACT; break;
                            case "intersect": mode = MaskMode.INTERSECT; break;
                            case "lighten": mode = MaskMode.LIGHTEN; break;
                            case "darken": mode = MaskMode.DARKEN; break;
                            case "difference": mode = MaskMode.DIFFERENCE; break;
                        }
                    }
                    mask.maskMode = mode;
                    
                    if (params.feather !== undefined) {
                        mask.property("Mask Feather").setValue([params.feather, params.feather]);
                    }
                    
                    // Animate mask path through all frames
                    for (var j = 0; j < params.maskSequence.length; j++) {
                        var frameData = params.maskSequence[j];
                        var frameTime = (startFrame + frameData.frame) / frameRate;
                        
                        if (frameData.contours && frameData.contours.length >= 3) {
                            var myShape = new Shape();
                            myShape.vertices = frameData.contours;
                            myShape.closed = true;
                            
                            // Set simple tangents for animation compatibility
                            myShape.inTangents = [];
                            myShape.outTangents = [];
                            for (var k = 0; k < frameData.contours.length; k++) {
                                myShape.inTangents.push([0, 0]);
                                myShape.outTangents.push([0, 0]);
                            }
                            
                            maskPath.setValueAtTime(frameTime, myShape);
                        }
                    }
                    
                    masksApplied = 1;
                    
                } else {
                    // Create separate mask for each frame (static masks)
                    for (var l = 0; l < params.maskSequence.length; l++) {
                        var frameData = params.maskSequence[l];
                        
                        if (frameData.contours && frameData.contours.length >= 3) {
                            var mask = targetLayer.Masks.addProperty("Mask");
                            var maskPath = mask.property("Mask Path");
                            
                            var myShape = new Shape();
                            myShape.vertices = frameData.contours;
                            myShape.closed = true;
                            myShape.inTangents = [];
                            myShape.outTangents = [];
                            
                            // Calculate smooth tangents
                            for (var m = 0; m < frameData.contours.length; m++) {
                                var prevIndex = (m - 1 + frameData.contours.length) % frameData.contours.length;
                                var nextIndex = (m + 1) % frameData.contours.length;
                                
                                var prevPoint = frameData.contours[prevIndex];
                                var nextPoint = frameData.contours[nextIndex];
                                
                                var tangentX = (nextPoint[0] - prevPoint[0]) * 0.2;
                                var tangentY = (nextPoint[1] - prevPoint[1]) * 0.2;
                                
                                myShape.inTangents.push([-tangentX, -tangentY]);
                                myShape.outTangents.push([tangentX, tangentY]);
                            }
                            
                            maskPath.setValue(myShape);
                            
                            // Set mask properties
                            var mode = MaskMode.ADD;
                            if (params.maskMode) {
                                switch (params.maskMode.toLowerCase()) {
                                    case "subtract": mode = MaskMode.SUBTRACT; break;
                                    case "intersect": mode = MaskMode.INTERSECT; break;
                                    case "lighten": mode = MaskMode.LIGHTEN; break;
                                    case "darken": mode = MaskMode.DARKEN; break;
                                    case "difference": mode = MaskMode.DIFFERENCE; break;
                                }
                            }
                            mask.maskMode = mode;
                            
                            if (params.feather !== undefined) {
                                mask.property("Mask Feather").setValue([params.feather, params.feather]);
                            }
                            
                            mask.name = "SAM2 Frame " + frameData.frame;
                            masksApplied++;
                        }
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Applied " + masksApplied + " SAM2 masks from " + params.maskSequence.length + " frames to layer: " + targetLayer.name,
                    data: { 
                        layerName: targetLayer.name,
                        masksApplied: masksApplied,
                        framesProcessed: params.maskSequence.length,
                        animated: params.animated || false
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error applying SAM2 mask sequence: " + error.toString() };
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = SAM2_MASK_TOOLS;
}