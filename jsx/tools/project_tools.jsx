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
} 