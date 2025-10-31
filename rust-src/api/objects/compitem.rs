use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::avitem::{AVItem, AVItemType};

/// CompItem object - represents a composition in After Effects
/// Inherits from AVItem → Item
pub struct CompItem {
    pub base: AVItem,
}

impl CompItem {
    pub fn new() -> Self {
        let mut comp_item = Self {
            base: AVItem::new(AVItemType::Composition),
        };
        
        comp_item.initialize_comp_methods();
        comp_item.initialize_comp_properties();
        comp_item
    }
    
    fn initialize_comp_methods(&mut self) {
        // CompItem-specific methods (in addition to AVItem/Item methods)
        
        // Layer management methods
        self.base.base.api_object.methods.insert("layer".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // layer index or name
        ]));
        
        // Duplicate composition
        self.base.base.api_object.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        
        // Export and rendering methods
        self.base.base.api_object.methods.insert("saveFrameToPng".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                       // time
            PropertyValueType::Custom("File".to_string())  // output file
        ]));
        
        // Marker management methods (After Effects 14.0+)
        self.base.base.api_object.methods.insert("addMarker".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,                        // time
            PropertyValueType::Custom("MarkerValue".to_string())  // marker
        ]));
        
        self.base.base.api_object.methods.insert("removeMarker".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // marker index
        ]));
        
        // Essential Graphics and Motion Graphics Templates
        self.base.base.api_object.methods.insert("exportAsMotionGraphicsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // output file
        ]));
        
        self.base.base.api_object.methods.insert("addToEssentialGraphics".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // property name
        ]));
        
        // OpenColorIO methods (After Effects 2020+)
        self.base.base.api_object.methods.insert("setColorProfile".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // color profile name
        ]));
        
        // Proxy methods for composition
        self.base.base.api_object.methods.insert("createProxySequence".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::OneD,                       // width
            PropertyValueType::OneD,                       // height
            PropertyValueType::Custom("File".to_string())  // output path
        ]));
        
        // Advanced composition operations
        self.base.base.api_object.methods.insert("openInViewer".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("openInEssentialGraphics".to_string(), MethodValidation::new(0));
        
        // Time remapping and navigation
        self.base.base.api_object.methods.insert("setCurrentTime".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // time in seconds
        ]));
        
        // Multi-frame rendering support (After Effects 2022+)
        self.base.base.api_object.methods.insert("setMultiFrameRenderingEnabled".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Team project methods for compositions
        self.base.base.api_object.methods.insert("requestEditAccess".to_string(), MethodValidation::new(0));
        self.base.base.api_object.methods.insert("releaseEditAccess".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_comp_properties(&mut self) {
        // CompItem-specific properties (in addition to AVItem/Item properties)
        
        // Camera and 3D properties
        self.base.base.api_object.properties.insert("activeCamera".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("CameraLayer".to_string()),
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
        
        // Background color
        self.base.base.api_object.properties.insert("bgColor".to_string(), ValidationRule {
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
        
        // Frame display properties
        self.base.base.api_object.properties.insert("displayStartFrame".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("displayStartTime".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-10800.0), // -3:00:00:00 (After Effects 17.1+)
            range_max: Some(86339.0),  // 23:59:00:00
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Rendering and display modes
        self.base.base.api_object.properties.insert("draft3d".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("frameBlending".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("motionBlur".to_string(), ValidationRule {
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
        
        // Timecode properties
        self.base.base.api_object.properties.insert("dropFrame".to_string(), ValidationRule {
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
        
        // Layer management
        self.base.base.api_object.properties.insert("layers".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("LayerCollection".to_string()),
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
        
        self.base.base.api_object.properties.insert("numLayers".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("selectedLayers".to_string(), ValidationRule {
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
        
        // Layer visibility controls
        self.base.base.api_object.properties.insert("hideShyLayers".to_string(), ValidationRule {
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
        
        // Markers (After Effects 14.0+)
        self.base.base.api_object.properties.insert("markerProperty".to_string(), ValidationRule {
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
        
        // Work area properties
        self.base.base.api_object.properties.insert("workAreaStart".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("workAreaDuration".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(10800.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Resolution and quality
        self.base.base.api_object.properties.insert("resolutionFactor".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
            array_size: Some(2),
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "[1, 1]".to_string(),   // Full
                "[2, 2]".to_string(),   // Half
                "[4, 4]".to_string(),   // Quarter
                "[3, 3]".to_string(),   // Third
                "[8, 8]".to_string(),   // Custom
            ]),
            custom_validator: None,
        });
        
        // Shy layers
        self.base.base.api_object.properties.insert("shutterAngle".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(720.0), // 0-720 degrees
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.api_object.properties.insert("shutterPhase".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-360.0),
            range_max: Some(360.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Motion Graphics Template properties
        self.base.base.api_object.properties.insert("motionGraphicsTemplateName".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("motionGraphicsTemplateControllerCount".to_string(), ValidationRule {
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
        
        // OpenColorIO properties (After Effects 2020+)
        self.base.base.api_object.properties.insert("workingColorSpace".to_string(), ValidationRule {
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
        
        // Undocumented properties (found via research)
        self.base.base.api_object.properties.insert("counters".to_string(), ValidationRule {
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
        
        // Multi-frame rendering (After Effects 2022+)
        self.base.base.api_object.properties.insert("multiFrameRenderingEnabled".to_string(), ValidationRule {
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
        
        // Team project properties for compositions
        self.base.base.api_object.properties.insert("isEditAccessRequested".to_string(), ValidationRule {
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
        
        self.base.base.api_object.properties.insert("editAccessOwner".to_string(), ValidationRule {
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
    
    /// Get the number of layers in this composition
    pub fn get_num_layers(&self) -> usize {
        // This would be determined by the actual layer collection
        // For now, return a default
        0
    }
    
    /// Check if the composition is using 3D
    pub fn is_3d_composition(&self) -> bool {
        // This would be determined by checking if any layers are 3D
        // For now, return false as default
        false
    }
    
    /// Check if motion blur is enabled
    pub fn has_motion_blur(&self) -> bool {
        // This would be read from the actual property value
        // For now, return false as default
        false
    }
    
    /// Check if frame blending is enabled
    pub fn has_frame_blending(&self) -> bool {
        // This would be read from the actual property value
        // For now, return false as default
        false
    }
}

/// Factory functions for creating CompItems
pub mod compitem_factory {
    use super::*;
    
    /// Create a standard composition
    pub fn create_composition() -> CompItem {
        CompItem::new()
    }
    
    /// Create a composition with Motion Graphics Template capabilities
    pub fn create_mgt_composition() -> CompItem {
        let mut comp = CompItem::new();
        // Additional MGT-specific setup would go here
        comp
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_compitem_creation() {
        let comp = CompItem::new();
        assert_eq!(comp.get_num_layers(), 0);
        assert!(!comp.is_3d_composition());
        assert!(!comp.has_motion_blur());
        assert!(!comp.has_frame_blending());
    }
    
    #[test]
    fn test_compitem_inheritance() {
        let comp = CompItem::new();
        // Should inherit from AVItem
        assert_eq!(*comp.get_base().get_av_type(), AVItemType::Composition);
        // Should inherit from Item
        assert_eq!(*comp.get_base().get_base().get_item_type(), super::super::item::ItemType::Composition);
    }
}