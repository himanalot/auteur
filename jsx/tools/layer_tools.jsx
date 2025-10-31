/**
 * Layer Management Tools for AI Integration
 * Comprehensive layer creation, modification, and organization
 */

var LAYER_TOOLS = {
    "add_layer": {
        description: "Add different types of layers to the active composition",
        parameters: {
            type: "string", // solid, adjustment, null, text, shape, camera, light
            name: "string",
            color: "array", // [r, g, b] values 0-1
            text: "string", // for text layers
            fontSize: "number", // for text layers
            width: "number", // for solid layers
            height: "number", // for solid layers
            duration: "number", // layer duration
            position: "array", // [x, y] or [x, y, z] for 3D
            cameraType: "string", // "oneNode", "twoNode" for cameras
            lightType: "string" // "parallel", "spot", "point", "ambient" for lights
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Add Layer");
                var layer;
                var layerType = params.type || "solid";

                switch (layerType.toLowerCase()) {
                    case "solid":
                        layer = activeItem.layers.addSolid(
                            params.color || [0.5, 0.5, 0.5],
                            params.name || "AI Solid",
                            params.width || activeItem.width,
                            params.height || activeItem.height,
                            1,
                            params.duration || activeItem.duration
                        );
                        break;
                    
                    case "adjustment":
                        layer = activeItem.layers.addSolid(
                            [1, 1, 1], 
                            params.name || "AI Adjustment", 
                            activeItem.width, 
                            activeItem.height, 
                            1,
                            params.duration || activeItem.duration
                        );
                        layer.adjustmentLayer = true;
                        layer.label = 14; // Purple label
                        break;
                    
                    case "null":
                        layer = activeItem.layers.addNull(params.duration || activeItem.duration);
                        layer.name = params.name || "AI Null";
                        layer.label = 5; // Red label
                        break;
                    
                    case "text":
                        layer = activeItem.layers.addText(params.text || "AI Text");
                        layer.name = params.name || "AI Text";
                        if (params.fontSize) {
                            var textProp = layer.property("Source Text");
                            var textDocument = textProp.value;
                            textDocument.fontSize = params.fontSize;
                            textProp.setValue(textDocument);
                        }
                        break;
                    
                    case "shape":
                        layer = activeItem.layers.addShape();
                        layer.name = params.name || "AI Shape";
                        break;
                        
                    case "camera":
                        var cameraType = CameraType.ONE_NODE_CAMERA;
                        if (params.cameraType === "twoNode") {
                            cameraType = CameraType.TWO_NODE_CAMERA;
                        }
                        layer = activeItem.layers.addCamera(
                            params.name || "AI Camera",
                            [activeItem.width/2, activeItem.height/2]
                        );
                        break;
                        
                    case "light":
                        var lightType = LightType.SPOT;
                        switch (params.lightType) {
                            case "parallel": lightType = LightType.PARALLEL; break;
                            case "point": lightType = LightType.POINT; break;
                            case "ambient": lightType = LightType.AMBIENT; break;
                        }
                        layer = activeItem.layers.addLight(
                            params.name || "AI Light",
                            [activeItem.width/2, activeItem.height/2]
                        );
                        layer.lightType = lightType;
                        break;
                    
                    default:
                        app.endUndoGroup();
                        return { success: false, message: "Unknown layer type: " + layerType };
                }

                // Set position if specified
                if (params.position && layer.transform && layer.transform.position) {
                    layer.transform.position.setValue(params.position);
                }

                app.endUndoGroup();
                return {
                    success: true,
                    message: "Added " + layerType + " layer: " + layer.name,
                    data: { layerId: layer.index, name: layer.name, type: layerType }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error adding layer: " + error.toString() };
            }
        }
    },

    "duplicate_layers": {
        description: "Duplicate selected layers with optional offsets",
        parameters: {
            count: "number", // number of duplicates
            timeOffset: "number", // time offset in seconds
            positionOffset: "array", // [x, y] position offset
            scaleOffset: "number", // scale increment per duplicate
            rotationOffset: "number", // rotation increment per duplicate
            opacityOffset: "number" // opacity decrement per duplicate
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected for duplication" };
            }

            try {
                app.beginUndoGroup("AI: Duplicate Layers");
                var duplicatedCount = 0;
                var count = params.count || 1;

                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    for (var j = 1; j <= count; j++) {
                        var duplicate = layer.duplicate();
                        duplicate.name = layer.name + " Copy " + j;
                        
                        // Apply time offset
                        if (params.timeOffset) {
                            duplicate.startTime = layer.startTime + (params.timeOffset * j);
                        }
                        
                        // Apply position offset
                        if (params.positionOffset && duplicate.transform && duplicate.transform.position) {
                            var currentPos = duplicate.transform.position.value;
                            duplicate.transform.position.setValue([
                                currentPos[0] + (params.positionOffset[0] * j),
                                currentPos[1] + (params.positionOffset[1] * j)
                            ]);
                        }
                        
                        // Apply scale offset
                        if (params.scaleOffset && duplicate.transform && duplicate.transform.scale) {
                            var currentScale = duplicate.transform.scale.value;
                            var newScale = [
                                currentScale[0] + (params.scaleOffset * j),
                                currentScale[1] + (params.scaleOffset * j)
                            ];
                            duplicate.transform.scale.setValue(newScale);
                        }
                        
                        // Apply rotation offset
                        if (params.rotationOffset && duplicate.transform && duplicate.transform.rotation) {
                            var currentRotation = duplicate.transform.rotation.value;
                            duplicate.transform.rotation.setValue(currentRotation + (params.rotationOffset * j));
                        }
                        
                        // Apply opacity offset
                        if (params.opacityOffset && duplicate.transform && duplicate.transform.opacity) {
                            var currentOpacity = duplicate.transform.opacity.value;
                            var newOpacity = Math.max(0, currentOpacity - (params.opacityOffset * j));
                            duplicate.transform.opacity.setValue(newOpacity);
                        }
                        
                        duplicatedCount++;
                    }
                }

                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created " + duplicatedCount + " layer duplicates",
                    data: { duplicatesCreated: duplicatedCount, originalLayers: selectedLayers.length }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error duplicating layers: " + error.toString() };
            }
        }
    },

    "rename_layers": {
        description: "Rename layers by name pattern or selected layers",
        parameters: {
            findNames: "array", // array of layer names to find and rename
            findPattern: "string", // pattern to match in layer names (case-insensitive)
            newName: "string", // new name for the layer(s)
            newNames: "array", // array of new names (one for each found layer)
            useSelected: "boolean", // rename only selected layers instead of searching
            addSuffix: "string", // add suffix to existing names instead of replacing
            addPrefix: "string" // add prefix to existing names instead of replacing
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Rename Layers");
                
                var layersToRename = [];
                var renamedCount = 0;
                var renamedLayers = [];
                
                if (params.useSelected) {
                    // Use selected layers
                    var selectedLayers = activeItem.selectedLayers;
                    if (selectedLayers.length === 0) {
                        app.endUndoGroup();
                        return { success: false, message: "No layers selected for renaming" };
                    }
                    layersToRename = selectedLayers;
                } else {
                    // Find layers by name or pattern
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        var layer = activeItem.layer(i);
                        var shouldRename = false;
                        
                        // Check specific names
                        if (params.findNames) {
                            for (var j = 0; j < params.findNames.length; j++) {
                                if (layer.name.toLowerCase() === params.findNames[j].toLowerCase()) {
                                    shouldRename = true;
                                    break;
                                }
                            }
                        }
                        
                        // Check pattern match
                        if (!shouldRename && params.findPattern) {
                            // Support wildcards: "*" means all layers
                            if (params.findPattern === "*" || params.findPattern.toLowerCase() === "all") {
                                shouldRename = true;
                            } else if (layer.name.toLowerCase().indexOf(params.findPattern.toLowerCase()) !== -1) {
                                shouldRename = true;
                            }
                        }
                        
                        if (shouldRename) {
                            layersToRename.push(layer);
                        }
                    }
                }
                
                if (layersToRename.length === 0) {
                    app.endUndoGroup();
                    return { success: false, message: "No layers found matching the criteria" };
                }
                
                // Rename the layers
                for (var k = 0; k < layersToRename.length; k++) {
                    var layer = layersToRename[k];
                    var oldName = layer.name;
                    var newName;
                    
                    if (params.newNames && params.newNames[k]) {
                        // Use specific name from array
                        newName = params.newNames[k];
                    } else if (params.newName) {
                        // Use single new name
                        newName = params.newName;
                        // If multiple layers, add number suffix
                        if (layersToRename.length > 1) {
                            newName = params.newName + " " + (k + 1);
                        }
                    } else if (params.addPrefix) {
                        newName = params.addPrefix + oldName;
                    } else if (params.addSuffix) {
                        newName = oldName + params.addSuffix;
                    } else {
                        app.endUndoGroup();
                        return { success: false, message: "No new name specified for renaming" };
                    }
                    
                    layer.name = newName;
                    renamedLayers.push({ oldName: oldName, newName: newName });
                    renamedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Renamed " + renamedCount + " layers",
                    data: { 
                        renamedCount: renamedCount,
                        renamedLayers: renamedLayers
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error renaming layers: " + error.toString() };
            }
        }
    },

    "set_layer_properties": {
        description: "Set various properties of selected layers",
        parameters: {
            opacity: "number", // 0-100
            scale: "array", // [scaleX, scaleY] or [uniformScale]
            position: "array", // [x, y] or [x, y, z]
            rotation: "number", // degrees
            anchorPoint: "array", // [x, y, z]
            blendMode: "string", // blend mode name
            quality: "string", // "best", "draft", "wireframe"
            enabled: "boolean",
            locked: "boolean",
            shy: "boolean",
            solo: "boolean",
            threeDLayer: "boolean",
            motionBlur: "boolean",
            adjustmentLayer: "boolean",
            label: "number" // 0-16 label colors
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
                app.beginUndoGroup("AI: Set Layer Properties");
                var modifiedCount = 0;
                var changes = [];

                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    // Transform properties
                    if (params.opacity !== undefined && layer.transform && layer.transform.opacity) {
                        layer.transform.opacity.setValue(params.opacity);
                        changes.push("opacity: " + params.opacity + "%");
                    }
                    
                    if (params.scale && layer.transform && layer.transform.scale) {
                        if (params.scale.length === 1) {
                            layer.transform.scale.setValue([params.scale[0], params.scale[0]]);
                        } else {
                            layer.transform.scale.setValue(params.scale);
                        }
                        changes.push("scale: [" + params.scale.join(", ") + "]");
                    }
                    
                    if (params.position && layer.transform && layer.transform.position) {
                        layer.transform.position.setValue(params.position);
                        changes.push("position: [" + params.position.join(", ") + "]");
                    }
                    
                    if (params.rotation !== undefined && layer.transform && layer.transform.rotation) {
                        layer.transform.rotation.setValue(params.rotation);
                        changes.push("rotation: " + params.rotation + "°");
                    }
                    
                    if (params.anchorPoint && layer.transform && layer.transform.anchorPoint) {
                        layer.transform.anchorPoint.setValue(params.anchorPoint);
                        changes.push("anchorPoint: [" + params.anchorPoint.join(", ") + "]");
                    }
                    
                    // Layer properties
                    if (params.blendMode) {
                        try {
                            layer.blendingMode = this.getBlendMode(params.blendMode);
                            changes.push("blendMode: " + params.blendMode);
                        } catch (e) {
                            // Invalid blend mode, continue
                        }
                    }
                    
                    if (params.quality) {
                        switch (params.quality.toLowerCase()) {
                            case "best":
                                layer.quality = LayerQuality.BEST;
                                break;
                            case "draft":
                                layer.quality = LayerQuality.DRAFT;
                                break;
                            case "wireframe":
                                layer.quality = LayerQuality.WIREFRAME;
                                break;
                        }
                        changes.push("quality: " + params.quality);
                    }
                    
                    if (params.enabled !== undefined) {
                        layer.enabled = params.enabled;
                        changes.push("enabled: " + params.enabled);
                    }
                    
                    if (params.locked !== undefined) {
                        layer.locked = params.locked;
                        changes.push("locked: " + params.locked);
                    }
                    
                    if (params.shy !== undefined) {
                        layer.shy = params.shy;
                        changes.push("shy: " + params.shy);
                    }
                    
                    if (params.solo !== undefined) {
                        layer.solo = params.solo;
                        changes.push("solo: " + params.solo);
                    }
                    
                    if (params.threeDLayer !== undefined) {
                        layer.threeDLayer = params.threeDLayer;
                        changes.push("3D: " + params.threeDLayer);
                    }
                    
                    if (params.motionBlur !== undefined) {
                        layer.motionBlur = params.motionBlur;
                        changes.push("motionBlur: " + params.motionBlur);
                    }
                    
                    if (params.adjustmentLayer !== undefined && layer.adjustmentLayer !== undefined) {
                        layer.adjustmentLayer = params.adjustmentLayer;
                        changes.push("adjustmentLayer: " + params.adjustmentLayer);
                    }
                    
                    if (params.label !== undefined) {
                        layer.label = Math.max(0, Math.min(16, params.label));
                        changes.push("label: " + params.label);
                    }
                    
                    modifiedCount++;
                }

                app.endUndoGroup();
                return {
                    success: true,
                    message: "Modified properties on " + modifiedCount + " layers: " + changes.join(", "),
                    data: { layersModified: modifiedCount, changes: changes }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error setting layer properties: " + error.toString() };
            }
        },
        
        getBlendMode: function(modeName) {
            var modes = {
                "normal": BlendingMode.NORMAL,
                "add": BlendingMode.ADD,
                "alpha_add": BlendingMode.ALPHA_ADD,
                "classic_color_burn": BlendingMode.CLASSIC_COLOR_BURN,
                "classic_color_dodge": BlendingMode.CLASSIC_COLOR_DODGE,
                "classic_difference": BlendingMode.CLASSIC_DIFFERENCE,
                "color": BlendingMode.COLOR,
                "color_burn": BlendingMode.COLOR_BURN,
                "color_dodge": BlendingMode.COLOR_DODGE,
                "dancing_dissolve": BlendingMode.DANCING_DISSOLVE,
                "darken": BlendingMode.DARKEN,
                "darker_color": BlendingMode.DARKER_COLOR,
                "difference": BlendingMode.DIFFERENCE,
                "dissolve": BlendingMode.DISSOLVE,
                "divide": BlendingMode.DIVIDE,
                "exclusion": BlendingMode.EXCLUSION,
                "hard_light": BlendingMode.HARD_LIGHT,
                "hard_mix": BlendingMode.HARD_MIX,
                "hue": BlendingMode.HUE,
                "lighten": BlendingMode.LIGHTEN,
                "lighter_color": BlendingMode.LIGHTER_COLOR,
                "linear_burn": BlendingMode.LINEAR_BURN,
                "linear_dodge": BlendingMode.LINEAR_DODGE,
                "linear_light": BlendingMode.LINEAR_LIGHT,
                "luminescent_premul": BlendingMode.LUMINESCENT_PREMUL,
                "luminosity": BlendingMode.LUMINOSITY,
                "multiply": BlendingMode.MULTIPLY,
                "overlay": BlendingMode.OVERLAY,
                "pin_light": BlendingMode.PIN_LIGHT,
                "saturation": BlendingMode.SATURATION,
                "screen": BlendingMode.SCREEN,
                "silhouete_alpha": BlendingMode.SILHOUETE_ALPHA,
                "silhouette_luma": BlendingMode.SILHOUETTE_LUMA,
                "soft_light": BlendingMode.SOFT_LIGHT,
                "stencil_alpha": BlendingMode.STENCIL_ALPHA,
                "stencil_luma": BlendingMode.STENCIL_LUMA,
                "subtract": BlendingMode.SUBTRACT,
                "vivid_light": BlendingMode.VIVID_LIGHT
            };
            return modes[modeName.toLowerCase()] || BlendingMode.NORMAL;
        }
    },

    "organize_layers": {
        description: "Organize layers by various criteria",
        parameters: {
            method: "string", // "alphabetical", "type", "label", "duration", "size"
            reverse: "boolean",
            createNulls: "boolean", // create null parents for organization
            groupByType: "boolean"
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Organize Layers");
                
                var layers = [];
                for (var i = 1; i <= activeItem.numLayers; i++) {
                    layers.push(activeItem.layer(i));
                }
                
                var method = params.method || "alphabetical";
                var reverse = params.reverse || false;
                
                // Sort layers based on method
                switch (method.toLowerCase()) {
                    case "alphabetical":
                        layers.sort(function(a, b) {
                            return reverse ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
                        });
                        break;
                        
                    case "type":
                        layers.sort(function(a, b) {
                            var aType = this.getLayerType(a);
                            var bType = this.getLayerType(b);
                            return reverse ? bType.localeCompare(aType) : aType.localeCompare(bType);
                        }.bind(this));
                        break;
                        
                    case "label":
                        layers.sort(function(a, b) {
                            return reverse ? b.label - a.label : a.label - b.label;
                        });
                        break;
                        
                    case "duration":
                        layers.sort(function(a, b) {
                            var aDur = a.outPoint - a.inPoint;
                            var bDur = b.outPoint - b.inPoint;
                            return reverse ? bDur - aDur : aDur - bDur;
                        });
                        break;
                }
                
                // Reorder layers
                for (var j = 0; j < layers.length; j++) {
                    layers[j].moveToBeginning();
                }
                
                // Create organizing nulls if requested
                if (params.createNulls && params.groupByType) {
                    this.createTypeGroupNulls(activeItem);
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Organized " + layers.length + " layers by " + method,
                    data: { layersOrganized: layers.length, method: method }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error organizing layers: " + error.toString() };
            }
        },
        
        getLayerType: function(layer) {
            if (layer instanceof TextLayer) return "text";
            if (layer instanceof ShapeLayer) return "shape";
            if (layer instanceof CameraLayer) return "camera";
            if (layer instanceof LightLayer) return "light";
            if (layer.nullLayer) return "null";
            if (layer.adjustmentLayer) return "adjustment";
            if (layer.source && layer.source instanceof SolidSource) return "solid";
            return "footage";
        },
        
        createTypeGroupNulls: function(comp) {
            var typeGroups = {};
            
            // Group layers by type
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                var type = this.getLayerType(layer);
                
                if (!typeGroups[type]) {
                    typeGroups[type] = [];
                }
                typeGroups[type].push(layer);
            }
            
            // Create null for each type with multiple layers
            for (var type in typeGroups) {
                if (typeGroups[type].length > 1) {
                    var nullLayer = comp.layers.addNull();
                    nullLayer.name = type.toUpperCase() + " GROUP";
                    nullLayer.label = 5; // Red
                    nullLayer.moveToBeginning();
                    
                    // Parent all layers of this type to the null
                    for (var j = 0; j < typeGroups[type].length; j++) {
                        typeGroups[type][j].parent = nullLayer;
                    }
                }
            }
        }
    },

    "align_layers": {
        description: "Align selected layers to each other or to composition",
        parameters: {
            horizontal: "string", // "left", "center", "right", "distribute"
            vertical: "string", // "top", "center", "bottom", "distribute"
            relativeTo: "string", // "composition", "selection", "key"
            useAnchorPoint: "boolean" // align by anchor point instead of layer bounds
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length < 2) {
                return { success: false, message: "Need at least 2 layers selected for alignment" };
            }

            try {
                app.beginUndoGroup("AI: Align Layers");
                
                var relativeTo = params.relativeTo || "selection";
                var useAnchorPoint = params.useAnchorPoint || false;
                
                var bounds = this.getAlignmentBounds(selectedLayers, activeItem, relativeTo, useAnchorPoint);
                var alignedCount = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    if (!layer.transform || !layer.transform.position) continue;
                    
                    var currentPos = layer.transform.position.value;
                    var newPos = [currentPos[0], currentPos[1]];
                    
                    // Horizontal alignment
                    if (params.horizontal) {
                        switch (params.horizontal.toLowerCase()) {
                            case "left":
                                newPos[0] = bounds.left;
                                break;
                            case "center":
                                newPos[0] = bounds.centerX;
                                break;
                            case "right":
                                newPos[0] = bounds.right;
                                break;
                            case "distribute":
                                if (selectedLayers.length > 2) {
                                    var spacing = (bounds.right - bounds.left) / (selectedLayers.length - 1);
                                    newPos[0] = bounds.left + (spacing * i);
                                }
                                break;
                        }
                    }
                    
                    // Vertical alignment
                    if (params.vertical) {
                        switch (params.vertical.toLowerCase()) {
                            case "top":
                                newPos[1] = bounds.top;
                                break;
                            case "center":
                                newPos[1] = bounds.centerY;
                                break;
                            case "bottom":
                                newPos[1] = bounds.bottom;
                                break;
                            case "distribute":
                                if (selectedLayers.length > 2) {
                                    var spacing = (bounds.bottom - bounds.top) / (selectedLayers.length - 1);
                                    newPos[1] = bounds.top + (spacing * i);
                                }
                                break;
                        }
                    }
                    
                    layer.transform.position.setValue(newPos);
                    alignedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Aligned " + alignedCount + " layers" + 
                            (params.horizontal ? " horizontally (" + params.horizontal + ")" : "") +
                            (params.vertical ? " vertically (" + params.vertical + ")" : ""),
                    data: { layersAligned: alignedCount, horizontal: params.horizontal, vertical: params.vertical }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error aligning layers: " + error.toString() };
            }
        },
        
        getAlignmentBounds: function(layers, comp, relativeTo, useAnchorPoint) {
            if (relativeTo === "composition") {
                return {
                    left: 0,
                    right: comp.width,
                    top: 0,
                    bottom: comp.height,
                    centerX: comp.width / 2,
                    centerY: comp.height / 2
                };
            }
            
            // Calculate bounds from selection
            var bounds = {
                left: Infinity,
                right: -Infinity,
                top: Infinity,
                bottom: -Infinity
            };
            
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                if (!layer.transform || !layer.transform.position) continue;
                
                var pos = layer.transform.position.value;
                var x = pos[0];
                var y = pos[1];
                
                if (!useAnchorPoint && layer.sourceRectAtTime) {
                    // Use layer bounds
                    var rect = layer.sourceRectAtTime(comp.time, false);
                    var left = x + rect.left;
                    var right = x + rect.left + rect.width;
                    var top = y + rect.top;
                    var bottom = y + rect.top + rect.height;
                    
                    bounds.left = Math.min(bounds.left, left);
                    bounds.right = Math.max(bounds.right, right);
                    bounds.top = Math.min(bounds.top, top);
                    bounds.bottom = Math.max(bounds.bottom, bottom);
                } else {
                    // Use anchor points
                    bounds.left = Math.min(bounds.left, x);
                    bounds.right = Math.max(bounds.right, x);
                    bounds.top = Math.min(bounds.top, y);
                    bounds.bottom = Math.max(bounds.bottom, y);
                }
            }
            
            bounds.centerX = (bounds.left + bounds.right) / 2;
            bounds.centerY = (bounds.top + bounds.bottom) / 2;
            
            return bounds;
        }
    },

    "parent_layers": {
        description: "Set parent-child relationships between layers",
        parameters: {
            parentName: "string", // name of parent layer
            parentIndex: "number", // index of parent layer
            children: "array", // array of child layer names or indices
            createNull: "boolean", // create a null as parent if parent not found
            nullName: "string" // name for created null
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Parent Layers");
                
                var parentLayer = null;
                var childrenParented = 0;
                
                // Find or create parent layer
                if (params.parentName) {
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        var layer = activeItem.layer(i);
                        if (layer.name === params.parentName) {
                            parentLayer = layer;
                            break;
                        }
                    }
                } else if (params.parentIndex) {
                    try {
                        parentLayer = activeItem.layer(params.parentIndex);
                    } catch (e) {
                        // Invalid index
                    }
                }
                
                // Create null parent if requested and parent not found
                if (!parentLayer && params.createNull) {
                    parentLayer = activeItem.layers.addNull();
                    parentLayer.name = params.nullName || "Parent Null";
                    parentLayer.label = 5; // Red
                }
                
                if (!parentLayer) {
                    app.endUndoGroup();
                    return { success: false, message: "Parent layer not found" };
                }
                
                // Parent the children
                var childLayers = [];
                
                if (params.children && params.children.length > 0) {
                    // Use specified children
                    for (var j = 0; j < params.children.length; j++) {
                        var child = params.children[j];
                        var childLayer = null;
                        
                        if (typeof child === "string") {
                            // Find by name
                            for (var k = 1; k <= activeItem.numLayers; k++) {
                                var layer = activeItem.layer(k);
                                if (layer.name === child) {
                                    childLayer = layer;
                                    break;
                                }
                            }
                        } else if (typeof child === "number") {
                            // Use index
                            try {
                                childLayer = activeItem.layer(child);
                            } catch (e) {
                                // Invalid index
                            }
                        }
                        
                        if (childLayer && childLayer !== parentLayer) {
                            childLayers.push(childLayer);
                        }
                    }
                } else {
                    // Use selected layers as children
                    var selectedLayers = activeItem.selectedLayers;
                    for (var l = 0; l < selectedLayers.length; l++) {
                        if (selectedLayers[l] !== parentLayer) {
                            childLayers.push(selectedLayers[l]);
                        }
                    }
                }
                
                // Apply parenting
                for (var m = 0; m < childLayers.length; m++) {
                    childLayers[m].setParentWithJump(parentLayer);
                    childrenParented++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Parented " + childrenParented + " layers to " + parentLayer.name,
                    data: { 
                        parentName: parentLayer.name,
                        childrenParented: childrenParented,
                        parentCreated: params.createNull && !params.parentName && !params.parentIndex
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error parenting layers: " + error.toString() };
            }
        }
    },

    "delete_selected_layers": {
        description: "Delete currently selected layers",
        parameters: {
            confirmDeletion: "boolean", // require confirmation for safety
            skipLocked: "boolean" // skip locked layers instead of unlocking
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected for deletion" };
            }

            try {
                app.beginUndoGroup("AI: Delete Selected Layers");
                
                var deletedCount = 0;
                var skippedCount = 0;
                var layerNames = [];

                // Store layer names before deletion
                for (var i = 0; i < selectedLayers.length; i++) {
                    layerNames.push(selectedLayers[i].name);
                }

                // Delete layers (in reverse order to maintain indices)
                for (var j = selectedLayers.length - 1; j >= 0; j--) {
                    var layer = selectedLayers[j];
                    
                    if (layer.locked && params.skipLocked) {
                        skippedCount++;
                        continue;
                    }
                    
                    // Unlock if locked and not skipping
                    if (layer.locked) {
                        layer.locked = false;
                    }
                    
                    layer.remove();
                    deletedCount++;
                }

                app.endUndoGroup();
                
                var message = "Deleted " + deletedCount + " layers";
                if (skippedCount > 0) {
                    message += " (skipped " + skippedCount + " locked layers)";
                }
                
                return {
                    success: true,
                    message: message,
                    data: { 
                        deletedCount: deletedCount, 
                        skippedCount: skippedCount,
                        deletedLayers: layerNames.slice(0, deletedCount)
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting layers: " + error.toString() };
            }
        }
    },

    "delete_layers_by_name": {
        description: "Delete layers by name (supports partial matching and case-insensitive search)",
        parameters: {
            layerNames: "array", // array of layer names to delete
            partialMatch: "boolean", // allow partial name matching
            caseSensitive: "boolean", // case sensitive matching
            unlockLayers: "boolean" // unlock locked layers before deletion
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            if (!params.layerNames || params.layerNames.length === 0) {
                return { success: false, message: "No layer names specified for deletion" };
            }

            try {
                app.beginUndoGroup("AI: Delete Layers by Name");
                
                var deletedCount = 0;
                var deletedLayers = [];
                var caseSensitive = params.caseSensitive !== false; // default true
                var partialMatch = params.partialMatch || false;
                var unlockLayers = params.unlockLayers !== false; // default true

                // Convert search names for case-insensitive matching
                var searchNames = [];
                for (var n = 0; n < params.layerNames.length; n++) {
                    searchNames.push(caseSensitive ? params.layerNames[n] : params.layerNames[n].toLowerCase());
                }

                // Find and delete matching layers (in reverse order)
                for (var i = activeItem.numLayers; i >= 1; i--) {
                    var layer = activeItem.layer(i);
                    var layerName = caseSensitive ? layer.name : layer.name.toLowerCase();
                    var shouldDelete = false;

                    // Check if layer name matches any search criteria
                    for (var j = 0; j < searchNames.length; j++) {
                        var searchName = searchNames[j];
                        
                        if (partialMatch) {
                            if (layerName.indexOf(searchName) !== -1) {
                                shouldDelete = true;
                                break;
                            }
                        } else {
                            if (layerName === searchName) {
                                shouldDelete = true;
                                break;
                            }
                        }
                    }

                    if (shouldDelete) {
                        // Unlock if locked and unlocking is enabled
                        if (layer.locked && unlockLayers) {
                            layer.locked = false;
                        }
                        
                        // Skip if still locked
                        if (layer.locked) {
                            continue;
                        }
                        
                        deletedLayers.push(layer.name);
                        layer.remove();
                        deletedCount++;
                    }
                }

                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " layers matching specified names",
                    data: { 
                        deletedCount: deletedCount,
                        deletedLayers: deletedLayers,
                        searchCriteria: params.layerNames
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting layers by name: " + error.toString() };
            }
        }
    },

    "delete_layers_by_type": {
        description: "Delete layers by type (solid, text, shape, null, adjustment, etc.)",
        parameters: {
            layerTypes: "array", // array of layer types to delete
            excludeNames: "array", // layer names to exclude from deletion
            unlockLayers: "boolean" // unlock locked layers before deletion
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            if (!params.layerTypes || params.layerTypes.length === 0) {
                return { success: false, message: "No layer types specified for deletion" };
            }

            try {
                app.beginUndoGroup("AI: Delete Layers by Type");
                
                var deletedCount = 0;
                var deletedLayers = [];
                var unlockLayers = params.unlockLayers !== false; // default true
                var excludeNames = params.excludeNames || [];

                // Convert exclude names to lowercase for case-insensitive matching
                var excludeNamesLower = [];
                for (var e = 0; e < excludeNames.length; e++) {
                    excludeNamesLower.push(excludeNames[e].toLowerCase());
                }

                // Convert layer types to lowercase for matching
                var targetTypes = [];
                for (var t = 0; t < params.layerTypes.length; t++) {
                    targetTypes.push(params.layerTypes[t].toLowerCase());
                }

                // Find and delete matching layers (in reverse order)
                for (var i = activeItem.numLayers; i >= 1; i--) {
                    var layer = activeItem.layer(i);
                    
                    // Check if layer should be excluded
                    var shouldExclude = false;
                    for (var ex = 0; ex < excludeNamesLower.length; ex++) {
                        if (layer.name.toLowerCase() === excludeNamesLower[ex]) {
                            shouldExclude = true;
                            break;
                        }
                    }
                    
                    if (shouldExclude) continue;

                    // Determine layer type
                    var layerType = this.getLayerType(layer).toLowerCase();
                    
                    // Check if layer type matches deletion criteria
                    var shouldDelete = false;
                    for (var tt = 0; tt < targetTypes.length; tt++) {
                        if (layerType === targetTypes[tt]) {
                            shouldDelete = true;
                            break;
                        }
                    }

                    if (shouldDelete) {
                        // Unlock if locked and unlocking is enabled
                        if (layer.locked && unlockLayers) {
                            layer.locked = false;
                        }
                        
                        // Skip if still locked
                        if (layer.locked) {
                            continue;
                        }
                        
                        deletedLayers.push({ name: layer.name, type: layerType });
                        layer.remove();
                        deletedCount++;
                    }
                }

                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " layers of specified types",
                    data: { 
                        deletedCount: deletedCount,
                        deletedLayers: deletedLayers,
                        targetTypes: params.layerTypes
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting layers by type: " + error.toString() };
            }
        }
    },

    "delete_empty_layers": {
        description: "Delete layers that are empty or have no visible content",
        parameters: {
            includeNulls: "boolean", // include null objects in deletion
            includeEmptyShapes: "boolean", // include shape layers with no paths
            includeEmptyText: "boolean", // include text layers with no text
            unlockLayers: "boolean" // unlock locked layers before deletion
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Delete Empty Layers");
                
                var deletedCount = 0;
                var deletedLayers = [];
                var unlockLayers = params.unlockLayers !== false; // default true

                // Find and delete empty layers (in reverse order)
                for (var i = activeItem.numLayers; i >= 1; i--) {
                    var layer = activeItem.layer(i);
                    var shouldDelete = false;
                    var reason = "";

                    // Check different types of "empty" layers
                    if (layer instanceof TextLayer && params.includeEmptyText) {
                        try {
                            var textProp = layer.property("Source Text");
                            if (textProp && (!textProp.value.text || textProp.value.text.length === 0)) {
                                shouldDelete = true;
                                reason = "empty text";
                            }
                        } catch (e) {
                            // Text property might not be accessible
                        }
                    }
                    
                    if (layer instanceof ShapeLayer && params.includeEmptyShapes) {
                        try {
                            var contents = layer.property("Contents");
                            if (contents && contents.numProperties === 0) {
                                shouldDelete = true;
                                reason = "empty shape";
                            }
                        } catch (e) {
                            // Shape contents might not be accessible
                        }
                    }
                    
                    if (layer.nullLayer && params.includeNulls) {
                        // Check if null has any children
                        var hasChildren = false;
                        for (var j = 1; j <= activeItem.numLayers; j++) {
                            if (j !== i && activeItem.layer(j).parent === layer) {
                                hasChildren = true;
                                break;
                            }
                        }
                        if (!hasChildren) {
                            shouldDelete = true;
                            reason = "unused null";
                        }
                    }

                    if (shouldDelete) {
                        // Unlock if locked and unlocking is enabled
                        if (layer.locked && unlockLayers) {
                            layer.locked = false;
                        }
                        
                        // Skip if still locked
                        if (layer.locked) {
                            continue;
                        }
                        
                        deletedLayers.push({ name: layer.name, reason: reason });
                        layer.remove();
                        deletedCount++;
                    }
                }

                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " empty layers",
                    data: { 
                        deletedCount: deletedCount,
                        deletedLayers: deletedLayers
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting empty layers: " + error.toString() };
            }
        }
    },

    "delete_layers_by_label": {
        description: "Delete layers by label color",
        parameters: {
            labelColors: "array", // array of label color numbers (0-16)
            unlockLayers: "boolean" // unlock locked layers before deletion
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            if (!params.labelColors || params.labelColors.length === 0) {
                return { success: false, message: "No label colors specified for deletion" };
            }

            try {
                app.beginUndoGroup("AI: Delete Layers by Label");
                
                var deletedCount = 0;
                var deletedLayers = [];
                var unlockLayers = params.unlockLayers !== false; // default true

                // Find and delete layers with matching labels (in reverse order)
                for (var i = activeItem.numLayers; i >= 1; i--) {
                    var layer = activeItem.layer(i);
                    
                    // Check if layer label matches deletion criteria
                    var shouldDelete = false;
                    for (var l = 0; l < params.labelColors.length; l++) {
                        if (layer.label === params.labelColors[l]) {
                            shouldDelete = true;
                            break;
                        }
                    }

                    if (shouldDelete) {
                        // Unlock if locked and unlocking is enabled
                        if (layer.locked && unlockLayers) {
                            layer.locked = false;
                        }
                        
                        // Skip if still locked
                        if (layer.locked) {
                            continue;
                        }
                        
                        deletedLayers.push({ name: layer.name, label: layer.label });
                        layer.remove();
                        deletedCount++;
                    }
                }

                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " layers with specified label colors",
                    data: { 
                        deletedCount: deletedCount,
                        deletedLayers: deletedLayers,
                        targetLabels: params.labelColors
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting layers by label: " + error.toString() };
            }
        }
    },

    "delete_all_layers": {
        description: "Delete all layers in the composition (USE WITH EXTREME CAUTION)",
        parameters: {
            confirmDeletion: "boolean", // safety confirmation required
            excludeNames: "array", // layer names to exclude from deletion
            excludeTypes: "array", // layer types to exclude from deletion
            unlockLayers: "boolean" // unlock locked layers before deletion
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            // Safety check - require explicit confirmation
            if (!params.confirmDeletion) {
                return { 
                    success: false, 
                    message: "Confirmation required: set confirmDeletion to true to delete all layers" 
                };
            }

            try {
                app.beginUndoGroup("AI: Delete All Layers");
                
                var deletedCount = 0;
                var skippedCount = 0;
                var deletedLayers = [];
                var unlockLayers = params.unlockLayers !== false; // default true
                var excludeNames = params.excludeNames || [];
                var excludeTypes = params.excludeTypes || [];

                // Convert exclude arrays to lowercase for matching
                var excludeNamesLower = [];
                for (var en = 0; en < excludeNames.length; en++) {
                    excludeNamesLower.push(excludeNames[en].toLowerCase());
                }
                var excludeTypesLower = [];
                for (var et = 0; et < excludeTypes.length; et++) {
                    excludeTypesLower.push(excludeTypes[et].toLowerCase());
                }

                // Delete all layers (in reverse order)
                for (var i = activeItem.numLayers; i >= 1; i--) {
                    var layer = activeItem.layer(i);
                    var shouldSkip = false;

                    // Check name exclusions
                    for (var ne = 0; ne < excludeNamesLower.length; ne++) {
                        if (layer.name.toLowerCase() === excludeNamesLower[ne]) {
                            shouldSkip = true;
                            break;
                        }
                    }

                    // Check type exclusions
                    if (!shouldSkip) {
                        var layerType = this.getLayerType(layer).toLowerCase();
                        for (var te = 0; te < excludeTypesLower.length; te++) {
                            if (layerType === excludeTypesLower[te]) {
                                shouldSkip = true;
                                break;
                            }
                        }
                    }

                    if (shouldSkip) {
                        skippedCount++;
                        continue;
                    }

                    // Unlock if locked and unlocking is enabled
                    if (layer.locked && unlockLayers) {
                        layer.locked = false;
                    }
                    
                    // Skip if still locked
                    if (layer.locked) {
                        skippedCount++;
                        continue;
                    }
                    
                    deletedLayers.push(layer.name);
                    layer.remove();
                    deletedCount++;
                }

                app.endUndoGroup();
                
                var message = "Deleted " + deletedCount + " layers";
                if (skippedCount > 0) {
                    message += " (skipped " + skippedCount + " excluded/locked layers)";
                }
                
                return {
                    success: true,
                    message: message,
                    data: { 
                        deletedCount: deletedCount,
                        skippedCount: skippedCount,
                        deletedLayers: deletedLayers
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting all layers: " + error.toString() };
            }
        }
    },

    "select_layers": {
        description: "Select layers by pattern, names, or type for use with tools that require selected layers",
        parameters: {
            pattern: "string", // pattern to match in layer names
            names: "array", // specific layer names to select
            type: "string", // "shape", "text", "null", "solid", "camera", "light"
            selectAll: "boolean", // select all layers
            clearSelection: "boolean" // clear existing selection first (default: true)
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Select Layers");
                
                var selectedCount = 0;
                var selectedNames = [];
                
                // Clear existing selection if requested (default: true)
                if (params.clearSelection !== false) {
                    for (var c = 1; c <= activeItem.numLayers; c++) {
                        activeItem.layer(c).selected = false;
                    }
                }
                
                // Select all layers
                if (params.selectAll) {
                    for (var a = 1; a <= activeItem.numLayers; a++) {
                        var allLayer = activeItem.layer(a);
                        allLayer.selected = true;
                        selectedCount++;
                        selectedNames.push(allLayer.name);
                    }
                } else {
                    // Select by pattern, names, or type
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        var layer = activeItem.layer(i);
                        var shouldSelect = false;
                        
                        // Check pattern match
                        if (params.pattern) {
                            if (layer.name.toLowerCase().indexOf(params.pattern.toLowerCase()) !== -1) {
                                shouldSelect = true;
                            }
                        }
                        
                        // Check specific names
                        if (params.names) {
                            for (var j = 0; j < params.names.length; j++) {
                                if (layer.name.toLowerCase() === params.names[j].toLowerCase()) {
                                    shouldSelect = true;
                                    break;
                                }
                            }
                        }
                        
                        // Check layer type
                        if (params.type) {
                            var layerType = params.type.toLowerCase();
                            var matches = (layerType === "shape" && layer instanceof ShapeLayer) ||
                                         (layerType === "text" && layer instanceof TextLayer) ||
                                         (layerType === "null" && layer.nullLayer) ||
                                         (layerType === "solid" && layer instanceof AVLayer && layer.source && layer.source.mainSource instanceof SolidSource) ||
                                         (layerType === "camera" && layer instanceof CameraLayer) ||
                                         (layerType === "light" && layer instanceof LightLayer);
                            if (matches) {
                                shouldSelect = true;
                            }
                        }
                        
                        if (shouldSelect) {
                            layer.selected = true;
                            selectedCount++;
                            selectedNames.push(layer.name);
                        }
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Selected " + selectedCount + " layers",
                    data: { 
                        selectedCount: selectedCount,
                        selectedNames: selectedNames
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error selecting layers: " + error.toString() };
            }
        }
    },

    "delete_layers_by_index": {
        description: "Delete layers by their index numbers (more reliable than names for duplicate layer names)",
        parameters: {
            layerIndices: "array", // array of 1-based layer indices to delete
            confirmDeletion: "boolean" // must be true for safety
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            if (!params.layerIndices || !Array.isArray(params.layerIndices) || params.layerIndices.length === 0) {
                return { success: false, message: "layerIndices parameter is required and must be a non-empty array" };
            }

            if (!params.confirmDeletion) {
                return { success: false, message: "Confirmation required", hint: "Add confirmDeletion: true parameter to confirm deletion" };
            }

            try {
                app.beginUndoGroup("AI: Delete Layers by Index");
                
                // Sort indices in descending order to delete from highest to lowest
                // This prevents index shifting issues when deleting multiple layers
                var sortedIndices = params.layerIndices.slice().sort(function(a, b) { return b - a; });
                var deletedCount = 0;
                var deletedLayers = [];
                var errors = [];
                
                for (var i = 0; i < sortedIndices.length; i++) {
                    var layerIndex = sortedIndices[i];
                    
                    try {
                        // Validate index range
                        if (layerIndex < 1 || layerIndex > activeItem.numLayers) {
                            errors.push("Layer index " + layerIndex + " is out of range (1-" + activeItem.numLayers + ")");
                            continue;
                        }
                        
                        var layer = activeItem.layer(layerIndex);
                        var layerName = layer.name;
                        
                        // Remove the layer
                        layer.remove();
                        deletedCount++;
                        deletedLayers.push({
                            index: layerIndex,
                            name: layerName
                        });
                        
                    } catch (error) {
                        errors.push("Failed to delete layer at index " + layerIndex + ": " + error.toString());
                    }
                }
                
                app.endUndoGroup();
                
                if (deletedCount === 0) {
                    return { 
                        success: false, 
                        message: "No layers were deleted. Errors: " + errors.join("; ") 
                    };
                }
                
                var result = {
                    success: true,
                    message: "Deleted " + deletedCount + " layers by index",
                    data: { 
                        deletedCount: deletedCount,
                        deletedLayers: deletedLayers,
                        totalRequested: params.layerIndices.length
                    }
                };
                
                if (errors.length > 0) {
                    result.data.errors = errors;
                    result.message += " (with " + errors.length + " errors)";
                }
                
                return result;
                
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting layers by index: " + error.toString() };
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = LAYER_TOOLS;
} 