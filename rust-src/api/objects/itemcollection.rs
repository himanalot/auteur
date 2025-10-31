use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

/// ItemCollection object - represents a collection of items in the Project panel
/// Inherits from Collection
pub struct ItemCollection {
    pub api_object: ApiObject,
    pub collection_type: ItemCollectionType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ItemCollectionType {
    ProjectItems,   // App.project.items (all project items)
    FolderItems,    // FolderItem.items (items in a specific folder)
}

impl ItemCollection {
    pub fn new(collection_type: ItemCollectionType) -> Self {
        let mut item_collection = Self {
            api_object: ApiObject::new(ObjectContext::ItemCollection),
            collection_type,
        };
        
        item_collection.initialize_collection_methods();
        item_collection.initialize_collection_properties();
        item_collection
    }
    
    fn initialize_collection_methods(&mut self) {
        // Collection base methods (inherited from Collection)
        
        // Array-like access methods
        self.api_object.methods.insert("[]".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // index (1-based)
        ]));
        
        // ItemCollection-specific methods
        
        // Creation methods
        self.api_object.methods.insert("addComp".to_string(), MethodValidation::new(6).with_param_types(vec![
            PropertyValueType::ArbText,  // name
            PropertyValueType::OneD,     // width (4-30000)
            PropertyValueType::OneD,     // height (4-30000)
            PropertyValueType::OneD,     // pixelAspect (0.01-100.0)
            PropertyValueType::OneD,     // duration (0.0-10800.0)
            PropertyValueType::OneD      // frameRate (1.0-99.0)
        ]));
        
        self.api_object.methods.insert("addFolder".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // name
        ]));
        
        // Import methods
        self.api_object.methods.insert("addFootage".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // ExtendScript File object
        ]));
        
        self.api_object.methods.insert("addSolid".to_string(), MethodValidation::new(5).with_param_types(vec![
            PropertyValueType::Color,    // color [R,G,B] in range [0.0..1.0]
            PropertyValueType::ArbText,  // name
            PropertyValueType::OneD,     // width (4-30000)
            PropertyValueType::OneD,     // height (4-30000)
            PropertyValueType::OneD      // pixelAspect (0.01-100.0)
        ]));
        
        self.api_object.methods.insert("addPlaceholder".to_string(), MethodValidation::new(5).with_param_types(vec![
            PropertyValueType::ArbText,  // name
            PropertyValueType::OneD,     // width (4-30000)
            PropertyValueType::OneD,     // height (4-30000)
            PropertyValueType::OneD,     // frameRate (1.0-99.0)
            PropertyValueType::OneD      // duration (0.0-10800.0)
        ]));
        
        // Batch import methods
        self.api_object.methods.insert("importFiles".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string())  // array of File objects
        ]));
        
        self.api_object.methods.insert("importSequence".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("File".to_string()),    // first file in sequence
            PropertyValueType::Custom("Boolean".to_string())  // forceAlphabetical
        ]));
        
        // Organization methods
        self.api_object.methods.insert("moveToFolder".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Item".to_string()),       // item to move
            PropertyValueType::Custom("FolderItem".to_string())  // destination folder
        ]));
        
        self.api_object.methods.insert("organizeByType".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("createFolderStructure".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string())  // array of folder names
        ]));
        
        // Search and filtering methods
        self.api_object.methods.insert("findByName".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // item name
        ]));
        
        self.api_object.methods.insert("findByType".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // item type ("CompItem", "FootageItem", "FolderItem")
        ]));
        
        self.api_object.methods.insert("filterByUsage".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())  // showUnused
        ]));
        
        self.api_object.methods.insert("filterByLabel".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // label color index
        ]));
        
        // Collection manipulation methods
        self.api_object.methods.insert("selectAll".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("selectNone".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("selectByType".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // item type
        ]));
        
        self.api_object.methods.insert("invertSelection".to_string(), MethodValidation::new(0));
        
        // Batch operations
        self.api_object.methods.insert("removeSelected".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("removeUnused".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("duplicateSelected".to_string(), MethodValidation::new(0));
        
        // Project maintenance
        self.api_object.methods.insert("consolidateFootage".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("reloadFootage".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("reduceProject".to_string(), MethodValidation::new(0));
        
        // Statistics and analysis
        self.api_object.methods.insert("getUsageStatistics".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("calculateTotalSize".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("findMissingFootage".to_string(), MethodValidation::new(0));
        
        // Export and sharing
        self.api_object.methods.insert("collectFiles".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // destination folder
        ]));
        
        self.api_object.methods.insert("exportProjectFile".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // output file
        ]));
        
        // Team project methods for collections
        self.api_object.methods.insert("requestAccessToAll".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("releaseAccessToAll".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_collection_properties(&mut self) {
        // Collection base properties
        
        // Core collection property
        self.api_object.properties.insert("length".to_string(), ValidationRule {
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
        
        // ItemCollection-specific properties
        
        // Content summary properties
        self.api_object.properties.insert("numCompositions".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("numFootageItems".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("numFolders".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("numSolids".to_string(), ValidationRule {
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
        
        // Selection properties
        self.api_object.properties.insert("selectedItems".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("numSelectedItems".to_string(), ValidationRule {
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
        
        // Filtering and view properties
        self.api_object.properties.insert("showUnusedItems".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("currentFilter".to_string(), ValidationRule {
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
        
        // Project management properties
        self.api_object.properties.insert("totalProjectSize".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("numMissingFootage".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("hasUnusedItems".to_string(), ValidationRule {
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
        
        // Collection state properties
        self.api_object.properties.insert("isReadOnly".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("parentFolder".to_string(), ValidationRule {
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
        
        // Import statistics
        self.api_object.properties.insert("lastImportCount".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("lastImportErrors".to_string(), ValidationRule {
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
        
        // Performance and optimization
        self.api_object.properties.insert("indexingComplete".to_string(), ValidationRule {
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
        
        // Team project properties for collections
        self.api_object.properties.insert("hasLockedItems".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("numLockedItems".to_string(), ValidationRule {
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
    
    /// Get the collection type
    pub fn get_collection_type(&self) -> &ItemCollectionType {
        &self.collection_type
    }
    
    /// Get the number of items in this collection
    pub fn get_length(&self) -> usize {
        // This would be determined by the actual collection content
        // For now, return a default
        0
    }
    
    /// Check if this collection is empty
    pub fn is_empty(&self) -> bool {
        self.get_length() == 0
    }
    
    /// Get the number of compositions in this collection
    pub fn get_num_compositions(&self) -> usize {
        // This would count CompItem objects in the collection
        // For now, return 0 as default
        0
    }
    
    /// Get the number of footage items in this collection
    pub fn get_num_footage_items(&self) -> usize {
        // This would count FootageItem objects in the collection
        // For now, return 0 as default
        0
    }
    
    /// Get the number of folders in this collection
    pub fn get_num_folders(&self) -> usize {
        // This would count FolderItem objects in the collection
        // For now, return 0 as default
        0
    }
    
    /// Check if there are unused items in this collection
    pub fn has_unused_items(&self) -> bool {
        // This would check if any items have empty usedIn arrays
        // For now, return false as default
        false
    }
    
    /// Get the number of missing footage items
    pub fn get_num_missing_footage(&self) -> usize {
        // This would count items where footageMissing is true
        // For now, return 0 as default
        0
    }
    
    /// Calculate the total project size
    pub fn calculate_total_size(&self) -> f64 {
        // This would sum up the sizes of all footage items
        // For now, return 0.0 as default
        0.0
    }
    
    /// Check if the collection is read-only
    pub fn is_read_only(&self) -> bool {
        // This would depend on project state and permissions
        // For now, return false as default
        false
    }
}

impl ItemCollectionType {
    pub fn to_string(&self) -> String {
        match self {
            ItemCollectionType::ProjectItems => "ProjectItems".to_string(),
            ItemCollectionType::FolderItems => "FolderItems".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ItemCollectionType> {
        match value {
            "ProjectItems" => Some(ItemCollectionType::ProjectItems),
            "FolderItems" => Some(ItemCollectionType::FolderItems),
            _ => None,
        }
    }
}

/// Factory functions for creating different types of ItemCollections
pub mod itemcollection_factory {
    use super::*;
    
    /// Create a project-level item collection
    pub fn create_project_items() -> ItemCollection {
        ItemCollection::new(ItemCollectionType::ProjectItems)
    }
    
    /// Create a folder-level item collection
    pub fn create_folder_items() -> ItemCollection {
        ItemCollection::new(ItemCollectionType::FolderItems)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_itemcollection_creation() {
        let items = ItemCollection::new(ItemCollectionType::ProjectItems);
        assert_eq!(*items.get_collection_type(), ItemCollectionType::ProjectItems);
        assert_eq!(items.get_length(), 0);
        assert!(items.is_empty());
    }
    
    #[test]
    fn test_itemcollection_content_counting() {
        let items = ItemCollection::new(ItemCollectionType::ProjectItems);
        assert_eq!(items.get_num_compositions(), 0);
        assert_eq!(items.get_num_footage_items(), 0);
        assert_eq!(items.get_num_folders(), 0);
        assert!(!items.has_unused_items());
    }
    
    #[test]
    fn test_itemcollection_analysis() {
        let items = ItemCollection::new(ItemCollectionType::ProjectItems);
        assert_eq!(items.get_num_missing_footage(), 0);
        assert_eq!(items.calculate_total_size(), 0.0);
        assert!(!items.is_read_only());
    }
    
    #[test]
    fn test_itemcollection_type_conversion() {
        assert_eq!(ItemCollectionType::ProjectItems.to_string(), "ProjectItems");
        assert_eq!(ItemCollectionType::from_string("FolderItems"), Some(ItemCollectionType::FolderItems));
        assert_eq!(ItemCollectionType::from_string("Invalid"), None);
    }
}