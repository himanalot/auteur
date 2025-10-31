// Comprehensive helper functions for detailed After Effects data export

// Helper function to export comprehensive text layer data
function exportTextLayerData(layer) {
    try {
        var textProp = layer.property("Source Text");
        if (!textProp || !textProp.value) {
            return { error: "No text data available" };
        }
        
        var textDoc = textProp.value;
        var textData = {
            text: textDoc.text || "",
            font: textDoc.font || "",
            fontSize: textDoc.fontSize || 12,
            fillColor: textDoc.fillColor || [1, 1, 1],
            strokeColor: textDoc.strokeColor || [0, 0, 0],
            strokeWidth: textDoc.strokeWidth || 0,
            justification: textDoc.justification || 0,
            tracking: textDoc.tracking || 0,
            leading: textDoc.leading || 0,
            baselineShift: textDoc.baselineShift || 0,
            allCaps: textDoc.allCaps || false,
            smallCaps: textDoc.smallCaps || false,
            superscript: textDoc.superscript || false,
            subscript: textDoc.subscript || false,
            strokeOverFill: textDoc.strokeOverFill || false,
            applyFill: textDoc.applyFill || true,
            applyStroke: textDoc.applyStroke || false,
            fauxBold: textDoc.fauxBold || false,
            fauxItalic: textDoc.fauxItalic || false
        };
        
        // Add keyframe data for Source Text property
        if (textProp.numKeys > 0) {
            textData.keyframes = [];
            for (var k = 1; k <= Math.min(textProp.numKeys, 20); k++) {
                textData.keyframes.push({
                    time: textProp.keyTime(k),
                    text: textProp.keyValue(k).text || "",
                    font: textProp.keyValue(k).font || "",
                    fontSize: textProp.keyValue(k).fontSize || 12
                });
            }
        }
        
        // Check for expression
        if (textProp.expressionEnabled && textProp.expression) {
            textData.expression = textProp.expression;
        }
        
        return textData;
    } catch (error) {
        return { error: "Failed to export text data: " + error.toString() };
    }
}

// Helper function to export comprehensive shape layer data
function exportShapeLayerData(layer) {
    try {
        var shapeData = {
            contents: [],
            hasContents: false
        };
        
        var contents = layer.property("ADBE Root Vectors Group");
        if (contents && contents.numProperties > 0) {
            shapeData.hasContents = true;
            shapeData.numGroups = contents.numProperties;
            
            // Export basic shape group info (detailed shape parsing is complex)
            for (var i = 1; i <= Math.min(contents.numProperties, 10); i++) {
                var shapeGroup = contents.property(i);
                if (shapeGroup) {
                    var groupData = {
                        name: shapeGroup.name,
                        matchName: shapeGroup.matchName,
                        enabled: shapeGroup.enabled || true,
                        numProperties: shapeGroup.numProperties || 0
                    };
                    
                    // Try to get basic shape properties
                    try {
                        if (shapeGroup.numProperties > 0) {
                            groupData.properties = [];
                            for (var p = 1; p <= Math.min(shapeGroup.numProperties, 5); p++) {
                                var prop = shapeGroup.property(p);
                                if (prop) {
                                    groupData.properties.push({
                                        name: prop.name,
                                        matchName: prop.matchName,
                                        propertyType: prop.propertyType
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        // Shape properties can be complex, skip if error
                    }
                    
                    shapeData.contents.push(groupData);
                }
            }
        }
        
        return shapeData;
    } catch (error) {
        return { error: "Failed to export shape data: " + error.toString() };
    }
}

// Helper function to export camera layer data
function exportCameraData(layer) {
    try {
        var cameraData = {
            type: "CameraLayer"
        };
        
        // Get camera options if available
        var cameraOptions = layer.property("ADBE Camera Options Group");
        if (cameraOptions) {
            try {
                var zoom = cameraOptions.property("ADBE Camera Zoom");
                var depthOfField = cameraOptions.property("ADBE Camera Depth of Field");
                var focusDistance = cameraOptions.property("ADBE Camera Focus Distance");
                var aperture = cameraOptions.property("ADBE Camera Aperture");
                var blurLevel = cameraOptions.property("ADBE Camera Blur Level");
                
                if (zoom) cameraData.zoom = zoom.value;
                if (depthOfField) cameraData.depthOfField = depthOfField.value;
                if (focusDistance) cameraData.focusDistance = focusDistance.value;
                if (aperture) cameraData.aperture = aperture.value;
                if (blurLevel) cameraData.blurLevel = blurLevel.value;
            } catch (e) {
                cameraData.optionsError = e.toString();
            }
        }
        
        return cameraData;
    } catch (error) {
        return { error: "Failed to export camera data: " + error.toString() };
    }
}

// Helper function to export light layer data
function exportLightData(layer) {
    try {
        var lightData = {
            type: "LightLayer"
        };
        
        // Get light options if available
        var lightOptions = layer.property("ADBE Light Options Group");
        if (lightOptions) {
            try {
                var intensity = lightOptions.property("ADBE Light Intensity");
                var color = lightOptions.property("ADBE Light Color");
                var lightType = lightOptions.property("ADBE Light Type");
                var coneAngle = lightOptions.property("ADBE Light Cone Angle");
                var coneFeather = lightOptions.property("ADBE Light Cone Feather 2");
                var falloff = lightOptions.property("ADBE Light Falloff Type");
                var radius = lightOptions.property("ADBE Light Falloff Start");
                var falloffDistance = lightOptions.property("ADBE Light Falloff Distance");
                
                if (intensity) lightData.intensity = intensity.value;
                if (color) lightData.color = color.value;
                if (lightType) lightData.lightType = lightType.value;
                if (coneAngle) lightData.coneAngle = coneAngle.value;
                if (coneFeather) lightData.coneFeather = coneFeather.value;
                if (falloff) lightData.falloff = falloff.value;
                if (radius) lightData.radius = radius.value;
                if (falloffDistance) lightData.falloffDistance = falloffDistance.value;
            } catch (e) {
                lightData.optionsError = e.toString();
            }
        }
        
        return lightData;
    } catch (error) {
        return { error: "Failed to export light data: " + error.toString() };
    }
}

// Helper function to export comprehensive transform properties with keyframes
function exportTransformProperties(layer) {
    try {
        var transform = layer.property("Transform");
        if (!transform) {
            return { error: "No transform properties available" };
        }
        
        var transformData = {};
        
        // Define all possible transform properties
        var transformProps = [
            { name: "Anchor Point", key: "anchorPoint" },
            { name: "Position", key: "position" },
            { name: "Scale", key: "scale" },
            { name: "Rotation", key: "rotation" },
            { name: "Opacity", key: "opacity" },
            { name: "X Rotation", key: "xRotation" },
            { name: "Y Rotation", key: "yRotation" },
            { name: "Z Rotation", key: "zRotation" },
            { name: "Orientation", key: "orientation" }
        ];
        
        for (var i = 0; i < transformProps.length; i++) {
            try {
                var prop = transform.property(transformProps[i].name);
                if (prop) {
                    var propData = {
                        name: prop.name,
                        matchName: prop.matchName,
                        value: prop.value,
                        numKeys: prop.numKeys,
                        propertyValueType: prop.propertyValueType,
                        expressionEnabled: prop.expressionEnabled || false,
                        canSetExpression: prop.canSetExpression || false
                    };
                    
                    // Add expression if present
                    if (prop.expressionEnabled && prop.expression) {
                        propData.expression = prop.expression;
                        propData.expressionError = prop.expressionError || "";
                    }
                    
                    // Add keyframes if present
                    if (prop.numKeys > 0) {
                        propData.keyframes = [];
                        for (var k = 1; k <= Math.min(prop.numKeys, 50); k++) {
                            var keyframe = {
                                time: prop.keyTime(k),
                                value: prop.keyValue(k)
                            };
                            
                            try {
                                keyframe.inInterpolationType = prop.keyInInterpolationType(k);
                                keyframe.outInterpolationType = prop.keyOutInterpolationType(k);
                                
                                // Get easing info for temporal properties
                                if (prop.propertyValueType === PropertyValueType.OneD ||
                                    prop.propertyValueType === PropertyValueType.TwoD || 
                                    prop.propertyValueType === PropertyValueType.ThreeD) {
                                    try {
                                        var inEase = prop.keyInTemporalEase(k);
                                        var outEase = prop.keyOutTemporalEase(k);
                                        if (inEase && inEase.length > 0) {
                                            keyframe.inEase = {
                                                speed: inEase[0].speed,
                                                influence: inEase[0].influence
                                            };
                                        }
                                        if (outEase && outEase.length > 0) {
                                            keyframe.outEase = {
                                                speed: outEase[0].speed,
                                                influence: outEase[0].influence
                                            };
                                        }
                                    } catch (e) {
                                        // Some keyframes might not support easing
                                    }
                                }
                                
                                // Get spatial interpolation for spatial properties
                                if (prop.propertyValueType === PropertyValueType.TwoD ||
                                    prop.propertyValueType === PropertyValueType.ThreeD) {
                                    try {
                                        keyframe.inSpatialTangent = prop.keyInSpatialTangent(k);
                                        keyframe.outSpatialTangent = prop.keyOutSpatialTangent(k);
                                        keyframe.spatialAutoBezier = prop.keySpatialAutoBezier(k);
                                        keyframe.spatialContinuous = prop.keySpatialContinuous(k);
                                    } catch (e) {
                                        // Some properties might not support spatial interpolation
                                    }
                                }
                            } catch (e) {
                                // Some keyframes don't support all interpolation types
                            }
                            
                            propData.keyframes.push(keyframe);
                        }
                    }
                    
                    transformData[transformProps[i].key] = propData;
                }
            } catch (e) {
                // Property doesn't exist on this layer type, skip it
            }
        }
        
        return transformData;
    } catch (error) {
        return { error: "Failed to export transform properties: " + error.toString() };
    }
}

// Helper function to export comprehensive layer effects with parameters and keyframes
function exportLayerEffects(layer) {
    try {
        var effects = layer.property("ADBE Effect Parade");
        if (!effects || effects.numProperties === 0) {
            return [];
        }
        
        var effectsData = [];
        
        for (var e = 1; e <= effects.numProperties; e++) {
            var effect = effects.property(e);
            if (!effect) continue;
            
            var effectData = {
                name: effect.name,
                matchName: effect.matchName,
                enabled: effect.enabled,
                index: e,
                numProperties: effect.numProperties,
                parameters: []
            };
            
            // Export effect parameters with full detail
            for (var p = 1; p <= effect.numProperties; p++) {
                try {
                    var param = effect.property(p);
                    if (param) {
                        var paramData = {
                            name: param.name,
                            matchName: param.matchName,
                            propertyType: param.propertyType,
                            propertyValueType: param.propertyValueType,
                            value: param.value,
                            numKeys: param.numKeys,
                            expressionEnabled: param.expressionEnabled || false,
                            canSetExpression: param.canSetExpression || false
                        };
                        
                        // Add expression if present
                        if (param.expressionEnabled && param.expression) {
                            paramData.expression = param.expression;
                            paramData.expressionError = param.expressionError || "";
                        }
                        
                        // Add keyframes if present
                        if (param.numKeys > 0) {
                            paramData.keyframes = [];
                            for (var k = 1; k <= Math.min(param.numKeys, 20); k++) {
                                var keyframe = {
                                    time: param.keyTime(k),
                                    value: param.keyValue(k)
                                };
                                
                                try {
                                    keyframe.inInterpolationType = param.keyInInterpolationType(k);
                                    keyframe.outInterpolationType = param.keyOutInterpolationType(k);
                                } catch (e) {
                                    // Some parameters might not support interpolation
                                }
                                
                                paramData.keyframes.push(keyframe);
                            }
                        }
                        
                        effectData.parameters.push(paramData);
                    }
                } catch (paramError) {
                    // Skip problematic parameters but log the error
                    effectData.parameters.push({
                        error: "Failed to export parameter " + p + ": " + paramError.toString()
                    });
                }
            }
            
            effectsData.push(effectData);
        }
        
        return effectsData;
    } catch (error) {
        return [{ error: "Failed to export effects: " + error.toString() }];
    }
}

// Helper function to export layer masks with comprehensive properties
function exportLayerMasks(layer) {
    try {
        var masks = layer.property("ADBE Mask Parade");
        if (!masks || masks.numProperties === 0) {
            return [];
        }
        
        var masksData = [];
        
        for (var m = 1; m <= masks.numProperties; m++) {
            var mask = masks.property(m);
            if (!mask) continue;
            
            var maskData = {
                name: mask.name,
                index: m,
                locked: mask.locked,
                inverted: false,
                mode: 0,
                opacity: 100,
                feather: [0, 0],
                expansion: 0,
                numVertices: 0,
                closed: false
            };
            
            // Get mask properties with error handling
            try {
                var maskShape = mask.property("ADBE Mask Shape");
                var maskOpacity = mask.property("ADBE Mask Opacity");
                var maskFeather = mask.property("ADBE Mask Feather");
                var maskExpansion = mask.property("ADBE Mask Expand");
                var maskMode = mask.property("ADBE Mask Mode");
                var maskInverted = mask.property("ADBE Mask Invert");
                
                if (maskShape && maskShape.value) {
                    var shapeValue = maskShape.value;
                    maskData.numVertices = shapeValue.vertices ? shapeValue.vertices.length : 0;
                    maskData.closed = shapeValue.closed || false;
                    
                    // Export first few vertices for reference
                    if (shapeValue.vertices && shapeValue.vertices.length > 0) {
                        maskData.sampleVertices = [];
                        for (var v = 0; v < Math.min(shapeValue.vertices.length, 5); v++) {
                            maskData.sampleVertices.push(shapeValue.vertices[v]);
                        }
                    }
                    
                    // Add keyframe info
                    if (maskShape.numKeys > 0) {
                        maskData.shapeKeyframes = maskShape.numKeys;
                    }
                }
                
                if (maskOpacity) {
                    maskData.opacity = maskOpacity.value;
                    if (maskOpacity.numKeys > 0) {
                        maskData.opacityKeyframes = maskOpacity.numKeys;
                    }
                }
                
                if (maskFeather) maskData.feather = maskFeather.value;
                if (maskExpansion) maskData.expansion = maskExpansion.value;
                if (maskMode) maskData.mode = maskMode.value;
                if (maskInverted) maskData.inverted = maskInverted.value;
                
            } catch (maskPropError) {
                maskData.error = "Failed to read mask properties: " + maskPropError.toString();
            }
            
            masksData.push(maskData);
        }
        
        return masksData;
    } catch (error) {
        return [{ error: "Failed to export masks: " + error.toString() }];
    }
}

// Helper function to export layer markers
function exportLayerMarkers(layer) {
    try {
        var markers = layer.property("Marker");
        if (!markers || markers.numKeys === 0) {
            return [];
        }
        
        var markersData = [];
        
        for (var m = 1; m <= markers.numKeys; m++) {
            try {
                var markerValue = markers.keyValue(m);
                var markerData = {
                    time: markers.keyTime(m),
                    comment: markerValue.comment || "",
                    duration: markerValue.duration || 0,
                    chapter: markerValue.chapter || "",
                    url: markerValue.url || "",
                    frameTarget: markerValue.frameTarget || "",
                    cuePointName: markerValue.cuePointName || "",
                    eventCuePoint: markerValue.eventCuePoint || false
                };
                
                markersData.push(markerData);
            } catch (e) {
                // Skip problematic markers
            }
        }
        
        return markersData;
    } catch (error) {
        return [{ error: "Failed to export markers: " + error.toString() }];
    }
}