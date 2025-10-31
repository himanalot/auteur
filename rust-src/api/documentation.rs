use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use super::types::{DocumentationInfo, VersionInfo, ExampleInfo, ParameterInfo};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiDocumentation {
    pub objects: HashMap<String, ObjectDocumentation>,
    pub global_functions: HashMap<String, FunctionDocumentation>,
    pub effects: HashMap<String, EffectDocumentation>,
    pub enums: HashMap<String, Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectDocumentation {
    pub name: String,
    pub description: String,
    pub properties: HashMap<String, PropertyDocumentation>,
    pub methods: HashMap<String, MethodDocumentation>,
    pub parent: Option<String>,
    pub file_reference: String,
    pub examples: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyDocumentation {
    pub name: String,
    pub description: String,
    pub property_type: String,
    pub read_only: bool,
    pub version_info: VersionInfo,
    pub example_usage: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MethodDocumentation {
    pub name: String,
    pub description: String,
    pub parameters: Vec<ParameterInfo>,
    pub return_type: String,
    pub version_info: VersionInfo,
    pub example_usage: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionDocumentation {
    pub name: String,
    pub description: String,
    pub parameters: Vec<ParameterInfo>,
    pub return_type: String,
    pub example_usage: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectDocumentation {
    pub name: String,
    pub match_name: String,
    pub category: String,
    pub description: String,
    pub properties: HashMap<String, PropertyDocumentation>,
}

impl ApiDocumentation {
    pub fn new() -> Self {
        ApiDocumentation {
            objects: HashMap::new(),
            global_functions: HashMap::new(),
            effects: HashMap::new(),
            enums: HashMap::new(),
        }
    }

    pub fn get_object_documentation(&self, object_name: &str, member_name: &str, member_type: &str) -> Option<DocumentationInfo> {
        let object = self.objects.get(object_name)?;
        
        match member_type {
            "method" => {
                let method = object.methods.get(member_name)?;
                Some(DocumentationInfo {
                    description: method.description.clone(),
                    version_info: method.version_info.clone(),
                    examples: vec![ExampleInfo {
                        code: method.example_usage.clone(),
                        description: None,
                    }],
                    file_reference: Some(object.file_reference.clone()),
                })
            }
            "property" => {
                let property = object.properties.get(member_name)?;
                Some(DocumentationInfo {
                    description: property.description.clone(),
                    version_info: property.version_info.clone(),
                    examples: property.example_usage.as_ref().map_or_else(Vec::new, |example| {
                        vec![ExampleInfo {
                            code: example.clone(),
                            description: None,
                        }]
                    }),
                    file_reference: Some(object.file_reference.clone()),
                })
            }
            _ => None,
        }
    }

    pub fn get_function_documentation(&self, function_name: &str) -> Option<DocumentationInfo> {
        let function = self.global_functions.get(function_name)?;
        Some(DocumentationInfo {
            description: function.description.clone(),
            version_info: VersionInfo {
                since_version: None,
                deprecated: None,
            },
            examples: vec![ExampleInfo {
                code: function.example_usage.clone(),
                description: None,
            }],
            file_reference: None,
        })
    }

    pub fn get_effect_documentation(&self, effect_name: &str) -> Option<DocumentationInfo> {
        let effect = self.effects.get(effect_name)?;
        Some(DocumentationInfo {
            description: effect.description.clone(),
            version_info: VersionInfo {
                since_version: None,
                deprecated: None,
            },
            examples: Vec::new(),
            file_reference: None,
        })
    }
} 