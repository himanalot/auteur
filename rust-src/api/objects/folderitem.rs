use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::item::{Item, ItemType};

/// FolderItem object - represents a folder in the Project panel
/// Inherits from Item
pub struct FolderItem {
    pub base: Item,
}

impl FolderItem {
    pub fn new() -> Self {
        let mut folder_item = Self {
            base: Item::new(ItemType::Folder),
        };
        
        folder_item.initialize_folder_methods();
        folder_item.initialize_folder_properties();
        folder_item
    }
    
    fn initialize_folder_methods(&mut self) {
        // FolderItem-specific methods (in addition to Item methods)
        
        // Item access methods
        self.base.api_object.methods.insert("item".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // subIndex (1-based)
        ]));
        
        // Folder organization methods (implied from documentation)
        self.base.api_object.methods.insert("addItem".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Item".to_string())  // item to add to folder
        ]));
        
        self.base.api_object.methods.insert("removeItem".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Item".to_string())  // item to remove from folder
        ]));
        
        // Content management
        self.base.api_object.methods.insert("createFolder".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // folder name
        ]));
        
        // Hierarchy navigation
        self.base.api_object.methods.insert("getParentFolder".to_string(), MethodValidation::new(0));
        
        // Search and filtering
        self.base.api_object.methods.insert("findItemByName".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // item name
        ]));
        
        self.base.api_object.methods.insert("findItemsByType".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // item type ("CompItem", "FootageItem", "FolderItem")
        ]));
        
        // Folder operations
        self.base.api_object.methods.insert("isEmpty".to_string(), MethodValidation::new(0));
        
        self.base.api_object.methods.insert("expandInProject".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("collapseInProject".to_string(), MethodValidation::new(0));
        
        // Batch operations
        self.base.api_object.methods.insert("selectAllItems".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("deselectAllItems".to_string(), MethodValidation::new(0));
        
        // Import operations specific to folders
        self.base.api_object.methods.insert("importFile".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // file to import into this folder
        ]));
        
        self.base.api_object.methods.insert("importFiles".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string())  // array of files to import
        ]));
        
        // Project organization
        self.base.api_object.methods.insert("moveAllItemsToRoot".to_string(), MethodValidation::new(0));
        
        // Team project methods for folders
        self.base.api_object.methods.insert("requestFolderAccess".to_string(), MethodValidation::new(0));
        self.base.api_object.methods.insert("releaseFolderAccess".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_folder_properties(&mut self) {
        // FolderItem-specific properties (in addition to Item properties)
        
        // Core folder properties
        self.base.api_object.properties.insert("items".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("ItemCollection".to_string()),
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
        
        self.base.api_object.properties.insert("numItems".to_string(), ValidationRule {
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
        
        // Folder state properties
        self.base.api_object.properties.insert("isExpanded".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("isRoot".to_string(), ValidationRule {
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
        
        // Content summary properties
        self.base.api_object.properties.insert("numCompositions".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("numFootageItems".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("numSubfolders".to_string(), ValidationRule {
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
        
        // Hierarchy properties
        self.base.api_object.properties.insert("parentFolder".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FolderItem".to_string()),
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
        
        self.base.api_object.properties.insert("depth".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0), // Reasonable max depth limit
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Project organization properties
        self.base.api_object.properties.insert("path".to_string(), ValidationRule {
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
        
        // Folder color and organization (Project panel features)
        self.base.api_object.properties.insert("folderColor".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(15.0), // Adobe's color label indices (0-15)
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
            ]),
            custom_validator: None,
        });
        
        // Search and filter properties
        self.base.api_object.properties.insert("hasSubfolders".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("hasMissingFootage".to_string(), ValidationRule {
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
        
        // Team project properties for folders
        self.base.api_object.properties.insert("isFolderAccessLocked".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("folderAccessOwner".to_string(), ValidationRule {
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
        
        // Project management features
        self.base.api_object.properties.insert("totalSize".to_string(), ValidationRule {
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
        
        self.base.api_object.properties.insert("isSelected".to_string(), ValidationRule {
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
    
    /// Access to the underlying Item
    pub fn get_base(&self) -> &Item {
        &self.base
    }
    
    /// Mutable access to the underlying Item
    pub fn get_base_mut(&mut self) -> &mut Item {
        &mut self.base
    }
    
    /// Get the number of items in this folder
    pub fn get_num_items(&self) -> usize {
        // This would be determined by the actual item collection
        // For now, return a default
        0
    }
    
    /// Check if this folder is empty
    pub fn is_empty(&self) -> bool {
        self.get_num_items() == 0
    }
    
    /// Check if this is the root folder
    pub fn is_root_folder(&self) -> bool {
        // This would be determined by checking if parentFolder is null
        // For now, return false as default
        false
    }
    
    /// Get the depth of this folder in the hierarchy
    pub fn get_folder_depth(&self) -> usize {
        // This would be calculated by traversing up the parent hierarchy
        // For now, return 0 as default
        0
    }
    
    /// Check if this folder has subfolders
    pub fn has_subfolders(&self) -> bool {
        // This would be determined by checking if any items are FolderItems
        // For now, return false as default
        false
    }
    
    /// Check if this folder contains missing footage
    pub fn contains_missing_footage(&self) -> bool {
        // This would be determined by checking all items recursively
        // For now, return false as default
        false
    }
    
    /// Get the total size of all items in this folder
    pub fn calculate_total_size(&self) -> f64 {
        // This would sum up the sizes of all contained items
        // For now, return 0.0 as default
        0.0
    }
}

/// Factory functions for creating FolderItems
pub mod folderitem_factory {
    use super::*;
    
    /// Create a standard folder
    pub fn create_folder() -> FolderItem {
        FolderItem::new()
    }
    
    /// Create a root folder (top-level project folder)
    pub fn create_root_folder() -> FolderItem {
        let mut folder = FolderItem::new();
        // Additional root folder setup would go here
        folder
    }
    
    /// Create a colored folder with specific organization
    pub fn create_colored_folder(color_index: u8) -> FolderItem {
        let mut folder = FolderItem::new();
        // Color setup would go here
        folder
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_folderitem_creation() {
        let folder = FolderItem::new();
        assert_eq!(folder.get_num_items(), 0);
        assert!(folder.is_empty());
        assert!(!folder.is_root_folder());
        assert_eq!(folder.get_folder_depth(), 0);
    }
    
    #[test]
    fn test_folderitem_inheritance() {
        let folder = FolderItem::new();
        // Should inherit from Item
        assert_eq!(*folder.get_base().get_item_type(), super::super::item::ItemType::Folder);
    }
    
    #[test]
    fn test_folderitem_hierarchy() {
        let folder = FolderItem::new();
        assert!(!folder.has_subfolders());
        assert!(!folder.contains_missing_footage());
        assert_eq!(folder.calculate_total_size(), 0.0);
    }
}