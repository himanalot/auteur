use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

/// FootageSource object - base class for all footage sources
/// Base class for FileSource, SolidSource, and PlaceholderSource
pub struct FootageSource {
    pub api_object: ApiObject,
    pub source_type: FootageSourceType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FootageSourceType {
    File,
    Solid,
    Placeholder,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AlphaMode {
    Ignore = 0,
    Straight = 1,
    Premultiplied = 2,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FieldSeparationType {
    Off = 0,
    UpperFieldFirst = 1,
    LowerFieldFirst = 2,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PulldownPhase {
    Off = 0,
    Wssww = 1,
    Sswww = 2,
    Swwws = 3,
    Wwwss = 4,
    Wwssw = 5,
    Wssww24pAdvance = 6,
    Sswww24pAdvance = 7,
    Swwws24pAdvance = 8,
    Wwwss24pAdvance = 9,
    Wwssw24pAdvance = 10,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PulldownMethod {
    Pulldown32 = 0,
    Advance24p = 1,
}

impl FootageSource {
    pub fn new(source_type: FootageSourceType) -> Self {
        let mut footage_source = Self {
            api_object: ApiObject::new(ObjectContext::FootageSource),
            source_type,
        };
        
        footage_source.initialize_source_methods();
        footage_source.initialize_source_properties();
        footage_source
    }
    
    fn initialize_source_methods(&mut self) {
        // FootageSource methods
        
        // Alpha interpretation methods
        self.api_object.methods.insert("guessAlphaMode".to_string(), MethodValidation::new(0));
        
        // Field separation and pulldown methods
        self.api_object.methods.insert("guessPulldown".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // PulldownMethod enum value
        ]));
        
        // Color management methods
        self.api_object.methods.insert("setColorProfile".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // color profile name
        ]));
        
        self.api_object.methods.insert("removeColorProfile".to_string(), MethodValidation::new(0));
        
        // Quality and interpretation
        self.api_object.methods.insert("setInterpretationSettings".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Object".to_string())  // interpretation settings object
        ]));
        
        self.api_object.methods.insert("resetInterpretation".to_string(), MethodValidation::new(0));
        
        // Advanced field processing
        self.api_object.methods.insert("enableHighQualityFieldSeparation".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Source validation
        self.api_object.methods.insert("validateSource".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("refreshSource".to_string(), MethodValidation::new(0));
        
        // Metadata and information
        self.api_object.methods.insert("getSourceInfo".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("extractMetadata".to_string(), MethodValidation::new(0));
        
        // Time and frame rate methods
        self.api_object.methods.insert("setConformFrameRate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // frame rate (0.0-99.0, 0 uses native)
        ]));
        
        self.api_object.methods.insert("resetFrameRate".to_string(), MethodValidation::new(0));
        
        // Loop and playback
        self.api_object.methods.insert("setLoopCount".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // loop count (1-9999)
        ]));
        
        // Alpha channel methods
        self.api_object.methods.insert("setAlphaMode".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // AlphaMode enum value
        ]));
        
        self.api_object.methods.insert("setPremultiplyColor".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Color  // premul color [R,G,B]
        ]));
        
        self.api_object.methods.insert("invertAlphaChannel".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Field separation methods
        self.api_object.methods.insert("setFieldSeparation".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // FieldSeparationType enum value
        ]));
        
        self.api_object.methods.insert("setPulldownRemoval".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // PulldownPhase enum value
        ]));
    }
    
    fn initialize_source_properties(&mut self) {
        // FootageSource properties
        
        // Alpha properties
        self.api_object.properties.insert("alphaMode".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0), // AlphaMode enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // IGNORE
                "1".to_string(),  // STRAIGHT
                "2".to_string(),  // PREMULTIPLIED
            ]),
            custom_validator: None,
        });
        
        self.api_object.properties.insert("hasAlpha".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("invertAlpha".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("premulColor".to_string(), ValidationRule {
            value_type: PropertyValueType::Color,
            array_size: Some(3),
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Frame rate properties
        self.api_object.properties.insert("conformFrameRate".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),  // 0 means use native frame rate
            range_max: Some(99.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("nativeFrameRate".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(99.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("displayFrameRate".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(99.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Field separation properties
        self.api_object.properties.insert("fieldSeparationType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0), // FieldSeparationType enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // OFF
                "1".to_string(),  // UPPER_FIELD_FIRST
                "2".to_string(),  // LOWER_FIELD_FIRST
            ]),
            custom_validator: None,
        });
        
        self.api_object.properties.insert("highQualityFieldSeparation".to_string(), ValidationRule {
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
        
        // Pulldown removal properties
        self.api_object.properties.insert("removePulldown".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(10.0), // PulldownPhase enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),   // OFF
                "1".to_string(),   // WSSWW
                "2".to_string(),   // SSWWW
                "3".to_string(),   // SWWWS
                "4".to_string(),   // WWWSS
                "5".to_string(),   // WWSSW
                "6".to_string(),   // WSSWW_24P_ADVANCE
                "7".to_string(),   // SSWWW_24P_ADVANCE
                "8".to_string(),   // SWWWS_24P_ADVANCE
                "9".to_string(),   // WWWSS_24P_ADVANCE
                "10".to_string(),  // WWSSW_24P_ADVANCE
            ]),
            custom_validator: None,
        });
        
        // Source type and state properties
        self.api_object.properties.insert("isStill".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("loop".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(9999.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Color management properties
        self.api_object.properties.insert("colorProfile".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("hasColorProfile".to_string(), ValidationRule {
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
        
        // Source validation and status
        self.api_object.properties.insert("isValid".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("sourceType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0), // FootageSourceType enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // FILE
                "1".to_string(),  // SOLID
                "2".to_string(),  // PLACEHOLDER
            ]),
            custom_validator: None,
        });
        
        // Technical properties
        self.api_object.properties.insert("bitsPerChannel".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(8.0),
            range_max: Some(32.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "8".to_string(),   // 8-bit
                "16".to_string(),  // 16-bit
                "32".to_string(),  // 32-bit float
            ]),
            custom_validator: None,
        });
        
        // Metadata properties
        self.api_object.properties.insert("creationTime".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("lastModified".to_string(), ValidationRule {
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
    
    /// Get the source type
    pub fn get_source_type(&self) -> &FootageSourceType {
        &self.source_type
    }
    
    /// Check if this is a still footage source
    pub fn is_still_source(&self) -> bool {
        // This would be determined by the actual source type and properties
        // For now, return false as default
        false
    }
    
    /// Check if this source has an alpha channel
    pub fn has_alpha_channel(&self) -> bool {
        // This would be determined by the actual source
        // For now, return false as default
        false
    }
    
    /// Get the native frame rate
    pub fn get_native_frame_rate(&self) -> f64 {
        // This would be determined by the actual source
        // For now, return 29.97 as a common default
        29.97
    }
    
    /// Get the display frame rate (after pulldown removal)
    pub fn get_display_frame_rate(&self) -> f64 {
        // This would be calculated based on conform rate and pulldown settings
        // For now, return the native frame rate
        self.get_native_frame_rate()
    }
    
    /// Check if the source is valid
    pub fn is_valid_source(&self) -> bool {
        // This would validate the actual source
        // For now, return true as default
        true
    }
    
    /// Get the bits per channel for this source
    pub fn get_bits_per_channel(&self) -> u8 {
        // This would be determined by the actual source
        // For now, return 8 as default
        8
    }
}

impl FootageSourceType {
    pub fn to_string(&self) -> String {
        match self {
            FootageSourceType::File => "File".to_string(),
            FootageSourceType::Solid => "Solid".to_string(),
            FootageSourceType::Placeholder => "Placeholder".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<FootageSourceType> {
        match value {
            "File" => Some(FootageSourceType::File),
            "Solid" => Some(FootageSourceType::Solid),
            "Placeholder" => Some(FootageSourceType::Placeholder),
            _ => None,
        }
    }
}

impl AlphaMode {
    pub fn to_string(&self) -> String {
        match self {
            AlphaMode::Ignore => "IGNORE".to_string(),
            AlphaMode::Straight => "STRAIGHT".to_string(),
            AlphaMode::Premultiplied => "PREMULTIPLIED".to_string(),
        }
    }
    
    pub fn from_value(value: u8) -> Option<AlphaMode> {
        match value {
            0 => Some(AlphaMode::Ignore),
            1 => Some(AlphaMode::Straight),
            2 => Some(AlphaMode::Premultiplied),
            _ => None,
        }
    }
}

impl FieldSeparationType {
    pub fn to_string(&self) -> String {
        match self {
            FieldSeparationType::Off => "OFF".to_string(),
            FieldSeparationType::UpperFieldFirst => "UPPER_FIELD_FIRST".to_string(),
            FieldSeparationType::LowerFieldFirst => "LOWER_FIELD_FIRST".to_string(),
        }
    }
    
    pub fn from_value(value: u8) -> Option<FieldSeparationType> {
        match value {
            0 => Some(FieldSeparationType::Off),
            1 => Some(FieldSeparationType::UpperFieldFirst),
            2 => Some(FieldSeparationType::LowerFieldFirst),
            _ => None,
        }
    }
}

impl PulldownPhase {
    pub fn to_string(&self) -> String {
        match self {
            PulldownPhase::Off => "OFF".to_string(),
            PulldownPhase::Wssww => "WSSWW".to_string(),
            PulldownPhase::Sswww => "SSWWW".to_string(),
            PulldownPhase::Swwws => "SWWWS".to_string(),
            PulldownPhase::Wwwss => "WWWSS".to_string(),
            PulldownPhase::Wwssw => "WWSSW".to_string(),
            PulldownPhase::Wssww24pAdvance => "WSSWW_24P_ADVANCE".to_string(),
            PulldownPhase::Sswww24pAdvance => "SSWWW_24P_ADVANCE".to_string(),
            PulldownPhase::Swwws24pAdvance => "SWWWS_24P_ADVANCE".to_string(),
            PulldownPhase::Wwwss24pAdvance => "WWWSS_24P_ADVANCE".to_string(),
            PulldownPhase::Wwssw24pAdvance => "WWSSW_24P_ADVANCE".to_string(),
        }
    }
    
    pub fn from_value(value: u8) -> Option<PulldownPhase> {
        match value {
            0 => Some(PulldownPhase::Off),
            1 => Some(PulldownPhase::Wssww),
            2 => Some(PulldownPhase::Sswww),
            3 => Some(PulldownPhase::Swwws),
            4 => Some(PulldownPhase::Wwwss),
            5 => Some(PulldownPhase::Wwssw),
            6 => Some(PulldownPhase::Wssww24pAdvance),
            7 => Some(PulldownPhase::Sswww24pAdvance),
            8 => Some(PulldownPhase::Swwws24pAdvance),
            9 => Some(PulldownPhase::Wwwss24pAdvance),
            10 => Some(PulldownPhase::Wwssw24pAdvance),
            _ => None,
        }
    }
}

/// Factory functions for creating different types of FootageSources
pub mod footagesource_factory {
    use super::*;
    
    /// Create a file-based footage source
    pub fn create_file_source() -> FootageSource {
        FootageSource::new(FootageSourceType::File)
    }
    
    /// Create a solid footage source
    pub fn create_solid_source() -> FootageSource {
        FootageSource::new(FootageSourceType::Solid)
    }
    
    /// Create a placeholder footage source
    pub fn create_placeholder_source() -> FootageSource {
        FootageSource::new(FootageSourceType::Placeholder)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_footagesource_creation() {
        let source = FootageSource::new(FootageSourceType::File);
        assert_eq!(*source.get_source_type(), FootageSourceType::File);
        assert!(!source.is_still_source());
        assert!(!source.has_alpha_channel());
        assert!(source.is_valid_source());
    }
    
    #[test]
    fn test_footagesource_properties() {
        let source = FootageSource::new(FootageSourceType::File);
        assert_eq!(source.get_native_frame_rate(), 29.97);
        assert_eq!(source.get_display_frame_rate(), 29.97);
        assert_eq!(source.get_bits_per_channel(), 8);
    }
    
    #[test]
    fn test_alpha_mode_conversion() {
        assert_eq!(AlphaMode::Ignore.to_string(), "IGNORE");
        assert_eq!(AlphaMode::from_value(1), Some(AlphaMode::Straight));
        assert_eq!(AlphaMode::from_value(99), None);
    }
    
    #[test]
    fn test_field_separation_conversion() {
        assert_eq!(FieldSeparationType::UpperFieldFirst.to_string(), "UPPER_FIELD_FIRST");
        assert_eq!(FieldSeparationType::from_value(2), Some(FieldSeparationType::LowerFieldFirst));
    }
    
    #[test]
    fn test_pulldown_phase_conversion() {
        assert_eq!(PulldownPhase::Wssww.to_string(), "WSSWW");
        assert_eq!(PulldownPhase::from_value(10), Some(PulldownPhase::Wwssw24pAdvance));
    }
    
    #[test]
    fn test_source_type_conversion() {
        assert_eq!(FootageSourceType::File.to_string(), "File");
        assert_eq!(FootageSourceType::from_string("Solid"), Some(FootageSourceType::Solid));
        assert_eq!(FootageSourceType::from_string("Invalid"), None);
    }
}