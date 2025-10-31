// Project Export Script - Captures comprehensive project data
// Returns JSON with complete project structure and content

function exportProjectData() {
    try {
        var project = app.project;
        if (!project) {
            return JSON.stringify({
                success: false,
                message: "No active project found"
            });
        }

        var projectData = {
            name: project.file ? project.file.name : "Untitled Project",
            numItems: project.numItems,
            activeItem: project.activeItem ? project.activeItem.name : null,
            items: [],
            renderQueue: [],
            settings: {
                timecodeBase: project.timecodeBase,
                compensateForSceneReferredProfiles: project.compensateForSceneReferredProfiles
            }
        };

        // Export all project items
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            var itemData = {
                index: i,
                name: item.name,
                typeName: item.typeName,
                id: item.id,
                parentFolder: item.parentFolder ? item.parentFolder.name : "Root",
                selected: item.selected,
                label: item.label,
                comment: item.comment
            };

            // Handle compositions
            if (item instanceof CompItem) {
                itemData.composition = exportComposition(item);
            }
            // Handle footage
            else if (item instanceof FootageItem) {
                itemData.footage = {
                    width: item.width,
                    height: item.height,
                    pixelAspect: item.pixelAspect,
                    duration: item.duration,
                    frameRate: item.frameRate,
                    hasVideo: item.hasVideo,
                    hasAudio: item.hasAudio,
                    file: item.file ? item.file.fsName : null
                };
            }
            // Handle folders
            else if (item instanceof FolderItem) {
                itemData.folder = {
                    numItems: item.numItems,
                    items: []
                };
                for (var j = 1; j <= item.numItems; j++) {
                    itemData.folder.items.push({
                        name: item.item(j).name,
                        typeName: item.item(j).typeName
                    });
                }
            }

            projectData.items.push(itemData);
        }

        // Export render queue
        for (var r = 1; r <= app.project.renderQueue.numItems; r++) {
            var rqItem = app.project.renderQueue.item(r);
            projectData.renderQueue.push({
                comp: rqItem.comp ? rqItem.comp.name : null,
                status: rqItem.status,
                logType: rqItem.logType,
                elapsedSeconds: rqItem.elapsedSeconds,
                startTime: rqItem.startTime ? rqItem.startTime.toString() : null
            });
        }

        return JSON.stringify({
            success: true,
            message: "Project exported successfully",
            data: projectData
        });

    } catch (error) {
        return JSON.stringify({
            success: false,
            message: "Export failed: " + error.toString()
        });
    }
}

function exportComposition(comp) {
    var compData = {
        width: comp.width,
        height: comp.height,
        duration: comp.duration,
        frameRate: comp.frameRate,
        pixelAspect: comp.pixelAspect,
        numLayers: comp.numLayers,
        workAreaStart: comp.workAreaStart,
        workAreaDuration: comp.workAreaDuration,
        bgColor: comp.bgColor,
        layers: []
    };

    // Export all layers
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var layerData = exportLayer(layer);
        compData.layers.push(layerData);
    }

    return compData;
}

function exportLayer(layer) {
    var layerData = {
        index: layer.index,
        name: layer.name,
        enabled: layer.enabled,
        selected: layer.selected,
        locked: layer.locked,
        shy: layer.shy,
        inPoint: layer.inPoint,
        outPoint: layer.outPoint,
        startTime: layer.startTime,
        stretch: layer.stretch,
        blendingMode: layer.blendingMode,
        isNameSet: layer.isNameSet,
        label: layer.label,
        comment: layer.comment,
        nullLayer: layer.nullLayer,
        adjustmentLayer: layer.adjustmentLayer,
        threeDLayer: layer.threeDLayer,
        guideLayer: layer.guideLayer,
        hasVideo: layer.hasVideo,
        hasAudio: layer.hasAudio,
        active: layer.active,
        parent: layer.parent ? layer.parent.name : null,
        quality: layer.quality,
        effects: []
    };

    // Add layer type specific data
    if (layer instanceof TextLayer) {
        layerData.type = "TextLayer";
        try {
            var textProp = layer.property("Source Text");
            if (textProp) {
                layerData.textData = {
                    text: textProp.value.text,
                    font: textProp.value.font,
                    fontSize: textProp.value.fontSize,
                    fillColor: textProp.value.fillColor,
                    strokeColor: textProp.value.strokeColor,
                    strokeWidth: textProp.value.strokeWidth,
                    justification: textProp.value.justification
                };
            }
        } catch (e) {
            layerData.textData = { error: "Could not read text data: " + e.toString() };
        }
    } else if (layer instanceof ShapeLayer) {
        layerData.type = "ShapeLayer";
        layerData.shapeData = exportShapeLayer(layer);
    } else if (layer instanceof AVLayer) {
        layerData.type = "AVLayer";
        if (layer.source) {
            layerData.source = {
                name: layer.source.name,
                typeName: layer.source.typeName
            };
        }
    } else {
        layerData.type = "Layer";
    }

    // Export transform properties
    layerData.transform = exportTransform(layer);

    // Export effects
    var effects = layer.property("ADBE Effect Parade");
    if (effects) {
        for (var e = 1; e <= effects.numProperties; e++) {
            var effect = effects.property(e);
            layerData.effects.push(exportEffect(effect));
        }
    }

    return layerData;
}

function exportTransform(layer) {
    var transform = layer.property("Transform");
    var transformData = {};

    var properties = [
        "Anchor Point", "Position", "Scale", "Rotation", 
        "Opacity", "X Rotation", "Y Rotation", "Z Rotation", "Orientation"
    ];

    for (var i = 0; i < properties.length; i++) {
        var propName = properties[i];
        try {
            var prop = transform.property(propName);
            if (prop) {
                transformData[propName] = exportProperty(prop);
            }
        } catch (e) {
            // Property doesn't exist on this layer type
        }
    }

    return transformData;
}

function exportEffect(effect) {
    var effectData = {
        name: effect.name,
        matchName: effect.matchName,
        enabled: effect.enabled,
        properties: {}
    };

    for (var p = 1; p <= effect.numProperties; p++) {
        var prop = effect.property(p);
        if (prop) {
            effectData.properties[prop.name] = exportProperty(prop);
        }
    }

    return effectData;
}

function exportShapeLayer(layer) {
    try {
        var contents = layer.property("ADBE Root Vectors Group");
        if (contents) {
            return exportPropertyGroup(contents);
        }
    } catch (e) {
        return { error: "Could not export shape data: " + e.toString() };
    }
    return {};
}

function exportPropertyGroup(propGroup) {
    var groupData = {
        name: propGroup.name,
        matchName: propGroup.matchName,
        numProperties: propGroup.numProperties,
        properties: {}
    };

    for (var i = 1; i <= propGroup.numProperties; i++) {
        try {
            var prop = propGroup.property(i);
            if (prop) {
                if (prop.propertyType === PropertyType.PROPERTY) {
                    groupData.properties[prop.name] = exportProperty(prop);
                } else if (prop.propertyType === PropertyType.INDEXED_GROUP || 
                          prop.propertyType === PropertyType.NAMED_GROUP) {
                    groupData.properties[prop.name] = exportPropertyGroup(prop);
                }
            }
        } catch (e) {
            groupData.properties["property_" + i] = { error: e.toString() };
        }
    }

    return groupData;
}

function exportProperty(prop) {
    var propData = {
        name: prop.name,
        matchName: prop.matchName,
        propertyValueType: prop.propertyValueType,
        value: null,
        expression: null,
        expressionEnabled: false,
        numKeys: 0,
        keyframes: []
    };

    try {
        // Get current value
        if (prop.value !== null && prop.value !== undefined) {
            propData.value = prop.value;
        }
    } catch (e) {
        propData.valueError = e.toString();
    }

    try {
        // Get expression
        if (prop.expressionEnabled) {
            propData.expressionEnabled = true;
            propData.expression = prop.expression;
        }
    } catch (e) {
        propData.expressionError = e.toString();
    }

    try {
        // Get keyframes
        propData.numKeys = prop.numKeys;
        if (prop.numKeys > 0) {
            for (var k = 1; k <= Math.min(prop.numKeys, 50); k++) { // Limit to 50 keyframes
                var keyData = {
                    keyTime: prop.keyTime(k),
                    keyValue: prop.keyValue(k)
                };

                try {
                    keyData.keyInInterpolationType = prop.keyInInterpolationType(k);
                    keyData.keyOutInterpolationType = prop.keyOutInterpolationType(k);
                } catch (e) {
                    // Some properties don't support interpolation types
                }

                propData.keyframes.push(keyData);
            }
        }
    } catch (e) {
        propData.keyframeError = e.toString();
    }

    return propData;
}

// Execute the export
exportProjectData(); 