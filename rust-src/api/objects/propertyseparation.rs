use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::propertybase::{PropertyBase, PropertyType};

/// PropertySeparation - handles the separation of multidimensional properties
/// Allows properties like Position [x,y,z] to be split into individual dimension properties
pub struct PropertySeparation {
    pub leader: Option<PropertyBase>,
    pub followers: Vec<PropertyFollower>,
    pub dimensions: usize,
    pub is_separated: bool,
}

/// PropertyFollower - represents an individual dimension of a separated property
pub struct PropertyFollower {
    pub base: PropertyBase,
    pub dimension_index: usize,
    pub leader_reference: String, // Reference to the leader property
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SeparationDimension {
    X = 0,
    Y = 1, 
    Z = 2,
    W = 3, // For RGBA color values
}

impl PropertySeparation {
    pub fn new(dimensions: usize) -> Self {
        Self {
            leader: None,
            followers: Vec::new(),
            dimensions,
            is_separated: false,
        }
    }
    
    /// Create a separation system for a 2D property (like 2D Position, Scale)
    pub fn new_2d() -> Self {
        Self::new(2)
    }
    
    /// Create a separation system for a 3D property (like 3D Position, Rotation)
    pub fn new_3d() -> Self {
        Self::new(3)
    }
    
    /// Create a separation system for a 4D property (like Color RGBA)
    pub fn new_4d() -> Self {
        Self::new(4)
    }
    
    /// Separate the property into individual dimension components
    pub fn separate_dimensions(&mut self, leader_property: PropertyBase) -> Result<(), String> {
        if self.is_separated {
            return Err("Property is already separated".to_string());
        }
        
        // Validate that the property can be separated
        if !self.can_separate_property(&leader_property) {
            return Err("Property cannot be separated".to_string());
        }
        
        // Create follower properties for each dimension
        for i in 0..self.dimensions {
            let follower = self.create_follower_property(i, &leader_property.get_api_object().object_type)?;
            self.followers.push(follower);
        }
        
        self.leader = Some(leader_property);
        self.is_separated = true;
        
        Ok(())
    }
    
    /// Rejoin separated dimensions back into a single property
    pub fn rejoin_dimensions(&mut self) -> Result<PropertyBase, String> {
        if !self.is_separated {
            return Err("Property is not currently separated".to_string());
        }
        
        let leader = self.leader.take().ok_or("No leader property found")?;
        self.followers.clear();
        self.is_separated = false;
        
        Ok(leader)
    }
    
    /// Check if a property can be separated based on its type and dimensions
    fn can_separate_property(&self, property: &PropertyBase) -> bool {
        // Properties that can be separated must be multidimensional
        // This includes Position, Scale, Anchor Point, etc.
        
        // Check property context and type
        match &property.get_api_object().object_type {
            ObjectContext::Property(prop_name) => {
                match prop_name.as_str() {
                    "position" | "anchorPoint" | "scale" => true,
                    "rotation" => self.dimensions == 3, // Only 3D rotation can be separated
                    "color" => self.dimensions == 4,    // RGBA color separation
                    _ => false,
                }
            }
            _ => false,
        }
    }
    
    /// Create a follower property for a specific dimension
    fn create_follower_property(&self, dimension_index: usize, parent_context: &ObjectContext) -> Result<PropertyFollower, String> {
        if dimension_index >= self.dimensions {
            return Err(format!("Dimension index {} exceeds property dimensions {}", dimension_index, self.dimensions));
        }
        
        // Create dimension-specific context
        let dimension_name = self.get_dimension_name(dimension_index);
        let follower_context = match parent_context {
            ObjectContext::Property(prop_name) => {
                ObjectContext::Property(format!("{} {}", prop_name, dimension_name))
            }
            _ => ObjectContext::Property(format!("Dimension {}", dimension_name)),
        };
        
        let mut follower_base = PropertyBase::new(follower_context, PropertyType::Property);
        
        // Add dimension-specific properties and methods
        self.initialize_follower_properties(&mut follower_base, dimension_index);
        
        Ok(PropertyFollower {
            base: follower_base,
            dimension_index,
            leader_reference: format!("Leader property dimension {}", dimension_index),
        })
    }
    
    /// Get the name for a specific dimension
    fn get_dimension_name(&self, dimension_index: usize) -> &'static str {
        match dimension_index {
            0 => match self.dimensions {
                2 | 3 => "X Position", // X for spatial properties
                4 => "Red",            // R for color properties
                _ => "Dimension 0",
            },
            1 => match self.dimensions {
                2 | 3 => "Y Position", // Y for spatial properties
                4 => "Green",          // G for color properties  
                _ => "Dimension 1",
            },
            2 => match self.dimensions {
                3 => "Z Position",     // Z for 3D spatial properties
                4 => "Blue",           // B for color properties
                _ => "Dimension 2",
            },
            3 => match self.dimensions {
                4 => "Alpha",          // A for color properties
                _ => "Dimension 3",
            },
            _ => "Unknown Dimension",
        }
    }
    
    /// Initialize properties specific to follower dimensions
    fn initialize_follower_properties(&self, follower: &mut PropertyBase, dimension_index: usize) {
        // Follower properties inherit most behavior from Property but with dimension-specific constraints
        
        // Dimension identification
        follower.api_object.properties.insert("separationDimension".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some((self.dimensions - 1) as f64),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Reference to separation leader
        follower.api_object.properties.insert("separationLeader".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Property".to_string()),
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
        
        // Separation status
        follower.api_object.properties.insert("isSeparationFollower".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: Some(vec!["true".to_string()]), // Always true for followers
            custom_validator: None,
        });
        
        // Single-dimension value (followers are always 1D)
        follower.api_object.properties.insert("value".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false, // Followers themselves are not separable
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Follower-specific methods
        follower.api_object.methods.insert("getSeparationLeader".to_string(), MethodValidation::new(0));
        follower.api_object.methods.insert("rejoinDimensions".to_string(), MethodValidation::new(0));
    }
    
    /// Get a specific follower by dimension index
    pub fn get_follower(&self, dimension_index: usize) -> Option<&PropertyFollower> {
        self.followers.get(dimension_index)
    }
    
    /// Get a mutable reference to a specific follower by dimension index
    pub fn get_follower_mut(&mut self, dimension_index: usize) -> Option<&mut PropertyFollower> {
        self.followers.get_mut(dimension_index)
    }
    
    /// Get all followers
    pub fn get_all_followers(&self) -> &[PropertyFollower] {
        &self.followers
    }
    
    /// Check if the property system is currently separated
    pub fn is_separated(&self) -> bool {
        self.is_separated
    }
    
    /// Get the number of dimensions
    pub fn dimension_count(&self) -> usize {
        self.dimensions
    }
}

impl PropertyFollower {
    /// Get the dimension index this follower represents
    pub fn get_dimension_index(&self) -> usize {
        self.dimension_index
    }
    
    /// Get the dimension name
    pub fn get_dimension_name(&self) -> SeparationDimension {
        match self.dimension_index {
            0 => SeparationDimension::X,
            1 => SeparationDimension::Y,
            2 => SeparationDimension::Z,
            3 => SeparationDimension::W,
            _ => SeparationDimension::X, // Default fallback
        }
    }
    
    /// Access to the underlying PropertyBase
    pub fn get_base(&self) -> &PropertyBase {
        &self.base
    }
    
    /// Mutable access to the underlying PropertyBase
    pub fn get_base_mut(&mut self) -> &mut PropertyBase {
        &mut self.base
    }
}

impl SeparationDimension {
    pub fn to_string(&self) -> &'static str {
        match self {
            SeparationDimension::X => "X",
            SeparationDimension::Y => "Y", 
            SeparationDimension::Z => "Z",
            SeparationDimension::W => "W",
        }
    }
    
    pub fn to_index(&self) -> usize {
        *self as usize
    }
}

/// Factory functions for common property separation scenarios
pub mod separation_factory {
    use super::*;
    
    /// Create a separation system for Position properties
    pub fn create_position_separation(is_3d: bool) -> PropertySeparation {
        if is_3d {
            PropertySeparation::new_3d()
        } else {
            PropertySeparation::new_2d()
        }
    }
    
    /// Create a separation system for Scale properties
    pub fn create_scale_separation(is_3d: bool) -> PropertySeparation {
        if is_3d {
            PropertySeparation::new_3d()
        } else {
            PropertySeparation::new_2d()
        }
    }
    
    /// Create a separation system for Rotation properties (3D only)
    pub fn create_rotation_separation() -> PropertySeparation {
        PropertySeparation::new_3d()
    }
    
    /// Create a separation system for Color properties (RGBA)
    pub fn create_color_separation() -> PropertySeparation {
        PropertySeparation::new_4d()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_property_separation_creation() {
        let separation = PropertySeparation::new_3d();
        assert_eq!(separation.dimension_count(), 3);
        assert!(!separation.is_separated());
    }
    
    #[test]
    fn test_dimension_names() {
        let separation = PropertySeparation::new_3d();
        assert_eq!(separation.get_dimension_name(0), "X Position");
        assert_eq!(separation.get_dimension_name(1), "Y Position");
        assert_eq!(separation.get_dimension_name(2), "Z Position");
    }
    
    #[test]
    fn test_separation_dimension_enum() {
        assert_eq!(SeparationDimension::X.to_index(), 0);
        assert_eq!(SeparationDimension::Y.to_index(), 1);
        assert_eq!(SeparationDimension::Z.to_index(), 2);
        assert_eq!(SeparationDimension::W.to_index(), 3);
    }
}