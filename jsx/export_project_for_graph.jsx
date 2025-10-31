// Enhanced Project Export for HelixDB Knowledge Graph
// Exports comprehensive project data optimized for graph database ingestion
// Includes semantic content, relationships, and temporal data

function exportProjectForGraph() {
    try {
        
        var project = app.project;
        if (!project) {
            return JSON.stringify({
                success: false,
                message: "No active project found"
            });
        }
        

        var projectData = {
            // Core project metadata
            project: {
                name: project.file ? project.file.name : "Untitled Project",
                file_path: project.file ? project.file.fsName : null,
                num_items: project.numItems,
                active_item: project.activeItem ? project.activeItem.name : null,
                timecode_base: project.timecodeBase,
                bits_per_channel: project.bitsPerChannel,
                compensate_for_scene_referred_profiles: project.compensateForSceneReferredProfiles,
                exported_at: new Date().toString()
            },
            
            // Graph data structures
            nodes: [],
            edges: [],
            
            // Semantic content for embeddings
            embedding_content: []
        };

        // Create project root node
        var projectNode = {
            id: "project_root",
            type: "Project",
            properties: projectData.project
        };
        projectData.nodes.push(projectNode);
        
        // Add project name for embedding
        if (projectData.project.name) {
            projectData.embedding_content.push({
                id: "project_root",
                field: "name",
                content: projectData.project.name,
                type: "name"
            });
        }

        // Export all project items with graph relationships
        exportProjectItems(project, projectData);
        
        // Export render queue information
        exportRenderQueue(project, projectData);

        return JSON.stringify({
            success: true,
            message: "Project exported for graph database",
            data: projectData,
            stats: {
                total_nodes: projectData.nodes.length,
                total_edges: projectData.edges.length,
                embedding_entries: projectData.embedding_content.length
            }
        });

    } catch (error) {
        return JSON.stringify({
            success: false,
            message: "Export failed: " + error.toString()
        });
    }
}


function exportProjectItems(project, projectData) {
    // Track folder relationships for hierarchy building
    var folderHierarchy = {};
    
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        var itemId = "item_" + item.id;
        
        var itemNode = {
            id: itemId,
            type: getItemType(item),
            properties: {
                name: item.name,
                index: i,
                id: item.id,
                type_name: item.typeName,
                selected: item.selected,
                label: item.label,
                comment: item.comment || "",
                parent_folder: item.parentFolder ? item.parentFolder.name : "Root"
            }
        };

        // Add type-specific data
        if (item instanceof CompItem) {
            addCompositionData(item, itemNode, projectData);
        } else if (item instanceof FootageItem) {
            addFootageData(item, itemNode, projectData);
        } else if (item instanceof FolderItem) {
            addFolderData(item, itemNode, projectData);
            folderHierarchy[item.name] = itemId;
        }

        projectData.nodes.push(itemNode);
        
        // Add semantic content for embedding
        addItemEmbeddingContent(item, itemId, projectData);
        
        // Create hierarchy edges
        createHierarchyEdges(item, itemId, projectData, folderHierarchy);
    }
}

function getItemType(item) {
    if (item instanceof CompItem) return "Composition";
    if (item instanceof FootageItem) return "FootageItem";
    if (item instanceof FolderItem) return "ProjectFolder";
    return "Item";
}

function addCompositionData(comp, node, projectData) {
    node.properties.composition = {
        width: comp.width,
        height: comp.height,
        duration: comp.duration,
        frame_rate: comp.frameRate,
        pixel_aspect: comp.pixelAspect,
        num_layers: comp.numLayers,
        work_area_start: comp.workAreaStart,
        work_area_duration: comp.workAreaDuration,
        bg_color: comp.bgColor
    };

    // Export all layers in this composition
    exportCompositionLayers(comp, node.id, projectData);
}

function addFootageData(footage, node, projectData) {
    node.properties.footage = {
        width: footage.width,
        height: footage.height,
        pixel_aspect: footage.pixelAspect,
        duration: footage.duration,
        frame_rate: footage.frameRate,
        has_video: footage.hasVideo,
        has_audio: footage.hasAudio,
        file_path: footage.file ? footage.file.fsName : null
    };
    
    // Add file path for embedding if exists
    if (footage.file) {
        projectData.embedding_content.push({
            id: node.id,
            field: "file_path",
            content: footage.file.fsName,
            type: "file_path"
        });
    }
}

function addFolderData(folder, node, projectData) {
    node.properties.folder = {
        num_items: folder.numItems
    };
    
    // Export folder contents for relationship mapping
    var folderItems = [];
    for (var j = 1; j <= folder.numItems; j++) {
        var folderItem = folder.item(j);
        folderItems.push({
            id: folderItem.id,
            name: folderItem.name,
            type_name: folderItem.typeName
        });
    }
    node.properties.folder.items = folderItems;
}

function exportCompositionLayers(comp, compId, projectData) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var layerId = compId + "_layer_" + layer.index;
        
        var layerNode = exportLayerAsNode(layer, layerId, projectData);
        projectData.nodes.push(layerNode);
        
        // Create CONTAINS edge from composition to layer
        projectData.edges.push({
            from: compId,
            to: layerId,
            type: "CONTAINS",
            properties: {
                index: layer.index,
                relationship: "composition_layer"
            }
        });
        
        // Create parenting edges if layer has parent
        if (layer.parent) {
            var parentId = compId + "_layer_" + layer.parent.index;
            projectData.edges.push({
                from: layerId,
                to: parentId,
                type: "PARENTS_TO",
                properties: {
                    relationship: "layer_parenting"
                }
            });
        }
        
        // Create source usage edges
        if (layer instanceof AVLayer && layer.source) {
            var sourceId = "item_" + layer.source.id;
            projectData.edges.push({
                from: layerId,
                to: sourceId,
                type: "USES_SOURCE",
                properties: {
                    relationship: "layer_source"
                }
            });
        }
        
        // Export layer properties and effects
        exportLayerProperties(layer, layerId, projectData);
        exportLayerEffects(layer, layerId, projectData);
    }
}

function exportLayerAsNode(layer, layerId, projectData) {
    var layerType = getLayerType(layer);
    
    var layerNode = {
        id: layerId,
        type: layerType,
        properties: {
            name: layer.name,
            index: layer.index,
            enabled: layer.enabled,
            selected: layer.selected,
            locked: layer.locked,
            shy: layer.shy,
            in_point: layer.inPoint,
            out_point: layer.outPoint,
            start_time: layer.startTime,
            stretch: layer.stretch,
            blending_mode: layer.blendingMode,
            is_name_set: layer.isNameSet,
            label: layer.label,
            comment: layer.comment || "",
            null_layer: layer.nullLayer,
            adjustment_layer: layer.adjustmentLayer,
            three_d_layer: layer.threeDLayer,
            guide_layer: layer.guideLayer,
            has_video: layer.hasVideo,
            has_audio: layer.hasAudio,
            active: layer.active,
            quality: layer.quality
        }
    };

    // Add layer-type specific data
    if (layer instanceof TextLayer) {
        addTextLayerData(layer, layerNode, projectData);
    } else if (layer instanceof ShapeLayer) {
        addShapeLayerData(layer, layerNode, projectData);
    } else if (layer instanceof CameraLayer) {
        addCameraLayerData(layer, layerNode, projectData);
    } else if (layer instanceof LightLayer) {
        addLightLayerData(layer, layerNode, projectData);
    }

    // Add semantic content for embedding
    addLayerEmbeddingContent(layer, layerId, projectData);
    
    return layerNode;
}

function getLayerType(layer) {
    if (layer instanceof TextLayer) return "TextLayer";
    if (layer instanceof ShapeLayer) return "ShapeLayer";
    if (layer instanceof CameraLayer) return "CameraLayer";
    if (layer instanceof LightLayer) return "LightLayer";
    if (layer instanceof AVLayer) return "AVLayer";
    return "Layer";
}

function addTextLayerData(layer, node, projectData) {
    try {
        var textProp = layer.property("Source Text");
        if (textProp && textProp.value) {
            var textValue = textProp.value;
            node.properties.text_data = {
                text_content: textValue.text || "",
                font: textValue.font || "",
                font_size: textValue.fontSize || 12,
                fill_color: textValue.fillColor || [1, 1, 1],
                stroke_color: textValue.strokeColor || [0, 0, 0],
                stroke_width: textValue.strokeWidth || 0,
                justification: textValue.justification || 0
            };
            
            // Add text content for embedding
            if (textValue.text) {
                projectData.embedding_content.push({
                    id: node.id,
                    field: "text_content",
                    content: textValue.text,
                    type: "text_content"
                });
            }
        }
    } catch (e) {
        node.properties.text_data = { error: "Could not read text data: " + e.toString() };
    }
}

function addShapeLayerData(layer, node, projectData) {
    try {
        var contents = layer.property("ADBE Root Vectors Group");
        if (contents) {
            node.properties.shape_data = exportPropertyGroupForGraph(contents, node.id + "_shapes", projectData);
        }
    } catch (e) {
        node.properties.shape_data = { error: "Could not export shape data: " + e.toString() };
    }
}

function addCameraLayerData(layer, node, projectData) {
    // Camera-specific properties would be added here
    node.properties.camera_data = {
        camera_type: "3D Camera"
    };
}

function addLightLayerData(layer, node, projectData) {
    // Light-specific properties would be added here
    node.properties.light_data = {
        light_type: "3D Light"
    };
}

function exportLayerProperties(layer, layerId, projectData) {
    // Export transform properties
    var transform = layer.property("Transform");
    if (transform) {
        var transformId = layerId + "_transform";
        var transformNode = {
            id: transformId,
            type: "PropertyGroup",
            properties: {
                name: "Transform",
                match_name: "ADBE Transform Group"
            }
        };
        projectData.nodes.push(transformNode);
        
        // Create edge from layer to transform
        projectData.edges.push({
            from: layerId,
            to: transformId,
            type: "CONTAINS",
            properties: {
                relationship: "layer_transform"
            }
        });
        
        // Export individual transform properties
        var transformProps = [
            "Anchor Point", "Position", "Scale", "Rotation", 
            "Opacity", "X Rotation", "Y Rotation", "Z Rotation", "Orientation"
        ];
        
        for (var i = 0; i < transformProps.length; i++) {
            try {
                var prop = transform.property(transformProps[i]);
                if (prop) {
                    exportPropertyAsNode(prop, transformId + "_" + i, transformId, projectData);
                }
            } catch (e) {
                // Property doesn't exist on this layer type
            }
        }
    }
}

function exportLayerEffects(layer, layerId, projectData) {
    var effects = layer.property("ADBE Effect Parade");
    if (effects && effects.numProperties > 0) {
        for (var e = 1; e <= effects.numProperties; e++) {
            var effect = effects.property(e);
            var effectId = layerId + "_effect_" + e;
            
            var effectNode = {
                id: effectId,
                type: "Effect",
                properties: {
                    name: effect.name,
                    match_name: effect.matchName,
                    enabled: effect.enabled,
                    effect_category: getEffectCategory(effect.matchName)
                }
            };
            projectData.nodes.push(effectNode);
            
            // Create edge from layer to effect
            projectData.edges.push({
                from: layerId,
                to: effectId,
                type: "CONTAINS",
                properties: {
                    index: e,
                    relationship: "layer_effect"
                }
            });
            
            // Add effect name for embedding
            projectData.embedding_content.push({
                id: effectId,
                field: "name",
                content: effect.name,
                type: "effect_name"
            });
            
            projectData.embedding_content.push({
                id: effectId,
                field: "match_name",
                content: effect.matchName,
                type: "effect_match_name"
            });
            
            // Export effect properties
            for (var p = 1; p <= effect.numProperties; p++) {
                var prop = effect.property(p);
                if (prop) {
                    exportPropertyAsNode(prop, effectId + "_prop_" + p, effectId, projectData);
                }
            }
        }
    }
}

function exportPropertyAsNode(prop, propId, parentId, projectData) {
    var propNode = {
        id: propId,
        type: "Property",
        properties: {
            name: prop.name,
            match_name: prop.matchName,
            property_value_type: prop.propertyValueType,
            expression_enabled: false,
            num_keys: 0
        }
    };
    
    // Get current value
    try {
        if (prop.value !== null && prop.value !== undefined) {
            propNode.properties.current_value = prop.value;
        }
    } catch (e) {
        propNode.properties.value_error = e.toString();
    }
    
    // Check for expressions
    try {
        if (prop.expressionEnabled && prop.expression) {
            propNode.properties.expression_enabled = true;
            propNode.properties.expression_text = prop.expression;
            
            // Create expression node and relationship
            var exprId = propId + "_expression";
            var exprNode = {
                id: exprId,
                type: "Expression",
                properties: {
                    expression_text: prop.expression,
                    language: "javascript",
                    target_property: prop.name
                }
            };
            projectData.nodes.push(exprNode);
            
            // Create edge from expression to property
            projectData.edges.push({
                from: exprId,
                to: propId,
                type: "DRIVES_WITH_EXPRESSION",
                properties: {
                    relationship: "expression_drives_property"
                }
            });
            
            // Add expression text for embedding
            projectData.embedding_content.push({
                id: exprId,
                field: "expression_text",
                content: prop.expression,
                type: "expression"
            });
        }
    } catch (e) {
        propNode.properties.expression_error = e.toString();
    }
    
    // Export keyframes
    try {
        propNode.properties.num_keys = prop.numKeys;
        if (prop.numKeys > 0) {
            for (var k = 1; k <= Math.min(prop.numKeys, 10); k++) { // Limit keyframes for performance
                var keyId = propId + "_key_" + k;
                var keyNode = {
                    id: keyId,
                    type: "Keyframe",
                    properties: {
                        time: prop.keyTime(k),
                        value: prop.keyValue(k),
                        property_path: prop.name
                    }
                };
                
                try {
                    keyNode.properties.in_interpolation = prop.keyInInterpolationType(k);
                    keyNode.properties.out_interpolation = prop.keyOutInterpolationType(k);
                } catch (e) {
                    // Some properties don't support interpolation types
                }
                
                projectData.nodes.push(keyNode);
                
                // Create edge from property to keyframe
                projectData.edges.push({
                    from: propId,
                    to: keyId,
                    type: "HAS_KEYFRAME",
                    properties: {
                        keyframe_index: k,
                        relationship: "property_keyframe"
                    }
                });
            }
        }
    } catch (e) {
        propNode.properties.keyframe_error = e.toString();
    }
    
    projectData.nodes.push(propNode);
    
    // Create edge from parent to property
    projectData.edges.push({
        from: parentId,
        to: propId,
        type: "CONTAINS",
        properties: {
            relationship: "parent_property"
        }
    });
    
    // Add property name for embedding
    projectData.embedding_content.push({
        id: propId,
        field: "name",
        content: prop.name,
        type: "property_name"
    });
}

function exportPropertyGroupForGraph(propGroup, groupId, projectData) {
    // Similar to exportPropertyGroup but creates graph nodes/edges
    var groupData = {
        name: propGroup.name,
        match_name: propGroup.matchName,
        num_properties: propGroup.numProperties
    };
    
    for (var i = 1; i <= propGroup.numProperties; i++) {
        try {
            var prop = propGroup.property(i);
            if (prop) {
                if (prop.propertyType === PropertyType.PROPERTY) {
                    exportPropertyAsNode(prop, groupId + "_prop_" + i, groupId, projectData);
                } else if (prop.propertyType === PropertyType.INDEXED_GROUP || 
                          prop.propertyType === PropertyType.NAMED_GROUP) {
                    var subGroupId = groupId + "_group_" + i;
                    exportPropertyGroupForGraph(prop, subGroupId, projectData);
                }
            }
        } catch (e) {
            // Skip problematic properties
        }
    }
    
    return groupData;
}

function exportRenderQueue(project, projectData) {
    for (var r = 1; r <= project.renderQueue.numItems; r++) {
        var rqItem = project.renderQueue.item(r);
        var rqId = "render_item_" + r;
        
        var rqNode = {
            id: rqId,
            type: "RenderQueueItem",
            properties: {
                comp_name: rqItem.comp ? rqItem.comp.name : null,
                status: rqItem.status,
                log_type: rqItem.logType,
                elapsed_seconds: rqItem.elapsedSeconds,
                start_time: rqItem.startTime ? rqItem.startTime.toString() : null
            }
        };
        projectData.nodes.push(rqNode);
        
        // Create edge from project to render queue item
        projectData.edges.push({
            from: "project_root",
            to: rqId,
            type: "CONTAINS",
            properties: {
                index: r,
                relationship: "project_render_item"
            }
        });
        
        // Create edge from render item to composition if exists
        if (rqItem.comp) {
            var compId = "item_" + rqItem.comp.id;
            projectData.edges.push({
                from: rqId,
                to: compId,
                type: "RENDERS",
                properties: {
                    relationship: "render_composition"
                }
            });
        }
    }
}

function addItemEmbeddingContent(item, itemId, projectData) {
    // Add name for embedding
    if (item.name) {
        projectData.embedding_content.push({
            id: itemId,
            field: "name",
            content: item.name,
            type: "name"
        });
    }
    
    // Add comment for embedding
    if (item.comment) {
        projectData.embedding_content.push({
            id: itemId,
            field: "comment",
            content: item.comment,
            type: "comment"
        });
    }
}

function addLayerEmbeddingContent(layer, layerId, projectData) {
    // Add layer name for embedding
    if (layer.name) {
        projectData.embedding_content.push({
            id: layerId,
            field: "name",
            content: layer.name,
            type: "name"
        });
    }
    
    // Add layer comment for embedding
    if (layer.comment) {
        projectData.embedding_content.push({
            id: layerId,
            field: "comment",
            content: layer.comment,
            type: "comment"
        });
    }
}

function createHierarchyEdges(item, itemId, projectData, folderHierarchy) {
    // Create CONTAINS edge from project or folder to item
    var parentId = "project_root";
    
    if (item.parentFolder && item.parentFolder.name !== "Root") {
        parentId = folderHierarchy[item.parentFolder.name];
    }
    
    if (parentId) {
        projectData.edges.push({
            from: parentId,
            to: itemId,
            type: "CONTAINS",
            properties: {
                relationship: "parent_child"
            }
        });
    }
}

function getEffectCategory(matchName) {
    // Categorize effects for semantic grouping
    if (matchName.indexOf("ADBE Color") === 0) return "Color";
    if (matchName.indexOf("ADBE Blur") === 0) return "Blur";
    if (matchName.indexOf("ADBE Distort") === 0) return "Distort";
    if (matchName.indexOf("ADBE Generate") === 0) return "Generate";
    if (matchName.indexOf("ADBE Transition") === 0) return "Transition";
    if (matchName.indexOf("ADBE Time") === 0) return "Time";
    if (matchName.indexOf("ADBE Audio") === 0) return "Audio";
    return "Other";
}

// Execute the enhanced export
exportProjectForGraph();