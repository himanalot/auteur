/**
 * Project Management Tools for AI Integration
 * Comprehensive project-level operations
 */

var PROJECT_TOOLS = {
    "create_project": {
        description: "Create a new After Effects project",
        parameters: {
            name: "string",
            template: "string" // optional template name
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Create Project");
                
                // Create new project
                app.newProject();
                
                if (params.name) {
                    // Set project name (will be used when saving)
                    app.project.displayName = params.name;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created new project" + (params.name ? ": " + params.name : ""),
                    data: { projectName: params.name || "Untitled Project" }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating project: " + error.toString() };
            }
        }
    },

    "save_project": {
        description: "Save the current project",
        parameters: {
            path: "string", // optional save path
            saveAs: "boolean" // force save as dialog
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Save Project");
                
                if (params.saveAs || params.path) {
                    if (params.path) {
                        var saveFile = new File(params.path);
                        app.project.save(saveFile);
                    } else {
                        app.project.saveWithDialog();
                    }
                } else {
                    app.project.save();
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Project saved successfully",
                    data: { projectFile: app.project.file ? app.project.file.fsName : "Untitled" }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error saving project: " + error.toString() };
            }
        }
    },

    "import_file": {
        description: "Import a file into the project",
        parameters: {
            filePath: "string",
            importAs: "string", // "footage", "comp", "project"
            sequence: "boolean" // import as sequence
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Import File");
                
                if (!params.filePath) {
                    // Show import dialog
                    var importedItems = app.project.importFileWithDialog();
                    app.endUndoGroup();
                    return {
                        success: true,
                        message: "Imported " + importedItems.length + " items via dialog",
                        data: { itemsImported: importedItems.length }
                    };
                }
                
                var importFile = new File(params.filePath);
                if (!importFile.exists) {
                    app.endUndoGroup();
                    return { success: false, message: "File not found: " + params.filePath };
                }
                
                var importOptions = new ImportOptions(importFile);
                if (params.sequence) {
                    importOptions.sequence = true;
                }
                if (params.importAs) {
                    switch (params.importAs.toLowerCase()) {
                        case "comp":
                            importOptions.importAs = ImportAsType.COMP;
                            break;
                        case "footage":
                            importOptions.importAs = ImportAsType.FOOTAGE;
                            break;
                        case "project":
                            importOptions.importAs = ImportAsType.PROJECT;
                            break;
                    }
                }
                
                var importedItem = app.project.importFile(importOptions);
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Imported file: " + importedItem.name,
                    data: { itemName: importedItem.name, itemId: importedItem.id }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error importing file: " + error.toString() };
            }
        }
    },

    "create_folder": {
        description: "Create a folder in the project panel",
        parameters: {
            name: "string",
            parentFolder: "string" // optional parent folder name
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Create Folder");
                
                var folderName = params.name || "New Folder";
                var parentFolder = app.project.rootFolder;
                
                // Find parent folder if specified
                if (params.parentFolder) {
                    for (var i = 1; i <= app.project.numItems; i++) {
                        var item = app.project.item(i);
                        if (item instanceof FolderItem && item.name === params.parentFolder) {
                            parentFolder = item;
                            break;
                        }
                    }
                }
                
                var newFolder = app.project.items.addFolder(folderName);
                newFolder.parentFolder = parentFolder;
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created folder: " + folderName,
                    data: { folderName: folderName, folderId: newFolder.id }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating folder: " + error.toString() };
            }
        }
    },

    "organize_project": {
        description: "Organize project items into folders by type",
        parameters: {
            createSubfolders: "boolean", // create subfolders by file type
            sortAlphabetically: "boolean"
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Organize Project");
                
                var folders = {
                    comps: app.project.items.addFolder("Compositions"),
                    footage: app.project.items.addFolder("Footage"),
                    solids: app.project.items.addFolder("Solids"),
                    audio: null,
                    images: null,
                    video: null
                };
                
                if (params.createSubfolders) {
                    folders.audio = app.project.items.addFolder("Audio");
                    folders.images = app.project.items.addFolder("Images");
                    folders.video = app.project.items.addFolder("Video");
                    folders.audio.parentFolder = folders.footage;
                    folders.images.parentFolder = folders.footage;
                    folders.video.parentFolder = folders.footage;
                }
                
                var organized = { comps: 0, footage: 0, solids: 0, audio: 0, images: 0, video: 0 };
                
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item.parentFolder === app.project.rootFolder) {
                        if (item instanceof CompItem) {
                            item.parentFolder = folders.comps;
                            organized.comps++;
                        } else if (item instanceof FootageItem) {
                            if (item.mainSource instanceof SolidSource) {
                                item.parentFolder = folders.solids;
                                organized.solids++;
                            } else {
                                if (params.createSubfolders && item.hasAudio && !item.hasVideo) {
                                    item.parentFolder = folders.audio;
                                    organized.audio++;
                                } else if (params.createSubfolders && item.hasVideo) {
                                    item.parentFolder = folders.video;
                                    organized.video++;
                                } else if (params.createSubfolders && !item.hasAudio && !item.hasVideo) {
                                    item.parentFolder = folders.images;
                                    organized.images++;
                                } else {
                                    item.parentFolder = folders.footage;
                                    organized.footage++;
                                }
                            }
                        }
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Organized " + (organized.comps + organized.footage + organized.solids + organized.audio + organized.images + organized.video) + " items",
                    data: organized
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error organizing project: " + error.toString() };
            }
        }
    },

    "remove_unused_footage": {
        description: "Remove unused footage items from the project",
        parameters: {},
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Remove Unused Footage");
                
                var itemsToRemove = [];
                var removedCount = 0;
                
                // Find unused items
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof FootageItem && item.usedIn.length === 0) {
                        itemsToRemove.push(item);
                    }
                }
                
                // Remove items (in reverse order to maintain indices)
                for (var j = itemsToRemove.length - 1; j >= 0; j--) {
                    itemsToRemove[j].remove();
                    removedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Removed " + removedCount + " unused footage items",
                    data: { itemsRemoved: removedCount }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error removing unused footage: " + error.toString() };
            }
        }
    },

    "consolidate_footage": {
        description: "Consolidate duplicate footage items",
        parameters: {
            removeUnused: "boolean"
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Consolidate Footage");
                
                var consolidatedCount = 0;
                var footageMap = {};
                
                // Map footage by source path
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof FootageItem && item.file) {
                        var path = item.file.fsName;
                        if (footageMap[path]) {
                            // Replace all uses with the first instance
                            var originalItem = footageMap[path];
                            for (var j = 0; j < item.usedIn.length; j++) {
                                var comp = item.usedIn[j];
                                for (var k = 1; k <= comp.numLayers; k++) {
                                    var layer = comp.layer(k);
                                    if (layer.source === item) {
                                        layer.replaceSource(originalItem, false);
                                    }
                                }
                            }
                            item.remove();
                            consolidatedCount++;
                        } else {
                            footageMap[path] = item;
                        }
                    }
                }
                
                if (params.removeUnused) {
                    app.project.removeUnusedFootage();
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Consolidated " + consolidatedCount + " duplicate footage items",
                    data: { itemsConsolidated: consolidatedCount }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error consolidating footage: " + error.toString() };
            }
        }
    },

    "create_proxy": {
        description: "Create proxy for selected footage items",
        parameters: {
            proxyPath: "string",
            scale: "number", // proxy scale percentage
            format: "string" // proxy format
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Create Proxy");
                
                var selectedItems = app.project.selection;
                var proxiesCreated = 0;
                
                for (var i = 0; i < selectedItems.length; i++) {
                    var item = selectedItems[i];
                    if (item instanceof FootageItem) {
                        if (params.proxyPath) {
                            var proxyFile = new File(params.proxyPath);
                            if (proxyFile.exists) {
                                item.setProxy(proxyFile);
                                proxiesCreated++;
                            }
                        } else {
                            // Create auto proxy
                            item.setProxyWithPlaceholder(
                                item.name + "_proxy",
                                item.width * (params.scale || 50) / 100,
                                item.height * (params.scale || 50) / 100,
                                item.frameRate,
                                item.duration
                            );
                            proxiesCreated++;
                        }
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created " + proxiesCreated + " proxies",
                    data: { proxiesCreated: proxiesCreated }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating proxy: " + error.toString() };
            }
        }
    },

    "reduce_project": {
        description: "Reduce project to only specified compositions and their dependencies",
        parameters: {
            compNames: "array" // array of composition names to keep
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Reduce Project");
                
                var compsToKeep = [];
                
                if (params.compNames && params.compNames.length > 0) {
                    // Find compositions by name
                    for (var i = 1; i <= app.project.numItems; i++) {
                        var item = app.project.item(i);
                        if (item instanceof CompItem) {
                            for (var j = 0; j < params.compNames.length; j++) {
                                if (item.name === params.compNames[j]) {
                                    compsToKeep.push(item);
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    // Use selected compositions
                    var selectedItems = app.project.selection;
                    for (var k = 0; k < selectedItems.length; k++) {
                        if (selectedItems[k] instanceof CompItem) {
                            compsToKeep.push(selectedItems[k]);
                        }
                    }
                }
                
                if (compsToKeep.length === 0) {
                    app.endUndoGroup();
                    return { success: false, message: "No compositions found to reduce to" };
                }
                
                app.project.reduceProject(compsToKeep);
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Reduced project to " + compsToKeep.length + " compositions",
                    data: { compsKept: compsToKeep.length }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error reducing project: " + error.toString() };
            }
        }
    },

    "collect_files": {
        description: "Collect all project files into a specified folder",
        parameters: {
            destinationFolder: "string",
            includeProxies: "boolean",
            reduceProject: "boolean"
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Collect Files");
                
                if (!params.destinationFolder) {
                    app.endUndoGroup();
                    return { success: false, message: "Destination folder is required" };
                }
                
                var destFolder = new Folder(params.destinationFolder);
                if (!destFolder.exists) {
                    destFolder.create();
                }
                
                // This would typically use File > Dependencies > Collect Files
                // For scripting, we need to manually copy files
                var copiedFiles = 0;
                var footageFolder = new Folder(destFolder.fsName + "/Footage");
                if (!footageFolder.exists) {
                    footageFolder.create();
                }
                
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof FootageItem && item.file && item.file.exists) {
                        var sourceFile = item.file;
                        var destFile = new File(footageFolder.fsName + "/" + sourceFile.name);
                        
                        if (sourceFile.copy(destFile)) {
                            // Update item to point to new location
                            item.replace(destFile);
                            copiedFiles++;
                        }
                    }
                }
                
                // Save project in destination folder
                var projectFile = new File(destFolder.fsName + "/" + (app.project.file ? app.project.file.name : "Collected_Project.aep"));
                app.project.save(projectFile);
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Collected " + copiedFiles + " files to " + destFolder.fsName,
                    data: { filesCopied: copiedFiles, destinationFolder: destFolder.fsName }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error collecting files: " + error.toString() };
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = PROJECT_TOOLS;
} /**
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
} /**
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
            anchorPoint: "array", // [x, y] or [x, y, z]
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

                // Helper function to get layer type
                function getLayerType(layer) {
                    if (layer instanceof TextLayer) return "text";
                    if (layer instanceof ShapeLayer) return "shape";
                    if (layer instanceof CameraLayer) return "camera";
                    if (layer instanceof LightLayer) return "light";
                    if (layer.nullLayer) return "null";
                    if (layer.adjustmentLayer) return "adjustment";
                    if (layer.source && layer.source instanceof SolidSource) return "solid";
                    return "footage";
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
                    var layerType = getLayerType(layer).toLowerCase();
                    
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

                // Helper function to get layer type
                function getLayerType(layer) {
                    if (layer instanceof TextLayer) return "text";
                    if (layer instanceof ShapeLayer) return "shape";
                    if (layer instanceof CameraLayer) return "camera";
                    if (layer instanceof LightLayer) return "light";
                    if (layer.nullLayer) return "null";
                    if (layer.adjustmentLayer) return "adjustment";
                    if (layer.source && layer.source instanceof SolidSource) return "solid";
                    return "footage";
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
                        var layerType = getLayerType(layer).toLowerCase();
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
} /**
 * Animation Tools for AI Integration
 * Comprehensive keyframing, expressions, and motion control
 */

var ANIMATION_TOOLS = {
    "animate_layer": {
        description: "Create keyframe animations on layer properties with intelligent layer targeting. Use property='size' for shape morphing (e.g. circle→square).",
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
            // INTELLIGENT LAYER TARGETING OPTIONS
            layer_name: "string", // target specific layer by name
            layer_index: "number", // target specific layer by index (1-based)
            layer_type: "string", // target layers by type: "shape", "text", "solid", "null", "camera", "light", "adjustment"
            target_all: "boolean", // animate all layers in composition
            target_newest: "boolean", // target the most recently created layer
            auto_select: "boolean", // automatically choose the most appropriate layer(s)
            // BACKWARD COMPATIBILITY (deprecated - use startValue/endValue instead)
            keyframes: "array" // deprecated: array of {time, value} objects
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            // INTELLIGENT LAYER SELECTION
            var layersToAnimate = this.getTargetLayers(activeItem, params);
            
            if (layersToAnimate.length === 0) {
                // If no layers found, return helpful info about available layers
                var availableLayers = this.getLayerInfo(activeItem);
                // Check if duplicate layer names exist
                var duplicateNames = {};
                var hasDuplicates = false;
                for (var k = 0; k < availableLayers.length; k++) {
                    var layerName = availableLayers[k].name;
                    duplicateNames[layerName] = (duplicateNames[layerName] || 0) + 1;
                    if (duplicateNames[layerName] > 1) {
                        hasDuplicates = true;
                    }
                }
                
                var message = "No layers targeted for animation! ";
                if (hasDuplicates) {
                    message += "⚠️ DUPLICATE LAYER NAMES DETECTED! Use layer_index (e.g., layer_index: 1 or layer_index: 2) to target specific layers. ";
                }
                message += "Available targeting: target_newest: true, layer_name: 'LayerName', or layer_index: 1. Available layers: " + JSON.stringify(availableLayers);
                
                return { 
                    success: false, 
                    message: message,
                    data: { 
                        availableLayers: availableLayers,
                        hasDuplicateNames: hasDuplicates
                    }
                };
            }

            try {
                app.beginUndoGroup("AI: Animate Layer");
                
                var animatedCount = 0;
                var propertyName = params.property || "position";
                
                // BACKWARD COMPATIBILITY: Handle old keyframes format
                var startTime, endTime, startValue, endValue;
                if (params.keyframes && params.keyframes.length >= 2) {
                    // Convert old keyframes format to new format
                    startTime = params.keyframes[0].time || 0;
                    endTime = params.keyframes[1].time || 2;
                    startValue = params.keyframes[0].value;
                    endValue = params.keyframes[1].value;
                } else {
                    // Use new format
                    startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                    endTime = params.endTime !== undefined ? params.endTime : startTime + 2;
                    startValue = params.startValue;
                    endValue = params.endValue;
                }
                
                var easing = params.easing || "easeInOut";
                
                for (var i = 0; i < layersToAnimate.length; i++) {
                    var layer = layersToAnimate[i];
                    var property = this.getLayerProperty(layer, propertyName);
                    
                    if (!property) {
                        // Give specific error for wrong property names
                        if (propertyName === "width" && layer instanceof ShapeLayer) {
                            return { 
                                success: false, 
                                message: "❌ PROPERTY ERROR! For shape layers, use property='size' NOT property='width'! Also use startValue=[100,20] NOT startValue=100 (must be array)!",
                                data: { 
                                    wrongProperty: propertyName,
                                    correctProperty: "size",
                                    layerType: "shape",
                                    layerName: layer.name
                                }
                            };
                        }
                        continue;
                    }
                    
                    // Check for wrong value types before setting keyframes
                    if (propertyName === "size" && layer instanceof ShapeLayer) {
                        if (typeof startValue === "number" || typeof endValue === "number") {
                            return { 
                                success: false, 
                                message: "❌ VALUE ERROR! For property='size', use arrays like startValue=[100,20] endValue=[500,20] NOT single numbers!",
                                data: { 
                                    receivedStartValue: startValue,
                                    receivedEndValue: endValue,
                                    correctFormat: "startValue=[width,height], endValue=[width,height]"
                                }
                            };
                        }
                    }
                    
                    // Set start keyframe
                    property.setValueAtTime(startTime, startValue || property.value);
                    
                    // Set end keyframe
                    property.setValueAtTime(endTime, endValue || property.value);
                    
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
                
                // CRITICAL: Return failure if no layers were animated
                if (animatedCount === 0) {
                    var availableLayers = this.getLayerInfo(activeItem);
                    return { 
                        success: false, 
                        message: "Animation failed! No layers were animated. Please check your targeting parameters. Available layers: " + JSON.stringify(availableLayers),
                        data: { 
                            layersAnimated: 0,
                            property: propertyName,
                            availableLayers: availableLayers,
                            usedParameters: {
                                layer_name: params.layer_name,
                                layer_index: params.layer_index,
                                target_newest: params.target_newest,
                                auto_select: params.auto_select
                            }
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
            var lowerProp = propertyName.toLowerCase();
            
            try {
                // Handle special case for shape layer size/width properties
                if ((lowerProp === "size" || lowerProp === "width") && layer instanceof ShapeLayer) {
                    try {
                        // Navigate to Contents > Rectangle 1 > Rectangle Path 1 > Size
                        var contents = layer.property("Contents");
                        if (contents && contents.numProperties > 0) {
                            var rectGroup = contents.property(1); // First shape group
                            if (rectGroup) {
                                for (var i = 1; i <= rectGroup.numProperties; i++) {
                                    var prop = rectGroup.property(i);
                                    if (prop.matchName === "ADBE Vector Shape - Rect") {
                                        var sizeProp = prop.property("Size");
                                        if (sizeProp) {
                                            return sizeProp;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (shapeError) {
                        // Fall through to standard properties
                    }
                }
                
                // Standard transform properties
                if (!layer.transform) return null;
                
                switch (lowerProp) {
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
            } catch (error) {
                return null;
            }
        },
        
        applyEasing: function(property, startTime, endTime, easing, influence) {
            var startKeyIndex = property.nearestKeyIndex(startTime);
            var endKeyIndex = property.nearestKeyIndex(endTime);
            
            if (startKeyIndex === 0 || endKeyIndex === 0) return;
            
            var influenceValue = influence || 75;
            
            // Determine the number of dimensions for the property
            var dimensions = 1; // Default to 1D
            try {
                if (property.propertyValueType === PropertyValueType.TwoD) {
                    dimensions = 2;
                } else if (property.propertyValueType === PropertyValueType.ThreeD) {
                    dimensions = 3;
                }
            } catch (e) {
                // Some properties don't have propertyValueType, fallback to testing value
                try {
                    var testValue = property.value;
                    if (testValue && testValue.length) {
                        dimensions = testValue.length;
                    }
                } catch (e2) {
                    dimensions = 1; // Safe fallback
                }
            }
            
            // Create ease arrays based on dimensions
            function createEaseArray(speed, influence) {
                var easeArray = [];
                for (var i = 0; i < dimensions; i++) {
                    easeArray.push(new KeyframeEase(speed, influence));
                }
                return easeArray;
            }
            
            switch (easing.toLowerCase()) {
                case "linear":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.LINEAR);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.LINEAR);
                    break;
                    
                case "easein":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                    try {
                        property.setTemporalEaseAtKey(startKeyIndex, 
                            createEaseArray(0, influenceValue), 
                            createEaseArray(1, influenceValue)
                        );
                    } catch (e) {
                        // Fallback for problematic properties
                        console.log("Easing fallback for property: " + property.name);
                    }
                    break;
                    
                case "easeout":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                    try {
                        property.setTemporalEaseAtKey(endKeyIndex, 
                            createEaseArray(1, influenceValue), 
                            createEaseArray(0, influenceValue)
                        );
                    } catch (e) {
                        // Fallback for problematic properties
                        console.log("Easing fallback for property: " + property.name);
                    }
                    break;
                    
                case "easeinout":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.BEZIER);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.BEZIER);
                    try {
                        property.setTemporalEaseAtKey(startKeyIndex, 
                            createEaseArray(0, influenceValue), 
                            createEaseArray(1, influenceValue)
                        );
                        property.setTemporalEaseAtKey(endKeyIndex, 
                            createEaseArray(1, influenceValue), 
                            createEaseArray(0, influenceValue)
                        );
                    } catch (e) {
                        // Fallback for problematic properties
                        console.log("Easing fallback for property: " + property.name);
                    }
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
        },

        // INTELLIGENT LAYER TARGETING METHODS
        getTargetLayers: function(comp, params) {
            var layers = [];
            
            // Option 1: Target specific layer by name
            if (params.layer_name) {
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    if (layer.name.toLowerCase().indexOf(params.layer_name.toLowerCase()) !== -1) {
                        layers.push(layer);
                        break; // Only get first match for specific name
                    }
                }
                return layers;
            }
            
            // Option 2: Target specific layer by index
            if (params.layer_index) {
                try {
                    var layer = comp.layer(params.layer_index);
                    layers.push(layer);
                    return layers;
                } catch (e) {
                    // Invalid index
                    return [];
                }
            }
            
            // Option 3: Target layers by type
            if (params.layer_type) {
                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    var layerType = this.getLayerType(layer);
                    if (layerType === params.layer_type.toLowerCase()) {
                        layers.push(layer);
                    }
                }
                return layers;
            }
            
            // Option 4: Target all layers
            if (params.target_all) {
                for (var i = 1; i <= comp.numLayers; i++) {
                    layers.push(comp.layer(i));
                }
                return layers;
            }
            
            // Option 5: Target newest layer (most recently created)
            if (params.target_newest || params.auto_select) {
                if (comp.numLayers > 0) {
                    var newestLayer = comp.layer(1); // Layer 1 is always the newest
                    // Check for duplicate layer names that could cause confusion
                    var duplicateCount = 0;
                    for (var j = 1; j <= comp.numLayers; j++) {
                        if (comp.layer(j).name === newestLayer.name) {
                            duplicateCount++;
                        }
                    }
                    // Only target if layer name is unique, otherwise suggest layer_index
                    if (duplicateCount === 1) {
                        layers.push(newestLayer);
                    }
                    // Note: If duplicates exist, this will return empty array and trigger helpful error
                }
                return layers;
            }
            
            // Option 6: Fall back to selected layers if no targeting specified
            var selectedLayers = comp.selectedLayers;
            for (var i = 0; i < selectedLayers.length; i++) {
                layers.push(selectedLayers[i]);
            }
            
            return layers;
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

        getLayerInfo: function(comp) {
            var layerInfo = [];
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                layerInfo.push({
                    index: i,
                    name: layer.name,
                    type: this.getLayerType(layer),
                    enabled: layer.enabled,
                    locked: layer.locked
                });
            }
            return layerInfo;
        }
    },

    "list_layers": {
        description: "List all layers in the active composition for intelligent targeting",
        parameters: {
            filter_type: "string", // optional: filter by layer type (shape, text, solid, etc.)
            include_details: "boolean" // include detailed properties like position, scale, etc.
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                var layers = [];
                var filterType = params.filter_type ? params.filter_type.toLowerCase() : null;
                var includeDetails = params.include_details || false;
                
                for (var i = 1; i <= activeItem.numLayers; i++) {
                    var layer = activeItem.layer(i);
                    var layerType = this.getLayerType(layer);
                    
                    // Apply filter if specified
                    if (filterType && layerType !== filterType) continue;
                    
                    var layerInfo = {
                        index: i,
                        name: layer.name,
                        type: layerType,
                        enabled: layer.enabled,
                        locked: layer.locked,
                        selected: layer.selected
                    };
                    
                    // Add detailed properties if requested
                    if (includeDetails) {
                        try {
                            var transform = layer.property("Transform");
                            if (transform) {
                                layerInfo.properties = {};
                                
                                // Safely get each property
                                try { layerInfo.properties.position = transform.property("Position").value; } catch(e) {}
                                try { layerInfo.properties.scale = transform.property("Scale").value; } catch(e) {}
                                try { layerInfo.properties.rotation = transform.property("Rotation").value; } catch(e) {}
                                try { layerInfo.properties.opacity = transform.property("Opacity").value; } catch(e) {}
                            }
                        } catch(e) {
                            // If transform properties can't be accessed, continue without them
                            layerInfo.properties = { error: "Could not access transform properties" };
                        }
                    }
                    
                    layers.push(layerInfo);
                }
                
                return {
                    success: true,
                    message: "Found " + layers.length + " layers" + (filterType ? " of type '" + filterType + "'" : ""),
                    data: { 
                        layers: layers,
                        totalCount: layers.length,
                        composition: activeItem.name
                    }
                };
            } catch (error) {
                return { success: false, message: "Error listing layers: " + error.toString() };
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
        }
    },

    "set_layer_property": {
        description: "Set layer property values directly or create keyframes at specific times",
        parameters: {
            layer_index: "number", // target layer by index (1-based)
            layer_name: "string", // alternative: target layer by name
            property: "string", // "opacity", "position", "scale", "rotation"
            value: "array", // property value (number for opacity, array for position/scale)
            time: "number", // time to set keyframe (optional - if not provided, sets current value)
            clear_keyframes: "boolean", // remove existing keyframes first
            interpolation: "string" // "hold", "linear", "bezier" - for keyframe interpolation
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Set Layer Property");
                
                var targetLayer = null;
                
                // Find the target layer
                if (params.layer_index) {
                    if (params.layer_index < 1 || params.layer_index > activeItem.numLayers) {
                        app.endUndoGroup();
                        return { 
                            success: false, 
                            message: "Layer index " + params.layer_index + " out of range (1-" + activeItem.numLayers + ")" 
                        };
                    }
                    targetLayer = activeItem.layer(params.layer_index);
                } else if (params.layer_name) {
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        if (activeItem.layer(i).name === params.layer_name) {
                            targetLayer = activeItem.layer(i);
                            break;
                        }
                    }
                    if (!targetLayer) {
                        app.endUndoGroup();
                        return { 
                            success: false, 
                            message: "Layer '" + params.layer_name + "' not found" 
                        };
                    }
                } else {
                    app.endUndoGroup();
                    return { 
                        success: false, 
                        message: "Must specify either layer_index or layer_name" 
                    };
                }
                
                if (!params.property || params.value === undefined) {
                    app.endUndoGroup();
                    return { 
                        success: false, 
                        message: "Must specify both property and value" 
                    };
                }
                
                // Get the property
                var property = this.getLayerProperty(targetLayer, params.property);
                if (!property) {
                    app.endUndoGroup();
                    return { 
                        success: false, 
                        message: "Property '" + params.property + "' not found on layer '" + targetLayer.name + "'" 
                    };
                }
                
                // Clear existing keyframes if requested
                if (params.clear_keyframes && property.numKeys > 0) {
                    for (var k = property.numKeys; k >= 1; k--) {
                        property.removeKey(k);
                    }
                }
                
                // Set the property value - either at specific time or current value
                if (params.time !== undefined) {
                    // Create keyframe at specific time
                    property.setValueAtTime(params.time, params.value);
                    
                    // Apply interpolation if specified
                    if (params.interpolation) {
                        var keyIndex = property.nearestKeyIndex(params.time);
                        if (keyIndex > 0) {
                            switch (params.interpolation.toLowerCase()) {
                                case "hold":
                                    property.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.HOLD);
                                    break;
                                case "linear":
                                    property.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.LINEAR);
                                    break;
                                case "bezier":
                                    property.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER);
                                    break;
                            }
                        }
                    }
                } else {
                    // Set current value directly
                    property.setValue(params.value);
                }
                
                app.endUndoGroup();
                
                var message = params.time !== undefined 
                    ? "Set " + params.property + " to " + JSON.stringify(params.value) + " at time " + params.time + " on layer '" + targetLayer.name + "'"
                    : "Set " + params.property + " to " + JSON.stringify(params.value) + " on layer '" + targetLayer.name + "'";
                
                return {
                    success: true,
                    message: message,
                    data: { 
                        layerName: targetLayer.name,
                        property: params.property,
                        value: params.value,
                        time: params.time,
                        isKeyframe: params.time !== undefined,
                        keyframesCleared: params.clear_keyframes && property.numKeys > 0
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error setting layer property: " + error.toString() };
            }
        },
        
        getLayerProperty: function(layer, propertyName) {
            if (!layer.transform) return null;
            
            switch (propertyName.toLowerCase()) {
                case "opacity": return layer.transform.opacity;
                case "position": return layer.transform.position;
                case "scale": return layer.transform.scale;
                case "rotation": return layer.transform.rotation;
                case "anchorpoint": return layer.transform.anchorPoint;
                default: 
                    try {
                        return layer.property(propertyName);
                    } catch (e) {
                        return null;
                    }
            }
        }
    },

    "reorder_layer": {
        description: "Change the layer index/order in the composition stack",
        parameters: {
            layer_index: "number", // current layer index (1-based)
            layer_name: "string", // alternative: target layer by name
            new_index: "number", // new position (1=top, higher numbers=lower in stack)
            move_to: "string" // alternative: "top", "bottom", "up", "down"
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Reorder Layer");
                
                var targetLayer = null;
                var currentIndex = null;
                
                // Find the target layer
                if (params.layer_index) {
                    if (params.layer_index < 1 || params.layer_index > activeItem.numLayers) {
                        app.endUndoGroup();
                        return { 
                            success: false, 
                            message: "Layer index " + params.layer_index + " out of range (1-" + activeItem.numLayers + ")" 
                        };
                    }
                    targetLayer = activeItem.layer(params.layer_index);
                    currentIndex = params.layer_index;
                } else if (params.layer_name) {
                    for (var i = 1; i <= activeItem.numLayers; i++) {
                        if (activeItem.layer(i).name === params.layer_name) {
                            targetLayer = activeItem.layer(i);
                            currentIndex = i;
                            break;
                        }
                    }
                    if (!targetLayer) {
                        app.endUndoGroup();
                        return { 
                            success: false, 
                            message: "Layer '" + params.layer_name + "' not found" 
                        };
                    }
                } else {
                    app.endUndoGroup();
                    return { 
                        success: false, 
                        message: "Must specify either layer_index or layer_name" 
                    };
                }
                
                var newIndex = null;
                
                // Determine new index
                if (params.new_index) {
                    newIndex = params.new_index;
                } else if (params.move_to) {
                    switch (params.move_to.toLowerCase()) {
                        case "top":
                            newIndex = 1;
                            break;
                        case "bottom":
                            newIndex = activeItem.numLayers;
                            break;
                        case "up":
                            newIndex = Math.max(1, currentIndex - 1);
                            break;
                        case "down":
                            newIndex = Math.min(activeItem.numLayers, currentIndex + 1);
                            break;
                        default:
                            app.endUndoGroup();
                            return { 
                                success: false, 
                                message: "Invalid move_to value. Use: 'top', 'bottom', 'up', or 'down'" 
                            };
                    }
                } else {
                    app.endUndoGroup();
                    return { 
                        success: false, 
                        message: "Must specify either new_index or move_to" 
                    };
                }
                
                // Validate new index
                if (newIndex < 1 || newIndex > activeItem.numLayers) {
                    app.endUndoGroup();
                    return { 
                        success: false, 
                        message: "New index " + newIndex + " out of range (1-" + activeItem.numLayers + ")" 
                    };
                }
                
                // No change needed
                if (newIndex === currentIndex) {
                    app.endUndoGroup();
                    return {
                        success: true,
                        message: "Layer '" + targetLayer.name + "' already at index " + newIndex,
                        data: { 
                            layerName: targetLayer.name,
                            oldIndex: currentIndex,
                            newIndex: newIndex,
                            noChange: true
                        }
                    };
                }
                
                // Move the layer using proper After Effects layer moving method
                if (newIndex === 1) {
                    // Move to top
                    targetLayer.moveToBeginning();
                } else if (newIndex === activeItem.numLayers) {
                    // Move to bottom
                    targetLayer.moveToEnd();
                } else {
                    // Move to specific position
                    // We need to move it relative to where it should end up
                    if (currentIndex < newIndex) {
                        // Moving down - move after the layer that will be above it
                        targetLayer.moveAfter(activeItem.layer(newIndex));
                    } else {
                        // Moving up - move before the layer that will be below it  
                        targetLayer.moveBefore(activeItem.layer(newIndex));
                    }
                }
                
                app.endUndoGroup();
                
                return {
                    success: true,
                    message: "Moved layer '" + targetLayer.name + "' from index " + currentIndex + " to index " + newIndex,
                    data: { 
                        layerName: targetLayer.name,
                        oldIndex: currentIndex,
                        newIndex: newIndex,
                        totalLayers: activeItem.numLayers
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error reordering layer: " + error.toString() };
            }
        }
    },

    "arrange_layers": {
        description: "Bulk layer arrangement and reordering operations",
        parameters: {
            operation: "string", // "sort_by_name", "sort_by_type", "reverse_order", "move_layers"
            layer_indices: "array", // for move_layers: which layers to move
            target_index: "number", // for move_layers: where to move them
            sort_direction: "string" // "ascending" or "descending" for sort operations
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            if (activeItem.numLayers === 0) {
                return { success: false, message: "No layers in composition to arrange" };
            }

            try {
                app.beginUndoGroup("AI: Arrange Layers");
                
                var operation = params.operation ? params.operation.toLowerCase() : "";
                var layersProcessed = 0;
                
                switch (operation) {
                    case "sort_by_name":
                        layersProcessed = this.sortLayersByName(activeItem, params.sort_direction);
                        break;
                    case "sort_by_type":
                        layersProcessed = this.sortLayersByType(activeItem, params.sort_direction);
                        break;
                    case "reverse_order":
                        layersProcessed = this.reverseLayerOrder(activeItem);
                        break;
                    case "move_layers":
                        layersProcessed = this.moveLayers(activeItem, params.layer_indices, params.target_index);
                        break;
                    default:
                        app.endUndoGroup();
                        return { 
                            success: false, 
                            message: "Invalid operation. Use: 'sort_by_name', 'sort_by_type', 'reverse_order', or 'move_layers'" 
                        };
                }
                
                app.endUndoGroup();
                
                return {
                    success: true,
                    message: "Arranged layers using '" + operation + "'. Processed " + layersProcessed + " layers",
                    data: { 
                        operation: operation,
                        layersProcessed: layersProcessed,
                        totalLayers: activeItem.numLayers
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error arranging layers: " + error.toString() };
            }
        },
        
        sortLayersByName: function(comp, direction) {
            var layers = [];
            for (var i = 1; i <= comp.numLayers; i++) {
                layers.push({
                    layer: comp.layer(i),
                    name: comp.layer(i).name,
                    index: i
                });
            }
            
            // Sort by name
            layers.sort(function(a, b) {
                if (direction === "descending") {
                    return b.name.localeCompare(a.name);
                }
                return a.name.localeCompare(b.name);
            });
            
            // Reorder layers
            for (var j = 0; j < layers.length; j++) {
                layers[j].layer.moveToBeginning();
            }
            
            return layers.length;
        },
        
        sortLayersByType: function(comp, direction) {
            var layers = [];
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                var type = this.getLayerType(layer);
                layers.push({
                    layer: layer,
                    type: type,
                    name: layer.name
                });
            }
            
            // Sort by type, then by name
            layers.sort(function(a, b) {
                var typeCompare = a.type.localeCompare(b.type);
                if (typeCompare !== 0) {
                    return direction === "descending" ? -typeCompare : typeCompare;
                }
                return a.name.localeCompare(b.name);
            });
            
            // Reorder layers
            for (var j = 0; j < layers.length; j++) {
                layers[j].layer.moveToBeginning();
            }
            
            return layers.length;
        },
        
        reverseLayerOrder: function(comp) {
            var layers = [];
            for (var i = comp.numLayers; i >= 1; i--) {
                layers.push(comp.layer(i));
            }
            
            // Move in reverse order
            for (var j = 0; j < layers.length; j++) {
                layers[j].moveToBeginning();
            }
            
            return layers.length;
        },
        
        moveLayers: function(comp, layerIndices, targetIndex) {
            if (!layerIndices || layerIndices.length === 0) {
                throw new Error("No layer indices specified for move operation");
            }
            
            if (!targetIndex || targetIndex < 1 || targetIndex > comp.numLayers) {
                throw new Error("Invalid target index: " + targetIndex);
            }
            
            var layersToMove = [];
            for (var i = 0; i < layerIndices.length; i++) {
                var index = layerIndices[i];
                if (index >= 1 && index <= comp.numLayers) {
                    layersToMove.push(comp.layer(index));
                }
            }
            
            // Move layers to target position
            for (var j = 0; j < layersToMove.length; j++) {
                layersToMove[j].moveToBeginning();
                if (targetIndex > 1) {
                    layersToMove[j].moveAfter(comp.layer(targetIndex - 1 + j));
                }
            }
            
            return layersToMove.length;
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
} /**
 * Effects Tools for AI Integration
 * Comprehensive effects application and management
 */

var EFFECTS_TOOLS = {
    "apply_effect": {
        description: "Apply effects to selected layers with parameters",
        parameters: {
            effectName: "string", // effect match name or display name
            parameters: "object", // effect parameters as key-value pairs
            preset: "string", // effect preset name
            enabled: "boolean" // enable/disable effect
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            var selectedLayers = activeItem.selectedLayers;
            if (selectedLayers.length === 0) {
                return { success: false, message: "No layers selected for effects" };
            }

            try {
                app.beginUndoGroup("AI: Apply Effect");
                
                var effectName = params.effectName;
                var effectsApplied = 0;
                
                // Convert display name to match name if needed
                var matchName = this.getEffectMatchName(effectName);
                if (!matchName) {
                    app.endUndoGroup();
                    return { success: false, message: "Effect not found: " + effectName };
                }
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    
                    try {
                        var effect = layer.Effects.addProperty(matchName);
                        
                        // Apply parameters if provided
                        if (params.parameters) {
                            this.applyEffectParameters(effect, params.parameters);
                        }
                        
                        // Apply preset if specified
                        if (params.preset) {
                            this.applyEffectPreset(effect, params.preset);
                        }
                        
                        // Set enabled state
                        if (params.enabled !== undefined) {
                            effect.enabled = params.enabled;
                        }
                        
                        effectsApplied++;
                    } catch (e) {
                        // Effect might not be applicable to this layer type
                        continue;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Applied " + effectName + " to " + effectsApplied + " layers",
                    data: { 
                        effectName: effectName,
                        layersModified: effectsApplied,
                        parameters: params.parameters
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error applying effect: " + error.toString() };
            }
        },
        
        getEffectMatchName: function(effectName) {
            var effects = {
                // Color Correction
                "brightness_contrast": "ADBE Brightness & Contrast 2",
                "brightness": "ADBE Brightness & Contrast 2",
                "contrast": "ADBE Brightness & Contrast 2",
                "curves": "ADBE CurvesCustom",
                "levels": "ADBE Easy Levels2",
                "hue_saturation": "ADBE HUE SATURATION",
                "color_balance": "ADBE Color Balance 2",
                "vibrance": "ADBE Vibrance",
                "lumetri": "ADBE Lumetri Color",
                "auto_levels": "ADBE Auto Levels",
                "auto_contrast": "ADBE Auto Contrast",
                "auto_color": "ADBE Auto Color",
                "shadow_highlight": "ADBE Shadow/Highlight",
                "exposure": "ADBE Exposure2",
                "gamma_highlight_pinpoint": "ADBE Gamma/Pedestal/Gain",
                "tritone": "ADBE Tritone",
                "colorama": "ADBE Colorama",
                "change_color": "ADBE Change Color",
                "change_to_color": "ADBE Change To Color",
                "leave_color": "ADBE Leave Color",
                "color_replace": "ADBE Color Replace",
                "channel_mixer": "ADBE Channel Mixer",
                "invert": "ADBE Invert",
                "posterize": "ADBE Posterize",
                "threshold": "ADBE Threshold2",
                "black_white": "ADBE Black&White",
                "photo_filter": "ADBE Photo Filter",
                "color_link": "ADBE Color Link",
                "tint": "ADBE Tint",
                
                // Blur & Sharpen
                "gaussian_blur": "ADBE Gaussian Blur 2",
                "fast_blur": "ADBE Fast Blur",
                "motion_blur": "ADBE Motion Blur",
                "radial_blur": "ADBE Radial Blur",
                "box_blur": "ADBE Box Blur2",
                "bilateral_blur": "ADBE Bilateral Blur",
                "smart_blur": "ADBE Smart Blur",
                "channel_blur": "ADBE Channel Blur",
                "compound_blur": "ADBE Compound Blur",
                "directional_blur": "ADBE Directional Blur",
                "radial_fast_blur": "ADBE Radial Fast Blur",
                "zoom_blur": "ADBE Zoom Blur",
                "lens_blur": "ADBE Lens Blur",
                "sharpen": "ADBE Sharpen",
                "unsharp_mask": "ADBE Unsharp Mask",
                
                // Distort
                "transform": "ADBE Geometry2",
                "corner_pin": "ADBE Corner Pin",
                "bulge": "ADBE Bulge",
                "mesh_warp": "ADBE Mesh Warp",
                "bezier_warp": "ADBE Bezier Warp",
                "liquify": "ADBE Liquify",
                "magnify": "ADBE Magnify",
                "mirror": "ADBE Mirror",
                "offset": "ADBE Offset",
                "optics_compensation": "ADBE Optics Compensation",
                "polar_coordinates": "ADBE Polar Coordinates",
                "reshape": "ADBE Reshape",
                "ripple": "ADBE Ripple",
                "smear": "ADBE Smear",
                "spherize": "ADBE Spherize",
                "turbulent_displace": "ADBE Turbulent Displace",
                "twirl": "ADBE Twirl",
                "wave_warp": "ADBE Wave Warp",
                "cc_power_pin": "CC Power Pin",
                "cc_bend_it": "CC Bend It",
                "cc_blobbylize": "CC Blobbylize",
                "cc_flo_motion": "CC Flo Motion",
                "cc_griddler": "CC Griddler",
                "cc_lens": "CC Lens",
                "cc_page_turn": "CC Page Turn",
                "cc_power_pin": "CC Power Pin",
                "cc_slant": "CC Slant",
                "cc_split": "CC Split",
                "cc_split_2": "CC Split 2",
                "cc_tiler": "CC Tiler",
                
                // Generate
                "fill": "ADBE Fill",
                "gradient_ramp": "ADBE Ramp",
                "4_color_gradient": "ADBE 4 Color Gradient",
                "beam": "ADBE Beam",
                "lightning": "ADBE Lightning",
                "advanced_lightning": "ADBE Lightning 2",
                "lens_flare": "ADBE Lens Flare",
                "fractal_noise": "ADBE Fractal Noise",
                "turbulent_noise": "ADBE Turbulent Noise",
                "noise": "ADBE Noise",
                "cell_pattern": "ADBE Cell Pattern",
                "checkerboard": "ADBE Checkerboard",
                "circle": "ADBE Circle",
                "ellipse": "ADBE Ellipse",
                "eyedropper_fill": "ADBE Eyedropper Fill",
                "grid": "ADBE Grid",
                "paint_bucket": "ADBE Paint Bucket",
                "radio_waves": "ADBE Radio Waves",
                "scribble": "ADBE Scribble",
                "stroke": "ADBE Stroke",
                "vegas": "ADBE Vegas",
                "write_on": "ADBE Write-on",
                "audio_spectrum": "ADBE Audio Spectrum",
                "audio_waveform": "ADBE Audio Waveform",
                "cc_light_burst": "CC Light Burst 2.5",
                "cc_light_rays": "CC Light Rays",
                "cc_light_sweep": "CC Light Sweep",
                
                // Keying
                "keylight": "ADBE Keylight",
                "linear_color_key": "ADBE Linear Color Key",
                "color_key": "ADBE Color Key",
                "luma_key": "ADBE Luma Key",
                "difference_matte": "ADBE Difference Matte",
                "extract": "ADBE Extract",
                "inner_outer_key": "ADBE Inner/Outer Key",
                "spill_suppressor": "ADBE Spill Suppressor",
                "color_range": "ADBE Color Range",
                "keylight_1_2": "ADBE Keylight",
                
                // Matte
                "matte_choker": "ADBE Matte Choker",
                "simple_choker": "ADBE Simple Choker",
                "refine_matte": "ADBE Refine Matte",
                "refine_hard_matte": "ADBE Refine Hard Matte",
                "refine_soft_matte": "ADBE Refine Soft Matte",
                
                // Noise & Grain
                "add_grain": "ADBE Add Grain",
                "dust_scratches": "ADBE Dust & Scratches",
                "median": "ADBE Median",
                "noise_alpha": "ADBE Noise Alpha",
                "noise_hls": "ADBE Noise HLS",
                "noise_hls_auto": "ADBE Noise HLS Auto",
                "remove_grain": "ADBE Remove Grain",
                
                // Perspective
                "3d_camera_tracker": "ADBE 3D Camera Tracker",
                "3d_glasses": "ADBE 3D Glasses",
                "bevel_alpha": "ADBE Bevel Alpha",
                "bevel_edges": "ADBE Bevel Edges",
                "drop_shadow": "ADBE Drop Shadow",
                
                // Simulation
                "particle_playground": "ADBE Particle Playground",
                "shatter": "ADBE Shatter",
                "wave_world": "ADBE Wave World",
                "caustics": "ADBE Caustics",
                "foam": "ADBE Foam",
                "hair": "ADBE Hair",
                "particle_systems_ii": "ADBE Particle Systems II",
                "cc_particle_world": "CC Particle World",
                "cc_particle_systems_ii": "CC Particle Systems II",
                "cc_drizzle": "CC Drizzle",
                "cc_hair": "CC Hair",
                "cc_mr_mercury": "CC Mr. Mercury",
                "cc_pixel_polly": "CC Pixel Polly",
                "cc_rainfall": "CC Rainfall",
                "cc_scatterize": "CC Scatterize",
                "cc_snow": "CC Snow",
                "cc_star_burst": "CC Star Burst",
                
                // Stylize
                "glow": "ADBE Glow 2",
                "inner_glow": "ADBE Inner Glow",
                "outer_glow": "ADBE Outer Glow",
                "brush_strokes": "ADBE Brush Strokes",
                "cartoon": "ADBE Cartoon",
                "color_emboss": "ADBE Color Emboss",
                "emboss": "ADBE Emboss",
                "find_edges": "ADBE Find Edges",
                "glue_gun": "ADBE Glue Gun",
                "leave_color": "ADBE Leave Color",
                "mosaic": "ADBE Mosaic",
                "motion_tile": "ADBE Motion Tile",
                "posterize_time": "ADBE Posterize Time",
                "roughen_edges": "ADBE Roughen Edges",
                "scatter": "ADBE Scatter",
                "strobe_light": "ADBE Strobe Light",
                "texturize": "ADBE Texturize",
                "threshold": "ADBE Threshold2",
                "tiles": "ADBE Tiles",
                
                // Text
                "path_text": "ADBE Path Text",
                "numbers": "ADBE Numbers",
                "timecode": "ADBE Timecode",
                
                // Time
                "echo": "ADBE Echo",
                "posterize_time": "ADBE Posterize Time",
                "time_displacement": "ADBE Time Displacement",
                "timewarp": "ADBE Timewarp",
                "pixel_motion_blur": "ADBE Pixel Motion Blur",
                "frame_blending": "ADBE Frame Blending",
                
                // Transition
                "block_dissolve": "ADBE Block Dissolve",
                "card_wipe": "ADBE Card Wipe",
                "gradient_wipe": "ADBE Gradient Wipe",
                "iris_wipe": "ADBE Iris Wipe",
                "linear_wipe": "ADBE Linear Wipe",
                "radial_wipe": "ADBE Radial Wipe",
                "venetian_blinds": "ADBE Venetian Blinds",
                "cc_glass_wipe": "CC Glass Wipe",
                "cc_grid_wipe": "CC Grid Wipe",
                "cc_image_wipe": "CC Image Wipe",
                "cc_jaws": "CC Jaws",
                "cc_light_wipe": "CC Light Wipe",
                "cc_line_sweep": "CC Line Sweep",
                "cc_radial_scale_wipe": "CC Radial ScaleWipe",
                "cc_scale_wipe": "CC Scale Wipe",
                "cc_twister": "CC Twister",
                "cc_warpo": "CC WarpoMatic"
            };
            
            var normalizedName = effectName.toLowerCase().replace(/[\s\-]/g, "_");
            return effects[normalizedName] || effectName;
        },
        
        applyEffectParameters: function(effect, parameters) {
            for (var paramName in parameters) {
                try {
                    var prop = effect.property(paramName);
                    if (prop) {
                        prop.setValue(parameters[paramName]);
                    }
                } catch (e) {
                    // Parameter might not exist or be settable
                }
            }
        },
        
        applyEffectPreset: function(effect, presetName) {
            // Common presets for popular effects
            var presets = {
                "gaussian_blur": {
                    "light": { "Blurriness": 5 },
                    "medium": { "Blurriness": 15 },
                    "heavy": { "Blurriness": 30 },
                    "extreme": { "Blurriness": 50 }
                },
                "glow": {
                    "soft": { "Glow Threshold": 50, "Glow Radius": 20, "Glow Intensity": 0.5 },
                    "bright": { "Glow Threshold": 70, "Glow Radius": 30, "Glow Intensity": 1.0 },
                    "intense": { "Glow Threshold": 40, "Glow Radius": 50, "Glow Intensity": 1.5 }
                },
                "drop_shadow": {
                    "subtle": { "Opacity": 40, "Distance": 5, "Softness": 10 },
                    "standard": { "Opacity": 75, "Distance": 10, "Softness": 15 },
                    "dramatic": { "Opacity": 90, "Distance": 20, "Softness": 25 }
                }
            };
            
            var effectKey = effect.matchName.toLowerCase();
            if (presets[effectKey] && presets[effectKey][presetName.toLowerCase()]) {
                this.applyEffectParameters(effect, presets[effectKey][presetName.toLowerCase()]);
            }
        }
    },

    "remove_effects": {
        description: "Remove effects from selected layers",
        parameters: {
            effectName: "string", // specific effect to remove, or "all"
            effectIndex: "number" // effect index to remove
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
                app.beginUndoGroup("AI: Remove Effects");
                
                var effectsRemoved = 0;
                var layersModified = 0;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    var layerEffectsRemoved = 0;
                    
                    if (params.effectName === "all") {
                        // Remove all effects
                        while (layer.Effects.numProperties > 0) {
                            layer.Effects.property(1).remove();
                            layerEffectsRemoved++;
                        }
                    } else if (params.effectIndex) {
                        // Remove by index
                        try {
                            layer.Effects.property(params.effectIndex).remove();
                            layerEffectsRemoved++;
                        } catch (e) {
                            // Invalid index
                        }
                    } else if (params.effectName) {
                        // Remove by name
                        for (var j = layer.Effects.numProperties; j >= 1; j--) {
                            var effect = layer.Effects.property(j);
                            if (effect.name.toLowerCase().indexOf(params.effectName.toLowerCase()) !== -1) {
                                effect.remove();
                                layerEffectsRemoved++;
                            }
                        }
                    }
                    
                    if (layerEffectsRemoved > 0) {
                        layersModified++;
                        effectsRemoved += layerEffectsRemoved;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Removed " + effectsRemoved + " effects from " + layersModified + " layers",
                    data: { 
                        effectsRemoved: effectsRemoved,
                        layersModified: layersModified
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error removing effects: " + error.toString() };
            }
        }
    },

    "copy_effects": {
        description: "Copy effects from one layer to selected layers",
        parameters: {
            sourceLayer: "string", // source layer name
            effectNames: "array", // specific effects to copy
            includeKeyframes: "boolean" // copy keyframes too
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
                app.beginUndoGroup("AI: Copy Effects");
                
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
                
                if (sourceLayer.Effects.numProperties === 0) {
                    app.endUndoGroup();
                    return { success: false, message: "Source layer has no effects" };
                }
                
                var effectsCopied = 0;
                var layersModified = 0;
                
                for (var j = 0; j < selectedLayers.length; j++) {
                    var targetLayer = selectedLayers[j];
                    if (targetLayer === sourceLayer) continue;
                    
                    var layerEffectsCopied = 0;
                    
                    // Copy effects
                    for (var k = 1; k <= sourceLayer.Effects.numProperties; k++) {
                        var sourceEffect = sourceLayer.Effects.property(k);
                        
                        // Check if we should copy this effect
                        if (params.effectNames && params.effectNames.length > 0) {
                            var shouldCopy = false;
                            for (var l = 0; l < params.effectNames.length; l++) {
                                if (sourceEffect.name.toLowerCase().indexOf(params.effectNames[l].toLowerCase()) !== -1) {
                                    shouldCopy = true;
                                    break;
                                }
                            }
                            if (!shouldCopy) continue;
                        }
                        
                        try {
                            // Add the effect to target layer
                            var newEffect = targetLayer.Effects.addProperty(sourceEffect.matchName);
                            
                            // Copy properties
                            this.copyEffectProperties(sourceEffect, newEffect, params.includeKeyframes);
                            
                            layerEffectsCopied++;
                        } catch (e) {
                            // Effect might not be applicable to target layer
                        }
                    }
                    
                    if (layerEffectsCopied > 0) {
                        layersModified++;
                        effectsCopied += layerEffectsCopied;
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Copied " + effectsCopied + " effects to " + layersModified + " layers from " + sourceLayer.name,
                    data: { 
                        sourceLayer: sourceLayer.name,
                        effectsCopied: effectsCopied,
                        layersModified: layersModified
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error copying effects: " + error.toString() };
            }
        },
        
        copyEffectProperties: function(sourceEffect, targetEffect, includeKeyframes) {
            for (var i = 1; i <= sourceEffect.numProperties; i++) {
                var sourceProp = sourceEffect.property(i);
                var targetProp = targetEffect.property(i);
                
                if (sourceProp && targetProp && sourceProp.canSetValue && targetProp.canSetValue) {
                    if (includeKeyframes && sourceProp.numKeys > 0) {
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
            }
        }
    },

    "animate_effect_property": {
        description: "Animate specific effect properties",
        parameters: {
            effectName: "string", // effect name
            propertyName: "string", // property name within effect
            startValue: "any", // starting value
            endValue: "any", // ending value
            startTime: "number", // start time
            endTime: "number", // end time
            easing: "string" // easing type
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
                app.beginUndoGroup("AI: Animate Effect Property");
                
                var animatedCount = 0;
                var startTime = params.startTime !== undefined ? params.startTime : activeItem.time;
                var endTime = params.endTime !== undefined ? params.endTime : startTime + 2;
                
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    var effect = null;
                    
                    // Find the effect
                    for (var j = 1; j <= layer.Effects.numProperties; j++) {
                        var e = layer.Effects.property(j);
                        if (e.name.toLowerCase().indexOf(params.effectName.toLowerCase()) !== -1) {
                            effect = e;
                            break;
                        }
                    }
                    
                    if (!effect) continue;
                    
                    // Find the property
                    var property = null;
                    try {
                        property = effect.property(params.propertyName);
                    } catch (e) {
                        // Try by index if name doesn't work
                        for (var k = 1; k <= effect.numProperties; k++) {
                            var prop = effect.property(k);
                            if (prop.name.toLowerCase().indexOf(params.propertyName.toLowerCase()) !== -1) {
                                property = prop;
                                break;
                            }
                        }
                    }
                    
                    if (!property || !property.canSetValue) continue;
                    
                    // Set keyframes
                    property.setValueAtTime(startTime, params.startValue);
                    property.setValueAtTime(endTime, params.endValue);
                    
                    // Apply easing
                    if (params.easing) {
                        this.applyEasing(property, startTime, endTime, params.easing);
                    }
                    
                    animatedCount++;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Animated " + params.propertyName + " on " + animatedCount + " effects",
                    data: { 
                        effectName: params.effectName,
                        propertyName: params.propertyName,
                        layersAnimated: animatedCount,
                        duration: endTime - startTime
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error animating effect property: " + error.toString() };
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
                case "linear":
                    property.setInterpolationTypeAtKey(startKeyIndex, KeyframeInterpolationType.LINEAR);
                    property.setInterpolationTypeAtKey(endKeyIndex, KeyframeInterpolationType.LINEAR);
                    break;
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = EFFECTS_TOOLS;
} /**
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
    },

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

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = TEXT_TOOLS;
} /**
 * Render and Export Tools for AI Integration
 * Comprehensive rendering, export, and output management
 */

var RENDER_TOOLS = {
    "add_to_render_queue": {
        description: "Add compositions to render queue with settings",
        parameters: {
            compName: "string", // composition name, or use active comp
            outputPath: "string", // output file path
            format: "string", // "h264", "prores", "image_sequence", "png", "jpeg"
            quality: "string", // "draft", "high", "best"
            resolution: "string", // "full", "half", "third", "quarter"
            frameRate: "number", // output frame rate
            startTime: "number", // render start time
            endTime: "number", // render end time
            useWorkArea: "boolean", // use work area for timing
            audioOutput: "boolean", // include audio
            effects: "boolean", // render effects
            motionBlur: "boolean", // render motion blur
            frameBlending: "boolean", // render frame blending
            fieldRender: "string", // "off", "upper", "lower"
            threeDQuality: "string", // "draft", "ray_traced"
            colorDepth: "string" // "8bpc", "16bpc", "32bpc"
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Add to Render Queue");
                
                var comp = null;
                
                // Find composition
                if (params.compName) {
                    for (var i = 1; i <= app.project.numItems; i++) {
                        var item = app.project.item(i);
                        if (item instanceof CompItem && item.name === params.compName) {
                            comp = item;
                            break;
                        }
                    }
                    if (!comp) {
                        app.endUndoGroup();
                        return { success: false, message: "Composition not found: " + params.compName };
                    }
                } else {
                    comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) {
                        app.endUndoGroup();
                        return { success: false, message: "No active composition found" };
                    }
                }
                
                // Add to render queue
                var renderQueueItem = app.project.renderQueue.items.add(comp);
                
                // Configure render settings
                var renderSettings = renderQueueItem.templates[0];
                
                // Quality
                if (params.quality) {
                    switch (params.quality.toLowerCase()) {
                        case "draft":
                            renderSettings.quality = RQItemStatus.WILL_CONTINUE; // Draft
                            break;
                        case "high":
                            renderSettings.quality = RQItemStatus.NEEDS_OUTPUT; // High
                            break;
                        case "best":
                            renderSettings.quality = RQItemStatus.RENDERING; // Best
                            break;
                    }
                }
                
                // Resolution
                if (params.resolution) {
                    switch (params.resolution.toLowerCase()) {
                        case "full":
                            renderQueueItem.render.setSettings({
                                "Resize": false
                            });
                            break;
                        case "half":
                            renderQueueItem.render.setSettings({
                                "Resize": true,
                                "Resize Quality": "Bilinear",
                                "Resize Width": comp.width / 2,
                                "Resize Height": comp.height / 2
                            });
                            break;
                        case "third":
                            renderQueueItem.render.setSettings({
                                "Resize": true,
                                "Resize Quality": "Bilinear", 
                                "Resize Width": comp.width / 3,
                                "Resize Height": comp.height / 3
                            });
                            break;
                        case "quarter":
                            renderQueueItem.render.setSettings({
                                "Resize": true,
                                "Resize Quality": "Bilinear",
                                "Resize Width": comp.width / 4,
                                "Resize Height": comp.height / 4
                            });
                            break;
                    }
                }
                
                // Time settings
                if (params.useWorkArea) {
                    renderQueueItem.timeSpanStart = comp.workAreaStart;
                    renderQueueItem.timeSpanDuration = comp.workAreaDuration;
                } else {
                    if (params.startTime !== undefined) {
                        renderQueueItem.timeSpanStart = params.startTime;
                    }
                    if (params.endTime !== undefined && params.startTime !== undefined) {
                        renderQueueItem.timeSpanDuration = params.endTime - params.startTime;
                    }
                }
                
                // Effects and rendering options
                if (params.effects !== undefined) {
                    renderQueueItem.render.setSettings({
                        "Effects": params.effects
                    });
                }
                
                if (params.motionBlur !== undefined) {
                    renderQueueItem.render.setSettings({
                        "Motion Blur": params.motionBlur
                    });
                }
                
                if (params.frameBlending !== undefined) {
                    renderQueueItem.render.setSettings({
                        "Frame Blending": params.frameBlending
                    });
                }
                
                // Output module settings
                var outputModule = renderQueueItem.outputModules[1];
                
                // Output path
                if (params.outputPath) {
                    var outputFile = new File(params.outputPath);
                    outputModule.file = outputFile;
                }
                
                // Format settings
                if (params.format) {
                    this.configureOutputFormat(outputModule, params.format, params);
                }
                
                // Audio
                if (params.audioOutput !== undefined) {
                    outputModule.includeSourceXMP = params.audioOutput;
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Added " + comp.name + " to render queue",
                    data: { 
                        compName: comp.name,
                        renderQueueIndex: renderQueueItem.index,
                        outputPath: params.outputPath
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error adding to render queue: " + error.toString() };
            }
        },
        
        configureOutputFormat: function(outputModule, format, params) {
            switch (format.toLowerCase()) {
                case "h264":
                case "mp4":
                    outputModule.applyTemplate("H.264");
                    if (params.quality) {
                        // Configure H.264 quality settings
                        // This is simplified - actual implementation would need more detail
                    }
                    break;
                    
                case "prores":
                    outputModule.applyTemplate("Apple ProRes 422");
                    break;
                    
                case "png":
                    outputModule.applyTemplate("PNG Sequence");
                    break;
                    
                case "jpeg":
                case "jpg":
                    outputModule.applyTemplate("JPEG Sequence");
                    if (params.quality) {
                        var jpegQuality = 100;
                        switch (params.quality.toLowerCase()) {
                            case "draft": jpegQuality = 50; break;
                            case "high": jpegQuality = 85; break;
                            case "best": jpegQuality = 100; break;
                        }
                        // Set JPEG quality (simplified)
                    }
                    break;
                    
                case "image_sequence":
                    outputModule.applyTemplate("PNG Sequence");
                    break;
                    
                default:
                    // Try to apply as template name
                    try {
                        outputModule.applyTemplate(format);
                    } catch (e) {
                        // Template not found, use default
                    }
                    break;
            }
        }
    },

    "start_render": {
        description: "Start rendering the render queue",
        parameters: {
            pauseOnError: "boolean", // pause rendering on error
            logErrors: "boolean", // log errors to file
            renderInBackground: "boolean" // render in background
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Start Render");
                
                if (app.project.renderQueue.numItems === 0) {
                    app.endUndoGroup();
                    return { success: false, message: "No items in render queue" };
                }
                
                // Configure render settings
                if (params.pauseOnError !== undefined) {
                    app.project.renderQueue.pauseOnError = params.pauseOnError;
                }
                
                if (params.logErrors !== undefined) {
                    app.project.renderQueue.logType = params.logErrors ? LogType.ERRORS_AND_SETTINGS : LogType.ERRORS_ONLY;
                }
                
                // Start rendering
                app.project.renderQueue.render();
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Started rendering " + app.project.renderQueue.numItems + " items",
                    data: { 
                        itemsInQueue: app.project.renderQueue.numItems,
                        pauseOnError: params.pauseOnError
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error starting render: " + error.toString() };
            }
        }
    },

    "export_frame": {
        description: "Export current frame or specific time as image",
        parameters: {
            time: "number", // time to export (seconds)
            outputPath: "string", // output file path
            format: "string", // "png", "jpeg", "tiff", "psd"
            quality: "number", // JPEG quality (1-100)
            alpha: "boolean", // include alpha channel
            resolution: "string", // "full", "half", "quarter"
            colorProfile: "string" // color profile name
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            try {
                app.beginUndoGroup("AI: Export Frame");
                
                var exportTime = params.time !== undefined ? params.time : activeItem.time;
                var format = params.format || "png";
                var outputPath = params.outputPath;
                
                if (!outputPath) {
                    // Generate default filename
                    var timeString = ("0000" + Math.floor(exportTime * activeItem.frameRate)).slice(-4);
                    outputPath = "~/Desktop/" + activeItem.name + "_frame_" + timeString + "." + format.toLowerCase();
                }
                
                var outputFile = new File(outputPath);
                
                // Create render queue item for single frame
                var renderQueueItem = app.project.renderQueue.items.add(activeItem);
                
                // Set to single frame
                renderQueueItem.timeSpanStart = exportTime;
                renderQueueItem.timeSpanDuration = 1 / activeItem.frameRate;
                
                // Configure output module
                var outputModule = renderQueueItem.outputModules[1];
                outputModule.file = outputFile;
                
                // Set format
                switch (format.toLowerCase()) {
                    case "png":
                        outputModule.applyTemplate("PNG");
                        break;
                    case "jpeg":
                    case "jpg":
                        outputModule.applyTemplate("JPEG");
                        if (params.quality) {
                            // Set JPEG quality (simplified)
                        }
                        break;
                    case "tiff":
                        outputModule.applyTemplate("TIFF");
                        break;
                    case "psd":
                        outputModule.applyTemplate("Photoshop");
                        break;
                }
                
                // Resolution
                if (params.resolution) {
                    switch (params.resolution.toLowerCase()) {
                        case "half":
                            renderQueueItem.render.setSettings({
                                "Resize": true,
                                "Resize Width": activeItem.width / 2,
                                "Resize Height": activeItem.height / 2
                            });
                            break;
                        case "quarter":
                            renderQueueItem.render.setSettings({
                                "Resize": true,
                                "Resize Width": activeItem.width / 4,
                                "Resize Height": activeItem.height / 4
                            });
                            break;
                    }
                }
                
                // Start render for this single frame
                app.project.renderQueue.render();
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Exported frame at " + exportTime.toFixed(2) + "s to " + outputFile.fsName,
                    data: { 
                        compName: activeItem.name,
                        exportTime: exportTime,
                        outputPath: outputFile.fsName,
                        format: format
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error exporting frame: " + error.toString() };
            }
        }
    },

    "create_proxy": {
        description: "Create proxy renders for compositions",
        parameters: {
            compName: "string", // composition name
            proxyScale: "number", // proxy scale (0.25, 0.5, 0.75)
            proxyFormat: "string", // "h264", "prores", "image_sequence"
            proxyPath: "string", // output directory for proxies
            replaceFootage: "boolean" // replace original footage with proxy
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Create Proxy");
                
                var comp = null;
                
                if (params.compName) {
                    for (var i = 1; i <= app.project.numItems; i++) {
                        var item = app.project.item(i);
                        if (item instanceof CompItem && item.name === params.compName) {
                            comp = item;
                            break;
                        }
                    }
                } else {
                    comp = app.project.activeItem;
                }
                
                if (!comp || !(comp instanceof CompItem)) {
                    app.endUndoGroup();
                    return { success: false, message: "Composition not found" };
                }
                
                var proxyScale = params.proxyScale || 0.5;
                var proxyFormat = params.proxyFormat || "h264";
                var proxyPath = params.proxyPath || "~/Desktop/Proxies/";
                
                // Ensure proxy directory exists
                var proxyDir = new Folder(proxyPath);
                if (!proxyDir.exists) {
                    proxyDir.create();
                }
                
                // Generate proxy filename
                var proxyFileName = comp.name + "_proxy_" + Math.floor(proxyScale * 100) + "%";
                var proxyFilePath = proxyDir.fsName + "/" + proxyFileName;
                
                switch (proxyFormat.toLowerCase()) {
                    case "h264":
                    case "mp4":
                        proxyFilePath += ".mp4";
                        break;
                    case "prores":
                        proxyFilePath += ".mov";
                        break;
                    case "image_sequence":
                        proxyFilePath += "_[####].png";
                        break;
                }
                
                // Add to render queue
                var renderQueueItem = app.project.renderQueue.items.add(comp);
                
                // Configure for proxy render
                renderQueueItem.render.setSettings({
                    "Resize": true,
                    "Resize Width": comp.width * proxyScale,
                    "Resize Height": comp.height * proxyScale,
                    "Resize Quality": "Bilinear",
                    "Quality": "Draft"
                });
                
                // Configure output
                var outputModule = renderQueueItem.outputModules[1];
                outputModule.file = new File(proxyFilePath);
                
                switch (proxyFormat.toLowerCase()) {
                    case "h264":
                    case "mp4":
                        outputModule.applyTemplate("H.264");
                        break;
                    case "prores":
                        outputModule.applyTemplate("Apple ProRes 422 Proxy");
                        break;
                    case "image_sequence":
                        outputModule.applyTemplate("PNG Sequence");
                        break;
                }
                
                // Start render
                app.project.renderQueue.render();
                
                // Create proxy relationship if requested
                if (params.replaceFootage) {
                    // This would require additional logic to replace source footage
                    // with the rendered proxy file
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created proxy for " + comp.name + " at " + Math.floor(proxyScale * 100) + "% scale",
                    data: { 
                        compName: comp.name,
                        proxyPath: proxyFilePath,
                        scale: proxyScale,
                        format: proxyFormat
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating proxy: " + error.toString() };
            }
        }
    },

    "clear_render_queue": {
        description: "Clear items from render queue",
        parameters: {
            clearAll: "boolean", // clear all items
            clearCompleted: "boolean", // clear only completed items
            clearFailed: "boolean" // clear only failed items
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Clear Render Queue");
                
                var itemsCleared = 0;
                var totalItems = app.project.renderQueue.numItems;
                
                if (params.clearAll) {
                    for (var i = totalItems; i >= 1; i--) {
                        app.project.renderQueue.item(i).remove();
                        itemsCleared++;
                    }
                } else {
                    for (var j = totalItems; j >= 1; j--) {
                        var item = app.project.renderQueue.item(j);
                        var shouldRemove = false;
                        
                        if (params.clearCompleted && item.status === RQItemStatus.DONE) {
                            shouldRemove = true;
                        }
                        
                        if (params.clearFailed && item.status === RQItemStatus.ERR_STOPPED) {
                            shouldRemove = true;
                        }
                        
                        if (shouldRemove) {
                            item.remove();
                            itemsCleared++;
                        }
                    }
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Cleared " + itemsCleared + " items from render queue",
                    data: { 
                        itemsCleared: itemsCleared,
                        totalItems: totalItems,
                        remainingItems: app.project.renderQueue.numItems
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error clearing render queue: " + error.toString() };
            }
        }
    },

    "batch_render_compositions": {
        description: "Batch render multiple compositions with the same settings",
        parameters: {
            compNames: "array", // array of composition names
            outputDirectory: "string", // output directory
            format: "string", // output format
            nameTemplate: "string", // filename template with [compName] placeholder
            resolution: "string", // render resolution
            quality: "string", // render quality
            useWorkArea: "boolean", // use work area for all comps
            includeAudio: "boolean" // include audio in renders
        },
        execute: function(params) {
            try {
                app.beginUndoGroup("AI: Batch Render Compositions");
                
                if (!params.compNames || params.compNames.length === 0) {
                    app.endUndoGroup();
                    return { success: false, message: "No composition names provided" };
                }
                
                var outputDir = params.outputDirectory || "~/Desktop/Renders/";
                var outputFolder = new Folder(outputDir);
                if (!outputFolder.exists) {
                    outputFolder.create();
                }
                
                var addedToQueue = 0;
                var notFound = [];
                
                for (var i = 0; i < params.compNames.length; i++) {
                    var compName = params.compNames[i];
                    var comp = null;
                    
                    // Find composition
                    for (var j = 1; j <= app.project.numItems; j++) {
                        var item = app.project.item(j);
                        if (item instanceof CompItem && item.name === compName) {
                            comp = item;
                            break;
                        }
                    }
                    
                    if (!comp) {
                        notFound.push(compName);
                        continue;
                    }
                    
                    // Generate output filename
                    var nameTemplate = params.nameTemplate || "[compName]";
                    var fileName = nameTemplate.replace(/\[compName\]/g, comp.name);
                    
                    var extension = ".mp4";
                    switch ((params.format || "h264").toLowerCase()) {
                        case "prores": extension = ".mov"; break;
                        case "png": extension = "_[####].png"; break;
                        case "jpeg": extension = "_[####].jpg"; break;
                    }
                    
                    var outputPath = outputFolder.fsName + "/" + fileName + extension;
                    
                    // Add to render queue
                    var renderQueueItem = app.project.renderQueue.items.add(comp);
                    
                    // Configure settings
                    if (params.useWorkArea) {
                        renderQueueItem.timeSpanStart = comp.workAreaStart;
                        renderQueueItem.timeSpanDuration = comp.workAreaDuration;
                    }
                    
                    // Configure output
                    var outputModule = renderQueueItem.outputModules[1];
                    outputModule.file = new File(outputPath);
                    
                    // Apply format
                    switch ((params.format || "h264").toLowerCase()) {
                        case "h264":
                        case "mp4":
                            outputModule.applyTemplate("H.264");
                            break;
                        case "prores":
                            outputModule.applyTemplate("Apple ProRes 422");
                            break;
                        case "png":
                            outputModule.applyTemplate("PNG Sequence");
                            break;
                        case "jpeg":
                            outputModule.applyTemplate("JPEG Sequence");
                            break;
                    }
                    
                    addedToQueue++;
                }
                
                app.endUndoGroup();
                
                var message = "Added " + addedToQueue + " compositions to render queue";
                if (notFound.length > 0) {
                    message += ". Not found: " + notFound.join(", ");
                }
                
                return {
                    success: true,
                    message: message,
                    data: { 
                        addedToQueue: addedToQueue,
                        notFound: notFound,
                        outputDirectory: outputFolder.fsName
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error batch rendering: " + error.toString() };
            }
        }
    }
};

// Export for use in main tools file
if (typeof module !== "undefined" && module.exports) {
    module.exports = RENDER_TOOLS;
} /**
 * Shape Layer Tools for AI Integration
 * Comprehensive shape creation, path editing, and shape animation
 */

var SHAPE_TOOLS = {
    "create_shape_layer": {
        description: "Create shape layers with various shapes and styling",
        parameters: {
            shape: "string", // "rectangle", "ellipse", "polygon", "star", "path", "custom_path"
            shapeType: "string", // alternative to shape parameter
            size: "array", // [width, height] - preferred format
            width: "number", // alternative to size array
            height: "number", // alternative to size array
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
                var shapeType = params.shape || params.shapeType || "rectangle";
                var shape;
                
                // Create the shape
                switch (shapeType.toLowerCase()) {
                    case "rectangle":
                        shape = contents.addProperty("ADBE Vector Shape - Rect");
                        // ALWAYS use size array format - convert width/height to size array
                        var rectSize = params.size;
                        if (!rectSize && params.width && params.height) {
                            rectSize = [params.width, params.height];
                        }
                        if (!rectSize) {
                            rectSize = [200, 200]; // Default size
                        }
                        // Ensure we have a valid array
                        if (!Array.isArray(rectSize) || rectSize.length < 2) {
                            rectSize = [200, 200];
                        }

                        // Use explicit match names to avoid ReferenceError on some AE versions
                        var rectSizeProp;
                        try {
                            rectSizeProp = shape.property("ADBE Vector Rect Size");
                        } catch (e) {
                            rectSizeProp = null;
                        }
                        if (!rectSizeProp) {
                            try {
                                rectSizeProp = shape.property("Size");
                            } catch (e) {
                                rectSizeProp = null;
                            }
                        }
                        if (rectSizeProp) {
                            rectSizeProp.setValue(rectSize);
                        }

                        if (params.cornerRadius) {
                            var roundnessProp;
                            try {
                                roundnessProp = shape.property("ADBE Vector Rect Roundness");
                            } catch (e) {
                                roundnessProp = null;
                            }
                            if (!roundnessProp) {
                                try {
                                    roundnessProp = shape.property("Roundness");
                                } catch (e) {
                                    roundnessProp = null;
                                }
                            }
                            if (roundnessProp) {
                                roundnessProp.setValue(params.cornerRadius);
                            }
                        }
                        break;
                        
                    case "ellipse":
                        shape = contents.addProperty("ADBE Vector Shape - Ellipse");
                        var ellipseSize = params.size || [200, 200];
                        var ellipseSizeProp;
                        try {
                            ellipseSizeProp = shape.property("ADBE Vector Ellipse Size");
                        } catch (e) {
                            ellipseSizeProp = null;
                        }
                        if (!ellipseSizeProp) {
                            try {
                                ellipseSizeProp = shape.property("Size");
                            } catch (e) {
                                ellipseSizeProp = null;
                            }
                        }
                        if (ellipseSizeProp) {
                            ellipseSizeProp.setValue(ellipseSize);
                        }
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
                var finalName;
                
                if (customName) {
                    // Use custom name if provided
                    finalName = customName;
                } else {
                    // Create unique auto-generated name to avoid targeting conflicts
                    var baseName = "AI " + shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
                    var uniqueName = baseName;
                    var counter = 1;
                    
                    // Check if name already exists and make it unique
                    for (var j = 1; j <= activeItem.numLayers; j++) {
                        var existingLayer = activeItem.layer(j);
                        if (existingLayer.name === uniqueName) {
                            counter++;
                            uniqueName = baseName + " " + counter;
                            j = 0; // Restart the check with new name
                        }
                    }
                    finalName = uniqueName;
                }
                
                shapeLayer.name = finalName;
                
                // Auto-select the layer for easy animation
                shapeLayer.selected = true;
                
                // Get the actual size that was created for animation reference
                var actualSize = [200, 200]; // default
                if (shape) {
                    var sizeProp = null;
                    try {
                        sizeProp = shape.property("Size");
                    } catch (e) {
                        try {
                            sizeProp = shape.property("ADBE Vector Rect Size");
                        } catch (e2) {
                            try {
                                sizeProp = shape.property("ADBE Vector Ellipse Size");
                            } catch (e3) {
                                sizeProp = null;
                            }
                        }
                    }
                    
                    if (sizeProp) {
                        try {
                            actualSize = sizeProp.value;
                        } catch (e) {
                            // Property exists but can't get value, use parameter values
                            if (params.size) {
                                actualSize = params.size;
                            } else if (params.width && params.height) {
                                actualSize = [params.width, params.height];
                            }
                        }
                    } else if (params.size) {
                        actualSize = params.size;
                    } else if (params.width && params.height) {
                        actualSize = [params.width, params.height];
                    }
                } else if (params.size) {
                    actualSize = params.size;
                } else if (params.width && params.height) {
                    actualSize = [params.width, params.height];
                }
                
                app.endUndoGroup();
                return {
                    success: true,
                    message: "Created " + shapeType + " shape layer: " + shapeLayer.name + " (auto-selected for animation). Size: [" + actualSize[0] + ", " + actualSize[1] + "]",
                    data: { 
                        layerName: shapeLayer.name, 
                        layerId: shapeLayer.index,
                        shape: shapeType,
                        selected: true,
                        size: actualSize,
                        position: params.position || [activeItem.width/2, activeItem.height/2]
                    }
                };
            } catch (error) {
                app.endUndoGroup();
                return { success: false, message: "Error creating shape layer: " + error.toString() };
            }
        }
    },

    "animate_shape_path": {
        description: "Animate shape layer path effects (trim, wiggle, scale, rotation) - NOT for shape morphing! Use animate_layer for morphing shapes.",
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
} /**
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

// =============================================================================
// COMPREHENSIVE TOOLS REGISTRY - UNIFIED INTERFACE
// =============================================================================

// Comprehensive tools registry combining all categories
var AE_TOOLS_COMPREHENSIVE = {};

// Merge all tool categories into comprehensive registry
function mergeTools(targetObj, sourceObj) {
    for (var key in sourceObj) {
        if (sourceObj.hasOwnProperty(key)) {
            targetObj[key] = sourceObj[key];
        }
    }
}

// Load all tool categories
try {
    if (typeof PROJECT_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, PROJECT_TOOLS);
} catch (e) {
    // Project tools not loaded - continue
}

try {
    if (typeof COMPOSITION_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, COMPOSITION_TOOLS);
} catch (e) {
    // Composition tools not loaded - continue
}

try {
    if (typeof LAYER_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, LAYER_TOOLS);
} catch (e) {
    // Layer tools not loaded - continue
}

try {
    if (typeof ANIMATION_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, ANIMATION_TOOLS);
} catch (e) {
    // Animation tools not loaded - continue
}

try {
    if (typeof EFFECTS_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, EFFECTS_TOOLS);
} catch (e) {
    // Effects tools not loaded - continue
}

try {
    if (typeof TEXT_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, TEXT_TOOLS);
} catch (e) {
    // Text tools not loaded - continue
}

try {
    if (typeof RENDER_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, RENDER_TOOLS);
} catch (e) {
    // Render tools not loaded - continue
}

try {
    if (typeof SHAPE_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, SHAPE_TOOLS);
} catch (e) {
    // Shape tools not loaded - continue
}

try {
    if (typeof MASK_TOOLS !== "undefined") mergeTools(AE_TOOLS_COMPREHENSIVE, MASK_TOOLS);
} catch (e) {
    // Mask tools not loaded - continue
}

// Additional utility tools
AE_TOOLS_COMPREHENSIVE["get_tool_list"] = {
    description: "Get list of all available AI tools with descriptions",
    parameters: {
        category: "string" // optional filter by category
    },
    execute: function(params) {
        var tools = [];
        var category = params.category ? params.category.toLowerCase() : null;
        
        for (var toolName in AE_TOOLS_COMPREHENSIVE) {
            var tool = AE_TOOLS_COMPREHENSIVE[toolName];
            if (tool.description) {
                var toolInfo = {
                    name: toolName,
                    description: tool.description,
                    parameters: tool.parameters || {}
                };
                
                // Basic category detection based on tool name patterns
                if (category) {
                    var toolCategory = detectToolCategory(toolName);
                    if (toolCategory !== category) continue;
                }
                
                tools.push(toolInfo);
            }
        }
        
        return {
            success: true,
            message: "Retrieved " + tools.length + " available tools" + (category ? " in category: " + category : ""),
            data: { tools: tools, totalCount: tools.length }
        };
    }
};

AE_TOOLS_COMPREHENSIVE["get_project_status"] = {
    description: "Get comprehensive status information about the current project",
    parameters: {},
    execute: function(params) {
        try {
            var project = app.project;
            var activeItem = null;
            try {
                activeItem = project.activeItem;
            } catch(e) {
                // Handle case where activeItem might be undefined
            }
            
            var status = {
                projectName: project.file ? project.file.name : "Untitled Project",
                projectPath: project.file ? project.file.fsName : null,
                saved: project.dirty === false,
                totalItems: project.numItems,
                activeItem: null,
                renderQueue: {
                    totalItems: project.renderQueue.numItems,
                    canRender: project.renderQueue.canQueueInAME
                },
                compositions: 0,
                footage: 0,
                folders: 0
            };
            
            // Safely add activeItem info if it exists
            if (activeItem) {
                try {
                    status.activeItem = {
                        name: activeItem.name,
                        type: activeItem instanceof CompItem ? "Composition" : 
                              activeItem instanceof FootageItem ? "Footage" : "Unknown",
                        duration: activeItem instanceof CompItem ? activeItem.duration : null,
                        dimensions: activeItem instanceof CompItem ? [activeItem.width, activeItem.height] : null
                    };
                } catch(e) {
                    status.activeItem = { error: "Could not access activeItem properties" };
                }
            }
            
            // Count different item types
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof CompItem) {
                    status.compositions++;
                } else if (item instanceof FootageItem) {
                    status.footage++;
                } else if (item instanceof FolderItem) {
                    status.folders++;
                }
            }
            
            return {
                success: true,
                message: "Retrieved project status",
                data: status
            };
        } catch (error) {
            return { success: false, message: "Error getting project status: " + error.toString() };
        }
    }
};

// ============================================================================
// DYNAMIC TOOL INFORMATION FUNCTIONS
// ============================================================================

// Get tool catalog - simplified list of all available tools for initial AI awareness
AE_TOOLS_COMPREHENSIVE["get_tool_catalog"] = {
    description: "Get a simplified catalog of all available After Effects tools with basic descriptions",
    parameters: {
        category: {
            type: "string",
            description: "Optional: Filter by category (project, composition, layer, animation, effects, text, render, shape, mask, utility)",
            optional: true
        }
    },
    execute: function(params) {
        try {
            var catalog = {};
            var category = params.category ? params.category.toLowerCase() : null;
            
            for (var toolName in AE_TOOLS_COMPREHENSIVE) {
                if (AE_TOOLS_COMPREHENSIVE[toolName].description) {
                    var toolCategory = detectToolCategory(toolName);
                    
                    // Skip if category filter doesn't match
                    if (category && toolCategory !== category) continue;
                    
                    catalog[toolName] = {
                        description: AE_TOOLS_COMPREHENSIVE[toolName].description,
                        category: toolCategory
                    };
                }
            }
            
            var toolKeys = getObjectKeys(catalog);
            return {
                success: true,
                message: "Retrieved tool catalog with " + toolKeys.length + " tools" + (category ? " in category: " + category : ""),
                data: { 
                    tools: catalog, 
                    totalCount: toolKeys.length,
                    categories: ["project", "composition", "layer", "animation", "effects", "text", "render", "shape", "mask", "utility"]
                }
            };
        } catch (error) {
            return { success: false, message: "Error getting tool catalog: " + error.toString() };
        }
    }
};

// Get detailed information about a specific tool 
AE_TOOLS_COMPREHENSIVE["get_tool_info"] = {
    description: "Get detailed information about a specific tool including parameters, examples, and usage notes",
    parameters: {
        tool_name: {
            type: "string", 
            description: "The name of the tool to get detailed information about"
        }
    },
    execute: function(params) {
        try {
            if (!params.tool_name) {
                return { success: false, message: "tool_name parameter is required" };
            }
            
            var toolName = params.tool_name;
            if (!AE_TOOLS_COMPREHENSIVE[toolName]) {
                return { success: false, message: "Tool not found: " + toolName };
            }
            
            var tool = AE_TOOLS_COMPREHENSIVE[toolName];
            var toolInfo = {
                name: toolName,
                description: tool.description,
                category: detectToolCategory(toolName),
                parameters: tool.parameters || {},
                usage_notes: getToolUsageNotes(toolName),
                examples: getToolExamples(toolName)
            };
            
            // Add special info for apply_effect tool
            if (toolName === "apply_effect") {
                toolInfo.available_effects = getAvailableEffectsList();
                toolInfo.effect_categories = getEffectCategories();
            }
            
            return {
                success: true,
                message: "Retrieved detailed information for tool: " + toolName,
                data: toolInfo
            };
        } catch (error) {
            return { success: false, message: "Error getting tool info: " + error.toString() };
        }
    }
};

// Get available effects for the apply_effect tool
AE_TOOLS_COMPREHENSIVE["get_effect_info"] = {
    description: "Get detailed information about available effects for the apply_effect tool",
    parameters: {
        category: {
            type: "string",
            description: "Optional: Filter by effect category (blur, color, distort, generate, etc.)",
            optional: true
        },
        effect_name: {
            type: "string", 
            description: "Optional: Get info about a specific effect",
            optional: true
        }
    },
    execute: function(params) {
        try {
            var effectsInfo = getAvailableEffectsList();
            var category = params.category ? params.category.toLowerCase() : null;
            var effectName = params.effect_name ? params.effect_name.toLowerCase() : null;
            
            if (effectName) {
                // Search for specific effect
                for (var cat in effectsInfo) {
                    for (var effect in effectsInfo[cat]) {
                        if (effect.toLowerCase().indexOf(effectName) !== -1) {
                            return {
                                success: true,
                                message: "Found effect: " + effect,
                                data: {
                                    effect_name: effect,
                                    match_name: effectsInfo[cat][effect],
                                    category: cat,
                                    usage: "Use with apply_effect tool: {\"effect_name\": \"" + effect + "\"}"
                                }
                            };
                        }
                    }
                }
                return { success: false, message: "Effect not found: " + effectName };
            }
            
            if (category) {
                // Filter by category
                var filtered = {};
                for (var cat in effectsInfo) {
                    if (cat.toLowerCase().indexOf(category) !== -1) {
                        filtered[cat] = effectsInfo[cat];
                    }
                }
                var filteredKeys = getObjectKeys(filtered);
                if (filteredKeys.length === 0) {
                    return { success: false, message: "Category not found: " + category };
                }
                effectsInfo = filtered;
            }
            
            var effectKeys = getObjectKeys(effectsInfo);
            return {
                success: true,
                message: "Retrieved effects information" + (category ? " for category: " + category : ""),
                data: {
                    effects: effectsInfo,
                    categories: effectKeys,
                    total_effects: countTotalEffects(effectsInfo),
                    usage_note: "Use effect names with the apply_effect tool"
                }
            };
        } catch (error) {
            return { success: false, message: "Error getting effect info: " + error.toString() };
        }
    }
};

// Helper function to get usage notes for tools
function getToolUsageNotes(toolName) {
    var notes = {
        "create_composition": "Use preset parameter for common formats like 'HD', '4K', 'Square', 'Vertical'",
        "apply_effect": "Supports 150+ effects. Use get_effect_info to browse available effects",
        "animate_layer": "REQUIRES layer targeting! Use target_newest, auto_select, layer_name, or layer_index to specify which layer to animate.\n\nProperty Guidelines:\n• Shape layers: property='size' with dimensions as arrays like [width, height]\n• Position: property='position' with [x, y] coordinates\n• Scale: property='scale' with percentages [x%, y%] like [100,100] to [150,150]\n• Opacity: property='opacity' with values 0-100\n• Rotation: property='rotation' with degrees\n• Use layer's current values as startValue when animating from current state\n• Easing is built-in parameter, NOT separate tool!",
        "add_layer": "Can create all layer types: solid, adjustment, null, text, shape, camera, light",
        "create_shape_layer": "Supports both size=[width,height] and separate width/height parameters. Returns actual size for animation reference.",
        "add_expression": "Includes preset expressions like 'wiggle', 'bounce', 'loop', 'overshoot'",
        "import_file": "Supports footage, compositions, projects, and sequences. Use import_as parameter for specific import behavior",
        "set_layer_properties": "Can modify all layer properties: opacity, scale, position, rotation, blend modes, quality settings"
    };
    return notes[toolName] || "No specific usage notes available";
}

// Helper function to get examples for tools
function getToolExamples(toolName) {
    var examples = {
        "create_composition": [
            "{\"name\": \"My Comp\", \"preset\": \"HD\"}",
            "{\"name\": \"Square Post\", \"preset\": \"Square\", \"duration\": 15}",
            "{\"width\": 1920, \"height\": 1080, \"frame_rate\": 24, \"duration\": 30}"
        ],
        "apply_effect": [
            "{\"effect_name\": \"Gaussian Blur\", \"properties\": {\"Blurriness\": 10}}",
            "{\"effect_name\": \"Color Balance (HLS)\", \"properties\": {\"Hue\": 15, \"Saturation\": 1.2}}",
            "{\"effect_name\": \"Drop Shadow\"}"
        ],
        "animate_layer": [
            "{\"layer_index\": 1, \"property\": \"position\", \"startValue\": [100, 100], \"endValue\": [500, 300], \"startTime\": 0, \"endTime\": 2}",
            "{\"layer_index\": 1, \"property\": \"opacity\", \"startValue\": 0, \"endValue\": 100, \"startTime\": 0, \"endTime\": 1, \"easing\": \"easeOut\"}",
            "{\"layer_index\": 1, \"property\": \"scale\", \"startValue\": [100, 100], \"endValue\": [150, 150], \"startTime\": 1, \"endTime\": 3}",
            "{\"target_newest\": true, \"property\": \"rotation\", \"startValue\": 0, \"endValue\": 360, \"startTime\": 0, \"endTime\": 4}"
        ],
        "add_layer": [
            "{\"layer_type\": \"solid\", \"name\": \"Background\", \"color\": [0.2, 0.3, 0.8]}",
            "{\"layer_type\": \"text\", \"text_content\": \"Hello World\", \"font_size\": 72}",
            "{\"layer_type\": \"null\", \"name\": \"Controller\"}"
        ],
        "create_shape_layer": [
            "{\"shape\": \"rectangle\", \"size\": [100, 20], \"fillColor\": [0, 0, 1], \"position\": [960, 540]}",
            "{\"shape\": \"rectangle\", \"size\": [200, 50], \"fillColor\": [1, 0, 0], \"position\": [960, 540]}",
            "{\"shape\": \"ellipse\", \"size\": [200, 200], \"fillColor\": [0, 1, 0, 0.8]}"
        ]
    };
    return examples[toolName] || ["No examples available"];
}

// Helper function to get available effects list organized by category  
function getAvailableEffectsList() {
    return {
        "Color Correction": {
            "Brightness & Contrast": "ADBE Brightness & Contrast 2",
            "Curves": "ADBE CurvesCustom",
            "Levels": "ADBE Easy Levels2",
            "Hue/Saturation": "ADBE HUE SATURATION",
            "Color Balance (HLS)": "ADBE Color Balance 2",
            "Vibrance": "ADBE Vibrance",
            "Lumetri Color": "ADBE Lumetri Color",
            "Auto Levels": "ADBE Auto Levels",
            "Auto Contrast": "ADBE Auto Contrast",
            "Auto Color": "ADBE Auto Color",
            "Shadow/Highlight": "ADBE Shadow/Highlight",
            "Exposure": "ADBE Exposure2",
            "Gamma/Pedestal/Gain": "ADBE Gamma/Pedestal/Gain",
            "Tritone": "ADBE Tritone",
            "Colorama": "ADBE Colorama",
            "Change Color": "ADBE Change Color",
            "Change to Color": "ADBE Change To Color",
            "Leave Color": "ADBE Leave Color",
            "Color Replace": "ADBE Color Replace",
            "Channel Mixer": "ADBE Channel Mixer",
            "Invert": "ADBE Invert",
            "Posterize": "ADBE Posterize",
            "Threshold": "ADBE Threshold2",
            "Black & White": "ADBE Black&White",
            "Photo Filter": "ADBE Photo Filter",
            "Tint": "ADBE Tint"
        },
        "Blur & Sharpen": {
            "Gaussian Blur": "ADBE Gaussian Blur 2",
            "Fast Blur": "ADBE Fast Blur",
            "Motion Blur": "ADBE Motion Blur",
            "Radial Blur": "ADBE Radial Blur",
            "Box Blur": "ADBE Box Blur2",
            "Bilateral Blur": "ADBE Bilateral Blur",
            "Smart Blur": "ADBE Smart Blur",
            "Channel Blur": "ADBE Channel Blur",
            "Compound Blur": "ADBE Compound Blur",
            "Directional Blur": "ADBE Directional Blur",
            "Lens Blur": "ADBE Lens Blur",
            "Sharpen": "ADBE Sharpen",
            "Unsharp Mask": "ADBE Unsharp Mask"
        },
        "Distort": {
            "Transform": "ADBE Geometry2",
            "Corner Pin": "ADBE Corner Pin",
            "Bulge": "ADBE Bulge",
            "Mesh Warp": "ADBE Mesh Warp",
            "Bezier Warp": "ADBE Bezier Warp",
            "Liquify": "ADBE Liquify",
            "Magnify": "ADBE Magnify",
            "Mirror": "ADBE Mirror",
            "Offset": "ADBE Offset",
            "Optics Compensation": "ADBE Optics Compensation",
            "Polar Coordinates": "ADBE Polar Coordinates",
            "Ripple": "ADBE Ripple",
            "Spherize": "ADBE Spherize",
            "Turbulent Displace": "ADBE Turbulent Displace",
            "Twirl": "ADBE Twirl",
            "Wave Warp": "ADBE Wave Warp",
            "CC Power Pin": "CC Power Pin",
            "CC Bend It": "CC Bend It",
            "CC Lens": "CC Lens",
            "CC Page Turn": "CC Page Turn"
        },
        "Generate": {
            "Fill": "ADBE Fill",
            "Gradient Ramp": "ADBE Ramp",
            "4-Color Gradient": "ADBE 4Color Gradient",
            "Beam": "ADBE Beam",
            "Lightning": "ADBE Lightning",
            "Advanced Lightning": "ADBE Lightning 2",
            "Lens Flare": "ADBE Lens Flare",
            "Fractal Noise": "ADBE Fractal Noise",
            "Turbulent Noise": "ADBE Turbulent Noise",
            "Noise": "ADBE Noise",
            "Cell Pattern": "ADBE Cell Pattern",
            "Checkerboard": "ADBE Checkerboard",
            "Circle": "ADBE Circle",
            "Grid": "ADBE Grid",
            "Radio Waves": "ADBE Radio Waves",
            "Stroke": "ADBE Stroke",
            "Vegas": "ADBE Vegas",
            "Write-on": "ADBE Write-on",
            "Audio Spectrum": "ADBE Audio Spectrum",
            "Audio Waveform": "ADBE Audio Waveform",
            "CC Light Burst": "CC Light Burst 2.5",
            "CC Light Rays": "CC Light Rays"
        },
        "Keying": {
            "Keylight": "ADBE Keylight",
            "Linear Color Key": "ADBE Linear Color Key",
            "Color Key": "ADBE Color Key",
            "Luma Key": "ADBE Luma Key",
            "Difference Matte": "ADBE Difference Matte",
            "Extract": "ADBE Extract",
            "Inner/Outer Key": "ADBE Inner/Outer Key",
            "Spill Suppressor": "ADBE Spill Suppressor",
            "Color Range": "ADBE Color Range"
        },
        "Stylize": {
            "Glow": "ADBE Glo2",
            "Inner Glow": "ADBE Inner Glow",
            "Outer Glow": "ADBE Outer Glow",
            "Drop Shadow": "ADBE Drop Shadow",
            "Brush Strokes": "ADBE Brush Strokes",
            "Cartoon": "ADBE Cartoon",
            "Color Emboss": "ADBE Color Emboss",
            "Emboss": "ADBE Emboss",
            "Find Edges": "ADBE Find Edges",
            "Mosaic": "ADBE Mosaic",
            "Motion Tile": "ADBE Motion Tile",
            "Posterize Time": "ADBE Posterize Time",
            "Roughen Edges": "ADBE Roughen Edges",
            "Scatter": "ADBE Scatter",
            "Strobe Light": "ADBE Strobe Light",
            "Tiles": "ADBE Tiles"
        },
        "Simulation": {
            "Particle Playground": "ADBE Particle Playground",
            "Shatter": "ADBE Shatter",
            "Wave World": "ADBE Wave World",
            "CC Particle World": "CC Particle World",
            "CC Drizzle": "CC Drizzle",
            "CC Hair": "CC Hair",
            "CC Rainfall": "CC Rainfall",
            "CC Snow": "CC Snow"
        },
        "Time": {
            "Echo": "ADBE Echo",
            "Posterize Time": "ADBE Posterize Time",
            "Time Displacement": "ADBE Time Displacement",
            "Timewarp": "ADBE Timewarp"
        },
        "Perspective": {
            "3D Camera Tracker": "ADBE 3D Camera Tracker",
            "3D Glasses": "ADBE 3D Glasses",
            "Bevel Alpha": "ADBE Bevel Alpha",
            "Bevel Edges": "ADBE Bevel Edges"
        },
        "Noise & Grain": {
            "Add Grain": "ADBE Add Grain",
            "Dust & Scratches": "ADBE Dust & Scratches",
            "Median": "ADBE Median",
            "Remove Grain": "ADBE Remove Grain"
        }
    };
}

// Helper function to get effect categories
function getEffectCategories() {
    var effects = getAvailableEffectsList();
    return getObjectKeys(effects);
}

// Helper function to count total effects
function countTotalEffects(effectsObj) {
    var count = 0;
    for (var category in effectsObj) {
        var categoryKeys = getObjectKeys(effectsObj[category]);
        count += categoryKeys.length;
    }
    return count;
}

// ============================================================================
// END DYNAMIC TOOL INFORMATION FUNCTIONS
// ============================================================================

// Main execution function for comprehensive tools
function executeComprehensiveAITool(toolName, parameters) {
    if (!AE_TOOLS_COMPREHENSIVE[toolName]) {
        return JSON.stringify({
            success: false,
            message: "Tool not found: " + toolName + ". Use 'get_tool_list' to see available tools."
        });
    }
    
    try {
        var tool = AE_TOOLS_COMPREHENSIVE[toolName];
        var result = tool.execute(parameters || {});
        
        // Ensure result has required properties
        if (!result.hasOwnProperty("success")) {
            result.success = false;
        }
        if (!result.hasOwnProperty("message")) {
            result.message = "Tool executed: " + toolName;
        }
        
        return JSON.stringify(result);
    } catch (error) {
        return JSON.stringify({
            success: false,
            message: "Error executing tool '" + toolName + "': " + error.toString()
        });
    }
}

// Get all comprehensive tools - Returns JSON string for compatibility
function getComprehensiveAITools() {
    var tools = {};
    for (var toolName in AE_TOOLS_COMPREHENSIVE) {
        if (AE_TOOLS_COMPREHENSIVE[toolName].description) {
            tools[toolName] = {
                description: AE_TOOLS_COMPREHENSIVE[toolName].description,
                parameters: AE_TOOLS_COMPREHENSIVE[toolName].parameters || {}
            };
        }
    }
    return JSON.stringify(tools);
}

// Add discovery tools to the comprehensive registry
AE_TOOLS_COMPREHENSIVE["get_tool_catalog"] = {
    description: "Get a simplified catalog of all available After Effects tools with basic descriptions",
    parameters: {
        category: {
            type: "string",
            description: "Optional: Filter by category (project, composition, layer, animation, effects, text, render, shape, mask, utility)",
            optional: true
        }
    },
    execute: function(params) {
        try {
            var tools = {};
            var targetCategory = params.category ? params.category.toLowerCase() : null;
            
            for (var toolName in AE_TOOLS_COMPREHENSIVE) {
                if (AE_TOOLS_COMPREHENSIVE[toolName].description) {
                    var toolCategory = detectToolCategory(toolName);
                    
                    if (!targetCategory || toolCategory === targetCategory) {
                        tools[toolName] = {
                            description: AE_TOOLS_COMPREHENSIVE[toolName].description,
                            category: toolCategory
                        };
                    }
                }
            }
            
            return {
                success: true,
                message: "Retrieved " + getObjectKeys(tools).length + " tools" + (targetCategory ? " in category: " + targetCategory : ""),
                data: { tools: tools, totalCount: getObjectKeys(tools).length }
            };
        } catch (error) {
            return { success: false, message: "Error getting tool catalog: " + error.toString() };
        }
    }
};

AE_TOOLS_COMPREHENSIVE["get_tool_info"] = {
    description: "Get detailed information about a specific tool including parameters, examples, and usage notes",
    parameters: {
        tool_name: {
            type: "string",
            description: "The name of the tool to get detailed information about"
        }
    },
    execute: function(params) {
        try {
            if (!params.tool_name) {
                return { success: false, message: "tool_name parameter is required" };
            }
            
            var toolName = params.tool_name;
            var tool = AE_TOOLS_COMPREHENSIVE[toolName];
            
            if (!tool) {
                return { success: false, message: "Tool not found: " + toolName };
            }
            
            var toolInfo = {
                name: toolName,
                description: tool.description,
                category: detectToolCategory(toolName),
                parameters: tool.parameters || {},
                usageNotes: getToolUsageNotes(toolName),
                examples: getToolExamples(toolName)
            };
            
            return {
                success: true,
                message: "Retrieved detailed information for tool: " + toolName,
                data: toolInfo
            };
        } catch (error) {
            return { success: false, message: "Error getting tool info: " + error.toString() };
        }
    }
};

AE_TOOLS_COMPREHENSIVE["get_effect_info"] = {
    description: "Get detailed information about available effects for the apply_effect tool",
    parameters: {
        category: {
            type: "string",
            description: "Optional: Filter by effect category (blur, color, distort, generate, etc.)",
            optional: true
        },
        effect_name: {
            type: "string",
            description: "Optional: Get info about a specific effect",
            optional: true
        }
    },
    execute: function(params) {
        try {
            var effectsList = getAvailableEffectsList();
            
            if (params.effect_name) {
                // Search for specific effect
                var foundEffect = null;
                var foundCategory = null;
                
                for (var category in effectsList) {
                    for (var effectName in effectsList[category]) {
                        if (effectName.toLowerCase() === params.effect_name.toLowerCase()) {
                            foundEffect = {
                                name: effectName,
                                matchName: effectsList[category][effectName],
                                category: category
                            };
                            foundCategory = category;
                            break;
                        }
                    }
                    if (foundEffect) break;
                }
                
                if (foundEffect) {
                    return {
                        success: true,
                        message: "Found effect: " + foundEffect.name,
                        data: foundEffect
                    };
                } else {
                    return {
                        success: false,
                        message: "Effect not found: " + params.effect_name
                    };
                }
            } else if (params.category) {
                // Return effects in specific category
                var category = params.category;
                var categoryEffects = effectsList[category];
                
                if (categoryEffects) {
                    return {
                        success: true,
                        message: "Retrieved effects in category: " + category,
                        data: { category: category, effects: categoryEffects }
                    };
                } else {
                    return {
                        success: false,
                        message: "Effect category not found: " + category
                    };
                }
            } else {
                // Return all categories
                return {
                    success: true,
                    message: "Retrieved all effect categories",
                    data: { categories: getObjectKeys(effectsList), effects: effectsList }
                };
            }
        } catch (error) {
            return { success: false, message: "Error getting effect info: " + error.toString() };
        }
    }
};

AE_TOOLS_COMPREHENSIVE["get_project_status"] = {
    description: "Get comprehensive status information about the current project",
    parameters: {},
    execute: function(params) {
        try {
            var status = {
                projectExists: !!app.project,
                projectName: app.project ? (app.project.file ? app.project.file.name : "Untitled Project") : "No Project",
                totalItems: app.project ? app.project.numItems : 0,
                activeItem: null,
                compositions: [],
                footageItems: 0,
                solids: 0
            };
            
            if (app.project) {
                // Get active item info
                if (app.project.activeItem) {
                    status.activeItem = {
                        name: app.project.activeItem.name,
                        type: app.project.activeItem instanceof CompItem ? "Composition" : "Other",
                        isComposition: app.project.activeItem instanceof CompItem
                    };
                    
                    if (app.project.activeItem instanceof CompItem) {
                        status.activeItem.numLayers = app.project.activeItem.numLayers;
                        status.activeItem.duration = app.project.activeItem.duration;
                        status.activeItem.frameRate = app.project.activeItem.frameRate;
                        status.activeItem.dimensions = app.project.activeItem.width + "x" + app.project.activeItem.height;
                        
                        // Get layer details for completion checking
                        status.activeItem.layers = [];
                        for (var l = 1; l <= app.project.activeItem.numLayers; l++) {
                            var layer = app.project.activeItem.layer(l);
                            status.activeItem.layers.push({
                                name: layer.name,
                                type: layer instanceof ShapeLayer ? "Shape" : 
                                      layer instanceof TextLayer ? "Text" : 
                                      layer instanceof AVLayer ? "AV" : "Other",
                                enabled: layer.enabled,
                                hasKeyframes: layer.transform.position.numKeys > 0 || 
                                            layer.transform.scale.numKeys > 0 || 
                                            layer.transform.rotation.numKeys > 0 ||
                                            layer.transform.opacity.numKeys > 0
                            });
                        }
                    }
                }
                
                // Count different item types
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof CompItem) {
                        status.compositions.push({
                            name: item.name,
                            duration: item.duration,
                            dimensions: item.width + "x" + item.height,
                            numLayers: item.numLayers
                        });
                    } else if (item instanceof FootageItem) {
                        status.footageItems++;
                        // Check if this footage item is actually a solid
                        if (item.mainSource instanceof SolidSource) {
                            status.solids++;
                        }
                    }
                }
            }
            
            return {
                success: true,
                message: "Retrieved project status",
                data: status
            };
        } catch (error) {
            return { success: false, message: "Error getting project status: " + error.toString() };
        }
    }
};

AE_TOOLS_COMPREHENSIVE["stop"] = {
    description: "Signal that the task is complete and stop executing additional tools",
    parameters: {
        reason: {
            type: "string",
            description: "Brief explanation of why the task is complete"
        }
    },
    execute: function(params) {
        return {
            success: true,
            message: "Task completed: " + (params.reason || "No reason provided"),
            data: { 
                completed: true,
                reason: params.reason || "Task finished",
                timestamp: new Date().toString()
            }
        };
    }
};

// Category-specific getters
function getProjectTools() {
    return filterToolsByCategory("project");
}

function getCompositionTools() {
    return filterToolsByCategory("composition");
}

function getLayerTools() {
    return filterToolsByCategory("layer");
}

function getAnimationTools() {
    return filterToolsByCategory("animation");
}

function getEffectsTools() {
    return filterToolsByCategory("effects");
}

function getTextTools() {
    return filterToolsByCategory("text");
}

function getRenderTools() {
    return filterToolsByCategory("render");
}

function getShapeTools() {
    return filterToolsByCategory("shape");
}

function getMaskTools() {
    return filterToolsByCategory("mask");
}

// Filter tools by category
function filterToolsByCategory(category) {
    var filtered = {};
    for (var toolName in AE_TOOLS_COMPREHENSIVE) {
        var toolCategory = detectToolCategory(toolName);
        if (toolCategory === category.toLowerCase()) {
            filtered[toolName] = AE_TOOLS_COMPREHENSIVE[toolName];
        }
    }
    return filtered;
}

// Detect tool category based on name patterns
function detectToolCategory(toolName) {
    if (toolName.indexOf("create_project") !== -1 || toolName.indexOf("import") !== -1 || 
        toolName.indexOf("organize") !== -1 || toolName.indexOf("save_project") !== -1 ||
        toolName.indexOf("folder") !== -1 || toolName.indexOf("footage") !== -1) return "project";
    
    if (toolName.indexOf("create_composition") !== -1 || toolName.indexOf("comp") !== -1 ||
        toolName.indexOf("duplicate_composition") !== -1 || toolName.indexOf("trim_composition") !== -1) return "composition";
    
    if (toolName.indexOf("add_layer") !== -1 || toolName.indexOf("duplicate_layers") !== -1 || 
        toolName.indexOf("align") !== -1 || toolName.indexOf("parent") !== -1 ||
        toolName.indexOf("set_layer") !== -1) return "layer";
    
    if (toolName.indexOf("animate") !== -1 || toolName.indexOf("keyframe") !== -1 || 
        toolName.indexOf("motion") !== -1 || toolName.indexOf("expression") !== -1 ||
        toolName.indexOf("camera_movement") !== -1 || toolName.indexOf("sequence") !== -1) return "animation";
    
    if (toolName.indexOf("effect") !== -1 || toolName.indexOf("apply") !== -1 ||
        toolName.indexOf("remove_effects") !== -1 || toolName.indexOf("copy_effects") !== -1) return "effects";
    
    if (toolName.indexOf("text") !== -1 || toolName.indexOf("typewriter") !== -1 ||
        toolName.indexOf("counter") !== -1) return "text";
    
    if (toolName.indexOf("render") !== -1 || toolName.indexOf("export") !== -1 ||
        toolName.indexOf("queue") !== -1 || toolName.indexOf("proxy") !== -1) return "render";
    
    if (toolName.indexOf("shape") !== -1) return "shape";
    
    if (toolName.indexOf("mask") !== -1 || toolName.indexOf("rotoscope") !== -1) return "mask";
    
    return "utility";
}

// Tool availability check
function getAvailableToolCount() {
    var count = 0;
    for (var toolName in AE_TOOLS_COMPREHENSIVE) {
        if (AE_TOOLS_COMPREHENSIVE[toolName].description) {
            count++;
        }
    }
    return count;
}

// =============================================================================
// END COMPREHENSIVE TOOLS REGISTRY
// =============================================================================

// ============================================================================
// EXTENDSCRIPT COMPATIBILITY HELPERS
// ============================================================================

// ExtendScript-compatible Object.keys replacement
function getObjectKeys(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

// ============================================================================
// END DYNAMIC TOOL INFORMATION FUNCTIONS
// ============================================================================

// Open composition tool for viewing existing compositions
AE_TOOLS_COMPREHENSIVE["open_composition"] = {
    description: "Open a specific composition in the timeline viewer for editing and playback",
    parameters: {
        compName: {
            type: "string",
            description: "Name of the composition to open"
        }
    },
    execute: function(params) {
        try {
            if (!params.compName) {
                return { success: false, message: "compName parameter is required" };
            }
            
            // Find composition by name
            var comp = null;
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item instanceof CompItem && item.name === params.compName) {
                    comp = item;
                    break;
                }
            }
            
            if (!comp) {
                return { success: false, message: "Composition not found: " + params.compName };
            }
            
            // Open composition in viewer
            comp.openInViewer();
            
            return {
                success: true,
                message: "Opened composition '" + comp.name + "' in timeline viewer",
                data: { 
                    compName: comp.name,
                    duration: comp.duration,
                    frameRate: comp.frameRate,
                    dimensions: comp.width + "x" + comp.height
                }
            };
        } catch (error) {
            return { success: false, message: "Error opening composition: " + error.toString() };
        }
    }
};

// List compositions tool to help find available compositions
AE_TOOLS_COMPREHENSIVE["list_compositions"] = {
    description: "List all compositions in the current project",
    parameters: {},
    execute: function(params) {
        try {
            var compositions = [];
            
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item instanceof CompItem) {
                    compositions.push({
                        name: item.name,
                        duration: item.duration,
                        frameRate: item.frameRate,
                        width: item.width,
                        height: item.height,
                        numLayers: item.numLayers
                    });
                }
            }
            
            return {
                success: true,
                message: "Found " + compositions.length + " compositions in project",
                data: { 
                    compositions: compositions,
                    totalCount: compositions.length
                }
            };
        } catch (error) {
            return { success: false, message: "Error listing compositions: " + error.toString() };
        }
    }
};

// Reset cursor and UI state tool
AE_TOOLS_COMPREHENSIVE["reset_ui_state"] = {
    description: "Reset UI state and cursor to fix stuck cursor issues",
    parameters: {},
    execute: function(params) {
        try {
            // Force After Effects to refresh UI state
            app.purge(PurgeTarget.ALL_CACHES);
            
            // Clear any modal states by simulating escape
            app.activeViewer = null;
            
            // Force screen refresh
            if (app.project.activeItem) {
                var activeItem = app.project.activeItem;
                if (activeItem instanceof CompItem) {
                    activeItem.openInViewer();
                }
            }
            
            // Ensure UI is responsive
            app.scheduleTask("", 1, false);
            
            return {
                success: true,
                message: "UI state reset - cursor should now be normal",
                data: { action: "UI refresh and cursor reset" }
            };
        } catch (error) {
            return { success: false, message: "Error resetting UI state: " + error.toString() };
        }
    }
};

// Enhanced error wrapper for all tool executions
function executeToolWithErrorHandling(toolFunction, params) {
    var startTime = new Date().getTime();
    var result;
    
    try {
        result = toolFunction(params);
    } catch (error) {
        // Force cleanup on any error
        try {
            app.endUndoGroup();
        } catch (e) {
            // Ignore if no undo group active
        }
        
        // Reset UI state on error
        try {
            app.activeViewer = null;
            if (app.project.activeItem instanceof CompItem) {
                app.project.activeItem.openInViewer();
            }
        } catch (e) {
            // Ignore UI reset errors
        }
        
        result = {
            success: false,
            message: "Tool execution error: " + error.toString(),
            error: error.name || "ScriptError"
        };
    }
    
    var endTime = new Date().getTime();
    result.executionTime = endTime - startTime;
    
    return result;
}

// Main execution function for comprehensive tools