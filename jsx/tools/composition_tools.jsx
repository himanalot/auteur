/**
 * Composition Tools for AI Integration
 * Comprehensive composition creation and management
 */

var COMPOSITION_TOOLS = {
    "create_composition": {
        description: "Create a new composition with specified settings",
        parameters: {
            name: "string",
            width: "number",
            height: "number",
            duration: "number",
            frameRate: "number",
            pixelAspect: "number",
            backgroundColor: "array", // [r, g, b]
            preset: "string" // "HD", "4K", "Square", "Vertical", "Cinema"
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Create Composition");
                
                var settings = this.getPresetSettings(params.preset) || {};
                
                var comp = app.project.items.addComp(
                    params.name || "AI Composition",
                    params.width || settings.width || 1920,
                    params.height || settings.height || 1080,
                    params.pixelAspect || settings.pixelAspect || 1,
                    params.duration || settings.duration || 10,
                    params.frameRate || settings.frameRate || 30
                );
                
                if (params.backgroundColor || settings.backgroundColor) {
                    comp.bgColor = params.backgroundColor || settings.backgroundColor;
                } else {
                    comp.bgColor = [0.1, 0.1, 0.1]; // Default dark gray
                }
                
                comp.openInViewer();
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created composition: " + comp.name + " (" + comp.width + "x" + comp.height + ")",
                    data: { compId: comp.id, name: comp.name, width: comp.width, height: comp.height }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating composition: " + error.toString() };
            }
        },
        
        getPresetSettings: function(preset) {
            var presets = {
                "HD": { width: 1920, height: 1080, frameRate: 30 },
                "4K": { width: 3840, height: 2160, frameRate: 30 },
                "4K_24": { width: 3840, height: 2160, frameRate: 24 },
                "Square": { width: 1080, height: 1080, frameRate: 30 },
                "Vertical": { width: 1080, height: 1920, frameRate: 30 },
                "Cinema": { width: 2048, height: 858, frameRate: 24 },
                "Cinema_4K": { width: 4096, height: 1716, frameRate: 24 },
                "NTSC": { width: 720, height: 480, frameRate: 29.97 },
                "PAL": { width: 720, height: 576, frameRate: 25 },
                "Web": { width: 1280, height: 720, frameRate: 30 },
                "Instagram_Square": { width: 1080, height: 1080, frameRate: 30 },
                "Instagram_Story": { width: 1080, height: 1920, frameRate: 30 },
                "YouTube": { width: 1920, height: 1080, frameRate: 30 },
                "TikTok": { width: 1080, height: 1920, frameRate: 30 }
            };
            return presets[preset];
        }
    },

    "duplicate_composition": {
        description: "Duplicate the active composition or specified composition",
        parameters: {
            compName: "string", // optional composition name
            newName: "string",
            includeFootage: "boolean"
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Duplicate Composition");
                
                var sourceComp;
                
                if (params.compName) {
                    // Find composition by name
                    for (var i = 1; i <= app.project.numItems; i++) {
                        var item = app.project.item(i);
                        if (item instanceof CompItem && item.name === params.compName) {
                            sourceComp = item;
                            break;
                        }
                    }
                    if (!sourceComp) {
                        app.endUndoGroup();
                        return { success: false, message: "Composition not found: " + params.compName };
                    }
                } else {
                    // Use active composition
                    sourceComp = app.project.activeItem;
                    if (!sourceComp || !(sourceComp instanceof CompItem)) {
                        app.endUndoGroup();
                        return { success: false, message: "No active composition found" };
                    }
                }
                
                var duplicate = sourceComp.duplicate();
                if (params.newName) {
                    duplicate.name = params.newName;
                } else {
                    duplicate.name = sourceComp.name + " Copy";
                }
                
                duplicate.openInViewer();
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Duplicated composition: " + duplicate.name,
                    data: { originalName: sourceComp.name, duplicateName: duplicate.name, compId: duplicate.id }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error duplicating composition: " + error.toString() };
            }
        }
    },

    "set_composition_settings": {
        description: "Modify settings of the active composition",
        parameters: {
            width: "number",
            height: "number",
            duration: "number",
            frameRate: "number",
            backgroundColor: "array",
            pixelAspect: "number",
            workAreaStart: "number",
            workAreaDuration: "number",
            shutterAngle: "number",
            shutterPhase: "number",
            motionBlur: "boolean",
            frameBlending: "boolean",
            preserveNestedFrameRate: "boolean",
            preserveNestedResolution: "boolean"
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Set Composition Settings");
                
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    app.endUndoGroup();
                    return { success: false, message: "No active composition found" };
                }
                
                var changes = [];
                
                if (params.width && params.width !== comp.width) {
                    comp.width = params.width;
                    changes.push("width: " + params.width);
                }
                
                if (params.height && params.height !== comp.height) {
                    comp.height = params.height;
                    changes.push("height: " + params.height);
                }
                
                if (params.duration && params.duration !== comp.duration) {
                    comp.duration = params.duration;
                    changes.push("duration: " + params.duration + "s");
                }
                
                if (params.frameRate && params.frameRate !== comp.frameRate) {
                    comp.frameRate = params.frameRate;
                    changes.push("frameRate: " + params.frameRate);
                }
                
                if (params.backgroundColor) {
                    comp.bgColor = params.backgroundColor;
                    changes.push("backgroundColor: [" + params.backgroundColor.join(", ") + "]");
                }
                
                if (params.pixelAspect && params.pixelAspect !== comp.pixelAspect) {
                    comp.pixelAspect = params.pixelAspect;
                    changes.push("pixelAspect: " + params.pixelAspect);
                }
                
                if (params.workAreaStart !== undefined) {
                    comp.workAreaStart = params.workAreaStart;
                    changes.push("workAreaStart: " + params.workAreaStart + "s");
                }
                
                if (params.workAreaDuration !== undefined) {
                    comp.workAreaDuration = params.workAreaDuration;
                    changes.push("workAreaDuration: " + params.workAreaDuration + "s");
                }
                
                if (params.shutterAngle !== undefined) {
                    comp.shutterAngle = params.shutterAngle;
                    changes.push("shutterAngle: " + params.shutterAngle + "°");
                }
                
                if (params.shutterPhase !== undefined) {
                    comp.shutterPhase = params.shutterPhase;
                    changes.push("shutterPhase: " + params.shutterPhase + "°");
                }
                
                if (params.motionBlur !== undefined) {
                    comp.motionBlur = params.motionBlur;
                    changes.push("motionBlur: " + params.motionBlur);
                }
                
                if (params.frameBlending !== undefined) {
                    comp.frameBlending = params.frameBlending;
                    changes.push("frameBlending: " + params.frameBlending);
                }
                
                if (params.preserveNestedFrameRate !== undefined) {
                    comp.preserveNestedFrameRate = params.preserveNestedFrameRate;
                    changes.push("preserveNestedFrameRate: " + params.preserveNestedFrameRate);
                }
                
                if (params.preserveNestedResolution !== undefined) {
                    comp.preserveNestedResolution = params.preserveNestedResolution;
                    changes.push("preserveNestedResolution: " + params.preserveNestedResolution);
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Updated composition settings: " + changes.join(", "),
                    data: { compName: comp.name, changes: changes }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error setting composition settings: " + error.toString() };
            }
        }
    },

    "trim_composition_to_work_area": {
        description: "Trim composition duration to match work area",
        parameters: {},
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Trim Composition to Work Area");
                
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    app.endUndoGroup();
                    return { success: false, message: "No active composition found" };
                }
                
                var originalDuration = comp.duration;
                var workAreaEnd = comp.workAreaStart + comp.workAreaDuration;
                
                comp.duration = workAreaEnd;
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Trimmed composition from " + originalDuration.toFixed(2) + "s to " + workAreaEnd.toFixed(2) + "s",
                    data: { 
                        compName: comp.name, 
                        originalDuration: originalDuration, 
                        newDuration: workAreaEnd 
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error trimming composition: " + error.toString() };
            }
        }
    },

    "crop_composition_to_region": {
        description: "Crop composition to a specific region",
        parameters: {
            left: "number",
            top: "number",
            width: "number",
            height: "number"
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Crop Composition");
                
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    app.endUndoGroup();
                    return { success: false, message: "No active composition found" };
                }
                
                if (!params.width || !params.height) {
                    app.endUndoGroup();
                    return { success: false, message: "Width and height are required for cropping" };
                }
                
                var originalWidth = comp.width;
                var originalHeight = comp.height;
                
                // Create crop region
                var cropLeft = params.left || 0;
                var cropTop = params.top || 0;
                var cropWidth = params.width;
                var cropHeight = params.height;
                
                // Update composition size
                comp.width = cropWidth;
                comp.height = cropHeight;
                
                // Adjust all layers to account for crop
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (layer.transform && layer.transform.position) {
                        var currentPos = layer.transform.position.value;
                        layer.transform.position.setValue([
                            currentPos[0] - cropLeft,
                            currentPos[1] - cropTop
                        ]);
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Cropped composition from " + originalWidth + "x" + originalHeight + " to " + cropWidth + "x" + cropHeight,
                    data: { 
                        compName: comp.name,
                        originalSize: [originalWidth, originalHeight],
                        newSize: [cropWidth, cropHeight],
                        cropRegion: [cropLeft, cropTop, cropWidth, cropHeight]
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error cropping composition: " + error.toString() };
            }
        }
    },

    "add_composition_marker": {
        description: "Add a marker to the composition timeline",
        parameters: {
            time: "number", // time in seconds
            comment: "string",
            duration: "number", // optional duration for chapter markers
            chapter: "string", // chapter name
            url: "string", // web link
            frameTarget: "string" // frame target for web links
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Add Composition Marker");
                
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    app.endUndoGroup();
                    return { success: false, message: "No active composition found" };
                }
                
                var markerTime = params.time || comp.time;
                var marker = new MarkerValue(params.comment || "");
                
                if (params.duration) {
                    marker.duration = params.duration;
                }
                
                if (params.chapter) {
                    marker.chapter = params.chapter;
                }
                
                if (params.url) {
                    marker.url = params.url;
                    if (params.frameTarget) {
                        marker.frameTarget = params.frameTarget;
                    }
                }
                
                comp.markerProperty.setValueAtTime(markerTime, marker);
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Added marker at " + markerTime.toFixed(2) + "s" + (params.comment ? ": " + params.comment : ""),
                    data: { 
                        compName: comp.name,
                        markerTime: markerTime,
                        comment: params.comment
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error adding composition marker: " + error.toString() };
            }
        }
    },

    "save_frame_as_image": {
        description: "Save current frame or specified time as image",
        parameters: {
            time: "number", // time in seconds
            filePath: "string",
            format: "string", // "PNG", "JPEG", "TIFF"
            quality: "number" // for JPEG (1-100)
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Save Frame as Image");
                
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    app.endUndoGroup();
                    return { success: false, message: "No active composition found" };
                }
                
                var saveTime = params.time !== undefined ? params.time : comp.time;
                var format = params.format || "PNG";
                var filePath = params.filePath;
                
                if (!filePath) {
                    // Generate default filename
                    var timeString = ("0000" + Math.floor(saveTime * comp.frameRate)).slice(-4);
                    filePath = "~/Desktop/" + comp.name + "_frame_" + timeString + "." + format.toLowerCase();
                }
                
                var saveFile = new File(filePath);
                
                if (format.toLowerCase() === "png") {
                    comp.saveFrameToPng(saveTime, saveFile);
                } else {
                    // For other formats, we'd need to use render queue
                    // This is a simplified implementation
                    comp.saveFrameToPng(saveTime, saveFile);
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Saved frame at " + saveTime.toFixed(2) + "s to " + saveFile.fsName,
                    data: { 
                        compName: comp.name,
                        saveTime: saveTime,
                        filePath: saveFile.fsName,
                        format: format
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error saving frame: " + error.toString() };
            }
        }
    },

    "create_comp_from_layers": {
        description: "Create a new composition from selected layers",
        parameters: {
            compName: "string",
            duration: "number", // optional, will use layer duration if not specified
            moveAllAttributes: "boolean" // precompose style
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Create Comp from Layers");
                
                var sourceComp = app.project.activeItem;
                if (!sourceComp || !(sourceComp instanceof CompItem)) {
                    app.endUndoGroup();
                    return { success: false, message: "No active composition found" };
                }
                
                var selectedLayers = sourceComp.selectedLayers;
                if (selectedLayers.length === 0) {
                    app.endUndoGroup();
                    return { success: false, message: "No layers selected" };
                }
                
                var compName = params.compName || "Comp from Layers";
                var duration = params.duration || sourceComp.duration;
                
                // Create new composition
                var newComp = app.project.items.addComp(
                    compName,
                    sourceComp.width,
                    sourceComp.height,
                    sourceComp.pixelAspect,
                    duration,
                    sourceComp.frameRate
                );
                
                newComp.bgColor = sourceComp.bgColor;
                
                // Copy selected layers to new comp
                for (var i = 0; i < selectedLayers.length; i++) {
                    selectedLayers[i].copyToComp(newComp);
                }
                
                newComp.openInViewer();
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created composition '" + compName + "' from " + selectedLayers.length + " layers",
                    data: { 
                        compName: compName,
                        compId: newComp.id,
                        layersCopied: selectedLayers.length
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating comp from layers: " + error.toString() };
            }
        }
    },

    "delete_selected_compositions": {
        description: "Delete currently selected compositions from the project",
        parameters: {
            confirmDeletion: "boolean" // safety confirmation required
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Delete Selected Compositions");
                
                var selectedItems = app.project.selection;
                var compsToDelete = [];
                
                // Filter selected items to compositions only
                for (var i = 0; i < selectedItems.length; i++) {
                    if (selectedItems[i] instanceof CompItem) {
                        compsToDelete.push(selectedItems[i]);
                    }
                }
                
                if (compsToDelete.length === 0) {
                    app.endUndoGroup();
                    return { success: false, message: "No compositions selected for deletion" };
                }
                
                var deletedCount = 0;
                var deletedNames = [];
                
                // Delete compositions (in reverse order to maintain indices)
                for (var j = compsToDelete.length - 1; j >= 0; j--) {
                    var comp = compsToDelete[j];
                    deletedNames.push(comp.name);
                    comp.remove();
                    deletedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " compositions",
                    data: { 
                        deletedCount: deletedCount,
                        deletedCompositions: deletedNames
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting compositions: " + error.toString() };
            }
        }
    },

    "delete_compositions_by_name": {
        description: "Delete compositions by name (supports partial matching and case-insensitive search)",
        parameters: {
            compNames: "array", // array of composition names to delete
            partialMatch: "boolean", // allow partial name matching
            caseSensitive: "boolean", // case sensitive matching
            confirmDeletion: "boolean" // safety confirmation
        },
        execute: function(params) {
            if (!params.compNames || params.compNames.length === 0) {
                return { success: false, message: "No composition names specified for deletion" };
            }
            
            try {
                app.beginUndoGroup("AI: Delete Compositions by Name");
                
                var deletedCount = 0;
                var deletedNames = [];
                var caseSensitive = params.caseSensitive !== false; // default true
                var partialMatch = params.partialMatch || false;
                
                // Convert search names for case-insensitive matching
                var searchNames = [];
                for (var n = 0; n < params.compNames.length; n++) {
                    searchNames.push(caseSensitive ? params.compNames[n] : params.compNames[n].toLowerCase());
                }
                
                // Find and delete matching compositions (in reverse order)
                for (var i = app.project.numItems; i >= 1; i--) {
                    var item = app.project.item(i);
                    
                    if (!(item instanceof CompItem)) continue;
                    
                    var compName = caseSensitive ? item.name : item.name.toLowerCase();
                    var shouldDelete = false;
                    
                    // Check if composition name matches any search criteria
                    for (var j = 0; j < searchNames.length; j++) {
                        var searchName = searchNames[j];
                        
                        if (partialMatch) {
                            if (compName.indexOf(searchName) !== -1) {
                                shouldDelete = true;
                                break;
                            }
                        } else {
                            if (compName === searchName) {
                                shouldDelete = true;
                                break;
                            }
                        }
                    }
                    
                    if (shouldDelete) {
                        deletedNames.push(item.name);
                        item.remove();
                        deletedCount++;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " compositions matching specified names",
                    data: { 
                        deletedCount: deletedCount,
                        deletedCompositions: deletedNames,
                        searchCriteria: params.compNames
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting compositions by name: " + error.toString() };
            }
        }
    },

    "delete_unused_compositions": {
        description: "Delete compositions that are not used in any other compositions",
        parameters: {
            excludeNames: "array", // composition names to exclude from deletion
            confirmDeletion: "boolean" // safety confirmation
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Delete Unused Compositions");
                
                var deletedCount = 0;
                var deletedNames = [];
                var excludeNames = params.excludeNames || [];
                
                // Convert exclude names to lowercase for case-insensitive matching
                var excludeNamesLower = [];
                for (var e = 0; e < excludeNames.length; e++) {
                    excludeNamesLower.push(excludeNames[e].toLowerCase());
                }
                
                // Find unused compositions (in reverse order)
                for (var i = app.project.numItems; i >= 1; i--) {
                    var item = app.project.item(i);
                    
                    if (!(item instanceof CompItem)) continue;
                    
                    // Check if composition should be excluded
                    var shouldExclude = false;
                    for (var ex = 0; ex < excludeNamesLower.length; ex++) {
                        if (item.name.toLowerCase() === excludeNamesLower[ex]) {
                            shouldExclude = true;
                            break;
                        }
                    }
                    
                    if (shouldExclude) continue;
                    
                    // Check if composition is used in other compositions
                    var isUsed = false;
                    for (var j = 1; j <= app.project.numItems; j++) {
                        var otherItem = app.project.item(j);
                        
                        if (!(otherItem instanceof CompItem) || otherItem === item) continue;
                        
                        // Check if this composition is used as a layer in another composition
                        for (var k = 1; k <= otherItem.numLayers; k++) {
                            var layer = otherItem.layer(k);
                            if (layer.source === item) {
                                isUsed = true;
                                break;
                            }
                        }
                        
                        if (isUsed) break;
                    }
                    
                    if (!isUsed) {
                        deletedNames.push(item.name);
                        item.remove();
                        deletedCount++;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " unused compositions",
                    data: { 
                        deletedCount: deletedCount,
                        deletedCompositions: deletedNames
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting unused compositions: " + error.toString() };
            }
        }
    },

    "delete_empty_compositions": {
        description: "Delete compositions that have no layers",
        parameters: {
            excludeNames: "array", // composition names to exclude from deletion
            confirmDeletion: "boolean" // safety confirmation
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Delete Empty Compositions");
                
                var deletedCount = 0;
                var deletedNames = [];
                var excludeNames = params.excludeNames || [];
                
                // Convert exclude names to lowercase for case-insensitive matching
                var excludeNamesLower = [];
                for (var e = 0; e < excludeNames.length; e++) {
                    excludeNamesLower.push(excludeNames[e].toLowerCase());
                }
                
                // Find empty compositions (in reverse order)
                for (var i = app.project.numItems; i >= 1; i--) {
                    var item = app.project.item(i);
                    
                    if (!(item instanceof CompItem)) continue;
                    
                    // Check if composition should be excluded
                    var shouldExclude = false;
                    for (var ex = 0; ex < excludeNamesLower.length; ex++) {
                        if (item.name.toLowerCase() === excludeNamesLower[ex]) {
                            shouldExclude = true;
                            break;
                        }
                    }
                    
                    if (shouldExclude) continue;
                    
                    // Check if composition is empty (no layers)
                    if (item.numLayers === 0) {
                        deletedNames.push(item.name);
                        item.remove();
                        deletedCount++;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " empty compositions",
                    data: { 
                        deletedCount: deletedCount,
                        deletedCompositions: deletedNames
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting empty compositions: " + error.toString() };
            }
        }
    },

    "delete_compositions_by_duration": {
        description: "Delete compositions based on duration criteria",
        parameters: {
            minDuration: "number", // minimum duration in seconds
            maxDuration: "number", // maximum duration in seconds
            exactDuration: "number", // exact duration in seconds
            excludeNames: "array", // composition names to exclude
            confirmDeletion: "boolean" // safety confirmation
        },
        execute: function(params) {
            if (!params.minDuration && !params.maxDuration && !params.exactDuration) {
                return { success: false, message: "Must specify minDuration, maxDuration, or exactDuration" };
            }
            
            try {
                app.beginUndoGroup("AI: Delete Compositions by Duration");
                
                var deletedCount = 0;
                var deletedNames = [];
                var excludeNames = params.excludeNames || [];
                
                // Convert exclude names to lowercase for case-insensitive matching
                var excludeNamesLower = [];
                for (var e = 0; e < excludeNames.length; e++) {
                    excludeNamesLower.push(excludeNames[e].toLowerCase());
                }
                
                // Find compositions matching duration criteria (in reverse order)
                for (var i = app.project.numItems; i >= 1; i--) {
                    var item = app.project.item(i);
                    
                    if (!(item instanceof CompItem)) continue;
                    
                    // Check if composition should be excluded
                    var shouldExclude = false;
                    for (var ex = 0; ex < excludeNamesLower.length; ex++) {
                        if (item.name.toLowerCase() === excludeNamesLower[ex]) {
                            shouldExclude = true;
                            break;
                        }
                    }
                    
                    if (shouldExclude) continue;
                    
                    var shouldDelete = false;
                    var duration = item.duration;
                    
                    // Check duration criteria
                    if (params.exactDuration !== undefined) {
                        if (Math.abs(duration - params.exactDuration) < 0.01) { // Allow small floating point differences
                            shouldDelete = true;
                        }
                    } else {
                        var meetsMin = params.minDuration === undefined || duration >= params.minDuration;
                        var meetsMax = params.maxDuration === undefined || duration <= params.maxDuration;
                        shouldDelete = meetsMin && meetsMax;
                    }
                    
                    if (shouldDelete) {
                        deletedNames.push({ name: item.name, duration: duration });
                        item.remove();
                        deletedCount++;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Deleted " + deletedCount + " compositions based on duration criteria",
                    data: { 
                        deletedCount: deletedCount,
                        deletedCompositions: deletedNames,
                        criteria: {
                            minDuration: params.minDuration,
                            maxDuration: params.maxDuration,
                            exactDuration: params.exactDuration
                        }
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting compositions by duration: " + error.toString() };
            }
        }
    },

    "delete_all_compositions": {
        description: "Delete ALL compositions in the project (USE WITH EXTREME CAUTION)",
        parameters: {
            confirmDeletion: "boolean", // safety confirmation required
            excludeNames: "array", // composition names to exclude from deletion
            keepActive: "boolean" // keep the currently active composition
        },
        execute: function(params) {
            // Safety check - require explicit confirmation
            if (!params.confirmDeletion) {
                return { 
                    success: false, 
                    message: "Confirmation required: set confirmDeletion to true to delete all compositions" 
                };
            }
            
            try {
                app.beginUndoGroup("AI: Delete All Compositions");
                
                var deletedCount = 0;
                var skippedCount = 0;
                var deletedNames = [];
                var excludeNames = params.excludeNames || [];
                var activeComp = params.keepActive ? app.project.activeItem : null;
                
                // Convert exclude names to lowercase for case-insensitive matching
                var excludeNamesLower = [];
                for (var e = 0; e < excludeNames.length; e++) {
                    excludeNamesLower.push(excludeNames[e].toLowerCase());
                }
                
                // Delete all compositions (in reverse order)
                for (var i = app.project.numItems; i >= 1; i--) {
                    var item = app.project.item(i);
                    
                    if (!(item instanceof CompItem)) continue;
                    
                    var shouldSkip = false;
                    
                    // Check if this is the active composition to keep
                    if (activeComp && item === activeComp) {
                        shouldSkip = true;
                    }
                    
                    // Check name exclusions
                    if (!shouldSkip) {
                        for (var ex = 0; ex < excludeNamesLower.length; ex++) {
                            if (item.name.toLowerCase() === excludeNamesLower[ex]) {
                                shouldSkip = true;
                                break;
                            }
                        }
                    }
                    
                    if (shouldSkip) {
                        skippedCount++;
                        continue;
                    }
                    
                    deletedNames.push(item.name);
                    item.remove();
                    deletedCount++;
                }
                
                app.endUndoGroup();
                
                var message = "Deleted " + deletedCount + " compositions";
                if (skippedCount > 0) {
                    message += " (skipped " + skippedCount + " excluded compositions)";
                }
                
                return {
                    success: true,
                    message: message,
                    data: { 
                        deletedCount: deletedCount,
                        skippedCount: skippedCount,
                        deletedCompositions: deletedNames
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error deleting all compositions: " + error.toString() };
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = COMPOSITION_TOOLS;
} 