use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::propertygroup::PropertyGroup;
use super::propertybase::PropertyType;

/// Layer object - base class for all layer types
/// Inherits from PropertyGroup → PropertyBase
/// Base class for AVLayer, TextLayer, ShapeLayer, CameraLayer, LightLayer
pub struct Layer {
    pub base: PropertyGroup,
    pub layer_type: LayerType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LayerType {
    AV,         // Audio/Video layer
    Text,       // Text layer
    Shape,      // Shape layer
    Camera,     // Camera layer
    Light,      // Light layer
    Null,       // Null object layer
    Adjustment, // Adjustment layer
}

#[derive(Debug, Clone, PartialEq)]
pub enum AutoOrientType {
    NoAutoOrient = 0,
    AlongPath = 1,
    CameraOrPointOfInterest = 2,
    CharactersTowardCamera = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum SceneEditDetectionMode {
    None = 0,
    Markers = 1,
    Split = 2,
    SplitPrecomp = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum BlendingMode {
    Normal = 0,
    Dissolve = 1,
    DancingDissolve = 2,
    Darken = 3,
    Multiply = 4,
    ColorBurn = 5,
    ClassicColorBurn = 6,
    LinearBurn = 7,
    DarkerColor = 8,
    Lighten = 9,
    Screen = 10,
    ColorDodge = 11,
    ClassicColorDodge = 12,
    LinearDodge = 13,
    LighterColor = 14,
    Overlay = 15,
    SoftLight = 16,
    HardLight = 17,
    LinearLight = 18,
    VividLight = 19,
    PinLight = 20,
    HardMix = 21,
    Difference = 22,
    ClassicDifference = 23,
    Exclusion = 24,
    Subtract = 25,
    Divide = 26,
    Hue = 27,
    Saturation = 28,
    Color = 29,
    Luminosity = 30,
    StencilAlpha = 31,
    StencilLuma = 32,
    SilhouetteAlpha = 33,
    SilhouetteLuma = 34,
    Alpha = 35,
    LumaInverted = 36,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TrackMatteType {
    None = 0,
    Alpha = 1,
    AlphaInverted = 2,
    Luma = 3,
    LumaInverted = 4,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LayerQuality {
    Wireframe = 0,
    Draft = 1,
    Best = 2,
}

impl Layer {
    pub fn new(layer_type: LayerType) -> Self {
        let mut layer = Self {
            base: PropertyGroup::new(ObjectContext::Layer, PropertyType::IndexedGroup),
            layer_type,
        };
        
        layer.initialize_layer_methods();
        layer.initialize_layer_properties();
        layer
    }
    
    fn initialize_layer_methods(&mut self) {
        // Layer base methods (in addition to PropertyGroup methods)
        
        // Time and activation methods
        self.base.base.api_object.methods.insert("activeAtTime".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // time in seconds
        ]));
        
        // Layer duplication and copying
        self.base.base.api_object.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("copyToComp".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("CompItem".to_string())  // target composition
        ]));
        
        // Layer removal
        self.base.base.api_object.methods.insert("remove".to_string(), MethodValidation::new(0));
        
        // Layer ordering methods
        self.base.base.api_object.methods.insert("moveAfter".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string())  // target layer
        ]));
        
        self.base.base.api_object.methods.insert("moveBefore".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string())  // target layer
        ]));
        
        self.base.base.api_object.methods.insert("moveToBeginning".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("moveToEnd".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("moveToIndex".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // target index (1-based)
        ]));
        
        // Parent relationship methods
        self.base.base.api_object.methods.insert("setParentWithJump".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string())  // new parent layer or null
        ]));
        
        // Animation preset methods
        self.base.base.api_object.methods.insert("applyPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // preset file
        ]));
        
        // Scene edit detection (After Effects 22.3+)
        self.base.base.api_object.methods.insert("doSceneEditDetection".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // SceneEditDetectionMode enum value
        ]));
        
        // Selection methods
        self.base.base.api_object.methods.insert("selectProperties".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string())  // array of property names
        ]));
        
        self.base.base.api_object.methods.insert("deselectAllProperties".to_string(), MethodValidation::new(0));
        
        // Marker methods
        self.base.base.api_object.methods.insert("addMarker".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                        // time
            PropertyValueType::Custom("MarkerValue".to_string())  // marker
        ]));
        
        self.base.base.api_object.methods.insert("removeMarker".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // marker index
        ]));
        
        // Layer state methods
        self.base.base.api_object.methods.insert("setEnabled".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.api_object.methods.insert("setSolo".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.api_object.methods.insert("setShy".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.api_object.methods.insert("setLocked".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Time manipulation
        self.base.base.api_object.methods.insert("setInOutTimes".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // in point
            PropertyValueType::OneD   // out point
        ]));
        
        self.base.base.api_object.methods.insert("trimToCurrentTime".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("splitAt".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // time
        ]));
        
        // Transform and auto-orient
        self.base.base.api_object.methods.insert("setAutoOrient".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // AutoOrientType enum value
        ]));
        
        // Blending and compositing
        self.base.base.api_object.methods.insert("setBlendingMode".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // BlendingMode enum value
        ]));
        
        self.base.base.api_object.methods.insert("setTrackMatte".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // TrackMatteType enum value
        ]));
        
        // Quality and rendering
        self.base.base.api_object.methods.insert("setQuality".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // LayerQuality enum value
        ]));
        
        // Layer styles and effects
        self.base.base.api_object.methods.insert("addEffect".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // effect name
        ]));
        
        self.base.base.api_object.methods.insert("removeEffect".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // effect index or name
        ]));
        
        // Layer export and rendering
        self.base.base.api_object.methods.insert("saveFrameToPng".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,                       // time
            PropertyValueType::Custom("File".to_string()), // output file
            PropertyValueType::OneD                        // scale factor
        ]));
        
        // Team project methods for layers
        self.base.base.api_object.methods.insert("requestLayerAccess".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("releaseLayerAccess".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_layer_properties(&mut self) {
        // Layer properties (in addition to PropertyGroup properties)
        
        // Core layer identification
        self.base.base.api_object.properties.insert("id".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
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
        
        self.base.base.api_object.properties.insert("index".to_string(), ValidationRule {
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
        
        // Layer name and comment
        self.base.base.api_object.properties.insert("name".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("comment".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("isNameSet".to_string(), ValidationRule {
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
        
        // Layer state properties
        self.base.base.api_object.properties.insert("enabled".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("solo".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("shy".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("locked".to_string(), ValidationRule {
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
        
        // Layer timing properties
        self.base.base.api_object.properties.insert("inPoint".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-10800.0), // -3 hours
            range_max: Some(10800.0),  // +3 hours
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("outPoint".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-10800.0), // -3 hours
            range_max: Some(10800.0),  // +3 hours
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("startTime".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-10800.0), // -3 hours
            range_max: Some(10800.0),  // +3 hours
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("time".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
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
        
        self.base.base.api_object.properties.insert("stretch".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-9900.0),
            range_max: Some(9900.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Layer organization and hierarchy
        self.base.base.api_object.properties.insert("parent".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Layer".to_string()),
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
        
        self.base.base.api_object.properties.insert("label".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(16.0), // Label color indices
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),   // None
                "1".to_string(),   // Red
                "2".to_string(),   // Yellow
                "3".to_string(),   // Aqua
                "4".to_string(),   // Pink
                "5".to_string(),   // Lavender
                "6".to_string(),   // Peach
                "7".to_string(),   // Sea Foam
                "8".to_string(),   // Blue
                "9".to_string(),   // Green
                "10".to_string(),  // Purple
                "11".to_string(),  // Orange
                "12".to_string(),  // Brown
                "13".to_string(),  // Fuchsia
                "14".to_string(),  // Cyan
                "15".to_string(),  // Sandstone
                "16".to_string(),  // User
            ]),
            custom_validator: None,
        });
        
        // Composition context
        self.base.base.api_object.properties.insert("containingComp".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("CompItem".to_string()),
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
        
        // Layer capabilities
        self.base.base.api_object.properties.insert("hasVideo".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("hasAudio".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("nullLayer".to_string(), ValidationRule {
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
        
        // Auto-orient
        self.base.base.api_object.properties.insert("autoOrient".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(3.0), // AutoOrientType enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // NO_AUTO_ORIENT
                "1".to_string(),  // ALONG_PATH
                "2".to_string(),  // CAMERA_OR_POINT_OF_INTEREST
                "3".to_string(),  // CHARACTERS_TOWARD_CAMERA
            ]),
            custom_validator: None,
        });
        
        // Markers
        self.base.base.api_object.properties.insert("marker".to_string(), ValidationRule {
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
        
        // Selection and effects
        self.base.base.api_object.properties.insert("selectedProperties".to_string(), ValidationRule {
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
        
        // Layer type identification
        self.base.base.api_object.properties.insert("layerType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(6.0), // LayerType enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // AV
                "1".to_string(),  // TEXT
                "2".to_string(),  // SHAPE
                "3".to_string(),  // CAMERA
                "4".to_string(),  // LIGHT
                "5".to_string(),  // NULL
                "6".to_string(),  // ADJUSTMENT
            ]),
            custom_validator: None,
        });
        
        // Team project properties for layers
        self.base.base.api_object.properties.insert("isLayerLocked".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("layerLockOwner".to_string(), ValidationRule {
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
    
    /// Access to the underlying PropertyGroup
    pub fn get_base(&self) -> &PropertyGroup {
        &self.base
    }
    
    /// Mutable access to the underlying PropertyGroup
    pub fn get_base_mut(&mut self) -> &mut PropertyGroup {
        &mut self.base
    }
    
    /// Get the layer type
    pub fn get_layer_type(&self) -> &LayerType {
        &self.layer_type
    }
    
    /// Check if this layer is active at the specified time
    pub fn is_active_at_time(&self, time: f64) -> bool {
        // This would check if layer is enabled, within in/out points, and not overridden by solo
        // For now, return true as default
        true
    }
    
    /// Check if this layer has video component
    pub fn has_video_component(&self) -> bool {
        // Most layer types have video except pure audio layers
        match self.layer_type {
            LayerType::AV => true,
            LayerType::Text => true,
            LayerType::Shape => true,
            LayerType::Camera => false,  // Cameras don't have visual output
            LayerType::Light => false,   // Lights don't have visual output
            LayerType::Null => false,    // Null objects don't have visual output
            LayerType::Adjustment => true,
        }
    }
    
    /// Check if this layer has audio component
    pub fn has_audio_component(&self) -> bool {
        // Only AV layers can have audio
        matches!(self.layer_type, LayerType::AV)
    }
    
    /// Check if this is a null layer
    pub fn is_null_layer(&self) -> bool {
        matches!(self.layer_type, LayerType::Null)
    }
    
    /// Get the layer index in the composition
    pub fn get_layer_index(&self) -> usize {
        // This would be determined by the layer's position in the composition
        // For now, return 1 as default
        1
    }
    
    /// Check if layer name was explicitly set
    pub fn is_name_explicitly_set(&self) -> bool {
        // This would check if the name was set by user vs auto-generated
        // For now, return false as default
        false
    }
}

impl LayerType {
    pub fn to_string(&self) -> String {
        match self {
            LayerType::AV => "AV".to_string(),
            LayerType::Text => "Text".to_string(),
            LayerType::Shape => "Shape".to_string(),
            LayerType::Camera => "Camera".to_string(),
            LayerType::Light => "Light".to_string(),
            LayerType::Null => "Null".to_string(),
            LayerType::Adjustment => "Adjustment".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<LayerType> {
        match value {
            "AV" => Some(LayerType::AV),
            "Text" => Some(LayerType::Text),
            "Shape" => Some(LayerType::Shape),
            "Camera" => Some(LayerType::Camera),
            "Light" => Some(LayerType::Light),
            "Null" => Some(LayerType::Null),
            "Adjustment" => Some(LayerType::Adjustment),
            _ => None,
        }
    }
}

impl AutoOrientType {
    pub fn to_string(&self) -> String {
        match self {
            AutoOrientType::NoAutoOrient => "NO_AUTO_ORIENT".to_string(),
            AutoOrientType::AlongPath => "ALONG_PATH".to_string(),
            AutoOrientType::CameraOrPointOfInterest => "CAMERA_OR_POINT_OF_INTEREST".to_string(),
            AutoOrientType::CharactersTowardCamera => "CHARACTERS_TOWARD_CAMERA".to_string(),
        }
    }
    
    pub fn from_value(value: u8) -> Option<AutoOrientType> {
        match value {
            0 => Some(AutoOrientType::NoAutoOrient),
            1 => Some(AutoOrientType::AlongPath),
            2 => Some(AutoOrientType::CameraOrPointOfInterest),
            3 => Some(AutoOrientType::CharactersTowardCamera),
            _ => None,
        }
    }
}

/// Factory functions for creating different types of Layers
pub mod layer_factory {
    use super::*;
    
    /// Create an AV layer
    pub fn create_av_layer() -> Layer {
        Layer::new(LayerType::AV)
    }
    
    /// Create a text layer
    pub fn create_text_layer() -> Layer {
        Layer::new(LayerType::Text)
    }
    
    /// Create a shape layer
    pub fn create_shape_layer() -> Layer {
        Layer::new(LayerType::Shape)
    }
    
    /// Create a camera layer
    pub fn create_camera_layer() -> Layer {
        Layer::new(LayerType::Camera)
    }
    
    /// Create a light layer
    pub fn create_light_layer() -> Layer {
        Layer::new(LayerType::Light)
    }
    
    /// Create a null object layer
    pub fn create_null_layer() -> Layer {
        Layer::new(LayerType::Null)
    }
    
    /// Create an adjustment layer
    pub fn create_adjustment_layer() -> Layer {
        Layer::new(LayerType::Adjustment)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_layer_creation() {
        let layer = Layer::new(LayerType::AV);
        assert_eq!(*layer.get_layer_type(), LayerType::AV);
        assert!(layer.has_video_component());
        assert!(layer.has_audio_component());
        assert!(!layer.is_null_layer());
    }
    
    #[test]
    fn test_layer_inheritance() {
        let layer = Layer::new(LayerType::Text);
        // Should inherit from PropertyGroup
        assert_eq!(*layer.get_base().base.get_property_type(), crate::api::objects::propertybase::PropertyType::NamedGroup);
    }
    
    #[test]
    fn test_layer_capabilities() {
        let camera = Layer::new(LayerType::Camera);
        assert!(!camera.has_video_component());
        assert!(!camera.has_audio_component());
        
        let null = Layer::new(LayerType::Null);
        assert!(null.is_null_layer());
        assert!(!null.has_video_component());
    }
    
    #[test]
    fn test_layer_activity() {
        let layer = Layer::new(LayerType::AV);
        assert!(layer.is_active_at_time(1.0));
        assert_eq!(layer.get_layer_index(), 1);
        assert!(!layer.is_name_explicitly_set());
    }
    
    #[test]
    fn test_auto_orient_conversion() {
        assert_eq!(AutoOrientType::AlongPath.to_string(), "ALONG_PATH");
        assert_eq!(AutoOrientType::from_value(2), Some(AutoOrientType::CameraOrPointOfInterest));
        assert_eq!(AutoOrientType::from_value(99), None);
    }
    
    #[test]
    fn test_layer_type_conversion() {
        assert_eq!(LayerType::Text.to_string(), "Text");
        assert_eq!(LayerType::from_string("Camera"), Some(LayerType::Camera));
        assert_eq!(LayerType::from_string("Invalid"), None);
    }
}