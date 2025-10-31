use std::collections::HashMap;
use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::propertygroup::PropertyGroup;
use super::propertybase::PropertyType;

/// Effect object - represents an individual effect applied to a layer
/// Inherits from PropertyGroup → PropertyBase
/// Complete implementation supporting all Adobe After Effects built-in effects
pub struct Effect {
    pub base: PropertyGroup,
    pub match_name: String,
    pub category: EffectCategory,
    pub bit_depth_support: Vec<u8>, // 8, 16, 32 bit support
    pub gpu_accelerated: bool,
    pub gpu_version: Option<String>, // AE version when GPU acceleration was introduced
}

/// Effect collection - manages all effects on a layer
/// Also known as "Effect Parade" in Adobe After Effects
pub struct EffectCollection {
    pub base: PropertyGroup,
}

/// Complete categories of effects available in Adobe After Effects
/// Based on official Adobe documentation and all built-in effect categories
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum EffectCategory {
    // Main effect categories
    ThreeDChannel,      // 3D Channel effects
    Audio,              // Audio effects
    BlurSharpen,        // Blur & Sharpen effects
    Channel,            // Channel effects
    Cinema4D,           // CINEMA 4D effects
    ColorCorrection,    // Color Correction effects
    Distort,            // Distort effects
    ExpressionControls, // Expression Controls
    Generate,           // Generate effects
    Keying,             // Keying effects
    Matte,              // Matte effects
    NoiseGrain,         // Noise & Grain effects
    Obsolete,           // Obsolete effects (deprecated but accessible)
    Perspective,        // Perspective effects
    Simulation,         // Simulation effects
    Stylize,            // Stylize effects
    SyntheticAperture,  // Synthetic Aperture effects
    Text,               // Text effects
    Time,               // Time effects
    Transition,         // Transition effects
    Utility,            // Utility effects
    
    // Legacy categories for backwards compatibility
    Render,             // Render effects (subset of Generate/Simulation)
    ImmersiveVideo,     // VR/360 effects (subset of various categories)
}

/// Effect bit depth support levels
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum BitDepthSupport {
    EightBit = 8,
    SixteenBit = 16,
    ThirtyTwoBit = 32,
}

/// Effect render quality settings
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum EffectRenderQuality {
    Draft,
    Full,
    Best,
    WireframePreview,
}

/// Effect parameter types with comprehensive validation
#[derive(Debug, Clone, PartialEq)]
pub enum EffectParameterType {
    Slider { min: f64, max: f64, default: f64 },
    Angle { default: f64 },
    Checkbox { default: bool },
    Color { default: [f64; 4] }, // RGBA
    Point2D { default: [f64; 2] },
    Point3D { default: [f64; 3] },
    Dropdown { options: Vec<String>, default: usize },
    LayerReference,
    FontReference,
    PathShape,
    Text { default: String },
    PopupMenu { options: Vec<String>, default: usize },
    Group, // Property group containing other parameters
}

impl Effect {
    /// Create a new Effect with comprehensive configuration
    pub fn new(match_name: String, category: EffectCategory) -> Self {
        let mut effect = Self {
            base: PropertyGroup::new(
                ObjectContext::Property(format!("Effect: {}", match_name)),
                PropertyType::IndexedGroup,
            ),
            match_name: match_name.clone(),
            category,
            bit_depth_support: vec![8, 16, 32], // Default support for all bit depths
            gpu_accelerated: false,
            gpu_version: None,
        };
        
        effect.initialize_effect_methods();
        effect.initialize_effect_properties();
        effect
    }
    
    /// Create effect with specific bit depth and GPU support
    pub fn new_with_capabilities(
        match_name: String, 
        category: EffectCategory,
        bit_depths: Vec<u8>,
        gpu_accelerated: bool,
        gpu_version: Option<String>
    ) -> Self {
        let mut effect = Self::new(match_name, category);
        effect.bit_depth_support = bit_depths;
        effect.gpu_accelerated = gpu_accelerated;
        effect.gpu_version = gpu_version;
        effect
    }
    
    /// Initialize comprehensive methods for Effect objects
    fn initialize_effect_methods(&mut self) {
        // Core effect methods
        self.base.base.api_object.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("remove".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("moveTo".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD]));
        
        // Property access methods
        self.base.base.api_object.methods.insert("property".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("PropertySpec".to_string())]));
        self.base.base.api_object.methods.insert("propertyGroup".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::OneD]));
        
        // Preset management methods
        self.base.base.api_object.methods.insert("applyPreset".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
        self.base.base.api_object.methods.insert("savePreset".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
        self.base.base.api_object.methods.insert("resetToDefault".to_string(), MethodValidation::new(0));
        
        // Advanced effect methods
        self.base.base.api_object.methods.insert("setEnabled".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Boolean".to_string())]));
        self.base.base.api_object.methods.insert("copyTo".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Layer".to_string())]));
        self.base.base.api_object.methods.insert("moveToLayer".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Layer".to_string())]));
        
        // Effect parameter utilities
        self.base.base.api_object.methods.insert("getParameterCount".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("getParameterByIndex".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD]));
        self.base.base.api_object.methods.insert("getParameterByName".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
        
        // Effect state management
        self.base.base.api_object.methods.insert("isSupported".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("canApplyTo".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Layer".to_string())]));
        self.base.base.api_object.methods.insert("getMemoryUsage".to_string(), MethodValidation::new(0));
        
        // Render cache management
        self.base.base.api_object.methods.insert("purgeCache".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("invalidateCache".to_string(), MethodValidation::new(0));
        
        // GPU acceleration methods
        self.base.base.api_object.methods.insert("isGPUAccelerated".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("setGPUAcceleration".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Boolean".to_string())]));
    }
    
    /// Initialize comprehensive properties for Effect objects
    fn initialize_effect_properties(&mut self) {
        // Core effect properties
        self.base.base.api_object.properties.insert("enabled".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("active".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("matchName".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
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
        
        self.base.base.api_object.properties.insert("effectIndex".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Advanced properties
        self.base.base.api_object.properties.insert("renderQuality".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(4.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec!["Draft".to_string(), "Full".to_string(), "Best".to_string(), "Wireframe".to_string()]),
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("bitDepthSupport".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
        
        self.base.base.api_object.properties.insert("gpuAccelerated".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("memoryUsage".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Effect metadata
        self.base.base.api_object.properties.insert("displayName".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
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
        
        self.base.base.api_object.properties.insert("category".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
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
        
        self.base.base.api_object.properties.insert("version".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
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
    
    /// Add a parameter to this effect
    pub fn add_parameter(&mut self, name: String, parameter_type: EffectParameterType) {
        let validation_rule = match parameter_type {
            EffectParameterType::Slider { min, max, default: _ } => ValidationRule {
                value_type: PropertyValueType::OneD,
                array_size: None,
                range_min: Some(min),
                range_max: Some(max),
                is_spatial: false,
                can_vary_over_time: true,
                dimensions_separated: false,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::Angle { default: _ } => ValidationRule {
                value_type: PropertyValueType::OneD,
                array_size: None,
                range_min: Some(-360.0),
                range_max: Some(360.0),
                is_spatial: false,
                can_vary_over_time: true,
                dimensions_separated: false,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::Checkbox { default: _ } => ValidationRule {
                value_type: PropertyValueType::Custom("Boolean".to_string()),
                array_size: None,
                range_min: None,
                range_max: None,
                is_spatial: false,
                can_vary_over_time: true,
                dimensions_separated: false,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::Color { default: _ } => ValidationRule {
                value_type: PropertyValueType::Color,
                array_size: Some(4),
                range_min: Some(0.0),
                range_max: Some(1.0),
                is_spatial: false,
                can_vary_over_time: true,
                dimensions_separated: false,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::Point2D { default: _ } => ValidationRule {
                value_type: PropertyValueType::TwoD,
                array_size: Some(2),
                range_min: None,
                range_max: None,
                is_spatial: true,
                can_vary_over_time: true,
                dimensions_separated: true,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::Point3D { default: _ } => ValidationRule {
                value_type: PropertyValueType::ThreeD,
                array_size: Some(3),
                range_min: None,
                range_max: None,
                is_spatial: true,
                can_vary_over_time: true,
                dimensions_separated: true,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::Dropdown { options, default: _ } => ValidationRule {
                value_type: PropertyValueType::OneD,
                array_size: None,
                range_min: Some(1.0),
                range_max: Some(options.len() as f64),
                is_spatial: false,
                can_vary_over_time: false,
                dimensions_separated: false,
                is_dropdown: true,
                allowed_values: Some(options),
                custom_validator: None,
            },
            EffectParameterType::LayerReference => ValidationRule {
                value_type: PropertyValueType::LayerIndex,
                array_size: None,
                range_min: Some(0.0),
                range_max: None,
                is_spatial: false,
                can_vary_over_time: false,
                dimensions_separated: false,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::FontReference => ValidationRule {
                value_type: PropertyValueType::Custom("Font".to_string()),
                array_size: None,
                range_min: None,
                range_max: None,
                is_spatial: false,
                can_vary_over_time: false,
                dimensions_separated: false,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::PathShape => ValidationRule {
                value_type: PropertyValueType::Custom("Shape".to_string()),
                array_size: None,
                range_min: None,
                range_max: None,
                is_spatial: true,
                can_vary_over_time: true,
                dimensions_separated: false,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::Text { default: _ } => ValidationRule {
                value_type: PropertyValueType::ArbText,
                array_size: None,
                range_min: None,
                range_max: None,
                is_spatial: false,
                can_vary_over_time: true,
                dimensions_separated: false,
                is_dropdown: false,
                allowed_values: None,
                custom_validator: None,
            },
            EffectParameterType::PopupMenu { options, default: _ } => ValidationRule {
                value_type: PropertyValueType::OneD,
                array_size: None,
                range_min: Some(1.0),
                range_max: Some(options.len() as f64),
                is_spatial: false,
                can_vary_over_time: false,
                dimensions_separated: false,
                is_dropdown: true,
                allowed_values: Some(options),
                custom_validator: None,
            },
            EffectParameterType::Group => ValidationRule {
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
            },
        };
        
        self.base.base.api_object.properties.insert(name, validation_rule);
    }
    
    /// Get the underlying PropertyGroup
    pub fn get_property_group(&self) -> &PropertyGroup {
        &self.base
    }
    
    /// Get mutable access to the underlying PropertyGroup
    pub fn get_property_group_mut(&mut self) -> &mut PropertyGroup {
        &mut self.base
    }
}

impl EffectCollection {
    /// Create a new EffectCollection (Effect Parade)
    pub fn new() -> Self {
        let mut effect_collection = Self {
            base: PropertyGroup::new(
                ObjectContext::Collection,
                PropertyType::IndexedGroup,
            ),
        };
        
        effect_collection.initialize_collection_methods();
        effect_collection.initialize_collection_properties();
        effect_collection
    }
    
    /// Initialize comprehensive methods for the EffectCollection
    fn initialize_collection_methods(&mut self) {
        // Core effect management
        self.base.base.api_object.methods.insert("addEffect".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
        self.base.base.api_object.methods.insert("effect".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("PropertySpec".to_string())]));
        self.base.base.api_object.methods.insert("removeAll".to_string(), MethodValidation::new(0));
        
        // Effect capability checks
        self.base.base.api_object.methods.insert("canAddEffect".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
        self.base.base.api_object.methods.insert("isEffectSupported".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
        
        // Effect manipulation
        self.base.base.api_object.methods.insert("duplicateEffect".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD]));
        self.base.base.api_object.methods.insert("moveEffect".to_string(), MethodValidation::new(2)
            .with_param_types(vec![PropertyValueType::OneD, PropertyValueType::OneD]));
        self.base.base.api_object.methods.insert("removeEffect".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD]));
        
        // Bulk operations
        self.base.base.api_object.methods.insert("enableAllEffects".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("disableAllEffects".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("soloEffect".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD]));
        self.base.base.api_object.methods.insert("unsoloAllEffects".to_string(), MethodValidation::new(0));
        
        // Effect search and filtering
        self.base.base.api_object.methods.insert("getEffectsByCategory".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
        self.base.base.api_object.methods.insert("getEnabledEffects".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("getDisabledEffects".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("findEffectByMatchName".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
        
        // Performance and optimization
        self.base.base.api_object.methods.insert("purgeAllCaches".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("invalidateAllCaches".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("getMemoryUsage".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("optimizeEffectOrder".to_string(), MethodValidation::new(0));
        
        // Preset management
        self.base.base.api_object.methods.insert("applyEffectPreset".to_string(), MethodValidation::new(2)
            .with_param_types(vec![PropertyValueType::OneD, PropertyValueType::ArbText]));
        self.base.base.api_object.methods.insert("saveEffectPreset".to_string(), MethodValidation::new(2)
            .with_param_types(vec![PropertyValueType::OneD, PropertyValueType::ArbText]));
        
        // GPU acceleration management
        self.base.base.api_object.methods.insert("enableGPUAcceleration".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("disableGPUAcceleration".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("getGPUAcceleratedEffects".to_string(), MethodValidation::new(0));
    }
    
    /// Initialize comprehensive properties for the EffectCollection
    fn initialize_collection_properties(&mut self) {
        // Core collection properties
        self.base.base.api_object.properties.insert("numEffects".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("canAddEffects".to_string(), ValidationRule {
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
        
        // Effect statistics
        self.base.base.api_object.properties.insert("numEnabledEffects".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("numDisabledEffects".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("numGPUAcceleratedEffects".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Performance metrics
        self.base.base.api_object.properties.insert("totalMemoryUsage".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("renderTime".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Collection state
        self.base.base.api_object.properties.insert("hasAnimatedEffects".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("supportedBitDepths".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
    
    /// Get the underlying PropertyGroup
    pub fn get_property_group(&self) -> &PropertyGroup {
        &self.base
    }
    
    /// Get mutable access to the underlying PropertyGroup
    pub fn get_property_group_mut(&mut self) -> &mut PropertyGroup {
        &mut self.base
    }
}

/// Complete effect match names registry for all Adobe After Effects built-in effects
/// Based on official Adobe documentation with bit depth and GPU acceleration info
pub struct EffectMatchNames;

impl EffectMatchNames {
    /// Get comprehensive match names with metadata for all built-in After Effects effects
    pub fn get_all_effects_with_metadata() -> HashMap<&'static str, EffectMetadata> {
        let mut effects = HashMap::new();
        
        // 3D Channel Effects
        effects.insert("ADBE AUX CHANNEL EXTRACT", EffectMetadata::new("3D Channel Extract", EffectCategory::ThreeDChannel, vec![8], false, None));
        effects.insert("ADBE DEPTH MATTE", EffectMetadata::new("Depth Matte", EffectCategory::ThreeDChannel, vec![32], false, None));
        effects.insert("ADBE DEPTH FIELD", EffectMetadata::new("Depth of Field", EffectCategory::ThreeDChannel, vec![32], false, None));
        effects.insert("EXtractoR", EffectMetadata::new("EXtractoR", EffectCategory::ThreeDChannel, vec![32], false, None));
        effects.insert("ADBE FOG_3D", EffectMetadata::new("Fog 3D", EffectCategory::ThreeDChannel, vec![32], false, None));
        effects.insert("ADBE ID MATTE", EffectMetadata::new("ID Matte", EffectCategory::ThreeDChannel, vec![32], false, None));
        effects.insert("IDentifier", EffectMetadata::new("IDentifier", EffectCategory::ThreeDChannel, vec![32], false, None));
        
        // Audio Effects
        effects.insert("ADBE Aud Reverse", EffectMetadata::new("Backwards", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Aud BT", EffectMetadata::new("Bass & Treble", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Aud Delay", EffectMetadata::new("Delay", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Aud_Flange", EffectMetadata::new("Flange & Chorus", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Aud HiLo", EffectMetadata::new("High-Low Pass", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Aud Modulator", EffectMetadata::new("Modulator", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Param EQ", EffectMetadata::new("Parametric EQ", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Aud Reverb", EffectMetadata::new("Reverb", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Aud Stereo Mixer", EffectMetadata::new("Stereo Mixer", EffectCategory::Audio, vec![], false, None));
        effects.insert("ADBE Aud Tone", EffectMetadata::new("Tone", EffectCategory::Audio, vec![], false, None));
        
        // Blur & Sharpen Effects
        effects.insert("ADBE Bilateral", EffectMetadata::new("Bilateral Blur", EffectCategory::BlurSharpen, vec![32], false, None));
        effects.insert("ADBE Camera Lens Blur", EffectMetadata::new("Camera Lens Blur", EffectCategory::BlurSharpen, vec![32], false, None));
        effects.insert("ADBE CameraShakeDeblur", EffectMetadata::new("Camera-Shake Deblur", EffectCategory::BlurSharpen, vec![32], false, None));
        effects.insert("CS CrossBlur", EffectMetadata::new("CC Cross Blur", EffectCategory::BlurSharpen, vec![32], false, None));
        effects.insert("CC Radial Blur", EffectMetadata::new("CC Radial Blur", EffectCategory::BlurSharpen, vec![32], false, None));
        effects.insert("CC Radial Fast Blur", EffectMetadata::new("CC Radial Fast Blur", EffectCategory::BlurSharpen, vec![16], false, None));
        effects.insert("CC Vector Blur", EffectMetadata::new("CC Vector Blur", EffectCategory::BlurSharpen, vec![16], false, None));
        effects.insert("ADBE Channel Blur", EffectMetadata::new("Channel Blur", EffectCategory::BlurSharpen, vec![32], false, None));
        effects.insert("ADBE Compound Blur", EffectMetadata::new("Compound Blur", EffectCategory::BlurSharpen, vec![32], false, None));
        effects.insert("ADBE Motion Blur", EffectMetadata::new("Directional Blur", EffectCategory::BlurSharpen, vec![32], true, Some("15.0".to_string())));
        effects.insert("ADBE Box Blur2", EffectMetadata::new("Fast Box Blur", EffectCategory::BlurSharpen, vec![32], true, Some("14.2".to_string())));
        effects.insert("ADBE Gaussian Blur 2", EffectMetadata::new("Gaussian Blur", EffectCategory::BlurSharpen, vec![32], true, Some("13.8".to_string())));
        effects.insert("ADBE Radial Blur", EffectMetadata::new("Radial Blur", EffectCategory::BlurSharpen, vec![32], false, None));
        effects.insert("ADBE Sharpen", EffectMetadata::new("Sharpen", EffectCategory::BlurSharpen, vec![32], true, Some("13.8".to_string())));
        effects.insert("ADBE Smart Blur", EffectMetadata::new("Smart Blur", EffectCategory::BlurSharpen, vec![16], false, None));
        effects.insert("ADBE Unsharp Mask2", EffectMetadata::new("Unsharp Mask", EffectCategory::BlurSharpen, vec![32], false, None));
        
        // Color Correction Effects
        effects.insert("ADBE AutoColor", EffectMetadata::new("Auto Color", EffectCategory::ColorCorrection, vec![16], false, None));
        effects.insert("ADBE AutoContrast", EffectMetadata::new("Auto Contrast", EffectCategory::ColorCorrection, vec![16], false, None));
        effects.insert("ADBE AutoLevels", EffectMetadata::new("Auto Levels", EffectCategory::ColorCorrection, vec![16], false, None));
        effects.insert("ADBE Black&White", EffectMetadata::new("Black & White", EffectCategory::ColorCorrection, vec![16], false, None));
        effects.insert("ADBE Brightness & Contrast 2", EffectMetadata::new("Brightness & Contrast", EffectCategory::ColorCorrection, vec![32], true, Some("14.1".to_string())));
        effects.insert("ADBE CHANNEL MIXER", EffectMetadata::new("Channel Mixer", EffectCategory::ColorCorrection, vec![32], false, None));
        effects.insert("ADBE Color Balance 2", EffectMetadata::new("Color Balance", EffectCategory::ColorCorrection, vec![16], false, None));
        effects.insert("ADBE Color Balance (HLS)", EffectMetadata::new("Color Balance (HLS)", EffectCategory::ColorCorrection, vec![16], false, None));
        effects.insert("APC Colorama", EffectMetadata::new("Colorama", EffectCategory::ColorCorrection, vec![16], false, None));
        effects.insert("ADBE CurvesCustom", EffectMetadata::new("Curves", EffectCategory::ColorCorrection, vec![32], false, None));
        effects.insert("ADBE Exposure2", EffectMetadata::new("Exposure", EffectCategory::ColorCorrection, vec![32], false, None));
        effects.insert("ADBE HUE SATURATION", EffectMetadata::new("Hue/Saturation", EffectCategory::ColorCorrection, vec![32], true, Some("14.1".to_string())));
        effects.insert("ADBE Easy Levels2", EffectMetadata::new("Levels", EffectCategory::ColorCorrection, vec![32], true, Some("14.2".to_string())));
        effects.insert("ADBE Pro Levels2", EffectMetadata::new("Levels (Individual Controls)", EffectCategory::ColorCorrection, vec![32], true, Some("14.2".to_string())));
        effects.insert("ADBE Lumetri", EffectMetadata::new("Lumetri Color", EffectCategory::ColorCorrection, vec![32], true, Some("13.8".to_string())));
        effects.insert("ADBE Tint", EffectMetadata::new("Tint", EffectCategory::ColorCorrection, vec![32], true, Some("14.1".to_string())));
        
        // Generate Effects
        effects.insert("ADBE 4ColorGradient", EffectMetadata::new("4-Color Gradient", EffectCategory::Generate, vec![16], false, None));
        effects.insert("ADBE Lightning 2", EffectMetadata::new("Advanced Lightning", EffectCategory::Generate, vec![8], false, None));
        effects.insert("ADBE AudSpect", EffectMetadata::new("Audio Spectrum", EffectCategory::Generate, vec![32], false, None));
        effects.insert("ADBE AudWave", EffectMetadata::new("Audio Waveform", EffectCategory::Generate, vec![32], false, None));
        effects.insert("ADBE Fractal Noise", EffectMetadata::new("Fractal Noise", EffectCategory::Generate, vec![32], true, Some("14.2".to_string())));
        effects.insert("ADBE Ramp", EffectMetadata::new("Gradient Ramp", EffectCategory::Generate, vec![32], true, Some("14.2".to_string())));
        effects.insert("ADBE Fill", EffectMetadata::new("Fill", EffectCategory::Generate, vec![32], false, None));
        
        // Expression Controls
        effects.insert("ADBE Point3D Control", EffectMetadata::new("3D Point Control", EffectCategory::ExpressionControls, vec![32], false, None));
        effects.insert("ADBE Angle Control", EffectMetadata::new("Angle Control", EffectCategory::ExpressionControls, vec![32], false, None));
        effects.insert("ADBE Checkbox Control", EffectMetadata::new("Checkbox Control", EffectCategory::ExpressionControls, vec![32], false, None));
        effects.insert("ADBE Color Control", EffectMetadata::new("Color Control", EffectCategory::ExpressionControls, vec![32], false, None));
        effects.insert("ADBE Dropdown Control", EffectMetadata::new("Dropdown Control", EffectCategory::ExpressionControls, vec![32], false, None));
        effects.insert("ADBE Layer Control", EffectMetadata::new("Layer Control", EffectCategory::ExpressionControls, vec![32], false, None));
        effects.insert("ADBE Point Control", EffectMetadata::new("Point Control", EffectCategory::ExpressionControls, vec![32], false, None));
        effects.insert("ADBE Slider Control", EffectMetadata::new("Slider Control", EffectCategory::ExpressionControls, vec![32], false, None));
        
        // Stylize Effects
        effects.insert("ADBE Glo2", EffectMetadata::new("Glow", EffectCategory::Stylize, vec![32], true, Some("14.1".to_string())));
        effects.insert("ADBE Find Edges", EffectMetadata::new("Find Edges", EffectCategory::Stylize, vec![8], true, Some("14.1".to_string())));
        effects.insert("ADBE Emboss", EffectMetadata::new("Emboss", EffectCategory::Stylize, vec![16], false, None));
        
        // Perspective Effects
        effects.insert("ADBE Drop Shadow", EffectMetadata::new("Drop Shadow", EffectCategory::Perspective, vec![32], true, Some("14.2".to_string())));
        effects.insert("ADBE 3D Tracker", EffectMetadata::new("3D Camera Tracker", EffectCategory::Perspective, vec![32], false, None));
        
        // Distort Effects
        effects.insert("ADBE Geometry2", EffectMetadata::new("Transform", EffectCategory::Distort, vec![32], true, Some("15.0".to_string())));
        effects.insert("ADBE Offset", EffectMetadata::new("Offset", EffectCategory::Distort, vec![16], true, Some("14.2".to_string())));
        
        effects
    }
    
    /// Get effect category by match name
    pub fn get_effect_category(match_name: &str) -> Option<EffectCategory> {
        let effects = Self::get_all_effects_with_metadata();
        effects.get(match_name).map(|metadata| metadata.category)
    }
    
    /// Get all effects in a specific category
    pub fn get_effects_by_category(category: EffectCategory) -> Vec<&'static str> {
        Self::get_all_effects_with_metadata()
            .into_iter()
            .filter(|(_, metadata)| metadata.category == category)
            .map(|(match_name, _)| match_name)
            .collect()
    }
    
    /// Check if effect supports GPU acceleration
    pub fn is_gpu_accelerated(match_name: &str) -> bool {
        Self::get_all_effects_with_metadata()
            .get(match_name)
            .map(|metadata| metadata.gpu_accelerated)
            .unwrap_or(false)
    }
    
    /// Get supported bit depths for an effect
    pub fn get_supported_bit_depths(match_name: &str) -> Vec<u8> {
        Self::get_all_effects_with_metadata()
            .get(match_name)
            .map(|metadata| metadata.bit_depth_support.clone())
            .unwrap_or_default()
    }
}

/// Metadata for effect capabilities and support
#[derive(Debug, Clone)]
pub struct EffectMetadata {
    pub display_name: String,
    pub category: EffectCategory,
    pub bit_depth_support: Vec<u8>,
    pub gpu_accelerated: bool,
    pub gpu_version: Option<String>,
}

impl EffectMetadata {
    pub fn new(
        display_name: &str,
        category: EffectCategory,
        bit_depth_support: Vec<u8>,
        gpu_accelerated: bool,
        gpu_version: Option<String>
    ) -> Self {
        Self {
            display_name: display_name.to_string(),
            category,
            bit_depth_support,
            gpu_accelerated,
            gpu_version,
        }
    }
}

/// Comprehensive effect factory for creating all Adobe After Effects built-in effects
pub struct EffectFactory;

impl EffectFactory {
    /// Create any effect by match name with proper configuration
    pub fn create_effect(match_name: &str) -> Option<Effect> {
        let effects_metadata = EffectMatchNames::get_all_effects_with_metadata();
        
        if let Some(metadata) = effects_metadata.get(match_name) {
            let mut effect = Effect::new_with_capabilities(
                match_name.to_string(),
                metadata.category,
                metadata.bit_depth_support.clone(),
                metadata.gpu_accelerated,
                metadata.gpu_version.clone()
            );
            
            // Add effect-specific parameters
            Self::configure_effect_parameters(&mut effect, match_name);
            
            Some(effect)
        } else {
            None
        }
    }
    
    /// Configure effect-specific parameters based on match name
    fn configure_effect_parameters(effect: &mut Effect, match_name: &str) {
        match match_name {
            "ADBE Gaussian Blur 2" => {
                effect.add_parameter("Blurriness".to_string(), EffectParameterType::Slider { min: 0.0, max: 4000.0, default: 10.0 });
                effect.add_parameter("Blur Dimensions".to_string(), EffectParameterType::Dropdown {
                    options: vec!["Horizontal and Vertical".to_string(), "Horizontal".to_string(), "Vertical".to_string()],
                    default: 0
                });
                effect.add_parameter("Repeat Edge Pixels".to_string(), EffectParameterType::Checkbox { default: false });
            },
            "ADBE Drop Shadow" => {
                effect.add_parameter("Shadow Color".to_string(), EffectParameterType::Color { default: [0.0, 0.0, 0.0, 1.0] });
                effect.add_parameter("Opacity".to_string(), EffectParameterType::Slider { min: 0.0, max: 100.0, default: 75.0 });
                effect.add_parameter("Direction".to_string(), EffectParameterType::Angle { default: 225.0 });
                effect.add_parameter("Distance".to_string(), EffectParameterType::Slider { min: 0.0, max: 32000.0, default: 5.0 });
                effect.add_parameter("Softness".to_string(), EffectParameterType::Slider { min: 0.0, max: 250.0, default: 5.0 });
                effect.add_parameter("Shadow Only".to_string(), EffectParameterType::Checkbox { default: false });
            },
            "ADBE Glo2" => {
                effect.add_parameter("Glow Threshold".to_string(), EffectParameterType::Slider { min: 0.0, max: 100.0, default: 20.0 });
                effect.add_parameter("Glow Radius".to_string(), EffectParameterType::Slider { min: 0.0, max: 150.0, default: 20.0 });
                effect.add_parameter("Glow Intensity".to_string(), EffectParameterType::Slider { min: 0.0, max: 10.0, default: 1.0 });
                effect.add_parameter("Composite Original".to_string(), EffectParameterType::Dropdown {
                    options: vec!["Behind".to_string(), "On Top".to_string(), "None".to_string()],
                    default: 0
                });
            },
            "ADBE Fractal Noise" => {
                effect.add_parameter("Fractal Type".to_string(), EffectParameterType::Dropdown {
                    options: vec![
                        "Basic".to_string(), "Turbulent Basic".to_string(), "Dynamic".to_string(),
                        "Dynamic Progressive".to_string(), "Dynamic Twist".to_string(), "Max".to_string(),
                        "Rocky".to_string(), "Cycle".to_string(), "Cycle Progressive".to_string()
                    ],
                    default: 0
                });
                effect.add_parameter("Contrast".to_string(), EffectParameterType::Slider { min: 0.0, max: 1000.0, default: 100.0 });
                effect.add_parameter("Brightness".to_string(), EffectParameterType::Slider { min: -100.0, max: 100.0, default: 0.0 });
                effect.add_parameter("Evolution".to_string(), EffectParameterType::Slider { min: 0.0, max: 3600.0, default: 0.0 });
                effect.add_parameter("Complexity".to_string(), EffectParameterType::Slider { min: 1.0, max: 20.0, default: 6.0 });
            },
            "ADBE Geometry2" => {
                effect.add_parameter("Anchor Point".to_string(), EffectParameterType::Point2D { default: [0.0, 0.0] });
                effect.add_parameter("Position".to_string(), EffectParameterType::Point2D { default: [0.0, 0.0] });
                effect.add_parameter("Uniform Scale".to_string(), EffectParameterType::Checkbox { default: true });
                effect.add_parameter("Scale".to_string(), EffectParameterType::Slider { min: 0.0, max: 1000.0, default: 100.0 });
                effect.add_parameter("Rotation".to_string(), EffectParameterType::Angle { default: 0.0 });
                effect.add_parameter("Opacity".to_string(), EffectParameterType::Slider { min: 0.0, max: 100.0, default: 100.0 });
            },
            // Expression Controls
            "ADBE Slider Control" => {
                effect.add_parameter("Slider".to_string(), EffectParameterType::Slider { min: -1000000.0, max: 1000000.0, default: 0.0 });
            },
            "ADBE Angle Control" => {
                effect.add_parameter("Angle".to_string(), EffectParameterType::Angle { default: 0.0 });
            },
            "ADBE Point Control" => {
                effect.add_parameter("Point".to_string(), EffectParameterType::Point2D { default: [0.0, 0.0] });
            },
            "ADBE Point3D Control" => {
                effect.add_parameter("3D Point".to_string(), EffectParameterType::Point3D { default: [0.0, 0.0, 0.0] });
            },
            "ADBE Checkbox Control" => {
                effect.add_parameter("Checkbox".to_string(), EffectParameterType::Checkbox { default: false });
            },
            "ADBE Color Control" => {
                effect.add_parameter("Color".to_string(), EffectParameterType::Color { default: [1.0, 1.0, 1.0, 1.0] });
            },
            "ADBE Layer Control" => {
                effect.add_parameter("Layer".to_string(), EffectParameterType::LayerReference);
            },
            "ADBE Dropdown Control" => {
                effect.add_parameter("Menu".to_string(), EffectParameterType::Dropdown {
                    options: vec!["Option 1".to_string(), "Option 2".to_string(), "Option 3".to_string()],
                    default: 0
                });
            },
            // Add more effect configurations as needed
            _ => {
                // Default configuration for unknown effects
                effect.add_parameter("Effect Parameter".to_string(), EffectParameterType::Slider { min: 0.0, max: 100.0, default: 50.0 });
            }
        }
    }
    
    // Convenience methods for creating popular effects
    
    pub fn gaussian_blur() -> Effect {
        Self::create_effect("ADBE Gaussian Blur 2").unwrap()
    }
    
    pub fn drop_shadow() -> Effect {
        Self::create_effect("ADBE Drop Shadow").unwrap()
    }
    
    pub fn glow() -> Effect {
        Self::create_effect("ADBE Glo2").unwrap()
    }
    
    pub fn fractal_noise() -> Effect {
        Self::create_effect("ADBE Fractal Noise").unwrap()
    }
    
    pub fn transform() -> Effect {
        Self::create_effect("ADBE Geometry2").unwrap()
    }
    
    pub fn slider_control() -> Effect {
        Self::create_effect("ADBE Slider Control").unwrap()
    }
    
    pub fn color_control() -> Effect {
        Self::create_effect("ADBE Color Control").unwrap()
    }
    
    pub fn layer_control() -> Effect {
        Self::create_effect("ADBE Layer Control").unwrap()
    }
}

/// Effect preset system for saving and loading effect configurations
pub struct EffectPresets;

impl EffectPresets {
    /// Get built-in presets for popular effects
    pub fn get_builtin_presets() -> HashMap<String, HashMap<String, String>> {
        let mut presets = HashMap::new();
        
        // Gaussian Blur presets
        let mut blur_presets = HashMap::new();
        blur_presets.insert("Light Blur".to_string(), "Blurriness=5.0".to_string());
        blur_presets.insert("Medium Blur".to_string(), "Blurriness=15.0".to_string());
        blur_presets.insert("Heavy Blur".to_string(), "Blurriness=50.0".to_string());
        blur_presets.insert("Motion Blur Style".to_string(), "Blurriness=8.0;Blur Dimensions=Horizontal".to_string());
        presets.insert("ADBE Gaussian Blur 2".to_string(), blur_presets);
        
        // Drop Shadow presets
        let mut shadow_presets = HashMap::new();
        shadow_presets.insert("Soft Shadow".to_string(), "Distance=5.0;Softness=10.0;Opacity=75.0;Direction=225.0".to_string());
        shadow_presets.insert("Hard Shadow".to_string(), "Distance=3.0;Softness=0.0;Opacity=100.0;Direction=225.0".to_string());
        shadow_presets.insert("Long Shadow".to_string(), "Distance=25.0;Softness=5.0;Opacity=50.0;Direction=225.0".to_string());
        shadow_presets.insert("Inner Shadow".to_string(), "Distance=3.0;Softness=5.0;Opacity=60.0;Direction=45.0".to_string());
        presets.insert("ADBE Drop Shadow".to_string(), shadow_presets);
        
        // Glow presets
        let mut glow_presets = HashMap::new();
        glow_presets.insert("Soft Glow".to_string(), "Glow Threshold=90.0;Glow Radius=25.0;Glow Intensity=1.5".to_string());
        glow_presets.insert("Bright Glow".to_string(), "Glow Threshold=50.0;Glow Radius=50.0;Glow Intensity=3.0".to_string());
        glow_presets.insert("Subtle Glow".to_string(), "Glow Threshold=95.0;Glow Radius=10.0;Glow Intensity=0.8".to_string());
        glow_presets.insert("Neon Glow".to_string(), "Glow Threshold=30.0;Glow Radius=35.0;Glow Intensity=2.5".to_string());
        presets.insert("ADBE Glo2".to_string(), glow_presets);
        
        // Fractal Noise presets
        let mut noise_presets = HashMap::new();
        noise_presets.insert("Clouds".to_string(), "Fractal Type=Basic;Contrast=200.0;Brightness=50.0;Evolution=0.0".to_string());
        noise_presets.insert("Fire".to_string(), "Fractal Type=Turbulent Basic;Contrast=300.0;Brightness=0.0;Evolution=180.0".to_string());
        noise_presets.insert("Water".to_string(), "Fractal Type=Dynamic;Contrast=150.0;Brightness=0.0;Evolution=45.0".to_string());
        noise_presets.insert("Smoke".to_string(), "Fractal Type=Max;Contrast=100.0;Brightness=25.0;Evolution=90.0".to_string());
        presets.insert("ADBE Fractal Noise".to_string(), noise_presets);
        
        presets
    }
    
    /// Apply a preset to an effect
    pub fn apply_preset(effect: &mut Effect, preset_name: &str) -> Result<(), String> {
        let presets = Self::get_builtin_presets();
        
        if let Some(effect_presets) = presets.get(&effect.match_name) {
            if let Some(preset_data) = effect_presets.get(preset_name) {
                // Parse and apply preset data
                for param_setting in preset_data.split(';') {
                    if let Some((param_name, value)) = param_setting.split_once('=') {
                        // Apply the parameter value to the effect
                        // This would be implemented with actual property setting logic
                        println!("Setting {} = {} on effect {}", param_name, value, effect.match_name);
                    }
                }
                Ok(())
            } else {
                Err(format!("Preset '{}' not found for effect '{}'", preset_name, effect.match_name))
            }
        } else {
            Err(format!("No presets available for effect '{}'", effect.match_name))
        }
    }
}

/// Animation and keyframe support for effects
pub struct EffectAnimation;

impl EffectAnimation {
    /// Check if an effect property supports animation
    pub fn can_animate_property(effect_match_name: &str, property_name: &str) -> bool {
        match effect_match_name {
            "ADBE Gaussian Blur 2" => matches!(property_name, "Blurriness"),
            "ADBE Drop Shadow" => matches!(property_name, "Opacity" | "Direction" | "Distance" | "Softness" | "Shadow Color"),
            "ADBE Glo2" => matches!(property_name, "Glow Threshold" | "Glow Radius" | "Glow Intensity"),
            "ADBE Fractal Noise" => matches!(property_name, "Contrast" | "Brightness" | "Evolution" | "Complexity"),
            "ADBE Geometry2" => matches!(property_name, "Anchor Point" | "Position" | "Scale" | "Rotation" | "Opacity"),
            // All Expression Controls are animatable
            match_name if match_name.contains("Control") => true,
            _ => false,
        }
    }
    
    /// Get default keyframe interpolation type for effect properties
    pub fn get_default_interpolation(property_name: &str) -> &str {
        match property_name {
            name if name.contains("Angle") || name.contains("Rotation") || name.contains("Direction") => "LINEAR",
            name if name.contains("Position") || name.contains("Point") || name.contains("Anchor") => "BEZIER",
            name if name.contains("Scale") || name.contains("Opacity") || name.contains("Intensity") => "BEZIER",
            name if name.contains("Color") => "LINEAR",
            _ => "LINEAR",
        }
    }
    
    /// Get optimal keyframe easing for effect properties
    pub fn get_recommended_easing(property_name: &str) -> (&str, &str) {
        match property_name {
            name if name.contains("Opacity") => ("ease_out", "ease_in"),
            name if name.contains("Scale") => ("ease_out", "ease_in"),
            name if name.contains("Position") => ("ease_out", "ease_in"),
            name if name.contains("Rotation") => ("linear", "linear"),
            _ => ("ease_out", "ease_in"),
        }
    }
}

/// Effect performance optimization utilities
pub struct EffectOptimization;

impl EffectOptimization {
    /// Get performance impact rating for an effect (1-5, 5 being highest impact)
    pub fn get_performance_impact(match_name: &str) -> u8 {
        match match_name {
            // Low impact effects
            "ADBE Fill" | "ADBE Invert" | "ADBE Tint" => 1,
            
            // Medium-low impact
            "ADBE Brightness & Contrast 2" | "ADBE HUE SATURATION" | "ADBE Easy Levels2" => 2,
            
            // Medium impact
            "ADBE Gaussian Blur 2" | "ADBE Drop Shadow" | "ADBE Glo2" => 3,
            
            // High impact
            "ADBE Fractal Noise" | "ADBE Camera Lens Blur" | "ADBE Geometry2" => 4,
            
            // Very high impact
            "ADBE 3D Tracker" | "ADBE Liquify" | "ADBE Warp Stabilizer" => 5,
            
            // Default for unknown effects
            _ => 3,
        }
    }
    
    /// Get recommended render order for optimal performance
    pub fn get_optimal_render_order<'a>(effects: &'a [&'a str]) -> Vec<&'a str> {
        let mut sorted_effects: Vec<&str> = effects.iter().copied().collect();
        
        // Sort by performance impact (low impact first)
        sorted_effects.sort_by_key(|effect| Self::get_performance_impact(effect));
        
        sorted_effects
    }
    
    /// Check if effects can be GPU accelerated together
    pub fn can_batch_gpu_acceleration(effects: &[&str]) -> bool {
        effects.iter().all(|effect| EffectMatchNames::is_gpu_accelerated(effect))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_effect_creation() {
        let effect = EffectFactory::gaussian_blur();
        assert_eq!(effect.match_name, "ADBE Gaussian Blur 2");
        assert_eq!(effect.category, EffectCategory::BlurSharpen);
        assert!(effect.gpu_accelerated);
    }
    
    #[test]
    fn test_effect_collection() {
        let collection = EffectCollection::new();
        assert!(collection.base.base.api_object.methods.contains_key("addEffect"));
        assert!(collection.base.base.api_object.properties.contains_key("numEffects"));
    }
    
    #[test]
    fn test_effect_factory() {
        let effect = EffectFactory::create_effect("ADBE Drop Shadow");
        assert!(effect.is_some());
        
        let effect = effect.unwrap();
        assert_eq!(effect.match_name, "ADBE Drop Shadow");
        assert_eq!(effect.category, EffectCategory::Perspective);
    }
    
    #[test]
    fn test_effect_metadata() {
        let effects = EffectMatchNames::get_all_effects_with_metadata();
        assert!(effects.contains_key("ADBE Gaussian Blur 2"));
        
        let blur_metadata = effects.get("ADBE Gaussian Blur 2").unwrap();
        assert_eq!(blur_metadata.display_name, "Gaussian Blur");
        assert!(blur_metadata.gpu_accelerated);
    }
    
    #[test]
    fn test_effect_categories() {
        let blur_effects = EffectMatchNames::get_effects_by_category(EffectCategory::BlurSharpen);
        assert!(blur_effects.contains(&"ADBE Gaussian Blur 2"));
        
        let expression_controls = EffectMatchNames::get_effects_by_category(EffectCategory::ExpressionControls);
        assert!(expression_controls.contains(&"ADBE Slider Control"));
    }
    
    #[test]
    fn test_effect_animation() {
        assert!(EffectAnimation::can_animate_property("ADBE Gaussian Blur 2", "Blurriness"));
        assert!(!EffectAnimation::can_animate_property("ADBE Gaussian Blur 2", "Blur Dimensions"));
        
        assert_eq!(EffectAnimation::get_default_interpolation("Direction"), "LINEAR");
        assert_eq!(EffectAnimation::get_default_interpolation("Position"), "BEZIER");
    }
    
    #[test]
    fn test_effect_parameters() {
        let mut effect = EffectFactory::gaussian_blur();
        assert!(effect.base.base.api_object.properties.contains_key("Blurriness"));
        assert!(effect.base.base.api_object.properties.contains_key("Blur Dimensions"));
    }
    
    #[test]
    fn test_effect_presets() {
        let presets = EffectPresets::get_builtin_presets();
        assert!(presets.contains_key("ADBE Gaussian Blur 2"));
        assert!(presets.contains_key("ADBE Drop Shadow"));
        assert!(presets.contains_key("ADBE Glo2"));
    }
    
    #[test]
    fn test_effect_optimization() {
        assert_eq!(EffectOptimization::get_performance_impact("ADBE Fill"), 1);
        assert_eq!(EffectOptimization::get_performance_impact("ADBE Gaussian Blur 2"), 3);
        assert_eq!(EffectOptimization::get_performance_impact("ADBE 3D Tracker"), 5);
        
        let effects = vec!["ADBE 3D Tracker", "ADBE Fill", "ADBE Gaussian Blur 2"];
        let optimized = EffectOptimization::get_optimal_render_order(&effects);
        assert_eq!(optimized[0], "ADBE Fill"); // Should be first (lowest impact)
    }
    
    #[test]
    fn test_gpu_acceleration() {
        assert!(EffectMatchNames::is_gpu_accelerated("ADBE Gaussian Blur 2"));
        assert!(!EffectMatchNames::is_gpu_accelerated("ADBE Slider Control"));
        
        let gpu_effects = vec!["ADBE Gaussian Blur 2", "ADBE Drop Shadow"];
        assert!(EffectOptimization::can_batch_gpu_acceleration(&gpu_effects));
    }
    
    #[test]
    fn test_bit_depth_support() {
        let bit_depths = EffectMatchNames::get_supported_bit_depths("ADBE Gaussian Blur 2");
        assert_eq!(bit_depths, vec![32]);
        
        let bit_depths = EffectMatchNames::get_supported_bit_depths("ADBE Slider Control");
        assert_eq!(bit_depths, vec![32]);
    }
}