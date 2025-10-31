pub fn get_layer_match_names() -> Vec<&'static str> {
    vec![
        // Layer Types
        "ADBE Text Layer",
        "ADBE Vector Layer",
        "ADBE Camera Layer",
        "ADBE Light Layer",
        "ADBE AV Layer",

        // Layer Styles
        // Blending Options
        "ADBE Blend Options Group",
        "ADBE Global Angle2",
        "ADBE Global Altitude2",
        "ADBE Adv Blend Group",
        "ADBE Layer Fill Opacity2",
        "ADBE R Channel Blend",
        "ADBE G Channel Blend",
        "ADBE B Channel Blend",
        "ADBE Blend Interior",
        "ADBE Blend Ranges",

        // Drop Shadow
        "dropShadow/enabled",
        "dropShadow/mode2",
        "dropShadow/color",
        "dropShadow/opacity",
        "dropShadow/useGlobalAngle",
        "dropShadow/localLightingAngle",
        "dropShadow/distance",
        "dropShadow/chokeMatte",
        "dropShadow/blur",
        "dropShadow/noise",
        "dropShadow/layerConceals",

        // Inner Shadow
        "innerShadow/enabled",
        "innerShadow/mode2",
        "innerShadow/color",
        "innerShadow/opacity",
        "innerShadow/useGlobalAngle",
        "innerShadow/localLightingAngle",
        "innerShadow/distance",
        "innerShadow/chokeMatte",
        "innerShadow/blur",
        "innerShadow/noise",

        // Outer Glow
        "outerGlow/enabled",
        "outerGlow/mode2",
        "outerGlow/opacity",
        "outerGlow/noise",
        "outerGlow/AEColorChoice",
        "outerGlow/color",
        "outerGlow/gradient",
        "outerGlow/gradientSmoothness",
        "outerGlow/glowTechnique",
        "outerGlow/chokeMatte",
        "outerGlow/blur",
        "outerGlow/inputRange",
        "outerGlow/shadingNoise",

        // Inner Glow
        "innerGlow/enabled",
        "innerGlow/mode2",
        "innerGlow/opacity",
        "innerGlow/noise",
        "innerGlow/AEColorChoice",
        "innerGlow/color",
        "innerGlow/gradient",
        "innerGlow/gradientSmoothness",
        "innerGlow/glowTechnique",
        "innerGlow/innerGlowSource",
        "innerGlow/chokeMatte",
        "innerGlow/blur",
        "innerGlow/inputRange",
        "innerGlow/shadingNoise",

        // Bevel/Emboss
        "bevelEmboss/enabled",
        "bevelEmboss/bevelStyle",
        "bevelEmboss/bevelTechnique",
        "bevelEmboss/strengthRatio",
        "bevelEmboss/bevelDirection",
        "bevelEmboss/blur",
        "bevelEmboss/softness",
        "bevelEmboss/useGlobalAngle",
        "bevelEmboss/localLightingAngle",
        "bevelEmboss/localLightingAltitude",
        "bevelEmboss/highlightMode",
        "bevelEmboss/highlightColor",
        "bevelEmboss/highlightOpacity",
        "bevelEmboss/shadowMode",
        "bevelEmboss/shadowColor",
        "bevelEmboss/shadowOpacity",

        // Satin
        "chromeFX/enabled",
        "chromeFX/mode2",
        "chromeFX/color",
        "chromeFX/opacity",
        "chromeFX/localLightingAngle",
        "chromeFX/distance",
        "chromeFX/blur",
        "chromeFX/invert",

        // Solid Fill (Color Overlay)
        "solidFill/enabled",
        "solidFill/mode2",
        "solidFill/color",
        "solidFill/opacity",

        // Gradient Fill (Gradient Overlay)
        "gradientFill/enabled",
        "gradientFill/mode2",
        "gradientFill/opacity",
        "gradientFill/gradient",
        "gradientFill/gradientSmoothness",
        "gradientFill/angle",
        "gradientFill/type",
        "gradientFill/reverse",
        "gradientFill/align",
        "gradientFill/scale",
        "gradientFill/offset",

        // Pattern Overlay
        "patternFill/enabled",
        "patternFill/mode2",
        "patternFill/opacity",
        "patternFill/align",
        "patternFill/scale",
        "patternFill/phase",

        // Stroke
        "frameFX/enabled",
        "frameFX/mode2",
        "frameFX/color",
        "frameFX/size",
        "frameFX/opacity",
        "frameFX/style",
    ]
} 