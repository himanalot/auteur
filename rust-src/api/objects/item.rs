use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

/// Item object - base class for all items that can appear in the Project panel
/// Base class for AVItem and FolderItem 
pub struct Item {
    pub api_object: ApiObject,
    pub item_type: ItemType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ItemType {
    Composition,
    Footage,
    Folder,
    Solid,
    Placeholder,
    Proxy,
}

#[derive(Debug, Clone)]
pub struct Guide {
    pub orientation_type: GuideOrientation,
    pub position: f64,
    pub index: usize,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum GuideOrientation {
    Horizontal = 0,
    Vertical = 1,
}

impl Item {
    pub fn new(item_type: ItemType) -> Self {
        let mut item = Self {
            api_object: ApiObject::new(ObjectContext::Item),
            item_type,
        };
        
        item.initialize_methods();
        item.initialize_properties();
        item
    }
    
    fn initialize_methods(&mut self) {
        // Core Item methods
        
        // remove() - Deletes this item from the project
        self.api_object.methods.insert("remove".to_string(), MethodValidation::new(0));
        
        // Guide management methods (After Effects 16.1+)
        self.api_object.methods.insert("addGuide".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // orientationType (0=horizontal, 1=vertical)
            PropertyValueType::OneD   // position (X or Y coordinate in pixels)
        ]));
        
        self.api_object.methods.insert("removeGuide".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD   // guideIndex
        ]));
        
        self.api_object.methods.insert("setGuide".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // position (new X or Y coordinate)
            PropertyValueType::OneD   // guideIndex
        ]));
        
        // Project organization methods
        self.api_object.methods.insert("moveTo".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("FolderItem".to_string())  // destination folder
        ]));
        
        // Duplicate and copy methods
        self.api_object.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        
        // Advanced item operations
        self.api_object.methods.insert("copyToClipboard".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("exportAsAME".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // preset path
        ]));
        
        // Team project methods (After Effects 2020+)
        self.api_object.methods.insert("shareItem".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("lockItem".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("unlockItem".to_string(), MethodValidation::new(0));
        
        // Metadata and properties
        self.api_object.methods.insert("setMetadata".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,  // key
            PropertyValueType::ArbText   // value
        ]));
        self.api_object.methods.insert("getMetadata".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText   // key
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Core Item properties
        
        // comment - User comment for the item (up to 15,999 bytes)
        self.api_object.properties.insert("comment".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: Some(Box::new(|value| {
                if let Some(text) = value.as_str() {
                    if text.len() > 15999 {
                        return Err("Comment cannot exceed 15,999 characters".to_string());
                    }
                }
                Ok(())
            })),
        });
        
        // dynamicLinkGUID - Unique persistent identification for dynamic link
        self.api_object.properties.insert("dynamicLinkGUID".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: Some(Box::new(|value| {
                if let Some(guid) = value.as_str() {
                    // Validate GUID format: 00000000-0000-0000-0000-000000000000
                    let guid_pattern = regex::Regex::new(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$").unwrap();
                    if !guid_pattern.is_match(guid) {
                        return Err("Invalid GUID format".to_string());
                    }
                }
                Ok(())
            })),
        });
        
        // guides - Array of guide objects (After Effects 16.1+)
        self.api_object.properties.insert("guides".to_string(), ValidationRule {
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
        
        // id - Unique persistent identification number
        self.api_object.properties.insert("id".to_string(), ValidationRule {
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
        
        // label - Label color (0 for None, 1-16 for preset colors)
        self.api_object.properties.insert("label".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(16.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some((0..=16).map(|i| i.to_string()).collect()),
            custom_validator: None,
        });
        
        // name - Name as displayed in Project panel
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
        
        // parentFolder - FolderItem that contains this item
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
        
        // selected - Whether the item is selected
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
        
        // typeName - User-readable name for item type (locale-dependent)
        self.api_object.properties.insert("typeName".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                // English names
                "Composition".to_string(), "Folder".to_string(), "Footage".to_string(),
                // German names
                "Komposition".to_string(), "Ordner".to_string(),
                // Spanish names  
                "Composición".to_string(), "Carpeta".to_string(), "Material de archivo".to_string(),
                // French names
                "Dossier".to_string(), "Métrage".to_string(),
                // Italian names
                "Composizione".to_string(), "Cartella".to_string(), "Metraggio".to_string(),
                // Japanese names
                "コンポジション".to_string(), "フォルダー".to_string(), "フッテージ".to_string(),
                // Korean names
                "컴포지션".to_string(), "폴더".to_string(), "푸티지".to_string(),
                // Portuguese names
                "Composição".to_string(), "Pasta".to_string(), "Gravação".to_string(),
                // Russian names
                "Композиция".to_string(), "Папка".to_string(), "Видеоряд".to_string(),
                // Chinese names
                "合成".to_string(), "文件夹".to_string(), "素材".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Team project properties (After Effects 2020+)
        self.api_object.properties.insert("isShared".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("isLocked".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("lockedBy".to_string(), ValidationRule {
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
        
        // Creation and modification times
        self.api_object.properties.insert("creationTime".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Date".to_string()),
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
            value_type: PropertyValueType::Custom("Date".to_string()),
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
    
    pub fn get_item_type(&self) -> &ItemType {
        &self.item_type
    }
}

impl ItemType {
    pub fn to_string(&self) -> String {
        match self {
            ItemType::Composition => "Composition".to_string(),
            ItemType::Footage => "Footage".to_string(),
            ItemType::Folder => "Folder".to_string(),
            ItemType::Solid => "Solid".to_string(),
            ItemType::Placeholder => "Placeholder".to_string(),
            ItemType::Proxy => "Proxy".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ItemType> {
        match value {
            "Composition" | "Komposition" | "Composición" | "Composizione" | "コンポジション" | "컴포지션" | "Composição" | "Композиция" | "合成" => Some(ItemType::Composition),
            "Footage" | "Material de archivo" | "Métrage" | "Metraggio" | "フッテージ" | "푸티지" | "Gravação" | "Видеоряд" | "素材" => Some(ItemType::Footage),
            "Folder" | "Ordner" | "Carpeta" | "Dossier" | "Cartella" | "フォルダー" | "폴더" | "Pasta" | "Папка" | "文件夹" => Some(ItemType::Folder),
            "Solid" => Some(ItemType::Solid),
            "Placeholder" => Some(ItemType::Placeholder),
            "Proxy" => Some(ItemType::Proxy),
            _ => None,
        }
    }
}

impl Guide {
    pub fn new(orientation_type: GuideOrientation, position: f64, index: usize) -> Self {
        Self {
            orientation_type,
            position,
            index,
        }
    }
    
    pub fn is_horizontal(&self) -> bool {
        self.orientation_type == GuideOrientation::Horizontal
    }
    
    pub fn is_vertical(&self) -> bool {
        self.orientation_type == GuideOrientation::Vertical
    }
}

impl GuideOrientation {
    pub fn from_int(value: i32) -> Self {
        match value {
            1 => GuideOrientation::Vertical,
            _ => GuideOrientation::Horizontal, // Default to horizontal for any other value
        }
    }
    
    pub fn to_int(&self) -> i32 {
        *self as i32
    }
}

/// Factory functions for creating different types of Items
pub mod item_factory {
    use super::*;
    
    /// Create a composition item
    pub fn create_composition_item() -> Item {
        Item::new(ItemType::Composition)
    }
    
    /// Create a footage item
    pub fn create_footage_item() -> Item {
        Item::new(ItemType::Footage)
    }
    
    /// Create a folder item
    pub fn create_folder_item() -> Item {
        Item::new(ItemType::Folder)
    }
    
    /// Create a solid item
    pub fn create_solid_item() -> Item {
        Item::new(ItemType::Solid)
    }
    
    /// Create a placeholder item
    pub fn create_placeholder_item() -> Item {
        Item::new(ItemType::Placeholder)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_item_creation() {
        let item = Item::new(ItemType::Composition);
        assert_eq!(*item.get_item_type(), ItemType::Composition);
    }
    
    #[test]
    fn test_item_type_locale_support() {
        assert_eq!(ItemType::from_string("Composition"), Some(ItemType::Composition));
        assert_eq!(ItemType::from_string("Komposition"), Some(ItemType::Composition));
        assert_eq!(ItemType::from_string("コンポジション"), Some(ItemType::Composition));
        assert_eq!(ItemType::from_string("合成"), Some(ItemType::Composition));
    }
    
    #[test]
    fn test_guide_orientation() {
        assert_eq!(GuideOrientation::from_int(0), GuideOrientation::Horizontal);
        assert_eq!(GuideOrientation::from_int(1), GuideOrientation::Vertical);
        assert_eq!(GuideOrientation::from_int(99), GuideOrientation::Horizontal); // Default
    }
}