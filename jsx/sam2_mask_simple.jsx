/**
 * Simple SAM2 Mask Application for After Effects
 * Standalone script that doesn't depend on ae_tools.jsx
 */

function applySAM2Mask(maskContours, maskMode, feather, opacity, smooth, name) {
    try {
        app.beginUndoGroup("SAM2: Apply Mask");
        
        var activeItem = app.project.activeItem;
        if (!activeItem || !(activeItem instanceof CompItem)) {
            return JSON.stringify({success: false, message: "No active composition found"});
        }

        var selectedLayers = activeItem.selectedLayers;
        if (selectedLayers.length === 0) {
            return JSON.stringify({success: false, message: "No layers selected for SAM2 masking"});
        }

        if (!maskContours || maskContours.length < 3) {
            return JSON.stringify({success: false, message: "SAM2 mask contours not provided or insufficient points"});
        }

        var maskedCount = 0;
        
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            
            // Create new mask
            var mask = layer.Masks.addProperty("Mask");
            var maskPath = mask.property("Mask Path");
            
            // Create shape from SAM2 contours
            var myShape = new Shape();
            myShape.vertices = maskContours;
            myShape.closed = true;
            
            // Set tangents based on smooth parameter
            myShape.inTangents = [];
            myShape.outTangents = [];
            
            if (smooth) {
                // Use RotoBezier for automatic smooth curves
                for (var j = 0; j < maskContours.length; j++) {
                    myShape.inTangents.push([0, 0]);
                    myShape.outTangents.push([0, 0]);
                }
                mask.rotoBezier = true;
            } else {
                // Linear interpolation - no curves
                for (var k = 0; k < maskContours.length; k++) {
                    myShape.inTangents.push([0, 0]);
                    myShape.outTangents.push([0, 0]);
                }
            }
            
            maskPath.setValue(myShape);
            
            // Set mask properties
            if (feather !== undefined) {
                mask.property("Mask Feather").setValue([feather, feather]);
            } else {
                mask.property("Mask Feather").setValue([2, 2]); // Default soft feather
            }
            
            if (opacity !== undefined) {
                mask.property("Mask Opacity").setValue(opacity);
            } else {
                mask.property("Mask Opacity").setValue(100);
            }
            
            // Set mask mode
            var mode = MaskMode.ADD;
            if (maskMode) {
                switch (maskMode.toLowerCase()) {
                    case "subtract": mode = MaskMode.SUBTRACT; break;
                    case "intersect": mode = MaskMode.INTERSECT; break;
                    case "lighten": mode = MaskMode.LIGHTEN; break;
                    case "darken": mode = MaskMode.DARKEN; break;
                    case "difference": mode = MaskMode.DIFFERENCE; break;
                }
            }
            mask.maskMode = mode;
            
            // Set mask name
            var maskName = name || "SAM2 AI Mask";
            mask.name = maskName;
            
            maskedCount++;
        }
        
        app.endUndoGroup();
        return JSON.stringify({
            success: true,
            message: "Applied SAM2 masks to " + maskedCount + " layers with " + maskContours.length + " contour points",
            data: { 
                layersMasked: maskedCount,
                contourPoints: maskContours.length,
                maskMode: maskMode || "add",
                smooth: smooth || false
            }
        });
    } catch (error) {
        app.endUndoGroup();
        return JSON.stringify({ success: false, message: "Error applying SAM2 mask: " + error.toString() });
    }
}