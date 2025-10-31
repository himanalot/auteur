use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

/// Preferences object for managing After Effects preferences
pub struct Preferences {
    api_object: ApiObject,
}

impl Preferences {
    pub fn new() -> Self {
        let mut preferences = Self {
            api_object: ApiObject::new(ObjectContext::Custom("Preferences".to_string())),
        };
        
        preferences.initialize_methods();
        preferences
    }
    
    fn initialize_methods(&mut self) {
        // Delete preference
        self.api_object.methods.insert("deletePref".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText   // keyName
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        // Get preferences as different types
        self.api_object.methods.insert("getPrefAsBool".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText   // keyName
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        self.api_object.methods.insert("getPrefAsFloat".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText   // keyName
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        self.api_object.methods.insert("getPrefAsLong".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText   // keyName
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        self.api_object.methods.insert("getPrefAsString".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText   // keyName
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        // Check if preference exists
        self.api_object.methods.insert("havePref".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText   // keyName
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        // Reload preferences
        self.api_object.methods.insert("reload".to_string(), MethodValidation::new(0));
        
        // Save current preferences
        self.api_object.methods.insert("savePrefAsBool".to_string(), 
            MethodValidation::new(3).with_param_types(vec![
                PropertyValueType::ArbText,                        // sectionName
                PropertyValueType::ArbText,                        // keyName
                PropertyValueType::Custom("Boolean".to_string())   // value
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        self.api_object.methods.insert("savePrefAsFloat".to_string(), 
            MethodValidation::new(3).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText,  // keyName
                PropertyValueType::OneD      // value
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        self.api_object.methods.insert("savePrefAsLong".to_string(), 
            MethodValidation::new(3).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText,  // keyName
                PropertyValueType::OneD      // value
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        self.api_object.methods.insert("savePrefAsString".to_string(), 
            MethodValidation::new(3).with_param_types(vec![
                PropertyValueType::ArbText,  // sectionName
                PropertyValueType::ArbText,  // keyName
                PropertyValueType::ArbText   // value
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("PREFType".to_string())  // prefType
            ]));
            
        // Save all preferences to disk
        self.api_object.methods.insert("saveToDisk".to_string(), MethodValidation::new(0));
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}