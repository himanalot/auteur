use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;
use serde::{Deserialize, Serialize};

/// PropertyBase object - base class for Property and PropertyGroup
/// Represents the common functionality shared by all property objects in After Effects
#[derive(Debug, Clone)]
pub struct PropertyBase {
    pub api_object: ApiObject,
    pub property_type: PropertyType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PropertyType {
    Property,        // A single property such as position or zoom
    IndexedGroup,    // A property group whose members have an editable name and an index (effects, masks)
    NamedGroup,      // A property group in which the member names are not editable (layers)
}

impl PropertyBase {
    pub fn new(context: ObjectContext, property_type: PropertyType) -> Self {
        let mut property_base = Self {
            api_object: ApiObject::new(context),
            property_type,
        };
        
        property_base.initialize_methods();
        property_base.initialize_properties();
        property_base
    }
    
    fn initialize_methods(&mut self) {
        // Core PropertyBase methods available to all property objects
        
        // duplicate() - Creates a copy of this property (for indexed groups only)
        self.api_object.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        
        // moveTo(newIndex) - Moves this property to a new position in its parent group
        self.api_object.methods.insert("moveTo".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // newIndex
        ]));
        
        // propertyGroup([countUp]) - Gets the PropertyGroup object for an ancestor group
        self.api_object.methods.insert("propertyGroup".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![
                PropertyValueType::OneD  // countUp (optional)
            ]));
        
        // remove() - Removes this property from its parent group
        self.api_object.methods.insert("remove".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_properties(&mut self) {
        // Core PropertyBase properties available to all property objects
        
        // active - Whether the property is active at the current time
        self.api_object.properties.insert("active".to_string(), ValidationRule {
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
        
        // canSetEnabled - Whether the enabled attribute can be set
        self.api_object.properties.insert("canSetEnabled".to_string(), ValidationRule {
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
        
        // elided - Whether this property is a group used to organize other properties
        self.api_object.properties.insert("elided".to_string(), ValidationRule {
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
        
        // enabled - Whether the property is enabled
        self.api_object.properties.insert("enabled".to_string(), ValidationRule {
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
        
        // isEffect - Whether this property is an effect PropertyGroup
        self.api_object.properties.insert("isEffect".to_string(), ValidationRule {
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
        
        // isMask - Whether this property is a mask PropertyGroup
        self.api_object.properties.insert("isMask".to_string(), ValidationRule {
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
        
        // isModified - Whether this property has been changed since its creation
        self.api_object.properties.insert("isModified".to_string(), ValidationRule {
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
        
        // matchName - Special name for the property used to build unique naming paths
        self.api_object.properties.insert("matchName".to_string(), ValidationRule {
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
        
        // name - Display name of the property
        self.api_object.properties.insert("name".to_string(), ValidationRule {
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
        
        // parentProperty - The property group that is the immediate parent of this property
        self.api_object.properties.insert("parentProperty".to_string(), ValidationRule {
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
        
        // propertyDepth - Number of levels of parent groups between this property and the containing layer
        self.api_object.properties.insert("propertyDepth".to_string(), ValidationRule {
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
        
        // propertyIndex - Position index of this property within its parent group
        self.api_object.properties.insert("propertyIndex".to_string(), ValidationRule {
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
        
        // propertyType - The type of this property (PropertyType enum)
        self.api_object.properties.insert("propertyType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "PROPERTY".to_string(),
                "INDEXED_GROUP".to_string(),
                "NAMED_GROUP".to_string(),
            ]),
            custom_validator: None,
        });
        
        // selected - Whether this property is selected
        self.api_object.properties.insert("selected".to_string(), ValidationRule {
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
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
    
    pub fn get_property_type(&self) -> &PropertyType {
        &self.property_type
    }
}

impl PropertyType {
    pub fn to_string(&self) -> String {
        match self {
            PropertyType::Property => "PROPERTY".to_string(),
            PropertyType::IndexedGroup => "INDEXED_GROUP".to_string(),
            PropertyType::NamedGroup => "NAMED_GROUP".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<PropertyType> {
        match value {
            "PROPERTY" => Some(PropertyType::Property),
            "INDEXED_GROUP" => Some(PropertyType::IndexedGroup),
            "NAMED_GROUP" => Some(PropertyType::NamedGroup),
            _ => None,
        }
    }
}