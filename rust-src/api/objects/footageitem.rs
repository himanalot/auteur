use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::avitem::{AVItem, AVItemType};

/// FootageItem object - represents footage imported into a project
/// Inherits from AVItem → Item
pub struct FootageItem {
    pub base: AVItem,
}

impl FootageItem {
    pub fn new() -> Self {
        let mut footage_item = Self {
            base: AVItem::new(AVItemType::Footage),
        };
        
        footage_item.initialize_footage_methods();
        footage_item.initialize_footage_properties();
        footage_item
    }
    
    fn initialize_footage_methods(&mut self) {
        // FootageItem-specific methods (in addition to AVItem/Item methods)
        
        // Source replacement methods
        self.base.base.api_object.methods.insert("replace".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // ExtendScript File object
        ]));
        
        self.base.base.api_object.methods.insert("replaceWithPlaceholder".to_string(), MethodValidation::new(5).with_param_types(vec![
            PropertyValueType::ArbText,  // name
            PropertyValueType::OneD,     // width (4-30000)
            PropertyValueType::OneD,     // height (4-30000)
            PropertyValueType::OneD,     // frameRate (1.0-99.0)
            PropertyValueType::OneD      // duration (0.0-10800.0)
        ]));
        
        self.base.base.api_object.methods.insert("replaceWithSequence".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("File".to_string()),    // first file in sequence
            PropertyValueType::Custom("Boolean".to_string())  // forceAlphabetical
        ]));
        
        self.base.base.api_object.methods.insert("replaceWithSolid".to_string(), MethodValidation::new(5).with_param_types(vec![
            PropertyValueType::Color,    // color [R,G,B] in range [0.0..1.0]
            PropertyValueType::ArbText,  // name
            PropertyValueType::OneD,     // width (4-30000)
            PropertyValueType::OneD,     // height (4-30000)
            PropertyValueType::OneD      // pixelAspect (0.01-100.0)
        ]));
        
        // Viewer and preview methods
        self.base.base.api_object.methods.insert("openInViewer".to_string(), MethodValidation::new(0));
        
        // Footage interpretation methods
        self.base.base.api_object.methods.insert("reload".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("reinterpret".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("ImportOptions".to_string())  // interpretation settings
        ]));
        
        // Color management methods
        self.base.base.api_object.methods.insert("setColorProfile".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // color profile name
        ]));
        
        self.base.base.api_object.methods.insert("removeColorProfile".to_string(), MethodValidation::new(0));
        
        // Frame rate interpretation
        self.base.base.api_object.methods.insert("setConformFrameRate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // new frame rate (1.0-99.0)
        ]));
        
        // Alpha interpretation methods
        self.base.base.api_object.methods.insert("setAlphaMode".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // alpha mode (enum value)
        ]));
        
        self.base.base.api_object.methods.insert("invertAlpha".to_string(), MethodValidation::new(0));
        
        // Field interpretation
        self.base.base.api_object.methods.insert("setFieldsInterpretation".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                       // field order
            PropertyValueType::Custom("Boolean".to_string()) // remove pulldown
        ]));
        
        // Timecode and time remapping
        self.base.base.api_object.methods.insert("setStartTime".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // start time in seconds
        ]));
        
        // Proxy replacement specific to footage
        self.base.base.api_object.methods.insert("replaceProxy".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // proxy file
        ]));
        
        // Import and conversion methods
        self.base.base.api_object.methods.insert("importToComp".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("convertToComp".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                       // duration
            PropertyValueType::Custom("Boolean".to_string()) // useSourceDimensions
        ]));
        
        // Analysis and metadata extraction
        self.base.base.api_object.methods.insert("analyzeContent".to_string(), MethodValidation::new(0));
        
        self.base.base.api_object.methods.insert("extractMetadata".to_string(), MethodValidation::new(0));
        
        // Team project methods for footage
        self.base.base.api_object.methods.insert("lockFootage".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("unlockFootage".to_string(), MethodValidation::new(0));
        
        // Cinema 4D integration (After Effects 17.0+)
        self.base.base.api_object.methods.insert("setCinema4DData".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Object".to_string())  // C4D data object
        ]));
    }
    
    fn initialize_footage_properties(&mut self) {
        // FootageItem-specific properties (in addition to AVItem/Item properties)
        
        // Source file properties
        self.base.base.api_object.properties.insert("file".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("File".to_string()),
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
        
        self.base.base.api_object.properties.insert("mainSource".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FootageSource".to_string()),
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
        
        // Interpretation properties
        self.base.base.api_object.properties.insert("alphaMode".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(3.0), // AlphaMode enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // IGNORE
                "1".to_string(),  // STRAIGHT
                "2".to_string(),  // PREMULTIPLIED
                "3".to_string(),  // GUESS
            ]),
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("invertAlpha".to_string(), ValidationRule {
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
        
        // Field and pulldown interpretation
        self.base.base.api_object.properties.insert("fieldOrder".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(3.0), // FieldOrder enum values
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // PROGRESSIVE
                "1".to_string(),  // UPPER_FIELD_FIRST
                "2".to_string(),  // LOWER_FIELD_FIRST
                "3".to_string(),  // GUESS
            ]),
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("removePulldown".to_string(), ValidationRule {
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
        
        // Frame rate interpretation
        self.base.base.api_object.properties.insert("conformFrameRate".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(99.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Source type properties
        self.base.base.api_object.properties.insert("sourceType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0), // Source type enum
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
        
        self.base.base.api_object.properties.insert("isStill".to_string(), ValidationRule {
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
        
        // File format properties
        self.base.base.api_object.properties.insert("fileFormat".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("codecName".to_string(), ValidationRule {
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
        
        // Color depth and management
        self.base.base.api_object.properties.insert("bitsPerChannel".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("hasColorProfile".to_string(), ValidationRule {
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
        
        // Metadata properties
        self.base.base.api_object.properties.insert("creationDate".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("fileSize".to_string(), ValidationRule {
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
        
        // Sequence properties (for image sequences)
        self.base.base.api_object.properties.insert("isSequence".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("sequenceStartFrame".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("sequenceEndFrame".to_string(), ValidationRule {
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
        
        // Import options and settings
        self.base.base.api_object.properties.insert("importAsStill".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("loopCount".to_string(), ValidationRule {
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
        
        // Team project properties for footage
        self.base.base.api_object.properties.insert("isFootageLocked".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("footageLockOwner".to_string(), ValidationRule {
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
        
        // Cinema 4D integration properties (After Effects 17.0+)
        self.base.base.api_object.properties.insert("hasCinema4DData".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("cinema4DDataSize".to_string(), ValidationRule {
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
        
        // Quality and compression
        self.base.base.api_object.properties.insert("quality".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("compressionType".to_string(), ValidationRule {
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
    
    /// Access to the underlying AVItem
    pub fn get_base(&self) -> &AVItem {
        &self.base
    }
    
    /// Mutable access to the underlying AVItem
    pub fn get_base_mut(&mut self) -> &mut AVItem {
        &mut self.base
    }
    
    /// Check if this footage is a still image
    pub fn is_still_footage(&self) -> bool {
        // This would be determined by the actual footage source
        // For now, return false as default
        false
    }
    
    /// Check if this footage is an image sequence
    pub fn is_image_sequence(&self) -> bool {
        // This would be determined by the actual footage source
        // For now, return false as default
        false
    }
    
    /// Check if this footage has an embedded color profile
    pub fn has_embedded_color_profile(&self) -> bool {
        // This would be determined by the actual footage file
        // For now, return false as default
        false
    }
    
    /// Get the file format of this footage
    pub fn get_file_format(&self) -> String {
        // This would be determined by the actual file
        // For now, return a default
        "Unknown".to_string()
    }
    
    /// Get the codec name if available
    pub fn get_codec_name(&self) -> Option<String> {
        // This would be determined by the actual file
        // For now, return None
        None
    }
    
    /// Check if the footage source file exists
    pub fn source_file_exists(&self) -> bool {
        // This would check the actual file system
        // For now, return true as default
        true
    }
    
    /// Get the bits per channel for this footage
    pub fn get_bits_per_channel(&self) -> u8 {
        // This would be determined by the actual footage
        // For now, return 8 as default
        8
    }
}

/// Factory functions for creating different types of FootageItems
pub mod footageitem_factory {
    use super::*;
    
    /// Create a standard footage item
    pub fn create_footage() -> FootageItem {
        FootageItem::new()
    }
    
    /// Create a still image footage item
    pub fn create_still_footage() -> FootageItem {
        let mut footage = FootageItem::new();
        // Still image setup would go here
        footage
    }
    
    /// Create an image sequence footage item
    pub fn create_sequence_footage() -> FootageItem {
        let mut footage = FootageItem::new();
        // Sequence setup would go here
        footage
    }
    
    /// Create a video footage item
    pub fn create_video_footage() -> FootageItem {
        let mut footage = FootageItem::new();
        // Video footage setup would go here
        footage
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_footageitem_creation() {
        let footage = FootageItem::new();
        assert!(!footage.is_still_footage());
        assert!(!footage.is_image_sequence());
        assert!(!footage.has_embedded_color_profile());
        assert_eq!(footage.get_file_format(), "Unknown");
    }
    
    #[test]
    fn test_footageitem_inheritance() {
        let footage = FootageItem::new();
        // Should inherit from AVItem
        assert_eq!(*footage.get_base().get_av_type(), super::super::avitem::AVItemType::Footage);
        // Should inherit from Item
        assert_eq!(*footage.get_base().get_base().get_item_type(), super::super::item::ItemType::Footage);
    }
    
    #[test]
    fn test_footageitem_properties() {
        let footage = FootageItem::new();
        assert!(footage.source_file_exists());
        assert_eq!(footage.get_bits_per_channel(), 8);
        assert_eq!(footage.get_codec_name(), None);
    }
}