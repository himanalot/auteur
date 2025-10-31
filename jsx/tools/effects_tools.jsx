/**
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
            enabled: "boolean", // enable/disable effect
            layer_name: "string", // specific layer name
            layer_index: "number", // specific layer index
            target_newest: "boolean", // target newest layer
            target_all: "boolean", // target all layers
            auto_select: "boolean" // auto-select single layer
        },
        execute: function(params) {
            var activeItem = app.project.activeItem;
            if (!activeItem || !(activeItem instanceof CompItem)) {
                return { success: false, message: "No active composition found" };
            }

            // -----------------------------------------------------------------
            // INTELLIGENT TARGETING (optional)
            // -----------------------------------------------------------------
            var targetLayers = [];

            function addLayerUnique(l) {
                if (l && targetLayers.indexOf(l) === -1) targetLayers.push(l);
            }

            if (params.layer_name) {
                for (var ln = 1; ln <= activeItem.numLayers; ln++) {
                    var lyr = activeItem.layer(ln);
                    if (lyr.name === params.layer_name) { addLayerUnique(lyr); break; }
                }
            }

            if (params.layer_index !== undefined) {
                var idx = parseInt(params.layer_index, 10);
                if (!isNaN(idx) && idx >= 1 && idx <= activeItem.numLayers) { addLayerUnique(activeItem.layer(idx)); }
            }

            if (params.target_newest) { addLayerUnique(activeItem.layer(1)); }

            if (params.target_all) {
                for (var al=1; al<=activeItem.numLayers; al++) addLayerUnique(activeItem.layer(al));
            }

            // Fallback to selected layers
            if (targetLayers.length === 0 && activeItem.selectedLayers.length > 0) {
                for (var s=0; s<activeItem.selectedLayers.length; s++) addLayerUnique(activeItem.selectedLayers[s]);
            }

            // Auto-select single layer if auto_select true
            if (targetLayers.length === 0 && params.auto_select && activeItem.numLayers === 1) {
                addLayerUnique(activeItem.layer(1));
            }

            if (targetLayers.length === 0) {
                return { success: false, message: "No layers selected for effects" };
            }

            try {
                app.beginUndoGroup("AI: Apply Effect");
                
                // Support both camelCase and snake_case parameter names
                var effectName = params.effectName || params.effect_name;
                var effectsApplied = 0;
                
                // Convert display name to match name if needed
                var matchName = this.getEffectMatchName(effectName);
                if (!matchName) {
                    app.endUndoGroup();
                    return { success: false, message: "Effect not found: " + effectName };
                }
                
                for (var i = 0; i < targetLayers.length; i++) {
                    var layer = targetLayers[i];
                    
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
} 