use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::layer::{Layer, LayerType, BlendingMode, TrackMatteType, LayerQuality};

/// AVLayer object - represents audio/video layers
/// Inherits from Layer → PropertyGroup → PropertyBase
/// Base class for TextLayer
pub struct AVLayer {
    pub base: Layer,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FeatherFalloff {
    FFO_LINEAR = 1,
    FFO_SMOOTH = 2,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PostRenderAction {
    NONE = 0,
    IMPORT = 1,
    IMPORT_AND_REPLACE_USAGE = 2,
    SET_PROXY = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LightType {
    PARALLEL = 1,
    SPOT = 2,
    POINT = 3,
    AMBIENT = 4,
}

impl AVLayer {
    pub fn new() -> Self {
        let mut av_layer = Self {
            base: Layer::new(LayerType::AV),
        };
        
        av_layer.initialize_av_methods();
        av_layer.initialize_av_properties();
        av_layer
    }
    
    fn initialize_av_methods(&mut self) {
        // AVLayer-specific methods (in addition to Layer methods)
        
        // Audio methods
        self.base.base.base.api_object.methods.insert("audioActiveAtTime".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // time in seconds
        ]));
        
        // Source management methods
        self.base.base.base.api_object.methods.insert("replaceSource".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("AVItem".to_string()),    // newSource
            PropertyValueType::Custom("Boolean".to_string())    // fixExpressions
        ]));
        
        // Transform and coordinate methods
        self.base.base.base.api_object.methods.insert("sourcePointToComp".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::TwoD,  // source point [x, y]
            PropertyValueType::OneD   // time
        ]));
        
        self.base.base.base.api_object.methods.insert("compPointToSource".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::TwoD,  // comp point [x, y]
            PropertyValueType::OneD   // time
        ]));
        
        self.base.base.base.api_object.methods.insert("toComp".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ThreeD,  // layer point [x, y, z]
            PropertyValueType::OneD     // time
        ]));
        
        self.base.base.base.api_object.methods.insert("fromComp".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ThreeD,  // comp point [x, y, z]
            PropertyValueType::OneD     // time
        ]));
        
        self.base.base.base.api_object.methods.insert("toWorld".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ThreeD,  // layer point [x, y, z]
            PropertyValueType::OneD     // time
        ]));
        
        self.base.base.base.api_object.methods.insert("fromWorld".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ThreeD,  // world point [x, y, z]
            PropertyValueType::OneD     // time
        ]));
        
        // Transform calculation methods
        self.base.base.base.api_object.methods.insert("calculateTransformFromPoints".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                     // transformType
            PropertyValueType::Custom("Array".to_string()) // points array
        ]));
        
        // Motion Graphics Template methods
        self.base.base.base.api_object.methods.insert("addToMotionGraphicsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // property name
        ]));
        
        self.base.base.base.api_object.methods.insert("addToMotionGraphicsTemplateAs".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,  // name
            PropertyValueType::OneD      // template type
        ]));
        
        self.base.base.base.api_object.methods.insert("canAddToMotionGraphicsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // template type
        ]));
        
        // Layer rendering and export
        self.base.base.base.api_object.methods.insert("openInViewer".to_string(), MethodValidation::new(0));
        
        // 3D and material methods
        self.base.base.base.api_object.methods.insert("setMaterialOption".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,                   // option name
            PropertyValueType::OneD                       // value
        ]));
        
        // Mask methods
        self.base.base.base.api_object.methods.insert("addMask".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Shape".to_string())  // mask shape
        ]));
        
        self.base.base.base.api_object.methods.insert("removeMask".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // mask index
        ]));
        
        // Time remapping methods
        self.base.base.base.api_object.methods.insert("setTimeRemapEnabled".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Layer state methods
        self.base.base.base.api_object.methods.insert("setCollapseTransformation".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("setFrameBlending".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("setMotionBlur".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("setAdjustmentLayer".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("set3DLayer".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Audio control methods
        self.base.base.base.api_object.methods.insert("setAudioEnabled".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Effects methods
        self.base.base.base.api_object.methods.insert("setEffectsActive".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Guide layer methods
        self.base.base.base.api_object.methods.insert("setGuideLayer".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Advanced 3D methods
        self.base.base.base.api_object.methods.insert("setEnvironmentLayer".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Layer styles methods
        self.base.base.base.api_object.methods.insert("addLayerStyle".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // style name
        ]));
        
        self.base.base.base.api_object.methods.insert("removeLayerStyle".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // style name
        ]));
    }
    
    fn initialize_av_properties(&mut self) {
        // AVLayer-specific properties (in addition to Layer properties)
        
        // Source reference
        self.base.base.base.api_object.properties.insert("source".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("AVItem".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Layer rendering properties
        self.base.base.base.api_object.properties.insert("quality".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0), // LayerQuality enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // WIREFRAME
                "1".to_string(),  // DRAFT
                "2".to_string(),  // BEST
            ]),
            custom_validator: None,
        });
        
        // Blending properties
        self.base.base.base.api_object.properties.insert("blendingMode".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(36.0), // BlendingMode enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),   // NORMAL
                "1".to_string(),   // DISSOLVE
                "2".to_string(),   // DANCING_DISSOLVE
                "3".to_string(),   // DARKEN
                "4".to_string(),   // MULTIPLY
                "5".to_string(),   // COLOR_BURN
                "6".to_string(),   // CLASSIC_COLOR_BURN
                "7".to_string(),   // LINEAR_BURN
                "8".to_string(),   // DARKER_COLOR
                "9".to_string(),   // LIGHTEN
                "10".to_string(),  // SCREEN
                "11".to_string(),  // COLOR_DODGE
                "12".to_string(),  // CLASSIC_COLOR_DODGE
                "13".to_string(),  // LINEAR_DODGE
                "14".to_string(),  // LIGHTER_COLOR
                "15".to_string(),  // OVERLAY
                "16".to_string(),  // SOFT_LIGHT
                "17".to_string(),  // HARD_LIGHT
                "18".to_string(),  // LINEAR_LIGHT
                "19".to_string(),  // VIVID_LIGHT
                "20".to_string(),  // PIN_LIGHT
                "21".to_string(),  // HARD_MIX
                "22".to_string(),  // DIFFERENCE
                "23".to_string(),  // CLASSIC_DIFFERENCE
                "24".to_string(),  // EXCLUSION
                "25".to_string(),  // SUBTRACT
                "26".to_string(),  // DIVIDE
                "27".to_string(),  // HUE
                "28".to_string(),  // SATURATION
                "29".to_string(),  // COLOR
                "30".to_string(),  // LUMINOSITY
                "31".to_string(),  // STENCIL_ALPHA
                "32".to_string(),  // STENCIL_LUMA
                "33".to_string(),  // SILHOUETTE_ALPHA
                "34".to_string(),  // SILHOUETTE_LUMA
                "35".to_string(),  // ALPHA
                "36".to_string(),  // LUMA_INVERTED
            ]),
            custom_validator: None,
        });
        
        // Track matte properties
        self.base.base.base.api_object.properties.insert("trackMatteType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(4.0), // TrackMatteType enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // NONE
                "1".to_string(),  // ALPHA
                "2".to_string(),  // ALPHA_INVERTED
                "3".to_string(),  // LUMA
                "4".to_string(),  // LUMA_INVERTED
            ]),
            custom_validator: None,
        });
        
        // Layer state properties
        self.base.base.base.api_object.properties.insert("adjustmentLayer".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("threeDLayer".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("collapseTransformation".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("frameBlending".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("motionBlur".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("guideLayer".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Audio properties
        self.base.base.base.api_object.properties.insert("audioEnabled".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("audioActive".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Effects properties
        self.base.base.base.api_object.properties.insert("effectsActive".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Time remapping
        self.base.base.base.api_object.properties.insert("timeRemapEnabled".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Capability properties
        self.base.base.base.api_object.properties.insert("canSetCollapseTransformation".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("canSetTimeRemapEnabled".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // 3D and advanced properties
        self.base.base.base.api_object.properties.insert("environmentLayer".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Sampling properties
        self.base.base.base.api_object.properties.insert("samplingQuality".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0), // Bilinear, Bicubic, etc.
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // BILINEAR
                "1".to_string(),  // BICUBIC
                "2".to_string(),  // DETAIL_PRESERVING_UPSCALE
            ]),
            custom_validator: None,
        });
        
        // Layer styles properties
        self.base.base.base.api_object.properties.insert("hasLayerStyles".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Transform groups (AE property groups)
        self.base.base.base.api_object.properties.insert("transform".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("masks".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("effects".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("layerStyles".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("geometryOption".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("materialOption".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("audio".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Motion Graphics Template properties
        self.base.base.base.api_object.properties.insert("canAddToMotionGraphicsTemplate".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Advanced rendering properties
        self.base.base.base.api_object.properties.insert("preserveTransparency".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    /// Access to the underlying Layer
    pub fn get_base(&self) -> &Layer {
        &self.base
    }
    
    /// Mutable access to the underlying Layer
    pub fn get_base_mut(&mut self) -> &mut Layer {
        &mut self.base
    }
    
    /// Check if audio is active at the specified time
    pub fn is_audio_active_at_time(&self, time: f64) -> bool {
        // This would check audio enabled state, solo states, and in/out points
        // For now, return false as default
        false
    }
    
    /// Check if this layer is an adjustment layer
    pub fn is_adjustment_layer(&self) -> bool {
        // This would be determined by the actual layer state
        // For now, return false as default
        false
    }
    
    /// Check if this layer is a 3D layer
    pub fn is_3d_layer(&self) -> bool {
        // This would be determined by the threeDLayer property
        // For now, return false as default
        false
    }
    
    /// Check if collapse transformation is enabled
    pub fn has_collapse_transformation(&self) -> bool {
        // This would be determined by the collapseTransformation property
        // For now, return false as default
        false
    }
    
    /// Check if time remapping is enabled
    pub fn has_time_remapping(&self) -> bool {
        // This would be determined by the timeRemapEnabled property
        // For now, return false as default
        false
    }
    
    /// Get the current blending mode
    pub fn get_blending_mode(&self) -> BlendingMode {
        // This would be determined by the actual blending mode property
        // For now, return Normal as default
        BlendingMode::Normal
    }
    
    /// Get the current quality setting
    pub fn get_quality(&self) -> LayerQuality {
        // This would be determined by the actual quality property
        // For now, return Best as default
        LayerQuality::Best
    }
    
    /// Check if layer has any masks
    pub fn has_masks(&self) -> bool {
        // This would check the masks property group
        // For now, return false as default
        false
    }
    
    /// Check if layer has any effects
    pub fn has_effects(&self) -> bool {
        // This would check the effects property group
        // For now, return false as default
        false
    }
    
    /// Check if effects are active
    pub fn are_effects_active(&self) -> bool {
        // This would be determined by the effectsActive property
        // For now, return true as default
        true
    }
}

/// Factory functions for creating different types of AVLayers
pub mod avlayer_factory {
    use super::*;
    
    /// Create a standard AV layer
    pub fn create_av_layer() -> AVLayer {
        AVLayer::new()
    }
    
    /// Create an adjustment layer
    pub fn create_adjustment_layer() -> AVLayer {
        let mut layer = AVLayer::new();
        // Adjustment layer setup would go here
        layer
    }
    
    /// Create a 3D layer
    pub fn create_3d_layer() -> AVLayer {
        let mut layer = AVLayer::new();
        // 3D layer setup would go here
        layer
    }
    
    /// Create a guide layer
    pub fn create_guide_layer() -> AVLayer {
        let mut layer = AVLayer::new();
        // Guide layer setup would go here
        layer
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_avlayer_creation() {
        let av_layer = AVLayer::new();
        assert_eq!(*av_layer.get_base().get_layer_type(), LayerType::AV);
        assert!(!av_layer.is_adjustment_layer());
        assert!(!av_layer.is_3d_layer());
        assert!(!av_layer.has_time_remapping());
    }
    
    #[test]
    fn test_avlayer_inheritance() {
        let av_layer = AVLayer::new();
        // Should inherit from Layer
        assert_eq!(*av_layer.get_base().get_layer_type(), LayerType::AV);
        // Should inherit from PropertyGroup
        assert_eq!(*av_layer.get_base().get_base().base.get_property_type(), crate::api::objects::propertybase::PropertyType::NamedGroup);
    }
    
    #[test]
    fn test_avlayer_capabilities() {
        let av_layer = AVLayer::new();
        assert!(!av_layer.is_audio_active_at_time(1.0));
        assert!(!av_layer.has_collapse_transformation());
        assert_eq!(av_layer.get_blending_mode(), BlendingMode::Normal);
        assert_eq!(av_layer.get_quality(), LayerQuality::Best);
    }
    
    #[test]
    fn test_avlayer_effects_and_masks() {
        let av_layer = AVLayer::new();
        assert!(!av_layer.has_masks());
        assert!(!av_layer.has_effects());
        assert!(av_layer.are_effects_active());
    }
}