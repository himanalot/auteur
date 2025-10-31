use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
pub use super::propertybase::{PropertyBase, PropertyType};
use serde::{Deserialize, Serialize};

/// PropertyGroup object - represents a group of properties
/// Can contain Property objects and other PropertyGroup objects
/// Inherits from PropertyBase
#[derive(Debug, Clone)]
pub struct PropertyGroup {
    pub base: PropertyBase,
}

impl PropertyGroup {
    pub fn new(context: ObjectContext, property_type: PropertyType) -> Self {
        let mut property_group = Self {
            base: PropertyBase::new(context, property_type),
        };
        
        property_group.initialize_property_group_methods();
        property_group.initialize_property_group_properties();
        property_group
    }
    
    pub fn new_indexed_group() -> Self {
        Self::new(ObjectContext::Collection, PropertyType::IndexedGroup)
    }
    
    pub fn new_named_group() -> Self {
        Self::new(ObjectContext::Collection, PropertyType::NamedGroup)
    }
    
    fn initialize_property_group_methods(&mut self) {
        // PropertyGroup-specific methods (in addition to PropertyBase methods)
        
        // addProperty(name) - Creates and returns a PropertyBase object with the specified name
        self.base.api_object.methods.insert("addProperty".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // name (display name or match name)
        ]));
        
        // canAddProperty(name) - Returns true if a property with the given name can be added
        self.base.api_object.methods.insert("canAddProperty".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // name (display name or match name)
        ]));
        
        // property(index) - Finds and returns a child property by index
        self.base.api_object.methods.insert("property".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // index or name
        ]));
    }
    
    fn initialize_property_group_properties(&mut self) {
        // PropertyGroup-specific properties (in addition to PropertyBase properties)
        
        // numProperties - The number of indexed properties in this group
        self.base.api_object.properties.insert("numProperties".to_string(), ValidationRule {
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
    }
    
    /// Access to the underlying PropertyBase
    pub fn get_base(&self) -> &PropertyBase {
        &self.base
    }
    
    /// Mutable access to the underlying PropertyBase
    pub fn get_base_mut(&mut self) -> &mut PropertyBase {
        &mut self.base
    }
    
    /// Add layer-specific properties for when PropertyGroup is used as a layer base
    pub fn add_layer_properties(&mut self) {
        // Properties accessible from any Layer (these extend the base PropertyGroup functionality)
        
        // Mask properties access
        self.base.api_object.properties.insert("mask".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("MaskPropertyGroup".to_string()),
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
        
        // Effects access
        self.base.api_object.properties.insert("effect".to_string(), ValidationRule {
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
        
        // Motion trackers access
        self.base.api_object.properties.insert("motionTracker".to_string(), ValidationRule {
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
    }
    
    /// Add AVLayer-specific transform properties
    pub fn add_transform_properties(&mut self) {
        // Transform properties for AVLayers
        
        // Anchor Point
        self.base.api_object.properties.insert("anchorPoint".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoDSpatial,  // Can be 2D or 3D spatial
            array_size: Some(2),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Position
        self.base.api_object.properties.insert("position".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoDSpatial,  // Can be 2D or 3D spatial
            array_size: Some(2),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Scale
        self.base.api_object.properties.insert("scale".to_string(), ValidationRule {
            value_type: PropertyValueType::TwoD,  // Can be 2D or 3D
            array_size: Some(2),
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Rotation
        self.base.api_object.properties.insert("rotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
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
        
        // Opacity
        self.base.api_object.properties.insert("opacity".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    /// Add 3D layer-specific properties
    pub fn add_3d_properties(&mut self) {
        // 3D-specific transform properties
        
        // X, Y, Z Rotation
        self.base.api_object.properties.insert("xRotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
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
        
        self.base.api_object.properties.insert("yRotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
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
        
        self.base.api_object.properties.insert("zRotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
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
        
        // Orientation
        self.base.api_object.properties.insert("orientation".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeD,
            array_size: Some(3),
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Material properties
        self.base.api_object.properties.insert("acceptsShadows".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("acceptsLights".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("castsShadows".to_string(), ValidationRule {
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
        
        // Material lighting properties
        self.base.api_object.properties.insert("ambient".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("diffuse".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("specular".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("shininess".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("lightTransmission".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.api_object.properties.insert("metal".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
}