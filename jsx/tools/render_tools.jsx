/**
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
} 