/**
 * Host script for After Effects - Performance Optimized
 * This file is executed in the After Effects scripting environment
 */

// Include comprehensive helper functions for data export
#include "helper_functions.jsx"

// Include AI tools for autonomous agent functionality
#include "ae_tools.jsx"

// Test function to verify evalScript is working
function testEvalScript() {
    return "EvalScript is working!";
}

// Simple test that returns hardcoded JSON
function testSimpleJSON() {
    return '{"success": true, "message": "Hardcoded test works", "data": []}';
}

// Wrapper function to test getVideoFootageLayers
function testGetVideoLayers() {
    try {
        // Check if the function exists
        if (typeof getVideoFootageLayers === 'undefined') {
            return JSON.stringify({
                success: false,
                message: "getVideoFootageLayers function not found - include failed"
            });
        }

        // Call the function
        var result = getVideoFootageLayers();
        return result;
    } catch (error) {
        return JSON.stringify({
            success: false,
            message: "Error calling getVideoFootageLayers: " + error.toString()
        });
    }
}

// Get video layers from the active composition
function getVideoFootageLayers() {
    try {
        // Get the active comp
        var activeComp = app.project.activeItem;

        // Check if the active item is a composition
        if (!activeComp || !(activeComp instanceof CompItem)) {
            return JSON.stringify({
                success: false,
                message: "No active composition"
            });
        }

        var videoLayers = [];
        var activeCompInfo = {
            name: activeComp.name,
            width: activeComp.width,
            height: activeComp.height,
            duration: activeComp.duration,
            frameRate: activeComp.frameRate
        };

        // Get all the layers in the comp
        var layers = activeComp.layers;

        // Loop through each layer
        for (var i = 1; i <= layers.length; i++) {
            var layer = layers[i];

            // Check if the layer is a footage layer (source is footage)
            if (layer.source && layer.source instanceof FootageItem) {
                var source = layer.source;
                var mainSource = source.mainSource;

                // Check if it has a file
                if (mainSource instanceof FileSource && mainSource.file) {
                    var filePath = mainSource.file;
                    var fileName = filePath.name;
                    var extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
                    var videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];

                    if (videoExtensions.indexOf(extension) !== -1) {
                        videoLayers.push({
                            name: layer.name,
                            sourceName: source.name,
                            filePath: filePath.fsName,
                            width: source.width,
                            height: source.height,
                            duration: source.duration,
                            frameRate: source.frameRate || 0,
                            id: source.id,
                            layerIndex: layer.index
                        });
                    }
                }
            }
        }

        return JSON.stringify({
            success: true,
            message: "Found " + videoLayers.length + " video layers",
            activeComp: activeCompInfo,
            data: videoLayers
        });

    } catch (error) {
        return JSON.stringify({
            success: false,
            message: "Error: " + error.toString()
        });
    }
}

// Utility functions - Simplified for performance
function validateActiveComp() {
    var activeItem = app.project.activeItem;
    if (!activeItem || !(activeItem instanceof CompItem)) {
        return null;
    }
    return activeItem;
}

function validateSelection(minLayers) {
    var activeItem = validateActiveComp();
    if (!activeItem) return null;
    
    var selectedLayers = activeItem.selectedLayers;
    if (selectedLayers.length < (minLayers || 1)) {
        return null;
    }
    return { comp: activeItem, layers: selectedLayers };
}

// Composition functions
function createStandardComposition() {
    try {
        app.beginUndoGroup("Create Standard Composition");
        
        var comp = app.project.items.addComp("New Composition", 1920, 1080, 1, 10, 30);
        comp.bgColor = [0.1, 0.1, 0.1];
        comp.openInViewer();
        
        app.endUndoGroup();
        return "Success: Created 1920x1080 composition";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function create4KComposition() {
    try {
        app.beginUndoGroup("Create 4K Composition");
        
        var comp = app.project.items.addComp("4K Composition", 3840, 2160, 1, 10, 30);
        comp.bgColor = [0.1, 0.1, 0.1];
        comp.openInViewer();
        
        app.endUndoGroup();
        return "Success: Created 4K composition";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function duplicateActiveComposition() {
    var activeItem = validateActiveComp();
    if (!activeItem) {
        return "Error: No active composition found";
    }
    
    try {
        app.beginUndoGroup("Duplicate Composition");
        
            var duplicate = activeItem.duplicate();
            duplicate.name = activeItem.name + " Copy";
            duplicate.openInViewer();
        
            app.endUndoGroup();
        return "Success: Composition duplicated";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function organizeCompositions() {
    try {
        app.beginUndoGroup("Organize Compositions");
        
        var compsFolder = app.project.items.addFolder("Compositions");
        var footageFolder = app.project.items.addFolder("Footage");
        var solidsFolder = app.project.items.addFolder("Solids");
        
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item.parentFolder === app.project.rootFolder) {
                if (item instanceof CompItem) {
                item.parentFolder = compsFolder;
                } else if (item instanceof FootageItem) {
                    if (item.mainSource instanceof SolidSource) {
                        item.parentFolder = solidsFolder;
                    } else {
                        item.parentFolder = footageFolder;
                    }
                }
            }
        }
        
        app.endUndoGroup();
        return "Success: Project organized into folders";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

// Layer functions
function addNullToActiveComp() {
    var activeItem = validateActiveComp();
    if (!activeItem) {
        return "Error: No active composition found";
    }
    
    try {
        app.beginUndoGroup("Add Null Object");
        
            var nullLayer = activeItem.layers.addNull();
            nullLayer.name = "Control Null";
        nullLayer.label = 5;
            nullLayer.transform.position.setValue([activeItem.width/2, activeItem.height/2]);
            
            app.endUndoGroup();
        return "Success: Control null added";
    } catch (error) {
            app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function addAdjustmentLayer() {
    var activeItem = validateActiveComp();
    if (!activeItem) {
            return "Error: No active composition found";
        }
    
    try {
        app.beginUndoGroup("Add Adjustment Layer");
        
        var adjLayer = activeItem.layers.addSolid([1, 1, 1], "Adjustment Layer", activeItem.width, activeItem.height, 1);
        adjLayer.adjustmentLayer = true;
        adjLayer.label = 14;
        
        app.endUndoGroup();
        return "Success: Adjustment layer added";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function centerAnchorPointsForSelected() {
    var selection = validateSelection();
    if (!selection) {
        return "Error: No layers selected";
    }
    
    try {
        app.beginUndoGroup("Center Anchor Points");
        
        var count = 0;
        for (var i = 0; i < selection.layers.length; i++) {
            var layer = selection.layers[i];
                if (layer.source && layer.source.width && layer.source.height) {
                    layer.transform.anchorPoint.setValue([layer.source.width/2, layer.source.height/2]);
                count++;
                }
            }
            
            app.endUndoGroup();
        return "Success: Centered anchor points for " + count + " layers";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function distributeLayersVertically() {
    var selection = validateSelection(2);
    if (!selection) {
        return "Error: Need at least 2 layers selected";
    }
    
    try {
        app.beginUndoGroup("Distribute Layers Vertically");
        
        var spacing = selection.comp.height / (selection.layers.length + 1);
            
        for (var i = 0; i < selection.layers.length; i++) {
            var layer = selection.layers[i];
                var newY = spacing * (i + 1);
                var currentPos = layer.transform.position.value;
                layer.transform.position.setValue([currentPos[0], newY]);
            }
            
            app.endUndoGroup();
        return "Success: " + selection.layers.length + " layers distributed vertically";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function distributeLayersHorizontally() {
    var selection = validateSelection(2);
    if (!selection) {
        return "Error: Need at least 2 layers selected";
    }
    
    try {
        app.beginUndoGroup("Distribute Layers Horizontally");
        
        var spacing = selection.comp.width / (selection.layers.length + 1);
            
        for (var i = 0; i < selection.layers.length; i++) {
            var layer = selection.layers[i];
                var newX = spacing * (i + 1);
                var currentPos = layer.transform.position.value;
                layer.transform.position.setValue([newX, currentPos[1]]);
            }
            
            app.endUndoGroup();
        return "Success: " + selection.layers.length + " layers distributed horizontally";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

// Animation functions
function easeSelectedKeyframes() {
    var selection = validateSelection();
    if (!selection) {
        return "Error: No layers selected";
    }
    
    try {
        app.beginUndoGroup("Ease Keyframes");
        
        var keyframeCount = 0;
        for (var i = 0; i < selection.layers.length; i++) {
            var layer = selection.layers[i];
                var selectedProps = layer.selectedProperties;
                
                for (var j = 0; j < selectedProps.length; j++) {
                    var prop = selectedProps[j];
                    if (prop.numKeys > 0) {
                        for (var k = 1; k <= prop.numKeys; k++) {
                            if (prop.keySelected(k)) {
                            var inEase = new KeyframeEase(0, 75);
                            var outEase = new KeyframeEase(0, 75);
                            
                            if (prop.propertyValueType === PropertyValueType.TwoD) {
                                prop.setTemporalEaseAtKey(k, [inEase, inEase], [outEase, outEase]);
                            } else {
                                prop.setTemporalEaseAtKey(k, [inEase], [outEase]);
                            }
                            keyframeCount++;
                            }
                        }
                    }
                }
            }
            
            app.endUndoGroup();
        return "Success: Applied ease to " + keyframeCount + " keyframes";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function sequenceSelectedLayers(offset) {
    var selection = validateSelection();
    if (!selection) {
        return "Error: No layers selected";
    }
    
    try {
        app.beginUndoGroup("Sequence Layers");
        
        var frameRate = selection.comp.frameRate;
            var offsetTime = offset / frameRate;
            
        for (var i = 0; i < selection.layers.length; i++) {
            var layer = selection.layers[i];
                layer.startTime = i * offsetTime;
            }
            
            app.endUndoGroup();
        return "Success: Sequenced " + selection.layers.length + " layers";
    } catch (error) {
            app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function createMotionGraphicsTemplate() {
    var activeItem = validateActiveComp();
    if (!activeItem) {
            return "Error: No active composition found";
        }
    
    try {
        app.beginUndoGroup("Create Motion Graphics Template");
        
        if (app.project.activeItem.motionGraphicsTemplateName === "") {
            app.project.activeItem.motionGraphicsTemplateName = activeItem.name + " Template";
        }
        
        app.endUndoGroup();
        return "Success: Motion graphics template created";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

// Text functions
function createTextLayerWithContent(textContent) {
    var activeItem = validateActiveComp();
    if (!activeItem) {
        return "Error: No active composition found";
    }
    
    try {
        app.beginUndoGroup("Create Text Layer");
        
            var textLayer = activeItem.layers.addText(textContent);
            textLayer.name = "Text - " + textContent.substring(0, 20);
            textLayer.transform.position.setValue([activeItem.width/2, activeItem.height/2]);
            
            var textDocument = textLayer.property("Source Text").value;
            textDocument.fontSize = 72;
        textDocument.fillColor = [1, 1, 1];
            textDocument.font = "Arial-BoldMT";
            textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
            
            textLayer.property("Source Text").setValue(textDocument);
            
            app.endUndoGroup();
        return "Success: Text layer created";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function animateTextLayerIn() {
    var selection = validateSelection();
    if (!selection) {
        return "Error: No layers selected";
    }
    
    try {
        app.beginUndoGroup("Animate Text In");
        
        var animatedCount = 0;
        var currentTime = selection.comp.time;
            
        for (var i = 0; i < selection.layers.length; i++) {
            var layer = selection.layers[i];
                if (layer instanceof TextLayer) {
                    var opacity = layer.transform.opacity;
                opacity.setValueAtTime(currentTime, 0);
                opacity.setValueAtTime(currentTime + 1, 100);
                    
                    var scale = layer.transform.scale;
                scale.setValueAtTime(currentTime, [80, 80]);
                scale.setValueAtTime(currentTime + 1, [100, 100]);
                
                animatedCount++;
                }
            }
            
            app.endUndoGroup();
        return "Success: Animated " + animatedCount + " text layers";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

// Export functions
function addActiveCompToRenderQueue() {
    var activeItem = validateActiveComp();
    if (!activeItem) {
        return "Error: No active composition found";
    }
    
    try {
            var renderQueueItem = app.project.renderQueue.items.add(activeItem);
        var outputFile = new File(app.project.file.parent.fsName + "/" + activeItem.name + "_v001.mov");
        renderQueueItem.outputModule(1).file = outputFile;
        
        return "Success: Added to render queue";
    } catch (error) {
        return "Error: " + error.toString();
    }
}

function exportCurrentFrame() {
    var activeItem = validateActiveComp();
    if (!activeItem) {
        return "Error: No active composition found";
    }
    
    try {
        var currentTime = activeItem.time;
        var frameNumber = Math.floor(currentTime * activeItem.frameRate);
        var outputFile = new File(app.project.file.parent.fsName + "/" + activeItem.name + "_frame_" + frameNumber + ".png");
        activeItem.saveFrameToPng(currentTime, outputFile);
        
        return "Success: Exported frame " + frameNumber;
    } catch (error) {
        return "Error: " + error.toString();
    }
}

// Utility functions
function optimizeProject() {
    try {
        app.beginUndoGroup("Optimize Project");
        
        var removed = app.project.removeUnusedFootage();
        app.project.consolidateFootage();
        
        app.endUndoGroup();
        return "Success: Removed " + removed.length + " unused items";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

function createQuickPreview() {
    var activeItem = validateActiveComp();
    if (!activeItem) {
            return "Error: No active composition found";
        }
    
    try {
        app.beginUndoGroup("Create Quick Preview");
        
        var originalResolution = activeItem.resolutionFactor;
        activeItem.resolutionFactor = [2, 2];
        
        app.executeCommand(2); // RAM Preview
        
        activeItem.resolutionFactor = originalResolution;
        
        app.endUndoGroup();
        return "Success: Quick preview initiated";
    } catch (error) {
        app.endUndoGroup();
        return "Error: " + error.toString();
    }
}

// Comprehensive Project Export Function with Full AE API Properties
function exportProjectToJSON() {
    try {
        var project = app.project;
        if (!project) {
            return JSON.stringify({
                error: "No active project found"
            });
        }

        var projectData = {
            // Enhanced project metadata with all available properties
            project: {
                name: project.file ? project.file.name : "Untitled Project",
                file_path: project.file ? project.file.fsName : null,
                num_items: project.numItems,
                active_item: project.activeItem ? project.activeItem.name : null,
                timecode_base: project.timecodeBase,
                bits_per_channel: project.bitsPerChannel,
                color_depth: project.bitsPerChannel,
                compensate_for_scene_referred_profiles: project.compensateForSceneReferredProfiles || false,
                dirty: project.dirty || false,
                project_path: project.file ? project.file.path : null,
                export_timestamp: new Date().toString()
            },
            activeComposition: null,
            compositions: [],
            items: [],
            renderQueue: []
        };

        // Enhanced active composition info
        if (project.activeItem && project.activeItem instanceof CompItem) {
            projectData.activeComposition = {
                name: project.activeItem.name,
                width: project.activeItem.width,
                height: project.activeItem.height,
                duration: project.activeItem.duration,
                frameRate: project.activeItem.frameRate,
                pixelAspect: project.activeItem.pixelAspect,
                workAreaStart: project.activeItem.workAreaStart,
                workAreaDuration: project.activeItem.workAreaDuration,
                bgColor: project.activeItem.bgColor,
                numLayers: project.activeItem.numLayers,
                time: project.activeItem.time
            };
        }

        // Export all project items with comprehensive properties
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            var itemData = {
                name: item.name,
                id: item.id,
                typeName: item.typeName,
                selected: item.selected,
                label: item.label,
                comment: item.comment || "",
                parentFolder: item.parentFolder ? item.parentFolder.name : "Root"
            };

            // Handle compositions with full properties
            if (item instanceof CompItem) {
                var compData = {
                    name: item.name,
                    id: item.id,
                    width: item.width,
                    height: item.height,
                    duration: item.duration,
                    frameRate: item.frameRate,
                    pixelAspect: item.pixelAspect,
                    numLayers: item.numLayers,
                    workAreaStart: item.workAreaStart,
                    workAreaDuration: item.workAreaDuration,
                    bgColor: item.bgColor,
                    time: item.time,
                    layers: []
                };

                // Export layers with ALL documented properties
                for (var j = 1; j <= item.numLayers; j++) {
                    var layer = item.layer(j);
                    var layerData = exportCompleteLayerData(layer);
                    compData.layers.push(layerData);
                }

                projectData.compositions.push(compData);
                itemData.composition = compData;
            }
            // Handle footage items with full properties
            else if (item instanceof FootageItem) {
                itemData.footage = {
                    id: item.id,
                    width: item.width,
                    height: item.height,
                    duration: item.duration,
                    frameRate: item.frameRate,
                    pixelAspect: item.pixelAspect,
                    hasVideo: item.hasVideo,
                    hasAudio: item.hasAudio,
                    file_path: item.file ? item.file.fsName : null,
                    mainSource: item.mainSource ? {
                        isStill: item.mainSource.isStill,
                        hasAlpha: item.mainSource.hasAlpha,
                        alphaMode: item.mainSource.alphaMode,
                        fieldSeparationType: item.mainSource.fieldSeparationType,
                        highQualityFieldSeparation: item.mainSource.highQualityFieldSeparation,
                        removePulldown: item.mainSource.removePulldown,
                        invertAlpha: item.mainSource.invertAlpha,
                        premulColor: item.mainSource.premulColor
                    } : null
                };
            }
            // Handle folder items
            else if (item instanceof FolderItem) {
                itemData.folder = {
                    numItems: item.numItems
                };
            }

            projectData.items.push(itemData);
        }

        // Export render queue with full properties
        for (var r = 1; r <= project.renderQueue.numItems; r++) {
            var rqItem = project.renderQueue.item(r);
            var rqData = {
                comp_name: rqItem.comp ? rqItem.comp.name : null,
                status: rqItem.status,
                logType: rqItem.logType,
                elapsedSeconds: rqItem.elapsedSeconds,
                startTime: rqItem.startTime ? rqItem.startTime.toString() : null,
                timeSpanStart: rqItem.timeSpanStart,
                timeSpanDuration: rqItem.timeSpanDuration,
                skipFrames: rqItem.skipFrames,
                numOutputModules: rqItem.numOutputModules
            };
            projectData.renderQueue.push(rqData);
        }

        return JSON.stringify(projectData);

    } catch (error) {
        return JSON.stringify({
            error: "Export failed: " + error.toString()
        });
    }
}

// Export complete layer data with ALL documented Layer and AVLayer properties
function exportCompleteLayerData(layer) {
    var layerData = {
        // Base Layer properties (from documentation)
        name: layer.name,
        index: layer.index,
        enabled: layer.enabled,
        selected: layer.selected,
        locked: layer.locked,
        shy: layer.shy,
        solo: layer.solo || false,
        inPoint: layer.inPoint,
        outPoint: layer.outPoint,
        startTime: layer.startTime,
        stretch: layer.stretch,
        time: layer.time,
        id: layer.id,
        label: layer.label,
        comment: layer.comment || "",
        hasVideo: layer.hasVideo,
        isNameSet: layer.isNameSet,
        nullLayer: layer.nullLayer,
        parent: layer.parent ? { name: layer.parent.name, index: layer.parent.index, id: layer.parent.id } : null,
        containingComp: layer.containingComp ? layer.containingComp.name : null
    };

    // Add AVLayer properties if applicable
    if (layer instanceof AVLayer) {
        layerData.type = "AVLayer";
        layerData.avLayerProperties = {
            adjustmentLayer: layer.adjustmentLayer,
            audioActive: layer.audioActive,
            audioEnabled: layer.audioEnabled,
            blendingMode: layer.blendingMode,
            collapseTransformation: layer.collapseTransformation,
            effectsActive: layer.effectsActive,
            environmentLayer: layer.environmentLayer || false,
            frameBlending: layer.frameBlending,
            frameBlendingType: layer.frameBlendingType,
            guideLayer: layer.guideLayer,
            hasAudio: layer.hasAudio,
            hasTrackMatte: layer.hasTrackMatte,
            height: layer.height,
            isNameFromSource: layer.isNameFromSource,
            isTrackMatte: layer.isTrackMatte,
            motionBlur: layer.motionBlur,
            preserveTransparency: layer.preserveTransparency,
            quality: layer.quality,
            samplingQuality: layer.samplingQuality,
            threeDLayer: layer.threeDLayer,
            threeDPerChar: layer.threeDPerChar || false,
            timeRemapEnabled: layer.timeRemapEnabled,
            trackMatteType: layer.trackMatteType,
            width: layer.width,
            source: layer.source ? {
                name: layer.source.name,
                id: layer.source.id,
                typeName: layer.source.typeName
            } : null
        };

        // Add specific layer type data
        if (layer instanceof TextLayer) {
            layerData.type = "TextLayer";
            layerData.textData = exportTextLayerData(layer);
        } else if (layer instanceof ShapeLayer) {
            layerData.type = "ShapeLayer";
            layerData.shapeData = exportShapeLayerData(layer);
        } else if (layer instanceof CameraLayer) {
            layerData.type = "CameraLayer";
            layerData.cameraData = exportCameraData(layer);
        } else if (layer instanceof LightLayer) {
            layerData.type = "LightLayer";
            layerData.lightData = exportLightData(layer);
        }
    } else {
        layerData.type = "Layer";
    }

    // Export comprehensive transform properties
    layerData.transform = exportTransformProperties(layer);
    
    // Export effects with full parameters
    layerData.effects = exportLayerEffects(layer);
    
    // Export masks with complete properties
    layerData.masks = exportLayerMasks(layer);
    
    // Export markers if present
    layerData.markers = exportLayerMarkers(layer);

    return layerData;
}

// Get list of compositions for the composition selector
function getCompositionList() {
    try {
        var project = app.project;
        if (!project) {
            return JSON.stringify([]);
        }

        var compositions = [];
        var activeCompName = null;
        
        if (project.activeItem && project.activeItem instanceof CompItem) {
            activeCompName = project.activeItem.name;
        }

        // Get all compositions in the project
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            
            if (item instanceof CompItem) {
                var compData = {
                    name: item.name,
                    width: item.width,
                    height: item.height,
                    duration: item.duration,
                    frameRate: item.frameRate,
                    layers: item.numLayers,
                    isActive: item.name === activeCompName
                };
                
                compositions.push(compData);
            }
        }

        return JSON.stringify(compositions);

    } catch (error) {
        return JSON.stringify({
            error: "Failed to get compositions: " + error.toString()
        });
    }
}

// Export selected compositions to JSON
function exportSelectedCompositionsToJSON(compositionNames) {
    try {
        var project = app.project;
        if (!project) {
            return JSON.stringify({
                error: "No active project found"
            });
        }

        var selectedCompNames = compositionNames; // This is already an array from JSON.parse
        
        var projectData = {
            projectName: project.file ? project.file.name : "Untitled Project",
            activeComposition: null,
            selectedCompositions: selectedCompNames,
            compositions: [],
            relatedItems: []
        };

        // Get active composition info
        if (project.activeItem && project.activeItem instanceof CompItem) {
            projectData.activeComposition = {
                name: project.activeItem.name,
                width: project.activeItem.width,
                height: project.activeItem.height,
                duration: project.activeItem.duration,
                frameRate: project.activeItem.frameRate
            };
        }

        // Find and export only selected compositions
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            
            if (item instanceof CompItem) {
                // Check if this composition is in our selected list
                var isSelected = false;
                for (var j = 0; j < selectedCompNames.length; j++) {
                    if (item.name === selectedCompNames[j]) {
                        isSelected = true;
                        break;
                    }
                }
                
                if (isSelected) {
                    var compData = {
                        name: item.name,
                        width: item.width,
                        height: item.height,
                        duration: item.duration,
                        frameRate: item.frameRate,
                        numLayers: item.numLayers,
                        layers: []
                    };

                    // Export layers for selected compositions
                    for (var k = 1; k <= item.numLayers; k++) {
                        var layer = item.layer(k);
                        var layerData = {
                            name: layer.name,
                            index: layer.index,
                            enabled: layer.enabled,
                            selected: layer.selected,
                            locked: layer.locked,
                            inPoint: layer.inPoint,
                            outPoint: layer.outPoint,
                            parent: layer.parent ? layer.parent.name : null
                        };

                        // Add layer type and source info
                        if (layer instanceof TextLayer) {
                            layerData.type = "TextLayer";
                            try {
                                var textProp = layer.property("Source Text");
                                if (textProp && textProp.value) {
                                    layerData.text = textProp.value.text;
                                }
                            } catch (e) {
                                layerData.text = "Could not read text";
                            }
                        } else if (layer instanceof ShapeLayer) {
                            layerData.type = "ShapeLayer";
                        } else if (layer instanceof AVLayer) {
                            layerData.type = "AVLayer";
                            if (layer.source) {
                                layerData.sourceName = layer.source.name;
                                
                                // Add this source to related items if not already included
                                var sourceExists = false;
                                for (var m = 0; m < projectData.relatedItems.length; m++) {
                                    if (projectData.relatedItems[m].name === layer.source.name) {
                                        sourceExists = true;
                                        break;
                                    }
                                }
                                
                                if (!sourceExists) {
                                    var sourceData = {
                                        name: layer.source.name,
                                        typeName: layer.source.typeName
                                    };
                                    
                                    if (layer.source instanceof FootageItem) {
                                        sourceData.footage = {
                                            width: layer.source.width,
                                            height: layer.source.height,
                                            duration: layer.source.duration,
                                            frameRate: layer.source.frameRate,
                                            hasVideo: layer.source.hasVideo,
                                            hasAudio: layer.source.hasAudio
                                        };
                                    }
                                    
                                    projectData.relatedItems.push(sourceData);
                                }
                            }
                        } else {
                            layerData.type = "Layer";
                        }

                        compData.layers.push(layerData);
                    }

                    projectData.compositions.push(compData);
                }
            }
        }

        return JSON.stringify(projectData);

    } catch (error) {
        return JSON.stringify({
            error: "Export failed: " + error.toString()
        });
    }
}