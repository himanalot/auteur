use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::item::{Item, ItemType};

/// AVItem object - provides access to audio/visual files imported into After Effects
/// Base class for CompItem and FootageItem
/// Inherits from Item
pub struct AVItem {
    pub base: Item,
    pub av_type: AVItemType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AVItemType {
    Composition,
    Footage,
    Solid,
    Placeholder,
}

impl AVItem {
    pub fn new(av_type: AVItemType) -> Self {
        let item_type = match av_type {
            AVItemType::Composition => ItemType::Composition,
            AVItemType::Footage => ItemType::Footage,
            AVItemType::Solid => ItemType::Solid,
            AVItemType::Placeholder => ItemType::Placeholder,
        };
        
        let mut av_item = Self {
            base: Item::new(item_type),
            av_type,
        };
        
        av_item.initialize_av_methods();
        av_item.initialize_av_properties();
        av_item
    }
    
    fn initialize_av_methods(&mut self) {
        // AVItem-specific methods (in addition to Item methods)
        
        // Proxy management methods
        self.base.api_object.methods.insert("setProxy".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // ExtendScript File object
        ]));
        
        self.base.api_object.methods.insert("setProxyToNone".to_string(), MethodValidation::new(0));
        
        self.base.api_object.methods.insert("setProxyWithPlaceholder".to_string(), MethodValidation::new(5).with_param_types(vec![
            PropertyValueType::ArbText,  // name
            PropertyValueType::OneD,     // width (4-30000)
            PropertyValueType::OneD,     // height (4-30000)
            PropertyValueType::OneD,     // frameRate (1-99)
            PropertyValueType::OneD      // duration (0.0-10800.0)
        ]));
        
        self.base.api_object.methods.insert("setProxyWithSequence".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("File".to_string()),    // first file in sequence
            PropertyValueType::Custom("Boolean".to_string())  // forceAlphabetical
        ]));
        
        self.base.api_object.methods.insert("setProxyWithSolid".to_string(), MethodValidation::new(5).with_param_types(vec![
            PropertyValueType::Color,    // color [R,G,B] in range [0.0..1.0]
            PropertyValueType::ArbText,  // name
            PropertyValueType::OneD,     // width (4-30000)
            PropertyValueType::OneD,     // height (4-30000)
            PropertyValueType::OneD      // pixelAspect (0.01-100.0)
        ]));
        
        // Media replacement and source management
        self.base.api_object.methods.insert("replaceSource".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("File".to_string()),    // newSource
            PropertyValueType::Custom("Boolean".to_string())  // fixExpressions
        ]));
        
        self.base.api_object.methods.insert("refreshFootage".to_string(), MethodValidation::new(0));
        
        // Time and navigation methods
        self.base.api_object.methods.insert("setCurrentTime".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // time in seconds
        ]));
        
        // Rendering and export methods
        self.base.api_object.methods.insert("saveFrameToPng".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                       // time
            PropertyValueType::Custom("File".to_string())  // outputFile
        ]));
        
        // Analysis and metadata
        self.base.api_object.methods.insert("analyzeMotion".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("getColorProfile".to_string(), MethodValidation::new(0));
        
        // After Effects 18.0+ (2021) methods
        self.base.api_object.methods.insert("testMediaReplacementCompatibility".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("AVItem".to_string())  // candidateItem
        ]));
        
        // Team project methods for AVItems
        self.base.api_object.methods.insert("requestAccess".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("releaseAccess".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_av_properties(&mut self) {
        // AVItem-specific properties (in addition to Item properties)
        
        // Duration properties
        self.base.api_object.properties.insert("duration".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(10800.0), // 3 hours maximum
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Frame properties
        self.base.api_object.properties.insert("frameDuration".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0/99.0), // Reciprocal of max frame rate
            range_max: Some(1.0),      // Reciprocal of min frame rate
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("frameRate".to_string(), ValidationRule {
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
        
        // Media status properties
        self.base.api_object.properties.insert("footageMissing".to_string(), ValidationRule {
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
        
        // Audio/Video components
        self.base.api_object.properties.insert("hasAudio".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("hasVideo".to_string(), ValidationRule {
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
        
        // Dimensions
        self.base.api_object.properties.insert("height".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(30000.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("width".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(30000.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Pixel aspect ratio
        self.base.api_object.properties.insert("pixelAspect".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.01),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: Some(Box::new(|value| {
                // Common pixel aspect ratios with tolerance for floating point precision
                if let Some(par) = value.as_f64() {
                    let common_pars = vec![0.909091, 1.0, 1.5, 1.09402, 1.21212, 1.33333, 1.45869, 2.0];
                    for common_par in common_pars {
                        if (par - common_par).abs() < 0.001 {
                            return Ok(());
                        }
                    }
                }
                Ok(()) // Allow any value in range
            })),
        });
        
        // Proxy properties
        self.base.api_object.properties.insert("proxySource".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("useProxy".to_string(), ValidationRule {
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
        
        // Time properties
        self.base.api_object.properties.insert("time".to_string(), ValidationRule {
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
        
        // Usage tracking
        self.base.api_object.properties.insert("usedIn".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: Some(Box::new(|_value| {
                // Array of CompItem objects - validation would check each element
                Ok(())
            })),
        });
        
        // Media replacement compatibility (After Effects 18.0+)
        self.base.api_object.properties.insert("isMediaReplacementCompatible".to_string(), ValidationRule {
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
        
        // Source and format information
        self.base.api_object.properties.insert("sourceFileExists".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("colorProfile".to_string(), ValidationRule {
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
        
        // Team project properties specific to AVItems
        self.base.api_object.properties.insert("hasAccessControl".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("accessControlOwner".to_string(), ValidationRule {
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
    
    /// Access to the underlying Item
    pub fn get_base(&self) -> &Item {
        &self.base
    }
    
    /// Mutable access to the underlying Item
    pub fn get_base_mut(&mut self) -> &mut Item {
        &mut self.base
    }
    
    /// Get the AVItem type
    pub fn get_av_type(&self) -> &AVItemType {
        &self.av_type
    }
    
    /// Check if this AVItem has audio component
    pub fn has_audio_component(&self) -> bool {
        // This would be determined by the actual media file
        // For now, return a default based on type
        match self.av_type {
            AVItemType::Composition => true, // Compositions can have audio
            AVItemType::Footage => true,     // Footage can have audio
            AVItemType::Solid => false,      // Solids don't have audio
            AVItemType::Placeholder => false, // Placeholders don't have audio
        }
    }
    
    /// Check if this AVItem has video component
    pub fn has_video_component(&self) -> bool {
        // All AVItem types have video components
        true
    }
    
    /// Check if the footage is missing
    pub fn is_footage_missing(&self) -> bool {
        // This would be determined by checking if the source file exists
        // For placeholders, this is always true
        matches!(self.av_type, AVItemType::Placeholder)
    }
}

impl AVItemType {
    pub fn to_string(&self) -> String {
        match self {
            AVItemType::Composition => "Composition".to_string(),
            AVItemType::Footage => "Footage".to_string(),
            AVItemType::Solid => "Solid".to_string(),
            AVItemType::Placeholder => "Placeholder".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<AVItemType> {
        match value {
            "Composition" => Some(AVItemType::Composition),
            "Footage" => Some(AVItemType::Footage),
            "Solid" => Some(AVItemType::Solid),
            "Placeholder" => Some(AVItemType::Placeholder),
            _ => None,
        }
    }
}

/// Factory functions for creating different types of AVItems
pub mod avitem_factory {
    use super::*;
    
    /// Create a composition AVItem
    pub fn create_composition() -> AVItem {
        AVItem::new(AVItemType::Composition)
    }
    
    /// Create a footage AVItem
    pub fn create_footage() -> AVItem {
        AVItem::new(AVItemType::Footage)
    }
    
    /// Create a solid AVItem
    pub fn create_solid() -> AVItem {
        AVItem::new(AVItemType::Solid)
    }
    
    /// Create a placeholder AVItem
    pub fn create_placeholder() -> AVItem {
        AVItem::new(AVItemType::Placeholder)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_avitem_creation() {
        let av_item = AVItem::new(AVItemType::Composition);
        assert_eq!(*av_item.get_av_type(), AVItemType::Composition);
        assert!(av_item.has_audio_component());
        assert!(av_item.has_video_component());
    }
    
    #[test]
    fn test_avitem_audio_video_components() {
        let solid = AVItem::new(AVItemType::Solid);
        assert!(!solid.has_audio_component());
        assert!(solid.has_video_component());
        
        let footage = AVItem::new(AVItemType::Footage);
        assert!(footage.has_audio_component());
        assert!(footage.has_video_component());
    }
    
    #[test]
    fn test_footage_missing_detection() {
        let placeholder = AVItem::new(AVItemType::Placeholder);
        assert!(placeholder.is_footage_missing());
        
        let footage = AVItem::new(AVItemType::Footage);
        assert!(!footage.is_footage_missing());
    }
}